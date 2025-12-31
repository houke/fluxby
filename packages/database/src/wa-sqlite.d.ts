/**
 * Type declarations for wa-sqlite VFS modules
 */

declare module '@journeyapps/wa-sqlite/src/examples/OPFSAnyContextVFS.js' {
  export class OPFSAnyContextVFS {
    static create(name: string, module: unknown): Promise<unknown>;
  }
}

declare module '@journeyapps/wa-sqlite/src/examples/IDBBatchAtomicVFS.js' {
  export class IDBBatchAtomicVFS {
    static create(name: string, module: unknown): Promise<unknown>;
  }
}
