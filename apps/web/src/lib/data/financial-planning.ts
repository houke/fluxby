import {
  addDaysToDateOnly,
  addMonthsToDateOnly,
  formatDateISO,
  type SavingsGoal,
  type SavingsGoalInput,
  type PlanningPreferences,
  type SafeToSpendSummary,
  type NetWorthItem,
  type NetWorthItemInput,
  type NetWorthSummary,
  type MonthlyReview,
  type PatternType,
} from '@fluxby/shared';
import type { Database } from '@fluxby/database';

export type FinancialDatabase = Pick<
  Database,
  'queryAsync' | 'queryOneAsync' | 'runAsync' | 'transactionAsync'
>;

export function moneyCents(value: number, allowNegative = false): number {
  if (
    !Number.isFinite(value) ||
    (!allowNegative && value < 0) ||
    !Number.isSafeInteger(Math.round(value * 100))
  )
    throw new Error('Invalid monetary amount');
  return Math.round(value * 100);
}
export function validateDateOnly(value: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(`${value}T00:00:00Z`)) ||
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value
  )
    throw new Error('Invalid date');
}
function name(value: string): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 200)
    throw new Error('A name is required');
  return value.trim();
}
function goalInput(input: Partial<SavingsGoalInput>) {
  if (input.name !== undefined) name(input.name);
  if (input.targetAmount !== undefined && moneyCents(input.targetAmount) <= 0)
    throw new Error('Goal target must be positive');
  if (input.monthlyContribution !== undefined)
    moneyCents(input.monthlyContribution);
  if (input.deadline !== undefined && input.deadline !== null)
    validateDateOnly(input.deadline);
}
function advance(base: string, frequency: PatternType, count: number) {
  if (frequency === 'weekly' || frequency === 'biweekly')
    return addDaysToDateOnly(base, count * (frequency === 'weekly' ? 7 : 14));
  return addMonthsToDateOnly(
    base,
    count * ({ monthly: 1, quarterly: 3, yearly: 12 }[frequency] ?? 1)
  );
}
export function createFinancialPlanningService(
  db: FinancialDatabase,
  currentProfileId: () => string | null
) {
  const profile = () => {
    const pid = currentProfileId();
    if (!pid) throw new Error('No active profile');
    return pid;
  };
  const service = {
    async getSavingsGoals(): Promise<SavingsGoal[]> {
      const pid = currentProfileId();
      if (!pid) return [];
      return db.queryAsync<SavingsGoal>(
        `SELECT g.id,g.name,g.target_amount AS targetAmount,g.deadline,g.monthly_contribution AS monthlyContribution,
        COALESCE(SUM(c.amount),0) AS currentAmount FROM savings_goals g
        LEFT JOIN savings_contributions c ON c.goal_id=g.id AND c.profile_id=g.profile_id AND c.is_deleted=0
        WHERE g.profile_id=? AND g.is_deleted=0 GROUP BY g.id ORDER BY g.deadline IS NULL,g.deadline,g.name`,
        [pid]
      );
    },
    async createSavingsGoal(input: SavingsGoalInput): Promise<SavingsGoal> {
      goalInput(input);
      const pid = profile(),
        id = crypto.randomUUID(),
        now = Date.now();
      await db.transactionAsync(async () => {
        await db.runAsync(
          'INSERT INTO savings_goals(id,name,target_amount,deadline,monthly_contribution,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)',
          [
            id,
            name(input.name),
            moneyCents(input.targetAmount) / 100,
            input.deadline ?? null,
            moneyCents(input.monthlyContribution ?? 0) / 100,
            pid,
            now,
            now,
          ]
        );
      });
      const created = (await service.getSavingsGoals()).find(
        (goal) => goal.id === id
      );
      if (!created) throw new Error('Savings goal was not created');
      return created;
    },
    async updateSavingsGoal(
      id: string,
      input: Partial<SavingsGoalInput>
    ): Promise<void> {
      goalInput(input);
      const pid = profile();
      await db.transactionAsync(async () => {
        const goal = await db.queryOneAsync<{
          name: string;
          target_amount: number;
          deadline: string | null;
          monthly_contribution: number;
        }>(
          'SELECT * FROM savings_goals WHERE id=? AND profile_id=? AND is_deleted=0',
          [id, pid]
        );
        if (!goal) throw new Error('Savings goal not found');
        await db.runAsync(
          'UPDATE savings_goals SET name=?,target_amount=?,deadline=?,monthly_contribution=?,updated_at=? WHERE id=? AND profile_id=?',
          [
            input.name === undefined ? goal.name : name(input.name),
            input.targetAmount === undefined
              ? goal.target_amount
              : moneyCents(input.targetAmount) / 100,
            input.deadline === undefined ? goal.deadline : input.deadline,
            input.monthlyContribution === undefined
              ? goal.monthly_contribution
              : moneyCents(input.monthlyContribution) / 100,
            Date.now(),
            id,
            pid,
          ]
        );
      });
    },
    async deleteSavingsGoal(id: string): Promise<void> {
      const pid = profile();
      await db.transactionAsync(async () => {
        await db.runAsync(
          'UPDATE savings_goals SET is_deleted=1,updated_at=? WHERE id=? AND profile_id=?',
          [Date.now(), id, pid]
        );
      });
    },
    async addSavingsContribution(
      goalId: string,
      amount: number
    ): Promise<SavingsGoal> {
      const cents = moneyCents(amount);
      if (cents <= 0) throw new Error('Contribution must be positive');
      const pid = profile(),
        id = crypto.randomUUID(),
        now = Date.now();
      await db.transactionAsync(async () => {
        const goal = await db.queryOneAsync(
          'SELECT id FROM savings_goals WHERE id=? AND profile_id=? AND is_deleted=0',
          [goalId, pid]
        );
        if (!goal) throw new Error('Savings goal not found');
        await db.runAsync(
          'INSERT INTO savings_contributions(id,goal_id,amount,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?)',
          [id, goalId, cents / 100, pid, now, now]
        );
      });
      const updated = (await service.getSavingsGoals()).find(
        (goal) => goal.id === goalId
      );
      if (!updated) throw new Error('Savings goal was not updated');
      return updated;
    },
    async getPlanningPreferences(): Promise<PlanningPreferences> {
      const pid = currentProfileId();
      if (!pid) return { minimumBalance: 0, reservedSavings: 0 };
      return (
        (await db.queryOneAsync<PlanningPreferences>(
          'SELECT minimum_balance AS minimumBalance,reserved_savings AS reservedSavings FROM planning_preferences WHERE profile_id=? AND is_deleted=0',
          [pid]
        )) ?? { minimumBalance: 0, reservedSavings: 0 }
      );
    },
    async updatePlanningPreferences(
      input: Partial<PlanningPreferences>
    ): Promise<void> {
      if (input.minimumBalance !== undefined) moneyCents(input.minimumBalance);
      if (input.reservedSavings !== undefined)
        moneyCents(input.reservedSavings);
      const pid = profile();
      const existing = await db.queryOneAsync<{
        id: string;
        minimum_balance: number;
        reserved_savings: number;
      }>('SELECT * FROM planning_preferences WHERE profile_id=?', [pid]);
      const id = existing?.id ?? crypto.randomUUID(),
        now = Date.now();
      await db.transactionAsync(async () => {
        await db.runAsync(
          `INSERT INTO planning_preferences(id,minimum_balance,reserved_savings,profile_id,created_at,updated_at)
          VALUES(?,?,?,?,?,?) ON CONFLICT(profile_id) DO UPDATE SET minimum_balance=excluded.minimum_balance,reserved_savings=excluded.reserved_savings,is_deleted=0,updated_at=excluded.updated_at`,
          [
            id,
            moneyCents(input.minimumBalance ?? existing?.minimum_balance ?? 0) /
              100,
            moneyCents(
              input.reservedSavings ?? existing?.reserved_savings ?? 0
            ) / 100,
            pid,
            now,
            now,
          ]
        );
      });
    },
    async getSafeToSpend(): Promise<SafeToSpendSummary> {
      const pid = profile(),
        startDate = formatDateISO(new Date()),
        endDate = addDaysToDateOnly(startDate, 29);
      const preferences = await service.getPlanningPreferences();
      const cash = await db.queryOneAsync<{ total: number }>(
        'SELECT COALESCE(SUM(current_balance),0) AS total FROM accounts WHERE profile_id=? AND is_deleted=0',
        [pid]
      );
      const patterns = await db.queryAsync<{
        avg_amount: number;
        last_date: string;
        next_expected_date: string | null;
        pattern_type: PatternType;
      }>(
        `SELECT avg_amount,last_date,next_expected_date,pattern_type FROM recurring_patterns
        WHERE profile_id=? AND is_deleted=0 AND is_dismissed=0 AND is_active=1 AND avg_amount<0 AND (last_date>=? OR is_confirmed=1)`,
        [pid, addMonthsToDateOnly(startDate, -12)]
      );
      let obligationCents = 0;
      for (const pattern of patterns) {
        if (!pattern.last_date) continue;
        validateDateOnly(pattern.last_date);
        const base =
          pattern.next_expected_date ??
          advance(pattern.last_date, pattern.pattern_type, 1);
        validateDateOnly(base);
        for (let count = 0; count < 1500; count++) {
          const date = advance(base, pattern.pattern_type, count);
          if (date > endDate) break;
          if (date >= startDate)
            obligationCents += moneyCents(Math.abs(pattern.avg_amount));
        }
      }
      const goals = await service.getSavingsGoals();
      const goalCents = goals.reduce(
        (sum, goal) =>
          sum +
          Math.min(
            moneyCents(goal.monthlyContribution),
            Math.max(
              0,
              moneyCents(goal.targetAmount) - moneyCents(goal.currentAmount)
            )
          ),
        0
      );
      const availableCents = moneyCents(cash?.total ?? 0, true);
      return {
        ...preferences,
        availableBalance: availableCents / 100,
        upcomingObligations: obligationCents / 100,
        goalReservations: goalCents / 100,
        safeToSpend:
          (availableCents -
            obligationCents -
            goalCents -
            moneyCents(preferences.minimumBalance) -
            moneyCents(preferences.reservedSavings)) /
          100,
        startDate,
        endDate,
      };
    },
    async getNetWorth(): Promise<NetWorthSummary> {
      const pid = profile();
      const items = await db.queryAsync<NetWorthItem>(
        'SELECT id,name,type,amount FROM net_worth_items WHERE profile_id=? AND is_deleted=0 ORDER BY type,name',
        [pid]
      );
      const balance = await db.queryOneAsync<{ cash: number }>(
        'SELECT COALESCE(SUM(current_balance),0) AS cash FROM accounts WHERE profile_id=? AND is_deleted=0',
        [pid]
      );
      const cash = moneyCents(balance?.cash ?? 0, true),
        assets = items
          .filter((item) => item.type === 'asset')
          .reduce((sum, item) => sum + moneyCents(item.amount), 0),
        liabilities = items
          .filter((item) => item.type === 'liability')
          .reduce((sum, item) => sum + moneyCents(item.amount), 0);
      return {
        cash: cash / 100,
        assets: assets / 100,
        liabilities: liabilities / 100,
        total: (cash + assets - liabilities) / 100,
        items,
      };
    },
    async createNetWorthItem(input: NetWorthItemInput): Promise<NetWorthItem> {
      if (!['asset', 'liability'].includes(input.type))
        throw new Error('Invalid net-worth item type');
      const pid = profile(),
        id = crypto.randomUUID(),
        now = Date.now(),
        item = {
          id,
          name: name(input.name),
          type: input.type,
          amount: moneyCents(input.amount) / 100,
        };
      await db.transactionAsync(async () => {
        await db.runAsync(
          'INSERT INTO net_worth_items(id,name,type,amount,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',
          [id, item.name, item.type, item.amount, pid, now, now]
        );
      });
      return item;
    },
    async updateNetWorthItem(
      id: string,
      input: Partial<NetWorthItemInput>
    ): Promise<void> {
      if (input.name !== undefined) name(input.name);
      if (input.amount !== undefined) moneyCents(input.amount);
      if (
        input.type !== undefined &&
        !['asset', 'liability'].includes(input.type)
      )
        throw new Error('Invalid net-worth item type');
      const pid = profile();
      await db.transactionAsync(async () => {
        const item = await db.queryOneAsync<NetWorthItem>(
          'SELECT id,name,type,amount FROM net_worth_items WHERE id=? AND profile_id=? AND is_deleted=0',
          [id, pid]
        );
        if (!item) throw new Error('Net-worth item not found');
        await db.runAsync(
          'UPDATE net_worth_items SET name=?,type=?,amount=?,updated_at=? WHERE id=? AND profile_id=?',
          [
            input.name === undefined ? item.name : name(input.name),
            input.type ?? item.type,
            input.amount === undefined
              ? item.amount
              : moneyCents(input.amount) / 100,
            Date.now(),
            id,
            pid,
          ]
        );
      });
    },
    async deleteNetWorthItem(id: string): Promise<void> {
      const pid = profile();
      await db.transactionAsync(async () => {
        await db.runAsync(
          'UPDATE net_worth_items SET is_deleted=1,updated_at=? WHERE id=? AND profile_id=?',
          [Date.now(), id, pid]
        );
      });
    },
    async getMonthlyReview(month: string): Promise<MonthlyReview> {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
        throw new Error('Invalid review month');
      const pid = profile();
      const row = await db.queryOneAsync<{
        status: 'open' | 'complete';
        checks_json: string;
      }>(
        'SELECT status,checks_json FROM monthly_reviews WHERE profile_id=? AND month=? AND is_deleted=0',
        [pid, month]
      );
      return {
        month,
        status: row?.status ?? 'open',
        checks: row ? JSON.parse(row.checks_json) : {},
      };
    },
    async updateMonthlyReview(
      month: string,
      input: Partial<Pick<MonthlyReview, 'checks' | 'status'>>
    ): Promise<void> {
      const current = await service.getMonthlyReview(month),
        pid = profile();
      if (
        input.status !== undefined &&
        !['open', 'complete'].includes(input.status)
      )
        throw new Error('Invalid review status');
      if (
        input.checks !== undefined &&
        (typeof input.checks !== 'object' ||
          input.checks === null ||
          Array.isArray(input.checks) ||
          Object.entries(input.checks).some(
            ([key, value]) =>
              !/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(key) ||
              typeof value !== 'boolean'
          ))
      )
        throw new Error('Invalid review checklist');
      const checks = input.checks ?? current.checks;
      const status = input.status ?? current.status;
      if (
        status === 'complete' &&
        ![
          'uncategorized',
          'spending',
          'budgets',
          'subscriptions',
          'backup',
        ].every((key) => checks[key] === true)
      ) {
        throw new Error(
          'Finish every monthly review step before completing the review'
        );
      }
      const existing = await db.queryOneAsync<{ id: string }>(
        'SELECT id FROM monthly_reviews WHERE profile_id=? AND month=?',
        [pid, month]
      );
      const id = existing?.id ?? crypto.randomUUID(),
        now = Date.now();
      await db.transactionAsync(async () => {
        await db.runAsync(
          `INSERT INTO monthly_reviews(id,month,status,checks_json,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?)
          ON CONFLICT(profile_id,month) DO UPDATE SET status=excluded.status,checks_json=excluded.checks_json,is_deleted=0,updated_at=excluded.updated_at`,
          [id, month, status, JSON.stringify(checks), pid, now, now]
        );
      });
    },
  };
  return service;
}
