/**
 * Environment detection utilities
 */

import type { RuntimeEnvironment } from './types.js';

/**
 * Detect the current runtime environment
 */
export function detectEnvironment(): RuntimeEnvironment {
  // Check for Tauri
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    return 'tauri';
  }

  // Check for Node.js
  if (
    typeof process !== 'undefined' &&
    process.versions &&
    process.versions.node
  ) {
    return 'node';
  }

  // Default to web
  return 'web';
}

/**
 * Check if running in Tauri
 */
export function isTauri(): boolean {
  return detectEnvironment() === 'tauri';
}

/**
 * Check if running in Node.js
 */
export function isNode(): boolean {
  return detectEnvironment() === 'node';
}

/**
 * Check if running in browser
 */
export function isWeb(): boolean {
  return detectEnvironment() === 'web';
}

/**
 * Check if OPFS is available (for web storage)
 */
export async function isOPFSAvailable(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;

  try {
    const root = await navigator.storage.getDirectory();
    return root !== null;
  } catch {
    return false;
  }
}

/**
 * Check if SharedArrayBuffer is available (required for high-performance SQLite)
 */
export function isSharedArrayBufferAvailable(): boolean {
  return typeof SharedArrayBuffer !== 'undefined';
}

/**
 * Get device ID (or generate one if not exists)
 */
export function getDeviceId(): string {
  const storageKey = 'fluxby_device_id';

  if (typeof localStorage !== 'undefined') {
    let deviceId = localStorage.getItem(storageKey);
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem(storageKey, deviceId);
    }
    return deviceId;
  }

  // Fallback for Node.js - generate per session
  return crypto.randomUUID();
}
