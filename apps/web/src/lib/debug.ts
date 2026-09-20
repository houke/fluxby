/** Development-only logging for the browser UI. */
export function isLocalDebugEnvironment(): boolean {
  if (import.meta.env.DEV) return true;

  if (typeof window === 'undefined') return false;

  return '__TAURI__' in window;
}

export function debugLog(...args: unknown[]): void {
  if (!isLocalDebugEnvironment()) return;
  // eslint-disable-next-line no-console
  console.log(...args);
}

export function debugWarn(...args: unknown[]): void {
  if (!isLocalDebugEnvironment()) return;
  console.warn(...args);
}
