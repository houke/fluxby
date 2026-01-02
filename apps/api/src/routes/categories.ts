import { Router } from 'express';
import { query, queryOne, run, runMany } from '../db/index.js';
import { getCategoryRules } from '../services/categorization.js';
import type { Category, CategoryCreate } from '@fluxby/shared';
import {
  getEffectiveProfileId,
  // verifyCategoryProfile is available for future use
} from '../middleware/profileAuth.js';
import { SEED_CATEGORIES, getCategoriesForLanguage } from '../db/seed-data.js';

const router = Router();

interface DBCategory {
  id: number;
  name: string;
  parent_id: number | null;
  icon: string | null;
  color: string | null;
  description: string | null;
  created_at: string;
}

interface DBTransactionMinimal {
  id: number;
  merchant_name: string | null;
  description: string | null;
  opposing_account_name: string | null;
}

function applyRuleToAll(
  ruleId: number,
  profileId: number
): { updated: number } {
  const rule = queryOne<{
    id: number;
    pattern: string;
    category_id: number;
    profile_id: number;
  }>('SELECT * FROM category_rules WHERE id = ? AND profile_id = ?', [
    ruleId,
    profileId,
  ]);

  if (!rule) throw new Error('Rule not found or access denied');

  // Only apply to transactions in the same profile
  const transactions = query<DBTransactionMinimal>(
    `SELECT t.id, t.merchant_name, t.description, t.opposing_account_name 
     FROM transactions t
     JOIN accounts a ON t.account_id = a.id
     WHERE a.profile_id = ?`,
    [profileId]
  );

  const updates: [number, number][] = [];
  let pattern: RegExp;

  try {
    pattern = new RegExp(rule.pattern, 'i');
  } catch {
    return { updated: 0 };
  }

  for (const tx of transactions) {
    const textToMatch = `${tx.merchant_name || ''} ${tx.description || ''} ${
      tx.opposing_account_name || ''
    }`;
    if (pattern.test(textToMatch)) {
      updates.push([rule.category_id, tx.id]);
    }
  }

  if (updates.length > 0) {
    runMany('UPDATE transactions SET category_id = ? WHERE id = ?', updates);
  }

  return { updated: updates.length };
}

function applyRulesToUncategorized(profileId: number): {
  updated: number;
  processed: number;
} {
  const rules = getCategoryRules(profileId);
  if (rules.length === 0) return { updated: 0, processed: 0 };

  // Only select uncategorized transactions for this profile
  const uncategorized = query<DBTransactionMinimal>(
    `SELECT t.id, t.merchant_name, t.description, t.opposing_account_name 
     FROM transactions t
     JOIN accounts a ON t.account_id = a.id
     WHERE t.category_id IS NULL AND a.profile_id = ?`,
    [profileId]
  );

  const updates: [number, number][] = [];

  for (const tx of uncategorized) {
    const textToMatch = `${tx.merchant_name || ''} ${tx.description || ''} ${
      tx.opposing_account_name || ''
    }`;

    for (const rule of rules) {
      let pattern: RegExp;
      try {
        pattern = new RegExp(rule.pattern, 'i');
      } catch {
        continue;
      }

      if (pattern.test(textToMatch)) {
        updates.push([parseInt(rule.categoryId, 10), tx.id]);
        break;
      }
    }
  }

  if (updates.length > 0) {
    runMany('UPDATE transactions SET category_id = ? WHERE id = ?', updates);
  }

  return { updated: updates.length, processed: uncategorized.length };
}

function applyAllRulesToAllTransactions(profileId: number): {
  updated: number;
  processed: number;
} {
  const rules = getCategoryRules(profileId);
  if (rules.length === 0) return { updated: 0, processed: 0 };

  // Select all transactions for this profile
  const allTransactions = query<{
    id: number;
    merchant_name: string | null;
    description: string | null;
    opposing_account_name: string | null;
    category_id: number | null;
  }>(
    `SELECT t.id, t.merchant_name, t.description, t.opposing_account_name, t.category_id 
     FROM transactions t
     JOIN accounts a ON t.account_id = a.id
     WHERE a.profile_id = ?`,
    [profileId]
  );

  const updates: [number, number][] = [];

  for (const tx of allTransactions) {
    const textToMatch = `${tx.merchant_name || ''} ${tx.description || ''} ${
      tx.opposing_account_name || ''
    }`;

    for (const rule of rules) {
      let pattern: RegExp;
      try {
        pattern = new RegExp(rule.pattern, 'i');
      } catch {
        continue;
      }

      if (pattern.test(textToMatch)) {
        updates.push([parseInt(rule.categoryId, 10), tx.id]);
        break; // Stop at first matching rule
      }
    }
  }

  if (updates.length > 0) {
    runMany('UPDATE transactions SET category_id = ? WHERE id = ?', updates);
  }

  return { updated: updates.length, processed: allTransactions.length };
}

function mapDBCategory(row: DBCategory): Category {
  return {
    id: String(row.id),
    name: row.name,
    parentId: row.parent_id != null ? String(row.parent_id) : null,
    icon: row.icon,
    color: row.color,
    description: row.description,
    createdAt: row.created_at,
  };
}

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Haal alle categorieën op
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: withCounts
 *         schema:
 *           type: boolean
 *         description: Inclusief transactie telling per categorie
 *     responses:
 *       200:
 *         description: Lijst met categorieën
 *       500:
 *         description: Server error
 */
router.get('/', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    const withCounts = req.query.withCounts === 'true';

    if (withCounts) {
      // Get categories with transaction counts and total amount (profile-filtered)
      const rows = query<
        DBCategory & { transaction_count: number; total_amount: number }
      >(
        `SELECT c.*, 
                COALESCE(COUNT(t.id), 0) as transaction_count,
                COALESCE(SUM(t.amount), 0) as total_amount
         FROM categories c
         LEFT JOIN transactions t ON t.category_id = c.id
         LEFT JOIN accounts a ON t.account_id = a.id AND a.profile_id = ?
         WHERE c.profile_id = ?
         GROUP BY c.id
         ORDER BY c.name`,
        [profileId, profileId]
      );
      const categories = rows.map((row) => ({
        ...mapDBCategory(row),
        transactionCount: row.transaction_count,
        totalExpenses: row.total_amount,
      }));
      res.json({ success: true, data: categories });
    } else {
      const rows = query<DBCategory>(
        'SELECT * FROM categories WHERE profile_id = ? ORDER BY name',
        [profileId]
      );
      const categories = rows.map(mapDBCategory);
      res.json({ success: true, data: categories });
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch categories' });
  }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Haal een specifieke categorie op
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Categorie details
 *       404:
 *         description: Categorie niet gevonden
 */
// GET suggested category for a merchant name
// Note: this must be registered BEFORE the '/:id' route so '/suggest' is not interpreted as an id
router.get('/suggest', (req, res) => {
  try {
    const merchantName = (req.query.merchant as string)?.toLowerCase();
    if (!merchantName) {
      return res.json({ success: true, data: null });
    }

    // Check category rules
    const rule = queryOne<{
      category_id: number;
      category_name: string;
      category_icon: string;
    }>(
      `
      SELECT cr.category_id, c.name as category_name, c.icon as category_icon
      FROM category_rules cr
      JOIN categories c ON cr.category_id = c.id
      WHERE ? LIKE '%' || LOWER(cr.pattern) || '%'
      ORDER BY cr.priority DESC
      LIMIT 1
    `,
      [merchantName]
    );

    if (rule) {
      return res.json({
        success: true,
        data: {
          categoryId: rule.category_id,
          categoryName: rule.category_name,
          categoryIcon: rule.category_icon,
          source: 'rule',
        },
      });
    }

    // Fallback: find most common category for similar merchant names
    const similar = queryOne<{
      category_id: number;
      category_name: string;
      category_icon: string;
      count: number;
    }>(
      `
      SELECT t.category_id, c.name as category_name, c.icon as category_icon, COUNT(*) as count
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE LOWER(t.merchant_name) LIKE ?
      AND t.category_id IS NOT NULL
      GROUP BY t.category_id
      ORDER BY count DESC
      LIMIT 1
    `,
      [`%${merchantName.split(' ')[0]}%`]
    );

    if (similar && similar.count >= 1) {
      return res.json({
        success: true,
        data: {
          categoryId: similar.category_id,
          categoryName: similar.category_name,
          categoryIcon: similar.category_icon,
          source: 'history',
        },
      });
    }

    res.json({ success: true, data: null });
  } catch (error) {
    console.error('Error suggesting category:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to suggest category' });
  }
});

/**
 * @swagger
 * /api/categories/seed-data:
 *   get:
 *     summary: Get seed categories with subcategories and rules
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [nl, en]
 *         description: Language for category names and descriptions (default nl)
 *     responses:
 *       200:
 *         description: List of seed categories with subcategories and rules
 */
router.get('/seed-data', (req, res) => {
  try {
    const language = (req.query.language as 'nl' | 'en') || 'nl';
    // Return the comprehensive seed categories in the requested language
    const categories = getCategoriesForLanguage(SEED_CATEGORIES, language);
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching seed data:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch seed data' });
  }
});

/**
 * @swagger
 * /api/categories/seed:
 *   post:
 *     summary: Seed categories with subcategories into current profile
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categories:
 *                 type: array
 *                 description: Array of parent categories with subcategories
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Categories created
 */
router.post('/seed', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid data format' });
    }

    // Check if profile already has categories
    const existingCount = queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM categories WHERE profile_id = ?',
      [profileId]
    );

    if (existingCount && existingCount.count > 0) {
      return res
        .status(400)
        .json({ success: false, error: 'Profile already has categories' });
    }

    run('BEGIN TRANSACTION');

    try {
      for (const cat of categories) {
        // Insert parent category
        const parentResult = run(
          'INSERT INTO categories (name, icon, color, description, profile_id) VALUES (?, ?, ?, ?, ?)',
          [cat.name, cat.icon, cat.color, cat.description || null, profileId]
        );
        const parentId = parentResult.lastInsertRowid;

        // Insert subcategories if present
        if (Array.isArray(cat.subcategories)) {
          for (const sub of cat.subcategories) {
            const subResult = run(
              'INSERT INTO categories (name, parent_id, icon, color, description, profile_id) VALUES (?, ?, ?, ?, ?, ?)',
              [
                sub.name,
                parentId,
                sub.icon,
                cat.color, // Inherit parent color
                sub.description || null,
                profileId,
              ]
            );
            const subId = subResult.lastInsertRowid;

            // Insert rules for subcategory
            if (Array.isArray(sub.rules)) {
              for (const pattern of sub.rules) {
                run(
                  'INSERT INTO category_rules (pattern, category_id, profile_id) VALUES (?, ?, ?)',
                  [pattern, subId, profileId]
                );
              }
            }
          }
        }

        // Legacy: Handle flat rules array (for backwards compatibility)
        if (Array.isArray(cat.rules) && !cat.subcategories) {
          for (const pattern of cat.rules) {
            run(
              'INSERT INTO category_rules (pattern, category_id, profile_id) VALUES (?, ?, ?)',
              [pattern, parentId, profileId]
            );
          }
        }
      }

      run('COMMIT');
      res.json({ success: true, message: 'Categories seeded successfully' });
    } catch (error) {
      run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error seeding categories:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to seed categories' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const row = queryOne<DBCategory>('SELECT * FROM categories WHERE id = ?', [
      id,
    ]);

    if (!row) {
      return res
        .status(404)
        .json({ success: false, error: 'Category not found' });
    }

    res.json({ success: true, data: mapDBCategory(row) });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch category' });
  }
});

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Maak een nieuwe categorie aan
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               parentId:
 *                 type: integer
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: Categorie aangemaakt
 *       400:
 *         description: Naam is verplicht
 */
router.post('/', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    const { name, parentId, icon, color }: CategoryCreate = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, error: 'Name is required' });
    }

    const result = run(
      'INSERT INTO categories (name, parent_id, icon, color, profile_id) VALUES (?, ?, ?, ?, ?)',
      [name, parentId || null, icon || null, color || null, profileId]
    );

    res.status(201).json({
      success: true,
      data: { id: result.lastInsertRowid },
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to create category' });
  }
});

/**
 * @swagger
 * /api/categories:
 *   delete:
 *     summary: Verwijder alle categorieën
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Alle categorieën verwijderd
 */
router.delete('/', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);

    // First, set all transactions for this profile to have no category
    run(
      `UPDATE transactions SET category_id = NULL 
       WHERE account_id IN (SELECT id FROM accounts WHERE profile_id = ?)`,
      [profileId]
    );

    // Delete all budgets for this profile
    run('DELETE FROM budgets WHERE profile_id = ?', [profileId]);

    // Delete all category rules for this profile's categories
    run(
      `DELETE FROM category_rules WHERE category_id IN (SELECT id FROM categories WHERE profile_id = ?)`,
      [profileId]
    );

    // Delete all categories for this profile
    run('DELETE FROM categories WHERE profile_id = ?', [profileId]);

    res.json({ success: true, message: 'All categories deleted' });
  } catch (error) {
    console.error('Error deleting all categories:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to delete all categories' });
  }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   patch:
 *     summary: Update een categorie
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
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
 *               parentId:
 *                 type: integer
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       200:
 *         description: Categorie bijgewerkt
 */
router.patch('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, parentId, icon, color, description } = req.body;

    const updates: string[] = [];
    const params: unknown[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (parentId !== undefined) {
      updates.push('parent_id = ?');
      params.push(parentId);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      params.push(icon);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: 'No fields to update' });
    }

    params.push(id);
    run(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating category:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to update category' });
  }
});

// DELETE category
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Find all subcategories (children of this category)
    const subcategories = query<{ id: number }>(
      'SELECT id FROM categories WHERE parent_id = ?',
      [id]
    );
    const subcategoryIds = subcategories.map((s) => s.id);

    // Set transactions with this category or its subcategories to null
    const allCategoryIds = [id, ...subcategoryIds];
    for (const catId of allCategoryIds) {
      run('UPDATE transactions SET category_id = NULL WHERE category_id = ?', [
        catId,
      ]);
    }

    // Delete category rules for this category and subcategories
    for (const catId of allCategoryIds) {
      run('DELETE FROM category_rules WHERE category_id = ?', [catId]);
    }

    // Delete subcategories first
    for (const subId of subcategoryIds) {
      run('DELETE FROM categories WHERE id = ?', [subId]);
    }

    // Delete the parent category
    run('DELETE FROM categories WHERE id = ?', [id]);

    res.json({
      success: true,
      deletedSubcategories: subcategoryIds.length,
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to delete category' });
  }
});

// === Category Rules ===

interface DBCategoryRule {
  id: number;
  pattern: string;
  category_id: number;
  priority: number;
  created_at: string;
}

/**
 * @swagger
 * /api/categories/rules/all:
 *   get:
 *     summary: Haal alle auto-categorisatie regels op
 *     tags: [Rules]
 *     responses:
 *       200:
 *         description: Lijst van categorisatie regels
 */
router.get('/rules/all', (req, res) => {
  try {
    const rows = query<
      DBCategoryRule & { category_name: string; category_icon: string }
    >(`
      SELECT cr.*, c.name as category_name, c.icon as category_icon
      FROM category_rules cr
      JOIN categories c ON cr.category_id = c.id
      ORDER BY cr.priority DESC, cr.pattern
    `);
    res.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        pattern: r.pattern,
        categoryId: r.category_id,
        categoryName: r.category_name,
        categoryIcon: r.category_icon,
        priority: r.priority,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching category rules:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch rules' });
  }
});

/**
 * @swagger
 * /api/categories/rules:
 *   post:
 *     summary: Maak een nieuwe auto-categorisatie regel
 *     tags: [Rules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pattern
 *               - categoryId
 *             properties:
 *               pattern:
 *                 type: string
 *               categoryId:
 *                 type: integer
 *               priority:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Regel aangemaakt
 */
router.post('/rules', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    const { pattern, categoryId, priority = 0 } = req.body;

    if (!pattern || !categoryId) {
      return res
        .status(400)
        .json({ success: false, error: 'Pattern and categoryId are required' });
    }

    const patternLower = pattern.toLowerCase();
    const existing = queryOne<{ id: number; category_id: number }>(
      'SELECT id, category_id FROM category_rules WHERE pattern = ? AND profile_id = ?',
      [patternLower, profileId]
    );

    if (existing) {
      if (existing.category_id !== categoryId) {
        run('UPDATE category_rules SET category_id = ? WHERE id = ?', [
          categoryId,
          existing.id,
        ]);
      }

      return res.status(200).json({
        success: true,
        data: { id: existing.id, applied: { updated: 0, processed: 0 } },
      });
    }

    const result = run(
      'INSERT INTO category_rules (pattern, category_id, priority, profile_id) VALUES (?, ?, ?, ?)',
      [patternLower, categoryId, priority, profileId]
    );

    const applied = applyRulesToUncategorized(profileId);

    res.status(201).json({
      success: true,
      data: { id: result.lastInsertRowid, applied },
    });
  } catch (error) {
    console.error('Error creating category rule:', error);
    res.status(500).json({ success: false, error: 'Failed to create rule' });
  }
});

/**
 * @swagger
 * /api/categories/rules/{id}:
 *   delete:
 *     summary: Verwijder een auto-categorisatie regel
 *     tags: [Rules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Regel verwijderd
 */
router.delete('/rules/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    run('DELETE FROM category_rules WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category rule:', error);
    res.status(500).json({ success: false, error: 'Failed to delete rule' });
  }
});

/**
 * @swagger
 * /api/categories/rules/apply:
 *   post:
 *     summary: Pas regels toe op ongecategoriseerde transacties
 *     tags: [Rules]
 *     responses:
 *       200:
 *         description: Aantal bijgewerkte transacties
 */
router.post('/rules/apply', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    const applied = applyRulesToUncategorized(profileId);
    res.json({ success: true, data: applied });
  } catch (error) {
    console.error('Error applying category rules:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to apply category rules' });
  }
});

/**
 * @swagger
 * /api/categories/rules/apply-all:
 *   post:
 *     summary: Pas regels toe op ALLE transacties (inclusief gecategoriseerde)
 *     tags: [Rules]
 *     responses:
 *       200:
 *         description: Aantal bijgewerkte transacties
 */
router.post('/rules/apply-all', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    const applied = applyAllRulesToAllTransactions(profileId);
    res.json({ success: true, data: applied });
  } catch (error) {
    console.error(
      'Error applying all category rules to all transactions:',
      error
    );
    res.status(500).json({
      success: false,
      error: 'Failed to apply all category rules to all transactions',
    });
  }
});

// POST apply specific rule to ALL transactions (including categorized ones)
router.post('/rules/:id/apply', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    const id = parseInt(req.params.id);
    const applied = applyRuleToAll(id, profileId);
    res.json({ success: true, data: applied });
  } catch (error) {
    console.error('Error applying category rule:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to apply category rule' });
  }
});

// GET suggested category for a merchant name
router.get('/suggest', (req, res) => {
  try {
    const merchantName = (req.query.merchant as string)?.toLowerCase();
    if (!merchantName) {
      return res.json({ success: true, data: null });
    }

    // Check category rules
    const rule = queryOne<{
      category_id: number;
      category_name: string;
      category_icon: string;
    }>(
      `
      SELECT cr.category_id, c.name as category_name, c.icon as category_icon
      FROM category_rules cr
      JOIN categories c ON cr.category_id = c.id
      WHERE ? LIKE '%' || LOWER(cr.pattern) || '%'
      ORDER BY cr.priority DESC
      LIMIT 1
    `,
      [merchantName]
    );

    if (rule) {
      return res.json({
        success: true,
        data: {
          categoryId: rule.category_id,
          categoryName: rule.category_name,
          categoryIcon: rule.category_icon,
          source: 'rule',
        },
      });
    }

    // Fallback: find most common category for similar merchant names
    const similar = queryOne<{
      category_id: number;
      category_name: string;
      category_icon: string;
      count: number;
    }>(
      `
      SELECT t.category_id, c.name as category_name, c.icon as category_icon, COUNT(*) as count
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE LOWER(t.merchant_name) LIKE ?
      AND t.category_id IS NOT NULL
      GROUP BY t.category_id
      ORDER BY count DESC
      LIMIT 1
    `,
      [`%${merchantName.split(' ')[0]}%`]
    );

    if (similar && similar.count >= 1) {
      return res.json({
        success: true,
        data: {
          categoryId: similar.category_id,
          categoryName: similar.category_name,
          categoryIcon: similar.category_icon,
          source: 'history',
        },
      });
    }

    res.json({ success: true, data: null });
  } catch (error) {
    console.error('Error suggesting category:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to suggest category' });
  }
});

export default router;
