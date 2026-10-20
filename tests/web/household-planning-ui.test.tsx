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
import { HouseholdPlanning } from '@/components/planning/HouseholdPlanning';
import { en } from '@/lib/i18n/en';

const mocks = vi.hoisted(() => ({
  checks: {} as Record<string, boolean>,
  updateWeeklyReview: vi.fn(),
  success: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: en, language: 'en' }),
}));
vi.mock('@/contexts/ProfileContext', () => ({
  useProfile: () => ({ activeProfileId: 'profile' }),
}));
vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({ success: mocks.success, error: vi.fn() }),
}));
vi.mock('@/contexts/ConfirmContext', () => ({
  useConfirm: () => async () => true,
}));
vi.mock('@/components/import/AccountFreshness', () => ({
  AccountFreshness: () => null,
}));
vi.mock('@/lib/db-singleton', () => ({
  getDataService: () => ({
    getPlannedCashflows: async () => [],
    getDailyForecast: async () => null,
    getNetWorthHistory: async () => ({ snapshots: [] }),
    getWeeklyReview: async () => ({ checks: { ...mocks.checks }, streak: 0 }),
    getGoalPlanning: async () => [],
    getPlanningRecurringBills: async () => [],
    getGoalTransactionLinks: async () => [],
    updateWeeklyReview: mocks.updateWeeklyReview,
  }),
}));

let client: QueryClient;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.checks = {};
  mocks.updateWeeklyReview.mockImplementation(async (_week, checks) => {
    mocks.checks = { ...checks };
  });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  cleanup();
  client.clear();
});

describe('household weekly review', () => {
  it('preserves the clicked state when the mutation runs after React restores a controlled checkbox', async () => {
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <HouseholdPlanning />
        </MemoryRouter>
      </QueryClientProvider>
    );
    const checkbox = screen.getAllByRole('checkbox')[0] as HTMLInputElement;
    await waitFor(() => expect(checkbox.disabled).toBe(false));
    fireEvent.click(checkbox);
    await waitFor(() => expect(checkbox.checked).toBe(true));
    expect(Object.values(mocks.updateWeeklyReview.mock.calls[0][1])).toContain(
      true
    );
    fireEvent.click(checkbox);
    await waitFor(() => expect(checkbox.checked).toBe(false));
    expect(
      Object.values(mocks.updateWeeklyReview.mock.calls[1][1])
    ).not.toContain(true);
  });
});
