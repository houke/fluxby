
import type { Migration, MigrationContext } from './index.js';

export const migration004: Migration = {
  version: 7,
  name: 'v7_rules_profile_id',
  up: async (db: MigrationContext) => {
    try {
      await db.execAsync(
        'ALTER TABLE name_cleanup_rules ADD COLUMN profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE;'
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

    try {
      await db.execAsync(
        'ALTER TABLE payment_provider_rules ADD COLUMN profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE;'
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
  }
};
