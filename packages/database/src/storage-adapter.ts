/**
 * Storage Adapter Base Class
 * Provides common functionality for all storage adapters
 */

import type {
  StorageAdapter,
  StorageAdapterConfig,
  RuntimeEnvironment,
} from './types.js';

export abstract class BaseStorageAdapter implements StorageAdapter {
  abstract readonly name: string;
  abstract readonly environment: RuntimeEnvironment;

  protected config: StorageAdapterConfig;
  protected initialized = false;

  constructor(config: StorageAdapterConfig) {
    this.config = config;
  }

  abstract initialize(): Promise<void>;
  abstract read(): Promise<Uint8Array | null>;
  abstract write(data: Uint8Array): Promise<void>;
  abstract exists(): Promise<boolean>;
  abstract delete(): Promise<void>;
  abstract size(): Promise<number>;
  abstract close(): Promise<void>;

  /**
   * Ensure adapter is initialized before operations
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        `Storage adapter "${this.name}" not initialized. Call initialize() first.`
      );
    }
  }

  /**
   * Get the configured database path
   */
  getDbPath(): string {
    return this.config.dbPath;
  }

  /**
   * Check if encryption is enabled
   */
  isEncrypted(): boolean {
    return this.config.encrypted ?? false;
  }
}

export type { StorageAdapter, StorageAdapterConfig };
