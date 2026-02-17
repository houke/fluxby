/**
 * Sync Engine Implementation
 *
 * Complete sync engine for local-first apps.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SyncConfig {
  serverUrl: string;
  batchSize: number;
  retryAttempts: number;
  retryDelayMs: number;
  syncIntervalMs: number;
}

export interface SyncableRecord {
  id: string;
  _syncVersion: number;
  _syncStatus: 'pending' | 'synced' | 'conflict';
  _deletedAt?: string;
  updatedAt: string;
}

export interface SyncChange {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  version: number;
  clientId: string;
  timestamp: number;
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: SyncConflict[];
  errors: string[];
}

export interface SyncConflict {
  id: string;
  table: string;
  localData: any;
  remoteData: any;
  baseData?: any;
}

export type ConflictResolver = (conflict: SyncConflict) => Promise<any>;

// ============================================================================
// SYNC ENGINE
// ============================================================================

export class SyncEngine {
  private config: SyncConfig;
  private clientId: string;
  private lastSyncToken: string | null = null;
  private syncInProgress = false;
  private pendingChanges: SyncChange[] = [];
  private conflictResolver: ConflictResolver;
  private listeners: Set<(result: SyncResult) => void> = new Set();

  constructor(
    config: SyncConfig,
    conflictResolver: ConflictResolver = defaultConflictResolver,
  ) {
    this.config = config;
    this.clientId = this.getOrCreateClientId();
    this.conflictResolver = conflictResolver;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Start automatic sync
   */
  startAutoSync(): void {
    this.sync();
    setInterval(() => this.sync(), this.config.syncIntervalMs);

    // Sync when coming back online
    window.addEventListener('online', () => this.sync());
  }

  /**
   * Manual sync trigger
   */
  async sync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return {
        pushed: 0,
        pulled: 0,
        conflicts: [],
        errors: ['Sync already in progress'],
      };
    }

    this.syncInProgress = true;
    const result: SyncResult = {
      pushed: 0,
      pulled: 0,
      conflicts: [],
      errors: [],
    };

    try {
      // Push local changes
      const pushResult = await this.pushChanges();
      result.pushed = pushResult.pushed;
      result.conflicts.push(...pushResult.conflicts);
      result.errors.push(...pushResult.errors);

      // Pull remote changes
      const pullResult = await this.pullChanges();
      result.pulled = pullResult.pulled;
      result.conflicts.push(...pullResult.conflicts);
      result.errors.push(...pullResult.errors);

      // Resolve conflicts
      for (const conflict of result.conflicts) {
        try {
          const resolved = await this.conflictResolver(conflict);
          await this.applyResolution(conflict, resolved);
        } catch (error) {
          result.errors.push(
            `Failed to resolve conflict for ${conflict.id}: ${error}`,
          );
        }
      }

      // Notify listeners
      this.notifyListeners(result);
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  /**
   * Record a local change
   */
  recordChange(
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data: any,
  ): void {
    this.pendingChanges.push({
      id: data.id,
      table,
      operation,
      data,
      version: Date.now(),
      clientId: this.clientId,
      timestamp: Date.now(),
    });
  }

  /**
   * Subscribe to sync events
   */
  onSync(callback: (result: SyncResult) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // ============================================================================
  // PUSH CHANGES
  // ============================================================================

  private async pushChanges(): Promise<Partial<SyncResult>> {
    const result: Partial<SyncResult> = {
      pushed: 0,
      conflicts: [],
      errors: [],
    };

    if (this.pendingChanges.length === 0) {
      return result;
    }

    const changes = [...this.pendingChanges];

    for (let i = 0; i < changes.length; i += this.config.batchSize) {
      const batch = changes.slice(i, i + this.config.batchSize);

      try {
        const response = await this.fetchWithRetry(
          `${this.config.serverUrl}/sync/push`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ changes: batch, clientId: this.clientId }),
          },
        );

        const { accepted, conflicts } = await response.json();

        result.pushed! += accepted.length;
        result.conflicts!.push(...conflicts);

        // Remove accepted changes from pending
        for (const change of accepted) {
          const index = this.pendingChanges.findIndex(
            (c) => c.id === change.id,
          );
          if (index !== -1) {
            this.pendingChanges.splice(index, 1);
          }
        }
      } catch (error) {
        result.errors!.push(`Push failed: ${error}`);
        break;
      }
    }

    return result;
  }

  // ============================================================================
  // PULL CHANGES
  // ============================================================================

  private async pullChanges(): Promise<Partial<SyncResult>> {
    const result: Partial<SyncResult> = {
      pulled: 0,
      conflicts: [],
      errors: [],
    };

    try {
      const url = new URL(`${this.config.serverUrl}/sync/pull`);
      if (this.lastSyncToken) {
        url.searchParams.set('since', this.lastSyncToken);
      }
      url.searchParams.set('clientId', this.clientId);

      const response = await this.fetchWithRetry(url.toString());
      const { changes, syncToken, conflicts } = await response.json();

      // Apply remote changes
      for (const change of changes) {
        await this.applyRemoteChange(change);
        result.pulled!++;
      }

      result.conflicts!.push(...conflicts);
      this.lastSyncToken = syncToken;
    } catch (error) {
      result.errors!.push(`Pull failed: ${error}`);
    }

    return result;
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private async applyRemoteChange(change: SyncChange): Promise<void> {
    // This would interact with your local database
    console.log('Applying remote change:', change);
    // await localDb.apply(change);
  }

  private async applyResolution(
    conflict: SyncConflict,
    resolved: any,
  ): Promise<void> {
    // Apply resolved data locally and mark for sync
    console.log('Applying resolution:', conflict.id, resolved);
    // await localDb.update(conflict.table, conflict.id, resolved);
  }

  private async fetchWithRetry(
    url: string,
    options?: RequestInit,
  ): Promise<Response> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.config.retryAttempts - 1) {
          await this.delay(this.config.retryDelayMs * Math.pow(2, attempt));
        }
      }
    }

    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getOrCreateClientId(): string {
    let clientId = localStorage.getItem('sync_client_id');
    if (!clientId) {
      clientId = crypto.randomUUID();
      localStorage.setItem('sync_client_id', clientId);
    }
    return clientId;
  }

  private notifyListeners(result: SyncResult): void {
    for (const listener of this.listeners) {
      try {
        listener(result);
      } catch (error) {
        console.error('Sync listener error:', error);
      }
    }
  }
}

// ============================================================================
// DEFAULT CONFLICT RESOLVER
// ============================================================================

async function defaultConflictResolver(conflict: SyncConflict): Promise<any> {
  // Default: Last-write-wins based on updatedAt
  const localTime = new Date(conflict.localData.updatedAt).getTime();
  const remoteTime = new Date(conflict.remoteData.updatedAt).getTime();

  return remoteTime > localTime ? conflict.remoteData : conflict.localData;
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

export function createSyncEngine(): SyncEngine {
  const engine = new SyncEngine(
    {
      serverUrl: 'https://api.example.com',
      batchSize: 50,
      retryAttempts: 3,
      retryDelayMs: 1000,
      syncIntervalMs: 30000,
    },
    async (conflict) => {
      // Custom conflict resolution
      // Could show UI to user for manual resolution
      console.log('Conflict detected:', conflict);

      // For now, prefer remote
      return conflict.remoteData;
    },
  );

  engine.onSync((result) => {
    console.log(
      `Sync complete: ${result.pushed} pushed, ${result.pulled} pulled`,
    );
    if (result.conflicts.length > 0) {
      console.warn(`${result.conflicts.length} conflicts resolved`);
    }
    if (result.errors.length > 0) {
      console.error('Sync errors:', result.errors);
    }
  });

  return engine;
}
