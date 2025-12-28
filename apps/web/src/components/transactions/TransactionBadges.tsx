/**
 * Optimized Transaction Row Badge Popover components
 *
 * These components are extracted and memoized to prevent re-renders when:
 * 1. Badge popovers are opened/closed
 * 2. Other badges on the same row are interacted with
 *
 * Each badge manages its own popover state internally.
 */
import { memo, useState, useCallback, useMemo } from 'react';
import {
  Check,
  CreditCard,
  Building2,
  Smartphone,
  RefreshCcw,
  X,
  UserPlus,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// ============================================================================
// Category Badge Popover
// ============================================================================

interface Category {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  parentId: number | null;
}

interface CategoryBadgeProps {
  transactionId: number;
  categoryId: number | null;
  categoryName: string;
  categoryColor: string;
  categories: Category[] | undefined;
  onSelect: (categoryId: number) => void;
  translations: {
    searchCategories: string;
  };
  'data-onboarding'?: string;
}

export const CategoryBadge = memo(function CategoryBadge({
  transactionId: _transactionId,
  categoryId,
  categoryName,
  categoryColor,
  categories,
  onSelect,
  translations: t,
  'data-onboarding': dataOnboarding,
}: CategoryBadgeProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) setSearch('');
  }, []);

  const handleSelect = useCallback(
    (catId: number) => {
      onSelect(catId);
      setOpen(false);
    },
    [onSelect]
  );

  // Grouped categories
  const groupedCategories = useMemo(() => {
    if (!categories) return [];
    const searchLower = search.toLowerCase();
    const parents = categories.filter((c) => c.parentId === null);

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
  }, [categories, search]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button
          data-onboarding={dataOnboarding}
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='h-8 text-sm'
            autoFocus
          />
          <div className='space-y-1'>
            {groupedCategories.map(({ parent, children }) => (
              <div key={parent.id}>
                {/* Parent category header */}
                <div className='flex items-center gap-2 py-1.5'>
                  <div className='h-px flex-1 border-t border-dotted border-muted-foreground/30' />
                  <span className='whitespace-nowrap text-xs text-muted-foreground'>
                    {parent.name}
                  </span>
                  <div className='h-px flex-1 border-t border-dotted border-muted-foreground/30' />
                </div>
                {/* Child categories */}
                {children.map((category) => (
                  <button
                    key={category.id}
                    className={cn(
                      'flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                      categoryId === category.id && 'bg-muted'
                    )}
                    onClick={() => handleSelect(category.id)}
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
                    {categoryId === category.id && (
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
  );
});

// ============================================================================
// Payment Method Badge Popover
// ============================================================================

interface PaymentMethodBadgeProps {
  transactionId: number;
  paymentMethod: string | null;
  paymentInfo: {
    label: string;
    color: string;
    icon: React.ReactNode;
  };
  onSelect: (method: string | null) => void;
  translations: {
    other: string;
    remove: string;
    pin: string;
    ideal: string;
    transfer: string;
    incasso: string;
    atm: string;
  };
}

export const PaymentMethodBadge = memo(function PaymentMethodBadge({
  transactionId: _transactionId,
  paymentMethod,
  paymentInfo,
  onSelect,
  translations: t,
}: PaymentMethodBadgeProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (method: string | null) => {
      onSelect(method);
      setOpen(false);
    },
    [onSelect]
  );

  const methods = useMemo(
    () => [
      {
        value: 'pin',
        label: t.pin,
        icon: <CreditCard className='h-3.5 w-3.5' />,
        color: 'bg-blue-100 text-blue-600',
      },
      {
        value: 'ideal',
        label: t.ideal,
        icon: <Smartphone className='h-3.5 w-3.5' />,
        color: 'bg-pink-100 text-pink-600',
      },
      {
        value: 'overschrijving',
        label: t.transfer,
        icon: <Building2 className='h-3.5 w-3.5' />,
        color: 'bg-purple-100 text-purple-600',
      },
      {
        value: 'incasso',
        label: t.incasso,
        icon: <RefreshCcw className='h-3.5 w-3.5' />,
        color: 'bg-orange-100 text-orange-600',
      },
      {
        value: 'geldautomaat',
        label: t.atm,
        icon: <CreditCard className='h-3.5 w-3.5' />,
        color: 'bg-emerald-100 text-emerald-600',
      },
    ],
    [t]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button
          className={cn(
            'flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition-all hover:ring-2 hover:ring-primary/50 hover:ring-offset-1',
            paymentMethod ? paymentInfo.color : 'bg-gray-100 text-gray-500'
          )}
        >
          {paymentInfo.icon || <CreditCard className='h-3.5 w-3.5' />}
          {paymentMethod ? paymentInfo.label : t.other}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className='w-48 p-2'
        align='start'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='space-y-1'>
          {methods.map((method) => (
            <button
              key={method.value}
              className={cn(
                'flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                paymentMethod?.toLowerCase() === method.value && 'bg-muted'
              )}
              onClick={() => handleSelect(method.value)}
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
              {paymentMethod?.toLowerCase() === method.value && (
                <Check className='ml-auto h-3 w-3 text-primary' />
              )}
            </button>
          ))}
          {paymentMethod && (
            <>
              <div className='my-1 border-t' />
              <button
                className='flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                onClick={() => handleSelect(null)}
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
  );
});

// ============================================================================
// Payment Processor Badge Popover
// ============================================================================

interface PaymentProcessorRule {
  id: number;
  name: string;
  patterns: string;
}

interface PaymentProcessorBadgeProps {
  transactionId: number;
  paymentProvider: string | null;
  processors: PaymentProcessorRule[];
  onSelect: (processor: string | null) => void;
  translations: {
    remove: string;
  };
  'data-onboarding'?: string;
}

export const PaymentProcessorBadge = memo(function PaymentProcessorBadge({
  transactionId: _transactionId,
  paymentProvider,
  processors,
  onSelect,
  translations: t,
  'data-onboarding': dataOnboarding,
}: PaymentProcessorBadgeProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (processor: string | null) => {
      onSelect(processor);
      setOpen(false);
    },
    [onSelect]
  );

  if (!paymentProvider) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button
          data-onboarding={dataOnboarding}
          className='flex cursor-pointer items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 transition-all hover:ring-2 hover:ring-primary/50 hover:ring-offset-1 dark:bg-gray-800 dark:text-gray-300'
        >
          <Building2 className='h-3 w-3' />
          {paymentProvider}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className='w-48 p-2'
        align='start'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='max-h-48 space-y-1 overflow-y-auto'>
          {/* Option to clear */}
          <button
            className={cn(
              'flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted',
              !paymentProvider && 'bg-muted'
            )}
            onClick={() => handleSelect(null)}
          >
            <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-gray-100 text-gray-500'>
              <X className='h-3.5 w-3.5' />
            </span>
            <span className='truncate'>{t.remove}</span>
            {!paymentProvider && (
              <Check className='ml-auto h-3 w-3 text-primary' />
            )}
          </button>
          {/* List available processors */}
          {processors.map((rule) => (
            <button
              key={rule.id}
              className={cn(
                'flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                paymentProvider === rule.name && 'bg-muted'
              )}
              onClick={() => handleSelect(rule.name)}
            >
              <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-gray-100 text-gray-600'>
                <Building2 className='h-3.5 w-3.5' />
              </span>
              <span className='truncate'>{rule.name}</span>
              {paymentProvider === rule.name && (
                <Check className='ml-auto h-3 w-3 text-primary' />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
});

// ============================================================================
// Address Book Badge Popover
// ============================================================================

interface AddressBookEntry {
  id: number;
  iban: string;
  name: string;
  description: string | null;
}

interface AddressBookBadgeProps {
  transactionId: number;
  iban: string;
  isInAddressBook: boolean;
  addressBookEntry: AddressBookEntry | null;
  addressBook: AddressBookEntry[] | undefined;
  sharedIbanData: { count: number; names: string[] } | null;
  onAddToAddressBook: () => void;
  onOpenSheet: () => void;
  translations: {
    addToAddressBook: string;
    inAddressBook: string;
    sharedAccount: string;
    search: string;
  };
  'data-onboarding'?: string;
}

export const AddressBookBadge = memo(function AddressBookBadge({
  transactionId: _transactionId,
  iban: _iban,
  isInAddressBook,
  addressBookEntry,
  addressBook,
  sharedIbanData,
  onAddToAddressBook,
  onOpenSheet,
  translations: t,
  'data-onboarding': dataOnboarding,
}: AddressBookBadgeProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) setSearch('');
  }, []);

  // Filter address book entries
  const filteredEntries = useMemo(() => {
    if (!addressBook) return [];
    if (!search) return addressBook.slice(0, 10);
    const searchLower = search.toLowerCase();
    return addressBook
      .filter(
        (entry) =>
          entry.name.toLowerCase().includes(searchLower) ||
          entry.iban.toLowerCase().includes(searchLower)
      )
      .slice(0, 10);
  }, [addressBook, search]);

  // Show shared IBAN indicator
  const isShared = sharedIbanData && sharedIbanData.count > 1;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button
          data-onboarding={dataOnboarding}
          className={cn(
            'flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-all hover:ring-2 hover:ring-primary/50 hover:ring-offset-1',
            isInAddressBook
              ? 'bg-emerald-100 text-emerald-700'
              : isShared
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-600'
          )}
        >
          {isInAddressBook ? (
            <>
              <Users className='h-3 w-3' />
              {addressBookEntry?.name || t.inAddressBook}
            </>
          ) : isShared ? (
            <>
              <Users className='h-3 w-3' />
              {t.sharedAccount} ({sharedIbanData.count})
            </>
          ) : (
            <>
              <UserPlus className='h-3 w-3' />
              {t.addToAddressBook}
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className='w-64 p-2'
        align='start'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='space-y-2'>
          {/* Quick add button */}
          {!isInAddressBook && (
            <Button
              variant='outline'
              size='sm'
              className='w-full justify-start'
              onClick={() => {
                onAddToAddressBook();
                setOpen(false);
              }}
            >
              <UserPlus className='mr-2 h-4 w-4' />
              {t.addToAddressBook}
            </Button>
          )}

          {/* View in address book */}
          {isInAddressBook && (
            <Button
              variant='outline'
              size='sm'
              className='w-full justify-start'
              onClick={() => {
                onOpenSheet();
                setOpen(false);
              }}
            >
              <Users className='mr-2 h-4 w-4' />
              {addressBookEntry?.name}
            </Button>
          )}

          {/* Search for linking */}
          {!isInAddressBook && addressBook && addressBook.length > 0 && (
            <>
              <div className='my-1 border-t' />
              <Input
                placeholder={t.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='h-8 text-sm'
              />
              <div className='max-h-32 space-y-1 overflow-y-auto'>
                {filteredEntries.map((entry) => (
                  <button
                    key={entry.id}
                    className='flex w-full items-start rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted'
                    onClick={() => {
                      // TODO: Link IBAN to existing entry
                      setOpen(false);
                    }}
                  >
                    <div className='min-w-0 flex-1'>
                      <div className='truncate font-medium'>{entry.name}</div>
                      <div className='truncate text-xs text-muted-foreground'>
                        {entry.iban}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});

// ============================================================================
// Recurring Badge (non-popover, just visual with click handler)
// ============================================================================

interface RecurringBadgeProps {
  isRecurring: boolean;
  isExpanded: boolean;
  historyCount: number;
  onToggle: () => void;
  translations: {
    recurring: string;
  };
  'data-onboarding'?: string;
}

export const RecurringBadge = memo(function RecurringBadge({
  isRecurring,
  isExpanded,
  historyCount,
  onToggle,
  translations: t,
  'data-onboarding': dataOnboarding,
}: RecurringBadgeProps) {
  if (!isRecurring) return null;

  return (
    <button
      data-onboarding={dataOnboarding}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        'flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-all hover:ring-2 hover:ring-primary/50 hover:ring-offset-1',
        isExpanded
          ? 'bg-purple-200 text-purple-800'
          : 'bg-purple-100 text-purple-700'
      )}
    >
      <RefreshCcw className='h-3 w-3' />
      {t.recurring} ({historyCount})
    </button>
  );
});
