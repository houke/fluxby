import type { Migration, MigrationContext } from './index.js';

const SCHEMA_SQL = `
-- Device registration for sync
CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    name TEXT,
    platform TEXT,
    last_sync_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- User profile (single user, multi-device)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    avatar TEXT,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    is_deleted INTEGER NOT NULL DEFAULT 0,
    device_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Profiles (multi-tenant support)
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('personal', 'business', 'shared', 'savings', 'investing')) DEFAULT 'personal',
    avatar_url TEXT,
    is_hidden INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    is_deleted INTEGER NOT NULL DEFAULT 0,
    device_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    iban TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('checking', 'savings', 'credit')) DEFAULT 'checking',
    bank TEXT DEFAULT 'ing',
    current_balance REAL DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    is_deleted INTEGER NOT NULL DEFAULT 0,
    device_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    UNIQUE(iban, profile_id)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    icon TEXT,
    color TEXT,
    description TEXT,
    profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    is_deleted INTEGER NOT NULL DEFAULT 0,
    device_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT CHECK(type IN ('income', 'expense', 'transfer')) NOT NULL,
    description TEXT,
    merchant_name TEXT,
    account_id TEXT REFERENCES accounts(id) ON DELETE CASCADE,
    opposing_account_iban TEXT,
    opposing_account_name TEXT,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    notes TEXT,
    balance_after REAL,
    payment_method TEXT,
    payment_provider TEXT,
    address_book_id TEXT,
    raw_data TEXT,
    import_hash TEXT,
    profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    is_deleted INTEGER NOT NULL DEFAULT 0,
    device_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    period TEXT CHECK(period IN ('monthly', 'yearly')) DEFAULT 'monthly',
    start_date TEXT,
    end_date TEXT,
    profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    is_deleted INTEGER NOT NULL DEFAULT 0,
    device_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Category rules for auto-categorization
CREATE TABLE IF NOT EXISTS category_rules (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    pattern TEXT NOT NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 0,
    profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    is_deleted INTEGER NOT NULL DEFAULT 0,
    device_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Imports tracking table
CREATE TABLE IF NOT EXISTS imports (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    filename TEXT NOT NULL,
    bank TEXT DEFAULT 'ing',
    transaction_count INTEGER DEFAULT 0,
    status TEXT CHECK(status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
    skipped_rows TEXT,
    duplicates_skipped INTEGER DEFAULT 0,
    parse_errors INTEGER DEFAULT 0,
    profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    is_deleted INTEGER NOT NULL DEFAULT 0,
    device_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Name cleanup rules (per profile)
CREATE TABLE IF NOT EXISTS name_cleanup_rules (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  pattern TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  is_deleted INTEGER NOT NULL DEFAULT 0,
  device_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  UNIQUE(pattern, profile_id)
);

-- Payment provider rules (per profile)
CREATE TABLE IF NOT EXISTS payment_provider_rules (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  patterns TEXT NOT NULL,
  profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  is_deleted INTEGER NOT NULL DEFAULT 0,
  device_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  UNIQUE(name, profile_id)
);

-- Address book for tracking recurring counterparties
CREATE TABLE IF NOT EXISTS address_book (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    iban TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    notes TEXT,
    original_name TEXT,
    profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    is_deleted INTEGER NOT NULL DEFAULT 0,
    device_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    UNIQUE(iban, profile_id, original_name)
);

-- Contact IBANs (one-to-many relationship for address book)
CREATE TABLE IF NOT EXISTS contact_ibans (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    contact_id TEXT REFERENCES address_book(id) ON DELETE CASCADE,
    iban TEXT NOT NULL,
    is_primary INTEGER DEFAULT 0,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    is_deleted INTEGER NOT NULL DEFAULT 0,
    device_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    UNIQUE(contact_id, iban)
);

CREATE INDEX IF NOT EXISTS idx_contact_ibans_contact ON contact_ibans(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_ibans_iban ON contact_ibans(iban);

-- Shared IBANs (payment processors)
CREATE TABLE IF NOT EXISTS shared_ibans (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    iban TEXT UNIQUE NOT NULL,
    provider_name TEXT,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    is_deleted INTEGER NOT NULL DEFAULT 0,
    device_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Merchant mappings for shared IBANs
CREATE TABLE IF NOT EXISTS shared_iban_merchants (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    iban TEXT NOT NULL,
    original_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    notes TEXT,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    is_deleted INTEGER NOT NULL DEFAULT 0,
    device_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    UNIQUE(iban, original_name)
);

-- Sync log for conflict tracking
CREATE TABLE IF NOT EXISTS sync_log (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    table_name TEXT NOT NULL,
    row_id TEXT NOT NULL,
    action TEXT CHECK(action IN ('create', 'update', 'delete', 'conflict')) NOT NULL,
    local_updated_at INTEGER,
    remote_updated_at INTEGER,
    resolution TEXT,
    error_message TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Sync error log for tracking malformed rows and other sync issues
CREATE TABLE IF NOT EXISTS sync_error_log (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    error_type TEXT NOT NULL,
    table_name TEXT,
    row_id TEXT,
    message TEXT NOT NULL,
    details TEXT,
    resolved INTEGER NOT NULL DEFAULT 0,
    timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_profile ON transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_transactions_updated_at ON transactions(updated_at);

CREATE INDEX IF NOT EXISTS idx_accounts_profile ON accounts(profile_id);
CREATE INDEX IF NOT EXISTS idx_accounts_updated_at ON accounts(updated_at);

CREATE INDEX IF NOT EXISTS idx_categories_profile ON categories(profile_id);
CREATE INDEX IF NOT EXISTS idx_categories_updated_at ON categories(updated_at);

CREATE INDEX IF NOT EXISTS idx_budgets_profile ON budgets(profile_id);
CREATE INDEX IF NOT EXISTS idx_budgets_updated_at ON budgets(updated_at);

CREATE INDEX IF NOT EXISTS idx_address_book_profile ON address_book(profile_id);
CREATE INDEX IF NOT EXISTS idx_address_book_updated_at ON address_book(updated_at);

CREATE INDEX IF NOT EXISTS idx_name_cleanup_rules_updated_at ON name_cleanup_rules(updated_at);
CREATE INDEX IF NOT EXISTS idx_payment_provider_rules_updated_at ON payment_provider_rules(updated_at);

CREATE INDEX IF NOT EXISTS idx_shared_iban_merchants_lookup ON shared_iban_merchants(iban, original_name);
`;

export const migration001: Migration = {
  version: 1,
  name: 'initial_schema',
  up: async (db: MigrationContext) => {
    // Split schema by semicolons and execute separately
    const schemaStatements = SCHEMA_SQL.split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of schemaStatements) {
      try {
        await db.execAsync(statement + ';');
      } catch (err) {
        // Ignore "table already exists" errors - standard for IF NOT EXISTS but good to be safe
        if (err instanceof Error && !err.message.includes('already exists')) {
          console.error(
            'Error executing schema statement:',
            statement.substring(0, 100),
            err
          );
        }
      }
    }
  },
  down: async (db: MigrationContext) => {
    // We generally don't implement down for the initial schema in this context
  },
};
