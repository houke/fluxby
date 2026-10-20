/** @vitest-environment jsdom */
import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { findOnboardingTarget } from '@/components/onboarding/onboarding-target';
import { SpotlightOverlay } from '@/components/onboarding/SpotlightOverlay';

const targets: HTMLElement[] = [];
function target(id: string, rect: Partial<DOMRect> = {}) {
  const element = document.createElement('div');
  element.id = id;
  element.getBoundingClientRect = () => ({
    x: 100,
    y: 100,
    top: 100,
    left: 100,
    bottom: 180,
    right: 300,
    width: 200,
    height: 80,
    toJSON: () => ({}),
    ...rect,
  });
  element.scrollIntoView = vi.fn();
  document.body.append(element);
  targets.push(element);
  return element;
}
afterEach(() => {
  cleanup();
  targets.splice(0).forEach((element) => element.remove());
});

describe('tour spotlight arrival', () => {
  it('prefers a visible responsive instance over the hidden desktop instance', () => {
    const hidden = target('desktop', { width: 0, height: 0 });
    const visible = target('mobile');
    hidden.className = visible.className = 'tour-target';
    expect(findOnboardingTarget('.tour-target')).toBe(visible);
  });

  it('uses the feature owner until the conditional control is available', () => {
    const owner = target('owner');
    expect(findOnboardingTarget('#control', '#owner')).toBe(owner);
    const control = target('control');
    expect(findOnboardingTarget('#control', '#owner')).toBe(control);
  });

  it('clears the previous target and discovers a target rendered after navigation', async () => {
    target('first');
    const view = render(<SpotlightOverlay targetSelector='#first' isActive />);
    const cutout = () =>
      view.container.querySelector('mask rect[fill="black"]');
    await waitFor(() => expect(cutout()?.getAttribute('width')).toBe('216'));
    view.rerender(<SpotlightOverlay targetSelector='#later' isActive />);
    await waitFor(() => expect(cutout()).toBeNull());
    target('later', { width: 250 });
    await waitFor(() => expect(cutout()?.getAttribute('width')).toBe('266'));
  });

  it('keeps a hidden responsive target from producing a zero-sized spotlight', async () => {
    target('hidden', { width: 0, height: 0 });
    const view = render(<SpotlightOverlay targetSelector='#hidden' isActive />);
    await waitFor(() =>
      expect(view.container.querySelector('mask')).toBeTruthy()
    );
    expect(view.container.querySelector('mask rect[fill="black"]')).toBeNull();
  });

  it('does not repeatedly scroll a card taller than the viewport once it fills the viewport', async () => {
    const element = target('large', {
      top: -50,
      bottom: innerHeight + 50,
      height: innerHeight + 100,
    });
    const view = render(<SpotlightOverlay targetSelector='#large' isActive />);
    await waitFor(() =>
      expect(
        view.container.querySelector('mask rect[fill="black"]')
      ).toBeTruthy()
    );
    expect(element.scrollIntoView).not.toHaveBeenCalled();
  });
});
