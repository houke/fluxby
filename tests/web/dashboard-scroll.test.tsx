import { render, screen, waitFor } from '@testing-library/react';
/** @vitest-environment jsdom */
import React from 'react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import { api } from '@/lib/api';
import * as lang from '@/contexts/LanguageContext';
import * as filters from '@/contexts/FilterContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import * as profile from '@/contexts/ProfileContext';
import * as db from '@/contexts/DatabaseContext';

describe('Dashboard auto-scroll behavior', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  // Test wrapper with all required providers
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ProfileProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </ProfileProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    // Mock database context
    vi.spyOn(db, 'useDatabase').mockReturnValue({
      db: null,
      isInitialized: true,
      isInitializing: false,
      error: null,
    } as any);

    vi.spyOn(lang, 'useLanguage').mockReturnValue({
      t: {
        nav: { dashboard: 'Dashboard' },
        dashboard: {
          monthlyIncome: 'Monthly Income',
          expensesByCategory: 'Expenses by Category',
          incomeVsExpenses: 'Income vs Expenses',
          dailyExpenses: 'Daily Expenses',
          income: 'Income',
          expenses: 'Expenses',
          noExpenses: 'No expenses',
          importTransactions: 'Import transactions',
          goToImport: 'Import',
          toSavings: 'To savings',
          netResult: 'Net result',
          budget: 'Budget',
          daysProgress: '{passed} of {total} days',
          totalBudget: 'Total budget',
          spent: 'Spent',
          greetings: {
            morning: 'Good morning',
            afternoon: 'Good afternoon',
            evening: 'Good evening',
            night: 'Good night',
          },
        },
        common: { months: [], monthsShort: [], total: 'Total' },
      },
      language: 'en',
    } as any);

    vi.spyOn(filters, 'useFilterParams').mockReturnValue({
      startDate: undefined,
      endDate: undefined,
    } as any);
    vi.spyOn(filters, 'useFilters').mockReturnValue({
      resetFilters: vi.fn(),
    } as any);

    // Mock profile context
    vi.spyOn(profile, 'useProfile').mockReturnValue({
      activeProfile: { id: 1, name: 'Test Profile', type: 'personal' as any },
      activeProfileId: 1,
      profiles: [{ id: 1, name: 'Test Profile', type: 'personal' as any }],
      isLoading: false,
      isSwitching: false,
      switchProfile: vi.fn(),
      createProfile: vi.fn(),
      updateProfile: vi.fn(),
      deleteProfile: vi.fn(),
      refreshProfiles: vi.fn(),
    } as any);

    // Provide minimal API responses so Dashboard renders
    vi.spyOn(api, 'getUser' as any).mockResolvedValue({
      id: 1,
      name: 'Test',
    } as any);
    vi.spyOn(api, 'getDashboardStats' as any).mockResolvedValue({
      totalBalance: 0,
      totalIncome: 0,
      totalExpenses: 0,
      transferToSavings: 0,
      transferFromSavings: 0,
      netSavingsTransfer: 0,
      savingsRate: 0,
      transactionCount: 0,
      monthlyData: Array.from({ length: 24 }).map((_, i) => ({
        month: `2025-${String(i + 1).padStart(2, '0')}`,
        income: 1000 + i * 10,
        expenses: 800 + i * 8,
        balance: 200 + i * 2,
      })),
      categoryBreakdown: [],
      recentTransactions: [],
    } as any);

    vi.spyOn(api, 'getAccounts' as any).mockResolvedValue([] as any);
    vi.spyOn(api, 'getBudgets' as any).mockResolvedValue([] as any);
    vi.spyOn(api, 'getBalanceForecast' as any).mockResolvedValue(null as any);
    vi.spyOn(api, 'getTopAccounts' as any).mockResolvedValue({
      accounts: [],
      totalCount: 0,
      hasMore: false,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('scrolls the monthly Income vs Expenses bar chart container to the end by default', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Wait for the heading to appear
    const heading = await screen.findByText('Income vs Expenses');
    expect(heading).toBeTruthy();

    const container = await screen.findByTestId('monthly-comparison-scroll');
    // JSDOM doesn't perform layout, so simulate scroll metrics
    Object.defineProperty(container, 'scrollWidth', {
      value: 2000,
      configurable: true,
    });
    Object.defineProperty(container, 'clientWidth', {
      value: 500,
      configurable: true,
    });

    // Wait for the effect to run and set scrollLeft
    await waitFor(() => expect(container.scrollLeft).toBe(1500), {
      timeout: 2000,
    });
  });
});
