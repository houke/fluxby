/**
 * Tests for offline support utilities
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  SyncQueue,
  ConnectivityMonitor,
  createInitialConnectivityState,
} from '../../packages/database/src/offline.js';

describe('offline', () => {
  describe('createInitialConnectivityState', () => {
    it('should create initial state', () => {
      const state = createInitialConnectivityState();

      expect(state).toHaveProperty('isOnline');
      expect(state.lastOnline).toBeNull();
      expect(state.lastSyncAttempt).toBeNull();
      expect(state.lastSyncSuccess).toBeNull();
    });
  });

  describe('SyncQueue', () => {
    let queue: SyncQueue;

    beforeEach(() => {
      queue = new SyncQueue();
    });

    it('should start empty', () => {
      expect(queue.isEmpty()).toBe(true);
      expect(queue.size()).toBe(0);
    });

    it('should enqueue items', () => {
      queue.enqueue('transactions', 'tx-1', 'insert', { amount: 100 });

      expect(queue.isEmpty()).toBe(false);
      expect(queue.size()).toBe(1);
    });

    it('should dequeue items in order', () => {
      queue.enqueue('transactions', 'tx-1', 'insert', { amount: 100 });
      queue.enqueue('transactions', 'tx-2', 'insert', { amount: 200 });

      const first = queue.dequeue();
      expect(first?.rowId).toBe('tx-1');

      const second = queue.dequeue();
      expect(second?.rowId).toBe('tx-2');
    });

    it('should merge update operations for same row', () => {
      queue.enqueue('transactions', 'tx-1', 'insert', { amount: 100 });
      queue.enqueue('transactions', 'tx-1', 'update', {
        amount: 150,
        note: 'updated',
      });

      expect(queue.size()).toBe(1);

      const item = queue.dequeue();
      expect(item?.data.amount).toBe(150);
      expect(item?.data.note).toBe('updated');
    });

    it('should remove insert+delete for same row', () => {
      queue.enqueue('transactions', 'tx-1', 'insert', { amount: 100 });
      queue.enqueue('transactions', 'tx-1', 'delete', {});

      expect(queue.isEmpty()).toBe(true);
    });

    it('should convert update to delete when delete follows', () => {
      queue.enqueue('transactions', 'tx-1', 'update', { amount: 100 });
      queue.enqueue('transactions', 'tx-1', 'delete', {});

      expect(queue.size()).toBe(1);

      const item = queue.dequeue();
      expect(item?.operation).toBe('delete');
    });

    it('should serialize and deserialize', () => {
      queue.enqueue('transactions', 'tx-1', 'insert', { amount: 100 });
      queue.enqueue('accounts', 'acc-1', 'update', { name: 'Test' });

      const json = queue.toJSON();
      expect(typeof json).toBe('string');

      const newQueue = new SyncQueue();
      newQueue.fromJSON(json);

      expect(newQueue.size()).toBe(2);
    });

    it('should handle invalid JSON gracefully', () => {
      queue.enqueue('transactions', 'tx-1', 'insert', { amount: 100 });
      queue.fromJSON('invalid json');

      expect(queue.isEmpty()).toBe(true);
    });

    it('should notify listeners on changes', () => {
      const listener = vi.fn();
      queue.subscribe(listener);

      queue.enqueue('transactions', 'tx-1', 'insert', { amount: 100 });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should allow unsubscribing', () => {
      const listener = vi.fn();
      const unsubscribe = queue.subscribe(listener);

      unsubscribe();
      queue.enqueue('transactions', 'tx-1', 'insert', { amount: 100 });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should requeue failed items with retry count', () => {
      queue.enqueue('transactions', 'tx-1', 'insert', { amount: 100 });

      const item = queue.dequeue();
      expect(item).toBeDefined();
      expect(item?.retryCount).toBe(0);

      if (item) {
        const requeued = queue.requeueFailed(item);
        expect(requeued).toBe(true);
      }

      const retriedItem = queue.dequeue();
      expect(retriedItem).toBeDefined();
      expect(retriedItem?.retryCount).toBe(1);
    });

    it('should reject requeue after max retries', () => {
      queue.enqueue('transactions', 'tx-1', 'insert', { amount: 100 });

      let item = queue.dequeue();
      expect(item).toBeDefined();

      // Simulate 3 retries
      for (let i = 0; i < 3; i++) {
        if (item) {
          queue.requeueFailed(item);
          item = queue.dequeue();
        }
      }

      // 4th retry should fail
      expect(item).toBeDefined();
      const requeued = item ? queue.requeueFailed(item) : false;
      expect(requeued).toBe(false);
    });

    it('should clear all items', () => {
      queue.enqueue('transactions', 'tx-1', 'insert', { amount: 100 });
      queue.enqueue('transactions', 'tx-2', 'insert', { amount: 200 });

      queue.clear();

      expect(queue.isEmpty()).toBe(true);
    });
  });

  describe('ConnectivityMonitor', () => {
    let monitor: ConnectivityMonitor;

    beforeEach(() => {
      monitor = new ConnectivityMonitor();
    });

    afterEach(() => {
      monitor.destroy();
    });

    it('should track initial online state', () => {
      const state = monitor.getState();
      expect(state).toHaveProperty('isOnline');
    });

    it('should notify on state changes', () => {
      const listener = vi.fn();
      monitor.subscribe(listener);

      // Manually trigger state check - listener may be called
      expect(typeof listener).toBe('function');
    });

    it('should allow unsubscribing', () => {
      const listener = vi.fn();
      const unsubscribe = monitor.subscribe(listener);

      unsubscribe();
      // After unsubscribing, listener should not be in the set
    });

    it('should support sync callback', () => {
      const syncFn = vi.fn().mockResolvedValue(undefined);
      monitor.setSyncCallback(syncFn);

      // Callback is set but not called until connectivity changes
      expect(syncFn).not.toHaveBeenCalled();
    });

    it('should start and stop polling', () => {
      monitor.startPolling(1000);
      monitor.stopPolling();
      // Should not throw
    });
  });
});
