/**
 * @fluxby/database
 *
 * Universal database layer for Fluxby using SQLite WASM
 * Supports Web (OPFS), Tauri (FS), and Node (native FS) environments
 */

// Core types and interfaces
export * from './types.js';
export * from './storage-adapter.js';
export * from './database.js';
export * from './encryption.js';
export * from './schema.js';

// Environment detection
export * from './environment.js';

// Error handling
export * from './errors.js';

// Offline support
export * from './offline.js';

// Backup and restore
export * from './backup.js';

// Session management
export * from './session.js';

// Factory function for creating database instance
export {
  createDatabase,
  resetDatabase,
  getDatabaseInstance,
  getDbPromise,
  isDatabaseInstanceReady,
  type DatabaseConfig,
} from './factory.js';
