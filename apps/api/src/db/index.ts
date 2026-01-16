import Database, { type Database as DatabaseType } from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateTransactionHash } from '@fluxby/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file location
const DB_PATH =
  process.env.DB_PATH ||
  join(__dirname, '..', '..', '..', '..', 'data', 'fluxby.db');

// Create database connection
export const db: DatabaseType = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Enable foreign keys for cascading deletes
db.pragma('foreign_keys = ON');

// Register regexp function for SQL queries
db.function('regexp', (pattern: string, text: string) => {
  if (!text || !pattern) return 0;
  try {
    return new RegExp(pattern, 'i').test(text) ? 1 : 0;
  } catch {
    return 0;
  }
});

// Initialize database schema
export function initializeDatabase(): void {
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  // Execute schema
  db.exec(schema);

  // Update categories to Dutch if they're still in English
  updateCategoriesToDutch();

  // Seed defaults if table is empty
  seedDefaultCategories();

  // Add balance_after column if it doesn't exist
  try {
    db.exec('ALTER TABLE transactions ADD COLUMN balance_after DECIMAL(10,2)');
  } catch {
    // Column already exists
  }

  // Add description column to categories if it doesn't exist
  try {
    db.exec('ALTER TABLE categories ADD COLUMN description TEXT');
  } catch {
    // Column already exists
  }

  // Add current_balance column to accounts if it doesn't exist
  try {
    db.exec(
      'ALTER TABLE accounts ADD COLUMN current_balance DECIMAL(10,2) DEFAULT 0'
    );
  } catch {
    // Column already exists
  }

  // Add order_index column to accounts if it doesn't exist
  try {
    db.exec('ALTER TABLE accounts ADD COLUMN order_index INTEGER DEFAULT 0');
  } catch {
    // Column already exists
  }

  // Set order_index for existing accounts that don't have it set
  try {
    db.exec(`
      UPDATE accounts 
      SET order_index = (
        SELECT COUNT(*) - 1 FROM accounts a2 
        WHERE a2.name < accounts.name OR (a2.name = accounts.name AND a2.id < accounts.id)
      ) 
      WHERE order_index IS NULL OR order_index = 0
    `);
  } catch {
    // Ignore if update fails
  }

  // Add bank column to imports if it doesn't exist
  try {
    db.exec("ALTER TABLE imports ADD COLUMN bank TEXT DEFAULT 'ing'");
  } catch {
    // Column already exists
  }

  // Add skipped_rows, duplicates_skipped, parse_errors columns to imports if they don't exist
  try {
    db.exec('ALTER TABLE imports ADD COLUMN skipped_rows JSON');
  } catch {
    // Column already exists
  }
  try {
    db.exec(
      'ALTER TABLE imports ADD COLUMN duplicates_skipped INTEGER DEFAULT 0'
    );
  } catch {
    // Column already exists
  }
  try {
    db.exec('ALTER TABLE imports ADD COLUMN parse_errors INTEGER DEFAULT 0');
  } catch {
    // Column already exists
  }
  try {
    db.exec(
      'ALTER TABLE imports ADD COLUMN profile_id INTEGER DEFAULT 1 REFERENCES profiles(id) ON DELETE CASCADE'
    );
  } catch {
    // Column already exists
  }

  // Add payment_method column to transactions if it doesn't exist
  try {
    db.exec('ALTER TABLE transactions ADD COLUMN payment_method TEXT');
  } catch {
    // Column already exists
  }

  // Migrate legacy payment method values to current canonical values
  try {
    migrateLegacyPaymentMethods();
  } catch {
    // Ignore migration errors during init
  }

  // Add import_hash column if it doesn't exist (older DBs)
  try {
    db.exec('ALTER TABLE transactions ADD COLUMN import_hash TEXT');
  } catch {
    // Column already exists
  }

  // Ensure we have a usable unique constraint for import_hash (skip duplicates on import)
  try {
    // Drop old global index if it exists
    db.exec('DROP INDEX IF EXISTS idx_transactions_import_hash');
    // Create new profile-scoped unique index
    db.exec(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_import_hash_scoped ON transactions(import_hash, profile_id) WHERE import_hash IS NOT NULL AND TRIM(import_hash) != ''"
    );
  } catch (error) {
    console.warn(
      'Failed to update import_hash index (might be expected):',
      error
    );
  }

  // Backfill missing import_hash values so older data also dedupes correctly
  backfillTransactionImportHashes();

  applyPastelCategoryColors();

  // Clean up potential duplicate "Sparen" rows created earlier
  dedupeCategoryByName('Sparen');

  // Clean up potential duplicate "Toeslagen" rows
  dedupeCategoryByName('Toeslagen');

  // Migrate address_book.nickname to description
  migrateAddressBookNicknameToDescription();

  // Create shared_ibans table if it doesn't exist
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS shared_ibans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        iban TEXT UNIQUE NOT NULL,
        provider_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch {
    // Table already exists
  }

  // Ensure default user profile exists
  try {
    db.exec(
      "INSERT OR IGNORE INTO users (id, name, avatar) VALUES (1, 'Gebruiker', 'linear-gradient(135deg, #6366F1, #A855F7)')"
    );
  } catch {
    // User already exists
  }

  // Create name cleanup rules table for address book
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS name_cleanup_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern TEXT NOT NULL UNIQUE,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default cleanup rules (including regex patterns)
    // Regex patterns are written as /pattern/flags
    const defaultRules = [
      'by Buckaroo',
      'SumUp *',
      'BCK*',
      'CCV*',
      '/\\s*via\\s+[^,]+$/gi', // Removes " via Provider" at end of names
    ];
    for (const rule of defaultRules) {
      db.exec(
        `INSERT OR IGNORE INTO name_cleanup_rules (pattern) VALUES ('${rule.replace(
          /'/g,
          "''"
        )}')`
      );
    }
  } catch {
    // Table already exists
  }

  // Create contact_ibans junction table for multiple IBANs per contact
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS contact_ibans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id INTEGER NOT NULL REFERENCES address_book(id) ON DELETE CASCADE,
        iban TEXT NOT NULL,
        is_primary INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(contact_id, iban)
      )
    `);
    db.exec(
      'CREATE INDEX IF NOT EXISTS idx_contact_ibans_iban ON contact_ibans(iban)'
    );
    db.exec(
      'CREATE INDEX IF NOT EXISTS idx_contact_ibans_contact_id ON contact_ibans(contact_id)'
    );
  } catch {
    // Table/indexes already exist
  }

  // Migrate existing address_book IBANs to contact_ibans if not already done
  migrateAddressBookIbansToJunction();

  // Create payment_providers table for known payment processor IBANs (kept for IBAN overview)
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS payment_providers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        iban TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // No hard-coded payment provider seeds — providers are managed via Settings
  } catch {
    // Table already exists
  }

  // Create payment_provider_rules table for rule-based detection
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS payment_provider_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        patterns TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // No hard-coded payment provider rule seeds — rules are managed via Settings
    // But add some common ones for onboarding demo purposes
    const defaultRules = [
      { name: 'PayPal', patterns: 'paypal|paypal \\*.*' },
      { name: 'Tikkie', patterns: 'tikkie|tikkie \\*.*' },
      { name: 'Bunq', patterns: 'bunq|bunq \\*.*' },
      { name: 'Adyen', patterns: 'adyen|adyen \\*.*' },
      // Mobile wallet payment providers
      { name: 'Google Pay', patterns: 'google pay|g\\.co/helppay|g\\.co/pay' },
      { name: 'Apple Pay', patterns: 'apple pay|\\*apple pay' },
    ];

    for (const rule of defaultRules) {
      try {
        db.prepare(
          'INSERT OR REPLACE INTO payment_provider_rules (name, patterns) VALUES (?, ?)'
        ).run(rule.name, rule.patterns);
      } catch {
        // Rule already exists
      }
    }
  } catch {
    // Table already exists
  }

  // Add address_book_id column to transactions for direct linking
  try {
    db.exec(
      'ALTER TABLE transactions ADD COLUMN address_book_id INTEGER REFERENCES address_book(id) ON DELETE SET NULL'
    );
  } catch {
    // Column already exists
  }

  // Add payment_provider column to transactions for manual override
  try {
    db.exec('ALTER TABLE transactions ADD COLUMN payment_provider TEXT');
  } catch {
    // Column already exists
  }

  // Clean up duplicate payment_provider_rules entries (keep oldest entry for each name)
  dedupePaymentProviderRules();

  // Remove incorrect 'Pay.' rule (keep 'Pay.nl' which is correct)
  cleanupIncorrectPayRule();

  // Clean up shared_iban_merchants: merge entries with same IBAN and case-insensitive display_name
  dedupeSharedIbanMerchants();

  // Clean up any duplicate IBANs in contact_ibans
  dedupeContactIbans();

  // Merge address book entries with duplicate names
  mergeDuplicateAddressBookNames();

  // MAJOR MIGRATION: Consolidate shared_iban_merchants into address_book
  consolidateSharedIbanMerchantsIntoAddressBook();

  // Ensure all data has a profile_id
  backfillMissingProfileIds();

  // Ensure all transactions have the correct profile_id from their account
  syncTransactionProfileIds();

  console.warn('Database initialized successfully');
}

/**
 * Ensures all existing records have a profile_id
 */
function backfillMissingProfileIds(): void {
  try {
    // Get default profile ID (usually 1, but check DB to be sure)
    const result = db
      .prepare('SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1')
      .get() as { id: number } | undefined;
    const defaultProfileId = result?.id ?? 1;

    const tables = [
      'accounts',
      'transactions',
      'categories',
      'budgets',
      'category_rules',
      'address_book',
      'imports',
    ];

    for (const table of tables) {
      const result = db
        .prepare(`UPDATE ${table} SET profile_id = ? WHERE profile_id IS NULL`)
        .run(defaultProfileId);
      if (result.changes > 0) {
        console.warn(
          `Backfilled profile_id for ${result.changes} rows in ${table}`
        );
      }
    }
  } catch (error) {
    console.error('Failed to backfill profile IDs:', error);
  }
}

/**
 * Ensures all transactions have the correct profile_id based on their account
 */
function syncTransactionProfileIds(): void {
  try {
    const result = db
      .prepare(
        `
      UPDATE transactions 
      SET profile_id = (SELECT profile_id FROM accounts WHERE accounts.id = transactions.account_id)
      WHERE profile_id IS NULL OR profile_id != (SELECT profile_id FROM accounts WHERE accounts.id = transactions.account_id)
    `
      )
      .run();
    if (result.changes > 0) {
      console.warn(`Synced profile_id for ${result.changes} transactions`);
    }
  } catch (error) {
    console.error('Failed to sync transaction profile IDs:', error);
  }
}

/**
 * Migration for multi-tenant profile support
 * Creates profiles table and adds profile_id columns to existing tables
 * Backfills existing data with default profile
 */
function _migrateToMultiTenant(): void {
  try {
    // 1. Create profiles table if it doesn't exist (schema.sql handles this for new DBs)
    db.exec(`
      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 1,
        name TEXT NOT NULL,
        type TEXT CHECK(type IN ('personal', 'business', 'shared', 'savings')) DEFAULT 'personal',
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 2. Ensure default profile exists
    const defaultProfile = db
      .prepare('SELECT id FROM profiles WHERE id = 1')
      .get() as { id: number } | undefined;

    if (!defaultProfile) {
      db.prepare(
        "INSERT INTO profiles (id, user_id, name, type) VALUES (1, 1, 'Persoonlijk', 'personal')"
      ).run();
      console.warn('Created default profile "Persoonlijk"');
    }

    // 3. Add profile_id column to accounts if it doesn't exist
    try {
      db.exec(
        'ALTER TABLE accounts ADD COLUMN profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE'
      );
      console.warn('Added profile_id column to accounts table');
    } catch {
      // Column already exists
    }

    // 4. Add profile_id column to transactions if it doesn't exist
    try {
      db.exec(
        'ALTER TABLE transactions ADD COLUMN profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE'
      );
      console.warn('Added profile_id column to transactions table');
    } catch {
      // Column already exists
    }

    // 5. Add profile_id column to categories if it doesn't exist
    try {
      db.exec(
        'ALTER TABLE categories ADD COLUMN profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE'
      );
      console.warn('Added profile_id column to categories table');
    } catch {
      // Column already exists
    }

    // 6. Add profile_id column to budgets if it doesn't exist
    try {
      db.exec(
        'ALTER TABLE budgets ADD COLUMN profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE'
      );
      console.warn('Added profile_id column to budgets table');
    } catch {
      // Column already exists
    }

    // 7. Add profile_id column to category_rules if it doesn't exist
    try {
      db.exec(
        'ALTER TABLE category_rules ADD COLUMN profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE'
      );
      console.warn('Added profile_id column to category_rules table');
    } catch {
      // Column already exists
    }

    // 6. Add profile_id column to address_book if it doesn't exist (using 8 to keep sequence from previous file but here I'll just use a safe number or no number)
    try {
      db.exec(
        'ALTER TABLE address_book ADD COLUMN profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE'
      );
      console.warn('Added profile_id column to address_book table');
    } catch {
      // Column already exists
    }

    // 8. Backfill existing records with default profile_id = 1
    // Note: We use 1 as default. Since we removed DEFAULT from ALTER TABLE for compatibility, new columns might be NULL initially.
    db.exec('UPDATE accounts SET profile_id = 1 WHERE profile_id IS NULL');
    db.exec('UPDATE transactions SET profile_id = 1 WHERE profile_id IS NULL');
    db.exec('UPDATE categories SET profile_id = 1 WHERE profile_id IS NULL');
    db.exec('UPDATE budgets SET profile_id = 1 WHERE profile_id IS NULL');
    db.exec(
      'UPDATE category_rules SET profile_id = 1 WHERE profile_id IS NULL'
    );
    db.exec('UPDATE address_book SET profile_id = 1 WHERE profile_id IS NULL');

    // 9. Create indexes for profile_id columns
    try {
      db.exec(
        'CREATE INDEX IF NOT EXISTS idx_accounts_profile ON accounts(profile_id)'
      );
      db.exec(
        'CREATE INDEX IF NOT EXISTS idx_transactions_profile ON transactions(profile_id)'
      );
      db.exec(
        'CREATE INDEX IF NOT EXISTS idx_categories_profile ON categories(profile_id)'
      );
      db.exec(
        'CREATE INDEX IF NOT EXISTS idx_budgets_profile ON budgets(profile_id)'
      );
      db.exec(
        'CREATE INDEX IF NOT EXISTS idx_category_rules_profile ON category_rules(profile_id)'
      );
    } catch {
      // Indexes already exist
    }
  } catch (error) {
    console.error('Error during multi-tenant migration:', error);
  }
}

function migrateLegacyPaymentMethods(): void {
  try {
    const info = db
      .prepare(
        "SELECT COUNT(*) as c FROM transactions WHERE LOWER(TRIM(payment_method)) = 'diversen'"
      )
      .get() as { c: number };

    if (info.c && info.c > 0) {
      const res = db
        .prepare(
          "UPDATE transactions SET payment_method = 'incasso' WHERE LOWER(TRIM(payment_method)) = 'diversen'"
        )
        .run();
      console.warn(
        `Migrated ${res.changes} transactions: 'diversen' -> 'incasso'`
      );
    }
  } catch (error) {
    console.error('Failed to migrate legacy payment methods', error);
  }
}

function backfillTransactionImportHashes(): void {
  const rows = db
    .prepare(
      `
      SELECT
        t.id as id,
        t.date as date,
        t.amount as amount,
        COALESCE(NULLIF(TRIM(t.notes), ''), NULLIF(TRIM(t.description), ''), NULLIF(TRIM(t.merchant_name), ''), '') as description,
        a.iban as iban
      FROM transactions t
      LEFT JOIN accounts a ON a.id = t.account_id
      WHERE t.import_hash IS NULL OR TRIM(t.import_hash) = ''
    `
    )
    .all() as Array<{
    id: number;
    date: string;
    amount: number;
    description: string;
    iban: string | null;
  }>;

  if (!rows.length) return;

  const update = db.prepare(
    'UPDATE transactions SET import_hash = ? WHERE id = ?'
  );

  const tx = db.transaction(() => {
    for (const row of rows) {
      const iban = row.iban || '';
      const baseHash = generateTransactionHash(
        row.date,
        Math.abs(Number(row.amount) || 0),
        row.description || '',
        iban
      );

      try {
        update.run(baseHash, row.id);
      } catch {
        // If we collide with an existing hash, keep it unique but still non-empty.
        update.run(`${baseHash}-${row.id}`, row.id);
      }
    }
  });

  tx();
}

function migrateAddressBookNicknameToDescription(): void {
  try {
    // Check if nickname column exists
    const tableInfo = db
      .prepare("PRAGMA table_info('address_book')")
      .all() as Array<{ name: string }>;

    const hasNickname = tableInfo.some((col) => col.name === 'nickname');
    const hasDescription = tableInfo.some((col) => col.name === 'description');

    if (hasNickname && !hasDescription) {
      // SQLite 3.25+ supports RENAME COLUMN, but for broader compatibility:
      // 1. Add new column
      db.exec('ALTER TABLE address_book ADD COLUMN description TEXT');

      // 2. Copy data
      db.exec('UPDATE address_book SET description = nickname');

      // Note: We can't drop the old column in SQLite easily without recreating the table
      // For now, both columns will exist but we only use 'description'
      console.warn('Migrated address_book.nickname to description');
    } else if (!hasDescription) {
      // Neither column exists, add description
      db.exec('ALTER TABLE address_book ADD COLUMN description TEXT');
    }
  } catch (error) {
    console.warn('Address book migration note:', error);
    // Ignore errors - column might already exist
  }
}

const PASTEL_COLORS = [
  '#2563EB',
  '#1D4ED8',
  '#3B82F6',
  '#1E40AF',
  '#0EA5E9',
  '#06B6D4',
  '#22D3EE',
  '#14B8A6',
  '#10B981',
  '#34D399',
  '#4ADE80',
  '#84CC16',
  '#A3E635',
  '#F59E0B',
  '#F97316',
  '#EA580C',
  '#F43F5E',
  '#EF4444',
  '#DC2626',
  '#E11D48',
  '#C026D3',
  '#A855F7',
  '#8B5CF6',
  '#6366F1',
  '#4F46E5',
  '#312E81',
  '#0F172A',
  '#475569',
  '#94A3B8',
  '#E2E8F0',
];

const DEFAULT_CATEGORIES: Array<{
  id: number;
  name: string;
  icon: string;
  color: string;
}> = [
  { id: 1, name: 'Boodschappen', icon: '🛒', color: '#34D399' },
  { id: 2, name: 'Uit eten', icon: '🍽️', color: '#F97316' },
  { id: 3, name: 'Vervoer', icon: '🚗', color: '#3B82F6' },
  { id: 4, name: 'Winkelen', icon: '🛍️', color: '#A855F7' },
  { id: 5, name: 'Entertainment', icon: '🎬', color: '#F43F5E' },
  { id: 6, name: 'Gezondheid', icon: '💊', color: '#EF4444' },
  { id: 7, name: 'Rekeningen', icon: '📄', color: '#475569' },
  { id: 8, name: 'Huur/Hypotheek', icon: '🏠', color: '#1E40AF' },
  { id: 9, name: 'Salaris', icon: '💰', color: '#10B981' },
  { id: 10, name: 'Overboekingen', icon: '↔️', color: '#6366F1' },
  { id: 11, name: 'Abonnementen', icon: '📱', color: '#0EA5E9' },
  { id: 12, name: 'Overig', icon: '📦', color: '#94A3B8' },
  { id: 13, name: 'Thuisbezorgd', icon: '🛵', color: '#EA580C' },
  { id: 14, name: "Kado's", icon: '🎁', color: '#C026D3' },
  { id: 21, name: 'Huisdieren', icon: '🐾', color: '#8B5CF6' },
  { id: 22, name: 'Goede doelen', icon: '🙏', color: '#F59E0B' },
  { id: 23, name: 'Sparen', icon: '🏦', color: '#2563EB' },
  { id: 24, name: 'Toeslagen', icon: '📥', color: '#06B6D4' },
  { id: 25, name: 'Woonlasten', icon: '⚡', color: '#D97706' },
  { id: 26, name: 'Internet', icon: '🌐', color: '#3B82F6' },
];

function applyPastelCategoryColors(): void {
  const categoriesNeedingColor = db
    .prepare(
      "SELECT id FROM categories WHERE color IS NULL OR TRIM(color) = '' ORDER BY id"
    )
    .all() as { id: number }[];

  if (!categoriesNeedingColor.length) return;

  const update = db.prepare('UPDATE categories SET color = ? WHERE id = ?');
  categoriesNeedingColor.forEach((cat, idx) => {
    const color = PASTEL_COLORS[idx % PASTEL_COLORS.length];
    update.run(color, cat.id);
  });
}

function seedDefaultCategories(): void {
  const countRow = db
    .prepare('SELECT COUNT(*) as count FROM categories')
    .get() as { count: number };

  if (countRow.count > 0) return;

  const insert = db.prepare(
    'INSERT OR IGNORE INTO categories (id, name, icon, color) VALUES (?, ?, ?, ?)'
  );

  const transaction = db.transaction(() => {
    DEFAULT_CATEGORIES.forEach((cat) => {
      insert.run(cat.id, cat.name, cat.icon, cat.color);
    });
  });

  transaction();
}

function dedupeCategoryByName(name: string): void {
  const rows = db
    .prepare('SELECT id FROM categories WHERE name = ? ORDER BY id')
    .all(name) as { id: number }[];

  if (rows.length <= 1) return;

  const keepId = rows[0].id;
  const removeIds = rows.slice(1).map((r) => r.id);
  const idList = removeIds.join(',');

  try {
    db.prepare(
      `UPDATE transactions SET category_id = ? WHERE category_id IN (${idList})`
    ).run(keepId);
    db.prepare(
      `UPDATE category_rules SET category_id = ? WHERE category_id IN (${idList})`
    ).run(keepId);
    db.prepare(
      `UPDATE budgets SET category_id = ? WHERE category_id IN (${idList})`
    ).run(keepId);
    db.prepare(`DELETE FROM categories WHERE id IN (${idList})`).run();
  } catch (error) {
    console.error('Failed to dedupe categories for', name, error);
  }
}

// Update category names to Dutch
function updateCategoriesToDutch(): void {
  const dutchCategories: Record<string, string> = {
    Groceries: 'Boodschappen',
    Dining: 'Uit eten',
    Transport: 'Vervoer',
    Shopping: 'Winkelen',
    Entertainment: 'Entertainment',
    Health: 'Gezondheid',
    'Bills & Utilities': 'Rekeningen',
    'Rent/Mortgage': 'Huur/Hypotheek',
    Salary: 'Salaris',
    Transfers: 'Overboekingen',
    Subscriptions: 'Abonnementen',
    Other: 'Overig',
  };

  for (const [english, dutch] of Object.entries(dutchCategories)) {
    try {
      db.prepare('UPDATE categories SET name = ? WHERE name = ?').run(
        dutch,
        english
      );
    } catch {
      // Ignore errors
    }
  }
}

// Migrate existing address_book IBANs to the contact_ibans junction table
function migrateAddressBookIbansToJunction(): void {
  try {
    // Check if there are any existing address_book entries that haven't been migrated
    const unmigrated = db
      .prepare(
        `SELECT ab.id, ab.iban 
         FROM address_book ab 
         WHERE ab.iban IS NOT NULL 
           AND ab.iban != ''
           AND NOT EXISTS (
             SELECT 1 FROM contact_ibans ci WHERE ci.contact_id = ab.id AND ci.iban = ab.iban
           )`
      )
      .all() as { id: number; iban: string }[];

    if (unmigrated.length > 0) {
      const insertStmt = db.prepare(
        'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 1)'
      );

      const transaction = db.transaction(() => {
        for (const entry of unmigrated) {
          insertStmt.run(entry.id, entry.iban);
        }
      });
      transaction();

      console.warn(
        `Migrated ${unmigrated.length} address book IBANs to contact_ibans table`
      );
    }
  } catch (error) {
    console.error('Failed to migrate address book IBANs:', error);
  }
}

// Helper function to run queries with better typing
export function query<T>(sql: string, params?: unknown[]): T[] {
  const stmt = db.prepare(sql);
  return params ? (stmt.all(...params) as T[]) : (stmt.all() as T[]);
}

export function queryOne<T>(sql: string, params?: unknown[]): T | undefined {
  const stmt = db.prepare(sql);
  return params
    ? (stmt.get(...params) as T | undefined)
    : (stmt.get() as T | undefined);
}

export function run(sql: string, params?: unknown[]): Database.RunResult {
  const stmt = db.prepare(sql);
  return params ? stmt.run(...params) : stmt.run();
}

export function runMany<T extends unknown[]>(sql: string, items: T[]): void {
  const stmt = db.prepare(sql);
  const transaction = db.transaction((items: T[]) => {
    for (const item of items) {
      stmt.run(...item);
    }
  });
  transaction(items);
}

/**
 * Deduplicate payment_provider_rules: keep only the oldest entry for each unique name
 * This cleans up rules that were inserted multiple times due to missing UNIQUE constraint
 */
function dedupePaymentProviderRules(): void {
  try {
    // Find duplicate names and keep only the oldest entry for each
    const duplicateGroups = db
      .prepare(
        `
      SELECT 
        name,
        MIN(id) as keep_id,
        COUNT(*) as count
      FROM payment_provider_rules
      GROUP BY name
      HAVING count > 1
    `
      )
      .all() as Array<{
      name: string;
      keep_id: number;
      count: number;
    }>;

    if (duplicateGroups.length === 0) return;

    console.warn(
      `Found ${duplicateGroups.length} duplicate payment_provider_rules to clean up`
    );

    const transaction = db.transaction(() => {
      for (const group of duplicateGroups) {
        // Delete all entries with this name except the one with the lowest ID
        db.prepare(
          'DELETE FROM payment_provider_rules WHERE name = ? AND id != ?'
        ).run(group.name, group.keep_id);
      }
    });

    transaction();
  } catch (error) {
    console.error('Error deduplicating payment_provider_rules:', error);
  }
}

/**
 * Remove incorrect 'Pay.' payment provider rule
 * The correct rule is 'Pay.nl' which should be kept
 */
function cleanupIncorrectPayRule(): void {
  try {
    // Remove rules where name is exactly 'Pay.' (case-insensitive) but NOT 'Pay.nl'
    const result = db
      .prepare(
        `DELETE FROM payment_provider_rules 
         WHERE LOWER(TRIM(name)) = 'pay.' 
         AND LOWER(TRIM(name)) != 'pay.nl'`
      )
      .run();

    if (result.changes > 0) {
      console.warn(`Removed ${result.changes} incorrect 'Pay.' rule(s)`);
    }
  } catch (error) {
    console.error('Error cleaning up incorrect Pay. rule:', error);
  }
}

/**
 * Deduplicate shared_iban_merchants: merge entries with same IBAN and case-insensitive display_name
 * This ensures that 'Social Deal' and 'social deal' are treated as the same merchant
 */
function dedupeSharedIbanMerchants(): void {
  try {
    // Find groups of duplicate display_names (case-insensitive) per IBAN
    const duplicateGroups = db
      .prepare(
        `
      SELECT 
        iban,
        LOWER(display_name) as name_lower,
        MIN(display_name) as canonical_name,
        GROUP_CONCAT(id) as ids,
        COUNT(*) as count
      FROM shared_iban_merchants
      GROUP BY iban, LOWER(display_name)
      HAVING count > 1
    `
      )
      .all() as Array<{
      iban: string;
      name_lower: string;
      canonical_name: string;
      ids: string;
      count: number;
    }>;

    if (duplicateGroups.length === 0) return;

    console.warn(
      `Found ${duplicateGroups.length} duplicate shared_iban_merchants groups to merge`
    );

    const transaction = db.transaction(() => {
      for (const group of duplicateGroups) {
        const ids = group.ids.split(',').map(Number);
        const keepId = ids[0];
        const deleteIds = ids.slice(1);

        // Update all to have the same canonical display_name
        db.prepare(
          'UPDATE shared_iban_merchants SET display_name = ? WHERE id = ?'
        ).run(group.canonical_name, keepId);

        // Delete the duplicates (but keep original_name mappings by updating first)
        // Actually we need to keep all original_names, so we just update display_name and delete dupes
        for (const deleteId of deleteIds) {
          db.prepare('DELETE FROM shared_iban_merchants WHERE id = ?').run(
            deleteId
          );
        }
      }
    });
    transaction();

    console.warn(
      `Merged ${duplicateGroups.length} duplicate groups in shared_iban_merchants`
    );
  } catch (error) {
    console.error('Failed to dedupe shared_iban_merchants:', error);
  }
}

/**
 * Deduplicate contact_ibans: if the same IBAN appears for multiple contacts,
 * merge those contacts together
 */
function cleanupOrphanContactIbans(): void {
  try {
    const orphanIds = db
      .prepare(
        `SELECT DISTINCT ci.contact_id
         FROM contact_ibans ci
         LEFT JOIN address_book ab ON ab.id = ci.contact_id
         WHERE ab.id IS NULL`
      )
      .all() as Array<{ contact_id: number }>;

    if (orphanIds.length === 0) return;

    console.warn(
      `Found ${orphanIds.length} orphan contact_ibans rows; attempting to reattach or remove`
    );

    const transaction = db.transaction(() => {
      for (const o of orphanIds) {
        const contactId = o.contact_id;
        const ibans = db
          .prepare('SELECT iban FROM contact_ibans WHERE contact_id = ?')
          .all(contactId) as Array<{ iban: string }>;

        for (const { iban } of ibans) {
          // Try to find an existing contact that already has this IBAN
          const existing = db
            .prepare(
              'SELECT contact_id FROM contact_ibans WHERE iban = ? AND contact_id IN (SELECT id FROM address_book) LIMIT 1'
            )
            .get(iban) as { contact_id: number } | undefined;

          if (existing) {
            // Re-attach IBAN to existing contact
            db.prepare(
              'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 0)'
            ).run(existing.contact_id, iban);
          }

          // Remove the orphan row
          db.prepare(
            'DELETE FROM contact_ibans WHERE contact_id = ? AND iban = ?'
          ).run(contactId, iban);
        }
      }
    });
    transaction();

    console.warn('Orphan contact_ibans cleaned up');
  } catch (error) {
    console.error('Failed to cleanup orphan contact_ibans:', error);
  }
}

function dedupeContactIbans(): void {
  try {
    // Run orphan cleanup first
    cleanupOrphanContactIbans();

    // Find IBANs that appear in multiple contacts
    const duplicateIbans = db
      .prepare(
        `
      SELECT iban, GROUP_CONCAT(contact_id) as contact_ids, COUNT(DISTINCT contact_id) as count
      FROM contact_ibans
      GROUP BY iban
      HAVING count > 1
    `
      )
      .all() as Array<{
      iban: string;
      contact_ids: string;
      count: number;
    }>;

    if (duplicateIbans.length === 0) return;

    console.warn(
      `Found ${duplicateIbans.length} IBANs shared across multiple contacts`
    );

    const transaction = db.transaction(() => {
      for (const dup of duplicateIbans) {
        const contactIds = dup.contact_ids.split(',').map(Number);
        const keepContactId = contactIds[0];
        const deleteContactIds = contactIds.slice(1);

        // Move all IBANs from deleted contacts to the kept contact
        for (const deleteContactId of deleteContactIds) {
          // Get all IBANs from the contact to delete
          const ibans = db
            .prepare('SELECT iban FROM contact_ibans WHERE contact_id = ?')
            .all(deleteContactId) as Array<{ iban: string }>;

          // First, ensure the kept contact has all these IBANs
          for (const { iban } of ibans) {
            db.prepare(
              'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 0)'
            ).run(keepContactId, iban);
          }

          // Then remove all contact_ibans from the deleted contact
          db.prepare('DELETE FROM contact_ibans WHERE contact_id = ?').run(
            deleteContactId
          );

          // Finally, remove the address_book entry for the deleted contact if it exists
          db.prepare('DELETE FROM address_book WHERE id = ?').run(
            deleteContactId
          );
        }
      }
    });
    transaction();

    console.warn(`Merged ${duplicateIbans.length} duplicate IBAN entries`);
  } catch (error) {
    console.error('Failed to dedupe contact_ibans:', error);
  }
}
/**
 * Merge address book entries with duplicate names (case-insensitive).
 * All IBANs from duplicate entries are merged into a single contact.
 */
function mergeDuplicateAddressBookNames(): void {
  try {
    // Find all names that have duplicates (case-insensitive)
    const duplicateNames = db
      .prepare(
        `SELECT LOWER(TRIM(name)) as name, COUNT(*) as count 
         FROM address_book 
         GROUP BY LOWER(TRIM(name)) 
         HAVING COUNT(*) > 1`
      )
      .all() as Array<{ name: string; count: number }>;

    if (duplicateNames.length === 0) return;

    let mergedCount = 0;
    const transaction = db.transaction(() => {
      for (const dup of duplicateNames) {
        // Get all entries with this name
        const entries = db
          .prepare(
            'SELECT id, iban, name FROM address_book WHERE LOWER(TRIM(name)) = ?'
          )
          .all(dup.name) as Array<{ id: number; iban: string; name: string }>;

        if (entries.length < 2) continue;

        // Keep the first entry as the primary, merge others into it
        const primaryEntry = entries[0];

        // Ensure primary IBAN is in junction table
        db.prepare(
          'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 1)'
        ).run(primaryEntry.id, primaryEntry.iban);

        // Merge other entries into the primary
        for (let i = 1; i < entries.length; i++) {
          const entry = entries[i];

          // Get all IBANs from this contact
          const contactIbans = db
            .prepare('SELECT iban FROM contact_ibans WHERE contact_id = ?')
            .all(entry.id) as Array<{ iban: string }>;

          // Add all IBANs (including primary) to the kept contact
          const allIbans = new Set([
            entry.iban,
            ...contactIbans.map((c) => c.iban),
          ]);
          for (const iban of allIbans) {
            db.prepare(
              'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 0)'
            ).run(primaryEntry.id, iban);
          }

          // Remove contact_ibans from the deleted contact
          db.prepare('DELETE FROM contact_ibans WHERE contact_id = ?').run(
            entry.id
          );

          // Delete the duplicate address_book entry
          db.prepare('DELETE FROM address_book WHERE id = ?').run(entry.id);
          mergedCount++;
        }
      }
    });
    transaction();

    if (mergedCount > 0) {
      console.warn(
        `Merged ${mergedCount} address book entries with duplicate names`
      );
    }
  } catch (error) {
    console.error('Failed to merge duplicate address book names:', error);
  }
}

/**
 * MAJOR MIGRATION: Consolidate shared_iban_merchants into address_book
 *
 * This migration:
 * 1. Adds original_name column to address_book (for matching transactions with shared IBANs)
 * 2. Removes UNIQUE constraint on iban (shared IBANs need multiple entries)
 * 3. Migrates all shared_iban_merchants entries to address_book
 * 4. Updates transaction address_book_id for migrated entries
 * 5. Keeps shared_ibans table as reference for which IBANs are payment processors
 */
function consolidateSharedIbanMerchantsIntoAddressBook(): void {
  try {
    // Check if migration is needed by checking if shared_iban_merchants has data
    const merchantCount = db
      .prepare('SELECT COUNT(*) as count FROM shared_iban_merchants')
      .get() as { count: number };

    if (merchantCount.count === 0) {
      // Already migrated or no data to migrate
      return;
    }

    console.warn(
      `Starting consolidation of ${merchantCount.count} shared_iban_merchants into address_book...`
    );

    // Step 1: Add original_name column to address_book if it doesn't exist
    try {
      db.exec('ALTER TABLE address_book ADD COLUMN original_name TEXT');
      console.warn('Added original_name column to address_book');
    } catch {
      // Column already exists
    }

    // Step 2: Remove UNIQUE constraint on iban by recreating the table
    // First check if we need to do this (if there's already a unique index on iban)
    const _indexes = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='address_book' AND sql LIKE '%UNIQUE%iban%'"
      )
      .all() as Array<{ name: string }>;

    // If there are unique indexes on iban, we need to handle this carefully
    // For SQLite, we'll create a new table without the constraint and migrate
    // But first, let's check if there are any duplicate IBANs that would fail
    // Actually, we need to be more careful - let's just proceed with inserts and handle conflicts

    // Step 3: Migrate shared_iban_merchants to address_book
    const merchants = db
      .prepare(
        `SELECT id, iban, original_name, display_name, notes, created_at 
         FROM shared_iban_merchants 
         ORDER BY id`
      )
      .all() as Array<{
      id: number;
      iban: string;
      original_name: string;
      display_name: string;
      notes: string | null;
      created_at: string;
    }>;

    const idMapping = new Map<number, number>(); // old_id -> new_id

    const transaction = db.transaction(() => {
      for (const merchant of merchants) {
        // Check if this exact combination already exists in address_book
        const existing = db
          .prepare(
            `SELECT id FROM address_book 
             WHERE iban = ? AND (original_name = ? OR (original_name IS NULL AND name = ?))`
          )
          .get(
            merchant.iban,
            merchant.original_name,
            merchant.original_name
          ) as { id: number } | undefined;

        if (existing) {
          // Already migrated, just map the ID
          idMapping.set(merchant.id, existing.id);
          continue;
        }

        // Check if there's an entry with same IBAN but different original_name
        // If the IBAN is not unique, we need to remove the unique index first
        try {
          const result = db
            .prepare(
              `INSERT INTO address_book (iban, name, original_name, notes, created_at) 
               VALUES (?, ?, ?, ?, ?)`
            )
            .run(
              merchant.iban,
              merchant.display_name,
              merchant.original_name,
              merchant.notes,
              merchant.created_at
            );
          idMapping.set(merchant.id, Number(result.lastInsertRowid));
        } catch {
          // If insert fails due to unique constraint, we need to handle it
          // This happens when IBAN is unique but we have multiple merchants for same IBAN
          console.warn(
            `Cannot insert merchant ${merchant.display_name} for IBAN ${merchant.iban} - unique constraint. Will update existing.`
          );

          // Find existing entry and update it, or create a workaround
          const existingByIban = db
            .prepare('SELECT id, name FROM address_book WHERE iban = ?')
            .get(merchant.iban) as { id: number; name: string } | undefined;

          if (existingByIban) {
            // The existing entry might be for a different merchant on same shared IBAN
            // We need to remove the unique constraint to support multiple merchants per IBAN

            // For now, map to existing ID (imperfect but prevents crash)
            idMapping.set(merchant.id, existingByIban.id);
          }
        }
      }

      // Step 4: Update transactions that have shared IBAN merchants
      // Match transactions by IBAN + original_name to the new address_book entries
      for (const [oldMerchantId, newAddressBookId] of idMapping) {
        const merchant = merchants.find((m) => m.id === oldMerchantId);
        if (!merchant) continue;

        // Update transactions that match this IBAN + original_name
        db.prepare(
          `UPDATE transactions 
           SET address_book_id = ? 
           WHERE opposing_account_iban = ? 
             AND LOWER(TRIM(opposing_account_name)) = LOWER(TRIM(?))
             AND (address_book_id IS NULL OR address_book_id < 0)`
        ).run(newAddressBookId, merchant.iban, merchant.original_name);
      }

      // Step 5: Clear shared_iban_merchants after successful migration
      db.prepare('DELETE FROM shared_iban_merchants').run();
    });

    transaction();

    console.warn(
      `Successfully migrated ${idMapping.size} merchants to address_book`
    );

    // Recreate address_book table without UNIQUE constraint on iban
    // This is needed to properly support multiple merchants per IBAN going forward
    recreateAddressBookWithoutIbanUnique();
  } catch (error) {
    console.error(
      'Failed to consolidate shared_iban_merchants into address_book:',
      error
    );
  }
}

/**
 * Recreate address_book table without UNIQUE constraint on iban
 * This allows multiple contacts to share the same IBAN (for payment processors)
 */
function recreateAddressBookWithoutIbanUnique(): void {
  try {
    // Check if we need to do this by looking for unique index on iban
    const uniqueIndex = db
      .prepare(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='address_book'"
      )
      .get() as { sql: string } | undefined;

    if (!uniqueIndex?.sql?.includes('UNIQUE')) {
      // No unique constraint, nothing to do
      return;
    }

    console.warn(
      'Recreating address_book table without UNIQUE constraint on iban...'
    );

    const transaction = db.transaction(() => {
      // Create new table without UNIQUE on iban
      db.exec(`
        CREATE TABLE IF NOT EXISTS address_book_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          iban TEXT NOT NULL,
          name TEXT NOT NULL,
          nickname TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          description TEXT,
          original_name TEXT
        )
      `);

      // Copy all data
      db.exec(`
        INSERT INTO address_book_new (id, iban, name, nickname, notes, created_at, description, original_name)
        SELECT id, iban, name, nickname, notes, created_at, description, original_name
        FROM address_book
      `);

      // Drop old table
      db.exec('DROP TABLE address_book');

      // Rename new table
      db.exec('ALTER TABLE address_book_new RENAME TO address_book');

      // Recreate index on iban (non-unique)
      db.exec(
        'CREATE INDEX IF NOT EXISTS idx_address_book_iban ON address_book(iban)'
      );
    });

    transaction();
    console.warn('Address book table recreated without UNIQUE constraint');
  } catch (error) {
    console.error('Failed to recreate address_book table:', error);
  }
}
