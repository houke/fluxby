import { seedTransactionReviewDemo } from './transaction-review-demo';
import { seedImportProfilesDemo } from './import-demo';
import { seedHouseholdPlanningDemo } from './household-planning-demo';
import {
  addMonthsToDateOnly,
  formatDateISO,
  getFinancialPlanningDemoData,
} from '@fluxby/shared';
import type { FinancialDatabase } from './financial-planning';

export const FINANCIAL_FEATURE_TABLES = [
  'import_recovery_snapshots',
  'import_batches',
  'advanced_category_rules',
  'budget_income_plans',
  'category_preferences',
  'budget_preferences',
  'budget_months',
  'household_planning_preferences',
  'goal_archive_state',
  'goal_transaction_links',
  'weekly_reviews',
  'net_worth_snapshots',
  'planned_cashflows',
  'transaction_category_decisions',
  'transaction_links',
  'transaction_review_decisions',
  'import_profiles',

  'saved_transaction_views',
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
  language: 'nl' | 'en'
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
  await db.runAsync(
    'UPDATE recurring_patterns SET renewal_date=?,cancellation_deadline=? WHERE profile_id=? AND merchant_name=?',
    [addMonthsToDateOnly(today, 1), today, profileId, 'Netflix']
  );
  await seedImportProfilesDemo(db, profileId, language);
  await seedHouseholdPlanningDemo(db, profileId, language);
  await seedTransactionReviewDemo(db, profileId, language);  await db.runAsync('INSERT INTO budget_income_plans(id,month,expected_income,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?)',[crypto.randomUUID(),today.slice(0,7),4200,profileId,now,now]);
  const category=await db.queryOneAsync<{id:string}>('SELECT category_id id FROM budgets WHERE profile_id=? AND category_id IS NOT NULL AND is_deleted=0 LIMIT 1',[profileId]);
  if(category)await db.runAsync("INSERT INTO category_preferences(id,category_id,is_fixed,allocation_group,profile_id,created_at,updated_at) VALUES(?,?,1,'needs',?,?,?)",[crypto.randomUUID(),category.id,profileId,now,now]);

}
