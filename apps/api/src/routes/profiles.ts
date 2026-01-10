import { Router } from 'express';
import { query, queryOne, run, runMany } from '../db/index.js';
import type { Profile, ProfileCreate, ProfileType } from '@fluxby/shared';
import { SEED_CATEGORIES, flattenCategoriesForDB } from '../db/seed-data.js';

const router = Router();

// Database row type (snake_case from SQLite)
interface ProfileRow {
  id: number;
  user_id: number;
  name: string;
  type: ProfileType;
  avatar_url: string | null;
  created_at: string;
}

// Convert database row to API response
function toProfile(row: ProfileRow): Profile {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: row.name,
    type: row.type,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  };
}

/**
 * @swagger
 * /api/profiles:
 *   get:
 *     summary: Get all profiles for current user
 *     tags: [Profiles]
 *     responses:
 *       200:
 *         description: List of profiles
 */
router.get('/', (_req, res) => {
  try {
    // For now, single-user mode: get all profiles for user_id = 1
    const rows = query<ProfileRow>(
      'SELECT * FROM profiles WHERE user_id = 1 ORDER BY created_at ASC'
    );
    res.json({ success: true, data: rows.map(toProfile) });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profiles' });
  }
});

/**
 * @swagger
 * /api/profiles/{id}:
 *   get:
 *     summary: Get a single profile by ID
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Profile details
 *       404:
 *         description: Profile not found
 */
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid profile ID' });
    }

    const row = queryOne<ProfileRow>(
      'SELECT * FROM profiles WHERE id = ? AND user_id = 1',
      [id]
    );

    if (!row) {
      return res
        .status(404)
        .json({ success: false, error: 'Profile not found' });
    }

    res.json({ success: true, data: toProfile(row) });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

/**
 * @swagger
 * /api/profiles:
 *   post:
 *     summary: Create a new profile
 *     tags: [Profiles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [personal, business, shared, savings]
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Profile created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', (req, res) => {
  try {
    const { name, type, avatarUrl } = req.body as ProfileCreate;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, error: 'Name is required' });
    }

    const validTypes: ProfileType[] = [
      'personal',
      'business',
      'shared',
      'savings',
    ];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    const result = run(
      'INSERT INTO profiles (user_id, name, type, avatar_url) VALUES (1, ?, ?, ?)',
      [name.trim(), type, avatarUrl || null]
    );

    const profileId = Number(result.lastInsertRowid);

    // Seed default categories for the new profile
    try {
      const { parentCategories, subcategories } = flattenCategoriesForDB(
        SEED_CATEGORIES,
        'nl'
      );
      const categoryIdMap: Record<string, number> = {};

      // Insert parent categories
      for (const cat of parentCategories) {
        const catResult = run(
          'INSERT INTO categories (name, icon, color, description, profile_id) VALUES (?, ?, ?, ?, ?)',
          [cat.name, cat.icon, cat.color, cat.description, profileId]
        );
        categoryIdMap[cat.name] = Number(catResult.lastInsertRowid);
      }

      // Insert subcategories
      for (const sub of subcategories) {
        const parentId = categoryIdMap[sub.parentName];
        const subResult = run(
          'INSERT INTO categories (name, parent_id, icon, color, description, profile_id) VALUES (?, ?, ?, ?, ?, ?)',
          [sub.name, parentId, sub.icon, sub.color, sub.description, profileId]
        );
        const subId = Number(subResult.lastInsertRowid);

        // Add category rules for subcategory
        for (const rule of sub.rules) {
          run(
            'INSERT INTO category_rules (pattern, category_id, priority, profile_id) VALUES (?, ?, ?, ?)',
            [rule, subId, 0, profileId]
          );
        }
      }
    } catch (seedError) {
      console.error('Error seeding categories for new profile:', seedError);
      // We don't fail the profile creation if seeding fails, but we log it
    }

    const newProfile = queryOne<ProfileRow>(
      'SELECT * FROM profiles WHERE id = ?',
      [profileId]
    );

    if (!newProfile) {
      return res
        .status(500)
        .json({ success: false, error: 'Failed to retrieve created profile' });
    }

    res.status(201).json({ success: true, data: toProfile(newProfile) });
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({ success: false, error: 'Failed to create profile' });
  }
});

/**
 * @swagger
 * /api/profiles/{id}:
 *   patch:
 *     summary: Update an existing profile
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [personal, business, shared, savings]
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       404:
 *         description: Profile not found
 */
router.patch('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid profile ID' });
    }

    // Check if profile exists
    const existing = queryOne<ProfileRow>(
      'SELECT * FROM profiles WHERE id = ? AND user_id = 1',
      [id]
    );

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, error: 'Profile not found' });
    }

    const { name, type, avatarUrl } = req.body;
    const updates: string[] = [];
    const params: unknown[] = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res
          .status(400)
          .json({ success: false, error: 'Name cannot be empty' });
      }
      updates.push('name = ?');
      params.push(name.trim());
    }

    if (type !== undefined) {
      const validTypes: ProfileType[] = [
        'personal',
        'business',
        'shared',
        'savings',
      ];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
        });
      }
      updates.push('type = ?');
      params.push(type);
    }

    if (avatarUrl !== undefined) {
      updates.push('avatar_url = ?');
      params.push(avatarUrl || null);
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: 'No fields to update' });
    }

    params.push(id);
    run(`UPDATE profiles SET ${updates.join(', ')} WHERE id = ?`, params);

    const updated = queryOne<ProfileRow>(
      'SELECT * FROM profiles WHERE id = ?',
      [id]
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, error: 'Profile not found after update' });
    }

    res.json({ success: true, data: toProfile(updated) });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

/**
 * @swagger
 * /api/profiles/{id}:
 *   delete:
 *     summary: Delete a profile and all associated data
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 *       400:
 *         description: Cannot delete the last profile
 *       404:
 *         description: Profile not found
 */
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid profile ID' });
    }

    // Check if profile exists
    const existing = queryOne<ProfileRow>(
      'SELECT * FROM profiles WHERE id = ? AND user_id = 1',
      [id]
    );

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, error: 'Profile not found' });
    }

    // Don't allow deleting the last profile
    const count = queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM profiles WHERE user_id = 1'
    );

    if (count && count.count <= 1) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete the last profile',
      });
    }

    // Delete profile (cascades to accounts, transactions, etc.)
    run('DELETE FROM profiles WHERE id = ?', [id]);

    res.json({ success: true, message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({ success: false, error: 'Failed to delete profile' });
  }
});

// =============================================================================
// Demo Data Seeding
// =============================================================================

// Demo merchant data for realistic transactions
const DEMO_MERCHANTS = {
  supermarkets: [
    { name: 'Albert Heijn', iban: 'NL00DEMO0001000001' },
    { name: 'Jumbo', iban: 'NL00DEMO0001000002' },
    { name: 'Lidl', iban: 'NL00DEMO0001000003' },
    { name: 'Aldi', iban: 'NL00DEMO0001000004' },
    { name: 'Plus', iban: 'NL00DEMO0001000005' },
  ],
  restaurants: [
    { name: 'Thuisbezorgd.nl', iban: 'NL00DEMO0002000001' },
    { name: 'Uber Eats', iban: 'NL00DEMO0002000002' },
    { name: "McDonald's", iban: 'NL00DEMO0002000003' },
    { name: 'Starbucks', iban: 'NL00DEMO0002000004' },
    { name: 'Vapiano', iban: 'NL00DEMO0002000005' },
  ],
  utilities: [
    { name: 'Vattenfall', iban: 'NL00DEMO0003000001' },
    { name: 'Vitens', iban: 'NL00DEMO0003000002' },
    { name: 'Ziggo', iban: 'NL00DEMO0003000003' },
  ],
  subscriptions: [
    { name: 'Netflix', iban: 'NL00DEMO0004000001' },
    { name: 'Spotify', iban: 'NL00DEMO0004000002' },
    { name: 'Disney+', iban: 'NL00DEMO0004000003' },
    { name: 'KPN', iban: 'NL00DEMO0004000004' },
  ],
  transport: [
    { name: 'NS', iban: 'NL00DEMO0005000001' },
    { name: 'Shell', iban: 'NL00DEMO0005000002' },
    { name: 'BP', iban: 'NL00DEMO0005000003' },
    { name: 'Q-Park', iban: 'NL00DEMO0005000004' },
  ],
  health: [
    { name: 'Kruidvat', iban: 'NL00DEMO0006000001' },
    { name: 'Etos', iban: 'NL00DEMO0006000002' },
    { name: 'Apotheek', iban: 'NL00DEMO0006000003' },
  ],
  shopping: [
    { name: 'Bol.com', iban: 'NL00DEMO0007000001' },
    { name: 'Amazon', iban: 'NL00DEMO0007000002' },
    { name: 'H&M', iban: 'NL00DEMO0007000003' },
    { name: 'IKEA', iban: 'NL00DEMO0007000004' },
    { name: 'Action', iban: 'NL00DEMO0007000005' },
    { name: 'MediaMarkt', iban: 'NL00DEMO0007000006' },
  ],
  housing: [
    { name: 'Woonstad Rotterdam', iban: 'NL00DEMO0008000001' },
    { name: 'Vestia', iban: 'NL00DEMO0008000002' },
  ],
  leisure: [
    { name: 'Pathé', iban: 'NL00DEMO0009000001' },
    { name: 'Rijksmuseum', iban: 'NL00DEMO0009000002' },
    { name: 'Basic-Fit', iban: 'NL00DEMO0009000003' },
  ],
  insurance: [
    { name: 'Centraal Beheer', iban: 'NL00DEMO0010000001' },
    { name: 'Zilveren Kruis', iban: 'NL00DEMO0010000002' },
  ],
};

// Payment processors that share IBANs - these will have multiple different merchants using the same IBAN
// This simulates payment aggregators where different stores route through the same payment provider
const PAYMENT_PROCESSORS = [
  { name: 'iDEAL Payments', iban: 'NL00DEMO0099000001' },
  { name: 'Adyen', iban: 'NL00DEMO0099000002' },
  { name: 'Mollie', iban: 'NL00DEMO0099000003' },
];

// Contacts with multiple IBANs (same person/entity using different bank accounts)
// This simulates people who receive payments to different accounts
const MULTI_IBAN_CONTACTS = [
  {
    name: 'Albert Heijn',
    ibans: ['NL00DEMO0001000001', 'NL00DEMO0001000011', 'NL00DEMO0001000021'],
    descriptions: ['Boodschappen (winkel)', 'Boodschappen (online)', 'Bonus'],
  },
  {
    name: 'Jan de Vries',
    ibans: ['NL00DEMO0060000001', 'NL00DEMO0060000002', 'NL00DEMO0060000003'],
    descriptions: ['Freelance werk', 'Terugbetaling', 'Gezamenlijke kosten'],
  },
  {
    name: 'Familie Jansen',
    ibans: ['NL00DEMO0061000001', 'NL00DEMO0061000002'],
    descriptions: ['Verjaardag cadeau', 'Etentje delen'],
  },
];

// Income sources
const INCOME_SOURCES = [
  { name: 'Werkgever BV', iban: 'NL00DEMO0050000001', description: 'Salaris' },
  {
    name: 'Belastingdienst',
    iban: 'NL00DEMO0050000002',
    description: 'Zorgtoeslag',
  },
];

/**
 * @swagger
 * /api/profiles/{id}/seed-demo:
 *   post:
 *     summary: Seed demo data for a profile (categories, transactions, addressbook, budgets)
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Demo data seeded successfully
 *       404:
 *         description: Profile not found
 */
router.post('/:id/seed-demo', (req, res) => {
  try {
    const profileId = parseInt(req.params.id, 10);
    if (isNaN(profileId)) {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid profile ID' });
    }

    // Check if profile exists
    const profile = queryOne<ProfileRow>(
      'SELECT * FROM profiles WHERE id = ?',
      [profileId]
    );

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, error: 'Profile not found' });
    }

    // 1. Clear existing data for this profile
    run('DELETE FROM budgets WHERE profile_id = ?', [profileId]);
    run('DELETE FROM category_rules WHERE profile_id = ?', [profileId]);
    run(
      'DELETE FROM transactions WHERE account_id IN (SELECT id FROM accounts WHERE profile_id = ?)',
      [profileId]
    );
    run('DELETE FROM accounts WHERE profile_id = ?', [profileId]);
    run('DELETE FROM categories WHERE profile_id = ?', [profileId]);
    run('DELETE FROM address_book WHERE profile_id = ?', [profileId]);

    // 2. Seed categories
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

    // Insert subcategories
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

    // 3. Create demo accounts
    const demoAccountIban = 'NL00DEMO9999999999';
    const savingsAccountIban = 'NL00DEMO8888888888';

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
    const mainAccountId = Number(accountResult.lastInsertRowid);

    const savingsResult = run(
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
    const _savingsAccountId = Number(savingsResult.lastInsertRowid);

    // 4. Generate transactions for 18 months back
    const now = new Date();

    // Rotate IBANs for merchants that also exist as multi-IBAN contacts (e.g. Albert Heijn)
    const multiIbansByName = new Map(
      MULTI_IBAN_CONTACTS.map((c) => [c.name, c.ibans] as const)
    );
    let transactions: Array<{
      date: string;
      amount: number;
      type: 'income' | 'expense' | 'transfer';
      description: string;
      merchant_name: string;
      account_id: number;
      opposing_iban: string;
      opposing_name: string;
      category_id: number | null;
      payment_method: string | null;
    }> = [];

    // Keep track of today's transactions to limit to 2 (use UTC to match ISO date strings)
    const todayYear = now.getUTCFullYear();
    const todayMonth = now.getUTCMonth();
    const todayDay = now.getUTCDate();

    // Helper to get random item from array
    const randomItem = <T>(arr: T[]): T =>
      arr[Math.floor(Math.random() * arr.length)];
    const randomAmount = (min: number, max: number) =>
      Math.round((min + Math.random() * (max - min)) * 100) / 100;

    // Generate 18 months of data
    for (let monthOffset = 0; monthOffset < 18; monthOffset++) {
      const monthDate = new Date(now);
      // Anchor to the 1st to avoid month overflow issues (e.g. 31st -> shorter months)
      monthDate.setDate(1);
      monthDate.setMonth(monthDate.getMonth() - monthOffset);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Random number of transactions per month (10-30)
      const txCount = 10 + Math.floor(Math.random() * 21);

      // Monthly salary on the 24th (only add for this month if the 24th has already passed)
      const salarySource = INCOME_SOURCES[0];
      const salaryDay = 24;
      if (monthOffset > 0 || new Date().getDate() >= salaryDay) {
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
        });
      }

      // Occasional zorgtoeslag (around 5th)
      if (Math.random() > 0.3) {
        const toeslagSource = INCOME_SOURCES[1];
        transactions.push({
          date: new Date(Date.UTC(year, month, 5)).toISOString().split('T')[0],
          amount: 115 + randomAmount(-10, 10),
          type: 'income',
          description: 'Zorgtoeslag',
          merchant_name: toeslagSource.name,
          account_id: mainAccountId,
          opposing_iban: toeslagSource.iban,
          opposing_name: toeslagSource.name,
          category_id: categoryIdMap['Teruggaven'] || null,
          payment_method: 'Overboeking',
        });
      }

      // Housing costs (around 1st)
      const housing = randomItem(DEMO_MERCHANTS.housing);
      transactions.push({
        date: new Date(Date.UTC(year, month, 1)).toISOString().split('T')[0],
        amount: -850,
        type: 'expense',
        description: 'Huur',
        merchant_name: housing.name,
        account_id: mainAccountId,
        opposing_iban: housing.iban,
        opposing_name: housing.name,
        category_id: categoryIdMap['Huur & Hypotheek'] || null,
        payment_method: 'Incasso',
      });

      // Utilities (around 15th)
      for (const utility of DEMO_MERCHANTS.utilities) {
        const isInternet = utility.name === 'Ziggo';
        transactions.push({
          date: new Date(Date.UTC(year, month, 15)).toISOString().split('T')[0],
          amount: isInternet ? -55 : -randomAmount(45, 180),
          type: 'expense',
          description: isInternet ? 'Internet & TV' : 'Energie / water',
          merchant_name: utility.name,
          account_id: mainAccountId,
          opposing_iban: utility.iban,
          opposing_name: utility.name,
          category_id: isInternet
            ? categoryIdMap['Mobiel & Internet'] || null
            : categoryIdMap['Energie & Water'] || null,
          payment_method: 'Incasso',
        });
      }

      // Monthly subscriptions (around 3rd)
      for (const sub of DEMO_MERCHANTS.subscriptions) {
        const isMobileInternet = sub.name === 'KPN';
        transactions.push({
          date: new Date(Date.UTC(year, month, 3)).toISOString().split('T')[0],
          amount: isMobileInternet ? -52 : -randomAmount(8, 18),
          type: 'expense',
          description: 'Maandabonnement',
          merchant_name: sub.name,
          account_id: mainAccountId,
          opposing_iban: sub.iban,
          opposing_name: sub.name,
          category_id: isMobileInternet
            ? categoryIdMap['Mobiel & Internet'] || null
            : categoryIdMap['Streaming & Media'] || null,
          payment_method: 'Incasso',
        });
      }

      // Savings transfer (around 2nd)
      transactions.push({
        date: new Date(Date.UTC(year, month, 2)).toISOString().split('T')[0],
        amount: -250,
        type: 'transfer',
        description: 'Sparen',
        merchant_name: 'Eigen rekening',
        account_id: mainAccountId,
        opposing_iban: savingsAccountIban,
        opposing_name: 'Demo Spaarrekening',
        category_id: null,
        payment_method: 'Overboeking',
      });

      // Random daily expenses
      for (let i = 0; i < txCount; i++) {
        // Ensure we don't generate future dates for the current month
        const maxDay =
          monthOffset === 0
            ? Math.min(daysInMonth, new Date().getDate())
            : daysInMonth;
        const day = 1 + Math.floor(Math.random() * maxDay);
        const expenseType = Math.random();

        let merchant: { name: string; iban: string };
        let amount: number;
        let description: string;
        let categoryId: number | null = null;

        // Use payment processor more often (40%) to create shared IBAN scenarios
        const useProcessor = Math.random() > 0.6;
        const processor = useProcessor ? randomItem(PAYMENT_PROCESSORS) : null;

        if (expenseType < 0.3) {
          // Groceries
          merchant = randomItem(DEMO_MERCHANTS.supermarkets);
          amount = -randomAmount(15, 120);
          description = 'Boodschappen';
          categoryId = categoryIdMap['Supermarkt'] || null;
        } else if (expenseType < 0.45) {
          // Restaurants/takeout
          merchant = randomItem(DEMO_MERCHANTS.restaurants);
          amount = -randomAmount(12, 60);
          description =
            merchant.name.includes('bezorgd') || merchant.name.includes('Uber')
              ? 'Eten bestellen'
              : 'Uit eten';
          categoryId =
            merchant.name.includes('bezorgd') || merchant.name.includes('Uber')
              ? categoryIdMap['Eten Bestellen'] || null
              : categoryIdMap['Restaurants & Bars'] || null;
        } else if (expenseType < 0.55) {
          // Transport
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
          // Health/drugstore
          merchant = randomItem(DEMO_MERCHANTS.health);
          amount = -randomAmount(8, 35);
          description = 'Persoonlijke verzorging';
          categoryId = categoryIdMap['Drogisterij'] || null;
        } else if (expenseType < 0.8) {
          // Shopping
          merchant = randomItem(DEMO_MERCHANTS.shopping);
          amount = -randomAmount(15, 150);
          description = 'Aankoop';
          categoryId =
            merchant.name === 'IKEA'
              ? categoryIdMap['Inrichting & Tuin'] || null
              : categoryIdMap['Kleding & Schoenen'] || null;
        } else {
          // Leisure
          merchant = randomItem(DEMO_MERCHANTS.leisure);
          amount = -randomAmount(10, 50);
          description = merchant.name.includes('Fit') ? 'Sportschool' : 'Uitje';
          categoryId = merchant.name.includes('Fit')
            ? categoryIdMap['Sport & Fitness'] || null
            : categoryIdMap['Uitjes & Cultuur'] || null;
        }

        // Determine payment method based on type
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
          // For processors: use merchant name as opposing_name to create shared IBAN scenario
          // This simulates real payment processors where the same IBAN has different merchant names
          opposing_name: processor ? merchant.name : merchant.name,
          category_id: categoryId,
          payment_method: paymentMethod,
        });
      }

      // Multi-IBAN contact transactions (merged contacts demo)
      for (const contact of MULTI_IBAN_CONTACTS) {
        const txPerMonth = 1 + (monthOffset % 2);
        for (let i = 0; i < txPerMonth; i++) {
          const ibanIndex = (monthOffset + i) % contact.ibans.length;
          transactions.push({
            date: new Date(
              Date.UTC(year, month, 7 + i * 10 + Math.floor(Math.random() * 5))
            )
              .toISOString()
              .split('T')[0],
            amount: -randomAmount(25, 180),
            type: 'expense',
            description:
              contact.descriptions[ibanIndex] || contact.descriptions[0] || '',
            merchant_name: contact.name,
            account_id: mainAccountId,
            opposing_iban: contact.ibans[ibanIndex],
            opposing_name: contact.name,
            category_id: null,
            payment_method: 'Overboeking',
          });
        }
      }

      // Add explicit transactions for each payment processor to ensure all have many transactions
      // Each processor gets 2-3 different merchants PER MONTH to demonstrate shared IBAN feature

      // iDEAL Payments - multiple online shopping transactions per month
      const idealProcessor = PAYMENT_PROCESSORS[0];
      const idealMerchants = [
        'Bol.com',
        'Coolblue',
        'MediaMarkt',
        'Wehkamp',
        'Amazon.nl',
      ];
      // Add 2-3 transactions per month for iDEAL
      const idealTxCount = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < idealTxCount; i++) {
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
          merchant_name: `${merchant} via ${idealProcessor.name}`,
          account_id: mainAccountId,
          opposing_iban: idealProcessor.iban,
          opposing_name: merchant,
          category_id: categoryIdMap['Online Shopping'] || null,
          payment_method: 'iDEAL',
        });
      }

      // Adyen - subscription and digital services (multiple per month)
      const adyenProcessor = PAYMENT_PROCESSORS[1];
      const adyenMerchants = ['Netflix', 'Spotify', 'Disney+', 'Adobe', 'Uber'];
      // Add 2-3 transactions per month for Adyen
      const adyenTxCount = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < adyenTxCount; i++) {
        const merchant =
          adyenMerchants[(monthOffset * 2 + i) % adyenMerchants.length];
        transactions.push({
          date: new Date(
            Date.UTC(year, month, 1 + i * 8 + Math.floor(Math.random() * 3))
          )
            .toISOString()
            .split('T')[0],
          amount:
            merchant === 'Uber' ? -randomAmount(10, 45) : -randomAmount(8, 18),
          type: 'expense',
          description:
            merchant === 'Uber' ? 'Uber rit' : `${merchant} abonnement`,
          merchant_name: `${merchant} via ${adyenProcessor.name}`,
          account_id: mainAccountId,
          opposing_iban: adyenProcessor.iban,
          opposing_name: merchant,
          category_id:
            merchant === 'Uber'
              ? categoryIdMap['Parkeren & Taxi'] || null
              : categoryIdMap['Abonnementen'] || null,
          payment_method: merchant === 'Uber' ? 'iDEAL' : 'Incasso',
        });
      }

      // Mollie - online purchases and delivery services (multiple per month)
      const mollieProcessor = PAYMENT_PROCESSORS[2];
      const mollieMerchants = [
        'Thuisbezorgd.nl',
        'Zalando',
        'Picnic',
        'Gorillas',
        'Flink',
      ];
      // Add 2-3 transactions per month for Mollie
      const mollieTxCount = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < mollieTxCount; i++) {
        const merchant =
          mollieMerchants[(monthOffset * 2 + i) % mollieMerchants.length];
        const isDelivery = [
          'Thuisbezorgd.nl',
          'Picnic',
          'Gorillas',
          'Flink',
        ].includes(merchant);
        transactions.push({
          date: new Date(
            Date.UTC(year, month, 12 + i * 6 + Math.floor(Math.random() * 3))
          )
            .toISOString()
            .split('T')[0],
          amount: isDelivery ? -randomAmount(15, 70) : -randomAmount(30, 100),
          type: 'expense',
          description: isDelivery ? 'Boodschappen bezorgd' : 'Online aankoop',
          merchant_name: `${merchant} via ${mollieProcessor.name}`,
          account_id: mainAccountId,
          opposing_iban: mollieProcessor.iban,
          opposing_name: merchant,
          category_id: isDelivery
            ? merchant === 'Thuisbezorgd.nl'
              ? categoryIdMap['Eten Bestellen'] || null
              : categoryIdMap['Supermarkt'] || null
            : categoryIdMap['Online Shopping'] || null,
          payment_method: 'iDEAL',
        });
      }
    }

    // Add a "proposed contact" transaction - this IBAN is NOT in the address book
    // so it will appear as a proposed contact in the UI
    const proposedContactDate = new Date(
      Date.UTC(todayYear, todayMonth, Math.max(1, todayDay - 3))
    );
    const PROPOSED_CONTACT_DEMO = {
      iban: 'NL00DEMO0095000001',
      name: 'Marktplaats Verkoper',
      description: 'Marktplaats aankoop',
      amount: -45.0,
    };
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
    });

    // Sanitize transactions: clamp future dates to today and ensure at most 2 transactions for the current date
    let todayCount = 0;
    const sanitized: typeof transactions = [];

    for (const tx of transactions) {
      // Parse as UTC date at midnight to avoid timezone shifts
      let txDate = new Date(tx.date + 'T00:00:00Z');

      // If transaction is in the current month and in the future, move it to a past day in the month (<= today)
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

      // Enforce at most 2 transactions for today
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
            // Skip if cannot move
            continue;
          }
        }
      }

      tx.date = txDate.toISOString().split('T')[0];
      sanitized.push(tx);
    }

    transactions = sanitized;

    // Sort transactions by date (newest first for import hash uniqueness)
    transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Insert transactions
    const txInserts: unknown[][] = [];
    let balance = 2500;

    for (const tx of transactions) {
      balance += tx.amount;
      const importHash = `demo_${profileId}_${tx.date}_${tx.amount}_${tx.merchant_name}_${Math.random().toString(36).substring(7)}`;

      txInserts.push([
        tx.date,
        tx.amount,
        tx.type,
        tx.description,
        tx.merchant_name,
        tx.account_id,
        tx.opposing_iban,
        tx.opposing_name,
        tx.category_id,
        balance,
        tx.payment_method,
        importHash,
        profileId,
      ]);
    }

    runMany(
      `INSERT INTO transactions (date, amount, type, description, merchant_name, account_id, opposing_account_iban, opposing_account_name, category_id, balance_after, payment_method, import_hash, profile_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      txInserts
    );

    // 5. Create address book entries from unique opposing accounts
    // Only add about 60% of contacts to address book (not all)
    // Skip payment processors (shared IBANs) to demonstrate shared IBAN feature
    const uniqueIbans = new Map<string, string>();
    for (const tx of transactions) {
      if (!uniqueIbans.has(tx.opposing_iban)) {
        uniqueIbans.set(tx.opposing_iban, tx.opposing_name);
      }
    }

    // Mark payment processor IBANs as shared - these should NOT be in address book
    const processorIbans = new Set(PAYMENT_PROCESSORS.map((p) => p.iban));

    // Get all IBANs for multi-IBAN contacts (we'll add these separately with proper names)
    const multiIbanSet = new Set(MULTI_IBAN_CONTACTS.flatMap((c) => c.ibans));

    for (const [iban, name] of uniqueIbans) {
      // Skip own accounts, payment processors, and multi-IBAN contacts (handled separately)
      if (
        iban !== savingsAccountIban &&
        iban !== demoAccountIban &&
        !processorIbans.has(iban) &&
        !multiIbanSet.has(iban)
      ) {
        // Ensure unique names: if a contact with this name already exists, merge the IBAN into it
        const existingByName = queryOne<{ id: number }>(
          'SELECT id FROM address_book WHERE profile_id = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?))',
          [profileId, name]
        );

        if (existingByName) {
          run(
            'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 0)',
            [existingByName.id, iban]
          );
          continue;
        }

        // Only add ~60% of contacts to address book to show unidentified counterparties
        if (Math.random() < 0.6) {
          const abResult = run(
            'INSERT INTO address_book (iban, name, profile_id) VALUES (?, ?, ?)',
            [iban, name, profileId]
          );
          // Also add to contact_ibans junction table
          const contactId = Number(abResult.lastInsertRowid);
          run(
            'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 1)',
            [contactId, iban]
          );
        }
      }
    }

    // 5b. Add multi-IBAN contacts to address book with merged IBANs feature
    // This demonstrates the "merged IBANs" feature where one person has multiple IBANs
    // Create ONE address_book entry per contact, then add all IBANs to contact_ibans
    for (const contact of MULTI_IBAN_CONTACTS) {
      // Find first IBAN that has transactions
      const primaryIban = contact.ibans.find((iban) => uniqueIbans.has(iban));
      if (!primaryIban) continue;

      // Ensure unique name: reuse an existing contact if present
      const existingByName = queryOne<{ id: number }>(
        'SELECT id FROM address_book WHERE profile_id = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?))',
        [profileId, contact.name]
      );

      const contactId = existingByName
        ? existingByName.id
        : Number(
            run(
              'INSERT INTO address_book (iban, name, profile_id) VALUES (?, ?, ?)',
              [primaryIban, contact.name, profileId]
            ).lastInsertRowid
          );

      // Add primary IBAN to contact_ibans junction table
      run(
        'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 1)',
        [contactId, primaryIban]
      );

      // Add additional IBANs to contact_ibans junction table
      for (const iban of contact.ibans) {
        if (iban !== primaryIban && uniqueIbans.has(iban)) {
          run(
            'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 0)',
            [contactId, iban]
          );
        }
      }
    }

    // 5c. Mark payment processor IBANs as shared in shared_ibans table
    for (const processor of PAYMENT_PROCESSORS) {
      run(
        'INSERT OR IGNORE INTO shared_ibans (iban, provider_name) VALUES (?, ?)',
        [processor.iban, processor.name]
      );
    }

    // 6. Create budgets for some categories (not all, to show smart budget feature)
    const budgetCategories = [
      { name: 'Supermarkt', amount: 400 },
      { name: 'Restaurants & Bars', amount: 150 },
      { name: 'Eten Bestellen', amount: 100 },
      { name: 'Streaming & Media', amount: 50 },
      { name: 'Sport & Fitness', amount: 40 },
    ];

    for (const budget of budgetCategories) {
      const catId = categoryIdMap[budget.name];
      if (catId) {
        run(
          'INSERT INTO budgets (category_id, amount, period, profile_id) VALUES (?, ?, ?, ?)',
          [catId, budget.amount, 'monthly', profileId]
        );
      }
    }

    // 7. Create recurring patterns for demo subscriptions
    // Clear existing recurring patterns for this profile
    run('DELETE FROM recurring_patterns WHERE profile_id = ?', [profileId]);

    // Add demo recurring patterns based on the subscription merchants
    const patternDate = new Date();
    const demoRecurringPatterns = [
      {
        opposingIban: DEMO_MERCHANTS.subscriptions[0].iban, // Netflix
        merchantName: 'Netflix',
        patternType: 'monthly',
        avgAmount: -12.99,
        lastAmount: -12.99,
        isConfirmed: true,
        transactionCount: 18,
      },
      {
        opposingIban: DEMO_MERCHANTS.subscriptions[1].iban, // Spotify
        merchantName: 'Spotify',
        patternType: 'monthly',
        avgAmount: -9.99,
        lastAmount: -9.99,
        isConfirmed: true,
        transactionCount: 18,
      },
      {
        opposingIban: DEMO_MERCHANTS.subscriptions[2].iban, // Disney+
        merchantName: 'Disney+',
        patternType: 'monthly',
        avgAmount: -8.99,
        lastAmount: -8.99,
        isConfirmed: false, // Pending confirmation
        transactionCount: 12,
      },
      {
        opposingIban: DEMO_MERCHANTS.subscriptions[3].iban, // KPN
        merchantName: 'KPN',
        patternType: 'monthly',
        avgAmount: -52.0,
        lastAmount: -52.0,
        isConfirmed: true,
        transactionCount: 18,
      },
      {
        opposingIban: DEMO_MERCHANTS.utilities[0].iban, // Vattenfall
        merchantName: 'Vattenfall',
        patternType: 'monthly',
        avgAmount: -120.0,
        lastAmount: -125.0,
        isConfirmed: true,
        isVariable: true,
        transactionCount: 18,
      },
      {
        opposingIban: DEMO_MERCHANTS.utilities[2].iban, // Ziggo
        merchantName: 'Ziggo',
        patternType: 'monthly',
        avgAmount: -55.0,
        lastAmount: -55.0,
        isConfirmed: true,
        transactionCount: 18,
      },
      {
        opposingIban: DEMO_MERCHANTS.housing[0].iban, // Woonstad
        merchantName: 'Woonstad Rotterdam',
        patternType: 'monthly',
        avgAmount: -850.0,
        lastAmount: -850.0,
        isConfirmed: true,
        transactionCount: 18,
      },
      {
        opposingIban: DEMO_MERCHANTS.leisure[2].iban, // Basic-Fit
        merchantName: 'Basic-Fit',
        patternType: 'monthly',
        avgAmount: -29.99,
        lastAmount: -29.99,
        isConfirmed: false, // Pending confirmation
        transactionCount: 6,
      },
      {
        opposingIban: INCOME_SOURCES[0].iban, // Salary
        merchantName: 'Werkgever BV',
        patternType: 'monthly',
        avgAmount: 2800.0,
        lastAmount: 2850.0,
        isConfirmed: true,
        isVariable: true,
        transactionCount: 18,
      },
    ];

    for (const pattern of demoRecurringPatterns) {
      const id = `demo_${profileId}_${pattern.merchantName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;

      // Prefer the latest transaction for this merchant if present - use shared helper
      const txRow = queryOne<{ date: string; amount: number }>(
        `SELECT date, amount FROM transactions WHERE profile_id = ? AND (merchant_name LIKE ? OR opposing_account_name LIKE ?) ORDER BY date DESC LIMIT 1`,
        [profileId, `%${pattern.merchantName}%`, `%${pattern.merchantName}%`]
      );

      // Build the recurring pattern object using shared helper
      // Use shared helper exported from @fluxby/shared
      // Local implementation of the helper to avoid runtime import issues
      const buildHelper = function (
        template: any,
        latestTx?: { date: string; amount: number },
        referenceDate?: Date
      ) {
        const now = referenceDate ? new Date(referenceDate) : new Date();

        let lastDateStr: string;
        let lastAmountVal: number;

        if (latestTx && latestTx.date) {
          lastDateStr = latestTx.date;
          lastAmountVal = latestTx.amount;
        } else {
          const lastDate = new Date(now);
          lastDate.setDate(3);
          lastDate.setMonth(lastDate.getMonth() - 1);
          lastDateStr = lastDate.toISOString().split('T')[0];
          lastAmountVal = template.lastAmount;
        }

        const nextDate = new Date(lastDateStr + 'T00:00:00Z');
        nextDate.setMonth(nextDate.getMonth() + 1);

        return {
          merchantName: template.merchantName,
          patternType: template.patternType,
          avgAmount: template.avgAmount,
          lastAmount: lastAmountVal,
          lastDate: lastDateStr,
          nextExpectedDate: nextDate.toISOString().split('T')[0],
          isConfirmed: template.isConfirmed ? 1 : 0,
          isVariable: template.isVariable ? 1 : 0,
          transactionCount: template.transactionCount,
        };
      };

      const built = buildHelper(
        pattern as any,
        txRow || undefined,
        patternDate
      );

      run(
        `INSERT INTO recurring_patterns 
         (id, opposing_iban, merchant_name, pattern_type, avg_amount, last_amount, last_date, next_expected_date, is_active, is_confirmed, is_variable, transaction_count, profile_id, is_deleted) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 0)`,
        [
          id,
          pattern.opposingIban,
          built.merchantName,
          built.patternType,
          built.avgAmount,
          built.lastAmount,
          built.lastDate,
          built.nextExpectedDate,
          built.isConfirmed,
          built.isVariable,
          built.transactionCount,
          profileId,
        ]
      );
    }

    res.json({
      success: true,
      data: {
        profileId,
        categories: Object.keys(categoryIdMap).length,
        transactions: transactions.length,
        addressBookEntries: uniqueIbans.size - 2, // Exclude own accounts
        budgets: budgetCategories.length,
        recurringPatterns: demoRecurringPatterns.length,
      },
    });
  } catch (error) {
    console.error('Error seeding demo data:', error);
    res.status(500).json({ success: false, error: 'Failed to seed demo data' });
  }
});

/**
 * @swagger
 * /api/profiles/create-demo:
 *   post:
 *     summary: Create a demo profile and seed it with data
 *     tags: [Profiles]
 *     responses:
 *       201:
 *         description: Demo profile created and seeded successfully
 */
router.post('/create-demo', (_req, res) => {
  try {
    // Check if demo profile already exists
    const existing = queryOne<ProfileRow>(
      "SELECT * FROM profiles WHERE name = 'Demo' AND user_id = 1"
    );

    if (existing) {
      return res.json({
        success: true,
        data: toProfile(existing),
        existed: true,
      });
    }

    // Create demo profile
    const result = run(
      "INSERT INTO profiles (user_id, name, type, avatar_url) VALUES (1, 'Demo', 'personal', 'linear-gradient(135deg, #F59E0B, #EF4444)')",
      []
    );

    const profileId = Number(result.lastInsertRowid);
    const profile = queryOne<ProfileRow>(
      'SELECT * FROM profiles WHERE id = ?',
      [profileId]
    );

    if (!profile) {
      return res
        .status(500)
        .json({ success: false, error: 'Failed to create demo profile' });
    }

    res
      .status(201)
      .json({ success: true, data: toProfile(profile), existed: false });
  } catch (error) {
    console.error('Error creating demo profile:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to create demo profile' });
  }
});

/**
 * @swagger
 * /api/profiles/demo:
 *   get:
 *     summary: Get the demo profile if it exists
 *     tags: [Profiles]
 *     responses:
 *       200:
 *         description: Demo profile details or null if not found
 */
router.get('/demo', (_req, res) => {
  try {
    const profile = queryOne<ProfileRow>(
      "SELECT * FROM profiles WHERE name = 'Demo' AND user_id = 1"
    );

    res.json({ success: true, data: profile ? toProfile(profile) : null });
  } catch (error) {
    console.error('Error fetching demo profile:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch demo profile' });
  }
});

export default router;
