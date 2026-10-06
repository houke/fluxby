interface WritableVFS {
  jWrite(pFile: number, data: Uint8Array, offset: number): Promise<number>;
}

/** Preserve SQLite's bounded view when the browser writes its backing buffer. */
export function isolateOPFSWriteBuffers(vfs: WritableVFS): void {
  const write = vfs.jWrite.bind(vfs);
  // Keep an async method: FacadeVFS detects AsyncFunction to wire Asyncify.
  vfs.jWrite = async (pFile, data, offset) => {
    // WebKit can write the entire ArrayBuffer behind an ArrayBufferView. SQLite
    // passes views into its WASM heap, so copy only those bounded views. The
    // encryption wrapper already supplies exact standalone blocks.
    const bytes =
      data.byteOffset === 0 && data.byteLength === data.buffer.byteLength
        ? data
        : data.slice();
    return write(pFile, bytes, offset);
  };
}
