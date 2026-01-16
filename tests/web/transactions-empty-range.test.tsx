import { render, screen, waitFor, fireEvent } from '@testing-library/react';
/** @vitest-environment jsdom */
import React from 'react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Transactions from '@/pages/Transactions';
import { api } from '@/lib/api';
import { ToastProvider } from '@/contexts/ToastContext';
import * as lang from '@/contexts/LanguageContext';
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
          <ToastProvider>{children}</ToastProvider>
        </MemoryRouter>
      </ProfileProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    vi.spyOn(db, 'useDatabase').mockReturnValue({
      db: null,
      isInitialized: true,
      isInitializing: false,
      error: null,
    } as any);

    vi.spyOn(lang, 'useLanguage').mockReturnValue({
      t: {
        nav: { transactions: 'Transactions' },
        dashboard: {
          income: 'Income',
          expenses: 'Expenses',
          jumpToPeriod: 'Jump to {period}',
        },
        transactions: {
          noTransactionsInRangeTitle: 'No transactions found in this period',
          noTransactionsInRangeDescription:
            'No transactions found in the selected period, but there are matching transactions in your full data.',
          viewAllData: 'View all data',
          noTransactionsFound: 'No transactions found',
          adjustFilters: 'Adjust your filters or search query',
          paymentMethods: {
            pin: 'PIN',
            ideal: 'iDEAL',
            transfer: 'Transfer',
            incasso: 'Direct Debit',
            atm: 'ATM',
            other: 'Other',
          },
        },
        common: { months: [], monthsShort: [], total: 'Total' },
      },
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
    // Restore any globals we replaced in beforeEach
    (global as any).IntersectionObserver = OriginalIntersectionObserver;
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
  });
});
