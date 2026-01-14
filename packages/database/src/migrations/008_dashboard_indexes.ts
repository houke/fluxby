import type { Migration, MigrationContext } from './index.js';

/**
 * Migration 008: Add composite indexes for dashboard query performance
 *
 * The dashboard makes multiple queries that filter by profile_id (via accounts join)
 * and date range. These composite indexes will dramatically improve query performance,
 * especially for users with many transactions.
 *
 * Key indexes:
 * 1. transactions(account_id, date, type, is_deleted) - covers most dashboard queries
 * 2. transactions(account_id, date, category_id) - for category stats
 * 3. transactions(account_id, is_deleted, date DESC) - for recent transactions
 *
 * NOTE: Do NOT use transactionAsync() here - the migration runner already wraps
 * all migrations in a single transaction for OPFS performance.
 */
export const migration008: Migration = {
  version: 8,
  name: 'dashboard_performance_indexes',
  up: async (db: MigrationContext) => {
    // Composite index for dashboard stats queries
    // Covers: getDashboardStats, getTransferStats, getMonthlyStats
    // These queries filter by account_id (joined), date range, type, and is_deleted
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_dashboard_stats 
      ON transactions(account_id, is_deleted, date, type, amount)
    `);

    // Composite index for category stats
    // Covers: getCategoryStats query which groups by category_id
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_category_stats 
      ON transactions(account_id, is_deleted, category_id, date, amount)
    `);

    // Composite index for recent transactions query
    // Covers: getTransactions with limit, ordered by date DESC
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_recent 
      ON transactions(account_id, is_deleted, date DESC, id DESC)
    `);

    // Composite index for daily expenses
    // Covers: getDailyExpenses which groups by date
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_daily 
      ON transactions(account_id, is_deleted, date, amount, type)
    `);
  },

  down: async (db: MigrationContext) => {
    await db.execAsync('DROP INDEX IF EXISTS idx_transactions_dashboard_stats');
    await db.execAsync('DROP INDEX IF EXISTS idx_transactions_category_stats');
    await db.execAsync('DROP INDEX IF EXISTS idx_transactions_recent');
    await db.execAsync('DROP INDEX IF EXISTS idx_transactions_daily');
  },
};
