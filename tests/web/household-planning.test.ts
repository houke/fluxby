import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SQLite from 'better-sqlite3';
import { SCHEMA_SQL } from '../../packages/database/src/schema';
import { migration006 } from '../../packages/database/src/migrations/006_recurring_dismissed';
import { migration016 } from '../../packages/database/src/migrations/016_financial_planning';
import { migration019 } from '../../packages/database/src/migrations/019_transaction_review';
import { migration021 } from '../../packages/database/src/migrations/021_household_budgets';
import { migration020 } from '../../packages/database/src/migrations/020_household_planning';
import {
  cashflowDates,
  createHouseholdPlanningService,
  goalMonthlyNeed,
  weekStart,
} from '@/lib/data/household-planning';
import { createFinancialPlanningService } from '@/lib/data/financial-planning';
let sqlite: SQLite.Database;
let pid = 'profile';
function adapter() {
  return {
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
      const r = sqlite.prepare(sql).run(...params);
      return { changes: r.changes, lastInsertRowId: Number(r.lastInsertRowid) };
    },
    transactionAsync: async <T>(fn: () => Promise<T>) => {
      sqlite.exec('BEGIN');
      try {
        const result = await fn();
        sqlite.exec('COMMIT');
        return result;
      } catch (e) {
        sqlite.exec('ROLLBACK');
        throw e;
      }
    },
  };
}
let service: ReturnType<typeof createHouseholdPlanningService>;
let base: ReturnType<typeof createFinancialPlanningService>;
beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
  sqlite = new SQLite(':memory:');
  sqlite.pragma('foreign_keys=ON');
  sqlite.exec(SCHEMA_SQL);
  const db = adapter();
  for (const migration of [
    migration006,
    migration016,
    migration019,
    migration020,
    migration021,
  ])
    await migration.up(db);
  sqlite.exec(`
 INSERT INTO users(id,name) VALUES('user','User');
 INSERT INTO profiles(id,user_id,name) VALUES('profile','user','Personal'),('other','user','Other');
 INSERT INTO accounts(id,iban,name,current_balance,profile_id,type,kind) VALUES('account','NL00TEST','Account',1000,'profile','checking',NULL),('investment','local:investment','Portfolio',50000,'profile','savings','investment'),('other-account','NL00OTHER','Other',9000,'other','checking',NULL);
 INSERT INTO transactions(id,date,amount,type,account_id,profile_id) VALUES('income','2026-01-01',200,'income','account','profile'),('other-income','2026-01-01',1000,'income','other-account','other');`);
  pid = 'profile';
  service = createHouseholdPlanningService(db, () => pid);
  base = createFinancialPlanningService(db, () => pid);
});
afterEach(() => {
  sqlite.close();
  vi.useRealTimers();
});
const expense = {
  name: 'Insurance',
  kind: 'expense' as const,
  amount: 300,
  dueDate: '2026-01-10',
  frequency: 'once' as const,
  reserved: 100,
  recurringPatternId: null,
};
describe('household cashflow planning', () => {
  it('anchors calendar months and Dutch four-week pay across month boundaries', () => {
    expect(
      cashflowDates('2026-01-31', 'monthly', '2026-01-01', '2026-04-01')
    ).toEqual(['2026-01-31', '2026-02-28', '2026-03-31']);
    expect(
      cashflowDates('2026-01-02', 'fourweekly', '2026-01-01', '2026-03-01')
    ).toEqual(['2026-01-02', '2026-01-30', '2026-02-27']);
    expect(() =>
      cashflowDates('2026-02-30', 'once', '2026-01-01', '2026-04-01')
    ).toThrow();
  });
  it('releases a reserve when paying once and excludes investments from spendable cash', async () => {
    await service.savePlannedCashflow(expense);
    const result = await service.getDailyForecast(30);
    expect(result.availableBalance).toBe(1000);
    expect(result.points[0].spendable).toBe(900);
    expect(result.points[9].balance).toBe(700);
    expect(result.points[9].spendable).toBe(700);
    expect(result.safeToSpend).toBe(700);
    expect(result.upcomingObligations).toBe(300);
  });
  it('uses dated income, variable spending and a buffer to locate the first shortfall', async () => {
    await base.updatePlanningPreferences({ minimumBalance: 500 });
    await service.updateVariableDaily(10);
    await service.savePlannedCashflow({ ...expense, amount: 600, reserved: 0 });
    await service.savePlannedCashflow({
      ...expense,
      name: 'Salary',
      kind: 'income',
      amount: 1000,
      reserved: 0,
      dueDate: '2026-01-20',
    });
    const result = await service.getDailyForecast();
    expect(result.firstShortfall).toBe('2026-01-10');
    expect(result.lowestDate).toBe('2026-01-19');
    expect(result.lowestBalance).toBe(210);
    expect(result.safeToSpend).toBe(-290);
    expect(result.perDay).toBe(0);
    expect(result.nextIncome).toBe('2026-01-20');
  });
  it('retains reserves outside the horizon and rejects foreign-profile edits', async () => {
    await service.savePlannedCashflow({ ...expense, dueDate: '2026-12-01' });
    const [flow] = await service.getPlannedCashflows();
    expect((await service.getDailyForecast()).safeToSpend).toBe(900);
    pid = 'other';
    await expect(service.savePlannedCashflow(expense, flow.id)).rejects.toThrow(
      'not found'
    );
    await service.deletePlannedCashflow(flow.id);
    pid = 'profile';
    expect(await service.getPlannedCashflows()).toHaveLength(1);
  });
  it('does not count a linked recurring bill twice', async () => {
    sqlite.exec(
      `INSERT INTO recurring_patterns(id,merchant_name,pattern_type,avg_amount,last_date,next_expected_date,is_active,is_confirmed,profile_id) VALUES('bill','Insurance','monthly',-300,'2025-12-10','2026-01-10',1,1,'profile');`
    );
    await service.savePlannedCashflow({
      ...expense,
      recurringPatternId: 'bill',
    });
    expect((await service.getDailyForecast()).upcomingObligations).toBe(300);
    expect((await service.getDailyForecast(60)).upcomingObligations).toBe(600);
    await expect(
      service.savePlannedCashflow({ ...expense, recurringPatternId: 'bill' })
    ).rejects.toThrow('already');
  });
  it('keeps manual savings, caps linked transaction allocations and preserves archived goals', async () => {
    const goal = await base.createSavingsGoal({
      name: 'Holiday',
      targetAmount: 1000,
      deadline: '2026-04-01',
      monthlyContribution: 100,
    });
    await base.addSavingsContribution(goal.id, 100);
    await service.addGoalTransactionContribution(goal.id, 'income', 150);
    expect((await service.getSavingsGoals())[0].currentAmount).toBe(250);
    const second = await base.createSavingsGoal({
      name: 'Buffer',
      targetAmount: 1000,
    });
    await expect(
      service.addGoalTransactionContribution(second.id, 'income', 51)
    ).rejects.toThrow('exceeds');
    await expect(
      service.addGoalTransactionContribution(goal.id, 'other-income', 1)
    ).rejects.toThrow('not found');
    await service.setSavingsGoalArchived(goal.id, true);
    expect((await service.getSavingsGoals()).map((g) => g.id)).not.toContain(
      goal.id
    );
    expect(
      (await service.getGoalPlanning()).find((g) => g.id === goal.id)
        ?.currentAmount
    ).toBe(250);
    await service.setSavingsGoalArchived(goal.id, false);
    sqlite.exec("UPDATE transactions SET is_deleted=1 WHERE id='income'");
    expect(
      (await service.getSavingsGoals()).find((g) => g.id === goal.id)
        ?.currentAmount
    ).toBe(100);
  });
  it('shows a 30-day net-worth change only for two complete exact-date snapshots', async () => {
    await service.saveNetWorthSnapshot();
    expect((await service.getNetWorthHistory()).change30Days).toBeNull();
    vi.setSystemTime(new Date('2026-01-31T12:00:00Z'));
    sqlite.exec("UPDATE accounts SET current_balance=1100 WHERE id='account'");
    await service.saveNetWorthSnapshot();
    expect((await service.getNetWorthHistory()).change30Days).toBe(100);
    await service.saveNetWorthSnapshot();
    expect((await service.getNetWorthHistory()).snapshots).toHaveLength(2);
    sqlite.exec(
      "UPDATE net_worth_snapshots SET complete=0 WHERE date='2026-01-01'"
    );
    expect((await service.getNetWorthHistory()).change30Days).toBeNull();
  });
  it('persists weekly completion and counts only consecutive completed weeks', async () => {
    expect(weekStart('2026-01-04')).toBe('2025-12-29');
    const checks = {
      imports: true,
      transactions: true,
      bills: true,
      budget: true,
    };
    await service.updateWeeklyReview('2025-12-29', checks);
    await service.updateWeeklyReview('2026-01-05', checks);
    expect((await service.getWeeklyReview('2026-01-07')).streak).toBe(2);
    await service.updateWeeklyReview('2026-01-05', {
      ...checks,
      budget: false,
    });
    expect((await service.getWeeklyReview('2026-01-07')).status).toBe('open');
    expect((await service.getWeeklyReview('2026-01-14')).streak).toBe(0);
  });
  it('rounds goal guidance up to cents and keeps past deadlines actionable', () => {
    expect(
      goalMonthlyNeed(
        { targetAmount: 100, currentAmount: 0, deadline: '2026-04-01' },
        '2026-01-01'
      )
    ).toBe(33.34);
    expect(
      goalMonthlyNeed(
        { targetAmount: 100, currentAmount: 10, deadline: '2025-01-01' },
        '2026-01-01'
      )
    ).toBe(90);
    expect(
      goalMonthlyNeed(
        { targetAmount: 100, currentAmount: 110, deadline: '2026-04-01' },
        '2026-01-01'
      )
    ).toBe(0);
  });
  it('separates investment assets and signed debt balances in net worth', async () => {
    sqlite.exec(
      "INSERT INTO accounts(id,iban,name,current_balance,profile_id,type,kind) VALUES('loan','local:loan','Loan',-5000,'profile','credit','loan')"
    );
    const worth = await service.getNetWorth();
    expect(worth.cash).toBe(1000);
    expect(worth.assets).toBe(50000);
    expect(worth.liabilities).toBe(5000);
    expect(worth.total).toBe(46000);
  });
  it('does not freeze a reserve after a one-off payment has passed', async () => {
    await service.savePlannedCashflow({ ...expense, dueDate: '2025-12-30' });
    expect((await service.getDailyForecast()).safeToSpend).toBe(1000);
  });
  it('estimates variable spending net of reimbursements and excludes fixed and projected recurring costs', async () => {
    sqlite.exec(`
      INSERT INTO categories(id,name,profile_id) VALUES('fixed','Rent','profile'),('variable','Shopping','profile');
      INSERT INTO category_preferences(id,category_id,is_fixed,profile_id,created_at,updated_at) VALUES('fixed-pref','fixed',1,'profile',0,0);
      INSERT INTO recurring_patterns(id,merchant_name,pattern_type,avg_amount,last_date,next_expected_date,is_active,is_confirmed,profile_id) VALUES('bill','Phone','monthly',-100,'2025-12-10','2026-01-10',1,1,'profile');
      INSERT INTO transactions(id,date,amount,type,account_id,profile_id,category_id,merchant_name) VALUES
        ('rent','2025-10-10',-1000,'expense','account','profile','fixed','Rent'),
        ('phone','2025-11-10',-100,'expense','account','profile','variable','Phone'),
        ('shopping','2025-12-10',-1000,'expense','account','profile','variable','Shopping');
      INSERT INTO transaction_links(id,source_id,target_id,kind,relation_type,amount,profile_id,created_at,updated_at) VALUES('reimbursement','income','shopping','refund','reimbursement',80,'profile',0,0);
    `);
    // October through December have 92 days: (1000 - 80) / 92 = 10 per day.
    expect(await service.getHistoricalVariableDaily()).toBe(1000);
    expect((await service.getDailyForecast()).variableDaily).toBe(10);
    expect((await service.getDailyForecast()).variableDailySource).toBe(
      'history'
    );
    await service.updateVariableDaily(5);
    expect((await service.getDailyForecast()).variableDaily).toBe(5);
    await service.resetVariableDaily();
    expect((await service.getDailyForecast()).variableDaily).toBe(10);
  });
});
