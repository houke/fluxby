/**
 * Tauri FS Storage Adapter
 * For Tauri desktop applications
 */

import {
  BaseStorageAdapter,
  type StorageAdapterConfig,
} from '../storage-adapter.js';
import type { RuntimeEnvironment } from '../types.js';

// Tauri types (will be available when running in Tauri)
interface TauriFS {
  exists: (path: string, options?: { baseDir?: number }) => Promise<boolean>;
  readFile: (
    path: string,
    options?: { baseDir?: number }
  ) => Promise<Uint8Array>;
  writeFile: (
    path: string,
    data: Uint8Array,
    options?: { baseDir?: number }
  ) => Promise<void>;
  remove: (path: string, options?: { baseDir?: number }) => Promise<void>;
  mkdir: (
    path: string,
    options?: { baseDir?: number; recursive?: boolean }
  ) => Promise<void>;
  stat: (
    path: string,
    options?: { baseDir?: number }
  ) => Promise<{ size: number }>;
}

interface TauriPath {
  appLocalDataDir: () => Promise<string>;
  join: (...paths: string[]) => Promise<string>;
}

// BaseDirectory constants from Tauri
const _BaseDirectory = {
  AppLocalData: 26,
};

/**
 * Tauri storage adapter using the FS plugin
 * Stores data in AppLocalData directory
 */
export class TauriStorageAdapter extends BaseStorageAdapter {
  readonly name = 'tauri';
  readonly environment: RuntimeEnvironment = 'tauri';

  private fs: TauriFS | null = null;
  private path: TauriPath | null = null;
  private dbFilePath: string = '';

  constructor(config: StorageAdapterConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Dynamically import Tauri APIs
    try {
      const fsModule = await import('@tauri-apps/plugin-fs');
      const pathModule = await import('@tauri-apps/api/path');

      this.fs = {
        exists: fsModule.exists,
        readFile: fsModule.readFile,
        writeFile: fsModule.writeFile,
        remove: fsModule.remove,
        mkdir: fsModule.mkdir,
        stat: fsModule.stat,
      };

      this.path = {
        appLocalDataDir: pathModule.appLocalDataDir,
        join: pathModule.join,
      };

      // Create fluxby directory in AppLocalData
      const appDir = await this.path.appLocalDataDir();
      const fluxbyDir = await this.path.join(appDir, 'fluxby');

      // Ensure directory exists
      const dirExists = await this.fs.exists(fluxbyDir);
      if (!dirExists) {
        await this.fs.mkdir(fluxbyDir, { recursive: true });
      }

      // Set full database path
      this.dbFilePath = await this.path.join(fluxbyDir, this.config.dbPath);

      this.initialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize Tauri storage adapter: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async read(): Promise<Uint8Array | null> {
    this.ensureInitialized();

    if (!this.fs) return null;

    try {
      const exists = await this.fs.exists(this.dbFilePath);
      if (!exists) return null;

      return await this.fs.readFile(this.dbFilePath);
    } catch {
      return null;
    }
  }

  async write(data: Uint8Array): Promise<void> {
    this.ensureInitialized();

    if (!this.fs) {
      throw new Error('Tauri FS not initialized');
    }

    await this.fs.writeFile(this.dbFilePath, data);
  }

  async exists(): Promise<boolean> {
    this.ensureInitialized();

    if (!this.fs) return false;

    try {
      return await this.fs.exists(this.dbFilePath);
    } catch {
      return false;
    }
  }

  async delete(): Promise<void> {
    this.ensureInitialized();

    if (!this.fs) return;

    try {
      const exists = await this.fs.exists(this.dbFilePath);
      if (exists) {
        await this.fs.remove(this.dbFilePath);
      }
    } catch {
      // File doesn't exist, ignore
    }
  }

  async size(): Promise<number> {
    this.ensureInitialized();

    if (!this.fs) return 0;

    try {
      const exists = await this.fs.exists(this.dbFilePath);
      if (!exists) return 0;

      const stat = await this.fs.stat(this.dbFilePath);
      return stat.size;
    } catch {
      return 0;
    }
  }

  async close(): Promise<void> {
    this.fs = null;
    this.path = null;
    this.dbFilePath = '';
    this.initialized = false;
  }

  /**
   * Get the full path to the database file
   * Useful for backup operations
   */
  getFullPath(): string {
    return this.dbFilePath;
  }
}
