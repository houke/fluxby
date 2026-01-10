import type { Migration, MigrationContext } from './index.js';

export const migration003: Migration = {
  version: 3,
  name: 'v6_profiles_hidden',
  up: async (db: MigrationContext) => {
    try {
      await db.execAsync(
        'ALTER TABLE profiles ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0;'
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
  },
  down: async (db: MigrationContext) => {
    // No-op
  },
};
