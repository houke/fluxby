/**
 * wa-sqlite Database Implementation
 * Actual SQLite WASM implementation using @journeyapps/wa-sqlite
 *
 * Note: This file uses `any` types for wa-sqlite library interop where
 * TypeScript definitions are incomplete or unavailable.
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function */

import type {
  DatabaseConnection,
  PreparedStatement,
  DatabaseOptions,
  AsyncDatabaseConnection,
} from './types.js';
import { getSeedSQL } from './schema.js';
import { runMigrations, checkPendingMigrations } from './migrations/runner.js';
import { EncryptionVFS } from './encryption-vfs.js';
import { getDeviceId, isTauri } from './environment.js';
import { dbLog } from './logger.js';
import { isolateOPFSWriteBuffers } from './opfs-write-buffers.js';

// SQLite constants
const SQLITE_OK = 0;
const SQLITE_ROW = 100;
const SQLITE_DONE = 101;

// Module-level cache for VFS, SQLite module, and DB handle to prevent double initialization

let cachedModule: any = null;
let cachedSqlite3: SQLiteAPI | null = null;
let cachedDbHandle: number | null = null;
type ConnectionState = {
  usable: boolean;
  queue: { promise: Promise<unknown> };
  retiring?: boolean;
  retirement?: Promise<void>;
  cleanup?: Promise<void>;
  closed?: boolean;
};
let cachedConnectionState: ConnectionState | null = null;
let vfsRegistered = false;
let cachedVfsName: string | undefined;
let migrationCompleted = false; // Prevent double migrations in React StrictMode

// Counter to generate unique VFS names across reinitializations
// This prevents Asyncify state corruption when reusing VFS names after WASM module reload
let vfsCounter = 0;

// Singleton promise - set SYNCHRONOUSLY before any async work to prevent races
let globalInitPromise: Promise<Database> | null = null;
let globalDbInstance: Database | null = null;

// Debug logging uses the shared logger
const wasmLog = dbLog;

function isFatalWasmError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes('memory access out of bounds') ||
    message.includes('unreachable') ||
    message.includes('RuntimeError')
  );
}

function markDatabaseFatal(): void {
  try {
    const ls = (globalThis as any)?.localStorage as Storage | undefined;
    ls?.setItem('fluxby-db-fatal', 'true');
  } catch {
    // Ignore
  }
}

function resetSingletonState(): void {
  // Clear cached handles/modules so a subsequent reload/re-init can recover.
  cachedModule = null;
  cachedSqlite3 = null;
  cachedDbHandle = null;
  cachedConnectionState = null;
  vfsRegistered = false;
  cachedVfsName = undefined;
  migrationCompleted = false;
  globalInitPromise = null;
  globalDbInstance = null;
}

function resetHandleForReinit(): void {
  cachedDbHandle = null;
  cachedConnectionState = null;
  globalDbInstance = null;
  globalInitPromise = null;
  vfsRegistered = false;
  cachedVfsName = undefined;
  migrationCompleted = false;
  // Keep the WASM module and SQLite API so Asyncify remains stable.
}

// Dynamic import types (will be loaded at runtime)
// These match the actual wa-sqlite API from @journeyapps/wa-sqlite
type SQLiteAPI = {
  open_v2: (filename: string, flags?: number, vfs?: string) => Promise<number>;
  close: (db: number) => Promise<number>;
  exec: (
    db: number,
    sql: string,
    callback?: (row: unknown[], columns: string[]) => void
  ) => Promise<number>;
  statements: (
    db: number,
    sql: string,
    options?: { flags?: number; unscoped?: boolean }
  ) => AsyncIterable<number>;
  step: (stmt: number) => Promise<number>;
  reset: (stmt: number) => Promise<number>;
  finalize: (stmt: number) => Promise<number>;
  bind: (stmt: number, index: number, value: unknown) => number;
  bind_collection: (
    stmt: number,
    bindings: unknown[] | Record<string, unknown>
  ) => number;
  column: (stmt: number, index: number) => unknown;
  column_count: (stmt: number) => number;
  column_name: (stmt: number, index: number) => string;
  column_names: (stmt: number) => string[];
  row: (stmt: number) => unknown[];
  changes: (db: number) => number;
  last_insert_id: (db: number) => number;
  vfs_register: (vfs: unknown, makeDefault?: boolean) => number;
};

// Default timeout for database operations (60 seconds - increased for large databases)
const DEFAULT_OPERATION_TIMEOUT = 60000;

// Counter for tracking operations
let operationIdCounter = 0;
let transactionIdCounter = 0;

/**
 * SQLite Database class using @journeyapps/wa-sqlite
 */
export class Database implements DatabaseConnection, AsyncDatabaseConnection {
  private db: number | null = null;
  private sqlite3: SQLiteAPI | null = null;
  private options: DatabaseOptions;
  private _isOpen = false;
  // Mutex for serializing database operations
  private operationQueueState = {
    promise: Promise.resolve() as Promise<unknown>,
  };
  private get operationQueue(): Promise<unknown> {
    return this.operationQueueState.promise;
  }
  private set operationQueue(value: Promise<unknown>) {
    this.operationQueueState.promise = value;
  }
  private transactionDepth = 0;
  private operationTimedOut = false;
  private acceptsOperations = true;
  private connectionState: ConnectionState = {
    usable: true,
    queue: this.operationQueueState,
  };
  // Track pending operations for debugging
  private pendingOperations = new Map<
    number,
    { sql: string; startTime: number }
  >();

  constructor(options: DatabaseOptions) {
    this.options = options;
  }

  /**
   * Execute an operation with serialization to prevent concurrent access issues.
   * Includes timeout to prevent infinite hangs and debugging support.
   */
  private async withLock<T>(
    operation: () => Promise<T>,
    debugInfo?: string,
    timeoutWhileRunning = true,
    transactionControl = false
  ): Promise<T> {
    if (
      !transactionControl &&
      (!this.acceptsOperations ||
        !this.connectionState.usable ||
        (this.connectionState.retiring && this.transactionDepth === 0))
    ) {
      throw new Error('Database transaction connection is not open');
    }
    const opId = ++operationIdCounter;
    const startTime = Date.now();
    const info = debugInfo || 'unknown';
    let timedOut = false;
    const timeoutError = new Error(
      `Database operation timed out after ${DEFAULT_OPERATION_TIMEOUT}ms: ${info.substring(0, 100)}`
    );

    // Track this operation
    this.pendingOperations.set(opId, { sql: info, startTime });

    // Log if there are many pending operations (potential issue)
    if (this.pendingOperations.size > 10) {
      wasmLog(`WARNING: ${this.pendingOperations.size} pending DB operations`, {
        ops: Array.from(this.pendingOperations.entries()).map(([id, op]) => ({
          id,
          sql: op.sql.substring(0, 50),
          waitingMs: Date.now() - op.startTime,
        })),
      });
    }

    // Create a timeout promise that rejects after DEFAULT_OPERATION_TIMEOUT
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        timedOut = true;
        this.operationTimedOut = true;
        reject(timeoutError);
      }, DEFAULT_OPERATION_TIMEOUT);
    });

    // Wrap the operation with cleanup
    const wrappedOperation = async (): Promise<T> => {
      try {
        // An expired queued mutation must never execute after its caller has
        // already handled the timeout. Active work still owns the queue until
        // SQLite finishes, because racing a timeout cannot cancel Asyncify.
        if (timedOut) throw timeoutError;
        // Whole transactions retain the queue until all their scoped work and
        // rollback/commit finish. Only their waiting time has a deadline.
        if (!timeoutWhileRunning) clearTimeout(timeoutId);
        const result = await operation();
        return result;
      } finally {
        this.pendingOperations.delete(opId);
        const duration = Date.now() - startTime;
        // Log slow queries (over 1 second)
        if (duration > 1000) {
          wasmLog(`Slow query (${duration}ms): ${info.substring(0, 100)}`);
        }
      }
    };

    // Chain this operation to the end of the queue, race with timeout
    const operationPromise = this.operationQueue.then(
      wrappedOperation,
      wrappedOperation
    );

    // Update the queue to wait for this operation (ignore errors/timeouts for queue)
    // Only the actual operation settles this queue; a caller deadline never
    // releases a statement that is still running inside SQLite.
    this.operationQueue = operationPromise.catch(() => {});

    // Race the operation against the timeout
    try {
      return await Promise.race([operationPromise, timeoutPromise]);
    } catch (err) {
      // Clean up on error
      this.pendingOperations.delete(opId);
      throw err;
    } finally {
      // A completed query must not retain its closures until the deadline.
      // Bulk imports/restores can otherwise leave thousands of live timers.
      clearTimeout(timeoutId);
    }
  }

  /**
   * Reset all singletons and cached handles.
   * Useful when we need to force a full re-initialization (e.g. after encryption setup).
   * @param full - If true, also reset the WASM module to ensure clean VFS state
   */
  static resetSingletons(full = false): void {
    wasmLog('Resetting database singletons', { full });
    globalDbInstance = null;
    globalInitPromise = null;
    cachedDbHandle = null;
    cachedConnectionState = null;
    vfsRegistered = false;
    cachedVfsName = undefined;
    migrationCompleted = false;

    // When doing a full reset (e.g., encryption key change), also reset the WASM module
    // This ensures a clean VFS state without stale encryption references
    if (full) {
      wasmLog('Full reset: clearing WASM module cache');
      cachedModule = null;
      cachedSqlite3 = null;
    }
  }

  static async getSingleton(options: DatabaseOptions): Promise<Database> {
    // A key change may arrive while the previous connection still owns work.
    // Initialization waits for its native close instead of reviving that handle.
    if (cachedConnectionState?.retiring) {
      await cachedConnectionState.retirement;
    }
    // Fast path - already initialized
    if (globalDbInstance?.isOpen()) {
      wasmLog('Returning existing singleton');
      return globalDbInstance;
    }

    // If init is in progress, wait for it
    if (globalInitPromise) {
      wasmLog('Waiting for existing init...');
      try {
        const db = await globalInitPromise;
        if (db?.isOpen()) {
          return db;
        }
        wasmLog('Wait for init returned closed DB, restarting...');
      } catch (err) {
        wasmLog('Existing init failed, restarting...', err);
        // Fall through to restart
      }
      globalInitPromise = null;
    }

    // Start initialization - set promise SYNCHRONOUSLY before any await
    wasmLog('Starting singleton initialization');
    const db = new Database(options);

    globalInitPromise = (async () => {
      try {
        await db.doFullInitialize();
        globalDbInstance = db;
        return db;
      } catch (err) {
        wasmLog('Initialization failed:', err);

        // If we get "file is not a database" or "sqlite3_open_v2" error, try to recover by clearing IndexedDB
        const errorMessage = err instanceof Error ? err.message : String(err);
        // Capture OPFS state before clearing cachedVfsName below.
        // For OPFS environments, clearing IDB is a no-op (data lives in the OPFS file)
        // and reloading just recreates the loop indefinitely. Let the error propagate
        // so DatabaseContext can show an error screen instead.
        const wasUsingOPFS = cachedVfsName?.startsWith('opfs-') ?? false;
        if (
          !wasUsingOPFS &&
          (errorMessage.includes('file is not a database') ||
            errorMessage.includes('sqlite3_open_v2')) &&
          typeof indexedDB !== 'undefined'
        ) {
          wasmLog(
            'Attempting recovery by clearing corrupted IndexedDB data...'
          );
          try {
            // Clear all IndexedDB databases that might contain corrupted data
            const databases = await indexedDB.databases();
            for (const dbInfo of databases) {
              const name = dbInfo.name;
              if (
                name &&
                (name.includes('idb-fluxby') || name.includes('fluxby'))
              ) {
                wasmLog('Deleting IndexedDB:', name);
                await new Promise<void>((resolve, reject) => {
                  const req = indexedDB.deleteDatabase(name);
                  req.onsuccess = () => resolve();
                  req.onerror = () => reject(req.error);
                  req.onblocked = () => {
                    wasmLog('IndexedDB deletion blocked:', name);
                    resolve(); // Continue anyway
                  };
                });
              }
            }

            // Reset module state for clean retry
            cachedModule = null;
            cachedSqlite3 = null;
            cachedDbHandle = null;
            cachedConnectionState = null;
            cachedVfsName = undefined;
            vfsRegistered = false;
            migrationCompleted = false;

            wasmLog('IndexedDB cleared, reloading page to retry...');
            // Reload the page to get a fresh start
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          } catch (clearErr) {
            wasmLog('Failed to clear IndexedDB:', clearErr);
          }
        }

        globalInitPromise = null;
        globalDbInstance = null;
        throw err;
      }
    })();

    return globalInitPromise;
  }

  /**
   * Initialize the database connection (for backwards compatibility)
   */
  async initialize(): Promise<void> {
    if (
      !this.acceptsOperations ||
      !this.connectionState.usable ||
      this.connectionState.retiring
    ) {
      throw new Error('Database connection is not open');
    }
    // If already open, nothing to do
    if (this._isOpen) {
      return;
    }

    // If this instance is the global one being initialized, do the work
    // Otherwise, just copy state from the global instance
    if (globalDbInstance?.isOpen()) {
      this.sqlite3 = globalDbInstance.sqlite3;
      this.db = globalDbInstance.db;
      this.connectionState = globalDbInstance.connectionState;
      this.operationQueueState = this.connectionState.queue;
      this._isOpen = true;
      return;
    }

    // Do full initialization
    await this.doFullInitialize();
  }

  private async doFullInitialize(): Promise<void> {
    wasmLog('doFullInitialize starting');

    // If we already have a cached DB handle, reuse it
    if (cachedDbHandle !== null && cachedSqlite3) {
      if (cachedConnectionState && !cachedConnectionState.usable) {
        throw new Error(
          'Database connection could not be closed after rollback failed. Reload the app to continue.'
        );
      }
      wasmLog('Using cached DB handle:', cachedDbHandle);
      this.sqlite3 = cachedSqlite3;
      this.db = cachedDbHandle;
      this.connectionState = cachedConnectionState ?? this.connectionState;
      this.operationQueueState = this.connectionState.queue;
      this._isOpen = true;
      return;
    }

    wasmLog('Initializing storage adapter...');
    // Initialize storage adapter
    await this.options.adapter.initialize();
    wasmLog('Storage adapter initialized');

    // Use cached SQLite module if available (prevents double init)
    if (cachedModule) {
      wasmLog('Reusing cached SQLite module');
      // Always re-create the Factory because the VFS registration state is bound to the instance
      // If we reuse the instance, we might have issues with VFS registration
      const SQLite = await import('@journeyapps/wa-sqlite');
      this.sqlite3 = SQLite.Factory(cachedModule) as unknown as SQLiteAPI;
      cachedSqlite3 = this.sqlite3;
      wasmLog('SQLite Factory recreated from cached module');
    } else {
      wasmLog('Loading SQLite WASM module...');
      // Dynamically import @journeyapps/wa-sqlite
      const wasmModule =
        await import('@journeyapps/wa-sqlite/dist/wa-sqlite-async.mjs');
      wasmLog('WASM module imported');
      const SQLiteESMFactory = wasmModule.default;
      const SQLite = await import('@journeyapps/wa-sqlite');
      wasmLog('SQLite library imported');

      // Initialize SQLite module with proper error handling
      // The factory returns a Promise that resolves to the module
      wasmLog('Calling SQLiteESMFactory...');
      const factoryResult = SQLiteESMFactory();
      if (!factoryResult || typeof factoryResult.then !== 'function') {
        throw new Error(
          'SQLiteESMFactory did not return a Promise. The WASM module may not be loaded correctly.'
        );
      }
      wasmLog('Awaiting factory result...');
      cachedModule = await factoryResult;
      wasmLog('Factory result received, creating SQLite API...');
      this.sqlite3 = SQLite.Factory(cachedModule) as unknown as SQLiteAPI;
      cachedSqlite3 = this.sqlite3;
      wasmLog('SQLite WASM module loaded');
    }

    // Determine VFS based on environment
    const dbPath = this.options.dbPath || 'fluxby.db';

    // Register VFS only once (prevents hang on double init in StrictMode)
    if (!vfsRegistered) {
      wasmLog('Registering VFS...');

      // Handle migration if needed BEFORE registering wrappers
      const encryptionKey = (this.options.adapter as any).config?.encryptionKey;
      if (encryptionKey && (await this.options.adapter.exists())) {
        const rawData = await this.options.adapter.read();
        if (rawData && rawData.length >= 16) {
          const header = new TextDecoder().decode(rawData.subarray(0, 15));
          if (header === 'SQLite format 3') {
            wasmLog(
              'UNENCRYPTED database detected. Migrating to encrypted format...'
            );
            const encryptedData = await migrateToEncrypted(
              rawData,
              encryptionKey
            );
            await this.options.adapter.write(encryptedData);
            wasmLog('Migration complete.');
          }
        }
      }

      // IMPORTANT: Close the storage adapter before registering VFS
      // The VFS (OPFSAnyContextVFS) will manage file access internally,
      // and having multiple OPFS handles to the same file can cause conflicts
      if (typeof this.options.adapter.close === 'function') {
        wasmLog('Closing storage adapter to avoid OPFS conflicts');
        await this.options.adapter.close();
      }

      // Try to use OPFS VFS if available (browser with OPFS support)
      // Skip OPFS for Tauri - use IndexedDB instead for better compatibility
      // Skip OPFS in dev mode - the exclusive FileSystemSyncAccessHandle lock
      // is not reliably released between page refreshes in development, causing
      // "xFileControl unexpectedly returned a Promise" errors. IDB doesn't have
      // this problem and is used as the primary VFS in dev for a smooth DX.
      const isDevelopment =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1');
      const shouldUseOPFS =
        !isTauri() &&
        !isDevelopment &&
        typeof navigator !== 'undefined' &&
        'storage' in navigator &&
        'getDirectory' in navigator.storage;

      if (shouldUseOPFS) {
        try {
          // Import OPFS VFS for browser - use the Any Context VFS for broader compatibility

          const vfsModule: any = await import(
            // @ts-expect-error - wa-sqlite VFS modules don't have type declarations
            '@journeyapps/wa-sqlite/src/examples/OPFSAnyContextVFS.js'
          );

          // Ensure the module was loaded correctly
          if (!vfsModule?.OPFSAnyContextVFS?.create) {
            throw new Error('OPFSAnyContextVFS module not loaded correctly');
          }

          // Use unique VFS name to prevent Asyncify state corruption on reinit
          // This is critical - reusing VFS names after WASM module reload causes
          // "startAsync(...).then is not a function" errors
          const baseVfsName = `opfs-fluxby-base-${vfsCounter}`;
          vfsCounter++;

          // Ensure create returns a Promise
          const vfsCreateResult = vfsModule.OPFSAnyContextVFS.create(
            baseVfsName,
            cachedModule
          );

          // Handle both Promise and non-Promise returns defensively
          let vfs: any;
          if (vfsCreateResult && typeof vfsCreateResult.then === 'function') {
            vfs = await vfsCreateResult;
          } else if (vfsCreateResult) {
            // If it returned synchronously (shouldn't happen but handle it)
            wasmLog('Warning: OPFSAnyContextVFS.create returned synchronously');
            vfs = vfsCreateResult;
          } else {
            throw new Error('OPFSAnyContextVFS.create returned null/undefined');
          }

          isolateOPFSWriteBuffers(vfs);

          // Wrap with encryption VFS if key is provided (use already captured encryptionKey)
          if (encryptionKey) {
            wasmLog('Wrapping OPFS VFS with EncryptionVFS');
            const encVfsName = `opfs-fluxby-${vfsCounter++}`;
            const encVfs = new EncryptionVFS(
              encVfsName,
              cachedModule,
              vfs,
              encryptionKey
            );
            await encVfs.initialize();
            vfs = encVfs;
          }

          this.sqlite3.vfs_register(vfs, true);
          cachedVfsName = (vfs as any).name;
          vfsRegistered = true;
          wasmLog('VFS registered:', cachedVfsName);
        } catch (err) {
          // OPFS not available, fall back to IDBBatchAtomicVFS
          wasmLog('OPFS VFS not available, trying IndexedDB VFS', err);
          try {
            const vfsModule: any =
              await import('@journeyapps/wa-sqlite/src/examples/IDBBatchAtomicVFS.js');

            // Use unique VFS name to prevent Asyncify state corruption on reinit
            const idbBaseVfsName = `idb-fluxby-base-${vfsCounter}`;
            vfsCounter++;

            const vfs = await vfsModule.IDBBatchAtomicVFS.create(
              idbBaseVfsName,
              cachedModule
            );

            // NOTE: EncryptionVFS is intentionally NOT applied to IDB.
            // IDBBatchAtomicVFS + EncryptionVFS causes an Asyncify incompatibility
            // ("startAsync().then is not a function") because IDB async callbacks
            // interfere with wa-sqlite's WASM Asyncify state machine.
            // IDB is only used in Tauri (OS-level security applies) and dev mode.
            // OPFS (production web) uses EncryptionVFS correctly.

            this.sqlite3.vfs_register(vfs, true);
            cachedVfsName = (vfs as any).name;
            vfsRegistered = true;
            wasmLog('VFS registered:', cachedVfsName);
          } catch (idbErr) {
            wasmLog(
              'IndexedDB VFS not available, using in-memory storage',
              idbErr
            );
            vfsRegistered = true; // Mark as done even without VFS
          }
        }
      } else if (typeof indexedDB !== 'undefined') {
        // For Tauri or environments without OPFS, try IndexedDB VFS
        wasmLog('Using IndexedDB VFS (Tauri or no OPFS)');
        try {
          const vfsModule: any =
            await import('@journeyapps/wa-sqlite/src/examples/IDBBatchAtomicVFS.js');

          // Use unique VFS name to prevent Asyncify state corruption on reinit
          const idbBaseVfsName = `idb-fluxby-base-${vfsCounter}`;
          vfsCounter++;

          const vfs = await vfsModule.IDBBatchAtomicVFS.create(
            idbBaseVfsName,
            cachedModule
          );

          // NOTE: EncryptionVFS is intentionally NOT applied to IDB.
          // See the OPFS fallback comment above for the reason.

          this.sqlite3.vfs_register(vfs, true);
          cachedVfsName = (vfs as any).name;
          vfsRegistered = true;
          wasmLog('IndexedDB VFS registered:', cachedVfsName);
        } catch (idbErr) {
          wasmLog(
            'IndexedDB VFS not available, using in-memory storage',
            idbErr
          );
          vfsRegistered = true; // Mark as done even without VFS
        }
      } else {
        vfsRegistered = true; // No VFS needed for non-browser environments
      }
    }

    // Open database (only if not already opened)
    if (cachedDbHandle === null) {
      wasmLog('Opening database:', dbPath);
      this.db = await this.sqlite3.open_v2(dbPath, undefined, cachedVfsName);
      cachedDbHandle = this.db;
      cachedConnectionState = this.connectionState;
      wasmLog('Database opened, handle:', this.db);
    } else {
      wasmLog('Using cached DB handle:', cachedDbHandle);
      this.db = cachedDbHandle;
      this.connectionState = cachedConnectionState ?? this.connectionState;
      this.operationQueueState = this.connectionState.queue;
    }
    this._isOpen = true;

    if (cachedVfsName?.startsWith('opfs-')) {
      // The Any Context VFS closes its writable stream for reads, and opening
      // another writable copies the existing file. The default 2 MiB SQLite
      // cache spills dirty index pages during moderate import batches, causing
      // repeated read/write switches and whole-file copies as the database grows.
      // Give this connection an on-demand 32 MiB page-cache budget. Spilling and
      // durable journal/sync settings stay enabled for larger working sets.
      await this.execAsync('PRAGMA main.cache_size = -32768');
    }

    // Leave SQLite's journal and synchronous modes at their defaults.
    // With the encrypted async VFS, both PRAGMAs route through Asyncify and
    // older wa-sqlite builds can call a synchronous VFS callback as though it
    // returned a Promise ("startAsync(...).then is not a function").

    // Run migrations if autoMigrate is enabled
    if (this.options.autoMigrate !== false) {
      await this.migrate();
    }

    wasmLog('Initialization complete');
  }

  /**
   * Run schema migrations
   */
  async migrate(): Promise<void> {
    // Skip if migration already completed (React StrictMode double-init protection)
    if (migrationCompleted) {
      wasmLog('Migration already completed, skipping');
      return;
    }

    // Ensure database is open before attempting migration
    if (!this._isOpen || !this.db || !this.sqlite3) {
      throw new Error('Database not initialized');
    }

    wasmLog('Running migrations...');

    try {
      await runMigrations(this);
    } catch (err) {
      console.error('Migration failed:', err);
      // Determine if we should throw or continue?
      // For now throw, as inconsistent DB is bad.
      throw err;
    }

    // --- SEEDING ---
    // Seed default data (only categories with NULL profile_id)
    const deviceId = getDeviceId();
    wasmLog('Running seed SQL...');
    try {
      await this.execAsync(getSeedSQL(deviceId));
    } catch (err) {
      console.warn('Seeding failed (non-critical):', err);
    }

    wasmLog('Migration & Seeding completed');
    // Mark migration as completed
    migrationCompleted = true;
  }

  /**
   * Execute raw SQL (async version for migrations)
   */
  public async execAsync(sql: string): Promise<void> {
    return this.withLock(() => this.executeSql(sql), sql.substring(0, 100));
  }

  private async executeSql(sql: string): Promise<void> {
    this.ensureOpen();
    if (!this.sqlite3 || this.db === null) {
      throw new Error('Database not initialized');
    }

    // Skip empty SQL statements
    const trimmedSql = sql.trim();
    if (trimmedSql.length === 0) {
      return;
    }

    try {
      const result = await this.sqlite3.exec(this.db, trimmedSql);
      if (result !== SQLITE_OK) {
        throw new Error(`SQL execution failed with code ${result}`);
      }
    } catch (err) {
      if (isFatalWasmError(err)) {
        markDatabaseFatal();
        resetSingletonState();
        throw new Error(
          'Fatal database error (WASM). Reset your local data to continue.',
          { cause: err as Error }
        );
      }
      // Log the error with context but don't crash
      console.error('Error executing SQL:', trimmedSql.substring(0, 200), err);
      throw err;
    }
  }

  /**
   * Execute raw SQL (sync interface for compatibility)
   */
  exec(sql: string): void {
    // For sync interface, we queue the operation
    // This is a limitation - ideally use execAsync
    void this.execAsync(sql);
  }

  /**
   * Execute parameterized query and return all rows (async)
   */
  async queryAsync<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<T[]> {
    return this.queryRowsAsync<T>(sql, params);
  }

  private async queryRowsAsync<T>(
    sql: string,
    params?: unknown[],
    firstRowOnly = false
  ): Promise<T[]> {
    return this.withLock(
      async () => {
        this.ensureOpen();
        if (!this.sqlite3 || this.db === null) {
          throw new Error('Database not initialized');
        }

        const results: T[] = [];
        const hasParams = params && params.length > 0;

        // Use statements generator - it handles finalize automatically when iteration completes
        // IMPORTANT: Do NOT manually call finalize() - the generator does this on cleanup
        // and double-finalize causes WASM memory corruption ("table index out of bounds")
        try {
          for await (const stmt of this.sqlite3.statements(this.db, sql)) {
            // Bind parameters if we have any
            if (hasParams) {
              this.sqlite3.bind_collection(stmt, params);
            }

            // Fetch rows
            let stepResult = await this.sqlite3.step(stmt);
            let columns: string[] | undefined;
            while (stepResult === SQLITE_ROW) {
              // Columns are fixed for this statement, even for a large result.
              columns ??= this.sqlite3.column_names(stmt);
              const values = this.sqlite3.row(stmt);
              const row: Record<string, unknown> = {};

              columns.forEach((col, i) => {
                row[col] = values[i];
              });

              results.push(row as T);
              if (firstRowOnly) break;
              stepResult = await this.sqlite3.step(stmt);
            }

            // Reset statement before breaking - this clears bindings and step state
            // The generator will call finalize() when we break out of the loop
            await this.sqlite3.reset(stmt);

            // Only process the first statement
            break;
          }
        } catch (err) {
          if (isFatalWasmError(err)) {
            markDatabaseFatal();
            resetSingletonState();
            throw new Error(
              'Fatal database error (WASM). Reset your local data to continue.',
              { cause: err as Error }
            );
          }
          throw err;
        }
        return results;
      },
      sql.substring(0, 100)
    );
  }

  /**
   * Execute parameterized query and return all rows (sync interface)
   */
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): T[] {
    // Note: This is a sync wrapper - prefer queryAsync
    // This will block until the query completes
    let results: T[] = [];
    void this.queryAsync<T>(sql, params).then((r) => {
      results = r;
    });
    return results;
  }

  /**
   * Execute parameterized query and return first row (async)
   */
  async queryOneAsync<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<T | null> {
    const results = await this.queryRowsAsync<T>(sql, params, true);
    return results[0] ?? null;
  }

  /**
   * Execute parameterized query and return first row
   */
  queryOne<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): T | null {
    const results = this.query<T>(sql, params);
    return results[0] ?? null;
  }

  /**
   * Execute insert/update/delete (async)
   */
  async runAsync(
    sql: string,
    params?: unknown[]
  ): Promise<{ changes: number; lastInsertRowId: number }> {
    return this.withLock(
      async () => {
        this.ensureOpen();
        if (!this.sqlite3 || this.db === null) {
          throw new Error('Database not initialized');
        }

        if (params && params.length > 0) {
          // Use statements generator for parameterized queries
          // IMPORTANT: Do NOT manually call finalize() - the generator does this on cleanup
          // and double-finalize causes WASM memory corruption
          try {
            for await (const stmt of this.sqlite3.statements(this.db, sql)) {
              this.sqlite3.bind_collection(stmt, params);

              const stepResult = await this.sqlite3.step(stmt);
              if (stepResult !== SQLITE_DONE && stepResult !== SQLITE_ROW) {
                throw new Error(`SQL execution failed with code ${stepResult}`);
              }

              // Reset statement before breaking - this clears bindings and step state
              // The generator will call finalize() when we break out of the loop
              await this.sqlite3.reset(stmt);

              // Only process the first statement
              break;
            }
          } catch (err) {
            if (isFatalWasmError(err)) {
              markDatabaseFatal();
              resetSingletonState();
              throw new Error(
                'Fatal database error (WASM). Reset your local data to continue.',
                { cause: err as Error }
              );
            }
            throw err;
          }
        } else {
          try {
            await this.sqlite3.exec(this.db, sql);
          } catch (err) {
            if (isFatalWasmError(err)) {
              markDatabaseFatal();
              resetSingletonState();
              throw new Error(
                'Fatal database error (WASM). Reset your local data to continue.',
                { cause: err as Error }
              );
            }
            throw err;
          }
        }

        return {
          changes: this.sqlite3.changes(this.db),
          lastInsertRowId: this.sqlite3.last_insert_id(this.db),
        };
      },
      sql.substring(0, 100)
    );
  }

  /**
   * Execute insert/update/delete
   */
  run(
    sql: string,
    params?: unknown[]
  ): { changes: number; lastInsertRowId: number } {
    // Sync wrapper - prefer runAsync
    let result = { changes: 0, lastInsertRowId: 0 };
    void this.runAsync(sql, params).then((r) => {
      result = r;
    });
    return result;
  }

  /**
   * Prepare a statement
   */
  prepare(sql: string): PreparedStatement {
    this.ensureOpen();
    if (!this.sqlite3 || this.db === null) {
      throw new Error('Database not initialized');
    }
    // Create a wrapper for prepared statements
    return new WaSqlitePreparedStatement(this.sqlite3, this.db, sql);
  }

  /**
   * Own the connection until commit/rollback finishes. Callback operations use
   * a scoped queue on the same handle, so ordinary connection operations wait.
   * Nested scoped transactions use savepoints rather than a second BEGIN.
   */
  async transactionAsync<T>(
    fn: (connection: AsyncDatabaseConnection) => Promise<T>
  ): Promise<T> {
    this.ensureOpen();
    return this.withLock(
      async () => {
        this.ensureOpen();
        const MAX_RETRIES = 3;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          // Each retry gets a new scope. A retained scope from a failed attempt
          // must remain closed while the next callback owns the same handle.
          const scoped = new Database(this.options);
          scoped.db = this.db;
          scoped.sqlite3 = this.sqlite3;
          scoped._isOpen = true;
          scoped.transactionDepth = this.transactionDepth + 1;
          scoped.connectionState = this.connectionState;
          const control = (sql: string) =>
            scoped.withLock(() => scoped.executeSql(sql), sql, false, true);
          try {
            const savepoint =
              this.transactionDepth > 0
                ? `fluxby_transaction_${++transactionIdCounter}`
                : null;
            let begun = false;
            scoped.operationTimedOut = false;
            try {
              await control(
                savepoint ? `SAVEPOINT ${savepoint}` : 'BEGIN TRANSACTION'
              );
              begun = true;
              let result: T;
              try {
                result = await fn(scoped);
              } finally {
                // Stop accepting work before draining or committing. Already
                // queued work retains its lifetime until the queue settles.
                scoped.acceptsOperations = false;
              }
              // A caller timeout cannot stop an active Asyncify statement. Drain
              // actual work before deciding whether to commit or rollback.
              await scoped.operationQueue;
              if (scoped.operationTimedOut) {
                throw new Error(
                  'Database transaction contains a timed-out operation'
                );
              }
              await control(
                savepoint ? `RELEASE SAVEPOINT ${savepoint}` : 'COMMIT'
              );
              return result;
            } catch (error) {
              await scoped.operationQueue;
              if (begun) {
                try {
                  if (savepoint) {
                    await control(`ROLLBACK TO SAVEPOINT ${savepoint}`);
                    await control(`RELEASE SAVEPOINT ${savepoint}`);
                  } else {
                    await control('ROLLBACK');
                  }
                } catch (rollbackError) {
                  // The connection's transaction state is unknown. Reject future
                  // work instead of allowing unrelated writes into that state.
                  await this.invalidateConnection();
                  wasmLog('Rollback failed:', rollbackError);
                  throw error;
                }
              }
              const errorMessage =
                error instanceof Error ? error.message : String(error);
              const isStreamError =
                errorMessage.includes('closing writable stream') ||
                errorMessage.includes('disk I/O error') ||
                errorMessage.includes('cannot rollback');
              if (
                begun &&
                isStreamError &&
                attempt < MAX_RETRIES &&
                !scoped.operationTimedOut
              ) {
                wasmLog(
                  `OPFS stream error on attempt ${attempt}, retrying...`,
                  { error: errorMessage }
                );
                await new Promise((resolve) =>
                  setTimeout(resolve, 100 * attempt)
                );
                continue;
              }
              throw error;
            }
          } finally {
            scoped.acceptsOperations = false;
            scoped._isOpen = false;
          }
        }
        throw new Error('Database transaction did not complete');
      },
      'TRANSACTION',
      false
    );
  }

  private async invalidateConnection(): Promise<void> {
    // Every nested transaction and initialized wrapper shares this state, so
    // catching a failed savepoint rollback cannot revive the parent connection.
    const state = this.connectionState;
    state.usable = false;
    this._isOpen = false;
    if (!state.cleanup) {
      state.cleanup = (async () => {
        try {
          if (this.sqlite3 && this.db !== null) {
            const result = await this.sqlite3.close(this.db);
            if (result !== SQLITE_OK) {
              throw new Error(`Database close failed with code ${result}`);
            }
            state.closed = true;
            if (cachedDbHandle === this.db) {
              cachedDbHandle = null;
              cachedConnectionState = null;
              globalDbInstance = null;
              globalInitPromise = null;
              migrationCompleted = false;
            }
          }
        } catch (error) {
          // Keep an unusable cached handle marked as such; initialization must
          // reject it rather than opening another wrapper into its transaction.
          wasmLog('Failed to close connection after rollback failure:', error);
        }
      })();
    }
    await state.cleanup;
  }

  /**
   * Run operations in a transaction
   */
  transaction<T>(fn: () => T): T {
    this.ensureOpen();
    this.exec('BEGIN TRANSACTION');
    try {
      const result = fn();
      this.exec('COMMIT');
      return result;
    } catch (error) {
      this.exec('ROLLBACK');
      throw error;
    }
  }

  /**
   * Check if database is open
   */
  isOpen(): boolean {
    return this._isOpen && this.connectionState.usable;
  }

  /**
   * Close the database
   * Note: When using cached singleton, this is a no-op to prevent corruption
   */
  async close(): Promise<void> {
    // Don't close if using cached DB handle - it's a singleton
    if (this.db === cachedDbHandle && cachedDbHandle !== null) {
      // Just mark as closed locally, but keep the cached handle open
      this._isOpen = false;
      return;
    }

    if (this._isOpen && this.sqlite3 && this.db !== null) {
      await this.sqlite3.close(this.db);
      this.db = null;
      this._isOpen = false;
    }
  }

  /**
   * Force-close the database and release OPFS handles.
   * Only call this during cleanup (HMR, page unload) — not during normal operation.
   */
  static async forceClose(): Promise<void> {
    try {
      await Database.closeHandleForReinit();
    } catch {
      // Best-effort — ignore errors during cleanup
    }
    resetSingletonState();
  }

  /**
   * Close the SQLite database handle to release the file lock, but keep the
   * WASM module alive. Use this before a same-session re-initialization (e.g.
   * when encryption is set up after the DB was first opened without a key).
   * Unlike forceClose(), this does NOT reset cachedModule/cachedSqlite3 so the
   * Asyncify state remains stable across the reinit.
   */
  static async closeHandleForReinit(): Promise<void> {
    const state = cachedConnectionState;
    const sqlite3 = cachedSqlite3;
    const handle = cachedDbHandle;
    if (state && sqlite3 && handle !== null) {
      if (!state.retirement) {
        // Block new root work now, but let accepted statements and active
        // transaction callbacks finish on their existing queues before closing.
        state.retiring = true;
        state.retirement = (async () => {
          await state.queue.promise;
          state.usable = false;
          await state.cleanup;
          if (!state.closed) {
            const result = await sqlite3.close(handle);
            if (result !== SQLITE_OK) {
              throw new Error(`Database close failed with code ${result}`);
            }
            state.closed = true;
          }
          if (cachedConnectionState === state || cachedDbHandle === null) {
            resetHandleForReinit();
          }
        })();
      }
      await state.retirement;
      return;
    } else if (sqlite3 && handle !== null) {
      const result = await sqlite3.close(handle);
      if (result !== SQLITE_OK) {
        throw new Error(`Database close failed with code ${result}`);
      }
    }
    resetHandleForReinit();
  }

  /**
   * Ensure database is open
   */
  private ensureOpen(): void {
    if (!this._isOpen || !this.connectionState.usable) {
      throw new Error('Database is not open');
    }
  }

  /**
   * Get debug info about pending operations
   * Useful for debugging hung queries
   */
  getPendingOperationsInfo(): Array<{
    id: number;
    sql: string;
    waitingMs: number;
  }> {
    const now = Date.now();
    return Array.from(this.pendingOperations.entries()).map(([id, op]) => ({
      id,
      sql: op.sql,
      waitingMs: now - op.startTime,
    }));
  }

  /**
   * Check if there are pending migrations
   * Returns the count of pending migrations
   */
  async checkPendingMigrations(): Promise<number> {
    this.ensureOpen();
    if (!this.db || !this.sqlite3) {
      throw new Error('Database not initialized');
    }
    // The runner uses queryAsync, which already acquires the operation lock.
    // Holding that lock here would enqueue the query behind its own caller.
    return checkPendingMigrations(this);
  }

  /**
   * Export database as bytes (for backup/sync)
   * Note: This requires the serialize extension which may not be available in all VFS
   */
  async export(): Promise<Uint8Array> {
    this.ensureOpen();
    if (!this.sqlite3 || this.db === null) {
      throw new Error('Database not initialized');
    }

    // Export by executing a vacuum into memory and reading results
    // This is a workaround as serialize may not be available
    const rows: Uint8Array[] = [];
    await this.sqlite3.exec(
      this.db,
      "SELECT quote(data) FROM (SELECT writefile('.backup.db', zeroblob(0)) as data)",
      (row) => {
        if (row[0] instanceof Uint8Array) {
          rows.push(row[0]);
        }
      }
    );

    // Concatenate all data
    const totalLength = rows.reduce((acc, r) => acc + r.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const row of rows) {
      result.set(row, offset);
      offset += row.length;
    }
    return result;
  }

  /**
   * Import database from bytes (for restore/sync)
   */
  async import(data: Uint8Array): Promise<void> {
    this.ensureOpen();
    if (!this.sqlite3 || this.db === null) {
      throw new Error('Database not initialized');
    }
    // For import, we'd need to close and reopen with the new data
    // This is complex with OPFS/IDB VFS - for now just log
    console.warn('Database import not yet implemented for WASM VFS', data);
  }
}

/**
 * Prepared statement wrapper for wa-sqlite
 */
class WaSqlitePreparedStatement implements PreparedStatement {
  private sqlite3: SQLiteAPI;
  private db: number;
  private sql: string;
  private stmt: number | null = null;
  private preparePromise: Promise<void> | null = null;
  private boundParams: unknown[] = [];

  constructor(sqlite3: SQLiteAPI, db: number, sql: string) {
    this.sqlite3 = sqlite3;
    this.db = db;
    this.sql = sql;
  }

  private async ensurePrepared(): Promise<void> {
    if (this.preparePromise) {
      return this.preparePromise;
    }

    this.preparePromise = (async () => {
      // Use statements generator to get the prepared statement
      for await (const stmt of this.sqlite3.statements(this.db, this.sql, {
        unscoped: true,
      })) {
        this.stmt = stmt;
        break; // Only get first statement
      }
      if (this.stmt === null) {
        throw new Error('Failed to prepare statement');
      }
    })();

    return this.preparePromise;
  }

  bind(params: unknown[]): this {
    this.boundParams = params;
    return this;
  }

  run(): { changes: number; lastInsertRowId: number } {
    void this.ensurePrepared().then(async () => {
      if (this.stmt !== null) {
        if (this.boundParams.length > 0) {
          this.sqlite3.bind_collection(this.stmt, this.boundParams);
        }
        await this.sqlite3.step(this.stmt);
        await this.sqlite3.reset(this.stmt);
      }
    });
    return {
      changes: this.sqlite3.changes(this.db),
      lastInsertRowId: this.sqlite3.last_insert_id(this.db),
    };
  }

  get<T = Record<string, unknown>>(): T | null {
    let result: T | null = null;
    void this.ensurePrepared().then(async () => {
      if (this.stmt !== null) {
        if (this.boundParams.length > 0) {
          this.sqlite3.bind_collection(this.stmt, this.boundParams);
        }
        const stepResult = await this.sqlite3.step(this.stmt);
        if (stepResult === SQLITE_ROW) {
          const columns = this.sqlite3.column_names(this.stmt);
          const values = this.sqlite3.row(this.stmt);
          const row: Record<string, unknown> = {};
          columns.forEach((col, i) => {
            row[col] = values[i];
          });
          result = row as T;
        }
        await this.sqlite3.reset(this.stmt);
      }
    });
    return result;
  }

  all<T = Record<string, unknown>>(): T[] {
    const results: T[] = [];
    void this.ensurePrepared().then(async () => {
      if (this.stmt !== null) {
        if (this.boundParams.length > 0) {
          this.sqlite3.bind_collection(this.stmt, this.boundParams);
        }
        let stepResult = await this.sqlite3.step(this.stmt);
        while (stepResult === SQLITE_ROW) {
          const columns = this.sqlite3.column_names(this.stmt);
          const values = this.sqlite3.row(this.stmt);
          const row: Record<string, unknown> = {};
          columns.forEach((col, i) => {
            row[col] = values[i];
          });
          results.push(row as T);
          stepResult = await this.sqlite3.step(this.stmt);
        }
        await this.sqlite3.reset(this.stmt);
      }
    });
    return results;
  }

  finalize(): void {
    if (this.stmt !== null) {
      void this.sqlite3.finalize(this.stmt);
      this.stmt = null;
    }
  }
}

export type { DatabaseConnection, DatabaseOptions };

// ── OPFS handle cleanup ───────────────────────────────────────────────────────
// Release the OPFS access handle when the page/worker unloads or HMR replaces
// this module. Without this, stale handles prevent the next load from opening
// the database (causing "xFileControl unexpectedly returned a Promise").

if (typeof window !== 'undefined') {
  // Page close / navigation
  window.addEventListener('beforeunload', () => {
    // Unload cannot await asynchronous work. Attempt the same queued cleanup as
    // HMR without racing native close against an active Asyncify statement.
    // The browser may terminate the page before that best-effort drain finishes.
    void Database.forceClose();
  });
}

// Vite HMR: properly close the database before the module is replaced
// Attempt to release handles after queued SQLite work has finished. Vite's
// disposal callback does not guarantee that it awaits asynchronous cleanup.
if (typeof (import.meta as any).hot !== 'undefined') {
  (import.meta as any).hot.dispose(async () => {
    await Database.forceClose();
  });
}

/**
 * Migrate unencrypted database data to encrypted format
 */
async function migrateToEncrypted(
  rawData: Uint8Array,
  masterKeyRaw: Uint8Array
): Promise<Uint8Array> {
  const pageSize = 4096;
  const tailSize = 28;
  const blockSize = pageSize + tailSize;

  const key = await crypto.subtle.importKey(
    'raw' as any,
    masterKeyRaw as any,
    { name: 'AES-GCM', length: 256 } as any,
    false,
    ['encrypt']
  );

  const pageCount = Math.ceil(rawData.length / pageSize);
  const result = new Uint8Array(pageCount * blockSize);

  for (let i = 0; i < pageCount; i++) {
    const pageData = rawData.subarray(i * pageSize, (i + 1) * pageSize);
    const paddedPage = new Uint8Array(pageSize);
    paddedPage.set(pageData);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv } as any,
      key as any,
      paddedPage as any
    );

    const encryptedBytes = new Uint8Array(encrypted);
    const offset = i * blockSize;
    result.set(encryptedBytes.subarray(0, pageSize), offset); // Ciphertext
    result.set(iv, offset + pageSize); // IV
    result.set(
      encryptedBytes.subarray(pageSize, pageSize + 16),
      offset + pageSize + 12
    ); // Tag
  }

  return result;
}
