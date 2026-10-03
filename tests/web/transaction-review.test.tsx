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
  restoreCategory: vi.fn(),
  link: vi.fn(),
  bill: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  profile: 'profile',
  transactions: vi.fn(),
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
  useProfile: () => ({ activeProfileId: mocks.profile }),
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
    getReviewTransactions: mocks.transactions,
    getTransactionLinks: async () => [],
    saveReviewDecision: mocks.save,
    undoReviewDecision: mocks.undo,
    saveReviewedCategory: mocks.category,
    undoReviewedCategory: mocks.restoreCategory,
    createTransactionLink: mocks.link,
    markTransactionRecurring: mocks.bill,
  }),
}));
const reviewRows = [
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
];
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
  mocks.profile = 'profile';
  mocks.save.mockResolvedValue(null);
  mocks.category.mockResolvedValue(null);
  mocks.transactions.mockResolvedValue(reviewRows);
  HTMLElement.prototype.scrollIntoView = vi.fn();
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mocks.link.mockResolvedValue('link');
});
afterEach(() => {
  cleanup();
  client.clear();
});
const show = async () => {
  const rendered = render(
    <QueryClientProvider client={client}>
      <TransactionReview view={view} />
    </QueryClientProvider>
  );
  fireEvent.click(screen.getByRole('button', { name: 'Review inbox' }));
  await screen.findByText('Uncategorized');
  return rendered;
};
const choose = async (label: string, option: RegExp | string) => {
  fireEvent.keyDown(screen.getByRole('combobox', { name: label }), {
    key: 'ArrowDown',
  });
  fireEvent.click(await screen.findByRole('option', { name: option }));
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
            name: /Undo last decision/,
          }) as HTMLButtonElement
        ).disabled
      ).toBe(false)
    );
    fireEvent.click(screen.getByRole('button', { name: /Undo last decision/ }));
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
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Undo last decision/ })
      ).toHaveProperty('disabled', false)
    );
    fireEvent.click(screen.getByRole('button', { name: /Undo last decision/ }));
    await waitFor(() =>
      expect(mocks.restoreCategory).toHaveBeenCalledWith('expense', null, null)
    );
  });
  it('links a partial reimbursement with its explicit relationship', async () => {
    await show();
    fireEvent.click(screen.getByRole('button', { name: 'Link manually' }));
    await choose('Incoming payment', /Tikkie/);
    await choose('Original expense', /Groceries/);
    await choose('Link type', 'Expense reimbursement (for example Tikkie)');
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
  it('keeps a bounded undo history and restores successive decisions', async () => {
    await show();
    for (let count = 0; count < 21; count++) {
      const later = screen.getByRole('button', { name: 'Later (7 days)' });
      await waitFor(() => expect(later).toHaveProperty('disabled', false));
      fireEvent.click(later);
      await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(count + 1));
      await waitFor(() => expect(later).toHaveProperty('disabled', false));
    }
    expect(
      screen.getByRole('button', { name: 'Undo last decision (20)' })
    ).toHaveProperty('disabled', false);
    for (let count = 0; count < 2; count++) {
      fireEvent.click(
        screen.getByRole('button', { name: /Undo last decision/ })
      );
      await waitFor(() => expect(mocks.undo).toHaveBeenCalledTimes(count + 1));
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: /Undo last decision/ })
        ).toHaveProperty('disabled', false)
      );
    }
    expect(
      screen.getByRole('button', { name: 'Undo last decision (18)' })
    ).toBeTruthy();
  });
  it('clears undo and pending form state when the active profile changes', async () => {
    let finish!: () => void;
    mocks.save.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    const rendered = await show();
    fireEvent.click(screen.getByRole('button', { name: 'Later (7 days)' }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalled());
    mocks.profile = 'other';
    rendered.rerender(
      <QueryClientProvider client={client}>
        <TransactionReview view={view} />
      </QueryClientProvider>
    );
    finish();
    fireEvent.click(screen.getByRole('button', { name: 'Review inbox' }));
    await screen.findByText('Uncategorized');
    expect(
      screen.getByRole('button', { name: 'Undo last decision' })
    ).toHaveProperty('disabled', true);
    expect(mocks.success).not.toHaveBeenCalled();
  });
  it('shows ancillary query failures and retries them before enabling actions', async () => {
    mocks.transactions.mockRejectedValueOnce(new Error('Read failure'));
    render(
      <QueryClientProvider client={client}>
        <TransactionReview view={view} />
      </QueryClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Review inbox' }));
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      expect.stringContaining('The review inbox could not be loaded.')
    );
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await screen.findByText('Uncategorized');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Apply category' })
    ).toHaveProperty('disabled', false);
  });
});
