import Sqlite from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const PROFILE_ID = '00000000-0000-0000-0000-000000000002';
vi.mock('@fluxby/database', () => ({
  isSettingsCacheInitialized: () => true,
  readFromOPFSSync: () => '00000000-0000-0000-0000-000000000002',
}));
import { createDataService } from '@/lib/data-service';

let sqlite: Sqlite.Database;
let service: ReturnType<typeof createDataService>;
let failOnSecondInsert = false;
let budgetInserts = 0;
const originalTimezone = process.env.TZ;

beforeEach(() => {
  vi.stubGlobal('window', {});
  failOnSecondInsert = false;
  budgetInserts = 0;
  sqlite = new Sqlite(':memory:');
  sqlite.exec(`
    CREATE TABLE categories (id TEXT PRIMARY KEY, profile_id TEXT, name TEXT, icon TEXT, color TEXT, is_deleted INTEGER DEFAULT 0);
    CREATE TABLE accounts (id TEXT PRIMARY KEY, profile_id TEXT);
    CREATE TABLE transactions (id TEXT PRIMARY KEY, category_id TEXT, account_id TEXT, profile_id TEXT, amount REAL, type TEXT, date TEXT, is_deleted INTEGER DEFAULT 0);
    CREATE TABLE budgets (id TEXT PRIMARY KEY, category_id TEXT, amount REAL, period TEXT, profile_id TEXT, created_at INTEGER, updated_at INTEGER, start_date TEXT, end_date TEXT, rollover_enabled INTEGER DEFAULT 0, is_deleted INTEGER DEFAULT 0);
  `);
  const insert = sqlite.prepare(
    'INSERT INTO categories (id, profile_id, name) VALUES (?, ?, ?)'
  );
  insert.run('groceries', PROFILE_ID, 'Groceries');
  insert.run('transport', PROFILE_ID, 'Transport');
  insert.run('other-profile', 'another-profile', 'Private');
  service = createDataService({
    queryAsync: async (sql: string, params: unknown[] = []) =>
      sqlite.prepare(sql).all(...params),
    queryOneAsync: async (sql: string, params: unknown[] = []) =>
      sqlite.prepare(sql).get(...params),
    runAsync: async (sql: string, params: unknown[] = []) => {
      if (
        sql.includes('INSERT INTO budgets') &&
        failOnSecondInsert &&
        ++budgetInserts === 2
      ) {
        throw new Error('Simulated write failure');
      }
      return sqlite.prepare(sql).run(...params);
    },
    transactionAsync: async (fn: () => Promise<unknown>) => {
      sqlite.exec('BEGIN');
      try {
        const result = await fn();
        sqlite.exec('COMMIT');
        return result;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  } as never);
});

afterEach(() => {
  sqlite.close();
  vi.unstubAllGlobals();
  if (originalTimezone === undefined) delete process.env.TZ;
  else process.env.TZ = originalTimezone;
});

describe('budget correctness', () => {
  it.each(['Europe/Amsterdam', 'America/Los_Angeles', 'UTC'])(
    'preserves the stored monthly amount across annual viewing and editing in %s',
    async (timezone) => {
      process.env.TZ = timezone;
      const budget = await service.createBudget({
        categoryId: 'groceries',
        amount: 100,
        period: 'monthly',
      });
      const [view] = await service.getBudgets(
        undefined,
        '2026-01-01',
        '2026-12-31'
      );
      expect(view).toMatchObject({ amount: 1200, baseAmount: 100 });
      await service.updateBudget(budget.id, {
        amount: (view as typeof view & { baseAmount: number }).baseAmount,
      });
      expect(await service.getBudgets('2026-09')).toEqual([
        expect.objectContaining({ amount: 100, baseAmount: 100 }),
      ]);
    }
  );

  it('rolls back every proposed budget when a later insert fails', async () => {
    failOnSecondInsert = true;
    await expect(
      service.createBudgets([
        { categoryId: 'groceries', amount: 100 },
        { categoryId: 'transport', amount: 50 },
      ])
    ).rejects.toThrow('Simulated write failure');
    expect(
      sqlite.prepare('SELECT COUNT(*) AS count FROM budgets').get()
    ).toEqual({ count: 0 });
  });

  it('validates all proposed amounts and category ownership before creating anything', async () => {
    await expect(
      service.createBudgets([
        { categoryId: 'groceries', amount: 100 },
        { categoryId: 'transport', amount: Infinity },
      ])
    ).rejects.toThrow();
    await expect(
      service.createBudgets([
        { categoryId: 'groceries', amount: 100 },
        { categoryId: 'other-profile', amount: 50 },
      ])
    ).rejects.toThrow();
    expect(
      sqlite.prepare('SELECT COUNT(*) AS count FROM budgets').get()
    ).toEqual({ count: 0 });
  });

  it('counts each expense in its original category and excludes transfers and other profiles', async () => {
    await service.createBudget({ categoryId: 'groceries', amount: 100 });
    await service.createBudget({ categoryId: 'transport', amount: 80 });
    const insert = sqlite.prepare(
      'INSERT INTO transactions (id,category_id,profile_id,amount,type,date) VALUES (?,?,?,?,?,?)'
    );
    insert.run(
      'expense',
      'groceries',
      PROFILE_ID,
      -100,
      'expense',
      '2026-09-15'
    );
    insert.run(
      'transfer',
      'groceries',
      PROFILE_ID,
      -500,
      'transfer',
      '2026-09-15'
    );
    insert.run(
      'other',
      'groceries',
      'another-profile',
      -300,
      'expense',
      '2026-09-15'
    );
    const budgets = await service.getBudgets('2026-09');
    expect(budgets.find((item) => item.categoryId === 'groceries')?.spent).toBe(
      100
    );
    expect(budgets.find((item) => item.categoryId === 'transport')?.spent).toBe(
      0
    );
  });

  it('carries unused previous months forward while retaining the raw monthly amount', async () => {
    const budget = await service.createBudget({
      categoryId: 'groceries',
      amount: 100,
    });
    sqlite
      .prepare('UPDATE budgets SET start_date=? WHERE id=?')
      .run('2026-01-01', budget.id);
    const insert = sqlite.prepare(
      'INSERT INTO transactions (id,category_id,profile_id,amount,type,date) VALUES (?,?,?,?,?,?)'
    );
    insert.run('jan', 'groceries', PROFILE_ID, -70, 'expense', '2026-01-15');
    insert.run('feb', 'groceries', PROFILE_ID, -20, 'expense', '2026-02-15');
    expect(await service.getBudgets('2026-02')).toEqual([
      expect.objectContaining({ amount: 100, baseAmount: 100, carryover: 0 }),
    ]);
    await service.updateBudget(budget.id, { rolloverEnabled: true });
    expect(await service.getBudgets('2026-02')).toEqual([
      expect.objectContaining({
        amount: 130,
        baseAmount: 100,
        carryover: 30,
        spent: 20,
        remaining: 110,
      }),
    ]);
    expect(await service.getBudgets('2026-03')).toEqual([
      expect.objectContaining({ amount: 210, baseAmount: 100, carryover: 110 }),
    ]);
  });

  it.each([0, -1, NaN, Infinity])(
    'rejects invalid amount %s for create and update',
    async (amount) => {
      const budget = await service.createBudget({
        categoryId: 'groceries',
        amount: 100,
      });
      await expect(
        service.createBudget({ categoryId: 'transport', amount })
      ).rejects.toThrow();
      await expect(
        service.updateBudget(budget.id, { amount })
      ).rejects.toThrow();
      expect(sqlite.prepare('SELECT amount FROM budgets').all()).toEqual([
        { amount: 100 },
      ]);
    }
  );
});
