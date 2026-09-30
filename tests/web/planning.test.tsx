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
import { MemoryRouter } from 'react-router-dom';
import Planning from '@/pages/Planning';
import { en } from '@/lib/i18n/en';

const mocks = vi.hoisted(() => ({
  createSavingsGoal: vi.fn(),
  updateSavingsGoal: vi.fn(),
  addSavingsContribution: vi.fn(),
  createNetWorthItem: vi.fn(),
  updatePlanningPreferences: vi.fn(),
  updateMonthlyReview: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  setDateRange: vi.fn(),
  setCategories: vi.fn(),
  checks: {} as Record<string, boolean>,
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
vi.mock('@/contexts/ConfirmContext', () => ({
  useConfirm: () => async () => true,
}));
vi.mock('@/contexts/FilterContext', () => ({
  useFilters: () => ({
    setDateRange: mocks.setDateRange,
    setCategories: mocks.setCategories,
    setTransactionType: vi.fn(),
    clearOpposingAccountFilters: vi.fn(),
  }),
}));
vi.mock('@/lib/api', () => ({
  api: {
    getSavingsGoals: async () => [
      {
        id: 'goal-1',
        name: 'Emergency fund',
        targetAmount: 1000,
        currentAmount: 250,
        deadline: null,
        monthlyContribution: 100,
      },
    ],
    getPlanningPreferences: async () => ({
      minimumBalance: 100,
      reservedSavings: 50,
    }),
    getSafeToSpend: async () => ({
      availableBalance: 2000,
      upcomingObligations: 500,
      goalReservations: 100,
      minimumBalance: 100,
      reservedSavings: 50,
      safeToSpend: 1250,
    }),
    getNetWorth: async () => ({
      cash: 2000,
      assets: 5000,
      liabilities: 1000,
      total: 6000,
      items: [],
    }),
    getMonthlyReview: async (month: string) => ({
      month,
      status: 'open',
      checks: { ...mocks.checks },
    }),
    createSavingsGoal: mocks.createSavingsGoal,
    updateSavingsGoal: mocks.updateSavingsGoal,
    deleteSavingsGoal: vi.fn(),
    addSavingsContribution: mocks.addSavingsContribution,
    createNetWorthItem: mocks.createNetWorthItem,
    updateNetWorthItem: vi.fn(),
    deleteNetWorthItem: vi.fn(),
    updatePlanningPreferences: mocks.updatePlanningPreferences,
    updateMonthlyReview: mocks.updateMonthlyReview,
  },
}));

let client: QueryClient;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.checks = {};
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  mocks.createSavingsGoal.mockResolvedValue({ id: 'new-goal' });
  mocks.updatePlanningPreferences.mockResolvedValue(undefined);
  mocks.addSavingsContribution.mockResolvedValue(undefined);
  mocks.createNetWorthItem.mockResolvedValue({ id: 'new-item' });
  mocks.updateMonthlyReview.mockImplementation(async (_month, changes) => {
    mocks.checks = { ...changes.checks };
  });
});
afterEach(() => {
  cleanup();
  client.clear();
});
const renderPlanning = () =>
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Planning />
      </MemoryRouter>
    </QueryClientProvider>
  );
const setInput = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const selectTab = (name: string) =>
  fireEvent.mouseDown(screen.getByRole('tab', { name }), {
    button: 0,
    ctrlKey: false,
  });

describe('financial planning UI', () => {
  it('creates a savings goal with a target, deadline, and monthly reserve', async () => {
    renderPlanning();
    await screen.findByText('Emergency fund');
    fireEvent.click(screen.getByRole('button', { name: en.planning.addGoal }));
    setInput(en.planning.name, 'Holiday');
    setInput(en.planning.targetAmount, '1500');
    setInput(en.planning.monthlyContribution, '125');
    setInput(en.planning.deadline, '2027-08-01');
    fireEvent.click(screen.getByRole('button', { name: en.common.save }));
    await waitFor(() =>
      expect(mocks.createSavingsGoal).toHaveBeenCalledWith({
        name: 'Holiday',
        targetAmount: 1500,
        monthlyContribution: 125,
        deadline: '2027-08-01',
      })
    );
    await waitFor(() =>
      expect(mocks.success).toHaveBeenCalledWith(en.planning.goalCreated)
    );
  });

  it('records a contribution against the selected goal', async () => {
    renderPlanning();
    await screen.findByText('Emergency fund');
    fireEvent.click(
      screen.getByRole('button', { name: en.planning.contribute })
    );
    setInput(en.planning.contributionAmount, '50');
    fireEvent.click(screen.getByRole('button', { name: en.common.save }));
    await waitFor(() =>
      expect(mocks.addSavingsContribution).toHaveBeenCalledWith('goal-1', 50)
    );
  });

  it('allows zero reserves and keeps failures reviewable', async () => {
    renderPlanning();
    await waitFor(() =>
      expect(
        (screen.getByLabelText(en.planning.minimumBalance) as HTMLInputElement)
          .value
      ).toBe('100')
    );
    setInput(en.planning.minimumBalance, '0');
    setInput(en.planning.reservedSavings, '0');
    fireEvent.click(
      screen.getByRole('button', { name: en.planning.savePreferences })
    );
    await waitFor(() =>
      expect(mocks.updatePlanningPreferences.mock.calls[0]?.[0]).toEqual({
        minimumBalance: 0,
        reservedSavings: 0,
      })
    );
    mocks.createSavingsGoal.mockRejectedValue(new Error('Failure'));
    fireEvent.click(screen.getByRole('button', { name: en.planning.addGoal }));
    setInput(en.planning.name, 'Emergency');
    setInput(en.planning.targetAmount, '2000');
    fireEvent.click(screen.getByRole('button', { name: en.common.save }));
    await waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith(en.planning.saveFailed)
    );
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(
      (screen.getByLabelText(en.planning.name) as HTMLInputElement).value
    ).toBe('Emergency');
  });

  it('records a liability without treating it as an asset', async () => {
    renderPlanning();
    selectTab(en.planning.netWorth);
    fireEvent.click(
      await screen.findByRole('button', { name: en.planning.addItem })
    );
    setInput(en.planning.name, 'Loan');
    setInput(en.planning.itemType, 'liability');
    setInput(en.planning.amount, '3000');
    fireEvent.click(screen.getByRole('button', { name: en.common.save }));
    await waitFor(() =>
      expect(mocks.createNetWorthItem).toHaveBeenCalledWith({
        name: 'Loan',
        type: 'liability',
        amount: 3000,
      })
    );
  });

  it('persists month-specific review progress and opens the selected month for uncategorized transactions', async () => {
    renderPlanning();
    selectTab(en.planning.monthlyReview);
    await screen.findByLabelText(en.planning.reviewUncategorized);
    setInput(en.planning.reviewMonth, '2026-08');
    await waitFor(() =>
      expect(
        screen.getByLabelText(en.planning.reviewUncategorized)
      ).toBeTruthy()
    );
    expect(
      (
        screen.getByRole('button', {
          name: en.planning.finishReview,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
    fireEvent.click(screen.getByLabelText(en.planning.reviewUncategorized));
    await waitFor(() =>
      expect(mocks.updateMonthlyReview).toHaveBeenCalledWith('2026-08', {
        checks: { uncategorized: true },
        status: 'open',
      })
    );
    fireEvent.click(
      screen.getAllByRole('link', { name: en.planning.openArea })[0]
    );
    expect(mocks.setDateRange).toHaveBeenCalledWith(
      new Date(2026, 7, 1),
      new Date(2026, 7, 31)
    );
    expect(mocks.setCategories).toHaveBeenCalledWith(['0']);
  });
});
