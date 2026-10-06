/** @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SkippedRowsTable } from '@/components/import/SkippedRowsTable';
import { en } from '@/lib/i18n/en';
import { nl } from '@/lib/i18n/nl';

let language: 'en' | 'nl' = 'en';
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: language === 'en' ? en : nl, language }),
}));
vi.mock('@/components/ui/currency', () => ({
  Currency: ({ amount }: { amount: number }) => <span>{amount}</span>,
}));

describe('Skipped import rows', () => {
  it.each(['en', 'nl'] as const)(
    'keeps large reports bounded and all rows reachable in %s',
    (locale) => {
      language = locale;
      const t = locale === 'en' ? en : nl;
      const rows = Array.from({ length: 51 }, (_, index) => ({
        rowIndex: index + 1,
        date: '2026-10-01',
        amount: -1,
        error: `error-${index + 1}`,
      }));
      const { container, rerender } = render(
        <SkippedRowsTable rows={rows} getErrorLabel={(error) => error} />
      );
      const next = screen.getByRole('button', { name: t.common.next });
      const previous = screen.getByRole('button', { name: t.common.previous });
      expect(container.querySelectorAll('tbody tr')).toHaveLength(20);
      expect((previous as HTMLButtonElement).disabled).toBe(true);
      expect(screen.getByText(t.import.skippedRowsDescription)).toBeTruthy();

      fireEvent.click(next);
      expect(container.querySelectorAll('tbody tr')).toHaveLength(20);
      expect(
        within(container.querySelector('tbody')!).getByText('error-21')
      ).toBeTruthy();
      fireEvent.click(next);
      expect(container.querySelectorAll('tbody tr')).toHaveLength(11);
      expect(
        within(container.querySelector('tbody')!).getByText('error-51')
      ).toBeTruthy();
      expect((next as HTMLButtonElement).disabled).toBe(true);
      fireEvent.click(previous);
      expect(screen.getByText('error-21')).toBeTruthy();

      const largeReport = Array.from({ length: 10_000 }, (_, index) => ({
        ...rows[0],
        rowIndex: index + 1,
      }));
      rerender(
        <SkippedRowsTable rows={largeReport} getErrorLabel={(error) => error} />
      );
      expect(container.querySelectorAll('tbody tr')).toHaveLength(20);
      expect(screen.getByText('1–20 / 10000')).toBeTruthy();
      expect(largeReport).toHaveLength(10_000);
    }
  );
});
