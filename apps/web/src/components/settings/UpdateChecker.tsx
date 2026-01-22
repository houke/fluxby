import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import type { Language } from '@/lib/i18n';

// Check if running in Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

// Get current app version from Vite env
const currentAppVersion =
  typeof import.meta !== 'undefined'
    ? (import.meta.env?.VITE_APP_VERSION as string | undefined)
    : undefined;

/**
 * Parse localized release notes from GitHub release body.
 * Supports two formats:
 *
 * Format 1 - HTML comments (recommended for GitHub):
 * <!-- nl -->
 * Dutch release notes...
 * <!-- /nl -->
 * <!-- en -->
 * English release notes...
 * <!-- /en -->
 *
 * Format 2 - Markdown headers:
 * ## 🇳🇱 Nederlands
 * Dutch release notes...
 *
 * ## 🇬🇧 English
 * English release notes...
 *
 * If no language markers found, returns the full body.
 */
function parseLocalizedReleaseNotes(
  body: string | undefined,
  language: Language
): string {
  if (!body) return '';

  // Try HTML comment format first (<!-- nl --> ... <!-- /nl -->)
  const commentRegex = new RegExp(
    `<!--\\s*${language}\\s*-->([\\s\\S]*?)<!--\\s*\\/${language}\\s*-->`,
    'i'
  );
  const commentMatch = body.match(commentRegex);
  if (commentMatch) {
    return commentMatch[1].trim();
  }

  // Try markdown header format (## 🇳🇱 Nederlands or ## 🇬🇧 English)
  const headerPatterns: Record<Language, RegExp> = {
    nl: /##\s*(?:🇳🇱\s*)?Nederlands\s*\n([\s\S]*?)(?=##\s*(?:🇬🇧\s*)?English|$)/i,
    en: /##\s*(?:🇬🇧\s*)?English\s*\n([\s\S]*?)(?=##\s*(?:🇳🇱\s*)?Nederlands|$)/i,
  };

  const headerMatch = body.match(headerPatterns[language]);
  if (headerMatch) {
    return headerMatch[1].trim();
  }

  // Try simple [nl] ... [en] markers
  const simpleRegex = new RegExp(
    `\\[${language}\\]([\\s\\S]*?)(?=\\[(?:nl|en)\\]|$)`,
    'i'
  );
  const simpleMatch = body.match(simpleRegex);
  if (simpleMatch) {
    return simpleMatch[1].trim();
  }

  // No language markers found, return full body
  return body;
}

interface UpdateInfo {
  version: string;
  currentVersion: string;
  date?: string;
  body?: string;
}

interface DownloadProgress {
  downloaded: number;
  total: number;
}

// Store SW registration for update checks
let swRegistration: ServiceWorkerRegistration | null = null;

type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'up-to-date'
  | 'error';

export function UpdateChecker() {
  const { t, language } = useLanguage();
  const toast = useToast();

  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] =
    useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [webUpdateAvailable, setWebUpdateAvailable] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Parse localized release notes based on current language
  const localizedReleaseNotes = useMemo(() => {
    return parseLocalizedReleaseNotes(updateInfo?.body, language);
  }, [updateInfo?.body, language]);

  // For web: detect service worker updates
  useEffect(() => {
    if (isTauri || !('serviceWorker' in navigator)) return;

    // Get the existing registration
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        swRegistration = registration;

        // Listen for new service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New version available
                setWebUpdateAvailable(true);
                setStatus('available');
                setUpdateInfo({
                  version: t.updater?.newVersion || 'New version',
                  currentVersion: currentAppVersion || '?',
                });
              }
            });
          }
        });

        // Check if there's already a waiting worker
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWebUpdateAvailable(true);
          setStatus('available');
          setUpdateInfo({
            version: t.updater?.newVersion || 'New version',
            currentVersion: currentAppVersion || '?',
          });
        }
      }
    });

    // Handle controller change (SW update activated)
    const handleControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      handleControllerChange
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        handleControllerChange
      );
    };
  }, [t]);

  const checkForUpdates = useCallback(async () => {
    setStatus('checking');
    setError(null);

    if (isTauri) {
      // Tauri: Check via plugin-updater
      setUpdateInfo(null);

      try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const update = await check();

        if (update) {
          setUpdateInfo({
            version: update.version,
            currentVersion: update.currentVersion,
            date: update.date ?? undefined,
            body: update.body ?? undefined,
          });
          setStatus('available');
        } else {
          setStatus('up-to-date');
          toast.success(
            t.updater?.upToDate || 'You are running the latest version'
          );
        }
      } catch (err) {
        console.error('Update check failed:', err);
        setError(err instanceof Error ? err.message : String(err));
        setStatus('error');
        toast.error(t.updater?.checkFailed || 'Failed to check for updates');
      }
    } else if ('serviceWorker' in navigator) {
      // Web: Check for service worker updates
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          swRegistration = registration;
          await registration.update();

          // Check if there's a waiting worker after update check
          if (registration.waiting && navigator.serviceWorker.controller) {
            setWebUpdateAvailable(true);
            setStatus('available');
            setUpdateInfo({
              version: t.updater?.newVersion || 'New version',
              currentVersion: currentAppVersion || '?',
            });
          } else if (registration.installing) {
            // Wait for install to complete
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                setWebUpdateAvailable(true);
                setStatus('available');
                setUpdateInfo({
                  version: t.updater?.newVersion || 'New version',
                  currentVersion: currentAppVersion || '?',
                });
              }
            });
            // Keep checking status - will be resolved by statechange listener
            setTimeout(() => {
              if (status === 'checking') {
                setStatus('up-to-date');
                toast.success(
                  t.updater?.upToDate || 'You are running the latest version'
                );
              }
            }, 3000);
          } else {
            setStatus('up-to-date');
            toast.success(
              t.updater?.upToDate || 'You are running the latest version'
            );
          }
        } else {
          setStatus('up-to-date');
        }
      } catch (err) {
        console.error('SW update check failed:', err);
        setError(err instanceof Error ? err.message : String(err));
        setStatus('error');
      }
    } else {
      setStatus('up-to-date');
    }
  }, [t, toast, status]);

  const downloadAndInstall = useCallback(async () => {
    if (isTauri) {
      // Tauri: Download and install via plugin
      if (!updateInfo) return;

      setStatus('downloading');
      setDownloadProgress({ downloaded: 0, total: 0 });

      try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const { relaunch } = await import('@tauri-apps/plugin-process');

        const update = await check();
        if (!update) {
          setStatus('error');
          setError('Update no longer available');
          return;
        }

        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case 'Started':
              setDownloadProgress({
                downloaded: 0,
                total: event.data.contentLength ?? 0,
              });
              break;
            case 'Progress':
              setDownloadProgress((prev) => ({
                downloaded:
                  (prev?.downloaded ?? 0) + (event.data.chunkLength ?? 0),
                total: prev?.total ?? 0,
              }));
              break;
            case 'Finished':
              setStatus('ready');
              break;
          }
        });

        // Prompt to relaunch
        toast.success(
          t.updater?.installComplete || 'Update installed! Restarting...'
        );

        // Small delay to show the success message
        setTimeout(async () => {
          await relaunch();
        }, 1500);
      } catch (err) {
        console.error('Update download/install failed:', err);
        setError(err instanceof Error ? err.message : String(err));
        setStatus('error');
        toast.error(t.updater?.installFailed || 'Failed to install update');
      }
    } else if (webUpdateAvailable && swRegistration?.waiting) {
      // Web: Tell SW to skip waiting and activate
      setStatus('ready');
      swRegistration.waiting.postMessage('skipWaiting');
      // Page will reload via controllerchange listener
    }
  }, [updateInfo, t, toast, webUpdateAvailable]);

  // Auto-check for updates on mount
  useEffect(() => {
    // Check after a short delay to not block initial render
    const timer = setTimeout(() => {
      checkForUpdates();
    }, 2000);
    return () => clearTimeout(timer);
  }, [checkForUpdates]);

  // Background periodic update check for Tauri (every 4 hours)
  useEffect(() => {
    if (!isTauri) return;

    // Check every 4 hours (in milliseconds)
    const BACKGROUND_CHECK_INTERVAL = 4 * 60 * 60 * 1000;

    const intervalId = setInterval(() => {
      // Only check if not already checking/downloading
      if (status === 'idle' || status === 'up-to-date' || status === 'error') {
        checkForUpdates();
      }
    }, BACKGROUND_CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [status, checkForUpdates]);

  // Track when update check completes
  useEffect(() => {
    if (
      status === 'up-to-date' ||
      status === 'available' ||
      status === 'error'
    ) {
      setLastChecked(new Date());
    }
  }, [status]);

  const progressPercentage =
    downloadProgress && downloadProgress.total > 0
      ? Math.round((downloadProgress.downloaded / downloadProgress.total) * 100)
      : 0;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // For web: customize labels
  const isWeb = !isTauri;
  const installButtonLabel = isWeb
    ? t.updater?.refreshNow || 'Refresh now'
    : t.updater?.installUpdate || 'Install update';
  const descriptionText = isWeb
    ? t.updater?.webDescription || 'Check for app updates'
    : t.updater?.description || 'Check for and install app updates';

  // Format last checked time
  const formatLastChecked = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <Card className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
        <CardHeader className='px-3 py-3 sm:px-6 sm:py-4'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-base sm:text-lg'>
                {t.updater?.title || 'Software updates'}
              </CardTitle>
              <CardDescription className='text-xs sm:text-sm'>
                {descriptionText}
                {isTauri && (
                  <span className='ml-1 text-xs text-muted-foreground'>
                    (
                    {t.updater?.backgroundCheckEnabled ||
                      'Auto-check every 4 hours'}
                    )
                  </span>
                )}
              </CardDescription>
              {lastChecked && (
                <p className='mt-1 text-xs text-muted-foreground'>
                  {(t.updater?.lastChecked || 'Last checked: {time}').replace(
                    '{time}',
                    formatLastChecked(lastChecked)
                  )}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className='px-3 pt-0 pb-3 sm:px-6 sm:pt-0 sm:pb-6'>
          <div className='space-y-4'>
            {/* Status display */}
            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div className='flex items-center gap-3'>
                {status === 'checking' && (
                  <>
                    <Loader2 className='h-5 w-5 animate-spin text-purple-600' />
                    <span className='text-sm'>
                      {t.updater?.checking || 'Checking for updates...'}
                    </span>
                  </>
                )}
                {status === 'idle' && (
                  <>
                    <RefreshCw className='h-5 w-5 text-muted-foreground' />
                    <span className='text-sm text-muted-foreground'>
                      {t.updater?.clickToCheck || 'Click to check for updates'}
                    </span>
                  </>
                )}
                {status === 'up-to-date' && (
                  <>
                    <CheckCircle className='h-5 w-5 text-green-600' />
                    <span className='text-sm text-green-700 dark:text-green-400'>
                      {t.updater?.upToDate ||
                        'You are running the latest version'}
                    </span>
                  </>
                )}
                {status === 'available' && updateInfo && (
                  <>
                    <Download className='h-5 w-5 text-purple-600' />
                    <div>
                      <span className='text-sm font-medium'>
                        {isWeb
                          ? t.updater?.webUpdateAvailable ||
                            'A new version is available'
                          : (
                              t.updater?.newVersionAvailable ||
                              'Version {version} is available'
                            ).replace('{version}', updateInfo.version)}
                      </span>
                      {!isWeb && localizedReleaseNotes && (
                        <button
                          onClick={() => setShowReleaseNotes(true)}
                          className='ml-2 text-xs text-purple-600 hover:underline'
                        >
                          {t.updater?.viewReleaseNotes || 'View release notes'}
                        </button>
                      )}
                    </div>
                  </>
                )}
                {status === 'downloading' && (
                  <>
                    <Loader2 className='h-5 w-5 animate-spin text-purple-600' />
                    <div className='flex-1'>
                      <span className='text-sm'>
                        {t.updater?.downloading || 'Downloading update...'}
                      </span>
                      {downloadProgress && downloadProgress.total > 0 && (
                        <div className='mt-2 space-y-1'>
                          <Progress
                            value={progressPercentage}
                            className='h-2'
                          />
                          <div className='flex justify-between text-xs text-muted-foreground'>
                            <span>{progressPercentage}%</span>
                            <span>
                              {formatBytes(downloadProgress.downloaded)} /{' '}
                              {formatBytes(downloadProgress.total)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
                {status === 'ready' && (
                  <>
                    <CheckCircle className='h-5 w-5 text-green-600' />
                    <span className='text-sm text-green-700 dark:text-green-400'>
                      {t.updater?.readyToRestart ||
                        'Update ready. Restarting...'}
                    </span>
                  </>
                )}
                {status === 'error' && (
                  <>
                    <AlertCircle className='h-5 w-5 text-red-600' />
                    <span className='text-sm text-red-700 dark:text-red-400'>
                      {error || t.updater?.errorOccurred || 'An error occurred'}
                    </span>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className='flex gap-2'>
                {(status === 'idle' ||
                  status === 'up-to-date' ||
                  status === 'error') && (
                  <Button variant='outline' size='sm' onClick={checkForUpdates}>
                    <RefreshCw className='mr-2 h-4 w-4' />
                    {t.updater?.checkNow || 'Check now'}
                  </Button>
                )}
                {status === 'available' && (
                  <Button
                    size='sm'
                    onClick={downloadAndInstall}
                    className='bg-purple-600 hover:bg-purple-700'
                  >
                    {isWeb ? (
                      <RefreshCw className='mr-2 h-4 w-4' />
                    ) : (
                      <Download className='mr-2 h-4 w-4' />
                    )}
                    {installButtonLabel}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Release Notes Dialog */}
      <Dialog open={showReleaseNotes} onOpenChange={setShowReleaseNotes}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              {(
                t.updater?.releaseNotesTitle || 'Release notes for {version}'
              ).replace('{version}', updateInfo?.version || '')}
            </DialogTitle>
            <DialogDescription>
              {updateInfo?.date && (
                <span className='text-xs text-muted-foreground'>
                  {new Date(updateInfo.date).toLocaleDateString()}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className='max-h-80 overflow-y-auto rounded border bg-muted/50 p-4'>
            <pre className='text-sm whitespace-pre-wrap'>
              {localizedReleaseNotes}
            </pre>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowReleaseNotes(false)}
            >
              {t.common?.close || 'Close'}
            </Button>
            <Button
              onClick={() => {
                setShowReleaseNotes(false);
                downloadAndInstall();
              }}
              className='bg-purple-600 hover:bg-purple-700'
            >
              {isWeb ? (
                <RefreshCw className='mr-2 h-4 w-4' />
              ) : (
                <Download className='mr-2 h-4 w-4' />
              )}
              {installButtonLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
