import {
  addDaysToDateOnly,
  addMonthsToDateOnly,
  formatDateISO,
  type SavingsGoal,
  type SafeToSpendSummary,
} from '@fluxby/shared';
import {
  createFinancialPlanningService,
  moneyCents,
  validateDateOnly,
  type FinancialDatabase,
} from './financial-planning';

export type CashflowFrequency =
  'once' | 'monthly' | 'fourweekly' | 'quarterly' | 'yearly';
export interface PlannedCashflow {
  id: string;
  name: string;
  kind: 'income' | 'expense';
  amount: number;
  dueDate: string;
  frequency: CashflowFrequency;
  reserved: number;
  recurringPatternId: string | null;
}
export type CashflowInput = Omit<PlannedCashflow, 'id'>;
export interface ForecastPoint {
  date: string;
  income: number;
  expenses: number;
  balance: number;
  spendable: number;
}
export interface DailyForecast {
  points: ForecastPoint[];
  lowestBalance: number;
  lowestDate: string;
  firstShortfall: string | null;
  safeToSpend: number;
  perDay: number;
  nextIncome: string | null;
  variableDaily: number;
  variableDailySource: 'manual' | 'history';
  staleAccounts: number;
  missingIncome: boolean;
  limitedHistory: boolean;
  startDate: string;
  endDate: string;
  availableBalance: number;
  minimumBalance: number;
  reservedSavings: number;
  goalReservations: number;
  upcomingObligations: number;
}
export interface PlannedGoal extends SavingsGoal {
  archived: boolean;
  neededMonthly: number | null;
  overdue: boolean;
}
export interface WorthSnapshot {
  id: string;
  date: string;
  cash: number;
  assets: number;
  liabilities: number;
  total: number;
  complete: number;
}
const frequencies: CashflowFrequency[] = [
  'once',
  'monthly',
  'fourweekly',
  'quarterly',
  'yearly',
];
const dateToday = () => formatDateISO(new Date());
const daysBetween = (a: string, b: string) =>
  Math.round(
    (Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000
  );
/** Clamp short months while preserving the original scheduled day. */
export function addPlanningMonths(base: string, months: number): string {
  validateDateOnly(base);
  const [year, month, day] = base.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const last = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();
  target.setUTCDate(Math.min(day, last));
  return target.toISOString().slice(0, 10);
}
export function cashflowDates(
  base: string,
  frequency: CashflowFrequency,
  start: string,
  end: string
): string[] {
  validateDateOnly(base);
  validateDateOnly(start);
  validateDateOnly(end);
  if (!frequencies.includes(frequency)) throw new Error('Invalid frequency');
  if (frequency === 'once') return base >= start && base <= end ? [base] : [];
  const dates: string[] = [];
  // Calendar anchored: a January 31 salary returns to March 31 after February.
  for (let n = 0; n < 12000; n++) {
    const date =
      frequency === 'fourweekly'
        ? addDaysToDateOnly(base, n * 28)
        : addPlanningMonths(
            base,
            n * { monthly: 1, quarterly: 3, yearly: 12 }[frequency]
          );
    if (date > end) break;
    if (date >= start) dates.push(date);
  }
  return dates;
}
export function goalMonthlyNeed(
  goal: Pick<SavingsGoal, 'deadline' | 'targetAmount' | 'currentAmount'>,
  today = dateToday()
): number | null {
  if (!goal.deadline) return null;
  validateDateOnly(goal.deadline);
  const remaining = Math.max(
    0,
    moneyCents(goal.targetAmount) - moneyCents(goal.currentAmount)
  );
  const months = Math.max(
    1,
    Math.ceil(daysBetween(today, goal.deadline) / 30.4375)
  );
  return Math.ceil(remaining / months) / 100;
}
export function weekStart(date: string): string {
  validateDateOnly(date);
  const day = new Date(date + 'T00:00:00Z').getUTCDay();
  return addDaysToDateOnly(date, -((day + 6) % 7));
}
export const WEEKLY_CHECKS = [
  'imports',
  'transactions',
  'bills',
  'budget',
] as const;
export function createHouseholdPlanningService(
  db: FinancialDatabase,
  currentProfileId: () => string | null
) {
  const base = createFinancialPlanningService(db, currentProfileId);
  const profile = () => {
    const pid = currentProfileId();
    if (!pid) throw new Error('No active profile');
    return pid;
  };
  const service = {
    async getPlanningRecurringBills() {
      return db.queryAsync<{ id: string; name: string }>(
        'SELECT id,merchant_name AS name FROM recurring_patterns WHERE profile_id=? AND is_deleted=0 AND is_active=1 AND is_dismissed=0 AND avg_amount<0 ORDER BY merchant_name',
        [profile()]
      );
    },
    async getPlannedCashflows(): Promise<PlannedCashflow[]> {
      return db.queryAsync<PlannedCashflow>(
        `SELECT id,name,kind,amount_cents/100.0 AS amount,due_date AS dueDate,frequency,reserved_cents/100.0 AS reserved,recurring_pattern_id AS recurringPatternId FROM planned_cashflows WHERE profile_id=? AND is_deleted=0 ORDER BY due_date,name`,
        [profile()]
      );
    },
    async savePlannedCashflow(
      input: CashflowInput,
      id?: string
    ): Promise<void> {
      const pid = profile(),
        now = Date.now();
      if (
        !input.name.trim() ||
        input.name.length > 200 ||
        !['income', 'expense'].includes(input.kind) ||
        !frequencies.includes(input.frequency)
      )
        throw new Error('Invalid cashflow');
      validateDateOnly(input.dueDate);
      const amount = moneyCents(input.amount),
        reserved = moneyCents(input.reserved);
      if (
        amount <= 0 ||
        reserved > amount ||
        (input.kind === 'income' && reserved > 0)
      )
        throw new Error('Invalid amount');
      await db.transactionAsync(async () => {
        if (input.recurringPatternId) {
          const pattern = await db.queryOneAsync(
            'SELECT id FROM recurring_patterns WHERE id=? AND profile_id=? AND is_deleted=0',
            [input.recurringPatternId, pid]
          );
          if (!pattern || input.kind !== 'expense')
            throw new Error('Invalid recurring bill');
          const duplicate = await db.queryOneAsync(
            'SELECT id FROM planned_cashflows WHERE recurring_pattern_id=? AND profile_id=? AND is_deleted=0 AND id<>?',
            [input.recurringPatternId, pid, id ?? '']
          );
          if (duplicate) throw new Error('Bill already has a plan');
        }
        if (id) {
          const existing = await db.queryOneAsync(
            'SELECT id FROM planned_cashflows WHERE id=? AND profile_id=? AND is_deleted=0',
            [id, pid]
          );
          if (!existing) throw new Error('Cashflow not found');
          await db.runAsync(
            'UPDATE planned_cashflows SET name=?,kind=?,amount_cents=?,due_date=?,frequency=?,reserved_cents=?,recurring_pattern_id=?,updated_at=? WHERE id=? AND profile_id=?',
            [
              input.name.trim(),
              input.kind,
              amount,
              input.dueDate,
              input.frequency,
              reserved,
              input.recurringPatternId,
              now,
              id,
              pid,
            ]
          );
        } else
          await db.runAsync(
            'INSERT INTO planned_cashflows(id,name,kind,amount_cents,due_date,frequency,reserved_cents,recurring_pattern_id,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
            [
              crypto.randomUUID(),
              input.name.trim(),
              input.kind,
              amount,
              input.dueDate,
              input.frequency,
              reserved,
              input.recurringPatternId,
              pid,
              now,
              now,
            ]
          );
      });
    },
    async deletePlannedCashflow(id: string) {
      await db.runAsync(
        'UPDATE planned_cashflows SET is_deleted=1,updated_at=? WHERE id=? AND profile_id=?',
        [Date.now(), id, profile()]
      );
    },
    async updateVariableDaily(amount: number) {
      const pid = profile(),
        now = Date.now();
      await db.runAsync(
        `INSERT INTO household_planning_preferences(id,variable_daily_cents,profile_id,created_at,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(profile_id) DO UPDATE SET variable_daily_cents=excluded.variable_daily_cents,is_deleted=0,updated_at=excluded.updated_at`,
        [crypto.randomUUID(), moneyCents(amount), pid, now, now]
      );
    },
    async getGoalPlanning(): Promise<PlannedGoal[]> {
      const pid = profile();
      const [goals, links, archives] = await Promise.all([
        base.getSavingsGoals(),
        db.queryAsync<{ goal_id: string; amount: number }>(
          `SELECT l.goal_id,SUM(MIN(l.amount_cents,CAST(ROUND(ABS(t.amount)*100) AS INTEGER))) AS amount FROM goal_transaction_links l JOIN transactions t ON t.id=l.transaction_id AND t.profile_id=l.profile_id AND t.is_deleted=0 WHERE l.profile_id=? AND l.is_deleted=0 GROUP BY l.goal_id`,
          [pid]
        ),
        db.queryAsync<{ goal_id: string; archived: number }>(
          'SELECT goal_id,archived FROM goal_archive_state WHERE profile_id=? AND is_deleted=0',
          [pid]
        ),
      ]);
      return goals.map((goal) => {
        const linked = links.find((l) => l.goal_id === goal.id)?.amount ?? 0;
        const updated = {
          ...goal,
          currentAmount: (moneyCents(goal.currentAmount) + linked) / 100,
        };
        return {
          ...updated,
          archived: Boolean(
            archives.find((a) => a.goal_id === goal.id)?.archived
          ),
          neededMonthly: goalMonthlyNeed(updated),
          overdue: Boolean(
            goal.deadline &&
            goal.deadline < dateToday() &&
            updated.currentAmount < goal.targetAmount
          ),
        };
      });
    },
    async getSavingsGoals(): Promise<SavingsGoal[]> {
      return (await service.getGoalPlanning()).filter((g) => !g.archived);
    },
    async setSavingsGoalArchived(goalId: string, archived: boolean) {
      const pid = profile(),
        now = Date.now();
      const goal = await db.queryOneAsync(
        'SELECT id FROM savings_goals WHERE id=? AND profile_id=? AND is_deleted=0',
        [goalId, pid]
      );
      if (!goal) throw new Error('Goal not found');
      await db.runAsync(
        `INSERT INTO goal_archive_state(id,goal_id,archived,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(profile_id,goal_id) DO UPDATE SET archived=excluded.archived,is_deleted=0,updated_at=excluded.updated_at`,
        [crypto.randomUUID(), goalId, Number(archived), pid, now, now]
      );
    },
    async getGoalContributionTransactions() {
      return db.queryAsync<{
        id: string;
        date: string;
        amount: number;
        description: string;
      }>(
        `SELECT id,date,amount,COALESCE(merchant_name,description,'') AS description FROM transactions WHERE profile_id=? AND is_deleted=0 AND type IN ('income','transfer') ORDER BY date DESC LIMIT 500`,
        [profile()]
      );
    },
    async getGoalTransactionLinks() {
      return db.queryAsync<{
        id: string;
        goalId: string;
        transactionId: string;
        amount: number;
        description: string;
      }>(
        `SELECT l.id,l.goal_id AS goalId,l.transaction_id AS transactionId,l.amount_cents/100.0 AS amount,COALESCE(t.merchant_name,t.description,'') AS description FROM goal_transaction_links l JOIN transactions t ON t.id=l.transaction_id AND t.profile_id=l.profile_id AND t.is_deleted=0 WHERE l.profile_id=? AND l.is_deleted=0`,
        [profile()]
      );
    },
    async addGoalTransactionContribution(
      goalId: string,
      transactionId: string,
      amount: number
    ) {
      const pid = profile(),
        cents = moneyCents(amount),
        now = Date.now();
      if (cents <= 0) throw new Error('Invalid contribution');
      await db.transactionAsync(async () => {
        const goal = await db.queryOneAsync(
          'SELECT id FROM savings_goals WHERE id=? AND profile_id=? AND is_deleted=0',
          [goalId, pid]
        );
        const transaction = await db.queryOneAsync<{
          amount: number;
          type: string;
        }>(
          'SELECT amount,type FROM transactions WHERE id=? AND profile_id=? AND is_deleted=0',
          [transactionId, pid]
        );
        if (
          !goal ||
          !transaction ||
          !['income', 'transfer'].includes(transaction.type)
        )
          throw new Error('Contribution source not found');
        const assigned = await db.queryOneAsync<{ amount: number }>(
          'SELECT COALESCE(SUM(amount_cents),0) AS amount FROM goal_transaction_links WHERE transaction_id=? AND profile_id=? AND is_deleted=0 AND goal_id<>?',
          [transactionId, pid, goalId]
        );
        if (
          cents + (assigned?.amount ?? 0) >
          moneyCents(Math.abs(transaction.amount))
        )
          throw new Error('Contribution exceeds transaction');
        await db.runAsync(
          `INSERT INTO goal_transaction_links(id,goal_id,transaction_id,amount_cents,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(profile_id,goal_id,transaction_id) DO UPDATE SET amount_cents=excluded.amount_cents,is_deleted=0,updated_at=excluded.updated_at`,
          [crypto.randomUUID(), goalId, transactionId, cents, pid, now, now]
        );
      });
    },
    async deleteGoalTransactionContribution(id: string) {
      await db.runAsync(
        'UPDATE goal_transaction_links SET is_deleted=1,updated_at=? WHERE id=? AND profile_id=?',
        [Date.now(), id, profile()]
      );
    },
    async resetVariableDaily() {
      await db.runAsync(
        'UPDATE household_planning_preferences SET is_deleted=1,updated_at=? WHERE profile_id=?',
        [Date.now(), profile()]
      );
    },
    async getHistoricalVariableDaily(today = dateToday()) {
      validateDateOnly(today);
      const monthStart = today.slice(0, 7) + '-01';
      const start = addPlanningMonths(monthStart, -3);
      const row = await db.queryOneAsync<{ cents: number }>(
        `
        SELECT COALESCE(SUM(MAX(0, CAST(ROUND(ABS(t.amount)*100) AS INTEGER) - COALESCE((
          SELECT SUM(CAST(ROUND(l.amount*100) AS INTEGER)) FROM transaction_links l
          JOIN transactions source ON source.id=l.source_id AND source.profile_id=l.profile_id AND source.is_deleted=0
          WHERE l.target_id=t.id AND l.profile_id=t.profile_id AND l.is_deleted=0 AND l.kind='refund'
        ),0))),0) AS cents FROM transactions t
        WHERE t.profile_id=? AND t.is_deleted=0 AND t.type='expense' AND t.date>=? AND t.date<?
        AND NOT EXISTS (SELECT 1 FROM category_preferences c WHERE c.profile_id=t.profile_id AND c.is_deleted=0 AND c.is_fixed=1
          AND (c.category_id=t.category_id OR c.category_id=(SELECT parent_id FROM categories WHERE id=t.category_id)))
        AND NOT EXISTS (SELECT 1 FROM recurring_patterns p WHERE p.profile_id=t.profile_id AND p.is_deleted=0
          AND p.is_active=1 AND p.is_dismissed=0 AND p.avg_amount<0 AND (p.is_confirmed=1 OR p.last_date>=?)
          AND LOWER(p.merchant_name)=LOWER(COALESCE(t.merchant_name,t.opposing_account_name,''))
          AND (p.opposing_iban IS NULL OR p.opposing_iban='' OR p.opposing_iban=t.opposing_account_iban))`,
        [profile(), start, monthStart, addPlanningMonths(today, -12)]
      );
      return Math.round((row?.cents ?? 0) / daysBetween(start, monthStart));
    },
    async getDailyForecast(
      horizon: 30 | 60 | 90 = 30,
      today = dateToday()
    ): Promise<DailyForecast> {
      if (![30, 60, 90].includes(horizon)) throw new Error('Invalid horizon');
      validateDateOnly(today);
      const pid = profile(),
        endDate = addDaysToDateOnly(today, horizon - 1);
      const [cashflows, prefs, goals, accounts, patterns, variable, history] =
        await Promise.all([
          service.getPlannedCashflows(),
          base.getPlanningPreferences(),
          service.getSavingsGoals(),
          db.queryAsync<{ current_balance: number; last_date: string | null }>(
            `SELECT a.current_balance,(SELECT MAX(t.date) FROM transactions t WHERE t.account_id=a.id AND t.profile_id=a.profile_id AND t.is_deleted=0) AS last_date FROM accounts a WHERE a.profile_id=? AND a.is_deleted=0 AND a.type IN ('checking','savings') AND COALESCE(a.kind,'') NOT IN ('loan','investment')`,
            [pid]
          ),
          db.queryAsync<{
            id: string;
            avg_amount: number;
            last_date: string;
            next_expected_date: string | null;
            pattern_type: string;
          }>(
            `SELECT id,avg_amount,last_date,next_expected_date,pattern_type FROM recurring_patterns WHERE profile_id=? AND is_deleted=0 AND is_dismissed=0 AND is_active=1 AND avg_amount<0 AND (is_confirmed=1 OR last_date>=?)`,
            [pid, addMonthsToDateOnly(today, -12)]
          ),
          db.queryOneAsync<{ amount: number }>(
            'SELECT variable_daily_cents AS amount FROM household_planning_preferences WHERE profile_id=? AND is_deleted=0',
            [pid]
          ),
          db.queryOneAsync<{ first: string | null }>(
            'SELECT MIN(date) AS first FROM transactions WHERE profile_id=? AND is_deleted=0',
            [pid]
          ),
        ]);
      const events = new Map<
        string,
        { income: number; expense: number; release: number }
      >();
      const event = (
        date: string,
        income: number,
        expense: number,
        release = 0
      ) => {
        const prior = events.get(date) ?? { income: 0, expense: 0, release: 0 };
        events.set(date, {
          income: prior.income + income,
          expense: prior.expense + expense,
          release: prior.release + release,
        });
      };
      let reserved = cashflows
        .filter(
          (f) =>
            f.kind === 'expense' &&
            (f.frequency !== 'once' || f.dueDate >= today)
        )
        .reduce((sum, f) => sum + moneyCents(f.reserved), 0);
      for (const flow of cashflows) {
        const dates = cashflowDates(
          flow.dueDate,
          flow.frequency,
          today,
          endDate
        );
        dates.forEach((date, index) =>
          event(
            date,
            flow.kind === 'income' ? moneyCents(flow.amount) : 0,
            flow.kind === 'expense' ? moneyCents(flow.amount) : 0,
            flow.kind === 'expense' && index === 0
              ? moneyCents(flow.reserved)
              : 0
          )
        );
      }
      for (const pattern of patterns) {
        // A repeating plan replaces the estimate. A one-off replaces one occurrence only.
        const replacement = cashflows.find(
          (f) => f.recurringPatternId === pattern.id
        );
        if (replacement && replacement.frequency !== 'once') continue;
        if (!pattern.last_date) continue;
        const advance = (base: string, n: number) =>
          pattern.pattern_type === 'weekly' ||
          pattern.pattern_type === 'biweekly'
            ? addDaysToDateOnly(
                base,
                n * (pattern.pattern_type === 'weekly' ? 7 : 14)
              )
            : addPlanningMonths(
                base,
                n *
                  ({ monthly: 1, quarterly: 3, yearly: 12 }[
                    pattern.pattern_type
                  ] ?? 1)
              );
        const first =
          pattern.next_expected_date ?? advance(pattern.last_date, 1);
        const dates: string[] = [];
        for (let n = 0; n < 12000; n++) {
          const date = advance(first, n);
          if (date > endDate) break;
          if (date >= today) dates.push(date);
        }
        const replacedDate =
          replacement &&
          replacement.dueDate >= today &&
          replacement.dueDate <= endDate
            ? dates.reduce<string | null>(
                (closest, date) =>
                  !closest ||
                  Math.abs(daysBetween(date, replacement.dueDate)) <
                    Math.abs(daysBetween(closest, replacement.dueDate))
                    ? date
                    : closest,
                null
              )
            : null;
        for (const date of dates)
          if (date !== replacedDate)
            event(date, 0, moneyCents(Math.abs(pattern.avg_amount)));
      }
      const available = accounts.reduce(
        (sum, a) => sum + moneyCents(a.current_balance, true),
        0
      );
      const goalReservation = goals.reduce(
        (sum, g) =>
          sum +
          Math.min(
            moneyCents(g.monthlyContribution),
            Math.max(
              0,
              moneyCents(g.targetAmount) - moneyCents(g.currentAmount)
            )
          ),
        0
      );
      let balance = available,
        lowest = available,
        lowestDate = today,
        firstShortfall: string | null = null,
        nextIncome: string | null = null,
        upcoming = 0;
      const variableDaily =
        variable?.amount ?? (await service.getHistoricalVariableDaily(today));
      const fixedReserve =
        moneyCents(prefs.minimumBalance) +
        moneyCents(prefs.reservedSavings) +
        goalReservation;
      const points: ForecastPoint[] = [];
      let minimumSpendable = available - fixedReserve - reserved;
      for (let i = 0; i < horizon; i++) {
        const date = addDaysToDateOnly(today, i),
          item = events.get(date) ?? { income: 0, expense: 0, release: 0 };
        if (item.income > 0 && !nextIncome) nextIncome = date;
        balance += item.income - item.expense - variableDaily;
        reserved -= item.release;
        upcoming += item.expense + variableDaily;
        const spendable = balance - fixedReserve - reserved;
        if (balance < lowest) {
          lowest = balance;
          lowestDate = date;
        }
        if (spendable < 0 && !firstShortfall) firstShortfall = date;
        minimumSpendable = Math.min(minimumSpendable, spendable);
        points.push({
          date,
          income: item.income / 100,
          expenses: (item.expense + variableDaily) / 100,
          balance: balance / 100,
          spendable: spendable / 100,
        });
      }
      const incomeDays = nextIncome
        ? Math.max(1, daysBetween(today, nextIncome) + 1)
        : horizon;
      return {
        points,
        lowestBalance: lowest / 100,
        lowestDate,
        firstShortfall,
        safeToSpend: minimumSpendable / 100,
        perDay: Math.floor(Math.max(0, minimumSpendable) / incomeDays) / 100,
        nextIncome,
        variableDaily: variableDaily / 100,
        variableDailySource: variable ? 'manual' : 'history',
        staleAccounts: accounts.filter(
          (a) => !a.last_date || a.last_date < addDaysToDateOnly(today, -14)
        ).length,
        missingIncome: !nextIncome,
        limitedHistory:
          !history?.first || history.first > addDaysToDateOnly(today, -60),
        startDate: today,
        endDate,
        availableBalance: available / 100,
        minimumBalance: prefs.minimumBalance,
        reservedSavings: prefs.reservedSavings,
        goalReservations: goalReservation / 100,
        upcomingObligations: upcoming / 100,
      };
    },
    async getSafeToSpend(): Promise<SafeToSpendSummary> {
      const forecast = await service.getDailyForecast();
      return forecast;
    },
    async getNetWorth() {
      const pid = profile();
      const original = await base.getNetWorth();
      const accounts = await db.queryAsync<{
        current_balance: number;
        kind: string | null;
      }>(
        'SELECT current_balance,kind FROM accounts WHERE profile_id=? AND is_deleted=0',
        [pid]
      );
      let cash = 0,
        assets = moneyCents(original.assets),
        liabilities = moneyCents(original.liabilities);
      for (const account of accounts) {
        const amount = moneyCents(account.current_balance, true);
        if (amount < 0) liabilities -= amount;
        else if (account.kind === 'investment') assets += amount;
        else cash += amount;
      }
      return {
        ...original,
        cash: cash / 100,
        assets: assets / 100,
        liabilities: liabilities / 100,
        total: (cash + assets - liabilities) / 100,
      };
    },
    async saveNetWorthSnapshot() {
      const pid = profile(),
        date = dateToday(),
        now = Date.now(),
        worth = await service.getNetWorth();
      await db.runAsync(
        `INSERT INTO net_worth_snapshots(id,date,cash_cents,assets_cents,liabilities_cents,complete,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,1,?,?,?) ON CONFLICT(profile_id,date) DO UPDATE SET cash_cents=excluded.cash_cents,assets_cents=excluded.assets_cents,liabilities_cents=excluded.liabilities_cents,complete=1,is_deleted=0,updated_at=excluded.updated_at`,
        [
          crypto.randomUUID(),
          date,
          moneyCents(worth.cash, true),
          moneyCents(worth.assets),
          moneyCents(worth.liabilities),
          pid,
          now,
          now,
        ]
      );
    },
    async getNetWorthHistory() {
      const snapshots = await db.queryAsync<WorthSnapshot>(
        `SELECT id,date,cash_cents/100.0 AS cash,assets_cents/100.0 AS assets,liabilities_cents/100.0 AS liabilities,(cash_cents+assets_cents-liabilities_cents)/100.0 AS total,complete FROM net_worth_snapshots WHERE profile_id=? AND is_deleted=0 ORDER BY date`,
        [profile()]
      );
      const today = dateToday(),
        previous = snapshots.find(
          (s) => s.date === addDaysToDateOnly(today, -30) && s.complete
        ),
        latest = snapshots.find((s) => s.date === today && s.complete);
      return {
        snapshots,
        change30Days:
          latest && previous
            ? (moneyCents(latest.total, true) -
                moneyCents(previous.total, true)) /
              100
            : null,
      };
    },
    async getWeeklyReview(date = dateToday()) {
      const pid = profile(),
        week = weekStart(date);
      const rows = await db.queryAsync<{
        week: string;
        checks_json: string;
        status: 'open' | 'complete';
      }>(
        'SELECT week,checks_json,status FROM weekly_reviews WHERE profile_id=? AND is_deleted=0 AND week<=? ORDER BY week DESC',
        [pid, week]
      );
      const current = rows.find((r) => r.week === week);
      let expected = week,
        streak = 0;
      if (current?.status !== 'complete')
        expected = addDaysToDateOnly(week, -7);
      while (rows.some((r) => r.week === expected && r.status === 'complete')) {
        streak++;
        expected = addDaysToDateOnly(expected, -7);
      }
      return {
        week,
        checks: current
          ? (JSON.parse(current.checks_json) as Record<string, boolean>)
          : {},
        status: current?.status ?? 'open',
        streak,
      };
    },
    async updateWeeklyReview(date: string, checks: Record<string, boolean>) {
      const pid = profile(),
        week = weekStart(date),
        now = Date.now();
      const clean = Object.fromEntries(
        WEEKLY_CHECKS.map((key) => [key, checks[key] === true])
      );
      const status = WEEKLY_CHECKS.every((key) => clean[key])
        ? 'complete'
        : 'open';
      await db.runAsync(
        `INSERT INTO weekly_reviews(id,week,checks_json,status,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(profile_id,week) DO UPDATE SET checks_json=excluded.checks_json,status=excluded.status,is_deleted=0,updated_at=excluded.updated_at`,
        [
          crypto.randomUUID(),
          week,
          JSON.stringify(clean),
          status,
          pid,
          now,
          now,
        ]
      );
    },
  };
  return service;
}
