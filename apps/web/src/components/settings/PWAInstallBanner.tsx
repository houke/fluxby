import React from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Info } from 'lucide-react';

function getManualInstructions(
  browser: string,
  platform: string,
  t: ReturnType<typeof useLanguage>['t']
): { title: string; steps: string[] } | null {
  const instructions = t.pwa?.manualInstructions;
  if (!instructions) return null;

  // iOS Safari
  if (platform === 'ios') {
    return {
      title: instructions.iosSafari?.title || 'Install on iOS',
      steps: instructions.iosSafari?.steps || [
        'Tap the Share button',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" to confirm',
      ],
    };
  }

  // macOS Safari
  if (platform === 'macos' && browser === 'safari') {
    return {
      title: instructions.macosSafari?.title || 'Install on macOS Safari',
      steps: instructions.macosSafari?.steps || [
        'Click File in the menu bar',
        'Select "Add to Dock"',
      ],
    };
  }

  // Desktop Chrome/Edge/Brave
  if (
    ['windows', 'macos', 'linux'].includes(platform) &&
    ['chrome', 'edge', 'brave', 'opera'].includes(browser)
  ) {
    return {
      title: instructions.desktop?.title || 'Install on desktop',
      steps: instructions.desktop?.steps || [
        'Click the install icon in the address bar (right side)',
        'Or click the menu (⋮) and select "Install Fluxby"',
        'Click "Install" to confirm',
      ],
    };
  }

  // Android Chrome
  if (platform === 'android') {
    return {
      title: instructions.android?.title || 'Install on Android',
      steps: instructions.android?.steps || [
        'Tap the menu (⋮) in the top right',
        'Tap "Add to Home screen" or "Install app"',
        'Tap "Add" to confirm',
      ],
    };
  }

  return null;
}

export function PWAInstallBanner() {
  const {
    canPromptInstall,
    isInstalled,
    supportsPWA,
    platform,
    browser,
    showManualInstructions,
    installPWA,
  } = usePWAInstall();
  const { t } = useLanguage();

  // Don't show anything if PWA isn't supported, not installable, and not already installed
  if (!supportsPWA && !canPromptInstall && !isInstalled) {
    return null;
  }

  // Show installed state
  if (isInstalled) {
    return (
      <div className=''>
        <Card className='rounded-none border-x-0 border-green-500/20 bg-green-500/5 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
          <CardHeader className='px-3 py-3 sm:px-6 sm:pb-3'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <CardTitle className='text-base sm:text-lg'>
                  {t.pwa?.installedTitle || 'Fluxby is installed'}
                </CardTitle>
                <CardDescription className='text-xs sm:text-sm'>
                  {t.pwa?.installedDescription ||
                    'You are using the installed version of Fluxby.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show native install prompt if available
  if (canPromptInstall) {
    const instructions = getManualInstructions(browser, platform, t);

    return (
      <div className=''>
        <Card className='rounded-none border-x-0 border-primary/20 bg-primary/5 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
          <CardHeader className='px-3 py-3 sm:px-6 sm:pb-3'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <CardTitle className='text-base sm:text-lg'>
                  {t.pwa?.installTitle || 'Install Fluxby'}
                </CardTitle>
                <CardDescription className='text-xs sm:text-sm'>
                  {t.pwa?.installDescription ||
                    'Install Fluxby for faster loading, offline access, and a native-like experience.'}
                </CardDescription>
              </div>

              <div className='flex items-center'>
                <Button onClick={installPWA} variant='secondary' size='sm'>
                  <Download className='mr-2 h-4 w-4' />
                  {t.pwa?.installButton}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-3 px-3 pt-0 pb-3 sm:px-6 sm:pt-0 sm:pb-6'>
            {instructions ? (
              <div className='rounded-md bg-muted/50 p-3'>
                <div className='mb-2 flex items-center gap-2 text-sm font-medium'>
                  <Info className='h-4 w-4' />
                  {instructions.title}
                </div>
                <ol className='list-inside list-decimal space-y-1 text-sm text-muted-foreground'>
                  {instructions.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show manual instructions for browsers without beforeinstallprompt
  if (showManualInstructions) {
    const instructions = getManualInstructions(browser, platform, t);
    const isDesktop = ['windows', 'macos', 'linux'].includes(platform);

    return (
      <div className=''>
        <Card className='rounded-none border-x-0 border-primary/20 bg-primary/5 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
          <CardHeader className='px-3 py-3 sm:px-6 sm:pb-3'>
            <div className='flex items-center gap-2'>
              <div>
                <CardTitle className='text-base sm:text-lg'>
                  {t.pwa?.installTitle || 'Install Fluxby'}
                </CardTitle>
                <CardDescription className='mt-0 text-xs sm:text-sm'>
                  {t.pwa?.installDescription ||
                    'Install Fluxby for faster loading, offline access, and a native-like experience.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className='px-3 pt-0 pb-3 sm:px-6 sm:pt-0 sm:pb-6'>
            {/* Primary manual instructions for the detected platform */}
            {instructions ? (
              <div className='mb-3 rounded-md bg-muted/50 p-3'>
                <div className='mb-2 flex items-center gap-2 text-sm font-medium'>
                  <Info className='h-4 w-4' />
                  {instructions.title}
                </div>
                <ol className='list-inside list-decimal space-y-1 text-sm text-muted-foreground'>
                  {instructions.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            ) : null}

            {/* Re-introduce a short list of alternative install methods for desktop */}
            {isDesktop && (
              <div className='rounded-md bg-muted/50 p-3'>
                <div className='mb-2 text-sm font-medium'>
                  <Info className='mr-2 inline-block h-4 w-4' />
                  {t.pwa?.desktopInstall?.title || 'Install instructions'}
                </div>
                <ul className='list-inside list-disc space-y-1 pl-5 text-sm text-muted-foreground'>
                  <li>
                    {t.pwa?.desktopInstall?.description ||
                      "Click the install icon in your browser's address bar."}
                  </li>
                  <li>
                    {
                      "Open the browser menu (⋮) and choose 'Install Fluxby' if available."
                    }
                  </li>
                  <li>
                    {
                      'On macOS Safari: File → Add to Dock / Add to Applications.'
                    }
                  </li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
