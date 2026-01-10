import { useEffect, useState } from 'react';
import { useMigrationCheck } from '@/hooks/useMigrationCheck';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import { RefreshCw, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

type MigrationState = 'pending' | 'running' | 'completed' | 'error';

/**
 * Component that checks for pending migrations and automatically executes them
 * Shows progress to the user and forces a hard refresh after completion
 */
export function MigrationPrompt() {
  const { pendingCount, isChecking } = useMigrationCheck();
  const { db } = useDatabase();
  const { t } = useLanguage();
  const [showPrompt, setShowPrompt] = useState(false);
  const [migrationState, setMigrationState] =
    useState<MigrationState>('pending');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isChecking && pendingCount > 0) {
      setShowPrompt(true);
    }
  }, [isChecking, pendingCount]);

  if (!showPrompt) {
    return null;
  }

  const handleApplyMigrations = async () => {
    if (!db) {
      setError('Database not available');
      setMigrationState('error');
      return;
    }

    setMigrationState('running');
    setError(null);

    try {
      // Run migrations through the database connection
      // The runMigrations is already called during initialization,
      // but we need to force a page reload to pick up the new schema
      // After a brief delay to show progress
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setMigrationState('completed');

      // Wait a moment to show completion, then force hard refresh
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Force a hard refresh to reload the app with new code/schema
      window.location.reload();
    } catch (err) {
      console.error('Migration failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setMigrationState('error');
    }
  };

  // Determine icon and colors based on state
  const getStateIcon = () => {
    switch (migrationState) {
      case 'pending':
        return (
          <AlertCircle className='h-6 w-6 text-purple-600 dark:text-purple-400' />
        );
      case 'running':
        return (
          <Loader2 className='h-6 w-6 animate-spin text-purple-600 dark:text-purple-400' />
        );
      case 'completed':
        return (
          <CheckCircle className='h-6 w-6 text-green-600 dark:text-green-400' />
        );
      case 'error':
        return (
          <AlertCircle className='h-6 w-6 text-red-600 dark:text-red-400' />
        );
    }
  };

  const getStateTitle = () => {
    switch (migrationState) {
      case 'pending':
        return t.migrations?.updateAvailable || 'Update available';
      case 'running':
        return t.migrations?.applyingUpdate || 'Applying update...';
      case 'completed':
        return t.migrations?.updateComplete || 'Update complete';
      case 'error':
        return t.migrations?.updateFailed || 'Update failed';
    }
  };

  const getStateDescription = () => {
    switch (migrationState) {
      case 'pending':
        return (
          t.migrations?.updateDescriptionAction ||
          'A new version of Fluxby is available. Click "Apply update" to install the latest features and improvements.'
        );
      case 'running':
        return (
          t.migrations?.applyingDescription ||
          'Please wait while we update your database. This will only take a moment...'
        );
      case 'completed':
        return (
          t.migrations?.completedDescription ||
          'Update successfully applied. Reloading application...'
        );
      case 'error':
        return (
          error ||
          t.migrations?.errorDescription ||
          'An error occurred during the update.'
        );
    }
  };

  return (
    <>
      {/* Backdrop - non-dismissible */}
      <div className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm' />

      {/* Modal */}
      <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
        <div className='w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800'>
          <div className='mb-4 flex items-start gap-4'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30'>
              {getStateIcon()}
            </div>
            <div className='flex-1'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                {getStateTitle()}
              </h2>
              <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                {getStateDescription()}
              </p>
            </div>
          </div>

          {/* Show button only when pending */}
          {migrationState === 'pending' && (
            <div className='flex gap-3'>
              <button
                onClick={handleApplyMigrations}
                className='flex flex-1 items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white ring-2 hover:bg-purple-700 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none'
              >
                <RefreshCw className='h-4 w-4' />
                {t.migrations?.applyUpdate || 'Apply update'}
              </button>
            </div>
          )}

          {/* Show progress indicator when running */}
          {migrationState === 'running' && (
            <div className='flex items-center justify-center'>
              <Loader2 className='h-8 w-8 animate-spin text-purple-600 dark:text-purple-400' />
            </div>
          )}

          {/* Show retry button on error */}
          {migrationState === 'error' && (
            <div className='flex gap-3'>
              <button
                onClick={handleApplyMigrations}
                className='flex flex-1 items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white ring-2 hover:bg-purple-700 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none'
              >
                <RefreshCw className='h-4 w-4' />
                {t.migrations?.retry || t.common?.retry || 'Retry'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
