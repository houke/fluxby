/**
 * Node.js FS Storage Adapter
 * For Node.js/headless API environments
 */

import {
  BaseStorageAdapter,
  type StorageAdapterConfig,
} from '../storage-adapter.js';
import type { RuntimeEnvironment } from '../types.js';

/**
 * Node storage adapter using native fs
 */
export class NodeStorageAdapter extends BaseStorageAdapter {
  readonly name = 'node';
  readonly environment: RuntimeEnvironment = 'node';

  private fs: typeof import('fs/promises') | null = null;
  private pathModule: typeof import('path') | null = null;
  private dbFilePath: string = '';

  constructor(config: StorageAdapterConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Dynamically import Node.js modules
    try {
      this.fs = await import('fs/promises');
      this.pathModule = await import('path');

      // Determine database directory
      const dataDir =
        process.env.FLUXBY_DATA_DIR ||
        this.pathModule.join(process.cwd(), 'data');

      // Ensure directory exists
      try {
        await this.fs.access(dataDir);
      } catch {
        await this.fs.mkdir(dataDir, { recursive: true });
      }

      // Set full database path
      this.dbFilePath = this.pathModule.join(dataDir, this.config.dbPath);

      this.initialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize Node storage adapter: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async read(): Promise<Uint8Array | null> {
    this.ensureInitialized();

    if (!this.fs) return null;

    try {
      const buffer = await this.fs.readFile(this.dbFilePath);
      return new Uint8Array(buffer);
    } catch {
      return null;
    }
  }

  async write(data: Uint8Array): Promise<void> {
    this.ensureInitialized();

    if (!this.fs) {
      throw new Error('Node FS not initialized');
    }

    await this.fs.writeFile(this.dbFilePath, data);
  }

  async exists(): Promise<boolean> {
    this.ensureInitialized();

    if (!this.fs) return false;

    try {
      await this.fs.access(this.dbFilePath);
      return true;
    } catch {
      return false;
    }
  }

  async delete(): Promise<void> {
    this.ensureInitialized();

    if (!this.fs) return;

    try {
      await this.fs.unlink(this.dbFilePath);
    } catch {
      // File doesn't exist, ignore
    }
  }

  async size(): Promise<number> {
    this.ensureInitialized();

    if (!this.fs) return 0;

    try {
      const stat = await this.fs.stat(this.dbFilePath);
      return stat.size;
    } catch {
      return 0;
    }
  }

  async close(): Promise<void> {
    this.fs = null;
    this.pathModule = null;
    this.dbFilePath = '';
    this.initialized = false;
  }

  /**
   * Get the full path to the database file
   */
  getFullPath(): string {
    return this.dbFilePath;
  }
}
