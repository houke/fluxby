import type { AsyncDatabaseConnection } from '@fluxby/database';
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
    transactionAsync: async function <T>(
      this: unknown,
      fn: (connection: AsyncDatabaseConnection) => Promise<T>
    ) {
      sqlite.exec('BEGIN');
      try {
        const r = await fn(this as AsyncDatabaseConnection);
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
  it('caps goal commitments at remaining funding after manual and linked contributions', async () => {
    sqlite.exec(`INSERT INTO savings_goals(id,name,target_amount,monthly_contribution,profile_id) VALUES
      ('complete','Complete',100,50,'p'),('partial','Partial',100,50,'p'),('archived','Archived',100,50,'p'),('foreign-goal','Foreign',100,50,'q');
      INSERT INTO savings_contributions(id,goal_id,amount,profile_id) VALUES('manual','complete',100,'p'),('partial-manual','partial',60,'p');
      INSERT INTO goal_transaction_links(id,goal_id,transaction_id,amount_cents,profile_id,created_at,updated_at) VALUES('linked','partial','r',2000,'p',0,0);
      INSERT INTO goal_archive_state(id,goal_id,archived,profile_id,created_at,updated_at) VALUES('archived-state','archived',1,'p',0,0);`);
    expect((await service.getBudgetCommitments()).goals).toBe(20);
  });
  it('keeps recurring bill guidance after its linked one-off plan has expired', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-05T12:00:00Z'));
    sqlite.exec(`INSERT INTO recurring_patterns(id,merchant_name,pattern_type,avg_amount,last_date,next_expected_date,is_active,is_confirmed,profile_id)
      VALUES('bill','Bill','monthly',-100,'2026-03-10','2026-04-10',1,1,'p');
      INSERT INTO planned_cashflows(id,name,kind,amount_cents,due_date,frequency,reserved_cents,recurring_pattern_id,profile_id,created_at,updated_at)
      VALUES('past-plan','Earlier payment','expense',10000,'2026-03-10','once',0,'bill','p',0,0);`);
    expect(await service.getBudgetCommitments()).toMatchObject({
      bills: 100,
      reserves: 0,
    });
    sqlite.exec(
      "UPDATE planned_cashflows SET due_date='2026-04-10',frequency='monthly' WHERE id='past-plan'"
    );
    expect((await service.getBudgetCommitments()).bills).toBe(100);
  });
  it('rejects a profile switch while suggestion ownership validation is awaiting the database', async () => {
    const db = adapter();
    const query = db.queryOneAsync;
    let release!: () => void;
    let validated!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const ready = new Promise<void>((resolve) => {
      validated = resolve;
    });
    db.queryOneAsync = async <T>(sql: string, params: unknown[] = []) => {
      const row = await query<T>(sql, params);
      if (sql.startsWith('SELECT id FROM categories')) {
        validated();
        await gate;
      }
      return row;
    };
    const guarded = createHouseholdBudgetService(db, () => pid);
    const action = guarded.applyMonthlyBudgetSuggestion('other', '2026-02', 50);
    await ready;
    pid = 'q';
    release();
    await expect(action).rejects.toThrow('Active profile changed');
    expect(
      sqlite
        .prepare("SELECT COUNT(*) count FROM budgets WHERE category_id='other'")
        .get()
    ).toEqual({ count: 0 });
  });
  it('rolls back a newly created envelope when its profile switches before the override write', async () => {
    const db = adapter();
    const run = db.runAsync;
    db.runAsync = async (sql, params) => {
      const result = await run(sql, params);
      if (sql.startsWith('INSERT INTO budgets')) pid = 'q';
      return result;
    };
    const guarded = createHouseholdBudgetService(db, () => pid);
    await expect(
      guarded.applyMonthlyBudgetSuggestion('other', '2026-02', 50)
    ).rejects.toThrow('Active profile changed');
    expect(
      sqlite
        .prepare("SELECT COUNT(*) count FROM budgets WHERE category_id='other'")
        .get()
    ).toEqual({ count: 0 });
    expect(
      sqlite.prepare('SELECT COUNT(*) count FROM budget_months').get()
    ).toEqual({ count: 0 });
  });
  it('applies a suggestion to the chosen month without changing yearly budgets or future defaults', async () => {
    sqlite.exec(
      "INSERT INTO budgets(id,category_id,amount,period,profile_id) VALUES('yearly','other',1200,'yearly','p')"
    );
    const id = await service.applyMonthlyBudgetSuggestion(
      'other',
      '2025-11',
      80
    );
    expect(
      (await full.getBudgets('2025-11')).find((budget) => budget.id === id)
    ).toMatchObject({
      amount: 80,
      baseAmount: 0,
      period: 'monthly',
      startDate: '2025-11-01',
    });
    expect(
      (await full.getBudgets('2025-12')).find((budget) => budget.id === id)
        ?.amount
    ).toBe(0);
    expect(
      (await full.getBudgets('2025-11')).find(
        (budget) => budget.id === 'yearly'
      )?.amount
    ).toBe(1200);
    expect(
      await service.applyMonthlyBudgetSuggestion('other', '2025-11', 90)
    ).toBe(id);
    expect(
      (await full.getBudgets('2025-11')).find((budget) => budget.id === id)
        ?.amount
    ).toBe(90);
  });
  it('keeps existing recurring defaults when applying a monthly suggestion and rejects foreign categories', async () => {
    expect(
      await service.applyMonthlyBudgetSuggestion('food', '2026-02', 50)
    ).toBe('b');
    expect((await full.getBudgets('2026-02'))[0]).toMatchObject({
      amount: 50,
      baseAmount: 100,
    });
    expect((await full.getBudgets('2026-03'))[0].baseAmount).toBe(100);
    await expect(
      service.applyMonthlyBudgetSuggestion('foreign', '2026-02', 50)
    ).rejects.toThrow();
    await expect(
      service.applyMonthlyBudgetSuggestion('food', '2026-02', NaN)
    ).rejects.toThrow();
  });
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
  it('resets deficit carry at an unallocated month and starts the next envelope without old spending', async () => {
    await service.setBudgetNegativeRollover('b', true);
    await service.setBudgetMonth('b', '2026-02', 0);
    sqlite.exec(
      "INSERT INTO transactions(id,date,amount,type,account_id,category_id,profile_id) VALUES('unallocated-spend','2026-02-10',-50,'expense','a','food','p')"
    );
    expect((await full.getBudgets('2026-02'))[0]).toMatchObject({
      carryover: 0,
      amount: 0,
      spent: 50,
    });
    expect((await full.getBudgets('2026-03'))[0]).toMatchObject({
      carryover: 0,
      amount: 100,
    });
    expect(
      (await full.getBudgets(undefined, '2026-02-01', '2026-03-31'))[0]
    ).toMatchObject({ carryover: 0, amount: 100 });
  });
  it('preserves the existing surplus-only policy while opt-in carry-both resets at zero', async () => {
    sqlite.exec("UPDATE transactions SET amount=-20 WHERE id='e'");
    await service.setBudgetMonth('b', '2026-02', 0);
    expect((await full.getBudgets('2026-02'))[0]).toMatchObject({
      carryover: 80,
      amount: 80,
    });
    await service.setBudgetNegativeRollover('b', true);
    expect((await full.getBudgets('2026-02'))[0]).toMatchObject({
      carryover: 0,
      amount: 0,
    });
    expect((await full.getBudgets('2026-03'))[0]).toMatchObject({
      carryover: 0,
      amount: 100,
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
    await full.updateTransaction('e', { categoryId: 'food' });
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
    expect(
      (await service.getCategoryReferences('other'))
        .transaction_category_decisions
    ).toBe(1);
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
  it('records rule provenance together with advanced categorization', async () => {
    sqlite.exec("UPDATE transactions SET category_id=NULL WHERE id='e'");
    await service.createAdvancedCategoryRule({
      pattern: 'Shop',
      matchMode: 'contains',
      matchField: 'merchant',
      direction: 'expense',
      categoryId: 'food',
      priority: 1,
    });
    expect(await service.applyAdvancedCategoryRules()).toBe(1);
    expect(
      sqlite
        .prepare(
          "SELECT category_id,source FROM transaction_category_decisions WHERE transaction_id='e'"
        )
        .get()
    ).toEqual({ category_id: 'food', source: 'rule' });
  });
  it('rejects profile switches during rule loading and rolls back changes during rule assignment', async () => {
    sqlite.exec("UPDATE transactions SET category_id=NULL WHERE id='e'");
    await service.createAdvancedCategoryRule({
      pattern: 'Shop',
      matchMode: 'contains',
      matchField: 'merchant',
      direction: 'expense',
      categoryId: 'food',
      priority: 1,
    });
    const db = adapter(),
      query = db.queryAsync;
    db.queryAsync = async <T>(sql: string, params: unknown[] = []) => {
      const rows = await query<T>(sql, params);
      if (sql.includes('FROM advanced_category_rules')) pid = 'q';
      return rows;
    };
    await expect(
      createHouseholdBudgetService(db, () => pid).applyAdvancedCategoryRules()
    ).rejects.toThrow('Active profile changed');
    pid = 'p';
    db.queryAsync = query;
    const run = db.runAsync;
    db.runAsync = async (sql, params) => {
      const result = await run(sql, params);
      if (sql.startsWith('INSERT INTO transaction_category_decisions'))
        pid = 'q';
      return result;
    };
    await expect(
      createHouseholdBudgetService(db, () => pid).applyAdvancedCategoryRules()
    ).rejects.toThrow('Active profile changed');
    expect(
      sqlite.prepare("SELECT category_id FROM transactions WHERE id='e'").get()
    ).toEqual({ category_id: null });
    expect(
      sqlite
        .prepare('SELECT COUNT(*) count FROM transaction_category_decisions')
        .get()
    ).toEqual({ count: 0 });
  });
  it('rejects unsafe monetary values without storing monthly allocations', async () => {
    await expect(service.setBudgetMonth('b', '2026-02', 1e100)).rejects.toThrow(
      'Invalid monetary'
    );
    await expect(
      service.saveBudgetIncomePlan('2026-02', 1e100)
    ).rejects.toThrow('Invalid monetary');
    await expect(
      service.applyMonthlyBudgetSuggestion('other', '2026-02', 0.004)
    ).rejects.toThrow('Invalid suggestion');
    expect((await service.getBudgetExtensions()).overrides).toEqual([]);
    expect(await service.getBudgetIncomePlan('2026-02')).toBe(0);
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
