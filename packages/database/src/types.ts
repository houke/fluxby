/**
 * Core types for the database layer
 */

export type RuntimeEnvironment = 'web' | 'tauri' | 'node';

export interface StorageAdapterConfig {
  /** Path or identifier for the database file */
  dbPath: string;
  /** Whether to enable encryption */
  encrypted?: boolean;
  /** Encryption key (32 bytes) - only held in memory */
  encryptionKey?: Uint8Array;
}

export interface DatabaseOptions {
  /** Storage adapter to use */
  adapter: StorageAdapter;
  /** Database file path */
  dbPath?: string;
  /** Enable WAL mode for better performance */
  walMode?: boolean;
  /** Auto-migrate schema on connection */
  autoMigrate?: boolean;
}

/**
 * Storage Adapter Interface
 * Implementations provide platform-specific storage backends
 */
export interface StorageAdapter {
  /** Adapter name for debugging */
  readonly name: string;

  /** Runtime environment this adapter targets */
  readonly environment: RuntimeEnvironment;

  /** Initialize the storage backend */
  initialize(): Promise<void>;

  /** Read database file as bytes */
  read(): Promise<Uint8Array | null>;

  /** Write database file */
  write(data: Uint8Array): Promise<void>;

  /** Check if database file exists */
  exists(): Promise<boolean>;

  /** Delete database file */
  delete(): Promise<void>;

  /** Get file size in bytes */
  size(): Promise<number>;

  /** Close/cleanup resources */
  close(): Promise<void>;
}

/**
 * Query result types
 */
export interface QueryResult<T = unknown> {
  rows: T[];
  changes: number;
  lastInsertRowId: number;
}

/**
 * Prepared statement handle
 */
export interface PreparedStatement {
  bind(params: unknown[]): this;
  run(): { changes: number; lastInsertRowId: number };
  get<T = Record<string, unknown>>(): T | null;
  all<T = Record<string, unknown>>(): T[];
  finalize(): void;
}

/**
 * Database connection interface
 */
export interface DatabaseConnection {
  /** Execute raw SQL (for schema changes, etc.) */
  exec(sql: string): void;

  /** Execute parameterized query and return all rows */
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): T[];

  /** Execute parameterized query and return first row */
  queryOne<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): T | null;

  /** Execute insert/update/delete and return changes info */
  run(
    sql: string,
    params?: unknown[]
  ): { changes: number; lastInsertRowId: number };

  /** Prepare a statement for repeated execution */
  prepare(sql: string): PreparedStatement;

  /** Run operations in a transaction */
  transaction<T>(fn: () => T): T;

  /** Check if database is open */
  isOpen(): boolean;

  /** Close the database connection */
  close(): void;
}

/**
 * Sync-related types
 */
export interface SyncMetadata {
  id: string; // UUID
  updated_at: number; // Unix timestamp in milliseconds
  is_deleted: boolean;
  device_id: string;
}

export interface SyncConflict {
  table: string;
  localRow: Record<string, unknown>;
  remoteRow: Record<string, unknown>;
  resolution: 'local' | 'remote';
}

/**
 * Encryption key types
 */
export interface WrappedKey {
  /** The encrypted master key */
  ciphertext: Uint8Array;
  /** Salt used for key derivation */
  salt: Uint8Array;
  /** Nonce/IV for encryption */
  nonce: Uint8Array;
  /** Number of iterations for key derivation */
  iterations: number;
}

export interface KeyDerivationParams {
  /** User's password or passphrase */
  password: string;
  /** Salt for derivation */
  salt: Uint8Array;
  /** Number of iterations */
  iterations?: number;
}
