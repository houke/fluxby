/**
 * OPFS (Origin Private File System) Storage Adapter
 * For web browser environments
 */

import {
  BaseStorageAdapter,
  type StorageAdapterConfig,
} from '../storage-adapter.js';
import type { RuntimeEnvironment } from '../types.js';

/**
 * Web storage adapter using OPFS
 * OPFS provides fast, synchronous-like file access in browsers
 */
export class OPFSStorageAdapter extends BaseStorageAdapter {
  readonly name = 'opfs';
  readonly environment: RuntimeEnvironment = 'web';

  private root: FileSystemDirectoryHandle | null = null;
  private fileHandle: FileSystemFileHandle | null = null;

  constructor(config: StorageAdapterConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Check OPFS availability
    if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory) {
      throw new Error('OPFS is not available in this environment');
    }

    // Get the root directory
    // NOTE: We use the root directly (not a subdirectory) to match where
    // OPFSAnyContextVFS stores files when sqlite3.open_v2() is called.
    // This ensures the migration logic in wa-sqlite.ts operates on the
    // same file that the VFS uses.
    this.root = await navigator.storage.getDirectory();

    // Get or create the database file handle at the root
    this.fileHandle = await this.root.getFileHandle(this.config.dbPath, {
      create: true,
    });

    this.initialized = true;
  }

  async read(): Promise<Uint8Array | null> {
    this.ensureInitialized();

    if (!this.fileHandle) return null;

    const file = await this.fileHandle.getFile();
    if (file.size === 0) return null;

    const buffer = await file.arrayBuffer();
    return new Uint8Array(buffer);
  }

  async write(data: Uint8Array): Promise<void> {
    this.ensureInitialized();

    if (!this.fileHandle) {
      throw new Error('File handle not initialized');
    }

    // Create writable stream
    const writable = await this.fileHandle.createWritable();

    try {
      await writable.write(data as FileSystemWriteChunkType);
    } finally {
      await writable.close();
    }
  }

  async exists(): Promise<boolean> {
    this.ensureInitialized();

    if (!this.fileHandle) return false;

    try {
      const file = await this.fileHandle.getFile();
      return file.size > 0;
    } catch {
      return false;
    }
  }

  async delete(): Promise<void> {
    this.ensureInitialized();

    if (!this.root) return;

    try {
      // Delete from root directory (matching where we store the file)
      await this.root.removeEntry(this.config.dbPath);
    } catch {
      // File doesn't exist, ignore
    }
  }

  async size(): Promise<number> {
    this.ensureInitialized();

    if (!this.fileHandle) return 0;

    try {
      const file = await this.fileHandle.getFile();
      return file.size;
    } catch {
      return 0;
    }
  }

  async close(): Promise<void> {
    this.fileHandle = null;
    this.root = null;
    this.initialized = false;
  }
}
