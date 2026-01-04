/**
 * OPFS Settings Storage
 *
 * Provides utility functions for storing app settings in OPFS instead of localStorage.
 * This ensures settings persist even if browser localStorage is cleared.
 *
 * Settings are stored as JSON files in a dedicated 'settings' directory within OPFS.
 */

const SETTINGS_DIR = 'fluxby-settings';

/**
 * Get the OPFS settings directory handle
 * Creates the directory if it doesn't exist
 */
async function getSettingsDirectory(): Promise<FileSystemDirectoryHandle> {
  if (typeof navigator === 'undefined' || !('storage' in navigator)) {
    throw new Error('OPFS not available in this environment');
  }

  const root = await navigator.storage.getDirectory();
  return await root.getDirectoryHandle(SETTINGS_DIR, { create: true });
}

/**
 * Write a value to OPFS settings storage
 * @param key - The setting key (used as filename)
 * @param value - The value to store (will be JSON serialized)
 */
export async function writeToOPFS<T>(key: string, value: T): Promise<void> {
  try {
    const dir = await getSettingsDirectory();
    const filename = `${key}.json`;
    const fileHandle = await dir.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    const data = JSON.stringify(value);
    await writable.write(data);
    await writable.close();
  } catch (error) {
    console.error(`Failed to write OPFS setting "${key}":`, error);
    throw error;
  }
}

/**
 * Read a value from OPFS settings storage
 * @param key - The setting key (used as filename)
 * @returns The stored value, or null if not found
 */
export async function readFromOPFS<T>(key: string): Promise<T | null> {
  try {
    const dir = await getSettingsDirectory();
    const filename = `${key}.json`;
    const fileHandle = await dir.getFileHandle(filename);
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text) as T;
  } catch (error) {
    // File doesn't exist or other error
    if (
      error instanceof Error &&
      (error.name === 'NotFoundError' ||
        error.message.includes('could not be found'))
    ) {
      return null;
    }
    console.error(`Failed to read OPFS setting "${key}":`, error);
    return null;
  }
}

/**
 * Delete a value from OPFS settings storage
 * @param key - The setting key (used as filename)
 */
export async function deleteFromOPFS(key: string): Promise<void> {
  try {
    const dir = await getSettingsDirectory();
    const filename = `${key}.json`;
    await dir.removeEntry(filename);
  } catch (error) {
    // Ignore if file doesn't exist
    if (
      error instanceof Error &&
      (error.name === 'NotFoundError' ||
        error.message.includes('could not be found'))
    ) {
      return;
    }
    console.error(`Failed to delete OPFS setting "${key}":`, error);
    throw error;
  }
}

/**
 * Check if a setting exists in OPFS storage
 * @param key - The setting key (used as filename)
 */
export async function existsInOPFS(key: string): Promise<boolean> {
  try {
    const dir = await getSettingsDirectory();
    const filename = `${key}.json`;
    await dir.getFileHandle(filename);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear all OPFS settings
 * Used during app reset/data clearing
 */
export async function clearAllOPFSSettings(): Promise<void> {
  try {
    if (typeof navigator === 'undefined' || !('storage' in navigator)) {
      return;
    }

    const root = await navigator.storage.getDirectory();

    try {
      await root.removeEntry(SETTINGS_DIR, { recursive: true });
      // eslint-disable-next-line no-console
      console.log('Cleared all OPFS settings');
    } catch (error) {
      // Directory might not exist
      if (
        error instanceof Error &&
        (error.name === 'NotFoundError' ||
          error.message.includes('could not be found'))
      ) {
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error('Failed to clear OPFS settings:', error);
    throw error;
  }
}

/**
 * List all setting keys stored in OPFS
 * Useful for debugging
 */
export async function listOPFSSettings(): Promise<string[]> {
  try {
    const dir = await getSettingsDirectory();
    const keys: string[] = [];

    // @ts-expect-error - entries() is not in TypeScript types but exists in browsers
    for await (const [name, handle] of dir.entries()) {
      if (handle.kind === 'file' && name.endsWith('.json')) {
        keys.push(name.replace('.json', ''));
      }
    }

    return keys;
  } catch (error) {
    console.error('Failed to list OPFS settings:', error);
    return [];
  }
}

// ========================================
// Synchronous In-Memory Cache with Async Persistence
// ========================================

/**
 * In-memory cache for synchronous reads while OPFS loads
 * This allows components to read settings synchronously during initial render
 */
const settingsCache = new Map<string, unknown>();
let cacheInitialized = false;
let cacheInitPromise: Promise<void> | null = null;

/**
 * Initialize the settings cache by loading all settings from OPFS
 * Should be called early in app initialization
 */
export async function initializeSettingsCache(): Promise<void> {
  if (cacheInitialized) return;

  if (cacheInitPromise) {
    return cacheInitPromise;
  }

  cacheInitPromise = (async () => {
    try {
      const keys = await listOPFSSettings();
      for (const key of keys) {
        const value = await readFromOPFS(key);
        if (value !== null) {
          settingsCache.set(key, value);
        }
      }
      cacheInitialized = true;
    } catch (error) {
      console.error('Failed to initialize settings cache:', error);
      // Mark as initialized anyway to prevent infinite loading
      cacheInitialized = true;
    }
  })();

  return cacheInitPromise;
}

/**
 * Check if the settings cache has been initialized
 */
export function isSettingsCacheInitialized(): boolean {
  return cacheInitialized;
}

/**
 * Read a setting synchronously from cache
 * Returns null if not cached or cache not initialized
 * Use this for initial render, then use async version for fresh data
 */
export function readFromOPFSSync<T>(key: string): T | null {
  return (settingsCache.get(key) as T) ?? null;
}

/**
 * Write a setting to both cache and OPFS (async persistence)
 * The cache is updated immediately for synchronous reads
 */
export async function writeToOPFSWithCache<T>(
  key: string,
  value: T
): Promise<void> {
  // Update cache immediately
  settingsCache.set(key, value);

  // Persist to OPFS asynchronously
  await writeToOPFS(key, value);
}

/**
 * Delete a setting from both cache and OPFS
 */
export async function deleteFromOPFSWithCache(key: string): Promise<void> {
  // Update cache immediately
  settingsCache.delete(key);

  // Delete from OPFS asynchronously
  await deleteFromOPFS(key);
}

/**
 * Clear the settings cache
 * Used during app reset
 */
export function clearSettingsCache(): void {
  settingsCache.clear();
  cacheInitialized = false;
  cacheInitPromise = null;
}
