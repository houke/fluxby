import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCcw, Lock, LockOpen, ShieldCheck, RotateCcw } from 'lucide-react';
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

export function DataManagementSettings() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { isEncryptionEnabled, verifyPassword } = useEncryption();
  const [dataNotice, setDataNotice] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
  } | null>(null);
  const [loadingAction, setLoadingAction] = useState<
    'export' | 'import' | 'delete' | 'restore' | null
  >(null);
  const [encryptExport, setEncryptExport] = useState(false);

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

  // Auto-hide notice (keep warnings visible longer)
  React.useEffect(() => {
    if (!dataNotice) return;
    const delay = dataNotice.type === 'warning' ? 10000 : 4000;
    const timer = setTimeout(() => setDataNotice(null), delay);
    return () => clearTimeout(timer);
  }, [dataNotice]);

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
      title:
        t.settings.dataManagement?.restoreBackupDialogTitle || 'Restore backup',
      message:
        t.settings.dataManagement?.restoreBackupConfirm ||
        'Are you sure? All current data will be overwritten.',
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
            (t.settings.dataManagement?.restoreBackupError || 'Restore failed') +
            (result.error ? `: ${result.error}` : ''),
        });
        setLoadingAction(null);
        return;
      }
      setRestoreDialog(false);
      setDataNotice({
        type: 'success',
        text:
          t.settings.dataManagement?.restoreBackupSuccess ||
          'Database restored. Restarting app...',
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
          (t.settings.dataManagement?.restoreBackupError || 'Restore failed') +
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
          setPasswordError(
            t.settings.dataManagement?.wrongPassword || 'Incorrect password'
          );
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

      const blob = new Blob([JSON.stringify(encrypted, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getBackupFilename(new Date(), true);
      a.click();
      URL.revokeObjectURL(url);

      setDataNotice({
        type: 'success',
        text:
          t.settings.dataManagement?.exportEncryptedSuccess ||
          'Encrypted backup saved successfully.',
      });
    } catch {
      setDataNotice({
        type: 'error',
        text: t.settings.dataManagement.exportError,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle encrypted import
  const handleEncryptedImport = async (password: string) => {
    if (!passwordDialog.pendingFile) return;

    try {
      const text = await passwordDialog.pendingFile.text();
      const parsed = JSON.parse(text);

      const decrypted = await decryptBackup(parsed, password);

      setPasswordDialog({ open: false, mode: 'import' });
      setPasswordInput('');
      setPasswordError('');
      setLoadingAction('import');

      const result = await api.importAll(decrypted);
      queryClient.invalidateQueries();

      // Check if any category rules were skipped
      const skippedRules = (
        result as {
          categoryRulesSkipped?: Array<{
            pattern: string;
            reason: string;
          }>;
        }
      )?.categoryRulesSkipped;

      if (skippedRules && skippedRules.length > 0) {
        const skippedList = skippedRules
          .map((r) => `• "${r.pattern}": ${r.reason}`)
          .join('\n');
        setDataNotice({
          type: 'warning',
          text: `${t.settings.dataManagement.importSuccess}\n\n${t.settings.dataManagement.skippedRules || 'Skipped category rules'}:\n${skippedList}`,
        });
      } else {
        setDataNotice({
          type: 'success',
          text: t.settings.dataManagement.importSuccess,
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Decryption failed';
      if (errorMessage.includes('incorrect password')) {
        setPasswordError(
          t.settings.dataManagement?.wrongPassword || 'Incorrect password'
        );
      } else if (errorMessage.includes('Checksum mismatch')) {
        setPasswordDialog({ open: false, mode: 'import' });
        setPasswordInput('');
        setPasswordError('');
        setDataNotice({
          type: 'error',
          text:
            t.settings.dataManagement?.checksumMismatch ||
            'Backup file is corrupted (checksum mismatch)',
        });
      } else {
        setPasswordError(errorMessage);
      }
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle file import (detects encrypted vs plain)
  const handleFileImport = async (file: File) => {
    const isConfirmed = await confirm({
      title: t.settings.dataManagement.importTitle,
      message: t.settings.dataManagement.importConfirm,
      variant: 'default',
    });
    if (!isConfirmed) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      // Check if encrypted
      if (isEncryptedBackup(parsed)) {
        setPasswordDialog({
          open: true,
          mode: 'import',
          pendingFile: file,
        });
        return;
      }

      // Plain backup - verify checksum if present
      setLoadingAction('import');
      const { valid, hasChecksum } = await verifyBackupChecksum(
        parsed as PlainBackup
      );

      if (hasChecksum && !valid) {
        const proceed = await confirm({
          title:
            t.settings.dataManagement?.checksumWarningTitle ||
            'Checksum warning',
          message:
            t.settings.dataManagement?.checksumWarningMessage ||
            'The backup file checksum does not match. The file may have been modified. Continue anyway?',
          variant: 'danger',
        });
        if (!proceed) {
          setLoadingAction(null);
          return;
        }
      }

      const result = await api.importAll(parsed);
      queryClient.invalidateQueries();

      // Check if any category rules were skipped
      const skippedRules = (
        result as {
          categoryRulesSkipped?: Array<{
            pattern: string;
            reason: string;
          }>;
        }
      )?.categoryRulesSkipped;

      if (skippedRules && skippedRules.length > 0) {
        const skippedList = skippedRules
          .map((r) => `• "${r.pattern}": ${r.reason}`)
          .join('\n');
        setDataNotice({
          type: 'warning',
          text: `${t.settings.dataManagement.importSuccess}\n\n${t.settings.dataManagement.skippedRules || 'Skipped category rules'}:\n${skippedList}`,
        });
      } else {
        setDataNotice({
          type: 'success',
          text: t.settings.dataManagement.importSuccess,
        });
      }
    } catch {
      setDataNotice({
        type: 'error',
        text: t.settings.dataManagement.importError,
      });
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
            {dataNotice && (
              <div
                className={`rounded border px-3 py-2 text-sm whitespace-pre-wrap ${
                  dataNotice.type === 'success'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : dataNotice.type === 'warning'
                      ? 'border-amber-300 bg-amber-50 text-amber-800'
                      : 'border-rose-300 bg-rose-50 text-rose-800'
                }`}
              >
                {dataNotice.text}
              </div>
            )}

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
                        const blob = new Blob(
                          [JSON.stringify(dataWithChecksum, null, 2)],
                          { type: 'application/json' }
                        );
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = getBackupFilename(new Date(), false);
                        a.click();
                        URL.revokeObjectURL(url);
                        setDataNotice({
                          type: 'success',
                          text: t.settings.dataManagement.exportSuccess,
                        });
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
                  {t.settings.dataManagement?.encryptBackup ||
                    'Encrypt backup with password'}
                </Label>
              </div>
            </div>

            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div className='flex-1'>
                <p className='text-sm font-medium'>
                  {t.settings.dataManagement.importTitle}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {t.settings.dataManagement?.importDescriptionEncrypted ||
                    'Import a previous export file (supports encrypted and plain backups)'}
                </p>
              </div>
              <input
                type='file'
                accept='application/json,.fluxby-encrypted'
                className='hidden'
                id='import-json-input'
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
                    {t.settings.dataManagement?.restoreBackupTitle ||
                      'Restore from backup'}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {t.settings.dataManagement?.restoreBackupDescription ||
                      'Restore the database from an automatic backup created before an update'}
                  </p>
                </div>
                <Button
                  variant='outline'
                  disabled={loadingAction !== null}
                  onClick={handleOpenRestoreDialog}
                >
                  <RotateCcw className='mr-2 h-4 w-4' />
                  {t.settings.dataManagement?.restoreBackupButton ||
                    'Restore backup'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
                ? t.settings.dataManagement?.encryptExportTitle ||
                  'Encrypt backup'
                : t.settings.dataManagement?.decryptImportTitle ||
                  'Decrypt backup'}
            </DialogTitle>
            <DialogDescription>
              {passwordDialog.mode === 'export'
                ? t.settings.dataManagement?.encryptExportDescription ||
                  'Enter a password to encrypt your backup. You will need this password to restore the backup later.'
                : t.settings.dataManagement?.decryptImportDescription ||
                  'Enter the password used to encrypt this backup.'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='backup-password'>
                {t.security?.enterPassword || 'Password'}
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
                placeholder={
                  t.settings.dataManagement?.passwordPlaceholder ||
                  'Enter password (min 4 characters)'
                }
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
              {t.settings.dataManagement?.restoreBackupDialogTitle ||
                'Restore backup'}
            </DialogTitle>
            <DialogDescription>
              {t.settings.dataManagement?.restoreBackupDialogDescription ||
                'Select a backup to restore. The app will restart after restoring.'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-2 py-2'>
            {loadingBackups ? (
              <div className='flex items-center justify-center py-6 text-sm text-muted-foreground'>
                <RefreshCcw className='mr-2 h-4 w-4 animate-spin' />
              </div>
            ) : backupList.length === 0 ? (
              <p className='py-4 text-center text-sm text-muted-foreground'>
                {t.settings.dataManagement?.restoreBackupEmpty ||
                  'No backups found'}
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
              {t.settings.dataManagement?.restoreBackupRelaunch ||
                'Restore and restart'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
