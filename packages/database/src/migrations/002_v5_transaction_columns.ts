import type { Migration, MigrationContext } from './index.js';

export const migration002: Migration = {
  version: 2,
  name: 'v5_transaction_columns',
  up: async (db: MigrationContext) => {
    const columns = new Set(
      (
        await db.queryAsync<{ name: string }>('PRAGMA table_info(transactions)')
      ).map(({ name }) => name)
    );
    // Add payment_provider
    if (!columns.has('payment_provider')) {
      await db.execAsync(
        'ALTER TABLE transactions ADD COLUMN payment_provider TEXT;'
      );
    }

    // Add address_book_id
    if (!columns.has('address_book_id')) {
      await db.execAsync(
        'ALTER TABLE transactions ADD COLUMN address_book_id TEXT;'
      );
    }
  },
  down: async (_db: MigrationContext) => {
    // No-op
  },
};
