import type { Database } from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import {
  addDaysToDateOnly,
  addMonthsToDateOnly,
  formatDateISO,
  getFinancialPlanningDemoData,
  getHouseholdPlanningDemoData,
  getImportProfileDemoData,
} from '@fluxby/shared';

// The optional API keeps numeric profile IDs. Domain record IDs remain UUIDs,
// matching the browser data contract without importing browser storage code.
const sync = `profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,is_deleted INTEGER NOT NULL DEFAULT 0,device_id TEXT`;
export function initializeHouseholdDemoTables(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY,name TEXT NOT NULL,target_amount REAL NOT NULL CHECK(target_amount>0),
      deadline TEXT,monthly_contribution REAL NOT NULL DEFAULT 0 CHECK(monthly_contribution>=0),${sync});
    CREATE TABLE IF NOT EXISTS savings_contributions (
      id TEXT PRIMARY KEY,goal_id TEXT NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
      amount REAL NOT NULL CHECK(amount>0),${sync});
    CREATE TABLE IF NOT EXISTS planning_preferences (
      id TEXT PRIMARY KEY,minimum_balance REAL NOT NULL DEFAULT 0,reserved_savings REAL NOT NULL DEFAULT 0,
      ${sync},UNIQUE(profile_id));
    CREATE TABLE IF NOT EXISTS net_worth_items (
      id TEXT PRIMARY KEY,name TEXT NOT NULL,type TEXT NOT NULL CHECK(type IN ('asset','liability')),
      amount REAL NOT NULL CHECK(amount>=0),${sync});
    CREATE TABLE IF NOT EXISTS planned_cashflows (
      id TEXT PRIMARY KEY,name TEXT NOT NULL,kind TEXT NOT NULL CHECK(kind IN ('income','expense')),
      amount_cents INTEGER NOT NULL CHECK(amount_cents>0),due_date TEXT NOT NULL,
      frequency TEXT NOT NULL CHECK(frequency IN ('once','monthly','fourweekly','quarterly','yearly')),
      reserved_cents INTEGER NOT NULL DEFAULT 0 CHECK(reserved_cents>=0),recurring_pattern_id TEXT,${sync});
    CREATE TABLE IF NOT EXISTS household_planning_preferences (
      id TEXT PRIMARY KEY,variable_daily_cents INTEGER NOT NULL DEFAULT 0 CHECK(variable_daily_cents>=0),
      ${sync},UNIQUE(profile_id));
    CREATE TABLE IF NOT EXISTS import_profiles (
      id TEXT PRIMARY KEY,name TEXT NOT NULL,header_signature TEXT NOT NULL,settings_json TEXT NOT NULL,${sync});
  `);
}
const demoTables = [
  'savings_contributions',
  'savings_goals',
  'planning_preferences',
  'net_worth_items',
  'planned_cashflows',
  'household_planning_preferences',
  'import_profiles',
];
/** Atomic for standalone calls and safe inside the route's existing transaction. */
export function seedHouseholdDemo(
  db: Database,
  profileId: number,
  language: 'nl' | 'en'
) {
  const seed = () => {
    const financial = getFinancialPlanningDemoData(language),
      household = getHouseholdPlanningDemoData(language),
      importProfile = getImportProfileDemoData(language);
    const now = Date.now(),
      today = formatDateISO(new Date());
    for (const table of demoTables)
      db.prepare(`DELETE FROM ${table} WHERE profile_id=?`).run(profileId);
    for (const [index, goal] of financial.goals.entries()) {
      const id = randomUUID();
      db.prepare(
        'INSERT INTO savings_goals(id,name,target_amount,deadline,monthly_contribution,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)'
      ).run(
        id,
        goal.name,
        goal.targetAmount,
        addMonthsToDateOnly(today, index === 0 ? 24 : 6),
        goal.monthlyContribution,
        profileId,
        now,
        now
      );
      db.prepare(
        'INSERT INTO savings_contributions(id,goal_id,amount,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?)'
      ).run(randomUUID(), id, goal.currentAmount, profileId, now, now);
    }
    for (const item of financial.netWorthItems)
      db.prepare(
        'INSERT INTO net_worth_items(id,name,type,amount,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?)'
      ).run(
        randomUUID(),
        item.name,
        item.type,
        item.amount,
        profileId,
        now,
        now
      );
    db.prepare(
      'INSERT INTO planning_preferences(id,minimum_balance,reserved_savings,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?)'
    ).run(
      randomUUID(),
      financial.preferences.minimumBalance,
      financial.preferences.reservedSavings,
      profileId,
      now,
      now
    );
    for (const flow of household.cashflows)
      db.prepare(
        'INSERT INTO planned_cashflows(id,name,kind,amount_cents,due_date,frequency,reserved_cents,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)'
      ).run(
        randomUUID(),
        flow.name,
        flow.kind,
        flow.amountCents,
        addDaysToDateOnly(today, flow.days),
        flow.frequency,
        flow.reservedCents,
        profileId,
        now,
        now
      );
    db.prepare(
      'INSERT INTO household_planning_preferences(id,variable_daily_cents,profile_id,created_at,updated_at) VALUES(?,?,?,?,?)'
    ).run(randomUUID(), household.variableDailyCents, profileId, now, now);
    db.prepare(
      'INSERT INTO import_profiles(id,name,header_signature,settings_json,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?)'
    ).run(
      randomUUID(),
      importProfile.name,
      JSON.stringify(
        importProfile.headers.map((header) =>
          header.trim().toLocaleLowerCase('nl-NL')
        )
      ),
      JSON.stringify(importProfile.settings),
      profileId,
      now,
      now
    );
  };
  if (db.inTransaction) seed();
  else db.transaction(seed)();
}
