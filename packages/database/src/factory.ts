/**
 * Database factory
 * Creates appropriate database instance based on environment
 */

import { Database, type DatabaseOptions } from './database.js';
import type { StorageAdapterConfig, RuntimeEnvironment } from './types.js';
import { detectEnvironment } from './environment.js';

export interface DatabaseConfig {
  /** Database file path/name */
  dbPath?: string;
  /** Force a specific environment */
  environment?: RuntimeEnvironment;
  /** Enable encryption */
  encrypted?: boolean;
  /** Encryption key (32 bytes) */
  encryptionKey?: Uint8Array;
  /** Enable WAL mode */
  walMode?: boolean;
  /** Auto-migrate schema */
  autoMigrate?: boolean;
}

const DEFAULT_DB_PATH = 'fluxby.db';

// Module-level singleton to prevent double initialization (React StrictMode)
let dbInstance: Database | null = null;
let dbPromise: Promise<Database> | null = null;

/**
 * Check if database singleton exists and is ready
 */
export function isDatabaseInstanceReady(): boolean {
  return dbInstance !== null;
}

/**
 * Force clear all database singletons
 * @param full - If true, also reset the WASM module for clean VFS state (use when encryption key changes)
 */
export function resetDatabase(full = false): void {
  // eslint-disable-next-line no-console
  console.log('[DB Factory] Resetting singletons', { full });
  dbInstance = null;
  dbPromise = null;
  Database.resetSingletons(full);
}

/**
 * Get the existing database instance (if any)
 * Returns null if not yet created
 */
export function getDatabaseInstance(): Database | null {
  return dbInstance;
}

/**
 * Get the initialization promise (if in progress)
 * Returns null if no initialization has started
 */
export function getDbPromise(): Promise<Database> | null {
  return dbPromise;
}

// Timeout for database initialization (prevents infinite hangs)
const INIT_TIMEOUT_MS = 45000;

/**
 * Create a database instance for the current environment
 * Uses singleton pattern to handle React StrictMode double initialization
 */
export async function createDatabase(
  config: DatabaseConfig = {}
): Promise<Database> {
  // Return existing instance immediately if available
  if (dbInstance) {
    // eslint-disable-next-line no-console
    console.log('[DB Factory] Returning cached instance');
    return dbInstance;
  }

  // If initialization is already in progress, wait for it WITH TIMEOUT
  if (dbPromise) {
    // Defensive check - ensure it's actually a Promise
    if (typeof dbPromise.then !== 'function') {
      // eslint-disable-next-line no-console
      console.log('[DB Factory] Invalid promise detected, resetting');
      dbPromise = null;
    } else {
      // eslint-disable-next-line no-console
      console.log('[DB Factory] Waiting for existing init promise');

      // Add timeout to prevent infinite wait if the promise is stuck
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              `Database initialization timed out after ${INIT_TIMEOUT_MS / 1000}s while waiting for existing promise`
            )
          );
        }, INIT_TIMEOUT_MS);
      });

      try {
        return await Promise.race([dbPromise, timeoutPromise]);
      } catch (error) {
        // If timeout or error, reset and let caller retry
        console.error(
          '[DB Factory] Waiting for existing promise failed:',
          error
        );
        resetDatabase(true);
        throw error;
      }
    }
  }

  // Start initialization - set promise FIRST before any async work
  // eslint-disable-next-line no-console
  console.log('[DB Factory] Starting new initialization');

  // Wrap internal init with timeout
  const internalPromise = createDatabaseInternal(config);
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          `Database initialization timed out after ${INIT_TIMEOUT_MS / 1000}s`
        )
      );
    }, INIT_TIMEOUT_MS);
  });

  dbPromise = Promise.race([internalPromise, timeoutPromise]);

  try {
    dbInstance = await dbPromise;
    // eslint-disable-next-line no-console
    console.log('[DB Factory] Initialization complete');
    return dbInstance;
  } catch (error) {
    // Reset on failure to allow retry - force full reset to clear potentially corrupted WASM state
    console.error('[DB Factory] Initialization failed:', error);
    resetDatabase(true);
    throw error;
  }
}

/**
 * Internal function that actually creates the database
 */
async function createDatabaseInternal(
  config: DatabaseConfig = {}
): Promise<Database> {
  const environment = config.environment ?? detectEnvironment();
  const dbPath = config.dbPath ?? DEFAULT_DB_PATH;

  const adapterConfig: StorageAdapterConfig = {
    dbPath,
    encrypted: config.encrypted,
    encryptionKey: config.encryptionKey,
  };

  let adapter;

  switch (environment) {
    case 'tauri': {
      const { TauriStorageAdapter } = await import('./adapters/tauri.js');
      adapter = new TauriStorageAdapter(adapterConfig);
      break;
    }
    case 'node': {
      const { NodeStorageAdapter } = await import('./adapters/node.js');
      adapter = new NodeStorageAdapter(adapterConfig);
      break;
    }
    case 'web':
    default: {
      const { OPFSStorageAdapter } = await import('./adapters/web.js');
      adapter = new OPFSStorageAdapter(adapterConfig);
      break;
    }
  }

  const options: DatabaseOptions = {
    adapter,
    dbPath,
    walMode: config.walMode ?? true,
    autoMigrate: config.autoMigrate ?? true,
  };

  // Use static singleton method for thread-safe initialization
  // This handles React StrictMode double-invoke at the WASM level
  return Database.getSingleton(options);
}
