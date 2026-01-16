import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';

describe('TransactionFilters icons', () => {
  it('shows ArrowUpRight for income and ArrowDownRight for expense', () => {
    const t: any = {
      nav: { transactions: 'Transactions' },
      transactions: {
        searchPlaceholder: 'Search',
        income: 'Income',
        expense: 'Expenses',
        transfer: 'Transfers',
        categories: 'Categories',
        addressBook: 'Address book',
        noCategory: 'No category',
        contacts: 'Contact',
        contactsPlural: 'Contacts',
        noContacts: 'No contacts',
        paymentMethodFilter: 'Payment',
        paymentProcessorFilter: 'Processor',
        paymentMethods: {
          pin: 'PIN',
          ideal: 'iDEAL',
          transfer: 'Transfer',
          incasso: 'Direct Debit',
          atm: 'ATM',
        },
      },
      common: { clearAll: 'Clear' },
    };

    const props = {
      search: '',
      onSearchChange: vi.fn(),
      transactionType: 'all' as any,
      onTransactionTypeChange: vi.fn(),
      typeFilterOpen: true,
      onTypeFilterOpenChange: vi.fn(),
      categories: [],
      selectedCategoryIds: [],
      onCategoryToggle: vi.fn(),
      onClearCategories: vi.fn(),
      categoryFilterOpen: false,
      onCategoryFilterOpenChange: vi.fn(),
      categorySearch: '',
      onCategorySearchChange: vi.fn(),
      filteredGroupedCategories: [],
      addressBook: [],
      addressBookLoading: false,
      selectedIbans: [],
      selectedAccountName: null,
      selectedAddressBookId: null,
      onAddressBookSelect: vi.fn(),
      addressBookFilterOpen: false,
      onAddressBookFilterOpenChange: vi.fn(),
      addressBookSearch: '',
      onAddressBookSearchChange: vi.fn(),
      filteredAddressBook: [],
      addressBookVisibleCount: 0,
      onAddressBookVisibleCountChange: vi.fn(),
      selectedPaymentMethods: [],
      onPaymentMethodToggle: vi.fn(),
      onClearPaymentMethods: vi.fn(),
      paymentMethodFilterOpen: false,
      onPaymentMethodFilterOpenChange: vi.fn(),
      paymentProviderRules: [],
      selectedPaymentProcessors: [],
      onPaymentProcessorToggle: vi.fn(),
      onClearPaymentProcessors: vi.fn(),
      paymentProcessorFilterOpen: false,
      onPaymentProcessorFilterOpenChange: vi.fn(),
      colorWithOpacity: () => '',
      t,
    };

    render(<TransactionFilters {...props} />);

    // Open the type popover
    const trigger = screen.getByRole('button', { name: /Transactions/i });
    fireEvent.click(trigger);

    // Find the income and expense rows by label
    const incomeBtn = screen
      .getByText('Income')
      .closest('button') as HTMLButtonElement;
    const expenseBtn = screen
      .getByText('Expenses')
      .closest('button') as HTMLButtonElement;

    // Ensure SVGs exist and have expected lucide class names
    const incomeSvg = incomeBtn?.querySelector('svg');
    const expenseSvg = expenseBtn?.querySelector('svg');

    expect(incomeSvg).toBeTruthy();
    expect(expenseSvg).toBeTruthy();

    expect(incomeSvg?.classList.contains('lucide-arrow-up-right')).toBe(true);
    expect(expenseSvg?.classList.contains('lucide-arrow-down-right')).toBe(
      true
    );
  });
});
