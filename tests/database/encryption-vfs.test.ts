import { describe, expect, it, vi } from 'vitest';
import { EncryptionVFS } from '../../packages/database/src/encryption-vfs';

async function memoryVfs() {
  const files = new Map<number, Uint8Array>();
  const baseVFS = {
    jOpen: vi.fn(async (_name: string | null, pFile: number) => {
      files.set(pFile, new Uint8Array());
      return 0;
    }),
    jClose: vi.fn(async (pFile: number) => {
      files.delete(pFile);
      return 0;
    }),
    jLock: vi.fn(async () => 0),
    jUnlock: vi.fn(async () => 0),
    jTruncate: vi.fn(async (pFile: number, size: number) => {
      const next = new Uint8Array(size);
      next.set((files.get(pFile) ?? new Uint8Array()).subarray(0, size));
      files.set(pFile, next);
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
    'test-encryption-vfs-cache',
    {},
    baseVFS,
    crypto.getRandomValues(new Uint8Array(32))
  );
  await vfs.initialize();
  await vfs.jOpen('database', 1, 0, new DataView(new ArrayBuffer(4)));
  return { vfs, baseVFS, files };
}

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

  it('uses a successfully written page for partial writes without disk reads', async () => {
    const { vfs, baseVFS } = await memoryVfs();
    const page = new Uint8Array(4096).fill(65);
    expect(await vfs.jWrite(1, page, 0)).toBe(0);
    page.fill(99);
    expect(await vfs.jWrite(1, new Uint8Array([66]), 1)).toBe(0);
    expect(baseVFS.jFileSize).not.toHaveBeenCalled();
    expect(baseVFS.jRead).not.toHaveBeenCalled();
    const restored = new Uint8Array(4096);
    expect(await vfs.jRead(1, restored, 0)).toBe(0);
    expect(restored[0]).toBe(65);
    expect(restored[1]).toBe(66);
    expect(restored[4095]).toBe(65);
  });

  it('snapshots caller bytes before an asynchronous physical write completes', async () => {
    const { vfs, baseVFS } = await memoryVfs();
    const write = baseVFS.jWrite.getMockImplementation()!;
    let release: () => void = () => {};
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    baseVFS.jWrite.mockImplementationOnce(async (...args) => {
      await pending;
      return write(...args);
    });
    const page = new Uint8Array(4096).fill(65);
    const writing = vfs.jWrite(1, page, 0);
    await vi.waitFor(() => expect(baseVFS.jWrite).toHaveBeenCalledTimes(1));
    page.fill(99);
    release();
    expect(await writing).toBe(0);
    const restored = new Uint8Array(4096);
    expect(await vfs.jRead(1, restored, 0)).toBe(0);
    expect(restored).toEqual(new Uint8Array(4096).fill(65));
  });

  it('does not cache a page whose physical write failed', async () => {
    const { vfs, baseVFS } = await memoryVfs();
    const page = new Uint8Array(4096).fill(65);
    expect(await vfs.jWrite(1, page, 0)).toBe(0);
    baseVFS.jWrite.mockResolvedValueOnce(778);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(await vfs.jWrite(1, new Uint8Array(4096).fill(99), 0)).toBe(778);
      const restored = new Uint8Array(4096);
      expect(await vfs.jRead(1, restored, 0)).toBe(0);
      expect(restored).toEqual(page);
    } finally {
      error.mockRestore();
    }
  });

  it('invalidates a written page after truncation and recycled file handles', async () => {
    const { vfs } = await memoryVfs();
    expect(await vfs.jWrite(1, new Uint8Array(4096).fill(65), 0)).toBe(0);
    expect(await vfs.jTruncate(1, 0)).toBe(0);
    expect(await vfs.jWrite(1, new Uint8Array([66]), 1)).toBe(0);
    const truncated = new Uint8Array(4096);
    expect(await vfs.jRead(1, truncated, 0)).toBe(0);
    expect(truncated[0]).toBe(0);
    expect(truncated[1]).toBe(66);
    expect(await vfs.jClose(1)).toBe(0);
    expect(
      await vfs.jOpen('replacement', 1, 0, new DataView(new ArrayBuffer(4)))
    ).toBe(0);
    expect(await vfs.jWrite(1, new Uint8Array([67]), 2)).toBe(0);
    const recycled = new Uint8Array(4096);
    expect(await vfs.jRead(1, recycled, 0)).toBe(0);
    expect(recycled[0]).toBe(0);
    expect(recycled[1]).toBe(0);
    expect(recycled[2]).toBe(67);
  });

  it('does not stat and flush a growing file for every partial append', async () => {
    const { vfs, baseVFS } = await memoryVfs();
    for (let page = 0; page < 100; page++) {
      expect(await vfs.jWrite(1, new Uint8Array([page]), page * 4096)).toBe(0);
      expect(await vfs.jWrite(1, new Uint8Array([99]), page * 4096 + 1)).toBe(
        0
      );
    }
    const size = new DataView(new ArrayBuffer(8));
    expect(await vfs.jFileSize(1, size)).toBe(0);
    expect(size.getBigInt64(0, true)).toBe(409600n);
    expect(baseVFS.jFileSize).toHaveBeenCalledTimes(1);
    expect(baseVFS.jRead).not.toHaveBeenCalled();
  });

  it('refreshes page bytes and physical size when another tab owns the next lock', async () => {
    const { vfs, files, baseVFS } = await memoryVfs();
    const size = new DataView(new ArrayBuffer(8));
    expect(await vfs.jLock(1, 1)).toBe(0);
    expect(await vfs.jWrite(1, new Uint8Array([65]), 0)).toBe(0);
    expect(await vfs.jFileSize(1, size)).toBe(0);
    expect(size.getBigInt64(0, true)).toBe(4096n);
    expect(await vfs.jUnlock(1, 0)).toBe(0);

    // Produce valid ciphertext for the same key, then simulate an external
    // writer replacing and growing the file while this connection is unlocked.
    await vfs.jOpen('external', 2, 0, new DataView(new ArrayBuffer(4)));
    await vfs.jWrite(2, new Uint8Array([66]), 0);
    await vfs.jWrite(2, new Uint8Array([67]), 4096);
    files.set(1, files.get(2)!.slice());
    expect(await vfs.jLock(1, 1)).toBe(0);
    const page = new Uint8Array(4096);
    expect(await vfs.jRead(1, page, 0)).toBe(0);
    expect(page[0]).toBe(66);
    expect(await vfs.jFileSize(1, size)).toBe(0);
    expect(size.getBigInt64(0, true)).toBe(8192n);
    expect(baseVFS.jFileSize).toHaveBeenCalledTimes(3);
  });

  it('does not shrink a known file size when overwriting an earlier page', async () => {
    const { vfs } = await memoryVfs();
    await vfs.jWrite(1, new Uint8Array([65]), 4096);
    await vfs.jWrite(1, new Uint8Array(4096).fill(66), 0);
    const size = new DataView(new ArrayBuffer(8));
    expect(await vfs.jFileSize(1, size)).toBe(0);
    expect(size.getBigInt64(0, true)).toBe(8192n);
    expect(await vfs.jTruncate(1, 0)).toBe(0);
    expect(await vfs.jFileSize(1, size)).toBe(0);
    expect(size.getBigInt64(0, true)).toBe(0n);
  });

  it('never caches a failed physical stat or grows the size after a failed write', async () => {
    const { vfs, baseVFS } = await memoryVfs();
    baseVFS.jFileSize.mockResolvedValueOnce(1802);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(await vfs.jWrite(1, new Uint8Array([65]), 0)).toBe(778);
      expect(baseVFS.jWrite).not.toHaveBeenCalled();
      await vfs.jWrite(1, new Uint8Array([66]), 0);
      baseVFS.jWrite.mockResolvedValueOnce(778);
      expect(await vfs.jWrite(1, new Uint8Array([67]), 4096)).toBe(778);
      const size = new DataView(new ArrayBuffer(8));
      expect(await vfs.jFileSize(1, size)).toBe(0);
      expect(size.getBigInt64(0, true)).toBe(4096n);
      expect(baseVFS.jFileSize).toHaveBeenCalledTimes(2);
    } finally {
      error.mockRestore();
    }
  });
});
