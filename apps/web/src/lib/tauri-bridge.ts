/**
 * Tauri Bridge
 * Provides unified interface for communicating with Tauri backend
 * Falls back gracefully when running in browser
 */

/**
 * Check if running inside Tauri
 */
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

// Tauri API types
interface TauriInvoke {
  <T>(cmd: string, args?: Record<string, unknown>): Promise<T>;
}

interface TauriEvent {
  listen<T>(
    event: string,
    handler: (event: { payload: T }) => void
  ): Promise<() => void>;
  emit(event: string, payload?: unknown): Promise<void>;
}

// Global Tauri interface (available when running in Tauri)
declare global {
  interface Window {
    __TAURI__?: {
      core: {
        invoke: TauriInvoke;
      };
      event: TauriEvent;
    };
  }
}

/**
 * Check if running in Tauri environment
 */
export function isRunningInTauri(): boolean {
  return isTauri();
}

/**
 * Invoke a Tauri command
 */
export async function invoke<T>(
  cmd: string,
  args?: Record<string, unknown>
): Promise<T> {
  if (!isRunningInTauri() || !window.__TAURI__) {
    throw new Error('Tauri is not available');
  }
  return window.__TAURI__.core.invoke<T>(cmd, args);
}

/**
 * Listen to a Tauri event
 */
export async function listen<T>(
  event: string,
  handler: (payload: T) => void
): Promise<() => void> {
  if (!isRunningInTauri() || !window.__TAURI__) {
    // Return a no-op unsubscribe function
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => {};
  }
  return window.__TAURI__.event.listen<T>(event, (e) => handler(e.payload));
}

/**
 * Emit a Tauri event
 */
export async function emit(event: string, payload?: unknown): Promise<void> {
  if (!isRunningInTauri() || !window.__TAURI__) {
    return;
  }
  return window.__TAURI__.event.emit(event, payload);
}

/**
 * Get app info from Tauri
 */
export async function getAppInfo(): Promise<{
  name: string;
  version: string;
  tauriVersion: string;
} | null> {
  if (!isRunningInTauri()) {
    return null;
  }
  try {
    return await invoke('get_app_info');
  } catch {
    return null;
  }
}

/**
 * Show native save dialog
 */
export async function showSaveDialog(options: {
  title?: string;
  defaultName?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}): Promise<string | null> {
  if (!isRunningInTauri()) {
    // Fallback to browser download
    return null;
  }
  const result = await invoke<string | null>('show_save_dialog', {
    options: {
      title: options.title,
      default_name: options.defaultName,
      filters: options.filters,
    },
  });
  return result;
}

/**
 * Show native open dialog
 */
export async function showOpenDialog(options: {
  title?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  multiple?: boolean;
  directory?: boolean;
}): Promise<string[] | null> {
  if (!isRunningInTauri()) {
    // Fallback to browser file picker
    return null;
  }
  return invoke<string[] | null>('show_open_dialog', { options });
}

/**
 * Setup menu event handlers
 */
export async function setupMenuHandlers(handlers: {
  onImport?: () => void;
  onExport?: () => void;
  onBackup?: () => void;
  onRestore?: () => void;
  onNavigate?: (path: string) => void;
  onShowAbout?: () => void;
}): Promise<() => void> {
  const unsubscribers: Array<() => void> = [];

  if (handlers.onImport) {
    const unsub = await listen<string>('menu-action', (action) => {
      if (action === 'import') handlers.onImport?.();
      if (action === 'export') handlers.onExport?.();
      if (action === 'backup') handlers.onBackup?.();
      if (action === 'restore') handlers.onRestore?.();
    });
    unsubscribers.push(unsub);
  }

  if (handlers.onNavigate) {
    const unsub = await listen<string>('navigate', handlers.onNavigate);
    unsubscribers.push(unsub);
  }

  if (handlers.onShowAbout) {
    const unsub = await listen<void>('show-about', handlers.onShowAbout);
    unsubscribers.push(unsub);
  }

  // Return cleanup function
  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}
