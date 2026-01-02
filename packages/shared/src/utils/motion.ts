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

const MIN_MEDIUM_CPU = 3;
const MIN_LOW_CPU = 2;
const MIN_LOW_MEMORY = 3;
// GPU-capable threshold: devices with good GPU support can handle full quality
const MIN_FULL_QUALITY_CPU = 2;

const CONNECTION_TYPES_PENALTY = new Set(['slow-2g', '2g']);

/**
 * Check if the device likely has good GPU/rendering capabilities.
 * Used to allow high-fidelity mode on capable mobile devices.
 */
function hasGoodGPUSupport(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    if (!gl) return false;

    // Check for reasonable GPU capabilities
    const debugInfo = (gl as WebGLRenderingContext).getExtension(
      'WEBGL_debug_renderer_info'
    );
    if (debugInfo) {
      const renderer = (gl as WebGLRenderingContext).getParameter(
        debugInfo.UNMASKED_RENDERER_WEBGL
      );
      // Modern mobile GPUs that can handle full quality
      const goodGPUs = /adreno|mali|apple|powervr|nvidia|intel/i;
      if (goodGPUs.test(renderer)) {
        return true;
      }
    }

    // Fallback: check max texture size as proxy for GPU capability
    const maxTextureSize = (gl as WebGLRenderingContext).getParameter(
      (gl as WebGLRenderingContext).MAX_TEXTURE_SIZE
    );
    return maxTextureSize >= 4096;
  } catch {
    return false;
  }
}

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
  const isMac = /Macintosh/i.test(userAgent);
  const dpr = window.devicePixelRatio || 1;

  // High-performance indicators that are harder to manipulate
  const isHighDPI = dpr >= 2;
  const hasGoodGPU = hasGoodGPUSupport();

  // Data saver mode always gets low quality
  if (saveData || CONNECTION_TYPES_PENALTY.has(effectiveType)) {
    return 'low';
  }

  // Very low memory devices get low quality
  if (deviceMemory && deviceMemory <= MIN_LOW_MEMORY) {
    // Allow high-end devices with restricted memory reporting to stay at medium
    if (isHighDPI && hasGoodGPU) return 'medium';
    return 'low';
  }

  // Very low CPU devices get low quality
  if (hardwareConcurrency && hardwareConcurrency <= MIN_LOW_CPU) {
    if (isHighDPI && hasGoodGPU) return 'medium';
    return 'low';
  }

  // For mobile/tablet: check if device has good GPU support
  // Capable mobile devices (4+ cores with good GPU) can handle full quality
  if (isMobile || isTablet) {
    if (
      (hardwareConcurrency >= MIN_FULL_QUALITY_CPU || isHighDPI) &&
      deviceMemory >= 4 &&
      hasGoodGPU
    ) {
      return 'full';
    }
    return 'medium';
  }

  // Desktop: If it has a high-end GPU and high DPI, it's likely a high-end machine
  // even if hardwareConcurrency is restricted by the host (e.g. GitHub Pages)
  // Special case for M1/M2/M3 Macs which are always high-end
  if ((isHighDPI && hasGoodGPU) || (isMac && isHighDPI)) {
    return 'full';
  }

  // Desktop with medium CPU gets medium quality
  if (hardwareConcurrency <= MIN_MEDIUM_CPU) {
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
