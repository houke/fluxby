import { useEffect, useState } from 'react';

/**
 * Hook to check if migrations were just applied
 * Checks localStorage flag set during database initialization
 */
export function useMigrationCheck() {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkMigrations() {
      try {
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

  return { pendingCount, isChecking };
}
