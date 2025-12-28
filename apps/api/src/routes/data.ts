import { Router } from 'express';
import { db, query, run, runMany } from '../db/index.js';
import {
  flattenCategoriesForDB,
  SEED_CATEGORIES,
} from '../db/seed-categories.js';

const router = Router();

// Type definitions for imported data (supports both snake_case and camelCase keys)
interface ImportedCategory {
  id: number;
  name: string;
  parent_id?: number | null;
  parentId?: number | null;
  icon?: string | null;
  color?: string | null;
  created_at?: string;
  createdAt?: string;
}

interface ImportedAccount {
  id: number;
  iban: string;
  name: string;
  type: string;
  bank?: string;
  current_balance?: number;
  currentBalance?: number;
  created_at?: string;
  createdAt?: string;
}

interface ImportedTransaction {
  id: number;
  date: string;
  amount: number;
  type: string;
  description?: string | null;
  merchant_name?: string | null;
  merchantName?: string | null;
  account_id: number;
  accountId?: number;
  opposing_account_iban?: string | null;
  opposingAccountIban?: string | null;
  opposing_account_name?: string | null;
  opposingAccountName?: string | null;
  category_id?: number | null;
  categoryId?: number | null;
  notes?: string | null;
  balance_after?: number | null;
  balanceAfter?: number | null;
  payment_method?: string | null;
  paymentMethod?: string | null;
  raw_data?: string | null;
  rawData?: string | null;
  import_hash?: string | null;
  importHash?: string | null;
  created_at?: string;
  createdAt?: string;
}

interface ImportedBudget {
  id: number;
  category_id?: number | null;
  categoryId?: number | null;
  amount: number;
  period: string;
  start_date?: string | null;
  startDate?: string | null;
  end_date?: string | null;
  endDate?: string | null;
  created_at?: string;
  createdAt?: string;
}

interface ImportedCategoryRule {
  id: number;
  pattern: string;
  category_id?: number | null;
  categoryId?: number | null;
  priority?: number;
  created_at?: string;
  createdAt?: string;
}

interface ImportedImport {
  id: number;
  filename: string;
  bank?: string;
  imported_at?: string;
  importedAt?: string;
  transaction_count?: number;
  transactionCount?: number;
  status?: string;
}

interface ImportedAddressBook {
  id: number;
  iban: string;
  name: string;
  description?: string | null;
  notes?: string | null;
  created_at?: string;
  createdAt?: string;
}

interface ImportedSharedIban {
  id: number;
  iban: string;
  provider_name?: string | null;
  providerName?: string | null;
  created_at?: string;
  createdAt?: string;
}

interface ImportedSharedIbanMerchant {
  id: number;
  iban: string;
  original_name?: string;
  originalName?: string;
  display_name?: string;
  displayName?: string;
  notes?: string | null;
  created_at?: string;
  createdAt?: string;
}

interface ImportedNameCleanupRule {
  id: number;
  pattern: string;
  is_active?: number;
  isActive?: number;
  created_at?: string;
  createdAt?: string;
}

interface ImportedPaymentProviderRule {
  id: number;
  name: string;
  patterns: string;
  created_at?: string;
  createdAt?: string;
}

interface ImportedUser {
  name?: string;
  avatar?: string | null;
}

/**
 * @swagger
 * tags:
 *   name: Data
 *   description: Exporteren en importeren van volledige dataset
 */

/**
 * @swagger
 * /api/data/export:
 *   get:
 *     summary: Exporteer alle data als JSON
 *     tags: [Data]
 *     responses:
 *       200:
 *         description: Volledige dataset
 */
router.get('/export', (_req, res) => {
  try {
    const categories = query('SELECT * FROM categories ORDER BY id');
    const accounts = query('SELECT * FROM accounts ORDER BY id');
    const transactions = query('SELECT * FROM transactions ORDER BY id');
    const budgets = query('SELECT * FROM budgets ORDER BY id');
    const categoryRules = query('SELECT * FROM category_rules ORDER BY id');
    const imports = query('SELECT * FROM imports ORDER BY id');
    const addressBook = query('SELECT * FROM address_book ORDER BY id');
    const sharedIbans = query('SELECT * FROM shared_ibans ORDER BY id');
    const sharedIbanMerchants = query(
      'SELECT * FROM shared_iban_merchants ORDER BY id'
    );
    const nameCleanupRules = query(
      'SELECT * FROM name_cleanup_rules ORDER BY id'
    );
    const paymentProviderRules = query(
      'SELECT * FROM payment_provider_rules ORDER BY id'
    );
    const users = query('SELECT * FROM users ORDER BY id');

    res.json({
      success: true,
      data: {
        categories,
        accounts,
        transactions,
        budgets,
        categoryRules,
        imports,
        addressBook,
        sharedIbans,
        sharedIbanMerchants,
        nameCleanupRules,
        paymentProviderRules,
        users,
        exportedAt: new Date().toISOString(),
        version: 2,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ success: false, error: 'Export mislukt' });
  }
});

/**
 * @swagger
 * /api/data/import:
 *   post:
 *     summary: Importeer volledige dataset (maakt bestaande data leeg)
 *     tags: [Data]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categories:
 *                 type: array
 *               accounts:
 *                 type: array
 *               transactions:
 *                 type: array
 *               budgets:
 *                 type: array
 *               categoryRules:
 *                 type: array
 *               imports:
 *                 type: array
 *               addressBook:
 *                 type: array
 *               sharedIbans:
 *                 type: array
 *               sharedIbanMerchants:
 *                 type: array
 *               nameCleanupRules:
 *                 type: array
 *               paymentProviderRules:
 *                 type: array
 *               users:
 *                 type: array
 *     responses:
 *       200:
 *         description: Data geïmporteerd
 */
router.post('/import', (req, res) => {
  const {
    categories = [] as ImportedCategory[],
    accounts = [] as ImportedAccount[],
    transactions = [] as ImportedTransaction[],
    budgets = [] as ImportedBudget[],
    categoryRules = [] as ImportedCategoryRule[],
    imports = [] as ImportedImport[],
    addressBook = [] as ImportedAddressBook[],
    sharedIbans = [] as ImportedSharedIban[],
    sharedIbanMerchants = [] as ImportedSharedIbanMerchant[],
    nameCleanupRules = [] as ImportedNameCleanupRule[],
    paymentProviderRules = [] as ImportedPaymentProviderRule[],
    users = [] as ImportedUser[],
  } = req.body || {};

  try {
    db.exec('BEGIN');

    // Clear existing data (respect FK order)
    db.exec('DELETE FROM transactions');
    db.exec('DELETE FROM budgets');
    db.exec('DELETE FROM category_rules');
    db.exec('DELETE FROM imports');
    db.exec('DELETE FROM categories');
    db.exec('DELETE FROM accounts');
    db.exec('DELETE FROM address_book');
    db.exec('DELETE FROM shared_iban_merchants');
    db.exec('DELETE FROM shared_ibans');
    db.exec('DELETE FROM name_cleanup_rules');
    db.exec('DELETE FROM payment_provider_rules');
    // Don't delete users - just update if provided

    if (categories.length > 0) {
      runMany(
        'INSERT INTO categories (id, name, parent_id, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        categories.map((c: ImportedCategory) => [
          c.id,
          c.name,
          c.parent_id ?? c.parentId ?? null,
          c.icon ?? null,
          c.color ?? null,
          c.created_at ?? c.createdAt ?? new Date().toISOString(),
        ])
      );
    }

    if (accounts.length > 0) {
      runMany(
        'INSERT INTO accounts (id, iban, name, type, bank, current_balance, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        accounts.map((a: ImportedAccount) => [
          a.id,
          a.iban,
          a.name,
          a.type,
          a.bank ?? 'ing',
          a.current_balance ?? a.currentBalance ?? 0,
          a.created_at ?? a.createdAt ?? new Date().toISOString(),
        ])
      );
    }

    if (transactions.length > 0) {
      runMany(
        `INSERT INTO transactions (
          id, date, amount, type, description, merchant_name, account_id,
          opposing_account_iban, opposing_account_name, category_id, notes,
          balance_after, payment_method, raw_data, import_hash, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        transactions.map((t: ImportedTransaction) => [
          t.id,
          t.date,
          t.amount,
          t.type,
          t.description ?? null,
          t.merchant_name ?? t.merchantName ?? null,
          t.account_id ?? t.accountId,
          t.opposing_account_iban ?? t.opposingAccountIban ?? null,
          t.opposing_account_name ?? t.opposingAccountName ?? null,
          t.category_id ?? t.categoryId ?? null,
          t.notes ?? null,
          t.balance_after ?? t.balanceAfter ?? null,
          t.payment_method ?? t.paymentMethod ?? null,
          t.raw_data ?? t.rawData ?? null,
          t.import_hash ?? t.importHash ?? null,
          t.created_at ?? t.createdAt ?? new Date().toISOString(),
        ])
      );
    }

    if (budgets.length > 0) {
      runMany(
        'INSERT INTO budgets (id, category_id, amount, period, start_date, end_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        budgets.map((b: ImportedBudget) => [
          b.id,
          b.category_id ?? b.categoryId ?? null,
          b.amount,
          b.period,
          b.start_date ?? b.startDate ?? null,
          b.end_date ?? b.endDate ?? null,
          b.created_at ?? b.createdAt ?? new Date().toISOString(),
        ])
      );
    }

    // Track skipped category rules for reporting
    let categoryRulesImported = 0;
    const skippedCategoryRules: Array<{
      pattern: string;
      reason: string;
    }> = [];

    if (categoryRules.length > 0) {
      // Get set of valid category IDs that were imported
      const validCategoryIds = new Set(
        categories.map((c: ImportedCategory) => c.id)
      );

      for (const r of categoryRules) {
        const categoryId = r.category_id ?? r.categoryId;

        // Validate that the category exists
        if (categoryId && !validCategoryIds.has(categoryId)) {
          skippedCategoryRules.push({
            pattern: r.pattern,
            reason: `Categorie ID ${categoryId} bestaat niet`,
          });
          continue;
        }

        // Validate that pattern is not empty
        if (!r.pattern || r.pattern.trim() === '') {
          skippedCategoryRules.push({
            pattern: r.pattern || '(leeg)',
            reason: 'Lege pattern',
          });
          continue;
        }

        try {
          run(
            'INSERT INTO category_rules (id, pattern, category_id, priority, created_at) VALUES (?, ?, ?, ?, ?)',
            [
              r.id,
              r.pattern,
              categoryId,
              r.priority ?? 0,
              r.created_at ?? r.createdAt ?? new Date().toISOString(),
            ]
          );
          categoryRulesImported++;
        } catch (err) {
          skippedCategoryRules.push({
            pattern: r.pattern,
            reason: `Database fout: ${err instanceof Error ? err.message : 'onbekend'}`,
          });
        }
      }
    }

    if (imports.length > 0) {
      runMany(
        'INSERT INTO imports (id, filename, bank, imported_at, transaction_count, status) VALUES (?, ?, ?, ?, ?, ?)',
        imports.map((i: ImportedImport) => [
          i.id,
          i.filename,
          i.bank ?? 'ing',
          i.imported_at ?? i.importedAt ?? new Date().toISOString(),
          i.transaction_count ?? i.transactionCount ?? 0,
          i.status ?? 'completed',
        ])
      );
    }

    // Address book
    if (addressBook.length > 0) {
      runMany(
        'INSERT INTO address_book (id, iban, name, description, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        addressBook.map((a: ImportedAddressBook) => [
          a.id,
          a.iban,
          a.name,
          a.description ?? null,
          a.notes ?? null,
          a.created_at ?? a.createdAt ?? new Date().toISOString(),
        ])
      );
    }

    // Shared IBANs (payment processors)
    if (sharedIbans.length > 0) {
      runMany(
        'INSERT INTO shared_ibans (id, iban, provider_name, created_at) VALUES (?, ?, ?, ?)',
        sharedIbans.map((s: ImportedSharedIban) => [
          s.id,
          s.iban,
          s.provider_name ?? s.providerName ?? null,
          s.created_at ?? s.createdAt ?? new Date().toISOString(),
        ])
      );
    }

    // Shared IBAN merchants
    if (sharedIbanMerchants.length > 0) {
      runMany(
        'INSERT INTO shared_iban_merchants (id, iban, original_name, display_name, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        sharedIbanMerchants.map((m: ImportedSharedIbanMerchant) => [
          m.id,
          m.iban,
          m.original_name ?? m.originalName,
          m.display_name ?? m.displayName,
          m.notes ?? null,
          m.created_at ?? m.createdAt ?? new Date().toISOString(),
        ])
      );
    }

    // Name cleanup rules
    if (nameCleanupRules.length > 0) {
      runMany(
        'INSERT INTO name_cleanup_rules (id, pattern, is_active, created_at) VALUES (?, ?, ?, ?)',
        nameCleanupRules.map((r: ImportedNameCleanupRule) => [
          r.id,
          r.pattern,
          r.is_active ?? r.isActive ?? 1,
          r.created_at ?? r.createdAt ?? new Date().toISOString(),
        ])
      );
    }

    // Payment processor rules
    if (paymentProviderRules.length > 0) {
      runMany(
        'INSERT INTO payment_provider_rules (id, name, patterns, created_at) VALUES (?, ?, ?, ?)',
        paymentProviderRules.map((r: ImportedPaymentProviderRule) => [
          r.id,
          r.name,
          r.patterns,
          r.created_at ?? r.createdAt ?? new Date().toISOString(),
        ])
      );
    }

    // Users (update existing user profile if provided)
    if (users.length > 0) {
      const user = users[0]; // Single user system
      run('UPDATE users SET name = ?, avatar = ? WHERE id = 1', [
        user.name ?? 'Gebruiker',
        user.avatar ?? null,
      ]);
    }

    db.exec('COMMIT');

    res.json({
      success: true,
      data: {
        categories: categories.length,
        accounts: accounts.length,
        transactions: transactions.length,
        budgets: budgets.length,
        categoryRules: categoryRulesImported,
        categoryRulesSkipped: skippedCategoryRules,
        imports: imports.length,
        addressBook: addressBook.length,
        sharedIbans: sharedIbans.length,
        sharedIbanMerchants: sharedIbanMerchants.length,
        nameCleanupRules: nameCleanupRules.length,
        paymentProviderRules: paymentProviderRules.length,
        users: users.length,
      },
    });
  } catch (error) {
    console.error('Error importing data:', error);
    db.exec('ROLLBACK');
    res.status(500).json({ success: false, error: 'Import mislukt' });
  }
});

/**
 * @swagger
 * /api/data/reset:
 *   delete:
 *     summary: Reset all data and restore demo profile
 *     description: Deletes ALL data across all profiles, then creates/restores the demo profile with sample data. This is a destructive operation that cannot be undone.
 *     tags: [Data]
 *     responses:
 *       200:
 *         description: Data reset and demo profile restored
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     demoProfileId:
 *                       type: integer
 *                     message:
 *                       type: string
 *       500:
 *         description: Reset failed
 */
router.delete('/reset', (_req, res) => {
  try {
    db.exec('BEGIN');

    // Delete ALL data across ALL profiles (respect FK order)
    db.exec('DELETE FROM transactions');
    db.exec('DELETE FROM budgets');
    db.exec('DELETE FROM category_rules');
    db.exec('DELETE FROM imports');
    db.exec('DELETE FROM categories');
    db.exec('DELETE FROM contact_ibans');
    db.exec('DELETE FROM address_book');
    db.exec('DELETE FROM accounts');
    db.exec('DELETE FROM shared_iban_merchants');
    db.exec('DELETE FROM shared_ibans');
    db.exec('DELETE FROM name_cleanup_rules');
    db.exec('DELETE FROM payment_provider_rules');
    // Delete all profiles - we'll recreate demo
    db.exec('DELETE FROM profiles');

    // Create demo profile
    const profileResult = run(
      "INSERT INTO profiles (name, type, user_id, avatar_url) VALUES ('Demo', 'personal', 1, NULL)"
    );
    const profileId = Number(profileResult.lastInsertRowid);

    // Seed categories for demo profile
    const { parentCategories, subcategories } =
      flattenCategoriesForDB(SEED_CATEGORIES);
    const categoryIdMap: Record<string, number> = {};

    // Insert parent categories
    for (const cat of parentCategories) {
      const result = run(
        'INSERT INTO categories (name, icon, color, description, profile_id) VALUES (?, ?, ?, ?, ?)',
        [cat.name, cat.icon, cat.color, cat.description, profileId]
      );
      categoryIdMap[cat.name] = Number(result.lastInsertRowid);
    }

    // Insert subcategories with rules
    for (const sub of subcategories) {
      const parentId = categoryIdMap[sub.parentName];
      const result = run(
        'INSERT INTO categories (name, parent_id, icon, color, description, profile_id) VALUES (?, ?, ?, ?, ?, ?)',
        [sub.name, parentId, sub.icon, sub.color, sub.description, profileId]
      );
      categoryIdMap[sub.name] = Number(result.lastInsertRowid);

      // Add category rules for subcategory
      for (const rule of sub.rules) {
        run(
          'INSERT INTO category_rules (pattern, category_id, priority, profile_id) VALUES (?, ?, ?, ?)',
          [rule, Number(result.lastInsertRowid), 0, profileId]
        );
      }
    }

    // Create demo account
    const demoAccountIban = 'NL00DEMO9999999999';
    const accountResult = run(
      'INSERT INTO accounts (iban, name, type, bank, current_balance, profile_id, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        demoAccountIban,
        'Demo Betaalrekening',
        'checking',
        'demo',
        2500.0,
        profileId,
        0,
      ]
    );
    const _mainAccountId = Number(accountResult.lastInsertRowid);

    // Create demo savings account
    const savingsAccountIban = 'NL00DEMO8888888888';
    run(
      'INSERT INTO accounts (iban, name, type, bank, current_balance, profile_id, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        savingsAccountIban,
        'Demo Spaarrekening',
        'savings',
        'demo',
        5000.0,
        profileId,
        1,
      ]
    );

    db.exec('COMMIT');

    res.json({
      success: true,
      data: {
        demoProfileId: profileId,
        message:
          'All data deleted and demo profile restored with categories. Use POST /api/profiles/{id}/seed-demo to add sample transactions.',
      },
    });
  } catch (error) {
    console.error('Error resetting data:', error);
    db.exec('ROLLBACK');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Reset mislukt',
    });
  }
});

export default router;
