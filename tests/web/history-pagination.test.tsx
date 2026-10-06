/** @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ContactListItem } from '@/components/address-book/ContactListItem';
import { SubscriptionCard } from '@/pages/Subscriptions';
import { en } from '@/lib/i18n/en';
import { nl } from '@/lib/i18n/nl';
import type { RecurringPattern } from '@fluxby/shared';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: en, language: 'en' }),
}));
vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({ error: vi.fn() }),
}));
afterEach(cleanup);

const contact = {
  id: 'contact',
  name: 'Household',
  iban: 'NL91ABNA0417164300',
  description: null,
  notes: null,
  createdAt: '2026-10-02',
};
const pattern: RecurringPattern = {
  id: 'pattern',
  opposingIban: null,
  merchantName: 'Music',
  patternType: 'monthly',
  avgAmount: -10,
  lastAmount: -10,
  lastDate: '2026-09-01',
  nextExpectedDate: '2026-10-01',
  isActive: true,
  isConfirmed: true,
  isDismissed: false,
  isVariable: false,
  transactionCount: 10000,
  profileId: 'profile',
  createdAt: '2026-01-01',
};
function history(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `history-${index}`,
    date: '2026-10-01',
    amount: -10,
    description: `History entry ${index}`,
  }));
}
type History = ReturnType<typeof history>;
function card(
  kind: 'contact' | 'subscription',
  copy: typeof en,
  transactions: History,
  isExpanded = true,
  pagination?: {
    page: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  }
) {
  if (kind === 'subscription')
    return (
      <SubscriptionCard
        pattern={pattern}
        t={copy}
        isExpanded={isExpanded}
        transactions={transactions}
      />
    );
  return (
    <ContactListItem
      contact={{ ...contact, transactionCount: pagination?.totalItems }}
      isFirst
      isFirstMerged={false}
      onEditContact={vi.fn()}
      onDeleteContact={vi.fn()}
      onUpdateContact={vi.fn()}
      onCancelEdit={vi.fn()}
      isEditing={false}
      editContactName={contact.name}
      setEditContactName={vi.fn()}
      editContactDescription=''
      setEditContactDescription={vi.fn()}
      isExpanded={isExpanded}
      onToggleExpand={vi.fn()}
      contactTransactions={transactions}
      isLoadingTransactions={false}
      transactionPage={pagination?.page}
      onTransactionPageChange={pagination?.onPageChange}
      onSplitContact={vi.fn()}
      onSelectContactTransactions={vi.fn()}
      hasSharedIban={false}
      addressBook={[]}
      onMergeContacts={vi.fn()}
      isMergePending={false}
      assignPopoverOpen={null}
      setAssignPopoverOpen={vi.fn()}
      assignSearchTerm=''
      setAssignSearchTerm={vi.fn()}
      modalContentElement={null}
      translations={copy}
    />
  );
}

describe.each(['contact', 'subscription'] as const)(
  '%s transaction history pagination',
  (kind) => {
    it.each([
      ['English', en],
      ['Dutch', nl],
    ] as const)(
      'keeps a 10,000-row history bounded with localized %s controls',
      (_language, copy) => {
        render(card(kind, copy, history(10000)));
        expect(screen.getAllByText(/^History entry \d+$/)).toHaveLength(20);
        expect(screen.queryByText('History entry 20')).toBeNull();
        expect(
          (
            screen.getByRole('button', {
              name: copy.common.previous,
            }) as HTMLButtonElement
          ).disabled
        ).toBe(true);
        fireEvent.click(screen.getByRole('button', { name: copy.common.next }));
        expect(screen.getAllByText(/^History entry \d+$/)).toHaveLength(20);
        expect(screen.getByText('History entry 20')).toBeTruthy();
        expect(screen.queryByText('History entry 0')).toBeNull();
        expect(screen.getByText('21–40 / 10000')).toBeTruthy();
      }
    );

    it('makes every history record reachable and resets after collapse or replacement', () => {
      const transactions = history(43);
      const view = render(card(kind, en, transactions));
      const visited = new Set<string>();
      for (let page = 0; page < 3; page++) {
        screen
          .getAllByText(/^History entry \d+$/)
          .forEach((element) => visited.add(element.textContent ?? ''));
        const next = screen.getByRole('button', {
          name: en.common.next,
        }) as HTMLButtonElement;
        if (page < 2) fireEvent.click(next);
        else expect(next.disabled).toBe(true);
      }
      expect(visited.size).toBe(43);
      expect(screen.getAllByText(/^History entry \d+$/)).toHaveLength(3);
      view.rerender(card(kind, en, transactions, false));
      expect(screen.queryByText(/^History entry \d+$/)).toBeNull();
      view.rerender(card(kind, en, transactions));
      expect(screen.getByText('History entry 0')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: en.common.next }));
      view.rerender(card(kind, en, history(25)));
      expect(screen.getByText('History entry 0')).toBeTruthy();
      expect(screen.getAllByText(/^History entry \d+$/)).toHaveLength(20);
    });
  }
);

describe('Contact SQL history pages', () => {
  it.each([
    ['English', en],
    ['Dutch', nl],
  ] as const)(
    'renders each bounded %s SQL page once and reaches records beyond the old 50-row cap',
    (_language, copy) => {
      const records = history(61);
      let page = 0;
      const view = render(
        card('contact', copy, records.slice(0, 20), true, {
          page,
          totalItems: records.length,
          onPageChange: changePage,
        })
      );
      function changePage(nextPage: number) {
        page = nextPage;
        view.rerender(
          card(
            'contact',
            copy,
            records.slice(page * 20, page * 20 + 20),
            true,
            {
              page,
              totalItems: records.length,
              onPageChange: changePage,
            }
          )
        );
      }
      const visited = new Set<string>();
      for (let index = 0; index < 4; index++) {
        const rows = screen.getAllByText(/^History entry \d+$/);
        expect(rows.length).toBe(index === 3 ? 1 : 20);
        rows.forEach((element) => visited.add(element.textContent ?? ''));
        const next = screen.getByRole('button', {
          name: copy.common.next,
        }) as HTMLButtonElement;
        if (index < 3) fireEvent.click(next);
        else expect(next.disabled).toBe(true);
      }
      expect(visited.size).toBe(61);
      expect(screen.getByText('61–61 / 61')).toBeTruthy();
      fireEvent.click(
        screen.getByRole('button', { name: copy.common.previous })
      );
      expect(screen.getByText('History entry 40')).toBeTruthy();
      expect(screen.queryByText('History entry 60')).toBeNull();
      expect(screen.getAllByText(/^History entry \d+$/)).toHaveLength(20);
    }
  );

  it('keeps Previous reachable when a previously populated remote page becomes empty', () => {
    const changePage = vi.fn();
    render(
      card('contact', en, [], true, {
        page: 3,
        totalItems: 61,
        onPageChange: changePage,
      })
    );
    fireEvent.click(screen.getByRole('button', { name: en.common.previous }));
    expect(changePage).toHaveBeenCalledWith(2);
  });
});
