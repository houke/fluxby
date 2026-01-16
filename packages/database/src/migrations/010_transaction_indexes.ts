import type { Migration, MigrationContext } from './index.js';

/**
 * Migration 010: Add compound transaction indexes for query optimization
 *
 * These indexes optimize the following slow queries:
 * 1. getTransactions - filtering by profile_id + date range + type
 * 2. Import deduplication - checking import_hash for existing transactions
 * 3. Transaction filtering by opposing account name/iban
 * 4. Date range queries with profile isolation
 *
 * NOTE: Do NOT use transactionAsync() here - the migration runner already wraps
 * all migrations in a single transaction for OPFS performance.
 */
export const migration010: Migration = {
  version: 10,
  name: 'transaction_compound_indexes',
  up: async (db: MigrationContext) => {
    // Compound index for date range queries with profile isolation
    // Used in: getTransactions, getDailyExpenses, getMonthlyData
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_profile_date
      ON transactions(profile_id, date, is_deleted)
    `);

    // Compound index for type + date filtering (common filter combination)
    // Used in: getTransactions with type filter
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_profile_type_date
      ON transactions(profile_id, type, date, is_deleted)
    `);

    // Index for import hash lookups during deduplication
    // Optimizes getExistingImportHashes() which runs during every import
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_import_hash_profile
      ON transactions(import_hash, profile_id)
      WHERE import_hash IS NOT NULL
    `);

    // Index for opposing account name searches (used in filters and address book matching)
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_opposing_name_profile
      ON transactions(opposing_account_name, profile_id, is_deleted)
      WHERE opposing_account_name IS NOT NULL
    `);

    // Index for merchant name searches
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_merchant_profile
      ON transactions(merchant_name, profile_id, is_deleted)
      WHERE merchant_name IS NOT NULL
    `);

    // Index for amount range queries (used in analytics)
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_amount_profile
      ON transactions(profile_id, amount, is_deleted)
    `);
  },

  down: async (db: MigrationContext) => {
    await db.execAsync('DROP INDEX IF EXISTS idx_transactions_profile_date');
    await db.execAsync(
      'DROP INDEX IF EXISTS idx_transactions_profile_type_date'
    );
    await db.execAsync(
      'DROP INDEX IF EXISTS idx_transactions_import_hash_profile'
    );
    await db.execAsync(
      'DROP INDEX IF EXISTS idx_transactions_opposing_name_profile'
    );
    await db.execAsync(
      'DROP INDEX IF EXISTS idx_transactions_merchant_profile'
    );
    await db.execAsync('DROP INDEX IF EXISTS idx_transactions_amount_profile');
  },
};
