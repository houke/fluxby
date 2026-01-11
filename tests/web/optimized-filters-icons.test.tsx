import React from 'react';
import { render, screen } from '@testing-library/react';
/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { TypeFilter } from '@/components/transactions/OptimizedFilters';

describe('TypeFilter icons (optimized)', () => {
  it('renders ArrowUpRight for income and ArrowDownRight for expense', async () => {
    const t = {
      transactions: 'Transactions',
      income: 'Income',
      expense: 'Expenses',
      transfer: 'Transfers',
      clearAll: 'Clear',
    } as any;

    const { rerender } = render(
      <TypeFilter value={'income'} onChange={() => {}} translations={t} />
    );

    // Open popover to reveal options
    const triggerButton = screen.getByRole('button', { name: /Income/i });
    // Open and wait for svg to appear
    triggerButton.click();

    await screen.findByRole('button', { name: /Income/i });
    // Wait for the icon SVG to be rendered into the DOM
    const incomeSvg = await screen.findByTestId('typefilter-income-icon');
    expect(incomeSvg).toBeTruthy();
    expect(incomeSvg.classList.contains('lucide-arrow-up-right')).toBe(true);

    // Re-render as expense and open
    rerender(
      <TypeFilter value={'expense'} onChange={() => {}} translations={t} />
    );
    // The trigger and option share the same name; pick the trigger via data-onboarding attr
    const triggerButtonExpense = document.querySelector(
      '[data-onboarding="transaction-type-filter-button"]'
    ) as HTMLButtonElement;
    triggerButtonExpense.click();

    const expenseNodes = await screen.findAllByText('Expenses');
    const expenseOption = expenseNodes.find(
      (n) => n.closest('button') !== triggerButtonExpense
    ) as HTMLElement;
    expect(expenseOption).toBeTruthy();
    const expenseSvg = expenseOption.closest('button')?.querySelector('svg');
    expect(expenseSvg).toBeTruthy();
    expect(expenseSvg?.classList.contains('lucide-arrow-down-right')).toBe(
      true
    );
  });
});
