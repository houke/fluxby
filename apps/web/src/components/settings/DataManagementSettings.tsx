import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  RefreshCcw,
  Lock,
  LockOpen,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { useEncryption } from '@/contexts/EncryptionContext';
import { useToast } from '@/contexts/ToastContext';
import { resetAppAndRestartOnboarding } from '@/lib/database-reset';
import {
  encryptBackup,
  decryptBackup,
  isEncryptedBackup,
  verifyBackupChecksum,
  addChecksumToBackup,
  getBackupFilename,
  type PlainBackup,
} from '@/lib/backup-crypto';
import {
  listPreUpdateBackups,
  restoreFromBackup,
  type BackupEntry,
} from '@/lib/pre-update-backup';
import { isRunningInTauri } from '@/lib/tauri-bridge';
import { InvalidBackupError, type BackupPreview } from '@/lib/data/backup';
import {
  readBackupHealth,
  recordBackupDownload,
  recordVerifiedRestore,
  readRecoverySnapshot,
  saveRecoverySnapshot,
  type RecoverySnapshot,
} from '@/lib/backup-health';

function downloadBackup(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DataManagementSettings() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { isEncryptionEnabled, verifyPassword } = useEncryption();
  const toast = useToast();
  const setDataNotice = (notice: {
    type: 'success' | 'error' | 'warning';
    text: string;
  }) => {
    toast[notice.type](notice.text);
  };
  const [backupHealth, setBackupHealth] = useState(readBackupHealth);
  const [recovery, setRecovery] = useState<RecoverySnapshot | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    data: unknown;
    preview: BackupPreview;
  } | null>(null);
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [loadingAction, setLoadingAction] = useState<
    'export' | 'import' | 'delete' | 'restore' | null
  >(null);
  const [encryptExport, setEncryptExport] = useState(true);

  // Restore-from-backup state (Tauri only)
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [backupList, setBackupList] = useState<BackupEntry[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  // Password dialog state for encrypted exports/imports
  const [passwordDialog, setPasswordDialog] = useState<{
    open: boolean;
    mode: 'export' | 'import';
    pendingFile?: File;
  }>({ open: false, mode: 'export' });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  React.useEffect(() => {
    readRecoverySnapshot()
      .then(setRecovery)
      .catch(() => {
        /* no saved snapshot */
      });
  }, []);

  const formatBackupDate = (value: string) => new Date(value).toLocaleString();

  const prepareImport = async (data: unknown, password = '') => {
    const preview = await api.previewImport(data);
    setPendingImport({ data, preview });
    setRecoveryPassword(password);
  };

  const restorePendingImport = async () => {
    if (!pendingImport || recoveryPassword.length < 4) return;
    setLoadingAction('import');
    try {
      const result = await api.importAll(pendingImport.data, {
        saveRecovery: async (backup) => {
          await saveRecoverySnapshot(backup, recoveryPassword);
          setRecovery(await readRecoverySnapshot());
        },
      });
      setBackupHealth(recordVerifiedRestore(result.verifiedAt));
      await queryClient.invalidateQueries();
      setPendingImport(null);
      setRecoveryPassword('');
      toast.success(t.settings.dataManagement.importSuccess);
    } catch (error) {
      toast.error(
        error instanceof InvalidBackupError
          ? t.settings.dataManagement.importInvalid
          : t.settings.dataManagement.importError
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const handleOpenRestoreDialog = async () => {
    setRestoreDialog(true);
    setSelectedBackup(null);
    setLoadingBackups(true);
    const backups = await listPreUpdateBackups();
    setBackupList(backups);
    setLoadingBackups(false);
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;
    const isConfirmed = await confirm({
      title: t.settings.dataManagement?.restoreBackupDialogTitle,
      message: t.settings.dataManagement?.restoreBackupConfirm,
      variant: 'danger',
    });
    if (!isConfirmed) return;

    setLoadingAction('restore');
    try {
      const result = await restoreFromBackup(selectedBackup);
      if (!result.success) {
        setDataNotice({
          type: 'error',
          text:
            t.settings.dataManagement?.restoreBackupError +
            (result.error ? `: ${result.error}` : ''),
        });
        setLoadingAction(null);
        return;
      }
      setRestoreDialog(false);
      setDataNotice({
        type: 'success',
        text: t.settings.dataManagement?.restoreBackupSuccess,
      });
      // Relaunch after a short delay so the toast is visible
      setTimeout(async () => {
        const { relaunch } = await import('@tauri-apps/plugin-process');
        await relaunch();
      }, 1500);
    } catch (err) {
      setDataNotice({
        type: 'error',
        text:
          t.settings.dataManagement?.restoreBackupError +
          (err instanceof Error ? `: ${err.message}` : ''),
      });
      setLoadingAction(null);
    }
  };

  // Handle encrypted export
  const handleEncryptedExport = async (password: string) => {
    try {
      // Verify password if encryption is enabled
      if (isEncryptionEnabled) {
        const isValid = await verifyPassword(password);
        if (!isValid) {
          setPasswordError(t.settings.dataManagement?.wrongPassword);
          return;
        }
      }

      setPasswordDialog({ open: false, mode: 'export' });
      setPasswordInput('');
      setPasswordError('');
      setLoadingAction('export');

      const data = await api.exportAll();
      const dataWithChecksum = await addChecksumToBackup(data as PlainBackup);
      const encrypted = await encryptBackup(dataWithChecksum, password);

      downloadBackup(encrypted, getBackupFilename(new Date(), true));
      setBackupHealth(recordBackupDownload(true));
      toast.success(t.settings.dataManagement.backupDownloaded);
    } catch {
      setDataNotice({
        type: 'error',
        text: t.settings.dataManagement.exportError,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // Decrypt and validate first; replacement is a separate preview action.
  const handleEncryptedImport = async (password: string) => {
    if (!passwordDialog.pendingFile) return;
    setLoadingAction('import');
    try {
      const parsed = JSON.parse(await passwordDialog.pendingFile.text());
      const decrypted = await decryptBackup(parsed, password);
      await prepareImport(decrypted, password);
      setPasswordDialog({ open: false, mode: 'import' });
      setPasswordInput('');
      setPasswordError('');
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('incorrect password')
      ) {
        setPasswordError(t.settings.dataManagement.wrongPassword);
      } else {
        setPasswordDialog({ open: false, mode: 'import' });
        toast.error(
          error instanceof InvalidBackupError
            ? t.settings.dataManagement.importInvalid
            : t.settings.dataManagement.importError
        );
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleFileImport = async (file: File) => {
    setLoadingAction('import');
    try {
      const parsed = JSON.parse(await file.text());
      if (isEncryptedBackup(parsed)) {
        setPasswordDialog({ open: true, mode: 'import', pendingFile: file });
        return;
      }
      const { valid } = await verifyBackupChecksum(parsed as PlainBackup);
      if (!valid) {
        toast.error(t.settings.dataManagement.backupChecksumInvalid);
        return;
      }
      await prepareImport(parsed);
    } catch {
      toast.error(t.settings.dataManagement.importInvalid);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className=''>
      <Card
        className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
        data-onboarding='settings-data-management'
      >
        <CardHeader className='px-3 py-3 sm:px-6 sm:py-4'>
          <CardTitle className='text-base sm:text-lg'>
            {t.settings.dataManagement.title}
          </CardTitle>
          <CardDescription className='text-xs sm:text-sm'>
            {t.settings.dataManagement.description}
          </CardDescription>
        </CardHeader>
        <CardContent className='px-3 pt-0 pb-3 sm:px-6 sm:pt-0 sm:pb-6'>
          <div className='space-y-2'>
            <div
              className='rounded-lg border p-3'
              data-onboarding='settings-backup-health'
            >
              <p className='text-sm font-medium'>
                {t.settings.dataManagement.backupHealthTitle}
              </p>
              <p className='mt-1 text-xs text-muted-foreground'>
                {backupHealth.lastDownloadStartedAt
                  ? t.settings.dataManagement.lastBackup.replace(
                      '{date}',
                      formatBackupDate(backupHealth.lastDownloadStartedAt)
                    )
                  : t.settings.dataManagement.noBackupYet}
                {backupHealth.lastDownloadStartedAt &&
                  ` · ${
                    backupHealth.lastDownloadEncrypted
                      ? t.settings.dataManagement.backupEncrypted
                      : t.settings.dataManagement.backupPlain
                  }`}
              </p>
              <p className='mt-1 text-xs text-muted-foreground'>
                {backupHealth.lastVerifiedRestoreAt
                  ? t.settings.dataManagement.backupVerification.replace(
                      '{date}',
                      formatBackupDate(backupHealth.lastVerifiedRestoreAt)
                    )
                  : t.settings.dataManagement.noVerifiedRestore}
              </p>
              {recovery && (
                <Button
                  variant='outline'
                  className='mt-2'
                  disabled={loadingAction !== null}
                  onClick={() => {
                    downloadBackup(
                      recovery.encrypted,
                      `fluxby-recovery-${recovery.createdAt.slice(0, 10)}.fluxby-encrypted`
                    );
                    toast.info(t.settings.dataManagement.recoveryDownload);
                  }}
                >
                  {t.settings.dataManagement.recoveryAvailable}
                </Button>
              )}
            </div>

            <div className='rounded-lg border p-3'>
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>
                    {t.settings.dataManagement.exportTitle}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {t.settings.dataManagement.exportDescription}
                  </p>
                </div>
                <Button
                  variant='outline'
                  disabled={loadingAction !== null}
                  onClick={async () => {
                    if (encryptExport) {
                      // Open password dialog for encrypted export
                      setPasswordDialog({ open: true, mode: 'export' });
                    } else {
                      // Plain export with checksum
                      setLoadingAction('export');
                      try {
                        const data = await api.exportAll();
                        const dataWithChecksum = await addChecksumToBackup(
                          data as PlainBackup
                        );
                        downloadBackup(
                          dataWithChecksum,
                          getBackupFilename(new Date(), false)
                        );
                        setBackupHealth(recordBackupDownload(false));
                        toast.success(
                          t.settings.dataManagement.backupDownloaded
                        );
                      } catch {
                        setDataNotice({
                          type: 'error',
                          text: t.settings.dataManagement.exportError,
                        });
                      } finally {
                        setLoadingAction(null);
                      }
                    }
                  }}
                >
                  {loadingAction === 'export' ? (
                    <RefreshCcw className='mr-2 h-4 w-4 animate-spin' />
                  ) : encryptExport ? (
                    <Lock className='mr-2 h-4 w-4' />
                  ) : (
                    <LockOpen className='mr-2 h-4 w-4' />
                  )}
                  {t.settings.dataManagement.exportButton}
                </Button>
              </div>
              <div className='mt-3 flex items-center gap-2 border-t pt-3'>
                <Switch
                  id='encrypt-export'
                  checked={encryptExport}
                  onCheckedChange={setEncryptExport}
                />
                <Label
                  htmlFor='encrypt-export'
                  className='flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground'
                >
                  <ShieldCheck className='h-3.5 w-3.5' />
                  {t.settings.dataManagement?.encryptBackup}
                </Label>
              </div>
            </div>

            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div className='flex-1'>
                <p className='text-sm font-medium'>
                  {t.settings.dataManagement.importTitle}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {t.settings.dataManagement?.importDescriptionEncrypted}
                </p>
              </div>
              <input
                type='file'
                accept='application/json,.fluxby-encrypted'
                className='hidden'
                id='import-json-input'
                aria-label={t.settings.dataManagement.importButton}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) {
                    e.target.value = '';
                    return;
                  }
                  await handleFileImport(file);
                  e.target.value = '';
                }}
              />
              <Button
                variant='outline'
                disabled={loadingAction !== null}
                onClick={() => {
                  const input = document.getElementById(
                    'import-json-input'
                  ) as HTMLInputElement | null;
                  input?.click();
                }}
              >
                {loadingAction === 'import' ? (
                  <RefreshCcw className='mr-2 h-4 w-4 animate-spin' />
                ) : null}
                {t.settings.dataManagement.importButton}
              </Button>
            </div>
            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-destructive'>
                  {t.settings.dataManagement.deleteAllTitle}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {t.settings.dataManagement.deleteAllDescription}
                </p>
              </div>
              <Button
                variant='destructive'
                disabled={loadingAction !== null}
                onClick={async () => {
                  const isConfirmed = await confirm({
                    title: t.settings.dataManagement.deleteAllTitle,
                    message: t.settings.dataManagement.deleteAllConfirm,
                    variant: 'danger',
                  });
                  if (!isConfirmed) {
                    return;
                  }

                  setLoadingAction('delete');
                  try {
                    await resetAppAndRestartOnboarding();
                  } catch {
                    setDataNotice({
                      type: 'error',
                      text: t.settings.dataManagement.deleteAllError,
                    });
                    setLoadingAction(null);
                  }
                }}
              >
                {loadingAction === 'delete' ? (
                  <RefreshCcw className='mr-2 h-4 w-4 animate-spin' />
                ) : null}
                {t.settings.dataManagement.deleteAllButton}
              </Button>
            </div>

            {isRunningInTauri() && (
              <div className='flex items-center justify-between rounded-lg border p-3'>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>
                    {t.settings.dataManagement?.restoreBackupTitle}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {t.settings.dataManagement?.restoreBackupDescription}
                  </p>
                </div>
                <Button
                  variant='outline'
                  disabled={loadingAction !== null}
                  onClick={handleOpenRestoreDialog}
                >
                  <RotateCcw className='mr-2 h-4 w-4' />
                  {t.settings.dataManagement?.restoreBackupButton}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={pendingImport !== null}
        onOpenChange={(open) => {
          if (!open && loadingAction === null) {
            setPendingImport(null);
            setRecoveryPassword('');
          }
        }}
      >
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>{t.settings.dataManagement.previewTitle}</DialogTitle>
            <DialogDescription>
              {pendingImport &&
                t.settings.dataManagement.previewDescription
                  .replace('{profiles}', String(pendingImport.preview.profiles))
                  .replace('{accounts}', String(pendingImport.preview.accounts))
                  .replace(
                    '{transactions}',
                    String(pendingImport.preview.transactions)
                  )
                  .replace('{rows}', String(pendingImport.preview.rows))
                  .replace(
                    '{date}',
                    formatBackupDate(pendingImport.preview.exportedAt)
                  )}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            {pendingImport &&
              (pendingImport.preview.legacy ||
                pendingImport.preview.missingTables.length > 0) && (
                <p className='text-sm text-amber-800 dark:text-amber-200'>
                  {t.settings.dataManagement.previewLegacy}
                </p>
              )}
            <p className='text-sm'>{t.settings.dataManagement.importConfirm}</p>
            <p className='text-sm text-muted-foreground'>
              {t.settings.dataManagement.recoveryDescription}
            </p>
            <Label htmlFor='recovery-password'>
              {t.settings.dataManagement.recoveryPassword}
            </Label>
            <Input
              id='recovery-password'
              type='password'
              autoComplete='new-password'
              value={recoveryPassword}
              disabled={loadingAction !== null}
              onChange={(event) => setRecoveryPassword(event.target.value)}
            />
            <p className='text-xs text-muted-foreground'>
              {t.settings.dataManagement.recoveryPasswordDescription}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              disabled={loadingAction !== null}
              onClick={() => {
                setPendingImport(null);
                setRecoveryPassword('');
              }}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant='destructive'
              disabled={loadingAction !== null || recoveryPassword.length < 4}
              onClick={restorePendingImport}
            >
              {loadingAction === 'import' && (
                <RefreshCcw
                  aria-hidden='true'
                  className='mr-2 h-4 w-4 animate-spin'
                />
              )}
              {t.settings.dataManagement.previewRestore}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password dialog for encrypted backup/import */}
      <Dialog
        open={passwordDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setPasswordDialog({ open: false, mode: 'export' });
            setPasswordInput('');
            setPasswordError('');
          }
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>
              {passwordDialog.mode === 'export'
                ? t.settings.dataManagement?.encryptExportTitle
                : t.settings.dataManagement?.decryptImportTitle}
            </DialogTitle>
            <DialogDescription>
              {passwordDialog.mode === 'export'
                ? t.settings.dataManagement?.encryptExportDescription
                : t.settings.dataManagement?.decryptImportDescription}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='backup-password'>
                {t.security?.enterPassword}
              </Label>
              <Input
                id='backup-password'
                type='password'
                autoFocus
                autoComplete='new-password'
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && passwordInput.length >= 4) {
                    if (passwordDialog.mode === 'export') {
                      handleEncryptedExport(passwordInput);
                    } else {
                      handleEncryptedImport(passwordInput);
                    }
                  }
                }}
                placeholder={t.settings.dataManagement?.passwordPlaceholder}
              />
              {passwordError && (
                <p className='text-sm text-destructive'>{passwordError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setPasswordDialog({ open: false, mode: 'export' });
                setPasswordInput('');
                setPasswordError('');
              }}
            >
              {t.common.cancel}
            </Button>
            <Button
              onClick={() => {
                if (passwordDialog.mode === 'export') {
                  handleEncryptedExport(passwordInput);
                } else {
                  handleEncryptedImport(passwordInput);
                }
              }}
              disabled={passwordInput.length < 4}
            >
              {passwordDialog.mode === 'export'
                ? t.settings.dataManagement.exportButton
                : t.settings.dataManagement.importButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore from pre-update backup dialog (Tauri only) */}
      <Dialog open={restoreDialog} onOpenChange={setRestoreDialog}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>
              {t.settings.dataManagement?.restoreBackupDialogTitle}
            </DialogTitle>
            <DialogDescription>
              {t.settings.dataManagement?.restoreBackupDialogDescription}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-2 py-2'>
            {loadingBackups ? (
              <div className='flex items-center justify-center py-6 text-sm text-muted-foreground'>
                <RefreshCcw className='mr-2 h-4 w-4 animate-spin' />
              </div>
            ) : backupList.length === 0 ? (
              <p className='py-4 text-center text-sm text-muted-foreground'>
                {t.settings.dataManagement?.restoreBackupEmpty}
              </p>
            ) : (
              backupList.map((backup) => (
                <button
                  key={backup.filename}
                  type='button'
                  onClick={() => setSelectedBackup(backup.filename)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    selectedBackup === backup.filename
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <p className='font-medium'>
                    {backup.timestamp.toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {backup.timestamp.toLocaleTimeString()}
                  </p>
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setRestoreDialog(false)}
              disabled={loadingAction === 'restore'}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant='destructive'
              onClick={handleRestoreBackup}
              disabled={!selectedBackup || loadingAction === 'restore'}
            >
              {loadingAction === 'restore' ? (
                <RefreshCcw className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <RotateCcw className='mr-2 h-4 w-4' />
              )}
              {t.settings.dataManagement?.restoreBackupRelaunch}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
