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
});
