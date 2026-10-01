import { cashflowDates } from './household-planning';
import { effectiveExpenseSQL } from './transaction-accounting';
import { addMonthsToDateOnly, formatDateISO } from '@fluxby/shared';
import {
  type FinancialDatabase,
  moneyCents,
  validateDateOnly,
} from './financial-planning';
export type AllocationGroup = 'needs' | 'wants' | 'savings';
export interface CategoryPreference {
  category_id: string;
  is_fixed: number;
  allocation_group: AllocationGroup;
  archived: number;
}
export interface AdvancedRuleInput {
  pattern: string;
  matchField: 'all' | 'merchant' | 'description';
  matchMode: 'contains' | 'regex';
  direction: 'any' | 'income' | 'expense';
  minimumAmount?: number | null;
  maximumAmount?: number | null;
  accountId?: string | null;
  categoryId: string;
  priority: number;
}
export interface AdvancedRule extends AdvancedRuleInput {
  id: string;
}
export function validateMonth(month: string) {
  validateDateOnly(`${month}-01`);
  if (month.length !== 7) throw new Error('Invalid month');
}
const round = (amount: number) => Math.round(amount * 100) / 100;
export function monthlyAllocation(
  base: number,
  overrides: Map<string, number>,
  from: string,
  to: string
): number {
  validateMonth(from);
  validateMonth(to);
  if (from > to) return 0;
  let total = 0;
  for (
    let date = `${from}-01`;
    date.slice(0, 7) <= to;
    date = addMonthsToDateOnly(date, 1)
  )
    total += moneyCents(overrides.get(date.slice(0, 7)) ?? base);
  return total / 100;
}
export function isSafeRulePattern(pattern:string):boolean {
  // Keep browser-side matching bounded: disallow quantified groups, lookarounds,
  // backreferences and multiple variable repetitions. Plain text is the default.
  return pattern.length<=200 && !/\)[+*{]|\\[1-9]|\(\?/.test(pattern) && (pattern.match(/[+*{]/g)||[]).length<=1;
}
export function matchesAdvancedRule(
  rule: AdvancedRuleInput,
  tx: {
    amount: number;
    type: string;
    accountId: string;
    merchantName: string;
    description: string;
  }
): boolean {
  if (rule.direction !== 'any' && rule.direction !== tx.type) return false;
  if (rule.accountId && rule.accountId !== tx.accountId) return false;
  const amount = Math.abs(tx.amount);
  if (rule.minimumAmount != null && amount < rule.minimumAmount) return false;
  if (rule.maximumAmount != null && amount > rule.maximumAmount) return false;
  const text =
    rule.matchField === 'merchant'
      ? tx.merchantName
      : rule.matchField === 'description'
        ? tx.description
        : `${tx.merchantName} ${tx.description}`;
  if (rule.matchMode === 'contains')
    return text.toLocaleLowerCase().includes(rule.pattern.toLocaleLowerCase());
  if(!isSafeRulePattern(rule.pattern)) return false;
  try {
    return new RegExp(rule.pattern, 'iu').test(text.slice(0, 2000));
  } catch {
    return false;
  }
}
export function createHouseholdBudgetService(
  db: FinancialDatabase,
  profileId: () => string | null
) {
  const pid = () => {
    const id = profileId();
    if (!id) throw new Error('No active profile');
    return id;
  };
  const owned = async (
    table: 'budgets' | 'categories' | 'accounts',
    id: string
  ) => {
    if (
      !(await db.queryOneAsync(
        `SELECT id FROM ${table} WHERE id=? AND profile_id=? AND is_deleted=0`,
        [id, pid()]
      ))
    )
      throw new Error('Item does not belong to profile');
  };
  return {
    async getBudgetExtensions() {
      const p = pid();
      return {
        overrides: await db.queryAsync<{
          budget_id: string;
          month: string;
          amount: number;
        }>(
          'SELECT budget_id,month,amount FROM budget_months WHERE profile_id=? AND is_deleted=0',
          [p]
        ),
        preferences: await db.queryAsync<{
          budget_id: string;
          carry_negative: number;
        }>(
          'SELECT budget_id,carry_negative FROM budget_preferences WHERE profile_id=? AND is_deleted=0',
          [p]
        ),
        categories: await db.queryAsync<CategoryPreference>(
          'SELECT category_id,is_fixed,allocation_group,archived FROM category_preferences WHERE profile_id=? AND is_deleted=0',
          [p]
        ),
      };
    },
    async setBudgetMonth(
      budgetId: string,
      month: string,
      amount: number | null
    ) {
      validateMonth(month);
      await owned('budgets', budgetId);
      const p = pid(),
        now = Date.now();
      if (amount === null) {
        await db.runAsync(
          'UPDATE budget_months SET is_deleted=1,updated_at=? WHERE profile_id=? AND budget_id=? AND month=?',
          [now, p, budgetId, month]
        );
        return;
      }
      if (!Number.isFinite(amount) || amount < 0)
        throw new Error('Invalid budget amount');
      await db.runAsync(
        `INSERT INTO budget_months(id,budget_id,month,amount,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?)
    ON CONFLICT(profile_id,budget_id,month) DO UPDATE SET amount=excluded.amount,is_deleted=0,updated_at=excluded.updated_at`,
        [crypto.randomUUID(), budgetId, month, round(amount), p, now, now]
      );
    },
    async copyPreviousBudgetMonth(month: string) {
      validateMonth(month);
      const p = pid(),
        previous = addMonthsToDateOnly(`${month}-01`, -1).slice(0, 7);
      const rows = await db.queryAsync<{ id: string; amount: number }>(
        `SELECT b.id,COALESCE(m.amount,b.amount) amount FROM budgets b LEFT JOIN budget_months m ON m.budget_id=b.id AND m.profile_id=b.profile_id AND m.month=? AND m.is_deleted=0 WHERE b.profile_id=? AND b.is_deleted=0 AND b.period='monthly'`,
        [previous, p]
      );
      await db.transactionAsync(async () => {
        for (const row of rows)
          await this.setBudgetMonth(row.id, month, row.amount);
      });
      return rows.length;
    },
    async setBudgetNegativeRollover(budgetId: string, enabled: boolean) {
      await owned('budgets', budgetId);
      const now = Date.now();
      await db.runAsync(
        `INSERT INTO budget_preferences(id,budget_id,carry_negative,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(profile_id,budget_id) DO UPDATE SET carry_negative=excluded.carry_negative,is_deleted=0,updated_at=excluded.updated_at`,
        [crypto.randomUUID(), budgetId, Number(enabled), pid(), now, now]
      );
    },
    async getBudgetIncomePlan(month: string) {
      validateMonth(month);
      return (
        (
          await db.queryOneAsync<{ amount: number }>(
            'SELECT expected_income amount FROM budget_income_plans WHERE profile_id=? AND month=? AND is_deleted=0',
            [pid(), month]
          )
        )?.amount ?? 0
      );
    },
    async saveBudgetIncomePlan(month: string, amount: number) {
      validateMonth(month);
      if (!Number.isFinite(amount) || amount < 0)
        throw new Error('Invalid income');
      const now = Date.now();
      await db.runAsync(
        `INSERT INTO budget_income_plans(id,month,expected_income,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(profile_id,month) DO UPDATE SET expected_income=excluded.expected_income,is_deleted=0,updated_at=excluded.updated_at`,
        [crypto.randomUUID(), month, round(amount), pid(), now, now]
      );
    },
    async getCategoryPreferences() {
      return db.queryAsync<CategoryPreference>(
        'SELECT category_id,is_fixed,allocation_group,archived FROM category_preferences WHERE profile_id=? AND is_deleted=0',
        [pid()]
      );
    },
    async saveCategoryPreference(
      categoryId: string,
      input: {
        isFixed: boolean;
        allocationGroup: AllocationGroup;
        archived: boolean;
      }
    ) {
      await owned('categories', categoryId);
      if (!['needs', 'wants', 'savings'].includes(input.allocationGroup))
        throw new Error('Invalid allocation group');
      const now = Date.now();
      await db.runAsync(
        `INSERT INTO category_preferences(id,category_id,is_fixed,allocation_group,archived,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(profile_id,category_id) DO UPDATE SET is_fixed=excluded.is_fixed,allocation_group=excluded.allocation_group,archived=excluded.archived,is_deleted=0,updated_at=excluded.updated_at`,
        [
          crypto.randomUUID(),
          categoryId,
          Number(input.isFixed),
          input.allocationGroup,
          Number(input.archived),
          pid(),
          now,
          now,
        ]
      );
    },
    async getCategoryReferences(categoryId: string) {
      await owned('categories', categoryId);
      const p = pid();
      const result: Record<string, number> = {};
      for (const [table, column] of [
        ['transactions', 'category_id'],
        ['budgets', 'category_id'],
        ['category_rules', 'category_id'],
        ['advanced_category_rules', 'category_id'],
        ['categories', 'parent_id'],
      ])
        result[table] =
          (
            await db.queryOneAsync<{ count: number }>(
              `SELECT COUNT(*) count FROM ${table} WHERE ${column}=? AND profile_id=? AND is_deleted=0`,
              [categoryId, p]
            )
          )?.count ?? 0;
      return result;
    },
    async retireCategory(categoryId: string, replacementId?: string) {
      await owned('categories', categoryId);
      if (categoryId === replacementId)
        throw new Error('Choose another category');
      if (replacementId) await owned('categories', replacementId);
      const p = pid(),
        now = Date.now();
      if (replacementId) {
        const descendants = await db.queryAsync<{ id: string }>(
          `WITH RECURSIVE children(id) AS (SELECT id FROM categories WHERE parent_id=? AND profile_id=? UNION SELECT c.id FROM categories c JOIN children ch ON c.parent_id=ch.id WHERE c.profile_id=?) SELECT id FROM children`,
          [categoryId, p, p]
        );
        if (descendants.some((c) => c.id === replacementId))
          throw new Error('Replacement cannot be a child category');
      }
      await db.transactionAsync(async () => {
        if (replacementId)
          for (const [table, column] of [
            ['transactions', 'category_id'],
            ['budgets', 'category_id'],
            ['category_rules', 'category_id'],
            ['advanced_category_rules', 'category_id'],
            ['categories', 'parent_id'],
          ])
            await db.runAsync(
              `UPDATE ${table} SET ${column}=?,updated_at=? WHERE ${column}=? AND profile_id=? AND is_deleted=0`,
              [replacementId, now, categoryId, p]
            );
        const existing = (await this.getCategoryPreferences()).find(
          (c) => c.category_id === categoryId
        );
        await this.saveCategoryPreference(categoryId, {
          isFixed: !!existing?.is_fixed,
          allocationGroup: existing?.allocation_group ?? 'needs',
          archived: true,
        });
      });
    },
    async getBudgetCommitments() {
      const p=pid(),today=formatDateISO(new Date());
      const [flows,bills,goals]=await Promise.all([
        db.queryAsync<{kind:string;amount_cents:number;reserved_cents:number;due_date:string;frequency:'once'|'monthly'|'fourweekly'|'quarterly'|'yearly';recurring_pattern_id:string|null}>('SELECT * FROM planned_cashflows WHERE profile_id=? AND is_deleted=0',[p]),
        db.queryAsync<{id:string;avg_amount:number;pattern_type:string}>("SELECT id,avg_amount,pattern_type FROM recurring_patterns WHERE profile_id=? AND is_deleted=0 AND is_active=1 AND is_dismissed=0 AND avg_amount<0",[p]),
        db.queryOneAsync<{total:number}>("SELECT COALESCE(SUM(monthly_contribution),0) total FROM savings_goals g WHERE g.profile_id=? AND g.is_deleted=0 AND NOT EXISTS(SELECT 1 FROM goal_archive_state a WHERE a.goal_id=g.id AND a.profile_id=g.profile_id AND a.archived=1 AND a.is_deleted=0)",[p])
      ]);
      let billsCents=0,reserveCents=0;
      for(const bill of bills) if(!flows.some(f=>f.kind==='expense'&&f.recurring_pattern_id===bill.id)) billsCents+=Math.round(Math.abs(bill.avg_amount)*100*({weekly:52/12,biweekly:26/12,monthly:1,quarterly:1/3,yearly:1/12}[bill.pattern_type]??1));
      for(const flow of flows.filter(f=>f.kind==='expense')) {
        const due=cashflowDates(flow.due_date,flow.frequency,today,addMonthsToDateOnly(today,24))[0];
        if(!due)continue;
        if(flow.frequency==='monthly'||flow.frequency==='fourweekly') billsCents+=Math.round(flow.amount_cents*(flow.frequency==='monthly'?1:13/12));
        else {
          const months=Math.max(1,Math.ceil((Date.parse(due+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000/30.4375));
          reserveCents+=Math.ceil(Math.max(0,flow.amount_cents-flow.reserved_cents)/months);
        }
      }
      return {bills:billsCents/100,reserves:reserveCents/100,goals:round(goals?.total??0)};
    },
    async getMonthlyBudgetSuggestions(months: 3 | 6 | 12 = 3) {
      if (![3, 6, 12].includes(months)) throw new Error('Invalid baseline');
      const end = `${formatDateISO(new Date()).slice(0, 7)}-01`,
        start = addMonthsToDateOnly(end, -months);
      const rows = await db.queryAsync<{
        categoryId: string;
        categoryName: string;
        amount: number;
        months: number;
      }>(
        `SELECT c.id categoryId,c.name categoryName,SUM(${effectiveExpenseSQL()}) amount,COUNT(DISTINCT substr(t.date,1,7)) months FROM transactions t JOIN categories c ON c.id=t.category_id AND c.profile_id=t.profile_id LEFT JOIN category_preferences cp ON cp.category_id=c.id AND cp.profile_id=c.profile_id AND cp.is_deleted=0 WHERE t.profile_id=? AND t.is_deleted=0 AND t.type='expense' AND t.date>=? AND t.date<? AND c.is_deleted=0 AND COALESCE(cp.archived,0)=0 GROUP BY c.id`,
        [pid(), start, end]
      );
      return rows.map((row) => ({
        ...row,
        suggestedAmount: Math.ceil(row.amount / months / 10) * 10,
        averageMonthly: round(row.amount / months),
        baselineMonths: months,
        limitedHistory: row.months < 2,
      }));
    },
    async getAdvancedCategoryRules() {
      return db.queryAsync<AdvancedRule>(
        `SELECT id,pattern,match_field matchField,match_mode matchMode,direction,minimum_amount minimumAmount,maximum_amount maximumAmount,account_id accountId,category_id categoryId,priority FROM advanced_category_rules WHERE profile_id=? AND is_deleted=0 ORDER BY priority DESC,id`,
        [pid()]
      );
    },
    async createAdvancedCategoryRule(input: AdvancedRuleInput) {
      await owned('categories', input.categoryId);
      if (input.accountId) await owned('accounts', input.accountId);
      if (
        !input.pattern.trim() ||
        input.pattern.length > 200 ||
        !['all', 'merchant', 'description'].includes(input.matchField) ||
        !['contains', 'regex'].includes(input.matchMode) ||
        !['any', 'income', 'expense'].includes(input.direction)
      )
        throw new Error('Invalid rule');
      if (input.matchMode === 'regex') {
        if(!isSafeRulePattern(input.pattern))throw new Error('Unsupported complex expression');
        new RegExp(input.pattern,'iu');
      }
      if(!Number.isFinite(input.priority)||!Number.isInteger(input.priority))throw new Error('Invalid priority');
      for (const amount of [input.minimumAmount, input.maximumAmount])
        if (amount != null && (!Number.isFinite(amount) || amount < 0))
          throw new Error('Invalid amount');
      if (
        input.minimumAmount != null &&
        input.maximumAmount != null &&
        input.minimumAmount > input.maximumAmount
      )
        throw new Error('Invalid bounds');
      const now = Date.now(),
        id = crypto.randomUUID();
      await db.runAsync(
        `INSERT INTO advanced_category_rules(id,pattern,match_field,match_mode,direction,minimum_amount,maximum_amount,account_id,category_id,priority,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          id,
          input.pattern,
          input.matchField,
          input.matchMode,
          input.direction,
          input.minimumAmount ?? null,
          input.maximumAmount ?? null,
          input.accountId ?? null,
          input.categoryId,
          input.priority,
          pid(),
          now,
          now,
        ]
      );
      return id;
    },
    async deleteAdvancedCategoryRule(id: string) {
      await db.runAsync(
        'UPDATE advanced_category_rules SET is_deleted=1,updated_at=? WHERE id=? AND profile_id=?',
        [Date.now(), id, pid()]
      );
    },
    async applyAdvancedCategoryRules() {
      const rules = await this.getAdvancedCategoryRules(),
        p = pid();
      const transactions = await db.queryAsync<{
        id: string;
        amount: number;
        type: string;
        accountId: string;
        merchantName: string;
        description: string;
      }>(
        `SELECT id,amount,type,account_id accountId,COALESCE(merchant_name,'') merchantName,COALESCE(description,'') description FROM transactions t WHERE profile_id=? AND is_deleted=0 AND (category_id IS NULL OR category_id='') AND NOT EXISTS(SELECT 1 FROM transaction_category_decisions d WHERE d.transaction_id=t.id AND d.profile_id=t.profile_id AND d.source='manual' AND d.is_deleted=0)`,
        [p]
      );
      let updated = 0;
      await db.transactionAsync(async () => {
        for (const tx of transactions) {
          const rule = rules.find((r) => matchesAdvancedRule(r, tx));
          if (rule) {
            await db.runAsync(
              'UPDATE transactions SET category_id=?,updated_at=? WHERE id=? AND profile_id=?',
              [rule.categoryId, Date.now(), tx.id, p]
            );
            updated++;
          }
        }
      });
      return updated;
    },
  };
}
