/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { Currency } from '@/components/ui/currency';

const context = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => context }));
afterEach(cleanup);

describe('Currency', () => {
  it('follows the current interface language', () => {
    context.language = 'en';
    const { rerender } = render(<Currency amount={1234.56} />);
    expect(screen.getByText('€1,234.56')).toBeTruthy();
    context.language = 'nl';
    rerender(<Currency amount={1234.56} />);
    expect(screen.getByText(/1\.234,56/)).toBeTruthy();
  });

  it('honors currency and locale overrides', () => {
    render(<Currency amount={1234.56} currency='USD' locale='en-US' />);
    expect(screen.getByText('$1,234.56')).toBeTruthy();
  });
});
