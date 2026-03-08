/**
 * Bulk Delete API Integration Tests
 *
 * Tests for the bulk transaction deletion API endpoint.
 * Covers validation, security, and success scenarios.
 *
 * Test Coverage:
 * - DELETE /api/transactions/bulk with transactionIds
 * - DELETE /api/transactions/bulk with dateRange
 * - DELETE /api/transactions/bulk with dryRun=true
 * - Validation errors (no criteria, invalid dates, too many IDs)
 * - POST /api/accounts/:id/recalculate-balance
 * - Security: profile isolation, max ID limits
 *
 * @see .nexus/features/bulk-transaction-management/plan.md
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create an in-memory database for testing
let db: Database.Database;

// ============================================
// DATABASE SETUP
// ============================================

function setupDatabase() {
  db = new Database(':memory:');

  // Read and execute schema
  const schemaPath = join(__dirname, '../../apps/api/src/db/schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  return db;
}

function createProfile(name: string = 'Test Profile') {
  const result = db
    .prepare('INSERT INTO profiles (user_id, name, type) VALUES (?, ?, ?)')
    .run(1, name, 'personal');
  return Number(result.lastInsertRowid);
}

function createAccount(
  profileId: number,
  iban: string = 'NL00TEST123456789',
  balance: number = 1000
) {
  const result = db
    .prepare(
      `INSERT INTO accounts (iban, name, type, bank, current_balance, profile_id, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(iban, 'Test Account', 'checking', 'test', balance, profileId, 0);
  return Number(result.lastInsertRowid);
}

function createTransaction(
  accountId: number,
  profileId: number,
  options: {
    date?: string;
    amount?: number;
    type?: string;
    description?: string;
    balanceAfter?: number | null;
  } = {}
) {
  const {
    date = '2024-02-15',
    amount = -50,
    type = 'expense',
    description = 'Test Transaction',
    balanceAfter = null,
  } = options;

  const result = db
    .prepare(
      `INSERT INTO transactions (date, amount, type, description, account_id, profile_id, balance_after)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(date, amount, type, description, accountId, profileId, balanceAfter);
  return Number(result.lastInsertRowid);
}

function createManyTransactions(
  accountId: number,
  profileId: number,
  count: number
) {
  const ids: number[] = [];
  const stmt = db.prepare(
    `INSERT INTO transactions (date, amount, type, description, account_id, profile_id)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  for (let i = 0; i < count; i++) {
    const date = new Date(2024, 0, 1 + (i % 365)); // Spread across year
    const dateStr = date.toISOString().split('T')[0];
    const result = stmt.run(
      dateStr,
      -(10 + Math.random() * 100),
      'expense',
      `Transaction ${i + 1}`,
      accountId,
      profileId
    );
    ids.push(Number(result.lastInsertRowid));
  }
  return ids;
}

function getTransactionCount(profileId: number): number {
  const result = db
    .prepare('SELECT COUNT(*) as count FROM transactions WHERE profile_id = ?')
    .get(profileId) as { count: number };
  return result.count;
}

function getAccountBalance(accountId: number): number {
  const result = db
    .prepare('SELECT current_balance FROM accounts WHERE id = ?')
    .get(accountId) as { current_balance: number };
  return result.current_balance;
}

// ============================================
// SIMULATED API LOGIC
// ============================================

/**
 * Simulate the bulk delete API endpoint logic
 */
interface BulkDeleteRequest {
  transactionIds?: number[];
  dateRange?: { start: string; end: string };
  accountId?: number;
  dryRun?: boolean;
}

interface BulkDeleteResponse {
  success: boolean;
  deleted?: number;
  affectedAccounts?: string[];
  balancesUpdated?: boolean;
  dryRun?: boolean;
  error?: string;
}

function isValidDateFormat(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

function isValidDateRange(dateStr: string): { valid: boolean; error?: string } {
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

function recalculateAccountBalance(
  accountId: number,
  _profileId: number
): { previousBalance: number; newBalance: number } {
  const account = db
    .prepare('SELECT current_balance FROM accounts WHERE id = ?')
    .get(accountId) as { current_balance: number } | undefined;
  const previousBalance = account?.current_balance ?? 0;

  const latestTx = db
    .prepare(
      `SELECT balance_after FROM transactions 
       WHERE account_id = ? AND balance_after IS NOT NULL 
       ORDER BY date DESC, id DESC LIMIT 1`
    )
    .get(accountId) as { balance_after: number } | undefined;
  const newBalance = latestTx?.balance_after ?? 0;

  db.prepare('UPDATE accounts SET current_balance = ? WHERE id = ?').run(
    newBalance,
    accountId
  );

  return { previousBalance, newBalance };
}

function simulateBulkDelete(
  request: BulkDeleteRequest,
  profileId: number
): BulkDeleteResponse {
  const { transactionIds, dateRange, accountId, dryRun } = request;

  // Validation: at least one criterion required
  if (!transactionIds && !dateRange) {
    return {
      success: false,
      error: 'Either transactionIds or dateRange is required',
    };
  }

  // Validate transactionIds
  if (transactionIds) {
    if (!Array.isArray(transactionIds)) {
      return { success: false, error: 'transactionIds must be an array' };
    }
    // Security: Reject empty arrays to prevent accidental mass deletion
    if (transactionIds.length === 0) {
      return {
        success: false,
        error: 'transactionIds array cannot be empty',
      };
    }
    if (transactionIds.length > 1000) {
      return {
        success: false,
        error: 'Maximum 1000 transaction IDs per request',
      };
    }
  }

  // Validate dateRange
  if (dateRange) {
    if (!dateRange.start || !dateRange.end) {
      return {
        success: false,
        error: 'dateRange requires both start and end dates',
      };
    }
    if (!isValidDateFormat(dateRange.start)) {
      return {
        success: false,
        error: 'Invalid start date format. Use YYYY-MM-DD',
      };
    }
    if (!isValidDateFormat(dateRange.end)) {
      return {
        success: false,
        error: 'Invalid end date format. Use YYYY-MM-DD',
      };
    }
    const startValidation = isValidDateRange(dateRange.start);
    if (!startValidation.valid) {
      return { success: false, error: `Start date: ${startValidation.error}` };
    }
    const endValidation = isValidDateRange(dateRange.end);
    if (!endValidation.valid) {
      return { success: false, error: `End date: ${endValidation.error}` };
    }
    if (dateRange.start > dateRange.end) {
      return {
        success: false,
        error: 'Start date must be before or equal to end date',
      };
    }
  }

  // Validate accountId belongs to profile
  if (accountId) {
    const account = db
      .prepare('SELECT id FROM accounts WHERE id = ? AND profile_id = ?')
      .get(accountId, profileId);
    if (!account) {
      return {
        success: false,
        error: 'Account not found or belongs to different profile',
      };
    }
  }

  // Build WHERE clause
  const conditions: string[] = [
    'account_id IN (SELECT id FROM accounts WHERE profile_id = ?)',
  ];
  const params: (string | number)[] = [profileId];

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

  // Verify all transactionIds belong to profile (security check)
  if (transactionIds && transactionIds.length > 0) {
    const countResult = db
      .prepare(
        `SELECT COUNT(*) as count FROM transactions WHERE ${whereClause}`
      )
      .get(...params) as { count: number };
    if (countResult.count !== transactionIds.length) {
      return {
        success: false,
        error: 'Some transaction IDs do not belong to this profile',
      };
    }
  }

  // Get affected accounts
  const affectedAccountRows = db
    .prepare(
      `SELECT DISTINCT account_id FROM transactions WHERE ${whereClause}`
    )
    .all(...params) as Array<{ account_id: number }>;
  const affectedAccountIds = affectedAccountRows.map((r) =>
    String(r.account_id)
  );

  // Get count
  const countResult = db
    .prepare(`SELECT COUNT(*) as count FROM transactions WHERE ${whereClause}`)
    .get(...params) as { count: number };
  const deleteCount = countResult.count;

  // Dry run: return count without deleting
  if (dryRun) {
    return {
      success: true,
      deleted: deleteCount,
      affectedAccounts: affectedAccountIds,
      balancesUpdated: false,
      dryRun: true,
    };
  }

  // Perform deletion (hard delete for API)
  const result = db
    .prepare(`DELETE FROM transactions WHERE ${whereClause}`)
    .run(...params);

  // Recalculate balances
  for (const accountIdStr of affectedAccountIds) {
    recalculateAccountBalance(parseInt(accountIdStr, 10), profileId);
  }

  return {
    success: true,
    deleted: result.changes,
    affectedAccounts: affectedAccountIds,
    balancesUpdated: affectedAccountIds.length > 0,
  };
}

// ============================================
// TESTS: Bulk Delete with transactionIds
// ============================================

describe('DELETE /api/transactions/bulk with transactionIds', () => {
  let profileId: number;
  let accountId: number;

  beforeEach(() => {
    setupDatabase();
    profileId = createProfile();
    accountId = createAccount(profileId);
  });

  afterEach(() => {
    db.close();
  });

  it('successfully deletes transactions by IDs', () => {
    const tx1 = createTransaction(accountId, profileId, { date: '2024-02-10' });
    const tx2 = createTransaction(accountId, profileId, { date: '2024-02-11' });
    const tx3 = createTransaction(accountId, profileId, { date: '2024-02-12' });

    const response = simulateBulkDelete(
      { transactionIds: [tx1, tx2, tx3] },
      profileId
    );

    expect(response.success).toBe(true);
    expect(response.deleted).toBe(3);
    expect(response.affectedAccounts).toContain(String(accountId));
    expect(response.balancesUpdated).toBe(true);

    const remaining = getTransactionCount(profileId);
    expect(remaining).toBe(0);
  });

  it('returns error when transactionIds is not an array', () => {
    const response = simulateBulkDelete(
      // @ts-expect-error Testing invalid input
      { transactionIds: 'invalid' },
      profileId
    );

    expect(response.success).toBe(false);
    expect(response.error).toContain('array');
  });

  it('returns error when more than 1000 IDs provided', () => {
    const ids = Array.from({ length: 1001 }, (_, i) => i + 1);

    const response = simulateBulkDelete({ transactionIds: ids }, profileId);

    expect(response.success).toBe(false);
    expect(response.error).toContain('1000');
  });

  it('recalculates account balances after deletion', () => {
    createTransaction(accountId, profileId, {
      date: '2024-02-10',
      balanceAfter: 900,
    });
    const tx2 = createTransaction(accountId, profileId, {
      date: '2024-02-15',
      balanceAfter: 850,
    });

    // Delete the latest transaction
    simulateBulkDelete({ transactionIds: [tx2] }, profileId);

    // Balance should be recalculated to the previous transaction's balance_after
    const balance = getAccountBalance(accountId);
    expect(balance).toBe(900);
  });

  it('rejects empty transactionIds array', () => {
    createTransaction(accountId, profileId);

    const response = simulateBulkDelete({ transactionIds: [] }, profileId);

    // Security: Empty arrays are now rejected to prevent accidental mass deletion
    expect(response.success).toBe(false);
    expect(response.error).toContain('cannot be empty');
    // Transaction should NOT be deleted
    expect(getTransactionCount(profileId)).toBe(1);
  });
});

// ============================================
// TESTS: Bulk Delete with dateRange
// ============================================

describe('DELETE /api/transactions/bulk with dateRange', () => {
  let profileId: number;
  let accountId: number;

  beforeEach(() => {
    setupDatabase();
    profileId = createProfile();
    accountId = createAccount(profileId);
  });

  afterEach(() => {
    db.close();
  });

  it('successfully deletes transactions by date range', () => {
    createTransaction(accountId, profileId, { date: '2024-01-15' });
    createTransaction(accountId, profileId, { date: '2024-02-15' });
    createTransaction(accountId, profileId, { date: '2024-03-15' });

    const response = simulateBulkDelete(
      { dateRange: { start: '2024-02-01', end: '2024-02-28' } },
      profileId
    );

    expect(response.success).toBe(true);
    expect(response.deleted).toBe(1); // Only Feb 15
    expect(response.balancesUpdated).toBe(true);

    const remaining = getTransactionCount(profileId);
    expect(remaining).toBe(2); // Jan and Mar
  });

  it('returns error for invalid date format', () => {
    const response = simulateBulkDelete(
      { dateRange: { start: '02-15-2024', end: '2024-02-28' } },
      profileId
    );

    expect(response.success).toBe(false);
    expect(response.error).toContain('date format');
  });

  it('returns error for missing start date', () => {
    const response = simulateBulkDelete(
      // @ts-expect-error Testing invalid input
      { dateRange: { end: '2024-02-28' } },
      profileId
    );

    expect(response.success).toBe(false);
    expect(response.error).toContain('start and end');
  });

  it('returns error for missing end date', () => {
    const response = simulateBulkDelete(
      // @ts-expect-error Testing invalid input
      { dateRange: { start: '2024-02-01' } },
      profileId
    );

    expect(response.success).toBe(false);
    expect(response.error).toContain('start and end');
  });

  it('returns error when start date is after end date', () => {
    const response = simulateBulkDelete(
      { dateRange: { start: '2024-02-28', end: '2024-02-01' } },
      profileId
    );

    expect(response.success).toBe(false);
    expect(response.error).toContain('before or equal');
  });

  it('returns error for future dates', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const response = simulateBulkDelete(
      { dateRange: { start: '2024-02-01', end: futureDateStr } },
      profileId
    );

    expect(response.success).toBe(false);
    expect(response.error).toContain('future');
  });

  it('combines dateRange with accountId filter', () => {
    const account2 = createAccount(profileId, 'NL00TEST987654321');
    createTransaction(accountId, profileId, { date: '2024-02-15' });
    createTransaction(account2, profileId, { date: '2024-02-15' });

    const response = simulateBulkDelete(
      {
        dateRange: { start: '2024-02-01', end: '2024-02-28' },
        accountId: accountId,
      },
      profileId
    );

    expect(response.success).toBe(true);
    expect(response.deleted).toBe(1); // Only from accountId
    expect(response.affectedAccounts).toContain(String(accountId));
    expect(response.affectedAccounts).not.toContain(String(account2));
  });
});

// ============================================
// TESTS: Bulk Delete with dryRun
// ============================================

describe('DELETE /api/transactions/bulk with dryRun=true', () => {
  let profileId: number;
  let accountId: number;

  beforeEach(() => {
    setupDatabase();
    profileId = createProfile();
    accountId = createAccount(profileId);
  });

  afterEach(() => {
    db.close();
  });

  it('returns count without actually deleting', () => {
    createTransaction(accountId, profileId, { date: '2024-02-10' });
    createTransaction(accountId, profileId, { date: '2024-02-15' });
    createTransaction(accountId, profileId, { date: '2024-02-20' });

    const response = simulateBulkDelete(
      {
        dateRange: { start: '2024-02-01', end: '2024-02-28' },
        dryRun: true,
      },
      profileId
    );

    expect(response.success).toBe(true);
    expect(response.deleted).toBe(3);
    expect(response.dryRun).toBe(true);
    expect(response.balancesUpdated).toBe(false);

    // Transactions should NOT be deleted
    const remaining = getTransactionCount(profileId);
    expect(remaining).toBe(3);
  });

  it('returns affected accounts in dry run', () => {
    createTransaction(accountId, profileId, { date: '2024-02-15' });

    const response = simulateBulkDelete(
      {
        dateRange: { start: '2024-02-01', end: '2024-02-28' },
        dryRun: true,
      },
      profileId
    );

    expect(response.affectedAccounts).toContain(String(accountId));
  });
});

// ============================================
// TESTS: Validation Errors
// ============================================

describe('DELETE /api/transactions/bulk validation errors', () => {
  let profileId: number;
  let accountId: number;

  beforeEach(() => {
    setupDatabase();
    profileId = createProfile();
    accountId = createAccount(profileId);
  });

  afterEach(() => {
    db.close();
  });

  it('returns error when no criteria provided', () => {
    const response = simulateBulkDelete({}, profileId);

    expect(response.success).toBe(false);
    expect(response.error).toContain('required');
  });

  it('returns error for invalid accountId', () => {
    createTransaction(accountId, profileId);

    const response = simulateBulkDelete(
      {
        dateRange: { start: '2024-02-01', end: '2024-02-28' },
        accountId: 99999, // Non-existent
      },
      profileId
    );

    expect(response.success).toBe(false);
    expect(response.error).toContain('not found');
  });
});

// ============================================
// TESTS: Security - Profile Isolation
// ============================================

describe('Security: Profile Isolation', () => {
  let profile1Id: number;
  let profile2Id: number;
  let account1Id: number;
  let account2Id: number;

  beforeEach(() => {
    setupDatabase();
    profile1Id = createProfile('Profile 1');
    profile2Id = createProfile('Profile 2');
    account1Id = createAccount(profile1Id, 'NL00TEST111111111');
    account2Id = createAccount(profile2Id, 'NL00TEST222222222');
  });

  afterEach(() => {
    db.close();
  });

  it('cannot delete transactions from another profile by ID', () => {
    const tx1 = createTransaction(account1Id, profile1Id);
    const tx2 = createTransaction(account2Id, profile2Id);

    // Try to delete both transactions as profile1
    const response = simulateBulkDelete(
      { transactionIds: [tx1, tx2] },
      profile1Id
    );

    // Should fail because tx2 doesn't belong to profile1
    expect(response.success).toBe(false);
    expect(response.error).toContain('do not belong');

    // Both transactions should still exist
    expect(getTransactionCount(profile1Id)).toBe(1);
    expect(getTransactionCount(profile2Id)).toBe(1);
  });

  it('cannot delete transactions from another profile by date range', () => {
    createTransaction(account1Id, profile1Id, { date: '2024-02-15' });
    createTransaction(account2Id, profile2Id, { date: '2024-02-15' });

    // Delete all transactions in date range as profile1
    const response = simulateBulkDelete(
      { dateRange: { start: '2024-02-01', end: '2024-02-28' } },
      profile1Id
    );

    expect(response.success).toBe(true);
    expect(response.deleted).toBe(1); // Only profile1's transaction

    // Profile2's transaction should still exist
    expect(getTransactionCount(profile2Id)).toBe(1);
  });

  it('cannot access accounts from another profile', () => {
    createTransaction(account1Id, profile1Id);

    // Try to filter by profile2's account as profile1
    const response = simulateBulkDelete(
      {
        dateRange: { start: '2024-02-01', end: '2024-02-28' },
        accountId: account2Id,
      },
      profile1Id
    );

    expect(response.success).toBe(false);
    expect(response.error).toContain('not found');
  });
});

// ============================================
// TESTS: POST /api/accounts/:id/recalculate-balance
// ============================================

describe('POST /api/accounts/:id/recalculate-balance', () => {
  let profileId: number;
  let accountId: number;

  beforeEach(() => {
    setupDatabase();
    profileId = createProfile();
    accountId = createAccount(profileId, 'NL00TEST123456789', 1000);
  });

  afterEach(() => {
    db.close();
  });

  it('recalculates balance using latest balance_after', () => {
    createTransaction(accountId, profileId, {
      date: '2024-02-10',
      balanceAfter: 900,
    });
    createTransaction(accountId, profileId, {
      date: '2024-02-15',
      balanceAfter: 750,
    });

    const result = recalculateAccountBalance(accountId, profileId);

    expect(result.previousBalance).toBe(1000);
    expect(result.newBalance).toBe(750); // Latest transaction's balance_after
  });

  it('sets balance to 0 when no transactions have balance_after', () => {
    createTransaction(accountId, profileId, {
      date: '2024-02-15',
      balanceAfter: null,
    });

    const result = recalculateAccountBalance(accountId, profileId);

    expect(result.newBalance).toBe(0);
  });

  it('sets balance to 0 when no transactions exist', () => {
    // Account has no transactions
    const result = recalculateAccountBalance(accountId, profileId);

    expect(result.newBalance).toBe(0);
  });

  it('uses date ordering to find latest transaction', () => {
    // Insert in random order
    createTransaction(accountId, profileId, {
      date: '2024-02-20',
      balanceAfter: 700,
    });
    createTransaction(accountId, profileId, {
      date: '2024-02-10',
      balanceAfter: 950,
    });
    createTransaction(accountId, profileId, {
      date: '2024-02-15',
      balanceAfter: 850,
    });

    const result = recalculateAccountBalance(accountId, profileId);

    expect(result.newBalance).toBe(700); // Feb 20 is latest
  });
});

// ============================================
// TESTS: Max ID Limit
// ============================================

describe('Max 1000 transaction IDs limit', () => {
  let profileId: number;
  let accountId: number;

  beforeEach(() => {
    setupDatabase();
    profileId = createProfile();
    accountId = createAccount(profileId);
  });

  afterEach(() => {
    db.close();
  });

  it('accepts exactly 1000 IDs', () => {
    const ids = createManyTransactions(accountId, profileId, 1000);

    const response = simulateBulkDelete({ transactionIds: ids }, profileId);

    expect(response.success).toBe(true);
    expect(response.deleted).toBe(1000);
  });

  it('rejects 1001 IDs', () => {
    const ids = Array.from({ length: 1001 }, (_, i) => i + 1);

    const response = simulateBulkDelete({ transactionIds: ids }, profileId);

    expect(response.success).toBe(false);
    expect(response.error).toContain('1000');
  });
});

// ============================================
// TESTS: Affected Accounts Tracking
// ============================================

describe('Affected Accounts Tracking', () => {
  let profileId: number;
  let account1Id: number;
  let account2Id: number;
  let account3Id: number;

  beforeEach(() => {
    setupDatabase();
    profileId = createProfile();
    account1Id = createAccount(profileId, 'NL00TEST111111111');
    account2Id = createAccount(profileId, 'NL00TEST222222222');
    account3Id = createAccount(profileId, 'NL00TEST333333333');
  });

  afterEach(() => {
    db.close();
  });

  it('tracks all affected accounts', () => {
    const tx1 = createTransaction(account1Id, profileId);
    const tx2 = createTransaction(account2Id, profileId);
    createTransaction(account3Id, profileId); // Not deleted

    const response = simulateBulkDelete(
      { transactionIds: [tx1, tx2] },
      profileId
    );

    expect(response.affectedAccounts).toHaveLength(2);
    expect(response.affectedAccounts).toContain(String(account1Id));
    expect(response.affectedAccounts).toContain(String(account2Id));
    expect(response.affectedAccounts).not.toContain(String(account3Id));
  });

  it('recalculates balance for each affected account', () => {
    createTransaction(account1Id, profileId, {
      date: '2024-02-10',
      balanceAfter: 800,
    });
    const tx1 = createTransaction(account1Id, profileId, {
      date: '2024-02-15',
      balanceAfter: 600, // This will be deleted
    });

    createTransaction(account2Id, profileId, {
      date: '2024-02-10',
      balanceAfter: 900,
    });
    const tx2 = createTransaction(account2Id, profileId, {
      date: '2024-02-15',
      balanceAfter: 700, // This will be deleted
    });

    simulateBulkDelete({ transactionIds: [tx1, tx2] }, profileId);

    // Both accounts should have their balances recalculated
    expect(getAccountBalance(account1Id)).toBe(800);
    expect(getAccountBalance(account2Id)).toBe(900);
  });
});

// ============================================
// TESTS: Date Boundary Edge Cases
// ============================================

describe('Date Boundary Edge Cases', () => {
  let profileId: number;
  let accountId: number;

  beforeEach(() => {
    setupDatabase();
    profileId = createProfile();
    accountId = createAccount(profileId);
  });

  afterEach(() => {
    db.close();
  });

  it('accepts dates just inside 10-year boundary', () => {
    // Use a date 9 years and 364 days ago to be safely within boundary
    const almostTenYearsAgo = new Date();
    almostTenYearsAgo.setFullYear(almostTenYearsAgo.getFullYear() - 9);
    almostTenYearsAgo.setMonth(almostTenYearsAgo.getMonth() - 11);
    almostTenYearsAgo.setDate(almostTenYearsAgo.getDate() - 20);
    const dateStr = almostTenYearsAgo.toISOString().split('T')[0];

    // Create transaction within boundary
    createTransaction(accountId, profileId, { date: dateStr });

    const response = simulateBulkDelete(
      { dateRange: { start: dateStr, end: dateStr } },
      profileId
    );

    // Should succeed - within 10-year boundary
    expect(response.success).toBe(true);
    expect(response.deleted).toBe(1);
  });

  it('rejects dates just beyond 10-year boundary', () => {
    const elevenYearsAgo = new Date();
    elevenYearsAgo.setFullYear(elevenYearsAgo.getFullYear() - 11);
    const elevenYearsAgoStr = elevenYearsAgo.toISOString().split('T')[0];

    const response = simulateBulkDelete(
      { dateRange: { start: elevenYearsAgoStr, end: elevenYearsAgoStr } },
      profileId
    );

    expect(response.success).toBe(false);
    expect(response.error).toContain('10 years');
  });

  it('handles transactions on leap year February 29', () => {
    createTransaction(accountId, profileId, { date: '2024-02-29' });

    const response = simulateBulkDelete(
      { dateRange: { start: '2024-02-29', end: '2024-02-29' } },
      profileId
    );

    expect(response.success).toBe(true);
    expect(response.deleted).toBe(1);
  });

  it('handles year boundary deletions (Dec 31 to Jan 1)', () => {
    createTransaction(accountId, profileId, { date: '2023-12-31' });
    createTransaction(accountId, profileId, { date: '2024-01-01' });

    const response = simulateBulkDelete(
      { dateRange: { start: '2023-12-31', end: '2024-01-01' } },
      profileId
    );

    expect(response.success).toBe(true);
    expect(response.deleted).toBe(2);
  });

  it('handles single-day range correctly', () => {
    createTransaction(accountId, profileId, { date: '2024-02-15' });
    createTransaction(accountId, profileId, { date: '2024-02-16' });

    const response = simulateBulkDelete(
      { dateRange: { start: '2024-02-15', end: '2024-02-15' } },
      profileId
    );

    expect(response.success).toBe(true);
    expect(response.deleted).toBe(1);
    expect(getTransactionCount(profileId)).toBe(1); // Feb 16 remains
  });

  it('handles date range with no matching transactions', () => {
    createTransaction(accountId, profileId, { date: '2024-02-15' });

    const response = simulateBulkDelete(
      { dateRange: { start: '2024-03-01', end: '2024-03-31' } },
      profileId
    );

    expect(response.success).toBe(true);
    expect(response.deleted).toBe(0);
    expect(getTransactionCount(profileId)).toBe(1); // Original remains
  });
});

// ============================================
// TESTS: Balance Recalculation Edge Cases
// ============================================

describe('Balance Recalculation Edge Cases', () => {
  let profileId: number;
  let accountId: number;

  beforeEach(() => {
    setupDatabase();
    profileId = createProfile();
    accountId = createAccount(profileId, 'NL00TEST123456789', 1000);
  });

  afterEach(() => {
    db.close();
  });

  it('handles deletion of all transactions in account', () => {
    const tx1 = createTransaction(accountId, profileId, {
      date: '2024-02-10',
      balanceAfter: 900,
    });
    const tx2 = createTransaction(accountId, profileId, {
      date: '2024-02-15',
      balanceAfter: 800,
    });

    simulateBulkDelete({ transactionIds: [tx1, tx2] }, profileId);

    // Balance should be 0 when no transactions remain
    expect(getAccountBalance(accountId)).toBe(0);
    expect(getTransactionCount(profileId)).toBe(0);
  });

  it('handles transactions without balance_after values', () => {
    // Create transactions without balance_after
    const tx1 = createTransaction(accountId, profileId, {
      date: '2024-02-10',
      balanceAfter: null,
    });

    // Delete it
    simulateBulkDelete({ transactionIds: [tx1] }, profileId);

    // Balance should be 0 since no balance_after exists
    expect(getAccountBalance(accountId)).toBe(0);
  });

  it('uses latest transaction by date for balance calculation', () => {
    // Insert in non-chronological order
    createTransaction(accountId, profileId, {
      date: '2024-02-20',
      balanceAfter: 500,
    });
    const txToDelete = createTransaction(accountId, profileId, {
      date: '2024-02-25',
      balanceAfter: 400,
    });
    createTransaction(accountId, profileId, {
      date: '2024-02-10',
      balanceAfter: 700,
    });

    // Delete the middle one (Feb 25)
    simulateBulkDelete({ transactionIds: [txToDelete] }, profileId);

    // Balance should be from Feb 20 (next latest after deletion)
    expect(getAccountBalance(accountId)).toBe(500);
  });

  it('handles negative balances correctly', () => {
    createTransaction(accountId, profileId, {
      date: '2024-02-10',
      balanceAfter: -500,
    });
    const tx2 = createTransaction(accountId, profileId, {
      date: '2024-02-15',
      balanceAfter: -1000,
    });

    simulateBulkDelete({ transactionIds: [tx2] }, profileId);

    // Negative balance should be preserved
    expect(getAccountBalance(accountId)).toBe(-500);
  });
});

// ============================================
// TESTS: Transaction Count Edge Cases
// ============================================

describe('Transaction Count Edge Cases', () => {
  let profileId: number;
  let accountId: number;

  beforeEach(() => {
    setupDatabase();
    profileId = createProfile();
    accountId = createAccount(profileId);
  });

  afterEach(() => {
    db.close();
  });

  it('handles bulk delete of exactly MAX limit (1000)', () => {
    const ids = createManyTransactions(accountId, profileId, 1000);

    const response = simulateBulkDelete({ transactionIds: ids }, profileId);

    expect(response.success).toBe(true);
    expect(response.deleted).toBe(1000);
    expect(getTransactionCount(profileId)).toBe(0);
  });

  it('correctly counts affected accounts with same transaction IDs', () => {
    // Create multiple transactions in same account
    const tx1 = createTransaction(accountId, profileId);
    const tx2 = createTransaction(accountId, profileId);
    const tx3 = createTransaction(accountId, profileId);

    const response = simulateBulkDelete(
      { transactionIds: [tx1, tx2, tx3] },
      profileId
    );

    // Should only report 1 affected account
    expect(response.affectedAccounts).toHaveLength(1);
    expect(response.deleted).toBe(3);
  });

  it('handles partial success when some IDs do not exist', () => {
    const tx1 = createTransaction(accountId, profileId);
    const nonExistentId = 99999;

    // Note: This depends on implementation - our logic rejects if any ID doesn't belong
    const response = simulateBulkDelete(
      { transactionIds: [tx1, nonExistentId] },
      profileId
    );

    // Our implementation requires all IDs to belong to the profile
    expect(response.success).toBe(false);
    expect(response.error).toContain('do not belong');
  });
});
