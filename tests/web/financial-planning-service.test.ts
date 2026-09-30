import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SQLite from 'better-sqlite3';
import { SCHEMA_SQL } from '../../packages/database/src/schema';
import { migration006 } from '../../packages/database/src/migrations/006_recurring_dismissed';
import { migration013 } from '../../packages/database/src/migrations/013_subscription_dismissed_alerts';
import { migration015 } from '../../packages/database/src/migrations/015_profile_sync_state';
import { migration016 } from '../../packages/database/src/migrations/016_financial_planning';
import { migration017 } from '../../packages/database/src/migrations/017_remove_transaction_tools';
import { createFinancialPlanningService } from '@/lib/data/financial-planning';
import { createSavedTransactionViewsService } from '@/lib/data/saved-transaction-views';
import {
  exportFinancialBackup,
  restoreFinancialBackup,
  validateFinancialBackup,
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
let savedViews: ReturnType<typeof createSavedTransactionViewsService>;
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
    migration017,
  ])
    await migration.up(db);
  sqlite.exec(`INSERT INTO schema_version(version) VALUES(17);
    INSERT INTO users(id,name) VALUES('user','User');
    INSERT INTO profiles(id,user_id,name) VALUES('profile','user','Personal'),('other','user','Other');
    INSERT INTO accounts(id,iban,name,current_balance,profile_id) VALUES('account','NL00TEST','Account',2000,'profile'),('other-account','NL00OTHER','Other',9000,'other');
    INSERT INTO categories(id,name,profile_id) VALUES('food','Food','profile'),('household','Household','profile'),('other-category','Other','other');
    INSERT INTO transactions(id,date,amount,type,account_id,category_id,profile_id) VALUES('${transactionId}','2026-01-31',-10.01,'expense','account','food','profile');
    INSERT INTO budgets(id,category_id,amount,profile_id,created_at) VALUES('food-budget','food',100,'profile',1767225600000),('household-budget','household',100,'profile',1767225600000);`);
  pid = 'profile';
  planning = createFinancialPlanningService(db, () => pid);
  savedViews = createSavedTransactionViewsService(db, () => pid);
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
    await savedViews.createSavedView({
      name: 'Expenses',
      filters: { type: 'expense' },
    });
    const backup = await exportFinancialBackup(db);
    await planning.deleteSavingsGoal(goal.id);
    await restoreFinancialBackup(db, backup);
    expect((await exportFinancialBackup(db)).tables).toEqual(backup.tables);
  });
  it('upgrades a version 16 backup without restoring retired transaction tools', async () => {
    await migration017.down(db);
    sqlite.exec(`UPDATE schema_version SET version=16;
      INSERT INTO transaction_splits(id,transaction_id,category_id,amount,profile_id)
        VALUES('old-split','${transactionId}','food',10.01,'profile');
      INSERT INTO statement_reconciliations(id,account_id,start_date,end_date,opening_balance,actual_closing_balance,expected_closing_balance,difference,transaction_count,status,profile_id)
        VALUES('old-statement','account','2026-01-01','2026-01-31',100,89.99,89.99,0,1,'matched','profile');
      INSERT INTO change_history(id,entity_type,entity_id,action,description,profile_id)
        VALUES('old-change','transactions','${transactionId}','update','old','profile');`);
    const oldBackup = await exportFinancialBackup(db);
    sqlite.exec('UPDATE schema_version SET version=17');
    await migration017.up(db);
    expect(
      sqlite
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('transaction_splits','statement_reconciliations','change_history')"
        )
        .all()
    ).toEqual([]);
    const preview = await validateFinancialBackup(db, oldBackup);
    expect(preview.rows).toBe(
      Object.values(oldBackup.tables).reduce(
        (sum, rows) => sum + rows.length,
        0
      ) - 3
    );
    await restoreFinancialBackup(db, oldBackup);
    expect(
      sqlite
        .prepare('SELECT amount,category_id FROM transactions WHERE id=?')
        .get(transactionId)
    ).toEqual({ amount: -10.01, category_id: 'food' });
    expect((await exportFinancialBackup(db)).tableManifest).not.toContain(
      'transaction_splits'
    );
  });
});
describe('saved views and existing financial workflows', () => {
  it('persists safe saved views and rejects arbitrary JSON/prototype or invalid dates', async () => {
    const view = await savedViews.createSavedView({
      name: 'Bills',
      filters: { search: 'utilities', type: 'expense' },
    });
    expect((await savedViews.getSavedViews())[0]).toEqual(view);
    await expect(
      savedViews.createSavedView({
        name: 'Bad',
        filters: { sql: 'DROP TABLE users' },
      })
    ).rejects.toThrow();
    await expect(
      savedViews.createSavedView({
        name: 'Bad',
        filters: { startDate: '2026-02-31' },
      })
    ).rejects.toThrow();
    await savedViews.deleteSavedView(view.id);
    expect(await savedViews.getSavedViews()).toEqual([]);
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
        seedFinancialPlanningDemo(db, 'profile', language)
      );
      expect(
        (await planning.getSavingsGoals()).map((goal) => goal.name).sort()
      ).toEqual(expected.goals.map((goal) => goal.name).sort());
      expect(
        (await planning.getSavingsGoals())
          .map((goal) => goal.currentAmount)
          .sort()
      ).toEqual([1250, 450]);
      expect((await savedViews.getSavedViews())[0].name).toBe(
        expected.copy.uncategorizedSpending
      );
    }
  );
});
