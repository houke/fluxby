import { memo } from 'react';
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  CreditCard,
  Building2,
  Check,
  Tags,
  Users,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Types
export type TransactionTypeFilter = 'all' | 'income' | 'expense' | 'transfer';

import type {
  Category,
  AddressBookEntry,
  PaymentProviderRule,
} from '@fluxby/shared';

export interface TransactionFiltersProps {
  // Search
  search: string;
  onSearchChange: (value: string) => void;
  // Transaction type filter
  transactionType: TransactionTypeFilter;
  onTransactionTypeChange: (type: TransactionTypeFilter) => void;
  typeFilterOpen: boolean;
  onTypeFilterOpenChange: (open: boolean) => void;
  // Category filter
  categories: Category[] | undefined;
  selectedCategoryIds: string[];
  onCategoryToggle: (categoryId: string) => void;
  onClearCategories: () => void;
  categoryFilterOpen: boolean;
  onCategoryFilterOpenChange: (open: boolean) => void;
  categorySearch: string;
  onCategorySearchChange: (value: string) => void;
  filteredGroupedCategories: (Category & { isChild?: boolean })[];
  // Address book filter
  addressBook: AddressBookEntry[] | undefined;
  addressBookLoading: boolean;
  selectedIbans: string[];
  selectedAccountName: string | null;
  selectedAddressBookId: string | null;
  onAddressBookSelect: (entry: AddressBookEntry | null) => void;
  addressBookFilterOpen: boolean;
  onAddressBookFilterOpenChange: (open: boolean) => void;
  addressBookSearch: string;
  onAddressBookSearchChange: (value: string) => void;
  filteredAddressBook: AddressBookEntry[];
  addressBookVisibleCount: number;
  onAddressBookVisibleCountChange: (count: number) => void;
  // Payment method filter
  selectedPaymentMethods: string[];
  onPaymentMethodToggle: (method: string) => void;
  onClearPaymentMethods: () => void;
  paymentMethodFilterOpen: boolean;
  onPaymentMethodFilterOpenChange: (open: boolean) => void;
  // Payment processor filter
  paymentProviderRules: PaymentProviderRule[];
  selectedPaymentProcessors: string[];
  onPaymentProcessorToggle: (processor: string) => void;
  onClearPaymentProcessors: () => void;
  paymentProcessorFilterOpen: boolean;
  onPaymentProcessorFilterOpenChange: (open: boolean) => void;
  // Utility functions
  colorWithOpacity: (hex: string | null | undefined, alpha?: number) => string;
  // Translations
  t: {
    nav: { transactions: string };
    transactions: {
      searchPlaceholder: string;
      income: string;
      expense: string;
      transfer: string;
      categories: string;
      addressBook: string;
      noCategory: string;
      contacts: string;
      contactsPlural: string;
      noContacts: string;
      paymentMethodFilter: string;
      paymentProcessorFilter: string;
      paymentMethods: {
        pin: string;
        ideal: string;
        transfer: string;
        incasso: string;
        atm: string;
      };
    };
    common: {
      search?: string;
      clearAll: string;
      loading?: string;
      noResults?: string;
    };
  };
}

export const TransactionFilters = memo(function TransactionFilters({
  search,
  onSearchChange,
  transactionType,
  onTransactionTypeChange,
  typeFilterOpen,
  onTypeFilterOpenChange,
  categories,
  selectedCategoryIds,
  onCategoryToggle,
  onClearCategories,
  categoryFilterOpen,
  onCategoryFilterOpenChange,
  categorySearch,
  onCategorySearchChange,
  filteredGroupedCategories,
  addressBook,
  addressBookLoading,
  selectedIbans,
  selectedAccountName,
  selectedAddressBookId,
  onAddressBookSelect,
  addressBookFilterOpen,
  onAddressBookFilterOpenChange,
  addressBookSearch,
  onAddressBookSearchChange,
  filteredAddressBook,
  addressBookVisibleCount,
  onAddressBookVisibleCountChange,
  selectedPaymentMethods,
  onPaymentMethodToggle,
  onClearPaymentMethods,
  paymentMethodFilterOpen,
  onPaymentMethodFilterOpenChange,
  paymentProviderRules,
  selectedPaymentProcessors,
  onPaymentProcessorToggle,
  onClearPaymentProcessors,
  paymentProcessorFilterOpen,
  onPaymentProcessorFilterOpenChange,
  colorWithOpacity,
  t,
}: TransactionFiltersProps) {
  return (
    <Card data-onboarding='transaction-filters'>
      <CardContent className='p-4'>
        <div className='flex flex-wrap gap-4'>
          {/* Search input */}
          <div
            className='relative min-w-[200px] flex-1'
            data-onboarding='transaction-search'
          >
            <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder={t.transactions.searchPlaceholder}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className='pl-10'
            />
          </div>

          <div
            className='flex gap-2'
            data-onboarding='transaction-filter-buttons'
          >
            {/* Transaction type filter */}
            <Popover
              open={typeFilterOpen}
              onOpenChange={onTypeFilterOpenChange}
            >
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  data-onboarding='transaction-type-filter-button'
                  className={cn(
                    'min-w-[140px] justify-start',
                    transactionType !== 'all' && 'bg-primary/10'
                  )}
                >
                  <Filter className='mr-1 h-4 w-4' />
                  {transactionType === 'all' && t.nav.transactions}
                  {transactionType === 'income' && t.transactions.income}
                  {transactionType === 'expense' && t.transactions.expense}
                  {transactionType === 'transfer' && t.transactions.transfer}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-[180px] p-0' align='start'>
                <div className='space-y-1 p-2'>
                  <button
                    onClick={() => {
                      onTransactionTypeChange('income');
                      onTypeFilterOpenChange(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                      transactionType === 'income' && 'bg-primary/10'
                    )}
                  >
                    <ArrowDownRight className='h-4 w-4 text-emerald-500' />
                    <span className='flex-1'>{t.transactions.income}</span>
                    {transactionType === 'income' && (
                      <Check className='h-4 w-4 text-primary' />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      onTransactionTypeChange('expense');
                      onTypeFilterOpenChange(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                      transactionType === 'expense' && 'bg-primary/10'
                    )}
                  >
                    <ArrowUpRight className='h-4 w-4 text-rose-500' />
                    <span className='flex-1'>{t.transactions.expense}</span>
                    {transactionType === 'expense' && (
                      <Check className='h-4 w-4 text-primary' />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      onTransactionTypeChange('transfer');
                      onTypeFilterOpenChange(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                      transactionType === 'transfer' && 'bg-primary/10'
                    )}
                  >
                    <ArrowLeftRight className='h-4 w-4 text-blue-500' />
                    <span className='flex-1'>{t.transactions.transfer}</span>
                    {transactionType === 'transfer' && (
                      <Check className='h-4 w-4 text-primary' />
                    )}
                  </button>
                </div>
                {transactionType !== 'all' && (
                  <div className='border-t p-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='w-full'
                      onClick={() => {
                        onTransactionTypeChange('all');
                        onTypeFilterOpenChange(false);
                      }}
                    >
                      {t.common.clearAll}
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Category Filter */}
            {categories && categories.length > 0 && (
              <Popover
                open={categoryFilterOpen}
                onOpenChange={(open) => {
                  onCategoryFilterOpenChange(open);
                  if (!open) onCategorySearchChange('');
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    data-onboarding='transaction-category-filter'
                    className={cn(
                      'min-w-[140px] justify-start',
                      selectedCategoryIds.length > 0 && 'bg-primary/10'
                    )}
                  >
                    {selectedCategoryIds.length > 0 ? (
                      <div className='flex items-center gap-1'>
                        {selectedCategoryIds.slice(0, 2).map((catId) => {
                          if (catId === 'uncategorized') {
                            return (
                              <span
                                key={catId}
                                className='flex h-5 w-5 items-center justify-center rounded-lg bg-gray-200 text-xs dark:bg-gray-700'
                              >
                                ❓
                              </span>
                            );
                          }
                          const cat = categories?.find((c) => c.id === catId);
                          return cat ? (
                            <span
                              key={catId}
                              className='flex h-5 w-5 items-center justify-center rounded-lg text-xs'
                              style={{
                                backgroundColor: colorWithOpacity(cat.color),
                              }}
                            >
                              {cat.icon}
                            </span>
                          ) : null;
                        })}
                        {selectedCategoryIds.length > 2 && (
                          <span className='text-xs text-muted-foreground'>
                            +{selectedCategoryIds.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <Tags className='mr-1 h-4 w-4' />
                        {t.transactions.categories}
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-[250px] p-0' align='start'>
                  {/* Sticky Search */}
                  <div className='sticky top-0 z-10 border-b bg-popover p-2'>
                    <div className='relative'>
                      <Search className='absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                      <Input
                        placeholder={t.common.search || 'Zoeken...'}
                        value={categorySearch}
                        onChange={(e) => onCategorySearchChange(e.target.value)}
                        className='h-8 pl-8'
                      />
                    </div>
                  </div>
                  <div className='max-h-[300px] space-y-1 overflow-y-auto p-2'>
                    {/* Uncategorized option */}
                    {(!categorySearch ||
                      (t.transactions.noCategory || 'Geen categorie')
                        .toLowerCase()
                        .includes(categorySearch.toLowerCase())) && (
                      <button
                        onClick={() => onCategoryToggle('uncategorized')}
                        className={cn(
                          'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                          selectedCategoryIds.includes('uncategorized') &&
                            'bg-primary/10'
                        )}
                      >
                        <span className='flex h-6 w-6 items-center justify-center rounded-lg bg-gray-200 text-sm dark:bg-gray-700'>
                          ❓
                        </span>
                        <span className='flex-1 truncate'>
                          {t.transactions.noCategory}
                        </span>
                        {selectedCategoryIds.includes('uncategorized') && (
                          <Check className='h-4 w-4 text-primary' />
                        )}
                      </button>
                    )}
                    <div className='my-1 border-b' />
                    {filteredGroupedCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => onCategoryToggle(category.id)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                          category.isChild && 'pl-4',
                          selectedCategoryIds.includes(category.id) &&
                            'bg-primary/10'
                        )}
                      >
                        <span
                          className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-sm'
                          style={{
                            backgroundColor: colorWithOpacity(category.color),
                          }}
                        >
                          {category.icon}
                        </span>
                        <span className='flex-1 truncate'>{category.name}</span>
                        {selectedCategoryIds.includes(category.id) && (
                          <Check className='h-4 w-4 text-primary' />
                        )}
                      </button>
                    ))}
                  </div>
                  {selectedCategoryIds.length > 0 && (
                    <div className='border-t p-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='w-full'
                        onClick={onClearCategories}
                      >
                        {t.common.clearAll}
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            )}

            {/* Address Book Filter */}
            <Popover
              open={addressBookFilterOpen}
              onOpenChange={(open) => {
                onAddressBookFilterOpenChange(open);
                if (!open) {
                  onAddressBookSearchChange('');
                  onAddressBookVisibleCountChange(20);
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  data-onboarding='transaction-addressbook-filter'
                  className={cn(
                    'min-w-[140px] justify-start',
                    (selectedIbans.length > 0 || selectedAccountName) &&
                      'bg-primary/10'
                  )}
                >
                  {selectedAccountName ? (
                    <div className='flex items-center gap-1'>
                      <Users className='h-4 w-4' />
                      <span className='max-w-[100px] truncate text-xs'>
                        {selectedAccountName}
                      </span>
                    </div>
                  ) : selectedIbans.length > 0 ? (
                    <div className='flex items-center gap-1'>
                      <Users className='h-4 w-4' />
                      <span className='text-xs'>
                        {selectedIbans.length}{' '}
                        {selectedIbans.length > 1
                          ? t.transactions.contactsPlural
                          : t.transactions.contacts}
                      </span>
                    </div>
                  ) : (
                    <>
                      <Users className='mr-1 h-4 w-4' />
                      {t.transactions.addressBook}
                    </>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-[280px] p-0' align='start'>
                {/* Sticky Search */}
                <div className='sticky top-0 z-10 border-b bg-popover p-2'>
                  <div className='relative'>
                    <Search className='absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      placeholder={t.common.search || 'Zoeken...'}
                      value={addressBookSearch}
                      onChange={(e) =>
                        onAddressBookSearchChange(e.target.value)
                      }
                      className='h-8 pl-8'
                    />
                  </div>
                </div>
                <div
                  className='max-h-[300px] space-y-1 overflow-y-auto p-2'
                  onScroll={(e) => {
                    const target = e.target as HTMLDivElement;
                    if (
                      target.scrollHeight - target.scrollTop <=
                      target.clientHeight + 50
                    ) {
                      onAddressBookVisibleCountChange(
                        addressBookVisibleCount + 20
                      );
                    }
                  }}
                >
                  {addressBookLoading ? (
                    <div className='flex items-center justify-center py-4'>
                      <Skeleton className='h-8 w-full' />
                    </div>
                  ) : filteredAddressBook.length > 0 ? (
                    (() => {
                      const visible = filteredAddressBook.slice(
                        0,
                        addressBookVisibleCount
                      );
                      return (
                        <>
                          {visible.map((entry) => (
                            <button
                              key={entry.id}
                              onClick={() => {
                                if (selectedAddressBookId === entry.id) {
                                  onAddressBookSelect(null);
                                } else {
                                  onAddressBookSelect(entry);
                                }
                                onAddressBookFilterOpenChange(false);
                              }}
                              className={cn(
                                'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                                selectedAddressBookId === entry.id &&
                                  'bg-primary/10'
                              )}
                            >
                              <span className='flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs dark:bg-gray-700'>
                                {(entry.name || '').charAt(0).toUpperCase()}
                              </span>
                              <span className='flex-1 truncate'>
                                {entry.name}
                                {entry.description && (
                                  <span className='ml-2 font-normal text-muted-foreground'>
                                    ({entry.description})
                                  </span>
                                )}
                              </span>
                              {selectedAddressBookId === entry.id && (
                                <Check className='h-4 w-4 text-primary' />
                              )}
                            </button>
                          ))}
                          {filteredAddressBook.length > visible.length && (
                            <div className='py-2 text-center text-xs text-muted-foreground'>
                              {t.common?.loading || 'Laden...'}
                            </div>
                          )}
                        </>
                      );
                    })()
                  ) : addressBook && addressBook.length > 0 ? (
                    <div className='px-2 py-4 text-center text-sm text-muted-foreground'>
                      {t.common?.noResults || 'Geen resultaten'}
                    </div>
                  ) : (
                    <div className='px-2 py-4 text-center text-sm text-muted-foreground'>
                      {t.transactions.noContacts}
                    </div>
                  )}
                </div>
                {(selectedIbans.length > 0 || selectedAddressBookId) && (
                  <div className='border-t p-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='w-full'
                      onClick={() => {
                        onAddressBookSelect(null);
                        onAddressBookSearchChange('');
                      }}
                    >
                      {t.common.clearAll}
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Payment Method Filter */}
            <Popover
              open={paymentMethodFilterOpen}
              onOpenChange={onPaymentMethodFilterOpenChange}
            >
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  data-onboarding='transaction-payment-filter'
                  className={cn(
                    'min-w-[140px] justify-start',
                    selectedPaymentMethods.length > 0 && 'bg-primary/10'
                  )}
                >
                  {selectedPaymentMethods.length > 0 ? (
                    <div className='flex items-center gap-1'>
                      <CreditCard className='h-4 w-4' />
                      <span className='max-w-[100px] truncate text-xs'>
                        {(() => {
                          const method = selectedPaymentMethods[0];
                          if (method === 'pin')
                            return t.transactions.paymentMethods.pin;
                          if (method === 'ideal')
                            return t.transactions.paymentMethods.ideal;
                          if (method === 'transfer')
                            return t.transactions.paymentMethods.transfer;
                          if (method === 'incasso')
                            return t.transactions.paymentMethods.incasso;
                          if (method === 'geldautomaat')
                            return t.transactions.paymentMethods.atm;
                          return method;
                        })()}
                        {selectedPaymentMethods.length > 1 && (
                          <span className='ml-1 text-muted-foreground'>
                            +{selectedPaymentMethods.length - 1}
                          </span>
                        )}
                      </span>
                    </div>
                  ) : (
                    <>
                      <CreditCard className='mr-1 h-4 w-4' />
                      {t.transactions.paymentMethodFilter}
                    </>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-[200px] p-0' align='start'>
                <div className='space-y-1 p-2'>
                  {['pin', 'ideal', 'transfer', 'incasso', 'geldautomaat'].map(
                    (method) => (
                      <button
                        key={method}
                        onClick={() => onPaymentMethodToggle(method)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                          selectedPaymentMethods.includes(method) &&
                            'bg-primary/10'
                        )}
                      >
                        <span className='flex-1'>
                          {method === 'pin' &&
                            t.transactions.paymentMethods.pin}
                          {method === 'ideal' &&
                            t.transactions.paymentMethods.ideal}
                          {method === 'transfer' &&
                            t.transactions.paymentMethods.transfer}
                          {method === 'incasso' &&
                            t.transactions.paymentMethods.incasso}
                          {method === 'geldautomaat' &&
                            t.transactions.paymentMethods.atm}
                        </span>
                        {selectedPaymentMethods.includes(method) && (
                          <Check className='h-4 w-4 text-primary' />
                        )}
                      </button>
                    )
                  )}
                </div>
                {selectedPaymentMethods.length > 0 && (
                  <div className='border-t p-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='w-full'
                      onClick={onClearPaymentMethods}
                    >
                      {t.common.clearAll}
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Payment Processor Filter */}
            {paymentProviderRules.length > 0 && (
              <Popover
                open={paymentProcessorFilterOpen}
                onOpenChange={onPaymentProcessorFilterOpenChange}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    data-onboarding='transaction-payment-processor-filter'
                    className={cn(
                      'min-w-[140px] justify-start',
                      selectedPaymentProcessors.length > 0 && 'bg-primary/10'
                    )}
                  >
                    {selectedPaymentProcessors.length > 0 ? (
                      <div className='flex items-center gap-1'>
                        <Building2 className='mr-1 h-4 w-4' />
                        <span className='max-w-[100px] truncate text-xs'>
                          {selectedPaymentProcessors[0]}
                        </span>
                        {selectedPaymentProcessors.length > 1 && (
                          <span className='text-xs text-muted-foreground'>
                            +{selectedPaymentProcessors.length - 1}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <Building2 className='mr-1 h-4 w-4' />
                        {t.transactions.paymentProcessorFilter}
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-[220px] p-0' align='start'>
                  <div className='max-h-[300px] space-y-1 overflow-y-auto p-2'>
                    {paymentProviderRules.map((rule) => (
                      <button
                        key={rule.id}
                        onClick={() => onPaymentProcessorToggle(rule.name)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                          selectedPaymentProcessors.includes(rule.name) &&
                            'bg-primary/10'
                        )}
                      >
                        <span className='flex-1 truncate'>{rule.name}</span>
                        {selectedPaymentProcessors.includes(rule.name) && (
                          <Check className='h-4 w-4 text-primary' />
                        )}
                      </button>
                    ))}
                  </div>
                  {selectedPaymentProcessors.length > 0 && (
                    <div className='border-t p-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='w-full'
                        onClick={onClearPaymentProcessors}
                      >
                        {t.common.clearAll}
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default TransactionFilters;
