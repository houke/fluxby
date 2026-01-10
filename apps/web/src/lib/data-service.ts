/**
 * Data Service Layer
 *
 * This module provides a unified data access layer that works with:
 * - Local browser database (OPFS/IndexedDB via SQLite WASM) - default for web
 * - Remote API server - for development/Tauri with API integration
 *
 * The web app uses local-first storage by default.
 * The API server is an optional layer for external integrations.
 */

import {
  type Database,
  readFromOPFSSync,
  isSettingsCacheInitialized,
} from '@fluxby/database';
import {
  type Profile,
  type Transaction,
  type TransactionCreate,
  type Category,
  type Account,
  type Budget,
  type ProfileType,
  type RecurringPattern,
  type RecurringCalendarEntry,
  type RecurringStats,
  type PatternType,
  PATTERN_INTERVALS,
  MIN_TRANSACTIONS_FOR_PATTERN,
  AMOUNT_VARIANCE_THRESHOLD,
  flattenCategoriesForDB,
  SEED_CATEGORIES,
  DEFAULT_NAME_CLEANUP_RULES,
  DEFAULT_PAYMENT_PROVIDER_RULES,
} from '@fluxby/shared';
import { processINGRow } from './importers/ing-importer';
import { processASNRow } from './importers/asn-importer';

/**
 * Get the active profile ID from OPFS settings
 */
function getActiveProfileId(): string | null {
  if (typeof window === 'undefined') return null;
  if (isSettingsCacheInitialized()) {
    return readFromOPFSSync<string>('fluxby.activeProfileId');
  }
  return null;
}

/**
 * Create a data service instance using the local database
 */
export function createDataService(db: Database) {
  const profileId = () => getActiveProfileId();

  // Helper to ensure a user exists before creating profiles
  const ensureUserExists = async (): Promise<string> => {
    const user = await db.queryOneAsync<{ id: string }>(
      'SELECT id FROM users WHERE is_deleted = 0 LIMIT 1'
    );

    if (user) {
      return user.id;
    }

    // No user exists - create default user
    const userId = '00000000-0000-0000-0000-000000000001';
    const now = Date.now();

    await db.runAsync(
      `INSERT INTO users (id, name, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
      [userId, 'Gebruiker', now, now]
    );

    return userId;
  };

  return {
    // ============= Profiles =============
    async getProfiles(): Promise<Profile[]> {
      const rows = await db.queryAsync<{
        id: string;
        userId: string;
        name: string;
        type: ProfileType;
        avatarUrl: string | null;
        isHidden: number;
        createdAt: number;
      }>(
        `SELECT
           id,
           user_id as userId,
           name,
           type,
           avatar_url as avatarUrl,
           is_hidden as isHidden,
           created_at as createdAt
         FROM profiles
         WHERE is_deleted = 0
         ORDER BY created_at ASC`,
        []
      );

      return rows.map((row) => ({
        ...row,
        isHidden: row.isHidden === 1,
        createdAt: new Date(Number(row.createdAt)).toISOString(),
      }));
    },

    async getProfile(id: string): Promise<Profile | null> {
      const row = await db.queryOneAsync<{
        id: string;
        userId: string;
        name: string;
        type: ProfileType;
        avatarUrl: string | null;
        isHidden: number;
        createdAt: number;
      }>(
        `SELECT
           id,
           user_id as userId,
           name,
           type,
           avatar_url as avatarUrl,
           is_hidden as isHidden,
           created_at as createdAt
         FROM profiles
         WHERE id = ? AND is_deleted = 0`,
        [id]
      );

      if (!row) return null;
      return {
        ...row,
        isHidden: row.isHidden === 1,
        createdAt: new Date(Number(row.createdAt)).toISOString(),
      };
    },

    async createProfile(data: {
      name: string;
      type?: string;
      avatarUrl?: string;
      id?: string; // Optional - use for demo profile
    }): Promise<Profile> {
      const id = data.id || crypto.randomUUID();
      const now = Date.now();

      // Ensure a user exists before creating profile
      const userId = await ensureUserExists();

      // Use a transaction to batch all inserts - prevents OPFS sync overhead per row
      await db.transactionAsync(async () => {
        await db.runAsync(
          `INSERT INTO profiles (id, user_id, name, type, avatar_url, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            userId,
            data.name,
            data.type || 'personal',
            data.avatarUrl || null,
            now,
            now,
          ]
        );

        // Seed default categories with subcategories and rules for the new profile
        const { parentCategories, subcategories } = flattenCategoriesForDB(
          SEED_CATEGORIES,
          'nl'
        );
        const categoryIdMap: Record<string, string> = {};

        // Insert parent categories
        for (const cat of parentCategories) {
          const categoryId = crypto.randomUUID();
          await db.runAsync(
            `INSERT INTO categories (id, name, icon, color, description, profile_id, updated_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              categoryId,
              cat.name,
              cat.icon,
              cat.color,
              cat.description,
              id,
              now,
              now,
            ]
          );
          categoryIdMap[cat.name] = categoryId;
        }

        // Insert subcategories with their rules
        for (const sub of subcategories) {
          const parentId = categoryIdMap[sub.parentName];
          const subId = crypto.randomUUID();
          await db.runAsync(
            `INSERT INTO categories (id, name, parent_id, icon, color, description, profile_id, updated_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              subId,
              sub.name,
              parentId,
              sub.icon,
              sub.color,
              sub.description,
              id,
              now,
              now,
            ]
          );
          categoryIdMap[sub.name] = subId;

          // Add category rules for subcategory
          for (const rule of sub.rules) {
            const ruleId = crypto.randomUUID();
            await db.runAsync(
              `INSERT INTO category_rules (id, pattern, category_id, priority, profile_id, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [ruleId, rule, subId, 0, id, now, now]
            );
          }
        }

        // Seed default name cleanup rules for the new profile
        for (const pattern of DEFAULT_NAME_CLEANUP_RULES) {
          const ruleId = crypto.randomUUID();
          await db.runAsync(
            `INSERT OR IGNORE INTO name_cleanup_rules (id, pattern, profile_id, is_active, created_at, updated_at)
             VALUES (?, ?, ?, 1, ?, ?)`,
            [ruleId, pattern, id, now, now]
          );
        }

        // Seed default payment provider rules for the new profile
        for (const rule of DEFAULT_PAYMENT_PROVIDER_RULES) {
          const ruleId = crypto.randomUUID();
          await db.runAsync(
            `INSERT OR IGNORE INTO payment_provider_rules (id, name, patterns, profile_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [ruleId, rule.name, rule.patterns, id, now, now]
          );
        }
      });

      const profile = await this.getProfile(id);
      if (!profile) throw new Error('Failed to create profile');
      return profile;
    },

    async updateProfile(
      id: string,
      data: { name?: string; type?: string; avatarUrl?: string }
    ): Promise<void> {
      const updates: string[] = [];
      const params: unknown[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        params.push(data.name);
      }
      if (data.type !== undefined) {
        updates.push('type = ?');
        params.push(data.type);
      }
      if (data.avatarUrl !== undefined) {
        updates.push('avatar_url = ?');
        params.push(data.avatarUrl);
      }

      if (updates.length === 0) return;

      updates.push('updated_at = ?');
      params.push(Date.now());
      params.push(id);

      await db.runAsync(
        `UPDATE profiles SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    },

    async deleteProfile(id: string): Promise<void> {
      const now = Date.now();

      // Soft-delete all related data to ensure clean state for duplicates/reimport
      // Transactions
      await db.runAsync(
        'UPDATE transactions SET is_deleted = 1, updated_at = ? WHERE profile_id = ?',
        [now, id]
      );
      // Accounts
      await db.runAsync(
        'UPDATE accounts SET is_deleted = 1, updated_at = ? WHERE profile_id = ?',
        [now, id]
      );
      // Categories
      await db.runAsync(
        'UPDATE categories SET is_deleted = 1, updated_at = ? WHERE profile_id = ?',
        [now, id]
      );
      // Budgets
      await db.runAsync(
        'UPDATE budgets SET is_deleted = 1, updated_at = ? WHERE profile_id = ?',
        [now, id]
      );
      // Category rules (for categories in this profile)
      await db.runAsync(
        `UPDATE category_rules SET is_deleted = 1, updated_at = ? 
         WHERE category_id IN (SELECT id FROM categories WHERE profile_id = ?)`,
        [now, id]
      );
      // Imports
      await db.runAsync(
        'UPDATE imports SET is_deleted = 1, updated_at = ? WHERE profile_id = ?',
        [now, id]
      );
      // Address book
      await db.runAsync(
        'UPDATE address_book SET is_deleted = 1, updated_at = ? WHERE profile_id = ?',
        [now, id]
      );
      // Finally, soft-delete the profile itself
      await db.runAsync(
        'UPDATE profiles SET is_deleted = 1, updated_at = ? WHERE id = ?',
        [now, id]
      );
    },

    async setProfileHidden(id: string, isHidden: boolean): Promise<void> {
      await db.runAsync(
        'UPDATE profiles SET is_hidden = ?, updated_at = ? WHERE id = ?',
        [isHidden ? 1 : 0, Date.now(), id]
      );
    },

    // ============= Accounts =============
    async getAccounts(): Promise<Account[]> {
      const pid = profileId();
      if (!pid) return [];

      const rows = await db.queryAsync<{
        id: string;
        iban: string;
        name: string;
        type: 'checking' | 'savings' | 'credit';
        bank: string;
        current_balance: number | null;
        order_index: number | null;
        created_at: number;
      }>(
        `SELECT * FROM accounts WHERE profile_id = ? AND is_deleted = 0 ORDER BY order_index ASC`,
        [pid]
      );

      return rows.map((row) => ({
        id: row.id,
        iban: row.iban,
        name: row.name,
        type: row.type,
        bank: row.bank,
        currentBalance: row.current_balance ?? 0,
        orderIndex: row.order_index ?? 0,
        createdAt: new Date(row.created_at).toISOString(),
      }));
    },

    async createAccount(data: {
      iban: string;
      name: string;
      type: string;
      bank?: string;
      currentBalance?: number;
      profileId?: string;
    }): Promise<Account> {
      // Use provided profileId or fall back to active profile
      const pid = data.profileId || profileId();
      if (!pid) throw new Error('No active profile');

      const id = crypto.randomUUID();
      const now = Date.now();

      await db.runAsync(
        `INSERT INTO accounts (id, iban, name, type, bank, current_balance, profile_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.iban,
          data.name,
          data.type,
          data.bank || 'unknown',
          data.currentBalance ?? 0,
          pid,
          now,
          now,
        ]
      );

      return {
        id,
        iban: data.iban,
        name: data.name,
        type: data.type as 'checking' | 'savings' | 'credit',
        bank: data.bank || 'unknown',
        currentBalance: data.currentBalance ?? 0,
        orderIndex: 0,
        createdAt: new Date(now).toISOString(),
      };
    },

    async updateAccount(
      id: string,
      data: { name?: string; type?: string; currentBalance?: number }
    ): Promise<void> {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      const updates: string[] = [];
      const params: unknown[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        params.push(data.name);
      }
      if (data.type !== undefined) {
        updates.push('type = ?');
        params.push(data.type);
      }
      if (data.currentBalance !== undefined) {
        updates.push('current_balance = ?');
        params.push(data.currentBalance);
      }

      if (updates.length === 0) return;

      updates.push('updated_at = ?');
      params.push(Date.now());
      params.push(id);
      params.push(pid);

      await db.runAsync(
        `UPDATE accounts SET ${updates.join(', ')} WHERE id = ? AND profile_id = ?`,
        params
      );
    },

    async deleteAccount(id: string): Promise<void> {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      await db.runAsync(
        'UPDATE accounts SET is_deleted = 1, updated_at = ? WHERE id = ? AND profile_id = ?',
        [Date.now(), id, pid]
      );
    },

    // ============= Categories =============
    async getCategories(withCounts = false): Promise<Category[]> {
      const pid = profileId();
      if (!pid) return [];

      if (withCounts) {
        return await db.queryAsync<Category>(
          `SELECT c.id, c.name, c.parent_id as parentId, c.icon, c.color, c.description, 
            c.profile_id, c.created_at as createdAt, c.updated_at as updatedAt, c.is_deleted,
            COUNT(t.id) as transactionCount,
            COALESCE(SUM(t.amount), 0) as totalExpenses
           FROM categories c
           LEFT JOIN transactions t ON t.category_id = c.id AND t.is_deleted = 0 AND t.profile_id = ?
           WHERE c.profile_id = ? AND c.is_deleted = 0
           GROUP BY c.id
           ORDER BY c.name ASC`,
          [pid, pid]
        );
      }

      return await db.queryAsync<Category>(
        `SELECT id, name, parent_id as parentId, icon, color, description, 
          profile_id, created_at as createdAt, updated_at as updatedAt, is_deleted
         FROM categories WHERE profile_id = ? AND is_deleted = 0 ORDER BY name ASC`,
        [pid]
      );
    },

    async createCategory(data: {
      name: string;
      icon?: string;
      color?: string;
      description?: string;
      parentId?: string;
    }): Promise<Category> {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      const id = crypto.randomUUID();
      const now = Date.now();

      await db.runAsync(
        `INSERT INTO categories (id, name, icon, color, description, parent_id, profile_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.name,
          data.icon || null,
          data.color || null,
          data.description || null,
          data.parentId || null,
          pid,
          now,
          now,
        ]
      );

      const category = await db.queryOneAsync<Category>(
        `SELECT id, name, parent_id as parentId, icon, color, description, 
          profile_id, created_at as createdAt, updated_at as updatedAt, is_deleted
         FROM categories WHERE id = ?`,
        [id]
      );
      if (!category) throw new Error('Failed to create category');
      return category;
    },

    async updateCategory(
      id: string,
      data: {
        name?: string;
        icon?: string;
        color?: string;
        description?: string | null;
        parentId?: string | null;
      }
    ): Promise<void> {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      const updates: string[] = [];
      const params: unknown[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        params.push(data.name);
      }
      if (data.icon !== undefined) {
        updates.push('icon = ?');
        params.push(data.icon);
      }
      if (data.color !== undefined) {
        updates.push('color = ?');
        params.push(data.color);
      }
      if (data.description !== undefined) {
        updates.push('description = ?');
        params.push(data.description);
      }
      if (data.parentId !== undefined) {
        updates.push('parent_id = ?');
        params.push(data.parentId);
      }

      if (updates.length === 0) return;

      updates.push('updated_at = ?');
      params.push(Date.now());
      params.push(id);
      params.push(pid);

      await db.runAsync(
        `UPDATE categories SET ${updates.join(', ')} WHERE id = ? AND profile_id = ?`,
        params
      );
    },

    async deleteCategory(id: string): Promise<void> {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      await db.runAsync(
        'UPDATE categories SET is_deleted = 1, updated_at = ? WHERE id = ? AND profile_id = ?',
        [Date.now(), id, pid]
      );
    },

    // ============= Transactions =============
    async getTransactions(
      filters?: Record<string, string>
    ): Promise<Transaction[]> {
      const pid = profileId();
      if (!pid) return [];

      // Define the raw DB row type
      interface DBTransaction {
        id: string;
        date: string;
        amount: number;
        type: string;
        description: string;
        merchant_name: string | null;
        account_id: string;
        opposing_account_iban: string | null;
        opposing_account_name: string | null;
        category_id: string | null;
        notes: string | null;
        payment_method: string | null;
        raw_data: string | null;
        import_hash: string;
        created_at: number;
        address_book_id: string | null;
        payment_provider: string | null;
        category_name: string | null;
        category_icon: string | null;
        category_color: string | null;
        account_name: string;
        account_iban: string;
      }

      let sql = `
        SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
               a.name as account_name, a.iban as account_iban
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN accounts a ON t.account_id = a.id
        WHERE a.profile_id = ? AND t.is_deleted = 0
      `;
      const params: unknown[] = [pid];

      if (filters) {
        if (filters.startDate) {
          sql += ' AND t.date >= ?';
          params.push(filters.startDate);
        }
        if (filters.endDate) {
          sql += ' AND t.date <= ?';
          params.push(filters.endDate);
        }
        if (filters.type) {
          sql += ' AND t.type = ?';
          params.push(filters.type);
        }
        if (filters.categoryId) {
          sql += ' AND t.category_id = ?';
          params.push(filters.categoryId);
        }
        // Support multiple category IDs (comma-separated)
        if (filters.categoryIds !== undefined) {
          // Allow empty string ('') from CategoryFilter to indicate uncategorized
          const rawIds = filters.categoryIds.split(',');

          // Consider both empty string and '0' as markers for uncategorized
          const includesUncategorized =
            rawIds.includes('') || rawIds.includes('0');

          // Normalize actual category ids (exclude '' and '0')
          const categoryIds = rawIds
            .filter((id) => id !== '' && id !== '0')
            .filter(Boolean);

          if (includesUncategorized && categoryIds.length > 0) {
            // Both uncategorized and specific categories
            const placeholders = categoryIds.map(() => '?').join(',');
            sql += ` AND (t.category_id IS NULL OR t.category_id IN (${placeholders}))`;
            params.push(...categoryIds);
          } else if (includesUncategorized) {
            // Only uncategorized
            sql += ' AND t.category_id IS NULL';
          } else if (categoryIds.length > 0) {
            // Only specific categories
            const placeholders = categoryIds.map(() => '?').join(',');
            sql += ` AND t.category_id IN (${placeholders})`;
            params.push(...categoryIds);
          }
        }
        if (filters.accountId) {
          sql += ' AND t.account_id = ?';
          params.push(filters.accountId);
        }
        if (filters.search) {
          sql +=
            ' AND (t.description LIKE ? OR t.merchant_name LIKE ? OR t.opposing_account_name LIKE ? OR t.opposing_account_iban LIKE ?)';
          const search = `%${filters.search}%`;
          params.push(search, search, search, search);
        }
        // Support multiple opposing account IBANs (comma-separated)
        if (filters.opposingAccountIbans) {
          const ibans = filters.opposingAccountIbans.split(',').filter(Boolean);
          if (ibans.length > 0) {
            const placeholders = ibans.map(() => '?').join(',');
            sql += ` AND t.opposing_account_iban IN (${placeholders})`;
            params.push(...ibans);
          }
        }
        // Filter by opposing account name (LIKE search)
        if (filters.opposingAccountName) {
          const namePattern = `%${filters.opposingAccountName}%`;
          sql += ` AND (
            LOWER(t.opposing_account_name) LIKE LOWER(?) 
            OR LOWER(t.merchant_name) LIKE LOWER(?)
          )`;
          params.push(namePattern, namePattern);
        }
        // Filter by address book ID
        if (filters.addressBookId) {
          // Get contact info to support multi-IBAN contacts
          const contact = await db.queryOneAsync<{
            iban: string;
            original_name: string | null;
          }>('SELECT iban, original_name FROM address_book WHERE id = ?', [
            filters.addressBookId,
          ]);

          if (contact) {
            // Get all IBANs for this contact
            const contactIbans = await db.queryAsync<{ iban: string }>(
              'SELECT iban FROM contact_ibans WHERE contact_id = ?',
              [filters.addressBookId]
            );

            const allIbans = [
              contact.iban,
              ...contactIbans.map((r) => r.iban),
            ].filter(Boolean);
            const ibanPlaceholders = allIbans.map(() => '?').join(',');

            if (contact.original_name) {
              // Shared IBAN: must match IBAN AND name
              sql += ` AND (t.address_book_id = ? OR (t.address_book_id IS NULL AND t.opposing_account_iban IN (${ibanPlaceholders}) AND (t.opposing_account_name = ? OR t.merchant_name = ?)))`;
              params.push(
                filters.addressBookId,
                ...allIbans,
                contact.original_name,
                contact.original_name
              );
            } else {
              // Regular IBAN: match address_book_id OR IBAN
              sql += ` AND (t.address_book_id = ? OR (t.address_book_id IS NULL AND t.opposing_account_iban IN (${ibanPlaceholders})))`;
              params.push(filters.addressBookId, ...allIbans);
            }
          } else {
            sql += ' AND t.address_book_id = ?';
            params.push(filters.addressBookId);
          }
        }
        // Filter by payment methods (comma-separated)
        if (filters.paymentMethods) {
          const methods = filters.paymentMethods.split(',').filter(Boolean);
          if (methods.length > 0) {
            const placeholders = methods.map(() => '?').join(',');
            sql += ` AND LOWER(t.payment_method) IN (${placeholders})`;
            params.push(...methods.map((m) => m.toLowerCase()));
          }
        }
        // Filter by payment providers (comma-separated)
        if (filters.paymentProviders) {
          const providers = filters.paymentProviders.split(',').filter(Boolean);
          if (providers.length > 0) {
            const placeholders = providers.map(() => '?').join(',');
            sql += ` AND LOWER(t.payment_provider) IN (${placeholders})`;
            params.push(...providers.map((p) => p.toLowerCase()));
          }
        }
      }

      sql += ' ORDER BY t.date DESC, t.id DESC';

      if (filters?.limit) {
        sql += ' LIMIT ?';
        params.push(parseInt(filters.limit, 10));
      }

      const rows = await db.queryAsync<DBTransaction>(sql, params);

      // Transform snake_case DB rows to camelCase Transaction objects
      return rows.map((row) => ({
        id: row.id,
        date: row.date,
        amount: row.amount,
        type: row.type as 'income' | 'expense' | 'transfer',
        description: row.description,
        merchantName: row.merchant_name,
        accountId: row.account_id,
        opposingAccountIban: row.opposing_account_iban,
        opposingAccountName: row.opposing_account_name,
        categoryId: row.category_id,
        categoryName: row.category_name,
        categoryIcon: row.category_icon,
        notes: row.notes,
        paymentMethod: row.payment_method,
        rawData: row.raw_data,
        importHash: row.import_hash,
        createdAt: String(row.created_at),
        paymentProvider: row.payment_provider,
        addressBookId: row.address_book_id,
      }));
    },

    async updateTransaction(
      id: string,
      data: {
        type?: 'income' | 'expense' | 'transfer';
        categoryId?: string | null;
        notes?: string;
        merchantName?: string | null;
        paymentMethod?: string | null;
        paymentProvider?: string | null;
        addressBookId?: string | null;
      }
    ): Promise<void> {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      const updates: string[] = [];
      const params: unknown[] = [];

      if (data.type !== undefined) {
        updates.push('type = ?');
        params.push(data.type);
      }
      if (data.categoryId !== undefined) {
        updates.push('category_id = ?');
        params.push(data.categoryId);
      }
      if (data.notes !== undefined) {
        updates.push('notes = ?');
        params.push(data.notes);
      }
      if (data.merchantName !== undefined) {
        updates.push('merchant_name = ?');
        params.push(data.merchantName);
      }
      if (data.paymentMethod !== undefined) {
        updates.push('payment_method = ?');
        params.push(data.paymentMethod);
      }
      if (data.paymentProvider !== undefined) {
        updates.push('payment_provider = ?');
        params.push(data.paymentProvider);
      }
      if (data.addressBookId !== undefined) {
        updates.push('address_book_id = ?');
        params.push(data.addressBookId);
      }

      if (updates.length === 0) return;

      updates.push('updated_at = ?');
      params.push(Date.now());
      params.push(id);
      params.push(pid);

      await db.runAsync(
        `UPDATE transactions SET ${updates.join(', ')} WHERE id = ? AND profile_id = ?`,
        params
      );
    },

    async deleteTransaction(id: string): Promise<void> {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      await db.runAsync(
        'UPDATE transactions SET is_deleted = 1, updated_at = ? WHERE id = ? AND profile_id = ?',
        [Date.now(), id, pid]
      );
    },

    async bulkCategorize(
      transactionIds: string[],
      categoryId: string
    ): Promise<{ updated: number }> {
      const placeholders = transactionIds.map(() => '?').join(',');
      const result = await db.runAsync(
        `UPDATE transactions SET category_id = ?, updated_at = ? WHERE id IN (${placeholders})`,
        [categoryId, Date.now(), ...transactionIds]
      );
      return { updated: result.changes };
    },

    // ============= Budgets =============
    async getBudgets(
      month?: string,
      startDate?: string,
      endDate?: string
    ): Promise<Budget[]> {
      const pid = profileId();
      if (!pid) return [];

      // Define the raw DB row type with spending data
      interface DBBudget {
        id: string;
        category_id: string | null;
        amount: number;
        period: string;
        start_date: string | null;
        end_date: string | null;
        created_at: number;
        updated_at: number;
        spent: number;
        category_name: string | null;
        category_icon: string | null;
        category_color: string | null;
      }

      // Calculate date range for current/specified period
      let rangeStartDate: string;
      let rangeEndDate: string;

      if (startDate && endDate) {
        // Use explicit date range
        rangeStartDate = startDate;
        rangeEndDate = endDate;
      } else if (month) {
        rangeStartDate = `${month}-01`;
        const [year, m] = month.split('-').map(Number);
        const lastDay = new Date(year, m, 0).getDate();
        rangeEndDate = `${month}-${lastDay.toString().padStart(2, '0')}`;
      } else {
        const now = new Date();
        rangeStartDate = `${now.getFullYear()}-${(now.getMonth() + 1)
          .toString()
          .padStart(2, '0')}-01`;
        const lastDay = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0
        ).getDate();
        rangeEndDate = `${now.getFullYear()}-${(now.getMonth() + 1)
          .toString()
          .padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
      }

      // Calculate number of months in the period for budget scaling
      const start = new Date(rangeStartDate);
      const end = new Date(rangeEndDate);
      const monthsDiff =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()) +
        1;

      // Query budgets with spending calculation
      // Profile-filtered: only show budgets for this profile
      // and only count spending from transactions in this profile's accounts
      const rows = await db.queryAsync<DBBudget>(
        `
        SELECT 
          b.*,
          c.name as category_name,
          c.icon as category_icon,
          c.color as category_color,
          COALESCE(ABS(SUM(CASE WHEN t.amount < 0 THEN t.amount ELSE 0 END)), 0) as spent
        FROM budgets b
        LEFT JOIN categories c ON b.category_id = c.id
        LEFT JOIN transactions t ON b.category_id = t.category_id 
          AND t.date >= ? AND t.date <= ?
          AND t.account_id IN (SELECT id FROM accounts WHERE profile_id = ?)
          AND t.is_deleted = 0
        WHERE b.profile_id = ? AND b.is_deleted = 0
        GROUP BY b.id
        ORDER BY b.amount DESC
      `,
        [rangeStartDate, rangeEndDate, pid, pid]
      );

      // Transform and calculate derived values
      return rows.map((row) => {
        const spent = row.spent || 0;
        // Scale budget amount based on period
        const scaledAmount =
          row.period === 'monthly' ? row.amount * monthsDiff : row.amount; // yearly budgets don't scale
        const remaining = scaledAmount - spent;
        const percentage = scaledAmount > 0 ? (spent / scaledAmount) * 100 : 0;

        return {
          id: row.id,
          categoryId: row.category_id,
          amount: scaledAmount,
          period: row.period as 'monthly' | 'yearly',
          startDate: row.start_date,
          endDate: row.end_date,
          createdAt: String(row.created_at),
          spent,
          remaining,
          percentage,
          categoryName: row.category_name,
          categoryColor: row.category_color,
          categoryIcon: row.category_icon,
        };
      });
    },

    async createBudget(data: {
      categoryId?: string;
      amount: number;
      period?: string;
    }): Promise<Budget> {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      const id = crypto.randomUUID();
      const now = Date.now();

      await db.runAsync(
        `INSERT INTO budgets (id, category_id, amount, period, profile_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.categoryId || null,
          data.amount,
          data.period || 'monthly',
          pid,
          now,
          now,
        ]
      );

      const budget = await db.queryOneAsync<Budget>(
        'SELECT * FROM budgets WHERE id = ?',
        [id]
      );
      if (!budget) throw new Error('Failed to create budget');
      return budget;
    },

    async updateBudget(id: string, data: { amount?: number }): Promise<void> {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      if (data.amount === undefined) return;

      await db.runAsync(
        'UPDATE budgets SET amount = ?, updated_at = ? WHERE id = ? AND profile_id = ?',
        [data.amount, Date.now(), id, pid]
      );
    },

    async deleteBudget(id: string): Promise<void> {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      await db.runAsync(
        'UPDATE budgets SET is_deleted = 1, updated_at = ? WHERE id = ? AND profile_id = ?',
        [Date.now(), id, pid]
      );
    },

    // ============= Analytics =============
    async getDashboardStats(startDate?: string, endDate?: string) {
      const pid = profileId();
      if (!pid) {
        return {
          totalIncome: 0,
          totalExpenses: 0,
          netSavings: 0,
          transactionCount: 0,
        };
      }

      let sql = `
        SELECT 
          COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as totalIncome,
          COALESCE(SUM(CASE WHEN t.type = 'expense' THEN ABS(t.amount) ELSE 0 END), 0) as totalExpenses,
          COUNT(t.id) as transactionCount
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE a.profile_id = ? AND t.is_deleted = 0
      `;
      const params: unknown[] = [pid];

      if (startDate) {
        sql += ' AND t.date >= ?';
        params.push(startDate);
      }
      if (endDate) {
        sql += ' AND t.date <= ?';
        params.push(endDate);
      }

      const result = await db.queryOneAsync<{
        totalIncome: number;
        totalExpenses: number;
        transactionCount: number;
      }>(sql, params);

      return {
        totalIncome: result?.totalIncome || 0,
        totalExpenses: result?.totalExpenses || 0,
        netSavings: (result?.totalIncome || 0) - (result?.totalExpenses || 0),
        transactionCount: result?.transactionCount || 0,
      };
    },

    async getAvailableYears(): Promise<number[]> {
      const pid = profileId();
      if (!pid) return [];

      const results = await db.queryAsync<{ year: number }>(
        `SELECT DISTINCT CAST(strftime('%Y', t.date) AS INTEGER) as year
         FROM transactions t
         JOIN accounts a ON t.account_id = a.id
         WHERE a.profile_id = ? AND t.is_deleted = 0
         ORDER BY year DESC`,
        [pid]
      );

      return results.map((r: { year: number }) => r.year);
    },

    async getMinMaxDates(): Promise<{
      minDate: string;
      maxDate: string;
    } | null> {
      const pid = profileId();
      if (!pid) return null;

      const result = await db.queryOneAsync<{
        minDate: string;
        maxDate: string;
      }>(
        `SELECT MIN(t.date) as minDate, MAX(t.date) as maxDate
         FROM transactions t
         JOIN accounts a ON t.account_id = a.id
         WHERE a.profile_id = ? AND t.is_deleted = 0`,
        [pid]
      );

      if (!result?.minDate || !result?.maxDate) return null;
      return result;
    },

    // ============= Address Book =============
    async getAddressBook() {
      const pid = profileId();
      if (!pid) return [];

      return await db.queryAsync(
        `SELECT * FROM address_book WHERE profile_id = ? AND is_deleted = 0 ORDER BY name ASC`,
        [pid]
      );
    },

    async createAddressBookEntry(data: {
      iban: string;
      name: string;
      description?: string;
      notes?: string;
    }) {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      const id = crypto.randomUUID();
      const now = Date.now();

      const normalizedIban = data.iban.toUpperCase().trim();
      const normalizedName = data.name.trim();

      // 1) Merge by exact same name (trimmed)
      const existingByName = await db.queryAsync<{
        id: string;
        name: string;
        iban: string;
      }>(
        `SELECT id, name, iban
         FROM address_book
         WHERE profile_id = ? AND is_deleted = 0 AND TRIM(name) = TRIM(?)
         LIMIT 1`,
        [pid, normalizedName]
      );

      if (existingByName.length > 0) {
        const existingContactId = existingByName[0].id;

        // Ensure the contact's primary IBAN is represented in contact_ibans
        await db.runAsync(
          'INSERT OR IGNORE INTO contact_ibans (id, contact_id, iban, is_primary, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)',
          [
            crypto.randomUUID(),
            existingContactId,
            existingByName[0].iban,
            now,
            now,
          ]
        );

        // Link IBAN to the existing contact
        await db.runAsync(
          'INSERT OR IGNORE INTO contact_ibans (id, contact_id, iban, is_primary, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)',
          [crypto.randomUUID(), existingContactId, normalizedIban, now, now]
        );

        // Sync transactions by IBAN (regular contacts) to the existing contact
        const syncResult = await db.runAsync(
          `UPDATE transactions
           SET address_book_id = ?, merchant_name = ?, updated_at = ?
           WHERE profile_id = ?
             AND opposing_account_iban = ?
             AND (address_book_id IS NULL OR address_book_id = '')
             AND is_deleted = 0`,
          [existingContactId, existingByName[0].name, now, pid, normalizedIban]
        );

        return {
          success: true,
          merged: true,
          mergeReason: 'name', // Merged because contact with same name exists
          data: {
            id: existingContactId,
            iban: normalizedIban,
            name: existingByName[0].name,
            transactionsUpdated: syncResult?.changes || 0,
          },
        };
      }

      // Check if a contact with this IBAN already exists - if so, merge into it
      const existing = await db.queryAsync<{ id: string; name: string }>(
        'SELECT id, name FROM address_book WHERE iban = ? AND profile_id = ? AND is_deleted = 0',
        [normalizedIban, pid]
      );
      if (existing.length > 0) {
        // IBAN exists as primary - merge the new contact into the existing one
        const existingContactId = existing[0].id;

        // Ensure the contact's primary IBAN is in contact_ibans
        await db.runAsync(
          'INSERT OR IGNORE INTO contact_ibans (id, contact_id, iban, is_primary, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)',
          [crypto.randomUUID(), existingContactId, normalizedIban, now, now]
        );

        // Update transactions to use this contact
        const syncResult = await db.runAsync(
          `UPDATE transactions
           SET address_book_id = ?, merchant_name = ?, updated_at = ?
           WHERE profile_id = ?
             AND opposing_account_iban = ?
             AND (address_book_id IS NULL OR address_book_id = '')
             AND is_deleted = 0`,
          [existingContactId, existing[0].name, now, pid, normalizedIban]
        );

        return {
          success: true,
          merged: true,
          mergeReason: 'iban', // Merged because IBAN already exists as primary
          data: {
            id: existingContactId,
            iban: normalizedIban,
            name: existing[0].name,
            transactionsUpdated: syncResult?.changes || 0,
          },
        };
      }

      // Check if the IBAN is already assigned to another contact via contact_ibans - if so, merge
      const existingIban = await db.queryAsync<{
        contact_id: string;
        name: string;
      }>(
        `SELECT ci.contact_id, ab.name FROM contact_ibans ci
         JOIN address_book ab ON ab.id = ci.contact_id
         WHERE ci.iban = ? AND ab.profile_id = ? AND ab.is_deleted = 0`,
        [normalizedIban, pid]
      );
      if (existingIban.length > 0) {
        // IBAN is assigned via contact_ibans - merge into that contact
        const existingContactId = existingIban[0].contact_id;

        // Update transactions to use this contact
        const syncResult = await db.runAsync(
          `UPDATE transactions
           SET address_book_id = ?, merchant_name = ?, updated_at = ?
           WHERE profile_id = ?
             AND opposing_account_iban = ?
             AND (address_book_id IS NULL OR address_book_id = '')
             AND is_deleted = 0`,
          [existingContactId, existingIban[0].name, now, pid, normalizedIban]
        );

        return {
          success: true,
          merged: true,
          mergeReason: 'iban', // Merged because IBAN already exists in contact_ibans
          data: {
            id: existingContactId,
            iban: normalizedIban,
            name: existingIban[0].name,
            transactionsUpdated: syncResult?.changes || 0,
          },
        };
      }

      // Insert the new address book entry
      await db.runAsync(
        `INSERT INTO address_book (id, iban, name, description, notes, profile_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          normalizedIban,
          normalizedName,
          data.description || null,
          data.notes || null,
          pid,
          now,
          now,
        ]
      );

      // Add to contact_ibans junction table for consistent lookup
      await db.runAsync(
        `INSERT OR IGNORE INTO contact_ibans (id, contact_id, iban, is_primary, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)`,
        [crypto.randomUUID(), id, normalizedIban, now, now]
      );

      // Sync transactions to the new contact - link by IBAN
      const result = await db.runAsync(
        `UPDATE transactions 
         SET address_book_id = ?, merchant_name = ?, updated_at = ?
         WHERE profile_id = ? 
           AND opposing_account_iban = ? 
           AND (address_book_id IS NULL OR address_book_id = '')
           AND is_deleted = 0`,
        [id, normalizedName, now, pid, normalizedIban]
      );

      return {
        success: true,
        data: {
          id,
          iban: normalizedIban,
          name: normalizedName,
          transactionsUpdated: result?.changes || 0,
        },
      };
    },

    async updateAddressBookEntry(
      id: string,
      data: { name?: string; description?: string; notes?: string }
    ) {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      const updates: string[] = [];
      const params: unknown[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        params.push(data.name);
      }
      if (data.description !== undefined) {
        updates.push('description = ?');
        params.push(data.description);
      }
      if (data.notes !== undefined) {
        updates.push('notes = ?');
        params.push(data.notes);
      }

      if (updates.length === 0) return;

      updates.push('updated_at = ?');
      params.push(Date.now());
      params.push(id);
      params.push(pid);

      await db.runAsync(
        `UPDATE address_book SET ${updates.join(', ')} WHERE id = ? AND profile_id = ?`,
        params
      );
    },

    async deleteAddressBookEntry(id: string) {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      await db.runAsync(
        'UPDATE address_book SET is_deleted = 1, updated_at = ? WHERE id = ? AND profile_id = ?',
        [Date.now(), id, pid]
      );
    },

    /**
     * Add an IBAN to an existing contact
     */
    async addContactIban(
      contactId: string,
      iban: string
    ): Promise<{ success: boolean; transactionsUpdated: number }> {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      const normalizedIban = iban.toUpperCase().trim();

      const isSharedIban = await db.queryAsync<{ id: string }>(
        'SELECT id FROM shared_ibans WHERE iban = ? AND is_deleted = 0',
        [normalizedIban]
      );

      // Check if contact exists and belongs to the profile
      const contact = await db.queryAsync<{
        id: string;
        name: string;
        iban: string | null;
      }>(
        'SELECT id, name, iban FROM address_book WHERE id = ? AND profile_id = ? AND is_deleted = 0',
        [contactId, pid]
      );
      if (contact.length === 0) {
        throw new Error('Contact not found');
      }

      // Check if IBAN is already assigned to another contact
      const existingIban = await db.queryAsync<{
        contact_id: string;
        name: string;
      }>(
        `SELECT ci.contact_id, ab.name FROM contact_ibans ci
         JOIN address_book ab ON ab.id = ci.contact_id
         WHERE ci.iban = ? AND ab.profile_id = ? AND ab.is_deleted = 0`,
        [normalizedIban, pid]
      );
      if (
        isSharedIban.length === 0 &&
        existingIban.length > 0 &&
        existingIban[0].contact_id !== contactId
      ) {
        throw new Error(
          `IBAN is already assigned to contact "${existingIban[0].name}"`
        );
      }

      // Add IBAN to contact_ibans (use INSERT OR IGNORE to handle duplicates)
      const now = Date.now();
      await db.runAsync(
        'INSERT OR IGNORE INTO contact_ibans (id, contact_id, iban, is_primary, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)',
        [crypto.randomUUID(), contactId, normalizedIban, now, now]
      );

      // Sync transactions for the newly added IBAN
      const result = await db.runAsync(
        `UPDATE transactions 
         SET address_book_id = ?, merchant_name = ?, updated_at = ?
         WHERE profile_id = ? 
           AND opposing_account_iban = ? 
           AND (address_book_id IS NULL OR address_book_id = '')
           AND is_deleted = 0`,
        [contactId, contact[0].name, now, pid, normalizedIban]
      );

      return {
        success: true,
        transactionsUpdated: result?.changes || 0,
      };
    },

    /**
     * Resolve a shared IBAN entry to address book
     * Used for adding contacts from shared IBANs (payment processors)
     */
    async resolveSharedIban(
      iban: string,
      name: string,
      originalNames: string[],
      contactId?: string
    ): Promise<{ success: boolean; data: { transactionsUpdated: number } }> {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      const normalizedIban = iban.toUpperCase().trim();
      const normalizedName = name.trim();
      const now = Date.now();

      // If a contact with EXACT same name exists, always merge into it.
      const existingByName = await db.queryAsync<{ id: string }>(
        `SELECT id FROM address_book
         WHERE profile_id = ? AND is_deleted = 0 AND TRIM(name) = TRIM(?)
         LIMIT 1`,
        [pid, normalizedName]
      );

      let addressBookId: string;
      let isNewContact = false;

      if (contactId) {
        addressBookId = contactId;
        await this.updateAddressBookEntry(contactId, { name: normalizedName });
      } else if (existingByName.length > 0) {
        addressBookId = existingByName[0].id;
      } else {
        // Create a new contact. For shared IBANs we use original_name to disambiguate.
        addressBookId = crypto.randomUUID();
        isNewContact = true;
        const primaryOriginalName = (originalNames[0] || normalizedName).trim();
        await db.runAsync(
          `INSERT INTO address_book (id, iban, name, original_name, profile_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            addressBookId,
            normalizedIban,
            normalizedName,
            primaryOriginalName,
            pid,
            now,
            now,
          ]
        );
      }

      // Ensure the IBAN is linked to the contact (shared IBANs can be linked to multiple contacts).
      await db.runAsync(
        'INSERT OR IGNORE INTO contact_ibans (id, contact_id, iban, is_primary, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [
          crypto.randomUUID(),
          addressBookId,
          normalizedIban,
          isNewContact ? 1 : 0,
          now,
          now,
        ]
      );

      // Update transactions with the new merchant name + link them to the contact.
      let transactionsUpdated = 0;
      if (originalNames.length > 0) {
        for (const originalName of originalNames) {
          const normalizedOriginal = originalName.trim();
          const result = await db.runAsync(
            `UPDATE transactions
             SET merchant_name = ?, address_book_id = ?, updated_at = ?
             WHERE profile_id = ?
               AND opposing_account_iban = ?
               AND (
                 LOWER(opposing_account_name) = LOWER(?) OR
                 LOWER(merchant_name) = LOWER(?)
               )
               AND is_deleted = 0`,
            [
              normalizedName,
              addressBookId,
              now,
              pid,
              normalizedIban,
              normalizedOriginal,
              normalizedOriginal,
            ]
          );
          transactionsUpdated += result?.changes || 0;
        }
      } else {
        // Fallback: link by IBAN only if no originalNames were provided.
        const result = await db.runAsync(
          `UPDATE transactions
           SET merchant_name = ?, address_book_id = ?, updated_at = ?
           WHERE profile_id = ?
             AND opposing_account_iban = ?
             AND is_deleted = 0`,
          [normalizedName, addressBookId, now, pid, normalizedIban]
        );
        transactionsUpdated += result?.changes || 0;
      }

      return { success: true, data: { transactionsUpdated } };
    },

    // ============= Category Rules =============
    async getCategoryRules(): Promise<
      Array<{
        id: string;
        pattern: string;
        category_id: string;
        category_name: string | null;
        priority: number;
      }>
    > {
      const pid = profileId();
      if (!pid) return [];

      return await db.queryAsync(
        `SELECT cr.*, c.name as category_name
         FROM category_rules cr
         LEFT JOIN categories c ON cr.category_id = c.id
         WHERE cr.profile_id = ? AND cr.is_deleted = 0
         ORDER BY cr.priority DESC`,
        [pid]
      );
    },

    async createCategoryRule(data: {
      pattern: string;
      categoryId: string;
      priority?: number;
    }) {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      const id = crypto.randomUUID();
      const now = Date.now();

      await db.runAsync(
        `INSERT INTO category_rules (id, pattern, category_id, priority, profile_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, data.pattern, data.categoryId, data.priority || 0, pid, now, now]
      );

      return { id, pattern: data.pattern, categoryId: data.categoryId };
    },

    async deleteCategoryRule(id: string) {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      await db.runAsync(
        'UPDATE category_rules SET is_deleted = 1, updated_at = ? WHERE id = ? AND profile_id = ?',
        [Date.now(), id, pid]
      );
    },

    // ============= Data Management =============
    async exportAll() {
      // Export the complete dataset (similar to apps/api /api/data/export)
      // Keep key names stable for settings UI: camelCase keys with raw DB rows.
      const [
        categories,
        accounts,
        transactions,
        budgets,
        categoryRules,
        imports,
        addressBook,
        contactIbans,
        sharedIbans,
        sharedIbanMerchants,
        nameCleanupRules,
        paymentProviderRules,
        users,
        profiles,
      ] = await Promise.all([
        db.queryAsync('SELECT * FROM categories ORDER BY id'),
        db.queryAsync('SELECT * FROM accounts ORDER BY id'),
        db.queryAsync('SELECT * FROM transactions ORDER BY id'),
        db.queryAsync('SELECT * FROM budgets ORDER BY id'),
        db.queryAsync('SELECT * FROM category_rules ORDER BY id'),
        db.queryAsync('SELECT * FROM imports ORDER BY id'),
        db.queryAsync('SELECT * FROM address_book ORDER BY id'),
        db.queryAsync('SELECT * FROM contact_ibans ORDER BY id'),
        db.queryAsync('SELECT * FROM shared_ibans ORDER BY id'),
        db.queryAsync('SELECT * FROM shared_iban_merchants ORDER BY id'),
        db.queryAsync('SELECT * FROM name_cleanup_rules ORDER BY id'),
        db.queryAsync('SELECT * FROM payment_provider_rules ORDER BY id'),
        db.queryAsync('SELECT * FROM users ORDER BY id'),
        db.queryAsync('SELECT * FROM profiles ORDER BY id'),
      ]);

      return {
        categories,
        accounts,
        transactions,
        budgets,
        categoryRules,
        imports,
        addressBook,
        contactIbans,
        sharedIbans,
        sharedIbanMerchants,
        nameCleanupRules,
        paymentProviderRules,
        users,
        profiles,
        exportedAt: new Date().toISOString(),
        version: 2,
      };
    },

    async resetAllData() {
      // Delete all data and recreate demo profile
      await db.runAsync('DELETE FROM transactions');
      await db.runAsync('DELETE FROM budgets');
      await db.runAsync('DELETE FROM category_rules');
      await db.runAsync('DELETE FROM categories');
      await db.runAsync('DELETE FROM address_book');
      await db.runAsync('DELETE FROM accounts');
      await db.runAsync('DELETE FROM profiles');

      // Create demo profile
      const demoProfile = await this.createProfile({
        name: 'Demo',
        type: 'personal',
      });

      return {
        demoProfileId: demoProfile.id,
        message: 'All data reset successfully',
      };
    },

    // ============= Analytics Methods =============
    async getMonthlyStats(startDate?: string, endDate?: string) {
      const pid = profileId();
      if (!pid) return [];

      let sql = `
        SELECT 
          strftime('%Y-%m', t.date) as month,
          COALESCE(SUM(CASE WHEN t.amount > 0 AND t.type != 'transfer' THEN t.amount ELSE 0 END), 0) as income,
          COALESCE(SUM(CASE WHEN t.amount < 0 AND t.type != 'transfer' THEN ABS(t.amount) ELSE 0 END), 0) as expenses
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE a.profile_id = ? AND t.is_deleted = 0
      `;
      const params: unknown[] = [pid];

      if (startDate) {
        sql += ' AND t.date >= ?';
        params.push(startDate);
      }
      if (endDate) {
        sql += ' AND t.date <= ?';
        params.push(endDate);
      }

      sql += " GROUP BY strftime('%Y-%m', t.date) ORDER BY month ASC";

      const rows = await db.queryAsync<{
        month: string;
        income: number;
        expenses: number;
      }>(sql, params);

      let runningBalance = 0;
      return rows.map((row) => {
        runningBalance += row.income - row.expenses;
        return {
          month: row.month,
          income: row.income,
          expenses: row.expenses,
          balance: runningBalance,
        };
      });
    },

    async getCategoryStats(
      startDate?: string,
      endDate?: string,
      type: 'expense' | 'income' = 'expense'
    ) {
      const pid = profileId();
      if (!pid) return [];

      const amountCondition =
        type === 'expense' ? 't.amount < 0' : 't.amount > 0';

      let sql = `
        SELECT 
          t.category_id as categoryId,
          COALESCE(c.name, 'Uncategorized') as categoryName,
          COALESCE(c.color, '#9CA3AF') as color,
          COALESCE(c.icon, '📦') as icon,
          SUM(ABS(t.amount)) as amount,
          COUNT(*) as transactionCount
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        JOIN accounts a ON t.account_id = a.id
        WHERE a.profile_id = ? AND t.is_deleted = 0 AND ${amountCondition} AND t.type != 'transfer'
      `;
      const params: unknown[] = [pid];

      if (startDate) {
        sql += ' AND t.date >= ?';
        params.push(startDate);
      }
      if (endDate) {
        sql += ' AND t.date <= ?';
        params.push(endDate);
      }

      sql += ' GROUP BY t.category_id ORDER BY amount DESC';

      const rows = await db.queryAsync<{
        categoryId: string | null;
        categoryName: string;
        color: string;
        icon: string;
        amount: number;
        transactionCount: number;
      }>(sql, params);

      const total = rows.reduce((sum, row) => sum + row.amount, 0);

      return rows.map((row) => ({
        categoryId: row.categoryId || '',
        categoryName: row.categoryName,
        color: row.color,
        icon: row.icon,
        amount: row.amount,
        percentage: total > 0 ? (row.amount / total) * 100 : 0,
        transactionCount: row.transactionCount,
      }));
    },

    async getDailyExpenses(startDate?: string, endDate?: string) {
      const pid = profileId();
      if (!pid) return [];

      let sql = `
        SELECT 
          t.date,
          COALESCE(SUM(CASE WHEN t.amount < 0 AND t.type != 'transfer' THEN ABS(t.amount) ELSE 0 END), 0) as expenses
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE a.profile_id = ? AND t.is_deleted = 0
      `;
      const params: unknown[] = [pid];

      if (startDate) {
        sql += ' AND t.date >= ?';
        params.push(startDate);
      }
      if (endDate) {
        sql += ' AND t.date <= ?';
        params.push(endDate);
      }

      sql += ' GROUP BY t.date ORDER BY t.date ASC';

      const rows = await db.queryAsync<{ date: string; expenses: number }>(
        sql,
        params
      );
      const expenseMap = new Map(rows.map((r) => [r.date, r.expenses]));

      // Generate all days in range
      const result: { date: string; expenses: number }[] = [];
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          result.push({
            date: dateStr,
            expenses: expenseMap.get(dateStr) || 0,
          });
        }
      } else {
        return rows;
      }

      return result;
    },

    async getBalanceForecast(startDate?: string, endDate?: string) {
      const pid = profileId();
      if (!pid) return null;

      const now = new Date();

      // Determine period boundaries
      let periodStart: Date;
      let periodEnd: Date;

      if (startDate && endDate) {
        periodStart = new Date(startDate);
        periodEnd = new Date(endDate);
      } else {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      const periodStartStr = periodStart.toISOString().split('T')[0];
      const periodEndStr = periodEnd.toISOString().split('T')[0];
      const todayStr = now.toISOString().split('T')[0];

      const isPastPeriod = periodEnd < now;

      // For past periods, return actuals
      if (isPastPeriod) {
        const periodTotals = await db.queryOneAsync<{
          income: number;
          expenses: number;
        }>(
          `SELECT 
            COALESCE(SUM(CASE WHEN t.amount > 0 AND t.type != 'transfer' THEN t.amount ELSE 0 END), 0) as income,
            COALESCE(SUM(CASE WHEN t.amount < 0 AND t.type != 'transfer' THEN ABS(t.amount) ELSE 0 END), 0) as expenses
          FROM transactions t
          JOIN accounts a ON t.account_id = a.id
          WHERE a.profile_id = ? AND t.is_deleted = 0 AND t.date >= ? AND t.date <= ?`,
          [pid, periodStartStr, periodEndStr]
        );

        return {
          currentMonthIncome: periodTotals?.income || 0,
          currentMonthExpenses: periodTotals?.expenses || 0,
          expectedIncome: periodTotals?.income || 0,
          expectedExpenses: periodTotals?.expenses || 0,
          expectedEndBalance:
            (periodTotals?.income || 0) - (periodTotals?.expenses || 0),
          confidence: 'high' as const,
          basedOnMonths: 0,
          isPastPeriod: true,
        };
      }

      // Calculate days in period
      const msPerDay = 1000 * 60 * 60 * 24;
      const totalDays =
        Math.floor((periodEnd.getTime() - periodStart.getTime()) / msPerDay) +
        1;
      const effectiveToday = now < periodStart ? periodStart : now;
      const daysPassed =
        now < periodStart
          ? 0
          : Math.floor(
              (effectiveToday.getTime() - periodStart.getTime()) / msPerDay
            ) + 1;
      const daysRemaining = Math.max(0, totalDays - daysPassed);

      const upToTodayStr =
        now < periodStart
          ? periodStartStr
          : now > periodEnd
            ? periodEndStr
            : todayStr;

      // Get current period totals
      const currentPeriodTotals = await db.queryOneAsync<{
        income: number;
        expenses: number;
      }>(
        `SELECT 
          COALESCE(SUM(CASE WHEN t.amount > 0 AND t.type != 'transfer' THEN t.amount ELSE 0 END), 0) as income,
          COALESCE(SUM(CASE WHEN t.amount < 0 AND t.type != 'transfer' THEN ABS(t.amount) ELSE 0 END), 0) as expenses
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE a.profile_id = ? AND t.is_deleted = 0 AND t.date >= ? AND t.date <= ?`,
        [pid, periodStartStr, upToTodayStr]
      );

      // Get last 6 months of data for patterns
      const sixMonthsAgo = new Date(
        periodStart.getFullYear(),
        periodStart.getMonth() - 6,
        1
      );
      const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];
      const lastMonthEnd = new Date(
        periodStart.getFullYear(),
        periodStart.getMonth(),
        0
      );
      const lastMonthEndStr = lastMonthEnd.toISOString().split('T')[0];

      const recentMonths = await db.queryAsync<{
        month: string;
        income: number;
        expenses: number;
      }>(
        `SELECT 
          strftime('%Y-%m', t.date) as month,
          COALESCE(SUM(CASE WHEN t.amount > 0 AND t.type != 'transfer' THEN t.amount ELSE 0 END), 0) as income,
          COALESCE(SUM(CASE WHEN t.amount < 0 AND t.type != 'transfer' THEN ABS(t.amount) ELSE 0 END), 0) as expenses
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE a.profile_id = ? AND t.is_deleted = 0 AND t.date >= ? AND t.date <= ?
        GROUP BY strftime('%Y-%m', t.date)
        ORDER BY month DESC`,
        [pid, sixMonthsAgoStr, lastMonthEndStr]
      );

      const totalMonths = recentMonths.length;
      if (totalMonths < 1) return null;

      // Calculate weighted average
      let weightedIncome = 0;
      let weightedExpenses = 0;
      let totalWeight = 0;

      recentMonths.forEach((month, index) => {
        const weight = Math.max(3 - index * 0.5, 0.5);
        weightedIncome += month.income * weight;
        weightedExpenses += month.expenses * weight;
        totalWeight += weight;
      });

      const avgMonthlyIncome =
        totalWeight > 0 ? weightedIncome / totalWeight : 0;
      const avgMonthlyExpenses =
        totalWeight > 0 ? weightedExpenses / totalWeight : 0;

      const proportionRemaining = totalDays > 0 ? daysRemaining / totalDays : 0;
      const expectedAdditionalIncome = avgMonthlyIncome * proportionRemaining;
      const expectedAdditionalExpenses =
        avgMonthlyExpenses * proportionRemaining;

      const expectedIncome =
        (currentPeriodTotals?.income || 0) + expectedAdditionalIncome;
      const expectedExpenses =
        (currentPeriodTotals?.expenses || 0) + expectedAdditionalExpenses;

      let confidence: 'low' | 'medium' | 'high' = 'low';
      if (totalMonths >= 6) confidence = 'high';
      else if (totalMonths >= 3) confidence = 'medium';

      return {
        currentMonthIncome: currentPeriodTotals?.income || 0,
        currentMonthExpenses: currentPeriodTotals?.expenses || 0,
        expectedIncome,
        expectedExpenses,
        expectedEndBalance: expectedIncome - expectedExpenses,
        confidence,
        basedOnMonths: totalMonths,
        isPastPeriod: false,
      };
    },

    // ============= Transaction Methods =============
    async applyCategoriesToUncategorized() {
      const pid = profileId();
      if (!pid) return { updated: 0, processed: 0 };

      const rules = await this.getCategoryRules();
      if (!rules || rules.length === 0) return { updated: 0, processed: 0 };

      // Sort rules by pattern length descending to ensure more specific patterns (like 'sparen')
      // match before shorter, less specific ones (like 'spar')
      const sortedRules = [...rules].sort(
        (a, b) => b.pattern.length - a.pattern.length
      );

      const uncategorized = await db.queryAsync<{
        id: string;
        merchant_name: string | null;
        description: string | null;
        opposing_account_name: string | null;
      }>(
        `SELECT t.id, t.merchant_name, t.description, t.opposing_account_name
         FROM transactions t
         JOIN accounts a ON t.account_id = a.id
         WHERE t.category_id IS NULL AND a.profile_id = ? AND t.is_deleted = 0`,
        [pid]
      );

      let updated = 0;
      const now = Date.now();

      for (const tx of uncategorized) {
        const textToMatch = `${tx.merchant_name || ''} ${tx.description || ''} ${tx.opposing_account_name || ''}`;

        for (const rule of sortedRules) {
          try {
            const pattern = new RegExp(rule.pattern, 'i');
            if (pattern.test(textToMatch)) {
              await db.runAsync(
                'UPDATE transactions SET category_id = ?, updated_at = ? WHERE id = ?',
                [rule.category_id, now, tx.id]
              );
              updated++;
              break;
            }
          } catch {
            continue;
          }
        }
      }

      return { updated, processed: uncategorized.length };
    },

    async bulkCategorizeByCounterparty(
      counterparty: string,
      categoryId: string
    ) {
      const pid = profileId();
      if (!pid) return { updated: 0, counterparty: null };

      const result = await db.runAsync(
        `UPDATE transactions SET category_id = ?, updated_at = ?
         WHERE (opposing_account_name LIKE ? OR merchant_name LIKE ?)
         AND account_id IN (SELECT id FROM accounts WHERE profile_id = ?)
         AND is_deleted = 0`,
        [categoryId, Date.now(), `%${counterparty}%`, `%${counterparty}%`, pid]
      );

      return { updated: result.changes, counterparty };
    },

    async bulkRenameByCounterparty(oldName: string, newName: string) {
      const pid = profileId();
      if (!pid) return { updated: 0 };

      const result = await db.runAsync(
        `UPDATE transactions SET merchant_name = ?, updated_at = ?
         WHERE (opposing_account_name LIKE ? OR merchant_name LIKE ?)
         AND account_id IN (SELECT id FROM accounts WHERE profile_id = ?)
         AND is_deleted = 0`,
        [newName, Date.now(), `%${oldName}%`, `%${oldName}%`, pid]
      );

      return { updated: result.changes };
    },

    async resetMerchantNames() {
      const pid = profileId();
      if (!pid) return { updated: 0 };

      const result = await db.runAsync(
        `UPDATE transactions SET merchant_name = opposing_account_name, updated_at = ?
         WHERE account_id IN (SELECT id FROM accounts WHERE profile_id = ?)
         AND is_deleted = 0`,
        [Date.now(), pid]
      );

      return { updated: result.changes };
    },

    async detectTransfers() {
      const pid = profileId();
      if (!pid) return { markedAsTransfer: 0 };

      // Get all account IBANs for this profile
      const accounts = await this.getAccounts();
      const accountIbans = accounts.map((a) => a.iban.toUpperCase());

      if (accountIbans.length === 0) return { markedAsTransfer: 0 };

      const placeholders = accountIbans.map(() => '?').join(',');
      const result = await db.runAsync(
        `UPDATE transactions SET type = 'transfer', updated_at = ?
         WHERE UPPER(opposing_account_iban) IN (${placeholders})
         AND account_id IN (SELECT id FROM accounts WHERE profile_id = ?)
         AND type != 'transfer'
         AND is_deleted = 0`,
        [Date.now(), ...accountIbans, pid]
      );

      return { markedAsTransfer: result.changes };
    },

    // ============= Category Methods =============
    async getSeedCategories(language: 'nl' | 'en' = 'nl') {
      // Return a basic set of seed categories for local use
      const categories = [
        {
          name: language === 'nl' ? 'Wonen & Huisvesting' : 'Housing & Living',
          icon: '🏠',
          color: '#1E40AF',
          description: language === 'nl' ? 'Woonlasten' : 'Housing costs',
          subcategories: [],
        },
        {
          name: language === 'nl' ? 'Boodschappen' : 'Groceries',
          icon: '🛒',
          color: '#34D399',
          description:
            language === 'nl'
              ? 'Supermarkt en dagelijkse boodschappen'
              : 'Supermarket and daily groceries',
          subcategories: [],
        },
        {
          name: language === 'nl' ? 'Vervoer' : 'Transport',
          icon: '🚗',
          color: '#93C5FD',
          description:
            language === 'nl'
              ? 'Auto, OV en reizen'
              : 'Car, public transport and travel',
          subcategories: [],
        },
        {
          name: language === 'nl' ? 'Uit eten' : 'Dining Out',
          icon: '🍽️',
          color: '#FCD34D',
          description:
            language === 'nl'
              ? 'Restaurants en eten bestellen'
              : 'Restaurants and food delivery',
          subcategories: [],
        },
        {
          name: language === 'nl' ? 'Entertainment' : 'Entertainment',
          icon: '🎬',
          color: '#F9A8D4',
          description:
            language === 'nl'
              ? 'Uitgaan en vrije tijd'
              : 'Going out and leisure',
          subcategories: [],
        },
        {
          name: language === 'nl' ? 'Gezondheid' : 'Health',
          icon: '💊',
          color: '#FCA5A5',
          description:
            language === 'nl' ? 'Medische kosten' : 'Medical expenses',
          subcategories: [],
        },
        {
          name: language === 'nl' ? 'Winkelen' : 'Shopping',
          icon: '🛍️',
          color: '#C4B5FD',
          description:
            language === 'nl'
              ? 'Kleding en overig winkelen'
              : 'Clothing and other shopping',
          subcategories: [],
        },
        {
          name: language === 'nl' ? 'Abonnementen' : 'Subscriptions',
          icon: '📱',
          color: '#DDD6FE',
          description:
            language === 'nl'
              ? 'Maandelijkse abonnementen'
              : 'Monthly subscriptions',
          subcategories: [],
        },
        {
          name: language === 'nl' ? 'Salaris' : 'Salary',
          icon: '💰',
          color: '#6EE7B7',
          description:
            language === 'nl' ? 'Inkomen uit werk' : 'Income from work',
          subcategories: [],
        },
        {
          name: language === 'nl' ? 'Overboekingen' : 'Transfers',
          icon: '↔️',
          color: '#A5B4FC',
          description:
            language === 'nl' ? 'Interne overboekingen' : 'Internal transfers',
          subcategories: [],
        },
        {
          name: language === 'nl' ? 'Overig' : 'Other',
          icon: '📦',
          color: '#E5E7EB',
          description:
            language === 'nl' ? 'Overige uitgaven' : 'Other expenses',
          subcategories: [],
        },
      ];
      return categories;
    },

    async applySeedCategories(
      seedCategories: Array<{ name: string; icon?: string; color?: string }>
    ) {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      const created: Array<number | string> = [];
      for (const seed of seedCategories) {
        const category = await this.createCategory({
          name: seed.name,
          icon: seed.icon,
          color: seed.color,
        });
        created.push(category.id);
      }

      return { created: created.length, ids: created };
    },

    async deleteAllCategories() {
      const pid = profileId();
      if (!pid) return { deleted: 0 };

      const result = await db.runAsync(
        'UPDATE categories SET is_deleted = 1, updated_at = ? WHERE profile_id = ? AND is_deleted = 0',
        [Date.now(), pid]
      );

      return { deleted: result.changes };
    },

    // ============= Account Methods =============
    async reorderAccounts(orderedIds: string[]) {
      const pid = profileId();
      if (!pid) return { updated: 0 };

      const now = Date.now();
      let updated = 0;

      // Use a transaction for batch updates to prevent OPFS sync overhead per row
      await db.transactionAsync(async () => {
        for (let i = 0; i < orderedIds.length; i++) {
          const result = await db.runAsync(
            'UPDATE accounts SET order_index = ?, updated_at = ? WHERE id = ? AND profile_id = ?',
            [i, now, orderedIds[i], pid]
          );
          updated += result.changes;
        }
      });

      return { updated };
    },

    async deleteAllAccounts() {
      const pid = profileId();
      if (!pid) return { deleted: 0 };

      const result = await db.runAsync(
        'UPDATE accounts SET is_deleted = 1, updated_at = ? WHERE profile_id = ? AND is_deleted = 0',
        [Date.now(), pid]
      );

      return { deleted: result.changes };
    },

    async deleteAllAddressBook() {
      const pid = profileId();
      if (!pid) return { deleted: 0 };

      const now = Date.now();

      // Delete contact_ibans for contacts in this profile
      await db.runAsync(
        `UPDATE contact_ibans SET is_deleted = 1, updated_at = ? 
         WHERE contact_id IN (SELECT id FROM address_book WHERE profile_id = ? AND is_deleted = 0)`,
        [now, pid]
      );

      // Delete address book entries
      const result = await db.runAsync(
        'UPDATE address_book SET is_deleted = 1, updated_at = ? WHERE profile_id = ? AND is_deleted = 0',
        [now, pid]
      );

      // Clear address_book_id from transactions so they show up in proposed addresses
      await db.runAsync(
        `UPDATE transactions SET address_book_id = NULL, updated_at = ? 
         WHERE profile_id = ? AND address_book_id IS NOT NULL`,
        [now, pid]
      );

      return { deleted: result.changes };
    },

    // ============= Budget Methods =============
    async getBudgetSuggestions() {
      const pid = profileId();
      if (!pid) return [];

      // Get average spending by category over last 3 months
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const startDate = threeMonthsAgo.toISOString().split('T')[0];

      const spending = await db.queryAsync<{
        category_id: string;
        category_name: string;
        avg_amount: number;
      }>(
        `SELECT 
          t.category_id, 
          c.name as category_name,
          AVG(ABS(t.amount)) as avg_amount
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        JOIN accounts a ON t.account_id = a.id
        WHERE a.profile_id = ? AND t.is_deleted = 0 AND t.type = 'expense' AND t.date >= ?
        GROUP BY t.category_id
        HAVING COUNT(*) >= 3
        ORDER BY avg_amount DESC`,
        [pid, startDate]
      );

      return spending.map((s) => ({
        categoryId: s.category_id,
        categoryName: s.category_name,
        suggestedAmount: Math.ceil(s.avg_amount / 10) * 10, // Round up to nearest 10
      }));
    },

    async deleteAllBudgets() {
      const pid = profileId();
      if (!pid) return { deleted: 0 };

      const result = await db.runAsync(
        'UPDATE budgets SET is_deleted = 1, updated_at = ? WHERE profile_id = ? AND is_deleted = 0',
        [Date.now(), pid]
      );

      return { deleted: result.changes };
    },

    // ============= Address Book Methods =============
    async getAddressBookContacts() {
      const pid = profileId();
      if (!pid) return [];

      // Get all address book entries with their IBANs from contact_ibans
      // Match transactions via:
      // 1. Direct address_book_id link (primary)
      // 2. IBAN match when no direct link exists
      // 3. Name match for shared IBANs when no direct link exists
      const contacts = await db.queryAsync<{
        id: string;
        iban: string;
        name: string;
        description: string | null;
        notes: string | null;
        created_at: number;
        original_name: string | null;
        transaction_count: number;
        total_income: number;
        total_expenses: number;
        last_transaction_date: string | null;
      }>(
        `SELECT 
          ab.id,
          ab.iban,
          ab.name,
          ab.description,
          ab.notes,
          ab.created_at,
          ab.original_name,
          COUNT(DISTINCT t.id) as transaction_count,
          COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) as total_income,
          COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0) as total_expenses,
          MAX(t.date) as last_transaction_date
        FROM address_book ab
        LEFT JOIN transactions t ON (
          t.is_deleted = 0 
          AND t.profile_id = ?
          AND (
            t.address_book_id = ab.id
            OR (
              t.address_book_id IS NULL 
              AND t.opposing_account_iban = ab.iban
              AND (
                ab.original_name IS NULL 
                OR (t.opposing_account_name = ab.original_name OR t.merchant_name = ab.original_name)
              )
            )
          )
        )
        WHERE ab.profile_id = ? AND ab.is_deleted = 0
        GROUP BY ab.id
        ORDER BY ab.name`,
        [pid, pid]
      );

      // Fetch all contact_ibans for the current profile's contacts
      const contactIds = contacts.map((c) => c.id);
      if (contactIds.length === 0) return [];

      const placeholders = contactIds.map(() => '?').join(',');
      const contactIbans = await db.queryAsync<{
        contact_id: string;
        iban: string;
      }>(
        `SELECT contact_id, iban FROM contact_ibans WHERE contact_id IN (${placeholders})`,
        contactIds
      );

      // Build a map of contact_id -> ibans[]
      const ibansByContact = new Map<string, string[]>();
      for (const ci of contactIbans) {
        const existing = ibansByContact.get(ci.contact_id);
        if (!existing) {
          ibansByContact.set(ci.contact_id, [ci.iban]);
        } else {
          existing.push(ci.iban);
        }
      }

      // Return contacts with ibans array and isMerged flag
      return contacts.map((c) => {
        const ibans = ibansByContact.get(c.id) || [];
        // Add primary IBAN if not already in the list
        if (c.iban && !ibans.includes(c.iban)) {
          ibans.unshift(c.iban);
        }
        // Filter out duplicates
        const uniqueIbans = [...new Set(ibans)];
        return {
          ...c,
          ibans: uniqueIbans,
          is_merged: uniqueIbans.length > 1 ? 1 : 0,
        };
      });
    },

    async getAddressBookContact(id: string) {
      const pid = profileId();
      if (!pid) return null;

      return await db.queryOneAsync(
        `SELECT * FROM address_book WHERE id = ? AND profile_id = ? AND is_deleted = 0`,
        [id, pid]
      );
    },

    async mergeContacts(contactIds: string[], targetName?: string) {
      const pid = profileId();
      if (!pid || contactIds.length < 2) return { merged: 0 };

      // Get the first contact as the target
      const targetId = contactIds[0];
      const target = await db.queryOneAsync<{
        id: string;
        name: string;
        iban: string;
      }>(
        'SELECT id, name, iban FROM address_book WHERE id = ? AND profile_id = ?',
        [targetId, pid]
      );

      if (!target) return { merged: 0 };

      const now = Date.now();
      const name = targetName || target.name;

      // Update target name if provided
      if (targetName) {
        await db.runAsync(
          'UPDATE address_book SET name = ?, updated_at = ? WHERE id = ?',
          [name, now, targetId]
        );
      }

      // Soft delete the other contacts and update their transactions
      const otherIds = contactIds.slice(1);
      for (const otherId of otherIds) {
        // Get the other contact's IBAN
        const other = await db.queryOneAsync<{ iban: string }>(
          'SELECT iban FROM address_book WHERE id = ? AND profile_id = ?',
          [otherId, pid]
        );

        if (other) {
          // Update transactions that reference this contact's IBAN
          await db.runAsync(
            `UPDATE transactions SET merchant_name = ?, updated_at = ?
             WHERE opposing_account_iban = ? 
             AND account_id IN (SELECT id FROM accounts WHERE profile_id = ?)`,
            [name, now, other.iban, pid]
          );
        }

        // Soft delete the contact
        await db.runAsync(
          'UPDATE address_book SET is_deleted = 1, updated_at = ? WHERE id = ?',
          [now, otherId]
        );
      }

      return { merged: otherIds.length };
    },

    // ============= Cleanup Rules Methods =============
    async getCleanupRules(): Promise<
      { id: string; pattern: string; is_active: number; created_at: number }[]
    > {
      const pid = profileId();
      if (!pid) return [];

      return (await db.queryAsync(
        'SELECT * FROM name_cleanup_rules WHERE profile_id = ? AND is_deleted = 0 ORDER BY created_at ASC',
        [pid]
      )) as {
        id: string;
        pattern: string;
        is_active: number;
        created_at: number;
      }[];
    },

    async createCleanupRule(pattern: string) {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      const id = crypto.randomUUID();
      const now = Date.now();

      await db.runAsync(
        'INSERT INTO name_cleanup_rules (id, pattern, profile_id, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)',
        [id, pattern, pid, now, now]
      );

      return { id, pattern, isActive: true };
    },

    async deleteCleanupRule(id: string) {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      await db.runAsync(
        'UPDATE name_cleanup_rules SET is_deleted = 1, updated_at = ? WHERE id = ? AND profile_id = ?',
        [Date.now(), id, pid]
      );
    },

    async applyCleanupRules() {
      const pid = profileId();
      if (!pid) return { updated: 0 };

      const rules = await this.getCleanupRules();
      if (!rules || rules.length === 0) return { updated: 0 };

      // Get all address book entries
      const entries = await db.queryAsync<{
        id: string;
        name: string;
        original_name: string | null;
      }>(
        `SELECT id, name, original_name FROM address_book 
         WHERE profile_id = ? AND is_deleted = 0`,
        [pid]
      );

      let updated = 0;
      const now = Date.now();

      await db.transactionAsync(async () => {
        for (const entry of entries) {
          const name = entry.name || '';
          let cleaned = name;

          for (const rule of rules) {
            if (
              rule.pattern.startsWith('/') &&
              rule.pattern.lastIndexOf('/') > 0
            ) {
              try {
                const lastSlash = rule.pattern.lastIndexOf('/');
                const pattern = rule.pattern.slice(1, lastSlash);
                const flags = rule.pattern.slice(lastSlash + 1) || 'gi';
                const regex = new RegExp(pattern, flags);
                cleaned = cleaned.replace(regex, '').trim();
              } catch {
                // Skip invalid regex
              }
            } else {
              const escapedPattern = rule.pattern.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&'
              );
              cleaned = cleaned
                .replace(new RegExp(escapedPattern, 'gi'), '')
                .trim();
            }
          }

          cleaned = cleaned.replace(/\s+/g, ' ').trim() || name;

          if (cleaned !== name) {
            // Store original name if not already set, then update name
            await db.runAsync(
              `UPDATE address_book SET name = ?, original_name = COALESCE(original_name, ?), updated_at = ? WHERE id = ?`,
              [cleaned, name, now, entry.id]
            );
            updated++;
          }
        }
      });

      return { updated };
    },

    async applyCleanupRulesToTransactions() {
      const pid = profileId();
      if (!pid) return { updated: 0 };

      const rules = await this.getCleanupRules();
      if (!rules || rules.length === 0) return { updated: 0 };

      // Get all transactions with merchant names
      const transactions = await db.queryAsync<{
        id: string;
        merchant_name: string;
        opposing_account_name: string;
      }>(
        `SELECT t.id, t.merchant_name, t.opposing_account_name
         FROM transactions t
         JOIN accounts a ON t.account_id = a.id
         WHERE a.profile_id = ? AND t.is_deleted = 0 AND (t.merchant_name IS NOT NULL OR t.opposing_account_name IS NOT NULL)`,
        [pid]
      );

      let updated = 0;
      const now = Date.now();

      await db.transactionAsync(async () => {
        for (const tx of transactions) {
          const name = tx.merchant_name || tx.opposing_account_name || '';
          let cleaned = name;

          for (const rule of rules) {
            if (
              rule.pattern.startsWith('/') &&
              rule.pattern.lastIndexOf('/') > 0
            ) {
              try {
                const lastSlash = rule.pattern.lastIndexOf('/');
                const pattern = rule.pattern.slice(1, lastSlash);
                const flags = rule.pattern.slice(lastSlash + 1) || 'gi';
                const regex = new RegExp(pattern, flags);
                cleaned = cleaned.replace(regex, '').trim();
              } catch {
                // Skip invalid regex
              }
            } else {
              const escapedPattern = rule.pattern.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&'
              );
              cleaned = cleaned
                .replace(new RegExp(escapedPattern, 'gi'), '')
                .trim();
            }
          }

          cleaned = cleaned.replace(/\s+/g, ' ').trim() || name;

          if (cleaned !== name) {
            await db.runAsync(
              'UPDATE transactions SET merchant_name = ?, updated_at = ? WHERE id = ?',
              [cleaned, now, tx.id]
            );
            updated++;
          }
        }
      });

      return { updated };
    },

    // ============= Top Accounts =============
    async getTopAccounts(
      limit: number = 10,
      type: 'expense' | 'income' | 'all' = 'expense',
      startDate?: string,
      endDate?: string
    ): Promise<{
      accounts: Array<{
        iban: string;
        name: string;
        description: string | null;
        isInAddressBook: boolean;
        addressBookId: string | null;
        transactionCount: number;
        totalAmount: number;
        netAmount: number;
      }>;
      totalCount: number;
      hasMore: boolean;
    }> {
      const pid = profileId();
      if (!pid) return { accounts: [], totalCount: 0, hasMore: false };

      let amountCondition = '';
      if (type === 'expense') {
        amountCondition = 'AND t.amount < 0';
      } else if (type === 'income') {
        amountCondition = 'AND t.amount > 0';
      }

      let dateCondition = '';
      const queryParams: (string | number)[] = [pid, pid, pid, pid];
      if (startDate && endDate) {
        dateCondition = 'AND t.date >= ? AND t.date <= ?';
        queryParams.push(startDate, endDate);
      }
      queryParams.push(limit);

      // Updated query to check both address_book.iban AND contact_ibans for merged contacts
      // This ensures IBANs that are part of multi-IBAN contacts are properly detected
      const rows = await db.queryAsync<{
        iban: string;
        name: string;
        description: string | null;
        is_in_addressbook: number;
        addressbook_id: string | null;
        transaction_count: number;
        total_amount: number;
        net_amount: number;
      }>(
        `
        SELECT 
          t.opposing_account_iban as iban,
          COALESCE(ab.name, ci_ab.name, t.opposing_account_name) as name,
          COALESCE(ab.description, ci_ab.description) as description,
          CASE WHEN ab.id IS NOT NULL OR ci_ab.id IS NOT NULL THEN 1 ELSE 0 END as is_in_addressbook,
          COALESCE(ab.id, ci_ab.id) as addressbook_id,
          COUNT(t.id) as transaction_count,
          SUM(ABS(t.amount)) as total_amount,
          SUM(t.amount) as net_amount
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        LEFT JOIN address_book ab ON ab.iban = t.opposing_account_iban AND ab.profile_id = ? AND ab.is_deleted = 0
        LEFT JOIN contact_ibans ci ON ci.iban = t.opposing_account_iban
        LEFT JOIN address_book ci_ab ON ci_ab.id = ci.contact_id AND ci_ab.profile_id = ? AND ci_ab.is_deleted = 0
        WHERE a.profile_id = ?
          AND t.type != 'transfer'
          AND t.opposing_account_iban IS NOT NULL
          AND t.opposing_account_iban != ''
          AND t.is_deleted = 0
          AND t.opposing_account_iban NOT IN (
            SELECT iban FROM accounts WHERE profile_id = ? AND is_deleted = 0
          )
          ${amountCondition}
          ${dateCondition}
        GROUP BY t.opposing_account_iban
        ORDER BY total_amount DESC
        LIMIT ?
      `,
        queryParams
      );

      // Get total count
      const countParams: (string | number)[] = [pid, pid];
      if (startDate && endDate) {
        countParams.push(startDate, endDate);
      }

      const countResult = await db.queryOneAsync<{ count: number }>(
        `
        SELECT COUNT(*) as count
        FROM (
          SELECT t.opposing_account_iban
          FROM transactions t
          JOIN accounts a ON t.account_id = a.id
          WHERE a.profile_id = ?
            AND t.type != 'transfer'
            AND t.opposing_account_iban IS NOT NULL
            AND t.opposing_account_iban != ''
            AND t.is_deleted = 0
            AND t.opposing_account_iban NOT IN (
              SELECT iban FROM accounts WHERE profile_id = ? AND is_deleted = 0
            )
            ${amountCondition}
            ${dateCondition}
          GROUP BY t.opposing_account_iban
        )
      `,
        countParams
      );

      const totalCount = countResult?.count || 0;

      return {
        accounts: rows.map((row) => ({
          iban: row.iban,
          name: row.name,
          description: row.description,
          isInAddressBook: row.is_in_addressbook === 1,
          addressBookId: row.addressbook_id,
          transactionCount: row.transaction_count,
          totalAmount: row.total_amount,
          netAmount: row.net_amount,
        })),
        totalCount,
        hasMore: totalCount > limit,
      };
    },

    // ============= Shared IBANs / Payment Provider Methods =============
    async getSharedIbans(): Promise<
      { id: string; iban: string; provider_name: string; created_at: number }[]
    > {
      return (await db.queryAsync(
        'SELECT * FROM shared_ibans WHERE is_deleted = 0 ORDER BY provider_name ASC'
      )) as {
        id: string;
        iban: string;
        provider_name: string;
        created_at: number;
      }[];
    },

    /**
     * Get shared IBANs with their merchants (payment processors that have multiple merchants)
     * This is the full data needed for the Shared IBANs card in the addressbook
     */
    async getSharedIbansWithMerchants(): Promise<
      Array<{
        iban: string;
        merchantCount: number;
        merchants: Array<{ name: string; transactionCount: number }>;
        inAddressBook: boolean;
        addressBookId: string | null;
        isMarkedShared: boolean;
        isPartiallyResolved: boolean;
        providerName: string | null;
        isKnownProvider: boolean;
        knownProviderName: string | null;
      }>
    > {
      const pid = profileId();
      if (!pid) return [];

      // Find IBANs that have multiple different merchant names in transactions
      // that are not yet resolved (address_book_id IS NULL)
      const sharedIbans = (await db.queryAsync(
        `SELECT 
          opposing_account_iban as iban,
          COUNT(DISTINCT opposing_account_name) as name_count
        FROM transactions 
        WHERE opposing_account_iban IS NOT NULL 
          AND opposing_account_iban != ''
          AND opposing_account_iban NOT IN (SELECT iban FROM accounts WHERE profile_id = ?)
          AND profile_id = ?
          AND address_book_id IS NULL
        GROUP BY opposing_account_iban
        HAVING name_count > 1 
          OR opposing_account_iban IN (SELECT iban FROM shared_ibans WHERE is_deleted = 0)
          OR opposing_account_iban IN (SELECT iban FROM address_book WHERE original_name IS NOT NULL AND profile_id = ? AND is_deleted = 0)`,
        [pid, pid, pid]
      )) as Array<{ iban: string; name_count: number }>;

      // Get payment provider rules for pattern-based detection
      const providerRules = (await db.queryAsync(
        'SELECT name, patterns FROM payment_provider_rules WHERE profile_id = ? AND is_deleted = 0',
        [pid]
      )) as Array<{ name: string; patterns: string }>;

      // Helper function to detect payment processor from transaction data
      const detectProvider = (
        iban: string,
        merchantNames: string[]
      ): string | null => {
        const searchText = [iban, ...merchantNames].join(' ').toUpperCase();

        const normalizePattern = (pattern: string) => {
          return pattern
            .replace(/\\\./g, '.')
            .replace(/\\\*\.\*/g, '*')
            .replace(/\\/g, '')
            .trim();
        };

        // Check rules
        for (const rule of providerRules) {
          const patterns = rule.patterns
            .split(/[|,]/)
            .map((p) => normalizePattern(p).toUpperCase())
            .filter(Boolean);
          for (const pattern of patterns) {
            if (pattern && searchText.includes(pattern)) {
              return rule.name;
            }
          }
        }

        return null;
      };

      // For each shared IBAN, get the different merchant names
      const result: Array<{
        iban: string;
        merchantCount: number;
        merchants: Array<{ name: string; transactionCount: number }>;
        inAddressBook: boolean;
        addressBookId: string | null;
        isMarkedShared: boolean;
        isPartiallyResolved: boolean;
        providerName: string | null;
        isKnownProvider: boolean;
        knownProviderName: string | null;
      }> = [];

      for (const si of sharedIbans) {
        // Get address book entries for this IBAN
        const resolvedEntries = (await db.queryAsync(
          `SELECT name, original_name FROM address_book 
           WHERE profile_id = ? AND iban = ? AND is_deleted = 0`,
          [pid, si.iban]
        )) as Array<{ name: string; original_name: string | null }>;

        // Check if it's marked as shared
        const markedShared = (await db.queryOneAsync(
          'SELECT id, provider_name FROM shared_ibans WHERE iban = ? AND is_deleted = 0',
          [si.iban]
        )) as { id: string; provider_name: string } | null;

        // Get all merchants for this IBAN that are not yet resolved
        const merchants = (await db.queryAsync(
          `SELECT 
            opposing_account_name as name,
            COUNT(*) as count
          FROM transactions
          WHERE opposing_account_iban = ?
            AND profile_id = ?
            AND address_book_id IS NULL
          GROUP BY opposing_account_name
          ORDER BY count DESC`,
          [si.iban, pid]
        )) as Array<{ name: string; count: number }>;

        // Detect payment processor
        const merchantNames = merchants.map((m) => m.name);
        const detectedProviderName = detectProvider(si.iban, merchantNames);

        // This IBAN is considered 'shared' if it has ANY existing resolutions + remaining merchants
        const isPartiallyResolved = resolvedEntries.length > 0;

        // Only include if there are multiple unresolved merchants
        if (merchants.length > 1) {
          result.push({
            iban: si.iban,
            merchantCount: merchants.length,
            merchants: merchants.map((m) => ({
              name: m.name,
              transactionCount: m.count,
            })),
            inAddressBook: false,
            addressBookId: null,
            isMarkedShared: !!markedShared,
            isPartiallyResolved,
            providerName: markedShared?.provider_name || null,
            isKnownProvider: !!detectedProviderName,
            knownProviderName: detectedProviderName,
          });
        }
      }

      return result;
    },

    async getPaymentProviderRules(): Promise<
      { id: string; name: string; patterns: string }[]
    > {
      const pid = profileId();
      if (!pid) return [];

      return (await db.queryAsync(
        'SELECT * FROM payment_provider_rules WHERE profile_id = ? AND is_deleted = 0 ORDER BY name ASC',
        [pid]
      )) as { id: string; name: string; patterns: string }[];
    },

    async createPaymentProviderRule(rule: { name: string; patterns: string }) {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      const id = crypto.randomUUID();
      const now = Date.now();

      await db.runAsync(
        'INSERT INTO payment_provider_rules (id, name, patterns, profile_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [id, rule.name, rule.patterns, pid, now, now]
      );

      return { id, name: rule.name, patterns: rule.patterns };
    },

    async deletePaymentProviderRule(id: string) {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      await db.runAsync(
        'UPDATE payment_provider_rules SET is_deleted = 1, updated_at = ? WHERE id = ? AND profile_id = ?',
        [Date.now(), id, pid]
      );
    },

    async updatePaymentProviderRule(
      id: string,
      updates: { name?: string; patterns?: string }
    ) {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      const fields: string[] = [];
      const params: any[] = [];

      if (typeof updates.name !== 'undefined') {
        fields.push('name = ?');
        params.push(updates.name);
      }
      if (typeof updates.patterns !== 'undefined') {
        fields.push('patterns = ?');
        params.push(updates.patterns);
      }

      if (fields.length === 0) {
        return { success: true };
      }

      params.push(Date.now(), id, pid);
      await db.runAsync(
        `UPDATE payment_provider_rules SET ${fields.join(', ')}, updated_at = ? WHERE id = ? AND profile_id = ?`,
        params
      );

      return { success: true };
    },

    async applyPaymentProviderRulesToTransactions(): Promise<{
      updated: number;
    }> {
      const pid = profileId();
      if (!pid) return { updated: 0 };

      // Get all payment provider rules for this profile
      const providerRules = await this.getPaymentProviderRules();
      if (!providerRules || providerRules.length === 0) return { updated: 0 };

      // Get all transactions with relevant fields
      const transactions = await db.queryAsync<{
        id: string;
        opposing_account_iban: string | null;
        opposing_account_name: string | null;
        merchant_name: string | null;
        description: string | null;
        payment_provider: string | null;
      }>(
        `SELECT t.id, t.opposing_account_iban, t.opposing_account_name, t.merchant_name, t.description, t.payment_provider
         FROM transactions t
         JOIN accounts a ON t.account_id = a.id
         WHERE a.profile_id = ? AND t.is_deleted = 0`,
        [pid]
      );

      // Helper function to detect payment provider
      const detectProvider = (
        iban: string | null,
        merchantName: string | null,
        opposingName: string | null,
        description: string | null
      ): string | null => {
        const searchText = [
          iban || '',
          merchantName || '',
          opposingName || '',
          description || '',
        ]
          .join(' ')
          .toUpperCase();

        for (const rule of providerRules) {
          const patterns = rule.patterns.split(/[|,]/).map((p) => p.trim());
          for (const pattern of patterns) {
            if (pattern && searchText.includes(pattern.toUpperCase())) {
              return rule.name;
            }
          }
        }
        return null;
      };

      let updated = 0;
      const now = Date.now();

      // Use transaction for bulk update
      await db.transactionAsync(async () => {
        for (const tx of transactions) {
          const detected = detectProvider(
            tx.opposing_account_iban,
            tx.merchant_name,
            tx.opposing_account_name,
            tx.description
          );

          // Only update if we detected a provider and it's different from current
          if (detected && detected !== tx.payment_provider) {
            await db.runAsync(
              'UPDATE transactions SET payment_provider = ?, updated_at = ? WHERE id = ?',
              [detected, now, tx.id]
            );
            updated++;
          }
        }
      });

      return { updated };
    },

    // ============= Import Methods =============
    async getImportHistory(): Promise<
      Array<{
        id: string;
        filename: string;
        bank: string;
        importedAt: string;
        transactionCount: number;
        status: string;
        skippedRows: Array<{ row: number; reason: string; data?: string }>;
        duplicatesSkipped: number;
        parseErrors: number;
      }>
    > {
      const pid = profileId();
      if (!pid) return [];

      const rows = await db.queryAsync<{
        id: string;
        filename: string;
        bank: string;
        transaction_count: number;
        status: string;
        skipped_rows: string | null;
        duplicates_skipped: number | null;
        parse_errors: number | null;
        created_at: number;
      }>(
        `SELECT id, filename, bank, transaction_count, status, skipped_rows, duplicates_skipped, parse_errors, created_at
         FROM imports
         WHERE profile_id = ? AND is_deleted = 0
         ORDER BY created_at DESC
         LIMIT 10`,
        [pid]
      );

      return rows.map((row) => ({
        id: row.id,
        filename: row.filename,
        bank: row.bank,
        importedAt: new Date(row.created_at).toISOString(),
        transactionCount: row.transaction_count,
        status: row.status,
        skippedRows: row.skipped_rows ? JSON.parse(row.skipped_rows) : [],
        duplicatesSkipped: row.duplicates_skipped || 0,
        parseErrors: row.parse_errors || 0,
      }));
    },

    async deleteImportHistory() {
      const pid = profileId();
      if (!pid) return { deleted: 0 };

      const result = await db.runAsync(
        'UPDATE imports SET is_deleted = 1, updated_at = ? WHERE profile_id = ? AND is_deleted = 0',
        [Date.now(), pid]
      );

      return { deleted: result.changes };
    },

    async previewCsvImport(csvContent: string) {
      // Basic CSV parsing for preview
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2)
        return { headers: [], rows: [], sampleRows: [], totalRows: 0 };

      const firstLine = lines[0];
      const semicolonCount = (firstLine.match(/;/g) || []).length;
      const commaCount = (firstLine.match(/,/g) || []).length;
      const delimiter = semicolonCount > commaCount ? ';' : ',';

      const headers = firstLine
        .split(delimiter)
        .map((h) => h.trim().replace(/^"|"$/g, ''));

      const rows: Record<string, string>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i]
          .split(delimiter)
          .map((v) => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });
        rows.push(row);
      }

      return {
        headers,
        rows,
        sampleRows: rows.slice(0, 10),
        totalRows: rows.length,
      };
    },

    async importCsv(
      csvContent: string,
      options: {
        accountId: string;
        mapping?: {
          date: string;
          amount: string;
          description: string;
          iban?: string;
          counterparty?: string;
          balance?: string;
          notes?: string;
          paymentMethod?: string;
        };
        direction?: string;
        filename?: string;
        bank?: string;
      }
    ) {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      const preview = await this.previewCsvImport(csvContent);
      if (preview.rows.length === 0)
        return { imported: 0, skipped: 0, errors: [], skippedRows: [] };

      // Get or create default mapping
      const mapping = options.mapping || {
        date:
          preview.headers.find((h) => /date|datum/i.test(h)) ||
          preview.headers[0],
        amount:
          preview.headers.find((h) => /amount|bedrag/i.test(h)) ||
          preview.headers[1],
        description:
          preview.headers.find((h) => /desc|omschrijving|name/i.test(h)) ||
          preview.headers[2],
        iban: preview.headers.find((h) => /iban|tegenrekening/i.test(h)),
        counterparty: preview.headers.find((h) => /counterparty|naam/i.test(h)),
      };

      // Direction column for Af/Bij style CSVs
      const directionColumn = options.direction;

      const account = await db.queryOneAsync<{ iban: string }>(
        'SELECT iban FROM accounts WHERE id = ? AND profile_id = ?',
        [options.accountId, pid]
      );

      // Load cleanup rules for name processing
      const cleanupRules = await this.getCleanupRules();

      // Load category rules for auto-categorization
      const categoryRules = await this.getCategoryRules();

      // Load payment provider rules for detection during import
      const providerRules = await this.getPaymentProviderRules();

      // Helper function to detect payment provider
      const detectPaymentProvider = (
        iban: string | null,
        merchantName: string | null,
        description: string | null
      ): string | null => {
        if (providerRules.length === 0) return null;
        const searchText = [iban || '', merchantName || '', description || '']
          .join(' ')
          .toUpperCase();
        for (const rule of providerRules) {
          const patterns = rule.patterns.split(/[|,]/).map((p) => p.trim());
          for (const pattern of patterns) {
            if (pattern && searchText.includes(pattern.toUpperCase())) {
              return rule.name;
            }
          }
        }
        return null;
      };

      // Get the "Overboekingen" / "Internal transfers" category ID for auto-assignment
      const transfersCategory = await db.queryOneAsync<{ id: string }>(
        `SELECT id FROM categories WHERE profile_id = ? AND is_deleted = 0 
         AND (LOWER(name) = 'overboekingen' OR LOWER(name) = 'internal transfers')`,
        [pid]
      );
      const transfersCategoryId = transfersCategory?.id || null;

      // Get user's own account IBANs (to exclude from address book)
      const ownAccountsResult = await db.queryAsync<{ iban: string }>(
        'SELECT iban FROM accounts WHERE profile_id = ? AND is_deleted = 0',
        [pid]
      );
      const ownAccountIbans = new Set(
        ownAccountsResult.map((a) => a.iban?.replace(/\s/g, '').toUpperCase())
      );

      let imported = 0;
      const errors: string[] = [];
      const now = Date.now();

      // Track imported transaction IDs and unique IBANs for post-processing
      const importedTxIds: string[] = [];
      const uniqueIbanMap = new Map<string, string>(); // iban -> name

      // Track skipped rows with detailed reasons for transparency
      interface SkippedRow {
        rowIndex: number;
        date: string | null;
        amount: number | null;
        description: string;
        reason: 'duplicate' | 'invalidDate' | 'invalidAmount' | 'parseError';
      }
      const skippedRows: SkippedRow[] = [];

      // Collect all transactions to insert for batching
      const transactionsToInsert: Array<{
        id: string;
        transactionData: TransactionCreate;
        hash: string;
        categoryId: string | null;
        opposingIban: string | null;
        merchantName: string;
        paymentProvider: string | null;
      }> = [];

      // First pass: validate and prepare all transactions
      for (let i = 0; i < preview.rows.length; i++) {
        const row = preview.rows[i];
        try {
          let transactionData: TransactionCreate;
          let hash: string;
          let opposingIban: string | null;
          let merchantName: string;

          if (options.bank?.toLowerCase() === 'ing') {
            const result = await processINGRow(
              db,
              row,
              {
                accountId: options.accountId,
                profileId: pid,
                mapping: {
                  date: mapping.date,
                  amount: mapping.amount,
                  description: mapping.description,
                  iban: mapping.iban,
                  counterparty: mapping.counterparty,
                  balance: mapping.balance,
                  direction: directionColumn,
                  notes: mapping.notes,
                  paymentMethod: mapping.paymentMethod,
                },
                ownAccountIbans,
              },
              {
                parseDate: (val) => this._parseFlexibleDate(val),
                parseAmount: (val) => this._parseFlexibleAmount(val),
                applyCleanupRules: (name) =>
                  this._applyCleanupRulesToName(name, cleanupRules),
                generateHash: (date, amount, desc, iban) =>
                  this._generateHash(date, amount, desc, iban),
              }
            );

            if ('error' in result && result.error) {
              const errorMsg = result.error;
              skippedRows.push({
                rowIndex: i + 1,
                date: row[mapping.date] || null,
                amount: this._parseFlexibleAmount(row[mapping.amount]),
                description: row[mapping.description] || '',
                reason: errorMsg.includes('date')
                  ? 'invalidDate'
                  : errorMsg.includes('amount')
                    ? 'invalidAmount'
                    : 'parseError',
              });
              errors.push(`Row ${i + 1}: ${errorMsg}`);
              continue;
            }

            // Type guard: if there's no error, we have success result
            if (
              !('transaction' in result) ||
              !result.transaction ||
              !result.hash
            ) {
              skippedRows.push({
                rowIndex: i + 1,
                date: row[mapping.date] || null,
                amount: this._parseFlexibleAmount(row[mapping.amount]),
                description: row[mapping.description] || '',
                reason: 'parseError',
              });
              errors.push(`Row ${i + 1}: Failed to process row`);
              continue;
            }

            transactionData = result.transaction;
            hash = result.hash;
            opposingIban = result.opposingIban ?? null;
            merchantName = result.merchantName ?? '';
          } else if (options.bank?.toLowerCase() === 'asn') {
            const result = await processASNRow(
              db,
              row,
              {
                accountId: options.accountId,
                profileId: pid,
                mapping: {
                  date: mapping.date,
                  amount: mapping.amount,
                  description: mapping.description,
                  iban: mapping.iban,
                  counterparty: mapping.counterparty,
                  balance: mapping.balance,
                  notes: mapping.notes,
                  type: mapping.paymentMethod, // ASN uses "Type" for payment method
                },
                ownAccountIbans,
              },
              {
                parseDate: (val) => this._parseFlexibleDate(val),
                parseAmount: (val) => this._parseFlexibleAmount(val),
                applyCleanupRules: (name) =>
                  this._applyCleanupRulesToName(name, cleanupRules),
                generateHash: (date, amount, desc, iban) =>
                  this._generateHash(date, amount, desc, iban),
              }
            );

            if ('error' in result && result.error) {
              const errorMsg = result.error;
              skippedRows.push({
                rowIndex: i + 1,
                date: row[mapping.date] || null,
                amount: this._parseFlexibleAmount(row[mapping.amount]),
                description: row[mapping.description] || '',
                reason: errorMsg.includes('date')
                  ? 'invalidDate'
                  : errorMsg.includes('amount')
                    ? 'invalidAmount'
                    : 'parseError',
              });
              errors.push(`Row ${i + 1}: ${errorMsg}`);
              continue;
            }

            // Type guard: if there's no error, we have success result
            if (
              !('transaction' in result) ||
              !result.transaction ||
              !result.hash
            ) {
              skippedRows.push({
                rowIndex: i + 1,
                date: row[mapping.date] || null,
                amount: this._parseFlexibleAmount(row[mapping.amount]),
                description: row[mapping.description] || '',
                reason: 'parseError',
              });
              errors.push(`Row ${i + 1}: Failed to process row`);
              continue;
            }

            transactionData = result.transaction;
            hash = result.hash;
            opposingIban = result.opposingIban ?? null;
            merchantName = result.merchantName ?? '';
          } else {
            // Generic processing
            const dateStr = row[mapping.date];
            const date = this._parseFlexibleDate(dateStr);
            if (!date) {
              skippedRows.push({
                rowIndex: i + 1,
                date: dateStr || null,
                amount: this._parseFlexibleAmount(row[mapping.amount]),
                description: row[mapping.description] || '',
                reason: 'invalidDate',
              });
              errors.push(`Row ${i + 1}: Invalid date "${dateStr}"`);
              continue;
            }

            let amount = this._parseFlexibleAmount(row[mapping.amount]);
            if (amount === null) {
              skippedRows.push({
                rowIndex: i + 1,
                date: date,
                amount: null,
                description: row[mapping.description] || '',
                reason: 'invalidAmount',
              });
              errors.push(
                `Row ${i + 1}: Invalid amount "${row[mapping.amount]}"`
              );
              continue;
            }

            // Handle direction column (Af/Bij, Debit/Credit)
            if (directionColumn && row[directionColumn]) {
              const direction = row[directionColumn].toLowerCase().trim();
              if (
                direction === 'af' ||
                direction === 'debit' ||
                direction === 'd'
              ) {
                amount = -Math.abs(amount);
              } else if (
                direction === 'bij' ||
                direction === 'credit' ||
                direction === 'c'
              ) {
                amount = Math.abs(amount);
              }
            }

            const rawDescription = row[mapping.description] || '';
            const mededelingen = mapping.notes ? row[mapping.notes] : null;
            const paymentMethod = mapping.paymentMethod
              ? row[mapping.paymentMethod]
              : null;

            // Use counterparty field for opposing IBAN
            opposingIban = mapping.counterparty
              ? row[mapping.counterparty]?.replace(/\s/g, '').toUpperCase()
              : null;

            merchantName = rawDescription;

            // Apply cleanup rules to merchant name
            if (merchantName && cleanupRules.length > 0) {
              merchantName = this._applyCleanupRulesToName(
                merchantName,
                cleanupRules
              );
            }

            // Generate hash to detect duplicates
            hash = this._generateHash(
              date,
              amount,
              rawDescription,
              account?.iban || ''
            );

            let type: 'income' | 'expense' | 'transfer' =
              amount > 0 ? 'income' : 'expense';

            // Check if opposing IBAN is one of our own accounts (internal transfer)
            if (opposingIban && ownAccountIbans.has(opposingIban)) {
              type = 'transfer';
            }

            transactionData = {
              date,
              amount,
              type,
              description: rawDescription,
              merchantName,
              accountId: options.accountId,
              opposingAccountIban: opposingIban,
              opposingAccountName: rawDescription,
              notes: mededelingen,
              paymentMethod,
              importHash: hash,
            };
          }

          // Check for duplicate - only within the current profile and non-deleted transactions
          const existing = await db.queryOneAsync(
            'SELECT id FROM transactions WHERE import_hash = ? AND profile_id = ? AND is_deleted = 0',
            [hash, pid]
          );

          if (existing) {
            // Track as duplicate skip
            skippedRows.push({
              rowIndex: i + 1,
              date: transactionData.date,
              amount: transactionData.amount,
              description: transactionData.description || '',
              reason: 'duplicate',
            });
            continue;
          }

          const id = crypto.randomUUID();
          let categoryId: string | null = null;

          // Auto-assign "Overboekingen" category for internal transfers
          if (transactionData.type === 'transfer' && transfersCategoryId) {
            categoryId = transfersCategoryId;
          }

          // Apply category rules for auto-categorization (only if no category assigned yet)
          if (!categoryId && categoryRules.length > 0) {
            const matchedRule = this._findMatchingCategoryRule(
              transactionData.description || '',
              merchantName,
              categoryRules
            );
            if (matchedRule) {
              categoryId = matchedRule.category_id;
            }
          }

          // Detect payment provider
          const paymentProvider = detectPaymentProvider(
            opposingIban,
            merchantName,
            transactionData.description || null
          );

          // Queue for batch insert instead of inserting immediately
          transactionsToInsert.push({
            id,
            transactionData,
            hash,
            categoryId,
            opposingIban,
            merchantName,
            paymentProvider,
          });

          // Track unique IBANs for address book (exclude own accounts and empty IBANs)
          if (
            opposingIban &&
            merchantName &&
            !ownAccountIbans.has(opposingIban)
          ) {
            if (!uniqueIbanMap.has(opposingIban)) {
              uniqueIbanMap.set(opposingIban, merchantName);
            }
          }
        } catch (err) {
          skippedRows.push({
            rowIndex: i + 1,
            date: row[mapping.date] || null,
            amount: this._parseFlexibleAmount(row[mapping.amount]),
            description: row[mapping.description] || '',
            reason: 'parseError',
          });
          errors.push(
            `Row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
      }

      // Batch insert all transactions using bulk INSERT for OPFS performance
      // This minimizes OPFS syncs - critical for large imports
      if (transactionsToInsert.length > 0) {
        const CHUNK_SIZE = 500; // SQLite has a limit on query parameters, chunk large imports
        const chunks: (typeof transactionsToInsert)[] = [];

        for (let i = 0; i < transactionsToInsert.length; i += CHUNK_SIZE) {
          chunks.push(transactionsToInsert.slice(i, i + CHUNK_SIZE));
        }

        await db.transactionAsync(async () => {
          for (const chunk of chunks) {
            // Build bulk INSERT with multiple value sets
            const placeholders = chunk
              .map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
              .join(', ');
            const values = chunk.flatMap((item) => [
              item.id,
              item.transactionData.date,
              item.transactionData.amount,
              item.transactionData.type,
              item.transactionData.description,
              item.transactionData.merchantName,
              item.transactionData.accountId,
              item.transactionData.opposingAccountIban,
              item.transactionData.opposingAccountName,
              item.categoryId,
              item.transactionData.notes,
              item.transactionData.paymentMethod,
              item.paymentProvider,
              item.hash,
              pid,
              now,
              now,
            ]);

            await db.runAsync(
              `INSERT INTO transactions (id, date, amount, type, description, merchant_name, account_id, 
               opposing_account_iban, opposing_account_name, category_id, notes, payment_method, payment_provider, import_hash, profile_id, created_at, updated_at)
               VALUES ${placeholders}`,
              values
            );

            // Track imported IDs
            for (const item of chunk) {
              importedTxIds.push(item.id);
              imported++;
            }
          }
        });
      }

      // Post-import: Add unique IBANs to address book and link transactions
      for (const [iban, name] of uniqueIbanMap) {
        try {
          await this._addToAddressBookIfNew(iban, name, pid, now);
        } catch {
          // Ignore errors - contact may already exist
        }
      }

      // Link imported transactions to address book entries
      if (importedTxIds.length > 0) {
        await this._linkTransactionsToAddressBook(importedTxIds, pid, now);
      }

      // Create import history record with detailed skipped row information
      const importId = crypto.randomUUID();
      const duplicatesSkipped = skippedRows.filter(
        (r) => r.reason === 'duplicate'
      ).length;
      const parseErrorsCount = skippedRows.filter(
        (r) => r.reason !== 'duplicate'
      ).length;

      // Store skipped rows with proper structure for UI display
      const skippedRowsJson =
        skippedRows.length > 0
          ? JSON.stringify(
              skippedRows.map((row) => ({
                rowIndex: row.rowIndex,
                date: row.date,
                amount: row.amount,
                description: row.description,
                reason: row.reason,
              }))
            )
          : null;

      await db.runAsync(
        `INSERT INTO imports (id, filename, bank, transaction_count, status, skipped_rows, duplicates_skipped, parse_errors, profile_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          importId,
          options.filename || 'CSV Import',
          options.bank || 'generic',
          imported,
          'completed',
          skippedRowsJson,
          duplicatesSkipped,
          parseErrorsCount,
          pid,
          now,
          now,
        ]
      );

      return {
        imported,
        skipped: skippedRows.length,
        errors,
        skippedRows,
      };
    },

    // Helper methods for CSV import
    _parseFlexibleDate(value: string): string | null {
      if (!value) return null;
      const cleaned = value.trim();

      // YYYYMMDD
      if (/^\d{8}$/.test(cleaned)) {
        const year = cleaned.slice(0, 4);
        const month = cleaned.slice(4, 6);
        const day = cleaned.slice(6, 8);
        return `${year}-${month}-${day}`;
      }

      // DD-MM-YYYY or DD/MM/YYYY
      const euMatch = cleaned.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
      if (euMatch) {
        const [, day, month, year] = euMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      // YYYY-MM-DD
      const isoMatch = cleaned.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
      if (isoMatch) {
        const [, year, month, day] = isoMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      return null;
    },

    _parseFlexibleAmount(value: string): number | null {
      if (!value) return null;
      let cleaned = value.trim();

      const isNegative = cleaned.startsWith('-') || /af|debit/i.test(cleaned);
      cleaned = cleaned
        .replace(/[€$£¥-]/g, '')
        .replace(/(af|bij|debit|credit)/gi, '')
        .trim();

      if (cleaned.includes(',') && cleaned.includes('.')) {
        const lastComma = cleaned.lastIndexOf(',');
        const lastDot = cleaned.lastIndexOf('.');
        if (lastComma > lastDot) {
          cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
          cleaned = cleaned.replace(/,/g, '');
        }
      } else if (cleaned.includes(',')) {
        if (/,\d{2}$/.test(cleaned)) {
          cleaned = cleaned.replace(',', '.');
        } else {
          cleaned = cleaned.replace(/,/g, '');
        }
      }

      const amount = parseFloat(cleaned);
      if (isNaN(amount)) return null;
      return isNegative ? -Math.abs(amount) : amount;
    },

    _generateHash(
      date: string,
      amount: number,
      description: string,
      accountIban: string
    ): string {
      const str = `${date}|${amount}|${description}|${accountIban}`;
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16);
    },

    // Helper to apply cleanup rules to a name
    _applyCleanupRulesToName(
      name: string,
      rules: { pattern: string; is_active: number }[]
    ): string {
      let cleaned = name;
      for (const rule of rules) {
        if (!rule.is_active) continue;

        if (rule.pattern.startsWith('/') && rule.pattern.lastIndexOf('/') > 0) {
          try {
            const lastSlash = rule.pattern.lastIndexOf('/');
            const pattern = rule.pattern.slice(1, lastSlash);
            const flags = rule.pattern.slice(lastSlash + 1) || 'gi';
            const regex = new RegExp(pattern, flags);
            cleaned = cleaned.replace(regex, '').trim();
          } catch {
            // Skip invalid regex
          }
        } else {
          const escapedPattern = rule.pattern.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
          );
          cleaned = cleaned
            .replace(new RegExp(escapedPattern, 'gi'), '')
            .trim();
        }
      }
      return cleaned.replace(/\s+/g, ' ').trim() || name;
    },

    // Helper to find matching category rule
    _findMatchingCategoryRule(
      description: string,
      counterparty: string | null,
      rules: { pattern: string; category_id: string; priority: number }[]
    ): { category_id: string } | null {
      const textToMatch = `${description} ${counterparty || ''}`.toLowerCase();

      // Sort rules by priority (highest first)
      const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

      for (const rule of sortedRules) {
        const pattern = rule.pattern.toLowerCase();
        if (textToMatch.includes(pattern)) {
          return { category_id: rule.category_id };
        }
        // Also try regex matching
        try {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(textToMatch)) {
            return { category_id: rule.category_id };
          }
        } catch {
          // Skip invalid regex patterns
        }
      }
      return null;
    },

    // Helper to add IBAN to address book if not already present
    // Detects shared IBANs (same IBAN with multiple different names) and moves them to shared_ibans
    async _addToAddressBookIfNew(
      iban: string,
      name: string,
      pid: string,
      now: number
    ): Promise<boolean> {
      const normalizedIban = iban.toUpperCase().trim();
      if (!normalizedIban) return false;

      // Check if IBAN is already marked as a shared IBAN
      const isShared = await db.queryOneAsync<{ id: string }>(
        'SELECT id FROM shared_ibans WHERE iban = ?',
        [normalizedIban]
      );
      if (isShared) return false;

      // Check if IBAN already exists in address_book
      const existing = await db.queryOneAsync<{ id: string; name: string }>(
        'SELECT id, name FROM address_book WHERE iban = ? AND profile_id = ? AND is_deleted = 0',
        [normalizedIban, pid]
      );

      if (existing) {
        // Check if the name is different - this indicates a shared IBAN
        if (existing.name.toLowerCase().trim() !== name.toLowerCase().trim()) {
          // This IBAN has multiple different names - it's a shared IBAN
          // Move it to shared_ibans table and remove from address_book
          await db.runAsync(
            'INSERT OR IGNORE INTO shared_ibans (id, iban, created_at, updated_at) VALUES (?, ?, ?, ?)',
            [crypto.randomUUID(), normalizedIban, now, now]
          );
          // Delete from address_book so user can resolve via shared IBANs UI
          await db.runAsync(
            'UPDATE address_book SET is_deleted = 1, updated_at = ? WHERE iban = ? AND profile_id = ?',
            [now, normalizedIban, pid]
          );
        }
        return false;
      }

      // Check if IBAN already exists in contact_ibans
      const existingLink = await db.queryOneAsync<{ contact_id: string }>(
        `SELECT ci.contact_id FROM contact_ibans ci
         JOIN address_book ab ON ab.id = ci.contact_id
         WHERE ci.iban = ? AND ab.profile_id = ? AND ab.is_deleted = 0`,
        [normalizedIban, pid]
      );
      if (existingLink) return false;

      // Check if this IBAN already has multiple names in transactions for this profile
      const nameCount = await db.queryOneAsync<{ name_count: number }>(
        `SELECT COUNT(DISTINCT opposing_account_name) as name_count 
         FROM transactions 
         WHERE opposing_account_iban = ? AND profile_id = ? AND is_deleted = 0`,
        [normalizedIban, pid]
      );

      if (nameCount && nameCount.name_count > 1) {
        // This IBAN has multiple merchants - add to shared_ibans instead
        await db.runAsync(
          'INSERT OR IGNORE INTO shared_ibans (id, iban, created_at, updated_at) VALUES (?, ?, ?, ?)',
          [crypto.randomUUID(), normalizedIban, now, now]
        );
        return false;
      }

      // Check if a contact with this name already exists
      const existingByName = await db.queryOneAsync<{
        id: string;
        iban: string;
      }>(
        `SELECT id, iban FROM address_book 
         WHERE profile_id = ? AND is_deleted = 0 AND LOWER(TRIM(name)) = LOWER(TRIM(?))`,
        [pid, name]
      );

      if (existingByName) {
        // Merge IBAN into existing contact
        await db.runAsync(
          'INSERT OR IGNORE INTO contact_ibans (id, contact_id, iban, is_primary, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)',
          [crypto.randomUUID(), existingByName.id, normalizedIban, now, now]
        );
        return true;
      }

      // Create new address book entry
      const id = crypto.randomUUID();
      await db.runAsync(
        `INSERT INTO address_book (id, iban, name, profile_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, normalizedIban, name, pid, now, now]
      );

      // Add to contact_ibans junction table
      await db.runAsync(
        'INSERT OR IGNORE INTO contact_ibans (id, contact_id, iban, is_primary, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)',
        [crypto.randomUUID(), id, normalizedIban, now, now]
      );

      return true;
    },

    // ============= Recurring Patterns (Subscriptions) =============

    /**
     * Detect recurring patterns from transactions
     * Groups transactions by opposing IBAN + normalized merchant name,
     * then analyzes intervals to classify patterns.
     *
     * Requirements for a valid subscription:
     * - At least MIN_TRANSACTIONS_FOR_PATTERN transactions (3)
     * - Spans at least MIN_MONTHS_FOR_SUBSCRIPTION months (3)
     * - Consistent interval between transactions (±3 days tolerance)
     */
    async detectRecurringPatterns(): Promise<{
      detected: number;
      updated: number;
    }> {
      const pid = profileId();
      if (!pid) return { detected: 0, updated: 0 };

      const now = Date.now();
      const MIN_MONTHS_SPAN_DAYS = 60; // ~2 months minimum span to ensure 3+ months of history

      // Get all transactions grouped by opposing_account_iban + merchant_name
      const groups = await db.queryAsync<{
        opposing_iban: string | null;
        merchant_name: string | null;
        dates: string;
        amounts: string;
        tx_count: number;
      }>(
        `SELECT 
          opposing_account_iban as opposing_iban,
          COALESCE(merchant_name, opposing_account_name) as merchant_name,
          GROUP_CONCAT(date, ',') as dates,
          GROUP_CONCAT(amount, ',') as amounts,
          COUNT(*) as tx_count
         FROM transactions t
         JOIN accounts a ON t.account_id = a.id
         WHERE a.profile_id = ? 
           AND t.is_deleted = 0
           AND t.type = 'expense'
         GROUP BY opposing_account_iban, COALESCE(merchant_name, opposing_account_name)
         HAVING tx_count >= ?
         ORDER BY tx_count DESC`,
        [pid, MIN_TRANSACTIONS_FOR_PATTERN]
      );

      let detected = 0;
      let updated = 0;

      await db.transactionAsync(async () => {
        for (const group of groups) {
          if (!group.dates || !group.amounts) continue;

          // Parse dates and amounts
          const dates = group.dates
            .split(',')
            .map((d) => new Date(d))
            .sort((a, b) => a.getTime() - b.getTime());

          const amounts = group.amounts
            .split(',')
            .map((a) => Math.abs(parseFloat(a)));

          if (dates.length < MIN_TRANSACTIONS_FOR_PATTERN) continue;

          // Check if transactions span at least 3 months
          const firstDate = dates[0];
          const lastDateObj = dates[dates.length - 1];
          const daySpan = Math.round(
            (lastDateObj.getTime() - firstDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          // For monthly patterns, require ~2+ months span (60+ days)
          // This ensures we have at least 3 payments over 3 months
          if (daySpan < MIN_MONTHS_SPAN_DAYS) continue;

          // Calculate intervals between consecutive transactions
          const intervals: number[] = [];
          for (let i = 1; i < dates.length; i++) {
            const daysDiff = Math.round(
              (dates[i].getTime() - dates[i - 1].getTime()) /
                (1000 * 60 * 60 * 24)
            );
            intervals.push(daysDiff);
          }

          // Classify pattern based on average interval
          const avgInterval =
            intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
          let patternType: PatternType | null = null;

          for (const [type, range] of Object.entries(PATTERN_INTERVALS)) {
            if (avgInterval >= range.min && avgInterval <= range.max) {
              patternType = type as PatternType;
              break;
            }
          }

          if (!patternType) continue;

          // Check interval consistency (±3 day tolerance)
          const isConsistent = intervals.every(
            (interval) => Math.abs(interval - avgInterval) <= 3
          );

          if (!isConsistent) continue;

          // Calculate amount statistics
          const avgAmount =
            amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
          const lastAmount = amounts[amounts.length - 1];
          const lastDate = dates[dates.length - 1].toISOString().split('T')[0];

          // Check if amount is variable (>10% variance)
          const isVariable = amounts.some(
            (a) =>
              Math.abs(a - avgAmount) / avgAmount > AMOUNT_VARIANCE_THRESHOLD
          );

          // Calculate next expected date
          const nextExpected = new Date(dates[dates.length - 1]);
          nextExpected.setDate(
            nextExpected.getDate() + Math.round(avgInterval)
          );
          const nextExpectedDate = nextExpected.toISOString().split('T')[0];

          // Check if pattern already exists (including dismissed ones to avoid re-creating)
          const existing = await db.queryOneAsync<{
            id: string;
            is_dismissed: number;
          }>(
            `SELECT id, is_dismissed FROM recurring_patterns 
             WHERE profile_id = ? 
               AND opposing_iban = ? 
               AND merchant_name = ?
               AND is_deleted = 0`,
            [pid, group.opposing_iban, group.merchant_name]
          );

          if (existing) {
            // Skip if dismissed - don't update dismissed patterns
            if (existing.is_dismissed === 1) continue;

            // Update existing pattern
            await db.runAsync(
              `UPDATE recurring_patterns SET
                pattern_type = ?,
                avg_amount = ?,
                last_amount = ?,
                last_date = ?,
                next_expected_date = ?,
                is_variable = ?,
                transaction_count = ?,
                updated_at = ?
               WHERE id = ?`,
              [
                patternType,
                avgAmount,
                lastAmount,
                lastDate,
                nextExpectedDate,
                isVariable ? 1 : 0,
                dates.length,
                now,
                existing.id,
              ]
            );
            updated++;
          } else {
            // Create new pattern
            const id = crypto.randomUUID();
            await db.runAsync(
              `INSERT INTO recurring_patterns (
                id, opposing_iban, merchant_name, pattern_type, 
                avg_amount, last_amount, last_date, next_expected_date,
                is_active, is_confirmed, is_dismissed, is_variable, transaction_count,
                profile_id, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0, ?, ?, ?, ?, ?)`,
              [
                id,
                group.opposing_iban,
                group.merchant_name,
                patternType,
                avgAmount,
                lastAmount,
                lastDate,
                nextExpectedDate,
                isVariable ? 1 : 0,
                dates.length,
                pid,
                now,
                now,
              ]
            );
            detected++;
          }
        }
      });

      return { detected, updated };
    },

    /**
     * Get all recurring patterns for the current profile
     */
    async getRecurringPatterns(): Promise<RecurringPattern[]> {
      const pid = profileId();
      if (!pid) return [];

      const rows = await db.queryAsync<{
        id: string;
        opposing_iban: string | null;
        merchant_name: string | null;
        pattern_type: PatternType;
        avg_amount: number;
        last_amount: number;
        last_date: string;
        next_expected_date: string | null;
        is_active: number;
        is_confirmed: number;
        is_dismissed: number;
        is_variable: number;
        transaction_count: number;
        profile_id: string;
        created_at: number;
      }>(
        `SELECT * FROM recurring_patterns
         WHERE profile_id = ? AND is_deleted = 0 AND is_dismissed = 0
         ORDER BY next_expected_date ASC`,
        [pid]
      );

      return rows.map((row) => ({
        id: row.id,
        opposingIban: row.opposing_iban,
        merchantName: row.merchant_name,
        patternType: row.pattern_type,
        avgAmount: row.avg_amount,
        lastAmount: row.last_amount,
        lastDate: row.last_date,
        nextExpectedDate: row.next_expected_date,
        isActive: row.is_active === 1,
        isConfirmed: row.is_confirmed === 1,
        isDismissed: row.is_dismissed === 1,
        isVariable: row.is_variable === 1,
        transactionCount: row.transaction_count,
        profileId: row.profile_id,
        createdAt: new Date(Number(row.created_at)).toISOString(),
      }));
    },

    /**
     * Get recurring patterns with price history for analysis view
     */
    async getRecurringPatternsWithHistory(): Promise<RecurringPattern[]> {
      const pid = profileId();
      if (!pid) return [];

      // Get all active confirmed patterns
      const patterns = await db.queryAsync<{
        id: string;
        opposing_iban: string | null;
        merchant_name: string | null;
        pattern_type: PatternType;
        avg_amount: number;
        last_amount: number;
        last_date: string;
        next_expected_date: string | null;
        is_active: number;
        is_confirmed: number;
        is_dismissed: number;
        is_variable: number;
        transaction_count: number;
        profile_id: string;
        created_at: number;
      }>(
        `SELECT * FROM recurring_patterns
         WHERE profile_id = ? AND is_deleted = 0 AND is_dismissed = 0 AND is_confirmed = 1
         ORDER BY avg_amount DESC`,
        [pid]
      );

      // For each pattern, get the price history from matching transactions
      const result: RecurringPattern[] = [];

      for (const row of patterns) {
        // Query transactions matching this pattern (by IBAN or merchant name)
        let priceHistory: { date: string; amount: number }[] = [];

        if (row.opposing_iban) {
          const txRows = await db.queryAsync<{ date: string; amount: number }>(
            `SELECT date, ABS(amount) as amount FROM transactions
             WHERE profile_id = ? AND is_deleted = 0
             AND opposing_account_iban = ?
             ORDER BY date ASC`,
            [pid, row.opposing_iban]
          );
          priceHistory = txRows;
        } else if (row.merchant_name) {
          const txRows = await db.queryAsync<{ date: string; amount: number }>(
            `SELECT date, ABS(amount) as amount FROM transactions
             WHERE profile_id = ? AND is_deleted = 0
             AND LOWER(COALESCE(merchant_name, opposing_account_name)) = LOWER(?)
             ORDER BY date ASC`,
            [pid, row.merchant_name]
          );
          priceHistory = txRows;
        }

        result.push({
          id: row.id,
          opposingIban: row.opposing_iban,
          merchantName: row.merchant_name,
          patternType: row.pattern_type,
          avgAmount: row.avg_amount,
          lastAmount: row.last_amount,
          lastDate: row.last_date,
          nextExpectedDate: row.next_expected_date,
          isActive: row.is_active === 1,
          isConfirmed: row.is_confirmed === 1,
          isDismissed: row.is_dismissed === 1,
          isVariable: row.is_variable === 1,
          transactionCount: row.transaction_count,
          profileId: row.profile_id,
          createdAt: new Date(Number(row.created_at)).toISOString(),
          priceHistory,
        });
      }

      return result;
    },

    /**
     * Get recurring pattern stats (total monthly spend, counts, etc)
     * @param startDate Optional start date to calculate expected expenses for a period
     * @param endDate Optional end date to calculate expected expenses for a period
     */
    async getRecurringStats(
      startDate?: string,
      endDate?: string
    ): Promise<RecurringStats> {
      const pid = profileId();
      if (!pid) {
        return {
          totalMonthlySpend: 0,
          activeSubscriptions: 0,
          confirmedSubscriptions: 0,
          pendingConfirmation: 0,
        };
      }

      const rows = await db.queryAsync<{
        id: string;
        pattern_type: PatternType;
        avg_amount: number;
        last_date: string;
        is_active: number;
        is_confirmed: number;
      }>(
        `SELECT id, pattern_type, avg_amount, last_date, is_active, is_confirmed
         FROM recurring_patterns
         WHERE profile_id = ? AND is_deleted = 0 AND is_dismissed = 0 AND is_active = 1`,
        [pid]
      );

      // Calculate monthly equivalent for each pattern
      const multipliers: Record<PatternType, number> = {
        weekly: 4.33, // ~4.33 weeks per month
        biweekly: 2.17,
        monthly: 1,
        quarterly: 0.33,
        yearly: 0.083, // 1/12
      };

      let totalMonthlySpend = 0;
      let activeSubscriptions = 0;
      let confirmedSubscriptions = 0;
      let pendingConfirmation = 0;

      for (const row of rows) {
        const multiplier = multipliers[row.pattern_type] || 1;
        totalMonthlySpend += row.avg_amount * multiplier;
        activeSubscriptions++;

        if (row.is_confirmed === 1) {
          confirmedSubscriptions++;
        } else {
          pendingConfirmation++;
        }
      }

      // Calculate expected expenses for the period if dates provided
      let expectedPeriodExpenses: number | undefined;
      if (startDate && endDate) {
        const intervalDays: Record<PatternType, number> = {
          weekly: 7,
          biweekly: 14,
          monthly: 30,
          quarterly: 91,
          yearly: 365,
        };

        const start = new Date(startDate);
        const end = new Date(endDate);
        let total = 0;

        for (const pattern of rows) {
          const nextDate = new Date(pattern.last_date);
          const interval = intervalDays[pattern.pattern_type];

          // Project forward from last date
          while (nextDate <= end) {
            nextDate.setDate(nextDate.getDate() + interval);

            if (nextDate >= start && nextDate <= end) {
              total += Math.abs(pattern.avg_amount);
            }
          }
        }

        expectedPeriodExpenses = total;
      }

      return {
        totalMonthlySpend,
        activeSubscriptions,
        confirmedSubscriptions,
        pendingConfirmation,
        expectedPeriodExpenses,
      };
    },

    /**
     * Get calendar entries for recurring patterns in a date range
     */
    async getRecurringCalendar(
      startDate: string,
      endDate: string
    ): Promise<RecurringCalendarEntry[]> {
      const pid = profileId();
      if (!pid) return [];

      const patterns = await db.queryAsync<{
        id: string;
        merchant_name: string | null;
        pattern_type: PatternType;
        avg_amount: number;
        last_date: string;
        is_confirmed: number;
      }>(
        `SELECT id, merchant_name, pattern_type, avg_amount, last_date, is_confirmed
         FROM recurring_patterns
         WHERE profile_id = ? AND is_deleted = 0 AND is_dismissed = 0 AND is_active = 1`,
        [pid]
      );

      const entries: RecurringCalendarEntry[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Interval in days for each pattern type
      const intervalDays: Record<PatternType, number> = {
        weekly: 7,
        biweekly: 14,
        monthly: 30,
        quarterly: 91,
        yearly: 365,
      };

      for (const pattern of patterns) {
        const nextDate = new Date(pattern.last_date);
        const interval = intervalDays[pattern.pattern_type];

        // Project forward from last date
        while (nextDate <= end) {
          nextDate.setDate(nextDate.getDate() + interval);

          if (nextDate >= start && nextDate <= end) {
            entries.push({
              id: pattern.id,
              date: nextDate.toISOString().split('T')[0],
              merchantName: pattern.merchant_name,
              expectedAmount: pattern.avg_amount,
              patternType: pattern.pattern_type,
              isConfirmed: pattern.is_confirmed === 1,
            });
          }
        }
      }

      // Sort by date
      entries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      return entries;
    },

    /**
     * Confirm a recurring pattern (user verified it's a real subscription)
     */
    async confirmRecurringPattern(id: string): Promise<void> {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      await db.runAsync(
        `UPDATE recurring_patterns SET is_confirmed = 1, updated_at = ?
         WHERE id = ? AND profile_id = ?`,
        [Date.now(), id, pid]
      );
    },

    /**
     * Update a recurring pattern (edit name, frequency, amount, etc.)
     */
    async updateRecurringPattern(
      id: string,
      updates: {
        merchantName?: string;
        patternType?: PatternType;
        avgAmount?: number;
      }
    ): Promise<void> {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      const setClauses: string[] = ['updated_at = ?'];
      const params: unknown[] = [Date.now()];

      if (updates.merchantName !== undefined) {
        setClauses.push('merchant_name = ?');
        params.push(updates.merchantName);
      }
      if (updates.patternType !== undefined) {
        setClauses.push('pattern_type = ?');
        params.push(updates.patternType);
      }
      if (updates.avgAmount !== undefined) {
        setClauses.push('avg_amount = ?');
        params.push(updates.avgAmount);
      }

      params.push(id, pid);

      await db.runAsync(
        `UPDATE recurring_patterns SET ${setClauses.join(', ')}
         WHERE id = ? AND profile_id = ?`,
        params
      );
    },

    /**
     * Get transactions matching a recurring pattern
     */
    async getTransactionsForPattern(patternId: string): Promise<Transaction[]> {
      const pid = profileId();
      if (!pid) return [];

      // First get the pattern to know what to match
      const patterns = await db.queryAsync<{
        opposing_iban: string | null;
        merchant_name: string | null;
      }>(
        `SELECT opposing_iban, merchant_name FROM recurring_patterns
         WHERE id = ? AND profile_id = ?`,
        [patternId, pid]
      );

      if (patterns.length === 0) return [];
      const pattern = patterns[0];

      let whereClause = '';
      const queryParams: unknown[] = [pid];

      if (pattern.opposing_iban && pattern.merchant_name) {
        whereClause =
          'AND opposing_account_iban = ? AND LOWER(COALESCE(merchant_name, opposing_account_name)) = LOWER(?)';
        queryParams.push(pattern.opposing_iban, pattern.merchant_name);
      } else if (pattern.opposing_iban) {
        whereClause = 'AND opposing_account_iban = ?';
        queryParams.push(pattern.opposing_iban);
      } else if (pattern.merchant_name) {
        whereClause =
          'AND LOWER(COALESCE(merchant_name, opposing_account_name)) = LOWER(?)';
        queryParams.push(pattern.merchant_name);
      } else {
        return [];
      }

      const rows = await db.queryAsync<{
        id: string;
        date: string;
        amount: number;
        description: string;
        merchant_name: string | null;
        opposing_account_name: string | null;
        opposing_account_iban: string | null;
        category_id: string | null;
        type: string;
        account_id: string;
        notes: string | null;
        payment_method: string | null;
        raw_data: string | null;
        import_hash: string;
        payment_provider: string | null;
        address_book_id: string | null;
        created_at: string;
      }>(
        `SELECT id, date, amount, description, merchant_name, opposing_account_name,
                opposing_account_iban, category_id, type, account_id, notes, payment_method,
                raw_data, import_hash, payment_provider, address_book_id, created_at
         FROM transactions
         WHERE profile_id = ? AND is_deleted = 0 ${whereClause}
         ORDER BY date DESC`,
        queryParams
      );

      return rows.map((row) => ({
        id: row.id,
        date: row.date,
        amount: row.amount,
        description: row.description,
        merchantName: row.merchant_name,
        opposingAccountName: row.opposing_account_name,
        opposingAccountIban: row.opposing_account_iban,
        categoryId: row.category_id,
        type: (row.type || 'expense') as 'income' | 'expense' | 'transfer',
        accountId: row.account_id || '',
        notes: row.notes,
        paymentMethod: row.payment_method,
        rawData: row.raw_data,
        importHash: row.import_hash || '',
        paymentProvider: row.payment_provider,
        addressBookId: row.address_book_id,
        createdAt: row.created_at || '',
      }));
    },

    /**
     * Delete all recurring patterns for the current profile
     */
    async deleteAllRecurringPatterns(): Promise<void> {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      await db.runAsync(
        `UPDATE recurring_patterns SET is_deleted = 1, updated_at = ?
         WHERE profile_id = ?`,
        [Date.now(), pid]
      );
    },

    /**
     * Dismiss a recurring pattern (user says it's a false positive)
     * This permanently marks it as dismissed so it won't be suggested again
     */
    async dismissRecurringPattern(id: string): Promise<void> {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      await db.runAsync(
        `UPDATE recurring_patterns SET is_dismissed = 1, is_active = 0, updated_at = ?
         WHERE id = ? AND profile_id = ?`,
        [Date.now(), id, pid]
      );
    },

    /**
     * Delete a recurring pattern
     */
    async deleteRecurringPattern(id: string): Promise<void> {
      const pid = profileId();
      if (!pid) throw new Error('No active profile');

      await db.runAsync(
        `UPDATE recurring_patterns SET is_deleted = 1, updated_at = ?
         WHERE id = ? AND profile_id = ?`,
        [Date.now(), id, pid]
      );
    },

    // Helper to link transactions to address book entries
    async _linkTransactionsToAddressBook(
      txIds: string[],
      pid: string,
      now: number
    ): Promise<void> {
      if (txIds.length === 0) return;

      const placeholders = txIds.map(() => '?').join(',');

      // Link via direct address_book IBAN match
      await db.runAsync(
        `UPDATE transactions
         SET address_book_id = (
           SELECT ab.id FROM address_book ab 
           WHERE ab.iban = transactions.opposing_account_iban
           AND ab.profile_id = ?
           AND ab.is_deleted = 0
         ),
         updated_at = ?
         WHERE id IN (${placeholders})
           AND address_book_id IS NULL
           AND opposing_account_iban IS NOT NULL`,
        [pid, now, ...txIds]
      );

      // Link via contact_ibans junction table
      await db.runAsync(
        `UPDATE transactions
         SET address_book_id = (
           SELECT ci.contact_id FROM contact_ibans ci
           JOIN address_book ab ON ab.id = ci.contact_id
           WHERE ci.iban = transactions.opposing_account_iban
           AND ab.profile_id = ?
           AND ab.is_deleted = 0
         ),
         updated_at = ?
         WHERE id IN (${placeholders})
           AND address_book_id IS NULL
           AND opposing_account_iban IS NOT NULL`,
        [pid, now, ...txIds]
      );
    },

    // ============= Profile/Deletion Methods =============
    async deleteAllTransactions() {
      const pid = profileId();
      if (!pid) return { deleted: 0 };

      const result = await db.runAsync(
        `UPDATE transactions SET is_deleted = 1, updated_at = ?
         WHERE account_id IN (SELECT id FROM accounts WHERE profile_id = ?) AND is_deleted = 0`,
        [Date.now(), pid]
      );

      return { deleted: result.changes };
    },

    async createDemoData(targetProfileId: string) {
      const now = Date.now();

      // Import seed data
      const {
        flattenCategoriesForDB,
        DEMO_MERCHANTS,
        PAYMENT_PROCESSORS,
        MULTI_IBAN_CONTACTS,
        INCOME_SOURCES,
        DEFAULT_DEMO_BUDGETS,
        DEFAULT_PAYMENT_PROVIDER_RULES,
        PROPOSED_CONTACT_DEMO,
        DEMO_RECURRING_PATTERNS,
      } = await import('@fluxby/shared');

      // === PERFORMANCE: Wrap all operations in a single transaction ===
      await db.runAsync('BEGIN TRANSACTION', []);

      try {
        // 1. Clear existing data for this profile
        await db.runAsync('DELETE FROM budgets WHERE profile_id = ?', [
          targetProfileId,
        ]);
        await db.runAsync('DELETE FROM category_rules WHERE profile_id = ?', [
          targetProfileId,
        ]);
        await db.runAsync(
          'DELETE FROM transactions WHERE account_id IN (SELECT id FROM accounts WHERE profile_id = ?)',
          [targetProfileId]
        );
        await db.runAsync('DELETE FROM accounts WHERE profile_id = ?', [
          targetProfileId,
        ]);
        await db.runAsync('DELETE FROM categories WHERE profile_id = ?', [
          targetProfileId,
        ]);
        await db.runAsync('DELETE FROM address_book WHERE profile_id = ?', [
          targetProfileId,
        ]);
        await db.runAsync(
          'DELETE FROM recurring_patterns WHERE profile_id = ?',
          [targetProfileId]
        );

        // 2. Seed categories with subcategories using bulk inserts
        const { parentCategories, subcategories } = flattenCategoriesForDB();
        const categoryIdMap: Record<string, string> = {};

        // Prepare parent categories with pre-generated IDs
        const parentCatData = parentCategories.map((cat) => {
          const catId = crypto.randomUUID();
          categoryIdMap[cat.name] = catId;
          return { id: catId, ...cat };
        });

        // Bulk insert parent categories
        if (parentCatData.length > 0) {
          const placeholders = parentCatData
            .map(() => '(?, ?, ?, ?, ?, ?, ?, ?)')
            .join(', ');
          const values = parentCatData.flatMap((cat) => [
            cat.id,
            cat.name,
            cat.icon,
            cat.color,
            cat.description,
            targetProfileId,
            now,
            now,
          ]);
          await db.runAsync(
            `INSERT INTO categories (id, name, icon, color, description, profile_id, created_at, updated_at) VALUES ${placeholders}`,
            values
          );
        }

        // Prepare subcategories with pre-generated IDs and collect rules
        const allRules: Array<{
          id: string;
          pattern: string;
          categoryId: string;
        }> = [];
        const subCatData = subcategories.map((sub) => {
          const parentId = categoryIdMap[sub.parentName];
          const subId = crypto.randomUUID();
          categoryIdMap[sub.name] = subId;

          // Collect rules for this subcategory
          for (const rule of sub.rules) {
            allRules.push({
              id: crypto.randomUUID(),
              pattern: rule,
              categoryId: subId,
            });
          }

          return { id: subId, parentId, ...sub };
        });

        // Bulk insert subcategories
        if (subCatData.length > 0) {
          const placeholders = subCatData
            .map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .join(', ');
          const values = subCatData.flatMap((sub) => [
            sub.id,
            sub.name,
            sub.parentId,
            sub.icon,
            sub.color,
            sub.description,
            targetProfileId,
            now,
            now,
          ]);
          await db.runAsync(
            `INSERT INTO categories (id, name, parent_id, icon, color, description, profile_id, created_at, updated_at) VALUES ${placeholders}`,
            values
          );
        }

        // Bulk insert category rules (chunk if needed)
        const RULE_CHUNK_SIZE = 500;
        for (let i = 0; i < allRules.length; i += RULE_CHUNK_SIZE) {
          const chunk = allRules.slice(i, i + RULE_CHUNK_SIZE);
          const placeholders = chunk
            .map(() => '(?, ?, ?, ?, ?, ?, ?)')
            .join(', ');
          const values = chunk.flatMap((rule) => [
            rule.id,
            rule.pattern,
            rule.categoryId,
            0,
            targetProfileId,
            now,
            now,
          ]);
          await db.runAsync(
            `INSERT INTO category_rules (id, pattern, category_id, priority, profile_id, created_at, updated_at) VALUES ${placeholders}`,
            values
          );
        }

        // 3. Create demo accounts
        const mainAccountId = crypto.randomUUID();
        const savingsAccountId = crypto.randomUUID();
        const demoAccountIban = 'NL00DEMO9999999999';
        const savingsAccountIban = 'NL00DEMO8888888888';

        await db.runAsync(
          'INSERT INTO accounts (id, iban, name, type, bank, current_balance, profile_id, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            mainAccountId,
            demoAccountIban,
            'Demo Betaalrekening',
            'checking',
            'demo',
            2500.0,
            targetProfileId,
            0,
            now,
            now,
          ]
        );

        await db.runAsync(
          'INSERT INTO accounts (id, iban, name, type, bank, current_balance, profile_id, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            savingsAccountId,
            savingsAccountIban,
            'Demo Spaarrekening',
            'savings',
            'demo',
            5000.0,
            targetProfileId,
            1,
            now,
            now,
          ]
        );

        // 4. Generate transactions for 18 months back
        const currentDate = new Date();
        const todayYear = currentDate.getUTCFullYear();
        const todayMonth = currentDate.getUTCMonth();
        const todayDay = currentDate.getUTCDate();

        // Helper functions
        const randomItem = <T>(arr: T[]): T =>
          arr[Math.floor(Math.random() * arr.length)];
        const randomAmount = (min: number, max: number) =>
          Math.round((min + Math.random() * (max - min)) * 100) / 100;

        // Allow certain merchants (e.g. Albert Heijn) to rotate through multiple IBANs
        // so the demo address book can reliably show merged contacts.
        const multiIbansByName = new Map(
          MULTI_IBAN_CONTACTS.map((c: { name: string; ibans: string[] }) => [
            c.name,
            c.ibans,
          ])
        );

        type DemoTransaction = {
          date: string;
          amount: number;
          type: 'income' | 'expense' | 'transfer';
          description: string;
          merchant_name: string;
          account_id: string;
          opposing_iban: string;
          opposing_name: string;
          category_id: string | null;
          payment_method: string | null;
          payment_provider: string | null;
        };

        let transactions: DemoTransaction[] = [];

        // Generate 18 months of data
        for (let monthOffset = 0; monthOffset < 18; monthOffset++) {
          const monthDate = new Date(currentDate);
          // Anchor to the 1st to avoid month overflow issues (e.g. 31st -> shorter months)
          monthDate.setDate(1);
          monthDate.setMonth(monthDate.getMonth() - monthOffset);
          const year = monthDate.getFullYear();
          const month = monthDate.getMonth();
          const daysInMonth = new Date(year, month + 1, 0).getDate();

          // Random number of transactions per month (10-30)
          const txCount = 10 + Math.floor(Math.random() * 21);

          // Monthly salary on the 24th
          const salarySource = INCOME_SOURCES[0];
          const salaryDay = 24;
          if (monthOffset > 0 || currentDate.getDate() >= salaryDay) {
            transactions.push({
              date: new Date(Date.UTC(year, month, salaryDay))
                .toISOString()
                .split('T')[0],
              amount: 2800 + randomAmount(-200, 200),
              type: 'income',
              description: 'Salaris',
              merchant_name: salarySource.name,
              account_id: mainAccountId,
              opposing_iban: salarySource.iban,
              opposing_name: salarySource.name,
              category_id: categoryIdMap['Salaris'] || null,
              payment_method: 'Overboeking',
              payment_provider: null,
            });
          }

          // Occasional zorgtoeslag (around 5th)
          if (Math.random() > 0.3) {
            const toeslagSource = INCOME_SOURCES[1];
            transactions.push({
              date: new Date(Date.UTC(year, month, 5))
                .toISOString()
                .split('T')[0],
              amount: 115 + randomAmount(-10, 10),
              type: 'income',
              description: 'Zorgtoeslag',
              merchant_name: toeslagSource.name,
              account_id: mainAccountId,
              opposing_iban: toeslagSource.iban,
              opposing_name: toeslagSource.name,
              category_id: categoryIdMap['Teruggaven'] || null,
              payment_method: 'Overboeking',
              payment_provider: null,
            });
          }

          // Housing costs (around 1st)
          const housing = randomItem(DEMO_MERCHANTS.housing);
          transactions.push({
            date: new Date(Date.UTC(year, month, 1))
              .toISOString()
              .split('T')[0],
            amount: -850,
            type: 'expense',
            description: 'Huur',
            merchant_name: housing.name,
            account_id: mainAccountId,
            opposing_iban: housing.iban,
            opposing_name: housing.name,
            category_id: categoryIdMap['Huur & Hypotheek'] || null,
            payment_method: 'Incasso',
            payment_provider: null,
          });

          // Utilities (around 15th)
          for (const utility of DEMO_MERCHANTS.utilities) {
            transactions.push({
              date: new Date(Date.UTC(year, month, 15))
                .toISOString()
                .split('T')[0],
              amount: -randomAmount(80, 150),
              type: 'expense',
              description: 'Maandelijkse kosten',
              merchant_name: utility.name,
              account_id: mainAccountId,
              opposing_iban: utility.iban,
              opposing_name: utility.name,
              category_id:
                utility.name === 'Ziggo'
                  ? categoryIdMap['Mobiel & Internet'] || null
                  : categoryIdMap['Energie & Water'] || null,
              payment_method: 'Incasso',
              payment_provider: null,
            });
          }

          // Insurance (around 27th)
          for (const ins of DEMO_MERCHANTS.insurance) {
            transactions.push({
              date: new Date(Date.UTC(year, month, 27))
                .toISOString()
                .split('T')[0],
              amount: -randomAmount(100, 180),
              type: 'expense',
              description: ins.name.includes('Zilveren')
                ? 'Zorgverzekering'
                : 'Autoverzekering',
              merchant_name: ins.name,
              account_id: mainAccountId,
              opposing_iban: ins.iban,
              opposing_name: ins.name,
              category_id: ins.name.includes('Zilveren')
                ? categoryIdMap['Zorgverzekering'] || null
                : categoryIdMap['Auto Kosten'] || null,
              payment_method: 'Incasso',
              payment_provider: null,
            });
          }

          // Monthly subscriptions
          for (const sub of DEMO_MERCHANTS.subscriptions) {
            transactions.push({
              date: new Date(
                Date.UTC(year, month, 10 + Math.floor(Math.random() * 5))
              )
                .toISOString()
                .split('T')[0],
              amount: -randomAmount(10, 20),
              type: 'expense',
              description: 'Maandabonnement',
              merchant_name: sub.name,
              account_id: mainAccountId,
              opposing_iban: sub.iban,
              opposing_name: sub.name,
              category_id:
                sub.name === 'KPN'
                  ? categoryIdMap['Mobiel & Internet'] || null
                  : categoryIdMap['Streaming & Media'] || null,
              payment_method: 'Incasso',
              payment_provider: null,
            });
          }

          // Savings transfer (around 2nd)
          transactions.push({
            date: new Date(Date.UTC(year, month, 2))
              .toISOString()
              .split('T')[0],
            amount: -250,
            type: 'transfer',
            description: 'Sparen',
            merchant_name: 'Eigen rekening',
            account_id: mainAccountId,
            opposing_iban: savingsAccountIban,
            opposing_name: 'Demo Spaarrekening',
            category_id: null,
            payment_method: 'Overboeking',
            payment_provider: null,
          });

          // Random daily expenses
          for (let i = 0; i < txCount; i++) {
            const maxDay =
              monthOffset === 0
                ? Math.min(daysInMonth, currentDate.getDate())
                : daysInMonth;
            const day = 1 + Math.floor(Math.random() * maxDay);
            const expenseType = Math.random();

            let merchant: { name: string; iban: string };
            let amount: number;
            let description: string;
            let categoryId: string | null = null;

            const useProcessor = Math.random() > 0.6;
            const processor = useProcessor
              ? randomItem(PAYMENT_PROCESSORS)
              : null;

            if (expenseType < 0.3) {
              merchant = randomItem(DEMO_MERCHANTS.supermarkets);
              amount = -randomAmount(15, 120);
              description = 'Boodschappen';
              categoryId = categoryIdMap['Supermarkt'] || null;
            } else if (expenseType < 0.45) {
              merchant = randomItem(DEMO_MERCHANTS.restaurants);
              amount = -randomAmount(12, 60);
              description =
                merchant.name.includes('bezorgd') ||
                merchant.name.includes('Uber')
                  ? 'Eten bestellen'
                  : 'Uit eten';
              categoryId =
                merchant.name.includes('bezorgd') ||
                merchant.name.includes('Uber')
                  ? categoryIdMap['Eten Bestellen'] || null
                  : categoryIdMap['Restaurants & Bars'] || null;
            } else if (expenseType < 0.55) {
              merchant = randomItem(DEMO_MERCHANTS.transport);
              amount = -randomAmount(5, 80);
              description = merchant.name === 'NS' ? 'Treinreis' : 'Tanken';
              categoryId =
                merchant.name === 'NS'
                  ? categoryIdMap['Openbaar Vervoer'] || null
                  : merchant.name.includes('Park')
                    ? categoryIdMap['Parkeren & Taxi'] || null
                    : categoryIdMap['Brandstof & Laden'] || null;
            } else if (expenseType < 0.65) {
              merchant = randomItem(DEMO_MERCHANTS.health);
              amount = -randomAmount(8, 35);
              description = 'Persoonlijke verzorging';
              categoryId = categoryIdMap['Drogisterij'] || null;
            } else if (expenseType < 0.8) {
              merchant = randomItem(DEMO_MERCHANTS.shopping);
              amount = -randomAmount(15, 150);
              description = 'Aankoop';
              categoryId =
                merchant.name === 'IKEA'
                  ? categoryIdMap['Inrichting & Tuin'] || null
                  : categoryIdMap['Kleding & Schoenen'] || null;
            } else {
              merchant = randomItem(DEMO_MERCHANTS.leisure);
              amount = -randomAmount(10, 50);
              description = merchant.name.includes('Fit')
                ? 'Sportschool'
                : 'Uitje';
              categoryId = merchant.name.includes('Fit')
                ? categoryIdMap['Sport & Wellness'] || null
                : categoryIdMap['Uitjes & Cultuur'] || null;
            }

            let paymentMethod: string;
            if (processor) {
              paymentMethod = 'iDEAL';
            } else if (
              ['Bol.com', 'Amazon', 'MediaMarkt'].includes(merchant.name)
            ) {
              paymentMethod = 'iDEAL';
            } else {
              paymentMethod = 'Pinpas';
            }

            transactions.push({
              date: new Date(Date.UTC(year, month, day))
                .toISOString()
                .split('T')[0],
              amount,
              type: 'expense',
              description,
              merchant_name: processor
                ? `${merchant.name} via ${processor.name}`
                : merchant.name,
              account_id: mainAccountId,
              opposing_iban: processor
                ? processor.iban
                : (() => {
                    const ibans = multiIbansByName.get(merchant.name);
                    return ibans?.length
                      ? ibans[(monthOffset + day) % ibans.length]
                      : merchant.iban;
                  })(),
              opposing_name: processor ? merchant.name : merchant.name,
              category_id: categoryId,
              payment_method: paymentMethod,
              payment_provider: processor ? processor.name : null,
            });
          }

          // Multi-IBAN contact transactions
          for (const contact of MULTI_IBAN_CONTACTS) {
            const txCount = 1 + (monthOffset % 2);
            for (let i = 0; i < txCount; i++) {
              const ibanIndex = (monthOffset + i) % contact.ibans.length;
              transactions.push({
                date: new Date(
                  Date.UTC(
                    year,
                    month,
                    5 + i * 10 + Math.floor(Math.random() * 5)
                  )
                )
                  .toISOString()
                  .split('T')[0],
                amount: -randomAmount(40, 180),
                type: 'expense',
                description: contact.descriptions[ibanIndex],
                merchant_name: contact.name,
                account_id: mainAccountId,
                opposing_iban: contact.ibans[ibanIndex],
                opposing_name: contact.name,
                category_id: null,
                payment_method: 'Overboeking',
                payment_provider: null,
              });
            }
          }

          // Payment processor transactions
          const idealMerchants = [
            'Bol.com',
            'Coolblue',
            'MediaMarkt',
            'Wehkamp',
          ];
          for (let i = 0; i < 2; i++) {
            const merchant =
              idealMerchants[(monthOffset * 3 + i) % idealMerchants.length];
            transactions.push({
              date: new Date(
                Date.UTC(year, month, 5 + i * 7 + Math.floor(Math.random() * 3))
              )
                .toISOString()
                .split('T')[0],
              amount: -randomAmount(20, 180),
              type: 'expense',
              description: `Online aankoop ${merchant}`,
              merchant_name: `${merchant} via ${PAYMENT_PROCESSORS[0].name}`,
              account_id: mainAccountId,
              opposing_iban: PAYMENT_PROCESSORS[0].iban,
              opposing_name: merchant,
              category_id: categoryIdMap['Warenhuis'] || null,
              payment_method: 'iDEAL',
              payment_provider: PAYMENT_PROCESSORS[0].name,
            });
          }

          const adyenMerchants = ['Netflix', 'Spotify', 'Disney+', 'Uber'];
          for (let i = 0; i < 2; i++) {
            const merchant =
              adyenMerchants[(monthOffset * 2 + i) % adyenMerchants.length];
            transactions.push({
              date: new Date(
                Date.UTC(year, month, 1 + i * 8 + Math.floor(Math.random() * 3))
              )
                .toISOString()
                .split('T')[0],
              amount:
                merchant === 'Uber'
                  ? -randomAmount(10, 45)
                  : -randomAmount(8, 18),
              type: 'expense',
              description:
                merchant === 'Uber' ? 'Uber rit' : `${merchant} abonnement`,
              merchant_name: `${merchant} via ${PAYMENT_PROCESSORS[1].name}`,
              account_id: mainAccountId,
              opposing_iban: PAYMENT_PROCESSORS[1].iban,
              opposing_name: merchant,
              category_id:
                merchant === 'Uber'
                  ? categoryIdMap['Parkeren & Taxi'] || null
                  : categoryIdMap['Streaming & Media'] || null,
              payment_method: merchant === 'Uber' ? 'iDEAL' : 'Incasso',
              payment_provider: PAYMENT_PROCESSORS[1].name,
            });
          }

          const mollieMerchants = ['Thuisbezorgd.nl', 'Zalando', 'Picnic'];
          for (let i = 0; i < 2; i++) {
            const merchant =
              mollieMerchants[(monthOffset * 2 + i) % mollieMerchants.length];
            const isDelivery = ['Thuisbezorgd.nl', 'Picnic'].includes(merchant);
            transactions.push({
              date: new Date(
                Date.UTC(
                  year,
                  month,
                  12 + i * 6 + Math.floor(Math.random() * 3)
                )
              )
                .toISOString()
                .split('T')[0],
              amount: isDelivery
                ? -randomAmount(15, 70)
                : -randomAmount(30, 100),
              type: 'expense',
              description: isDelivery
                ? 'Boodschappen bezorgd'
                : 'Online aankoop',
              merchant_name: `${merchant} via ${PAYMENT_PROCESSORS[2].name}`,
              account_id: mainAccountId,
              opposing_iban: PAYMENT_PROCESSORS[2].iban,
              opposing_name: merchant,
              category_id: isDelivery
                ? merchant === 'Thuisbezorgd.nl'
                  ? categoryIdMap['Eten Bestellen'] || null
                  : categoryIdMap['Supermarkt'] || null
                : categoryIdMap['Kleding & Schoenen'] || null,
              payment_method: 'iDEAL',
              payment_provider: PAYMENT_PROCESSORS[2].name,
            });
          }
        }

        // Add a "proposed contact" transaction - this IBAN is NOT in the address book
        // so it will appear as a proposed contact in the UI
        const proposedContactDate = new Date(
          Date.UTC(todayYear, todayMonth, Math.max(1, todayDay - 3))
        );
        transactions.push({
          date: proposedContactDate.toISOString().split('T')[0],
          amount: PROPOSED_CONTACT_DEMO.amount,
          type: 'expense',
          description: PROPOSED_CONTACT_DEMO.description,
          merchant_name: PROPOSED_CONTACT_DEMO.name,
          account_id: mainAccountId,
          opposing_iban: PROPOSED_CONTACT_DEMO.iban,
          opposing_name: PROPOSED_CONTACT_DEMO.name,
          category_id: null,
          payment_method: 'iDEAL',
          payment_provider: null,
        });

        // Sanitize transactions: ensure at most 2 transactions for today
        let todayCount = 0;
        const sanitized: DemoTransaction[] = [];

        for (const tx of transactions) {
          let txDate = new Date(tx.date + 'T00:00:00Z');

          if (
            txDate.getUTCFullYear() === todayYear &&
            txDate.getUTCMonth() === todayMonth &&
            txDate.getUTCDate() > todayDay
          ) {
            if (todayDay > 1) {
              const newDay = 1 + Math.floor(Math.random() * (todayDay - 1));
              txDate = new Date(Date.UTC(todayYear, todayMonth, newDay));
            } else {
              txDate = new Date(Date.UTC(todayYear, todayMonth, todayDay));
            }
          }

          if (
            txDate.getUTCFullYear() === todayYear &&
            txDate.getUTCMonth() === todayMonth &&
            txDate.getUTCDate() === todayDay
          ) {
            if (todayCount < 2) {
              todayCount++;
            } else {
              if (todayDay > 1) {
                const newDay = 1 + Math.floor(Math.random() * (todayDay - 1));
                txDate = new Date(Date.UTC(todayYear, todayMonth, newDay));
              } else {
                continue;
              }
            }
          }

          tx.date = txDate.toISOString().split('T')[0];
          sanitized.push(tx);
        }

        transactions = sanitized;
        transactions.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Prepare transactions with balance calculation and pre-generated data
        let balance = 2500;
        const txData = transactions.map((tx) => {
          balance += tx.amount;
          const id = crypto.randomUUID();
          const importHash = `demo_${targetProfileId}_${tx.date}_${tx.amount}_${tx.merchant_name}_${Math.random().toString(36).substring(7)}`;
          return { id, balance, importHash, ...tx };
        });

        // Bulk insert transactions (chunk to avoid SQLite parameter limits)
        const TX_CHUNK_SIZE = 200; // 17 params per row, stay well under SQLite limits
        for (let i = 0; i < txData.length; i += TX_CHUNK_SIZE) {
          const chunk = txData.slice(i, i + TX_CHUNK_SIZE);
          const placeholders = chunk
            .map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .join(', ');
          const values = chunk.flatMap((tx) => [
            tx.id,
            tx.date,
            tx.amount,
            tx.type,
            tx.description,
            tx.merchant_name,
            tx.account_id,
            tx.opposing_iban,
            tx.opposing_name,
            tx.category_id,
            tx.balance,
            tx.payment_method,
            tx.payment_provider,
            tx.importHash,
            targetProfileId,
            now,
            now,
          ]);
          await db.runAsync(
            `INSERT INTO transactions (id, date, amount, type, description, merchant_name, account_id, opposing_account_iban, opposing_account_name, category_id, balance_after, payment_method, payment_provider, import_hash, profile_id, created_at, updated_at) 
           VALUES ${placeholders}`,
            values
          );
        }

        // 5. Create address book entries from unique opposing accounts
        const uniqueIbans = new Map<string, string>();
        for (const tx of transactions) {
          if (!uniqueIbans.has(tx.opposing_iban)) {
            uniqueIbans.set(tx.opposing_iban, tx.opposing_name);
          }
        }

        const processorIbans = new Set(PAYMENT_PROCESSORS.map((p) => p.iban));
        const multiIbanSet = new Set(
          MULTI_IBAN_CONTACTS.flatMap((c) => c.ibans)
        );

        // Ensure unique address book names by merging IBANs into a single contact.
        const nameToContactId = new Map<string, string>();

        for (const [iban, name] of uniqueIbans) {
          if (
            iban !== savingsAccountIban &&
            iban !== demoAccountIban &&
            !processorIbans.has(iban) &&
            !multiIbanSet.has(iban)
          ) {
            const normalizedName = String(name).trim();
            const existingContactId = nameToContactId.get(normalizedName);

            if (existingContactId) {
              // Merge additional IBAN into existing contact
              await db.runAsync(
                'INSERT OR IGNORE INTO contact_ibans (id, contact_id, iban, is_primary, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                [crypto.randomUUID(), existingContactId, iban, 0, now, now]
              );
            } else {
              // Create new contact
              const contactId = crypto.randomUUID();
              nameToContactId.set(normalizedName, contactId);

              await db.runAsync(
                'INSERT INTO address_book (id, iban, name, profile_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                [contactId, iban, normalizedName, targetProfileId, now, now]
              );

              await db.runAsync(
                'INSERT OR IGNORE INTO contact_ibans (id, contact_id, iban, is_primary, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                [crypto.randomUUID(), contactId, iban, 1, now, now]
              );
            }
          }
        }

        // Add multi-IBAN contacts
        for (const contact of MULTI_IBAN_CONTACTS) {
          const primaryIban = contact.ibans.find((iban) =>
            uniqueIbans.has(iban)
          );
          if (!primaryIban) continue;

          const normalizedName = String(contact.name).trim();
          const existingContactId = nameToContactId.get(normalizedName);
          const contactId = existingContactId || crypto.randomUUID();

          if (!existingContactId) {
            nameToContactId.set(normalizedName, contactId);
            await db.runAsync(
              'INSERT INTO address_book (id, iban, name, profile_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
              [
                contactId,
                primaryIban,
                normalizedName,
                targetProfileId,
                now,
                now,
              ]
            );
          }

          // Persist primary + secondary IBANs so the UI can show merged contacts.
          await db.runAsync(
            'INSERT OR IGNORE INTO contact_ibans (id, contact_id, iban, is_primary, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [crypto.randomUUID(), contactId, primaryIban, 1, now, now]
          );

          for (const iban of contact.ibans) {
            if (iban !== primaryIban && uniqueIbans.has(iban)) {
              await db.runAsync(
                'INSERT OR IGNORE INTO contact_ibans (id, contact_id, iban, is_primary, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                [crypto.randomUUID(), contactId, iban, 0, now, now]
              );
            }
          }
        }

        // Mark payment processor IBANs as shared (bulk insert)
        if (PAYMENT_PROCESSORS.length > 0) {
          const placeholders = PAYMENT_PROCESSORS.map(
            () => '(?, ?, ?, ?)'
          ).join(', ');
          const values = PAYMENT_PROCESSORS.flatMap((processor) => [
            processor.iban,
            processor.name,
            now,
            now,
          ]);
          await db.runAsync(
            `INSERT OR IGNORE INTO shared_ibans (iban, provider_name, created_at, updated_at) VALUES ${placeholders}`,
            values
          );
        }

        // 6. Seed payment provider rules (bulk insert)
        if (DEFAULT_PAYMENT_PROVIDER_RULES.length > 0) {
          const placeholders = DEFAULT_PAYMENT_PROVIDER_RULES.map(
            () => '(?, ?, ?, ?, ?, ?)'
          ).join(', ');
          const values = DEFAULT_PAYMENT_PROVIDER_RULES.flatMap((rule) => [
            crypto.randomUUID(),
            rule.name,
            rule.patterns,
            targetProfileId,
            now,
            now,
          ]);
          await db.runAsync(
            `INSERT OR IGNORE INTO payment_provider_rules (id, name, patterns, profile_id, created_at, updated_at) VALUES ${placeholders}`,
            values
          );
        }

        // 7. Create budgets (bulk insert)
        const budgetsToInsert = DEFAULT_DEMO_BUDGETS.map((budget) => ({
          id: crypto.randomUUID(),
          categoryId: categoryIdMap[budget.categoryName],
          amount: budget.amount,
        })).filter((b) => b.categoryId); // Only include budgets with valid category IDs

        if (budgetsToInsert.length > 0) {
          const placeholders = budgetsToInsert
            .map(() => '(?, ?, ?, ?, ?, ?, ?)')
            .join(', ');
          const values = budgetsToInsert.flatMap((budget) => [
            budget.id,
            budget.categoryId,
            budget.amount,
            'monthly',
            targetProfileId,
            now,
            now,
          ]);
          await db.runAsync(
            `INSERT INTO budgets (id, category_id, amount, period, profile_id, created_at, updated_at) VALUES ${placeholders}`,
            values
          );
        }

        // 8. Create recurring patterns for subscriptions demo
        const patternDate = new Date();
        const patternsToInsert = DEMO_RECURRING_PATTERNS.map((pattern) => {
          const lastDate = new Date(patternDate);
          lastDate.setDate(3); // Most subscriptions on the 3rd
          lastDate.setMonth(lastDate.getMonth() - 1);

          const nextDate = new Date(lastDate);
          nextDate.setMonth(nextDate.getMonth() + 1);

          return {
            id: crypto.randomUUID(),
            merchantName: pattern.merchantName,
            patternType: pattern.patternType,
            avgAmount: pattern.avgAmount,
            lastAmount: pattern.lastAmount,
            lastDate: lastDate.toISOString().split('T')[0],
            nextExpectedDate: nextDate.toISOString().split('T')[0],
            isConfirmed: pattern.isConfirmed ? 1 : 0,
            isVariable: pattern.isVariable ? 1 : 0,
            transactionCount: pattern.transactionCount,
          };
        });

        if (patternsToInsert.length > 0) {
          const placeholders = patternsToInsert
            .map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .join(', ');
          const values = patternsToInsert.flatMap((p) => [
            p.id,
            null, // opposing_iban - not needed for demo
            p.merchantName,
            p.patternType,
            p.avgAmount,
            p.lastAmount,
            p.lastDate,
            p.nextExpectedDate,
            1, // is_active
            p.isConfirmed,
            p.isVariable,
            p.transactionCount,
            targetProfileId,
            now,
          ]);
          await db.runAsync(
            `INSERT INTO recurring_patterns (id, opposing_iban, merchant_name, pattern_type, avg_amount, last_amount, last_date, next_expected_date, is_active, is_confirmed, is_variable, transaction_count, profile_id, updated_at) VALUES ${placeholders}`,
            values
          );
        }

        // === PERFORMANCE: Commit the transaction ===
        await db.runAsync('COMMIT', []);

        return {
          profileId: targetProfileId,
          categories: Object.keys(categoryIdMap).length,
          transactions: transactions.length,
          addressBookEntries: uniqueIbans.size,
          budgets: DEFAULT_DEMO_BUDGETS.length,
          recurringPatterns: DEMO_RECURRING_PATTERNS.length,
          accounts: 2,
        };
      } catch (error) {
        // Rollback on any error
        await db.runAsync('ROLLBACK', []);
        throw error;
      }
    },

    async getUser() {
      const user = await db.queryOneAsync<{
        id: string;
        name: string;
        avatar: string | null;
        created_at: number;
      }>('SELECT * FROM users WHERE is_deleted = 0 LIMIT 1', []);

      if (!user) return null;

      return {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        createdAt: new Date(user.created_at).toISOString(),
      };
    },

    async createUser(data: { name: string; avatar?: string | null }) {
      const id = crypto.randomUUID();
      const now = Date.now();

      await db.runAsync(
        `INSERT INTO users (id, name, avatar, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [id, data.name, data.avatar || null, now, now]
      );

      return {
        id,
        name: data.name,
        avatar: data.avatar || null,
        createdAt: new Date(now).toISOString(),
      };
    },

    async updateUser(data: { name?: string; avatar?: string | null }) {
      const user = await this.getUser();
      if (!user) {
        // Create user if doesn't exist (for onboarding flow)
        if (data.name) {
          return this.createUser({ name: data.name, avatar: data.avatar });
        }
        throw new Error('No user found and no name provided for creation');
      }

      const updates: string[] = [];
      const params: unknown[] = [];

      if (data.name !== undefined) {
        if (typeof data.name !== 'string') {
          console.error('Invalid name type:', typeof data.name);
          return user;
        }
        updates.push('name = ?');
        params.push(data.name);
      }
      if (data.avatar !== undefined) {
        updates.push('avatar = ?');
        params.push(data.avatar);
      }

      if (updates.length === 0) return user;

      updates.push('updated_at = ?');
      params.push(Date.now());
      params.push(user.id);

      try {
        await db.runAsync(
          `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
          params
        );
      } catch (err) {
        console.error('Failed to update user in DB:', err);
        throw err;
      }

      return {
        id: user.id,
        name: data.name ?? user.name,
        avatar: data.avatar ?? user.avatar,
        createdAt: user.createdAt,
      };
    },

    // ============= Additional Methods for API Compatibility =============
    async applyCategoryRuleToTransactions(pattern: string, categoryId: string) {
      const pid = profileId();
      if (!pid) return { updated: 0 };

      const now = Date.now();
      const result = await db.runAsync(
        `UPDATE transactions SET category_id = ?, updated_at = ?
         WHERE id IN (
           SELECT t.id FROM transactions t
           JOIN accounts a ON t.account_id = a.id
           WHERE a.profile_id = ? AND t.is_deleted = 0
           AND (LOWER(t.merchant_name) LIKE ? OR LOWER(t.description) LIKE ?)
         )`,
        [
          categoryId,
          now,
          pid,
          `%${pattern.toLowerCase()}%`,
          `%${pattern.toLowerCase()}%`,
        ]
      );

      return { updated: result.changes };
    },

    async importAll(data: unknown) {
      const now = Date.now();

      // Support both formats:
      // - Local exportAll(): { categories, ... }
      // - API export route: { success: true, data: { categories, ... } }
      const payload =
        typeof data === 'object' && data !== null && 'data' in data
          ? (data as { data: unknown }).data
          : data;

      if (typeof payload !== 'object' || payload === null) {
        throw new Error('Invalid import payload');
      }

      const p = payload as Record<string, unknown>;

      const asArray = (value: unknown): Array<Record<string, unknown>> =>
        Array.isArray(value)
          ? (value.filter(
              (v): v is Record<string, unknown> =>
                typeof v === 'object' && v !== null
            ) as Array<Record<string, unknown>>)
          : [];

      const toMs = (value: unknown, fallback = now): number => {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string') {
          const asNum = Number(value);
          if (Number.isFinite(asNum)) return asNum;
          const parsed = Date.parse(value);
          if (!Number.isNaN(parsed)) return parsed;
        }
        return fallback;
      };

      const pick = <T>(
        row: Record<string, unknown>,
        snake: string,
        camel?: string
      ): T | undefined => {
        const v = row[snake];
        if (v !== undefined) return v as T;
        if (camel) {
          const vc = row[camel];
          if (vc !== undefined) return vc as T;
        }
        return undefined;
      };

      const users = asArray(p.users);
      const profiles = asArray(p.profiles);
      const accounts = asArray(p.accounts);
      const categories = asArray(p.categories);
      const transactions = asArray(p.transactions);
      const budgets = asArray(p.budgets);
      const categoryRules = asArray(p.categoryRules ?? p.category_rules);
      const imports = asArray(p.imports);
      const addressBook = asArray(p.addressBook ?? p.address_book);
      const contactIbans = asArray(p.contactIbans ?? p.contact_ibans);
      const sharedIbans = asArray(p.sharedIbans ?? p.shared_ibans);
      const sharedIbanMerchants = asArray(
        p.sharedIbanMerchants ?? p.shared_iban_merchants
      );
      const nameCleanupRules = asArray(
        p.nameCleanupRules ?? p.name_cleanup_rules
      );
      const paymentProviderRules = asArray(
        p.paymentProviderRules ?? p.payment_provider_rules
      );

      await db.runAsync('BEGIN');
      try {
        // Clear existing data (respect FK order)
        await db.runAsync('DELETE FROM transactions');
        await db.runAsync('DELETE FROM budgets');
        await db.runAsync('DELETE FROM category_rules');
        await db.runAsync('DELETE FROM imports');
        await db.runAsync('DELETE FROM categories');
        await db.runAsync('DELETE FROM accounts');
        await db.runAsync('DELETE FROM contact_ibans');
        await db.runAsync('DELETE FROM address_book');
        await db.runAsync('DELETE FROM shared_iban_merchants');
        await db.runAsync('DELETE FROM shared_ibans');
        await db.runAsync('DELETE FROM name_cleanup_rules');
        await db.runAsync('DELETE FROM payment_provider_rules');
        await db.runAsync('DELETE FROM profiles');
        await db.runAsync('DELETE FROM users');

        // Users
        for (const u of users) {
          await db.runAsync(
            `INSERT INTO users (id, name, avatar, updated_at, is_deleted, device_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              pick<string>(u, 'id') ?? crypto.randomUUID(),
              pick<string>(u, 'name') ?? 'Gebruiker',
              pick<string | null>(u, 'avatar') ?? null,
              toMs(pick(u, 'updated_at', 'updatedAt'), now),
              Number(pick<number>(u, 'is_deleted', 'isDeleted') ?? 0),
              pick<string | null>(u, 'device_id', 'deviceId') ?? null,
              toMs(pick(u, 'created_at', 'createdAt'), now),
            ]
          );
        }

        // Ensure at least one user exists for profiles
        const ensuredUserId = await ensureUserExists();

        // Profiles
        for (const pr of profiles) {
          await db.runAsync(
            `INSERT INTO profiles (id, user_id, name, type, avatar_url, updated_at, is_deleted, device_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              pick<string>(pr, 'id') ?? crypto.randomUUID(),
              pick<string>(pr, 'user_id', 'userId') ?? ensuredUserId,
              pick<string>(pr, 'name') ?? 'Profiel',
              pick<string>(pr, 'type') ?? 'personal',
              pick<string | null>(pr, 'avatar_url', 'avatarUrl') ?? null,
              toMs(pick(pr, 'updated_at', 'updatedAt'), now),
              Number(pick<number>(pr, 'is_deleted', 'isDeleted') ?? 0),
              pick<string | null>(pr, 'device_id', 'deviceId') ?? null,
              toMs(pick(pr, 'created_at', 'createdAt'), now),
            ]
          );
        }

        // Accounts
        for (const a of accounts) {
          await db.runAsync(
            `INSERT INTO accounts (id, iban, name, type, bank, current_balance, order_index, profile_id, updated_at, is_deleted, device_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              pick<string>(a, 'id') ?? crypto.randomUUID(),
              pick<string>(a, 'iban') ?? '',
              pick<string>(a, 'name') ?? '',
              pick<string>(a, 'type') ?? 'checking',
              pick<string>(a, 'bank') ?? 'ing',
              Number(pick<number>(a, 'current_balance', 'currentBalance') ?? 0),
              Number(pick<number>(a, 'order_index', 'orderIndex') ?? 0),
              pick<string>(a, 'profile_id', 'profileId') ??
                getActiveProfileId() ??
                pick<string>(profiles[0] ?? {}, 'id') ??
                null,
              toMs(pick(a, 'updated_at', 'updatedAt'), now),
              Number(pick<number>(a, 'is_deleted', 'isDeleted') ?? 0),
              pick<string | null>(a, 'device_id', 'deviceId') ?? null,
              toMs(pick(a, 'created_at', 'createdAt'), now),
            ]
          );
        }

        // Categories
        for (const c of categories) {
          await db.runAsync(
            `INSERT INTO categories (id, name, parent_id, icon, color, description, profile_id, updated_at, is_deleted, device_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              pick<string>(c, 'id') ?? crypto.randomUUID(),
              pick<string>(c, 'name') ?? '',
              pick<string | null>(c, 'parent_id', 'parentId') ?? null,
              pick<string | null>(c, 'icon') ?? null,
              pick<string | null>(c, 'color') ?? null,
              pick<string | null>(c, 'description') ?? null,
              pick<string>(c, 'profile_id', 'profileId') ??
                getActiveProfileId() ??
                pick<string>(profiles[0] ?? {}, 'id') ??
                null,
              toMs(pick(c, 'updated_at', 'updatedAt'), now),
              Number(pick<number>(c, 'is_deleted', 'isDeleted') ?? 0),
              pick<string | null>(c, 'device_id', 'deviceId') ?? null,
              toMs(pick(c, 'created_at', 'createdAt'), now),
            ]
          );
        }

        // Budgets
        for (const b of budgets) {
          await db.runAsync(
            `INSERT INTO budgets (id, category_id, amount, period, start_date, end_date, profile_id, updated_at, is_deleted, device_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              pick<string>(b, 'id') ?? crypto.randomUUID(),
              pick<string | null>(b, 'category_id', 'categoryId') ?? null,
              Number(pick<number>(b, 'amount') ?? 0),
              pick<string>(b, 'period') ?? 'monthly',
              pick<string | null>(b, 'start_date', 'startDate') ?? null,
              pick<string | null>(b, 'end_date', 'endDate') ?? null,
              pick<string>(b, 'profile_id', 'profileId') ??
                getActiveProfileId() ??
                pick<string>(profiles[0] ?? {}, 'id') ??
                null,
              toMs(pick(b, 'updated_at', 'updatedAt'), now),
              Number(pick<number>(b, 'is_deleted', 'isDeleted') ?? 0),
              pick<string | null>(b, 'device_id', 'deviceId') ?? null,
              toMs(pick(b, 'created_at', 'createdAt'), now),
            ]
          );
        }

        // Category rules
        for (const r of categoryRules) {
          await db.runAsync(
            `INSERT INTO category_rules (id, pattern, category_id, priority, profile_id, updated_at, is_deleted, device_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              pick<string>(r, 'id') ?? crypto.randomUUID(),
              pick<string>(r, 'pattern') ?? '',
              pick<string | null>(r, 'category_id', 'categoryId') ?? null,
              Number(pick<number>(r, 'priority') ?? 0),
              pick<string>(r, 'profile_id', 'profileId') ??
                getActiveProfileId() ??
                pick<string>(profiles[0] ?? {}, 'id') ??
                null,
              toMs(pick(r, 'updated_at', 'updatedAt'), now),
              Number(pick<number>(r, 'is_deleted', 'isDeleted') ?? 0),
              pick<string | null>(r, 'device_id', 'deviceId') ?? null,
              toMs(pick(r, 'created_at', 'createdAt'), now),
            ]
          );
        }

        // Imports
        for (const im of imports) {
          await db.runAsync(
            `INSERT INTO imports (id, filename, bank, transaction_count, status, skipped_rows, duplicates_skipped, parse_errors, profile_id, updated_at, is_deleted, device_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              pick<string>(im, 'id') ?? crypto.randomUUID(),
              pick<string>(im, 'filename') ?? '',
              pick<string>(im, 'bank') ?? 'ing',
              Number(
                pick<number>(im, 'transaction_count', 'transactionCount') ?? 0
              ),
              pick<string>(im, 'status') ?? 'completed',
              pick<string | null>(im, 'skipped_rows', 'skippedRows') ?? null,
              Number(
                pick<number>(im, 'duplicates_skipped', 'duplicatesSkipped') ?? 0
              ),
              Number(pick<number>(im, 'parse_errors', 'parseErrors') ?? 0),
              pick<string>(im, 'profile_id', 'profileId') ??
                getActiveProfileId() ??
                pick<string>(profiles[0] ?? {}, 'id') ??
                null,
              toMs(pick(im, 'updated_at', 'updatedAt'), now),
              Number(pick<number>(im, 'is_deleted', 'isDeleted') ?? 0),
              pick<string | null>(im, 'device_id', 'deviceId') ?? null,
              toMs(pick(im, 'created_at', 'createdAt'), now),
            ]
          );
        }

        // Address book
        for (const ab of addressBook) {
          await db.runAsync(
            `INSERT INTO address_book (id, iban, name, description, notes, original_name, profile_id, updated_at, is_deleted, device_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              pick<string>(ab, 'id') ?? crypto.randomUUID(),
              pick<string>(ab, 'iban') ?? '',
              pick<string>(ab, 'name') ?? '',
              pick<string | null>(ab, 'description') ?? null,
              pick<string | null>(ab, 'notes') ?? null,
              pick<string | null>(ab, 'original_name', 'originalName') ?? null,
              pick<string>(ab, 'profile_id', 'profileId') ??
                getActiveProfileId() ??
                pick<string>(profiles[0] ?? {}, 'id') ??
                null,
              toMs(pick(ab, 'updated_at', 'updatedAt'), now),
              Number(pick<number>(ab, 'is_deleted', 'isDeleted') ?? 0),
              pick<string | null>(ab, 'device_id', 'deviceId') ?? null,
              toMs(pick(ab, 'created_at', 'createdAt'), now),
            ]
          );
        }

        // Contact IBANs
        for (const ci of contactIbans) {
          await db.runAsync(
            `INSERT INTO contact_ibans (id, contact_id, iban, is_primary, updated_at, is_deleted, device_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              pick<string>(ci, 'id') ?? crypto.randomUUID(),
              pick<string | null>(ci, 'contact_id', 'contactId') ?? null,
              pick<string>(ci, 'iban') ?? '',
              Number(pick<number>(ci, 'is_primary', 'isPrimary') ?? 0),
              toMs(pick(ci, 'updated_at', 'updatedAt'), now),
              Number(pick<number>(ci, 'is_deleted', 'isDeleted') ?? 0),
              pick<string | null>(ci, 'device_id', 'deviceId') ?? null,
              toMs(pick(ci, 'created_at', 'createdAt'), now),
            ]
          );
        }

        // Shared IBANs
        for (const si of sharedIbans) {
          await db.runAsync(
            `INSERT INTO shared_ibans (id, iban, provider_name, updated_at, is_deleted, device_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              pick<string>(si, 'id') ?? crypto.randomUUID(),
              pick<string>(si, 'iban') ?? '',
              pick<string | null>(si, 'provider_name', 'providerName') ?? null,
              toMs(pick(si, 'updated_at', 'updatedAt'), now),
              Number(pick<number>(si, 'is_deleted', 'isDeleted') ?? 0),
              pick<string | null>(si, 'device_id', 'deviceId') ?? null,
              toMs(pick(si, 'created_at', 'createdAt'), now),
            ]
          );
        }

        // Shared IBAN merchants
        for (const sm of sharedIbanMerchants) {
          await db.runAsync(
            `INSERT INTO shared_iban_merchants (id, iban, original_name, display_name, notes, updated_at, is_deleted, device_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              pick<string>(sm, 'id') ?? crypto.randomUUID(),
              pick<string>(sm, 'iban') ?? '',
              pick<string>(sm, 'original_name', 'originalName') ?? '',
              pick<string>(sm, 'display_name', 'displayName') ?? '',
              pick<string | null>(sm, 'notes') ?? null,
              toMs(pick(sm, 'updated_at', 'updatedAt'), now),
              Number(pick<number>(sm, 'is_deleted', 'isDeleted') ?? 0),
              pick<string | null>(sm, 'device_id', 'deviceId') ?? null,
              toMs(pick(sm, 'created_at', 'createdAt'), now),
            ]
          );
        }

        // Name cleanup rules
        for (const nr of nameCleanupRules) {
          await db.runAsync(
            `INSERT INTO name_cleanup_rules (id, pattern, profile_id, is_active, updated_at, is_deleted, device_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              pick<string>(nr, 'id') ?? crypto.randomUUID(),
              pick<string>(nr, 'pattern') ?? '',
              pick<string | null>(nr, 'profile_id', 'profileId') ?? null,
              Number(pick<number>(nr, 'is_active', 'isActive') ?? 1),
              toMs(pick(nr, 'updated_at', 'updatedAt'), now),
              Number(pick<number>(nr, 'is_deleted', 'isDeleted') ?? 0),
              pick<string | null>(nr, 'device_id', 'deviceId') ?? null,
              toMs(pick(nr, 'created_at', 'createdAt'), now),
            ]
          );
        }

        // Payment provider rules
        for (const pr of paymentProviderRules) {
          await db.runAsync(
            `INSERT INTO payment_provider_rules (id, name, patterns, profile_id, updated_at, is_deleted, device_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              pick<string>(pr, 'id') ?? crypto.randomUUID(),
              pick<string>(pr, 'name') ?? '',
              pick<string>(pr, 'patterns') ?? '',
              pick<string | null>(pr, 'profile_id', 'profileId') ?? null,
              toMs(pick(pr, 'updated_at', 'updatedAt'), now),
              Number(pick<number>(pr, 'is_deleted', 'isDeleted') ?? 0),
              pick<string | null>(pr, 'device_id', 'deviceId') ?? null,
              toMs(pick(pr, 'created_at', 'createdAt'), now),
            ]
          );
        }

        // Transactions (must come after accounts/categories)
        for (const t of transactions) {
          await db.runAsync(
            `INSERT INTO transactions (
              id,
              date,
              amount,
              type,
              description,
              merchant_name,
              account_id,
              opposing_account_iban,
              opposing_account_name,
              category_id,
              notes,
              balance_after,
              payment_method,
              payment_provider,
              address_book_id,
              raw_data,
              import_hash,
              profile_id,
              updated_at,
              is_deleted,
              device_id,
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              pick<string>(t, 'id') ?? crypto.randomUUID(),
              pick<string>(t, 'date') ?? '',
              Number(pick<number>(t, 'amount') ?? 0),
              pick<string>(t, 'type') ?? 'expense',
              pick<string | null>(t, 'description') ?? null,
              pick<string | null>(t, 'merchant_name', 'merchantName') ?? null,
              pick<string | null>(t, 'account_id', 'accountId') ?? null,
              pick<string | null>(
                t,
                'opposing_account_iban',
                'opposingAccountIban'
              ) ?? null,
              pick<string | null>(
                t,
                'opposing_account_name',
                'opposingAccountName'
              ) ?? null,
              pick<string | null>(t, 'category_id', 'categoryId') ?? null,
              pick<string | null>(t, 'notes') ?? null,
              pick<number | null>(t, 'balance_after', 'balanceAfter') ?? null,
              pick<string | null>(t, 'payment_method', 'paymentMethod') ?? null,
              pick<string | null>(t, 'payment_provider', 'paymentProvider') ??
                null,
              pick<string | null>(t, 'address_book_id', 'addressBookId') ??
                null,
              pick<string | null>(t, 'raw_data', 'rawData') ?? null,
              pick<string | null>(t, 'import_hash', 'importHash') ?? null,
              pick<string>(t, 'profile_id', 'profileId') ??
                getActiveProfileId() ??
                pick<string>(profiles[0] ?? {}, 'id') ??
                null,
              toMs(pick(t, 'updated_at', 'updatedAt'), now),
              Number(pick<number>(t, 'is_deleted', 'isDeleted') ?? 0),
              pick<string | null>(t, 'device_id', 'deviceId') ?? null,
              toMs(pick(t, 'created_at', 'createdAt'), now),
            ]
          );
        }

        await db.runAsync('COMMIT');

        return {
          success: true,
          categoryRulesSkipped: [],
        };
      } catch (err) {
        await db.runAsync('ROLLBACK');
        throw err;
      }
    },
  };
}

export type DataService = ReturnType<typeof createDataService>;
