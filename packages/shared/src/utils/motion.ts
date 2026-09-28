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

const CONNECTION_TYPES_PENALTY = new Set(['slow-2g', '2g']);

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent ?? '';
  if (MOBILE_REGEX.test(userAgent) || TABLET_REGEX.test(userAgent)) return true;
  try {
    return Boolean(window.matchMedia?.('(pointer: coarse)').matches);
  } catch {
    return false;
  }
}

/**
 * Estimate desktop GPU feature support. This is only a starting quality hint,
 * rather than a measurement of Canvas 2D frame cost.
 *
 * Returns a score from 0-3:
 * - 0: No WebGL support
 * - 1: Basic WebGL support
 * - 2: Good GPU (recognized renderer or large texture support)
 * - 3: High-end GPU (WebGL2 + recognized renderer + large textures)
 */
function getGPUCapabilityScore(): number {
  if (typeof window === 'undefined') return 0;

  try {
    const canvas = document.createElement('canvas');

    // Try WebGL2 first (indicates more modern GPU)
    const gl2 = canvas.getContext('webgl2');
    const gl =
      gl2 ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');

    if (!gl) return 0;

    const glContext = gl as WebGLRenderingContext;
    let score = 1; // Basic WebGL support

    // Check for recognized high-performance GPU renderer
    const debugInfo = glContext.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = glContext.getParameter(
        debugInfo.UNMASKED_RENDERER_WEBGL
      );
      // Modern GPUs that can handle full quality animations
      const goodGPUs = /adreno|mali|apple|powervr|nvidia|intel|radeon|geforce/i;
      if (goodGPUs.test(renderer)) {
        score = 2;
      }
    }

    // Check max texture size as additional GPU capability proxy
    const maxTextureSize = glContext.getParameter(glContext.MAX_TEXTURE_SIZE);
    if (maxTextureSize >= 8192) {
      score = Math.max(score, 2);
    }

    // WebGL2 support indicates a more capable GPU
    if (gl2 && score >= 2) {
      score = 3;
    }

    return score;
  } catch {
    return 0;
  }
}

export function detectMotionTier(): MotionTier {
  if (typeof window === 'undefined') {
    return DEFAULT_TIER;
  }

  // 1. User preference for reduced motion - always respect this
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

  const connection = navigatorRef.connection;
  const saveData = Boolean(connection?.saveData);
  const effectiveType = connection?.effectiveType ?? '';

  // 2. Data saver mode - user explicitly wants reduced data usage
  if (saveData || CONNECTION_TYPES_PENALTY.has(effectiveType)) {
    return 'low';
  }

  // A Retina display or WebGL2 support does not make continuous Canvas 2D
  // drawing cheap on a phone. Cap touch devices before checking GPU features;
  // coarse pointers also cover iPads using a desktop user agent.
  if (isTouchDevice()) {
    const hardwareConcurrency = navigatorRef.hardwareConcurrency;
    const deviceMemory = navigatorRef.deviceMemory;
    if (
      (hardwareConcurrency !== undefined && hardwareConcurrency <= 4) ||
      (deviceMemory !== undefined && deviceMemory <= 4)
    ) {
      return 'low';
    }
    return 'medium';
  }

  // Desktop GPU features are only a starting quality estimate.
  const gpuScore = getGPUCapabilityScore();
  if (gpuScore >= 2) {
    return 'full';
  }
  if (gpuScore >= 1) {
    return 'medium';
  }

  // Missing hardware hints are common; only reported low values downgrade
  // a desktop without WebGL support.
  const hardwareConcurrency = navigatorRef.hardwareConcurrency ?? 8;
  const deviceMemory = navigatorRef.deviceMemory ?? 8;

  // No WebGL support at all - use CPU/memory as last resort
  if (deviceMemory <= 2 || hardwareConcurrency <= 2) {
    return 'low';
  }

  // Default to medium for unknown configurations
  return 'medium';
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

  // Debounced resize handler that ignores small height-only changes
  // (e.g., mobile browser address bar collapse/expand)
  let resizeTimeout: number | undefined;
  let lastWidth = window.innerWidth;
  let lastHeight = window.innerHeight;
  const MIN_HEIGHT_CHANGE_THRESHOLD = 100; // Ignore height changes < 100px (typical address bar)
  const RESIZE_DEBOUNCE_MS = 250;

  const debouncedResizeHandler = () => {
    if (resizeTimeout) {
      window.clearTimeout(resizeTimeout);
    }

    resizeTimeout = window.setTimeout(() => {
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;
      const widthChanged = currentWidth !== lastWidth;
      const heightChange = Math.abs(currentHeight - lastHeight);

      // Only trigger tier recalculation if:
      // 1. Width changed (orientation change or window resize), OR
      // 2. Height changed significantly (not just address bar)
      if (widthChanged || heightChange >= MIN_HEIGHT_CHANGE_THRESHOLD) {
        lastWidth = currentWidth;
        lastHeight = currentHeight;
        handler();
      }
    }, RESIZE_DEBOUNCE_MS);
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

  window.addEventListener('resize', debouncedResizeHandler);

  return () => {
    if (resizeTimeout) {
      window.clearTimeout(resizeTimeout);
    }

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

    window.removeEventListener('resize', debouncedResizeHandler);
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
