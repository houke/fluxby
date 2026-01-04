/**
 * Database Reset Utility
 *
 * Provides functions to clear corrupted database state and force re-initialization.
 * Useful for recovering from WASM memory errors or database corruption.
 */

import {
  clearAllOPFSSettings,
  clearSettingsCache,
  writeToOPFSWithCache,
} from '@fluxby/database';

/**
 * Clear all OPFS database files
 * This will force a complete database re-initialization on next load
 */
export async function clearOPFSDatabase(): Promise<void> {
  if (typeof navigator === 'undefined' || !('storage' in navigator)) {
    throw new Error('OPFS not available in this environment');
  }

  try {
    // Clear ALL OPFS storage - enumerate and remove everything
    if ('getDirectory' in navigator.storage) {
      const root = await navigator.storage.getDirectory();

      // Enumerate ALL entries in OPFS root and delete them
      // This ensures we catch any VFS directories regardless of naming
      const entries: string[] = [];
      try {
        // @ts-expect-error - entries() is not in TypeScript types but exists in browsers
        for await (const [name] of root.entries()) {
          entries.push(name);
        }
        // eslint-disable-next-line no-console
        console.log(`Found ${entries.length} OPFS entries:`, entries);
        for (const name of entries) {
          try {
            await root.removeEntry(name, { recursive: true });
            // eslint-disable-next-line no-console
            console.log(`Deleted OPFS entry: ${name}`);
          } catch (e) {
            console.warn(`Failed to delete OPFS entry ${name}:`, e);
          }
        }
      } catch (e) {
        console.warn('Could not enumerate OPFS entries:', e);
      }
    }

    // Clear IndexedDB databases used by wa-sqlite
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      if (
        db.name &&
        (db.name.includes('fluxby') || db.name.includes('sqlite'))
      ) {
        indexedDB.deleteDatabase(db.name);
        // eslint-disable-next-line no-console
        console.log(`Deleted IndexedDB: ${db.name}`);
      }
    }

    // eslint-disable-next-line no-console
    console.log('Database cleared successfully');
  } catch (error) {
    console.error('Failed to clear database:', error);
    throw error;
  }
}

/**
 * Clear all app data including localStorage, OPFS settings, and database
 * WARNING: This will delete ALL user data
 */
export async function clearAllAppData(): Promise<void> {
  // Clear localStorage
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key?.startsWith('fluxby.') ||
      key?.startsWith('fluxby-') ||
      key?.startsWith('finance')
    ) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
  // eslint-disable-next-line no-console
  console.log('Cleared localStorage');

  // Clear sessionStorage
  sessionStorage.clear();
  // eslint-disable-next-line no-console
  console.log('Cleared sessionStorage');

  // Clear OPFS settings (password, language, profile, etc.)
  try {
    clearSettingsCache();
    await clearAllOPFSSettings();
    // eslint-disable-next-line no-console
    console.log('Cleared OPFS settings');
  } catch (error) {
    console.warn('Failed to clear OPFS settings:', error);
  }

  // Clear database
  await clearOPFSDatabase();
}

/**
 * Reset all local app data and restart the onboarding/security setup flow.
 *
 * This is used when a user forgot their master password. There is no password
 * recovery, so we must wipe the local database and start fresh.
 */
export async function resetAppAndRestartOnboarding(): Promise<void> {
  // Best-effort cleanup: if anything fails, we still reload.
  try {
    // Unregister service workers to avoid cached stale state.
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
  } catch {
    // ignore
  }

  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
  } catch {
    // ignore
  }

  try {
    await clearAllAppData();
  } catch {
    // ignore
  }

  // Explicitly clear password protection state to ensure clean restart
  // This runs AFTER clearAllAppData in case it failed
  // Note: These keys are now stored in OPFS, but we clear localStorage too for cleanup
  try {
    localStorage.removeItem('fluxby.passwordHash');
    localStorage.removeItem('fluxby.passwordSalt');
    localStorage.removeItem('fluxby.wrappedKey');
    localStorage.removeItem('fluxby.encryptionEnabled');
    localStorage.removeItem('fluxby-onboarding-state');
    localStorage.removeItem('fluxby-db-fatal');
  } catch {
    // ignore
  }

  try {
    // Ensure onboarding starts immediately after reload.
    await writeToOPFSWithCache('fluxby-onboarding-restart', true);
  } catch {
    // ignore
  }

  // Small delay to ensure async operations complete before reload
  await new Promise((resolve) => setTimeout(resolve, 100));

  window.location.reload();
}

/**
 * Add a database reset button to the page (for debugging)
 * This will add a floating button in the bottom-left corner
 */
export function addDatabaseResetButton(): void {
  if (typeof document === 'undefined') return;

  const button = document.createElement('button');
  button.textContent = '🔄 Reset DB';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 9999;
    padding: 8px 16px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;

  button.onclick = async () => {
    if (
      confirm('⚠️ This will delete ALL app data and reload the page. Continue?')
    ) {
      try {
        await clearAllAppData();
        alert('✅ Database cleared. Page will reload.');
        window.location.reload();
      } catch (error) {
        alert(
          `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  };

  document.body.appendChild(button);
}

// Automatically add reset button in development mode
if (import.meta.env.DEV) {
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      // Add button if URL has ?reset-db query param
      if (window.location.search.includes('reset-db')) {
        addDatabaseResetButton();
      }
    });
  }
}
