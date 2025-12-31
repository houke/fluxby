/**
 * Tests for backup utilities
 */

import { describe, it, expect } from 'vitest';
import {
  serializeBackup,
  deserializeBackup,
  getBackupFilename,
  estimateBackupSize,
  type BackupMetadata,
  type BackupFile,
} from '../../packages/database/src/backup.js';

describe('backup', () => {
  describe('serializeBackup / deserializeBackup', () => {
    it('should serialize and deserialize backup', () => {
      const metadata: BackupMetadata = {
        version: 1,
        createdAt: Date.now(),
        deviceId: 'device-123',
        encrypted: true,
        tables: ['accounts', 'transactions'],
        rowCounts: { accounts: 5, transactions: 100 },
      };

      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const backup: BackupFile = { metadata, data };

      const serialized = serializeBackup(backup);
      expect(serialized).toBeInstanceOf(Uint8Array);

      const deserialized = deserializeBackup(serialized);
      expect(deserialized).not.toBeNull();
      expect(deserialized?.metadata.version).toBe(1);
      expect(deserialized?.metadata.deviceId).toBe('device-123');
      expect(deserialized?.data).toEqual(data);
    });

    it('should handle large data', () => {
      const metadata: BackupMetadata = {
        version: 1,
        createdAt: Date.now(),
        deviceId: 'device-123',
        encrypted: true,
        tables: ['transactions'],
        rowCounts: { transactions: 10000 },
      };

      // 1MB of data
      const data = new Uint8Array(1024 * 1024);
      for (let i = 0; i < data.length; i++) {
        data[i] = i % 256;
      }

      const backup: BackupFile = { metadata, data };
      const serialized = serializeBackup(backup);
      const deserialized = deserializeBackup(serialized);

      expect(deserialized?.data.length).toBe(data.length);
      expect(deserialized?.data[1000]).toBe(data[1000]);
    });

    it('should return null for invalid data', () => {
      expect(deserializeBackup(new Uint8Array([1, 2, 3]))).toBeNull();
      expect(deserializeBackup(new Uint8Array([]))).toBeNull();
    });

    it('should return null for corrupted metadata', () => {
      // Create a buffer with invalid metadata length
      const bytes = new Uint8Array(100);
      const view = new DataView(bytes.buffer);
      view.setUint32(0, 1000, false); // Metadata length > buffer size

      expect(deserializeBackup(bytes)).toBeNull();
    });
  });

  describe('getBackupFilename', () => {
    it('should generate filename with date', () => {
      const filename = getBackupFilename();

      expect(filename).toMatch(/^fluxby-backup-\d{4}-\d{2}-\d{2}\.fluxby$/);
    });

    it('should use current date', () => {
      const today = new Date().toISOString().split('T')[0];
      const filename = getBackupFilename();

      expect(filename).toContain(today);
    });
  });

  describe('estimateBackupSize', () => {
    it('should estimate size based on row counts', () => {
      const rowCounts = {
        accounts: 10,
        transactions: 1000,
        categories: 50,
      };

      const estimate = estimateBackupSize(rowCounts);

      expect(estimate.bytes).toBeGreaterThan(0);
      expect(estimate.formatted).toMatch(/\d+(\.\d+)?\s*(B|KB|MB|GB)/);
    });

    it('should handle empty counts', () => {
      const estimate = estimateBackupSize({});

      expect(estimate.bytes).toBe(0);
      expect(estimate.formatted).toBe('0 B');
    });

    it('should format bytes correctly', () => {
      // Small: should be B
      const small = estimateBackupSize({ accounts: 1 });
      expect(small.formatted).toMatch(/B$/);

      // Large: should be KB or MB
      const large = estimateBackupSize({ transactions: 10000 });
      expect(large.formatted).toMatch(/(KB|MB)$/);
    });
  });
});
