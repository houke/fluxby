import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SQLite from 'better-sqlite3';
import { SCHEMA_SQL } from '../../packages/database/src/schema';
import { migrations } from '../../packages/database/src/migrations';
import {
  createHouseholdBudgetService,
  matchesAdvancedRule,
  monthlyAllocation,
} from '@/lib/data/household-budgets';
vi.mock('@fluxby/database', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  isSettingsCacheInitialized: () => true,
  readFromOPFSSync: () => 'p',
}));
import { createDataService } from '@/lib/data-service';
let sqlite: SQLite.Database;
let pid = 'p';
function adapter() {
  return {
    execAsync: async (sql: string) => {
      sqlite.exec(sql);
    },
    queryAsync: async <T>(sql: string, params: unknown[] = []) =>
      sqlite.prepare(sql).all(...params) as T[],
    queryOneAsync: async <T>(sql: string, params: unknown[] = []) =>
      sqlite.prepare(sql).get(...params) as T | null,
    runAsync: async (sql: string, params: unknown[] = []) => {
      const result = sqlite.prepare(sql).run(...params);
      return {
        changes: result.changes,
        lastInsertRowId: Number(result.lastInsertRowid),
      };
    },
    transactionAsync: async <T>(fn: () => Promise<T>) => {
      sqlite.exec('BEGIN');
      try {
        const r = await fn();
        sqlite.exec('COMMIT');
        return r;
      } catch (e) {
        sqlite.exec('ROLLBACK');
        throw e;
      }
    },
  };
}
let service: ReturnType<typeof createHouseholdBudgetService>;
let full: ReturnType<typeof createDataService>;
beforeEach(async () => {
  sqlite = new SQLite(':memory:');
  sqlite.pragma('foreign_keys=ON');
  sqlite.exec(SCHEMA_SQL);
  const db = adapter();
  for (const m of migrations.filter((m) => m.version >= 6)) await m.up(db);
  sqlite.exec(
    `INSERT INTO users(id,name) VALUES('u','User');INSERT INTO profiles(id,user_id,name) VALUES('p','u','Personal'),('q','u','Other');INSERT INTO accounts(id,iban,name,profile_id,current_balance) VALUES('a','NL1','Bank','p',1000);INSERT INTO categories(id,name,profile_id) VALUES('food','Food','p'),('other','Other','p'),('foreign','Private','q');INSERT INTO budgets(id,category_id,amount,period,profile_id,start_date,rollover_enabled) VALUES('b','food',100,'monthly','p','2026-01-01',1);INSERT INTO transactions(id,date,amount,type,account_id,category_id,profile_id,merchant_name) VALUES('e','2026-01-15',-120,'expense','a','food','p','Shop'),('r','2026-02-01',50,'income','a',NULL,'p','Shop');`
  );
  pid = 'p';
  service = createHouseholdBudgetService(db, () => pid);
  vi.stubGlobal('window', {});
  full = createDataService(db as never);
});
afterEach(() => {
  sqlite.close();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe('household budgets', () => {
  it('preserves base budget and other months while copying prior overrides', async () => {
    await service.setBudgetMonth('b', '2026-02', 130);
    await service.copyPreviousBudgetMonth('2026-03');
    expect((await full.getBudgets('2026-02'))[0].amount).toBe(130);
    expect((await full.getBudgets('2026-03'))[0].baseAmount).toBe(100);
    expect((await service.getBudgetExtensions()).overrides).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ month: '2026-03', amount: 130 }),
      ])
    );
    await service.setBudgetMonth('b', '2026-02', null);
    expect((await full.getBudgets('2026-02'))[0].amount).toBe(100);
  });
  it('carries overspending only when opted in and honors historical overrides', async () => {
    await service.setBudgetNegativeRollover('b', true);
    expect((await full.getBudgets('2026-02'))[0]).toMatchObject({
      carryover: -20,
      amount: 80,
    });
    await service.setBudgetMonth('b', '2026-01', 150);
    expect((await full.getBudgets('2026-02'))[0]).toMatchObject({
      carryover: 30,
      amount: 130,
    });
  });
  it('reduces spending in original period, income in repayment period, but keeps bank balance', async () => {
    await full.createTransactionLink({
      sourceId: 'r',
      targetId: 'e',
      kind: 'refund',
      amount: 50,
    });
    expect((await full.getBudgets('2026-01'))[0].spent).toBe(70);
    const months = await full.getMonthlyStats('2026-01-01', '2026-02-28');
    expect(months[0].expenses).toBe(70);
    expect(months[1].income).toBe(0);
    expect((await full.getAccounts())[0].currentBalance).toBe(1000);
  });
  it('archives and moves references transactionally with profile checks', async () => {
    await expect(service.retireCategory('food', 'foreign')).rejects.toThrow();
    expect((await service.getCategoryReferences('food')).transactions).toBe(1);
    await service.retireCategory('food', 'other');
    expect((await full.getCategories()).some((c) => c.id === 'food')).toBe(
      false
    );
    expect((await full.getCategories(true)).some((c) => c.id === 'food')).toBe(
      true
    );
    expect((await service.getCategoryReferences('other')).transactions).toBe(1);
  });
  it('uses monthly totals over completed months, including zero-spend months', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-05T12:00:00Z'));
    const suggestions = await service.getMonthlyBudgetSuggestions(3);
    expect(suggestions[0]).toMatchObject({
      averageMonthly: 40,
      suggestedAmount: 40,
      limitedHistory: true,
    });
  });
  it('protects deliberate categorization from legacy and advanced rules', async () => {
    await full.updateTransaction('e', { categoryId: 'other' });
    await full.applyCategoryRuleToTransactions('Shop', 'food');
    expect(
      sqlite.prepare("SELECT category_id FROM transactions WHERE id='e'").get()
    ).toEqual({ category_id: 'other' });
    await full.updateTransaction('e', { categoryId: null });
    await service.createAdvancedCategoryRule({
      pattern: 'Shop',
      matchMode: 'contains',
      matchField: 'merchant',
      direction: 'expense',
      categoryId: 'food',
      priority: 1,
    });
    await service.applyAdvancedCategoryRules();
    expect(
      sqlite.prepare("SELECT category_id FROM transactions WHERE id='e'").get()
    ).toEqual({ category_id: null });
  });
  it('stores manual accounts without claiming an IBAN and validates loans', async () => {
    const cash = await full.createAccount({ name: 'Cash', type: 'cash' });
    await expect(
      full.createAccount({ name: 'Debt', type: 'loan', currentBalance: 10 })
    ).rejects.toThrow();
    const cash2 = await full.createAccount({ name: 'Wallet', type: 'cash' });
    await full.updateAccount(cash.id, { color: '#aabbcc' });
    expect(
      (await full.getAccounts()).find((a) => a.id === cash.id)
    ).toMatchObject({ iban: '', type: 'cash', color: '#aabbcc' });
    expect(cash2.id).not.toBe(cash.id);
  });
  it('enforces profile boundaries and financial input validation', async () => {
    pid = 'q';
    await expect(service.setBudgetMonth('b', '2026-02', 20)).rejects.toThrow();
    pid = 'p';
    await expect(service.setBudgetMonth('b', '2026-13', 20)).rejects.toThrow();
    await expect(service.setBudgetMonth('b', '2026-02', NaN)).rejects.toThrow();
    expect(
      monthlyAllocation(10, new Map([['2026-02', 0]]), '2026-01', '2026-03')
    ).toBe(20);
  });
  it('matches rule direction, amount, account and selected text', () => {
    const rule = {
      pattern: 'shop',
      matchMode: 'contains' as const,
      matchField: 'merchant' as const,
      direction: 'expense' as const,
      minimumAmount: 10,
      maximumAmount: 30,
      accountId: 'a',
      categoryId: 'food',
      priority: 0,
    };
    const tx = {
      amount: -20,
      type: 'expense',
      accountId: 'a',
      merchantName: 'SHOP',
      description: '',
    };
    expect(matchesAdvancedRule(rule, tx)).toBe(true);
    expect(matchesAdvancedRule(rule, { ...tx, type: 'income' })).toBe(false);
    expect(matchesAdvancedRule(rule, { ...tx, amount: -31 })).toBe(false);
  });
});
