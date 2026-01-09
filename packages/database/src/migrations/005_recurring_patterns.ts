import type { Migration, MigrationContext } from './index.js';

export const migration005: Migration = {
  version: 5,
  name: 'Add recurring patterns for subscriptions',
  up: async (db: MigrationContext) => {
    // Determine if table exists first (SQLite doesn't support IF NOT EXISTS in all contexts cleanly in migrations sometimes, but standard SQL does)
    // We'll just run the CREATE TABLE IF NOT EXISTS
    
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS recurring_patterns (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          opposing_iban TEXT,
          merchant_name TEXT,
          pattern_type TEXT CHECK(pattern_type IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
          avg_amount REAL,
          last_amount REAL,
          last_date TEXT,
          next_expected_date TEXT,
          is_active INTEGER DEFAULT 1,
          is_confirmed INTEGER DEFAULT 0,
          is_variable INTEGER DEFAULT 0,
          transaction_count INTEGER DEFAULT 0,
          profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
          is_deleted INTEGER NOT NULL DEFAULT 0,
          device_id TEXT,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // Add indexes
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_recurring_patterns_profile ON recurring_patterns(profile_id);
    `);
    
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_recurring_patterns_updated_at ON recurring_patterns(updated_at);
    `);
    
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_recurring_patterns_merchant ON recurring_patterns(opposing_iban, merchant_name);
    `);
  },
  down: async (db: MigrationContext) => {
    await db.execAsync('DROP TABLE IF EXISTS recurring_patterns');
  },
};
