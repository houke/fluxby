import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncLogger, getSyncLogger } from '@fluxby/core';

describe('SyncLogger', () => {
  beforeEach(() => {
    // Reset singleton between tests
    SyncLogger.resetInstance();
  });

  describe('basic logging', () => {
    it('logs entries with correct structure', () => {
      const logger = new SyncLogger({ consoleEnabled: false });

      logger.info('peer:open', 'Connection established', 'peer123');

      const entries = logger.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        level: 'info',
        event: 'peer:open',
        message: 'Connection established',
        peerId: 'peer123',
      });
      expect(entries[0].timestamp).toBeTypeOf('number');
    });

    it('logs at different levels', () => {
      const logger = new SyncLogger({ consoleEnabled: false });

      logger.debug('connection:data', 'Debug message');
      logger.info('peer:open', 'Info message');
      logger.warn('heartbeat:timeout', 'Warning message');
      logger.error('sync:error', 'Error message');

      const entries = logger.getEntries();
      expect(entries).toHaveLength(4);
      expect(entries.map((e) => e.level)).toEqual([
        'debug',
        'info',
        'warn',
        'error',
      ]);
    });

    it('includes optional data', () => {
      const logger = new SyncLogger({ consoleEnabled: false });
      const data = { rtt: 50, payload: 'test' };

      logger.info('heartbeat:received', 'Got heartbeat', 'peer123', data);

      const entries = logger.getEntries();
      expect(entries[0].data).toEqual(data);
    });
  });

  describe('filtering', () => {
    it('filters by minimum level', () => {
      const logger = new SyncLogger({
        consoleEnabled: false,
        minLevel: 'warn',
      });

      logger.debug('connection:data', 'Debug');
      logger.info('peer:open', 'Info');
      logger.warn('heartbeat:timeout', 'Warning');
      logger.error('sync:error', 'Error');

      const entries = logger.getEntries();
      expect(entries).toHaveLength(2);
      expect(entries.map((e) => e.level)).toEqual(['warn', 'error']);
    });

    it('gets entries by event', () => {
      const logger = new SyncLogger({ consoleEnabled: false });

      logger.info('peer:open', 'Opened');
      logger.info('peer:close', 'Closed');
      logger.info('peer:open', 'Opened again');

      const openEntries = logger.getEntriesByEvent('peer:open');
      expect(openEntries).toHaveLength(2);
    });

    it('gets entries by level', () => {
      const logger = new SyncLogger({ consoleEnabled: false });

      logger.info('peer:open', 'Info 1');
      logger.error('sync:error', 'Error 1');
      logger.info('peer:close', 'Info 2');

      const errorEntries = logger.getEntriesByLevel('error');
      expect(errorEntries).toHaveLength(1);
      expect(errorEntries[0].message).toBe('Error 1');
    });

    it('gets entries by peer ID', () => {
      const logger = new SyncLogger({ consoleEnabled: false });

      logger.info('peer:open', 'Message 1', 'peer-a');
      logger.info('peer:open', 'Message 2', 'peer-b');
      logger.info('peer:open', 'Message 3', 'peer-a');

      const peerAEntries = logger.getEntriesByPeer('peer-a');
      expect(peerAEntries).toHaveLength(2);
    });

    it('gets entries since timestamp', () => {
      const logger = new SyncLogger({ consoleEnabled: false });

      const _before = Date.now();
      logger.info('peer:open', 'Before');

      // Small delay
      const after = Date.now() + 1;
      logger.info('peer:close', 'After');

      const recentEntries = logger.getEntriesSince(after);
      expect(recentEntries.length).toBeLessThanOrEqual(1);
    });
  });

  describe('memory management', () => {
    it('trims entries when exceeding max', () => {
      const logger = new SyncLogger({
        consoleEnabled: false,
        maxEntries: 5,
      });

      for (let i = 0; i < 10; i++) {
        logger.info('peer:open', `Message ${i}`);
      }

      const entries = logger.getEntries();
      expect(entries).toHaveLength(5);
      // Should keep the most recent entries
      expect(entries[0].message).toBe('Message 5');
      expect(entries[4].message).toBe('Message 9');
    });

    it('clears all entries', () => {
      const logger = new SyncLogger({ consoleEnabled: false });

      logger.info('peer:open', 'Message 1');
      logger.info('peer:open', 'Message 2');

      expect(logger.getEntries()).toHaveLength(2);

      logger.clear();

      expect(logger.getEntries()).toHaveLength(0);
    });
  });

  describe('callbacks', () => {
    it('calls onLog callback for each entry', () => {
      const onLog = vi.fn();
      const logger = new SyncLogger({
        consoleEnabled: false,
        onLog,
      });

      logger.info('peer:open', 'Test message');

      expect(onLog).toHaveBeenCalledTimes(1);
      expect(onLog).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          event: 'peer:open',
          message: 'Test message',
        })
      );
    });
  });

  describe('statistics', () => {
    it('calculates statistics correctly', () => {
      const logger = new SyncLogger({ consoleEnabled: false });

      logger.debug('peer:open', 'Debug');
      logger.info('peer:close', 'Info');
      logger.warn('connection:error', 'Warning');
      logger.error('sync:error', 'Error 1');
      logger.error('sync:error', 'Error 2');
      logger.info('heartbeat:sent', 'Heartbeat');

      const stats = logger.getStats();

      expect(stats.totalEntries).toBe(6);
      expect(stats.byLevel).toEqual({
        debug: 1,
        info: 2,
        warn: 1,
        error: 2,
      });
      expect(stats.errorCount).toBe(2);
      expect(stats.warningCount).toBe(1);
      expect(stats.byEventPrefix).toEqual({
        peer: 2,
        connection: 1,
        sync: 2,
        heartbeat: 1,
      });
    });
  });

  describe('export', () => {
    it('exports entries as JSON', () => {
      const logger = new SyncLogger({ consoleEnabled: false });

      logger.info('peer:open', 'Test');

      const exported = logger.export();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].message).toBe('Test');
    });
  });

  describe('singleton', () => {
    it('returns the same instance', () => {
      const instance1 = SyncLogger.getInstance();
      const instance2 = SyncLogger.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('getSyncLogger returns singleton', () => {
      const logger = getSyncLogger();
      const instance = SyncLogger.getInstance();

      expect(logger).toBe(instance);
    });
  });
});
