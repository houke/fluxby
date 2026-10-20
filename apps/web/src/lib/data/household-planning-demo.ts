import {
  addDaysToDateOnly,
  formatDateISO,
  getHouseholdPlanningDemoData,
} from '@fluxby/shared';
import type { FinancialDatabase } from './financial-planning';
export const HOUSEHOLD_PLANNING_TABLES = [
  'goal_transaction_links',
  'goal_archive_state',
  'weekly_reviews',
  'net_worth_snapshots',
  'household_planning_preferences',
  'planned_cashflows',
];
/** Call inside the caller's demo transaction, after seeding accounts and goals. */
export async function seedHouseholdPlanningDemo(
  db: FinancialDatabase,
  profileId: string,
  language: 'nl' | 'en'
) {
  const data = getHouseholdPlanningDemoData(language),
    now = Date.now(),
    today = formatDateISO(new Date());
  for (const flow of data.cashflows) {
    await db.runAsync(
      'INSERT INTO planned_cashflows(id,name,kind,amount_cents,due_date,frequency,reserved_cents,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
      [
        crypto.randomUUID(),
        flow.name,
        flow.kind,
        flow.amountCents,
        addDaysToDateOnly(today, flow.days),
        flow.frequency,
        flow.reservedCents,
        profileId,
        now,
        now,
      ]
    );
  }
  await db.runAsync(
    'INSERT INTO household_planning_preferences(id,variable_daily_cents,profile_id,created_at,updated_at) VALUES(?,?,?,?,?)',
    [crypto.randomUUID(), data.variableDailyCents, profileId, now, now]
  );
}
