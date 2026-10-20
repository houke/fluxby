/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useViewTransitionNavigate } from '@/lib/view-transitions';

function NavigationProbe() {
  const navigate = useViewTransitionNavigate();
  const location = useLocation();

  return (
    <>
      <output>{`${location.pathname}${location.search}`}</output>
      <button onClick={() => navigate('/transactions')}>Change page</button>
      <button onClick={() => navigate('?period=month')}>Change filter</button>
    </>
  );
}

describe('View Transition navigation', () => {
  const startViewTransition = vi.fn((update: () => void) => {
    update();
    return {} as ViewTransition;
  });

  beforeEach(() => {
    startViewTransition.mockClear();
    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: startViewTransition,
    });
  });

  afterEach(() => {
    delete (document as Partial<Document>).startViewTransition;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('transitions between pages but leaves query-only updates immediate', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <NavigationProbe />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Change page' }));

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(screen.getByText('/transactions')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Change filter' }));

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(screen.getByText('/transactions?period=month')).toBeTruthy();
  });

  it('respects the reduced motion preference', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <NavigationProbe />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Change page' }));

    expect(startViewTransition).not.toHaveBeenCalled();
    expect(screen.getByText('/transactions')).toBeTruthy();
  });
});
