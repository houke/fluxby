/**
 * Tests for error handling utilities
 */

import { describe, it, expect } from 'vitest';
import {
  DatabaseError,
  DatabaseCorruptionError,
  KeyDecryptionError,
  QuotaExceededError,
  MigrationError,
  SyncError,
  createSyncErrorLog,
  isRecoverableError,
  formatErrorForUser,
} from '../../packages/database/src/errors.js';

describe('errors', () => {
  describe('DatabaseError', () => {
    it('should create error with code', () => {
      const error = new DatabaseError('Test error', 'TEST_CODE', true);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.recoverable).toBe(true);
      expect(error.name).toBe('DatabaseError');
    });
  });

  describe('DatabaseCorruptionError', () => {
    it('should have correct defaults', () => {
      const error = new DatabaseCorruptionError();

      expect(error.code).toBe('DB_CORRUPTION');
      expect(error.canRestore).toBe(true);
      expect(error.recoverable).toBe(true);
    });

    it('should accept custom message', () => {
      const error = new DatabaseCorruptionError('Custom message', false);

      expect(error.message).toBe('Custom message');
      expect(error.canRestore).toBe(false);
    });
  });

  describe('KeyDecryptionError', () => {
    it('should have correct defaults', () => {
      const error = new KeyDecryptionError();

      expect(error.code).toBe('KEY_DECRYPT_FAILED');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('QuotaExceededError', () => {
    it('should track quota info', () => {
      const error = new QuotaExceededError('Full', 1000, 900);

      expect(error.code).toBe('QUOTA_EXCEEDED');
      expect(error.usedBytes).toBe(1000);
      expect(error.totalBytes).toBe(900);
    });
  });

  describe('MigrationError', () => {
    it('should track version info', () => {
      const error = new MigrationError('Failed', 1, 2);

      expect(error.fromVersion).toBe(1);
      expect(error.toVersion).toBe(2);
      expect(error.recoverable).toBe(false);
    });
  });

  describe('SyncError', () => {
    it('should track sync type', () => {
      const error = new SyncError('Connection failed', 'connection');

      expect(error.syncType).toBe('connection');
      expect(error.recoverable).toBe(true);
    });

    it('should include details', () => {
      const error = new SyncError('Conflict', 'conflict', {
        table: 'transactions',
        rowId: 'tx-1',
      });

      expect(error.details?.table).toBe('transactions');
    });
  });

  describe('createSyncErrorLog', () => {
    it('should create log entry', () => {
      const log = createSyncErrorLog('PARSE_ERROR', 'Invalid JSON', {
        table: 'transactions',
        rowId: 'tx-1',
        details: { originalData: '...' },
      });

      expect(log.id).toBeDefined();
      expect(log.timestamp).toBeTypeOf('number');
      expect(log.errorType).toBe('PARSE_ERROR');
      expect(log.message).toBe('Invalid JSON');
      expect(log.table).toBe('transactions');
      expect(log.rowId).toBe('tx-1');
      expect(log.resolved).toBe(false);
    });

    it('should work without options', () => {
      const log = createSyncErrorLog('GENERIC', 'Error');

      expect(log.table).toBeUndefined();
      expect(log.rowId).toBeUndefined();
      expect(log.details).toBeUndefined();
    });
  });

  describe('isRecoverableError', () => {
    it('should return true for recoverable errors', () => {
      expect(isRecoverableError(new DatabaseCorruptionError())).toBe(true);
      expect(isRecoverableError(new KeyDecryptionError())).toBe(true);
      expect(isRecoverableError(new QuotaExceededError())).toBe(true);
    });

    it('should return false for non-recoverable errors', () => {
      expect(isRecoverableError(new MigrationError('fail', 1, 2))).toBe(false);
    });

    it('should return false for generic errors', () => {
      expect(isRecoverableError(new Error('generic'))).toBe(false);
    });

    it('should return false for non-errors', () => {
      expect(isRecoverableError('string')).toBe(false);
      expect(isRecoverableError(null)).toBe(false);
    });
  });

  describe('formatErrorForUser', () => {
    it('should format DatabaseCorruptionError', () => {
      const formatted = formatErrorForUser(new DatabaseCorruptionError());

      expect(formatted.title).toBe('Database Error');
      expect(formatted.message).toContain('corrupted');
      expect(formatted.action).toContain('backup');
    });

    it('should format KeyDecryptionError', () => {
      const formatted = formatErrorForUser(new KeyDecryptionError());

      expect(formatted.title).toBe('Unlock Failed');
      expect(formatted.action).toContain('password');
    });

    it('should format QuotaExceededError', () => {
      const formatted = formatErrorForUser(new QuotaExceededError());

      expect(formatted.title).toBe('Storage Full');
      expect(formatted.action).toContain('export');
    });

    it('should format generic Error', () => {
      const formatted = formatErrorForUser(new Error('Something broke'));

      expect(formatted.title).toBe('Error');
      expect(formatted.message).toBe('Something broke');
    });

    it('should handle unknown types', () => {
      const formatted = formatErrorForUser('just a string');

      expect(formatted.title).toBe('Unknown Error');
    });
  });
});
