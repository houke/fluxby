/**
 * Tests for sync logic
 */

import { describe, it, expect } from 'vitest';
import {
  checkClockDrift,
  mergeChanges,
  createSyncableRow,
  updateSyncableRow,
  deleteSyncableRow,
  type SyncableRow,
  type SyncChange,
} from '../../packages/core/src/sync.js';

describe('sync', () => {
  describe('checkClockDrift', () => {
    it('should detect no drift for current timestamp', () => {
      const result = checkClockDrift(Date.now());
      expect(result.hasDrift).toBe(false);
    });

    it('should detect drift for timestamp far in future', () => {
      const futureTime = Date.now() + 2 * 60 * 60 * 1000; // 2 hours ahead
      const result = checkClockDrift(futureTime);
      expect(result.hasDrift).toBe(true);
      expect(result.driftMs).toBeGreaterThan(60 * 60 * 1000);
    });

    it('should not flag timestamps in the past', () => {
      const pastTime = Date.now() - 24 * 60 * 60 * 1000; // 1 day ago
      const result = checkClockDrift(pastTime);
      expect(result.hasDrift).toBe(false);
    });

    it('should allow slight drift within threshold', () => {
      const slightFuture = Date.now() + 30 * 60 * 1000; // 30 min ahead
      const result = checkClockDrift(slightFuture);
      expect(result.hasDrift).toBe(false);
    });
  });

  describe('createSyncableRow', () => {
    it('should create row with sync metadata', () => {
      const row = createSyncableRow({ name: 'Test' }, 'device-123');

      expect(row.id).toBeDefined();
      expect(row.updated_at).toBeTypeOf('number');
      expect(row.is_deleted).toBe(false);
      expect(row.device_id).toBe('device-123');
      expect(row.name).toBe('Test');
    });

    it('should generate unique IDs', () => {
      const row1 = createSyncableRow({}, 'device-123');
      const row2 = createSyncableRow({}, 'device-123');

      expect(row1.id).not.toBe(row2.id);
    });
  });

  describe('updateSyncableRow', () => {
    it('should update row and timestamp', () => {
      const original = createSyncableRow({ name: 'Original' }, 'device-1');

      // Wait a tiny bit to ensure timestamp differs
      const updated = updateSyncableRow(
        original,
        { name: 'Updated' },
        'device-2'
      );

      expect(updated.id).toBe(original.id);
      expect(updated.name).toBe('Updated');
      expect(updated.device_id).toBe('device-2');
      expect(updated.updated_at).toBeGreaterThanOrEqual(original.updated_at);
    });
  });

  describe('deleteSyncableRow', () => {
    it('should mark row as deleted', () => {
      const original = createSyncableRow({ name: 'Test' }, 'device-1');
      const deleted = deleteSyncableRow(original, 'device-2');

      expect(deleted.is_deleted).toBe(true);
      expect(deleted.device_id).toBe('device-2');
      expect(deleted.id).toBe(original.id);
    });
  });

  describe('mergeChanges', () => {
    const deviceId = 'local-device';

    it('should apply new rows from remote', () => {
      const localRows = new Map<string, SyncableRow>();
      const remoteChanges: SyncChange[] = [
        {
          table: 'transactions',
          row: {
            id: 'tx-1',
            updated_at: Date.now(),
            is_deleted: false,
            device_id: 'remote-device',
          },
        },
      ];

      const result = mergeChanges(localRows, remoteChanges, deviceId);

      expect(result.applied).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should skip older remote changes (LWW)', () => {
      const now = Date.now();
      const localRows = new Map<string, SyncableRow>([
        [
          'tx-1',
          {
            id: 'tx-1',
            updated_at: now,
            is_deleted: false,
            device_id: deviceId,
          },
        ],
      ]);

      const remoteChanges: SyncChange[] = [
        {
          table: 'transactions',
          row: {
            id: 'tx-1',
            updated_at: now - 1000, // Older
            is_deleted: false,
            device_id: 'remote-device',
          },
        },
      ];

      const result = mergeChanges(localRows, remoteChanges, deviceId);

      expect(result.applied).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].resolution).toBe('local');
    });

    it('should apply newer remote changes', () => {
      const now = Date.now();
      const localRows = new Map<string, SyncableRow>([
        [
          'tx-1',
          {
            id: 'tx-1',
            updated_at: now - 1000, // Older
            is_deleted: false,
            device_id: deviceId,
          },
        ],
      ]);

      const remoteChanges: SyncChange[] = [
        {
          table: 'transactions',
          row: {
            id: 'tx-1',
            updated_at: now, // Newer
            is_deleted: false,
            device_id: 'remote-device',
          },
        },
      ];

      const result = mergeChanges(localRows, remoteChanges, deviceId);

      expect(result.applied).toBe(1);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].resolution).toBe('remote');
    });

    it('should handle equal timestamps with device ID tiebreaker', () => {
      const now = Date.now();
      const localRows = new Map<string, SyncableRow>([
        [
          'tx-1',
          {
            id: 'tx-1',
            updated_at: now,
            is_deleted: false,
            device_id: 'aaa-device', // Lower alphabetically
          },
        ],
      ]);

      const remoteChanges: SyncChange[] = [
        {
          table: 'transactions',
          row: {
            id: 'tx-1',
            updated_at: now, // Same timestamp
            is_deleted: false,
            device_id: 'zzz-device', // Higher alphabetically
          },
        },
      ];

      const result = mergeChanges(localRows, remoteChanges, 'aaa-device');

      // Higher device_id wins in a tie
      expect(result.applied).toBe(1);
    });

    it('should process deletions correctly', () => {
      const now = Date.now();
      const localRows = new Map<string, SyncableRow>([
        [
          'tx-1',
          {
            id: 'tx-1',
            updated_at: now - 1000,
            is_deleted: false,
            device_id: deviceId,
          },
        ],
      ]);

      const remoteChanges: SyncChange[] = [
        {
          table: 'transactions',
          row: {
            id: 'tx-1',
            updated_at: now,
            is_deleted: true, // Deleted
            device_id: 'remote-device',
          },
        },
      ];

      const result = mergeChanges(localRows, remoteChanges, deviceId);

      expect(result.applied).toBe(1);
    });
  });
});
