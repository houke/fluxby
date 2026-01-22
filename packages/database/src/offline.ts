/**
 * Offline Mode Support
 * Handles connectivity detection, sync queue, and offline-first behavior
 */

export interface ConnectivityState {
  isOnline: boolean;
  lastOnline: number | null;
  lastSyncAttempt: number | null;
  lastSyncSuccess: number | null;
}

export interface SyncQueueItem {
  id: string;
  table: string;
  rowId: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

/**
 * Default connectivity state
 */
export function createInitialConnectivityState(): ConnectivityState {
  return {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastOnline: null,
    lastSyncAttempt: null,
    lastSyncSuccess: null,
  };
}

/**
 * Sync queue manager
 * Queues changes when offline and processes them when online
 */
export class SyncQueue {
  private queue: SyncQueueItem[] = [];
  private maxRetries = 3;
  private listeners: Set<(queue: SyncQueueItem[]) => void> = new Set();

  /**
   * Add an item to the sync queue
   */
  enqueue(
    table: string,
    rowId: string,
    operation: 'insert' | 'update' | 'delete',
    data: Record<string, unknown>
  ): void {
    // Check if there's already a pending operation for this row
    const existingIndex = this.queue.findIndex(
      (item) => item.table === table && item.rowId === rowId
    );

    if (existingIndex !== -1) {
      // Merge with existing operation
      const existing = this.queue[existingIndex];

      if (operation === 'delete') {
        // Delete supersedes everything
        if (existing.operation === 'insert') {
          // If we inserted then deleted, just remove from queue
          this.queue.splice(existingIndex, 1);
        } else {
          // Replace with delete
          this.queue[existingIndex] = {
            ...existing,
            operation: 'delete',
            data,
            timestamp: Date.now(),
          };
        }
      } else if (operation === 'update' && existing.operation !== 'insert') {
        // Update an existing update
        this.queue[existingIndex] = {
          ...existing,
          data: { ...existing.data, ...data },
          timestamp: Date.now(),
        };
      }
      // If insert + update, keep as insert with updated data
      else if (operation === 'update' && existing.operation === 'insert') {
        this.queue[existingIndex] = {
          ...existing,
          data: { ...existing.data, ...data },
          timestamp: Date.now(),
        };
      }
    } else {
      // Add new item
      this.queue.push({
        id: crypto.randomUUID(),
        table,
        rowId,
        operation,
        data,
        timestamp: Date.now(),
        retryCount: 0,
      });
    }

    this.notifyListeners();
  }

  /**
   * Get all items in the queue
   */
  getAll(): SyncQueueItem[] {
    return [...this.queue];
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Dequeue the next item for processing
   */
  dequeue(): SyncQueueItem | undefined {
    return this.queue.shift();
  }

  /**
   * Mark an item as failed and requeue if retries remain
   */
  requeueFailed(item: SyncQueueItem): boolean {
    if (item.retryCount >= this.maxRetries) {
      return false; // Max retries exceeded
    }

    this.queue.push({
      ...item,
      retryCount: item.retryCount + 1,
    });

    this.notifyListeners();
    return true;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
    this.notifyListeners();
  }

  /**
   * Subscribe to queue changes
   */
  subscribe(callback: (queue: SyncQueueItem[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of queue changes
   */
  private notifyListeners(): void {
    const queueCopy = this.getAll();
    this.listeners.forEach((callback) => callback(queueCopy));
  }

  /**
   * Serialize queue to JSON (for persistence)
   */
  toJSON(): string {
    return JSON.stringify(this.queue);
  }

  /**
   * Load queue from JSON
   */
  fromJSON(json: string): void {
    try {
      const data = JSON.parse(json) as SyncQueueItem[];
      this.queue = data;
      this.notifyListeners();
    } catch {
      // Invalid JSON, keep empty queue
      this.queue = [];
    }
  }
}

/**
 * IndexedDB storage key for sync queue
 */
const SYNC_QUEUE_DB_NAME = 'fluxby-sync-queue';
const SYNC_QUEUE_STORE_NAME = 'queue';
const SYNC_QUEUE_DB_VERSION = 1;

/**
 * Persistent sync queue using IndexedDB
 * Automatically persists changes and recovers on page reload
 */
export class PersistentSyncQueue extends SyncQueue {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private profileId: string;

  constructor(profileId: string) {
    super();
    this.profileId = profileId;
    this.initPromise = this.initDB();
  }

  /**
   * Initialize IndexedDB connection
   */
  private async initDB(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      console.warn('[PersistentSyncQueue] IndexedDB not available');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(
        `${SYNC_QUEUE_DB_NAME}-${this.profileId}`,
        SYNC_QUEUE_DB_VERSION
      );

      request.onerror = () => {
        console.error(
          '[PersistentSyncQueue] Failed to open IndexedDB:',
          request.error
        );
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        // Load existing queue from IndexedDB
        void this.loadFromDB().then(resolve);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE_NAME)) {
          db.createObjectStore(SYNC_QUEUE_STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Wait for DB initialization
   */
  async ready(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  /**
   * Load queue from IndexedDB
   */
  private async loadFromDB(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        SYNC_QUEUE_STORE_NAME,
        'readonly'
      );
      const store = transaction.objectStore(SYNC_QUEUE_STORE_NAME);
      const request = store.getAll();

      request.onerror = () => {
        console.error(
          '[PersistentSyncQueue] Failed to load from IndexedDB:',
          request.error
        );
        reject(request.error);
      };

      request.onsuccess = () => {
        const items = request.result as SyncQueueItem[];
        // Sort by timestamp to maintain order
        items.sort((a, b) => a.timestamp - b.timestamp);
        super.fromJSON(JSON.stringify(items));
        resolve();
      };
    });
  }

  /**
   * Save an item to IndexedDB
   */
  private async saveItem(item: SyncQueueItem): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        SYNC_QUEUE_STORE_NAME,
        'readwrite'
      );
      const store = transaction.objectStore(SYNC_QUEUE_STORE_NAME);
      const request = store.put(item);

      request.onerror = () => {
        console.error(
          '[PersistentSyncQueue] Failed to save item:',
          request.error
        );
        reject(request.error);
      };

      request.onsuccess = () => resolve();
    });
  }

  /**
   * Remove an item from IndexedDB
   */
  private async removeItem(id: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        SYNC_QUEUE_STORE_NAME,
        'readwrite'
      );
      const store = transaction.objectStore(SYNC_QUEUE_STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => {
        console.error(
          '[PersistentSyncQueue] Failed to remove item:',
          request.error
        );
        reject(request.error);
      };

      request.onsuccess = () => resolve();
    });
  }

  /**
   * Clear all items from IndexedDB
   */
  private async clearDB(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        SYNC_QUEUE_STORE_NAME,
        'readwrite'
      );
      const store = transaction.objectStore(SYNC_QUEUE_STORE_NAME);
      const request = store.clear();

      request.onerror = () => {
        console.error(
          '[PersistentSyncQueue] Failed to clear IndexedDB:',
          request.error
        );
        reject(request.error);
      };

      request.onsuccess = () => resolve();
    });
  }

  /**
   * Override enqueue to persist to IndexedDB
   */
  override enqueue(
    table: string,
    rowId: string,
    operation: 'insert' | 'update' | 'delete',
    data: Record<string, unknown>
  ): void {
    // Get queue state before and after to detect merged items
    const sizeBefore = this.size();
    const itemsBefore = this.getAll().map((i) => i.id);

    super.enqueue(table, rowId, operation, data);

    const itemsAfter = this.getAll();
    const sizeAfter = itemsAfter.length;

    // If size decreased (insert + delete = remove), remove old item from DB
    if (sizeAfter < sizeBefore) {
      // Find removed items
      for (const oldId of itemsBefore) {
        if (!itemsAfter.find((i) => i.id === oldId)) {
          void this.removeItem(oldId);
        }
      }
    } else if (sizeAfter === sizeBefore) {
      // Item was merged/updated - find the updated item
      const changedItem = itemsAfter.find(
        (i) => i.table === table && i.rowId === rowId
      );
      if (changedItem) {
        void this.saveItem(changedItem);
      }
    } else {
      // New item added
      const newItem = itemsAfter.find((i) => !itemsBefore.includes(i.id));
      if (newItem) {
        void this.saveItem(newItem);
      }
    }
  }

  /**
   * Override dequeue to remove from IndexedDB
   */
  override dequeue(): SyncQueueItem | undefined {
    const item = super.dequeue();
    if (item) {
      void this.removeItem(item.id);
    }
    return item;
  }

  /**
   * Override clear to clear IndexedDB
   */
  override clear(): void {
    super.clear();
    void this.clearDB();
  }

  /**
   * Override requeueFailed to update in IndexedDB
   */
  override requeueFailed(item: SyncQueueItem): boolean {
    const requeued = super.requeueFailed(item);
    if (requeued) {
      // Save the updated item with incremented retry count
      const items = this.getAll();
      const updatedItem = items.find(
        (i) => i.rowId === item.rowId && i.table === item.table
      );
      if (updatedItem) {
        void this.saveItem(updatedItem);
      }
    }
    return requeued;
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Get pending changes count
   */
  getPendingCount(): number {
    return this.size();
  }

  /**
   * Check if there are pending changes
   */
  hasPendingChanges(): boolean {
    return !this.isEmpty();
  }
}

/**
 * Connectivity monitor
 * Tracks online/offline state and triggers sync attempts
 */
export class ConnectivityMonitor {
  private state: ConnectivityState;
  private listeners: Set<(state: ConnectivityState) => void> = new Set();
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private syncCallback: (() => Promise<void>) | null = null;

  constructor() {
    this.state = createInitialConnectivityState();
    this.setupListeners();
  }

  /**
   * Setup browser event listeners
   */
  private setupListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => this.setOnline(true));
    window.addEventListener('offline', () => this.setOnline(false));
  }

  /**
   * Update online state
   */
  private setOnline(isOnline: boolean): void {
    const wasOffline = !this.state.isOnline;
    this.state = {
      ...this.state,
      isOnline,
      lastOnline: isOnline ? Date.now() : this.state.lastOnline,
    };

    this.notifyListeners();

    // Trigger sync when coming back online
    if (isOnline && wasOffline && this.syncCallback) {
      void this.attemptSync();
    }
  }

  /**
   * Attempt to sync
   */
  private async attemptSync(): Promise<void> {
    if (!this.syncCallback) return;

    this.state = {
      ...this.state,
      lastSyncAttempt: Date.now(),
    };
    this.notifyListeners();

    try {
      await this.syncCallback();
      this.state = {
        ...this.state,
        lastSyncSuccess: Date.now(),
      };
      this.notifyListeners();
    } catch {
      // Sync failed, will retry on next poll or reconnect
    }
  }

  /**
   * Get current state
   */
  getState(): ConnectivityState {
    return { ...this.state };
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.state.isOnline;
  }

  /**
   * Set sync callback
   */
  setSyncCallback(callback: () => Promise<void>): void {
    this.syncCallback = callback;
  }

  /**
   * Start polling for sync (when online)
   */
  startPolling(intervalMs: number = 30000): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    this.pollInterval = setInterval(() => {
      if (this.state.isOnline && this.syncCallback) {
        void this.attemptSync();
      }
    }, intervalMs);
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: (state: ConnectivityState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify listeners
   */
  private notifyListeners(): void {
    const stateCopy = this.getState();
    this.listeners.forEach((callback) => callback(stateCopy));
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopPolling();
    this.listeners.clear();
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', () => this.setOnline(true));
      window.removeEventListener('offline', () => this.setOnline(false));
    }
  }
}

/**
 * Check storage quota (Web only)
 */
export async function checkStorageQuota(): Promise<{
  used: number;
  total: number;
  percentUsed: number;
} | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage ?? 0;
    const total = estimate.quota ?? 0;
    const percentUsed = total > 0 ? (used / total) * 100 : 0;

    return { used, total, percentUsed };
  } catch {
    return null;
  }
}

/**
 * Request persistent storage (Web only)
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
    return false;
  }

  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
