/**
 * Sync Logic
 * Last-Write-Wins conflict resolution for peer-to-peer sync
 */

export interface SyncableRow {
  id: string;
  updated_at: number;
  is_deleted: boolean;
  device_id: string;
}

export interface SyncChange<T extends SyncableRow = SyncableRow> {
  table: string;
  row: T;
}

export interface SyncResult {
  applied: number;
  skipped: number;
  conflicts: SyncConflict[];
}

export interface SyncConflict {
  table: string;
  rowId: string;
  localUpdatedAt: number;
  remoteUpdatedAt: number;
  resolution: 'local' | 'remote';
}

/**
 * Maximum clock drift allowed before warning (1 hour in ms)
 */
const MAX_CLOCK_DRIFT = 60 * 60 * 1000;

/**
 * Check for clock drift
 */
export function checkClockDrift(remoteTimestamp: number): {
  hasDrift: boolean;
  driftMs: number;
} {
  const now = Date.now();
  const drift = remoteTimestamp - now;

  return {
    hasDrift: drift > MAX_CLOCK_DRIFT,
    driftMs: drift,
  };
}

/**
 * Validate a sync change has the required fields
 */
export function isValidSyncChange(change: unknown): change is SyncChange {
  if (!change || typeof change !== 'object') return false;
  const c = change as Record<string, unknown>;
  if (typeof c.table !== 'string' || !c.table) return false;
  if (!c.row || typeof c.row !== 'object') return false;
  const row = c.row as Record<string, unknown>;
  if (typeof row.id !== 'string' || !row.id) return false;
  if (typeof row.updated_at !== 'number') return false;
  if (typeof row.is_deleted !== 'boolean') return false;
  if (typeof row.device_id !== 'string') return false;
  return true;
}

/**
 * Validate an array of sync changes
 */
export function validateSyncChanges(changes: unknown[]): {
  valid: SyncChange[];
  invalid: number;
} {
  const valid: SyncChange[] = [];
  let invalid = 0;
  for (const change of changes) {
    if (isValidSyncChange(change)) {
      valid.push(change);
    } else {
      invalid++;
    }
  }
  return { valid, invalid };
}

/**
 * Merge remote changes using Last-Write-Wins
 */
export function mergeChanges<T extends SyncableRow>(
  localRows: Map<string, T>,
  remoteChanges: SyncChange<T>[],
  localDeviceId: string
): SyncResult {
  const result: SyncResult = {
    applied: 0,
    skipped: 0,
    conflicts: [],
  };

  for (const change of remoteChanges) {
    const localRow = localRows.get(change.row.id);

    if (!localRow) {
      // New row from remote - apply it
      localRows.set(change.row.id, change.row);
      result.applied++;
      continue;
    }

    // Compare timestamps for LWW
    if (change.row.updated_at > localRow.updated_at) {
      // Remote wins
      localRows.set(change.row.id, change.row);
      result.applied++;
      result.conflicts.push({
        table: change.table,
        rowId: change.row.id,
        localUpdatedAt: localRow.updated_at,
        remoteUpdatedAt: change.row.updated_at,
        resolution: 'remote',
      });
    } else if (change.row.updated_at < localRow.updated_at) {
      // Local wins
      result.skipped++;
      result.conflicts.push({
        table: change.table,
        rowId: change.row.id,
        localUpdatedAt: localRow.updated_at,
        remoteUpdatedAt: change.row.updated_at,
        resolution: 'local',
      });
    } else {
      // Same timestamp - use device_id as tiebreaker
      if (change.row.device_id > localDeviceId) {
        localRows.set(change.row.id, change.row);
        result.applied++;
      } else {
        result.skipped++;
      }
    }
  }

  return result;
}

/**
 * Get changes since a given timestamp
 */
export function getChangesSince<T extends SyncableRow>(
  rows: Map<string, T>,
  sinceTimestamp: number,
  table: string
): SyncChange<T>[] {
  const changes: SyncChange<T>[] = [];

  for (const row of rows.values()) {
    if (row.updated_at > sinceTimestamp) {
      changes.push({ table, row });
    }
  }

  return changes;
}

/**
 * Create a new syncable row with metadata
 */
export function createSyncableRow<T extends object>(
  data: T,
  deviceId: string
): T & SyncableRow {
  return {
    ...data,
    id: crypto.randomUUID(),
    updated_at: Date.now(),
    is_deleted: false,
    device_id: deviceId,
  };
}

/**
 * Update a syncable row with new timestamp
 */
export function updateSyncableRow<T extends SyncableRow>(
  row: T,
  updates: Partial<T>,
  deviceId: string
): T {
  return {
    ...row,
    ...updates,
    updated_at: Date.now(),
    device_id: deviceId,
  };
}

/**
 * Soft-delete a syncable row
 */
export function deleteSyncableRow<T extends SyncableRow>(
  row: T,
  deviceId: string
): T {
  return {
    ...row,
    is_deleted: true,
    updated_at: Date.now(),
    device_id: deviceId,
  };
}
