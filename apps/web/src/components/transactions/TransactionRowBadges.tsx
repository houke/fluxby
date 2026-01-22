/**
 * Optimized Transaction Row Badges Component
 *
 * This component wraps all the badge popovers for a transaction row.
 * It manages its own popover state internally to prevent re-renders
 * of other transaction rows when a popover is opened.
 *
 * Performance benefits:
 * - Each row manages its own popover state
 * - Opening a popover doesn't re-render other rows
 * - Memoization prevents re-renders when parent state changes
 */
import { memo, useState, useCallback, useMemo } from 'react';
import {
  Check,
  CreditCard,
  Building2,
  X,
  UserPlus,
  UserMinus,
  BookUser,
  ArrowLeftRight,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';

import type {
  Transaction,
  Category,
  AddressBookEntry,
  PaymentProviderRule,
} from '@fluxby/shared';

// Type definitions for the badges component
// Using shared types to ensure consistency

interface TransactionRowBadgesProps {
  transaction: Transaction;
  categories: Category[] | undefined;
  categoryName: string;
  categoryColor: string;
  paymentInfo: {
    label: string;
    color: string;
    icon: React.ReactNode;
  };
  paymentMethods: Array<{
    value: string;
    label: string;
    icon: React.ReactNode;
    color: string;
  }>;
  paymentProviderRules: PaymentProviderRule[];
  addressBook: AddressBookEntry[] | undefined;
  addressBookEntry: AddressBookEntry | null | undefined;
  isInAddressBook: boolean;
  hasDirectAddressBookLink: boolean;

  onCategorySelect: (tx: Transaction, categoryId: string) => void;
  onPaymentMethodSelect: (tx: Transaction, method: string | null) => void;
  onPaymentProcessorSelect: (tx: Transaction, processor: string | null) => void;
  onAddressBookSelect: (
    tx: Transaction,
    contact: AddressBookEntry
  ) => void | Promise<void>;
  onAddToAddressBook: (tx: Transaction) => void;
  onRemoveFromAddressBook: (tx: Transaction) => void;
  onTransferToggle: (tx: Transaction) => void;
  isUpdatePending: boolean;
  translations: {
    searchCategories: string;
    paymentMethods: {
      other: string;
    };
    remove: string;
    addToAddressBook: string;
    unlinkFromContact: string;
    inAddressBook: string;
    searchContacts: string;
    noContactsFound: string;
    internalTransfer: string;
    removeTransferMark: string;
    markAsTransfer: string;
  };
}

export const TransactionRowBadges = memo(function TransactionRowBadges({
  transaction: tx,
  categories,
  categoryName,
  categoryColor,
  paymentInfo,
  paymentMethods,
  paymentProviderRules,
  addressBook,
  addressBookEntry,
  isInAddressBook,
  hasDirectAddressBookLink,
  onCategorySelect,
  onPaymentMethodSelect,
  onPaymentProcessorSelect,
  onAddressBookSelect,
  onAddToAddressBook,
  onRemoveFromAddressBook,
  onTransferToggle,
  isUpdatePending,
  translations: t,
}: TransactionRowBadgesProps) {
  // Local popover states - each row manages its own
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(false);
  const [paymentProcessorOpen, setPaymentProcessorOpen] = useState(false);
  const [addressBookOpen, setAddressBookOpen] = useState(false);

  // Search states
  const [categorySearch, setCategorySearch] = useState('');
  const [addressBookSearch, setAddressBookSearch] = useState('');

  // Memoized category groups
  const groupedCategories = useMemo(() => {
    if (!categories) return [];
    const searchLower = categorySearch.toLowerCase();
    const parents = categories.filter((c) => !c.parentId);

    return parents
      .map((parent) => {
        const children = categories
          .filter((c) => c.parentId === parent.id)
          .filter(
            (c) =>
              searchLower === '' ||
              c.name.toLowerCase().includes(searchLower) ||
              parent.name.toLowerCase().includes(searchLower)
          )
          .sort((a, b) => a.name.localeCompare(b.name, 'nl'));
        return { parent, children };
      })
      .filter((group) => group.children.length > 0);
  }, [categories, categorySearch]);

  // Memoized address book filter
  const filteredAddressBook = useMemo(() => {
    if (!addressBook) return [];
    if (!addressBookSearch) return addressBook.slice(0, 20);
    const searchLower = addressBookSearch.toLowerCase();
    return addressBook
      .filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.iban?.toLowerCase().includes(searchLower)
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 20);
  }, [addressBook, addressBookSearch]);

  // Handlers
  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      onCategorySelect(tx, categoryId);
      setCategoryOpen(false);
      setCategorySearch('');
    },
    [tx, onCategorySelect]
  );

  const handlePaymentMethodSelect = useCallback(
    (method: string | null) => {
      onPaymentMethodSelect(tx, method);
      setPaymentMethodOpen(false);
    },
    [tx, onPaymentMethodSelect]
  );

  const handlePaymentProcessorSelect = useCallback(
    (processor: string | null) => {
      onPaymentProcessorSelect(tx, processor);
      setPaymentProcessorOpen(false);
    },
    [tx, onPaymentProcessorSelect]
  );

  const handleAddressBookSelect = useCallback(
    (contact: AddressBookEntry) => {
      onAddressBookSelect(tx, contact);
      setAddressBookOpen(false);
      setAddressBookSearch('');
    },
    [tx, onAddressBookSelect]
  );

  const handleAddToAddressBook = useCallback(() => {
    onAddToAddressBook(tx);
    setAddressBookOpen(false);
  }, [tx, onAddToAddressBook]);

  const handleRemoveFromAddressBook = useCallback(() => {
    onRemoveFromAddressBook(tx);
    setAddressBookOpen(false);
  }, [tx, onRemoveFromAddressBook]);

  const handleTransferToggle = useCallback(() => {
    onTransferToggle(tx);
  }, [tx, onTransferToggle]);

  return (
    <div className='mt-1 flex flex-wrap items-center gap-1.5'>
      {/* Category Badge */}
      <Popover
        open={categoryOpen}
        onOpenChange={(open) => {
          setCategoryOpen(open);
          if (!open) setCategorySearch('');
        }}
      >
        <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button
            data-onboarding='transaction-category-badge'
            className='cursor-pointer rounded px-2 py-0.5 text-xs font-medium transition-all hover:ring-2 hover:ring-primary/50 hover:ring-offset-1'
            style={{
              backgroundColor: `${categoryColor}5C`,
              color: '#374151',
            }}
          >
            {categoryName}
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
              placeholder={t.searchCategories}
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className='h-8 text-sm'
              autoFocus
            />
            <div className='space-y-1'>
              {groupedCategories.map(({ parent, children }) => (
                <div key={parent.id}>
                  <div className='flex items-center gap-2 py-1.5'>
                    <div className='h-px flex-1 border-t border-dotted border-muted-foreground/30' />
                    <span className='text-xs whitespace-nowrap text-muted-foreground'>
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
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      <span
                        className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-sm'
                        style={{
                          backgroundColor: `${category.color || '#9CA3AF'}5C`,
                        }}
                      >
                        {category.icon}
                      </span>
                      <span className='whitespace-nowrap'>{category.name}</span>
                      {tx.categoryId === category.id && (
                        <Check className='ml-auto h-3 w-3 flex-shrink-0 text-primary' />
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Payment Method Badge */}
      <Popover open={paymentMethodOpen} onOpenChange={setPaymentMethodOpen}>
        <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button
            className={cn(
              'flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition-all hover:ring-2 hover:ring-primary/50 hover:ring-offset-1',
              tx.paymentMethod ? paymentInfo.color : 'bg-gray-100 text-gray-500'
            )}
          >
            {paymentInfo.icon || <CreditCard className='h-3.5 w-3.5' />}
            {tx.paymentMethod ? paymentInfo.label : t.paymentMethods.other}
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
                  tx.paymentMethod?.toLowerCase() === method.value && 'bg-muted'
                )}
                onClick={() => handlePaymentMethodSelect(method.value)}
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
                  onClick={() => handlePaymentMethodSelect(null)}
                >
                  <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-red-100 dark:bg-red-900/30'>
                    <X className='h-3.5 w-3.5' />
                  </span>
                  <span className='truncate'>{t.remove}</span>
                </button>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Payment Processor Badge */}
      {tx.paymentProvider && (
        <Popover
          open={paymentProcessorOpen}
          onOpenChange={setPaymentProcessorOpen}
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
                onClick={() => handlePaymentProcessorSelect(null)}
              >
                <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-gray-100 text-gray-500'>
                  <X className='h-3.5 w-3.5' />
                </span>
                <span className='truncate'>{t.remove}</span>
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
                  onClick={() => handlePaymentProcessorSelect(rule.name)}
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
          open={addressBookOpen}
          onOpenChange={(open) => {
            setAddressBookOpen(open);
            if (!open) setAddressBookSearch('');
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
                t.inAddressBook}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className='w-64 p-2'
            align='start'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='space-y-2'>
              <Input
                placeholder={t.searchContacts}
                value={addressBookSearch}
                onChange={(e) => setAddressBookSearch(e.target.value)}
                className='h-8 text-sm'
                autoFocus
              />
              <div className='max-h-48 overflow-y-auto'>
                <div className='space-y-1'>
                  {filteredAddressBook.length > 0 ? (
                    filteredAddressBook.map((contact) => (
                      <button
                        key={contact.id}
                        className={cn(
                          'w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                          addressBookEntry?.id === contact.id && 'bg-muted'
                        )}
                        onClick={() => handleAddressBookSelect(contact)}
                      >
                        <div className='flex items-center justify-between'>
                          <span className='font-medium'>{contact.name}</span>
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
                      {t.noContactsFound}
                    </div>
                  )}
                </div>
              </div>
              {!isInAddressBook && (
                <button
                  className='flex w-full items-center gap-2 border-t pt-2 text-sm text-blue-600 hover:text-blue-700'
                  onClick={handleAddToAddressBook}
                >
                  <UserPlus className='h-4 w-4' />
                  {t.addToAddressBook}
                </button>
              )}
              {hasDirectAddressBookLink && (
                <button
                  className='flex w-full items-center gap-2 border-t pt-2 text-sm text-red-600 hover:text-red-700'
                  onClick={handleRemoveFromAddressBook}
                >
                  <UserMinus className='h-4 w-4' />
                  {t.unlinkFromContact}
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
                handleTransferToggle();
              }}
              disabled={isUpdatePending}
            >
              <ArrowLeftRight className='h-3 w-3' />
              {tx.type === 'transfer' && t.internalTransfer}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {tx.type === 'transfer' ? t.removeTransferMark : t.markAsTransfer}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
});
