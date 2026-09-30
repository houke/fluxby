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
import { SubscriptionCard } from '@/pages/Subscriptions';
import { en } from '@/lib/i18n/en';
import type { RecurringPattern } from '@fluxby/shared';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: en, language: 'en' }),
}));
vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({ error: vi.fn() }),
}));
afterEach(cleanup);
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
  transactionCount: 8,
  profileId: 'profile',
  createdAt: '2026-01-01',
};

describe('subscription editing', () => {
  it('preserves expense direction and saves renewal and cancellation dates', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    render(<SubscriptionCard pattern={pattern} t={en} onEdit={save} />);
    fireEvent.click(screen.getByRole('button', { name: en.common.edit }));
    fireEvent.change(screen.getByLabelText(en.subscriptions.avgAmount), {
      target: { value: '15' },
    });
    fireEvent.change(screen.getByLabelText(en.subscriptions.renewalDate), {
      target: { value: '2027-01-01' },
    });
    fireEvent.change(
      screen.getByLabelText(en.subscriptions.cancellationDeadline),
      { target: { value: '2026-12-01' } }
    );
    fireEvent.click(screen.getByRole('button', { name: en.common.save }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith({
        merchantName: 'Music',
        patternType: 'monthly',
        avgAmount: -15,
        renewalDate: '2027-01-01',
        cancellationDeadline: '2026-12-01',
      })
    );
    await waitFor(() =>
      expect(screen.queryByLabelText(en.subscriptions.avgAmount)).toBeNull()
    );
  });

  it('keeps the edited amount available when saving fails', async () => {
    const save = vi.fn().mockRejectedValue(new Error('Write failed'));
    render(<SubscriptionCard pattern={pattern} t={en} onEdit={save} />);
    fireEvent.click(screen.getByRole('button', { name: en.common.edit }));
    fireEvent.change(screen.getByLabelText(en.subscriptions.avgAmount), {
      target: { value: '15' },
    });
    fireEvent.click(screen.getByRole('button', { name: en.common.save }));
    await waitFor(() =>
      expect(
        (
          screen.getByRole('button', {
            name: en.common.save,
          }) as HTMLButtonElement
        ).disabled
      ).toBe(false)
    );
    expect(
      (screen.getByLabelText(en.subscriptions.avgAmount) as HTMLInputElement)
        .value
    ).toBe('15');
  });
});
