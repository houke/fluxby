/** @vitest-environment jsdom */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccountColors } from '@/components/settings/AccountColors';
import { MonthlyAllocation } from '@/components/budgets/MonthlyAllocation';
import { en } from '@/lib/i18n/en';

const mocks = vi.hoisted(() => ({
  updateAccount: vi.fn(),
  applyMonthlyBudgetSuggestion: vi.fn(),
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
vi.mock('@/lib/db-singleton', () => ({
  getDataService: () => ({
    getAccounts: async () => [{ id: 'bank', name: 'Bank', color: '#8b5cf6' }],
    updateAccount: mocks.updateAccount,
    getBudgets: async () => [
      {
        id: 'monthly',
        categoryId: 'food',
        categoryName: 'Food',
        amount: 100,
        period: 'monthly',
        carryover: 0,
      },
      {
        id: 'yearly',
        categoryId: 'other',
        categoryName: 'Annual insurance',
        amount: 1200,
        period: 'yearly',
        carryover: 0,
      },
    ],
    getBudgetExtensions: async () => ({
      categories: [{ category_id: 'parent', allocation_group: 'wants' }],
      preferences: [],
    }),
    getCategories: async () => [
      { id: 'food', parentId: 'parent', name: 'Food' },
    ],
    getBudgetIncomePlan: async () => 1000,
    getBudgetCommitments: async () => ({ bills: 0, reserves: 0, goals: 0 }),
    getMonthlyBudgetSuggestions: async () => [
      {
        categoryId: 'other',
        categoryName: 'Annual insurance',
        suggestedAmount: 80,
        limitedHistory: false,
      },
    ],
    applyMonthlyBudgetSuggestion: mocks.applyMonthlyBudgetSuggestion,
  }),
}));

let client: QueryClient;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.updateAccount.mockResolvedValue(undefined);
  mocks.applyMonthlyBudgetSuggestion.mockResolvedValue('monthly');
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  cleanup();
  client.clear();
});
const wrap = (children: React.ReactNode) =>
  render(<QueryClientProvider client={client}>{children}</QueryClientProvider>);

describe('household controls', () => {
  it('stages account color changes and saves only the explicit selected color', async () => {
    wrap(<AccountColors />);
    const picker = await screen.findByLabelText(
      `${en.householdBudget.color}: Bank`
    );
    fireEvent.change(picker, { target: { value: '#aabbcc' } });
    fireEvent.change(picker, { target: { value: '#112233' } });
    expect(mocks.updateAccount).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: `${en.householdBudget.save}: Bank` })
    );
    await waitFor(() =>
      expect(mocks.updateAccount).toHaveBeenCalledWith('bank', {
        color: '#112233',
      })
    );
    await waitFor(() =>
      expect(mocks.success).toHaveBeenCalledWith(en.householdBudget.saved)
    );
  });
  it('counts monthly envelopes and applies a suggestion to the selected historical month', async () => {
    wrap(<MonthlyAllocation />);
    const month = await screen.findByLabelText(en.householdBudget.month);
    await waitFor(() =>
      expect(
        screen.getByText(en.householdBudget.assigned).nextElementSibling
          ?.textContent
      ).toBe('€100.00')
    );
    expect(
      screen.getByText(en.householdBudget.wants).nextElementSibling?.textContent
    ).toBe('€100.00');
    fireEvent.change(month, { target: { value: '2025-11' } });
    fireEvent.click(screen.getByText(en.householdBudget.suggestions));
    fireEvent.click(
      await screen.findByRole('button', {
        name: en.householdBudget.useSuggestion,
      })
    );
    await waitFor(() =>
      expect(mocks.applyMonthlyBudgetSuggestion).toHaveBeenCalledWith(
        'other',
        '2025-11',
        80
      )
    );
  });
});
