import { useEffect, useState } from 'react';
import { useDatabase } from '@/contexts/DatabaseContext';

/**
 * Hook to check for pending migrations on app mount
 * Returns the count of pending migrations
 */
export function useMigrationCheck() {
  const { db } = useDatabase();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkMigrations() {
      if (!db) {
        setIsChecking(false);
        return;
      }

      try {
        const count = await db.checkPendingMigrations();
        if (mounted) {
          setPendingCount(count);
          setIsChecking(false);
        }
      } catch (error) {
        console.error('Failed to check migrations:', error);
        if (mounted) {
          setIsChecking(false);
        }
      }
    }

    checkMigrations();

    return () => {
      mounted = false;
    };
  }, [db]);

  return { pendingCount, isChecking };
}
