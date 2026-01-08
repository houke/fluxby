import { isTauri } from './environment.js';

/**
 * Check if debug logging is enabled
 */
export function isDebugEnabled(): boolean {
  try {
    // Always enable logging in Tauri for debugging
    if (isTauri()) return true;

    // Only log when explicitly enabled by developers
    // (keeps production/dev console clean and reduces incidental overhead)
    if (typeof window !== 'undefined') {
      const ls = (globalThis as any)?.localStorage as Storage | undefined;
      return ls?.getItem('fluxby.wasmDebug') === 'true';
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Log message if debug is enabled
 */
export function dbLog(message: string, ...args: unknown[]) {
  if (!isDebugEnabled()) return;
  // eslint-disable-next-line no-console
  console.log(`[database] ${message}`, ...args);
}

/**
 * Log error message (always logged)
 */
export function dbError(message: string, ...args: unknown[]) {
  console.error(`[database] ERROR: ${message}`, ...args);
}
