/**
 * Tests for sync-adapter module
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildSyncManifest,
  diffManifests,
  getRowsForSync,
  applySyncData,
  markRowsDeleted,
  getChangesSince,
  purgeDeletedRows,
  SYNCABLE_TABLES,
  type SyncDatabaseAdapter,
  type SyncManifest,
  type SyncableRow,
} from '@fluxby/database';

// Mock adapter factory
function createMockAdapter(
  profileId = 'profile-123',
  data: Record<string, SyncableRow[]> = {}
): SyncDatabaseAdapter {
  return {
    query: vi.fn(async <T>(sql: string, params?: unknown[]): Promise<T[]> => {
      // Extract table name from SQL
      const tableMatch = sql.match(/FROM\s+(\w+)/i);
      const table = tableMatch?.[1];
      if (table && data[table]) {
        // Filter by profile_id if provided
        const profileParam = params?.find(
          (p) => typeof p === 'string' && p === profileId
        );
        if (profileParam) {
          return data[table] as T[];
        }
      }
      return [] as T[];
    }),
    run: vi.fn(async () => ({ changes: 1 })),
    transaction: vi.fn(async <T>(fn: () => Promise<T>): Promise<T> => fn()),
    getProfileId: vi.fn(() => profileId),
  };
}

describe('sync-adapter', () => {
  describe('SYNCABLE_TABLES', () => {
    it('should include all expected tables', () => {
      expect(SYNCABLE_TABLES).toContain('accounts');
      expect(SYNCABLE_TABLES).toContain('transactions');
      expect(SYNCABLE_TABLES).toContain('categories');
      expect(SYNCABLE_TABLES).toContain('budgets');
      expect(SYNCABLE_TABLES).toContain('category_rules');
      expect(SYNCABLE_TABLES).toContain('address_book');
    });

    it('should have exactly 6 tables', () => {
      expect(SYNCABLE_TABLES).toHaveLength(6);
    });
  });

  describe('buildSyncManifest', () => {
    it('should build manifest with all tables', async () => {
      const adapter = createMockAdapter('profile-123', {
        accounts: [
          {
            id: 'acc-1',
            updated_at: 1000,
            is_deleted: 0,
            device_id: 'device-1',
            profile_id: 'profile-123',
          },
        ],
        transactions: [],
        categories: [],
        budgets: [],
        category_rules: [],
        address_book: [],
      });

      const manifest = await buildSyncManifest(adapter, 'device-1');

      expect(manifest.device_id).toBe('device-1');
      expect(manifest.profile_id).toBe('profile-123');
      expect(manifest.tables).toHaveLength(6);
      expect(manifest.timestamp).toBeGreaterThan(0);
    });

    it('should include row metadata in manifest', async () => {
      const adapter = createMockAdapter('profile-123', {
        accounts: [
          {
            id: 'acc-1',
            updated_at: 1000,
            is_deleted: 0,
            device_id: 'device-1',
            profile_id: 'profile-123',
          },
          {
            id: 'acc-2',
            updated_at: 2000,
            is_deleted: 1,
            device_id: 'device-2',
            profile_id: 'profile-123',
          },
        ],
        transactions: [],
        categories: [],
        budgets: [],
        category_rules: [],
        address_book: [],
      });

      const manifest = await buildSyncManifest(adapter, 'device-1');
      const accountsTable = manifest.tables.find((t) => t.table === 'accounts');

      expect(accountsTable?.rows).toHaveLength(2);
      expect(accountsTable?.rows[0]).toEqual({
        id: 'acc-1',
        updated_at: 1000,
        is_deleted: false,
      });
      expect(accountsTable?.rows[1]).toEqual({
        id: 'acc-2',
        updated_at: 2000,
        is_deleted: true,
      });
    });
  });

  describe('diffManifests', () => {
    it('should detect rows to send (local only)', () => {
      const local: SyncManifest = {
        device_id: 'device-1',
        profile_id: 'profile-123',
        timestamp: Date.now(),
        tables: [
          {
            table: 'accounts',
            rows: [{ id: 'acc-1', updated_at: 1000, is_deleted: false }],
          },
          { table: 'transactions', rows: [] },
          { table: 'categories', rows: [] },
          { table: 'budgets', rows: [] },
          { table: 'category_rules', rows: [] },
          { table: 'address_book', rows: [] },
        ],
      };

      const remote: SyncManifest = {
        device_id: 'device-2',
        profile_id: 'profile-123',
        timestamp: Date.now(),
        tables: [
          { table: 'accounts', rows: [] },
          { table: 'transactions', rows: [] },
          { table: 'categories', rows: [] },
          { table: 'budgets', rows: [] },
          { table: 'category_rules', rows: [] },
          { table: 'address_book', rows: [] },
        ],
      };

      const diff = diffManifests(local, remote);

      expect(diff.toSend).toHaveLength(1);
      expect(diff.toSend[0].table).toBe('accounts');
      expect(diff.toSend[0].ids).toEqual(['acc-1']);
      expect(diff.toReceive).toHaveLength(0);
    });

    it('should detect rows to receive (remote only)', () => {
      const local: SyncManifest = {
        device_id: 'device-1',
        profile_id: 'profile-123',
        timestamp: Date.now(),
        tables: [
          { table: 'accounts', rows: [] },
          { table: 'transactions', rows: [] },
          { table: 'categories', rows: [] },
          { table: 'budgets', rows: [] },
          { table: 'category_rules', rows: [] },
          { table: 'address_book', rows: [] },
        ],
      };

      const remote: SyncManifest = {
        device_id: 'device-2',
        profile_id: 'profile-123',
        timestamp: Date.now(),
        tables: [
          {
            table: 'accounts',
            rows: [{ id: 'acc-1', updated_at: 1000, is_deleted: false }],
          },
          { table: 'transactions', rows: [] },
          { table: 'categories', rows: [] },
          { table: 'budgets', rows: [] },
          { table: 'category_rules', rows: [] },
          { table: 'address_book', rows: [] },
        ],
      };

      const diff = diffManifests(local, remote);

      expect(diff.toReceive).toHaveLength(1);
      expect(diff.toReceive[0].table).toBe('accounts');
      expect(diff.toReceive[0].ids).toEqual(['acc-1']);
      expect(diff.toSend).toHaveLength(0);
    });

    it('should use Last-Write-Wins for conflicts', () => {
      const local: SyncManifest = {
        device_id: 'device-1',
        profile_id: 'profile-123',
        timestamp: Date.now(),
        tables: [
          {
            table: 'accounts',
            rows: [
              { id: 'acc-1', updated_at: 2000, is_deleted: false }, // Local is newer
              { id: 'acc-2', updated_at: 1000, is_deleted: false }, // Remote is newer
            ],
          },
          { table: 'transactions', rows: [] },
          { table: 'categories', rows: [] },
          { table: 'budgets', rows: [] },
          { table: 'category_rules', rows: [] },
          { table: 'address_book', rows: [] },
        ],
      };

      const remote: SyncManifest = {
        device_id: 'device-2',
        profile_id: 'profile-123',
        timestamp: Date.now(),
        tables: [
          {
            table: 'accounts',
            rows: [
              { id: 'acc-1', updated_at: 1000, is_deleted: false }, // Local is newer
              { id: 'acc-2', updated_at: 2000, is_deleted: false }, // Remote is newer
            ],
          },
          { table: 'transactions', rows: [] },
          { table: 'categories', rows: [] },
          { table: 'budgets', rows: [] },
          { table: 'category_rules', rows: [] },
          { table: 'address_book', rows: [] },
        ],
      };

      const diff = diffManifests(local, remote);

      // acc-1: local is newer, should send
      expect(diff.toSend).toContainEqual({ table: 'accounts', ids: ['acc-1'] });
      expect(diff.localNewer).toContainEqual({
        table: 'accounts',
        ids: ['acc-1'],
      });

      // acc-2: remote is newer, should receive
      expect(diff.toReceive).toContainEqual({
        table: 'accounts',
        ids: ['acc-2'],
      });
    });

    it('should not sync rows with equal timestamps', () => {
      const local: SyncManifest = {
        device_id: 'device-1',
        profile_id: 'profile-123',
        timestamp: Date.now(),
        tables: [
          {
            table: 'accounts',
            rows: [{ id: 'acc-1', updated_at: 1000, is_deleted: false }],
          },
          { table: 'transactions', rows: [] },
          { table: 'categories', rows: [] },
          { table: 'budgets', rows: [] },
          { table: 'category_rules', rows: [] },
          { table: 'address_book', rows: [] },
        ],
      };

      const remote: SyncManifest = {
        device_id: 'device-2',
        profile_id: 'profile-123',
        timestamp: Date.now(),
        tables: [
          {
            table: 'accounts',
            rows: [{ id: 'acc-1', updated_at: 1000, is_deleted: false }],
          },
          { table: 'transactions', rows: [] },
          { table: 'categories', rows: [] },
          { table: 'budgets', rows: [] },
          { table: 'category_rules', rows: [] },
          { table: 'address_book', rows: [] },
        ],
      };

      const diff = diffManifests(local, remote);

      expect(diff.toSend).toHaveLength(0);
      expect(diff.toReceive).toHaveLength(0);
      expect(diff.localNewer).toHaveLength(0);
    });
  });

  describe('getRowsForSync', () => {
    it('should return empty array for empty ids', async () => {
      const adapter = createMockAdapter();
      const rows = await getRowsForSync(adapter, 'accounts', []);
      expect(rows).toEqual([]);
      expect(adapter.query).not.toHaveBeenCalled();
    });

    it('should query rows by IDs', async () => {
      const adapter = createMockAdapter();
      await getRowsForSync(adapter, 'accounts', ['acc-1', 'acc-2']);

      expect(adapter.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM accounts'),
        expect.arrayContaining(['acc-1', 'acc-2', 'profile-123'])
      );
    });
  });

  describe('applySyncData', () => {
    let adapter: SyncDatabaseAdapter;

    beforeEach(() => {
      adapter = createMockAdapter();
    });

    it('should return zeros for empty rows', async () => {
      const result = await applySyncData(adapter, 'accounts', [], 'device-1');
      expect(result).toEqual({ applied: 0, skipped: 0 });
    });

    it('should skip rows from same device', async () => {
      const rows: SyncableRow[] = [
        {
          id: 'acc-1',
          updated_at: 1000,
          is_deleted: 0,
          device_id: 'device-1',
          profile_id: 'profile-123',
        },
      ];

      const result = await applySyncData(
        adapter,
        'accounts',
        rows,
        'device-1' // Same device
      );

      expect(result.skipped).toBe(1);
      expect(result.applied).toBe(0);
    });

    it('should insert new rows', async () => {
      // Mock query to return empty (row doesn't exist)
      adapter.query = vi.fn(async () => []);

      const rows: SyncableRow[] = [
        {
          id: 'acc-1',
          updated_at: 1000,
          is_deleted: 0,
          device_id: 'device-2', // Different device
          profile_id: 'profile-123',
        },
      ];

      const result = await applySyncData(adapter, 'accounts', rows, 'device-1');

      expect(result.applied).toBe(1);
      expect(adapter.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO accounts'),
        expect.any(Array)
      );
    });

    it('should update existing rows if incoming is newer', async () => {
      // Mock query to return existing row with older timestamp
      adapter.query = vi.fn(async () => [
        { id: 'acc-1', updated_at: 500 }, // Older than incoming
      ]);

      const rows: SyncableRow[] = [
        {
          id: 'acc-1',
          updated_at: 1000, // Newer
          is_deleted: 0,
          device_id: 'device-2',
          profile_id: 'profile-123',
        },
      ];

      const result = await applySyncData(adapter, 'accounts', rows, 'device-1');

      expect(result.applied).toBe(1);
      expect(adapter.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE accounts SET'),
        expect.any(Array)
      );
    });

    it('should skip update if local is newer', async () => {
      // Mock query to return existing row with newer timestamp
      adapter.query = vi.fn(async () => [
        { id: 'acc-1', updated_at: 2000 }, // Newer than incoming
      ]);

      const rows: SyncableRow[] = [
        {
          id: 'acc-1',
          updated_at: 1000, // Older
          is_deleted: 0,
          device_id: 'device-2',
          profile_id: 'profile-123',
        },
      ];

      const result = await applySyncData(adapter, 'accounts', rows, 'device-1');

      expect(result.skipped).toBe(1);
      expect(result.applied).toBe(0);
    });
  });

  describe('markRowsDeleted', () => {
    it('should return 0 for empty ids', async () => {
      const adapter = createMockAdapter();
      const result = await markRowsDeleted(adapter, 'accounts', [], 'device-1');
      expect(result).toBe(0);
    });

    it('should mark rows as deleted', async () => {
      const adapter = createMockAdapter();
      await markRowsDeleted(
        adapter,
        'accounts',
        ['acc-1', 'acc-2'],
        'device-1'
      );

      expect(adapter.run).toHaveBeenCalledTimes(2);
      expect(adapter.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE accounts SET is_deleted = 1'),
        expect.arrayContaining(['device-1', 'acc-1', 'profile-123'])
      );
    });
  });

  describe('getChangesSince', () => {
    it('should query for changes since timestamp', async () => {
      const adapter = createMockAdapter();
      await getChangesSince(adapter, 'accounts', 1000);

      expect(adapter.query).toHaveBeenCalledWith(
        expect.stringContaining('updated_at > ?'),
        ['profile-123', 1000]
      );
    });
  });

  describe('purgeDeletedRows', () => {
    it('should purge old deleted rows from all tables', async () => {
      const adapter = createMockAdapter();
      await purgeDeletedRows(adapter);

      // Should be called for each syncable table
      expect(adapter.run).toHaveBeenCalledTimes(SYNCABLE_TABLES.length);
      expect(adapter.run).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM accounts'),
        expect.any(Array)
      );
    });

    it('should use custom threshold', async () => {
      const adapter = createMockAdapter();
      const customThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days
      await purgeDeletedRows(adapter, customThreshold);

      // Verify threshold is used in query
      expect(adapter.run).toHaveBeenCalledWith(
        expect.stringContaining('updated_at < ?'),
        expect.arrayContaining(['profile-123'])
      );
    });
  });
});
