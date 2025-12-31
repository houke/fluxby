/**
 * Security Setup Component
 *
 * Initial setup screen for new users - collects language, name, and master password.
 * Shows on the purple/pink gradient with the same card style as LockScreen.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  Eye,
  EyeOff,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useEncryption } from '@/contexts/EncryptionContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { FluxbyWebGL } from '@fluxby/shared';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface SecuritySetupProps {
  /** Callback when setup is complete */
  onSetupComplete: () => void;
}

type SetupStep = 'language' | 'name' | 'password' | 'loading';

export function SecuritySetup({ onSetupComplete }: SecuritySetupProps) {
  const { language, setLanguage } = useLanguage();
  const { setupEncryption } = useEncryption();

  const [step, setStep] = useState<SetupStep>('language');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState('');
  const [progressValue, setProgressValue] = useState(0);
  const [setupStartedAt, setSetupStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [seedMs, setSeedMs] = useState<number | null>(null);
  const [encryptionMs, setEncryptionMs] = useState<number | null>(null);

  const t = {
    nl: {
      languageTitle: 'Kies je taal',
      languageDescription: 'Selecteer de taal waarin je Fluxby wilt gebruiken.',
      nameTitle: 'Hoe heet je?',
      nameDescription: 'We gebruiken je naam om Fluxby persoonlijker te maken.',
      namePlaceholder: 'Je naam...',
      passwordTitle: 'Beveilig je gegevens',
      passwordDescription:
        'Kies een master wachtwoord om je financiële gegevens te versleutelen. Dit wachtwoord wordt niet opgeslagen en kan niet worden hersteld - onthoud het goed!',
      passwordPlaceholder: 'Master wachtwoord...',
      confirmPlaceholder: 'Bevestig wachtwoord...',
      passwordHint:
        'Minimaal 8 tekens. Dit wachtwoord kan niet worden hersteld!',
      passwordTooShort: 'Wachtwoord moet minimaal 8 tekens zijn',
      passwordsNoMatch: 'Wachtwoorden komen niet overeen',
      setupError: 'Fout bij opzetten van versleuteling',
      recoveryWarning:
        'Let op: Je wachtwoord kan niet worden hersteld. Als je het vergeet, zijn al je gegevens permanent ontoegankelijk.',
      next: 'Volgende',
      back: 'Vorige',
      finish: 'Aan de slag!',
      settingUp: 'Bezig met beveiligen...',
      loadingTitle: 'Account instellen...',
      loadingDescription: 'We bereiden je persoonlijke omgeving voor.',
      loadingWarning:
        'Sluit dit tabblad niet af totdat het instellen is voltooid.',
      progressDemoAccount: 'Demo account voorbereiden...',
      progressTransactions: 'Transacties aanmaken...',
      progressBudgets: 'Budgetten aanmaken...',
      progressCategories: 'Categorieën aanmaken...',
      progressAddressBook: 'Adresboek vullen...',
      progressEncrypting: 'Versleuteling instellen...',
      progressFinalizing: 'Onboarding voorbereiden...',
      progressDashboard: 'Dashboard voorbereiden, even geduld...',
      elapsed: 'Verstreken',
      seeding: 'Seeden',
      encrypting: 'Versleutelen',
    },
    en: {
      languageTitle: 'Choose your language',
      languageDescription: 'Select the language you want to use Fluxby in.',
      nameTitle: "What's your name?",
      nameDescription:
        "We'll use your name to personalize your Fluxby experience.",
      namePlaceholder: 'Your name...',
      passwordTitle: 'Secure your data',
      passwordDescription:
        'Choose a master password to encrypt your financial data. This password is not stored and cannot be recovered - remember it well!',
      passwordPlaceholder: 'Master password...',
      confirmPlaceholder: 'Confirm password...',
      passwordHint: 'Minimum 8 characters. This password cannot be recovered!',
      passwordTooShort: 'Password must be at least 8 characters',
      passwordsNoMatch: 'Passwords do not match',
      setupError: 'Failed to setup encryption',
      recoveryWarning:
        'Warning: Your password cannot be recovered. If you forget it, all your data will be permanently inaccessible.',
      next: 'Next',
      back: 'Back',
      finish: "Let's get started!",
      settingUp: 'Setting up security...',
      loadingTitle: 'Setting up your account...',
      loadingDescription: "We're preparing your personal environment.",
      loadingWarning: "Please don't close this tab until setup is complete.",
      progressDemoAccount: 'Preparing demo account...',
      progressTransactions: 'Creating transactions...',
      progressBudgets: 'Creating budgets...',
      progressCategories: 'Creating categories...',
      progressAddressBook: 'Filling address book...',
      progressEncrypting: 'Setting up encryption...',
      progressFinalizing: 'Preparing onboarding...',
      progressDashboard: 'Preparing dashboard, please wait...',
      elapsed: 'Elapsed',
      seeding: 'Seeding',
      encrypting: 'Encrypting',
    },
  };

  const texts = t[language] || t.en;

  const formatDuration = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

  useEffect(() => {
    if (step !== 'loading' || !setupStartedAt) return;

    const intervalId = window.setInterval(() => {
      setElapsedMs(performance.now() - setupStartedAt);
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [step, setupStartedAt]);

  const handleLanguageSelect = (lang: 'nl' | 'en') => {
    setLanguage(lang);
    setStep('name');
  };

  const handleNameNext = () => {
    if (userName.trim()) {
      setStep('password');
    }
  };

  const { refreshProfiles, switchProfile } = useProfile();

  const handleFinish = useCallback(async () => {
    setError(null);

    if (password.length < 8) {
      setError(texts.passwordTooShort);
      return;
    }

    if (password !== confirmPassword) {
      setError(texts.passwordsNoMatch);
      return;
    }

    // Switch to loading step
    setStep('loading');
    setIsLoading(true);
    setProgressValue(0);
    setSeedMs(null);
    setEncryptionMs(null);
    setElapsedMs(0);
    setSetupStartedAt(performance.now());

    // Helper to show progress with a small delay for visual feedback
    const showProgress = async (
      message: string,
      progress: number,
      delay = 400
    ) => {
      setLoadingProgress(message);
      setProgressValue(progress);
      await new Promise((resolve) => setTimeout(resolve, delay));
    };

    try {
      // IMPORTANT: Create demo profile and seed data BEFORE setting up encryption
      // This is because setupEncryption changes state which may cause this component
      // to unmount before the async operations complete

      // Create user with the name first
      await showProgress(texts.progressDemoAccount, 10, 500);
      if (userName.trim()) {
        await api.updateUser({ name: userName.trim() });
      }

      // Create demo profile
      const demoProfile = await api.createDemoProfile();
      setProgressValue(15);

      // Seed demo data with progress updates
      // Use a series of progress updates to show activity during the seeding
      const seedStart = performance.now();

      // Show categories progress, then start seeding
      await showProgress(texts.progressCategories, 20, 200);

      // Create a promise that periodically updates progress while seeding
      const seedPromise = api.seedDemoData(demoProfile.id);
      const progressSteps = [
        { progress: 25, message: texts.progressCategories, delay: 800 },
        { progress: 30, message: texts.progressTransactions, delay: 1200 },
        { progress: 35, message: texts.progressTransactions, delay: 1200 },
        { progress: 40, message: texts.progressTransactions, delay: 1200 },
        { progress: 45, message: texts.progressTransactions, delay: 1200 },
        { progress: 50, message: texts.progressBudgets, delay: 1000 },
        { progress: 55, message: texts.progressAddressBook, delay: 1000 },
        { progress: 60, message: texts.progressAddressBook, delay: 1500 },
        { progress: 65, message: texts.progressFinalizing, delay: 1500 },
      ];

      // Run progress updates in parallel with seeding
      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length) {
          const step = progressSteps[stepIndex];
          setProgressValue(step.progress);
          setLoadingProgress(step.message);
          stepIndex++;
        }
      }, 1000);

      try {
        await seedPromise;
      } finally {
        clearInterval(progressInterval);
      }

      setSeedMs(performance.now() - seedStart);
      setProgressValue(70);

      // Show dashboard preparation as the final step
      await showProgress(texts.progressDashboard, 80, 200);

      // Refresh profiles to include the new demo profile
      await refreshProfiles();

      // Switch to demo profile as the active profile
      switchProfile(demoProfile.id);

      // Small delay to ensure profile switch is processed
      await new Promise((resolve) => setTimeout(resolve, 100));

      // NOW setup encryption - this will cause the component to unmount
      // but all critical operations are already complete
      const encryptionStart = performance.now();
      await setupEncryption(password);
      setEncryptionMs(performance.now() - encryptionStart);

      setProgressValue(95);

      // Keep showing dashboard preparation until the very end
      setProgressValue(100);
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Call onSetupComplete to start onboarding
      onSetupComplete();
    } catch (err) {
      console.error('Setup error:', err);
      setError(texts.setupError);
      setStep('password'); // Go back to password step on error
      setIsLoading(false);
      setLoadingProgress('');
      setProgressValue(0);
      setSetupStartedAt(null);
      setElapsedMs(0);
    }
    // Note: Don't set isLoading=false on success because component will unmount
  }, [
    password,
    confirmPassword,
    userName,
    setupEncryption,
    onSetupComplete,
    texts,
    refreshProfiles,
    switchProfile,
  ]);

  const isPasswordValid = password.length >= 8 && password === confirmPassword;

  // Step indicators - only show first 3 steps in indicator, loading is full-screen
  const visibleSteps: SetupStep[] = ['language', 'name', 'password'];
  const currentStepIndex = step === 'loading' ? 2 : visibleSteps.indexOf(step);

  // Show full-screen loading state
  if (step === 'loading') {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'>
        <div className='w-full max-w-md duration-500 animate-in fade-in zoom-in'>
          <Card className='border-white/20 bg-white/70 shadow-2xl backdrop-blur-xl dark:bg-gray-900/80'>
            <CardHeader className='text-center'>
              {/* Fluxby Avatar - 95x95 popped out */}
              <div
                className='mx-auto flex items-center justify-center'
                style={{ marginTop: '-75px' }}
              >
                <FluxbyWebGL width={95} height={95} />
              </div>

              <CardTitle className='mt-4 text-2xl font-bold tracking-tight'>
                {texts.loadingTitle}
              </CardTitle>
              <p className='mt-2 text-sm text-muted-foreground'>
                {texts.loadingDescription}
              </p>
            </CardHeader>

            <CardContent className='flex flex-col items-center gap-6 py-8'>
              {/* Spinner */}
              <div className='relative'>
                <Loader2 className='h-16 w-16 animate-spin text-purple-600' />
              </div>

              {/* Progress text */}
              <p className='text-center text-sm font-medium text-purple-600'>
                {loadingProgress}
              </p>

              {/* Progress bar + timings */}
              <div className='w-full space-y-2'>
                <Progress value={progressValue} />
                <p className='text-center text-xs text-muted-foreground'>
                  {texts.elapsed}: {formatDuration(elapsedMs)}
                  {seedMs !== null
                    ? ` • ${texts.seeding}: ${formatDuration(seedMs)}`
                    : ''}
                  {encryptionMs !== null
                    ? ` • ${texts.encrypting}: ${formatDuration(encryptionMs)}`
                    : ''}
                </p>
              </div>

              {/* Warning */}
              <div className='flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm dark:border-amber-900/50 dark:bg-amber-900/20'>
                <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400' />
                <p className='text-sm leading-relaxed text-amber-800 dark:text-amber-200'>
                  {texts.loadingWarning}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'>
      <div className='w-full max-w-md duration-500 animate-in fade-in zoom-in'>
        <Card className='border-white/20 bg-white/70 shadow-2xl backdrop-blur-xl dark:bg-gray-900/80'>
          <CardHeader className='text-center'>
            {/* Fluxby Avatar - 95x95 popped out */}
            <div
              className='mx-auto flex items-center justify-center'
              style={{ marginTop: '-75px' }}
            >
              <FluxbyWebGL width={95} height={95} />
            </div>

            {/* Step Indicators */}
            <div className='flex items-center justify-center gap-2 pt-4'>
              {visibleSteps.map((s, idx) => (
                <div
                  key={s}
                  className={cn(
                    'h-2 w-2 rounded-full transition-all',
                    idx === currentStepIndex
                      ? 'w-6 bg-purple-600'
                      : idx < currentStepIndex
                        ? 'bg-purple-400'
                        : 'bg-purple-200 dark:bg-purple-900/30'
                  )}
                />
              ))}
            </div>

            <CardTitle className='mt-4 text-2xl font-bold tracking-tight'>
              {step === 'language' && texts.languageTitle}
              {step === 'name' && texts.nameTitle}
              {step === 'password' && texts.passwordTitle}
            </CardTitle>
            <p className='mt-2 text-sm text-muted-foreground'>
              {step === 'language' && texts.languageDescription}
              {step === 'name' && texts.nameDescription}
              {step === 'password' && texts.passwordDescription}
            </p>
          </CardHeader>

          <CardContent>
            {/* Language Selection Step */}
            {step === 'language' && (
              <div className='flex flex-col gap-4'>
                <Button
                  size='lg'
                  variant={language === 'nl' ? 'default' : 'outline'}
                  className={cn(
                    'w-full',
                    language === 'nl' && 'bg-purple-600 hover:bg-purple-700'
                  )}
                  onClick={() => handleLanguageSelect('nl')}
                >
                  🇳🇱 Nederlands
                </Button>
                <Button
                  size='lg'
                  variant={language === 'en' ? 'default' : 'outline'}
                  className={cn(
                    'w-full',
                    language === 'en' && 'bg-purple-600 hover:bg-purple-700'
                  )}
                  onClick={() => handleLanguageSelect('en')}
                >
                  🇬🇧 English
                </Button>
              </div>
            )}

            {/* Name Step */}
            {step === 'name' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleNameNext();
                }}
                className='space-y-6'
              >
                <Input
                  type='text'
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder={texts.namePlaceholder}
                  className='h-12 border border-input bg-white/50 text-center text-base focus:ring-purple-500 dark:bg-gray-800/50'
                  autoFocus
                />

                <div className='flex items-center justify-between'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => setStep('language')}
                    className='gap-1'
                  >
                    <ChevronLeft className='h-3.5 w-3.5' />
                    {texts.back}
                  </Button>
                  <Button
                    type='submit'
                    size='sm'
                    disabled={!userName.trim()}
                    className='gap-1 bg-purple-600 hover:bg-purple-700'
                  >
                    {texts.next}
                    <ChevronRight className='h-3.5 w-3.5' />
                  </Button>
                </div>
              </form>
            )}

            {/* Password Step */}
            {step === 'password' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (isPasswordValid) {
                    handleFinish();
                  }
                }}
                className='space-y-4'
              >
                {/* Warning */}
                <div className='flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm dark:border-amber-900/50 dark:bg-amber-900/20'>
                  <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400' />
                  <p className='text-sm leading-relaxed text-amber-800 dark:text-amber-200'>
                    {texts.recoveryWarning}
                  </p>
                </div>

                {/* Error message */}
                {error && (
                  <div className='rounded-xl border border-destructive/20 bg-destructive/10 p-4 animate-in slide-in-from-top-2'>
                    <p className='text-sm font-medium text-destructive'>
                      {error}
                    </p>
                  </div>
                )}

                <div className='relative'>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder={texts.passwordPlaceholder}
                    className='h-12 border border-input bg-white/50 pr-10 text-center text-base focus:ring-purple-500 dark:bg-gray-800/50'
                    autoFocus
                    autoComplete='new-password'
                    minLength={8}
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

                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder={texts.confirmPlaceholder}
                  className='h-12 border border-input bg-white/50 text-center text-base focus:ring-purple-500 dark:bg-gray-800/50'
                  autoComplete='new-password'
                  minLength={8}
                />

                <p className='text-center text-xs text-muted-foreground'>
                  {texts.passwordHint}
                </p>

                <div className='flex items-center justify-between pt-2'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => setStep('name')}
                    disabled={isLoading}
                    className='gap-1'
                  >
                    <ChevronLeft className='h-3.5 w-3.5' />
                    {texts.back}
                  </Button>
                  <Button
                    type='submit'
                    size='sm'
                    disabled={!isPasswordValid || isLoading}
                    className='gap-1 bg-purple-600 hover:bg-purple-700'
                  >
                    {isLoading ? (
                      <>
                        <div className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent' />
                        {texts.settingUp}
                      </>
                    ) : (
                      texts.finish
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
