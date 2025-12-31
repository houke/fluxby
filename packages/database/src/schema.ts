/**
 * Database schema with sync support
 * All tables include UUID, updated_at, and is_deleted for LWW sync
 */

/**
 * Schema version for migrations
 */
export const SCHEMA_VERSION = 7;

/**
 * SQL schema with sync metadata columns
 */
export const SCHEMA_SQL = `
-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

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

/**
 * Default categories (Dutch)
 */
export const DEFAULT_CATEGORIES = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Boodschappen',
    icon: '🛒',
    color: '#86EFAC',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Uit eten',
    icon: '🍽️',
    color: '#FCD34D',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Vervoer',
    icon: '🚗',
    color: '#93C5FD',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Winkelen',
    icon: '🛍️',
    color: '#C4B5FD',
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'Entertainment',
    icon: '🎬',
    color: '#F9A8D4',
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    name: 'Gezondheid',
    icon: '💊',
    color: '#FCA5A5',
  },
  {
    id: '00000000-0000-0000-0000-000000000007',
    name: 'Rekeningen',
    icon: '📄',
    color: '#D1D5DB',
  },
  {
    id: '00000000-0000-0000-0000-000000000008',
    name: 'Huur/Hypotheek',
    icon: '🏠',
    color: '#9CA3AF',
  },
  {
    id: '00000000-0000-0000-0000-000000000009',
    name: 'Salaris',
    icon: '💰',
    color: '#6EE7B7',
  },
  {
    id: '00000000-0000-0000-0000-00000000000a',
    name: 'Overboekingen',
    icon: '↔️',
    color: '#A5B4FC',
  },
  {
    id: '00000000-0000-0000-0000-00000000000b',
    name: 'Abonnementen',
    icon: '📱',
    color: '#DDD6FE',
  },
  {
    id: '00000000-0000-0000-0000-00000000000c',
    name: 'Overig',
    icon: '📦',
    color: '#E5E7EB',
  },
  {
    id: '00000000-0000-0000-0000-00000000000d',
    name: 'Thuisbezorgd',
    icon: '🛵',
    color: '#FDBA74',
  },
  {
    id: '00000000-0000-0000-0000-00000000000e',
    name: "Kado's",
    icon: '🎁',
    color: '#FDA4AF',
  },
  {
    id: '00000000-0000-0000-0000-000000000015',
    name: 'Huisdieren',
    icon: '🐾',
    color: '#A78BFA',
  },
  {
    id: '00000000-0000-0000-0000-000000000016',
    name: 'Goede doelen',
    icon: '🙏',
    color: '#F59E0B',
  },
  {
    id: '00000000-0000-0000-0000-000000000017',
    name: 'Sparen',
    icon: '🏦',
    color: '#E5F4CE',
  },
  {
    id: '00000000-0000-0000-0000-000000000018',
    name: 'Toeslagen',
    icon: '📥',
    color: '#DCE7FF',
  },
];

/**
 * Seed SQL for default data
 * Creates a default user and global categories.
 * User is needed for profile creation.
 * Categories are seeded without a profile_id (NULL) so they're available globally.
 */
export function getSeedSQL(deviceId: string): string {
  const now = Date.now();
  const defaultUserId = '00000000-0000-0000-0000-000000000001';

  let sql = `
-- Create default user (needed for profiles)
INSERT OR IGNORE INTO users (id, name, updated_at, device_id, created_at)
VALUES ('${defaultUserId}', 'Gebruiker', ${now}, '${deviceId}', ${now});

-- Default categories are seeded globally (profile_id = NULL)
-- They will be copied to user's profile when onboarding completes
`;

  for (const cat of DEFAULT_CATEGORIES) {
    // Escape single quotes in names for SQL safety
    const escapedName = cat.name.replace(/'/g, "''");
    sql += `INSERT OR IGNORE INTO categories (id, name, icon, color, profile_id, updated_at, device_id)
VALUES ('${cat.id}', '${escapedName}', '${cat.icon}', '${cat.color}', NULL, ${now}, '${deviceId}');
`;
  }

  // Default name cleanup rules (global)
  const defaultCleanupRules = [
    { id: '00000000-0000-0000-0000-000000000201', pattern: 'by Buckaroo' },
    { id: '00000000-0000-0000-0000-000000000202', pattern: 'SumUp *' },
    { id: '00000000-0000-0000-0000-000000000203', pattern: 'BCK*' },
    { id: '00000000-0000-0000-0000-000000000204', pattern: 'CCV*' },
    {
      id: '00000000-0000-0000-0000-000000000205',
      pattern: '/\\s*via\\s+[^,]+$/gi',
    },
  ];

  sql += `\n-- Default name cleanup rules are seeded globally\n`;
  for (const rule of defaultCleanupRules) {
    const escaped = rule.pattern.replace(/'/g, "''");
    sql += `INSERT OR IGNORE INTO name_cleanup_rules (id, pattern, is_active, created_at, updated_at, device_id)
VALUES ('${rule.id}', '${escaped}', 1, ${now}, ${now}, '${deviceId}');
`;
  }

  // Default payment provider rules (global)
  const defaultPaymentProviderRules = [
    {
      id: '00000000-0000-0000-0000-000000000211',
      name: 'PayPal',
      patterns: 'paypal, paypal *, via paypal',
    },
    {
      id: '00000000-0000-0000-0000-000000000212',
      name: 'Tikkie',
      patterns: 'tikkie, tikkie *',
    },
    {
      id: '00000000-0000-0000-0000-000000000213',
      name: 'Bunq',
      patterns: 'bunq, bunq *',
    },
    {
      id: '00000000-0000-0000-0000-000000000214',
      name: 'Adyen',
      patterns: 'adyen, via adyen',
    },
    {
      id: '00000000-0000-0000-0000-000000000215',
      name: 'Mollie',
      patterns: 'mollie, via mollie',
    },
    {
      id: '00000000-0000-0000-0000-000000000216',
      name: 'iDEAL',
      patterns: 'ideal, via ideal',
    },
    {
      id: '00000000-0000-0000-0000-000000000217',
      name: 'Buckaroo',
      patterns: 'buckaroo, via buckaroo',
    },
    {
      id: '00000000-0000-0000-0000-000000000218',
      name: 'Pay.nl',
      patterns: 'pay.nl, via pay.nl',
    },
    {
      id: '00000000-0000-0000-0000-000000000219',
      name: 'Klarna',
      patterns: 'klarna, via klarna',
    },
    {
      id: '00000000-0000-0000-0000-000000000220',
      name: 'Afterpay',
      patterns: 'afterpay, via afterpay',
    },
  ];

  sql += `\n-- Default payment provider rules are seeded globally\n`;
  for (const rule of defaultPaymentProviderRules) {
    const escapedName = rule.name.replace(/'/g, "''");
    const escapedPatterns = rule.patterns.replace(/'/g, "''");
    sql += `INSERT OR IGNORE INTO payment_provider_rules (id, name, patterns, created_at, updated_at, device_id)
VALUES ('${rule.id}', '${escapedName}', '${escapedPatterns}', ${now}, ${now}, '${deviceId}');
`;
  }

  return sql;
}
