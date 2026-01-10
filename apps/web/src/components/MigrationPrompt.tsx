import { useEffect, useState } from 'react';
import { useMigrationCheck } from '@/hooks/useMigrationCheck';
import { useLanguage } from '@/contexts/LanguageContext';
import { RefreshCw, AlertCircle } from 'lucide-react';

/**
 * Component that checks for pending migrations and shows a refresh prompt
 * if migrations are available
 */
export function MigrationPrompt() {
  const { pendingCount, isChecking } = useMigrationCheck();
  const { t } = useLanguage();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!isChecking && pendingCount > 0) {
      setShowPrompt(true);
    }
  }, [isChecking, pendingCount]);

  if (!showPrompt) {
    return null;
  }

  const handleRefresh = () => {
    // Reload the page to apply migrations
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm' />

      {/* Modal */}
      <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
        <div className='w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800'>
          <div className='mb-4 flex items-start gap-4'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30'>
              <AlertCircle className='h-6 w-6 text-purple-600 dark:text-purple-400' />
            </div>
            <div className='flex-1'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                {t.migrations?.updateAvailable || 'Update available'}
              </h2>
              <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                {t.migrations?.updateDescription ||
                  'A new version of Fluxby is available. Please refresh the page to apply updates.'}
              </p>
            </div>
          </div>

          <div className='flex gap-3'>
            <button
              onClick={handleRefresh}
              className='flex flex-1 items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white ring-2 hover:bg-purple-700 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none'
            >
              <RefreshCw className='h-4 w-4' />
              {t.migrations?.refreshNow || 'Refresh now'}
            </button>
            <button
              onClick={handleDismiss}
              className='rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 ring-2 hover:bg-gray-50 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
            >
              {t.common?.cancel || 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
