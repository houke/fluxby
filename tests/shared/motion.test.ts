import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { detectMotionTier, isTouchDevice } from '@shared/utils/motion';

describe('motion quality detection', () => {
  let navigatorMock: {
    userAgent: string;
    hardwareConcurrency?: number;
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  let mediaQueries: Set<string>;
  let createCanvas: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    navigatorMock = {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome',
      hardwareConcurrency: 8,
      deviceMemory: 8,
    };
    mediaQueries = new Set();
    const gl = {
      MAX_TEXTURE_SIZE: 3379,
      getExtension: () => ({ UNMASKED_RENDERER_WEBGL: 37446 }),
      getParameter: (parameter: number) =>
        parameter === 37446 ? 'Apple GPU' : 16384,
    };
    createCanvas = vi.fn(() => ({ getContext: () => gl }));
    vi.stubGlobal('document', { createElement: createCanvas });
    vi.stubGlobal('window', {
      navigator: navigatorMock,
      devicePixelRatio: 3,
      matchMedia: (query: string) => ({ matches: mediaQueries.has(query) }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(['iPhone', 'Android Mobile'])(
    'caps high-DPI %s quality without probing WebGL',
    (device) => {
      navigatorMock.userAgent = `Mozilla/5.0 ${device}`;
      expect(detectMotionTier()).toBe('medium');
      expect(createCanvas).not.toHaveBeenCalled();
    }
  );

  it.each([
    { hardwareConcurrency: 4, deviceMemory: 8 },
    { hardwareConcurrency: 8, deviceMemory: 2 },
  ])('uses low quality on constrained phones: %o', (hardware) => {
    Object.assign(navigatorMock, hardware, { userAgent: 'Android Mobile' });
    expect(detectMotionTier()).toBe('low');
    expect(createCanvas).not.toHaveBeenCalled();
  });

  it('uses medium quality when a phone does not expose memory or CPU hints', () => {
    navigatorMock.userAgent = 'iPhone';
    delete navigatorMock.hardwareConcurrency;
    delete navigatorMock.deviceMemory;
    expect(detectMotionTier()).toBe('medium');
  });

  it('detects a touch tablet with a desktop user agent', () => {
    mediaQueries.add('(pointer: coarse)');
    expect(isTouchDevice()).toBe(true);
    expect(detectMotionTier()).toBe('medium');
    expect(createCanvas).not.toHaveBeenCalled();
  });

  it('respects reduced motion before checking mobile hardware', () => {
    navigatorMock.userAgent = 'iPhone';
    mediaQueries.add('(prefers-reduced-motion: reduce)');
    expect(detectMotionTier()).toBe('minimal');
    expect(createCanvas).not.toHaveBeenCalled();
  });

  it.each([{ saveData: true }, { effectiveType: '2g' }])(
    'respects connection preferences: %o',
    (connection) => {
      navigatorMock.connection = connection;
      expect(detectMotionTier()).toBe('low');
      expect(createCanvas).not.toHaveBeenCalled();
    }
  );

  it('retains full quality on a capable desktop', () => {
    expect(isTouchDevice()).toBe(false);
    expect(detectMotionTier()).toBe('full');
    expect(createCanvas).toHaveBeenCalledOnce();
  });

  it('uses medium quality on a desktop without WebGL or hardware hints', () => {
    createCanvas.mockReturnValue({ getContext: () => null });
    delete navigatorMock.hardwareConcurrency;
    delete navigatorMock.deviceMemory;
    expect(detectMotionTier()).toBe('medium');
  });

  it('uses low quality on a constrained desktop without WebGL', () => {
    createCanvas.mockReturnValue({ getContext: () => null });
    navigatorMock.hardwareConcurrency = 2;
    expect(detectMotionTier()).toBe('low');
  });

  it('handles unavailable media queries', () => {
    window.matchMedia = () => {
      throw new Error('Unavailable');
    };
    expect(isTouchDevice()).toBe(false);
    expect(detectMotionTier()).toBe('full');
  });

  it('is safe during server rendering', () => {
    vi.stubGlobal('window', undefined);
    expect(isTouchDevice()).toBe(false);
    expect(detectMotionTier()).toBe('full');
  });
});
