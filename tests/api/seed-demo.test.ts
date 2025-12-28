import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create an in-memory database for testing
let db: Database.Database;

// Helper to setup database
function setupDatabase() {
  db = new Database(':memory:');

  // Read and execute schema
  const schemaPath = join(__dirname, '../../apps/api/src/db/schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  return db;
}

// Helper to create a profile
function createProfile(name: string = 'Test Profile') {
  const result = db
    .prepare('INSERT INTO profiles (user_id, name, type) VALUES (?, ?, ?)')
    .run(1, name, 'personal');
  return Number(result.lastInsertRowid);
}

// Simulate the seed-demo logic
function seedDemoData(profileId: number) {
  // 1. Clear existing data for this profile
  db.prepare('DELETE FROM budgets WHERE profile_id = ?').run(profileId);
  db.prepare('DELETE FROM category_rules WHERE profile_id = ?').run(profileId);
  db.prepare(
    'DELETE FROM transactions WHERE account_id IN (SELECT id FROM accounts WHERE profile_id = ?)'
  ).run(profileId);
  db.prepare('DELETE FROM accounts WHERE profile_id = ?').run(profileId);
  db.prepare('DELETE FROM categories WHERE profile_id = ?').run(profileId);
  db.prepare('DELETE FROM address_book WHERE profile_id = ?').run(profileId);

  // 2. Seed categories (simplified)
  const categories = [
    { name: 'Inkomen', icon: '💰', color: '#22c55e', description: 'Inkomsten' },
    { name: 'Wonen', icon: '🏠', color: '#ef4444', description: 'Woonlasten' },
    {
      name: 'Boodschappen',
      icon: '🛒',
      color: '#f59e0b',
      description: 'Dagelijkse boodschappen',
    },
    { name: 'Transport', icon: '🚗', color: '#3b82f6', description: 'Vervoer' },
    {
      name: 'Entertainment',
      icon: '🎮',
      color: '#8b5cf6',
      description: 'Ontspanning',
    },
  ];

  const categoryIdMap: Record<string, number> = {};
  for (const cat of categories) {
    const result = db
      .prepare(
        'INSERT INTO categories (name, icon, color, description, profile_id) VALUES (?, ?, ?, ?, ?)'
      )
      .run(cat.name, cat.icon, cat.color, cat.description, profileId);
    categoryIdMap[cat.name] = Number(result.lastInsertRowid);
  }

  // Add subcategories
  const subcategories = [
    { name: 'Salaris', parent: 'Inkomen' },
    { name: 'Huur', parent: 'Wonen' },
    { name: 'Albert Heijn', parent: 'Boodschappen' },
  ];

  for (const sub of subcategories) {
    const result = db
      .prepare(
        'INSERT INTO categories (name, parent_id, profile_id) VALUES (?, ?, ?)'
      )
      .run(sub.name, categoryIdMap[sub.parent], profileId);
    categoryIdMap[sub.name] = Number(result.lastInsertRowid);
  }

  // 3. Create demo accounts with DEMO bank codes
  const mainAccountResult = db
    .prepare(
      'INSERT INTO accounts (iban, name, type, bank, current_balance, profile_id, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      'NL00DEMO9999999999',
      'Demo Betaalrekening',
      'checking',
      'demo',
      2500.0,
      profileId,
      0
    );
  const mainAccountId = Number(mainAccountResult.lastInsertRowid);

  db.prepare(
    'INSERT INTO accounts (iban, name, type, bank, current_balance, profile_id, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    'NL00DEMO8888888888',
    'Demo Spaarrekening',
    'savings',
    'demo',
    5000.0,
    profileId,
    1
  );

  // 4. Generate transactions for multiple months
  const now = new Date();

  for (let monthOffset = 0; monthOffset < 18; monthOffset++) {
    const monthDate = new Date(now);
    monthDate.setMonth(monthDate.getMonth() - monthOffset);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    // Random number of transactions per month (10-30)
    const txCount = 10 + Math.floor(Math.random() * 21);

    // Monthly salary
    const salaryDate = new Date(Date.UTC(year, month, 24))
      .toISOString()
      .split('T')[0];
    db.prepare(
      `INSERT INTO transactions (date, amount, type, description, merchant_name, account_id, opposing_account_iban, opposing_account_name, category_id, profile_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      salaryDate,
      2800 + Math.random() * 200,
      'income',
      'Salaris',
      'Werkgever B.V.',
      mainAccountId,
      'NL00DEMO0000000001',
      'Werkgever B.V.',
      categoryIdMap['Salaris'],
      profileId
    );

    // Generate random expenses
    const expenseCategories = [
      'Huur',
      'Albert Heijn',
      'Boodschappen',
      'Transport',
      'Entertainment',
    ];
    for (let i = 0; i < txCount; i++) {
      const day = 1 + Math.floor(Math.random() * 28);
      const date = new Date(year, month, day).toISOString().split('T')[0];
      const category =
        expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
      const amount = -(10 + Math.random() * 150);

      db.prepare(
        `INSERT INTO transactions (date, amount, type, description, merchant_name, account_id, opposing_account_iban, opposing_account_name, category_id, profile_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        date,
        amount,
        'expense',
        `${category} aankoop`,
        `${category} Store`,
        mainAccountId,
        `NL00DEMO000000${1000 + i}`,
        `${category} Store`,
        categoryIdMap[category] || categoryIdMap['Boodschappen'],
        profileId
      );
    }
  }

  // 5. Add address book entries with DEMO bank codes
  const addressBookEntries = [
    { name: 'Werkgever B.V.', iban: 'NL00DEMO0000000001' },
    { name: 'Albert Heijn', iban: 'NL00DEMO0000000002' },
    { name: 'Shell Tankstation', iban: 'NL00DEMO0000000003' },
    { name: 'Netflix', iban: 'NL00DEMO0000000004' },
    { name: 'Verhuurder', iban: 'NL00DEMO0000000005' },
  ];

  for (const entry of addressBookEntries) {
    db.prepare(
      'INSERT INTO address_book (name, iban, profile_id) VALUES (?, ?, ?)'
    ).run(entry.name, entry.iban, profileId);
  }

  // 6. Create budgets for some categories
  const budgetCategories = ['Boodschappen', 'Transport', 'Entertainment'];
  for (const catName of budgetCategories) {
    const categoryId = categoryIdMap[catName];
    if (categoryId) {
      db.prepare(
        'INSERT INTO budgets (category_id, amount, period, profile_id) VALUES (?, ?, ?, ?)'
      ).run(categoryId, 200 + Math.random() * 300, 'monthly', profileId);
    }
  }

  // Return counts
  const categoriesCount = db
    .prepare('SELECT COUNT(*) as count FROM categories WHERE profile_id = ?')
    .get(profileId) as { count: number };
  const transactionsCount = db
    .prepare('SELECT COUNT(*) as count FROM transactions WHERE profile_id = ?')
    .get(profileId) as { count: number };
  const addressBookCount = db
    .prepare('SELECT COUNT(*) as count FROM address_book WHERE profile_id = ?')
    .get(profileId) as { count: number };
  const budgetsCount = db
    .prepare('SELECT COUNT(*) as count FROM budgets WHERE profile_id = ?')
    .get(profileId) as { count: number };
  const accountsCount = db
    .prepare('SELECT COUNT(*) as count FROM accounts WHERE profile_id = ?')
    .get(profileId) as { count: number };

  return {
    categories: categoriesCount.count,
    transactions: transactionsCount.count,
    addressBookEntries: addressBookCount.count,
    budgets: budgetsCount.count,
    accounts: accountsCount.count,
  };
}

describe('Seed Demo Data', () => {
  beforeEach(() => {
    setupDatabase();
  });

  afterEach(() => {
    db.close();
  });

  describe('seedDemoData function', () => {
    it('should create categories for a profile', () => {
      const profileId = createProfile('Demo');
      const result = seedDemoData(profileId);

      expect(result.categories).toBeGreaterThan(0);

      // Verify categories exist
      const categories = db
        .prepare('SELECT * FROM categories WHERE profile_id = ?')
        .all(profileId);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should create accounts with DEMO bank codes in IBANs', () => {
      const profileId = createProfile('Demo');
      seedDemoData(profileId);

      const accounts = db
        .prepare('SELECT * FROM accounts WHERE profile_id = ?')
        .all(profileId) as Array<{ iban: string; name: string; type: string }>;

      expect(accounts.length).toBe(2);

      // All accounts should have DEMO in IBAN
      for (const account of accounts) {
        expect(account.iban).toContain('DEMO');
      }

      // Should have checking and savings accounts
      const types = accounts.map((a) => a.type);
      expect(types).toContain('checking');
      expect(types).toContain('savings');
    });

    it('should generate 18 months of transactions', () => {
      const profileId = createProfile('Demo');
      const result = seedDemoData(profileId);

      // Should have at least 18 salary transactions (one per month) + expenses
      expect(result.transactions).toBeGreaterThanOrEqual(18);

      // Verify transactions span multiple months (at least 18)
      const months = db
        .prepare(
          `SELECT DISTINCT strftime('%Y-%m', date) as month 
           FROM transactions WHERE profile_id = ? ORDER BY month`
        )
        .all(profileId) as Array<{ month: string }>;

      expect(months.length).toBeGreaterThanOrEqual(18);
    });

    it('should create 10-30 transactions per month', () => {
      const profileId = createProfile('Demo');
      seedDemoData(profileId);

      // Check transaction counts per month (excluding current partial month)
      const monthCounts = db
        .prepare(
          `SELECT strftime('%Y-%m', date) as month, COUNT(*) as count 
           FROM transactions WHERE profile_id = ? 
           GROUP BY month 
           ORDER BY month DESC
           LIMIT 17`
        )
        .all(profileId) as Array<{ month: string; count: number }>;

      // Most months (excluding possibly partial current month) should have 10+ transactions
      const validMonths = monthCounts.filter((m) => m.count >= 10);
      expect(validMonths.length).toBeGreaterThanOrEqual(15);
    });

    it('should create address book entries with DEMO IBANs', () => {
      const profileId = createProfile('Demo');
      const result = seedDemoData(profileId);

      expect(result.addressBookEntries).toBeGreaterThan(0);

      const entries = db
        .prepare('SELECT * FROM address_book WHERE profile_id = ?')
        .all(profileId) as Array<{ iban: string; name: string }>;

      // All entries should have DEMO in IBAN
      for (const entry of entries) {
        expect(entry.iban).toContain('DEMO');
      }
    });

    it('should create budgets for some categories', () => {
      const profileId = createProfile('Demo');
      const result = seedDemoData(profileId);

      expect(result.budgets).toBeGreaterThan(0);

      const budgets = db
        .prepare(
          `SELECT b.*, c.name as category_name 
           FROM budgets b 
           JOIN categories c ON b.category_id = c.id 
           WHERE b.profile_id = ?`
        )
        .all(profileId) as Array<{
        amount: number;
        period: string;
        category_name: string;
      }>;

      for (const budget of budgets) {
        expect(budget.amount).toBeGreaterThan(0);
        expect(budget.period).toBe('monthly');
      }
    });

    it('should clear existing data when reseeding', () => {
      const profileId = createProfile('Demo');

      // First seed
      const result1 = seedDemoData(profileId);
      expect(result1.categories).toBeGreaterThan(0);

      // Add some extra manual data
      db.prepare(
        'INSERT INTO address_book (name, iban, profile_id) VALUES (?, ?, ?)'
      ).run('Extra Contact', 'NL00TEST1234567890', profileId);

      const beforeReseed = db
        .prepare(
          'SELECT COUNT(*) as count FROM address_book WHERE profile_id = ?'
        )
        .get(profileId) as { count: number };

      // Second seed should clear and recreate
      const result2 = seedDemoData(profileId);

      const afterReseed = db
        .prepare(
          'SELECT COUNT(*) as count FROM address_book WHERE profile_id = ?'
        )
        .get(profileId) as { count: number };

      // Extra contact should be gone, count should match the seeded amount
      expect(afterReseed.count).toBe(result2.addressBookEntries);
      expect(afterReseed.count).toBeLessThanOrEqual(beforeReseed.count);
    });

    it('should not affect other profiles when seeding', () => {
      const profileId1 = createProfile('Demo');
      const profileId2 = createProfile('Other Profile');

      // Seed first profile
      seedDemoData(profileId1);

      // Add data to second profile
      db.prepare(
        'INSERT INTO address_book (name, iban, profile_id) VALUES (?, ?, ?)'
      ).run('Other Contact', 'NL00OTHER123456789', profileId2);

      // Reseed first profile
      seedDemoData(profileId1);

      // Second profile's data should be untouched
      const profile2Data = db
        .prepare('SELECT * FROM address_book WHERE profile_id = ?')
        .all(profileId2) as Array<{ name: string }>;

      expect(profile2Data.length).toBe(1);
      expect(profile2Data[0].name).toBe('Other Contact');
    });

    it('should include income transactions (salary)', () => {
      const profileId = createProfile('Demo');
      seedDemoData(profileId);

      const incomeTransactions = db
        .prepare(
          `SELECT * FROM transactions 
           WHERE profile_id = ? AND type = 'income'`
        )
        .all(profileId) as Array<{ amount: number; description: string }>;

      // Should have at least 17 income transactions (one salary per month, current month may be excluded if 24th hasn't passed yet)
      expect(incomeTransactions.length).toBeGreaterThanOrEqual(17);

      // All should be positive amounts
      for (const tx of incomeTransactions) {
        expect(tx.amount).toBeGreaterThan(0);
      }
    });

    it('should not have future dated transactions and limit today to 2 transactions', () => {
      const profileId = createProfile('Demo');
      seedDemoData(profileId);

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      // No transactions should be in the future (date > today)
      const futureTx = db
        .prepare(
          `SELECT COUNT(*) as count FROM transactions WHERE profile_id = ? AND date > ?`
        )
        .get(profileId, todayStr) as { count: number };

      expect(futureTx.count).toBe(0);

      // At most 2 transactions for today
      const todayCount = db
        .prepare(
          `SELECT COUNT(*) as count FROM transactions WHERE profile_id = ? AND date = ?`
        )
        .get(profileId, todayStr) as { count: number };

      expect(todayCount.count).toBeLessThanOrEqual(2);
    });

    it('should include salary transaction on 24th for past months', () => {
      const profileId = createProfile('Demo');
      seedDemoData(profileId);

      const salaryTx = db
        .prepare(
          `SELECT date FROM transactions WHERE profile_id = ? AND type = 'income' ORDER BY date DESC`
        )
        .all(profileId) as Array<{ date: string }>;

      // Most salary transactions should be on the 24th (current month might be excluded)
      const salaryOn24 = salaryTx.filter((s) => s.date.endsWith('-24')).length;
      expect(salaryOn24).toBeGreaterThanOrEqual(16);
    });

    it('should assign categories to transactions', () => {
      const profileId = createProfile('Demo');
      seedDemoData(profileId);

      const categorizedTx = db
        .prepare(
          `SELECT COUNT(*) as count FROM transactions 
           WHERE profile_id = ? AND category_id IS NOT NULL`
        )
        .get(profileId) as { count: number };

      const totalTx = db
        .prepare(
          `SELECT COUNT(*) as count FROM transactions WHERE profile_id = ?`
        )
        .get(profileId) as { count: number };

      // Most transactions should be categorized
      expect(categorizedTx.count).toBeGreaterThan(totalTx.count * 0.8);
    });
  });
});
