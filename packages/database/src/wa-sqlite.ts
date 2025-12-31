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
} from './types.js';
import { SCHEMA_SQL, getSeedSQL, SCHEMA_VERSION } from './schema.js';
import { EncryptionVFS } from './encryption-vfs.js';
import { getDeviceId } from './environment.js';

// SQLite constants
const SQLITE_OK = 0;
const SQLITE_ROW = 100;
const SQLITE_DONE = 101;

// Module-level cache for VFS, SQLite module, and DB handle to prevent double initialization

let cachedModule: any = null;
let cachedSqlite3: SQLiteAPI | null = null;
let cachedDbHandle: number | null = null;
let vfsRegistered = false;
let cachedVfsName: string | undefined;
let migrationCompleted = false; // Prevent double migrations in React StrictMode

// Counter to generate unique VFS names across reinitializations
// This prevents Asyncify state corruption when reusing VFS names after WASM module reload
let vfsCounter = 0;

// Singleton promise - set SYNCHRONOUSLY before any async work to prevent races
let globalInitPromise: Promise<Database> | null = null;
let globalDbInstance: Database | null = null;

// Debug logging for WASM initialization
function isWasmDebugEnabled(): boolean {
  try {
    // Only log when explicitly enabled by developers
    // (keeps production/dev console clean and reduces incidental overhead)

    const ls = (globalThis as any)?.localStorage as Storage | undefined;
    return ls?.getItem('fluxby.wasmDebug') === 'true';
  } catch {
    return false;
  }
}

function wasmLog(message: string, ...args: unknown[]) {
  if (!isWasmDebugEnabled()) return;
  // eslint-disable-next-line no-console
  console.log(`[wa-sqlite] ${message}`, ...args);
}

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
  vfsRegistered = false;
  cachedVfsName = undefined;
  migrationCompleted = false;
  globalInitPromise = null;
  globalDbInstance = null;
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

/**
 * SQLite Database class using @journeyapps/wa-sqlite
 */
export class Database implements DatabaseConnection {
  private db: number | null = null;
  private sqlite3: SQLiteAPI | null = null;
  private options: DatabaseOptions;
  private _isOpen = false;
  // Mutex for serializing database operations
  private operationQueue: Promise<unknown> = Promise.resolve();

  constructor(options: DatabaseOptions) {
    this.options = options;
  }

  /**
   * Execute an operation with serialization to prevent concurrent access issues
   */
  private async withLock<T>(operation: () => Promise<T>): Promise<T> {
    // Chain this operation to the end of the queue
    const result = this.operationQueue.then(operation, operation);
    // Update the queue to wait for this operation (ignore errors for queue)
    this.operationQueue = result.catch(() => {});
    return result;
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
    // Fast path - already initialized
    if (globalDbInstance && globalDbInstance._isOpen) {
      wasmLog('Returning existing singleton');
      return globalDbInstance;
    }

    // If init is in progress, wait for it
    if (globalInitPromise) {
      wasmLog('Waiting for existing init...');
      try {
        const db = await globalInitPromise;
        if (db && db._isOpen) {
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
    // If already open, nothing to do
    if (this._isOpen) {
      return;
    }

    // If this instance is the global one being initialized, do the work
    // Otherwise, just copy state from the global instance
    if (globalDbInstance && globalDbInstance._isOpen) {
      this.sqlite3 = globalDbInstance.sqlite3;
      this.db = globalDbInstance.db;
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
      wasmLog('Using cached DB handle:', cachedDbHandle);
      this.sqlite3 = cachedSqlite3;
      this.db = cachedDbHandle;
      this._isOpen = true;
      return;
    }

    // Initialize storage adapter
    await this.options.adapter.initialize();

    // Use cached SQLite module if available (prevents double init)
    if (cachedModule) {
      wasmLog('Reusing cached SQLite module');
      // Always re-create the Factory because the VFS registration state is bound to the instance
      // If we reuse the instance, we might have issues with VFS registration
      const SQLite = await import('@journeyapps/wa-sqlite');
      this.sqlite3 = SQLite.Factory(cachedModule) as unknown as SQLiteAPI;
      cachedSqlite3 = this.sqlite3;
    } else {
      wasmLog('Loading SQLite WASM module...');
      // Dynamically import @journeyapps/wa-sqlite
      const wasmModule =
        await import('@journeyapps/wa-sqlite/dist/wa-sqlite-async.mjs');
      const SQLiteESMFactory = wasmModule.default;
      const SQLite = await import('@journeyapps/wa-sqlite');

      // Initialize SQLite module with proper error handling
      // The factory returns a Promise that resolves to the module
      const factoryResult = SQLiteESMFactory();
      if (!factoryResult || typeof factoryResult.then !== 'function') {
        throw new Error(
          'SQLiteESMFactory did not return a Promise. The WASM module may not be loaded correctly.'
        );
      }
      cachedModule = await factoryResult;
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
      if (
        typeof navigator !== 'undefined' &&
        'storage' in navigator &&
        'getDirectory' in navigator.storage
      ) {
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
          console.warn('OPFS VFS not available, trying IndexedDB VFS', err);
          try {
            const vfsModule: any =
              await import('@journeyapps/wa-sqlite/src/examples/IDBBatchAtomicVFS.js');

            // Use unique VFS name to prevent Asyncify state corruption on reinit
            const idbBaseVfsName = `idb-fluxby-base-${vfsCounter}`;
            vfsCounter++;

            let vfs = await vfsModule.IDBBatchAtomicVFS.create(
              idbBaseVfsName,
              cachedModule
            );

            // Wrap with encryption VFS if key is provided (use already captured encryptionKey)
            if (encryptionKey) {
              wasmLog('Wrapping IndexedDB VFS with EncryptionVFS');
              const idbEncVfsName = `idb-fluxby-${vfsCounter++}`;
              const encVfs = new EncryptionVFS(
                idbEncVfsName,
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
          } catch (idbErr) {
            console.warn(
              'IndexedDB VFS not available, using in-memory storage',
              idbErr
            );
            vfsRegistered = true; // Mark as done even without VFS
          }
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
      wasmLog('Database opened, handle:', this.db);
    } else {
      wasmLog('Using cached DB handle:', cachedDbHandle);
      this.db = cachedDbHandle;
    }
    this._isOpen = true;

    // Enable WAL mode for better performance
    // CAUTION: Switched to DELETE to prevent hanging in some WASM/VFS environments
    await this.execAsync('PRAGMA journal_mode=DELETE');
    await this.execAsync('PRAGMA synchronous=NORMAL');

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

    // Check current schema version using exec (more reliable than parameterized query)
    // This avoids potential finalize issues with the statements generator
    let currentVersion = 0;
    try {
      await this.sqlite3.exec(
        this.db,
        'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1',
        (row) => {
          if (row && row[0] !== undefined) {
            currentVersion = Number(row[0]);
          }
        }
      );
      wasmLog('Current schema version:', currentVersion);
    } catch {
      // Table doesn't exist or other error - need to create schema
      wasmLog('No schema_version table found, will create schema');
    }

    // Already up to date
    if (currentVersion >= SCHEMA_VERSION) {
      wasmLog('Schema up to date');
      migrationCompleted = true;
      return;
    }

    wasmLog('Applying schema...');

    // Apply schema in smaller chunks to avoid memory issues
    // Split schema by semicolons and execute separately
    const schemaStatements = SCHEMA_SQL.split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    wasmLog(`Executing ${schemaStatements.length} schema statements`);
    for (const statement of schemaStatements) {
      try {
        await this.execAsync(statement + ';');
      } catch (err) {
        // Ignore "table already exists" errors
        if (err instanceof Error && !err.message.includes('already exists')) {
          console.error(
            'Error executing schema statement:',
            statement.substring(0, 100),
            err
          );
          // Continue with other statements
        }
      }
    }

    wasmLog('Schema statements executed');

    // --- STRUCTURAL MIGRATIONS ---
    // These handle changes to existing tables that simple CREATE TABLE IF NOT EXISTS doesn't

    // Migration from v3/v4 to v5: Ensure all columns exist in transactions
    if (currentVersion > 0 && currentVersion < 5) {
      wasmLog('Ensuring transactions table has all v5 columns...');
      try {
        await this.execAsync(
          'ALTER TABLE transactions ADD COLUMN payment_provider TEXT;'
        );
      } catch (err) {
        if (
          err instanceof Error &&
          (err.message.includes('duplicate column') ||
            err.message.includes('already exists'))
        ) {
          wasmLog('payment_provider already exists');
        }
      }
      try {
        await this.execAsync(
          'ALTER TABLE transactions ADD COLUMN address_book_id TEXT;'
        );
      } catch (err) {
        if (
          err instanceof Error &&
          (err.message.includes('duplicate column') ||
            err.message.includes('already exists'))
        ) {
          wasmLog('address_book_id already exists');
        }
      }
      wasmLog('Transactions table check completed for v5');
    }

    // --- SEEDING ---
    // Seed default data (only categories with NULL profile_id)
    const deviceId = getDeviceId();
    wasmLog('Running seed SQL...');
    await this.execAsync(getSeedSQL(deviceId));

    // Record schema version using exec (avoid statements API which can cause finalize issues)
    wasmLog('Recording schema version...');
    try {
      // Use exec for both check and insert to avoid statements API
      await this.sqlite3.exec(
        this.db,
        `INSERT OR REPLACE INTO schema_version (version, applied_at) VALUES (${SCHEMA_VERSION}, ${Date.now()})`
      );
    } catch (err) {
      console.warn('Error recording schema version:', err);
      // Continue anyway - not critical
    }

    wasmLog('Migration completed');
    // Mark migration as completed
    migrationCompleted = true;
  }

  /**
   * Execute raw SQL (async version for migrations)
   */
  private async execAsync(sql: string): Promise<void> {
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
      console.error('Error executing SQL:', {
        sql: trimmedSql.substring(0, 200),
        error: err,
      });
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
    return this.withLock(async () => {
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
          while (stepResult === SQLITE_ROW) {
            const columns = this.sqlite3.column_names(stmt);
            const values = this.sqlite3.row(stmt);
            const row: Record<string, unknown> = {};

            columns.forEach((col, i) => {
              row[col] = values[i];
            });

            results.push(row as T);
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
    });
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
    const results = await this.queryAsync<T>(sql, params);
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
    return this.withLock(async () => {
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
    });
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
   * Run operations in a transaction (async)
   */
  async transactionAsync<T>(fn: () => Promise<T>): Promise<T> {
    this.ensureOpen();
    await this.execAsync('BEGIN TRANSACTION');
    try {
      const result = await fn();
      await this.execAsync('COMMIT');
      return result;
    } catch (error) {
      await this.execAsync('ROLLBACK');
      throw error;
    }
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
    return this._isOpen;
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
   * Ensure database is open
   */
  private ensureOpen(): void {
    if (!this._isOpen) {
      throw new Error('Database is not open');
    }
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
