import type { Migration, MigrationContext } from './index.js';

export const migration003: Migration = {
  version: 3,
  name: 'v6_profiles_hidden',
  up: async (db: MigrationContext) => {
    const columns = await db.queryAsync<{ name: string }>(
      'PRAGMA table_info(profiles)'
    );
    if (!columns.some(({ name }) => name === 'is_hidden')) {
      await db.execAsync(
        'ALTER TABLE profiles ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0;'
      );
    }
  },
  down: async (_db: MigrationContext) => {
    // No-op
  },
};
