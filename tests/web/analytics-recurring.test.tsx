import { render, screen, waitFor } from '@testing-library/react';
/** @vitest-environment jsdom */
import React from 'react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
let AnalyticsComponent: any = null;
import { api } from '@/lib/api';
import * as lang from '@/contexts/LanguageContext';
import * as filters from '@/contexts/FilterContext';

import * as profile from '@/contexts/ProfileContext';
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('Analytics recurring patterns', () => {
  beforeEach(async () => {
    // Mock DB hooks to avoid initializing real DB
    vi.doMock('@/contexts/DatabaseContext', () => {
      return {
        useDataService: () => ({}),
        useDatabase: () => ({
          db: null,
          dataService: null,
          isLoading: false,
          error: null,
          isReady: true,
        }),
      };
    });

    vi.spyOn(lang, 'useLanguage').mockReturnValue({
      t: {
        analytics: {
          title: 'Analytics',
          subtitle: 'Subtitle',
          recurringPayments: 'Recurring payments',
          noPriceHistory: 'No price history available',
          priceHistory: 'Price history',
          average: 'Avg',
          selectSubscription: 'Select a subscription to view price history',
        },
        dashboard: {
          viewSubscriptions: 'View all subscriptions',
          goToSubscriptions: 'Go to subscriptions',
        },
        transactions: { amount: 'Amount' },
        subscriptions: { monthly: 'Monthly' },
      },
      language: 'en',
    } as any);

    vi.spyOn(filters, 'useFilters').mockReturnValue({
      filters: {
        transactionType: 'expense',
        dateRange: {
          start: new Date('2023-01-01'),
          end: new Date('2024-12-31'),
        },
      },
      setCategories: vi.fn(),
      setTransactionType: vi.fn(),
      clearOpposingAccountFilters: vi.fn(),
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

    // Minimal API stubs for other queries used by Analytics
    vi.spyOn(api, 'getMonthlyStats' as any).mockResolvedValue([] as any);
    vi.spyOn(api, 'getCategoryStats' as any).mockResolvedValue([] as any);

    // Import Analytics after mocking DB module
    const mod = await import('@/pages/Analytics');
    AnalyticsComponent = mod.default;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  it('passes date range to getRecurringPatternsWithHistory', async () => {
    const spy = vi
      .spyOn(api, 'getRecurringPatternsWithHistory' as any)
      .mockResolvedValue([] as any);

    render(
      <TestWrapper>
        <AnalyticsComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith('2023-01-01', '2024-12-31');
    });
  });

  it('shows red ↑ when last amount increased vs previous and green ↓ when decreased', async () => {
    // Use negative avgAmount for expenses (subscriptions), but priceHistory amounts
    // are absolute values (positive) since that's what the database returns
    const patterns = [
      {
        id: 'p1',
        merchantName: 'Service A',
        patternType: 'monthly',
        avgAmount: -10, // Expense: negative
        lastAmount: -15,
        lastDate: '2024-12-01',
        nextExpectedDate: null,
        isActive: true,
        isConfirmed: true,
        isDismissed: false,
        isVariable: false,
        transactionCount: 6, // At least 6 transactions required by filter
        profileId: 1,
        createdAt: new Date().toISOString(),
        // Price history from DB uses ABS(amount), so values are positive
        priceHistory: [
          { date: '2024-11-01', amount: 10 },
          { date: '2024-12-01', amount: 15 },
        ],
      },
      {
        id: 'p2',
        merchantName: 'Service B',
        patternType: 'monthly',
        avgAmount: -20, // Expense: negative
        lastAmount: -18,
        lastDate: '2024-12-01',
        nextExpectedDate: null,
        isActive: true,
        isConfirmed: true,
        isDismissed: false,
        isVariable: false,
        transactionCount: 6, // At least 6 transactions required by filter
        profileId: 1,
        createdAt: new Date().toISOString(),
        // Price history from DB uses ABS(amount), so values are positive
        priceHistory: [
          { date: '2024-11-01', amount: 20 },
          { date: '2024-12-01', amount: 18 },
        ],
      },
    ];

    vi.spyOn(api, 'getRecurringPatternsWithHistory' as any).mockResolvedValue(
      patterns as any
    );

    render(
      <TestWrapper>
        <AnalyticsComponent />
      </TestWrapper>
    );

    // Wait for pattern merchant names to appear
    const serviceAElements = await screen.findAllByText('Service A');
    expect(serviceAElements.length).toBeGreaterThan(0);

    // The Subscriptions card shows price change indicators (↑/↓)
    // Find the button that contains the ↑ indicator for Service A (price increased)
    const allButtons = document.querySelectorAll('button');
    let serviceAButton: Element | null = null;
    let serviceBButton: Element | null = null;

    allButtons.forEach((button) => {
      const text = button.textContent || '';
      if (text.includes('Service A') && text.includes('↑')) {
        serviceAButton = button;
      }
      if (text.includes('Service B') && text.includes('↓')) {
        serviceBButton = button;
      }
    });

    // Assert Service A has price increase indicator
    expect(serviceAButton).toBeTruthy();
    const serviceAIndicator = serviceAButton?.querySelector('.text-rose-600');
    expect(serviceAIndicator).toBeTruthy();
    expect(serviceAIndicator?.textContent).toContain('↑');

    // Assert Service B has price decrease indicator
    expect(serviceBButton).toBeTruthy();
    const serviceBIndicator =
      serviceBButton?.querySelector('.text-emerald-600');
    expect(serviceBIndicator).toBeTruthy();
    expect(serviceBIndicator?.textContent).toContain('↓');
  });
});
