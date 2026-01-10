import type { Migration, MigrationContext } from './index.js';

/**
 * Template for creating new migrations
 * 
 * Usage:
 * 1. Copy this file to packages/database/src/migrations/00X_feature_name.ts
 * 2. Update the version number, name, and implementation
 * 3. Register in packages/database/src/migrations/index.ts
 * 4. Update LATEST_MIGRATION_VERSION
 */

export const migration00X: Migration = {
  version: X, // Replace X with the next sequential number
  name: 'Brief description of what this migration does',
  
  up: async (db: MigrationContext) => {
    // Forward migration
    // IMPORTANT: Wrap in transaction for OPFS performance
    await db.transactionAsync(async () => {
      
      // Example: Create a new table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS new_table (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          name TEXT NOT NULL,
          profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
          is_deleted INTEGER NOT NULL DEFAULT 0,
          device_id TEXT,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
        )
      `);

      // Example: Create indexes
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_new_table_profile 
        ON new_table(profile_id)
      `);

      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_new_table_updated_at 
        ON new_table(updated_at)
      `);

      // Example: Add column to existing table (with error handling)
      try {
        await db.execAsync(
          'ALTER TABLE existing_table ADD COLUMN new_column TEXT'
        );
      } catch (err) {
        if (
          err instanceof Error &&
          (err.message.includes('duplicate column') ||
            err.message.includes('already exists'))
        ) {
          // Column already exists, ignore
        } else {
          throw err;
        }
      }

      // Example: Seed data with parameterized queries
      await db.runAsync(
        `INSERT INTO new_table (id, name, profile_id, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          'Example Name',
          'profile-id',
          Date.now(),
          Date.now(),
        ]
      );

      // Example: Update existing data
      await db.runAsync(
        'UPDATE existing_table SET new_column = ? WHERE condition = ?',
        ['new_value', 'condition_value']
      );
    });
  },

  down: async (db: MigrationContext) => {
    // Rollback migration (optional but recommended)
    // SQLite doesn't support DROP COLUMN easily, so consider alternatives
    
    // Drop tables
    await db.execAsync('DROP TABLE IF EXISTS new_table');
    
    // Note: Cannot easily drop columns in SQLite
    // Consider creating a new table without the column and copying data
  },
};
