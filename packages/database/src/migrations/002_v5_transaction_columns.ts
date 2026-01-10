import type { Migration, MigrationContext } from './index.js';

export const migration002: Migration = {
  version: 2,
  name: 'v5_transaction_columns',
  up: async (db: MigrationContext) => {
    // Add payment_provider
    try {
      await db.execAsync(
        'ALTER TABLE transactions ADD COLUMN payment_provider TEXT;'
      );
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes('duplicate column') ||
          err.message.includes('already exists'))
      ) {
        // Already exists, ignore
      } else {
        throw err;
      }
    }

    // Add address_book_id
    try {
      await db.execAsync(
        'ALTER TABLE transactions ADD COLUMN address_book_id TEXT;'
      );
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes('duplicate column') ||
          err.message.includes('already exists'))
      ) {
        // Already exists, ignore
      } else {
        throw err;
      }
    }
  },
  down: async (_db: MigrationContext) => {
    // No-op
  },
};
