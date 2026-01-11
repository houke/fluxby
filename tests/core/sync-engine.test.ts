import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SyncEngine,
  createSyncEngine,
  formatRelativeTime,
  type SyncStatus,
  type SyncChange,
  type SyncableRow,
} from '@fluxby/core';

describe('SyncEngine', () => {
  let engine: SyncEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    engine = createSyncEngine({
      debounceDelay: 100,
      maxBatchSize: 10,
      autoSync: true,
    });
  });

  afterEach(async () => {
    // Run all timers to let any pending syncs complete before destroying
    await vi.runAllTimersAsync();
    engine.destroy();
    vi.useRealTimers();
  });

  describe('status management', () => {
    it('should have initial idle status', () => {
      const status = engine.getStatus();
      expect(status.state).toBe('idle');
      expect(status.lastSyncedAt).toBe(null);
      expect(status.pendingChanges).toBe(0);
      expect(status.connectedPeers).toBe(0);
      expect(status.isSyncing).toBe(false);
    });

    it('should notify subscribers of status changes', () => {
      const listener = vi.fn();
      engine.subscribeStatus(listener);

      // Initial call
      expect(listener).toHaveBeenCalledTimes(1);
      const initialCallCount = listener.mock.calls.length;

      // Update connected peers
      engine.setConnectedPeers(2);
      expect(listener.mock.calls.length).toBeGreaterThan(initialCallCount);

      // Check that a call includes the updated connectedPeers
      const hasUpdatedStatus = listener.mock.calls.some(
        (call) => (call[0] as SyncStatus).connectedPeers === 2
      );
      expect(hasUpdatedStatus).toBe(true);
    });

    it('should allow unsubscribing from status updates', () => {
      const listener = vi.fn();
      const unsubscribe = engine.subscribeStatus(listener);

      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      engine.setConnectedPeers(5);

      // Should not receive any more updates
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('connection management', () => {
    it('should update state to offline when no peers', () => {
      engine.setConnectedPeers(0);
      expect(engine.getStatus().state).toBe('offline');
    });

    it('should update state to idle when peers connected (without syncOnReconnect)', () => {
      // Create engine with syncOnReconnect disabled to test state change directly
      const testEngine = createSyncEngine({
        debounceDelay: 100,
        maxBatchSize: 10,
        autoSync: true,
        syncOnReconnect: false,
      });
      testEngine.setConnectedPeers(2);
      expect(testEngine.getStatus().state).toBe('idle');
      testEngine.destroy();
    });

    it('should trigger sync when reconnecting with syncOnReconnect enabled', () => {
      // Default config has syncOnReconnect: true
      // When peers connect, it triggers forceSync which sets state to 'syncing'
      engine.setConnectedPeers(0); // Start disconnected
      engine.setConnectedPeers(2); // Reconnect
      // State goes to 'syncing' because forceSync was triggered
      expect(engine.getStatus().state).toBe('syncing');
    });

    it('should set connecting state', () => {
      engine.setConnecting();
      expect(engine.getStatus().state).toBe('connecting');
    });

    it('should set offline state', () => {
      engine.setOffline();
      const status = engine.getStatus();
      expect(status.state).toBe('offline');
      expect(status.connectedPeers).toBe(0);
    });
  });

  describe('change queueing', () => {
    it('should queue changes and update pending count', () => {
      const change: SyncChange<SyncableRow> = {
        table: 'transactions',
        row: {
          id: 'tx-1',
          updated_at: Date.now(),
          is_deleted: false,
          device_id: 'device-1',
        },
      };

      engine.queueChange(change);
      expect(engine.getStatus().pendingChanges).toBe(1);
    });

    it('should deduplicate changes by table:id', () => {
      const change1: SyncChange<SyncableRow> = {
        table: 'transactions',
        row: {
          id: 'tx-1',
          updated_at: Date.now(),
          is_deleted: false,
          device_id: 'device-1',
        },
      };

      const change2: SyncChange<SyncableRow> = {
        table: 'transactions',
        row: {
          id: 'tx-1',
          updated_at: Date.now() + 1000,
          is_deleted: false,
          device_id: 'device-1',
        },
      };

      engine.queueChange(change1);
      engine.queueChange(change2);

      // Should still be 1 because same table:id
      expect(engine.getStatus().pendingChanges).toBe(1);
    });

    it('should queue multiple changes', () => {
      const changes: SyncChange<SyncableRow>[] = [
        {
          table: 'transactions',
          row: {
            id: 'tx-1',
            updated_at: Date.now(),
            is_deleted: false,
            device_id: 'device-1',
          },
        },
        {
          table: 'accounts',
          row: {
            id: 'acc-1',
            updated_at: Date.now(),
            is_deleted: false,
            device_id: 'device-1',
          },
        },
      ];

      engine.queueChanges(changes);
      expect(engine.getStatus().pendingChanges).toBe(2);
    });
  });

  describe('debouncing', () => {
    it('should debounce push operations', () => {
      const pushHandler = vi.fn();
      engine.setPushHandler(pushHandler);
      engine.setConnectedPeers(1);

      const change: SyncChange<SyncableRow> = {
        table: 'transactions',
        row: {
          id: 'tx-1',
          updated_at: Date.now(),
          is_deleted: false,
          device_id: 'device-1',
        },
      };

      engine.queueChange(change);

      // Should not call push handler immediately
      expect(pushHandler).not.toHaveBeenCalled();

      // After debounce delay
      vi.advanceTimersByTime(150);

      expect(pushHandler).toHaveBeenCalledTimes(1);
    });

    it('should reset debounce timer on new changes', () => {
      const pushHandler = vi.fn();
      engine.setPushHandler(pushHandler);
      engine.setConnectedPeers(1);

      engine.queueChange({
        table: 'transactions',
        row: {
          id: 'tx-1',
          updated_at: Date.now(),
          is_deleted: false,
          device_id: 'device-1',
        },
      });

      // After 50ms, queue another change
      vi.advanceTimersByTime(50);

      engine.queueChange({
        table: 'transactions',
        row: {
          id: 'tx-2',
          updated_at: Date.now(),
          is_deleted: false,
          device_id: 'device-1',
        },
      });

      // After another 50ms (total 100ms), should not have fired yet
      vi.advanceTimersByTime(50);
      expect(pushHandler).not.toHaveBeenCalled();

      // After the full debounce delay from last change
      vi.advanceTimersByTime(100);
      expect(pushHandler).toHaveBeenCalledTimes(1);
      expect(pushHandler).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('incoming sync handling', () => {
    it('should accept incoming changes', () => {
      const changes: SyncChange<SyncableRow>[] = [
        {
          table: 'transactions',
          row: {
            id: 'tx-1',
            updated_at: Date.now(),
            is_deleted: false,
            device_id: 'device-2',
          },
        },
      ];

      const shouldApply = engine.shouldApplyIncomingChanges(changes);
      expect(shouldApply).toBe(true);
    });

    it('should update lastSyncedAt on incoming sync complete', () => {
      engine.markIncomingSyncComplete();
      expect(engine.getStatus().lastSyncedAt).not.toBe(null);
    });
  });

  describe('destroy', () => {
    it('should clean up resources on destroy', () => {
      const listener = vi.fn();
      engine.subscribeStatus(listener);

      engine.destroy();

      // After destroy, status updates should not be delivered
      engine.setConnectedPeers(5);
      expect(listener).toHaveBeenCalledTimes(1); // Only initial call
    });
  });

  describe('forceSync', () => {
    it('should return error when no peers connected', async () => {
      const result = await engine.forceSync();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No peers connected');
      expect(result.changesPushed).toBe(0);
      expect(result.changesReceived).toBe(0);
    });

    it('should return error if already syncing', async () => {
      engine.setConnectedPeers(1);

      // Start first sync
      const promise1 = engine.forceSync(500);

      // Try to start another sync while first is in progress
      const result2 = await engine.forceSync();

      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Sync already in progress');

      // Let the first sync complete
      await vi.runAllTimersAsync();
      await promise1;
    });
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-08T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "Never" for null timestamp', () => {
    expect(formatRelativeTime(null, 'en')).toBe('Never');
    expect(formatRelativeTime(null, 'nl')).toBe('Nooit');
  });

  it('should return "Just now" for recent timestamps', () => {
    const timestamp = Date.now() - 30 * 1000; // 30 seconds ago
    expect(formatRelativeTime(timestamp, 'en')).toBe('Just now');
    expect(formatRelativeTime(timestamp, 'nl')).toBe('Zojuist');
  });

  it('should return minutes ago for timestamps within an hour', () => {
    const timestamp = Date.now() - 5 * 60 * 1000; // 5 minutes ago
    expect(formatRelativeTime(timestamp, 'en')).toBe('5 min ago');
    expect(formatRelativeTime(timestamp, 'nl')).toBe('5 min geleden');
  });

  it('should return hours ago for timestamps within a day', () => {
    const timestamp = Date.now() - 3 * 60 * 60 * 1000; // 3 hours ago
    expect(formatRelativeTime(timestamp, 'en')).toBe('3 hours ago');
    expect(formatRelativeTime(timestamp, 'nl')).toBe('3 uur geleden');
  });

  it('should return days ago for timestamps within a week', () => {
    const timestamp = Date.now() - 2 * 24 * 60 * 60 * 1000; // 2 days ago
    expect(formatRelativeTime(timestamp, 'en')).toBe('2 days ago');
    expect(formatRelativeTime(timestamp, 'nl')).toBe('2 dagen geleden');
  });

  it('should return formatted date for older timestamps', () => {
    const timestamp = Date.now() - 14 * 24 * 60 * 60 * 1000; // 14 days ago
    const result = formatRelativeTime(timestamp, 'en');
    expect(result).toMatch(/Dec 25|25 Dec/); // Date format varies by locale
  });
});
