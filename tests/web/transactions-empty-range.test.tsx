import {
  cleanup,
  render,
  screen,
  waitFor,
  fireEvent,
} from '@testing-library/react';
/** @vitest-environment jsdom */
import React from 'react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Transactions from '@/pages/Transactions';
import { api } from '@/lib/api';
import { ToastProvider } from '@/contexts/ToastContext';
import { ConfirmProvider } from '@/contexts/ConfirmContext';
import * as lang from '@/contexts/LanguageContext';
import { en } from '@/lib/i18n/en';
import * as filters from '@/contexts/FilterContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import * as profile from '@/contexts/ProfileContext';
import * as db from '@/contexts/DatabaseContext';

describe('Transactions empty state when period has no matches but full data does', () => {
  let OriginalIntersectionObserver: any;

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ProfileProvider>
        <MemoryRouter>
          <ToastProvider>
            <ConfirmProvider>{children}</ConfirmProvider>
          </ToastProvider>
        </MemoryRouter>
      </ProfileProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient.clear();
    vi.spyOn(db, 'useDatabase').mockReturnValue({
      db: null,
      isInitialized: true,
      isInitializing: false,
      error: null,
    } as any);

    vi.spyOn(lang, 'useLanguage').mockReturnValue({
      t: en,
      language: 'en',
    } as any);

    // Set a date range so the page performs a range query
    vi.spyOn(filters, 'useFilterParams').mockReturnValue({
      startDate: '2025-01-01',
      endDate: '2025-01-31',
    } as any);

    // Provide a test-friendly matchMedia implementation (jsdom doesn't have it)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: () => false,
      }),
    });

    // IntersectionObserver is not present in jsdom by default - provide a minimal stub
    OriginalIntersectionObserver = (global as any).IntersectionObserver;
    (global as any).IntersectionObserver = class {
      constructor(
        _callback: IntersectionObserverCallback,
        _options?: IntersectionObserverInit
      ) {
        // intentionally empty stub
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    };

    // Spy on setDateRange to assert when button is clicked
    const setDateRange = vi.fn();
    vi.spyOn(filters, 'useFilters').mockReturnValue({
      setDateRange,
      setCategories: vi.fn(),
      setOpposingAccountIbans: vi.fn(),
      setOpposingAccountName: vi.fn(),
      setAddressBookId: vi.fn(),
      setTransactionType: vi.fn(),
      clearOpposingAccountFilters: vi.fn(),
      filters: { transactionType: 'expense' },
    } as any);

    vi.spyOn(profile, 'useProfile').mockReturnValue({
      activeProfile: { id: 1, name: 'Test', type: 'personal' as any },
      activeProfileId: 1,
      profiles: [{ id: 1, name: 'Test', type: 'personal' as any }],
      isLoading: false,
      isSwitching: false,
      switchProfile: vi.fn(),
      createProfile: vi.fn(),
      updateProfile: vi.fn(),
      deleteProfile: vi.fn(),
      refreshProfiles: vi.fn(),
    } as any);

    // API: when startDate is present, return empty; when no startDate -> return data
    vi.spyOn(api, 'getTransactions' as any).mockImplementation(
      (filters: any) => {
        if (filters.startDate) {
          return Promise.resolve([] as any);
        }

        return Promise.resolve([
          {
            id: 'tx-1',
            date: '2024-12-01',
            amount: -100,
            type: 'expense',
            profileId: 1,
          },
        ] as any);
      }
    );

    vi.spyOn(api, 'getMinMaxDates' as any).mockResolvedValue({
      minDate: '2024-01-01',
      maxDate: '2025-12-31',
    } as any);

    vi.spyOn(api, 'getTransactionsCountOutsideRange').mockResolvedValue({
      before: 1,
      after: 0,
      total: 1,
    });
    vi.spyOn(api, 'getCategories').mockResolvedValue([]);
    vi.spyOn(api, 'getAccounts').mockResolvedValue([]);
    vi.spyOn(api, 'getCategoryRules').mockResolvedValue([]);
    vi.spyOn(api, 'getPaymentProviderRules').mockResolvedValue([]);
    vi.spyOn(api, 'getAddressBook').mockResolvedValue([]);
    vi.spyOn(api, 'getCleanupRules').mockResolvedValue([]);
    vi.spyOn(api, 'getSuggestedContacts').mockResolvedValue([]);
    vi.spyOn(api, 'getSharedIbans').mockResolvedValue([]);
    vi.spyOn(api, 'suggestCategory').mockResolvedValue(null);

    // Mock the new optimized totals API
    vi.spyOn(api, 'getTransactionTotals' as any).mockResolvedValue({
      income: 0,
      expenses: 100,
      transferToSavings: 0,
      transferFromSavings: 0,
      balance: -100,
      count: 1,
    } as any);
  });

  afterEach(() => {
    cleanup();
    // Restore any globals we replaced in beforeEach
    (global as any).IntersectionObserver = OriginalIntersectionObserver;
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it('shows a CTA to view all data and calls setDateRange with full range', async () => {
    const setDateRangeSpy = (filters as any).useFilters().setDateRange as any;

    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    // Wait for the "View all data" button to appear
    const btn = await screen.findByText('View all data');
    expect(btn).toBeTruthy();

    fireEvent.click(btn);

    await waitFor(() => {
      expect(setDateRangeSpy).toHaveBeenCalled();
      // We expect the call to have been given the min/max dates from the API
      const callArgs = setDateRangeSpy.mock.calls[0];
      expect(callArgs[0]).toEqual(new Date('2024-01-01'));
      expect(callArgs[1]).toEqual(new Date('2025-12-31'));
    });

    // The outside-range aggregate supplies the existence check without
    // materializing the entire matching history a second time.
    expect(api.getTransactions).toHaveBeenCalled();
    for (const [transactionFilters] of vi.mocked(api.getTransactions).mock
      .calls) {
      expect(transactionFilters?.startDate).toBe('2025-01-01');
      expect(transactionFilters?.endDate).toBe('2025-01-31');
    }
  });

  it('shows the no-match state when no matching transactions exist outside the period', async () => {
    vi.mocked(api.getTransactionsCountOutsideRange).mockResolvedValue({
      before: 0,
      after: 0,
      total: 0,
    });

    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    await screen.findByText(en.transactions.noTransactionsFound);
    expect(screen.queryByText(en.transactions.viewAllData)).toBeNull();
  });

  it('only sums recurring history when its row is expanded and does not fetch unused suggestions', async () => {
    const unseenAmount = vi.fn(() => -1);
    const transactions = Array.from({ length: 1000 }, (_, index) => ({
      id: `tx-${index}`,
      date: '2025-01-15',
      amount: -1,
      type: 'expense' as const,
      description: 'Recurring merchant',
      merchantName: 'Recurring merchant',
      opposingAccountName: 'Recurring merchant',
      opposingAccountIban: 'NL91ABNA0417164300',
      accountId: 'account-1',
      categoryId: null,
      notes: null,
      paymentMethod: null,
      rawData: null,
      importHash: `hash-${index}`,
      createdAt: '2025-01-15',
      paymentProvider: null,
      addressBookId: null,
    }));
    Object.defineProperty(transactions[999], 'amount', { get: unseenAmount });
    vi.mocked(api.getTransactions).mockResolvedValue(transactions);
    vi.mocked(api.getTransactionTotals).mockResolvedValue({
      income: 0,
      expenses: 1000,
      transferToSavings: 0,
      transferFromSavings: 0,
      balance: -1000,
      count: 1000,
    });

    const { container } = render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    await screen.findAllByTestId('transaction-checkbox', {}, { timeout: 5000 });
    // The unseen amount is needed by the one fallback totals calculation;
    // collapsed rows must not each scan the same 1,000-item merchant history.
    expect(unseenAmount.mock.calls.length).toBeLessThan(10);
    expect(api.suggestCategory).not.toHaveBeenCalled();

    const readsBeforeExpansion = unseenAmount.mock.calls.length;
    const firstRow = container.querySelector(
      '[data-onboarding="transaction-row"] > div'
    );
    if (!firstRow) throw new Error('Missing recurring transaction row');
    fireEvent.click(firstRow);

    await screen.findByText(en.transactions.recurringHistory);
    expect(unseenAmount.mock.calls.length).toBeGreaterThan(
      readsBeforeExpansion
    );
  });
});
