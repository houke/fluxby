import { Router } from 'express';
import {
  getDashboardStats,
  getMonthlyData,
  getCategoryBreakdown,
  getDailyExpenses,
  getAvailableYears,
  getMinMaxDates,
  getBalanceForecast,
} from '../services/analytics.js';
import { getEffectiveProfileId } from '../middleware/profileAuth.js';

const router = Router();

/**
 * @swagger
 * /api/analytics/years:
 *   get:
 *     summary: Haal beschikbare jaren op uit transacties
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Array van jaren waarvoor data beschikbaar is
 */
router.get('/years', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    const years = getAvailableYears(profileId);
    res.json({ success: true, data: years });
  } catch (error) {
    console.error('Error fetching available years:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch available years' });
  }
});

/**
 * @swagger
 * /api/analytics/dates:
 *   get:
 *     summary: Haal minimum en maximum datum op uit transacties
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Object met minDate en maxDate
 */
router.get('/dates', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    const dates = getMinMaxDates(profileId);
    res.json({ success: true, data: dates });
  } catch (error) {
    console.error('Error fetching min max dates:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch min max dates' });
  }
});

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Haal dashboard statistieken op
 *     tags: [Analytics]
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
 *           enum: [income, expense]
 *         description: Filter op type
 *       - in: query
 *         name: categoryIds
 *         schema:
 *           type: string
 *         description: Komma-gescheiden lijst van categorie IDs
 *     responses:
 *       200:
 *         description: Dashboard statistieken inclusief totalen, maanddata en categorie verdeling
 *       500:
 *         description: Server error
 */
router.get('/dashboard', (req, res) => {
  try {
    const { startDate, endDate, type, categoryIds } = req.query;
    const profileId = getEffectiveProfileId(req);
    const categoryIdArray = categoryIds
      ? (categoryIds as string).split(',').map(Number)
      : undefined;
    const stats = getDashboardStats(
      profileId,
      startDate as string | undefined,
      endDate as string | undefined,
      type as 'income' | 'expense' | undefined,
      categoryIdArray
    );
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch dashboard stats' });
  }
});

/**
 * @swagger
 * /api/analytics/monthly:
 *   get:
 *     summary: Haal maandelijkse data op voor grafieken
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Maandelijkse inkomsten en uitgaven
 */
router.get('/monthly', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const profileId = getEffectiveProfileId(req);
    const data = getMonthlyData(
      profileId,
      startDate as string | undefined,
      endDate as string | undefined
    );
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching monthly data:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch monthly data' });
  }
});

/**
 * @swagger
 * /api/analytics/categories:
 *   get:
 *     summary: Haal categorie verdeling op
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *         default: expense
 *     responses:
 *       200:
 *         description: Categorie verdeling met percentages
 */
router.get('/categories', (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    const profileId = getEffectiveProfileId(req);
    const data = getCategoryBreakdown(
      profileId,
      startDate as string | undefined,
      endDate as string | undefined,
      (type as 'expense' | 'income') || 'expense'
    );
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching category breakdown:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch category breakdown' });
  }
});

/**
 * @swagger
 * /api/analytics/daily-expenses:
 *   get:
 *     summary: Haal dagelijkse uitgaven op voor timeline
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *     responses:
 *       200:
 *         description: Dagelijkse uitgaven inclusief dagen zonder transacties
 */
router.get('/daily-expenses', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const profileId = getEffectiveProfileId(req);
    const data = getDailyExpenses(
      profileId,
      startDate as string | undefined,
      endDate as string | undefined
    );
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching daily expenses:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch daily expenses' });
  }
});

/**
 * @swagger
 * /api/analytics/balance-forecast:
 *   get:
 *     summary: Haal saldo prognose op voor einde periode
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Start datum (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: Eind datum (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Prognose met verwacht inkomen, uitgaven en eindsaldo
 */
router.get('/balance-forecast', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const profileId = getEffectiveProfileId(req);
    const forecast = getBalanceForecast(
      profileId,
      startDate as string | undefined,
      endDate as string | undefined
    );
    res.json({ success: true, data: forecast });
  } catch (error) {
    console.error('Error fetching balance forecast:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch balance forecast' });
  }
});

export default router;
