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
import { Download, Check, Monitor, Smartphone, Info } from 'lucide-react';

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
      <Card className='border-green-500/20 bg-green-500/5'>
        <CardHeader className='pb-3'>
          <div className='flex items-center gap-2'>
            <Check className='h-5 w-5 text-green-500' />
            <CardTitle className='text-lg'>{t.pwa?.installedTitle}</CardTitle>
          </div>
          <CardDescription>{t.pwa?.installedDescription}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Show native install prompt if available
  if (canPromptInstall) {
    return (
      <Card className='border-primary/20 bg-primary/5'>
        <CardHeader className='pb-3'>
          <div className='flex items-center gap-2'>
            <Download className='h-5 w-5 text-primary' />
            <CardTitle className='text-lg'>{t.pwa?.installTitle}</CardTitle>
          </div>
          <CardDescription>{t.pwa?.installDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={installPWA} className='w-full sm:w-auto'>
            <Download className='mr-2 h-4 w-4' />
            {t.pwa?.installButton}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show manual instructions for browsers without beforeinstallprompt
  if (showManualInstructions) {
    const instructions = getManualInstructions(browser, platform, t);
    const isMobile = ['ios', 'android'].includes(platform);

    return (
      <Card className='border-primary/20 bg-primary/5'>
        <CardHeader className='pb-3'>
          <div className='flex items-center gap-2'>
            {isMobile ? (
              <Smartphone className='h-5 w-5 text-primary' />
            ) : (
              <Monitor className='h-5 w-5 text-primary' />
            )}
            <CardTitle className='text-lg'>{t.pwa?.installTitle}</CardTitle>
          </div>
          <CardDescription>{t.pwa?.installDescription}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
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
          ) : (
            <p className='text-sm text-muted-foreground'>
              {t.pwa?.manualInstructions?.generic ||
                'Use your browser menu to install this app.'}
            </p>
          )}

          {/* Install button shown when browser supports PWA installs. */}
          {supportsPWA && (
            <div>
              <Button
                onClick={() => {
                  if (canPromptInstall) {
                    installPWA();
                  } else {
                    alert(
                      t.pwa?.desktopInstall?.alertMessage ||
                        "Look for the install icon (⊕) in your browser's address bar to install Fluxby."
                    );
                  }
                }}
                variant='outline'
                className='w-full sm:w-auto'
              >
                <Download className='mr-2 h-4 w-4' />
                {t.pwa?.desktopInstall?.buttonText || t.pwa?.installButton}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
