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
});
