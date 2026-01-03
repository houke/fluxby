import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type Platform = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
type Browser =
  | 'chrome'
  | 'edge'
  | 'firefox'
  | 'safari'
  | 'brave'
  | 'opera'
  | 'samsung'
  | 'unknown';

interface PWAInstallInfo {
  canPromptInstall: boolean;
  isInstalled: boolean;
  supportsPWA: boolean;
  platform: Platform;
  browser: Browser;
  showManualInstructions: boolean;
  installPWA: () => Promise<void>;
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/win/.test(ua)) return 'windows';
  if (/mac/.test(ua)) return 'macos';
  if (/linux/.test(ua)) return 'linux';
  return 'unknown';
}

function detectBrowser(): Browser {
  const ua = navigator.userAgent.toLowerCase();
  // Order matters - check more specific browsers first
  // Brave exposes 'brave' on the navigator in some builds
  if ((navigator as any)?.brave) return 'brave';
  if (/edg/.test(ua)) return 'edge';
  if (/opr|opera/.test(ua)) return 'opera';
  if (/samsungbrowser/.test(ua)) return 'samsung';
  if (/chrome/.test(ua)) return 'chrome';
  if (/safari/.test(ua) && !/chrome/.test(ua)) return 'safari';
  if (/firefox/.test(ua)) return 'firefox';
  return 'unknown';
}

function checkIsInstalled(): boolean {
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if ('standalone' in navigator && (navigator as any).standalone) return true;
  return false;
}

function browserSupportsPWA(browser: Browser, platform: Platform): boolean {
  const supported: Record<Browser, Platform[]> = {
    chrome: ['windows', 'macos', 'linux', 'android'],
    edge: ['windows', 'macos', 'linux', 'android'],
    brave: ['windows', 'macos', 'linux', 'android'],
    opera: ['windows', 'macos', 'linux', 'android'],
    samsung: ['android'],
    safari: ['ios', 'macos'],
    firefox: ['android'],
    unknown: [],
  };
  return supported[browser]?.includes(platform) ?? false;
}

export function usePWAInstall(): PWAInstallInfo {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform] = useState<Platform>(detectPlatform);
  const [browser] = useState<Browser>(detectBrowser);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    setIsInstalled(checkIsInstalled());

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    };
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const hasManifestAndSW =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    !!document.querySelector('link[rel="manifest"]');

  const supportsPWA = browserSupportsPWA(browser, platform) || hasManifestAndSW;
  const canPromptInstall = !!deferredPrompt && !isInstalled;

  const showManualInstructions = supportsPWA && !canPromptInstall && !isInstalled;

  return {
    canPromptInstall,
    isInstalled,
    supportsPWA,
    platform,
    browser,
    showManualInstructions,
    installPWA,
  };
}
