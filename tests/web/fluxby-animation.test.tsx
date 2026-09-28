/** @vitest-environment jsdom */
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MotionTier } from '@shared/utils/motion';

const motion = vi.hoisted(() => ({
  tier: 'medium' as MotionTier,
  touch: true,
  listener: undefined as ((tier: MotionTier) => void) | undefined,
  stopObserving: vi.fn(),
}));

vi.mock('@shared/utils/motion', () => ({
  detectMotionTier: () => motion.tier,
  isTouchDevice: () => motion.touch,
  observeMotionTier: (listener: (tier: MotionTier) => void) => {
    motion.listener = listener;
    return motion.stopObserving;
  },
}));

import { FluxbyWebGL } from '@shared/components/FluxbyWebGL';

const createContext = () => ({
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  setTransform: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  ellipse: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  drawImage: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
});

type MockContext = ReturnType<typeof createContext>;

describe('Fluxby animation workload', () => {
  let contexts: Map<HTMLCanvasElement, MockContext>;
  let frames: Map<number, FrameRequestCallback>;
  let nextFrame: number;
  let pageHidden: boolean;
  let intersectionCallback: IntersectionObserverCallback;
  let disconnect: ReturnType<typeof vi.fn>;

  const getMainContext = (container: HTMLElement) => {
    const canvas = container.querySelector('canvas');
    const context = canvas && contexts.get(canvas);
    if (!context) throw new Error('Expected a rendered animation canvas');
    return context;
  };

  const advanceFrame = (timestamp: number) => {
    act(() => {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback(timestamp));
    });
  };

  beforeEach(() => {
    motion.tier = 'medium';
    motion.touch = true;
    motion.stopObserving.mockClear();
    contexts = new Map();
    frames = new Map();
    nextFrame = 1;
    pageHidden = false;
    disconnect = vi.fn();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => pageHidden);
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(3);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const id = nextFrame++;
      frames.set(id, callback);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          intersectionCallback = callback;
        }
        observe = vi.fn();
        disconnect = disconnect;
      }
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      function (this: HTMLCanvasElement, contextId: string) {
        if (contextId !== '2d') return null;
        let context = contexts.get(this);
        if (!context) {
          context = createContext();
          contexts.set(this, context);
        }
        return context as unknown as CanvasRenderingContext2D;
      }
    );
    vi.spyOn(
      HTMLCanvasElement.prototype,
      'getBoundingClientRect'
    ).mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      width: 240,
      height: 240,
      right: 240,
      bottom: 240,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('caps the mobile backing resolution on its first render', () => {
    const { container } = render(<FluxbyWebGL width={240} height={240} />);
    const canvas = container.querySelector('canvas');
    expect(canvas?.width).toBe(360);
    expect(canvas?.height).toBe(360);
    expect(canvas?.style.width).toBe('240px');
    expect(contexts.size).toBe(6);
  });

  it('reuses moving fur between body updates while continuing animation frames', () => {
    const { container } = render(<FluxbyWebGL width={240} height={240} />);
    const main = getMainContext(container);
    const body = [...contexts.values()].find(
      (context) =>
        context !== main && context.createLinearGradient.mock.calls.length > 0
    );
    if (!body) throw new Error('Expected a cached body layer');
    const furDraws = body.createLinearGradient.mock.calls.length;
    advanceFrame(1050);
    expect(main.clearRect).toHaveBeenCalledTimes(2);
    expect(body.createLinearGradient).toHaveBeenCalledTimes(furDraws);
    expect(main.drawImage).toHaveBeenCalledTimes(2);
    advanceFrame(1200);
    expect(contexts.size).toBe(7);
    const gradientDraws = [...contexts.values()].reduce(
      (count, context) =>
        count + context.createLinearGradient.mock.calls.length,
      0
    );
    advanceFrame(3750);
    expect(contexts.size).toBe(7);
    expect(
      [...contexts.values()].reduce(
        (count, context) =>
          count + context.createLinearGradient.mock.calls.length,
        0
      )
    ).toBe(gradientDraws);
  });

  it('bounds the fur cache across repeated animation cycles', () => {
    render(<FluxbyWebGL width={240} height={240} />);
    for (let timestamp = 1050; timestamp <= 7000; timestamp += 50) {
      advanceFrame(timestamp);
    }
    expect(contexts.size).toBe(17);
    const cacheSize = contexts.size;
    for (let timestamp = 7050; timestamp <= 12000; timestamp += 50) {
      advanceFrame(timestamp);
    }
    expect(contexts.size).toBe(cacheSize);
  });

  it('pauses during scrolling and resumes without rebuilding textures', () => {
    const { container } = render(<FluxbyWebGL width={240} height={240} />);
    const main = getMainContext(container);
    const initialDraws = main.clearRect.mock.calls.length;
    fireEvent.scroll(window);
    expect(frames.size).toBe(0);
    expect(main.clearRect).toHaveBeenCalledTimes(initialDraws);
    act(() => {
      vi.advanceTimersByTime(160);
    });
    expect(frames.size).toBe(1);
    expect(contexts.size).toBe(6);
  });

  it('stops drawing while the page is hidden and resumes with its cache', () => {
    render(<FluxbyWebGL width={240} height={240} />);
    pageHidden = true;
    fireEvent(document, new Event('visibilitychange'));
    expect(frames.size).toBe(0);
    pageHidden = false;
    fireEvent(document, new Event('visibilitychange'));
    expect(frames.size).toBe(1);
    expect(contexts.size).toBe(6);
  });

  it('stops offscreen and releases observers and frames on unmount', () => {
    const { unmount } = render(<FluxbyWebGL width={240} height={240} />);
    act(() =>
      intersectionCallback(
        [
          {
            isIntersecting: false,
            intersectionRatio: 0,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      )
    );
    expect(frames.size).toBe(0);
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(motion.stopObserving).toHaveBeenCalledOnce();
  });

  it('responds to reduced motion with one static frame and no animation loop', () => {
    render(<FluxbyWebGL width={240} height={240} />);
    act(() => motion.listener?.('minimal'));
    expect(frames.size).toBe(0);
  });

  it('keeps full-rate fur and eye tracking on a capable desktop', () => {
    motion.tier = 'full';
    motion.touch = false;
    const { container } = render(<FluxbyWebGL width={240} height={240} />);
    const main = getMainContext(container);
    expect(contexts.size).toBe(5);
    const furDraws = main.createLinearGradient.mock.calls.length;
    advanceFrame(1050);
    expect(main.createLinearGradient.mock.calls.length).toBeGreaterThan(
      furDraws
    );
    expect(contexts.size).toBe(5);
  });
});
