import { describe, expect, it, vi } from 'vitest';
import { isolateOPFSWriteBuffers } from '../../packages/database/src/opfs-write-buffers';

describe('OPFS SQLite write buffers', () => {
  it.each([0, 4096])(
    'writes only the requested view at backing offset %i',
    async (offset) => {
      const backing = new Uint8Array(8192).fill(17);
      const view = new Uint8Array(backing.buffer, offset, 10).fill(65);
      const written: Uint8Array[] = [];
      const vfs = {
        jWrite: vi.fn(
          async (_file: number, data: Uint8Array, _offset: number) => {
            // Reproduce WebKit's observed whole-backing-buffer write behavior.
            written.push(new Uint8Array(data.buffer).slice());
            return 0;
          }
        ),
      };
      const original = vfs.jWrite;
      isolateOPFSWriteBuffers(vfs);
      expect(await vfs.jWrite(1, view, 512)).toBe(0);
      expect(written).toEqual([new Uint8Array(10).fill(65)]);
      expect(original.mock.calls[0]?.[2]).toBe(512);
      expect(vfs.jWrite.constructor.name).toBe('AsyncFunction');
    }
  );

  it('retains exact standalone buffers and the wrapped VFS receiver/status', async () => {
    const block = new Uint8Array(4124);
    let received: Uint8Array | undefined;
    const write = vi.fn(
      async (_file: number, data: Uint8Array, _offset: number) => {
        received = data;
        return 778;
      }
    );
    const vfs = { jWrite: write };
    isolateOPFSWriteBuffers(vfs);
    expect(await vfs.jWrite(1, block, 0)).toBe(778);
    expect(received).toBe(block);
    expect(write.mock.contexts[0]).toBe(vfs);
  });
});
