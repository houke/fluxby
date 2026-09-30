import {
  addMonthsToDateOnly,
  formatDateISO,
  getFinancialPlanningDemoData,
} from '@fluxby/shared';
import {
  captureRow,
  recordFinancialChange,
  type FinancialDatabase,
} from './financial-history';

export const FINANCIAL_FEATURE_TABLES = [
  'change_history',
  'statement_reconciliations',
  'saved_transaction_views',
  'transaction_splits',
  'monthly_reviews',
  'net_worth_items',
  'planning_preferences',
  'savings_contributions',
  'savings_goals',
];
/** Called inside the existing demo transaction. */
export async function seedFinancialPlanningDemo(
  db: FinancialDatabase,
  profileId: string,
  language: 'nl' | 'en',
  options: {
    accountId: string;
    categoryIds: string[];
    transaction?: { id: string; amount: number };
    statement: {
      startDate: string;
      endDate: string;
      amount: number;
      count: number;
    };
  }
) {
  const data = getFinancialPlanningDemoData(language),
    now = Date.now(),
    today = formatDateISO(new Date());
  for (const [index, goal] of data.goals.entries()) {
    const id = crypto.randomUUID();
    await db.runAsync(
      'INSERT INTO savings_goals(id,name,target_amount,deadline,monthly_contribution,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)',
      [
        id,
        goal.name,
        goal.targetAmount,
        addMonthsToDateOnly(today, index === 0 ? 24 : 6),
        goal.monthlyContribution,
        profileId,
        now,
        now,
      ]
    );
    await db.runAsync(
      'INSERT INTO savings_contributions(id,goal_id,amount,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?)',
      [crypto.randomUUID(), id, goal.currentAmount, profileId, now, now]
    );
    const after = await captureRow(db, profileId, 'savings_goals', id);
    await recordFinancialChange(
      db,
      profileId,
      'savings_goals',
      id,
      'create',
      [{ table: 'savings_goals', id, row: null }],
      [after],
      goal.name
    );
  }
  for (const item of data.netWorthItems)
    await db.runAsync(
      'INSERT INTO net_worth_items(id,name,type,amount,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',
      [
        crypto.randomUUID(),
        item.name,
        item.type,
        item.amount,
        profileId,
        now,
        now,
      ]
    );
  await db.runAsync(
    'INSERT INTO planning_preferences(id,minimum_balance,reserved_savings,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?)',
    [
      crypto.randomUUID(),
      data.preferences.minimumBalance,
      data.preferences.reservedSavings,
      profileId,
      now,
      now,
    ]
  );
  const view = {
    search: '',
    type: 'expense',
    startDate: `${today.slice(0, 4)}-01-01`,
    endDate: today,
    categories: ['0'],
    ibans: [],
    accountName: null,
    addressBookId: null,
    methods: [],
    providers: [],
    compact: true,
  };
  await db.runAsync(
    'INSERT INTO saved_transaction_views(id,name,filters_json,version,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',
    [
      crypto.randomUUID(),
      data.copy.uncategorizedSpending,
      JSON.stringify({ version: '1', view: JSON.stringify(view) }),
      1,
      profileId,
      now,
      now,
    ]
  );
  await db.runAsync(
    'INSERT INTO monthly_reviews(id,month,status,checks_json,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',
    [
      crypto.randomUUID(),
      today.slice(0, 7),
      'open',
      JSON.stringify({
        uncategorized: false,
        spending: true,
        budgets: true,
        subscriptions: false,
        backup: false,
      }),
      profileId,
      now,
      now,
    ]
  );
  if (options.transaction && options.categoryIds.length >= 2) {
    const total = Math.round(Math.abs(options.transaction.amount) * 100),
      first = Math.round(total * 0.7),
      amounts = [first, total - first];
    if (amounts.every((amount) => amount > 0))
      for (const [index, amount] of amounts.entries())
        await db.runAsync(
          'INSERT INTO transaction_splits(id,transaction_id,category_id,amount,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',
          [
            crypto.randomUUID(),
            options.transaction.id,
            options.categoryIds[index],
            amount / 100,
            profileId,
            now,
            now,
          ]
        );
  }
  const opening = 2500,
    expected = Math.round((opening + options.statement.amount) * 100) / 100;
  await db.runAsync(
    'INSERT INTO statement_reconciliations(id,account_id,start_date,end_date,opening_balance,actual_closing_balance,expected_closing_balance,difference,transaction_count,status,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [
      crypto.randomUUID(),
      options.accountId,
      options.statement.startDate,
      options.statement.endDate,
      opening,
      expected,
      expected,
      0,
      options.statement.count,
      'matched',
      profileId,
      now,
      now,
    ]
  );
  await db.runAsync(
    'UPDATE recurring_patterns SET renewal_date=?,cancellation_deadline=? WHERE profile_id=? AND merchant_name=?',
    [addMonthsToDateOnly(today, 1), today, profileId, 'Netflix']
  );
}
