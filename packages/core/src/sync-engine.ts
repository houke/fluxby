/**
 * Sync Engine
 * Manages automatic synchronization between peers with debouncing and status tracking
 */

import type { SyncChange, SyncableRow } from './sync.js';

// ============================================================================
// Sync Status Types
// ============================================================================

export type SyncStatusState =
  | 'idle'
  | 'syncing'
  | 'offline'
  | 'error'
  | 'connecting';

export interface SyncStatus {
  state: SyncStatusState;
  lastSyncedAt: number | null;
  lastError: string | null;
  pendingChanges: number;
  connectedPeers: number;
  isSyncing: boolean;
}

export interface SyncEngineConfig {
  /** Debounce delay in ms (default: 500) */
  debounceDelay: number;
  /** Maximum batch size for sync operations */
  maxBatchSize: number;
  /** Auto-sync enabled (default: true) */
  autoSync: boolean;
  /** Sync on reconnect (default: true) */
  syncOnReconnect: boolean;
}

export const DEFAULT_SYNC_ENGINE_CONFIG: SyncEngineConfig = {
  debounceDelay: 500,
  maxBatchSize: 100,
  autoSync: true,
  syncOnReconnect: true,
};

// ============================================================================
// Sync Engine
// ============================================================================

export type SyncStatusListener = (status: SyncStatus) => void;
export type ChangeListener = (changes: SyncChange<SyncableRow>[]) => void;

/**
 * SyncEngine - Manages automatic synchronization with debouncing
 */
export class SyncEngine {
  private config: SyncEngineConfig;
  private status: SyncStatus;
  private statusListeners: Set<SyncStatusListener> = new Set();
  private pendingChanges: Map<string, SyncChange<SyncableRow>> = new Map();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pushHandler: ((changes: SyncChange<SyncableRow>[]) => void) | null =
    null;
  private forceSyncHandler: ((sinceTimestamp: number) => Promise<void>) | null =
    null;
  private isProcessing = false;

  constructor(config: Partial<SyncEngineConfig> = {}) {
    this.config = { ...DEFAULT_SYNC_ENGINE_CONFIG, ...config };
    this.status = {
      state: 'idle',
      lastSyncedAt: this.loadLastSyncedAt(),
      lastError: null,
      pendingChanges: 0,
      connectedPeers: 0,
      isSyncing: false,
    };
  }

  // ============================================================================
  // Status Management
  // ============================================================================

  /**
   * Subscribe to status changes
   */
  subscribeStatus(listener: SyncStatusListener): () => void {
    this.statusListeners.add(listener);
    // Immediately emit current status
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  /**
   * Update status and notify listeners
   */
  private updateStatus(updates: Partial<SyncStatus>): void {
    this.status = { ...this.status, ...updates };
    for (const listener of this.statusListeners) {
      try {
        listener(this.status);
      } catch (e) {
        console.error('Error in sync status listener:', e);
      }
    }
  }

  /**
   * Load last synced timestamp from storage
   */
  private loadLastSyncedAt(): number | null {
    if (typeof localStorage === 'undefined') return null;
    const stored = localStorage.getItem('fluxby.lastSyncedAt');
    return stored ? parseInt(stored, 10) : null;
  }

  /**
   * Save last synced timestamp to storage
   */
  private saveLastSyncedAt(timestamp: number): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fluxby.lastSyncedAt', String(timestamp));
    }
  }

  // ============================================================================
  // Handler Registration
  // ============================================================================

  /**
   * Set the handler for pushing changes to peers
   */
  setPushHandler(handler: (changes: SyncChange<SyncableRow>[]) => void): void {
    this.pushHandler = handler;
  }

  /**
   * Set the handler for force sync requests
   */
  setForceSyncHandler(
    handler: (sinceTimestamp: number) => Promise<void>
  ): void {
    this.forceSyncHandler = handler;
  }

  // ============================================================================
  // Change Tracking & Debouncing
  // ============================================================================

  /**
   * Queue a change for sync (with debouncing)
   */
  queueChange(change: SyncChange<SyncableRow>): void {
    if (!this.config.autoSync) return;

    // Use table:id as key to deduplicate
    const key = `${change.table}:${change.row.id}`;
    this.pendingChanges.set(key, change);

    this.updateStatus({ pendingChanges: this.pendingChanges.size });

    // Debounce the push
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.processPendingChanges();
    }, this.config.debounceDelay);
  }

  /**
   * Queue multiple changes at once
   */
  queueChanges(changes: SyncChange<SyncableRow>[]): void {
    for (const change of changes) {
      const key = `${change.table}:${change.row.id}`;
      this.pendingChanges.set(key, change);
    }

    this.updateStatus({ pendingChanges: this.pendingChanges.size });

    // Debounce the push
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.processPendingChanges();
    }, this.config.debounceDelay);
  }

  /**
   * Process and push all pending changes
   */
  private async processPendingChanges(): Promise<void> {
    if (this.isProcessing || this.pendingChanges.size === 0) return;
    if (this.status.connectedPeers === 0) {
      // No peers connected, keep changes queued
      return;
    }

    this.isProcessing = true;
    this.updateStatus({ state: 'syncing', isSyncing: true });

    try {
      const changes = Array.from(this.pendingChanges.values());
      this.pendingChanges.clear();
      this.updateStatus({ pendingChanges: 0 });

      // Push in batches
      for (let i = 0; i < changes.length; i += this.config.maxBatchSize) {
        const batch = changes.slice(i, i + this.config.maxBatchSize);
        if (this.pushHandler) {
          this.pushHandler(batch);
        }
      }

      const now = Date.now();
      this.saveLastSyncedAt(now);
      this.updateStatus({
        state: 'idle',
        isSyncing: false,
        lastSyncedAt: now,
        lastError: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.updateStatus({
        state: 'error',
        isSyncing: false,
        lastError: errorMessage,
      });
    } finally {
      this.isProcessing = false;
    }
  }

  // ============================================================================
  // Connection Management
  // ============================================================================

  /**
   * Update connected peer count
   */
  setConnectedPeers(count: number): void {
    const wasDisconnected = this.status.connectedPeers === 0;
    this.updateStatus({
      connectedPeers: count,
      state:
        count === 0 ? 'offline' : this.status.isSyncing ? 'syncing' : 'idle',
    });

    // Sync on reconnect
    if (wasDisconnected && count > 0 && this.config.syncOnReconnect) {
      this.forceSync();
    }
  }

  /**
   * Mark as connecting
   */
  setConnecting(): void {
    this.updateStatus({ state: 'connecting' });
  }

  /**
   * Mark as offline
   */
  setOffline(): void {
    this.updateStatus({
      state: 'offline',
      connectedPeers: 0,
    });
  }

  // ============================================================================
  // Manual Sync
  // ============================================================================

  /**
   * Force a full sync with all connected peers
   */
  async forceSync(): Promise<void> {
    if (this.status.isSyncing) return;
    if (this.status.connectedPeers === 0) {
      this.updateStatus({
        state: 'offline',
        lastError: 'No peers connected',
      });
      return;
    }

    this.updateStatus({ state: 'syncing', isSyncing: true });

    try {
      // First, push any pending changes
      if (this.pendingChanges.size > 0) {
        await this.processPendingChanges();
      }

      // Then, request full sync from peers
      const sinceTimestamp = this.status.lastSyncedAt ?? 0;
      if (this.forceSyncHandler) {
        await this.forceSyncHandler(sinceTimestamp);
      }

      const now = Date.now();
      this.saveLastSyncedAt(now);
      this.updateStatus({
        state: 'idle',
        isSyncing: false,
        lastSyncedAt: now,
        lastError: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.updateStatus({
        state: 'error',
        isSyncing: false,
        lastError: errorMessage,
      });
    }
  }

  // ============================================================================
  // Incoming Sync Handling
  // ============================================================================

  /**
   * Handle incoming sync changes (prevents infinite loops)
   * Returns true if changes should be applied, false if they should be ignored
   */
  shouldApplyIncomingChanges(changes: SyncChange<SyncableRow>[]): boolean {
    // Always apply incoming changes - the LWW logic in sync.ts handles conflicts
    // Just mark that we're syncing
    if (changes.length > 0) {
      this.updateStatus({ isSyncing: true });
    }
    return true;
  }

  /**
   * Mark incoming sync as complete
   */
  markIncomingSyncComplete(): void {
    const now = Date.now();
    this.saveLastSyncedAt(now);
    this.updateStatus({
      isSyncing: false,
      lastSyncedAt: now,
      state: this.status.connectedPeers > 0 ? 'idle' : 'offline',
    });
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.statusListeners.clear();
    this.pendingChanges.clear();
    this.pushHandler = null;
    this.forceSyncHandler = null;
  }
}

/**
 * Create a new SyncEngine instance
 */
export function createSyncEngine(
  config: Partial<SyncEngineConfig> = {}
): SyncEngine {
  return new SyncEngine(config);
}

// ============================================================================
// Relative Time Formatting
// ============================================================================

/**
 * Format a timestamp as relative time (e.g., "Just now", "5 min ago")
 */
export function formatRelativeTime(
  timestamp: number | null,
  locale: 'en' | 'nl' = 'en'
): string {
  if (timestamp === null) {
    return locale === 'nl' ? 'Nooit' : 'Never';
  }

  const now = Date.now();
  const diff = now - timestamp;

  // Less than 1 minute
  if (diff < 60 * 1000) {
    return locale === 'nl' ? 'Zojuist' : 'Just now';
  }

  // Less than 1 hour
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return locale === 'nl' ? `${minutes} min geleden` : `${minutes} min ago`;
  }

  // Less than 24 hours
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return locale === 'nl'
      ? `${hours} uur geleden`
      : `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  // Less than 7 days
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return locale === 'nl'
      ? `${days} dag${days > 1 ? 'en' : ''} geleden`
      : `${days} day${days > 1 ? 's' : ''} ago`;
  }

  // Older - show date
  return new Date(timestamp).toLocaleDateString(
    locale === 'nl' ? 'nl-NL' : 'en-US',
    {
      month: 'short',
      day: 'numeric',
    }
  );
}
