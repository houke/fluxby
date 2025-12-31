import { Router } from 'express';
import { query, queryOne, run, db } from '../db/index.js';
import { getEffectiveProfileId } from '../middleware/profileAuth.js';

const router = Router();

/**
 * Validate a regex pattern for safety (prevent ReDoS attacks)
 * Returns true if the pattern is safe, false otherwise
 */
function isRegexSafe(pattern: string): boolean {
  // Block dangerous patterns that could cause ReDoS
  const dangerousPatterns = [
    /(\+|\*|\{[0-9]+,\})\s*(\+|\*|\{[0-9]+,\})/, // Nested quantifiers
    /\(\?[^)]*\(/, // Nested groups with modifiers
    /\\1/, // Backreferences can be dangerous
  ];

  for (const dangerous of dangerousPatterns) {
    if (dangerous.test(pattern)) {
      return false;
    }
  }

  // Limit pattern length to prevent extremely complex patterns
  if (pattern.length > 200) {
    return false;
  }

  return true;
}

/**
 * Safely execute a regex replacement with timeout protection
 * Returns the original string if regex execution fails or times out
 */
function safeRegexReplace(
  input: string,
  pattern: string,
  flags: string,
  replacement: string = ''
): string {
  // Validate flags - only allow safe flags
  const safeFlags = flags.replace(/[^gimsuy]/g, '') || 'gi';

  // Validate pattern safety
  if (!isRegexSafe(pattern)) {
    console.warn(`Unsafe regex pattern blocked: ${pattern}`);
    return input;
  }

  try {
    const regex = new RegExp(pattern, safeFlags);
    // Limit input length for regex operations
    if (input.length > 1000) {
      return input;
    }
    return input.replace(regex, replacement);
  } catch (error) {
    logError('Regex error:', error);
    return input;
  }
}

/**
 * Log errors only in development mode
 */
function logError(message: string, error?: unknown): void {
  if (process.env.NODE_ENV !== 'production') {
    if (error) {
      console.error(message, error);
    } else {
      console.error(message);
    }
  }
}

/**
 * Get active cleanup rules from database
 */
function getCleanupRules(): { pattern: string }[] {
  return query<{ pattern: string }>(
    'SELECT pattern FROM name_cleanup_rules WHERE is_active = 1'
  );
}

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
      const lastSlash = rule.pattern.lastIndexOf('/');
      const pattern = rule.pattern.slice(1, lastSlash);
      const flags = rule.pattern.slice(lastSlash + 1) || 'gi';
      cleaned = safeRegexReplace(cleaned, pattern, flags, '').trim();
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

interface DBAddressBookEntry {
  id: number;
  iban: string;
  name: string;
  description: string | null;
  notes: string | null;
  created_at: string;
  original_name?: string | null;
}

interface AddressBookEntry {
  id: number;
  iban: string;
  ibans?: string[];
  name: string;
  description: string | null;
  notes: string | null;
  createdAt: string;
  isMerged?: boolean;
  originalName?: string | null;
}

interface AddressBookEntryWithStats extends AddressBookEntry {
  transactionCount: number;
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  lastTransactionDate: string | null;
}

function mapDBAddressBookEntry(row: DBAddressBookEntry): AddressBookEntry {
  return {
    id: row.id,
    iban: row.iban,
    name: row.name,
    description: row.description,
    notes: row.notes,
    createdAt: row.created_at,
    originalName: row.original_name || null,
  };
}

/**
 * Sync transactions to an address book entry based on IBAN and name matching
 */
function syncTransactionsToContact(
  contactId: number,
  profileId: number,
  specificIban?: string
): void {
  const contact = queryOne<DBAddressBookEntry>(
    'SELECT * FROM address_book WHERE id = ? AND profile_id = ?',
    [contactId, profileId]
  );
  if (!contact) return;

  // Get cleanup rules and apply to contact name
  const cleanupRules = getCleanupRules();
  const cleanedName =
    cleanupRules.length > 0
      ? applyCleanupRules(contact.name, cleanupRules)
      : contact.name;

  // Get all IBANs if not specified
  const ibans = specificIban
    ? [specificIban.toUpperCase().trim()]
    : query<{ iban: string }>(
        'SELECT iban FROM contact_ibans WHERE contact_id = ?',
        [contactId]
      ).map((r) => r.iban.toUpperCase().trim());

  if (contact.iban && !specificIban) {
    const primary = contact.iban.toUpperCase().trim();
    if (!ibans.includes(primary)) ibans.push(primary);
  }

  for (const iban of ibans) {
    if (contact.original_name) {
      // For shared IBANs, only link transactions that match the original name
      run(
        `UPDATE transactions SET address_book_id = ?, merchant_name = ?
         WHERE profile_id = ? AND opposing_account_iban = ? 
         AND (opposing_account_name = ? OR merchant_name = ?)
         AND address_book_id IS NULL`,
        [
          contactId,
          cleanedName,
          profileId,
          iban,
          contact.original_name,
          contact.original_name,
        ]
      );
    } else {
      // For regular contacts, link all transactions with this IBAN if they aren't already linked
      // or if they are linked to another contact but the IBAN is owned by this one.
      // We check shared_ibans to avoid stealing transactions from payment processors.
      const isSharedIban = queryOne<{ id: number }>(
        'SELECT id FROM shared_ibans WHERE iban = ?',
        [iban]
      );

      if (!isSharedIban) {
        run(
          `UPDATE transactions SET address_book_id = ?, merchant_name = ?
           WHERE profile_id = ? AND opposing_account_iban = ? AND address_book_id IS NULL`,
          [contactId, cleanedName, profileId, iban]
        );
      }
    }
  }
}

/**
 * @swagger
 * /api/addressbook:
 *   get:
 *     summary: Haal alle adresboek entries op
 *     tags: [AddressBook]
 *     responses:
 *       200:
 *         description: Lijst met adresboek entries inclusief statistieken
 */
router.get('/', (req, res) => {
  try {
    // Get all known payment processors for quick lookup
    const paymentProviders = query<{ iban: string; name: string }>(
      'SELECT iban, name FROM payment_providers'
    );
    const providerMap = new Map(paymentProviders.map((p) => [p.iban, p.name]));
    const profileId = getEffectiveProfileId(req);

    // Get all address book entries with stats
    // Link transactions to address book entries via direct address_book_id foreign key only
    const rows = query<
      DBAddressBookEntry & {
        transaction_count: number;
        total_income: number;
        total_expenses: number;
        last_transaction_date: string | null;
      }
    >(
      `
      SELECT 
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
        t.address_book_id = ab.id 
        OR (
          t.address_book_id IS NULL 
          AND t.opposing_account_iban IN (SELECT iban FROM contact_ibans WHERE contact_id = ab.id)
          AND (
            ab.original_name IS NULL 
            OR (t.opposing_account_name = ab.original_name OR t.merchant_name = ab.original_name)
          )
        )
      )
      WHERE ab.profile_id = ?
      GROUP BY ab.id
      ORDER BY ab.name
    `,
      [profileId]
    );

    // Get all IBANs for each contact (from contact_ibans)
    const ibansByContact = new Map<number, string[]>();
    const ibansData = query<{ contact_id: number; iban: string }>(
      'SELECT contact_id, iban FROM contact_ibans ORDER BY is_primary DESC, created_at ASC'
    );
    for (const row of ibansData) {
      if (!ibansByContact.has(row.contact_id)) {
        ibansByContact.set(row.contact_id, []);
      }
      const ibans = ibansByContact.get(row.contact_id);
      if (ibans) ibans.push(row.iban);
    }

    const entries = rows.map((row) => {
      // Get IBANs from contact_ibans
      const contactIbans = ibansByContact.get(row.id) || [];
      const primaryIban = row.iban ? [row.iban] : [];

      // Combine all IBANs, remove duplicates
      const allIbans = [...new Set([...primaryIban, ...contactIbans])];

      // Check if this IBAN is a known payment provider
      const knownProviderName = row.original_name
        ? providerMap.get(row.iban) || null
        : null;

      // For entries with original_name, include it in originalNames array for frontend matching
      const originalNames = row.original_name ? [row.original_name] : undefined;

      return {
        ...mapDBAddressBookEntry(row),
        ibans: allIbans,
        isMerged: allIbans.length > 1,
        transactionCount: row.transaction_count,
        totalIncome: row.total_income,
        totalExpenses: row.total_expenses,
        netAmount: row.total_income - row.total_expenses,
        lastTransactionDate: row.last_transaction_date,
        knownProviderName,
        originalNames,
      };
    });

    res.json({ success: true, data: entries });
  } catch (error) {
    console.error('Error fetching address book:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch address book' });
  }
});

/**
 * @swagger
 * /api/addressbook/top-accounts:
 *   get:
 *     summary: Haal top accounts op basis van transactiewaarde
 *     tags: [AddressBook]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [expense, income, all]
 *           default: expense
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
 *         description: Top accounts met uitgaven/inkomsten
 */
router.get('/top-accounts', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const type = (req.query.type as string) || 'expense';
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const profileId = getEffectiveProfileId(req);

    let amountCondition = '';
    if (type === 'expense') {
      amountCondition = 'AND t.amount < 0';
    } else if (type === 'income') {
      amountCondition = 'AND t.amount > 0';
    }

    let dateCondition = '';
    // Build params: [profileId for subquery1, profileId for subquery2, profileId for main WHERE, ...dateParams, limit]
    const queryParams: (string | number)[] = [profileId, profileId, profileId];
    if (startDate && endDate) {
      dateCondition = 'AND t.date >= ? AND t.date <= ?';
      queryParams.push(startDate, endDate);
    }
    queryParams.push(limit);

    // Query transactions first, then LEFT JOIN to address_book
    // Use a subquery to find the address_book entry to avoid duplicate rows
    // when a contact has both direct IBAN match and contact_ibans match
    const rows = query<{
      iban: string;
      name: string;
      description: string | null;
      is_in_addressbook: number;
      addressbook_id: number | null;
      transaction_count: number;
      total_amount: number;
      net_amount: number;
    }>(
      `
      SELECT 
        t.opposing_account_iban as iban,
        COALESCE(ab.name, t.opposing_account_name) as name,
        ab.description,
        CASE WHEN ab.id IS NOT NULL THEN 1 ELSE 0 END as is_in_addressbook,
        ab.id as addressbook_id,
        COUNT(t.id) as transaction_count,
        SUM(ABS(t.amount)) as total_amount,
        SUM(t.amount) as net_amount
      FROM transactions t
      LEFT JOIN (
        -- Subquery to get unique address_book entry for each IBAN
        -- Prioritizes direct IBAN match over contact_ibans match
        SELECT DISTINCT 
          COALESCE(ab_direct.iban, ci.iban) as lookup_iban,
          COALESCE(ab_direct.id, ab_via_ci.id) as id,
          COALESCE(ab_direct.name, ab_via_ci.name) as name,
          COALESCE(ab_direct.description, ab_via_ci.description) as description
        FROM (
          SELECT opposing_account_iban AS iban FROM transactions WHERE profile_id = ? AND opposing_account_iban IS NOT NULL GROUP BY opposing_account_iban
        ) unique_ibans
        LEFT JOIN address_book ab_direct ON ab_direct.iban = unique_ibans.iban AND ab_direct.profile_id = ?
        LEFT JOIN contact_ibans ci ON ci.iban = unique_ibans.iban
        LEFT JOIN address_book ab_via_ci ON ab_via_ci.id = ci.contact_id
        WHERE ab_direct.id IS NOT NULL OR ab_via_ci.id IS NOT NULL
      ) ab ON ab.lookup_iban = t.opposing_account_iban
      WHERE t.profile_id = ?
        AND t.type != 'transfer'
        AND t.opposing_account_iban IS NOT NULL
        AND t.opposing_account_iban != ''
        ${amountCondition}
        ${dateCondition}
      GROUP BY t.opposing_account_iban
      ORDER BY total_amount DESC
      LIMIT ?
    `,
      queryParams
    );

    // Build count query params
    const countParams: (string | number)[] = [profileId];
    if (startDate && endDate) {
      countParams.push(startDate, endDate);
    }

    const totalCount = queryOne<{ count: number }>(
      `
      SELECT COUNT(*) as count
      FROM (
        SELECT t.opposing_account_iban
        FROM transactions t
        WHERE t.profile_id = ?
          AND t.type != 'transfer'
          AND t.opposing_account_iban IS NOT NULL
          AND t.opposing_account_iban != ''
          ${amountCondition}
          ${dateCondition}
        GROUP BY t.opposing_account_iban
      )
    `,
      countParams
    );

    res.json({
      success: true,
      data: {
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
        totalCount: totalCount?.count || 0,
        hasMore: (totalCount?.count || 0) > limit,
      },
    });
  } catch (error) {
    console.error('Error fetching top accounts:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch top accounts' });
  }
});

// Name cleanup rules endpoints - MUST be before /:id route

/**
 * @swagger
 * /api/addressbook/cleanup-rules:
 *   get:
 *     summary: Haal alle naam opschoon regels op
 *     tags: [AddressBook]
 *     responses:
 *       200:
 *         description: Lijst met opschoon regels
 */
router.get('/cleanup-rules', (req, res) => {
  try {
    const rules = query<{
      id: number;
      pattern: string;
      is_active: number;
      created_at: string;
    }>('SELECT * FROM name_cleanup_rules ORDER BY created_at ASC');

    res.json({
      success: true,
      data: rules.map((r) => ({
        id: r.id,
        pattern: r.pattern,
        isActive: r.is_active === 1,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching cleanup rules:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch cleanup rules' });
  }
});

/**
 * @swagger
 * /api/addressbook/cleanup-rules:
 *   post:
 *     summary: Voeg een nieuwe opschoon regel toe
 *     tags: [AddressBook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pattern
 *             properties:
 *               pattern:
 *                 type: string
 *     responses:
 *       201:
 *         description: Regel toegevoegd
 *       409:
 *         description: Regel bestaat al
 */
router.post('/cleanup-rules', (req, res) => {
  try {
    const { pattern } = req.body;
    const profileId = getEffectiveProfileId(req);

    if (!pattern || pattern.trim() === '') {
      return res
        .status(400)
        .json({ success: false, error: 'Pattern is required' });
    }

    const trimmedPattern = pattern.trim();

    // Check if rule already exists (case-insensitive)
    const existing = queryOne<{ id: number }>(
      'SELECT id FROM name_cleanup_rules WHERE LOWER(pattern) = LOWER(?)',
      [trimmedPattern]
    );

    if (existing) {
      return res
        .status(409)
        .json({ success: false, error: 'Rule already exists' });
    }

    const result = run('INSERT INTO name_cleanup_rules (pattern) VALUES (?)', [
      trimmedPattern,
    ]);

    const newRuleId = Number(result.lastInsertRowid);

    // Auto-apply the new rule to address book and transactions
    const rules = [{ pattern: trimmedPattern }];

    // Apply to address book entries
    const entries = query<{ id: number; name: string }>(
      'SELECT id, name FROM address_book WHERE profile_id = ?',
      [profileId]
    );

    let addressBookUpdated = 0;
    for (const entry of entries) {
      const cleanedName = applyCleanupRules(entry.name, rules);
      if (cleanedName !== entry.name && cleanedName.length > 0) {
        run('UPDATE address_book SET name = ? WHERE id = ?', [
          cleanedName,
          entry.id,
        ]);
        addressBookUpdated++;
      }
    }

    // Apply to transactions
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

    let transactionsUpdated = 0;
    for (const tx of transactions) {
      let updated = false;
      if (tx.opposing_account_name) {
        const cleanedOpposing = applyCleanupRules(
          tx.opposing_account_name,
          rules
        );
        if (
          cleanedOpposing !== tx.opposing_account_name &&
          cleanedOpposing.length > 0
        ) {
          run(
            'UPDATE transactions SET opposing_account_name = ? WHERE id = ?',
            [cleanedOpposing, tx.id]
          );
          updated = true;
        }
      }
      if (tx.merchant_name) {
        const cleanedMerchant = applyCleanupRules(tx.merchant_name, rules);
        if (
          cleanedMerchant !== tx.merchant_name &&
          cleanedMerchant.length > 0
        ) {
          run('UPDATE transactions SET merchant_name = ? WHERE id = ?', [
            cleanedMerchant,
            tx.id,
          ]);
          updated = true;
        }
      }
      if (updated) transactionsUpdated++;
    }

    res.status(201).json({
      success: true,
      data: {
        id: newRuleId,
        pattern: trimmedPattern,
        addressBookUpdated,
        transactionsUpdated,
      },
    });
  } catch (error) {
    console.error('Error creating cleanup rule:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to create cleanup rule' });
  }
});

/**
 * @swagger
 * /api/addressbook:
 *   post:
 *     summary: Voeg een nieuwe address book entry toe
 *     tags: [AddressBook]
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
 *               description:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Entry toegevoegd
 */
router.post('/', (req, res) => {
  try {
    const { iban, name, description, notes } = req.body;
    const profileId = getEffectiveProfileId(req);

    // Helper: clean required fields
    if (!iban || !name) {
      return res
        .status(400)
        .json({ success: false, error: 'IBAN and name are required' });
    }

    const result = run(
      'INSERT INTO address_book (iban, name, description, notes, profile_id) VALUES (?, ?, ?, ?, ?)',
      [iban, name, description || null, notes || null, profileId]
    );

    const contactId = Number(result.lastInsertRowid);

    // Add to contact_ibans
    run(
      'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 1)',
      [contactId, iban]
    );

    // Sync transactions
    syncTransactionsToContact(contactId, profileId, iban);

    res.status(201).json({
      success: true,
      data: { id: contactId, iban, name },
    });
  } catch (error) {
    console.error('Error creating address book entry:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to create address book entry' });
  }
});

/**
 * @swagger
 * /api/addressbook/cleanup-rules/{id}:
 *   delete:
 *     summary: Verwijder een opschoon regel
 *     tags: [AddressBook]
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
router.delete('/cleanup-rules/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    run('DELETE FROM name_cleanup_rules WHERE id = ?', [id]);
    res.json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    console.error('Error deleting cleanup rule:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to delete cleanup rule' });
  }
});

/**
 * @swagger
 * /api/addressbook/apply-cleanup-rules:
 *   post:
 *     summary: Pas opschoon regels toe op alle address book entries
 *     tags: [AddressBook]
 *     responses:
 *       200:
 *         description: Aantal entries bijgewerkt
 */
router.post('/apply-cleanup-rules', (req, res) => {
  try {
    // Get all active cleanup rules
    const rules = query<{ pattern: string }>(
      'SELECT pattern FROM name_cleanup_rules WHERE is_active = 1'
    );

    if (rules.length === 0) {
      return res.json({ success: true, data: { updated: 0 } });
    }

    // Get all address book entries
    const profileId = getEffectiveProfileId(req);
    const entries = query<{ id: number; name: string }>(
      'SELECT id, name FROM address_book WHERE profile_id = ?',
      [profileId]
    );

    let updatedCount = 0;

    for (const entry of entries) {
      const cleanedName = applyCleanupRules(entry.name, rules);

      if (cleanedName !== entry.name && cleanedName.length > 0) {
        run('UPDATE address_book SET name = ? WHERE id = ?', [
          cleanedName,
          entry.id,
        ]);
        updatedCount++;
      }
    }

    res.json({ success: true, data: { updated: updatedCount } });
  } catch (error) {
    console.error('Error applying cleanup rules:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to apply cleanup rules' });
  }
});

// Shared IBANs routes - MUST be before /:id route

/**
 * @swagger
 * /api/addressbook/shared-ibans:
 *   get:
 *     summary: Haal gedeelde IBANs op (payment processors met meerdere merchants)
 *     tags: [AddressBook]
 *     responses:
 *       200:
 *         description: Lijst met gedeelde IBANs en hun merchants
 */
router.get('/shared-ibans', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);

    // Find IBANs that have multiple different merchant names in transactions
    // This includes:
    // 1. IBANs with multiple distinct unresolved merchants (name_count > 1)
    // 2. IBANs explicitly marked as shared in shared_ibans table
    // 3. IBANs that have been partially resolved (have address_book entry with this IBAN)
    //    and still have unresolved transactions
    const sharedIbans = query<{
      iban: string;
      name_count: number;
    }>(
      `SELECT 
        opposing_account_iban as iban,
        COUNT(DISTINCT opposing_account_name) as name_count
      FROM transactions 
      WHERE opposing_account_iban IS NOT NULL 
        AND opposing_account_iban != ''
        AND opposing_account_iban NOT IN (SELECT iban FROM accounts)
        AND profile_id = ?
        AND address_book_id IS NULL
      GROUP BY opposing_account_iban
      HAVING name_count > 1 
        OR opposing_account_iban IN (SELECT iban FROM shared_ibans)
        OR opposing_account_iban IN (SELECT iban FROM address_book WHERE original_name IS NOT NULL AND profile_id = ?)
        OR opposing_account_iban IN (SELECT iban FROM address_book WHERE profile_id = ?)
        OR opposing_account_iban IN (SELECT ci.iban FROM contact_ibans ci JOIN address_book ab ON ci.contact_id = ab.id WHERE ab.profile_id = ?)`,
      [profileId, profileId, profileId, profileId]
    );

    // Get all known payment processors for quick lookup (IBAN-based fallback)
    const paymentProviders = query<{ iban: string; name: string }>(
      'SELECT iban, name FROM payment_providers'
    );
    const providerMap = new Map(paymentProviders.map((p) => [p.iban, p.name]));

    // Get all payment processor rules for pattern-based detection
    const providerRules = query<{ name: string; patterns: string }>(
      'SELECT name, patterns FROM payment_provider_rules'
    );

    // Helper function to detect payment processor from transaction data
    const detectProvider = (
      iban: string,
      merchantNames: string[]
    ): string | null => {
      const searchText = [iban, ...merchantNames].join(' ').toUpperCase();

      const normalizePattern = (pattern: string) => {
        // Rules are substring-based (not full regex). Historically we stored some
        // regex-ish patterns (e.g. "pay\\.nl" or "paypal \\*.*"). Normalize those
        // so existing seeded data still matches.
        return pattern
          .replace(/\\\./g, '.')
          .replace(/\\\*\.\*/g, '*')
          .replace(/\\/g, '')
          .trim();
      };

      // Check rules first
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

      // Fallback to IBAN-based lookup
      return providerMap.get(iban) || null;
    };

    // For each shared IBAN, get the different merchant names (excluding resolved ones)
    const result = sharedIbans
      .map((si) => {
        // Get address book entries for this IBAN with their names and original_names
        // Check both address_book.iban AND contact_ibans for the IBAN
        const resolvedEntries = query<{
          name: string;
          original_name: string | null;
        }>(
          `SELECT ab.name, ab.original_name FROM address_book ab
           WHERE ab.profile_id = ? AND (
             ab.iban = ? 
             OR ab.id IN (SELECT contact_id FROM contact_ibans WHERE iban = ?)
           )`,
          [profileId, si.iban, si.iban]
        );

        // Check if it's marked as shared or is a known provider
        const markedShared = queryOne<{ id: number; provider_name: string }>(
          'SELECT id, provider_name FROM shared_ibans WHERE iban = ?',
          [si.iban]
        );
        const detectedProviderName = detectProvider(si.iban, []);

        // IMPORTANT: Don't skip shared IBANs early! We need to check if there are still
        // unresolved merchants (address_book_id IS NULL) before deciding to hide.
        // The old logic would hide all remaining merchants if ONE entry didn't have original_name.
        // The correct behavior: Show shared IBANs until ALL merchants are resolved.

        // Build list of names to filter out (partial matching)
        // For each address book entry, add both name and original_name
        const _resolvedNamesToMatch = resolvedEntries.flatMap((e) =>
          [
            e.name.toLowerCase().trim(),
            e.original_name?.toLowerCase().trim(),
          ].filter(Boolean)
        ) as string[];

        // Get all merchants for this IBAN
        const allMerchants = query<{ name: string; count: number }>(
          `SELECT 
            opposing_account_name as name,
            COUNT(*) as count
          FROM transactions
          WHERE opposing_account_iban = ?
            AND profile_id = ?
            AND address_book_id IS NULL
          GROUP BY opposing_account_name
          ORDER BY count DESC`,
          [si.iban, profileId]
        );

        // Fuzzy filtering removed: we now rely on 'address_book_id IS NULL' in the query above.
        // This ensures that if you have two similar merchant names on the same shared IBAN (e.g. Apple 1, Apple 2),
        // resolving one doesn't automatically hide the other.
        const merchants = allMerchants;

        // Detect payment processor using rules + IBAN fallback for final result
        const merchantNames = merchants.map((m) => m.name);
        const finalProviderName =
          detectedProviderName || detectProvider(si.iban, merchantNames);

        // This IBAN is considered 'shared' if it has ANY existing resolutions + remaining merchants
        const isPartiallyResolved = resolvedEntries.length > 0;

        return {
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
          isKnownProvider: !!finalProviderName,
          knownProviderName: finalProviderName,
        };
      })
      .filter((item) => {
        if (!item) return false;
        // Only show if there are multiple unresolved merchants
        // An IBAN is only "shared" if it appears with more than 1 contact name
        return item.merchants.length > 1;
      });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching shared IBANs:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch shared IBANs' });
  }
});

/**
 * @swagger
 * /api/addressbook/shared-ibans:
 *   post:
 *     summary: Markeer een IBAN als gedeeld (payment processor)
 *     tags: [AddressBook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - iban
 *             properties:
 *               iban:
 *                 type: string
 *               providerName:
 *                 type: string
 *     responses:
 *       201:
 *         description: IBAN gemarkeerd als gedeeld
 */
router.post('/shared-ibans', (req, res) => {
  try {
    const { iban, providerName } = req.body;

    if (!iban || iban.trim() === '') {
      return res
        .status(400)
        .json({ success: false, error: 'IBAN is required' });
    }

    // Remove from address book if present
    run('DELETE FROM address_book WHERE iban = ?', [iban]);

    // Add to shared_ibans
    run(
      'INSERT OR REPLACE INTO shared_ibans (iban, provider_name) VALUES (?, ?)',
      [iban, providerName || null]
    );

    res.status(201).json({ success: true, message: 'IBAN marked as shared' });
  } catch (error) {
    console.error('Error marking IBAN as shared:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to mark IBAN as shared' });
  }
});

/**
 * @swagger
 * /api/addressbook/shared-ibans/{iban}:
 *   delete:
 *     summary: Verwijder een IBAN uit de gedeelde lijst
 *     tags: [AddressBook]
 *     parameters:
 *       - in: path
 *         name: iban
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: IBAN verwijderd uit gedeelde lijst
 */
router.delete('/shared-ibans/:iban', (req, res) => {
  try {
    const iban = decodeURIComponent(req.params.iban);
    run('DELETE FROM shared_ibans WHERE iban = ?', [iban]);
    res.json({ success: true, message: 'Shared IBAN removed' });
  } catch (error) {
    console.error('Error removing shared IBAN:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to remove shared IBAN' });
  }
});

/**
 * @swagger
 * /api/addressbook/detect-shared:
 *   post:
 *     summary: Detecteer en verwerk gedeelde IBANs
 *     description: >
 *       Vindt IBANs met meerdere namen, verwijdert ze uit het adresboek,
 *       en voegt ze toe aan de shared_ibans tabel
 *     tags: [AddressBook]
 *     responses:
 *       200:
 *         description: Aantal gedetecteerde en verwerkte gedeelde IBANs
 */
router.post('/detect-shared', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);

    // Find IBANs with multiple merchant names in this profile
    // Exclude IBANs that are already in the address book as regular contacts
    const sharedIbans = query<{ iban: string; name_count: number }>(
      `SELECT 
        opposing_account_iban as iban,
        COUNT(DISTINCT opposing_account_name) as name_count
      FROM transactions 
      WHERE opposing_account_iban IS NOT NULL 
        AND opposing_account_iban != ''
        AND opposing_account_iban NOT IN (SELECT iban FROM accounts)
        AND profile_id = ?
        AND opposing_account_iban NOT IN (
          SELECT iban FROM address_book 
          WHERE profile_id = ? AND original_name IS NULL
        )
        AND opposing_account_iban NOT IN (
          SELECT ci.iban FROM contact_ibans ci
          JOIN address_book ab ON ci.contact_id = ab.id
          WHERE ab.profile_id = ?
        )
      GROUP BY opposing_account_iban
      HAVING name_count > 1`,
      [profileId, profileId, profileId]
    );

    let removedFromAddressBook = 0;
    let addedToShared = 0;

    for (const si of sharedIbans) {
      // Remove from address book ONLY FOR THIS PROFILE
      const deleteResult = run(
        'DELETE FROM address_book WHERE iban = ? AND profile_id = ?',
        [si.iban, profileId]
      );
      if (deleteResult.changes > 0) {
        removedFromAddressBook++;
      }

      // Add to shared_ibans (global)
      const insertResult = run(
        'INSERT OR IGNORE INTO shared_ibans (iban) VALUES (?)',
        [si.iban]
      );
      if (insertResult.changes > 0) {
        addedToShared++;
      }
    }

    // Count how many unresolved merchants remain (for the toast message)
    let unresolvedCount = 0;
    for (const si of sharedIbans) {
      // Check both shared_iban_merchants (global) and address_book (profile-specific)
      const resolvedMerchants = query<{ original_name: string }>(
        `SELECT original_name FROM shared_iban_merchants WHERE iban = ?
         UNION
         SELECT original_name FROM address_book 
         WHERE iban = ? AND profile_id = ? AND original_name IS NOT NULL`,
        [si.iban, si.iban, profileId]
      );
      const resolvedNames = resolvedMerchants.map((m) => m.original_name);

      const unresolvedMerchantsQuery =
        resolvedNames.length > 0
          ? `SELECT COUNT(DISTINCT opposing_account_name) as count
           FROM transactions
           WHERE opposing_account_iban = ?
           AND profile_id = ?
           AND opposing_account_name NOT IN (${resolvedNames
             .map(() => '?')
             .join(',')})`
          : `SELECT COUNT(DISTINCT opposing_account_name) as count
           FROM transactions
           WHERE opposing_account_iban = ?
           AND profile_id = ?`;

      const unresolvedMerchants = queryOne<{ count: number }>(
        unresolvedMerchantsQuery,
        resolvedNames.length > 0
          ? [si.iban, profileId, ...resolvedNames]
          : [si.iban, profileId]
      );

      if (unresolvedMerchants && unresolvedMerchants.count > 0) {
        unresolvedCount++;
      }
    }

    res.json({
      success: true,
      data: {
        detected: sharedIbans.length,
        unresolved: unresolvedCount,
        removedFromAddressBook,
        addedToShared,
      },
    });
  } catch (error) {
    console.error('Error detecting shared IBANs:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to detect shared IBANs' });
  }
});

/**
 * @swagger
 * /api/addressbook/shared-iban-merchants:
 *   get:
 *     summary: Haal alle merchant mappings op voor gedeelde IBANs
 *     tags: [AddressBook]
 *     parameters:
 *       - in: query
 *         name: iban
 *         schema:
 *           type: string
 *         description: Filter op specifieke IBAN
 *     responses:
 *       200:
 *         description: Lijst van merchant mappings
 */
router.get('/shared-iban-merchants', (req, res) => {
  try {
    const iban = req.query.iban as string | undefined;

    let merchants;
    if (iban) {
      merchants = query<{
        id: number;
        iban: string;
        original_name: string;
        display_name: string;
        notes: string | null;
        created_at: string;
      }>(
        'SELECT * FROM shared_iban_merchants WHERE iban = ? ORDER BY display_name',
        [iban]
      );
    } else {
      merchants = query<{
        id: number;
        iban: string;
        original_name: string;
        display_name: string;
        notes: string | null;
        created_at: string;
      }>('SELECT * FROM shared_iban_merchants ORDER BY iban, display_name');
    }

    res.json({
      success: true,
      data: merchants.map((m) => ({
        id: m.id,
        iban: m.iban,
        originalName: m.original_name,
        displayName: m.display_name,
        notes: m.notes,
        createdAt: m.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching shared IBAN merchants:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch shared IBAN merchants' });
  }
});

/**
 * @swagger
 * /api/addressbook/shared-iban-merchants:
 *   post:
 *     summary: Voeg merchants toe van een gedeelde IBAN
 *     tags: [AddressBook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - iban
 *               - merchants
 *             properties:
 *               iban:
 *                 type: string
 *               merchants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     originalName:
 *                       type: string
 *                     displayName:
 *                       type: string
 *     responses:
 *       201:
 *         description: Merchants toegevoegd
 */
router.post('/shared-iban-merchants', (req, res) => {
  try {
    const { iban, merchants } = req.body as {
      iban: string;
      merchants: Array<{ originalName: string; displayName: string }>;
    };

    if (!iban || !merchants || !Array.isArray(merchants)) {
      return res.status(400).json({
        success: false,
        error: 'IBAN and merchants array are required',
      });
    }

    let added = 0;
    let updated = 0;

    for (const merchant of merchants) {
      if (!merchant.originalName || !merchant.displayName) continue;

      const existing = queryOne<{ id: number }>(
        'SELECT id FROM shared_iban_merchants WHERE iban = ? AND original_name = ?',
        [iban, merchant.originalName]
      );

      if (existing) {
        run('UPDATE shared_iban_merchants SET display_name = ? WHERE id = ?', [
          merchant.displayName,
          existing.id,
        ]);
        updated++;
      } else {
        run(
          'INSERT INTO shared_iban_merchants (iban, original_name, display_name) VALUES (?, ?, ?)',
          [iban, merchant.originalName, merchant.displayName]
        );
        added++;
      }
    }

    // Ensure this IBAN is marked as shared
    run('INSERT OR IGNORE INTO shared_ibans (iban) VALUES (?)', [iban]);

    res.status(201).json({
      success: true,
      data: { added, updated },
    });
  } catch (error) {
    console.error('Error adding shared IBAN merchants:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to add shared IBAN merchants' });
  }
});

/**
 * @swagger
 * /api/addressbook/shared-iban-merchants/{id}:
 *   delete:
 *     summary: Verwijder een merchant mapping
 *     tags: [AddressBook]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Merchant mapping verwijderd
 */
router.delete('/shared-iban-merchants/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    run('DELETE FROM shared_iban_merchants WHERE id = ?', [id]);
    res.json({ success: true, message: 'Merchant mapping removed' });
  } catch (error) {
    console.error('Error removing shared IBAN merchant:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to remove merchant mapping' });
  }
});

/**
 * @swagger
 * /api/addressbook/resolve-shared:
 *   post:
 *     summary: Voeg een entry toe aan adresboek vanuit gedeelde IBAN en update transacties
 *     description: >
 *       Voegt een entry toe aan het adresboek, update merchant_name in transacties
 *       voor de opgegeven originele namen, en verwijdert de IBAN uit shared_ibans
 *       als alle namen zijn verwerkt.
 *     tags: [AddressBook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - iban
 *               - name
 *               - originalNames
 *             properties:
 *               iban:
 *                 type: string
 *               name:
 *                 type: string
 *               originalNames:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: De originele transaction names die onder deze naam vallen
 *     responses:
 *       201:
 *         description: Entry toegevoegd en transacties bijgewerkt
 */
router.post('/resolve-shared', (req, res) => {
  try {
    const {
      iban,
      name,
      originalNames,
      description: _description,
      notes: _notes,
      contactId,
    } = req.body as {
      iban: string;
      name: string;
      originalNames: string[];
      description?: string;
      notes?: string;
      contactId?: number; // Optional specific contact to link to
    };
    const profileId = getEffectiveProfileId(req);

    if (!iban || !name || !originalNames || !Array.isArray(originalNames)) {
      return res.status(400).json({
        success: false,
        error: 'IBAN, name, and originalNames array are required',
      });
    }

    const normalizedIban = iban.toUpperCase().trim();

    // Check if this is a shared IBAN (payment processor with multiple merchants)
    const isSharedIban = queryOne<{ id: number }>(
      'SELECT id FROM shared_ibans WHERE iban = ?',
      [normalizedIban]
    );

    // Count all unique merchants for this IBAN
    const allMerchants = queryOne<{ count: number }>(
      `SELECT COUNT(DISTINCT COALESCE(NULLIF(opposing_account_name, ''), merchant_name)) as count
       FROM transactions
       WHERE opposing_account_iban = ? AND profile_id = ?`,
      [normalizedIban, profileId]
    );

    const totalMerchantCount = allMerchants?.count || 0;
    const isPaymentProvider = isSharedIban || totalMerchantCount > 1;

    // If this is a payment provider, ensure it's marked as shared
    if (isPaymentProvider && !isSharedIban) {
      run('INSERT OR IGNORE INTO shared_ibans (iban) VALUES (?)', [
        normalizedIban,
      ]);
    }

    let addressBookId: number | null = null;

    // Always create/update address_book entry (unified approach)
    // For shared IBANs, set original_name to track the mapping
    const primaryOriginalName = originalNames[0] || null;

    if (contactId && contactId > 0) {
      // Use specific contact ID if provided
      const contact = queryOne<{
        id: number;
        name: string;
        iban: string | null;
        original_name: string | null;
      }>(
        'SELECT id, name, iban, original_name FROM address_book WHERE id = ? AND profile_id = ?',
        [contactId, profileId]
      );
      if (contact) {
        addressBookId = contact.id;
        // Ensure IBAN is linked to this contact
        run(
          'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 0)',
          [addressBookId, normalizedIban]
        );
        // Update name if requested (usually we keep existing name but user might have typed a new one)
        if (name && name !== contact.name) {
          run('UPDATE address_book SET name = ? WHERE id = ?', [
            name,
            addressBookId,
          ]);
        }
      }
    }

    if (!addressBookId) {
      // Check if there's already an entry with same IBAN and matching name/original_name
      const existingEntry = queryOne<{
        id: number;
        name: string;
        original_name: string | null;
      }>(
        `SELECT id, name, original_name FROM address_book 
         WHERE profile_id = ? AND iban = ? AND (LOWER(name) = LOWER(?) OR LOWER(original_name) = LOWER(?))`,
        [profileId, normalizedIban, name, primaryOriginalName || name]
      );

      if (existingEntry) {
        // Use existing entry
        addressBookId = existingEntry.id;
      } else {
        // Check if there's an entry with just the same name (for merging)
        const existingByName = queryOne<{ id: number; iban: string | null }>(
          'SELECT id, iban FROM address_book WHERE profile_id = ? AND LOWER(name) = LOWER(?)',
          [profileId, name]
        );

        if (existingByName && !existingByName.iban) {
          // Update existing entry with this IBAN and original_name
          addressBookId = existingByName.id;
          run(
            'UPDATE address_book SET iban = ?, original_name = ? WHERE id = ? AND profile_id = ?',
            [normalizedIban, primaryOriginalName, addressBookId, profileId]
          );
        } else if (existingByName) {
          // Name exists with different IBAN - add this IBAN to contact_ibans
          addressBookId = existingByName.id;
          run(
            'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 0)',
            [addressBookId, normalizedIban]
          );
        } else {
          // Create new entry
          const result = run(
            'INSERT INTO address_book (iban, name, original_name, profile_id) VALUES (?, ?, ?, ?)',
            [normalizedIban, name, primaryOriginalName, profileId]
          );
          addressBookId = Number(result.lastInsertRowid);

          // Also add to contact_ibans for proper lookup
          run(
            'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 1)',
            [addressBookId, normalizedIban]
          );
        }
      }
    }

    // Update transactions: set merchant_name and address_book_id for all original names
    // Apply cleanup rules to the name before updating transactions
    const cleanupRules = getCleanupRules();
    const cleanedName =
      cleanupRules.length > 0 ? applyCleanupRules(name, cleanupRules) : name;

    let transactionsUpdated = 0;
    for (const originalName of originalNames) {
      const updateResult = run(
        `UPDATE transactions SET merchant_name = ?, address_book_id = ? 
         WHERE profile_id = ? AND opposing_account_iban = ? 
         AND (LOWER(opposing_account_name) = LOWER(?) OR LOWER(merchant_name) = LOWER(?))`,
        [
          cleanedName,
          addressBookId,
          profileId,
          normalizedIban,
          originalName,
          originalName,
        ]
      );
      transactionsUpdated += updateResult.changes;
    }

    // Check if there are remaining unresolved merchants for this IBAN
    // Look for merchants not in address_book (with original_name) AND not matching originalNames
    const resolvedMerchants = query<{ original_name: string }>(
      'SELECT original_name FROM address_book WHERE profile_id = ? AND iban = ? AND original_name IS NOT NULL',
      [profileId, normalizedIban]
    );
    const resolvedNames = resolvedMerchants.map((m) => m.original_name);
    const allResolvedNames = [...new Set([...resolvedNames, ...originalNames])];

    const remainingMerchants = queryOne<{ count: number }>(
      `SELECT COUNT(DISTINCT COALESCE(NULLIF(opposing_account_name, ''), merchant_name)) as count
       FROM transactions
       WHERE profile_id = ? AND opposing_account_iban = ?
       AND COALESCE(NULLIF(opposing_account_name, ''), merchant_name) NOT IN (${
         allResolvedNames.map(() => '?').join(',') || "''"
       })`,
      [profileId, normalizedIban, ...allResolvedNames]
    );

    // If no remaining merchants and this was a shared IBAN, remove from shared_ibans
    const removedFromShared =
      isSharedIban && (!remainingMerchants || remainingMerchants.count <= 1);
    if (removedFromShared) {
      run('DELETE FROM shared_ibans WHERE iban = ?', [normalizedIban]);
    }

    res.status(201).json({
      success: true,
      data: {
        addressBookId,
        transactionsUpdated,
        removedFromShared,
        isPaymentProvider,
      },
    });
  } catch (error) {
    console.error('Error resolving shared IBAN:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to resolve shared IBAN' });
  }
});

// ============================================
// Payment Processors Management
// ============================================

/**
 * @swagger
 * /api/addressbook/payment-providers:
 *   get:
 *     summary: Haal alle bekende payment processors op
 *     tags: [AddressBook]
 *     responses:
 *       200:
 *         description: Lijst met payment processors
 */
router.get('/payment-providers', (_req, res) => {
  try {
    const providers = query<{
      id: number;
      iban: string;
      name: string;
      created_at: string;
    }>('SELECT * FROM payment_providers ORDER BY name');
    res.json({ success: true, data: providers });
  } catch (error) {
    console.error('Error fetching payment processors:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch payment processors' });
  }
});

/**
 * @swagger
 * /api/addressbook/payment-providers:
 *   post:
 *     summary: Voeg een payment processor toe
 *     tags: [AddressBook]
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
 *     responses:
 *       201:
 *         description: Payment processor toegevoegd
 */
router.post('/payment-providers', (req, res) => {
  try {
    const { iban, name } = req.body;
    if (!iban || !name) {
      return res
        .status(400)
        .json({ success: false, error: 'IBAN and name are required' });
    }

    const normalizedIban = iban.toUpperCase().trim();
    const result = run(
      'INSERT INTO payment_providers (iban, name) VALUES (?, ?)',
      [normalizedIban, name.trim()]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        iban: normalizedIban,
        name: name.trim(),
      },
    });
  } catch (error) {
    console.error('Error adding payment processor:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to add payment processor' });
  }
});

/**
 * @swagger
 * /api/addressbook/payment-providers/{id}:
 *   delete:
 *     summary: Verwijder een payment processor
 *     tags: [AddressBook]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment processor verwijderd
 */
router.delete('/payment-providers/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    run('DELETE FROM payment_providers WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment processor:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to delete payment processor' });
  }
});

// ============================================
// Payment Processor Rules (pattern-based detection)
// ============================================

/**
 * @swagger
 * /api/addressbook/payment-provider-rules:
 *   get:
 *     summary: Haal alle payment processor regels op
 *     tags: [AddressBook]
 *     responses:
 *       200:
 *         description: Lijst met payment processor regels
 */
router.get('/payment-provider-rules', (_req, res) => {
  try {
    // Ensure default payment provider rules exist
    const defaultRules = [
      { name: 'PayPal', patterns: 'paypal|paypal \\*.*' },
      { name: 'Tikkie', patterns: 'tikkie|tikkie \\*.*' },
      { name: 'Bunq', patterns: 'bunq|bunq \\*.*' },
      { name: 'Adyen', patterns: 'adyen|adyen \\*.*' },
    ];

    for (const rule of defaultRules) {
      try {
        db.prepare(
          'INSERT OR IGNORE INTO payment_provider_rules (name, patterns) VALUES (?, ?)'
        ).run(rule.name, rule.patterns);
      } catch {
        // Rule already exists
      }
    }

    const rules = query<{
      id: number;
      name: string;
      patterns: string;
      created_at: string;
    }>('SELECT * FROM payment_provider_rules ORDER BY name');
    res.json({ success: true, data: rules });
  } catch (error) {
    console.error('Error fetching payment processor rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment processor rules',
    });
  }
});

/**
 * @swagger
 * /api/addressbook/payment-provider-rules:
 *   post:
 *     summary: Voeg een payment processor regel toe
 *     tags: [AddressBook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - patterns
 *             properties:
 *               name:
 *                 type: string
 *               patterns:
 *                 type: string
 *                 description: Comma-separated list of patterns to match
 *     responses:
 *       201:
 *         description: Payment processor regel toegevoegd
 */
router.post('/payment-provider-rules', (req, res) => {
  try {
    const { name, patterns } = req.body;
    if (!name || !patterns) {
      return res
        .status(400)
        .json({ success: false, error: 'Name and patterns are required' });
    }

    const result = run(
      'INSERT INTO payment_provider_rules (name, patterns) VALUES (?, ?)',
      [name.trim(), patterns.trim()]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        name: name.trim(),
        patterns: patterns.trim(),
      },
    });
  } catch (error) {
    console.error('Error adding payment processor rule:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to add payment processor rule' });
  }
});

/**
 * @swagger
 * /api/addressbook/payment-provider-rules/{id}:
 *   patch:
 *     summary: Update een payment processor regel
 *     tags: [AddressBook]
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
 *               patterns:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment processor regel bijgewerkt
 */
router.patch('/payment-provider-rules/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, patterns } = req.body;

    if (!name && !patterns) {
      return res
        .status(400)
        .json({ success: false, error: 'Name or patterns required' });
    }

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (name) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (patterns) {
      updates.push('patterns = ?');
      values.push(patterns.trim());
    }

    values.push(id);
    run(
      `UPDATE payment_provider_rules SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating payment processor rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment processor rule',
    });
  }
});

/**
 * @swagger
 * /api/addressbook/payment-provider-rules/{id}:
 *   delete:
 *     summary: Verwijder een payment processor regel
 *     tags: [AddressBook]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment processor regel verwijderd
 */
router.delete('/payment-provider-rules/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    run('DELETE FROM payment_provider_rules WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment processor rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete payment processor rule',
    });
  }
});

/**
 * @swagger
 * /api/addressbook/detect-payment-provider:
 *   post:
 *     summary: Detecteer payment processor voor een transactie
 *     tags: [AddressBook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               iban:
 *                 type: string
 *               description:
 *                 type: string
 *               merchantName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Detected payment processor or null
 */
router.post('/detect-payment-provider', (req, res) => {
  try {
    const { iban, description, merchantName } = req.body;

    // Get all rules
    const rules = query<{ name: string; patterns: string }>(
      'SELECT name, patterns FROM payment_provider_rules'
    );

    // Also get IBAN-based providers for fallback
    const ibanProviders = query<{ iban: string; name: string }>(
      'SELECT iban, name FROM payment_providers'
    );
    const ibanMap = new Map(ibanProviders.map((p) => [p.iban, p.name]));

    // Check text to search in
    const searchText = [iban, description, merchantName]
      .filter(Boolean)
      .join(' ')
      .toUpperCase();

    // Check rules first
    for (const rule of rules) {
      const patterns = rule.patterns
        .split(',')
        .map((p) => p.trim().toUpperCase());
      for (const pattern of patterns) {
        if (pattern && searchText.includes(pattern)) {
          return res.json({ success: true, data: { provider: rule.name } });
        }
      }
    }

    // Fallback to IBAN-based lookup
    if (iban && ibanMap.has(iban.toUpperCase())) {
      return res.json({
        success: true,
        data: { provider: ibanMap.get(iban.toUpperCase()) },
      });
    }

    res.json({ success: true, data: { provider: null } });
  } catch (error) {
    console.error('Error detecting payment processor:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to detect payment processor' });
  }
});

/**
 * @swagger
 * /api/addressbook/{id}:
 *   get:
 *     summary: Haal een specifieke adresboek entry op
 *     tags: [AddressBook]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Adresboek entry details met statistieken
 *       404:
 *         description: Entry niet gevonden
 */
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const profileId = getEffectiveProfileId(req);

    let row;
    if (id < 0) {
      // Shared merchant
      const simId = Math.abs(id);
      row = queryOne<
        DBAddressBookEntry & {
          transaction_count: number;
          total_income: number;
          total_expenses: number;
          last_transaction_date: string | null;
        }
      >(
        `
        SELECT 
          -sim.id as id,
          sim.iban,
          sim.display_name as name,
          NULL as description,
          sim.notes,
          sim.created_at,
          COUNT(t.id) as transaction_count,
          COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) as total_income,
          COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0) as total_expenses,
          MAX(t.date) as last_transaction_date
        FROM shared_iban_merchants sim
        LEFT JOIN transactions t ON t.opposing_account_iban = sim.iban AND t.opposing_account_name = sim.original_name AND t.profile_id = ?
        WHERE sim.id = ? AND sim.profile_id = ?
        GROUP BY sim.id
      `,
        [profileId, simId, profileId]
      );
    } else {
      // Regular contact
      row = queryOne<
        DBAddressBookEntry & {
          transaction_count: number;
          total_income: number;
          total_expenses: number;
          last_transaction_date: string | null;
        }
      >(
        `
        SELECT 
          ab.id,
          ab.iban,
          ab.name,
          ab.description,
          ab.notes,
          ab.created_at,
          COUNT(t.id) as transaction_count,
          COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) as total_income,
          COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0) as total_expenses,
          MAX(t.date) as last_transaction_date
        FROM address_book ab
        LEFT JOIN contact_ibans ci ON ci.contact_id = ab.id
        LEFT JOIN transactions t ON (t.opposing_account_iban = ci.iban OR t.opposing_account_iban = ab.iban) AND t.profile_id = ?
        WHERE ab.id = ? AND ab.profile_id = ?
        GROUP BY ab.id
      `,
        [profileId, id, profileId]
      );
    }

    if (!row) {
      return res.status(404).json({ success: false, error: 'Entry not found' });
    }

    // Get all IBANs for this contact from contact_ibans
    let ibans: string[] = [];
    if (id < 0) {
      ibans = [row.iban];
    } else {
      // Get IBANs from contact_ibans
      const contactIbans = query<{ iban: string }>(
        'SELECT iban FROM contact_ibans WHERE contact_id = ? ORDER BY is_primary DESC, created_at ASC',
        [id]
      ).map((i) => i.iban);

      // Also get IBANs from shared_iban_merchants with matching name
      const sharedIbans = query<{ iban: string }>(
        'SELECT iban FROM shared_iban_merchants WHERE profile_id = ? AND LOWER(TRIM(display_name)) = LOWER(TRIM(?))',
        [profileId, row.name]
      ).map((i) => i.iban);

      // Combine all IBANs, remove duplicates, include primary IBAN
      const allIbans = new Set([row.iban, ...contactIbans, ...sharedIbans]);
      ibans = [...allIbans].filter(Boolean);
    }

    const entry: AddressBookEntryWithStats = {
      ...mapDBAddressBookEntry(row),
      ibans: ibans.length > 0 ? ibans : row.iban ? [row.iban] : [],
      isMerged: ibans.length > 1,
      transactionCount: row.transaction_count,
      totalIncome: row.total_income,
      totalExpenses: row.total_expenses,
      netAmount: row.total_income - row.total_expenses,
      lastTransactionDate: row.last_transaction_date,
    };

    res.json({ success: true, data: entry });
  } catch (error) {
    console.error('Error fetching address book entry:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch address book entry' });
  }
});

/**
 * @swagger
 * /api/addressbook/by-iban/{iban}:
 *   get:
 *     summary: Haal adresboek entry op via IBAN
 *     tags: [AddressBook]
 *     parameters:
 *       - in: path
 *         name: iban
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Adresboek entry details
 *       404:
 *         description: Entry niet gevonden
 */
router.get('/by-iban/:iban', (req, res) => {
  try {
    const iban = req.params.iban.toUpperCase().trim();
    const profileId = getEffectiveProfileId(req);
    const row = queryOne<DBAddressBookEntry>(
      'SELECT * FROM address_book WHERE iban = ? AND profile_id = ?',
      [iban, profileId]
    );

    if (!row) {
      return res.status(404).json({ success: false, error: 'Entry not found' });
    }

    res.json({ success: true, data: mapDBAddressBookEntry(row) });
  } catch (error) {
    console.error('Error fetching address book entry by IBAN:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch address book entry' });
  }
});

/**
 * @swagger
 * /api/addressbook:
 *   post:
 *     summary: Maak een nieuwe adresboek entry aan of voeg IBAN toe aan bestaand contact
 *     description: >
 *       Als een contact met dezelfde naam al bestaat, wordt de nieuwe IBAN
 *       toegevoegd aan het bestaande contact. Dit voorkomt duplicaten.
 *       Als de IBAN een gedeelde IBAN is (payment processor), wordt de entry
 *       toegevoegd aan shared_iban_merchants in plaats van address_book.
 *     tags: [AddressBook]
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
 *                 description: Weergavenaam voor het contact
 *               originalName:
 *                 type: string
 *                 description: Originele naam uit transactie (voor gedeelde IBANs)
 *               description:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Adresboek entry aangemaakt of IBAN toegevoegd aan bestaand contact
 *       400:
 *         description: Validatiefout
 */
router.post('/', (req, res) => {
  try {
    const { iban, name, description, notes, originalName } = req.body;
    const profileId = getEffectiveProfileId(req);

    if (!iban || !name) {
      return res
        .status(400)
        .json({ success: false, error: 'IBAN and name are required' });
    }

    // Normalize IBAN to uppercase for consistent matching
    const normalizedIban = iban.toUpperCase().trim();
    const normalizedName = name.trim();

    // Check if this is a shared IBAN (payment processor used by multiple merchants)
    const isSharedIban = queryOne<{ id: number }>(
      'SELECT id FROM shared_ibans WHERE iban = ?',
      [normalizedIban]
    );

    if (isSharedIban) {
      // For shared IBANs, we create entries with original_name for proper matching
      const merchantOriginalName = originalName || normalizedName;

      // Check if this merchant already exists in address_book (by IBAN + original_name)
      const existingMerchant = queryOne<DBAddressBookEntry>(
        `SELECT * FROM address_book 
         WHERE iban = ? AND original_name = ? AND profile_id = ?`,
        [normalizedIban, merchantOriginalName, profileId]
      );

      if (existingMerchant) {
        // Update the display name if different
        if (existingMerchant.name !== normalizedName) {
          run(
            'UPDATE address_book SET name = ? WHERE id = ? AND profile_id = ?',
            [normalizedName, existingMerchant.id, profileId]
          );
        }
        return res.status(200).json({
          success: true,
          data: {
            ...mapDBAddressBookEntry({
              ...existingMerchant,
              name: normalizedName,
            }),
            originalNames: [merchantOriginalName],
          },
          merged: false,
          isSharedIban: true,
        });
      }

      // Create new address book entry with original_name
      const result = run(
        'INSERT INTO address_book (iban, name, original_name, description, notes, profile_id) VALUES (?, ?, ?, ?, ?, ?)',
        [
          normalizedIban,
          normalizedName,
          merchantOriginalName,
          description || null,
          notes || null,
          profileId,
        ]
      );
      const newId = Number(result.lastInsertRowid);

      // Add to contact_ibans for consistency
      run(
        'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 1)',
        [newId, normalizedIban]
      );

      const newEntry = queryOne<DBAddressBookEntry>(
        'SELECT * FROM address_book WHERE id = ? AND profile_id = ?',
        [newId, profileId]
      );

      return res.status(201).json({
        success: true,
        data: newEntry
          ? {
              ...mapDBAddressBookEntry(newEntry),
              originalNames: [merchantOriginalName],
            }
          : null,
        merged: false,
        isSharedIban: true,
      });
    }

    // For regular IBANs (not shared), check for duplicates
    // Check if this IBAN is already in the address book (without original_name)
    const existingByIban = queryOne<DBAddressBookEntry>(
      'SELECT * FROM address_book WHERE iban = ? AND original_name IS NULL AND profile_id = ?',
      [normalizedIban, profileId]
    );

    if (existingByIban) {
      return res.status(400).json({
        success: false,
        error: 'Entry with this IBAN already exists',
      });
    }

    // Check if IBAN is already in contact_ibans
    const existingInContactIbans = queryOne<{ contact_id: number }>(
      `SELECT ci.contact_id FROM contact_ibans ci 
       JOIN address_book ab ON ci.contact_id = ab.id
       WHERE ci.iban = ? AND ab.profile_id = ?`,
      [normalizedIban, profileId]
    );

    if (existingInContactIbans) {
      return res.status(400).json({
        success: false,
        error: 'IBAN is already assigned to another contact',
      });
    }

    // Check if a contact with the same name already exists (case-insensitive)
    const existingByName = queryOne<DBAddressBookEntry>(
      'SELECT * FROM address_book WHERE LOWER(name) = LOWER(?) AND profile_id = ?',
      [normalizedName, profileId]
    );

    let contactId: number;
    let merged = false;

    if (existingByName) {
      // Add IBAN to existing contact instead of creating a new one
      contactId = existingByName.id;
      merged = true;

      // Ensure primary IBAN is in contact_ibans
      run(
        'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 1)',
        [contactId, existingByName.iban]
      );

      // Add new IBAN to contact_ibans
      run(
        'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 0)',
        [contactId, normalizedIban]
      );

      // Update description/notes if provided and current ones are empty
      if (description && !existingByName.description) {
        run(
          'UPDATE address_book SET description = ? WHERE id = ? AND profile_id = ?',
          [description, contactId, profileId]
        );
      }
      if (notes && !existingByName.notes) {
        run(
          'UPDATE address_book SET notes = ? WHERE id = ? AND profile_id = ?',
          [notes, contactId, profileId]
        );
      }
    } else {
      // Create new contact
      const result = run(
        'INSERT INTO address_book (iban, name, description, notes, profile_id) VALUES (?, ?, ?, ?, ?)',
        [
          normalizedIban,
          normalizedName,
          description || null,
          notes || null,
          profileId,
        ]
      );
      contactId = Number(result.lastInsertRowid);

      // Also add to contact_ibans for consistent lookup
      run(
        'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 1)',
        [contactId, normalizedIban]
      );
    }

    // Sync transactions to the new/merged contact
    syncTransactionsToContact(contactId, profileId, normalizedIban);

    const entry = queryOne<DBAddressBookEntry>(
      'SELECT * FROM address_book WHERE id = ? AND profile_id = ?',
      [contactId, profileId]
    );

    // Get all IBANs for this contact
    const ibans = query<{ iban: string }>(
      'SELECT iban FROM contact_ibans WHERE contact_id = ? ORDER BY is_primary DESC',
      [contactId]
    );

    res.status(201).json({
      success: true,
      data: entry
        ? {
            ...mapDBAddressBookEntry(entry),
            ibans: ibans.map((i) => i.iban),
            isMerged: ibans.length > 1,
          }
        : null,
      merged,
    });
  } catch (error) {
    console.error('Error creating address book entry:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to create address book entry' });
  }
});

/**
 * @swagger
 * /api/addressbook/{id}:
 *   patch:
 *     summary: Update een adresboek entry
 *     tags: [AddressBook]
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
 *               description:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Entry bijgewerkt
 *       404:
 *         description: Entry niet gevonden
 */
router.patch('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, notes } = req.body;
    const profileId = getEffectiveProfileId(req);

    // Apply cleanup rules to the name if provided
    const cleanupRules = getCleanupRules();
    const cleanedName =
      name && cleanupRules.length > 0
        ? applyCleanupRules(name, cleanupRules)
        : name;

    if (id < 0) {
      // Shared merchant
      const simId = Math.abs(id);
      const existing = queryOne<{
        id: number;
        display_name: string;
        iban: string;
        original_name: string;
      }>(
        'SELECT * FROM shared_iban_merchants WHERE id = ? AND profile_id = ?',
        [simId, profileId]
      );

      if (!existing) {
        return res
          .status(404)
          .json({ success: false, error: 'Entry not found' });
      }

      if (cleanedName !== undefined) {
        // Check if there's an address book contact with this name - merge into it
        const targetContact = queryOne<{ id: number; iban: string }>(
          'SELECT id, iban FROM address_book WHERE profile_id = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?))',
          [profileId, cleanedName]
        );

        if (targetContact) {
          // Merge into existing contact
          // 1. Add this IBAN to the target contact
          run(
            'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 1)',
            [targetContact.id, targetContact.iban]
          );
          run(
            'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 0)',
            [targetContact.id, existing.iban]
          );

          // 2. Update transactions
          run(
            `UPDATE transactions SET merchant_name = ? 
             WHERE profile_id = ? AND opposing_account_iban = ? 
             AND opposing_account_name = ?`,
            [cleanedName, profileId, existing.iban, existing.original_name]
          );

          // 3. Delete the shared_iban_merchant entry
          run(
            'DELETE FROM shared_iban_merchants WHERE id = ? AND profile_id = ?',
            [simId, profileId]
          );

          // Return the merged contact
          const mergedContact = queryOne<DBAddressBookEntry>(
            'SELECT * FROM address_book WHERE id = ? AND profile_id = ?',
            [targetContact.id, profileId]
          );

          return res.json({
            success: true,
            data: mergedContact ? mapDBAddressBookEntry(mergedContact) : null,
            merged: true,
            mergedIntoId: targetContact.id,
          });
        } else {
          // No existing contact with this name - create a new address book entry
          const result = run(
            'INSERT INTO address_book (iban, name, profile_id) VALUES (?, ?, ?)',
            [existing.iban, cleanedName, profileId]
          );
          const newContactId = result.lastInsertRowid;

          // Add to contact_ibans
          run(
            'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 1)',
            [newContactId, existing.iban]
          );

          // Update transactions
          run(
            `UPDATE transactions SET merchant_name = ? 
             WHERE profile_id = ? AND opposing_account_iban = ? 
             AND opposing_account_name = ?`,
            [cleanedName, profileId, existing.iban, existing.original_name]
          );

          // Delete the shared_iban_merchant entry
          run(
            'DELETE FROM shared_iban_merchants WHERE id = ? AND profile_id = ?',
            [simId, profileId]
          );

          // Return the new contact
          const newContact = queryOne<DBAddressBookEntry>(
            'SELECT * FROM address_book WHERE id = ? AND profile_id = ?',
            [newContactId, profileId]
          );

          return res.json({
            success: true,
            data: newContact ? mapDBAddressBookEntry(newContact) : null,
            promoted: true,
          });
        }
      }

      // Only notes update (no name change)
      if (notes !== undefined) {
        run(
          'UPDATE shared_iban_merchants SET notes = ? WHERE id = ? AND profile_id = ?',
          [notes, simId, profileId]
        );
      }

      const updated = queryOne<{
        id: number;
        iban: string;
        display_name: string;
        notes: string | null;
        created_at: string;
      }>(
        'SELECT * FROM shared_iban_merchants WHERE id = ? AND profile_id = ?',
        [simId, profileId]
      );

      return res.json({
        success: true,
        data: updated
          ? {
              id: -updated.id,
              iban: updated.iban,
              name: updated.display_name,
              description: null,
              notes: updated.notes,
              createdAt: updated.created_at,
            }
          : null,
      });
    }

    // Regular contact
    const existing = queryOne<DBAddressBookEntry>(
      'SELECT * FROM address_book WHERE id = ? AND profile_id = ?',
      [id, profileId]
    );

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Entry not found' });
    }

    // Check if renaming to a name that already exists (auto-merge)
    if (cleanedName !== undefined && cleanedName.trim() !== existing.name) {
      const targetContact = queryOne<{ id: number; iban: string }>(
        'SELECT id, iban FROM address_book WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND id != ? AND profile_id = ?',
        [cleanedName, id, profileId]
      );

      if (targetContact) {
        // Merge this contact into the target contact
        // 1. Get all IBANs from the current contact
        const currentIbans = query<{ iban: string }>(
          'SELECT ci.iban FROM contact_ibans ci JOIN address_book ab ON ci.contact_id = ab.id WHERE ci.contact_id = ? AND ab.profile_id = ?',
          [id, profileId]
        );

        // Include the primary IBAN if not in junction table
        const allCurrentIbans = new Set(currentIbans.map((i) => i.iban));
        allCurrentIbans.add(existing.iban);

        // 2. Ensure target contact's primary IBAN is in junction table
        run(
          'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 1)',
          [targetContact.id, targetContact.iban]
        );

        // 3. Move all IBANs to target contact
        for (const iban of allCurrentIbans) {
          run(
            'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 0)',
            [targetContact.id, iban]
          );
        }

        // 4. Update transactions to use the new name
        for (const iban of allCurrentIbans) {
          run(
            `UPDATE transactions SET merchant_name = ? 
             WHERE profile_id = ? AND opposing_account_iban = ?`,
            [cleanedName, profileId, iban]
          );
        }

        // 5. Delete the contact_ibans for the old contact
        run('DELETE FROM contact_ibans WHERE contact_id = ?', [id]);

        // 6. Delete the old contact
        run('DELETE FROM address_book WHERE id = ? AND profile_id = ?', [
          id,
          profileId,
        ]);

        // Return the merged target contact
        const mergedContact = queryOne<DBAddressBookEntry>(
          'SELECT * FROM address_book WHERE id = ? AND profile_id = ?',
          [targetContact.id, profileId]
        );

        return res.json({
          success: true,
          data: mergedContact ? mapDBAddressBookEntry(mergedContact) : null,
          merged: true,
          mergedIntoId: targetContact.id,
        });
      }
    }

    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (cleanedName !== undefined) {
      updates.push('name = ?');
      params.push(cleanedName);

      // Get all IBANs for this contact
      const contactIbans = query<{ iban: string }>(
        'SELECT ci.iban FROM contact_ibans ci JOIN address_book ab ON ci.contact_id = ab.id WHERE ci.contact_id = ? AND ab.profile_id = ?',
        [id, profileId]
      );
      const allIbans = new Set(contactIbans.map((i) => i.iban));
      allIbans.add(existing.iban);

      // Update transactions for all IBANs of this contact
      for (const iban of allIbans) {
        // Check if this IBAN is a shared IBAN (has multiple merchants)
        const isShared = queryOne<{ id: number }>(
          'SELECT id FROM shared_ibans WHERE iban = ?',
          [iban]
        );

        if (!isShared) {
          // Only update transactions if not a shared IBAN
          run(
            `UPDATE transactions SET merchant_name = ? 
             WHERE profile_id = ? AND opposing_account_iban = ?`,
            [cleanedName, profileId, iban]
          );
        }
      }
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length > 0) {
      params.push(id);
      run(
        `UPDATE address_book SET ${updates.join(', ')} WHERE id = ? AND profile_id = ?`,
        [...params, profileId]
      );

      // If name was updated, re-sync transactions to ensure merchant_name matches
      if (cleanedName !== undefined) {
        syncTransactionsToContact(id, profileId);
      }
    }

    const updated = queryOne<DBAddressBookEntry>(
      'SELECT * FROM address_book WHERE id = ? AND profile_id = ?',
      [id, profileId]
    );

    res.json({
      success: true,
      data: updated ? mapDBAddressBookEntry(updated) : null,
    });
  } catch (error) {
    console.error('Error updating address book entry:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to update address book entry' });
  }
});

/**
 * @swagger
 * /api/addressbook/{id}:
 *   delete:
 *     summary: Verwijder een adresboek entry
 *     tags: [AddressBook]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Entry verwijderd
 *       404:
 *         description: Entry niet gevonden
 */
router.delete('/:id', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    const id = parseInt(req.params.id);

    if (id < 0) {
      // Shared merchant
      const simId = Math.abs(id);
      const existing = queryOne<{
        id: number;
        iban: string;
        original_name: string;
      }>(
        'SELECT * FROM shared_iban_merchants WHERE id = ? AND profile_id = ?',
        [simId, profileId]
      );

      if (!existing) {
        return res
          .status(404)
          .json({ success: false, error: 'Entry not found' });
      }

      // Reset transactions back to original name
      run(
        `UPDATE transactions SET merchant_name = NULL 
         WHERE profile_id = ? AND opposing_account_iban = ? 
         AND opposing_account_name = ?`,
        [profileId, existing.iban, existing.original_name]
      );

      run('DELETE FROM shared_iban_merchants WHERE id = ? AND profile_id = ?', [
        simId,
        profileId,
      ]);
      return res.json({ success: true, message: 'Entry deleted' });
    }

    const existing = queryOne<DBAddressBookEntry>(
      'SELECT * FROM address_book WHERE id = ? AND profile_id = ?',
      [id, profileId]
    );

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Entry not found' });
    }

    run('DELETE FROM address_book WHERE id = ? AND profile_id = ?', [
      id,
      profileId,
    ]);

    res.json({ success: true, message: 'Entry deleted' });
  } catch (error) {
    console.error('Error deleting address book entry:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to delete address book entry' });
  }
});

/**
 * @swagger
 * /api/addressbook/{id}/ibans:
 *   get:
 *     summary: Haal alle IBANs op voor een contact
 *     tags: [AddressBook]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lijst met IBANs voor dit contact
 */
router.get('/:id/ibans', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const profileId = getEffectiveProfileId(req);

    let ibans: { id: number; iban: string; is_primary: number }[] = [];

    if (id < 0) {
      // Shared merchant - get IBAN from shared_iban_merchants
      const simId = Math.abs(id);
      const sharedIban = queryOne<{ iban: string }>(
        'SELECT iban FROM shared_iban_merchants WHERE id = ? AND profile_id = ?',
        [simId, profileId]
      );

      if (!sharedIban) {
        return res
          .status(404)
          .json({ success: false, error: 'Contact not found' });
      }

      ibans = [{ id: -simId, iban: sharedIban.iban, is_primary: 1 }];
    } else {
      // Regular contact - get IBANs from contact_ibans
      // Ensure the contact itself belongs to the profile
      const contactExists = queryOne<{ id: number }>(
        'SELECT id FROM address_book WHERE id = ? AND profile_id = ?',
        [id, profileId]
      );
      if (!contactExists) {
        return res.status(404).json({
          success: false,
          error: 'Contact not found for this profile',
        });
      }

      ibans = query<{ id: number; iban: string; is_primary: number }>(
        'SELECT id, iban, is_primary FROM contact_ibans WHERE contact_id = ? ORDER BY is_primary DESC, created_at ASC',
        [id]
      );
    }

    res.json({
      success: true,
      data: ibans.map((i) => ({
        id: i.id,
        iban: i.iban,
        isPrimary: i.is_primary === 1,
      })),
    });
  } catch (error) {
    logError('Error fetching contact IBANs:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch contact IBANs' });
  }
});

/**
 * @swagger
 * /api/addressbook/{id}/ibans:
 *   post:
 *     summary: Voeg een IBAN toe aan een bestaand contact
 *     tags: [AddressBook]
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
 *             required:
 *               - iban
 *             properties:
 *               iban:
 *                 type: string
 *     responses:
 *       201:
 *         description: IBAN toegevoegd aan contact
 */
router.post('/:id/ibans', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { iban } = req.body;
    const profileId = getEffectiveProfileId(req);

    if (id < 0) {
      return res.status(400).json({
        success: false,
        error:
          'Shared merchants cannot be modified. Use the resolve functionality to merge them into regular contacts.',
      });
    }

    if (!iban) {
      return res
        .status(400)
        .json({ success: false, error: 'IBAN is required' });
    }

    const normalizedIban = iban.toUpperCase().trim();

    // Check if contact exists and belongs to the profile
    const contact = queryOne<DBAddressBookEntry>(
      'SELECT * FROM address_book WHERE id = ? AND profile_id = ?',
      [id, profileId]
    );

    if (!contact) {
      return res
        .status(404)
        .json({ success: false, error: 'Contact not found for this profile' });
    }

    // Check if IBAN is known as a shared IBAN
    const isSharedIban = queryOne<{ id: number }>(
      'SELECT id FROM shared_ibans WHERE iban = ?',
      [normalizedIban]
    );

    // Check if IBAN is already assigned to another contact within this profile
    // For shared IBANs, we allow multiple contacts to have the same IBAN
    if (!isSharedIban) {
      const existingContact = queryOne<{ contact_id: number; name: string }>(
        `SELECT ci.contact_id, ab.name 
         FROM contact_ibans ci 
         JOIN address_book ab ON ab.id = ci.contact_id
         WHERE ci.iban = ? AND ab.profile_id = ?`,
        [normalizedIban, profileId]
      );

      if (existingContact && existingContact.contact_id !== id) {
        return res.status(400).json({
          success: false,
          error: `IBAN is already assigned to contact "${existingContact.name}"`,
        });
      }
    }

    // If adding a shared IBAN to a regular contact, ensure it has original_name set
    // This transforms it into a "splittable" contact that claims specific transactions
    if (isSharedIban && !contact.original_name) {
      run('UPDATE address_book SET original_name = ? WHERE id = ?', [
        contact.name,
        id,
      ]);
      contact.original_name = contact.name;
    }

    // Add IBAN to contact
    run(
      'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 0)',
      [id, normalizedIban]
    );

    // Sync transactions for the newly added IBAN
    syncTransactionsToContact(id, profileId, normalizedIban);

    res.status(201).json({ success: true, message: 'IBAN added to contact' });
  } catch (error) {
    console.error('Error adding IBAN to contact:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to add IBAN to contact' });
  }
});

/**
 * @swagger
 * /api/addressbook/{id}/ibans/{ibanId}:
 *   delete:
 *     summary: Verwijder een IBAN van een contact
 *     tags: [AddressBook]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: ibanId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: IBAN verwijderd van contact
 */
router.delete('/:id/ibans/:ibanId', (req, res) => {
  try {
    const contactId = parseInt(req.params.id);
    const ibanId = parseInt(req.params.ibanId);
    const profileId = getEffectiveProfileId(req);

    if (contactId < 0) {
      return res.status(400).json({
        success: false,
        error:
          'Shared merchants cannot be modified. Use the resolve functionality to merge them into regular contacts.',
      });
    }

    // Verify contact belongs to profile before deleting its IBAN
    const contactExists = queryOne<{ id: number }>(
      'SELECT id FROM address_book WHERE id = ? AND profile_id = ?',
      [contactId, profileId]
    );
    if (!contactExists) {
      return res
        .status(404)
        .json({ success: false, error: 'Contact not found for this profile' });
    }

    run('DELETE FROM contact_ibans WHERE id = ? AND contact_id = ?', [
      ibanId,
      contactId,
    ]);

    res.json({ success: true, message: 'IBAN removed from contact' });
  } catch (error) {
    console.error('Error removing IBAN from contact:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to remove IBAN from contact' });
  }
});

/**
 * @swagger
 * /api/addressbook/merge-duplicates:
 *   post:
 *     summary: Automatisch samenvoegen van contacten met dezelfde naam
 *     description: >
 *       Vindt alle contacten met dezelfde naam (case-insensitive) en voegt ze samen.
 *       De eerste entry wordt de primaire, alle IBANs worden samengevoegd.
 *     tags: [AddressBook]
 *     responses:
 *       200:
 *         description: Aantal samengevoegde duplicaten
 */
router.post('/merge-duplicates', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);
    // Find duplicate names (case-insensitive)
    const duplicates = query<{ name_lower: string; count: number }>(
      `SELECT LOWER(name) as name_lower, COUNT(*) as count 
       FROM address_book 
       WHERE profile_id = ?
       GROUP BY LOWER(name) 
       HAVING count > 1`,
      [profileId]
    );

    let totalMerged = 0;
    let groupsMerged = 0;

    for (const dup of duplicates) {
      // Get all contacts with this name
      const contacts = query<DBAddressBookEntry>(
        'SELECT * FROM address_book WHERE LOWER(name) = ? AND profile_id = ? ORDER BY id ASC',
        [dup.name_lower, profileId]
      );

      if (contacts.length < 2) continue;

      const primaryContact = contacts[0];
      const secondaryContacts = contacts.slice(1);

      // Ensure primary IBAN is in contact_ibans
      run(
        'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 1)',
        [primaryContact.id, primaryContact.iban]
      );

      // Move all IBANs from secondary contacts to primary
      for (const secondary of secondaryContacts) {
        // Add secondary's primary IBAN to primary contact
        if (secondary.iban) {
          run(
            'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 0)',
            [primaryContact.id, secondary.iban]
          );
        }

        // Move any existing contact_ibans entries
        run(`UPDATE contact_ibans SET contact_id = ? WHERE contact_id = ?`, [
          primaryContact.id,
          secondary.id,
        ]);

        // Delete the secondary contact
        run('DELETE FROM address_book WHERE id = ? AND profile_id = ?', [
          secondary.id,
          profileId,
        ]);
        totalMerged++;
      }

      groupsMerged++;
    }

    res.json({
      success: true,
      data: {
        groupsMerged,
        totalMerged,
        duplicateGroups: duplicates.map((d) => ({
          name: d.name_lower,
          count: d.count,
        })),
      },
    });
  } catch (error) {
    console.error('Error merging duplicate contacts:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to merge duplicate contacts' });
  }
});

/**
 * @swagger
 * /api/addressbook/merge:
 *   post:
 *     summary: Voeg twee of meer contacten samen tot één
 *     description: >
 *       Voegt meerdere contacten samen. De eerste contact ID wordt de primaire
 *       en alle IBANs van de andere contacten worden hieraan toegevoegd.
 *       De andere contacten worden verwijderd.
 *     tags: [AddressBook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contactIds
 *             properties:
 *               contactIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: IDs van te mergen contacten (eerste wordt primair)
 *               name:
 *                 type: string
 *                 description: Optionele nieuwe naam voor het samengevoegde contact
 *     responses:
 *       200:
 *         description: Contacten samengevoegd
 */
router.post('/merge', (req, res) => {
  try {
    const { contactIds, name } = req.body as {
      contactIds: number[];
      name?: string;
    };
    const profileId = getEffectiveProfileId(req);

    if (!contactIds || contactIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 contact IDs are required',
      });
    }

    // Convert negative IDs (shared IBAN merchants) to real address_book entries
    const convertedIds: number[] = [];
    for (const id of contactIds) {
      if (id < 0) {
        // This is a shared IBAN merchant - convert to real contact
        const simId = Math.abs(id);
        const merchant = queryOne<{
          id: number;
          iban: string;
          display_name: string;
          original_name: string;
          notes: string | null;
        }>(
          'SELECT * FROM shared_iban_merchants WHERE id = ? AND profile_id = ?',
          [simId, profileId]
        );

        if (!merchant) {
          return res.status(404).json({
            success: false,
            error: `Shared IBAN merchant with ID ${id} not found`,
          });
        }

        // Check if a contact with this name already exists
        const existingContact = queryOne<{ id: number }>(
          'SELECT id FROM address_book WHERE profile_id = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?))',
          [profileId, merchant.display_name]
        );

        let realContactId: number;
        if (existingContact) {
          // Use existing contact
          realContactId = existingContact.id;
          // Add IBAN to existing contact
          run(
            'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 0)',
            [realContactId, merchant.iban]
          );
        } else {
          // Create new contact
          const result = run(
            'INSERT INTO address_book (iban, name, notes, profile_id) VALUES (?, ?, ?, ?)',
            [merchant.iban, merchant.display_name, merchant.notes, profileId]
          );
          realContactId = Number(result.lastInsertRowid);
          // Add to contact_ibans
          run(
            'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 1)',
            [realContactId, merchant.iban]
          );
        }

        // Update transactions
        run(
          `UPDATE transactions SET merchant_name = ? 
           WHERE profile_id = ? AND opposing_account_iban = ? 
           AND opposing_account_name = ?`,
          [
            merchant.display_name,
            profileId,
            merchant.iban,
            merchant.original_name,
          ]
        );

        // Delete the shared_iban_merchant entry
        run(
          'DELETE FROM shared_iban_merchants WHERE id = ? AND profile_id = ?',
          [simId, profileId]
        );

        convertedIds.push(realContactId);
      } else {
        // Ensure the contact belongs to the profile
        const contactExists = queryOne<{ id: number }>(
          'SELECT id FROM address_book WHERE id = ? AND profile_id = ?',
          [id, profileId]
        );
        if (!contactExists) {
          return res.status(404).json({
            success: false,
            error: `Contact with ID ${id} not found for this profile`,
          });
        }
        convertedIds.push(id);
      }
    }

    // Now use the converted IDs for the merge
    const primaryId = convertedIds[0];
    const secondaryIds = convertedIds.slice(1);

    // Get primary contact
    const primaryContact = queryOne<DBAddressBookEntry>(
      'SELECT * FROM address_book WHERE id = ? AND profile_id = ?',
      [primaryId, profileId]
    );

    if (!primaryContact) {
      return res
        .status(404)
        .json({ success: false, error: 'Primary contact not found' });
    }

    // Get secondary contacts with their original_name for proper transaction matching
    const secondaryContacts = query<{
      id: number;
      iban: string;
      original_name: string | null;
    }>(
      `SELECT id, iban, original_name FROM address_book 
       WHERE id IN (${secondaryIds.map(() => '?').join(',')}) AND profile_id = ?`,
      [...secondaryIds, profileId]
    );

    // Get all IBANs from secondary contacts via contact_ibans (with contact_id)
    const secondaryIbans = query<{ iban: string; contact_id: number }>(
      `SELECT DISTINCT ci.iban, ci.contact_id FROM contact_ibans ci 
        JOIN address_book ab ON ci.contact_id = ab.id
        WHERE ci.contact_id IN (${secondaryIds.map(() => '?').join(',')}) AND ab.profile_id = ?`,
      [...secondaryIds, profileId]
    );

    // Also get IBANs from address_book.iban column for contacts not yet migrated
    const legacyIbans = query<{ iban: string }>(
      `SELECT DISTINCT iban FROM address_book 
        WHERE id IN (${secondaryIds.map(() => '?').join(',')})
        AND profile_id = ?
        AND iban IS NOT NULL AND iban != ''`,
      [...secondaryIds, profileId]
    );

    // Combine all IBANs
    const allIbans = new Set([
      ...secondaryIbans.map((i) => i.iban),
      ...legacyIbans.map((i) => i.iban),
    ]);

    // Add all IBANs to primary contact
    for (const iban of allIbans) {
      run(
        'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 0)',
        [primaryId, iban]
      );
    }

    // Update name if provided
    if (name) {
      run('UPDATE address_book SET name = ? WHERE id = ? AND profile_id = ?', [
        name,
        primaryId,
        profileId,
      ]);
    }

    // Get the final name of the primary contact
    const finalPrimary = queryOne<{ name: string }>(
      'SELECT name FROM address_book WHERE id = ? AND profile_id = ?',
      [primaryId, profileId]
    );
    const finalName = finalPrimary?.name;

    // Update transactions for all merged IBANs
    // For shared IBANs, only update transactions matching the original_name
    if (finalName) {
      for (const iban of allIbans) {
        // Check if this IBAN is a shared IBAN
        const isSharedIban = queryOne<{ id: number }>(
          'SELECT id FROM shared_ibans WHERE iban = ?',
          [iban]
        );

        // Find the original_name for this IBAN from secondary contacts
        const secondaryIbanInfo = secondaryIbans.find((si) => si.iban === iban);
        const secondaryContact = secondaryIbanInfo
          ? secondaryContacts.find((c) => c.id === secondaryIbanInfo.contact_id)
          : secondaryContacts.find((c) => c.iban === iban);
        const originalName = secondaryContact?.original_name;

        if (isSharedIban && originalName) {
          // For shared IBANs, only update transactions that match the original_name
          run(
            `UPDATE transactions SET merchant_name = ?, address_book_id = ?
             WHERE profile_id = ? AND opposing_account_iban = ?
             AND (LOWER(opposing_account_name) = LOWER(?) OR LOWER(merchant_name) = LOWER(?))`,
            [finalName, primaryId, profileId, iban, originalName, originalName]
          );
        } else if (!isSharedIban) {
          // For non-shared IBANs, update all transactions
          run(
            `UPDATE transactions SET merchant_name = ?, address_book_id = ?
             WHERE profile_id = ? AND opposing_account_iban = ?`,
            [finalName, primaryId, profileId, iban]
          );
        }
        // If it's a shared IBAN without original_name, don't update to avoid affecting other merchants
      }
    }

    // Delete secondary contacts (cascade will remove their contact_ibans entries)
    run(
      `DELETE FROM address_book WHERE id IN (${secondaryIds
        .map(() => '?')
        .join(',')}) AND profile_id = ?`,
      [...secondaryIds, profileId]
    );

    res.json({
      success: true,
      data: {
        primaryId,
        mergedCount: secondaryIds.length,
        ibansAdded: allIbans.size,
      },
    });
  } catch (error) {
    console.error('Error merging contacts:', error);
    res.status(500).json({ success: false, error: 'Failed to merge contacts' });
  }
});

/**
 * @swagger
 * /api/addressbook/split:
 *   post:
 *     summary: Splits een contact met meerdere IBANs in losse contacten
 *     description: >
 *       Splits een contact op basis van opgegeven IBAN->naam mappings. Als
 *       een naam al bestaat in het adresboek, wordt er een warning teruggegeven
 *       en de split voor dat IBAN wordt niet uitgevoerd.
 *     tags: [AddressBook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contactId
 *               - mappings
 *             properties:
 *               contactId:
 *                 type: integer
 *               mappings:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     iban:
 *                       type: string
 *                     name:
 *                       type: string
 *     responses:
 *       200:
 *         description: Split uitgevoerd met details
 */
router.post('/split', (req, res) => {
  try {
    const { contactId, mappings } = req.body as {
      contactId: number;
      mappings: Array<{ iban: string; name: string }>;
    };
    const profileId = getEffectiveProfileId(req);

    if (!contactId || !Array.isArray(mappings) || mappings.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: 'contactId and mappings are required' });
    }

    const contact = queryOne<DBAddressBookEntry>(
      'SELECT * FROM address_book WHERE id = ? AND profile_id = ?',
      [contactId, profileId]
    );

    if (!contact) {
      return res
        .status(404)
        .json({ success: false, error: 'Contact not found' });
    }

    const warnings: string[] = [];
    const created: number[] = [];
    const merged: number[] = [];
    const keptOnOriginal: string[] = [];

    for (const m of mappings) {
      const iban = m.iban.toUpperCase().trim();
      const name = m.name.trim();

      // If name already exists (case-insensitive), merge into that contact
      const existingByName = queryOne<DBAddressBookEntry>(
        'SELECT * FROM address_book WHERE profile_id = ? AND LOWER(name) = LOWER(?)',
        [profileId, name]
      );
      if (existingByName) {
        if (existingByName.id === contactId) {
          // Name equals original contact name: keep this IBAN on original (no-op)
          keptOnOriginal.push(iban);
          continue;
        }

        // Merge into existing contact - add IBAN and update transactions
        run(
          'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 0)',
          [existingByName.id, iban]
        );

        // Update transactions to point to the existing contact
        run(
          `UPDATE transactions SET merchant_name = ?, address_book_id = ? WHERE profile_id = ? AND opposing_account_iban = ?`,
          [existingByName.name, existingByName.id, profileId, iban]
        );

        // Remove this IBAN from the original contact
        run('DELETE FROM contact_ibans WHERE contact_id = ? AND iban = ?', [
          contactId,
          iban,
        ]);

        // If original address_book.iban equals this iban, clear it
        if (contact.iban === iban) {
          run(
            'UPDATE address_book SET iban = NULL WHERE id = ? AND profile_id = ?',
            [contactId, profileId]
          );
        }

        merged.push(existingByName.id);
        continue;
      }

      // Check if IBAN is already assigned to a DIFFERENT contact (in contact_ibans)
      const existingIban = queryOne<{ contact_id: number }>(
        'SELECT contact_id FROM contact_ibans WHERE iban = ? AND contact_id != ?',
        [iban, contactId]
      );
      if (existingIban) {
        // IBAN exists on another contact - update transactions to point there
        const existingContact = queryOne<DBAddressBookEntry>(
          'SELECT * FROM address_book WHERE id = ? AND profile_id = ?',
          [existingIban.contact_id, profileId]
        );
        if (existingContact) {
          run(
            `UPDATE transactions SET merchant_name = ?, address_book_id = ? WHERE profile_id = ? AND opposing_account_iban = ?`,
            [name, existingContact.id, profileId, iban]
          );

          // Remove from original contact
          run('DELETE FROM contact_ibans WHERE contact_id = ? AND iban = ?', [
            contactId,
            iban,
          ]);

          if (contact.iban === iban) {
            run(
              'UPDATE address_book SET iban = NULL WHERE id = ? AND profile_id = ?',
              [contactId, profileId]
            );
          }

          merged.push(existingContact.id);
          continue;
        }
      }

      // Create new contact with this IBAN and name
      // Set original_name to avoid UNIQUE(iban, profile_id, original_name) constraint violation
      const result = run(
        'INSERT INTO address_book (iban, name, description, notes, profile_id, original_name) VALUES (?, ?, NULL, NULL, ?, ?)',
        [iban, name, profileId, name]
      );
      const newId = Number(result.lastInsertRowid);
      created.push(newId);

      // Add contact_iban entry (use INSERT OR REPLACE to handle any existing entries)
      run(
        'INSERT OR REPLACE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 1)',
        [newId, iban]
      );

      // Update transactions to use new merchant_name and address_book_id
      run(
        `UPDATE transactions SET merchant_name = ?, address_book_id = ? WHERE profile_id = ? AND opposing_account_iban = ?`,
        [name, newId, profileId, iban]
      );

      // Remove this IBAN from the original contact's contact_ibans
      run('DELETE FROM contact_ibans WHERE contact_id = ? AND iban = ?', [
        contactId,
        iban,
      ]);

      // If original address_book.iban equals this iban, clear it
      if (contact.iban === iban) {
        run(
          'UPDATE address_book SET iban = NULL WHERE id = ? AND profile_id = ?',
          [contactId, profileId]
        );
      }
    }

    // If after removing IBANs the original contact has no IBANs left, delete it
    const remaining = queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM contact_ibans WHERE contact_id = ?',
      [contactId]
    );
    // Also check if address_book.iban is null
    const origContact = queryOne<DBAddressBookEntry>(
      'SELECT * FROM address_book WHERE id = ? AND profile_id = ?',
      [contactId, profileId]
    );
    if (
      (!remaining || remaining.count === 0) &&
      (!origContact || !origContact.iban)
    ) {
      run('DELETE FROM address_book WHERE id = ? AND profile_id = ?', [
        contactId,
        profileId,
      ]);
    }

    res.json({
      success: true,
      data: { created, merged, warnings, keptOnOriginal },
    });
  } catch (error) {
    console.error('Error splitting contact:', error);
    res.status(500).json({ success: false, error: 'Failed to split contact' });
  }
});

export default router;
