import { useEffect, useState } from 'react';
import {
  isStaleCode,
  hasNewMigrations,
  updateCodeVersionInStorage,
} from '@fluxby/database';

export type MigrationCheckResult = {
  pendingCount: number;
  isChecking: boolean;
  isStale: boolean;
  hasNewMigrations: boolean;
};

/**
 * Hook to check migration status BEFORE database initializes.
 *
 * Three scenarios:
 * 1. Stale code - old cached JS, DB already migrated → auto-refresh
 * 2. New migrations - new JS, DB needs migration → show prompt BEFORE db init
 * 3. Up to date - code and DB versions match → proceed normally
 */
export function useMigrationCheck(): MigrationCheckResult {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isChecking, setIsChecking] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [hasPending, setHasPending] = useState(false);

  useEffect(() => {
    let mounted = true;

    function checkMigrations() {
      try {
        // Update our code version in storage immediately
        updateCodeVersionInStorage();

        // Check if we're running stale/cached code (DB ahead of code)
        const staleCode = isStaleCode();
        if (staleCode) {
          if (mounted) {
            setIsStale(true);
            setPendingCount(1);
            setIsChecking(false);
          }
          return;
        }

        // Check if there are new migrations to run (code ahead of DB)
        const newMigrations = hasNewMigrations();
        if (newMigrations) {
          if (mounted) {
            setHasPending(true);
            setPendingCount(1);
            setIsChecking(false);
          }
          return;
        }

        // All good - code and DB are in sync
        if (mounted) {
          setPendingCount(0);
          setIsChecking(false);
        }
      } catch (error) {
        console.error('Failed to check migrations:', error);
        if (mounted) {
          setPendingCount(0);
          setIsChecking(false);
        }
      }
    }

    checkMigrations();

    return () => {
      mounted = false;
    };
  }, []);

  return { pendingCount, isChecking, isStale, hasNewMigrations: hasPending };
}
