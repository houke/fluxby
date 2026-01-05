/**
 * Sync Database Adapter
 * Bridges the SyncService from @fluxby/core with the actual SQLite database
 */
import type { Database } from './wa-sqlite.js';

/**
 * Interface for sync database operations
 * This matches what SyncService expects from its adapter
 */
export interface SyncDatabaseAdapter {
  /** Execute a parameterized query and return rows */
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<T[]>;

  /** Execute insert/update/delete */
  run(sql: string, params?: unknown[]): Promise<{ changes: number }>;

  /** Run operations in a transaction */
  transaction<T>(fn: () => Promise<T>): Promise<T>;

  /** Get current profile ID for filtering data */
  getProfileId(): string;
}

/**
 * Row with sync metadata (common structure for all syncable tables)
 */
export interface SyncableRow {
  id: string;
  updated_at: number;
  is_deleted: number; // SQLite uses 0/1 for boolean
  device_id: string;
  profile_id?: string;
  [key: string]: unknown;
}

/**
 * Tables that support sync operations
 */
export const SYNCABLE_TABLES = [
  'accounts',
  'transactions',
  'categories',
  'budgets',
  'category_rules',
  'address_book',
] as const;

export type SyncableTable = (typeof SYNCABLE_TABLES)[number];

/**
 * Manifest entry for a single row
 */
export interface ManifestEntry {
  id: string;
  updated_at: number;
  is_deleted: boolean;
}

/**
 * Table manifest with all row metadata
 */
export interface TableManifest {
  table: SyncableTable;
  rows: ManifestEntry[];
}

/**
 * Full sync manifest for all tables
 */
export interface SyncManifest {
  device_id: string;
  profile_id: string;
  tables: TableManifest[];
  timestamp: number;
}

/**
 * Diff result indicating which rows need to be synced
 */
export interface ManifestDiff {
  /** Rows that exist locally but not on remote */
  toSend: { table: SyncableTable; ids: string[] }[];
  /** Rows that exist on remote but not locally, or remote is newer */
  toReceive: { table: SyncableTable; ids: string[] }[];
  /** Rows where local is newer than remote */
  localNewer: { table: SyncableTable; ids: string[] }[];
}

/**
 * Create a sync adapter from a Database instance
 */
export function createSyncAdapter(
  db: Database,
  profileId: string
): SyncDatabaseAdapter {
  return {
    async query<T = Record<string, unknown>>(
      sql: string,
      params?: unknown[]
    ): Promise<T[]> {
      return db.queryAsync<T>(sql, params);
    },

    async run(sql: string, params?: unknown[]): Promise<{ changes: number }> {
      const result = await db.runAsync(sql, params);
      return { changes: result.changes };
    },

    async transaction<T>(fn: () => Promise<T>): Promise<T> {
      return db.transactionAsync(fn);
    },

    getProfileId(): string {
      return profileId;
    },
  };
}

/**
 * Build a manifest of all syncable data for a profile
 */
export async function buildSyncManifest(
  adapter: SyncDatabaseAdapter,
  deviceId: string
): Promise<SyncManifest> {
  const profileId = adapter.getProfileId();
  const tables: TableManifest[] = [];

  for (const table of SYNCABLE_TABLES) {
    const rows = await adapter.query<SyncableRow>(
      `SELECT id, updated_at, is_deleted FROM ${table} WHERE profile_id = ?`,
      [profileId]
    );

    tables.push({
      table,
      rows: rows.map((row) => ({
        id: row.id,
        updated_at: row.updated_at,
        is_deleted: row.is_deleted === 1,
      })),
    });
  }

  return {
    device_id: deviceId,
    profile_id: profileId,
    tables,
    timestamp: Date.now(),
  };
}

/**
 * Compare two manifests and determine what needs to be synced
 * Uses Last-Write-Wins (LWW) strategy based on updated_at timestamp
 */
export function diffManifests(
  local: SyncManifest,
  remote: SyncManifest
): ManifestDiff {
  const toSend: { table: SyncableTable; ids: string[] }[] = [];
  const toReceive: { table: SyncableTable; ids: string[] }[] = [];
  const localNewer: { table: SyncableTable; ids: string[] }[] = [];

  for (const localTable of local.tables) {
    const remoteTable = remote.tables.find((t) => t.table === localTable.table);

    // Build lookup maps
    const localMap = new Map(localTable.rows.map((r) => [r.id, r]));
    const remoteMap = remoteTable
      ? new Map(remoteTable.rows.map((r) => [r.id, r]))
      : new Map<string, ManifestEntry>();

    const tableSend: string[] = [];
    const tableReceive: string[] = [];
    const tableLocalNewer: string[] = [];

    // Check local rows against remote
    for (const [id, localRow] of localMap) {
      const remoteRow = remoteMap.get(id);

      if (!remoteRow) {
        // Local has row that remote doesn't - send it
        tableSend.push(id);
      } else if (localRow.updated_at > remoteRow.updated_at) {
        // Local is newer - send it
        tableLocalNewer.push(id);
        tableSend.push(id);
      } else if (remoteRow.updated_at > localRow.updated_at) {
        // Remote is newer - receive it
        tableReceive.push(id);
      }
      // If timestamps are equal, no action needed
    }

    // Check for rows that only exist on remote
    for (const [id] of remoteMap) {
      if (!localMap.has(id)) {
        tableReceive.push(id);
      }
    }

    if (tableSend.length > 0) {
      toSend.push({ table: localTable.table, ids: tableSend });
    }
    if (tableReceive.length > 0) {
      toReceive.push({ table: localTable.table, ids: tableReceive });
    }
    if (tableLocalNewer.length > 0) {
      localNewer.push({ table: localTable.table, ids: tableLocalNewer });
    }
  }

  return { toSend, toReceive, localNewer };
}

/**
 * Get full row data for a list of IDs from a table
 */
export async function getRowsForSync(
  adapter: SyncDatabaseAdapter,
  table: SyncableTable,
  ids: string[]
): Promise<SyncableRow[]> {
  if (ids.length === 0) return [];

  const placeholders = ids.map(() => '?').join(', ');
  const profileId = adapter.getProfileId();

  const rows = await adapter.query<SyncableRow>(
    `SELECT * FROM ${table} WHERE id IN (${placeholders}) AND profile_id = ?`,
    [...ids, profileId]
  );

  return rows;
}

/**
 * Apply incoming sync data to the local database
 * Uses Last-Write-Wins - only applies rows that are newer than local
 */
export async function applySyncData(
  adapter: SyncDatabaseAdapter,
  table: SyncableTable,
  rows: SyncableRow[],
  localDeviceId: string
): Promise<{ applied: number; skipped: number }> {
  if (rows.length === 0) return { applied: 0, skipped: 0 };

  const profileId = adapter.getProfileId();
  let applied = 0;
  let skipped = 0;

  await adapter.transaction(async () => {
    for (const row of rows) {
      // Skip rows from our own device (shouldn't happen, but safety check)
      if (row.device_id === localDeviceId) {
        skipped++;
        continue;
      }

      // Check if row exists locally
      const existing = await adapter.query<SyncableRow>(
        `SELECT id, updated_at FROM ${table} WHERE id = ? AND profile_id = ?`,
        [row.id, profileId]
      );

      if (existing.length === 0) {
        // Row doesn't exist - insert it
        const columns = Object.keys(row);
        const values = Object.values(row);
        const placeholders = columns.map(() => '?').join(', ');

        await adapter.run(
          `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        );
        applied++;
      } else {
        // Row exists - only update if incoming is newer (LWW)
        const localUpdatedAt = existing[0].updated_at;
        if (row.updated_at > localUpdatedAt) {
          const columns = Object.keys(row).filter((k) => k !== 'id');
          const setClause = columns.map((c) => `${c} = ?`).join(', ');
          const values = columns.map((c) => row[c]);

          await adapter.run(
            `UPDATE ${table} SET ${setClause} WHERE id = ? AND profile_id = ?`,
            [...values, row.id, profileId]
          );
          applied++;
        } else {
          skipped++;
        }
      }
    }
  });

  return { applied, skipped };
}

/**
 * Mark rows as deleted for sync (soft delete)
 */
export async function markRowsDeleted(
  adapter: SyncDatabaseAdapter,
  table: SyncableTable,
  ids: string[],
  deviceId: string
): Promise<number> {
  if (ids.length === 0) return 0;

  const profileId = adapter.getProfileId();
  const now = Date.now();
  let totalChanges = 0;

  await adapter.transaction(async () => {
    for (const id of ids) {
      const result = await adapter.run(
        `UPDATE ${table} SET is_deleted = 1, updated_at = ?, device_id = ? WHERE id = ? AND profile_id = ?`,
        [now, deviceId, id, profileId]
      );
      totalChanges += result.changes;
    }
  });

  return totalChanges;
}

/**
 * Get all rows that have changed since a given timestamp
 */
export async function getChangesSince(
  adapter: SyncDatabaseAdapter,
  table: SyncableTable,
  sinceTimestamp: number
): Promise<SyncableRow[]> {
  const profileId = adapter.getProfileId();

  return adapter.query<SyncableRow>(
    `SELECT * FROM ${table} WHERE profile_id = ? AND updated_at > ?`,
    [profileId, sinceTimestamp]
  );
}

/**
 * Clean up soft-deleted rows older than a threshold
 * This should be called periodically to prevent database bloat
 */
export async function purgeDeletedRows(
  adapter: SyncDatabaseAdapter,
  olderThanMs: number = 30 * 24 * 60 * 60 * 1000 // 30 days default
): Promise<number> {
  const profileId = adapter.getProfileId();
  const threshold = Date.now() - olderThanMs;
  let totalPurged = 0;

  await adapter.transaction(async () => {
    for (const table of SYNCABLE_TABLES) {
      const result = await adapter.run(
        `DELETE FROM ${table} WHERE profile_id = ? AND is_deleted = 1 AND updated_at < ?`,
        [profileId, threshold]
      );
      totalPurged += result.changes;
    }
  });

  return totalPurged;
}
