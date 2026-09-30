import type { Migration, MigrationContext } from './index.js';

const syncColumns = `
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  is_deleted INTEGER NOT NULL DEFAULT 0,
  device_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
`;

export const FINANCIAL_PLANNING_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS savings_goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL CHECK(target_amount > 0),
  deadline TEXT,
  monthly_contribution REAL NOT NULL DEFAULT 0 CHECK(monthly_contribution >= 0),
  ${syncColumns}
);
CREATE TABLE IF NOT EXISTS savings_contributions (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  amount REAL NOT NULL CHECK(amount > 0),
  ${syncColumns}
);
CREATE TABLE IF NOT EXISTS planning_preferences (
  id TEXT PRIMARY KEY,
  minimum_balance REAL NOT NULL DEFAULT 0 CHECK(minimum_balance >= 0),
  reserved_savings REAL NOT NULL DEFAULT 0 CHECK(reserved_savings >= 0),
  ${syncColumns},
  UNIQUE(profile_id)
);
CREATE TABLE IF NOT EXISTS net_worth_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('asset','liability')),
  amount REAL NOT NULL CHECK(amount >= 0),
  ${syncColumns}
);
CREATE TABLE IF NOT EXISTS monthly_reviews (
  id TEXT PRIMARY KEY,
  month TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','complete')),
  checks_json TEXT NOT NULL DEFAULT '{}',
  ${syncColumns},
  UNIQUE(profile_id,month)
);
CREATE TABLE IF NOT EXISTS transaction_splits (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount REAL NOT NULL CHECK(amount > 0),
  ${syncColumns}
);
CREATE TABLE IF NOT EXISTS saved_transaction_views (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  filters_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  ${syncColumns}
);
CREATE TABLE IF NOT EXISTS statement_reconciliations (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  opening_balance REAL NOT NULL,
  actual_closing_balance REAL NOT NULL,
  expected_closing_balance REAL NOT NULL,
  difference REAL NOT NULL,
  transaction_count INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('matched','difference')),
  ${syncColumns}
);
CREATE TABLE IF NOT EXISTS change_history (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  undone_at INTEGER,
  ${syncColumns}
);
CREATE INDEX IF NOT EXISTS idx_savings_goals_profile ON savings_goals(profile_id,is_deleted);
CREATE INDEX IF NOT EXISTS idx_savings_contributions_goal ON savings_contributions(goal_id,is_deleted);
CREATE INDEX IF NOT EXISTS idx_net_worth_items_profile ON net_worth_items(profile_id,is_deleted);
CREATE INDEX IF NOT EXISTS idx_transaction_splits_transaction ON transaction_splits(transaction_id,is_deleted);
CREATE INDEX IF NOT EXISTS idx_saved_transaction_views_profile ON saved_transaction_views(profile_id,is_deleted);
CREATE INDEX IF NOT EXISTS idx_statement_reconciliations_account ON statement_reconciliations(account_id,start_date,end_date);
CREATE INDEX IF NOT EXISTS idx_change_history_profile_created ON change_history(profile_id,created_at DESC);
`;

async function addColumn(
  db: MigrationContext,
  table: string,
  name: string,
  definition: string
) {
  const columns = await db.queryAsync<{ name: string }>(
    `PRAGMA table_info(${table})`
  );
  if (!columns.some((column) => column.name === name))
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
}

export const migration016: Migration = {
  version: 16,
  name: 'Financial planning, splits, reconciliation and change history',
  up: async (db) => {
    await db.execAsync(FINANCIAL_PLANNING_SCHEMA_SQL);
    await addColumn(
      db,
      'budgets',
      'rollover_enabled',
      'INTEGER NOT NULL DEFAULT 0'
    );
    await addColumn(db, 'recurring_patterns', 'renewal_date', 'TEXT');
    await addColumn(db, 'recurring_patterns', 'cancellation_deadline', 'TEXT');
  },
  down: async (db) => {
    for (const table of [
      'change_history',
      'statement_reconciliations',
      'saved_transaction_views',
      'transaction_splits',
      'monthly_reviews',
      'net_worth_items',
      'planning_preferences',
      'savings_contributions',
      'savings_goals',
    ]) {
      await db.execAsync(`DROP TABLE IF EXISTS ${table}`);
    }
    // SQLite column removal would rebuild existing user tables. Keep additive
    // fields when rolling back the optional feature tables.
  },
};
