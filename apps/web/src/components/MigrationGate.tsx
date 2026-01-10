import { useState, useCallback, type ReactNode } from 'react';
import { MigrationPrompt } from './MigrationPrompt';
import { Loader2 } from 'lucide-react';

interface MigrationGateProps {
  children: ReactNode;
}

/**
 * Gate component that checks for pending migrations BEFORE the database initializes.
 *
 * This prevents race conditions where the user visits a page that queries tables
 * that don't exist yet (because the new migration hasn't run).
 *
 * Flow:
 * 1. Show MigrationPrompt (which checks localStorage for version mismatch)
 * 2. If migrations needed: show prompt, user clicks update, page refreshes
 * 3. If stale code detected: auto-refresh to get new code
 * 4. If all good: render children (which includes DatabaseProvider)
 */
export function MigrationGate({ children }: MigrationGateProps) {
  const [isReady, setIsReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const handleComplete = useCallback(() => {
    setIsChecking(false);
    setIsReady(true);
  }, []);

  const handleChecking = useCallback((checking: boolean) => {
    setIsChecking(checking);
  }, []);

  // Always render MigrationPrompt first - it will call onComplete
  // when migrations are up to date, allowing children to render
  if (!isReady) {
    return (
      <>
        <MigrationPrompt
          onComplete={handleComplete}
          onCheckingChange={handleChecking}
        />
        {/* Show loading spinner while checking (MigrationPrompt returns null during check) */}
        {isChecking && (
          <div className='flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900'>
            <Loader2 className='h-8 w-8 animate-spin text-purple-600 dark:text-purple-400' />
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
