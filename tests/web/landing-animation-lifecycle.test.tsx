/** @vitest-environment jsdom */
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ImportAnimation from '../../apps/landing/src/components/screenshot-animations/ImportAnimation';
import SubscriptionsAnimation from '../../apps/landing/src/components/screenshot-animations/SubscriptionsAnimation';
import HelpAnimation from '../../apps/landing/src/components/help/HelpAnimation';
import Screenshots from '../../apps/landing/src/components/Screenshots';
import BudgetsAnimation from '../../apps/landing/src/components/screenshot-animations/BudgetsAnimation';
import SyncAnimation from '../../apps/landing/src/components/screenshot-animations/SyncAnimation';

vi.mock('../../apps/landing/src/contexts/LanguageContext', async () => {
  const { en } = await import('../../apps/landing/src/lib/i18n/en');
  return { useLanguage: () => ({ t: en, language: 'en' }) };
});

describe('landing animation lifecycle', () => {
  let frames: Map<number, FrameRequestCallback>;
  let frameId: number;
  let hidden: boolean;
  let reducedMotion: boolean;
  let mediaListeners: Set<() => void>;
  let observers: {
    callback: IntersectionObserverCallback;
    elements: Element[];
    disconnect: ReturnType<typeof vi.fn>;
  }[];

  const advanceFrame = (time: number) => {
    act(() => {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback(time));
    });
  };

  const setInView = (visible: boolean) => {
    act(() => {
      observers.forEach(({ callback, elements }) =>
        callback(
          elements.map(
            (target) =>
              ({ target, isIntersecting: visible }) as IntersectionObserverEntry
          ),
          {} as IntersectionObserver
        )
      );
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    frames = new Map();
    frameId = 0;
    hidden = false;
    reducedMotion = false;
    mediaListeners = new Set();
    observers = [];
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const id = ++frameId;
      frames.set(id, callback);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
    vi.stubGlobal('matchMedia', () => ({
      get matches() {
        return reducedMotion;
      },
      addEventListener: (_type: string, listener: () => void) =>
        mediaListeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) =>
        mediaListeners.delete(listener),
    }));
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        entry: (typeof observers)[number];
        constructor(callback: IntersectionObserverCallback) {
          this.entry = { callback, elements: [], disconnect: vi.fn() };
          observers.push(this.entry);
        }
        observe = (element: Element) => this.entry.elements.push(element);
        disconnect = () => this.entry.disconnect();
      }
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('owns a single reset timer during import completion and releases it offscreen', () => {
    const { container, rerender, unmount } = render(
      <ImportAnimation isVisible />
    );
    advanceFrame(1000);
    advanceFrame(2100);
    advanceFrame(6200);
    expect(container.textContent).toContain('47');
    expect(frames.size).toBe(0);
    expect(vi.getTimerCount()).toBe(1);
    for (let time = 6220; time <= 6600; time += 20) advanceFrame(time);
    expect(vi.getTimerCount()).toBe(1);

    rerender(<ImportAnimation isVisible={false} />);
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(5000));
    expect(container.textContent).toContain('47');
    rerender(<ImportAnimation isVisible />);
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(1500));
    expect(container.textContent).not.toContain('47');
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not retain an import completion timer after unmount', () => {
    const { unmount } = render(<ImportAnimation isVisible />);
    advanceFrame(1000);
    advanceFrame(2100);
    advanceFrame(6200);
    advanceFrame(6240);
    unmount();
    expect(frames.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('uses second-based subscription phases without a continuous frame loop', () => {
    const { container, unmount } = render(<SubscriptionsAnimation isVisible />);
    expect(frames.size).toBe(0);
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(4000));
    expect(container.textContent).toContain('Price increase detected');
    act(() => vi.advanceTimersByTime(4000));
    expect(container.textContent).not.toContain('Price increase detected');
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('pauses help timers offscreen, in hidden tabs and for reduced motion', () => {
    const { container, unmount } = render(<HelpAnimation type='profile' />);
    expect(vi.getTimerCount()).toBe(0);
    setInView(true);
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(400));
    const visibleText = container.textContent;

    setInView(false);
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(1000));
    expect(container.textContent).toBe(visibleText);
    setInView(true);
    expect(vi.getTimerCount()).toBe(1);
    hidden = true;
    fireEvent(document, new Event('visibilitychange'));
    expect(vi.getTimerCount()).toBe(0);
    hidden = false;
    fireEvent(document, new Event('visibilitychange'));
    expect(vi.getTimerCount()).toBe(1);
    act(() => {
      reducedMotion = true;
      mediaListeners.forEach((listener) => listener());
    });
    expect(vi.getTimerCount()).toBe(0);
    unmount();
    expect(mediaListeners.size).toBe(0);
    expect(observers[0].disconnect).toHaveBeenCalledOnce();
  });

  it('does not start screenshot timers in hidden tabs or with reduced motion', () => {
    const { container, unmount } = render(<Screenshots />);
    setInView(true);
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    hidden = true;
    fireEvent(document, new Event('visibilitychange'));
    expect(frames.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    expect(
      container.querySelector('[data-animation-paused="true"]')
    ).not.toBeNull();
    hidden = false;
    fireEvent(document, new Event('visibilitychange'));
    act(() => {
      reducedMotion = true;
      mediaListeners.forEach((listener) => listener());
    });
    expect(frames.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    unmount();
    expect(mediaListeners.size).toBe(0);
  });

  it('caps stateful demo renders at 30Hz while advancing elapsed animation time', () => {
    const onRender = vi.fn();
    render(
      <React.Profiler id='budget' onRender={onRender}>
        <BudgetsAnimation isVisible />
      </React.Profiler>
    );
    expect(onRender).toHaveBeenCalledOnce();
    advanceFrame(1000);
    advanceFrame(1016);
    expect(onRender).toHaveBeenCalledOnce();
    advanceFrame(1034);
    expect(onRender).toHaveBeenCalledTimes(2);
    advanceFrame(1050);
    expect(onRender).toHaveBeenCalledTimes(2);
  });

  it('keeps device DOM mounted as sync progress changes', () => {
    const { container } = render(<SyncAnimation isVisible />);
    const device = container.querySelector('svg');
    advanceFrame(1000);
    advanceFrame(1500);
    expect(container.querySelector('svg')).toBe(device);
  });
});
