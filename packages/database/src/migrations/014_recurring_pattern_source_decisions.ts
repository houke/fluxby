import type { Migration, MigrationContext } from './index.js';

export const migration014: Migration = {
  version: 14,
  name: 'recurring_pattern_source_decisions',
  up: async (db: MigrationContext) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS recurring_pattern_source_decisions (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        pattern_id TEXT NOT NULL REFERENCES recurring_patterns(id) ON DELETE CASCADE,
        source_key TEXT NOT NULL,
        opposing_iban TEXT,
        merchant_name TEXT,
        status TEXT NOT NULL CHECK(status IN ('accepted', 'dismissed')),
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        is_deleted INTEGER NOT NULL DEFAULT 0,
        device_id TEXT,
        UNIQUE(profile_id, pattern_id, source_key)
      );
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_recurring_pattern_source_decisions_pattern
      ON recurring_pattern_source_decisions(pattern_id, profile_id, status, is_deleted);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_recurring_pattern_source_decisions_source
      ON recurring_pattern_source_decisions(profile_id, source_key, status, is_deleted);
    `);
  },
  down: async (db: MigrationContext) => {
    await db.execAsync(
      'DROP TABLE IF EXISTS recurring_pattern_source_decisions;'
    );
  },
};
