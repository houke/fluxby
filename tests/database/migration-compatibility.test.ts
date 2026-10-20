import Sqlite from 'better-sqlite3';
import type { AsyncDatabaseConnection } from '@fluxby/database';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SCHEMA_SQL } from '../../packages/database/src/schema';
import {
  migrations,
  LATEST_MIGRATION_VERSION,
} from '../../packages/database/src/migrations';
import { runMigrations } from '../../packages/database/src/migrations/runner';
import {
  exportFinancialBackup,
  restoreFinancialBackup,
  validateFinancialBackup,
} from '@/lib/data/backup';

let sqlite: Sqlite.Database;
let db: AsyncDatabaseConnection;

beforeEach(() => {
  sqlite = new Sqlite(':memory:');
  sqlite.pragma('foreign_keys = ON');
  db = {
    execAsync: async (sql) => {
      sqlite.exec(sql);
    },
    queryAsync: async <T>(sql: string, params: unknown[] = []) =>
      sqlite.prepare(sql).all(...params) as T[],
    queryOneAsync: async <T>(sql: string, params: unknown[] = []) =>
      (sqlite.prepare(sql).get(...params) as T | undefined) ?? null,
    runAsync: async (sql, params = []) => {
      const result = sqlite.prepare(sql).run(...params);
      return {
        changes: result.changes,
        lastInsertRowId: Number(result.lastInsertRowid),
      };
    },
    transactionAsync: async (work) => {
      sqlite.exec('BEGIN');
      try {
        const result = await work(db);
        sqlite.exec('COMMIT');
        return result;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
});

afterEach(() => {
  sqlite.close();
  vi.restoreAllMocks();
});

async function seedMainDatabase() {
  // The shared base schema is unchanged from origin/main. Reproduce main's
  // completed migrations through version 14 before adding populated records.
  sqlite.exec(SCHEMA_SQL);
  for (const migration of migrations.filter(({ version }) => version <= 14)) {
    await migration.up(db);
    sqlite
      .prepare('INSERT INTO schema_version(version) VALUES(?)')
      .run(migration.version);
  }
  sqlite.exec(`
    INSERT INTO devices(id,name) VALUES('device','Existing device');
    INSERT INTO users(id,name,avatar) VALUES('user','Original','existing-avatar');
    INSERT INTO profiles(id,user_id,name,is_hidden) VALUES('profile','user','Personal',0);
    INSERT INTO accounts(id,iban,name,current_balance,profile_id,updated_at,device_id)
      VALUES('account','NL00TEST','Existing account',123.45,'profile',100,'device');
    INSERT INTO categories(id,name,profile_id) VALUES('category','Household','profile');
    INSERT INTO transactions(id,date,amount,type,account_id,category_id,profile_id,notes,raw_data,import_hash,updated_at,device_id)
      VALUES('transaction','2026-10-01',-10,'expense','account','category','profile','Existing note','Existing raw data','existing-hash',100,'device');
    INSERT INTO budgets(id,amount,category_id,profile_id) VALUES('budget',100,'category','profile');
    INSERT INTO recurring_patterns(id,merchant_name,profile_id) VALUES('pattern','Merchant','profile');
    INSERT INTO subscription_dismissed_alerts(id,pattern_id,alert_type,profile_id,dismissed_at)
      VALUES('alert','pattern','stale','profile',1234);
  `);
}

describe('main database upgrade compatibility', () => {
  it('migrates a fresh installation through the latest schema with valid foreign keys', async () => {
    await runMigrations(db);
    expect(
      sqlite.prepare('SELECT MAX(version) AS version FROM schema_version').get()
    ).toEqual({ version: LATEST_MIGRATION_VERSION });
    expect(sqlite.pragma('integrity_check', { simple: true })).toBe('ok');
    expect(sqlite.pragma('foreign_key_check')).toEqual([]);
    expect(
      sqlite
        .prepare("SELECT name FROM sqlite_master WHERE name='budget_months'")
        .get()
    ).toEqual({ name: 'budget_months' });
  });

  it('preserves populated schema-14 records and restores its backup into the upgraded schema', async () => {
    await seedMainDatabase();
    const original = await exportFinancialBackup(db);
    const device = sqlite.prepare('SELECT * FROM devices').get();
    await runMigrations(db);
    const upgraded = await exportFinancialBackup(db);
    expect(upgraded.schemaVersion).toBe(LATEST_MIGRATION_VERSION);
    for (const [table, rows] of Object.entries(original.tables)) {
      expect(upgraded.tables[table]).toHaveLength(rows.length);
      rows.forEach((row, index) =>
        expect(upgraded.tables[table][index]).toMatchObject(row)
      );
    }
    expect(sqlite.prepare('SELECT * FROM devices').get()).toEqual(device);
    expect(
      sqlite
        .prepare('SELECT updated_at FROM subscription_dismissed_alerts')
        .get()
    ).toEqual({ updated_at: 1234 });
    const preview = await validateFinancialBackup(db, original);
    expect(preview.missingTables).toContain('budget_months');
    sqlite.exec(
      "UPDATE transactions SET notes='Changed'; UPDATE accounts SET current_balance=0"
    );
    await restoreFinancialBackup(db, original);
    const restored = await exportFinancialBackup(db);
    for (const [table, rows] of Object.entries(original.tables))
      rows.forEach((row, index) =>
        expect(restored.tables[table][index]).toMatchObject(row)
      );
    expect(sqlite.prepare('SELECT * FROM devices').get()).toEqual(device);
    expect(sqlite.pragma('foreign_key_check')).toEqual([]);
    await runMigrations(db);
    expect((await exportFinancialBackup(db)).tables).toEqual(restored.tables);
  });

  it('restores the actual main flat v2 export shape after upgrading to the latest schema', async () => {
    await seedMainDatabase();
    const original = await exportFinancialBackup(db);
    // These are the exact keys from origin/main's exportAll(), whose rows are
    // raw SQLite records even when the outer collection key uses camelCase.
    const legacyKeys = {
      categories: 'categories',
      accounts: 'accounts',
      transactions: 'transactions',
      budgets: 'budgets',
      categoryRules: 'category_rules',
      imports: 'imports',
      addressBook: 'address_book',
      contactIbans: 'contact_ibans',
      sharedIbans: 'shared_ibans',
      sharedIbanMerchants: 'shared_iban_merchants',
      nameCleanupRules: 'name_cleanup_rules',
      paymentProviderRules: 'payment_provider_rules',
      users: 'users',
      profiles: 'profiles',
    };
    const legacy = {
      ...Object.fromEntries(
        Object.entries(legacyKeys).map(([key, table]) => [
          key,
          original.tables[table],
        ])
      ),
      exportedAt: original.exportedAt,
      version: 2,
    };
    await runMigrations(db);
    const preview = await validateFinancialBackup(db, legacy);
    expect(preview).toMatchObject({
      legacy: true,
      profiles: 1,
      accounts: 1,
      transactions: 1,
    });
    // Main did not export subscriptions or the later planning tables. Preview
    // discloses that omission before replacement, rather than rejecting v2.
    expect(preview.missingTables).toContain('recurring_patterns');
    expect(preview.missingTables).toContain('budget_months');
    sqlite.exec(
      "UPDATE transactions SET notes='Changed'; UPDATE accounts SET current_balance=0"
    );
    await restoreFinancialBackup(db, legacy);
    const restored = await exportFinancialBackup(db);
    for (const table of Object.values(legacyKeys)) {
      expect(restored.tables[table]).toHaveLength(
        original.tables[table].length
      );
      original.tables[table].forEach((row, index) =>
        expect(restored.tables[table][index]).toMatchObject(row)
      );
    }
    expect(restored.tables.recurring_patterns).toEqual([]);
    expect(sqlite.prepare('SELECT name FROM devices').get()).toEqual({
      name: 'Existing device',
    });
    expect(sqlite.pragma('foreign_key_check')).toEqual([]);
  });

  it('rolls back all pending schema changes and records when a later upgrade migration fails', async () => {
    await seedMainDatabase();
    const original = await exportFinancialBackup(db);
    const exec = db.execAsync;
    vi.spyOn(db, 'execAsync').mockImplementation(async (sql) => {
      if (
        sql.includes('CREATE TABLE IF NOT EXISTS transaction_review_decisions')
      )
        throw new Error('Simulated upgrade failure');
      return exec(sql);
    });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(runMigrations(db)).rejects.toThrow(
      'Simulated upgrade failure'
    );
    expect((await exportFinancialBackup(db)).tables).toEqual(original.tables);
    expect(
      sqlite.prepare('SELECT MAX(version) AS version FROM schema_version').get()
    ).toEqual({ version: 14 });
    expect(
      sqlite
        .prepare("SELECT name FROM sqlite_master WHERE name='import_profiles'")
        .get()
    ).toBeUndefined();
    expect(
      sqlite.prepare('PRAGMA table_info(budgets)').all()
    ).not.toContainEqual(expect.objectContaining({ name: 'rollover_enabled' }));
    expect(sqlite.pragma('foreign_key_check')).toEqual([]);
  });
});
