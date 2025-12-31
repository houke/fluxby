/**
 * Backup & Restore Utilities
 * Handles database backup, restore, and data export/import
 */

import type { Database } from './database.js';

export interface BackupMetadata {
  version: number;
  createdAt: number;
  deviceId: string;
  encrypted: boolean;
  tables: string[];
  rowCounts: Record<string, number>;
}

export interface BackupFile {
  metadata: BackupMetadata;
  data: Uint8Array;
}

/**
 * Create a backup of the database
 */
export async function createBackup(
  db: Database,
  deviceId: string,
  schemaVersion: number
): Promise<BackupFile> {
  // Export database
  const data = await db.export();

  // Get table info
  const tables = [
    'accounts',
    'categories',
    'transactions',
    'budgets',
    'category_rules',
    'imports',
    'address_book',
    'sync_error_log',
  ];

  const rowCounts: Record<string, number> = {};
  for (const table of tables) {
    try {
      const result = db.queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${table}`
      );
      rowCounts[table] = result?.count ?? 0;
    } catch {
      rowCounts[table] = 0;
    }
  }

  const metadata: BackupMetadata = {
    version: schemaVersion,
    createdAt: Date.now(),
    deviceId,
    encrypted: true,
    tables,
    rowCounts,
  };

  return { metadata, data };
}

/**
 * Restore database from backup
 */
export async function restoreBackup(
  db: Database,
  backup: BackupFile,
  currentSchemaVersion: number
): Promise<{ success: boolean; message: string }> {
  // Validate backup version
  if (backup.metadata.version > currentSchemaVersion) {
    return {
      success: false,
      message: `Backup version ${backup.metadata.version} is newer than current version ${currentSchemaVersion}. Please update the app first.`,
    };
  }

  try {
    // Import the backup data
    await db.import(backup.data);

    // Run migrations if backup is from older version
    if (backup.metadata.version < currentSchemaVersion) {
      await db.migrate();
    }

    return {
      success: true,
      message: `Restored backup from ${new Date(backup.metadata.createdAt).toLocaleString()}`,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to restore backup',
    };
  }
}

/**
 * Serialize backup to file format
 */
export function serializeBackup(backup: BackupFile): Uint8Array {
  const metadataJson = JSON.stringify(backup.metadata);
  const metadataBytes = new TextEncoder().encode(metadataJson);

  // Format: [4 bytes metadata length][metadata][data]
  const result = new Uint8Array(4 + metadataBytes.length + backup.data.length);

  // Write metadata length (big endian)
  const view = new DataView(result.buffer);
  view.setUint32(0, metadataBytes.length, false);

  // Write metadata
  result.set(metadataBytes, 4);

  // Write data
  result.set(backup.data, 4 + metadataBytes.length);

  return result;
}

/**
 * Deserialize backup from file format
 */
export function deserializeBackup(bytes: Uint8Array): BackupFile | null {
  try {
    if (bytes.length < 4) {
      return null;
    }

    // Read metadata length
    const view = new DataView(bytes.buffer, bytes.byteOffset);
    const metadataLength = view.getUint32(0, false);

    if (bytes.length < 4 + metadataLength) {
      return null;
    }

    // Read metadata
    const metadataBytes = bytes.slice(4, 4 + metadataLength);
    const metadataJson = new TextDecoder().decode(metadataBytes);
    const metadata = JSON.parse(metadataJson) as BackupMetadata;

    // Read data
    const data = bytes.slice(4 + metadataLength);

    return { metadata, data };
  } catch {
    return null;
  }
}

/**
 * Get suggested backup filename
 */
export function getBackupFilename(): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  return `fluxby-backup-${dateStr}.fluxby`;
}

/**
 * Export data as JSON (for migration/debugging)
 */
export function exportAsJSON(
  db: Database
): Record<string, Record<string, unknown>[]> {
  const tables = [
    'profiles',
    'accounts',
    'categories',
    'transactions',
    'budgets',
    'category_rules',
    'address_book',
  ];

  const result: Record<string, Record<string, unknown>[]> = {};

  for (const table of tables) {
    try {
      result[table] = db.query(`SELECT * FROM ${table} WHERE is_deleted = 0`);
    } catch {
      result[table] = [];
    }
  }

  return result;
}

/**
 * Calculate backup size estimate
 */
export function estimateBackupSize(rowCounts: Record<string, number>): {
  bytes: number;
  formatted: string;
} {
  // Rough estimates per row type
  const bytesPerRow: Record<string, number> = {
    accounts: 200,
    categories: 150,
    transactions: 300,
    budgets: 250,
    category_rules: 200,
    imports: 500,
    address_book: 200,
  };

  let totalBytes = 0;
  for (const [table, count] of Object.entries(rowCounts)) {
    totalBytes += (bytesPerRow[table] ?? 200) * count;
  }

  // Add overhead for metadata and encryption
  totalBytes = Math.ceil(totalBytes * 1.1);

  const formatted = formatBytes(totalBytes);
  return { bytes: totalBytes, formatted };
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
