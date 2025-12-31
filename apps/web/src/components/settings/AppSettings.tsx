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
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
    setPasswordSuccess(null);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    // Validation
    if (!currentPassword) {
      setPasswordError(
        language === 'nl'
          ? 'Voer je huidige wachtwoord in'
          : 'Enter your current password'
      );
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        language === 'nl'
          ? 'Nieuw wachtwoord moet minimaal 8 tekens zijn'
          : 'New password must be at least 8 characters'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        language === 'nl'
          ? 'Wachtwoorden komen niet overeen'
          : 'Passwords do not match'
      );
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        language === 'nl'
          ? 'Nieuw wachtwoord moet anders zijn dan het huidige'
          : 'New password must be different from current'
      );
      return;
    }

    setIsChangingPassword(true);

    try {
      const success = await changePassword(currentPassword, newPassword);

      if (success) {
        // Success - show message
        setPasswordSuccess(
          language === 'nl'
            ? 'Je master wachtwoord is succesvol gewijzigd.'
            : 'Your master password has been successfully changed.'
        );
        // Clear success message after 5 seconds
        setTimeout(() => setPasswordSuccess(null), 5000);
        // Reset form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(
          language === 'nl'
            ? 'Huidig wachtwoord is onjuist'
            : 'Current password is incorrect'
        );
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setPasswordError(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Theme state
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  return (
    <div className='space-y-6'>
      <Card data-onboarding='settings-app-preferences'>
        <CardHeader>
          <CardTitle>{t.settings.appSettings}</CardTitle>
          <CardDescription>{t.settings.appSettingsDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {/* User Name */}
            <div className='flex items-center justify-between py-3'>
              <div>
                <p className='font-medium'>
                  {language === 'nl' ? 'Je naam' : 'Your name'}
                </p>
                <p className='text-sm text-muted-foreground'>
                  {language === 'nl'
                    ? 'Wordt gebruikt in de begroeting'
                    : 'Used in the greeting'}
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
                        language === 'nl' ? 'Je naam...' : 'Your name...'
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
                      {user?.name ||
                        (language === 'nl' ? 'Niet ingesteld' : 'Not set')}
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
                          {t.common?.edit ||
                            (language === 'nl' ? 'Bewerken' : 'Edit')}
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
                    {language === 'nl'
                      ? 'Master wachtwoord'
                      : 'Master password'}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {language === 'nl'
                      ? 'Versleutelt al je financiële gegevens lokaal'
                      : 'Encrypts all your financial data locally'}
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
                    {language === 'nl'
                      ? 'Wachtwoord wijzigen'
                      : 'Change password'}
                  </Button>
                </DialogTrigger>
                <DialogContent className='sm:max-w-md'>
                  <DialogHeader>
                    <DialogTitle>
                      {language === 'nl'
                        ? 'Master wachtwoord wijzigen'
                        : 'Change master password'}
                    </DialogTitle>
                    <DialogDescription>
                      {language === 'nl'
                        ? 'Voer je huidige wachtwoord in en kies een nieuw wachtwoord.'
                        : 'Enter your current password and choose a new password.'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className='space-y-4'>
                    <div className='rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30'>
                      <p className='flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200'>
                        <AlertTriangle className='mt-0.5 h-4 w-4 flex-shrink-0' />
                        {language === 'nl'
                          ? 'Let op: Je wachtwoord kan niet worden hersteld. Als je het vergeet, kunnen je gegevens niet meer worden ontsleuteld.'
                          : 'Warning: Your password cannot be recovered. If you forget it, your data cannot be decrypted.'}
                      </p>
                    </div>
                    <div className='space-y-2'>
                      <label
                        htmlFor='current-password'
                        className='text-sm font-medium'
                      >
                        {language === 'nl'
                          ? 'Huidig wachtwoord'
                          : 'Current password'}
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
                        {language === 'nl'
                          ? 'Nieuw wachtwoord'
                          : 'New password'}
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
                        {language === 'nl'
                          ? 'Minimaal 8 tekens'
                          : 'Minimum 8 characters'}
                      </p>
                    </div>

                    <div className='space-y-2'>
                      <label
                        htmlFor='confirm-password'
                        className='text-sm font-medium'
                      >
                        {language === 'nl'
                          ? 'Bevestig nieuw wachtwoord'
                          : 'Confirm new password'}
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

                    {passwordSuccess && (
                      <p className='flex items-center gap-2 text-sm text-emerald-600'>
                        <Check className='h-4 w-4' />
                        {passwordSuccess}
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
                      {language === 'nl' ? 'Annuleren' : 'Cancel'}
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
                        ? language === 'nl'
                          ? 'Wijzigen...'
                          : 'Changing...'
                        : language === 'nl'
                          ? 'Wachtwoord wijzigen'
                          : 'Change password'}
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
                {(Object.keys(languages) as Array<keyof typeof languages>).map(
                  (lang) => (
                    <Button
                      key={lang}
                      variant={language === lang ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setLanguage(lang)}
                      className='px-3'
                    >
                      {languages[lang].flag} {languages[lang].name}
                    </Button>
                  )
                )}
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
  );
}
