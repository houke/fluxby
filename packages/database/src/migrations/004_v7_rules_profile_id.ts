import type { Migration, MigrationContext } from './index.js';

export const migration004: Migration = {
  version: 4,
  name: 'v7_rules_profile_id',
  up: async (db: MigrationContext) => {
    for (const table of ['name_cleanup_rules', 'payment_provider_rules']) {
      const columns = await db.queryAsync<{ name: string }>(
        `PRAGMA table_info(${table})`
      );
      if (!columns.some(({ name }) => name === 'profile_id')) {
        await db.execAsync(
          `ALTER TABLE ${table} ADD COLUMN profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE;`
        );
      }
    }
  },
  down: async (_db: MigrationContext) => {
    // No-op
  },
};
