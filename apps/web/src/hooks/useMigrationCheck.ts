import { useEffect, useState } from 'react';
import { isStaleCode } from '@fluxby/database';

export type MigrationCheckResult = {
  pendingCount: number;
  isChecking: boolean;
  isStale: boolean;
};

/**
 * Hook to check if migrations were just applied OR if we're running stale code.
 *
 * Two scenarios trigger the migration prompt:
 * 1. Migrations were applied (new code ran) - need to refresh to load new UI
 * 2. Stale code detected (old cached code running) - need to force refresh to get new code
 */
export function useMigrationCheck(): MigrationCheckResult {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isChecking, setIsChecking] = useState(true);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkMigrations() {
      try {
        // First, check if we're running stale/cached code
        // This happens when old JS is served from cache but DB was already migrated
        const staleCode = isStaleCode();
        if (staleCode) {
          if (mounted) {
            setIsStale(true);
            setPendingCount(1); // Signal that we need to refresh
            setIsChecking(false);
          }
          return;
        }

        // Check if migrations were just applied (flag set during db init)
        const migrationsApplied = localStorage.getItem(
          'fluxby-migrations-applied'
        );

        if (migrationsApplied === 'true') {
          // Migrations were applied, show prompt
          if (mounted) {
            setPendingCount(1); // Signal that we need to refresh
            setIsChecking(false);
          }
        } else {
          // No migrations applied
          if (mounted) {
            setPendingCount(0);
            setIsChecking(false);
          }
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

  return { pendingCount, isChecking, isStale };
}
