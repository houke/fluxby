import type { Migration, MigrationContext } from './index.js';

/**
 * Migration 011: Add performance indexes for payment method/provider filtering
 *
 * These indexes optimize:
 * 1. Payment method filtering in transaction list
 * 2. Payment provider filtering
 * 3. Category stats aggregation (covering index)
 *
 * NOTE: Do NOT use transactionAsync() here - the migration runner already wraps
 * all migrations in a single transaction for OPFS performance.
 */
export const migration011: Migration = {
  version: 11,
  name: 'performance_indexes',
  up: async (db: MigrationContext) => {
    // Index for payment method filtering
    // Used in: getTransactions with paymentMethods filter
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_payment_method_profile
      ON transactions(profile_id, payment_method, is_deleted)
      WHERE payment_method IS NOT NULL
    `);

    // Index for payment provider filtering
    // Used in: getTransactions with paymentProviders filter
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_payment_provider_profile
      ON transactions(profile_id, payment_provider, is_deleted)
      WHERE payment_provider IS NOT NULL
    `);

    // Covering index for category stats - includes amount for aggregation
    // Optimizes getCategories(withCounts=true) query
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_category_amount
      ON transactions(category_id, profile_id, is_deleted, amount)
      WHERE category_id IS NOT NULL
    `);

    // Index for budget spending calculation
    // Covers the JOIN and aggregation in getBudgets
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_budget_calc
      ON transactions(category_id, date, profile_id, is_deleted, amount)
    `);
  },

  down: async (db: MigrationContext) => {
    await db.execAsync(
      'DROP INDEX IF EXISTS idx_transactions_payment_method_profile'
    );
    await db.execAsync(
      'DROP INDEX IF EXISTS idx_transactions_payment_provider_profile'
    );
    await db.execAsync('DROP INDEX IF EXISTS idx_transactions_category_amount');
    await db.execAsync('DROP INDEX IF EXISTS idx_transactions_budget_calc');
  },
};
