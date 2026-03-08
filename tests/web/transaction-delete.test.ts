import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@fluxby/database', () => ({
  readFromOPFSSync: vi.fn(() => '00000000-0000-0000-0000-000000000001'),
  isSettingsCacheInitialized: vi.fn(() => true),
}));

// Test UUIDs
const VALID_TX_ID = '12345678-1234-1234-1234-123456789abc';
const VALID_ACCOUNT_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const MISSING_TX_ID = '99999999-9999-9999-9999-999999999999';

describe('web data-service single transaction delete', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    Object.defineProperty(global, 'window', {
      value: {},
      configurable: true,
      writable: true,
    });
  });

  it('soft-deletes the transaction and recalculates the owning account balance', async () => {
    const { createDataService } =
      await import('../../apps/web/src/lib/data-service');

    const queryOneAsync = vi
      .fn()
      .mockResolvedValueOnce({ account_id: VALID_ACCOUNT_ID })
      .mockResolvedValueOnce({ current_balance: 1000 })
      .mockResolvedValueOnce({ balance_after: 750 });

    const runAsync = vi
      .fn()
      .mockResolvedValueOnce({ changes: 1, lastInsertRowId: 0 })
      .mockResolvedValueOnce({ changes: 1, lastInsertRowId: 0 });

    const db = {
      queryOneAsync,
      runAsync,
      transactionAsync: vi.fn(async (fn: () => Promise<void>) => fn()),
    };

    const ds = createDataService(db as never);

    await ds.deleteTransaction(VALID_TX_ID);

    expect(db.transactionAsync).toHaveBeenCalledTimes(1);
    expect(queryOneAsync).toHaveBeenNthCalledWith(
      1,
      'SELECT account_id FROM transactions WHERE id = ? AND profile_id = ? AND is_deleted = 0',
      [VALID_TX_ID, '00000000-0000-0000-0000-000000000001']
    );
    expect(runAsync).toHaveBeenNthCalledWith(
      1,
      'UPDATE transactions SET is_deleted = 1, updated_at = ? WHERE id = ? AND profile_id = ? AND is_deleted = 0',
      expect.arrayContaining([
        VALID_TX_ID,
        '00000000-0000-0000-0000-000000000001',
      ])
    );
    expect(queryOneAsync).toHaveBeenNthCalledWith(
      2,
      'SELECT current_balance FROM accounts WHERE id = ? AND profile_id = ? AND is_deleted = 0',
      [VALID_ACCOUNT_ID, '00000000-0000-0000-0000-000000000001']
    );
    expect(queryOneAsync).toHaveBeenNthCalledWith(
      3,
      `SELECT balance_after FROM transactions 
         WHERE account_id = ? AND is_deleted = 0 AND balance_after IS NOT NULL 
         ORDER BY date DESC, id DESC LIMIT 1`,
      [VALID_ACCOUNT_ID]
    );
    expect(runAsync).toHaveBeenNthCalledWith(
      2,
      'UPDATE accounts SET current_balance = ?, updated_at = ? WHERE id = ? AND profile_id = ?',
      expect.arrayContaining([
        750,
        VALID_ACCOUNT_ID,
        '00000000-0000-0000-0000-000000000001',
      ])
    );
  });

  it('does not recalculate balances when the transaction is missing or already deleted', async () => {
    const { createDataService } =
      await import('../../apps/web/src/lib/data-service');

    const queryOneAsync = vi.fn().mockResolvedValueOnce(null);
    const runAsync = vi.fn();

    const db = {
      queryOneAsync,
      runAsync,
      transactionAsync: vi.fn(async (fn: () => Promise<void>) => fn()),
    };

    const ds = createDataService(db as never);

    await ds.deleteTransaction(MISSING_TX_ID);

    expect(db.transactionAsync).toHaveBeenCalledTimes(1);
    expect(queryOneAsync).toHaveBeenCalledTimes(1);
    expect(runAsync).not.toHaveBeenCalled();
  });

  it('rejects invalid UUID formats', async () => {
    const { createDataService } =
      await import('../../apps/web/src/lib/data-service');

    const db = {
      queryOneAsync: vi.fn(),
      runAsync: vi.fn(),
      transactionAsync: vi.fn(),
    };

    const ds = createDataService(db as never);

    // Should reject non-UUID strings
    await expect(ds.deleteTransaction('invalid-id')).rejects.toThrow(
      'Invalid transaction ID format'
    );
    await expect(ds.deleteTransaction('12345')).rejects.toThrow(
      'Invalid transaction ID format'
    );
    await expect(ds.deleteTransaction('')).rejects.toThrow(
      'Invalid transaction ID format'
    );
    await expect(
      ds.deleteTransaction("'; DROP TABLE transactions; --")
    ).rejects.toThrow('Invalid transaction ID format');

    // Database should never be called for invalid IDs
    expect(db.transactionAsync).not.toHaveBeenCalled();
    expect(db.queryOneAsync).not.toHaveBeenCalled();
    expect(db.runAsync).not.toHaveBeenCalled();
  });

  it('sets balance to latest balance_after when deleted transaction has balance', async () => {
    const { createDataService } =
      await import('../../apps/web/src/lib/data-service');

    const queryOneAsync = vi
      .fn()
      .mockResolvedValueOnce({ account_id: VALID_ACCOUNT_ID })
      .mockResolvedValueOnce({ current_balance: 1000 })
      .mockResolvedValueOnce({ balance_after: 500 }); // Latest remaining transaction

    const runAsync = vi
      .fn()
      .mockResolvedValueOnce({ changes: 1, lastInsertRowId: 0 })
      .mockResolvedValueOnce({ changes: 1, lastInsertRowId: 0 });

    const db = {
      queryOneAsync,
      runAsync,
      transactionAsync: vi.fn(async (fn: () => Promise<void>) => fn()),
    };

    const ds = createDataService(db as never);

    await ds.deleteTransaction(VALID_TX_ID);

    // Verify balance was updated to the latest transaction's balance_after
    expect(runAsync).toHaveBeenNthCalledWith(
      2,
      'UPDATE accounts SET current_balance = ?, updated_at = ? WHERE id = ? AND profile_id = ?',
      expect.arrayContaining([
        500,
        VALID_ACCOUNT_ID,
        '00000000-0000-0000-0000-000000000001',
      ])
    );
  });

  it('sets balance to 0 when no transactions remain with balance_after', async () => {
    const { createDataService } =
      await import('../../apps/web/src/lib/data-service');

    const queryOneAsync = vi
      .fn()
      .mockResolvedValueOnce({ account_id: VALID_ACCOUNT_ID })
      .mockResolvedValueOnce({ current_balance: 1000 })
      .mockResolvedValueOnce(null); // No remaining transactions with balance_after

    const runAsync = vi
      .fn()
      .mockResolvedValueOnce({ changes: 1, lastInsertRowId: 0 })
      .mockResolvedValueOnce({ changes: 1, lastInsertRowId: 0 });

    const db = {
      queryOneAsync,
      runAsync,
      transactionAsync: vi.fn(async (fn: () => Promise<void>) => fn()),
    };

    const ds = createDataService(db as never);

    await ds.deleteTransaction(VALID_TX_ID);

    // Verify balance was set to 0 (no balance_after found)
    expect(runAsync).toHaveBeenNthCalledWith(
      2,
      'UPDATE accounts SET current_balance = ?, updated_at = ? WHERE id = ? AND profile_id = ?',
      expect.arrayContaining([
        0,
        VALID_ACCOUNT_ID,
        '00000000-0000-0000-0000-000000000001',
      ])
    );
  });

  it('handles transactionAsync rollback on database error', async () => {
    const { createDataService } =
      await import('../../apps/web/src/lib/data-service');

    const dbError = new Error('Database constraint violation');
    const queryOneAsync = vi
      .fn()
      .mockResolvedValueOnce({ account_id: VALID_ACCOUNT_ID });

    const runAsync = vi.fn().mockRejectedValueOnce(dbError);

    // This simulates the real transactionAsync which wraps db operations
    // When the inner function throws, the transaction should propagate the error
    const transactionAsync = vi.fn(async (fn: () => Promise<void>) => fn());

    const db = {
      queryOneAsync,
      runAsync,
      transactionAsync,
    };

    const ds = createDataService(db as never);

    // Should propagate the error
    await expect(ds.deleteTransaction(VALID_TX_ID)).rejects.toThrow(
      'Database constraint violation'
    );

    // Transaction should have been called
    expect(transactionAsync).toHaveBeenCalledTimes(1);
  });
});

// ============================================
// TESTS: Bulk Delete by IDs
// ============================================

describe('web data-service deleteTransactionsByIds', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    Object.defineProperty(global, 'window', {
      value: {},
      configurable: true,
      writable: true,
    });
  });

  it('returns empty result for empty transaction IDs array', async () => {
    const { createDataService } =
      await import('../../apps/web/src/lib/data-service');

    const db = {
      queryOneAsync: vi.fn(),
      queryAsync: vi.fn(),
      runAsync: vi.fn(),
      transactionAsync: vi.fn(),
    };

    const ds = createDataService(db as never);

    const result = await ds.deleteTransactionsByIds([]);

    expect(result.deletedCount).toBe(0);
    expect(result.affectedAccountIds).toEqual([]);
    // Database should NOT be called for empty array
    expect(db.transactionAsync).not.toHaveBeenCalled();
  });

  it('rejects arrays with invalid UUIDs', async () => {
    const { createDataService } =
      await import('../../apps/web/src/lib/data-service');

    const db = {
      queryOneAsync: vi.fn(),
      queryAsync: vi.fn(),
      runAsync: vi.fn(),
      transactionAsync: vi.fn(),
    };

    const ds = createDataService(db as never);

    // Mix of valid and invalid UUIDs
    await expect(
      ds.deleteTransactionsByIds([
        '12345678-1234-1234-1234-123456789abc',
        'invalid-uuid',
      ])
    ).rejects.toThrow('Invalid transaction ID format');

    // SQL injection attempt
    await expect(
      ds.deleteTransactionsByIds(["'; DROP TABLE transactions; --"])
    ).rejects.toThrow('Invalid transaction ID format');
  });

  it('enforces maximum ID limit', async () => {
    const { createDataService } =
      await import('../../apps/web/src/lib/data-service');

    const db = {
      queryOneAsync: vi.fn(),
      queryAsync: vi.fn(),
      runAsync: vi.fn(),
      transactionAsync: vi.fn(),
    };

    const ds = createDataService(db as never);

    // Create array of 1001 valid UUIDs
    const tooManyIds = Array.from(
      { length: 1001 },
      (_, i) => `${i.toString().padStart(8, '0')}-1234-1234-1234-123456789abc`
    );

    await expect(ds.deleteTransactionsByIds(tooManyIds)).rejects.toThrow(
      'Maximum'
    );
  });

  it('batches large deletions and recalculates affected accounts', async () => {
    const { createDataService } =
      await import('../../apps/web/src/lib/data-service');

    const queryAsync = vi
      .fn()
      .mockResolvedValue([{ account_id: VALID_ACCOUNT_ID }]);
    const queryOneAsync = vi
      .fn()
      .mockResolvedValueOnce({ current_balance: 1000 })
      .mockResolvedValueOnce({ balance_after: 500 });

    const runAsync = vi
      .fn()
      .mockResolvedValue({ changes: 1, lastInsertRowId: 0 });

    const db = {
      queryOneAsync,
      queryAsync,
      runAsync,
      transactionAsync: vi.fn(async (fn: () => Promise<void>) => fn()),
    };

    const ds = createDataService(db as never);

    const result = await ds.deleteTransactionsByIds([
      '12345678-1234-1234-1234-123456789abc',
    ]);

    expect(result.deletedCount).toBe(1);
    expect(result.affectedAccountIds).toContain(VALID_ACCOUNT_ID);
  });
});

// ============================================
// TESTS: Restore Transactions
// ============================================

describe('web data-service restoreTransactions', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    Object.defineProperty(global, 'window', {
      value: {},
      configurable: true,
      writable: true,
    });
  });

  it('returns empty result for empty transaction IDs array', async () => {
    const { createDataService } =
      await import('../../apps/web/src/lib/data-service');

    const db = {
      queryOneAsync: vi.fn(),
      queryAsync: vi.fn(),
      runAsync: vi.fn(),
      transactionAsync: vi.fn(),
    };

    const ds = createDataService(db as never);

    const result = await ds.restoreTransactions([]);

    expect(result.restoredCount).toBe(0);
    expect(result.affectedAccountIds).toEqual([]);
    expect(db.transactionAsync).not.toHaveBeenCalled();
  });

  it('rejects arrays with invalid UUIDs', async () => {
    const { createDataService } =
      await import('../../apps/web/src/lib/data-service');

    const db = {
      queryOneAsync: vi.fn(),
      queryAsync: vi.fn(),
      runAsync: vi.fn(),
      transactionAsync: vi.fn(),
    };

    const ds = createDataService(db as never);

    await expect(
      ds.restoreTransactions(['invalid-uuid-format'])
    ).rejects.toThrow('Invalid transaction ID format');
  });

  it('enforces maximum restore ID limit', async () => {
    const { createDataService } =
      await import('../../apps/web/src/lib/data-service');

    const db = {
      queryOneAsync: vi.fn(),
      queryAsync: vi.fn(),
      runAsync: vi.fn(),
      transactionAsync: vi.fn(),
    };

    const ds = createDataService(db as never);

    // Create array of 1001 valid UUIDs
    const tooManyIds = Array.from(
      { length: 1001 },
      (_, i) => `${i.toString().padStart(8, '0')}-1234-1234-1234-123456789abc`
    );

    await expect(ds.restoreTransactions(tooManyIds)).rejects.toThrow('Maximum');
  });

  it('restores soft-deleted transactions and recalculates balances', async () => {
    const { createDataService } =
      await import('../../apps/web/src/lib/data-service');

    const queryAsync = vi
      .fn()
      .mockResolvedValue([{ account_id: VALID_ACCOUNT_ID }]);
    const queryOneAsync = vi
      .fn()
      .mockResolvedValueOnce({ current_balance: 500 })
      .mockResolvedValueOnce({ balance_after: 1000 });

    const runAsync = vi
      .fn()
      .mockResolvedValue({ changes: 1, lastInsertRowId: 0 });

    const db = {
      queryOneAsync,
      queryAsync,
      runAsync,
      transactionAsync: vi.fn(async (fn: () => Promise<void>) => fn()),
    };

    const ds = createDataService(db as never);

    const result = await ds.restoreTransactions([
      '12345678-1234-1234-1234-123456789abc',
    ]);

    expect(result.restoredCount).toBe(1);
    expect(result.affectedAccountIds).toContain(VALID_ACCOUNT_ID);
  });
});
