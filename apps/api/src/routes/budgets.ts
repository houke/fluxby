import { Router } from 'express';
import { query, run } from '../db/index.js';
import type { Budget, BudgetCreate } from '@fluxby/shared';
import {
  getEffectiveProfileId,
  // verifyBudgetProfile is available for future use
} from '../middleware/profileAuth.js';

const router = Router();

interface DBBudget {
  id: number;
  category_id: number | null;
  amount: number;
  period: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface BudgetWithSpending extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
  categoryName: string | null;
  categoryColor: string | null;
}

function mapDBBudget(row: DBBudget): Budget {
  return {
    id: String(row.id),
    categoryId: row.category_id != null ? String(row.category_id) : null,
    amount: row.amount,
    period: row.period as 'monthly' | 'yearly',
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
  };
}

/**
 * @swagger
 * /api/budgets:
 *   get:
 *     summary: Haal alle budgetten op met uitgaven
 *     tags: [Budgets]
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         description: Maand in formaat YYYY-MM (standaard huidige maand)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Start datum in formaat YYYY-MM-DD (optioneel, neemt voorrang over month)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: Eind datum in formaat YYYY-MM-DD (optioneel)
 *     responses:
 *       200:
 *         description: Lijst met budgetten inclusief besteed bedrag en percentage
 */
router.get('/', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    const {
      month,
      startDate: startDateParam,
      endDate: endDateParam,
    } = req.query;

    // Calculate date range for current/specified period
    let startDate: string;
    let endDate: string;

    if (startDateParam && endDateParam) {
      // Use explicit date range
      startDate = startDateParam as string;
      endDate = endDateParam as string;
    } else if (month) {
      startDate = `${month}-01`;
      const [year, m] = (month as string).split('-').map(Number);
      const lastDay = new Date(year, m, 0).getDate();
      endDate = `${month}-${lastDay.toString().padStart(2, '0')}`;
    } else {
      const now = new Date();
      startDate = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-01`;
      const lastDay = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate();
      endDate = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    }

    // Calculate number of months in the period for budget scaling
    const start = new Date(startDate);
    const end = new Date(endDate);
    const monthsDiff =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth()) +
      1;

    // Profile-filtered budget query: only show budgets for this profile
    // and only count spending from transactions in this profile's accounts
    const rows = query<
      DBBudget & {
        spent: number;
        category_name: string | null;
        category_color: string | null;
      }
    >(
      `
      SELECT 
        b.*,
        c.name as category_name,
        c.color as category_color,
        COALESCE(ABS(SUM(CASE WHEN t.amount < 0 THEN t.amount ELSE 0 END)), 0) as spent
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN transactions t ON b.category_id = t.category_id 
        AND t.date >= ? AND t.date <= ?
        AND t.account_id IN (SELECT id FROM accounts WHERE profile_id = ?)
      WHERE b.profile_id = ?
      GROUP BY b.id
      ORDER BY b.amount DESC
    `,
      [startDate, endDate, profileId, profileId]
    );

    const budgets: BudgetWithSpending[] = rows.map((row) => {
      const spent = row.spent;
      // Scale budget amount based on period and budget type
      const scaledAmount =
        row.period === 'monthly' ? row.amount * monthsDiff : row.amount; // yearly budgets don't scale
      const remaining = scaledAmount - spent;
      const percentage = scaledAmount > 0 ? (spent / scaledAmount) * 100 : 0;

      return {
        ...mapDBBudget(row),
        amount: scaledAmount, // Return scaled amount
        spent,
        remaining,
        percentage, // Don't cap at 100% - let frontend handle display
        categoryName: row.category_name,
        categoryColor: row.category_color,
      };
    });

    res.json({ success: true, data: budgets });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch budgets' });
  }
});

/**
 * @swagger
 * /api/budgets:
 *   post:
 *     summary: Maak een nieuw budget aan
 *     tags: [Budgets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               categoryId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               period:
 *                 type: string
 *                 enum: [monthly, yearly]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Budget aangemaakt
 *       400:
 *         description: Geldig bedrag is verplicht
 */
router.post('/', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    const { categoryId, amount, period, startDate, endDate }: BudgetCreate =
      req.body;

    if (amount === undefined || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, error: 'Valid amount is required' });
    }

    const result = run(
      'INSERT INTO budgets (category_id, amount, period, start_date, end_date, profile_id) VALUES (?, ?, ?, ?, ?, ?)',
      [
        categoryId || null,
        amount,
        period || 'monthly',
        startDate || null,
        endDate || null,
        profileId,
      ]
    );

    res.status(201).json({
      success: true,
      data: { id: result.lastInsertRowid },
    });
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ success: false, error: 'Failed to create budget' });
  }
});

// PATCH update budget
router.patch('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { categoryId, amount, period, startDate, endDate } = req.body;

    const updates: string[] = [];
    const params: unknown[] = [];

    if (categoryId !== undefined) {
      updates.push('category_id = ?');
      params.push(categoryId);
    }

    if (amount !== undefined) {
      updates.push('amount = ?');
      params.push(amount);
    }

    if (period !== undefined) {
      updates.push('period = ?');
      params.push(period);
    }

    if (startDate !== undefined) {
      updates.push('start_date = ?');
      params.push(startDate);
    }

    if (endDate !== undefined) {
      updates.push('end_date = ?');
      params.push(endDate);
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: 'No fields to update' });
    }

    params.push(id);
    run(`UPDATE budgets SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ success: false, error: 'Failed to update budget' });
  }
});

/**
 * @swagger
 * /api/budgets:
 *   delete:
 *     summary: Verwijder alle budgetten
 *     tags: [Budgets]
 *     responses:
 *       200:
 *         description: Alle budgetten verwijderd
 */
router.delete('/', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    run('DELETE FROM budgets WHERE profile_id = ?', [profileId]);
    res.json({ success: true, message: 'All budgets deleted' });
  } catch (error) {
    console.error('Error deleting all budgets:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to delete all budgets' });
  }
});

// DELETE budget
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    run('DELETE FROM budgets WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ success: false, error: 'Failed to delete budget' });
  }
});

/**
 * @swagger
 * /api/budgets/propose:
 *   get:
 *     summary: Krijg voorgestelde budgetten voor categorieën zonder budget
 *     tags: [Budgets]
 *     responses:
 *       200:
 *         description: Voorgestelde budgetten gebaseerd op historische transacties
 */
router.get('/propose', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);

    // Check if we have at least 3 months of transaction data
    const transactionRange = query<{
      oldest_date: string | null;
      newest_date: string | null;
    }>(
      `SELECT 
        MIN(date) as oldest_date,
        MAX(date) as newest_date
      FROM transactions
      WHERE profile_id = ? AND account_id IN (SELECT id FROM accounts WHERE profile_id = ?)`,
      [profileId, profileId]
    )[0];

    if (!transactionRange?.oldest_date || !transactionRange?.newest_date) {
      return res.json({ success: true, data: [] });
    }

    const oldest = new Date(transactionRange.oldest_date);
    const newest = new Date(transactionRange.newest_date);
    const monthsDiff =
      (newest.getFullYear() - oldest.getFullYear()) * 12 +
      (newest.getMonth() - oldest.getMonth()) +
      1;

    // Require at least 3 months of data
    if (monthsDiff < 3) {
      return res.json({ success: true, data: [] });
    }

    // Get categories that don't have budgets yet
    const usedCategoryIds = query<{ category_id: number }>(
      'SELECT DISTINCT category_id FROM budgets WHERE profile_id = ? AND category_id IS NOT NULL',
      [profileId]
    ).map((row) => row.category_id);

    // Calculate last 12 months date range
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 12);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get average monthly spending per category (expenses only)
    // Count distinct months per category for accurate averaging
    const categorySpending = query<{
      category_id: number;
      category_name: string;
      category_icon: string | null;
      category_color: string | null;
      total_spent: number;
      months_covered: number;
    }>(
      `SELECT 
        t.category_id,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        ABS(SUM(t.amount)) as total_spent,
        COUNT(DISTINCT strftime('%Y-%m', t.date)) as months_covered
      FROM transactions t
      INNER JOIN categories c ON t.category_id = c.id
      WHERE t.profile_id = ?
        AND t.account_id IN (SELECT id FROM accounts WHERE profile_id = ?)
        AND t.date >= ? AND t.date <= ?
        AND t.amount < 0
        AND t.category_id IS NOT NULL
        ${usedCategoryIds.length > 0 ? `AND t.category_id NOT IN (${usedCategoryIds.join(',')})` : ''}
      GROUP BY t.category_id
      HAVING total_spent > 0
      ORDER BY total_spent DESC`,
      [profileId, profileId, startDateStr, endDateStr]
    );

    // Calculate proposed budgets: average monthly spending rounded to nearest 10
    const proposals = categorySpending.map((row) => {
      const avgMonthly = row.total_spent / row.months_covered;
      const roundedAmount = Math.ceil(avgMonthly / 10) * 10;

      return {
        categoryId: row.category_id,
        categoryName: row.category_name,
        categoryIcon: row.category_icon,
        categoryColor: row.category_color,
        proposedAmount: roundedAmount,
        avgMonthlySpent: Math.round(avgMonthly),
        basedOnMonths: row.months_covered,
      };
    });

    res.json({ success: true, data: proposals });
  } catch (error) {
    console.error('Error proposing budgets:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to propose budgets' });
  }
});

export default router;
