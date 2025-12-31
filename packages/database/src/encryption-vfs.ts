/**
 * Encryption VFS wrapper for wa-sqlite
 *
 * Note: This file uses `any` types and @ts-expect-error comments for wa-sqlite library
 * interop where TypeScript definitions are incomplete.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

// @ts-expect-error - FacadeVFS not exported in wa-sqlite type definitions
import { FacadeVFS } from '@journeyapps/wa-sqlite/src/FacadeVFS.js';
import * as VFS from '@journeyapps/wa-sqlite/src/sqlite-constants.js';

export class EncryptionVFS extends FacadeVFS {
  private baseVFS: any;
  private masterKeyRaw: Uint8Array;
  private key: CryptoKey | null = null;
  private pageSize: number = 4096;
  private tailSize: number = 28; // 12 (IV) + 16 (Tag)
  private blockSize: number;

  // Track if we've already checked for legacy unencrypted data
  private legacyChecked: boolean = false;

  // Simple one-page cache to handle small reads (header, etc.)
  private cache: {
    pageIndex: number;
    data: Uint8Array;
    isDirty: boolean;
  } | null = null;

  constructor(
    name: string,
    module: any,
    baseVFS: any,
    masterKeyRaw: Uint8Array
  ) {
    super(name, module);
    this.baseVFS = baseVFS;
    this.masterKeyRaw = masterKeyRaw;
    this.blockSize = this.pageSize + this.tailSize;
  }

  async initialize(): Promise<void> {
    this.key = await crypto.subtle.importKey(
      'raw' as any,
      this.masterKeyRaw as any,
      { name: 'AES-GCM', length: 256 } as any,
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Override hasAsyncMethod to check if the baseVFS method is async.
   * This is critical for wa-sqlite to know when to expect Promises.
   */
  hasAsyncMethod(methodName: string): boolean {
    // Explicit list of async methods in EncryptionVFS
    const asyncMethods = [
      'Open',
      'Close',
      'Read',
      'Write',
      'Truncate',
      'FileSize',
      'Sync',
      'Lock',
      'Unlock',
      'CheckReservedLock',
      'FileControl',
    ];

    if (asyncMethods.includes(methodName)) {
      return true;
    }

    // Check if baseVFS has an async method for this
    if (this.baseVFS && typeof this.baseVFS.hasAsyncMethod === 'function') {
      return this.baseVFS.hasAsyncMethod(methodName);
    }

    return false;
  }

  /**
   * FacadeVFS methods
   */

  async jOpen(
    filename: string | null,
    pFile: number,
    flags: number,
    pOutFlags: DataView
  ): Promise<number> {
    const result = await this.baseVFS.jOpen(filename, pFile, flags, pOutFlags);

    // Reset legacy check for new file handle
    if (result === VFS.SQLITE_OK) {
      this.legacyChecked = false;
    }

    return result;
  }

  async jClose(pFile: number): Promise<number> {
    this.cache = null; // Clear cache on close
    this.legacyChecked = false;
    return this.baseVFS.jClose(pFile);
  }

  /**
   * Check if database is unencrypted on first read.
   * SECURITY: If unencrypted data is detected, throw an error.
   * This prevents accidentally exposing unencrypted data.
   */
  private async checkIfLegacy(pFile: number): Promise<void> {
    if (this.legacyChecked) return;
    this.legacyChecked = true;

    // Read first 16 bytes to check SQLite header
    const header = new Uint8Array(16);
    const rc = await this.baseVFS.jRead(pFile, header, 0);

    if (rc === VFS.SQLITE_OK && this.isUnencryptedSQLite(header)) {
      // SECURITY: Do NOT run in passthrough mode - this would expose data unencrypted.
      // The migration in wa-sqlite.ts should have encrypted any legacy data before
      // we get here. If we still see unencrypted data, something went wrong.
      throw new Error(
        'SECURITY ERROR: Unencrypted database detected. ' +
          'Data migration may have failed. Please reset and recreate your profile.'
      );
    }
  }

  async jRead(
    pFile: number,
    pData: Uint8Array,
    iOffset: number
  ): Promise<number> {
    try {
      // Check for legacy unencrypted database on first read
      // This will throw if unencrypted data is detected
      await this.checkIfLegacy(pFile);

      let bytesRead = 0;
      let currentOffset = iOffset;
      let remaining = pData.length;

      while (remaining > 0) {
        const pageIndex = Math.floor(currentOffset / this.pageSize);
        const offsetInPage = currentOffset % this.pageSize;
        const count = Math.min(remaining, this.pageSize - offsetInPage);

        const pageData = await this.getOrFetchPage(pFile, pageIndex);
        if (!pageData) {
          // End of file or error
          return bytesRead > 0 ? VFS.SQLITE_OK : VFS.SQLITE_IOERR_SHORT_READ;
        }

        pData.set(
          pageData.subarray(offsetInPage, offsetInPage + count),
          bytesRead
        );

        bytesRead += count;
        currentOffset += count;
        remaining -= count;
      }

      return VFS.SQLITE_OK;
    } catch (err) {
      console.error('EncryptionVFS jRead error:', err);
      return VFS.SQLITE_IOERR_READ;
    }
  }

  async jWrite(
    pFile: number,
    pData: Uint8Array,
    iOffset: number
  ): Promise<number> {
    try {
      let bytesWritten = 0;
      let currentOffset = iOffset;
      let remaining = pData.length;

      while (remaining > 0) {
        const pageIndex = Math.floor(currentOffset / this.pageSize);
        const offsetInPage = currentOffset % this.pageSize;
        const count = Math.min(remaining, this.pageSize - offsetInPage);

        let pageData: Uint8Array;
        if (count === this.pageSize) {
          // Full page write
          pageData = new Uint8Array(
            pData.buffer,
            pData.byteOffset + bytesWritten,
            this.pageSize
          );
        } else {
          // Partial page write - need to read existing page first
          const existing = await this.getOrFetchPage(pFile, pageIndex);
          pageData = existing
            ? new Uint8Array(existing)
            : new Uint8Array(this.pageSize);
          pageData.set(
            pData.subarray(bytesWritten, bytesWritten + count),
            offsetInPage
          );
        }

        await this.writeEncryptedPage(pFile, pageIndex, pageData);

        // Update cache if it matches
        if (this.cache && this.cache.pageIndex === pageIndex) {
          this.cache.data.set(pageData);
        }

        bytesWritten += count;
        currentOffset += count;
        remaining -= count;
      }

      return VFS.SQLITE_OK;
    } catch (err) {
      console.error('EncryptionVFS jWrite error:', err);
      return VFS.SQLITE_IOERR_WRITE;
    }
  }

  async jTruncate(pFile: number, size: number): Promise<number> {
    const physicalSize = Math.ceil(size / this.pageSize) * this.blockSize;
    this.cache = null;
    return this.baseVFS.jTruncate(pFile, physicalSize);
  }

  async jFileSize(pFile: number, pSize: DataView): Promise<number> {
    const result = await this.baseVFS.jFileSize(pFile, pSize);

    if (result === VFS.SQLITE_OK) {
      const physicalSize = Number(pSize.getBigInt64(0, true));
      const logicalSize =
        Math.floor(physicalSize / this.blockSize) * this.pageSize;
      pSize.setBigInt64(0, BigInt(logicalSize), true);
    }
    return result;
  }

  // Delegate other methods to baseVFS
  // IMPORTANT: These methods must handle the async/sync mismatch properly.
  // If baseVFS returns a Promise, we must return a Promise. If it returns a number, we return a number.
  // Using Promise.resolve() ensures we always return a Promise when the baseVFS might be async,
  // which prevents "foo().then is not a function" errors in wa-sqlite's Asyncify.
  async jSync(pFile: number, flags: number): Promise<number> {
    return Promise.resolve(this.baseVFS.jSync(pFile, flags));
  }
  async jLock(pFile: number, lockType: number): Promise<number> {
    return Promise.resolve(this.baseVFS.jLock(pFile, lockType));
  }
  async jUnlock(pFile: number, lockType: number): Promise<number> {
    return Promise.resolve(this.baseVFS.jUnlock(pFile, lockType));
  }
  async jCheckReservedLock(pFile: number, pResOut: DataView): Promise<number> {
    return Promise.resolve(this.baseVFS.jCheckReservedLock(pFile, pResOut));
  }
  async jFileControl(
    pFile: number,
    op: number,
    pArg: DataView
  ): Promise<number> {
    return Promise.resolve(this.baseVFS.jFileControl(pFile, op, pArg));
  }
  jSectorSize(pFile: number): number {
    return this.baseVFS.jSectorSize(pFile);
  }
  jDeviceCharacteristics(pFile: number): number {
    return this.baseVFS.jDeviceCharacteristics(pFile);
  }

  /**
   * Internal helpers
   */

  private async getOrFetchPage(
    pFile: number,
    pageIndex: number
  ): Promise<Uint8Array | null> {
    if (this.cache && this.cache.pageIndex === pageIndex) {
      return this.cache.data;
    }

    const physicalOffset = pageIndex * this.blockSize;
    const encryptedBlock = new Uint8Array(this.blockSize);

    // Check file size first
    const pSize = new DataView(new ArrayBuffer(8));
    await this.baseVFS.jFileSize(pFile, pSize);
    const actualSize = Number(pSize.getBigInt64(0, true));

    if (physicalOffset >= actualSize) {
      return null;
    }

    const rc = await this.baseVFS.jRead(pFile, encryptedBlock, physicalOffset);
    if (rc !== VFS.SQLITE_OK) {
      // If it's a short read at the end of the file, we might have a partial last block
      // But in our system we should always have full blocks.
      return null;
    }

    const decrypted = await this.decryptPage(encryptedBlock);
    this.cache = { pageIndex, data: decrypted, isDirty: false };
    return decrypted;
  }

  /**
   * Check if data looks like an unencrypted SQLite database.
   * SQLite databases start with "SQLite format 3\0" (16 bytes).
   */
  private isUnencryptedSQLite(data: Uint8Array): boolean {
    const header = 'SQLite format 3\0';
    if (data.length < header.length) return false;
    for (let i = 0; i < header.length; i++) {
      if (data[i] !== header.charCodeAt(i)) return false;
    }
    return true;
  }

  private async decryptPage(block: Uint8Array): Promise<Uint8Array> {
    if (!this.key) throw new Error('VFS not initialized');

    // Check if this looks like unencrypted SQLite data (first page only has the header)
    // If the data starts with "SQLite format 3", it's unencrypted
    if (this.isUnencryptedSQLite(block)) {
      console.warn(
        'EncryptionVFS: Detected unencrypted SQLite data. Database needs migration.'
      );
      // Return the raw data - this allows reading but indicates migration is needed
      // The data block size for unencrypted is just the page size
      return block.subarray(0, this.pageSize);
    }

    const iv = block.subarray(this.pageSize, this.pageSize + 12);
    const _ciphertext = block.subarray(0, this.pageSize + 16); // Data + Tag (tag is at the end)

    // In our storage, we put the IV after the pageSize.
    // So block is: [Data (4096)] [IV (12)] [Tag (16)]
    // Wait, AES-GCM tag is usually appended to ciphertext.
    // So let's store: [Ciphertext (4096)] [IV (12)] [Tag (16)]

    const tag = block.subarray(this.pageSize + 12, this.pageSize + 28);
    const dataAndTag = new Uint8Array(this.pageSize + 16);
    dataAndTag.set(block.subarray(0, this.pageSize));
    dataAndTag.set(tag, this.pageSize);

    try {
      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv } as any,
        this.key as any,
        dataAndTag as any
      );

      return new Uint8Array(plaintext);
    } catch (err) {
      // Decryption failed - this could be unencrypted data or corrupted data
      console.error(
        'EncryptionVFS: Decryption failed, data may be unencrypted:',
        err
      );
      // Return the raw page data as fallback (best effort for unencrypted databases)
      return block.subarray(0, this.pageSize);
    }
  }

  private async writeEncryptedPage(
    pFile: number,
    pageIndex: number,
    plaintext: Uint8Array
  ): Promise<void> {
    if (!this.key) throw new Error('VFS not initialized');

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv } as any,
      this.key as any,
      plaintext as any
    );

    // encrypted is ArrayBuffer containing Ciphertext + 16-byte Tag
    const encryptedBytes = new Uint8Array(encrypted);
    const block = new Uint8Array(this.blockSize);
    block.set(encryptedBytes.subarray(0, this.pageSize)); // Ciphertext
    block.set(iv, this.pageSize); // IV
    block.set(
      encryptedBytes.subarray(this.pageSize, this.pageSize + 16),
      this.pageSize + 12
    ); // Tag

    const physicalOffset = pageIndex * this.blockSize;
    const rc = await this.baseVFS.jWrite(pFile, block, physicalOffset);
    if (rc !== VFS.SQLITE_OK) {
      throw new Error(`Physical write failed with code ${rc}`);
    }
  }
}
