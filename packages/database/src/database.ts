/**
 * Database connection wrapper
 * Re-exports the wa-sqlite implementation for actual SQLite WASM support
 */

export { Database } from './wa-sqlite.js';
export type { DatabaseConnection, DatabaseOptions } from './types.js';
