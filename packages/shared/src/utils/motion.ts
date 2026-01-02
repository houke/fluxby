export type MotionTier = 'full' | 'medium' | 'low' | 'minimal';

const MOTION_SCALE: Record<MotionTier, string> = {
  full: '1',
  medium: '0.7',
  low: '0.4',
  minimal: '0',
};

const MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

const MOBILE_REGEX = /Android|Pixel|iPhone|iPad|iPod|Mobile/i;

const TABLET_REGEX = /iPad|Tablet/i;

const DEFAULT_TIER: MotionTier = 'full';

const MIN_MEDIUM_CPU = 6;
const MIN_LOW_CPU = 4;
const MIN_LOW_MEMORY = 3;

const CONNECTION_TYPES_PENALTY = new Set(['slow-2g', '2g']);

export function detectMotionTier(): MotionTier {
  if (typeof window === 'undefined') {
    return DEFAULT_TIER;
  }

  try {
    if (window.matchMedia?.(MOTION_MEDIA_QUERY).matches) {
      return 'minimal';
    }
  } catch {
    // Ignore matchMedia errors.
  }

  const navigatorRef = window.navigator as Navigator & {
    deviceMemory?: number;
    hardwareConcurrency?: number;
    connection?: {
      saveData?: boolean;
      effectiveType?: string;
      addEventListener?: (type: string, listener: () => void) => void;
      removeEventListener?: (type: string, listener: () => void) => void;
      addListener?: (listener: () => void) => void;
      removeListener?: (listener: () => void) => void;
    };
  };

  const hardwareConcurrency = navigatorRef.hardwareConcurrency ?? 8;
  const deviceMemory = navigatorRef.deviceMemory ?? 8;
  const connection = navigatorRef.connection;
  const saveData = Boolean(connection?.saveData);
  const effectiveType = connection?.effectiveType ?? '';
  const userAgent = navigatorRef.userAgent ?? '';
  const isMobile = MOBILE_REGEX.test(userAgent);
  const isTablet = TABLET_REGEX.test(userAgent);

  if (saveData || CONNECTION_TYPES_PENALTY.has(effectiveType)) {
    return 'low';
  }

  if (deviceMemory && deviceMemory <= MIN_LOW_MEMORY) {
    return 'low';
  }

  if (hardwareConcurrency && hardwareConcurrency <= MIN_LOW_CPU) {
    return 'low';
  }

  if (isMobile || isTablet || hardwareConcurrency <= MIN_MEDIUM_CPU) {
    return 'medium';
  }

  return DEFAULT_TIER;
}

export function observeMotionTier(
  callback: (tier: MotionTier) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia?.(MOTION_MEDIA_QUERY);
  const navigatorRef = window.navigator as Navigator & {
    connection?: {
      addEventListener?: (type: string, listener: () => void) => void;
      removeEventListener?: (type: string, listener: () => void) => void;
      addListener?: (listener: () => void) => void;
      removeListener?: (listener: () => void) => void;
    };
  };
  const connection = navigatorRef.connection;

  const handler = () => {
    callback(detectMotionTier());
  };

  try {
    mediaQuery?.addEventListener?.('change', handler);
  } catch {
    mediaQuery?.addListener?.(handler);
  }

  if (connection?.addEventListener) {
    connection.addEventListener('change', handler);
  } else if (connection?.addListener) {
    connection.addListener(handler);
  }

  window.addEventListener('resize', handler);

  return () => {
    try {
      mediaQuery?.removeEventListener?.('change', handler);
    } catch {
      mediaQuery?.removeListener?.(handler);
    }

    if (connection?.removeEventListener) {
      connection.removeEventListener('change', handler);
    } else if (connection?.removeListener) {
      connection.removeListener(handler);
    }

    window.removeEventListener('resize', handler);
  };
}

export function applyMotionTierAttribute(
  tier: MotionTier,
  target?: HTMLElement
): void {
  if (typeof document === 'undefined') {
    return;
  }
  const element = target ?? document.documentElement;
  element.setAttribute('data-motion-tier', tier);
  element.style.setProperty('--motion-scale', MOTION_SCALE[tier]);
}
