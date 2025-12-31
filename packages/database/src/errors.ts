/**
 * Database Error Handling
 * Custom error types and error recovery utilities for robust operation
 */

/**
 * Base error class for database operations
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable: boolean = false
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Database corruption error
 * Thrown when the database file cannot be read or is invalid
 */
export class DatabaseCorruptionError extends DatabaseError {
  constructor(
    message: string = 'Database file is corrupted or unreadable',
    public readonly canRestore: boolean = true
  ) {
    super(message, 'DB_CORRUPTION', true);
    this.name = 'DatabaseCorruptionError';
  }
}

/**
 * Key decryption error
 * Thrown when the wrapped key cannot be decrypted (wrong password)
 */
export class KeyDecryptionError extends DatabaseError {
  constructor(message: string = 'Invalid password or corrupted key data') {
    super(message, 'KEY_DECRYPT_FAILED', true);
    this.name = 'KeyDecryptionError';
  }
}

/**
 * Storage quota exceeded error
 * Thrown when OPFS or filesystem quota is exceeded
 */
export class QuotaExceededError extends DatabaseError {
  constructor(
    message: string = 'Storage quota exceeded',
    public readonly usedBytes?: number,
    public readonly totalBytes?: number
  ) {
    super(message, 'QUOTA_EXCEEDED', true);
    this.name = 'QuotaExceededError';
  }
}

/**
 * Schema migration error
 * Thrown when database migration fails
 */
export class MigrationError extends DatabaseError {
  constructor(
    message: string,
    public readonly fromVersion: number,
    public readonly toVersion: number
  ) {
    super(message, 'MIGRATION_FAILED', false);
    this.name = 'MigrationError';
  }
}

/**
 * Sync error
 * Thrown during peer-to-peer synchronization
 */
export class SyncError extends DatabaseError {
  constructor(
    message: string,
    public readonly syncType: 'connection' | 'conflict' | 'data',
    public readonly details?: Record<string, unknown>
  ) {
    super(message, 'SYNC_ERROR', true);
    this.name = 'SyncError';
  }
}

/**
 * Sync error log entry
 * Used for logging non-fatal sync issues
 */
export interface SyncErrorLogEntry {
  id: string;
  timestamp: number;
  errorType: string;
  table?: string;
  rowId?: string;
  message: string;
  details?: string;
  resolved: boolean;
}

/**
 * Create a sync error log entry
 */
export function createSyncErrorLog(
  errorType: string,
  message: string,
  options?: {
    table?: string;
    rowId?: string;
    details?: Record<string, unknown>;
  }
): SyncErrorLogEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    errorType,
    table: options?.table,
    rowId: options?.rowId,
    message,
    details: options?.details ? JSON.stringify(options.details) : undefined,
    resolved: false,
  };
}

/**
 * Check if an error is recoverable
 */
export function isRecoverableError(error: unknown): boolean {
  if (error instanceof DatabaseError) {
    return error.recoverable;
  }
  return false;
}

/**
 * Format error for user display
 */
export function formatErrorForUser(error: unknown): {
  title: string;
  message: string;
  action?: string;
} {
  if (error instanceof DatabaseCorruptionError) {
    return {
      title: 'Database Error',
      message: 'The database file appears to be corrupted or unreadable.',
      action: error.canRestore
        ? 'Please restore from a backup file.'
        : 'Please contact support.',
    };
  }

  if (error instanceof KeyDecryptionError) {
    return {
      title: 'Unlock Failed',
      message: 'Could not unlock with the provided password.',
      action: 'Please check your password and try again.',
    };
  }

  if (error instanceof QuotaExceededError) {
    return {
      title: 'Storage Full',
      message: 'Your device storage is full.',
      action: 'Please export your data and clean up old transactions.',
    };
  }

  if (error instanceof MigrationError) {
    return {
      title: 'Update Error',
      message: 'Could not update database to new version.',
      action: 'Please restore from a backup or contact support.',
    };
  }

  if (error instanceof SyncError) {
    return {
      title: 'Sync Error',
      message: 'Could not synchronize with other devices.',
      action: 'Please check your connection and try again.',
    };
  }

  if (error instanceof Error) {
    return {
      title: 'Error',
      message: error.message,
    };
  }

  return {
    title: 'Unknown Error',
    message: 'An unexpected error occurred.',
  };
}
