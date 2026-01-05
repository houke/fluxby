/**
 * Sync Service
 * Handles database synchronization logic with Last-Write-Wins conflict resolution
 */

import type { SyncChange, SyncableRow } from './sync.js';
import type { SyncManifestEntry } from './sync-protocol.js';
import { getSyncLogger } from './sync-logger.js';

/**
 * Tables that should be synced between devices
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
 * Result of applying sync changes
 */
export interface ApplySyncResult {
  applied: number;
  skipped: number;
  conflicts: Array<{
    table: string;
    rowId: string;
    localUpdatedAt: number;
    remoteUpdatedAt: number;
    resolution: 'local' | 'remote';
  }>;
  errors: Array<{
    table: string;
    rowId: string;
    error: string;
  }>;
}

/**
 * Row manifest for diffing
 */
export interface RowManifest {
  id: string;
  updated_at: number;
  is_deleted: boolean;
}

/**
 * Interface for database operations needed by sync
 */
export interface SyncDatabaseAdapter {
  /** Get all rows from a table with their sync metadata */
  getTableManifest(
    table: string,
    sinceTimestamp?: number
  ): Promise<RowManifest[]>;

  /** Get specific rows by ID */
  getRows<T extends SyncableRow>(table: string, rowIds: string[]): Promise<T[]>;

  /** Upsert a row (insert or update based on ID) */
  upsertRow<T extends SyncableRow>(table: string, row: T): Promise<void>;

  /** Execute multiple operations in a transaction */
  transaction<T>(fn: () => Promise<T>): Promise<T>;

  /** Get the device ID */
  getDeviceId(): string;
}

/**
 * SyncService - Manages database synchronization
 */
export class SyncService {
  private logger = getSyncLogger();

  constructor(private adapter: SyncDatabaseAdapter) {}

  /**
   * Build a manifest of all syncable data for diffing
   */
  async buildManifest(sinceTimestamp = 0): Promise<SyncManifestEntry[]> {
    const manifest: SyncManifestEntry[] = [];

    for (const table of SYNCABLE_TABLES) {
      try {
        const rows = await this.adapter.getTableManifest(table, sinceTimestamp);
        for (const row of rows) {
          manifest.push({
            table,
            rowId: row.id,
            updatedAt: row.updated_at,
            isDeleted: row.is_deleted,
          });
        }
      } catch (error) {
        this.logger.error(
          'sync:error',
          `Failed to get manifest for ${table}: ${error}`
        );
      }
    }

    this.logger.debug(
      'sync:request',
      `Built manifest with ${manifest.length} entries since ${sinceTimestamp}`
    );

    return manifest;
  }

  /**
   * Compare local and remote manifests to find what needs to be fetched
   * Returns entries where remote is newer than local
   */
  diffManifests(
    localManifest: SyncManifestEntry[],
    remoteManifest: SyncManifestEntry[]
  ): SyncManifestEntry[] {
    const localMap = new Map(
      localManifest.map((e) => [`${e.table}:${e.rowId}`, e])
    );
    const toFetch: SyncManifestEntry[] = [];

    for (const remote of remoteManifest) {
      const key = `${remote.table}:${remote.rowId}`;
      const local = localMap.get(key);

      if (!local) {
        // New row from remote
        toFetch.push(remote);
      } else if (remote.updatedAt > local.updatedAt) {
        // Remote is newer
        toFetch.push(remote);
      }
      // If local is newer or equal, skip (local wins)
    }

    this.logger.debug(
      'sync:request',
      `Diff: ${toFetch.length} entries to fetch from remote`
    );

    return toFetch;
  }

  /**
   * Get changes to send to a peer since a timestamp
   */
  async getChanges(sinceTimestamp = 0): Promise<SyncChange<SyncableRow>[]> {
    const changes: SyncChange<SyncableRow>[] = [];

    for (const table of SYNCABLE_TABLES) {
      try {
        const manifest = await this.adapter.getTableManifest(
          table,
          sinceTimestamp
        );
        if (manifest.length > 0) {
          const rowIds = manifest.map((r) => r.id);
          const rows = await this.adapter.getRows<SyncableRow>(table, rowIds);
          for (const row of rows) {
            changes.push({ table, row });
          }
        }
      } catch (error) {
        this.logger.error(
          'sync:error',
          `Failed to get changes for ${table}: ${error}`
        );
      }
    }

    this.logger.info(
      'sync:response',
      `Prepared ${changes.length} changes since ${sinceTimestamp}`
    );

    return changes;
  }

  /**
   * Apply sync changes using Last-Write-Wins strategy
   */
  async applyChanges(
    changes: SyncChange<SyncableRow>[]
  ): Promise<ApplySyncResult> {
    const result: ApplySyncResult = {
      applied: 0,
      skipped: 0,
      conflicts: [],
      errors: [],
    };

    if (changes.length === 0) {
      return result;
    }

    this.logger.info('sync:start', `Applying ${changes.length} changes`);

    // Group changes by table for efficient processing
    const changesByTable = new Map<string, SyncChange<SyncableRow>[]>();
    for (const change of changes) {
      if (!changesByTable.has(change.table)) {
        changesByTable.set(change.table, []);
      }
      const tableChanges = changesByTable.get(change.table);
      if (tableChanges) {
        tableChanges.push(change);
      }
    }

    // Apply changes within a transaction for consistency
    await this.adapter.transaction(async () => {
      for (const [table, tableChanges] of changesByTable) {
        // Get current local state for these rows
        const rowIds = tableChanges.map((c) => c.row.id);
        let localRows: SyncableRow[];

        try {
          localRows = await this.adapter.getRows<SyncableRow>(table, rowIds);
        } catch {
          // Table might not have all rows yet
          localRows = [];
        }

        const localMap = new Map(localRows.map((r) => [r.id, r]));

        for (const change of tableChanges) {
          const localRow = localMap.get(change.row.id);

          try {
            if (!localRow) {
              // New row - apply directly
              await this.adapter.upsertRow(table, change.row);
              result.applied++;
            } else if (change.row.updated_at > localRow.updated_at) {
              // Remote is newer - apply
              await this.adapter.upsertRow(table, change.row);
              result.applied++;
              result.conflicts.push({
                table,
                rowId: change.row.id,
                localUpdatedAt: localRow.updated_at,
                remoteUpdatedAt: change.row.updated_at,
                resolution: 'remote',
              });
            } else if (change.row.updated_at < localRow.updated_at) {
              // Local is newer - skip
              result.skipped++;
              result.conflicts.push({
                table,
                rowId: change.row.id,
                localUpdatedAt: localRow.updated_at,
                remoteUpdatedAt: change.row.updated_at,
                resolution: 'local',
              });
            } else {
              // Same timestamp - use device_id as tiebreaker
              const localDeviceId = this.adapter.getDeviceId();
              if (change.row.device_id > localDeviceId) {
                await this.adapter.upsertRow(table, change.row);
                result.applied++;
              } else {
                result.skipped++;
              }
            }
          } catch (error) {
            result.errors.push({
              table,
              rowId: change.row.id,
              error: error instanceof Error ? error.message : String(error),
            });
            this.logger.error(
              'sync:error',
              `Failed to apply change to ${table}/${change.row.id}: ${error}`
            );
          }
        }
      }
    });

    this.logger.info(
      'sync:complete',
      `Applied ${result.applied}, skipped ${result.skipped}, errors ${result.errors.length}`
    );

    return result;
  }

  /**
   * Get rows that need to be sent to remote based on manifest comparison
   */
  async getRowsForManifest(
    entries: SyncManifestEntry[]
  ): Promise<SyncChange<SyncableRow>[]> {
    const changes: SyncChange<SyncableRow>[] = [];

    // Group by table
    const byTable = new Map<string, string[]>();
    for (const entry of entries) {
      if (!byTable.has(entry.table)) {
        byTable.set(entry.table, []);
      }
      const tableEntries = byTable.get(entry.table);
      if (tableEntries) {
        tableEntries.push(entry.rowId);
      }
    }

    // Fetch rows
    for (const [table, rowIds] of byTable) {
      try {
        const rows = await this.adapter.getRows<SyncableRow>(table, rowIds);
        for (const row of rows) {
          changes.push({ table, row });
        }
      } catch (error) {
        this.logger.error(
          'sync:error',
          `Failed to get rows for ${table}: ${error}`
        );
      }
    }

    return changes;
  }
}

/**
 * Create a sync service with the given database adapter
 */
export function createSyncService(adapter: SyncDatabaseAdapter): SyncService {
  return new SyncService(adapter);
}
