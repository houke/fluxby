/** @vitest-environment jsdom */
import SQLite from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SCHEMA_SQL } from '../../packages/database/src/schema';
import { migration018 } from '../../packages/database/src/migrations/018_dutch_import_tools';
import { createDataService } from '@/lib/data-service';
import type { Database } from '@fluxby/database';

const state = vi.hoisted(() => ({ profile: 'profile', switchOnInsert: false }));
vi.mock('@fluxby/database', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  isSettingsCacheInitialized: () => true,
  readFromOPFSSync: () => state.profile,
}));
let sqlite: SQLite.Database;
let service: ReturnType<typeof createDataService>;
beforeEach(async () => {
  state.profile = 'profile';
  state.switchOnInsert = false;
  sqlite = new SQLite(':memory:');
  sqlite.exec(SCHEMA_SQL);
  const adapter = {
    execAsync: async (sql: string) => {
      sqlite.exec(sql);
    },
    queryAsync: async <T>(sql: string, values: unknown[] = []) =>
      sqlite.prepare(sql).all(...values) as T[],
    queryOneAsync: async <T>(sql: string, values: unknown[] = []) =>
      (sqlite.prepare(sql).get(...values) as T) ?? null,
    runAsync: async (sql: string, values: unknown[] = []) => {
      const result = sqlite.prepare(sql).run(...values);
      if (state.switchOnInsert && sql.startsWith('INSERT INTO transactions'))
        state.profile = 'other';
      return {
        changes: result.changes,
        lastInsertRowId: Number(result.lastInsertRowid),
      };
    },
    transactionAsync: async <T>(callback: () => Promise<T>) => {
      sqlite.exec('BEGIN');
      try {
        const result = await callback();
        sqlite.exec('COMMIT');
        return result;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
  await migration018.up(adapter);
  sqlite.exec(
    "INSERT INTO users(id,name) VALUES('user','User');INSERT INTO profiles(id,user_id,name) VALUES('profile','user','Original'),('other','user','Other');INSERT INTO accounts(id,iban,name,profile_id) VALUES('account','NL00ORIGINAL','Original','profile'),('other-account','NL00OTHER','Other','other');"
  );
  service = createDataService(adapter as unknown as Database);
});
afterEach(() => sqlite.close());
const source = 'date;amount;description\n2026-10-02;-9,99;Shop';
const mapping = { date: 'date', amount: 'amount', description: 'description' };

describe('import data service profile ownership', () => {
  it('rejects a foreign-profile target account before any transaction mutation', async () => {
    await expect(
      service.importCsv(source, {
        accountId: 'other-account',
        mapping,
        expectedProfileId: 'profile',
      })
    ).rejects.toThrow('Account not found in import profile');
    expect(
      sqlite.prepare('SELECT COUNT(*) AS count FROM transactions').get()
    ).toEqual({ count: 0 });
  });
  it('finishes committed records and balances in the captured profile after a switch', async () => {
    state.switchOnInsert = true;
    const result = await service.importCsv(source, {
      accountId: 'account',
      mapping,
      expectedProfileId: 'profile',
    });
    expect(result.imported).toBe(1);
    expect(state.profile).toBe('other');
    expect(sqlite.prepare('SELECT profile_id FROM transactions').all()).toEqual(
      [{ profile_id: 'profile' }]
    );
    expect(sqlite.prepare('SELECT profile_id FROM imports').all()).toEqual([
      { profile_id: 'profile' },
    ]);
    expect(
      sqlite
        .prepare("SELECT current_balance FROM accounts WHERE id='account'")
        .get()
    ).toEqual({ current_balance: -9.99 });
    expect(
      sqlite
        .prepare(
          "SELECT current_balance FROM accounts WHERE id='other-account'"
        )
        .get()
    ).toEqual({ current_balance: 0 });
  });
});
