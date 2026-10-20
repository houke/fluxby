/** @vitest-environment jsdom */
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SpotlightProvider, useSpotlight } from '@/contexts/SpotlightContext';
import { en } from '@/lib/i18n/en';

const mocks = vi.hoisted(() => ({
  getTransactions: vi.fn(),
  getAddressBook: vi.fn(),
  getRawAddressBook: vi.fn(),
  navigate: vi.fn(),
}));
let activeProfileId: string | null = 'profile-one';

vi.mock('@/contexts/DatabaseContext', () => ({
  useDatabase: () => ({
    isReady: true,
    dataService: {
      getTransactions: mocks.getTransactions,
      getAddressBook: mocks.getRawAddressBook,
    },
  }),
}));
vi.mock('@/lib/api', () => ({ api: { getAddressBook: mocks.getAddressBook } }));
vi.mock('@/contexts/ProfileContext', () => ({
  useProfile: () => ({ activeProfileId }),
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: en, language: 'en' }),
}));
vi.mock('@/contexts/PrivacyContext', () => ({
  usePrivacy: () => ({ isPrivacyMode: false, togglePrivacyMode: vi.fn() }),
}));
vi.mock('@/contexts/FilterContext', () => ({
  useFilters: () => ({
    setOpposingAccountName: vi.fn(),
    setAddressBookId: vi.fn(),
    setDateRange: vi.fn(),
  }),
}));
vi.mock('@/lib/view-transitions', () => ({
  useViewTransitionNavigate: () => mocks.navigate,
}));
vi.mock('@/components/spotlight/SpotlightDialog', () => ({
  SpotlightDialog: () => null,
}));

describe('Spotlight data loading', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    activeProfileId = 'profile-one';
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    mocks.getTransactions.mockResolvedValue([
      {
        id: 'transaction-one',
        opposingAccountName: 'Profile one merchant',
        description: 'Profile one merchant',
        date: '2026-10-01',
        amount: -10,
      },
    ]);
    mocks.getAddressBook.mockResolvedValue([
      { id: 'contact-one', name: 'Profile one contact', iban: 'NL01TEST' },
    ]);
  });

  afterEach(() => queryClient.clear());

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SpotlightProvider>{children}</SpotlightProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );

  it('does not load transactions or contacts until the search is opened', () => {
    const { result } = renderHook(useSpotlight, { wrapper });

    expect(mocks.getTransactions).not.toHaveBeenCalled();
    expect(mocks.getAddressBook).not.toHaveBeenCalled();
    expect(result.current.recentTransactions).toEqual([]);
    expect(result.current.contacts).toEqual([]);
  });

  it('requests only the latest 100 transactions and reuses fresh results after reopening', async () => {
    const { result } = renderHook(useSpotlight, { wrapper });
    act(() => result.current.open());

    await waitFor(() => {
      expect(result.current.recentTransactions).toHaveLength(1);
      expect(result.current.contacts).toHaveLength(1);
    });
    expect(mocks.getTransactions).toHaveBeenCalledExactlyOnceWith({
      limit: '100',
    });

    act(() => result.current.close());
    expect(result.current.recentTransactions).toEqual([]);
    expect(result.current.contacts).toEqual([]);
    act(() => result.current.open());

    await waitFor(() => {
      expect(result.current.recentTransactions).toHaveLength(1);
    });
    expect(mocks.getTransactions).toHaveBeenCalledTimes(1);
    expect(mocks.getAddressBook).toHaveBeenCalledTimes(1);
  });

  it('reuses the shared profile address-book cache', async () => {
    queryClient.setQueryData(
      ['addressbook', 'profile-one'],
      [{ id: 'cached-contact', name: 'Cached contact', iban: 'NL02TEST' }]
    );
    const { result } = renderHook(useSpotlight, { wrapper });
    act(() => result.current.open());

    await waitFor(() => {
      expect(result.current.contacts[0]?.title).toBe('Cached contact');
    });
    expect(mocks.getAddressBook).not.toHaveBeenCalled();
  });

  it('populates the shared cache with the complete Address Book shape when opened first', async () => {
    const contact = {
      id: 'contact-one',
      name: 'Profile one contact',
      iban: 'NL01TEST',
      ibans: ['NL01TEST', 'NL02TEST'],
      isMerged: true,
      transactionCount: 20,
      totalIncome: 500,
      totalExpenses: 200,
      netAmount: 300,
      lastTransactionDate: '2026-10-01',
    };
    mocks.getAddressBook.mockResolvedValue([contact]);
    const { result } = renderHook(useSpotlight, { wrapper });
    act(() => result.current.open());

    await waitFor(() => expect(result.current.contacts).toHaveLength(1));
    expect(queryClient.getQueryData(['addressbook', 'profile-one'])).toEqual([
      contact,
    ]);
    expect(mocks.getRawAddressBook).not.toHaveBeenCalled();
  });

  it('does not show a previous profile when the active profile changes', async () => {
    const { result, rerender } = renderHook(useSpotlight, { wrapper });
    act(() => result.current.open());
    await waitFor(() => {
      expect(result.current.recentTransactions[0]?.title).toBe(
        'Profile one merchant'
      );
    });

    mocks.getTransactions.mockResolvedValue([
      {
        id: 'transaction-two',
        opposingAccountName: 'Profile two merchant',
        description: 'Profile two merchant',
        date: '2026-10-02',
        amount: -20,
      },
    ]);
    mocks.getAddressBook.mockResolvedValue([
      { id: 'contact-two', name: 'Profile two contact', iban: 'NL03TEST' },
    ]);
    activeProfileId = 'profile-two';
    rerender();

    expect(result.current.recentTransactions).toEqual([]);
    expect(result.current.contacts).toEqual([]);
    await waitFor(() => {
      expect(result.current.recentTransactions[0]?.title).toBe(
        'Profile two merchant'
      );
      expect(result.current.contacts[0]?.title).toBe('Profile two contact');
    });
    expect(mocks.getTransactions).toHaveBeenCalledTimes(2);
    expect(mocks.getAddressBook).toHaveBeenCalledTimes(2);
  });

  it('does not run profile queries while no profile is active', () => {
    activeProfileId = null;
    const { result } = renderHook(useSpotlight, { wrapper });
    act(() => result.current.open());

    expect(mocks.getTransactions).not.toHaveBeenCalled();
    expect(mocks.getAddressBook).not.toHaveBeenCalled();
  });
});
