/** @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccountFreshness } from '@/components/import/AccountFreshness';
import { AccountBalanceCards } from '@/components/dashboard/AccountBalanceCards';
import type { Account } from '@fluxby/shared';

const mocks = vi.hoisted(() => ({
  language: 'nl' as 'nl' | 'en',
  getFreshness: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: mocks.language,
    t: { common: { previous: 'Previous', next: 'Next' } },
  }),
}));
vi.mock('@/hooks/useMediaQuery', () => ({ useIsMobile: () => true }));
vi.mock('@/contexts/ProfileContext', () => ({
  useProfile: () => ({ activeProfileId: 'profile' }),
}));
vi.mock('@/lib/db-singleton', () => ({
  getDataService: () => ({ getAccountImportFreshness: mocks.getFreshness }),
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('freshness presentation', () => {
  it('uses a saved account swatch and shows icons for every account type', () => {
    const accounts: Account[] = (
      ['checking', 'savings', 'credit', 'cash', 'loan', 'investment'] as const
    ).map((type) => ({
      id: type,
      name: type,
      iban: '',
      bank: '',
      type,
      color: '#ffffff',
      currentBalance: 10,
      createdAt: '2026-10-02',
    }));
    render(
      <AccountBalanceCards
        accounts={accounts}
        accountScrollIndex={0}
        setAccountScrollIndex={vi.fn()}
      />
    );
    for (const account of accounts) {
      const icon = screen.getByText(account.name).parentElement
        ?.previousElementSibling as HTMLElement;
      expect(icon.querySelector('svg')).toBeTruthy();
      expect(icon.style.backgroundColor).toBe('rgb(255, 255, 255)');
      expect(icon.style.color).toBe('rgb(0, 0, 0)');
    }
  });
  it.each(['nl', 'en'] as const)(
    'renders all statement statuses and the stale-file explanation in %s',
    async (language) => {
      mocks.language = language;
      const now = Date.parse('2026-10-02T12:00:00Z');
      vi.spyOn(Date, 'now').mockReturnValue(now);
      mocks.getFreshness.mockResolvedValue([
        {
          id: 'fresh',
          name: 'Current account',
          lastImportedAt: now,
          newestTransactionDate: '2026-10-01',
        },
        {
          id: 'aging',
          name: 'Aging account',
          lastImportedAt: now,
          newestTransactionDate: '2026-09-20',
        },
        {
          id: 'stale',
          name: 'Old statement',
          lastImportedAt: now,
          newestTransactionDate: '2025-01-01',
        },
        {
          id: 'never',
          name: 'Manual account',
          lastImportedAt: null,
          newestTransactionDate: null,
        },
      ]);
      const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      render(
        <QueryClientProvider client={client}>
          <AccountFreshness />
        </QueryClientProvider>
      );
      await screen.findByText('Current account');
      for (const label of language === 'nl'
        ? ['Actueel', 'Verouderend', 'Verouderd']
        : ['Fresh', 'Aging', 'Stale'])
        expect(screen.getByText(label, { exact: true })).toBeTruthy();
      expect(
        screen.getAllByText(
          language === 'nl' ? 'Nog geen import' : 'No import yet',
          { exact: true }
        ).length
      ).toBeGreaterThan(0);
      expect(
        screen.getByText(
          language === 'nl'
            ? /Een oud bankbestand opnieuw importeren/
            : /Importing an old statement again/
        )
      ).toBeTruthy();
    }
  );
});
