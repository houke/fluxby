/**
 * React Hook for OPFS Settings
 *
 * Provides a React-friendly interface for OPFS settings storage
 * with proper state management and async handling.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  readFromOPFS,
  readFromOPFSSync,
  writeToOPFSWithCache,
  deleteFromOPFSWithCache,
  isSettingsCacheInitialized,
} from '@fluxby/database';

/**
 * Hook for managing a single OPFS setting
 * Uses sync cache for initial value, async operations for updates
 *
 * @param key - The setting key
 * @param defaultValue - Default value if not found
 */
export function useOPFSSetting<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => Promise<void>, () => Promise<void>, boolean] {
  // Initialize from sync cache if available
  const [value, setValue] = useState<T>(() => {
    if (isSettingsCacheInitialized()) {
      const cached = readFromOPFSSync<T>(key);
      return cached ?? defaultValue;
    }
    return defaultValue;
  });

  const [isLoading, setIsLoading] = useState(!isSettingsCacheInitialized());
  const mountedRef = useRef(true);

  // Load from OPFS on mount if cache wasn't initialized
  useEffect(() => {
    mountedRef.current = true;

    if (!isSettingsCacheInitialized()) {
      readFromOPFS<T>(key)
        .then((stored) => {
          if (mountedRef.current && stored !== null) {
            setValue(stored);
          }
        })
        .finally(() => {
          if (mountedRef.current) {
            setIsLoading(false);
          }
        });
    }

    return () => {
      mountedRef.current = false;
    };
  }, [key]);

  // Update function
  const update = useCallback(
    async (newValue: T) => {
      setValue(newValue);
      await writeToOPFSWithCache(key, newValue);
    },
    [key]
  );

  // Remove function
  const remove = useCallback(async () => {
    setValue(defaultValue);
    await deleteFromOPFSWithCache(key);
  }, [key, defaultValue]);

  return [value, update, remove, isLoading];
}

/**
 * Check if OPFS is available in the current environment
 */
export function isOPFSAvailable(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'storage' in navigator &&
    'getDirectory' in navigator.storage
  );
}

/**
 * Helper to get a sync initial value for a setting
 * Falls back to defaultValue if cache not initialized or value not found
 */
export function getInitialOPFSSetting<T>(key: string, defaultValue: T): T {
  if (isSettingsCacheInitialized()) {
    const cached = readFromOPFSSync<T>(key);
    return cached ?? defaultValue;
  }
  return defaultValue;
}
