import React from 'react';
import { SearchInput } from '@/components/ui/search-input';
import { Card, CardContent } from '@/components/ui/card';
import {
  TypeFilter,
  CategoryFilter,
  AddressBookFilter,
  PaymentMethodFilter,
  PaymentProcessorFilter,
} from '@/components/transactions/OptimizedFilters';
import type { Category, AddressBookEntry } from '@fluxby/shared';

export type TransactionTypeFilter = 'all' | 'income' | 'expense' | 'transfer';

interface TransactionFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  transactionType: TransactionTypeFilter;
  setTransactionType: (type: TransactionTypeFilter) => void;
  categories: Category[] | undefined;
  selectedCategoryIds: string[];
  onCategoriesChange: (ids: string[]) => void;
  addressBook: AddressBookEntry[] | undefined;
  addressBookLoading: boolean;
  selectedIbans: string[];
  onIbansChange: (ibans: string[]) => void;
  selectedAddressBookId: string | null;
  onAddressBookIdChange: (id: string | null) => void;
  selectedAccountName: string | null;
  onAccountNameChange: (name: string | null) => void;
  addressBookFilterOpened: boolean;
  onAddressBookFilterOpen: () => void;
  selectedPaymentMethods: string[];
  onPaymentMethodsChange: (methods: string[]) => void;
  paymentProviderRules: Array<{ id: string; name: string; patterns: string }>;
  selectedPaymentProcessors: string[];
  onPaymentProcessorsChange: (processors: string[]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  translations: any;
  startTransition: React.TransitionStartFunction;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  search,
  setSearch,
  transactionType,
  setTransactionType,
  categories,
  selectedCategoryIds,
  onCategoriesChange,
  addressBook,
  addressBookLoading,
  selectedIbans,
  onIbansChange,
  selectedAddressBookId,
  onAddressBookIdChange,
  selectedAccountName,
  onAccountNameChange,
  onAddressBookFilterOpen,
  selectedPaymentMethods,
  onPaymentMethodsChange,
  paymentProviderRules,
  selectedPaymentProcessors,
  onPaymentProcessorsChange,
  translations: t,
  startTransition,
}) => {
  return (
    <div className='-mx-3 sm:mx-0'>
      <Card
        className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
        data-onboarding='transaction-filters'
      >
        <CardContent className='px-3 py-3 sm:p-4'>
          <div className='flex flex-wrap gap-4'>
            <div
              className='w-full min-w-[200px] sm:flex-1'
              data-onboarding='transaction-search'
            >
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t?.transactions?.searchPlaceholder || 'Zoeken...'}
                debounceMs={300}
              />
            </div>
            <div
              className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row'
              data-onboarding='transaction-filter-buttons'
            >
              {/* Transaction type filter - Optimized */}
              <TypeFilter
                value={transactionType}
                onChange={(type) =>
                  startTransition(() =>
                    setTransactionType(type as TransactionTypeFilter)
                  )
                }
                translations={{
                  transactions: t?.nav?.transactions,
                  income: t?.transactions?.income,
                  expense: t?.transactions?.expense,
                  transfer: t?.transactions?.transfer,
                  clearAll: t?.common?.clearAll,
                }}
              />

              {/* Category Filter - Optimized */}
              <CategoryFilter
                categories={categories}
                selectedIds={selectedCategoryIds}
                onChange={onCategoriesChange}
                translations={{
                  categories: t?.transactions?.categories,
                  noCategory: t?.transactions?.noCategory || 'Geen categorie',
                  search: t?.common?.search || 'Zoeken...',
                  clearAll: t?.common?.clearAll,
                }}
              />

              {/* Address Book Filter - Optimized */}
              <AddressBookFilter
                addressBook={addressBook}
                isLoading={addressBookLoading}
                selectedIbans={selectedIbans}
                selectedAddressBookId={selectedAddressBookId}
                selectedAccountName={selectedAccountName}
                onIbansChange={onIbansChange}
                onAddressBookIdChange={onAddressBookIdChange}
                onAccountNameChange={onAccountNameChange}
                onOpen={onAddressBookFilterOpen}
                data-onboarding='transaction-addressbook-filter'
                translations={{
                  addressBook: t?.transactions?.addressBook,
                  search: t?.common?.search || 'Zoeken...',
                  clearAll: t?.common?.clearAll,
                  loading: t?.common?.loading || 'Laden...',
                  noContacts: t?.transactions?.noContacts,
                  contacts: t?.transactions?.contacts,
                  contactsPlural: t?.transactions?.contactsPlural,
                }}
              />

              {/* Payment Method Filter - Optimized */}
              <PaymentMethodFilter
                selectedMethods={selectedPaymentMethods}
                onChange={onPaymentMethodsChange}
                data-onboarding='transaction-payment-filter'
                translations={{
                  paymentMethod: t?.transactions?.paymentMethodFilter,
                  pin: t?.transactions?.paymentMethods?.pin,
                  ideal: t?.transactions?.paymentMethods?.ideal,
                  transfer: t?.transactions?.paymentMethods?.transfer,
                  incasso: t?.transactions?.paymentMethods?.incasso,
                  atm: t?.transactions?.paymentMethods?.atm,
                  clearAll: t?.common?.clearAll,
                }}
              />

              {/* Payment Processor Filter - Optimized */}
              <PaymentProcessorFilter
                processors={paymentProviderRules}
                selectedProcessors={selectedPaymentProcessors}
                onChange={onPaymentProcessorsChange}
                translations={{
                  paymentProcessor: t?.transactions?.paymentProcessorFilter,
                  clearAll: t?.common?.clearAll,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
