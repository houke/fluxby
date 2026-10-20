import type { Migration } from './index.js';
const sync = `profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, is_deleted INTEGER NOT NULL DEFAULT 0, device_id TEXT`;
export const HOUSEHOLD_PLANNING_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS planned_cashflows (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('income','expense')),
 amount_cents INTEGER NOT NULL CHECK(amount_cents>0), due_date TEXT NOT NULL,
 frequency TEXT NOT NULL CHECK(frequency IN ('once','monthly','fourweekly','quarterly','yearly')),
 reserved_cents INTEGER NOT NULL DEFAULT 0 CHECK(reserved_cents>=0),
 recurring_pattern_id TEXT REFERENCES recurring_patterns(id), ${sync});
CREATE INDEX IF NOT EXISTS idx_planned_cashflows_profile ON planned_cashflows(profile_id,is_deleted);
CREATE TABLE IF NOT EXISTS household_planning_preferences (
 id TEXT PRIMARY KEY, variable_daily_cents INTEGER NOT NULL DEFAULT 0 CHECK(variable_daily_cents>=0), ${sync}, UNIQUE(profile_id));
CREATE TABLE IF NOT EXISTS net_worth_snapshots (
 id TEXT PRIMARY KEY, date TEXT NOT NULL, cash_cents INTEGER NOT NULL, assets_cents INTEGER NOT NULL,
 liabilities_cents INTEGER NOT NULL, complete INTEGER NOT NULL DEFAULT 1, ${sync}, UNIQUE(profile_id,date));
CREATE TABLE IF NOT EXISTS weekly_reviews (
 id TEXT PRIMARY KEY, week TEXT NOT NULL, checks_json TEXT NOT NULL DEFAULT '{}',
 status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','complete')), ${sync}, UNIQUE(profile_id,week));
CREATE TABLE IF NOT EXISTS goal_transaction_links (
 id TEXT PRIMARY KEY, goal_id TEXT NOT NULL REFERENCES savings_goals(id),
 transaction_id TEXT NOT NULL REFERENCES transactions(id), amount_cents INTEGER NOT NULL CHECK(amount_cents>0),
 ${sync}, UNIQUE(profile_id,goal_id,transaction_id));
CREATE TABLE IF NOT EXISTS goal_archive_state (
 id TEXT PRIMARY KEY, goal_id TEXT NOT NULL REFERENCES savings_goals(id),
 archived INTEGER NOT NULL DEFAULT 0, ${sync}, UNIQUE(profile_id,goal_id));
`;
export const migration020: Migration = {
  version: 20,
  name: 'Dated household cashflows, forecasts, snapshots and weekly reviews',
  up: async (db) => {
    await db.execAsync(HOUSEHOLD_PLANNING_SCHEMA_SQL);
  },
  down: async (db) => {
    for (const table of [
      'goal_archive_state',
      'goal_transaction_links',
      'weekly_reviews',
      'net_worth_snapshots',
      'household_planning_preferences',
      'planned_cashflows',
    ])
      await db.execAsync(`DROP TABLE IF EXISTS ${table}`);
  },
};
