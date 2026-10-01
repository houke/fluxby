/** @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { en } from '@/lib/i18n/en';
import Budgets from '@/pages/Budgets';

vi.mock('@/components/budgets/MonthlyAllocation',()=>({MonthlyAllocation:()=>null}));

const mocks = vi.hoisted(() => ({
  updateBudget: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: en, language: 'en' }),
}));
vi.mock('@/contexts/ProfileContext', () => ({
  useProfile: () => ({ activeProfileId: 'profile' }),
}));
vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({ success: mocks.success, error: mocks.error }),
}));
vi.mock('@/contexts/ConfirmContext', () => ({ useConfirm: () => vi.fn() }));
vi.mock('@/contexts/FilterContext', () => ({
  useFilters: () => ({
    setCategories: vi.fn(),
    setTransactionType: vi.fn(),
    clearOpposingAccountFilters: vi.fn(),
    filters: {
      dateRange: { start: new Date(2026, 0, 1), end: new Date(2026, 11, 31) },
    },
  }),
}));
vi.mock('@/lib/api', () => ({
  api: {
    getBudgets: async () => [
      {
        id: 'budget',
        categoryId: 'groceries',
        amount: 1200,
        baseAmount: 100,
        period: 'monthly',
        spent: 500,
        remaining: 700,
        percentage: 41.7,
        categoryName: 'Groceries',
      },
    ],
    getCategories: async () => [{ id: 'groceries', name: 'Groceries' }],
    getProposedBudgets: async () => [],
    updateBudget: mocks.updateBudget,
    createBudget: vi.fn(),
    createBudgets: vi.fn(),
    deleteBudget: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('budget editing', () => {
  it('opens and saves the monthly amount when the selected period is a whole year', async () => {
    mocks.updateBudget.mockResolvedValue(undefined);
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Budgets />
        </MemoryRouter>
      </QueryClientProvider>
    );
    fireEvent.click(
      await screen.findByRole('button', { name: en.budgets.editBudget })
    );
    expect(
      (
        screen.getByRole('spinbutton', {
          name: en.budgets.amountPerMonth,
        }) as HTMLInputElement
      ).value
    ).toBe('100');
    fireEvent.click(screen.getByRole('button', { name: en.common.save }));
    await waitFor(() =>
      expect(mocks.updateBudget).toHaveBeenCalledWith('budget', { amount: 100 })
    );
    await waitFor(() =>
      expect(mocks.success).toHaveBeenCalledWith(en.budgets.updated)
    );
    queryClient.clear();
  });
});
