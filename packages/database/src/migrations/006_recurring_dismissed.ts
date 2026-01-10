import type { Migration, MigrationContext } from './index.js';

export const migration006: Migration = {
  version: 6,
  name: 'Add is_dismissed to recurring_patterns',
  up: async (db: MigrationContext) => {
    // Add is_dismissed column to track permanently dismissed suggestions
    // Dismissed patterns won't be re-suggested even when re-detected
    try {
      await db.execAsync(
        'ALTER TABLE recurring_patterns ADD COLUMN is_dismissed INTEGER NOT NULL DEFAULT 0;'
      );
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes('duplicate column') ||
          err.message.includes('already exists'))
      ) {
        // Already exists
      } else {
        throw err;
      }
    }

    // Migrate existing is_active=0 patterns to is_dismissed=1
    await db.execAsync(
      `UPDATE recurring_patterns SET is_dismissed = 1 WHERE is_active = 0`
    );
  },
  down: async (_db: MigrationContext) => {
    // No-op - SQLite doesn't support DROP COLUMN easily
  },
};
