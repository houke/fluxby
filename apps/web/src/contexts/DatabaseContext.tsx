/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import {
  createDatabase,
  getDatabaseInstance,
  getDbPromise,
  resetDatabase,
  type Database,
} from '@fluxby/database';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { createDataService, type DataService } from '@/lib/data-service';
import { setGlobalDatabase } from '@/lib/db-singleton';
import { Button } from '@/components/ui/button';
import { useEncryption } from './EncryptionContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { resetAppAndRestartOnboarding } from '@/lib/database-reset';

// Check if we're in development mode
const isDev =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');

// Dev mode logger
function devLog(message: string, ...args: unknown[]) {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(`[DB Init] ${message}`, ...args);
  }
}

interface DatabaseContextType {
  db: Database | null;
  dataService: DataService | null;
  isLoading: boolean;
  error: Error | null;
  isReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}

/**
 * Hook to access the data service for performing database operations
 */
export function useDataService(): DataService {
  const { dataService, isReady } = useDatabase();
  if (!isReady || !dataService) {
    throw new Error('Database not ready. Use within DatabaseProvider.');
  }
  return dataService;
}

interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const { t, language } = useLanguage();
  const { isEncryptionEnabled, isUnlocked } = useEncryption();
  const [db, setDb] = useState<Database | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [initStatus, setInitStatus] = useState<string>('Starting...');
  const [showResetButton, setShowResetButton] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create data service when db is ready
  const dataService = useMemo(() => {
    if (!db) return null;
    // Set global database instance for use outside of React context
    setGlobalDatabase(db);
    return createDataService(db);
  }, [db]);

  // Helper to clear all storage and reload
  const handleResetDatabase = async () => {
    devLog('User requested database reset');
    setInitStatus('Resetting database...');
    try {
      // Use the shared reset function which handles both web and Tauri
      await resetAppAndRestartOnboarding();
    } catch (e) {
      devLog('Reset error:', e);
      // Force reload anyway
      window.location.reload();
    }
  };

  // Track if initialization has started to prevent React StrictMode double-invoke
  const initStartedRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization from React StrictMode
    if (initStartedRef.current) {
      devLog('Skipping duplicate init (StrictMode)');
      // The first init may still be in progress - wait for its promise
      const existingPromise = getDbPromise();
      if (existingPromise && typeof existingPromise.then === 'function') {
        devLog('Found existing init promise, waiting for it...');
        existingPromise
          .then((database) => {
            devLog('Existing init completed, using database');
            // Set global BEFORE React state, so other components can use it immediately
            setGlobalDatabase(database);
            setDb(database);
            setIsReady(true);
            setIsLoading(false);
          })
          .catch((err) => {
            devLog('Existing init failed:', err);
            setError(
              err instanceof Error ? err : new Error('Database init failed')
            );
            setIsLoading(false);
          });
      } else {
        // Check if already done (sync case)
        const existingDb = getDatabaseInstance();
        if (existingDb) {
          devLog('Found existing database instance, using it');
          // Set global BEFORE React state, so other components can use it immediately
          setGlobalDatabase(existingDb);
          setDb(existingDb);
          setIsReady(true);
          setIsLoading(false);
        } else if (existingPromise) {
          // existingPromise exists but is not a valid Promise - this is a bug
          devLog('Invalid existing promise detected, resetting');
          resetDatabase(true);
          initStartedRef.current = false;
        }
      }
      return;
    }
    initStartedRef.current = true;

    let mounted = true;

    // Set timeout to show reset button after 30 seconds
    timeoutRef.current = setTimeout(() => {
      if (mounted && isLoading) {
        devLog('Timeout reached, showing reset button');
        setShowResetButton(true);
      }
    }, 30000);

    async function initDatabase() {
      // If password protection is enabled but we're not unlocked yet, wait
      if (isEncryptionEnabled && !isUnlocked) {
        setInitStatus('Waiting for unlock...');
        // Do not block the UI with the database loading screen here.
        // The password screen (LockScreen) lives higher up in the tree and must be visible
        // so the user can unlock.
        if (mounted) {
          setIsLoading(false);
          setIsReady(false);
        }

        // Allow initialization to retry when unlocked.
        initStartedRef.current = false;
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        devLog('Starting database initialization...');
        setInitStatus('Checking browser capabilities...');

        // Check for required APIs
        const hasOPFS =
          'storage' in navigator && 'getDirectory' in navigator.storage;
        const hasIndexedDB = 'indexedDB' in window;
        devLog('OPFS available:', hasOPFS);
        devLog('IndexedDB available:', hasIndexedDB);

        setInitStatus('Loading SQLite WASM...');
        devLog('Creating database...');

        // Database is NOT encrypted - password only protects UI
        const database = await createDatabase({
          dbPath: 'fluxby.db',
          autoMigrate: true,
        });

        devLog('Database created successfully');
        if (mounted) {
          // Clear timeout since we succeeded
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          // Set global BEFORE React state, so other components can use it immediately
          setGlobalDatabase(database);
          setDb(database);
          setIsReady(true);
        }
      } catch (err) {
        console.error('Failed to initialize database:', err);
        devLog('Database initialization failed:', err);
        if (mounted) {
          setError(
            err instanceof Error
              ? err
              : new Error('Database initialization failed')
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initDatabase();

    return () => {
      mounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // NOTE: Do NOT close database on unmount - it's a singleton that persists
      // across React StrictMode remounts. Closing it would corrupt the cached instance.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEncryptionEnabled, isUnlocked]);

  // Show loading screen while database initializes
  if (isLoading) {
    return (
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

            {/* Description */}
            <p className='text-muted-foreground'>
              {t.common?.initializingDatabase || 'Initializing database...'}
            </p>

            {/* Dev mode: Show init status */}
            {isDev && (
              <p className='mt-2 font-mono text-xs text-muted-foreground'>
                {initStatus}
              </p>
            )}

            {/* Reset button after timeout */}
            {showResetButton && (
              <div className='mt-6 space-y-2'>
                <p className='text-sm text-amber-600 dark:text-amber-400'>
                  {language === 'nl'
                    ? 'Dit duurt langer dan verwacht...'
                    : 'This is taking longer than expected...'}
                </p>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleResetDatabase}
                  className='gap-2'
                >
                  <RefreshCw className='h-4 w-4' />
                  {language === 'nl' ? 'Database resetten' : 'Reset database'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show error screen if database failed to initialize
  if (error) {
    // Only show technical error details in development mode
    const isDevelopment =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1');

    return (
      <DatabaseErrorScreen error={error} isDevelopment={isDevelopment} t={t} />
    );
  }

  return (
    <DatabaseContext.Provider
      value={{ db, dataService, isLoading, error, isReady }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

/**
 * Database error screen component with confirmation dialog
 */
function DatabaseErrorScreen({
  error,
  isDevelopment,
  t,
}: {
  error: Error;
  isDevelopment: boolean;
  t: ReturnType<typeof useLanguage>['t'];
}) {
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetAppAndRestartOnboarding();
    } finally {
      // In practice we reload; this is just for completeness
      setIsResetting(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'>
      <div className='mx-4 w-full max-w-md rounded-lg border bg-card p-8 shadow-lg'>
        <div className='flex flex-col items-center text-center'>
          {/* Error icon */}
          <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10'>
            <span className='text-2xl'>⚠️</span>
          </div>

          {/* Title */}
          <h2 className='mb-2 text-xl font-semibold'>
            {t.errors?.databaseError || 'Database fout'}
          </h2>

          {/* Description */}
          <p className='mb-4 text-muted-foreground'>
            {t.errors?.databaseErrorDescription ||
              'Er is een fout opgetreden bij het initialiseren van de database.'}
          </p>

          {/* Error details - only in development */}
          {isDevelopment && (
            <p className='mb-6 rounded bg-muted p-2 text-sm text-destructive'>
              {error.message}
            </p>
          )}

          {/* Action buttons */}
          <div className='flex gap-3'>
            <button
              onClick={() => window.location.reload()}
              className='rounded-lg bg-muted px-4 py-2 font-medium transition-colors hover:bg-muted/80'
            >
              {t.common?.retry || 'Opnieuw proberen'}
            </button>

            <Dialog
              open={isResetDialogOpen}
              onOpenChange={setIsResetDialogOpen}
            >
              <DialogTrigger asChild>
                <button className='rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700'>
                  {t.errors?.resetDatabase || 'Reset database'}
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {t.security?.forgotPasswordDialogTitle ||
                      'Reset your local data?'}
                  </DialogTitle>
                  <DialogDescription>
                    {t.security?.forgotPasswordDialogDescription ||
                      'Resetting will delete your local database and restart onboarding. This action cannot be undone.'}
                  </DialogDescription>
                </DialogHeader>

                <div className='flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4'>
                  <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-destructive' />
                  <p className='text-sm text-foreground'>
                    {t.security?.forgotPasswordDialogWarning ||
                      'This action cannot be undone.'}
                  </p>
                </div>

                <DialogFooter>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setIsResetDialogOpen(false)}
                    disabled={isResetting}
                  >
                    {t.common?.cancel || 'Cancel'}
                  </Button>
                  <Button
                    type='button'
                    variant='destructive'
                    onClick={handleReset}
                    disabled={isResetting}
                  >
                    {isResetting
                      ? t.common?.loading || 'Loading...'
                      : t.errors?.resetDatabase || 'Reset database'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
