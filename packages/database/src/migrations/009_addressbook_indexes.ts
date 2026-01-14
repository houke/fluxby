import type { Migration, MigrationContext } from './index.js';

/**
 * Migration 009: Add performance indexes for address book and category queries
 *
 * These indexes optimize the following slow queries:
 * 1. getAddressBookContacts - joins transactions with address_book for stats
 * 2. getCategories(withCounts=true) - counts transactions per category
 *
 * The address book query is particularly slow because it does a complex join
 * matching transactions by address_book_id OR iban + name combinations.
 *
 * NOTE: Do NOT use transactionAsync() here - the migration runner already wraps
 * all migrations in a single transaction for OPFS performance.
 */
export const migration009: Migration = {
  version: 9,
  name: 'addressbook_performance_indexes',
  up: async (db: MigrationContext) => {
    // Index for address_book_id lookups in transactions
    // Used when joining transactions to address_book entries
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_address_book_id
      ON transactions(address_book_id, is_deleted, profile_id)
      WHERE address_book_id IS NOT NULL
    `);

    // Index for IBAN lookups in transactions (fallback when no address_book_id)
    // Covers the OR condition in getAddressBookContacts query
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_opposing_iban
      ON transactions(opposing_account_iban, is_deleted, profile_id, opposing_account_name)
      WHERE opposing_account_iban IS NOT NULL
    `);

    // Index for category_id lookups when counting transactions per category
    // Optimizes getCategories(withCounts=true) query
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_category_profile
      ON transactions(category_id, is_deleted, profile_id)
    `);

    // Index for profile_id on address_book for fast contact lookups
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_address_book_profile
      ON address_book(profile_id, is_deleted, name)
    `);

    // Index for contact_ibans lookups
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_contact_ibans_contact
      ON contact_ibans(contact_id)
    `);

    // Index for recurring patterns lookups (used in subscriptions page)
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_recurring_patterns_profile
      ON recurring_patterns(profile_id, is_deleted, is_dismissed, is_confirmed)
    `);
  },

  down: async (db: MigrationContext) => {
    await db.execAsync('DROP INDEX IF EXISTS idx_transactions_address_book_id');
    await db.execAsync('DROP INDEX IF EXISTS idx_transactions_opposing_iban');
    await db.execAsync(
      'DROP INDEX IF EXISTS idx_transactions_category_profile'
    );
    await db.execAsync('DROP INDEX IF EXISTS idx_address_book_profile');
    await db.execAsync('DROP INDEX IF EXISTS idx_contact_ibans_contact');
    await db.execAsync('DROP INDEX IF EXISTS idx_recurring_patterns_profile');
  },
};
