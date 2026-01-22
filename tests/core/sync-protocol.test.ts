import { describe, it, expect } from 'vitest';
import {
  SYNC_PROTOCOL_VERSION,
  generateSyncId,
  isSyncProtocolMessage,
  createHandshakeMessage,
  createHeartbeatMessage,
  createSyncRequestMessage,
  createDebugPingMessage,
  chunkArray,
  estimateMessageSize,
  DEFAULT_SYNC_CONFIG,
} from '@fluxby/core';

describe('Sync Protocol', () => {
  describe('generateSyncId', () => {
    it('generates unique IDs', () => {
      const id1 = generateSyncId();
      const id2 = generateSyncId();

      expect(id1).not.toBe(id2);
    });

    it('generates IDs with sync_ prefix', () => {
      const id = generateSyncId();
      expect(id).toMatch(/^sync_\d+_[a-z0-9]+$/);
    });
  });

  describe('isSyncProtocolMessage', () => {
    it('returns true for valid sync messages', () => {
      expect(isSyncProtocolMessage({ type: 'sync:handshake' })).toBe(true);
      expect(isSyncProtocolMessage({ type: 'sync:heartbeat' })).toBe(true);
      expect(isSyncProtocolMessage({ type: 'sync:push' })).toBe(true);
    });

    it('returns false for non-sync messages', () => {
      expect(isSyncProtocolMessage({ type: 'pairing-request' })).toBe(false);
      expect(isSyncProtocolMessage({ type: 'other' })).toBe(false);
      expect(isSyncProtocolMessage(null)).toBe(false);
      expect(isSyncProtocolMessage(undefined)).toBe(false);
      expect(isSyncProtocolMessage('string')).toBe(false);
      expect(isSyncProtocolMessage(123)).toBe(false);
    });
  });

  describe('createHandshakeMessage', () => {
    it('creates a valid handshake message', () => {
      const msg = createHandshakeMessage('device-123', 'My Device', 1000, 7);

      expect(msg).toEqual({
        type: 'sync:handshake',
        protocolVersion: SYNC_PROTOCOL_VERSION,
        deviceId: 'device-123',
        deviceName: 'My Device',
        lastSyncTimestamp: 1000,
        schemaVersion: 7,
      });
    });
  });

  describe('createHeartbeatMessage', () => {
    it('creates a valid heartbeat message', () => {
      const before = Date.now();
      const msg = createHeartbeatMessage();
      const after = Date.now();

      expect(msg.type).toBe('sync:heartbeat');
      expect(msg.timestamp).toBeGreaterThanOrEqual(before);
      expect(msg.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('createSyncRequestMessage', () => {
    it('creates a valid sync request message', () => {
      const msg = createSyncRequestMessage(1000);

      expect(msg.type).toBe('sync:request');
      expect(msg.sinceTimestamp).toBe(1000);
      expect(msg.requestId).toMatch(/^sync_/);
      expect(msg.tables).toBeUndefined();
    });

    it('includes tables when specified', () => {
      const msg = createSyncRequestMessage(1000, ['transactions', 'accounts']);

      expect(msg.tables).toEqual(['transactions', 'accounts']);
    });
  });

  describe('createDebugPingMessage', () => {
    it('creates a valid debug ping message', () => {
      const before = Date.now();
      const msg = createDebugPingMessage('test-payload');
      const after = Date.now();

      expect(msg.type).toBe('sync:debug-ping');
      expect(msg.timestamp).toBeGreaterThanOrEqual(before);
      expect(msg.timestamp).toBeLessThanOrEqual(after);
      expect(msg.payload).toBe('test-payload');
    });

    it('works without payload', () => {
      const msg = createDebugPingMessage();
      expect(msg.payload).toBeUndefined();
    });
  });

  describe('chunkArray', () => {
    it('chunks an array into smaller arrays', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const chunks = chunkArray(arr, 3);

      expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);
    });

    it('handles arrays smaller than chunk size', () => {
      const arr = [1, 2];
      const chunks = chunkArray(arr, 5);

      expect(chunks).toEqual([[1, 2]]);
    });

    it('handles empty arrays', () => {
      const chunks = chunkArray([], 3);
      expect(chunks).toEqual([]);
    });
  });

  describe('estimateMessageSize', () => {
    it('estimates the byte size of a message', () => {
      const msg = { type: 'test', data: 'hello' };
      const size = estimateMessageSize(msg);

      // Should be the length of JSON.stringify in bytes
      const expected = new TextEncoder().encode(JSON.stringify(msg)).length;
      expect(size).toBe(expected);
    });

    it('handles complex objects', () => {
      const msg = {
        type: 'sync:data',
        changes: [
          { table: 'transactions', row: { id: '123', amount: 100 } },
          { table: 'transactions', row: { id: '456', amount: 200 } },
        ],
      };
      const size = estimateMessageSize(msg);

      expect(size).toBeGreaterThan(0);
    });
  });

  describe('DEFAULT_SYNC_CONFIG', () => {
    it('has expected default values', () => {
      expect(DEFAULT_SYNC_CONFIG.heartbeatInterval).toBe(5000);
      // Increased from 15s to 30s to handle mobile networks with higher latency
      expect(DEFAULT_SYNC_CONFIG.heartbeatTimeout).toBe(30000);
      expect(DEFAULT_SYNC_CONFIG.maxChunkSize).toBe(16 * 1024);
      expect(DEFAULT_SYNC_CONFIG.connectionTimeout).toBe(30000);
      expect(DEFAULT_SYNC_CONFIG.autoReconnect).toBe(true);
      expect(DEFAULT_SYNC_CONFIG.maxReconnectAttempts).toBe(5);
      expect(DEFAULT_SYNC_CONFIG.reconnectDelay).toBe(3000);
      expect(DEFAULT_SYNC_CONFIG.reconnectBackoff).toBe(1.5);
    });
  });

  describe('SYNC_PROTOCOL_VERSION', () => {
    it('is defined', () => {
      expect(SYNC_PROTOCOL_VERSION).toBe(1);
    });
  });
});
