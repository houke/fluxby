/**
 * OPFS Operations
 *
 * Origin Private File System examples for local-first apps.
 */

// ============================================================================
// BASIC FILE OPERATIONS
// ============================================================================

/**
 * Get the OPFS root directory
 */
export async function getOPFSRoot(): Promise<FileSystemDirectoryHandle> {
  return navigator.storage.getDirectory();
}

/**
 * Create or open a file
 */
export async function getFile(
  path: string,
  create: boolean = false,
): Promise<FileSystemFileHandle> {
  const root = await getOPFSRoot();
  const parts = path.split('/').filter(Boolean);
  const fileName = parts.pop()!;

  let current = root;
  for (const dir of parts) {
    current = await current.getDirectoryHandle(dir, { create });
  }

  return current.getFileHandle(fileName, { create });
}

/**
 * Create or open a directory
 */
export async function getDirectory(
  path: string,
  create: boolean = false,
): Promise<FileSystemDirectoryHandle> {
  const root = await getOPFSRoot();
  const parts = path.split('/').filter(Boolean);

  let current = root;
  for (const dir of parts) {
    current = await current.getDirectoryHandle(dir, { create });
  }

  return current;
}

/**
 * Write text to a file
 */
export async function writeTextFile(
  path: string,
  content: string,
): Promise<void> {
  const fileHandle = await getFile(path, true);
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

/**
 * Read text from a file
 */
export async function readTextFile(path: string): Promise<string> {
  const fileHandle = await getFile(path);
  const file = await fileHandle.getFile();
  return file.text();
}

/**
 * Write binary data to a file
 */
export async function writeBinaryFile(
  path: string,
  data: ArrayBuffer | Uint8Array,
): Promise<void> {
  const fileHandle = await getFile(path, true);
  const writable = await fileHandle.createWritable();
  await writable.write(data);
  await writable.close();
}

/**
 * Read binary data from a file
 */
export async function readBinaryFile(path: string): Promise<ArrayBuffer> {
  const fileHandle = await getFile(path);
  const file = await fileHandle.getFile();
  return file.arrayBuffer();
}

/**
 * Delete a file
 */
export async function deleteFile(path: string): Promise<void> {
  const root = await getOPFSRoot();
  const parts = path.split('/').filter(Boolean);
  const fileName = parts.pop()!;

  let current = root;
  for (const dir of parts) {
    current = await current.getDirectoryHandle(dir);
  }

  await current.removeEntry(fileName);
}

/**
 * Delete a directory (recursive)
 */
export async function deleteDirectory(path: string): Promise<void> {
  const root = await getOPFSRoot();
  const parts = path.split('/').filter(Boolean);
  const dirName = parts.pop()!;

  let current = root;
  for (const dir of parts) {
    current = await current.getDirectoryHandle(dir);
  }

  await current.removeEntry(dirName, { recursive: true });
}

/**
 * List directory contents
 */
export async function listDirectory(
  path: string = '',
): Promise<Array<{ name: string; kind: 'file' | 'directory' }>> {
  const dir = path ? await getDirectory(path) : await getOPFSRoot();
  const entries: Array<{ name: string; kind: 'file' | 'directory' }> = [];

  for await (const [name, handle] of dir.entries()) {
    entries.push({ name, kind: handle.kind });
  }

  return entries;
}

/**
 * Check if file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await getFile(path);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// SYNCHRONOUS ACCESS (Web Worker only)
// ============================================================================

/**
 * Get synchronous access handle for high-performance I/O
 * NOTE: Only works in Web Workers!
 */
export async function getSyncAccessHandle(
  path: string,
): Promise<FileSystemSyncAccessHandle> {
  const fileHandle = await getFile(path, true);
  return fileHandle.createSyncAccessHandle();
}

/**
 * Example sync operations in a Web Worker
 */
export function syncWorkerExample() {
  // This code runs in a Web Worker
  return `
    const handle = await getSyncAccessHandle('data.bin');
    
    // Get file size
    const size = handle.getSize();
    
    // Read at position
    const buffer = new Uint8Array(1024);
    const bytesRead = handle.read(buffer, { at: 0 });
    
    // Write at position
    const data = new TextEncoder().encode('Hello');
    const bytesWritten = handle.write(data, { at: 0 });
    
    // Ensure data is persisted
    handle.flush();
    
    // Resize file
    handle.truncate(512);
    
    // Close handle (required!)
    handle.close();
  `;
}

// ============================================================================
// STREAMING OPERATIONS
// ============================================================================

/**
 * Stream write large data
 */
export async function streamWriteFile(
  path: string,
  stream: ReadableStream,
): Promise<void> {
  const fileHandle = await getFile(path, true);
  const writable = await fileHandle.createWritable();
  await stream.pipeTo(writable);
}

/**
 * Stream read large file
 */
export async function streamReadFile(path: string): Promise<ReadableStream> {
  const fileHandle = await getFile(path);
  const file = await fileHandle.getFile();
  return file.stream();
}

/**
 * Process file in chunks
 */
export async function processFileInChunks(
  path: string,
  chunkSize: number,
  processor: (chunk: Uint8Array, offset: number) => Promise<void>,
): Promise<void> {
  const stream = await streamReadFile(path);
  const reader = stream.getReader();

  let offset = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    await processor(value, offset);
    offset += value.length;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Copy file within OPFS
 */
export async function copyFile(
  srcPath: string,
  destPath: string,
): Promise<void> {
  const data = await readBinaryFile(srcPath);
  await writeBinaryFile(destPath, data);
}

/**
 * Move/rename file within OPFS
 */
export async function moveFile(
  srcPath: string,
  destPath: string,
): Promise<void> {
  await copyFile(srcPath, destPath);
  await deleteFile(srcPath);
}

/**
 * Get file size
 */
export async function getFileSize(path: string): Promise<number> {
  const fileHandle = await getFile(path);
  const file = await fileHandle.getFile();
  return file.size;
}

/**
 * Get file metadata
 */
export async function getFileMetadata(path: string): Promise<{
  name: string;
  size: number;
  lastModified: number;
  type: string;
}> {
  const fileHandle = await getFile(path);
  const file = await fileHandle.getFile();

  return {
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    type: file.type,
  };
}

/**
 * Calculate total OPFS usage
 */
export async function calculateTotalSize(path: string = ''): Promise<number> {
  const entries = await listDirectory(path);
  let total = 0;

  for (const entry of entries) {
    const fullPath = path ? `${path}/${entry.name}` : entry.name;

    if (entry.kind === 'file') {
      total += await getFileSize(fullPath);
    } else {
      total += await calculateTotalSize(fullPath);
    }
  }

  return total;
}

/**
 * Request persistent storage
 */
export async function requestPersistence(): Promise<boolean> {
  if (navigator.storage?.persist) {
    return navigator.storage.persist();
  }
  return false;
}

/**
 * Get storage quota info
 */
export async function getStorageQuota(): Promise<{
  quota: number;
  usage: number;
  available: number;
  percentUsed: number;
}> {
  const estimate = await navigator.storage.estimate();
  const quota = estimate.quota || 0;
  const usage = estimate.usage || 0;

  return {
    quota,
    usage,
    available: quota - usage,
    percentUsed: quota > 0 ? (usage / quota) * 100 : 0,
  };
}
