import type { Migration, MigrationContext } from './index.js';

export const migration006: Migration = {
  version: 6,
  name: 'Test migration for migration prompt',
  up: async (db: MigrationContext) => {
    // Add a test column to user_preferences table
    await db.execAsync(`
      ALTER TABLE user_preferences ADD COLUMN test_migration_flag TEXT DEFAULT 'v6';
    `);
  },
  down: async (db: MigrationContext) => {
    // Note: SQLite doesn't support DROP COLUMN, so we just leave it
    // In a real scenario, you'd need to recreate the table without the column
    await db.execAsync(`
      -- SQLite doesn't support DROP COLUMN
      -- Would need table recreation to truly roll back
      SELECT 1;
    `);
  },
};
