import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  Pencil,
  AlertTriangle,
  Database,
  Code,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { useEncryption } from '@/contexts/EncryptionContext';
import { Toast, type ToastType } from '@/components/ui/toast';
import { version } from '../../../package.json';
import {
  getStoredDbVersion,
  getLatestMigrationVersion,
} from '@fluxby/database';
import { useToast } from '@/contexts/ToastContext';

// Check if running in Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

// Get current app version from Vite env
const currentAppVersion =
  typeof import.meta !== 'undefined'
    ? (import.meta.env?.VITE_APP_VERSION as string | undefined)
    : undefined;

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

export function AppSettings() {
  const { t, language, setLanguage, languages } = useLanguage();
  const { changePassword } = useEncryption();
  const queryClient = useQueryClient();

  // User data
  const { data: user } = useQuery<{ id: string; name: string }>({
    queryKey: ['user'],
    queryFn: () => api.getUser() as Promise<{ id: string; name: string }>,
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: { name?: string }) => api.updateUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setIsEditingName(false);
    },
  });

  // User name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Password dialog state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [localToast, setLocalToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  useEffect(() => {
    if (user?.name) {
      setEditedName(user.name);
    }
  }, [user?.name]);

  const handleSaveName = () => {
    if (editedName.trim()) {
      updateUserMutation.mutate({ name: editedName.trim() });
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    // Validation
    if (!currentPassword) {
      setPasswordError(t.security?.currentPassword);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(t.security?.passwordTooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t.security?.passwordsNoMatch);
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(t.settings?.masterPasswordMustDiffer);
      return;
    }

    setIsChangingPassword(true);

    try {
      const success = await changePassword(currentPassword, newPassword);

      if (success) {
        setLocalToast({
          message: t.security?.passwordChangedSuccess,
          type: 'success',
        });
        setIsPasswordDialogOpen(false);
        resetPasswordForm();
      } else {
        const message = t.security?.wrongPassword;
        setPasswordError(message);
        setLocalToast({ message, type: 'error' });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setPasswordError(errorMessage);
      setLocalToast({
        message: errorMessage || t.security?.unlockError,
        type: 'error',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Theme state
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  // Database version state
  const [dbVersion, setDbVersion] = useState<number | null>(null);
  const codeVersion = getLatestMigrationVersion();
  const hasVersionMismatch = dbVersion !== null && dbVersion !== codeVersion;

  useEffect(() => {
    // Get the stored database version
    const storedVersion = getStoredDbVersion();
    setDbVersion(storedVersion);
  }, []);

  // Handle migration trigger from version badge
  const handleMigrationTrigger = () => {
    if (hasVersionMismatch) {
      // Clear localStorage version to trigger migration on next load
      localStorage.removeItem('fluxby-db-schema-version');
      sessionStorage.removeItem('fluxby-migrations-complete-session');
      window.location.reload();
    }
  };

  // Update checker state
  const updateToast = useToast();
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] =
    useState<DownloadProgress | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [webUpdateAvailable, setWebUpdateAvailable] = useState(false);

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
                setUpdateStatus('available');
                setUpdateInfo({
                  version: t.updater?.newVersion,
                  currentVersion: currentAppVersion || '?',
                });
              }
            });
          }
        });

        // Check if there's already a waiting worker
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWebUpdateAvailable(true);
          setUpdateStatus('available');
          setUpdateInfo({
            version: t.updater?.newVersion,
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

  const updateStatusRef = useRef(updateStatus);
  useEffect(() => {
    updateStatusRef.current = updateStatus;
  }, [updateStatus]);

  const checkForUpdates = useCallback(
    async (showToast = true) => {
      setUpdateStatus('checking');
      setUpdateError(null);

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
            setUpdateStatus('available');
          } else {
            setUpdateStatus('up-to-date');
            if (showToast) {
              updateToast.success(t.updater?.upToDate);
            }
          }
        } catch (err) {
          console.error('Update check failed:', err);
          setUpdateError(err instanceof Error ? err.message : String(err));
          setUpdateStatus('error');
          updateToast.error(t.updater?.checkFailed);
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
              setUpdateStatus('available');
              setUpdateInfo({
                version: t.updater?.newVersion,
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
                  setUpdateStatus('available');
                  setUpdateInfo({
                    version: t.updater?.newVersion,
                    currentVersion: currentAppVersion || '?',
                  });
                }
              });
              // Keep checking status - will be resolved by statechange listener
              setTimeout(() => {
                if (updateStatusRef.current === 'checking') {
                  setUpdateStatus('up-to-date');
                  if (showToast) {
                    updateToast.success(t.updater?.upToDate);
                  }
                }
              }, 3000);
            } else {
              setUpdateStatus('up-to-date');
              if (showToast) {
                updateToast.success(t.updater?.upToDate);
              }
            }
          } else {
            setUpdateStatus('up-to-date');
          }
        } catch (err) {
          console.error('SW update check failed:', err);
          setUpdateError(err instanceof Error ? err.message : String(err));
          setUpdateStatus('error');
        }
      } else {
        setUpdateStatus('up-to-date');
      }
    },
    [t, updateToast]
  );

  const downloadAndInstall = useCallback(async () => {
    if (isTauri) {
      // Tauri: Download and install via plugin
      if (!updateInfo) return;

      setUpdateStatus('downloading');
      setDownloadProgress({ downloaded: 0, total: 0 });

      try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const { relaunch } = await import('@tauri-apps/plugin-process');

        const update = await check();
        if (!update) {
          setUpdateStatus('error');
          setUpdateError('Update no longer available');
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
              setUpdateStatus('ready');
              break;
          }
        });

        // Prompt to relaunch
        updateToast.success(t.updater?.installComplete);

        // Small delay to show the success message
        setTimeout(async () => {
          await relaunch();
        }, 1500);
      } catch (err) {
        console.error('Update download/install failed:', err);
        setUpdateError(err instanceof Error ? err.message : String(err));
        setUpdateStatus('error');
        updateToast.error(t.updater?.installFailed);
      }
    } else if (webUpdateAvailable && swRegistration?.waiting) {
      // Web: Tell SW to skip waiting and activate
      setUpdateStatus('ready');
      swRegistration.waiting.postMessage('skipWaiting');
      // Page will reload via controllerchange listener
    }
  }, [updateInfo, t, updateToast, webUpdateAvailable]);

  // Auto-check for updates on mount (silent - no toast for "up to date")
  useEffect(() => {
    // Check after a short delay to not block initial render
    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [checkForUpdates]);

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
    ? t.updater?.refreshNow
    : t.updater?.installUpdate;

  return (
    <div className='space-y-0 sm:space-y-6'>
      <div className=''>
        <Card
          className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
          data-onboarding='settings-app-preferences'
        >
          <CardHeader className='px-3 py-3 sm:px-6 sm:py-4'>
            <div>
              <CardTitle className='text-base sm:text-lg'>
                {t.settings.appSettings}
              </CardTitle>
              <CardDescription className='text-xs sm:text-sm'>
                {t.settings.appSettingsDescription}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className='px-3 pt-0 pb-3 sm:px-6 sm:pt-0 sm:pb-6'>
            <div className='space-y-2'>
              {/* Versions & Updates */}
              <div className='rounded-lg border p-4'>
                <div className='mb-3 flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium'>
                      {t.settings?.versions}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {t.settings?.versionsDescription}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className='cursor-default rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground'>
                            v{version}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t.settings?.appVersion}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={
                              hasVersionMismatch
                                ? handleMigrationTrigger
                                : undefined
                            }
                            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
                              hasVersionMismatch
                                ? 'cursor-pointer bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                                : 'cursor-default bg-muted text-muted-foreground'
                            }`}
                          >
                            <Database className='h-3 w-3' />
                            <span>{dbVersion ?? '?'}</span>
                            <span className='text-muted-foreground/50'>/</span>
                            <Code className='h-3 w-3' />
                            <span>{codeVersion}</span>
                            {hasVersionMismatch && (
                              <AlertTriangle className='ml-0.5 h-3 w-3' />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {hasVersionMismatch
                            ? t.settings?.versionMismatch
                            : t.settings?.schemaVersion}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {/* Update Status */}
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    {updateStatus === 'checking' && (
                      <>
                        <Loader2 className='h-4 w-4 animate-spin text-purple-600' />
                        <span className='text-sm'>{t.updater?.checking}</span>
                      </>
                    )}
                    {updateStatus === 'idle' && (
                      <>
                        <RefreshCw className='h-4 w-4 text-muted-foreground' />
                        <span className='text-sm text-muted-foreground'>
                          {t.updater?.clickToCheck}
                        </span>
                      </>
                    )}
                    {updateStatus === 'up-to-date' && (
                      <>
                        <CheckCircle className='h-4 w-4 text-green-600' />
                        <span className='text-sm text-green-700 dark:text-green-400'>
                          {t.updater?.upToDate}
                        </span>
                      </>
                    )}
                    {updateStatus === 'available' && updateInfo && (
                      <>
                        <Download className='h-4 w-4 text-purple-600' />
                        <div>
                          <span className='text-sm font-medium'>
                            {isWeb
                              ? t.updater?.webUpdateAvailable
                              : t.updater?.newVersionAvailable?.replace(
                                  '{version}',
                                  updateInfo.version
                                )}
                          </span>
                          {!isWeb && updateInfo.body && (
                            <button
                              onClick={() => setShowReleaseNotes(true)}
                              className='ml-2 text-xs text-purple-600 hover:underline'
                            >
                              {t.updater?.viewReleaseNotes}
                            </button>
                          )}
                        </div>
                      </>
                    )}
                    {updateStatus === 'downloading' && (
                      <>
                        <Loader2 className='h-4 w-4 animate-spin text-purple-600' />
                        <div className='flex-1'>
                          <span className='text-sm'>
                            {t.updater?.downloading}
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
                    {updateStatus === 'ready' && (
                      <>
                        <CheckCircle className='h-4 w-4 text-green-600' />
                        <span className='text-sm text-green-700 dark:text-green-400'>
                          {t.updater?.readyToRestart}
                        </span>
                      </>
                    )}
                    {updateStatus === 'error' && (
                      <>
                        <AlertCircle className='h-4 w-4 text-red-600' />
                        <span className='text-sm text-red-700 dark:text-red-400'>
                          {updateError || t.updater?.errorOccurred}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className='flex gap-2'>
                    {(updateStatus === 'idle' ||
                      updateStatus === 'up-to-date' ||
                      updateStatus === 'error') && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => checkForUpdates(true)}
                      >
                        <RefreshCw className='mr-2 h-4 w-4' />
                        {t.updater?.checkNow}
                      </Button>
                    )}
                    {updateStatus === 'available' && (
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

              {/* User Name */}
              <div className='flex items-center justify-between rounded-lg border p-3'>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>
                    {t.settings?.appNameLabel}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {t.settings?.appNameDescription}
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  {isEditingName ? (
                    <>
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className='h-8 w-32'
                        placeholder={t.settings?.appNamePlaceholder}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveName();
                          if (e.key === 'Escape') {
                            setIsEditingName(false);
                            setEditedName(user?.name || '');
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        size='sm'
                        onClick={handleSaveName}
                        disabled={updateUserMutation.isPending}
                        className='h-8 rounded-md hover:bg-purple-600 hover:text-white'
                      >
                        <Check className='h-4 w-4' />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className='text-sm text-muted-foreground'>
                        {user?.name || t.settings?.appNameUnset}
                      </span>
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => setIsEditingName(true)}
                              className='h-8 w-8 rounded-md hover:bg-purple-600 hover:text-white'
                            >
                              <Pencil className='h-4 w-4' />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t.common?.edit}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                </div>
              </div>

              {/* Master Password */}
              <div className='flex items-center justify-between rounded-lg border p-3'>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>
                    {t.settings?.masterPasswordTitle}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {t.settings?.masterPasswordDescription}
                  </p>
                </div>
                <Dialog
                  open={isPasswordDialogOpen}
                  onOpenChange={(open) => {
                    setIsPasswordDialogOpen(open);
                    if (!open) resetPasswordForm();
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant='outline' size='sm'>
                      {t.settings?.masterPasswordChange ||
                        t.security?.changePassword}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className='sm:max-w-md'>
                    <DialogHeader>
                      <DialogTitle>
                        {t.settings?.masterPasswordDialogTitle}
                      </DialogTitle>
                      <DialogDescription>
                        {t.settings?.masterPasswordDialogDescription}
                      </DialogDescription>
                    </DialogHeader>

                    <div className='space-y-4'>
                      <div className='rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30'>
                        <p className='flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200'>
                          <AlertTriangle className='mt-0.5 h-4 w-4 flex-shrink-0' />
                          {t.settings?.masterPasswordWarning}
                        </p>
                      </div>
                      <div className='space-y-2'>
                        <label
                          htmlFor='current-password'
                          className='text-sm font-medium'
                        >
                          {t.settings?.masterPasswordCurrent ||
                            t.security?.currentPassword}
                        </label>
                        <Input
                          id='current-password'
                          type='password'
                          value={currentPassword}
                          onChange={(e) => {
                            setCurrentPassword(e.target.value);
                            setPasswordError(null);
                          }}
                          placeholder='••••••••'
                        />
                      </div>

                      <div className='space-y-2'>
                        <label
                          htmlFor='new-password'
                          className='text-sm font-medium'
                        >
                          {t.settings?.masterPasswordNew}
                        </label>
                        <Input
                          id='new-password'
                          type='password'
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            setPasswordError(null);
                          }}
                          placeholder='••••••••'
                          minLength={8}
                        />
                        <p className='text-xs text-muted-foreground'>
                          {t.settings?.masterPasswordMinLength}
                        </p>
                      </div>

                      <div className='space-y-2'>
                        <label
                          htmlFor='confirm-password'
                          className='text-sm font-medium'
                        >
                          {t.settings?.masterPasswordConfirm}
                        </label>
                        <Input
                          id='confirm-password'
                          type='password'
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setPasswordError(null);
                          }}
                          placeholder='••••••••'
                          minLength={8}
                        />
                      </div>

                      {passwordError && (
                        <p className='flex items-center gap-2 text-sm text-red-500'>
                          <AlertTriangle className='h-4 w-4' />
                          {passwordError}
                        </p>
                      )}
                    </div>

                    <DialogFooter>
                      <Button
                        variant='outline'
                        onClick={() => {
                          setIsPasswordDialogOpen(false);
                          resetPasswordForm();
                        }}
                      >
                        {t.common?.cancel}
                      </Button>
                      <Button
                        onClick={handleChangePassword}
                        disabled={
                          isChangingPassword ||
                          !currentPassword ||
                          !newPassword ||
                          !confirmPassword
                        }
                        className='bg-purple-600 hover:bg-purple-700'
                      >
                        {isChangingPassword
                          ? t.settings?.masterPasswordChanging
                          : t.settings?.masterPasswordChange ||
                            t.security?.changePassword}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Language */}
              <div className='flex items-center justify-between rounded-lg border p-3'>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>{t.settings.language}</p>
                  <p className='text-xs text-muted-foreground'>
                    {t.settings.languageDescription}
                  </p>
                </div>
                <div className='flex gap-1'>
                  {(
                    Object.keys(languages) as Array<keyof typeof languages>
                  ).map((lang) => (
                    <Button
                      key={lang}
                      variant={language === lang ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setLanguage(lang)}
                      className='px-3'
                    >
                      {languages[lang].flag} {languages[lang].name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Currency */}
              <div className='flex items-center justify-between rounded-lg border p-3'>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>{t.settings.currency}</p>
                  <p className='text-xs text-muted-foreground'>
                    {t.settings.currencyDescription}
                  </p>
                </div>
                <span className='text-sm text-muted-foreground'>€</span>
              </div>

              {/* Theme */}
              <div className='flex items-center justify-between rounded-lg border p-3'>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>{t.settings.theme}</p>
                  <p className='text-xs text-muted-foreground'>
                    {t.settings.themeDescription}
                  </p>
                </div>
                <div className='flex gap-1'>
                  <Button
                    variant={currentTheme === 'light' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => {
                      document.documentElement.classList.remove('dark');
                      setCurrentTheme('light');
                    }}
                    className='px-2'
                  >
                    ☀️ {t.settings.themeLight}
                  </Button>
                  <Button
                    variant={currentTheme === 'dark' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => {
                      document.documentElement.classList.add('dark');
                      setCurrentTheme('dark');
                    }}
                    className='px-2'
                  >
                    🌙 {t.settings.themeDark}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Update Checker - Only shown in Tauri */}
      </div>

      {/* Release Notes Dialog */}
      <Dialog open={showReleaseNotes} onOpenChange={setShowReleaseNotes}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              {t.updater?.releaseNotesTitle?.replace(
                '{version}',
                updateInfo?.version || ''
              )}
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
              {updateInfo?.body}
            </pre>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowReleaseNotes(false)}
            >
              {t.common?.close}
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

      {localToast && (
        <Toast
          message={localToast.message}
          type={localToast.type}
          onClose={() => setLocalToast(null)}
        />
      )}
    </div>
  );
}
