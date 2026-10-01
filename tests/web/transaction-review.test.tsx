/** @vitest-environment jsdom */
import React from 'react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransactionReview } from '@/components/transaction-review/TransactionReview';
import { transactionReviewEn } from '@/lib/i18n/transaction-review-translations';
import type { TransactionView } from '@/lib/transaction-view';
const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  undo: vi.fn(),
  category: vi.fn(),
  link: vi.fn(),
  bill: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: {
      transactionReview: transactionReviewEn,
      common: { loading: 'Loading' },
    },
    language: 'en',
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
vi.mock('@/components/ui/currency', () => ({
  Currency: ({ amount }: { amount: number }) => <span>{amount}</span>,
}));
vi.mock('@/lib/api', () => ({
  api: { getCategories: async () => [{ id: 'food', name: 'Food' }] },
}));
vi.mock('@/lib/db-singleton', () => ({
  getDataService: () => ({
    getTransactionReviewInbox: async () => [
      {
        key: 'uncategorized:expense',
        kind: 'uncategorized',
        transaction: {
          id: 'expense',
          date: '2026-09-01',
          type: 'expense',
          amount: -30,
          description: 'Groceries',
          accountName: 'Bank',
          categoryId: null,
        },
        suggestedCategoryId: 'food',
      },
    ],
    getReviewTransactions: async () => [
      {
        id: 'expense',
        date: '2026-09-01',
        type: 'expense',
        amount: -30,
        description: 'Groceries',
      },
      {
        id: 'income',
        date: '2026-09-02',
        type: 'income',
        amount: 10,
        description: 'Tikkie',
      },
    ],
    getTransactionLinks: async () => [],
    saveReviewDecision: mocks.save,
    undoReviewDecision: mocks.undo,
    saveReviewedCategory: mocks.category,
    createTransactionLink: mocks.link,
    markTransactionRecurring: mocks.bill,
  }),
}));
const view: TransactionView = {
  search: '',
  type: 'all',
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  categories: [],
  ibans: [],
  accountName: null,
  addressBookId: null,
  methods: [],
  providers: [],
  compact: false,
};
let client: QueryClient;
beforeEach(() => {
  vi.clearAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mocks.link.mockResolvedValue('link');
});
afterEach(() => {
  cleanup();
  client.clear();
});
const show = async () => {
  render(
    <QueryClientProvider client={client}>
      <TransactionReview view={view} />
    </QueryClientProvider>
  );
  fireEvent.click(screen.getByRole('button', { name: 'Review inbox' }));
  await screen.findByText('Uncategorized');
};
describe('transaction review UI', () => {
  it('supports keyboard later and undo', async () => {
    await show();
    fireEvent.keyDown(screen.getByLabelText('Review transactions'), {
      key: 'l',
    });
    await waitFor(() =>
      expect(mocks.save).toHaveBeenCalledWith('uncategorized:expense', 'later')
    );
    await waitFor(() =>
      expect(
        (
          screen.getByRole('button', {
            name: 'Undo last decision',
          }) as HTMLButtonElement
        ).disabled
      ).toBe(false)
    );
    fireEvent.click(screen.getByRole('button', { name: 'Undo last decision' }));
    await waitFor(() =>
      expect(mocks.undo).toHaveBeenCalledWith('uncategorized:expense')
    );
  });
  it('applies and can restore the previous category', async () => {
    await show();
    fireEvent.click(screen.getByRole('button', { name: 'Apply category' }));
    await waitFor(() =>
      expect(mocks.category).toHaveBeenCalledWith('expense', 'food')
    );
    fireEvent.click(screen.getByRole('button', { name: 'Undo last decision' }));
    await waitFor(() =>
      expect(mocks.category).toHaveBeenLastCalledWith('expense', null)
    );
  });
  it('links a partial reimbursement with its explicit relationship', async () => {
    await show();
    fireEvent.change(screen.getByLabelText('Incoming payment'), {
      target: { value: 'income' },
    });
    fireEvent.change(screen.getByLabelText('Original expense'), {
      target: { value: 'expense' },
    });
    fireEvent.change(screen.getByLabelText('Link type'), {
      target: { value: 'reimbursement' },
    });
    fireEvent.change(screen.getByLabelText('Amount to link (€)'), {
      target: { value: '5,50' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Link reimbursement' }));
    await waitFor(() =>
      expect(mocks.link).toHaveBeenCalledWith({
        sourceId: 'income',
        targetId: 'expense',
        kind: 'refund',
        relationType: 'reimbursement',
        amount: 5.5,
      })
    );
  });
});
