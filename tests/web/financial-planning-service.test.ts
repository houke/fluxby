import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SQLite from 'better-sqlite3';
import { SCHEMA_SQL } from '../../packages/database/src/schema';
import { migration006 } from '../../packages/database/src/migrations/006_recurring_dismissed';
import { migration013 } from '../../packages/database/src/migrations/013_subscription_dismissed_alerts';
import { migration015 } from '../../packages/database/src/migrations/015_profile_sync_state';
import { migration016 } from '../../packages/database/src/migrations/016_financial_planning';
import { createFinancialPlanningService } from '@/lib/data/financial-planning';
import { createFinancialHistoryService } from '@/lib/data/financial-history';
import { createTransactionFeaturesService } from '@/lib/data/transaction-features';
import {
  exportFinancialBackup,
  restoreFinancialBackup,
} from '@/lib/data/backup';
import { seedFinancialPlanningDemo } from '@/lib/data/financial-demo';
import { getFinancialPlanningDemoData } from '@fluxby/shared';

vi.mock('@fluxby/database', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  isSettingsCacheInitialized: () => true,
  readFromOPFSSync: () => 'profile',
}));
import { createDataService } from '@/lib/data-service';
let sqlite: SQLite.Database;
let pid = 'profile';
function adapter() {
  const db = {
    execAsync: async (sql: string) => {
      sqlite.exec(sql);
    },
    queryAsync: async <T>(sql: string, params: unknown[] = []): Promise<T[]> =>
      sqlite.prepare(sql).all(...params) as T[],
    queryOneAsync: async <T>(
      sql: string,
      params: unknown[] = []
    ): Promise<T | null> => (sqlite.prepare(sql).get(...params) as T) ?? null,
    runAsync: async (sql: string, params: unknown[] = []) => {
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
  return db;
}
let db: ReturnType<typeof adapter>;
let planning: ReturnType<typeof createFinancialPlanningService>;
let history: ReturnType<typeof createFinancialHistoryService>;
let transactions: ReturnType<typeof createTransactionFeaturesService>;
const transactionId = '00000000-0000-4000-8000-000000000001';
beforeEach(async () => {
  sqlite = new SQLite(':memory:');
  sqlite.pragma('foreign_keys=ON');
  sqlite.exec(SCHEMA_SQL);
  db = adapter();
  for (const migration of [
    migration006,
    migration013,
    migration015,
    migration016,
  ])
    await migration.up(db);
  sqlite.exec(`INSERT INTO schema_version(version) VALUES(16);
    INSERT INTO users(id,name) VALUES('user','User');
    INSERT INTO profiles(id,user_id,name) VALUES('profile','user','Personal'),('other','user','Other');
    INSERT INTO accounts(id,iban,name,current_balance,profile_id) VALUES('account','NL00TEST','Account',2000,'profile'),('other-account','NL00OTHER','Other',9000,'other');
    INSERT INTO categories(id,name,profile_id) VALUES('food','Food','profile'),('household','Household','profile'),('other-category','Other','other');
    INSERT INTO transactions(id,date,amount,type,account_id,category_id,profile_id) VALUES('${transactionId}','2026-01-31',-10.01,'expense','account','food','profile');
    INSERT INTO budgets(id,category_id,amount,profile_id,created_at) VALUES('food-budget','food',100,'profile',1767225600000),('household-budget','household',100,'profile',1767225600000);`);
  pid = 'profile';
  planning = createFinancialPlanningService(db, () => pid);
  history = createFinancialHistoryService(db, () => pid);
  transactions = createTransactionFeaturesService(db, () => pid);
  vi.stubGlobal('window', {});
});
afterEach(() => {
  sqlite.close();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('financial planning services', () => {
  it('tracks goal contributions without changing bank balances and keeps profile ownership', async () => {
    const goal = await planning.createSavingsGoal({
      name: 'Holiday',
      targetAmount: 1000,
      monthlyContribution: 100,
      deadline: '2026-12-31',
    });
    expect(goal.currentAmount).toBe(0);
    expect(
      (await planning.addSavingsContribution(goal.id, 150.25)).currentAmount
    ).toBe(150.25);
    expect(
      sqlite
        .prepare('SELECT current_balance FROM accounts WHERE id=?')
        .get('account')
    ).toEqual({ current_balance: 2000 });
    pid = 'other';
    expect(await planning.getSavingsGoals()).toEqual([]);
    await expect(planning.addSavingsContribution(goal.id, 10)).rejects.toThrow(
      'not found'
    );
    await expect(
      planning.updateSavingsGoal(goal.id, { name: 'Changed' })
    ).rejects.toThrow('not found');
    await planning.deleteSavingsGoal(goal.id);
    pid = 'profile';
    expect((await planning.getSavingsGoals())[0].name).toBe('Holiday');
  });
  it('rejects invalid goals, amounts and impossible dates without persistent changes', async () => {
    await expect(
      planning.createSavingsGoal({ name: ' ', targetAmount: 100 })
    ).rejects.toThrow();
    await expect(
      planning.createSavingsGoal({ name: 'Goal', targetAmount: 0 })
    ).rejects.toThrow();
    await expect(
      planning.createSavingsGoal({ name: 'Goal', targetAmount: NaN })
    ).rejects.toThrow();
    await expect(
      planning.createSavingsGoal({
        name: 'Goal',
        targetAmount: 100,
        deadline: '2026-02-31',
      })
    ).rejects.toThrow();
    await expect(
      planning.updatePlanningPreferences({ minimumBalance: -1 })
    ).rejects.toThrow();
    expect(await planning.getSavingsGoals()).toEqual([]);
    expect(await history.getChangeHistory()).toEqual([]);
  });
  it('calculates next30day obligations in calendar months, excludes income, reserves remaining goal amounts and exposes shortfalls', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-31T12:00:00Z'));
    sqlite.exec(`INSERT INTO recurring_patterns(id,merchant_name,pattern_type,avg_amount,last_date,next_expected_date,is_active,is_confirmed,profile_id)
      VALUES('bill','Bill','monthly',-100,'2026-01-28','2026-02-28',1,1,'profile'),('salary','Salary','monthly',3000,'2026-01-31','2026-02-28',1,1,'profile'),('other-bill','Other bill','monthly',-999,'2026-01-28','2026-02-28',1,1,'other')`);
    const goal = await planning.createSavingsGoal({
      name: 'Goal',
      targetAmount: 100,
      monthlyContribution: 50,
    });
    await planning.addSavingsContribution(goal.id, 80);
    await planning.updatePlanningPreferences({
      minimumBalance: 250,
      reservedSavings: 100,
    });
    expect(await planning.getSafeToSpend()).toMatchObject({
      availableBalance: 2000,
      upcomingObligations: 100,
      goalReservations: 20,
      minimumBalance: 250,
      reservedSavings: 100,
      safeToSpend: 1530,
      startDate: '2026-01-31',
      endDate: '2026-03-01',
    });
    sqlite.exec("UPDATE accounts SET current_balance=50 WHERE id='account'");
    expect((await planning.getSafeToSpend()).safeToSpend).toBe(-420);
  });
  it('computes net worth using cash plus assets minus liabilities and supports editing', async () => {
    const asset = await planning.createNetWorthItem({
      name: 'Bicycle',
      type: 'asset',
      amount: 750,
    });
    await planning.createNetWorthItem({
      name: 'Loan',
      type: 'liability',
      amount: 500,
    });
    expect(await planning.getNetWorth()).toMatchObject({
      cash: 2000,
      assets: 750,
      liabilities: 500,
      total: 2250,
    });
    await planning.updateNetWorthItem(asset.id, { amount: 650 });
    expect((await planning.getNetWorth()).total).toBe(2150);
    await planning.deleteNetWorthItem(asset.id);
    expect((await planning.getNetWorth()).total).toBe(1500);
  });
  it('persists monthly review and requires every review step before completion', async () => {
    const month = '2026-01';
    expect((await planning.getMonthlyReview(month)).status).toBe('open');
    await expect(
      planning.updateMonthlyReview(month, { status: 'complete' })
    ).rejects.toThrow('every');
    const checks = {
      uncategorized: true,
      spending: true,
      budgets: true,
      subscriptions: true,
      backup: true,
    };
    await planning.updateMonthlyReview(month, { status: 'complete', checks });
    expect(await planning.getMonthlyReview(month)).toEqual({
      month,
      status: 'complete',
      checks,
    });
    await expect(
      planning.updateMonthlyReview(month, {
        checks: { ...checks, backup: false },
      })
    ).rejects.toThrow('every');
    await planning.updateMonthlyReview(month, {
      status: 'open',
      checks: { ...checks, backup: false },
    });
    expect((await planning.getMonthlyReview(month)).checks.backup).toBe(false);
    pid = 'other';
    expect((await planning.getMonthlyReview(month)).status).toBe('open');
  });
  it('records changes and guarded undo refuses later content changes but tolerates sync author stamps', async () => {
    const goal = await planning.createSavingsGoal({
      name: 'Goal',
      targetAmount: 1000,
    });
    const created = (await history.getChangeHistory())[0];
    expect(created.canUndo).toBe(true);
    await planning.updateSavingsGoal(goal.id, { name: 'Edited' });
    expect(
      (await history.getChangeHistory()).find(
        (change) => change.id === created.id
      )?.canUndo
    ).toBe(false);
    const edited = (await history.getChangeHistory()).find(
      (change) => change.action === 'update'
    );
    if (!edited) throw new Error('Expected updated goal history');
    sqlite.exec(
      `UPDATE savings_goals SET device_id='device',updated_at=updated_at+1 WHERE id='${goal.id}'`
    );
    await history.undoChange(edited.id);
    expect((await planning.getSavingsGoals())[0].name).toBe('Goal');
    await expect(history.undoChange(edited.id)).rejects.toThrow(
      'cannot be undone'
    );
    expect(
      (await history.getChangeHistory()).find(
        (change) => change.id === created.id
      )?.canUndo
    ).toBe(true);
    await history.undoChange(created.id);
    expect(await planning.getSavingsGoals()).toEqual([]);
  });
  it('restores all new financial feature data in a complete backup', async () => {
    const goal = await planning.createSavingsGoal({
      name: 'Goal',
      targetAmount: 1000,
    });
    await planning.addSavingsContribution(goal.id, 100);
    await planning.updatePlanningPreferences({ minimumBalance: 200 });
    await planning.createNetWorthItem({
      name: 'Asset',
      type: 'asset',
      amount: 50,
    });
    await transactions.createSavedView({
      name: 'Expenses',
      filters: { type: 'expense' },
    });
    await transactions.reconcileStatement({
      accountId: 'account',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      openingBalance: 100,
      closingBalance: 89.99,
    });
    const backup = await exportFinancialBackup(db);
    await planning.deleteSavingsGoal(goal.id);
    await restoreFinancialBackup(db, backup);
    expect((await exportFinancialBackup(db)).tables).toEqual(backup.tables);
  });
});
describe('transaction features and existing financial workflows', () => {
  it('splits money exactly in cents and allocates category/budget reports without doubling cashflow', async () => {
    await transactions.setTransactionSplits(transactionId, [
      { categoryId: 'food', amount: 3.33 },
      { categoryId: 'household', amount: 6.68 },
    ]);
    const ds = createDataService(db as never);
    const splits = await transactions.getTransactionSplits(transactionId);
    expect(splits.map((split) => split.amount).sort()).toEqual([3.33, 6.68]);
    const stats = await ds.getCategoryStats('2026-01-01', '2026-01-31');
    expect(stats.map((row) => row.amount).sort()).toEqual([3.33, 6.68]);
    const budgets = await ds.getBudgets('2026-01');
    expect(budgets.find((budget) => budget.categoryId === 'food')?.spent).toBe(
      3.33
    );
    expect(
      budgets.find((budget) => budget.categoryId === 'household')?.spent
    ).toBe(6.68);
    expect(
      (await ds.getMonthlyStats('2026-01-01', '2026-01-31'))[0].expenses
    ).toBe(10.01);
    expect(
      (await ds.getDashboardStats('2026-01-01', '2026-01-31')).totalExpenses
    ).toBe(10.01);
    const change = (await history.getChangeHistory()).find(
      (row) => row.entityType === 'transaction_splits'
    );
    if (!change) throw new Error('Expected split history');
    await history.undoChange(change.id);
    expect(await transactions.getTransactionSplits(transactionId)).toEqual([]);
  });
  it('rejects incorrect split totals and categories before modifying saved allocations', async () => {
    await expect(
      transactions.setTransactionSplits(transactionId, [
        { categoryId: 'food', amount: 10 },
      ])
    ).rejects.toThrow('equal');
    await expect(
      transactions.setTransactionSplits(transactionId, [
        { categoryId: 'other-category', amount: 10.01 },
      ])
    ).rejects.toThrow('profile');
    await expect(
      transactions.setTransactionSplits(transactionId, [
        { categoryId: 'food', amount: -10.01 },
      ])
    ).rejects.toThrow();
    expect(await transactions.getTransactionSplits(transactionId)).toEqual([]);
  });
  it('persists safe saved views and rejects arbitrary JSON/prototype or invalid dates', async () => {
    const view = await transactions.createSavedView({
      name: 'Bills',
      filters: { search: 'utilities', type: 'expense' },
    });
    expect((await transactions.getSavedViews())[0]).toEqual(view);
    await expect(
      transactions.createSavedView({
        name: 'Bad',
        filters: { sql: 'DROP TABLE users' },
      })
    ).rejects.toThrow();
    await expect(
      transactions.createSavedView({
        name: 'Bad',
        filters: { startDate: '2026-02-31' },
      })
    ).rejects.toThrow();
    await transactions.deleteSavedView(view.id);
    expect(await transactions.getSavedViews()).toEqual([]);
  });
  it('reconciles original transactions including own transfers with inclusive dates and exact cents', async () => {
    sqlite.exec(
      "INSERT INTO transactions(id,date,amount,type,account_id,profile_id) VALUES('transfer','2026-01-01',-20,'transfer','account','profile'),('income','2026-01-31',50,'income','account','profile'),('outside','2026-02-01',99,'income','account','profile')"
    );
    await transactions.setTransactionSplits(transactionId, [
      { categoryId: 'food', amount: 3.33 },
      { categoryId: 'household', amount: 6.68 },
    ]);
    const result = await transactions.reconcileStatement({
      accountId: 'account',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      openingBalance: 100,
      closingBalance: 119.99,
    });
    expect(result).toMatchObject({
      expectedClosingBalance: 119.99,
      actualClosingBalance: 119.99,
      difference: 0,
      transactionCount: 3,
      status: 'matched',
    });
    expect(await transactions.getReconciliations('account')).toEqual([result]);
    await expect(
      transactions.reconcileStatement({
        accountId: 'other-account',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        openingBalance: 0,
        closingBalance: 0,
      })
    ).rejects.toThrow('profile');
  });
  it('rolls unused monthly budget forward while editing uses unscaled base amount', async () => {
    const ds = createDataService(db as never);
    await ds.updateBudget('food-budget', { rolloverEnabled: true });
    const budget = (await ds.getBudgets('2026-02')).find(
      (row) => row.id === 'food-budget'
    );
    if (!budget) throw new Error('Expected rollover budget');
    expect(budget).toMatchObject({
      baseAmount: 100,
      carryover: 89.99,
      amount: 189.99,
      rolloverEnabled: true,
    });
    await ds.updateBudget('food-budget', { amount: budget.baseAmount });
    expect(
      (await ds.getBudgets('2026-02')).find((row) => row.id === 'food-budget')
        ?.amount
    ).toBe(189.99);
  });
  it('records transaction updates/deletes and bulk categorization for guarded undo', async () => {
    const ds = createDataService(db as never);
    await ds.updateTransaction(transactionId, {
      notes: 'Review',
      categoryId: 'household',
    });
    const updated = (await history.getChangeHistory())[0];
    await history.undoChange(updated.id);
    expect(
      sqlite
        .prepare('SELECT notes,category_id FROM transactions WHERE id=?')
        .get(transactionId)
    ).toEqual({ notes: null, category_id: 'food' });
    await ds.bulkCategorize([transactionId], 'household');
    const batch = (await history.getChangeHistory()).find(
      (row) => row.action === 'categorize'
    );
    if (!batch) throw new Error('Expected categorization history');
    await history.undoChange(batch.id);
    expect(
      sqlite
        .prepare('SELECT category_id FROM transactions WHERE id=?')
        .get(transactionId)
    ).toEqual({ category_id: 'food' });
    await ds.deleteTransaction(transactionId);
    const deleted = (await history.getChangeHistory()).find(
      (row) => row.action === 'delete'
    );
    if (!deleted) throw new Error('Expected deletion history');
    await history.undoChange(deleted.id);
    expect(
      sqlite
        .prepare('SELECT is_deleted FROM transactions WHERE id=?')
        .get(transactionId)
    ).toEqual({ is_deleted: 0 });
  });
  it('includes unassigned-account expenses consistently and applies accent-insensitive regex rules', async () => {
    sqlite.exec(
      "INSERT INTO transactions(id,date,amount,type,merchant_name,account_id,profile_id) VALUES('unassigned','2026-01-31',-5,'expense','Café Merchant',NULL,'profile')"
    );
    const ds = createDataService(db as never);
    expect(
      (await ds.getMonthlyStats('2026-01-01', '2026-01-31'))[0].expenses
    ).toBe(15.01);
    expect(
      (await ds.getDailyExpenses('2026-01-31', '2026-01-31'))[0].expenses
    ).toBe(15.01);
    expect(
      (await ds.applyCategoryRuleToTransactions('^cafe', 'household')).updated
    ).toBe(1);
    expect(
      sqlite
        .prepare("SELECT category_id FROM transactions WHERE id='unassigned'")
        .get()
    ).toEqual({ category_id: 'household' });
    expect(
      (await ds.applyCategoryRuleToTransactions('[', 'household')).updated
    ).toBe(0);
  });
  it('stores signed recurring amounts and date-only renewal fields without accepting invalid input', async () => {
    sqlite.exec(
      "INSERT INTO recurring_patterns(id,merchant_name,pattern_type,avg_amount,last_date,profile_id,is_confirmed) VALUES('pattern','Bill','monthly',-10,'2026-01-31','profile',1)"
    );
    const ds = createDataService(db as never);
    await ds.updateRecurringPattern('pattern', {
      avgAmount: -11,
      renewalDate: '2026-12-31',
      cancellationDeadline: '2026-11-30',
    });
    expect((await ds.getRecurringPatterns())[0]).toMatchObject({
      avgAmount: -11,
      renewalDate: '2026-12-31',
      cancellationDeadline: '2026-11-30',
    });
    await expect(
      ds.updateRecurringPattern('pattern', { avgAmount: Infinity })
    ).rejects.toThrow();
    await expect(
      ds.updateRecurringPattern('pattern', { renewalDate: '2026-02-31' })
    ).rejects.toThrow();
  });
  it.each(['nl', 'en'] as const)(
    'creates planning demo data in %s at creation time',
    async (language) => {
      const expected = getFinancialPlanningDemoData(language);
      await db.transactionAsync(() =>
        seedFinancialPlanningDemo(db, 'profile', language, {
          accountId: 'account',
          categoryIds: ['food', 'household'],
          transaction: { id: transactionId, amount: -10.01 },
          statement: {
            startDate: '2026-01-01',
            endDate: '2026-01-31',
            amount: -10.01,
            count: 1,
          },
        })
      );
      expect(
        (await planning.getSavingsGoals()).map((goal) => goal.name).sort()
      ).toEqual(expected.goals.map((goal) => goal.name).sort());
      expect(
        (await planning.getSavingsGoals())
          .map((goal) => goal.currentAmount)
          .sort()
      ).toEqual([1250, 450]);
      expect((await transactions.getSavedViews())[0].name).toBe(
        expected.copy.uncategorizedSpending
      );
      expect(
        await transactions.getTransactionSplits(transactionId)
      ).toHaveLength(2);
      expect((await history.getChangeHistory()).length).toBeGreaterThan(0);
    }
  );
});
