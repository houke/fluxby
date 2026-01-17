import { Router } from 'express';
import { query, queryOne, run } from '../db/index.js';
import {
  type RecurringPattern,
  type RecurringCalendarEntry,
  type RecurringStats,
  type PatternType,
  PATTERN_INTERVALS,
  MIN_TRANSACTIONS_FOR_PATTERN,
  AMOUNT_VARIANCE_THRESHOLD,
} from '@fluxby/shared';
import { getEffectiveProfileId } from '../middleware/profileAuth.js';

const router = Router();

interface DBRecurringPattern {
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
  created_at: string;
}

function mapDBRecurringPattern(row: DBRecurringPattern): RecurringPattern {
  return {
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
    createdAt: row.created_at,
  };
}

/**
 * @swagger
 * /api/recurring:
 *   get:
 *     summary: Get all detected recurring patterns (subscriptions)
 *     tags: [Recurring]
 *     parameters:
 *       - in: header
 *         name: X-Profile-Id
 *         schema:
 *           type: integer
 *         description: Profile ID to filter patterns by
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *         description: Only return active patterns (default true)
 *     responses:
 *       200:
 *         description: List of recurring patterns
 */
router.get('/', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    const activeOnly = req.query.activeOnly !== 'false';

    let sql = `
      SELECT * FROM recurring_patterns
      WHERE profile_id = ? AND is_deleted = 0 AND is_dismissed = 0
    `;

    if (activeOnly) {
      sql += ' AND is_active = 1';
    }

    sql += ' ORDER BY next_expected_date ASC';

    const rows = query<DBRecurringPattern>(sql, [profileId]);
    const patterns = rows.map(mapDBRecurringPattern);

    res.json({ success: true, data: patterns });
  } catch (error) {
    console.error('Error fetching recurring patterns:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch recurring patterns' });
  }
});

/**
 * @swagger
 * /api/recurring/stats:
 *   get:
 *     summary: Get recurring pattern statistics
 *     tags: [Recurring]
 *     parameters:
 *       - in: header
 *         name: X-Profile-Id
 *         schema:
 *           type: integer
 *         description: Profile ID
 *     responses:
 *       200:
 *         description: Statistics about recurring patterns
 */
router.get('/stats', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);

    const rows = query<{
      pattern_type: PatternType;
      avg_amount: number;
      is_active: number;
      is_confirmed: number;
    }>(
      `SELECT pattern_type, avg_amount, is_active, is_confirmed
       FROM recurring_patterns
       WHERE profile_id = ? AND is_deleted = 0 AND is_dismissed = 0 AND is_active = 1`,
      [profileId]
    );

    // Calculate monthly equivalent for each pattern
    const multipliers: Record<PatternType, number> = {
      weekly: 4.33,
      biweekly: 2.17,
      monthly: 1,
      quarterly: 0.33,
      yearly: 0.083,
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

    const stats: RecurringStats = {
      totalMonthlySpend,
      activeSubscriptions,
      confirmedSubscriptions,
      pendingConfirmation,
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching recurring stats:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch recurring stats' });
  }
});

/**
 * @swagger
 * /api/recurring/calendar:
 *   get:
 *     summary: Get calendar entries for recurring patterns in a date range
 *     tags: [Recurring]
 *     parameters:
 *       - in: header
 *         name: X-Profile-Id
 *         schema:
 *           type: integer
 *         description: Profile ID
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of expected payments in the date range
 */
router.get('/calendar', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ success: false, error: 'startDate and endDate are required' });
    }

    const patterns = query<{
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
      [profileId]
    );

    const entries: RecurringCalendarEntry[] = [];
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

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

    res.json({ success: true, data: entries });
  } catch (error) {
    console.error('Error fetching recurring calendar:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch recurring calendar' });
  }
});

/**
 * @swagger
 * /api/recurring/detect:
 *   post:
 *     summary: Run recurring pattern detection on transactions
 *     tags: [Recurring]
 *     parameters:
 *       - in: header
 *         name: X-Profile-Id
 *         schema:
 *           type: integer
 *         description: Profile ID
 *     responses:
 *       200:
 *         description: Detection results with count of detected and updated patterns
 */
router.post('/detect', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    const now = Date.now();
    const MIN_MONTHS_SPAN_DAYS = 60; // ~2 months minimum span to ensure 3+ months of history
    const AMOUNT_CLUSTERING_THRESHOLD = 0.15; // 15% - group amounts within this threshold

    // Get all expense transactions to perform in-memory clustering
    const allTransactions = query<{
      id: string;
      opposing_iban: string | null;
      merchant_name: string | null;
      date: string;
      amount: number;
    }>(
      `SELECT 
        t.id,
        opposing_account_iban as opposing_iban,
        LOWER(TRIM(COALESCE(merchant_name, opposing_account_name))) as merchant_name,
        date,
        amount
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       WHERE a.profile_id = ? 
         AND t.is_deleted = 0
         AND t.type = 'expense'
       ORDER BY merchant_name, date`,
      [profileId]
    );

    // Group by merchant first
    const merchantGroups = new Map<
      string,
      Array<{
        id: string;
        opposing_iban: string | null;
        date: string;
        amount: number;
      }>
    >();

    for (const tx of allTransactions) {
      const key = `${tx.opposing_iban || 'null'}:${tx.merchant_name || 'null'}`;
      if (!merchantGroups.has(key)) {
        merchantGroups.set(key, []);
      }
      merchantGroups.get(key)!.push({
        id: tx.id,
        opposing_iban: tx.opposing_iban,
        date: tx.date,
        amount: tx.amount,
      });
    }

    // Cluster each merchant group by similar amounts
    interface AmountCluster {
      opposing_iban: string | null;
      merchant_name: string | null;
      dates: Date[];
      amounts: number[];
    }

    const groups: AmountCluster[] = [];

    for (const [key, transactions] of merchantGroups.entries()) {
      const [opposing_iban, merchant_name] = key.split(':');
      const clusters: AmountCluster[] = [];

      for (const tx of transactions) {
        const absAmount = Math.abs(tx.amount);

        // Find a cluster with similar amounts (within 15%)
        let foundCluster = false;
        for (const cluster of clusters) {
          const clusterAvgAbs = Math.abs(
            cluster.amounts.reduce((sum, a) => sum + a, 0) /
              cluster.amounts.length
          );

          if (
            Math.abs(absAmount - clusterAvgAbs) / clusterAvgAbs <=
            AMOUNT_CLUSTERING_THRESHOLD
          ) {
            // Add to existing cluster
            cluster.dates.push(new Date(tx.date));
            cluster.amounts.push(tx.amount);
            foundCluster = true;
            break;
          }
        }

        if (!foundCluster) {
          // Create new cluster
          clusters.push({
            opposing_iban: opposing_iban === 'null' ? null : opposing_iban,
            merchant_name: merchant_name === 'null' ? null : merchant_name,
            dates: [new Date(tx.date)],
            amounts: [tx.amount],
          });
        }
      }

      // Add clusters with enough transactions
      for (const cluster of clusters) {
        if (cluster.dates.length >= MIN_TRANSACTIONS_FOR_PATTERN) {
          // Sort by date
          const pairs = cluster.dates.map((d, i) => ({
            date: d,
            amount: cluster.amounts[i],
          }));
          pairs.sort((a, b) => a.date.getTime() - b.date.getTime());

          cluster.dates = pairs.map((p) => p.date);
          cluster.amounts = pairs.map((p) => p.amount);

          groups.push(cluster);
        }
      }
    }

    let detected = 0;
    let updated = 0;

    for (const group of groups) {
      const dates = group.dates;
      const amounts = group.amounts;

      if (dates.length < MIN_TRANSACTIONS_FOR_PATTERN) continue;

      // Check if transactions span at least 3 months
      const firstDate = dates[0];
      const lastDateObj = dates[dates.length - 1];
      const daySpan = Math.round(
        (lastDateObj.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // For monthly patterns, require ~2+ months span (60+ days)
      if (daySpan < MIN_MONTHS_SPAN_DAYS) continue;

      // Calculate intervals between consecutive transactions
      const intervals: number[] = [];
      for (let i = 1; i < dates.length; i++) {
        const daysDiff = Math.round(
          (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
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

      // Check interval consistency using DATE_TOLERANCE_DAYS (12 days)
      // More lenient for real-world payment timing variations
      const isConsistent = intervals.every(
        (interval) => Math.abs(interval - avgInterval) <= 12
      );

      if (!isConsistent) continue;

      // Calculate amount statistics
      const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
      const lastAmount = amounts[amounts.length - 1];
      const lastDate = dates[dates.length - 1].toISOString().split('T')[0];

      // Check if amount is variable (>10% variance) - use absolute values for comparison
      const absAvgAmount = Math.abs(avgAmount);
      const isVariable = amounts.some(
        (a) =>
          Math.abs(Math.abs(a) - absAvgAmount) / absAvgAmount >
          AMOUNT_VARIANCE_THRESHOLD
      );

      // Calculate next expected date
      const nextExpected = new Date(dates[dates.length - 1]);
      nextExpected.setDate(nextExpected.getDate() + Math.round(avgInterval));
      const nextExpectedDate = nextExpected.toISOString().split('T')[0];

      // Check if pattern already exists (including dismissed ones to avoid re-creating)
      // Match by merchant + similar amount (within 20%) with flexible IBAN matching
      const existingPatterns = query<{
        id: string;
        is_dismissed: number;
        avg_amount: number;
        opposing_iban: string | null;
      }>(
        `SELECT id, is_dismissed, avg_amount, opposing_iban FROM recurring_patterns 
         WHERE profile_id = ? 
           AND LOWER(TRIM(merchant_name)) = LOWER(TRIM(?))
           AND is_deleted = 0`,
        [profileId, group.merchant_name]
      );

      // Find existing pattern with similar amount (within 20%) and compatible IBAN
      let existing: { id: string; is_dismissed: number } | null = null;
      for (const pattern of existingPatterns) {
        // Check IBAN compatibility: match if both NULL, both same, or one is NULL
        const ibanMatch =
          pattern.opposing_iban === group.opposing_iban ||
          pattern.opposing_iban === null ||
          group.opposing_iban === null;

        if (!ibanMatch) continue;

        const absExisting = Math.abs(pattern.avg_amount);
        const absNew = Math.abs(avgAmount);
        if (
          absExisting > 0 &&
          Math.abs(absNew - absExisting) / absExisting <= 0.2
        ) {
          existing = pattern;
          break;
        }
      }

      if (existing) {
        // Skip if dismissed - don't update dismissed patterns
        if (existing.is_dismissed === 1) continue;

        // Update existing pattern
        run(
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
        run(
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
            profileId,
            now,
            now,
          ]
        );
        detected++;
      }
    }

    res.json({ success: true, data: { detected, updated } });
  } catch (error) {
    console.error('Error detecting recurring patterns:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to detect recurring patterns' });
  }
});

/**
 * @swagger
 * /api/recurring/{id}/confirm:
 *   post:
 *     summary: Confirm a recurring pattern as a real subscription
 *     tags: [Recurring]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pattern ID
 *       - in: header
 *         name: X-Profile-Id
 *         schema:
 *           type: integer
 *         description: Profile ID
 *     responses:
 *       200:
 *         description: Pattern confirmed
 *       404:
 *         description: Pattern not found
 */
router.post('/:id/confirm', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    const { id } = req.params;

    const existing = queryOne<{ id: string }>(
      'SELECT id FROM recurring_patterns WHERE id = ? AND profile_id = ? AND is_deleted = 0',
      [id, profileId]
    );

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, error: 'Pattern not found' });
    }

    run(
      'UPDATE recurring_patterns SET is_confirmed = 1, updated_at = ? WHERE id = ?',
      [Date.now(), id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error confirming pattern:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to confirm pattern' });
  }
});

/**
 * @swagger
 * /api/recurring/{id}/dismiss:
 *   post:
 *     summary: Dismiss a recurring pattern as a false positive
 *     tags: [Recurring]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pattern ID
 *       - in: header
 *         name: X-Profile-Id
 *         schema:
 *           type: integer
 *         description: Profile ID
 *     responses:
 *       200:
 *         description: Pattern dismissed
 *       404:
 *         description: Pattern not found
 */
router.post('/:id/dismiss', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    const { id } = req.params;

    const existing = queryOne<{ id: string }>(
      'SELECT id FROM recurring_patterns WHERE id = ? AND profile_id = ? AND is_deleted = 0',
      [id, profileId]
    );

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, error: 'Pattern not found' });
    }

    run(
      'UPDATE recurring_patterns SET is_dismissed = 1, is_active = 0, updated_at = ? WHERE id = ?',
      [Date.now(), id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error dismissing pattern:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to dismiss pattern' });
  }
});

/**
 * @swagger
 * /api/recurring/{id}:
 *   delete:
 *     summary: Delete a recurring pattern
 *     tags: [Recurring]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pattern ID
 *       - in: header
 *         name: X-Profile-Id
 *         schema:
 *           type: integer
 *         description: Profile ID
 *     responses:
 *       200:
 *         description: Pattern deleted
 *       404:
 *         description: Pattern not found
 */
router.delete('/:id', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    const { id } = req.params;

    const existing = queryOne<{ id: string }>(
      'SELECT id FROM recurring_patterns WHERE id = ? AND profile_id = ? AND is_deleted = 0',
      [id, profileId]
    );

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, error: 'Pattern not found' });
    }

    run(
      'UPDATE recurring_patterns SET is_deleted = 1, updated_at = ? WHERE id = ?',
      [Date.now(), id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting pattern:', error);
    res.status(500).json({ success: false, error: 'Failed to delete pattern' });
  }
});

export default router;
