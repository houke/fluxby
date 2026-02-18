import { Router } from 'express';
import { query, queryOne, run } from '../db/index.js';
import type { Transaction, TransactionFilters } from '@fluxby/shared';
import { getTransactions } from '../services/analytics.js';
import {
  getEffectiveProfileId,
  // verifyTransactionProfile is available for future use
} from '../middleware/profileAuth.js';

const router = Router();

interface DBTransaction {
  id: number;
  date: string;
  amount: number;
  type: string;
  description: string;
  merchant_name: string | null;
  account_id: number;
  opposing_account_iban: string | null;
  opposing_account_name: string | null;
  category_id: number | null;
  notes: string | null;
  payment_method: string | null;
  raw_data: string | null;
  import_hash: string;
  created_at: string;
  address_book_id: number | null;
  payment_provider: string | null;
}

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Haal alle transacties op met filters
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Startdatum (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Einddatum (YYYY-MM-DD)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense, transfer]
 *         description: Type transactie
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Filter op categorie ID
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: integer
 *         description: Filter op rekening ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Zoekterm voor omschrijving/merchant
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Minimum bedrag
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Maximum bedrag
 *       - in: query
 *         name: opposingAccountIbans
 *         schema:
 *           type: string
 *         description: Filter op tegenrekening IBAN(s), comma-separated
 *     responses:
 *       200:
 *         description: Lijst met transacties
 *       500:
 *         description: Server error
 */
router.get('/', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);

    const filters: TransactionFilters = {
      profileId: String(profileId), // Filter transactions by profile for data isolation
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      minAmount: req.query.minAmount
        ? parseFloat(req.query.minAmount as string)
        : undefined,
      maxAmount: req.query.maxAmount
        ? parseFloat(req.query.maxAmount as string)
        : undefined,
      type: req.query.type as 'income' | 'expense' | 'transfer' | undefined,
      categoryId: req.query.categoryId
        ? (req.query.categoryId as string)
        : undefined,
      categoryIds: req.query.categoryIds
        ? (req.query.categoryIds as string).split(',')
        : undefined,
      accountId: req.query.accountId
        ? (req.query.accountId as string)
        : undefined,
      search: req.query.search as string | undefined,
      opposingAccountIban: req.query.opposingAccountIban as string | undefined,
      opposingAccountIbans: req.query.opposingAccountIbans
        ? (req.query.opposingAccountIbans as string).split(',')
        : undefined,
      opposingAccountName: req.query.opposingAccountName as string | undefined,
      paymentMethods: req.query.paymentMethods
        ? (req.query.paymentMethods as string).split(',')
        : undefined,
      paymentProviders: req.query.paymentProviders
        ? (req.query.paymentProviders as string).split(',')
        : undefined,
      addressBookId: req.query.addressBookId
        ? (req.query.addressBookId as string)
        : undefined,
      limit: req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined,
      offset: req.query.offset
        ? parseInt(req.query.offset as string, 10)
        : undefined,
    };

    const { transactions, total } = getTransactions(filters);
    res.json({
      success: true,
      data: transactions,
      total,
      limit: filters.limit,
      offset: filters.offset,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch transactions' });
  }
});

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Haal een specifieke transactie op
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transactie ID
 *     responses:
 *       200:
 *         description: Transactie details
 *       404:
 *         description: Transactie niet gevonden
 *       500:
 *         description: Server error
 */
router.get('/:id', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    const id = parseInt(req.params.id);

    // Security: Verify transaction belongs to profile via account
    const row = queryOne<DBTransaction>(
      `SELECT t.* FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       WHERE t.id = ? AND a.profile_id = ?`,
      [id, profileId]
    );

    if (!row) {
      return res
        .status(404)
        .json({ success: false, error: 'Transaction not found' });
    }

    const transaction: Transaction = {
      id: String(row.id),
      date: row.date,
      amount: row.amount,
      type: row.type as 'income' | 'expense' | 'transfer',
      description: row.description,
      merchantName: row.merchant_name,
      accountId: String(row.account_id),
      opposingAccountIban: row.opposing_account_iban,
      opposingAccountName: row.opposing_account_name,
      categoryId: row.category_id != null ? String(row.category_id) : null,
      notes: row.notes,
      paymentMethod: row.payment_method,
      rawData: row.raw_data,
      importHash: row.import_hash,
      createdAt: row.created_at,
      paymentProvider: row.payment_provider, // Use stored value
      addressBookId:
        row.address_book_id != null ? String(row.address_book_id) : null,
    };

    res.json({ success: true, data: transaction });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch transaction' });
  }
});

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - amount
 *               - type
 *               - accountId
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [income, expense, transfer]
 *               description:
 *                 type: string
 *               accountId:
 *                 type: integer
 *               merchantName:
 *                 type: string
 *               categoryId:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */
router.post('/', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    const {
      date,
      amount,
      type,
      description,
      accountId,
      merchantName,
      categoryId,
      notes,
    } = req.body;

    if (!date || amount === undefined || !type || !accountId) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing required fields' });
    }

    // Verify account belongs to profile
    const account = queryOne<{ id: number; profile_id: number }>(
      'SELECT id, profile_id FROM accounts WHERE id = ?',
      [accountId]
    );

    if (!account) {
      return res
        .status(404)
        .json({ success: false, error: 'Account not found' });
    }

    if (account.profile_id !== profileId) {
      return res.status(403).json({
        success: false,
        error: 'Account belongs to different profile',
      });
    }

    // Verify category if provided
    if (categoryId) {
      const category = queryOne<{ id: number; profile_id: number }>(
        'SELECT id, profile_id FROM categories WHERE id = ?',
        [categoryId]
      );
      if (!category) {
        return res
          .status(400)
          .json({ success: false, error: 'Category not found' });
      }
      if (category.profile_id !== profileId) {
        return res.status(403).json({
          success: false,
          error: 'Category belongs to different profile',
        });
      }
    }

    // Insert transaction
    const result = run(
      `INSERT INTO transactions (
        date, amount, type, description, account_id, merchant_name, 
        category_id, notes, profile_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        date,
        amount,
        type,
        description || '',
        accountId,
        merchantName || null,
        categoryId || null,
        notes || null,
        profileId,
      ]
    );

    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to create transaction' });
  }
});

/**
 * @swagger
 * /api/transactions/{id}:
 *   patch:
 *     summary: Update een transactie (type, categorie, notities, betaalmethode, adresboek, betaalplatform)
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transactie ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [income, expense, transfer]
 *                 description: Transactie type (income, expense, transfer). Gebruik 'transfer' voor interne overboekingen tussen eigen rekeningen.
 *               categoryId:
 *                 type: integer
 *                 description: Nieuwe categorie ID
 *               notes:
 *                 type: string
 *                 description: Notities
 *               merchantName:
 *                 type: string
 *                 description: Aangepaste label/merchant naam
 *               paymentMethod:
 *                 type: string
 *                 description: Betaalmethode (pin, ideal, overschrijving, incasso, geldautomaat)
 *               addressBookId:
 *                 type: integer
 *                 description: Adresboek entry ID om transactie aan te koppelen
 *               paymentProvider:
 *                 type: string
 *                 description: Betaalplatform naam (bijv. iDEAL, Adyen, Mollie)
 *     responses:
 *       200:
 *         description: Transactie bijgewerkt
 *       400:
 *         description: Geen velden om te updaten of ongeldig type
 *       500:
 *         description: Server error
 */
router.patch('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      categoryId,
      notes,
      merchantName,
      paymentMethod,
      addressBookId,
      paymentProvider,
      type,
    } = req.body;

    const updates: string[] = [];
    const params: unknown[] = [];

    // Allow explicitly setting the type (income, expense, transfer)
    if (type !== undefined) {
      if (!['income', 'expense', 'transfer'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid type. Must be income, expense, or transfer',
        });
      }
      updates.push('type = ?');
      params.push(type);

      // If marking as transfer, also assign to Overboekingen category (id=10) if not already categorized
      if (type === 'transfer') {
        const currentTx = queryOne<{ category_id: number | null }>(
          'SELECT category_id FROM transactions WHERE id = ?',
          [id]
        );
        if (!currentTx?.category_id) {
          updates.push('category_id = ?');
          params.push(10);
        }
      }
    }

    if (categoryId !== undefined) {
      updates.push('category_id = ?');
      params.push(categoryId);

      // If assigning to Overboekingen category (id=10), also set type to transfer
      // If removing from Overboekingen category, we don't change type back (user may want to keep it)
      if (categoryId === 10) {
        updates.push('type = ?');
        params.push('transfer');
      }
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (paymentMethod !== undefined) {
      updates.push('payment_method = ?');
      params.push(paymentMethod === '' ? null : paymentMethod);
    }

    if (merchantName !== undefined) {
      const newMerchantName = merchantName === '' ? null : merchantName;
      updates.push('merchant_name = ?');
      params.push(newMerchantName);
      // Note: We only update THIS transaction's merchant_name.
      // Use /rename-by-counterparty for bulk renaming with strict matching.
    }

    if (addressBookId !== undefined) {
      // Allow null to unlink, or a valid ID to link
      updates.push('address_book_id = ?');
      params.push(
        addressBookId === null || addressBookId === 0 ? null : addressBookId
      );
    }

    if (paymentProvider !== undefined) {
      // Allow null to clear, or a string value to set
      updates.push('payment_provider = ?');
      params.push(paymentProvider === '' ? null : paymentProvider);
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: 'No fields to update' });
    }

    params.push(id);
    run(`UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to update transaction' });
  }
});

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Verwijder een transactie
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transactie ID
 *     responses:
 *       200:
 *         description: Transactie verwijderd
 *       500:
 *         description: Server error
 */
router.delete('/:id', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    const id = parseInt(req.params.id);

    // Security: Verify transaction belongs to profile before deletion
    const tx = queryOne<{ id: number }>(
      `SELECT t.id FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       WHERE t.id = ? AND a.profile_id = ?`,
      [id, profileId]
    );

    if (!tx) {
      return res
        .status(404)
        .json({ success: false, error: 'Transaction not found' });
    }

    run('DELETE FROM transactions WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to delete transaction' });
  }
});

/**
 * @swagger
 * /api/transactions:
 *   delete:
 *     summary: Verwijder alle transacties
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: Alle transacties verwijderd
 *       500:
 *         description: Server error
 */
router.delete('/', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);

    // Delete transactions for accounts belonging to this profile
    const result = run(
      `DELETE FROM transactions WHERE account_id IN (SELECT id FROM accounts WHERE profile_id = ?)`,
      [profileId]
    );

    // Note: imports table doesn't track account_id, so we don't delete import records here.
    // Import records are informational and don't need per-profile cleanup.

    res.json({ success: true, deleted: result.changes });
  } catch (error) {
    console.error('Error deleting all transactions:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to delete transactions' });
  }
});

/**
 * Helper to validate ISO 8601 date format (YYYY-MM-DD)
 */
function isValidDateFormat(dateStr: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Validate date is not in the future and not more than 10 years ago
 */
function isValidDateRange(dateStr: string): {
  valid: boolean;
  error?: string;
} {
  const date = new Date(dateStr);
  const now = new Date();
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

  if (date > now) {
    return { valid: false, error: 'Date cannot be in the future' };
  }
  if (date < tenYearsAgo) {
    return { valid: false, error: 'Date cannot be more than 10 years ago' };
  }
  return { valid: true };
}

/**
 * Recalculate account balance based on latest transaction with balance_after
 */
function recalculateAccountBalance(
  accountId: number,
  profileId: number
): { previousBalance: number; newBalance: number } {
  // Get current balance
  const account = queryOne<{ current_balance: number }>(
    'SELECT current_balance FROM accounts WHERE id = ? AND profile_id = ?',
    [accountId, profileId]
  );
  const previousBalance = account?.current_balance ?? 0;

  // Find latest transaction with balance_after
  const latestTx = queryOne<{ balance_after: number }>(
    `SELECT balance_after FROM transactions 
     WHERE account_id = ? AND balance_after IS NOT NULL 
     ORDER BY date DESC, id DESC LIMIT 1`,
    [accountId]
  );
  const newBalance = latestTx?.balance_after ?? 0;

  // Update account balance
  run(
    'UPDATE accounts SET current_balance = ? WHERE id = ? AND profile_id = ?',
    [newBalance, accountId, profileId]
  );

  return { previousBalance, newBalance };
}

/**
 * @swagger
 * /api/transactions/bulk:
 *   delete:
 *     summary: Bulk delete transactions
 *     description: |
 *       Delete multiple transactions at once. Provide either transactionIds (specific IDs)
 *       or dateRange (delete all in range). Account balances are automatically recalculated.
 *     tags: [Transactions]
 *     security:
 *       - ProfileAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific transaction IDs to delete (max 1000)
 *               dateRange:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                     format: date
 *                     description: Start date (YYYY-MM-DD)
 *                   end:
 *                     type: string
 *                     format: date
 *                     description: End date (YYYY-MM-DD)
 *               accountId:
 *                 type: string
 *                 description: Limit deletion to specific account
 *               dryRun:
 *                 type: boolean
 *                 description: If true, return count without deleting
 *     responses:
 *       200:
 *         description: Deletion successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 deleted:
 *                   type: integer
 *                 affectedAccounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                 balancesUpdated:
 *                   type: boolean
 *       400:
 *         description: Invalid request - missing criteria or validation failed
 *       403:
 *         description: Access denied - resource belongs to different profile
 *       500:
 *         description: Server error
 */
router.delete('/bulk', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    const { transactionIds, dateRange, accountId, dryRun } = req.body;

    // Validate: at least one criterion required
    if (!transactionIds && !dateRange) {
      return res.status(400).json({
        success: false,
        error: 'Either transactionIds or dateRange is required',
      });
    }

    // Validate transactionIds if provided
    if (transactionIds) {
      if (!Array.isArray(transactionIds)) {
        return res.status(400).json({
          success: false,
          error: 'transactionIds must be an array',
        });
      }
      // Security: Reject empty arrays to prevent accidental deletion of all transactions
      if (transactionIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'transactionIds array cannot be empty',
        });
      }
      if (transactionIds.length > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 1000 transaction IDs per request',
        });
      }
      // Validate all IDs are valid
      for (const id of transactionIds) {
        if (typeof id !== 'string' && typeof id !== 'number') {
          return res.status(400).json({
            success: false,
            error: 'All transaction IDs must be strings or numbers',
          });
        }
      }
    }

    // Validate dateRange if provided
    if (dateRange) {
      if (!dateRange.start || !dateRange.end) {
        return res.status(400).json({
          success: false,
          error: 'dateRange requires both start and end dates',
        });
      }
      if (!isValidDateFormat(dateRange.start)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid start date format. Use YYYY-MM-DD',
        });
      }
      if (!isValidDateFormat(dateRange.end)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid end date format. Use YYYY-MM-DD',
        });
      }
      const startValidation = isValidDateRange(dateRange.start);
      if (!startValidation.valid) {
        return res.status(400).json({
          success: false,
          error: `Start date: ${startValidation.error}`,
        });
      }
      const endValidation = isValidDateRange(dateRange.end);
      if (!endValidation.valid) {
        return res.status(400).json({
          success: false,
          error: `End date: ${endValidation.error}`,
        });
      }
      if (dateRange.start > dateRange.end) {
        return res.status(400).json({
          success: false,
          error: 'Start date must be before or equal to end date',
        });
      }
    }

    // Validate accountId belongs to profile if provided
    if (accountId) {
      const account = queryOne<{ id: number }>(
        'SELECT id FROM accounts WHERE id = ? AND profile_id = ?',
        [accountId, profileId]
      );
      if (!account) {
        return res.status(403).json({
          success: false,
          error: 'Account not found or belongs to different profile',
        });
      }
    }

    // Build query to find matching transactions
    const conditions: string[] = [
      'account_id IN (SELECT id FROM accounts WHERE profile_id = ?)',
    ];
    const params: unknown[] = [profileId];

    if (transactionIds && transactionIds.length > 0) {
      const placeholders = transactionIds.map(() => '?').join(',');
      conditions.push(`id IN (${placeholders})`);
      params.push(...transactionIds);
    }

    if (dateRange) {
      conditions.push('date >= ? AND date <= ?');
      params.push(dateRange.start, dateRange.end);
    }

    if (accountId) {
      conditions.push('account_id = ?');
      params.push(accountId);
    }

    const whereClause = conditions.join(' AND ');

    // Verify all transactionIds belong to profile (if using IDs)
    if (transactionIds && transactionIds.length > 0) {
      const countResult = queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM transactions WHERE ${whereClause}`,
        params
      );
      if (countResult && countResult.count !== transactionIds.length) {
        return res.status(403).json({
          success: false,
          error: 'Some transaction IDs do not belong to this profile',
        });
      }
    }

    // Get affected account IDs before deletion
    const affectedAccountRows = query<{ account_id: number }>(
      `SELECT DISTINCT account_id FROM transactions WHERE ${whereClause}`,
      params
    );
    const affectedAccountIds = affectedAccountRows.map((r) =>
      String(r.account_id)
    );

    // Get count for dry run or actual deletion
    const countResult = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM transactions WHERE ${whereClause}`,
      params
    );
    const deleteCount = countResult?.count ?? 0;

    if (dryRun) {
      return res.json({
        success: true,
        deleted: deleteCount,
        affectedAccounts: affectedAccountIds,
        balancesUpdated: false,
        dryRun: true,
      });
    }

    // Perform deletion (hard delete for API)
    const result = run(`DELETE FROM transactions WHERE ${whereClause}`, params);

    // Recalculate balances for affected accounts
    for (const accountIdStr of affectedAccountIds) {
      recalculateAccountBalance(parseInt(accountIdStr, 10), profileId);
    }

    res.json({
      success: true,
      deleted: result.changes,
      affectedAccounts: affectedAccountIds,
      balancesUpdated: affectedAccountIds.length > 0,
    });
  } catch (error) {
    console.error('Error bulk deleting transactions:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to bulk delete transactions' });
  }
});

// Categorize by opposing account name
/**
 * @swagger
 * /api/transactions/categorize-by-counterparty:
 *   post:
 *     summary: Categoriseer alle transacties van dezelfde tegenpartij
 *     description: Past de categorie toe op alle transacties met dezelfde tegenrekening naam
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionId
 *               - categoryId
 *             properties:
 *               transactionId:
 *                 type: integer
 *                 description: ID van de transactie om de tegenpartij van te gebruiken
 *               categoryId:
 *                 type: integer
 *                 description: ID van de categorie om toe te passen
 *     responses:
 *       200:
 *         description: Transacties succesvol gecategoriseerd
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 updated:
 *                   type: integer
 *                   description: Aantal bijgewerkte transacties
 *                 counterparty:
 *                   type: string
 *                   description: Naam van de tegenpartij
 *       404:
 *         description: Transactie niet gevonden
 *       400:
 *         description: Transactie heeft geen tegenpartij
 *       500:
 *         description: Server error
 */
router.post('/categorize-by-counterparty', (req, res) => {
  try {
    const { transactionId, categoryId } = req.body;

    // Get the transaction to find the opposing account name and current category
    const tx = queryOne<{
      opposing_account_name: string | null;
      category_id: number | null;
    }>(
      'SELECT opposing_account_name, category_id FROM transactions WHERE id = ?',
      [transactionId]
    );

    if (!tx) {
      return res
        .status(404)
        .json({ success: false, error: 'Transaction not found' });
    }

    // If assigning to Overboekingen category (id=10), also set type to transfer
    const extraUpdate = categoryId === 10 ? ', type = ?' : '';
    const extraParams = categoryId === 10 ? ['transfer'] : [];

    // If transaction already has a category, only update this specific transaction
    // (don't apply to related transactions - user is explicitly changing just this one)
    if (tx.category_id !== null) {
      run(
        `UPDATE transactions SET category_id = ?${extraUpdate} WHERE id = ?`,
        [categoryId, ...extraParams, transactionId]
      );
      return res.json({ success: true, updated: 1, counterparty: null });
    }

    if (!tx.opposing_account_name) {
      // No counterparty, just update the single transaction
      run(
        `UPDATE transactions SET category_id = ?${extraUpdate} WHERE id = ?`,
        [categoryId, ...extraParams, transactionId]
      );
      return res.json({ success: true, updated: 1, counterparty: null });
    }

    // Update all UNCATEGORIZED transactions with the same opposing account name
    const result = run(
      `UPDATE transactions SET category_id = ?${extraUpdate} WHERE opposing_account_name = ? AND category_id IS NULL`,
      [categoryId, ...extraParams, tx.opposing_account_name]
    );

    res.json({
      success: true,
      updated: result.changes,
      counterparty: tx.opposing_account_name,
    });
  } catch (error) {
    console.error('Error categorizing by counterparty:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to categorize transactions' });
  }
});

/**
 * @swagger
 * /api/transactions/rename-by-counterparty:
 *   post:
 *     summary: Hernoem merchant/tegenpartij voor gerelateerde transacties
 *     description: Hernoem alle transacties met dezelfde tegenpartij (opposing IBAN of opposing name) naar een nieuwe merchant naam
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionId
 *               - merchantName
 *             properties:
 *               transactionId:
 *                 type: integer
 *               merchantName:
 *                 type: string
 *                 description: Nieuwe merchant naam
 *     responses:
 *       200:
 *         description: Transacties hernoemd
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 updated:
 *                   type: integer
 *       400:
 *         description: Ongeldige parameters
 *       500:
 *         description: Server error
 */
router.post('/rename-by-counterparty', (req, res) => {
  try {
    const { transactionId, merchantName } = req.body;

    if (
      !transactionId ||
      (merchantName !== null && typeof merchantName !== 'string')
    ) {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid parameters' });
    }

    // Get more transaction details for strict matching
    const tx = queryOne<{
      id: number;
      opposing_account_iban: string | null;
      opposing_account_name: string | null;
      merchant_name: string | null;
      category_id: number | null;
      description: string | null;
    }>(
      'SELECT id, opposing_account_iban, opposing_account_name, merchant_name, category_id, description FROM transactions WHERE id = ?',
      [transactionId]
    );

    if (!tx) {
      return res
        .status(404)
        .json({ success: false, error: 'Transaction not found' });
    }

    let result;

    // STRICT MATCHING LOGIC:
    // We only rename transactions that match on ALL of these criteria:
    // 1. Same opposing_account_iban (if exists)
    // 2. Same opposing_account_name (if exists)
    // 3. Same category_id (important: only affect transactions in same category)
    // 4. If there's an address book entry for this IBAN, use that as additional context

    // Check if this IBAN has an address book entry
    let addressBookId: number | null = null;
    if (tx.opposing_account_iban) {
      const addressBookEntry = queryOne<{ id: number }>(
        `SELECT ab.id FROM address_book ab 
         LEFT JOIN contact_ibans ci ON ci.contact_id = ab.id
         WHERE ab.iban = ? OR ci.iban = ?`,
        [tx.opposing_account_iban, tx.opposing_account_iban]
      );
      addressBookId = addressBookEntry?.id || null;
    }

    if (tx.opposing_account_iban && tx.opposing_account_name) {
      // Best case: match by IBAN + original opposing account name + category
      const originalName = tx.opposing_account_name;

      // Build WHERE clause with strict matching
      const conditions: string[] = [
        'opposing_account_iban = ?',
        'opposing_account_name = ?',
      ];
      const params: (string | number | null)[] = [
        merchantName,
        tx.opposing_account_iban,
        originalName,
      ];

      // Also match category if set (this is key to the stricter logic)
      if (tx.category_id !== null) {
        conditions.push('category_id = ?');
        params.push(tx.category_id);
      }

      result = run(
        `UPDATE transactions SET merchant_name = ? 
         WHERE ${conditions.join(' AND ')}`,
        params
      );
    } else if (tx.opposing_account_iban) {
      // Has IBAN but no opposing account name - only update this exact transaction
      // This is safer than updating all transactions with this IBAN
      result = run('UPDATE transactions SET merchant_name = ? WHERE id = ?', [
        merchantName,
        transactionId,
      ]);
    } else if (tx.opposing_account_name && tx.category_id !== null) {
      // No IBAN but has opposing account name AND category - match on both
      result = run(
        `UPDATE transactions SET merchant_name = ? 
         WHERE opposing_account_name = ? AND category_id = ?`,
        [merchantName, tx.opposing_account_name, tx.category_id]
      );
    } else if (tx.opposing_account_name) {
      // Only opposing account name (no category) - just update this transaction
      // Don't propagate to avoid accidental mass updates
      result = run('UPDATE transactions SET merchant_name = ? WHERE id = ?', [
        merchantName,
        transactionId,
      ]);
    } else {
      // Nothing to match on - just update this single transaction
      result = run('UPDATE transactions SET merchant_name = ? WHERE id = ?', [
        merchantName,
        transactionId,
      ]);
    }

    // NOTE: We no longer automatically update address book entries.
    // The address book name should be managed separately through the AddressBook page.

    res.json({
      success: true,
      updated: result.changes,
      addressBookId, // Return this so frontend can offer to update address book separately if needed
    });
  } catch (error) {
    console.error('Error renaming by counterparty:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to rename transactions' });
  }
});

// Bulk update category
/**
 * @swagger
 * /api/transactions/bulk-categorize:
 *   post:
 *     summary: Bulk categoriseer meerdere transacties
 *     description: Pas dezelfde categorie toe op meerdere transacties tegelijk
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionIds
 *               - categoryId
 *             properties:
 *               transactionIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array van transactie IDs om te categoriseren
 *               categoryId:
 *                 type: integer
 *                 description: ID van de categorie om toe te passen
 *     responses:
 *       200:
 *         description: Transacties succesvol gecategoriseerd
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 updated:
 *                   type: integer
 *       400:
 *         description: Ongeldige transactie IDs
 *       500:
 *         description: Server error
 */
router.post('/bulk-categorize', (req, res) => {
  try {
    const { transactionIds, categoryId } = req.body;

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid transaction IDs' });
    }

    const placeholders = transactionIds.map(() => '?').join(',');
    run(
      `UPDATE transactions SET category_id = ? WHERE id IN (${placeholders})`,
      [categoryId, ...transactionIds]
    );

    res.json({ success: true, updated: transactionIds.length });
  } catch (error) {
    console.error('Error bulk categorizing:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to bulk categorize' });
  }
});

/**
 * @swagger
 * /api/transactions/reset-merchant-names:
 *   post:
 *     summary: Reset alle merchant_name velden naar NULL
 *     description: >
 *       Zet alle merchant_name velden terug naar NULL zodat transacties
 *       weer hun originele beschrijving (opposing_account_name) tonen.
 *       Dit is een bulk operatie die niet ongedaan kan worden gemaakt.
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: Merchant names gereset
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 updated:
 *                   type: integer
 *                   description: Aantal transacties waarvan merchant_name is gereset
 */
router.post('/reset-merchant-names', (_req, res) => {
  try {
    const result = run(
      'UPDATE transactions SET merchant_name = NULL WHERE merchant_name IS NOT NULL'
    );

    res.json({
      success: true,
      updated: result.changes,
    });
  } catch (error) {
    console.error('Error resetting merchant names:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to reset merchant names' });
  }
});

/**
 * Apply cleanup rules to a name string
 * Supports both literal strings and regex patterns
 * Regex patterns must be in format: /pattern/flags
 * Patterns ending with * are treated as wildcards (e.g., 'SumUp *' matches 'SumUp anything')
 */
function applyCleanupRules(name: string, rules: { pattern: string }[]): string {
  let cleaned = name;
  for (const rule of rules) {
    // Try to parse as regex first (if pattern starts/ends with /)
    if (rule.pattern.startsWith('/') && rule.pattern.lastIndexOf('/') > 0) {
      try {
        const lastSlash = rule.pattern.lastIndexOf('/');
        const pattern = rule.pattern.slice(1, lastSlash);
        const flags = rule.pattern.slice(lastSlash + 1) || 'gi';
        const regex = new RegExp(pattern, flags);
        cleaned = cleaned.replace(regex, '').trim();
      } catch {
        // If regex fails, treat as literal string
        cleaned = cleaned.split(rule.pattern).join('').trim();
      }
    } else {
      // For literal patterns, use case-insensitive global replacement
      // Pattern 'SumUp *' matches the literal string 'SumUp *'
      const escapedPattern = rule.pattern.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );
      cleaned = cleaned.replace(new RegExp(escapedPattern, 'gi'), '').trim();
    }
  }
  // Clean up multiple spaces
  return cleaned.replace(/\s+/g, ' ').trim() || name;
}

/**
 * @swagger
 * /api/transactions/apply-cleanup-rules:
 *   post:
 *     summary: Pas naam opschoon regels toe op alle transacties
 *     description: Update opposing_account_name en merchant_name met opgeschoonde namen
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: Aantal transacties bijgewerkt
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
 *                     opposingNamesUpdated:
 *                       type: integer
 *                     merchantNamesUpdated:
 *                       type: integer
 */
router.post('/apply-cleanup-rules', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);

    // Get all active cleanup rules
    const rules = query<{ pattern: string }>(
      'SELECT pattern FROM name_cleanup_rules WHERE is_active = 1'
    );

    if (rules.length === 0) {
      return res.json({
        success: true,
        data: { opposingNamesUpdated: 0, merchantNamesUpdated: 0 },
      });
    }

    // Get all transactions with names to clean for the current profile
    const transactions = query<{
      id: number;
      opposing_account_name: string | null;
      merchant_name: string | null;
    }>(
      `SELECT t.id, t.opposing_account_name, t.merchant_name 
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       WHERE a.profile_id = ?`,
      [profileId]
    );

    // Group transactions by their original -> cleaned name transformations
    // This way we can do one UPDATE for all transactions with the same transformation
    const opposingUpdates = new Map<
      string,
      { cleaned: string; ids: number[] }
    >();
    const merchantUpdates = new Map<
      string,
      { cleaned: string; ids: number[] }
    >();

    for (const tx of transactions) {
      // Clean opposing_account_name
      if (tx.opposing_account_name) {
        const cleanedOpposing = applyCleanupRules(
          tx.opposing_account_name,
          rules
        );
        if (
          cleanedOpposing !== tx.opposing_account_name &&
          cleanedOpposing.length > 0
        ) {
          const key = `${tx.opposing_account_name}|${cleanedOpposing}`;
          const existing = opposingUpdates.get(key);
          if (existing) {
            existing.ids.push(tx.id);
          } else {
            opposingUpdates.set(key, {
              cleaned: cleanedOpposing,
              ids: [tx.id],
            });
          }
        }
      }

      // Clean merchant_name
      if (tx.merchant_name) {
        const cleanedMerchant = applyCleanupRules(tx.merchant_name, rules);
        if (
          cleanedMerchant !== tx.merchant_name &&
          cleanedMerchant.length > 0
        ) {
          const key = `${tx.merchant_name}|${cleanedMerchant}`;
          const existing = merchantUpdates.get(key);
          if (existing) {
            existing.ids.push(tx.id);
          } else {
            merchantUpdates.set(key, {
              cleaned: cleanedMerchant,
              ids: [tx.id],
            });
          }
        }
      }
    }

    let opposingNamesUpdated = 0;
    let merchantNamesUpdated = 0;

    // Batch update opposing names - one UPDATE per unique transformation
    // Use batches of 500 IDs per query to avoid SQL parameter limits
    const BATCH_SIZE = 500;
    for (const { cleaned, ids } of opposingUpdates.values()) {
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batchIds = ids.slice(i, i + BATCH_SIZE);
        const placeholders = batchIds.map(() => '?').join(',');
        const result = run(
          `UPDATE transactions SET opposing_account_name = ? WHERE id IN (${placeholders})`,
          [cleaned, ...batchIds]
        );
        opposingNamesUpdated += result.changes;
      }
    }

    // Batch update merchant names
    for (const { cleaned, ids } of merchantUpdates.values()) {
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batchIds = ids.slice(i, i + BATCH_SIZE);
        const placeholders = batchIds.map(() => '?').join(',');
        const result = run(
          `UPDATE transactions SET merchant_name = ? WHERE id IN (${placeholders})`,
          [cleaned, ...batchIds]
        );
        merchantNamesUpdated += result.changes;
      }
    }

    res.json({
      success: true,
      data: { opposingNamesUpdated, merchantNamesUpdated },
    });
  } catch (error) {
    console.error('Error applying cleanup rules to transactions:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to apply cleanup rules' });
  }
});

/**
 * @swagger
 * /api/transactions/detect-internal-transfers:
 *   post:
 *     summary: Detecteer en markeer interne overboekingen
 *     description: >
 *       Scan alle transacties en markeer transacties als interne overboeking
 *       wanneer de tegenrekening (IBAN) overeenkomt met een eigen rekening,
 *       of wanneer de naam overeenkomt met een spaarrekening.
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: Aantal gedetecteerde overboekingen
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
 *                     markedAsTransfer:
 *                       type: integer
 *                       description: Aantal transacties gemarkeerd als overboeking
 */
router.post('/detect-internal-transfers', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    let markedAsTransfer = 0;

    // Get the "Overboekingen" category ID (or "Internal transfers" in English)
    const transferCategory = queryOne<{ id: number }>(
      `SELECT id FROM categories 
       WHERE profile_id = ? 
       AND (LOWER(name) = 'overboekingen' OR LOWER(name) = 'internal transfers')
       AND parent_id IS NOT NULL`,
      [profileId]
    );
    const transferCategoryId = transferCategory?.id || null;

    // Get all account IBANs for this profile
    const ownAccounts = query<{ iban: string }>(
      'SELECT iban FROM accounts WHERE profile_id = ?',
      [profileId]
    );
    const ownIbans = new Set(
      ownAccounts.map((a) => a.iban?.toUpperCase()).filter(Boolean)
    );

    // Get savings account names for name matching
    const savingsAccounts = query<{ name: string }>(
      `SELECT name FROM accounts WHERE type = 'savings' AND profile_id = ?`,
      [profileId]
    );
    const savingsNames = new Set(
      savingsAccounts.map((a) => a.name.toLowerCase().trim())
    );

    // Mark transactions where opposing IBAN matches own account
    if (ownIbans.size > 0) {
      const ibanResult = run(
        `UPDATE transactions 
         SET type = 'transfer'${transferCategoryId ? ', category_id = ?' : ''}
         WHERE profile_id = ?
           AND type != 'transfer'
           AND opposing_account_iban IS NOT NULL
           AND UPPER(opposing_account_iban) IN (${[...ownIbans].map(() => '?').join(',')})`,
        transferCategoryId
          ? [transferCategoryId, profileId, ...ownIbans]
          : [profileId, ...ownIbans]
      );
      markedAsTransfer += ibanResult.changes;
    }

    // Get transactions that might match savings account names
    if (savingsNames.size > 0) {
      const potentialTransfers = query<{
        id: number;
        opposing_account_name: string | null;
        merchant_name: string | null;
        description: string | null;
      }>(
        `SELECT id, opposing_account_name, merchant_name, description 
         FROM transactions 
         WHERE profile_id = ? AND type != 'transfer'`,
        [profileId]
      );

      for (const tx of potentialTransfers) {
        const opposingName = tx.opposing_account_name?.toLowerCase().trim();
        const merchantName = tx.merchant_name?.toLowerCase().trim();
        const description = tx.description?.toLowerCase().trim();

        if (
          (opposingName && savingsNames.has(opposingName)) ||
          (merchantName && savingsNames.has(merchantName)) ||
          (description &&
            [...savingsNames].some((savingsName) =>
              description.includes(savingsName)
            ))
        ) {
          run(
            `UPDATE transactions SET type = 'transfer'${transferCategoryId ? ', category_id = ?' : ''} WHERE id = ?`,
            transferCategoryId ? [transferCategoryId, tx.id] : [tx.id]
          );
          markedAsTransfer++;
        }
      }
    }

    res.json({
      success: true,
      data: { markedAsTransfer },
    });
  } catch (error) {
    console.error('Error detecting internal transfers:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to detect internal transfers' });
  }
});

export default router;
