import { useState, useCallback, type ReactNode } from 'react';
import { MigrationPrompt } from './MigrationPrompt';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();

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
        {/* Show loading spinner with consistent styling while checking */}
        {isChecking && (
          <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'>
            <div className='mx-4 w-full max-w-md rounded-lg border bg-card p-8 shadow-lg'>
              <div className='flex flex-col items-center text-center'>
                {/* Loading spinner */}
                <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30'>
                  <Loader2 className='h-8 w-8 animate-spin text-purple-600 dark:text-purple-400' />
                </div>

                {/* Title */}
                <h2 className='mb-2 text-xl font-semibold'>
                  {t.common?.loading || 'Loading...'}
                </h2>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
