import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import SQLite from 'better-sqlite3';
import { SCHEMA_SQL } from '../../packages/database/src/schema';
import { migration013 } from '../../packages/database/src/migrations/013_subscription_dismissed_alerts';
import {
  exportFinancialBackup,
  parseFinancialBackup,
  restoreFinancialBackup,
  validateFinancialBackup,
  type FinancialBackup,
} from '@/lib/data/backup';
import {
  addChecksumToBackup,
  decryptBackup,
  encryptBackup,
} from '@/lib/backup-crypto';

let sqlite: SQLite.Database;
let writes: string[];
function adapter() {
  return {
    queryAsync: async <T>(sql: string, params: unknown[] = []): Promise<T[]> =>
      sqlite.prepare(sql).all(...params) as T[],
    runAsync: async (sql: string, params: unknown[] = []) => {
      writes.push(sql);
      const result = sqlite.prepare(sql).run(...params);
      return {
        changes: result.changes,
        lastInsertRowId: Number(result.lastInsertRowid),
      };
    },
    transactionAsync: async <T>(operation: () => Promise<T>): Promise<T> => {
      sqlite.exec('BEGIN');
      try {
        const result = await operation();
        sqlite.exec('COMMIT');
        return result;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
let db: ReturnType<typeof adapter>;
function replacement(backup: FinancialBackup) {
  const next = structuredClone(backup);
  next.tables.users[0].name = 'Restored';
  return next;
}
function deletedTables() {
  return writes.filter((sql) => /^DELETE FROM/i.test(sql));
}

beforeEach(async () => {
  sqlite = new SQLite(':memory:');
  sqlite.pragma('foreign_keys = ON');
  sqlite.exec(SCHEMA_SQL);
  await migration013.up({
    execAsync: async (sql: string) => {
      sqlite.exec(sql);
    },
  } as never);
  sqlite.exec(`
    INSERT INTO schema_version(version) VALUES(14);
    INSERT INTO users(id,name) VALUES('user','Original');
    INSERT INTO profiles(id,user_id,name) VALUES('profile','user','Personal');
    INSERT INTO accounts(id,iban,name,profile_id) VALUES('account','NL00TEST','Account','profile');
    INSERT INTO categories(id,name,profile_id) VALUES('parent','Household','profile');
    INSERT INTO categories(id,name,parent_id,profile_id) VALUES('child','Bills','parent','profile');
    INSERT INTO address_book(id,iban,name,profile_id) VALUES('contact','NL01TEST','Merchant','profile');
    INSERT INTO transactions(id,date,amount,type,account_id,category_id,address_book_id,profile_id) VALUES('tx','2026-09-29',-10,'expense','account','child','contact','profile');
    INSERT INTO budgets(id,amount,category_id,profile_id) VALUES('budget',100,'child','profile');
    INSERT INTO recurring_patterns(id,merchant_name,profile_id) VALUES('pattern','Merchant','profile');
    INSERT INTO recurring_pattern_source_decisions(id,pattern_id,source_key,status,profile_id) VALUES('decision','pattern','source','accepted','profile');
    INSERT INTO subscription_dismissed_alerts(id,pattern_id,alert_type,profile_id) VALUES('alert','pattern','stale','profile');
    INSERT INTO devices(id,name) VALUES('device','This device');
  `);
  writes = [];
  db = adapter();
});
afterEach(() => sqlite.close());

describe('financial backup safety and completeness', () => {
  it('rejects an empty object before querying or writing', async () => {
    const query = vi.spyOn(db, 'queryAsync');
    await expect(restoreFinancialBackup(db, {})).rejects.toThrow('Invalid');
    expect(query).not.toHaveBeenCalled();
    expect(writes).toEqual([]);
  });

  it('round trips every financial table including decisions, dismissed alerts, tombstoned records and future feature tables', async () => {
    sqlite.exec(
      "CREATE TABLE new_feature(id TEXT PRIMARY KEY, profile_id TEXT REFERENCES profiles(id), value TEXT); INSERT INTO new_feature VALUES('feature','profile','saved'); UPDATE categories SET is_deleted=1 WHERE id='child'"
    );
    const original = await exportFinancialBackup(db);
    expect(original.tableManifest).toContain('subscription_dismissed_alerts');
    expect(original.tableManifest).toContain(
      'recurring_pattern_source_decisions'
    );
    expect(original.tables.new_feature[0].value).toBe('saved');
    expect(
      original.tables.categories.find((row) => row.id === 'child')?.is_deleted
    ).toBe(1);
    expect(original.tables).not.toHaveProperty('devices');
    sqlite.exec(
      "DELETE FROM transactions; UPDATE users SET name='Changed'; DELETE FROM new_feature"
    );
    await restoreFinancialBackup(db, original);
    const restored = await exportFinancialBackup(db);
    expect(restored.tables).toEqual(original.tables);
    expect(sqlite.prepare('SELECT name FROM devices').get()).toEqual({
      name: 'This device',
    });
  });

  it('encrypts and restores the complete exported format', async () => {
    const original = await exportFinancialBackup(db);
    const encrypted = await encryptBackup(original, 'backup-password');
    const decrypted = await decryptBackup(encrypted, 'backup-password');
    await restoreFinancialBackup(db, decrypted);
    expect((await exportFinancialBackup(db)).tables).toEqual(original.tables);
  });

  it.each([
    'unknown table',
    'incomplete manifest',
    'missing table',
    'future schema',
    'invalid row',
    'duplicate ID',
    'dangling reference',
    'cross-profile reference',
    'invalid enum',
    'invalid date',
    'duplicate unique key',
    'invalid numeric column',
  ])('rejects %s before deleting', async (defect) => {
    const backup = await exportFinancialBackup(db);
    switch (defect) {
      case 'unknown table':
        backup.tables.unknown = [];
        backup.tableManifest.push('unknown');
        break;
      case 'incomplete manifest':
        backup.tableManifest.pop();
        break;
      case 'missing table':
        delete backup.tables.recurring_patterns;
        backup.tableManifest = backup.tableManifest.filter(
          (name) => name !== 'recurring_patterns'
        );
        break;
      case 'future schema':
        backup.schemaVersion = 99;
        break;
      case 'invalid row':
        (backup.tables.users as unknown[]).push(null);
        break;
      case 'duplicate ID':
        backup.tables.users.push({ ...backup.tables.users[0] });
        break;
      case 'dangling reference':
        backup.tables.transactions[0].account_id = 'missing';
        break;
      case 'cross-profile reference':
        backup.tables.profiles.push({
          ...backup.tables.profiles[0],
          id: 'other',
        });
        backup.tables.categories[0].profile_id = 'other';
        break;
      case 'invalid enum':
        backup.tables.transactions[0].type = 'other';
        break;
      case 'invalid date':
        backup.tables.transactions[0].date = '2026-02-31';
        break;
      case 'duplicate unique key':
        backup.tables.accounts.push({
          ...backup.tables.accounts[0],
          id: 'other-account',
        });
        break;
      case 'invalid numeric column':
        backup.tables.transactions[0].amount = '';
        break;
    }
    await expect(restoreFinancialBackup(db, backup)).rejects.toThrow('Invalid');
    expect(deletedTables()).toEqual([]);
    expect(sqlite.prepare('SELECT name FROM users').get()).toEqual({
      name: 'Original',
    });
  });

  it('refuses a tampered checksum at both preview and restore', async () => {
    const backup = await addChecksumToBackup(await exportFinancialBackup(db));
    backup.tables.users[0].name = 'Tampered';
    await expect(validateFinancialBackup(db, backup)).rejects.toThrow(
      'Invalid'
    );
    await expect(restoreFinancialBackup(db, backup)).rejects.toThrow('Invalid');
    expect(deletedTables()).toEqual([]);
  });

  it('previews the validated record counts without writes', async () => {
    const backup = await exportFinancialBackup(db);
    const info = await validateFinancialBackup(db, backup);
    expect(info).toMatchObject({
      profiles: 1,
      accounts: 1,
      transactions: 1,
      legacy: false,
      missingTables: [],
    });
    expect(writes).toEqual([]);
  });

  it('retains compatibility with v2 raw/camelCase rows and warns about missing newer tables', async () => {
    const backup = await exportFinancialBackup(db);
    const legacy: Record<string, unknown> = {
      version: 2,
      exportedAt: backup.exportedAt,
      ...backup.tables,
    };
    legacy.categoryRules = legacy.category_rules;
    delete legacy.category_rules;
    legacy.addressBook = legacy.address_book;
    delete legacy.address_book;
    delete legacy.subscription_dismissed_alerts;
    delete legacy.recurring_pattern_source_decisions;
    delete legacy.recurring_patterns;
    const info = await validateFinancialBackup(db, legacy);
    expect(info.legacy).toBe(true);
    expect(info.missingTables).toContain('subscription_dismissed_alerts');
    await restoreFinancialBackup(db, legacy);
    expect(
      sqlite
        .prepare('SELECT COUNT(*) count FROM subscription_dismissed_alerts')
        .get()
    ).toEqual({ count: 0 });
    expect(sqlite.prepare('SELECT name FROM users').get()).toEqual({
      name: 'Original',
    });
  });

  it('persists the recovery snapshot before deletion and aborts if recovery storage fails', async () => {
    const original = await exportFinancialBackup(db);
    let recovery: FinancialBackup | undefined;
    await restoreFinancialBackup(db, replacement(original), {
      saveRecovery: async (snapshot) => {
        expect(deletedTables()).toEqual([]);
        recovery = snapshot;
      },
    });
    expect(recovery?.tables).toEqual(original.tables);
    expect(sqlite.prepare('SELECT name FROM users').get()).toEqual({
      name: 'Restored',
    });
    writes.length = 0;
    await expect(
      restoreFinancialBackup(db, original, {
        saveRecovery: async () => {
          throw new Error('Disk full');
        },
      })
    ).rejects.toThrow('Disk full');
    expect(deletedTables()).toEqual([]);
    expect(sqlite.prepare('SELECT name FROM users').get()).toEqual({
      name: 'Restored',
    });
  });

  it('rolls back the entire replacement on a failed insert', async () => {
    const original = await exportFinancialBackup(db);
    const run = db.runAsync;
    vi.spyOn(db, 'runAsync').mockImplementation(async (sql, params) => {
      if (sql.startsWith('INSERT INTO "transactions"'))
        throw new Error('Write failed');
      return run(sql, params);
    });
    await expect(
      restoreFinancialBackup(db, replacement(original))
    ).rejects.toThrow('Write failed');
    expect((await exportFinancialBackup(db)).tables).toEqual(original.tables);
  });

  it('clears stale local sync tombstones and aliases after a verified replacement', async () => {
    sqlite.exec(
      "CREATE TABLE sync_tombstones(id TEXT PRIMARY KEY); INSERT INTO sync_tombstones VALUES('old'); CREATE TABLE sync_row_aliases(id TEXT PRIMARY KEY); INSERT INTO sync_row_aliases VALUES('old')"
    );
    const backup = await exportFinancialBackup(db);
    expect(backup.tables).not.toHaveProperty('sync_tombstones');
    const result = await restoreFinancialBackup(db, backup);
    expect(Number.isFinite(Date.parse(result.verifiedAt))).toBe(true);
    expect(
      sqlite.prepare('SELECT count(*) count FROM sync_tombstones').get()
    ).toEqual({ count: 0 });
    expect(
      sqlite.prepare('SELECT count(*) count FROM sync_row_aliases').get()
    ).toEqual({ count: 0 });
  });

  it('rejects nonnumeric versions instead of coercing them', () => {
    expect(() =>
      parseFinancialBackup({
        version: '2',
        exportedAt: new Date().toISOString(),
      })
    ).toThrow('Invalid');
  });
});
