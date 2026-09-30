import { describe, expect, it, vi } from 'vitest';
import { EncryptionVFS } from '../../packages/database/src/encryption-vfs';

describe('EncryptionVFS async contract', () => {
  it('keeps FileControl synchronous so wa-sqlite does not await a number', () => {
    const baseVFS = { jFileControl: vi.fn(() => 0) };
    const vfs = new EncryptionVFS(
      'test-encryption-vfs',
      {},
      baseVFS,
      new Uint8Array(32)
    );

    expect(vfs.hasAsyncMethod('FileControl')).toBe(false);
    expect(vfs.jFileControl(1, 0, new DataView(new ArrayBuffer(8)))).toBe(0);
  });

  it('delegates async and sync methods to the wrapped VFS', async () => {
    const baseVFS = {
      jAccess: vi.fn(async () => 0),
      jDelete: vi.fn(async () => 0),
      jFullPathname: vi.fn(() => 0),
      jGetLastError: vi.fn(() => 0),
    };
    const vfs = new EncryptionVFS(
      'test-encryption-vfs-delegation',
      {},
      baseVFS,
      new Uint8Array(32)
    );
    const resultOut = new DataView(new ArrayBuffer(4));
    const pathOut = new Uint8Array(32);
    const errorOut = new Uint8Array(32);

    await expect(vfs.jDelete('fluxby.db', 0)).resolves.toBe(0);
    await expect(vfs.jAccess('fluxby.db', 0, resultOut)).resolves.toBe(0);
    expect(vfs.jFullPathname('fluxby.db', pathOut)).toBe(0);
    expect(vfs.jGetLastError(errorOut)).toBe(0);

    expect(baseVFS.jDelete).toHaveBeenCalledWith('fluxby.db', 0);
    expect(baseVFS.jAccess).toHaveBeenCalledWith('fluxby.db', 0, resultOut);
    expect(baseVFS.jFullPathname).toHaveBeenCalledWith('fluxby.db', pathOut);
    expect(baseVFS.jGetLastError).toHaveBeenCalledWith(errorOut);
  });

  it('keeps cached pages separate for concurrent database and journal handles', async () => {
    const files = new Map<number, Uint8Array>();
    const baseVFS = {
      jOpen: vi.fn(async (_name: string, pFile: number) => {
        files.set(pFile, new Uint8Array());
        return 0;
      }),
      jClose: vi.fn(async (pFile: number) => {
        files.delete(pFile);
        return 0;
      }),
      jFileSize: vi.fn(async (pFile: number, out: DataView) => {
        out.setBigInt64(0, BigInt(files.get(pFile)?.length ?? 0), true);
        return 0;
      }),
      jRead: vi.fn(async (pFile: number, out: Uint8Array, offset: number) => {
        const data = files.get(pFile) ?? new Uint8Array();
        if (offset + out.length > data.length) return 522;
        out.set(data.subarray(offset, offset + out.length));
        return 0;
      }),
      jWrite: vi.fn(async (pFile: number, data: Uint8Array, offset: number) => {
        const existing = files.get(pFile) ?? new Uint8Array();
        const next = new Uint8Array(
          Math.max(existing.length, offset + data.length)
        );
        next.set(existing);
        next.set(data, offset);
        files.set(pFile, next);
        return 0;
      }),
    };
    const vfs = new EncryptionVFS(
      'test-encryption-vfs-files',
      {},
      baseVFS,
      crypto.getRandomValues(new Uint8Array(32))
    );
    await vfs.initialize();
    const openFlags = new DataView(new ArrayBuffer(4));
    await vfs.jOpen('database', 1, 0, openFlags);
    await vfs.jOpen('journal', 2, 0, openFlags);

    const databasePage = new Uint8Array(4096).fill(65);
    expect(await vfs.jWrite(1, databasePage, 0)).toBe(0);
    expect(await vfs.jRead(1, new Uint8Array(4096), 0)).toBe(0);
    expect(await vfs.jWrite(2, new Uint8Array([66]), 0)).toBe(0);

    const journalPage = new Uint8Array(4096);
    expect(await vfs.jRead(2, journalPage, 0)).toBe(0);
    expect(journalPage[0]).toBe(66);
    expect(journalPage[1]).toBe(0);

    const rereadDatabasePage = new Uint8Array(4096);
    expect(await vfs.jRead(1, rereadDatabasePage, 0)).toBe(0);
    expect(rereadDatabasePage).toEqual(databasePage);
  });
});
