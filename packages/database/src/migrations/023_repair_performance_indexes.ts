import type { Migration, MigrationContext } from './index.js';

// Migrations 009/010 reused names from migration 001 with IF NOT EXISTS,
// leaving the earlier, narrower indexes in place. Rebuild the intended
// definitions for both existing databases and new installations.
const indexes = [
  {
    name: 'idx_transactions_opposing_iban',
    definition:
      'transactions(opposing_account_iban, is_deleted, profile_id, opposing_account_name) WHERE opposing_account_iban IS NOT NULL',
    previous: 'transactions(opposing_account_iban)',
  },
  {
    name: 'idx_address_book_profile',
    definition: 'address_book(profile_id, is_deleted, name)',
    previous: 'address_book(profile_id)',
  },
  {
    name: 'idx_transactions_profile_date',
    definition: 'transactions(profile_id, date, is_deleted)',
    previous: 'transactions(profile_id, date)',
  },
  {
    name: 'idx_recurring_patterns_profile',
    definition:
      'recurring_patterns(profile_id, is_deleted, is_dismissed, is_confirmed)',
    previous: 'recurring_patterns(profile_id)',
  },
];

const importIndexes = [
  {
    name: 'idx_address_book_import_name',
    definition:
      'address_book(profile_id, LOWER(TRIM(name)), id, iban) WHERE is_deleted = 0',
  },
  {
    name: 'idx_address_book_import_iban',
    definition: 'address_book(iban, profile_id, id, name) WHERE is_deleted = 0',
  },
];

async function replaceIndexes(db: MigrationContext, restorePrevious: boolean) {
  // The migration runner wraps this replacement in its existing transaction.
  for (const index of indexes) {
    await db.execAsync(`DROP INDEX IF EXISTS ${index.name}`);
    await db.execAsync(
      `CREATE INDEX ${index.name} ON ${restorePrevious ? index.previous : index.definition}`
    );
  }
  for (const index of importIndexes) {
    await db.execAsync(`DROP INDEX IF EXISTS ${index.name}`);
    if (!restorePrevious)
      await db.execAsync(`CREATE INDEX ${index.name} ON ${index.definition}`);
  }
}

export const migration023: Migration = {
  version: 23,
  name: 'repair_performance_indexes',
  up: (db) => replaceIndexes(db, false),
  down: (db) => replaceIndexes(db, true),
};
