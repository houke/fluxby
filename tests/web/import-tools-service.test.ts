import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import SQLite from 'better-sqlite3';
import { SCHEMA_SQL } from '../../packages/database/src/schema';
import { migration018 } from '../../packages/database/src/migrations/018_dutch_import_tools';
import { createDataService } from '@/lib/data-service';
import type { Database } from '@fluxby/database';
import { createImportToolsService } from '@/lib/data/import-tools';
let sqlite: SQLite.Database;
let pid = 'profile';
function adapter() {
  return {
    execAsync: async (sql: string) => {
      sqlite.exec(sql);
    },
    queryAsync: async <T>(sql: string, params: unknown[] = []) =>
      sqlite.prepare(sql).all(...params) as T[],
    queryOneAsync: async <T>(sql: string, params: unknown[] = []) =>
      (sqlite.prepare(sql).get(...params) as T) ?? null,
    runAsync: async (sql: string, params: unknown[] = []) => {
      const result = sqlite.prepare(sql).run(...params);
      return {
        changes: result.changes,
        lastInsertRowId: Number(result.lastInsertRowid),
      };
    },
    transactionAsync: async <T>(action: () => Promise<T>) => {
      sqlite.exec('BEGIN');
      try {
        const result = await action();
        sqlite.exec('COMMIT');
        return result;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
let service: ReturnType<typeof createImportToolsService>;
beforeEach(async () => {
  sqlite = new SQLite(':memory:');
  sqlite.pragma('foreign_keys=ON');
  sqlite.exec(SCHEMA_SQL);
  const db = adapter();
  await migration018.up(db);
  sqlite.exec(
    `INSERT INTO schema_version(version) VALUES(18);INSERT INTO users(id,name) VALUES('user','User');INSERT INTO profiles(id,user_id,name) VALUES('profile','user','Mine'),('other','user','Other');INSERT INTO accounts(id,iban,name,current_balance,profile_id) VALUES('account','NL00TEST','Account',70,'profile'),('other-account','NL00OTHER','Other',0,'other');`
  );
  pid = 'profile';
  service = createImportToolsService(db, () => pid);
});
afterEach(() => sqlite.close());
function transaction(id: string, amount: number, updatedAt: number = 1) {
  sqlite
    .prepare(
      "INSERT INTO transactions(id,date,amount,type,description,account_id,profile_id,created_at,updated_at,import_hash) VALUES(?,'2026-09-30',?,'expense','Supermarkt Amsterdam','account','profile',1,?,?)"
    )
    .run(id, amount, updatedAt, id);
}
describe('import recovery and offline review', () => {
  it('uses quote-aware parsing on the actual import data-service path', async () => {
    const ds = createDataService(adapter() as unknown as Database);
    const parsed = await ds.previewCsvImport(
      'date,amount,description,iban\n2026-09-30,"-12,50","Shop, Amsterdam",NL91ABNA0417164300'
    );
    expect(parsed.rows[0]).toEqual({
      date: '2026-09-30',
      amount: '-12,50',
      description: 'Shop, Amsterdam',
      iban: 'NL91ABNA0417164300',
    });
  });

  it('undoes only exact membership and preserves unrelated imports', async () => {
    transaction('before', 100);
    transaction('batch', -20);
    transaction('concurrent', -10);
    const batch = await service.recordImportBatch('test.csv', 'import-id', [
      'batch',
    ]);
    expect(await service.undoImportBatch(batch)).toBe(1);
    expect(
      sqlite
        .prepare('SELECT id FROM transactions WHERE is_deleted=0 ORDER BY id')
        .all()
    ).toEqual([{ id: 'before' }, { id: 'concurrent' }]);
    expect(
      sqlite
        .prepare('SELECT current_balance FROM accounts WHERE id=?')
        .get('account')
    ).toEqual({ current_balance: 90 });
    expect(await service.getImportBatches()).toEqual([]);
  });
  it('restores the preimport account anchor when imported bank balances changed it', async () => {
    transaction('before', -10);
    sqlite.exec("UPDATE accounts SET current_balance=2000 WHERE id='account'");
    const recovery = await service.createImportRecoverySnapshot('bank.csv');
    transaction('batch', -20);
    sqlite.exec(
      "UPDATE transactions SET balance_after=1000 WHERE id='batch';UPDATE accounts SET current_balance=1000 WHERE id='account'"
    );
    const batch = await service.recordImportBatch(
      'bank.csv',
      'import-id',
      ['batch'],
      recovery
    );
    transaction('later', -30);
    expect(await service.undoImportBatch(batch)).toBe(1);
    expect(
      sqlite
        .prepare("SELECT current_balance FROM accounts WHERE id='account'")
        .get()
    ).toEqual({ current_balance: 1970 });
  });
  it('rolls back the entire undo when a transaction was edited later', async () => {
    transaction('first', -10);
    transaction('edited', -20, Date.now() + 60000);
    const batch = await service.recordImportBatch('test.csv', 'import-id', [
      'first',
      'edited',
    ]);
    await expect(service.undoImportBatch(batch)).rejects.toThrow(
      'importBatchChanged'
    );
    expect(
      sqlite
        .prepare('SELECT SUM(is_deleted) AS deleted FROM transactions')
        .get()
    ).toEqual({ deleted: 0 });
  });
  it('enforces profile ownership for undo and snapshots', async () => {
    transaction('batch', -20);
    const batch = await service.recordImportBatch('test.csv', 'import-id', [
      'batch',
    ]);
    const snapshot = await service.createImportRecoverySnapshot('test.csv');
    pid = 'other';
    await expect(service.undoImportBatch(batch)).rejects.toThrow();
    await expect(service.getImportRecoverySnapshot(snapshot)).rejects.toThrow();
    expect(await service.getImportBatches()).toEqual([]);
  });
  it('rotates snapshots without recursively embedding previous snapshots', async () => {
    for (let i = 0; i < 4; i++)
      await service.createImportRecoverySnapshot(`${i}.csv`);
    const snapshots = await service.getImportRecoverySnapshots();
    expect(snapshots).toHaveLength(3);
    const backup = await service.getImportRecoverySnapshot(snapshots[0].id);
    expect(backup.tables.import_recovery_snapshots).toBeUndefined();
    expect(backup.tables.accounts).toHaveLength(2);
  });
  it('finds duplicate candidates on the same account only and reports freshness', async () => {
    transaction('a', -20);
    transaction('b', -20);
    sqlite.exec(
      "INSERT INTO transactions(id,date,amount,type,description,account_id,profile_id) VALUES('c','2026-09-30',-20,'expense','Supermarkt Amsterdam','other-account','other')"
    );
    const candidates = await service.findLocalDuplicateCandidates();
    expect(candidates).toHaveLength(1);
    expect(candidates[0].probability).toBe(1);
    const freshness = await service.getAccountImportFreshness();
    expect(freshness[0].lastImportedAt).toBe(1);
    expect(freshness[0].newestTransactionDate).toBe('2026-09-30');
  });
});
