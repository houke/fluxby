/**
 * Lock Screen Component
 *
 * Displayed when the app is locked, prompting for password or biometric unlock.
 */

import { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useEncryption } from '@/contexts/EncryptionContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { FluxbyWebGL } from '@fluxby/shared';
import { resetAppAndRestartOnboarding } from '@/lib/database-reset';

interface LockScreenProps {
  /** Whether to show the setup form (for new users) */
  showSetup?: boolean;
  /** Callback when setup is complete */
  onSetupComplete?: () => void;
}

export function LockScreen({
  showSetup = false,
  onSetupComplete,
}: LockScreenProps) {
  const { t } = useLanguage();
  const { isEncryptionEnabled, unlock, setupEncryption } = useEncryption();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotDialogOpen, setIsForgotDialogOpen] = useState(false);

  // Determine if we're in setup mode
  const isSetupMode = showSetup || !isEncryptionEnabled;
  // NOTE: Biometrics are intentionally not supported on the lock screen.
  // Fluxby has no password recovery; users can only unlock via master password.

  const handlePasswordUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const success = await unlock(password);
      if (!success) {
        setError(t.security?.wrongPassword || 'Incorrect password');
        setPassword('');
      }
    } catch {
      setError(t.security?.unlockError || 'Failed to unlock');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(
        t.security?.passwordTooShort || 'Password must be at least 8 characters'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(t.security?.passwordsNoMatch || 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await setupEncryption(password);
      onSetupComplete?.();
    } catch {
      setError(t.security?.setupError || 'Failed to setup master password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordReset = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await resetAppAndRestartOnboarding();
    } finally {
      // In practice we reload; this is just for completeness.
      setIsLoading(false);
    }
  };

  return (
    <div className='bg-app-gradient flex min-h-screen flex-col items-center justify-center p-4'>
      <div className='w-full max-w-md duration-500 animate-in fade-in zoom-in'>
        <Card className='glass-morphism border-white/20 bg-white/70 shadow-2xl backdrop-blur-xl dark:bg-gray-900/80'>
          <CardHeader className='text-center'>
            <div
              className='mx-auto flex items-center justify-center'
              style={{ marginTop: '-75px' }}
            >
              <FluxbyWebGL width={95} height={95} />
            </div>
            <CardTitle className='text-2xl font-bold tracking-tight'>
              {isSetupMode
                ? t.security?.setupTitle || 'Set up master password'
                : t.security?.unlockTitle || 'Unlock Fluxby'}
            </CardTitle>
            <p className='mt-2 text-sm text-muted-foreground'>
              {isSetupMode
                ? t.security?.setupDescription ||
                  'Create a master password to protect your data. This password cannot be recovered if lost.'
                : t.security?.unlockDescription ||
                  'Enter your master password to access your data.'}
            </p>
          </CardHeader>
          <CardContent>
            {/* Warning for setup */}
            {isSetupMode && (
              <div className='mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm dark:border-amber-900/50 dark:bg-amber-900/20'>
                <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400' />
                <p className='text-sm leading-relaxed text-amber-800 dark:text-amber-200'>
                  {t.security?.recoveryWarning ||
                    'Warning: Your password cannot be recovered. If you forget it, all your data will be permanently inaccessible.'}
                </p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className='mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4 animate-in slide-in-from-top-2'>
                <p className='text-sm font-medium text-destructive'>{error}</p>
              </div>
            )}

            {/* Password form */}
            <form
              onSubmit={isSetupMode ? handleSetup : handlePasswordUnlock}
              className='space-y-5'
            >
              <div className='space-y-4'>
                <div className='relative'>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={
                      isSetupMode
                        ? t.security?.newPassword || 'Create password'
                        : t.security?.enterPassword || 'Enter password'
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className='h-12 border border-input bg-white/50 pr-10 text-base focus:ring-purple-500 dark:bg-gray-800/50'
                    autoFocus
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground'
                  >
                    {showPassword ? (
                      <EyeOff className='h-5 w-5' />
                    ) : (
                      <Eye className='h-5 w-5' />
                    )}
                  </button>
                </div>

                {isSetupMode && (
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={
                      t.security?.confirmPassword || 'Confirm password'
                    }
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className='h-12 border border-input bg-white/50 text-base focus:ring-purple-500 dark:bg-gray-800/50'
                  />
                )}

                <Button
                  type='submit'
                  className='h-12 w-full bg-purple-600 text-lg font-semibold hover:bg-purple-700'
                  disabled={isLoading}
                >
                  {isLoading
                    ? t.common?.loading || 'Loading...'
                    : isSetupMode
                      ? t.security?.createPassword || 'Create password'
                      : t.security?.unlock || 'Unlock'}
                </Button>
              </div>
            </form>

            {/* Forgot password (reset database) */}
            {!isSetupMode && (
              <div className='mt-2 text-center'>
                <Dialog
                  open={isForgotDialogOpen}
                  onOpenChange={setIsForgotDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      type='button'
                      variant='link'
                      className='h-auto px-0 text-sm text-muted-foreground'
                      disabled={isLoading}
                    >
                      {t.security?.forgotPassword || 'Forgot password?'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {t.security?.forgotPasswordDialogTitle ||
                          'Reset your local data?'}
                      </DialogTitle>
                      <DialogDescription>
                        {t.security?.forgotPasswordDialogDescription ||
                          'Fluxby cannot recover your master password. Resetting will delete your local database and restart onboarding.'}
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
                        onClick={() => setIsForgotDialogOpen(false)}
                        disabled={isLoading}
                      >
                        {t.common?.cancel || 'Cancel'}
                      </Button>
                      <Button
                        type='button'
                        variant='destructive'
                        onClick={handleForgotPasswordReset}
                        disabled={isLoading}
                      >
                        {t.security?.resetDatabase ||
                          t.errors?.resetDatabase ||
                          'Reset database'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>

        <div className='mt-8 text-center'>
          <a
            href='/'
            className='inline-flex items-center text-sm font-medium text-purple-600 transition-colors hover:text-purple-700 hover:underline dark:text-purple-400'
          >
            ← {t.common?.backToHomepage || 'Back to homepage'}
          </a>
        </div>
      </div>
    </div>
  );
}
