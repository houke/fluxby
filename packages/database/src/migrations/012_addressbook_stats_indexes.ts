import type { Migration, MigrationContext } from './index.js';

/**
 * Migration 012: Add indexes to optimize address book stats queries
 *
 * These indexes optimize:
 * 1. Address book transaction stats by address_book_id
 * 2. Opposing IBAN lookups for contacts
 * 3. Composite profile+date for date range queries
 *
 * NOTE: Do NOT use transactionAsync() here - the migration runner already wraps
 * all migrations in a single transaction for OPFS performance.
 */
export const migration012: Migration = {
  version: 12,
  name: 'addressbook_stats_indexes',
  up: async (db: MigrationContext) => {
    // Index for address book stats - used in getAddressBookContacts
    // Optimizes GROUP BY address_book_id aggregations
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_address_book
      ON transactions(address_book_id)
      WHERE address_book_id IS NOT NULL
    `);

    // Index for opposing IBAN lookups
    // Used when matching transactions to contacts by IBAN
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_opposing_iban
      ON transactions(opposing_account_iban)
      WHERE opposing_account_iban IS NOT NULL
    `);

    // Composite index for date range queries with profile
    // Optimizes getTransactions with date filters
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_profile_date
      ON transactions(profile_id, date, is_deleted)
    `);
  },

  down: async (db: MigrationContext) => {
    await db.execAsync(`
      DROP INDEX IF EXISTS idx_transactions_address_book
    `);
    await db.execAsync(`
      DROP INDEX IF EXISTS idx_transactions_opposing_iban
    `);
    await db.execAsync(`
      DROP INDEX IF EXISTS idx_transactions_profile_date
    `);
  },
};
