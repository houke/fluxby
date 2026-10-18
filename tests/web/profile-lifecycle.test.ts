import SQLite from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AsyncDatabaseConnection, Database } from '@fluxby/database';
import { migrations } from '../../packages/database/src/migrations';
import { createDataService } from '@/lib/data-service';

vi.mock('@fluxby/database', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@fluxby/database')>()),
  isSettingsCacheInitialized: () => true,
  readFromOPFSSync: () => 'mine',
}));

let sqlite: SQLite.Database;
let db: AsyncDatabaseConnection;

beforeEach(async () => {
  vi.stubGlobal('window', {});
  sqlite = new SQLite(':memory:');
  sqlite.pragma('foreign_keys = ON');
  let transactionDepth = 0;
  const transact = async <T>(
    work: (connection: AsyncDatabaseConnection) => Promise<T>
  ): Promise<T> => {
    const savepoint = transactionDepth ? `test_${transactionDepth}` : null;
    sqlite.exec(savepoint ? `SAVEPOINT ${savepoint}` : 'BEGIN');
    transactionDepth++;
    try {
      const result = await work(scoped as AsyncDatabaseConnection);
      sqlite.exec(savepoint ? `RELEASE SAVEPOINT ${savepoint}` : 'COMMIT');
      return result;
    } catch (error) {
      if (savepoint) {
        sqlite.exec(`ROLLBACK TO SAVEPOINT ${savepoint}`);
        sqlite.exec(`RELEASE SAVEPOINT ${savepoint}`);
      } else sqlite.exec('ROLLBACK');
      throw error;
    } finally {
      transactionDepth--;
    }
  };
  const scoped = {
    execAsync: async (sql: string) => {
      sqlite.exec(sql);
    },
    queryAsync: async <T>(sql: string, params: unknown[] = []) =>
      sqlite.prepare(sql).all(...params) as T[],
    queryOneAsync: async <T>(sql: string, params: unknown[] = []) =>
      (sqlite.prepare(sql).get(...params) as T | undefined) ?? null,
    runAsync: async (sql: string, params: unknown[] = []) => {
      const result = sqlite.prepare(sql).run(...params);
      return {
        changes: result.changes,
        lastInsertRowId: Number(result.lastInsertRowid),
      };
    },
    transactionAsync: transact,
  };
  const rootOnly =
    <A extends unknown[], R>(method: (...args: A) => R) =>
    (...args: A): R => {
      if (transactionDepth)
        throw new Error('Root connection used inside a transaction');
      return method(...args);
    };
  db = {
    execAsync: rootOnly(scoped.execAsync),
    queryAsync: rootOnly(scoped.queryAsync),
    queryOneAsync: rootOnly(scoped.queryOneAsync),
    runAsync: rootOnly(scoped.runAsync),
    transactionAsync: transact,
  };
  for (const migration of migrations) await migration.up(db);
  sqlite.exec(`
    INSERT INTO users(id,name) VALUES('user','User');
    INSERT INTO profiles(id,user_id,name) VALUES('mine','user','Mine'),('other','user','Other');
    INSERT INTO accounts(id,iban,name,profile_id) VALUES('account','NLTEST','Mine','mine'),('other-account','NLOTHER','Other','other');
    INSERT INTO categories(id,name,profile_id) VALUES('category','Mine','mine'),('other-category','Other','other');
    INSERT INTO address_book(id,iban,name,profile_id) VALUES('contact','NLCONTACT','Mine','mine'),('other-contact','NLCONTACT','Other','other');
    INSERT INTO contact_ibans(id,contact_id,iban) VALUES('contact-iban','contact','NLCHILD'),('other-contact-iban','other-contact','NLCHILD');
    INSERT INTO transactions(id,date,amount,type,account_id,profile_id) VALUES('legacy','2026-10-01',-1,'expense','account',NULL),('other-tx','2026-10-01',-1,'expense','other-account','other');
    INSERT INTO category_rules(id,pattern,category_id,profile_id) VALUES('legacy-rule','Legacy','category',NULL),('explicit-other','Foreign owner','category','other');
    INSERT INTO recurring_patterns(id,merchant_name,profile_id) VALUES('pattern','Mine','mine'),('other-pattern','Other','other');
    INSERT INTO savings_goals(id,name,target_amount,profile_id) VALUES('goal','Mine',100,'mine'),('other-goal','Other',100,'other');
    INSERT INTO savings_contributions(id,goal_id,amount,profile_id) VALUES('contribution','goal',10,'mine');
    INSERT INTO saved_transaction_views(id,name,filters_json,profile_id) VALUES('legacy-view','Legacy','{}','mine');
    INSERT INTO import_profiles(id,name,header_signature,settings_json,profile_id,created_at,updated_at) VALUES('import-profile','Mine','date,amount','{}','mine',1,1);
    INSERT INTO import_batches(id,filename,profile_id,created_at,updated_at) VALUES('batch','mine.csv','mine',1,1);
    INSERT INTO import_recovery_snapshots(id,filename,backup_json,profile_id,created_at,updated_at) VALUES('recovery','mine.csv','{}','mine',1,1);
    INSERT INTO planned_cashflows(id,name,kind,amount_cents,due_date,frequency,profile_id,created_at,updated_at) VALUES('cashflow','Mine','income',100,'2026-10-01','once','mine',1,1);
    INSERT INTO budget_income_plans(id,month,expected_income,profile_id,created_at,updated_at) VALUES('income-plan','2026-10',100,'mine',1,1);
    INSERT INTO weekly_reviews(id,week,profile_id,created_at,updated_at) VALUES('review','2026-10-05','mine',1,1);
    INSERT INTO goal_transaction_links(id,goal_id,transaction_id,amount_cents,profile_id,created_at,updated_at) VALUES('goal-link','goal','legacy',100,'mine',1,1);
    INSERT INTO shared_ibans(id,iban,provider_name) VALUES('shared','NLSHARED','Shared provider');
  `);
});
afterEach(() => {
  sqlite.close();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('profile deletion across stored features', () => {
  it('retires all owned feature rows using the transaction connection and preserves other profiles', async () => {
    await createDataService(db as Database).deleteProfile('mine');
    for (const table of [
      'accounts',
      'categories',
      'address_book',
      'recurring_patterns',
      'savings_goals',
      'savings_contributions',
      'saved_transaction_views',
      'import_profiles',
      'import_batches',
      'import_recovery_snapshots',
      'planned_cashflows',
      'budget_income_plans',
      'weekly_reviews',
    ]) {
      expect(
        sqlite
          .prepare(
            `SELECT COUNT(*) AS count FROM ${table} WHERE profile_id='mine' AND is_deleted=0`
          )
          .get(),
        table
      ).toEqual({ count: 0 });
    }
    for (const [table, id] of [
      ['transactions', 'legacy'],
      ['category_rules', 'legacy-rule'],
      ['contact_ibans', 'contact-iban'],
      ['profiles', 'mine'],
    ])
      expect(
        sqlite.prepare(`SELECT is_deleted FROM ${table} WHERE id=?`).get(id)
      ).toEqual({ is_deleted: 1 });
    for (const [table, id] of [
      ['accounts', 'other-account'],
      ['transactions', 'other-tx'],
      ['category_rules', 'explicit-other'],
      ['contact_ibans', 'other-contact-iban'],
      ['recurring_patterns', 'other-pattern'],
      ['savings_goals', 'other-goal'],
      ['shared_ibans', 'shared'],
      ['profiles', 'other'],
    ])
      expect(
        sqlite.prepare(`SELECT is_deleted FROM ${table} WHERE id=?`).get(id)
      ).toEqual({ is_deleted: 0 });
  });

  it('rolls back every feature deletion when one write fails', async () => {
    sqlite.exec(
      `CREATE TRIGGER block_profile_deletion BEFORE UPDATE OF is_deleted ON profiles WHEN NEW.id='mine' BEGIN SELECT RAISE(ABORT,'deletion blocked'); END;`
    );
    await expect(
      createDataService(db as Database).deleteProfile('mine')
    ).rejects.toThrow('deletion blocked');
    for (const table of [
      'accounts',
      'transactions',
      'savings_goals',
      'import_profiles',
      'contact_ibans',
      'profiles',
    ])
      expect(
        sqlite
          .prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE is_deleted=1`)
          .get(),
        table
      ).toEqual({ count: 0 });
  });

  it('resets all profile features despite restrictive references and retains installation/shared data', async () => {
    const result = await createDataService(db as Database).resetAllData();
    expect(sqlite.prepare('SELECT id,name FROM profiles').all()).toEqual([
      { id: result.demoProfileId, name: 'Demo' },
    ]);
    for (const table of [
      'accounts',
      'transactions',
      'savings_goals',
      'goal_transaction_links',
      'import_profiles',
      'planned_cashflows',
      'weekly_reviews',
    ])
      expect(
        sqlite.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get(),
        table
      ).toEqual({ count: 0 });
    expect(sqlite.prepare('SELECT name FROM users').all()).toEqual([
      { name: 'User' },
    ]);
    expect(sqlite.prepare('SELECT id FROM shared_ibans').all()).toEqual([
      { id: 'shared' },
    ]);
    expect(sqlite.pragma('foreign_key_check')).toEqual([]);
  });

  it('preserves the dataset when recreating the reset profile fails', async () => {
    sqlite.exec(
      `CREATE TRIGGER block_profile_creation BEFORE INSERT ON profiles BEGIN SELECT RAISE(ABORT,'creation blocked'); END;`
    );
    await expect(
      createDataService(db as Database).resetAllData()
    ).rejects.toThrow('creation blocked');
    expect(
      sqlite.prepare('SELECT COUNT(*) AS count FROM profiles').get()
    ).toEqual({ count: 2 });
    expect(
      sqlite.prepare('SELECT id FROM goal_transaction_links').all()
    ).toEqual([{ id: 'goal-link' }]);
    expect(sqlite.pragma('foreign_key_check')).toEqual([]);
  });

  it('clears account-owned legacy transactions while preserving explicit foreign ownership', async () => {
    sqlite.exec(
      "INSERT INTO transactions(id,date,amount,type,account_id,profile_id) VALUES('foreign-owned','2026-10-01',-2,'expense','account','other')"
    );
    const result = await createDataService(
      db as Database
    ).deleteAllTransactions();
    expect(result).toEqual({ deleted: 1 });
    expect(
      sqlite
        .prepare("SELECT is_deleted FROM transactions WHERE id='legacy'")
        .get()
    ).toEqual({ is_deleted: 1 });
    expect(
      sqlite
        .prepare("SELECT is_deleted FROM transactions WHERE id='foreign-owned'")
        .get()
    ).toEqual({ is_deleted: 0 });
  });
});
