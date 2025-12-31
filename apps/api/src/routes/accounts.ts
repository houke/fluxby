import { Router } from 'express';
import { query, queryOne, run } from '../db/index.js';
import type { Account, AccountCreate } from '@fluxby/shared';

const router = Router();

/**
 * Check if an IBAN is a shared IBAN (used by payment processors with multiple merchants)
 */
function isSharedIban(iban: string): boolean {
  const shared = queryOne<{ id: number }>(
    'SELECT id FROM shared_ibans WHERE iban = ?',
    [iban]
  );
  return !!shared;
}

interface DBAccount {
  id: number;
  iban: string;
  name: string;
  type: string;
  bank: string;
  current_balance: number;
  initial_balance: number;
  created_at: string;
  profile_id: number;
  calculated_balance?: number;
}

function mapDBAccount(row: DBAccount): Account {
  return {
    id: String(row.id),
    iban: row.iban,
    name: row.name,
    type: row.type as 'checking' | 'savings' | 'credit',
    bank: row.bank,
    currentBalance: row.current_balance ?? row.calculated_balance ?? 0,
    createdAt: row.created_at,
  };
}

/**
 * Get profileId from request (header or query param)
 * Returns null if not provided - caller should use default profile
 */
function getProfileId(req: {
  headers: Record<string, unknown>;
  query: Record<string, unknown>;
}): number | null {
  const headerVal = req.headers['x-profile-id'];
  const queryVal = req.query.profileId;

  const raw = headerVal || queryVal;
  if (!raw) return null;

  const parsed = parseInt(String(raw), 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Get default profile ID for the current user
 * Falls back to profile 1 if no profiles exist
 */
function getDefaultProfileId(): number {
  const result = queryOne<{ id: number }>(
    'SELECT id FROM profiles WHERE user_id = 1 ORDER BY created_at ASC LIMIT 1'
  );
  return result?.id ?? 1;
}

/**
 * Get effective profileId - from request or default
 */
function getEffectiveProfileId(req: {
  headers: Record<string, unknown>;
  query: Record<string, unknown>;
}): number {
  return getProfileId(req) ?? getDefaultProfileId();
}

/**
 * Verify account belongs to profile (prevents cross-profile access)
 */
function verifyAccountProfile(accountId: number, profileId: number): boolean {
  const result = queryOne<{ id: number }>(
    'SELECT id FROM accounts WHERE id = ? AND profile_id = ?',
    [accountId, profileId]
  );
  return !!result;
}

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Haal alle rekeningen op
 *     tags: [Accounts]
 *     parameters:
 *       - in: header
 *         name: X-Profile-Id
 *         schema:
 *           type: integer
 *         description: Profile ID to filter accounts by
 *     responses:
 *       200:
 *         description: Lijst met rekeningen inclusief saldo
 */
router.get('/', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);

    const rows = query<DBAccount>(
      `
      SELECT a.*, 
             COALESCE(
               (SELECT t.balance_after FROM transactions t 
                WHERE t.account_id = a.id 
                ORDER BY t.date DESC, t.id DESC 
                LIMIT 1), 
               a.current_balance, 
               0
             ) as calculated_balance
      FROM accounts a
      WHERE a.profile_id = ?
      GROUP BY a.id
      ORDER BY a.order_index ASC, a.name ASC
    `,
      [profileId]
    );

    const accounts = rows.map((row) => mapDBAccount(row));

    res.json({ success: true, data: accounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch accounts' });
  }
});

/**
 * @swagger
 * /api/accounts/{id}:
 *   get:
 *     summary: Haal een specifieke rekening op
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: header
 *         name: X-Profile-Id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rekening details
 *       404:
 *         description: Rekening niet gevonden
 */
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const profileId = getEffectiveProfileId(req);

    const row = queryOne<DBAccount>(
      `SELECT a.*, (COALESCE(a.initial_balance, 0) + COALESCE(SUM(t.amount), 0)) as calculated_balance
       FROM accounts a
       LEFT JOIN transactions t ON t.account_id = a.id
       WHERE a.id = ? AND a.profile_id = ?
       GROUP BY a.id`,
      [id, profileId]
    );

    if (!row) {
      return res
        .status(404)
        .json({ success: false, error: 'Account not found' });
    }

    res.json({
      success: true,
      data: {
        ...mapDBAccount(row),
        balance: row.calculated_balance ?? row.current_balance,
      },
    });
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch account' });
  }
});

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Maak een nieuwe rekening aan
 *     tags: [Accounts]
 *     parameters:
 *       - in: header
 *         name: X-Profile-Id
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - iban
 *               - name
 *             properties:
 *               iban:
 *                 type: string
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [checking, savings, credit]
 *     responses:
 *       201:
 *         description: Rekening aangemaakt
 *       200:
 *         description: Bestaande rekening bijgewerkt
 *       400:
 *         description: IBAN en naam zijn verplicht
 */
router.post('/', (req, res) => {
  try {
    const { iban, name, type }: AccountCreate = req.body;
    const profileId = getEffectiveProfileId(req);

    if (!iban || !name) {
      return res
        .status(400)
        .json({ success: false, error: 'IBAN and name are required' });
    }

    // Normalize IBAN to uppercase for consistent matching
    const normalizedIban = iban.toUpperCase().trim();

    // Prevent creating accounts for shared IBANs (payment processors)
    if (isSharedIban(normalizedIban)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot create account for shared IBAN (payment processor)',
      });
    }

    // Check if account already exists IN THIS PROFILE
    const existing = queryOne<{ id: number }>(
      'SELECT id FROM accounts WHERE iban = ? AND profile_id = ?',
      [normalizedIban, profileId]
    );

    if (existing) {
      // Update existing account
      run(
        'UPDATE accounts SET name = ?, type = ? WHERE iban = ? AND profile_id = ?',
        [name, type || 'checking', normalizedIban, profileId]
      );
      return res.status(200).json({
        success: true,
        data: { id: existing.id, updated: true },
      });
    }

    const result = run(
      'INSERT INTO accounts (iban, name, type, profile_id, order_index) VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(order_index), 0) + 1 FROM accounts WHERE profile_id = ?))',
      [normalizedIban, name, type || 'checking', profileId, profileId]
    );

    res.status(201).json({
      success: true,
      data: { id: result.lastInsertRowid },
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ success: false, error: 'Failed to create account' });
  }
});

// PATCH update account order (must come before '/:id' to avoid param collision with 'order')
/**
 * @swagger
 * /api/accounts/order:
 *   patch:
 *     summary: Update the display order of accounts
 *     tags: [Accounts]
 *     parameters:
 *       - in: header
 *         name: X-Profile-Id
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountIds
 *             properties:
 *               accountIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of account IDs in the desired display order
 *     responses:
 *       200:
 *         description: Account order updated successfully
 *       400:
 *         description: Invalid request data
 */
router.patch('/order', (req, res) => {
  try {
    const { accountIds }: { accountIds: number[] } = req.body;
    const profileId = getEffectiveProfileId(req);

    if (!Array.isArray(accountIds)) {
      return res
        .status(400)
        .json({ success: false, error: 'accountIds must be an array' });
    }

    // Verify all accounts belong to this profile before updating
    for (const accountId of accountIds) {
      if (!verifyAccountProfile(accountId, profileId)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: account does not belong to this profile',
        });
      }
    }

    // Update order_index for each account
    accountIds.forEach((accountId, index) => {
      run(
        'UPDATE accounts SET order_index = ? WHERE id = ? AND profile_id = ?',
        [index, accountId, profileId]
      );
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating account order:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to update account order' });
  }
});

/**
 * @swagger
 * /api/accounts/{id}:
 *   patch:
 *     summary: Werk een rekening bij
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: header
 *         name: X-Profile-Id
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [checking, savings, credit]
 *               currentBalance:
 *                 type: number
 *     responses:
 *       200:
 *         description: Rekening succesvol bijgewerkt
 *       403:
 *         description: Access denied
 */
router.patch('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const profileId = getEffectiveProfileId(req);
    const { name, type, currentBalance } = req.body;

    // Verify account belongs to this profile
    if (!verifyAccountProfile(id, profileId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: account does not belong to this profile',
      });
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }

    if (type !== undefined) {
      updates.push('type = ?');
      params.push(type);
    }

    if (currentBalance !== undefined) {
      updates.push('current_balance = ?');
      params.push(currentBalance);
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: 'No fields to update' });
    }

    params.push(id);
    params.push(profileId);
    run(
      `UPDATE accounts SET ${updates.join(', ')} WHERE id = ? AND profile_id = ?`,
      params
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ success: false, error: 'Failed to update account' });
  }
});

/**
 * @swagger
 * /api/accounts/{id}:
 *   delete:
 *     summary: Delete an account
 *     description: Deletes an account. Transactions linked to this account will remain but be unlinked (account_id set to null).
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: header
 *         name: X-Profile-Id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Account deleted
 *       403:
 *         description: Access denied
 */
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const profileId = getEffectiveProfileId(req);

    // Verify account belongs to this profile
    if (!verifyAccountProfile(id, profileId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: account does not belong to this profile',
      });
    }

    // Unlink transactions from this account (set account_id to NULL)
    run('UPDATE transactions SET account_id = NULL WHERE account_id = ?', [id]);

    // Delete the account
    run('DELETE FROM accounts WHERE id = ? AND profile_id = ?', [
      id,
      profileId,
    ]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ success: false, error: 'Failed to delete account' });
  }
});

/**
 * @swagger
 * /api/accounts:
 *   delete:
 *     summary: Delete all accounts for current profile
 *     description: Deletes all accounts for the current profile. Transactions will be unlinked (account_id set to null) but not deleted.
 *     tags: [Accounts]
 *     parameters:
 *       - in: header
 *         name: X-Profile-Id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Accounts deleted
 */
router.delete('/', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);

    // Unlink transactions from this profile's accounts (set account_id to NULL)
    run(
      `UPDATE transactions SET account_id = NULL WHERE account_id IN (SELECT id FROM accounts WHERE profile_id = ?)`,
      [profileId]
    );

    // Note: imports table doesn't track account_id, so we don't delete import records here.
    // Import records are informational and don't need per-profile cleanup.

    // Delete accounts
    const result = run('DELETE FROM accounts WHERE profile_id = ?', [
      profileId,
    ]);
    res.json({ success: true, deleted: result.changes });
  } catch (error) {
    console.error('Error deleting all accounts:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to delete accounts' });
  }
});

export default router;
