import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, AlertTriangle } from 'lucide-react';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { useEncryption } from '@/contexts/EncryptionContext';
import { Toast, type ToastType } from '@/components/ui/toast';
import { version } from '../../../package.json';

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
  const [toast, setToast] = useState<{
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
      setPasswordError(
        t.security?.currentPassword || 'Enter your current password'
      );
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        t.security?.passwordTooShort ||
          'New password must be at least 8 characters'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        t.security?.passwordsNoMatch || 'Passwords do not match'
      );
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        t.settings?.masterPasswordMustDiffer ||
          'New password must be different from current'
      );
      return;
    }

    setIsChangingPassword(true);

    try {
      const success = await changePassword(currentPassword, newPassword);

      if (success) {
        setToast({
          message:
            t.security?.passwordChangedSuccess ||
            'Your master password has been successfully changed.',
          type: 'success',
        });
        setIsPasswordDialogOpen(false);
        resetPasswordForm();
      } else {
        const message =
          t.security?.wrongPassword || 'Current password is incorrect';
        setPasswordError(message);
        setToast({ message, type: 'error' });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setPasswordError(errorMessage);
      setToast({
        message:
          errorMessage ||
          t.security?.unlockError ||
          'Failed to change password',
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

  return (
    <div className='space-y-0 sm:space-y-6'>
      <div className='-mx-3 sm:mx-0'>
        <Card
          className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
          data-onboarding='settings-app-preferences'
        >
          <CardHeader className='px-3 py-3 sm:px-6 sm:py-4'>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='text-base sm:text-lg'>
                  {t.settings.appSettings}
                </CardTitle>
                <CardDescription className='text-xs sm:text-sm'>
                  {t.settings.appSettingsDescription}
                </CardDescription>
              </div>
              <div className='rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground'>
                v{version}
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-3 pt-0 pb-3 sm:px-6 sm:pt-0 sm:pb-6'>
            <div className='space-y-4'>
              {/* User Name */}
              <div className='flex items-center justify-between py-3'>
                <div>
                  <p className='font-medium'>
                    {t.settings?.appNameLabel || 'Your name'}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {t.settings?.appNameDescription || 'Used in the greeting'}
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  {isEditingName ? (
                    <>
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className='w-40'
                        placeholder={
                          t.settings?.appNamePlaceholder || 'Your name...'
                        }
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
                        size='icon'
                        onClick={handleSaveName}
                        disabled={updateUserMutation.isPending}
                        className='rounded-md hover:bg-purple-600 hover:text-white'
                      >
                        <Check className='h-4 w-4' />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className='text-sm text-muted-foreground'>
                        {user?.name || t.settings?.appNameUnset || 'Not set'}
                      </span>
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => setIsEditingName(true)}
                              className='rounded-md hover:bg-purple-600 hover:text-white'
                            >
                              <Pencil className='h-4 w-4' />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t.common?.edit || 'Edit'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                </div>
              </div>

              {/* Master Password */}
              <div className='flex items-center justify-between border-t py-3'>
                <div className='flex items-start gap-3'>
                  <div>
                    <p className='font-medium'>
                      {t.settings?.masterPasswordTitle || 'Master password'}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {t.settings?.masterPasswordDescription ||
                        'Encrypts all your financial data locally'}
                    </p>
                  </div>
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
                        t.security?.changePassword ||
                        'Change password'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className='sm:max-w-md'>
                    <DialogHeader>
                      <DialogTitle>
                        {t.settings?.masterPasswordDialogTitle ||
                          'Change master password'}
                      </DialogTitle>
                      <DialogDescription>
                        {t.settings?.masterPasswordDialogDescription ||
                          'Enter your current password and choose a new password.'}
                      </DialogDescription>
                    </DialogHeader>

                    <div className='space-y-4'>
                      <div className='rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30'>
                        <p className='flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200'>
                          <AlertTriangle className='mt-0.5 h-4 w-4 flex-shrink-0' />
                          {t.settings?.masterPasswordWarning ||
                            'Warning: Your password cannot be recovered. If you forget it, your data cannot be decrypted.'}
                        </p>
                      </div>
                      <div className='space-y-2'>
                        <label
                          htmlFor='current-password'
                          className='text-sm font-medium'
                        >
                          {t.settings?.masterPasswordCurrent ||
                            t.security?.currentPassword ||
                            'Current password'}
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
                          {t.settings?.masterPasswordNew || 'New password'}
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
                          {t.settings?.masterPasswordMinLength ||
                            'Minimum 8 characters'}
                        </p>
                      </div>

                      <div className='space-y-2'>
                        <label
                          htmlFor='confirm-password'
                          className='text-sm font-medium'
                        >
                          {t.settings?.masterPasswordConfirm ||
                            'Confirm new password'}
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
                        {t.common?.cancel || 'Cancel'}
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
                          ? t.settings?.masterPasswordChanging || 'Changing...'
                          : t.settings?.masterPasswordChange ||
                            t.security?.changePassword ||
                            'Change password'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Language */}
              <div className='flex items-center justify-between border-t py-3'>
                <div>
                  <p className='font-medium'>{t.settings.language}</p>
                  <p className='text-sm text-muted-foreground'>
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
              <div className='flex items-center justify-between border-t py-3'>
                <div>
                  <p className='font-medium'>{t.settings.currency}</p>
                  <p className='text-sm text-muted-foreground'>
                    {t.settings.currencyDescription}
                  </p>
                </div>
                <span className='text-sm text-muted-foreground'>€</span>
              </div>

              {/* Theme */}
              <div className='flex items-center justify-between border-t py-3'>
                <div>
                  <p className='font-medium'>{t.settings.theme}</p>
                  <p className='text-sm text-muted-foreground'>
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
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
