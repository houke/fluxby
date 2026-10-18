/** @vitest-environment jsdom */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { HouseholdPlanning } from '@/components/planning/HouseholdPlanning';
import { en } from '@/lib/i18n/en';
import { nl } from '@/lib/i18n/nl';

const mocks = vi.hoisted(() => ({
  language: 'en' as 'en' | 'nl',
  addGoalTransactionContribution: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: mocks.language,
    t: mocks.language === 'nl' ? nl : en,
  }),
}));
vi.mock('@/contexts/ProfileContext', () => ({
  useProfile: () => ({ activeProfileId: 'profile' }),
}));
vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({ success: mocks.success, error: mocks.error }),
}));
vi.mock('@/contexts/ConfirmContext', () => ({
  useConfirm: () => async () => true,
}));
vi.mock('@/components/import/AccountFreshness', () => ({
  AccountFreshness: () => null,
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: () => null,
  CartesianGrid: () => null,
  Line: () => null,
  LineChart: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));
vi.mock('@/lib/db-singleton', () => ({
  getDataService: () => ({
    getPlannedCashflows: async () => [],
    getDailyForecast: async () => ({ points: [], variableDaily: 0 }),
    getNetWorthHistory: async () => ({ snapshots: [], change30Days: null }),
    getWeeklyReview: async () => ({ checks: {}, streak: 0 }),
    getGoalPlanning: async () => [
      { id: 'goal', name: 'Holiday', archived: false, neededMonthly: null },
    ],
    getPlanningRecurringBills: async () => [],
    getGoalContributionTransactions: async () => [
      { id: 'income', date: '2026-01-01', amount: 150, description: 'Salary' },
    ],
    getGoalTransactionLinks: async () => [],
    getGoalManualContributions: async () => [
      { id: 'manual', amount: 150, createdAt: Date.UTC(2026, 0, 2, 12) },
      { id: 'unrelated', amount: 100, createdAt: Date.UTC(2026, 0, 3, 12) },
    ],
    addGoalTransactionContribution: mocks.addGoalTransactionContribution,
  }),
}));

let client: QueryClient;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.language = 'en';
  mocks.addGoalTransactionContribution.mockResolvedValue(undefined);
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});
afterEach(() => {
  cleanup();
  client.clear();
});
function renderPlanning() {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <HouseholdPlanning />
      </MemoryRouter>
    </QueryClientProvider>
  );
}
async function selectOption(label: string, option: RegExp) {
  const select = screen.getByRole('combobox', { name: label });
  await waitFor(() => expect(select.hasAttribute('disabled')).toBe(false));
  fireEvent.keyDown(select, {
    key: 'ArrowDown',
  });
  fireEvent.keyDown(await screen.findByRole('option', { name: option }), {
    key: 'Enter',
  });
}
describe('household goal contribution linking', () => {
  it.each(['en', 'nl'] as const)(
    'requires an explicit matching manual replacement in %s',
    async (language) => {
      mocks.language = language;
      const copy = (language === 'nl' ? nl : en).householdPlanning;
      renderPlanning();
      fireEvent.click(await screen.findByRole('button', { name: copy.link }));
      await selectOption(copy.transaction, /Salary/);
      const replace = screen.getByRole('combobox', {
        name: copy.replaceManualContribution,
      });
      expect(replace.textContent).toBe(copy.keepManualContributions);
      fireEvent.keyDown(replace, { key: 'ArrowDown' });
      const matching = await screen.findByRole('option', {
        name: /02-01-2026/,
      });
      expect(screen.queryByRole('option', { name: /03-01-2026/ })).toBeNull();
      fireEvent.keyDown(matching, { key: 'Enter' });
      fireEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: copy.save,
        })
      );
      await waitFor(() =>
        expect(mocks.addGoalTransactionContribution).toHaveBeenCalledWith(
          'goal',
          'income',
          150,
          { id: 'manual', createdAt: Date.UTC(2026, 0, 2, 12) }
        )
      );
    }
  );
  it('preserves manual contributions by default and clears replacement after changing the amount', async () => {
    const copy = en.householdPlanning;
    renderPlanning();
    fireEvent.click(await screen.findByRole('button', { name: copy.link }));
    await selectOption(copy.transaction, /Salary/);
    await selectOption(copy.replaceManualContribution, /02-01-2026/);
    fireEvent.change(
      within(screen.getByRole('dialog')).getByLabelText(copy.amount),
      { target: { value: '100' } }
    );
    expect(
      screen.getByRole('combobox', { name: copy.replaceManualContribution })
        .textContent
    ).toBe(copy.keepManualContributions);
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: copy.save,
      })
    );
    await waitFor(() =>
      expect(mocks.addGoalTransactionContribution).toHaveBeenCalledWith(
        'goal',
        'income',
        100,
        undefined
      )
    );
  });
});
