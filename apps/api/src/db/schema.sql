-- User profile (single user)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    name TEXT NOT NULL,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default user profile
INSERT OR IGNORE INTO users (id, name, avatar) VALUES
    (1, 'Gebruiker', 'linear-gradient(135deg, #6366F1, #A855F7)');

-- Profiles table (multi-tenant support)
CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL DEFAULT 1,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('personal', 'business', 'shared', 'savings')) DEFAULT 'personal',
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Default profile for single-user mode
INSERT OR IGNORE INTO profiles (id, user_id, name, type) VALUES (1, 1, 'Persoonlijk', 'personal');

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    iban TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('checking', 'savings', 'credit')) DEFAULT 'checking',
    bank TEXT DEFAULT 'ing',
    current_balance DECIMAL(10,2),
    order_index INTEGER DEFAULT 0,
    profile_id INTEGER DEFAULT 1 REFERENCES profiles(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    icon TEXT,
    color TEXT,
    description TEXT,
    profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT CHECK(type IN ('income', 'expense', 'transfer')) NOT NULL,
    description TEXT,
    merchant_name TEXT,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    opposing_account_iban TEXT,
    opposing_account_name TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    notes TEXT,
    balance_after DECIMAL(10,2),
    payment_method TEXT,
    raw_data JSON,
    import_hash TEXT UNIQUE,
    profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    period TEXT CHECK(period IN ('monthly', 'yearly')) DEFAULT 'monthly',
    start_date DATE,
    end_date DATE,
    profile_id INTEGER DEFAULT 1 REFERENCES profiles(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Category rules for auto-categorization
CREATE TABLE IF NOT EXISTS category_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 0,
    profile_id INTEGER DEFAULT 1 REFERENCES profiles(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Imports tracking table
CREATE TABLE IF NOT EXISTS imports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    bank TEXT DEFAULT 'ing',
    imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    transaction_count INTEGER DEFAULT 0,
    status TEXT CHECK(status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
    skipped_rows JSON,
    duplicates_skipped INTEGER DEFAULT 0,
    parse_errors INTEGER DEFAULT 0
);



-- Address book for tracking recurring counterparties
CREATE TABLE IF NOT EXISTS address_book (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    iban TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    notes TEXT,
    original_name TEXT,
    profile_id INTEGER DEFAULT 1 REFERENCES profiles(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(iban, profile_id, original_name)
);

-- Shared IBANs (payment processors like Adyen, Takeaway.com, etc)
-- These have multiple different merchant names for the same IBAN
CREATE TABLE IF NOT EXISTS shared_ibans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    iban TEXT UNIQUE NOT NULL,
    provider_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Merchant mappings for shared IBANs - maps original transaction names to friendly display names
-- This allows renaming merchants from payment processors like Adyen/Mollie
CREATE TABLE IF NOT EXISTS shared_iban_merchants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    iban TEXT NOT NULL,
    original_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(iban, original_name)
);

CREATE INDEX IF NOT EXISTS idx_shared_iban_merchants_lookup ON shared_iban_merchants(iban, original_name);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant_name);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);

-- Insert default categories (Dutch)
INSERT OR IGNORE INTO categories (id, name, icon, color) VALUES
    (1, 'Boodschappen', '🛒', '#86EFAC'),
    (2, 'Uit eten', '🍽️', '#FCD34D'),
    (3, 'Vervoer', '🚗', '#93C5FD'),
    (4, 'Winkelen', '🛍️', '#C4B5FD'),
    (5, 'Entertainment', '🎬', '#F9A8D4'),
    (6, 'Gezondheid', '💊', '#FCA5A5'),
    (7, 'Rekeningen', '📄', '#D1D5DB'),
    (8, 'Huur/Hypotheek', '🏠', '#9CA3AF'),
    (9, 'Salaris', '💰', '#6EE7B7'),
    (10, 'Overboekingen', '↔️', '#A5B4FC'),
    (11, 'Abonnementen', '📱', '#DDD6FE'),
    (12, 'Overig', '📦', '#E5E7EB'),
    (13, 'Thuisbezorgd', '🛵', '#FDBA74'),
    (14, 'Kado''s', '🎁', '#FDA4AF'),
    (21, 'Huisdieren', '🐾', '#A78BFA'),
    (22, 'Goede doelen', '🙏', '#F59E0B'),
    (23, 'Sparen', '🏦', '#E5F4CE'),
    (24, 'Toeslagen', '📥', '#DCE7FF');


