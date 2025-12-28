/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from './LanguageContext';

interface ApiHealthContextType {
  isApiHealthy: boolean;
  lastChecked: Date | null;
  checkHealth: () => Promise<boolean>;
}

const ApiHealthContext = createContext<ApiHealthContextType | null>(null);

export function useApiHealth() {
  const context = useContext(ApiHealthContext);
  if (!context) {
    throw new Error('useApiHealth must be used within an ApiHealthProvider');
  }
  return context;
}

interface ApiHealthProviderProps {
  children: ReactNode;
}

export function ApiHealthProvider({ children }: ApiHealthProviderProps) {
  const { t } = useLanguage();
  const [isApiHealthy, setIsApiHealthy] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const baseUrl = localStorage.getItem('finance.apiBaseUrl') || '';
      const apiUrl = baseUrl
        ? `${baseUrl.replace(/\/+$/, '')}/api/health`
        : '/api/health';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(apiUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const isHealthy = response.ok;
      setIsApiHealthy(isHealthy);
      setLastChecked(new Date());
      return isHealthy;
    } catch {
      setIsApiHealthy(false);
      setLastChecked(new Date());
      return false;
    }
  }, []);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    await checkHealth();
    setIsRetrying(false);
  }, [checkHealth]);

  // Initial health check
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Periodic health check every 10 seconds when healthy, every 5 seconds when unhealthy
  useEffect(() => {
    const interval = setInterval(
      () => {
        checkHealth();
      },
      isApiHealthy ? 30000 : 5000
    );

    return () => clearInterval(interval);
  }, [checkHealth, isApiHealthy]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      checkHealth();
    };

    const handleOffline = () => {
      setIsApiHealthy(false);
      setLastChecked(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkHealth]);

  return (
    <ApiHealthContext.Provider
      value={{ isApiHealthy, lastChecked, checkHealth }}
    >
      {children}

      {/* Full-screen overlay when API is down */}
      {!isApiHealthy && (
        <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm'>
          <div className='mx-4 w-full max-w-md rounded-lg border bg-card p-8 shadow-lg'>
            <div className='flex flex-col items-center text-center'>
              {/* Icon */}
              <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10'>
                <WifiOff className='h-8 w-8 text-destructive' />
              </div>

              {/* Title */}
              <h2 className='mb-2 text-xl font-semibold'>
                {t.common?.serverUnavailable || 'Server niet bereikbaar'}
              </h2>

              {/* Description */}
              <p className='mb-6 text-muted-foreground'>
                {t.common?.serverUnavailableDescription ||
                  'De backend server is momenteel niet bereikbaar. Controleer of de server draait en probeer opnieuw.'}
              </p>

              {/* Status indicator */}
              <div className='mb-6 flex items-center gap-2 text-sm text-muted-foreground'>
                <div className='h-2 w-2 animate-pulse rounded-full bg-destructive' />
                <span>
                  {t.common?.checkingConnection ||
                    'Verbinding wordt gecontroleerd...'}
                </span>
              </div>

              {/* Retry button */}
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className='w-full'
                size='lg'
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                    {t.common?.retrying || 'Opnieuw proberen...'}
                  </>
                ) : (
                  <>
                    <RefreshCw className='mr-2 h-4 w-4' />
                    {t.common?.retry || 'Opnieuw proberen'}
                  </>
                )}
              </Button>

              {/* Last checked */}
              {lastChecked && (
                <p className='mt-4 text-xs text-muted-foreground'>
                  {t.common?.lastChecked || 'Laatst gecontroleerd'}:{' '}
                  {lastChecked.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </ApiHealthContext.Provider>
  );
}
