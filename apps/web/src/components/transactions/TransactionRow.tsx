import React, { memo } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  CreditCard,
  Building2,
  Check,
  Pencil,
  Info,
  X,
  UserPlus,
  History,
  BookUser,
  RotateCcw,
  Repeat,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

// Types
export interface Transaction {
  id: number;
  date: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  description: string;
  merchantName: string | null;
  categoryId: number | null;
  paymentMethod: string | null;
  notes: string | null;
  opposingAccountIban: string | null;
  opposingAccountName: string | null;
  paymentProvider: string | null;
  addressBookId: number | null;
}

export interface Category {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  parentId: number | null;
}

export interface AddressBookEntry {
  id: number;
  iban: string;
  name: string;
  description: string | null;
  originalName?: string | null;
  originalNames?: string[];
  ibans?: string[];
}

export interface PaymentMethodInfo {
  icon: React.ReactNode;
  label: string;
  color: string;
}

export interface PaymentMethod {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

export interface PaymentProviderRule {
  id: number;
  name: string;
  patterns: string;
}

export interface TranslationKeys {
  transactions: {
    noCategory: string;
    unknown: string;
    description: string;
    notes: string;
    counterAccount: string;
    iban: string;
    editTransactionName: string;
    newLabel: string;
    resetToOriginal?: string;
    addToAddressBook: string;
    inAddressBook: string;
    internalTransfer?: string;
    removeTransferMark?: string;
    markAsTransfer?: string;
    recurringHistory: string;
    totalThisPeriod: string;
    laterTransaction?: string;
    laterTransactions?: string;
    earlierTransaction?: string;
    earlierTransactions?: string;
    paymentMethods: {
      pin: string;
      ideal: string;
      transfer: string;
      incasso: string;
      atm: string;
      other?: string;
    };
  };
  common: {
    save: string;
    cancel: string;
    remove?: string;
  };
  categories?: {
    searchCategories?: string;
    name?: string;
  };
  addressBook?: {
    searchContacts?: string;
    noContactsFound?: string;
  };
}

interface TransactionRowProps {
  tx: Transaction;
  categories: Category[] | undefined;
  addressBook: AddressBookEntry[] | undefined;
  paymentProviderRules: PaymentProviderRule[];
  paymentMethods: PaymentMethod[];
  t: TranslationKeys;
  // State
  editingLabelId: number | null;
  labelDraft: string;
  originalLabelValue: string;
  expandedMerchant: string | null;
  openCategoryPopover: number | null;
  openAddressBookPopover: number | null;
  openPaymentMethodPopover: number | null;
  openPaymentProcessorPopover: number | null;
  categoryPopoverSearch: string;
  addressBookPopoverSearch: string;
  // Computed values
  isRecurring: boolean;
  recurringHistory: Transaction[];
  addressBookEntry: AddressBookEntry | null;
  isInAddressBook: boolean;
  isPending: boolean;
  // Handlers
  onLabelDraftChange: (value: string) => void;
  onStartLabelEdit: (tx: Transaction) => void;
  onCancelLabelEdit: () => void;
  onSaveLabel: (txId: number) => void;
  onResetLabel: () => void;
  onExpandMerchant: (key: string | null) => void;
  onCategoryPopoverOpen: (id: number | null) => void;
  onAddressBookPopoverOpen: (id: number | null) => void;
  onPaymentMethodPopoverOpen: (id: number | null) => void;
  onPaymentProcessorPopoverOpen: (id: number | null) => void;
  onCategoryPopoverSearch: (value: string) => void;
  onAddressBookPopoverSearch: (value: string) => void;
  onCategorySelect: (tx: Transaction, categoryId: number) => void;
  onAddressBookSelect: (tx: Transaction, contact: AddressBookEntry) => void;
  onPaymentMethodSelect: (tx: Transaction, method: string | null) => void;
  onPaymentProcessorSelect: (tx: Transaction, provider: string | null) => void;
  onAddToAddressBook: (tx: Transaction) => void;
  onTransferToggle: (tx: Transaction) => void;
  // Utility functions
  getCategoryName: (categoryId: number | null) => string;
  getCategoryColor: (categoryId: number | null) => string;
  getPaymentMethodInfo: (method: string | null) => PaymentMethodInfo;
}

// Convert hex color to rgba with opacity
const _colorWithOpacity = (hex: string | null | undefined, alpha = 0.2) => {
  const value = (hex || '#9CA3AF').replace('#', '');
  const normalized =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value.padEnd(6, '0').slice(0, 6);
  const r = parseInt(normalized.slice(0, 2), 16) || 0;
  const g = parseInt(normalized.slice(2, 4), 16) || 0;
  const b = parseInt(normalized.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const TransactionRow = memo(function TransactionRow({
  tx,
  categories,
  addressBook,
  paymentProviderRules,
  paymentMethods,
  t,
  editingLabelId,
  labelDraft,
  originalLabelValue,
  expandedMerchant,
  openCategoryPopover,
  openAddressBookPopover,
  openPaymentMethodPopover,
  openPaymentProcessorPopover,
  categoryPopoverSearch,
  addressBookPopoverSearch,
  isRecurring,
  recurringHistory,
  addressBookEntry,
  isInAddressBook,
  isPending,
  onLabelDraftChange,
  onStartLabelEdit,
  onCancelLabelEdit,
  onSaveLabel,
  onResetLabel,
  onExpandMerchant,
  onCategoryPopoverOpen,
  onAddressBookPopoverOpen,
  onPaymentMethodPopoverOpen,
  onPaymentProcessorPopoverOpen,
  onCategoryPopoverSearch,
  onAddressBookPopoverSearch,
  onCategorySelect,
  onAddressBookSelect,
  onPaymentMethodSelect,
  onPaymentProcessorSelect,
  onAddToAddressBook,
  onTransferToggle,
  getCategoryName,
  getCategoryColor,
  getPaymentMethodInfo,
}: TransactionRowProps) {
  const paymentInfo = getPaymentMethodInfo(tx.paymentMethod);
  const merchantKey = tx.merchantName?.toLowerCase().trim() || '';
  const isExpanded = expandedMerchant === `${merchantKey}-${tx.id}`;
  const historyTotal = recurringHistory.reduce((sum, h) => sum + h.amount, 0);

  return (
    <div className='rounded-lg border' data-onboarding='transaction-row'>
      <div
        className={cn(
          'group flex items-center justify-between rounded-lg p-4 transition-colors hover:bg-muted/50',
          isRecurring && 'cursor-pointer'
        )}
        onClick={() => {
          if (isRecurring) {
            onExpandMerchant(isExpanded ? null : `${merchantKey}-${tx.id}`);
          }
        }}
      >
        <div className='flex min-w-0 flex-1 items-center gap-4'>
          {/* Transaction type icon */}
          <div
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
              tx.type === 'transfer'
                ? 'bg-blue-100'
                : tx.amount > 0
                  ? 'bg-emerald-100'
                  : 'bg-rose-100'
            )}
          >
            {tx.type === 'transfer' ? (
              <ArrowLeftRight className='h-5 w-5 text-blue-600' />
            ) : tx.amount > 0 ? (
              <ArrowUpRight className='h-5 w-5 text-emerald-600' />
            ) : (
              <ArrowDownRight className='h-5 w-5 text-rose-600' />
            )}
          </div>

          <div className='min-w-0 flex-1'>
            {/* Transaction name with edit */}
            <div className='flex items-center gap-2'>
              {editingLabelId === tx.id ? (
                <div
                  className='relative z-10 flex items-center gap-2'
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className='relative'>
                    <Input
                      value={labelDraft}
                      onChange={(e) => onLabelDraftChange(e.target.value)}
                      placeholder={t.transactions.newLabel}
                      className='h-8 w-80 pr-8 text-base'
                      autoFocus
                    />
                    {labelDraft !== originalLabelValue && (
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size='sm'
                              variant='ghost'
                              className='absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 rounded-md p-0 text-muted-foreground hover:bg-purple-600 hover:text-white'
                              onClick={onResetLabel}
                            >
                              <RotateCcw className='h-3.5 w-3.5' />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t.transactions?.resetToOriginal ||
                              'Terugzetten naar origineel'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size='sm'
                          variant='ghost'
                          className='h-7 w-7 rounded-md p-0 hover:bg-purple-600 hover:text-white'
                          onClick={() => onSaveLabel(tx.id)}
                          disabled={isPending}
                        >
                          <Check className='h-4 w-4' />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t.common.save}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size='sm'
                          variant='ghost'
                          className='h-7 w-7 rounded-md p-0 hover:bg-purple-600 hover:text-white'
                          onClick={onCancelLabelEdit}
                          disabled={isPending}
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t.common.cancel}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ) : (
                <div className='flex min-w-0 items-center gap-2'>
                  <p
                    className='min-w-0 truncate font-medium'
                    title={
                      tx.opposingAccountName || tx.description || undefined
                    }
                  >
                    {tx.merchantName ||
                      tx.opposingAccountName ||
                      tx.description ||
                      t.transactions.unknown}
                    {addressBookEntry?.description && (
                      <span className='ml-2 font-normal text-muted-foreground'>
                        ({addressBookEntry.description})
                      </span>
                    )}
                  </p>
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className='inline-flex flex-shrink-0 cursor-default items-center text-muted-foreground'>
                          <Info className='h-4 w-4' />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className='max-w-xs whitespace-normal break-words'>
                        <div className='space-y-1 text-sm'>
                          {tx.description && (
                            <p>
                              <span className='font-semibold'>
                                {t.transactions.description}:
                              </span>{' '}
                              {tx.description}
                            </p>
                          )}
                          {tx.notes && (
                            <p>
                              <span className='font-semibold'>
                                {t.transactions.notes}:
                              </span>{' '}
                              {tx.notes}
                            </p>
                          )}
                          {addressBookEntry ? (
                            <p>
                              <span className='font-semibold'>
                                {t.transactions.counterAccount}:
                              </span>{' '}
                              {addressBookEntry.name}
                              {addressBookEntry.description && (
                                <span className='ml-2 font-normal text-muted-foreground'>
                                  ({addressBookEntry.description})
                                </span>
                              )}
                            </p>
                          ) : (
                            tx.opposingAccountName && (
                              <p>
                                <span className='font-semibold'>
                                  {t.transactions.counterAccount}:
                                </span>{' '}
                                {tx.opposingAccountName}
                              </p>
                            )
                          )}
                          {tx.opposingAccountIban && (
                            <p>
                              <span className='font-semibold'>
                                {t.transactions.iban}:
                              </span>{' '}
                              {tx.opposingAccountIban}
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className='flex-shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-colors hover:bg-muted focus:opacity-100 group-hover:opacity-100'
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartLabelEdit(tx);
                          }}
                        >
                          <Pencil className='h-4 w-4' />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t.transactions.editTransactionName}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>

            {/* Date and IBAN */}
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <span className='flex-shrink-0'>{formatDate(tx.date)}</span>
              {tx.opposingAccountIban && (
                <>
                  <span className='flex-shrink-0 text-muted-foreground/50'>
                    •
                  </span>
                  <span
                    className='min-w-0 truncate'
                    title={tx.opposingAccountIban}
                  >
                    {/* Show truncated IBAN on mobile, full on desktop */}
                    <span className='sm:hidden'>
                      {tx.opposingAccountIban.length > 18
                        ? `${tx.opposingAccountIban.slice(0, 8)}...${tx.opposingAccountIban.slice(-4)}`
                        : tx.opposingAccountIban}
                    </span>
                    <span className='hidden sm:inline'>
                      {tx.opposingAccountIban}
                    </span>
                  </span>
                </>
              )}
            </div>

            {/* Badges row */}
            <div className='mt-1 flex flex-wrap items-center gap-1.5'>
              {/* Category Badge */}
              <Popover
                open={openCategoryPopover === tx.id}
                onOpenChange={(open) => {
                  onCategoryPopoverOpen(open ? tx.id : null);
                  if (!open) onCategoryPopoverSearch('');
                }}
              >
                <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <button
                    data-onboarding='transaction-category-badge'
                    className='cursor-pointer rounded px-2 py-0.5 text-xs font-medium transition-all hover:ring-2 hover:ring-primary/50 hover:ring-offset-1'
                    style={{
                      backgroundColor: `${getCategoryColor(tx.categoryId)}5C`,
                      color: '#374151',
                    }}
                  >
                    {getCategoryName(tx.categoryId)}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className='max-h-80 overflow-y-auto p-2'
                  align='start'
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: 'max-content',
                    minWidth: '200px',
                    maxWidth: '300px',
                  }}
                >
                  <div className='space-y-2'>
                    <Input
                      placeholder={
                        t.categories?.searchCategories || 'Zoek categorie...'
                      }
                      value={categoryPopoverSearch}
                      onChange={(e) => onCategoryPopoverSearch(e.target.value)}
                      className='h-8 text-sm'
                      autoFocus
                    />
                    <div className='space-y-1'>
                      {(() => {
                        const searchLower = categoryPopoverSearch.toLowerCase();
                        const parentCategories =
                          categories?.filter((c) => c.parentId === null) || [];

                        return parentCategories.map((parent) => {
                          const children =
                            categories
                              ?.filter((c) => c.parentId === parent.id)
                              .filter(
                                (c) =>
                                  searchLower === '' ||
                                  c.name.toLowerCase().includes(searchLower) ||
                                  parent.name
                                    .toLowerCase()
                                    .includes(searchLower)
                              )
                              .sort((a, b) =>
                                a.name.localeCompare(b.name, 'nl')
                              ) || [];

                          if (children.length === 0) return null;

                          return (
                            <div key={parent.id}>
                              <div className='flex items-center gap-2 py-1.5'>
                                <div className='h-px flex-1 border-t border-dotted border-muted-foreground/30' />
                                <span className='whitespace-nowrap text-xs text-muted-foreground'>
                                  {parent.name}
                                </span>
                                <div className='h-px flex-1 border-t border-dotted border-muted-foreground/30' />
                              </div>
                              {children.map((category) => (
                                <button
                                  key={category.id}
                                  className={cn(
                                    'flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                                    tx.categoryId === category.id && 'bg-muted'
                                  )}
                                  onClick={() =>
                                    onCategorySelect(tx, category.id)
                                  }
                                >
                                  <span
                                    className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-sm'
                                    style={{
                                      backgroundColor: `${category.color || '#9CA3AF'}5C`,
                                    }}
                                  >
                                    {category.icon}
                                  </span>
                                  <span className='whitespace-nowrap'>
                                    {category.name}
                                  </span>
                                  {tx.categoryId === category.id && (
                                    <Check className='ml-auto h-3 w-3 flex-shrink-0 text-primary' />
                                  )}
                                </button>
                              ))}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Payment Method Badge */}
              <Popover
                open={openPaymentMethodPopover === tx.id}
                onOpenChange={(open) =>
                  onPaymentMethodPopoverOpen(open ? tx.id : null)
                }
              >
                <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <button
                    className={cn(
                      'flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition-all hover:ring-2 hover:ring-primary/50 hover:ring-offset-1',
                      tx.paymentMethod
                        ? paymentInfo.color
                        : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {paymentInfo.icon || <CreditCard className='h-3.5 w-3.5' />}
                    {tx.paymentMethod
                      ? paymentInfo.label
                      : t.transactions.paymentMethods.other || 'Onbekend'}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className='w-48 p-2'
                  align='start'
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className='space-y-1'>
                    {paymentMethods.map((method) => (
                      <button
                        key={method.value}
                        className={cn(
                          'flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                          tx.paymentMethod?.toLowerCase() === method.value &&
                            'bg-muted'
                        )}
                        onClick={() => onPaymentMethodSelect(tx, method.value)}
                      >
                        <span
                          className={cn(
                            'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded',
                            method.color
                          )}
                        >
                          {method.icon}
                        </span>
                        <span className='truncate'>{method.label}</span>
                        {tx.paymentMethod?.toLowerCase() === method.value && (
                          <Check className='ml-auto h-3 w-3 text-primary' />
                        )}
                      </button>
                    ))}
                    {tx.paymentMethod && (
                      <>
                        <div className='my-1 border-t' />
                        <button
                          className='flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                          onClick={() => onPaymentMethodSelect(tx, null)}
                        >
                          <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-red-100 dark:bg-red-900/30'>
                            <X className='h-3.5 w-3.5' />
                          </span>
                          <span className='truncate'>
                            {t.common?.remove || 'Verwijderen'}
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Payment Processor Badge */}
              {tx.paymentProvider && (
                <Popover
                  open={openPaymentProcessorPopover === tx.id}
                  onOpenChange={(open) =>
                    onPaymentProcessorPopoverOpen(open ? tx.id : null)
                  }
                >
                  <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button
                      data-onboarding='transaction-payment-processor'
                      className='flex cursor-pointer items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 transition-all hover:ring-2 hover:ring-primary/50 hover:ring-offset-1 dark:bg-gray-800 dark:text-gray-300'
                    >
                      <Building2 className='h-3 w-3' />
                      {tx.paymentProvider}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className='w-48 p-2'
                    align='start'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className='max-h-48 space-y-1 overflow-y-auto'>
                      <button
                        className={cn(
                          'flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                          !tx.paymentProvider && 'bg-muted'
                        )}
                        onClick={() => onPaymentProcessorSelect(tx, null)}
                      >
                        <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-gray-100 text-gray-500'>
                          <X className='h-3.5 w-3.5' />
                        </span>
                        <span className='truncate'>
                          {t.common?.remove || 'Verwijderen'}
                        </span>
                        {!tx.paymentProvider && (
                          <Check className='ml-auto h-3 w-3 text-primary' />
                        )}
                      </button>
                      {paymentProviderRules.map((rule) => (
                        <button
                          key={rule.id}
                          className={cn(
                            'flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                            tx.paymentProvider === rule.name && 'bg-muted'
                          )}
                          onClick={() =>
                            onPaymentProcessorSelect(tx, rule.name)
                          }
                        >
                          <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-gray-100 text-gray-600'>
                            <Building2 className='h-3.5 w-3.5' />
                          </span>
                          <span className='truncate'>{rule.name}</span>
                          {tx.paymentProvider === rule.name && (
                            <Check className='ml-auto h-3 w-3 text-primary' />
                          )}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Address Book Badge */}
              {tx.opposingAccountIban && (
                <Popover
                  open={openAddressBookPopover === tx.id}
                  onOpenChange={(open) => {
                    onAddressBookPopoverOpen(open ? tx.id : null);
                    if (!open) onAddressBookPopoverSearch('');
                  }}
                >
                  <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button
                      data-onboarding='transaction-add-addressbook'
                      className={cn(
                        'flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-all hover:ring-2 hover:ring-primary/50 hover:ring-offset-1',
                        isInAddressBook
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      )}
                    >
                      <BookUser className='h-3 w-3' />
                      {addressBookEntry?.name ||
                        tx.merchantName ||
                        tx.opposingAccountName ||
                        t.transactions.inAddressBook}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className='w-64 p-2'
                    align='start'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className='space-y-2'>
                      <Input
                        placeholder={
                          t.addressBook?.searchContacts || 'Zoek contact...'
                        }
                        value={addressBookPopoverSearch}
                        onChange={(e) =>
                          onAddressBookPopoverSearch(e.target.value)
                        }
                        className='h-8 text-sm'
                        autoFocus
                      />
                      <div className='max-h-48 overflow-y-auto'>
                        <div className='space-y-1'>
                          {(() => {
                            const searchLower =
                              addressBookPopoverSearch.toLowerCase();
                            const filtered = addressBook
                              ?.filter(
                                (c) =>
                                  c.name.toLowerCase().includes(searchLower) ||
                                  c.iban?.toLowerCase().includes(searchLower)
                              )
                              .sort((a, b) => a.name.localeCompare(b.name));
                            return filtered?.length ? (
                              filtered.slice(0, 20).map((contact) => (
                                <button
                                  key={contact.id}
                                  className={cn(
                                    'w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                                    addressBookEntry?.id === contact.id &&
                                      'bg-muted'
                                  )}
                                  onClick={() =>
                                    onAddressBookSelect(tx, contact)
                                  }
                                >
                                  <div className='flex items-center justify-between'>
                                    <span className='font-medium'>
                                      {contact.name}
                                    </span>
                                    {addressBookEntry?.id === contact.id && (
                                      <Check className='h-3 w-3 text-primary' />
                                    )}
                                  </div>
                                  <div className='truncate text-xs text-muted-foreground'>
                                    {contact.iban}
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className='py-2 text-center text-sm text-muted-foreground'>
                                {t.addressBook?.noContactsFound ||
                                  'Geen contacten gevonden'}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      {!isInAddressBook && (
                        <button
                          className='flex w-full items-center gap-2 border-t pt-2 text-sm text-blue-600 hover:text-blue-700'
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddressBookPopoverOpen(null);
                            onAddToAddressBook(tx);
                          }}
                        >
                          <UserPlus className='h-4 w-4' />
                          {t.transactions.addToAddressBook}
                        </button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Transfer Toggle Badge */}
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={cn(
                        'flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-all hover:ring-2 hover:ring-primary/50 hover:ring-offset-1',
                        tx.type === 'transfer'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 opacity-0 group-hover:opacity-100'
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTransferToggle(tx);
                      }}
                      disabled={isPending}
                    >
                      <ArrowLeftRight className='h-3 w-3' />
                      {tx.type === 'transfer' &&
                        (t.transactions.internalTransfer ||
                          'Internal transfer')}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {tx.type === 'transfer'
                      ? t.transactions.removeTransferMark ||
                        'Remove internal transfer mark'
                      : t.transactions.markAsTransfer ||
                        'Mark as internal transfer'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Amount and recurring indicator */}
        <div className='flex flex-col items-end gap-1 text-right'>
          <p
            className={cn(
              'text-lg font-bold',
              tx.type === 'transfer'
                ? 'text-blue-600'
                : tx.amount > 0
                  ? 'text-emerald-600'
                  : 'text-rose-600'
            )}
          >
            {tx.type === 'transfer' ? '' : tx.amount > 0 ? '+' : ''}
            {formatCurrency(tx.amount)}
          </p>
          {isRecurring && (
            <span
              data-onboarding='transaction-recurring-badge'
              className='inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700'
            >
              <Repeat className='h-3 w-3' />
              {recurringHistory.length}×
            </span>
          )}
        </div>
      </div>

      {/* Expanded Recurring History */}
      {isExpanded && (
        <div className='space-y-3 border-t bg-muted/30 p-4'>
          <div className='flex items-center justify-between'>
            <h4 className='flex items-center gap-2 text-sm font-semibold'>
              <History className='h-4 w-4' />
              {t.transactions.recurringHistory}
            </h4>
            <div className='text-sm'>
              <span className='text-muted-foreground'>
                {t.transactions.totalThisPeriod}:
              </span>{' '}
              <span className='font-bold'>{formatCurrency(historyTotal)}</span>
            </div>
          </div>
          <div className='grid gap-2'>
            {(() => {
              const MAX_VISIBLE = 7;
              const CONTEXT_SIZE = 3;
              const currentIndex = recurringHistory.findIndex(
                (h) => h.id === tx.id
              );

              if (recurringHistory.length <= MAX_VISIBLE) {
                return recurringHistory.map((h) => (
                  <div
                    key={h.id}
                    className={cn(
                      '-mx-2 flex items-center justify-between rounded border-b border-dashed px-2 py-1 text-sm last:border-0',
                      h.id === tx.id && 'bg-purple-100 dark:bg-purple-900/30'
                    )}
                  >
                    <span className='text-muted-foreground'>
                      {formatDate(h.date)}
                    </span>
                    <span className='font-medium'>
                      {formatCurrency(h.amount)}
                    </span>
                  </div>
                ));
              }

              let startIdx = Math.max(0, currentIndex - CONTEXT_SIZE);
              let endIdx = Math.min(
                recurringHistory.length - 1,
                currentIndex + CONTEXT_SIZE
              );

              if (startIdx === 0) {
                endIdx = Math.min(recurringHistory.length - 1, MAX_VISIBLE - 1);
              } else if (endIdx === recurringHistory.length - 1) {
                startIdx = Math.max(0, recurringHistory.length - MAX_VISIBLE);
              }

              const visibleHistory = recurringHistory.slice(
                startIdx,
                endIdx + 1
              );
              const hiddenBefore = startIdx;
              const hiddenAfter = recurringHistory.length - endIdx - 1;

              return (
                <>
                  {hiddenBefore > 0 && (
                    <div className='-mx-2 flex items-center justify-center gap-2 px-2 py-1 text-xs text-muted-foreground'>
                      <span className='flex-1 border-b border-dashed' />
                      <span>
                        {hiddenBefore}{' '}
                        {hiddenBefore === 1
                          ? t.transactions?.laterTransaction ||
                            'latere transactie'
                          : t.transactions?.laterTransactions ||
                            'latere transacties'}
                      </span>
                      <span className='flex-1 border-b border-dashed' />
                    </div>
                  )}
                  {visibleHistory.map((h) => (
                    <div
                      key={h.id}
                      className={cn(
                        '-mx-2 flex items-center justify-between rounded border-b border-dashed px-2 py-1 text-sm last:border-0',
                        h.id === tx.id && 'bg-purple-100 dark:bg-purple-900/30'
                      )}
                    >
                      <span className='text-muted-foreground'>
                        {formatDate(h.date)}
                      </span>
                      <span className='font-medium'>
                        {formatCurrency(h.amount)}
                      </span>
                    </div>
                  ))}
                  {hiddenAfter > 0 && (
                    <div className='-mx-2 flex items-center justify-center gap-2 px-2 py-1 text-xs text-muted-foreground'>
                      <span className='flex-1 border-b border-dashed' />
                      <span>
                        {hiddenAfter}{' '}
                        {hiddenAfter === 1
                          ? t.transactions?.earlierTransaction ||
                            'eerdere transactie'
                          : t.transactions?.earlierTransactions ||
                            'eerdere transacties'}
                      </span>
                      <span className='flex-1 border-b border-dashed' />
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
});

export default TransactionRow;
