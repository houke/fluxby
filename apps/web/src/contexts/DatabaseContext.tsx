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

// Check if we're in development mode OR Tauri (always log in Tauri for debugging)
const isDev =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    '__TAURI__' in window);

// Dev mode logger - always log in Tauri for debugging
function devLog(message: string, ...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log(`[DB Init] ${message}`, ...args);
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

// Module-level tracking for initialization - persists across React StrictMode remounts
// This is critical because React's useRef resets on StrictMode unmount/remount,
// but the database factory's promises persist, causing a mismatch
let moduleInitStarted = false;
let moduleInitPromise: Promise<Database> | null = null;
let moduleInitError: Error | null = null;

// Reset module state (for testing or error recovery)
export function resetModuleInitState() {
  moduleInitStarted = false;
  moduleInitPromise = null;
  moduleInitError = null;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const { t, language } = useLanguage();
  const { isEncryptionEnabled, isUnlocked } = useEncryption();

  // Initialize state from existing database if available
  const existingDb = getDatabaseInstance();
  const [db, setDb] = useState<Database | null>(existingDb);
  const [isLoading, setIsLoading] = useState(!existingDb && !moduleInitError);
  const [error, setError] = useState<Error | null>(moduleInitError);
  const [isReady, setIsReady] = useState(!!existingDb);
  const [initStatus, setInitStatus] = useState<string>('Starting...');
  const [showResetButton, setShowResetButton] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

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
    // Reset module-level state
    resetModuleInitState();
    resetDatabase(true);
    try {
      // Use the shared reset function which handles both web and Tauri
      await resetAppAndRestartOnboarding();
    } catch (e) {
      devLog('Reset error:', e);
      // Force reload anyway
      window.location.reload();
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    // Clear any previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If database already exists (from previous init or SSR), use it
    const existingDatabase = getDatabaseInstance();
    if (existingDatabase) {
      devLog('Using existing database instance');
      setDb(existingDatabase);
      setGlobalDatabase(existingDatabase);
      setIsReady(true);
      setIsLoading(false);
      return;
    }

    // If there was a previous error at module level, show it
    if (moduleInitError) {
      devLog('Previous initialization failed:', moduleInitError);
      setError(moduleInitError);
      setIsLoading(false);
      setShowResetButton(true);
      return;
    }

    // If password protection is enabled but not unlocked, wait
    if (isEncryptionEnabled && !isUnlocked) {
      devLog('Waiting for unlock...');
      setInitStatus('Waiting for unlock...');
      setIsLoading(false);
      setIsReady(false);
      return;
    }

    // If init is already in progress at module level, wait for it
    if (moduleInitPromise) {
      devLog('Waiting for existing initialization promise...');
      setInitStatus('Connecting to database...');

      moduleInitPromise
        .then((database) => {
          if (mountedRef.current) {
            devLog('Existing initialization succeeded');
            setDb(database);
            setGlobalDatabase(database);
            setIsReady(true);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (mountedRef.current) {
            devLog('Existing initialization failed:', err);
            setError(err instanceof Error ? err : new Error(String(err)));
            setIsLoading(false);
            setShowResetButton(true);
          }
        });
      return;
    }

    // Start new initialization (only happens once at module level)
    if (moduleInitStarted) {
      devLog('Init already started but no promise/database - checking again');
      // Re-check in case getDatabaseInstance was updated
      const recheckDb = getDatabaseInstance();
      if (recheckDb) {
        setDb(recheckDb);
        setGlobalDatabase(recheckDb);
        setIsReady(true);
        setIsLoading(false);
      }
      return;
    }

    devLog('Starting new database initialization...');
    moduleInitStarted = true;
    setInitStatus('Loading database...');
    setIsLoading(true);

    // Show reset button after 15 seconds
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        devLog('Showing reset button (timeout)');
        setShowResetButton(true);
      }
    }, 15000);

    // Create the initialization promise with timeout
    const initWithTimeout = async (): Promise<Database> => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error('Database initialization timed out after 45 seconds')
          );
        }, 45000);
      });

      const dbPromise = createDatabase({
        dbPath: 'fluxby.db',
        autoMigrate: true,
      });

      return Promise.race([dbPromise, timeoutPromise]);
    };

    // Store promise at module level so other mounts can wait for it
    moduleInitPromise = initWithTimeout();

    moduleInitPromise
      .then((database) => {
        moduleInitPromise = null; // Clear promise on success

        if (mountedRef.current) {
          devLog('Database initialization complete');
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setDb(database);
          setGlobalDatabase(database);
          setIsReady(true);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        moduleInitError = err instanceof Error ? err : new Error(String(err));
        moduleInitPromise = null;
        resetDatabase(true);

        if (mountedRef.current) {
          devLog('Database initialization failed:', err);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setError(moduleInitError);
          setIsLoading(false);
          setShowResetButton(true);
        }
      });

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // NOTE: Do NOT reset moduleInitStarted here - it must persist across StrictMode remounts
    };
  }, [isEncryptionEnabled, isUnlocked]);

  // Check if we're in Tauri
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

  // Debug: log state changes in Tauri
  if (isTauri) {
    devLog('DatabaseProvider state:', {
      isLoading,
      isReady,
      hasError: !!error,
      hasDb: !!db,
      isEncryptionEnabled,
      isUnlocked,
      isWaitingForUnlock: isEncryptionEnabled && !isUnlocked,
    });
  }

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

            {/* Always show init status in Tauri or dev mode */}
            {(isDev || isTauri) && (
              <p className='mt-2 font-mono text-xs text-muted-foreground'>
                {initStatus}
              </p>
            )}

            {/* Show environment info in Tauri */}
            {isTauri && (
              <p className='mt-1 font-mono text-xs text-purple-500'>
                Environment: Tauri
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
    // Always show technical error details in Tauri for debugging
    const isDevelopment =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        '__TAURI__' in window);

    return (
      <DatabaseErrorScreen error={error} isDevelopment={isDevelopment} t={t} />
    );
  }

  // Safety check: if not loading, no error, but also not ready, something went wrong
  // EXCEPT if we're waiting for password unlock - that's a valid state where db is null
  const isWaitingForUnlock = isEncryptionEnabled && !isUnlocked;
  if (!isLoading && !error && !isReady && !db && !isWaitingForUnlock) {
    devLog('WARNING: Database initialization completed but db is null');
    return (
      <DatabaseErrorScreen
        error={
          new Error(
            'Database initialization completed but database is null. This may indicate a silent failure in the database layer.'
          )
        }
        isDevelopment={true}
        t={t}
      />
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
