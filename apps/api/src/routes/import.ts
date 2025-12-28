import { Router } from 'express';
import multer from 'multer';
import { query, queryOne, run } from '../db/index.js';
import {
  parseINGCSV,
  convertINGToTransactions,
  parseGenericCSV,
  convertGenericToTransactions,
  type ColumnMapping,
  type ParsedGenericTransaction,
} from '../services/csv-parser.js';
import { applyCategoryRules } from '../services/categorization.js';
import { getEffectiveProfileId } from '../middleware/profileAuth.js';
import type { TransactionCreate } from '@fluxby/shared';

const router = Router();

/**
 * Get active cleanup rules and apply them to a name
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
 * Check if an IBAN is a shared IBAN (used by payment processors with multiple merchants)
 */
function isSharedIban(iban: string): boolean {
  const shared = queryOne<{ id: number }>(
    'SELECT id FROM shared_ibans WHERE iban = ?',
    [iban]
  );
  return !!shared;
}

/**
 * Check if an IBAN has multiple different merchant names in transactions
 * Returns the count of different names
 */
function _getIbanNameCount(iban: string): number {
  const result = queryOne<{ name_count: number }>(
    `SELECT COUNT(DISTINCT opposing_account_name) as name_count 
     FROM transactions 
     WHERE opposing_account_iban = ?`,
    [iban]
  );
  return result?.name_count || 0;
}

/**
 * Move an IBAN from address_book to shared_ibans
 */
function moveToSharedIbans(iban: string): void {
  // Remove from address book
  run('DELETE FROM address_book WHERE iban = ?', [iban]);
  // Add to shared_ibans (if not already there)
  run('INSERT OR IGNORE INTO shared_ibans (iban) VALUES (?)', [iban]);
}

/**
 * Add IBAN to address book with cleaned name if not already present
 * Also excludes our own accounts and shared IBANs (payment processors)
 *
 * If an IBAN already exists in address_book but with a different name,
 * it means this is a shared IBAN (e.g., Adyen, Mollie) and should be
 * moved to the shared_ibans table instead.
 *
 * If a contact with the same name already exists, the IBAN is merged
 * into the existing contact (added to contact_ibans junction table).
 *
 * @param profileId - The profile ID to associate the address book entry with
 */
function addToAddressBookIfNew(
  iban: string,
  name: string,
  cleanupRules: { pattern: string }[],
  profileId: number
): boolean {
  // Skip empty IBANs
  if (!iban || iban.trim() === '') return false;

  // Normalize IBAN to uppercase for consistent matching
  const normalizedIban = iban.toUpperCase().trim();

  // Skip if IBAN is one of our own accounts
  const isOwnAccount = queryOne<{ id: number }>(
    'SELECT id FROM accounts WHERE iban = ?',
    [normalizedIban]
  );
  if (isOwnAccount) return false;

  // Skip if already marked as shared IBAN
  if (isSharedIban(normalizedIban)) return false;

  // Apply cleanup rules to name
  const cleanedName = applyCleanupRules(name, cleanupRules);

  // Check if IBAN already exists in contact_ibans for this profile
  const existingIbanLink = queryOne<{ contact_id: number }>(
    `SELECT ci.contact_id FROM contact_ibans ci 
     JOIN address_book ab ON ab.id = ci.contact_id
     WHERE ci.iban = ? AND ab.profile_id = ?`,
    [normalizedIban, profileId]
  );
  if (existingIbanLink) {
    // IBAN is already linked to a contact, nothing to do
    return false;
  }

  // Check if IBAN already in address book for this profile (legacy check)
  const existingEntry = queryOne<{ id: number; name: string }>(
    'SELECT id, name FROM address_book WHERE iban = ? AND profile_id = ?',
    [normalizedIban, profileId]
  );

  if (existingEntry) {
    // Check if the name is different (after cleanup)
    if (existingEntry.name !== cleanedName) {
      // This IBAN has multiple different names - it's a shared IBAN
      // Move it to shared_ibans table
      moveToSharedIbans(normalizedIban);
      return false;
    }
    // Same name, already exists - nothing to do
    return false;
  }

  // Check if this IBAN already has multiple names in transactions for this profile
  const nameCount =
    queryOne<{ name_count: number }>(
      `SELECT COUNT(DISTINCT opposing_account_name) as name_count 
     FROM transactions 
     WHERE opposing_account_iban = ? AND profile_id = ?`,
      [normalizedIban, profileId]
    )?.name_count || 0;

  if (nameCount > 1) {
    // This IBAN has multiple merchants - add to shared_ibans instead
    run('INSERT OR IGNORE INTO shared_ibans (iban) VALUES (?)', [
      normalizedIban,
    ]);
    return false;
  }

  // Check if a contact with the same name already exists for this profile (case-insensitive)
  const existingContactByName = queryOne<{ id: number; iban: string }>(
    'SELECT id, iban FROM address_book WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND profile_id = ?',
    [cleanedName, profileId]
  );

  if (existingContactByName) {
    // A contact with this name already exists - merge the IBAN into it
    // Add the new IBAN to the contact_ibans junction table
    run(
      'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 0)',
      [existingContactByName.id, normalizedIban]
    );
    // Also ensure the existing primary IBAN is in the junction table
    run(
      'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 1)',
      [existingContactByName.id, existingContactByName.iban]
    );
    return true; // Count as added (merged)
  }

  // Insert into address book as a new contact with profile_id
  const result = run(
    'INSERT OR IGNORE INTO address_book (iban, name, profile_id) VALUES (?, ?, ?)',
    [normalizedIban, cleanedName, profileId]
  );

  // Also add to contact_ibans junction table
  if (result.changes > 0) {
    const newContactId = result.lastInsertRowid;
    run(
      'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 1)',
      [newContactId, normalizedIban]
    );
  }

  return result.changes > 0;
}

function getExistingImportHashes(): Set<string> {
  const rows = query<{ import_hash: string }>(
    "SELECT import_hash FROM transactions WHERE import_hash IS NOT NULL AND TRIM(import_hash) != ''"
  );
  return new Set(rows.map((row) => row.import_hash));
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

/**
 * @swagger
 * /api/import/csv:
 *   post:
 *     summary: Upload en importeer een CSV bestand
 *     tags: [Import]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV bestand (max 10MB)
 *               bank:
 *                 type: string
 *                 default: ing
 *                 description: Bank type (momenteel alleen 'ing' ondersteund)
 *     responses:
 *       200:
 *         description: Import succesvol
 *       400:
 *         description: Geen bestand of ongeldige bank
 */
router.post('/csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: 'Geen bestand geüpload' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const filename = req.file.originalname;
    const bank = (req.body.bank as string) || 'ing';
    const profileId = getEffectiveProfileId(req);

    // Parse CSV based on bank
    let ingTransactions;
    if (bank === 'ing') {
      ingTransactions = parseINGCSV(csvContent);
    } else {
      return res.status(400).json({
        success: false,
        error: `Bank '${bank}' wordt nog niet ondersteund`,
      });
    }

    if (ingTransactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Geen transacties gevonden in CSV bestand',
      });
    }

    // Get or create account based on IBAN
    const iban = ingTransactions[0].rekening;
    let account = queryOne<{ id: number; profile_id: number }>(
      'SELECT id, profile_id FROM accounts WHERE iban = ?',
      [iban]
    );

    if (!account) {
      // Create the account automatically
      const result = run(
        'INSERT INTO accounts (name, type, iban, current_balance, profile_id) VALUES (?, ?, ?, ?, ?)',
        [`ING Rekening ${iban.slice(-4)}`, 'checking', iban, 0, profileId]
      );
      account = { id: result.lastInsertRowid as number, profile_id: profileId };
    }

    // Convert to our transaction format
    const transactions = convertINGToTransactions(ingTransactions, account.id);

    // Skip any entries that already exist (all months, including current month)
    const existingHashes = getExistingImportHashes();
    const seenInThisFile = new Set<string>();
    const newTransactions = [] as typeof transactions;
    const skippedExisting = [] as typeof transactions;
    const skippedInFile = [] as typeof transactions;

    for (const tx of transactions) {
      const hash = tx.importHash;
      if (!hash || hash.trim() === '') {
        // Safety: if we ever get an empty hash, treat as "new" (will still insert)
        newTransactions.push(tx);
        continue;
      }

      if (existingHashes.has(hash)) {
        skippedExisting.push(tx);
        continue;
      }

      if (seenInThisFile.has(hash)) {
        skippedInFile.push(tx);
        continue;
      }

      seenInThisFile.add(hash);
      newTransactions.push(tx);
    }

    // Apply auto-categorization rules (profile-specific)
    const categorizedTransactions = applyCategoryRules(
      newTransactions,
      profileId
    );

    // If any transaction's opposing IBAN belongs to one of the user's accounts,
    // it's an internal transfer between our accounts. Ensure it's marked as
    // a transfer and assign the Overboekingen category (id=10) so both sides
    // of the transfer are consistently recognized.
    const opposingIbans = [
      ...new Set(
        categorizedTransactions
          .map((t) => t.opposingAccountIban)
          .filter((iban) => iban && iban.trim() !== '')
      ),
    ];
    if (opposingIbans.length > 0) {
      const existingOpposing = query<{ iban: string }>(
        `SELECT iban FROM accounts WHERE iban IN (${opposingIbans
          .map(() => '?')
          .join(',')})`,
        opposingIbans
      );
      const knownIbans = new Set(existingOpposing.map((r) => r.iban));
      for (const tx of categorizedTransactions) {
        if (tx.opposingAccountIban && knownIbans.has(tx.opposingAccountIban)) {
          tx.type = 'transfer';
          tx.categoryId = 10;
        }
      }
    }

    // Auto-detect savings account transfers by name matching.
    // If the opposing account name matches the name of a savings account,
    // mark it as a transfer (overboeking).
    const savingsAccounts = query<{ name: string }>(
      `SELECT name FROM accounts WHERE type = 'savings' AND profile_id = ?`,
      [profileId]
    );
    if (savingsAccounts.length > 0) {
      // Create lowercase set of savings account names for comparison
      const savingsNames = new Set(
        savingsAccounts.map((a) => a.name.toLowerCase().trim())
      );

      for (const tx of categorizedTransactions) {
        // Skip if already marked as transfer
        if (tx.type === 'transfer') continue;

        // Check if opposing account name or merchant name matches a savings account
        const opposingName = tx.opposingAccountName?.toLowerCase().trim();
        const merchantName = tx.merchantName?.toLowerCase().trim();
        const description = tx.description?.toLowerCase().trim();

        if (
          (opposingName && savingsNames.has(opposingName)) ||
          (merchantName && savingsNames.has(merchantName)) ||
          // Also check if any savings account name appears in the description
          (description &&
            [...savingsNames].some((savingsName) =>
              description.includes(savingsName)
            ))
        ) {
          tx.type = 'transfer';
          tx.categoryId = 10;
        }
      }
    }

    // Build skipped rows data for storage
    const skippedRowsData = [
      ...skippedExisting.map((tx, idx) => ({
        rowIndex: idx + 1,
        date: tx.date,
        amount: tx.amount,
        description: tx.description,
        iban: tx.opposingAccountIban,
        counterparty: tx.opposingAccountName,
        balance: tx.balanceAfter,
        error: 'duplicate' as const,
      })),
      ...skippedInFile.map((tx, idx) => ({
        rowIndex: skippedExisting.length + idx + 1,
        date: tx.date,
        amount: tx.amount,
        description: tx.description,
        iban: tx.opposingAccountIban,
        counterparty: tx.opposingAccountName,
        balance: tx.balanceAfter,
        error: 'duplicate' as const,
      })),
    ];

    // Create import record with skipped rows
    const importResult = run(
      'INSERT INTO imports (filename, bank, transaction_count, status, duplicates_skipped, skipped_rows) VALUES (?, ?, ?, ?, ?, ?)',
      [
        filename,
        bank,
        categorizedTransactions.length,
        'pending',
        skippedExisting.length + skippedInFile.length,
        JSON.stringify(skippedRowsData),
      ]
    );
    const importId = Number(importResult.lastInsertRowid);

    // Get cleanup rules to apply to transaction names
    const cleanupRules = getCleanupRules();

    // Insert transactions (skip duplicates via unique index/constraint on import_hash)
    let insertedCount = 0;
    const insertStmt = `INSERT OR IGNORE INTO transactions (
        date, amount, type, description, merchant_name,
        account_id, opposing_account_iban, opposing_account_name,
        category_id, notes, balance_after, payment_method, raw_data, import_hash,
        profile_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    for (const tx of categorizedTransactions) {
      // Apply cleanup rules to names before inserting
      const cleanedOpposingName = tx.opposingAccountName
        ? applyCleanupRules(tx.opposingAccountName, cleanupRules)
        : tx.opposingAccountName;
      const cleanedMerchantName = tx.merchantName
        ? applyCleanupRules(tx.merchantName, cleanupRules)
        : tx.merchantName;

      const result = run(insertStmt, [
        tx.date,
        tx.amount,
        tx.type,
        tx.description,
        cleanedMerchantName,
        tx.accountId,
        tx.opposingAccountIban,
        cleanedOpposingName,
        tx.categoryId,
        tx.notes,
        tx.balanceAfter,
        tx.paymentMethod,
        tx.rawData,
        tx.importHash,
        profileId,
      ]);

      if (result.changes > 0) {
        insertedCount += result.changes;
      }
    }

    // Auto-add new IBANs to address book with cleanup rules applied
    let _addressBookAdded = 0;

    // Get unique opposing IBANs from newly imported transactions
    const uniqueIbanMap = new Map<string, string>();
    for (const tx of categorizedTransactions) {
      if (tx.opposingAccountIban && tx.opposingAccountIban.trim() !== '') {
        if (!uniqueIbanMap.has(tx.opposingAccountIban)) {
          uniqueIbanMap.set(
            tx.opposingAccountIban,
            tx.opposingAccountName || tx.merchantName || 'Onbekend'
          );
        }
      }
    }

    // Add each unique IBAN to address book
    for (const [iban, name] of uniqueIbanMap) {
      if (addToAddressBookIfNew(iban, name, cleanupRules, profileId)) {
        _addressBookAdded++;
      }
    }

    // Link newly imported transactions to their address book entries
    // This handles both direct IBAN matches and contact_ibans junction table matches
    // Note: We do NOT overwrite the transaction's merchant_name - that comes from the CSV
    // and should only be changed by explicit user action

    // 1. Link via direct address_book IBAN match
    run(
      `UPDATE transactions
       SET address_book_id = (
         SELECT ab.id FROM address_book ab 
         WHERE ab.iban = transactions.opposing_account_iban
         AND ab.profile_id = ?
       )
       WHERE opposing_account_iban IN (SELECT iban FROM address_book WHERE profile_id = ?)
         AND profile_id = ?
         AND address_book_id IS NULL
         AND import_hash IN (${categorizedTransactions
           .map(() => '?')
           .join(',')})`,
      [
        profileId,
        profileId,
        profileId,
        ...categorizedTransactions.map((tx) => tx.importHash),
      ]
    );

    // 2. Link via contact_ibans junction table (for contacts with multiple IBANs)
    run(
      `UPDATE transactions
       SET address_book_id = (
         SELECT ci.contact_id FROM contact_ibans ci
         JOIN address_book ab ON ab.id = ci.contact_id
         WHERE ci.iban = transactions.opposing_account_iban
         AND ab.profile_id = ?
       )
       WHERE opposing_account_iban IN (SELECT iban FROM contact_ibans ci JOIN address_book ab ON ab.id = ci.contact_id WHERE ab.profile_id = ?)
         AND profile_id = ?
         AND address_book_id IS NULL
         AND import_hash IN (${categorizedTransactions
           .map(() => '?')
           .join(',')})`,
      [
        profileId,
        profileId,
        profileId,
        ...categorizedTransactions.map((tx) => tx.importHash),
      ]
    );

    // 3. For shared IBANs: if an existing transaction with same IBAN+name has an address_book_id,
    // link new transactions with the same IBAN+name to the same address
    run(
      `UPDATE transactions AS t
       SET address_book_id = (
         SELECT t2.address_book_id 
         FROM transactions t2 
         WHERE t2.opposing_account_iban = t.opposing_account_iban
           AND t2.opposing_account_name = t.opposing_account_name
           AND t2.address_book_id IS NOT NULL
           AND t2.profile_id = ?
         LIMIT 1
       )
       WHERE t.opposing_account_iban IN (SELECT iban FROM shared_ibans)
         AND t.profile_id = ?
         AND t.address_book_id IS NULL
         AND t.import_hash IN (${categorizedTransactions
           .map(() => '?')
           .join(',')})`,
      [
        profileId,
        profileId,
        ...categorizedTransactions.map((tx) => tx.importHash),
      ]
    );

    // Ensure existing transactions in the database that reference one of our
    // own accounts as the opposing account are also marked as transfers.
    // This helps fix older imports where only one side was detected as a
    // transfer and prevents double-counting in totals.
    run(
      `UPDATE transactions
       SET type = 'transfer', category_id = 10
       WHERE opposing_account_iban IN (SELECT iban FROM accounts)`
    );

    // Update account balance to the latest known balance_after for this account
    const latest = queryOne<{ balance_after: number }>(
      `SELECT balance_after
       FROM transactions
       WHERE account_id = ? AND balance_after IS NOT NULL
       ORDER BY date DESC, id DESC
       LIMIT 1`,
      [account.id]
    );
    if (latest && typeof latest.balance_after === 'number') {
      run('UPDATE accounts SET current_balance = ? WHERE id = ?', [
        latest.balance_after,
        account.id,
      ]);
    }

    // Update import status
    run('UPDATE imports SET transaction_count = ?, status = ? WHERE id = ?', [
      insertedCount,
      'completed',
      importId,
    ]);

    res.json({
      success: true,
      data: {
        importId,
        filename,
        bank,
        totalInFile: ingTransactions.length,
        imported: insertedCount,
        skippedExisting: skippedExisting.length,
        skippedInFile: skippedInFile.length,
        skippedTotal:
          skippedExisting.length +
          skippedInFile.length +
          (categorizedTransactions.length - insertedCount),
        accountId: account.id,
        iban,
      },
    });
  } catch (error) {
    console.error('Error importing CSV:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Fout bij importeren CSV',
    });
  }
});

/**
 * @swagger
 * /api/import/history:
 *   get:
 *     summary: Get import history for the current profile
 *     description: >
 *       Returns the 10 most recent imports that have transactions
 *       belonging to the current profile. Includes details about
 *       skipped rows, duplicates, and parse errors.
 *     tags: [Import]
 *     responses:
 *       200:
 *         description: Import history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       filename:
 *                         type: string
 *                       bank:
 *                         type: string
 *                       importedAt:
 *                         type: string
 *                         format: date-time
 *                       transactionCount:
 *                         type: integer
 *                       status:
 *                         type: string
 *                       skippedRows:
 *                         type: array
 *                         description: Details of rows that were skipped during import
 *                         items:
 *                           type: object
 *                           properties:
 *                             row:
 *                               type: integer
 *                             reason:
 *                               type: string
 *                             data:
 *                               type: string
 *                       duplicatesSkipped:
 *                         type: integer
 *                       parseErrors:
 *                         type: integer
 *       500:
 *         description: Server error
 */
router.get('/history', (req, res) => {
  try {
    const profileId = getEffectiveProfileId(req);

    // Get imports that have transactions belonging to this profile
    // Limit to 10 most recent imports and delete older ones
    const imports = query<{
      id: number;
      filename: string;
      bank: string;
      imported_at: string;
      transaction_count: number;
      status: string;
      skipped_rows: string | null;
      duplicates_skipped: number | null;
      parse_errors: number | null;
    }>(
      `
      SELECT DISTINCT i.id, i.filename, i.bank, i.imported_at, i.transaction_count, i.status,
             i.skipped_rows, i.duplicates_skipped, i.parse_errors
      FROM imports i
      INNER JOIN transactions t ON t.profile_id = ?
      WHERE i.imported_at >= (
        SELECT MIN(t2.created_at) FROM transactions t2 WHERE t2.profile_id = ?
      )
      ORDER BY i.imported_at DESC
      LIMIT 10
    `,
      [profileId, profileId]
    );

    // Clean up old imports (keep only 10 most recent per profile)
    run(
      `
      DELETE FROM imports
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT DISTINCT i.id
          FROM imports i
          INNER JOIN transactions t ON t.profile_id = ?
          WHERE i.imported_at >= (
            SELECT MIN(t2.created_at) FROM transactions t2 WHERE t2.profile_id = ?
          )
          ORDER BY i.imported_at DESC
          LIMIT 10
        )
      )
    `,
      [profileId, profileId]
    );

    res.json({
      success: true,
      data: imports.map((row) => ({
        id: row.id,
        filename: row.filename,
        bank: row.bank,
        importedAt: row.imported_at,
        transactionCount: row.transaction_count,
        status: row.status,
        skippedRows: row.skipped_rows ? JSON.parse(row.skipped_rows) : [],
        duplicatesSkipped: row.duplicates_skipped || 0,
        parseErrors: row.parse_errors || 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching import history:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch import history' });
  }
});

/**
 * @swagger
 * /api/import/generic/parse:
 *   post:
 *     summary: Parse a generic CSV file and return headers for mapping
 *     tags: [Import]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file (max 10MB)
 *     responses:
 *       200:
 *         description: CSV parsed successfully
 *       400:
 *         description: Invalid file or parsing error
 */
router.post('/generic/parse', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: 'No file uploaded' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const result = parseGenericCSV(csvContent);

    res.json({
      success: true,
      data: {
        headers: result.headers,
        sampleRows: result.sampleRows,
        totalRows: result.totalRows,
      },
    });
  } catch (error) {
    console.error('Error parsing CSV:', error);
    res.status(500).json({ success: false, error: 'Failed to parse CSV file' });
  }
});

/**
 * @swagger
 * /api/import/generic/import:
 *   post:
 *     summary: Import transactions from a generic CSV file with column mapping
 *     tags: [Import]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - mapping
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file (max 10MB)
 *               mapping:
 *                 type: string
 *                 description: JSON string with column mapping
 *               accountId:
 *                 type: number
 *                 description: Account ID to import transactions to
 *     responses:
 *       200:
 *         description: Import successful
 *       400:
 *         description: Invalid file, mapping, or account
 */
router.post('/generic/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: 'No file uploaded' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const filename = req.file.originalname;
    const profileId = getEffectiveProfileId(req);

    // Parse mapping from request body
    let mapping: ColumnMapping;
    try {
      mapping = JSON.parse(req.body.mapping);
    } catch {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid column mapping' });
    }

    // Validate required mapping fields
    if (!mapping.date || !mapping.amount || !mapping.description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required mapping fields (date, amount, description)',
      });
    }

    // Parse and convert CSV
    const parsed = parseGenericCSV(csvContent);

    // Collect all unique IBANs from the 'iban' column (user's accounts)
    const uniqueOwnIbans = new Set<string>();
    if (mapping.iban) {
      for (const row of parsed.rows) {
        const iban = row[mapping.iban]?.trim().toUpperCase();
        if (iban && iban.length > 5) {
          uniqueOwnIbans.add(iban);
        }
      }
    }

    // Create a map of IBAN -> account ID
    const ibanToAccountId = new Map<string, number>();

    // Process each unique IBAN and create accounts if needed
    for (const iban of uniqueOwnIbans) {
      // Check if account already exists
      const existingAccount = queryOne<{ id: number }>(
        'SELECT id FROM accounts WHERE iban = ? AND profile_id = ?',
        [iban, profileId]
      );

      if (existingAccount) {
        ibanToAccountId.set(iban, existingAccount.id);
      } else {
        // Create new account for this IBAN
        const result = run(
          'INSERT INTO accounts (name, type, iban, current_balance, profile_id) VALUES (?, ?, ?, ?, ?)',
          [`Rekening ${iban.slice(-4)}`, 'checking', iban, 0, profileId]
        );
        const newAccountId = result.lastInsertRowid as number;
        ibanToAccountId.set(iban, newAccountId);
      }
    }

    // Fallback: if no IBAN column or no IBANs found, use/create a default account
    let defaultAccountId: number | null = null;
    if (ibanToAccountId.size === 0) {
      const account = queryOne<{ id: number }>(
        'SELECT id FROM accounts WHERE profile_id = ? LIMIT 1',
        [profileId]
      );

      if (account) {
        defaultAccountId = account.id;
      } else {
        // Create a generic account
        const result = run(
          'INSERT INTO accounts (name, type, iban, current_balance, profile_id) VALUES (?, ?, ?, ?, ?)',
          [
            'Imported Account',
            'checking',
            `GENERIC-${Date.now()}`,
            0,
            profileId,
          ]
        );
        defaultAccountId = result.lastInsertRowid as number;
      }
    }

    // Convert rows to transactions, assigning correct account IDs
    const transactions: TransactionCreate[] = [];
    const errors: ParsedGenericTransaction[] = [];

    for (let index = 0; index < parsed.rows.length; index++) {
      const row = parsed.rows[index];
      const ownIban = mapping.iban
        ? row[mapping.iban]?.trim().toUpperCase()
        : null;

      // Determine account ID for this transaction
      let accountId: number;
      if (ownIban && ibanToAccountId.has(ownIban)) {
        accountId =
          ibanToAccountId.get(ownIban) ??
          defaultAccountId ??
          Array.from(ibanToAccountId.values())[0];
      } else if (defaultAccountId) {
        accountId = defaultAccountId;
      } else {
        // Fallback: use first account in map
        accountId = Array.from(ibanToAccountId.values())[0];
      }

      // Use the conversion function for this single row
      const { transactions: rowTx, errors: rowErrors } =
        convertGenericToTransactions([row], mapping, accountId);

      // Adjust row indices in errors
      for (const err of rowErrors) {
        err.rowIndex = index + 1;
        errors.push(err);
      }

      transactions.push(...rowTx);
    }

    // Get ALL existing hashes to check for duplicates (global check due to UNIQUE constraint)
    const existingHashes = new Set(
      query<{ import_hash: string }>(
        'SELECT import_hash FROM transactions WHERE import_hash IS NOT NULL'
      ).map((row) => row.import_hash)
    );

    // Also track hashes within this import to avoid duplicates in the CSV itself
    const seenInThisImport = new Set<string>();

    // Filter out duplicates (existing in DB or duplicates within CSV)
    const newTransactions = transactions.filter((tx) => {
      if (
        existingHashes.has(tx.importHash) ||
        seenInThisImport.has(tx.importHash)
      ) {
        return false;
      }
      seenInThisImport.add(tx.importHash);
      return true;
    });
    const duplicateCount = transactions.length - newTransactions.length;

    // Mark duplicates in errors
    const duplicateErrors = transactions
      .filter((tx) => existingHashes.has(tx.importHash))
      .map((tx, idx) => ({
        rowIndex: idx + 1,
        date: tx.date,
        amount: tx.amount,
        description: tx.description,
        iban: tx.opposingAccountIban,
        counterparty: tx.opposingAccountName,
        balance: tx.balanceAfter,
        rawData: JSON.parse(tx.rawData || '{}'),
        error: 'duplicate' as const,
      }));

    // Create import record
    const importResult = run(
      `INSERT INTO imports (filename, bank, transaction_count, status, skipped_rows, duplicates_skipped, parse_errors)
       VALUES (?, ?, ?, 'pending', ?, ?, ?)`,
      [
        filename,
        req.body.bank || 'generic',
        newTransactions.length,
        JSON.stringify([...errors, ...duplicateErrors]),
        duplicateCount,
        errors.length,
      ]
    );
    const importId = importResult.lastInsertRowid as number;

    // Apply category rules to all new transactions
    const categorizedTransactions = applyCategoryRules(
      newTransactions,
      profileId
    );

    // If any transaction's opposing IBAN belongs to one of the user's accounts,
    // it's an internal transfer. Mark as transfer and assign Overboekingen category.
    const opposingIbans = [
      ...new Set(
        categorizedTransactions
          .map((t) => t.opposingAccountIban)
          .filter((iban) => iban && iban.trim() !== '')
      ),
    ];
    if (opposingIbans.length > 0) {
      const existingOpposing = query<{ iban: string }>(
        `SELECT iban FROM accounts WHERE iban IN (${opposingIbans
          .map(() => '?')
          .join(',')})`,
        opposingIbans
      );
      const knownIbans = new Set(existingOpposing.map((r) => r.iban));
      for (const tx of categorizedTransactions) {
        if (tx.opposingAccountIban && knownIbans.has(tx.opposingAccountIban)) {
          tx.type = 'transfer';
          tx.categoryId = 10;
        }
      }
    }

    // Auto-detect savings account transfers by name matching.
    const savingsAccountsGeneric = query<{ name: string }>(
      `SELECT name FROM accounts WHERE type = 'savings' AND profile_id = ?`,
      [profileId]
    );
    if (savingsAccountsGeneric.length > 0) {
      const savingsNamesGeneric = new Set(
        savingsAccountsGeneric.map((a) => a.name.toLowerCase().trim())
      );

      for (const tx of categorizedTransactions) {
        if (tx.type === 'transfer') continue;

        const opposingName = tx.opposingAccountName?.toLowerCase().trim();
        const merchantName = tx.merchantName?.toLowerCase().trim();
        const description = tx.description?.toLowerCase().trim();

        if (
          (opposingName && savingsNamesGeneric.has(opposingName)) ||
          (merchantName && savingsNamesGeneric.has(merchantName)) ||
          (description &&
            [...savingsNamesGeneric].some((savingsName) =>
              description.includes(savingsName)
            ))
        ) {
          tx.type = 'transfer';
          tx.categoryId = 10;
        }
      }
    }

    // Get cleanup rules
    const cleanupRules = getCleanupRules();
    let importedCount = 0;

    // Insert transactions (use OR IGNORE for any edge cases)
    for (const tx of categorizedTransactions) {
      // Apply cleanup rules to names before inserting
      const cleanedOpposingName = tx.opposingAccountName
        ? applyCleanupRules(tx.opposingAccountName, cleanupRules)
        : tx.opposingAccountName;
      const cleanedMerchantName = tx.merchantName
        ? applyCleanupRules(tx.merchantName, cleanupRules)
        : tx.merchantName;

      const result = run(
        `INSERT OR IGNORE INTO transactions (
          date, amount, type, description, merchant_name, account_id,
          opposing_account_iban, opposing_account_name, category_id,
          notes, balance_after, payment_method, raw_data, import_hash, profile_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tx.date,
          tx.amount,
          tx.type,
          tx.description,
          cleanedMerchantName,
          tx.accountId,
          tx.opposingAccountIban,
          cleanedOpposingName,
          tx.categoryId,
          tx.notes,
          tx.balanceAfter,
          tx.paymentMethod,
          tx.rawData,
          tx.importHash,
          profileId,
        ]
      );

      // Only count if actually inserted (changes > 0)
      if (result.changes > 0) {
        // Add to address book if IBAN present
        if (tx.opposingAccountIban && tx.opposingAccountName) {
          addToAddressBookIfNew(
            tx.opposingAccountIban,
            tx.opposingAccountName,
            cleanupRules,
            profileId
          );
        }

        importedCount++;
      }
    }

    // Update import status
    run(
      `UPDATE imports SET status = 'completed', transaction_count = ? WHERE id = ?`,
      [importedCount, importId]
    );

    // Update account balances for all affected accounts
    const affectedAccountIds = new Set<number>();
    for (const tx of categorizedTransactions) {
      affectedAccountIds.add(tx.accountId);
    }

    for (const accId of affectedAccountIds) {
      // Calculate total balance from all transactions for this account
      const balanceResult = queryOne<{ total: number }>(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE account_id = ?`,
        [accId]
      );

      if (balanceResult) {
        run(`UPDATE accounts SET current_balance = ? WHERE id = ?`, [
          balanceResult.total,
          accId,
        ]);
      }
    }

    res.json({
      success: true,
      data: {
        importId,
        filename,
        totalInFile: parsed.totalRows,
        imported: importedCount,
        duplicatesSkipped: duplicateCount,
        parseErrors: errors.length,
        skippedRows: [...errors, ...duplicateErrors],
      },
    });
  } catch (error) {
    console.error('Error importing CSV:', error);
    res.status(500).json({ success: false, error: 'Failed to import CSV' });
  }
});

// POST preview CSV without importing - detects new accounts
router.post('/preview', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: 'No file uploaded' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const bank = (req.body.bank as string) || 'ing';
    const ingTransactions = parseINGCSV(csvContent);

    if (ingTransactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Geen transacties gevonden in CSV bestand',
      });
    }

    // Get unique IBANs from the file
    const uniqueIbans = [...new Set(ingTransactions.map((tx) => tx.rekening))];

    const existingAccounts = query<{
      id: number;
      iban: string;
      name: string;
      type: string;
      profile_id: number;
      profile_name: string;
    }>(
      `SELECT a.id, a.iban, a.name, a.type, a.profile_id, p.name as profile_name 
       FROM accounts a 
       JOIN profiles p ON a.profile_id = p.id
       WHERE a.iban IN (${uniqueIbans.map(() => '?').join(',')})`,
      uniqueIbans
    );

    const existingIbans = new Set(existingAccounts.map((a) => a.iban));
    const newAccounts = uniqueIbans
      .filter((iban) => !existingIbans.has(iban))
      .map((iban) => ({
        iban,
        suggestedName: `${bank.toUpperCase()} Rekening ${iban.slice(-4)}`,
        suggestedType:
          iban.length > 10
            ? 'checking'
            : ('savings' as 'checking' | 'savings' | 'credit'),
      }));

    // Return preview info with new accounts
    const preview = ingTransactions.slice(0, 10);

    res.json({
      success: true,
      data: {
        totalTransactions: ingTransactions.length,
        preview,
        existingAccounts,
        newAccounts,
        uniqueIbans,
      },
    });
  } catch (error) {
    console.error('Error previewing CSV:', error);
    res.status(500).json({ success: false, error: 'Failed to preview CSV' });
  }
});

/**
 * @swagger
 * /api/import/backfill-addressbook:
 *   post:
 *     summary: Backfill address book with all unique IBANs from transactions
 *     description: >
 *       Goes through all existing transactions and adds any IBAN that's not yet
 *       in the address book. Applies cleanup rules to names (via Mollie, etc.).
 *       Excludes IBANs that belong to the user's own accounts.
 *     tags: [Import]
 *     responses:
 *       200:
 *         description: Number of IBANs added to address book
 */
router.post('/backfill-addressbook', (req, res) => {
  try {
    // Get cleanup rules to apply to names
    const cleanupRules = getCleanupRules();

    // Get all unique opposing IBANs from transactions that are not in address book
    // Using GROUP BY to get the most recent name for each IBAN
    const newEntries = query<{
      iban: string;
      name: string;
    }>(
      `SELECT 
        t.opposing_account_iban as iban,
        COALESCE(t.opposing_account_name, t.merchant_name, 'Onbekend') as name
      FROM transactions t
      WHERE t.opposing_account_iban IS NOT NULL 
        AND t.opposing_account_iban != ''
        AND t.opposing_account_iban NOT IN (SELECT iban FROM address_book)
        AND t.opposing_account_iban NOT IN (SELECT iban FROM accounts)
      GROUP BY t.opposing_account_iban
      ORDER BY t.date DESC`
    );

    let addedCount = 0;
    let mergedCount = 0;
    for (const entry of newEntries) {
      // Apply cleanup rules to name
      const cleanedName = applyCleanupRules(entry.name, cleanupRules);
      const normalizedIban = entry.iban.toUpperCase().trim();

      // Skip if already in contact_ibans
      const existingIbanLink = queryOne<{ contact_id: number }>(
        'SELECT contact_id FROM contact_ibans WHERE iban = ?',
        [normalizedIban]
      );
      if (existingIbanLink) continue;

      // Check if a contact with same name exists (case-insensitive)
      const existingContactByName = queryOne<{ id: number; iban: string }>(
        'SELECT id, iban FROM address_book WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))',
        [cleanedName]
      );

      if (existingContactByName) {
        // Merge into existing contact
        run(
          'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 0)',
          [existingContactByName.id, normalizedIban]
        );
        run(
          'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 1)',
          [existingContactByName.id, existingContactByName.iban]
        );
        mergedCount++;
      } else {
        // Insert as new contact
        const result = run(
          'INSERT OR IGNORE INTO address_book (iban, name) VALUES (?, ?)',
          [normalizedIban, cleanedName]
        );
        if (result.changes > 0) {
          const newContactId = result.lastInsertRowid;
          run(
            'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 1)',
            [newContactId, normalizedIban]
          );
          addedCount++;
        }
      }
    }

    // Also update existing address book entries to apply cleanup rules
    const existingEntries = query<{ id: number; name: string }>(
      'SELECT id, name FROM address_book'
    );
    let updatedCount = 0;
    for (const entry of existingEntries) {
      const cleanedName = applyCleanupRules(entry.name, cleanupRules);
      if (cleanedName !== entry.name && cleanedName.length > 0) {
        run('UPDATE address_book SET name = ? WHERE id = ?', [
          cleanedName,
          entry.id,
        ]);
        updatedCount++;
      }
    }

    res.json({
      success: true,
      data: {
        found: newEntries.length,
        added: addedCount,
        merged: mergedCount,
        updated: updatedCount,
      },
    });
  } catch (error) {
    console.error('Error backfilling address book:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to backfill address book' });
  }
});

/**
 * @swagger
 * /api/import/merge-duplicate-names:
 *   post:
 *     summary: Merge address book entries with duplicate names
 *     description: >
 *       Finds all address book entries with the same name (case-insensitive)
 *       and merges them into a single contact with multiple IBANs.
 *     tags: [Import]
 *     responses:
 *       200:
 *         description: Number of entries merged
 */
router.post('/merge-duplicate-names', (_req, res) => {
  try {
    // Find all names that have duplicates (case-insensitive)
    const duplicateNames = query<{ name: string; count: number }>(
      `SELECT LOWER(TRIM(name)) as name, COUNT(*) as count 
       FROM address_book 
       GROUP BY LOWER(TRIM(name)) 
       HAVING COUNT(*) > 1`
    );

    let mergedCount = 0;
    for (const dup of duplicateNames) {
      // Get all entries with this name
      const entries = query<{ id: number; iban: string; name: string }>(
        'SELECT id, iban, name FROM address_book WHERE LOWER(TRIM(name)) = ?',
        [dup.name]
      );

      if (entries.length < 2) continue;

      // Keep the first entry as the primary, merge others into it
      const primaryEntry = entries[0];

      // Ensure primary IBAN is in junction table
      run(
        'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 1)',
        [primaryEntry.id, primaryEntry.iban]
      );

      // Merge other entries into the primary
      for (let i = 1; i < entries.length; i++) {
        const entry = entries[i];

        // Add this IBAN to the primary contact
        run(
          'INSERT OR IGNORE INTO contact_ibans (contact_id, iban, is_primary) VALUES (?, ?, 0)',
          [primaryEntry.id, entry.iban]
        );

        // Delete the duplicate address_book entry
        run('DELETE FROM address_book WHERE id = ?', [entry.id]);
        mergedCount++;
      }
    }

    res.json({
      success: true,
      data: {
        duplicateGroups: duplicateNames.length,
        entriesMerged: mergedCount,
      },
    });
  } catch (error) {
    console.error('Error merging duplicate names:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to merge duplicate names' });
  }
});

export default router;
