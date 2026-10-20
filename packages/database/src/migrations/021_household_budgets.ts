import type { Migration } from './index.js';
const sync = `profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, is_deleted INTEGER NOT NULL DEFAULT 0, device_id TEXT`;
export const HOUSEHOLD_BUDGET_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS budget_months (
 id TEXT PRIMARY KEY, budget_id TEXT NOT NULL REFERENCES budgets(id), month TEXT NOT NULL,
 amount REAL NOT NULL CHECK(amount>=0), ${sync}, UNIQUE(profile_id,budget_id,month));
CREATE TABLE IF NOT EXISTS budget_preferences (
 id TEXT PRIMARY KEY, budget_id TEXT NOT NULL REFERENCES budgets(id), carry_negative INTEGER NOT NULL DEFAULT 0,
 ${sync}, UNIQUE(profile_id,budget_id));
CREATE TABLE IF NOT EXISTS category_preferences (
 id TEXT PRIMARY KEY, category_id TEXT NOT NULL REFERENCES categories(id), is_fixed INTEGER NOT NULL DEFAULT 0,
 allocation_group TEXT NOT NULL DEFAULT 'needs' CHECK(allocation_group IN ('needs','wants','savings')),
 archived INTEGER NOT NULL DEFAULT 0, ${sync}, UNIQUE(profile_id,category_id));
CREATE TABLE IF NOT EXISTS budget_income_plans (
 id TEXT PRIMARY KEY, month TEXT NOT NULL, expected_income REAL NOT NULL CHECK(expected_income>=0),
 ${sync}, UNIQUE(profile_id,month));
CREATE TABLE IF NOT EXISTS advanced_category_rules (
 id TEXT PRIMARY KEY, pattern TEXT NOT NULL, match_field TEXT NOT NULL DEFAULT 'all',
 match_mode TEXT NOT NULL DEFAULT 'contains', direction TEXT NOT NULL DEFAULT 'any',
 minimum_amount REAL, maximum_amount REAL, account_id TEXT REFERENCES accounts(id),
 category_id TEXT NOT NULL REFERENCES categories(id), priority INTEGER NOT NULL DEFAULT 0, ${sync});
CREATE INDEX IF NOT EXISTS idx_budget_months_profile ON budget_months(profile_id,month,is_deleted);
`;
export const migration021: Migration = {
  version: 21,
  name: 'Household budgets, category lifecycle and account display',
  up: async (db) => {
    await db.execAsync(HOUSEHOLD_BUDGET_SCHEMA_SQL);
    const columns = await db.queryAsync<{ name: string }>(
      'PRAGMA table_info(accounts)'
    );
    for (const column of ['kind', 'color'])
      if (!columns.some((c) => c.name === column))
        await db.execAsync(`ALTER TABLE accounts ADD COLUMN ${column} TEXT`);
  },
  down: async (db) => {
    for (const table of [
      'advanced_category_rules',
      'budget_income_plans',
      'category_preferences',
      'budget_preferences',
      'budget_months',
    ])
      await db.execAsync(`DROP TABLE IF EXISTS ${table}`);
  },
};
