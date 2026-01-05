/**
 * Optimized Filter Popover components
 *
 * These components are extracted and memoized to prevent the large Transactions page
 * from re-rendering when filter popovers open/close.
 */
import { memo, useState, useCallback, useMemo } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Check,
  Tags,
  Filter,
  Search,
  CreditCard,
  Building2,
  Smartphone,
  RefreshCcw,
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
// Transaction Type Filter
// ============================================================================

export type TransactionTypeFilter = 'all' | 'income' | 'expense' | 'transfer';

interface TypeFilterProps {
  value: TransactionTypeFilter;
  onChange: (value: TransactionTypeFilter) => void;
  translations: {
    transactions: string;
    income: string;
    expense: string;
    transfer: string;
    clearAll: string;
  };
}

export const TypeFilter = memo(function TypeFilter({
  value,
  onChange,
  translations: t,
}: TypeFilterProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (type: TransactionTypeFilter) => {
      onChange(type);
      setOpen(false);
    },
    [onChange]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          data-onboarding='transaction-type-filter-button'
          className={cn(
            'w-full min-w-[140px] justify-start sm:w-auto',
            value !== 'all' && 'bg-primary/10'
          )}
        >
          <Filter className='mr-1 h-4 w-4' />
          {value === 'all' && t.transactions}
          {value === 'income' && t.income}
          {value === 'expense' && t.expense}
          {value === 'transfer' && t.transfer}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[180px] p-0' align='start'>
        <div className='space-y-1 p-2'>
          <button
            onClick={() => handleSelect('income')}
            className={cn(
              'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
              value === 'income' && 'bg-primary/10'
            )}
          >
            <ArrowDownRight className='h-4 w-4 text-emerald-500' />
            <span className='flex-1'>{t.income}</span>
            {value === 'income' && <Check className='h-4 w-4 text-primary' />}
          </button>
          <button
            onClick={() => handleSelect('expense')}
            className={cn(
              'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
              value === 'expense' && 'bg-primary/10'
            )}
          >
            <ArrowUpRight className='h-4 w-4 text-rose-500' />
            <span className='flex-1'>{t.expense}</span>
            {value === 'expense' && <Check className='h-4 w-4 text-primary' />}
          </button>
          <button
            onClick={() => handleSelect('transfer')}
            className={cn(
              'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
              value === 'transfer' && 'bg-primary/10'
            )}
          >
            <ArrowLeftRight className='h-4 w-4 text-blue-500' />
            <span className='flex-1'>{t.transfer}</span>
            {value === 'transfer' && <Check className='h-4 w-4 text-primary' />}
          </button>
        </div>
        {value !== 'all' && (
          <div className='border-t p-2'>
            <Button
              variant='ghost'
              size='sm'
              className='w-full'
              onClick={() => handleSelect('all')}
            >
              {t.clearAll}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
});

// ============================================================================
// Category Filter
// ============================================================================

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  parentId: string | null;
}

interface CategoryFilterProps {
  categories: Category[] | undefined;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  translations: {
    categories: string;
    noCategory: string;
    search: string;
    clearAll: string;
  };
}

const colorWithOpacity = (hex: string | null | undefined, alpha = 0.2) => {
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

export const CategoryFilter = memo(function CategoryFilter({
  categories,
  selectedIds,
  onChange,
  translations: t,
}: CategoryFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) setSearch('');
  }, []);

  // Get child category IDs for a parent
  const getChildCategoryIds = useCallback(
    (parentId: string): string[] => {
      if (!categories) return [];
      return categories.filter((c) => c.parentId === parentId).map((c) => c.id);
    },
    [categories]
  );

  // Toggle category with subcategory auto-selection
  const toggleCategory = useCallback(
    (categoryId: string) => {
      const category = categories?.find((c) => c.id === categoryId);
      if (!category) return;

      const isParent = !category.parentId;

      if (isParent) {
        const childIds = getChildCategoryIds(categoryId);
        if (selectedIds.includes(categoryId)) {
          const idsToRemove = new Set([categoryId, ...childIds]);
          onChange(selectedIds.filter((id) => !idsToRemove.has(id)));
        } else {
          const newIds = new Set([...selectedIds, categoryId, ...childIds]);
          onChange(Array.from(newIds));
        }
      } else {
        const parentId = category.parentId;
        if (!parentId) return;
        const siblingIds = getChildCategoryIds(parentId);

        if (selectedIds.includes(categoryId)) {
          const newIds = selectedIds.filter(
            (id) => id !== categoryId && id !== parentId
          );
          onChange(newIds);
        } else {
          const newSelectedIds = new Set([...selectedIds, categoryId]);
          const allSiblingsSelected = siblingIds.every((id) =>
            newSelectedIds.has(id)
          );
          if (allSiblingsSelected) {
            newSelectedIds.add(parentId);
          }
          onChange(Array.from(newSelectedIds));
        }
      }
    },
    [categories, selectedIds, onChange, getChildCategoryIds]
  );

  // Toggle uncategorized (use '0' as explicit marker for uncategorized)
  const toggleUncategorized = useCallback(() => {
    const uncategorizedId = '0';
    if (selectedIds.includes(uncategorizedId)) {
      onChange(selectedIds.filter((id) => id !== uncategorizedId));
    } else {
      onChange([...selectedIds, uncategorizedId]);
    }
  }, [selectedIds, onChange]);

  // Grouped categories by parent (filtered to include matches in parent or children)
  const groupedCategories = useMemo(() => {
    if (!categories) return [];

    const allParents = categories.filter((c) => !c.parentId);

    if (!search) {
      // No search - show all
      return allParents.map((parent) => ({
        parent,
        children: categories.filter((c) => c.parentId === parent.id),
      }));
    }

    const searchLower = search.toLowerCase();

    // Filter: include parent if parent name matches OR any child matches
    return allParents
      .map((parent) => {
        const children = categories.filter((c) => c.parentId === parent.id);
        const parentMatches = parent.name.toLowerCase().includes(searchLower);
        const matchingChildren = children.filter((c) =>
          c.name.toLowerCase().includes(searchLower)
        );

        // Include parent if it matches OR has matching children
        if (parentMatches || matchingChildren.length > 0) {
          return {
            parent,
            // If parent matches, show all children; otherwise only matching children
            children: parentMatches ? children : matchingChildren,
          };
        }
        return null;
      })
      .filter(Boolean) as { parent: Category; children: Category[] }[];
  }, [categories, search]);

  if (!categories || categories.length === 0) return null;

  // Get display label for selected categories
  const getSelectedLabel = () => {
    if (selectedIds.length === 0) return null;
    if (selectedIds.length === 1) {
      const catId = selectedIds[0];
      if (catId === '') return t.noCategory;
      const cat = categories?.find((c) => c.id === catId);
      return cat?.name || t.categories;
    }
    // Multiple selected - show count
    return `${selectedIds.length} ${t.categories.toLowerCase()}`;
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          data-onboarding='transaction-category-filter'
          className={cn(
            'w-full min-w-[140px] justify-start sm:w-auto',
            selectedIds.length > 0 && 'bg-primary/10'
          )}
        >
          {selectedIds.length > 0 ? (
            <span className='truncate text-sm'>{getSelectedLabel()}</span>
          ) : (
            <>
              <Tags className='mr-1 h-4 w-4' />
              {t.categories}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[250px] p-0' align='start'>
        {/* Sticky Search */}
        <div className='sticky top-0 z-10 border-b bg-popover p-2'>
          <div className='relative'>
            <Search className='absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='h-8 pl-8'
            />
          </div>
        </div>
        <div className='max-h-[300px] space-y-1 overflow-y-auto p-2'>
          {/* Uncategorized option */}
          {(!search ||
            t.noCategory.toLowerCase().includes(search.toLowerCase())) && (
            <button
              onClick={toggleUncategorized}
              className={cn(
                'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                selectedIds.includes('') && 'bg-primary/10'
              )}
            >
              <span className='flex h-5 w-5 items-center justify-center rounded-lg bg-gray-200 text-xs dark:bg-gray-700'>
                ❓
              </span>
              <span className='flex-1'>{t.noCategory}</span>
              {selectedIds.includes('') && (
                <Check className='h-4 w-4 text-primary' />
              )}
            </button>
          )}
          {/* Categories */}
          {groupedCategories.map(({ parent, children }) => (
            <div key={parent.id}>
              {/* Parent header */}
              <button
                onClick={() => toggleCategory(parent.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm font-medium transition-colors hover:bg-muted',
                  selectedIds.includes(parent.id) && 'bg-primary/10'
                )}
              >
                <span
                  className='flex h-5 w-5 items-center justify-center rounded-lg text-xs'
                  style={{ backgroundColor: colorWithOpacity(parent.color) }}
                >
                  {parent.icon}
                </span>
                <span className='flex-1'>{parent.name}</span>
                {selectedIds.includes(parent.id) && (
                  <Check className='h-4 w-4 text-primary' />
                )}
              </button>
              {/* Children */}
              {children.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded px-2 py-1.5 pl-6 text-left text-sm transition-colors hover:bg-muted',
                    selectedIds.includes(cat.id) && 'bg-primary/10'
                  )}
                >
                  <span
                    className='flex h-5 w-5 items-center justify-center rounded-lg text-xs'
                    style={{ backgroundColor: colorWithOpacity(cat.color) }}
                  >
                    {cat.icon}
                  </span>
                  <span className='flex-1'>{cat.name}</span>
                  {selectedIds.includes(cat.id) && (
                    <Check className='h-4 w-4 text-primary' />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
        {selectedIds.length > 0 && (
          <div className='border-t p-2'>
            <Button
              variant='ghost'
              size='sm'
              className='w-full'
              onClick={() => onChange([])}
            >
              {t.clearAll}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
});

// ============================================================================
// Address Book Filter
// ============================================================================

interface AddressBookEntry {
  id: string;
  iban: string;
  name: string;
  description: string | null;
}

interface AddressBookFilterProps {
  addressBook: AddressBookEntry[] | undefined;
  isLoading: boolean;
  selectedIbans: string[];
  selectedAddressBookId: string | null;
  selectedAccountName: string | null;
  onIbansChange: (ibans: string[]) => void;
  onAddressBookIdChange: (id: string | null) => void;
  onAccountNameChange: (name: string | null) => void;
  onOpen: () => void;
  translations: {
    addressBook: string;
    search: string;
    clearAll: string;
    loading: string;
    noContacts: string;
    contacts: string;
    contactsPlural: string;
  };
  'data-onboarding'?: string;
}

export const AddressBookFilter = memo(function AddressBookFilter({
  addressBook,
  isLoading,
  selectedIbans,
  selectedAddressBookId,
  selectedAccountName,
  onIbansChange,
  onAddressBookIdChange,
  onAccountNameChange,
  onOpen,
  translations: t,
  'data-onboarding': dataOnboarding,
}: AddressBookFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen);
      if (isOpen) {
        onOpen();
      }
      if (!isOpen) {
        setSearch('');
        setVisibleCount(20);
      }
    },
    [onOpen]
  );

  const handleSelect = useCallback(
    (contact: AddressBookEntry) => {
      // Toggle behavior: if same contact is selected, deselect
      if (selectedAddressBookId === contact.id) {
        onAddressBookIdChange(null);
        onAccountNameChange(null);
        onIbansChange([]);
      } else {
        onAddressBookIdChange(contact.id);
        onAccountNameChange(contact.name);
        onIbansChange(contact.iban ? [contact.iban] : []);
      }
      setOpen(false);
    },
    [
      selectedAddressBookId,
      onAddressBookIdChange,
      onAccountNameChange,
      onIbansChange,
    ]
  );

  const handleClear = useCallback(() => {
    onAddressBookIdChange(null);
    onAccountNameChange(null);
    onIbansChange([]);
    setOpen(false);
  }, [onAddressBookIdChange, onAccountNameChange, onIbansChange]);

  const filteredAddressBook = useMemo(() => {
    if (!addressBook) return [];
    if (!search) return addressBook;
    const searchLower = search.toLowerCase();
    return addressBook.filter(
      (entry) =>
        entry.name.toLowerCase().includes(searchLower) ||
        entry.iban.toLowerCase().includes(searchLower) ||
        entry.description?.toLowerCase().includes(searchLower)
    );
  }, [addressBook, search]);

  const visibleContacts = useMemo(() => {
    return filteredAddressBook.slice(0, visibleCount);
  }, [filteredAddressBook, visibleCount]);

  const hasSelection =
    selectedAddressBookId !== null ||
    selectedAccountName !== null ||
    selectedIbans.length > 0;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          data-onboarding={dataOnboarding}
          className={cn(
            'w-full min-w-[140px] justify-start sm:w-auto',
            hasSelection && 'bg-primary/10'
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
                {selectedIbans.length === 1 ? t.contacts : t.contactsPlural}
              </span>
            </div>
          ) : (
            <>
              <Users className='mr-1 h-4 w-4' />
              {t.addressBook}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[280px] p-0' align='start'>
        {/* Sticky Search */}
        <div className='sticky top-0 z-10 border-b bg-popover p-2'>
          <div className='relative'>
            <Search className='absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              setVisibleCount((prev) => prev + 20);
            }
          }}
        >
          {isLoading ? (
            <p className='px-2 py-4 text-center text-sm text-muted-foreground'>
              {t.loading}
            </p>
          ) : visibleContacts.length === 0 ? (
            <p className='px-2 py-4 text-center text-sm text-muted-foreground'>
              {t.noContacts}
            </p>
          ) : (
            <>
              {visibleContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleSelect(contact)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                    selectedAddressBookId === contact.id && 'bg-primary/10'
                  )}
                >
                  <span className='flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs dark:bg-gray-700'>
                    {(contact.name || '').charAt(0).toUpperCase()}
                  </span>
                  <span className='flex-1 truncate'>
                    {contact.name}
                    {contact.description && (
                      <span className='ml-2 font-normal text-muted-foreground'>
                        ({contact.description})
                      </span>
                    )}
                  </span>
                  {selectedAddressBookId === contact.id && (
                    <Check className='h-4 w-4 text-primary' />
                  )}
                </button>
              ))}
              {filteredAddressBook.length > visibleCount && (
                <div className='py-2 text-center text-xs text-muted-foreground'>
                  {t.loading}
                </div>
              )}
            </>
          )}
        </div>
        {hasSelection && (
          <div className='border-t p-2'>
            <Button
              variant='ghost'
              size='sm'
              className='w-full'
              onClick={handleClear}
            >
              {t.clearAll}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
});

// ============================================================================
// Payment Method Filter
// ============================================================================

interface PaymentMethodFilterProps {
  selectedMethods: string[];
  onChange: (methods: string[]) => void;
  translations: {
    paymentMethod: string;
    pin: string;
    ideal: string;
    transfer: string;
    incasso: string;
    atm: string;
    clearAll: string;
  };
  'data-onboarding'?: string;
}

export const PaymentMethodFilter = memo(function PaymentMethodFilter({
  selectedMethods,
  onChange,
  translations: t,
  'data-onboarding': dataOnboarding,
}: PaymentMethodFilterProps) {
  const [open, setOpen] = useState(false);

  const methods = useMemo(
    () => [
      { value: 'pin', label: t.pin, icon: CreditCard },
      { value: 'ideal', label: t.ideal, icon: Smartphone },
      { value: 'transfer', label: t.transfer, icon: Building2 },
      { value: 'incasso', label: t.incasso, icon: RefreshCcw },
      { value: 'geldautomaat', label: t.atm, icon: CreditCard },
    ],
    [t]
  );

  const toggleMethod = useCallback(
    (method: string) => {
      if (selectedMethods.includes(method)) {
        onChange(selectedMethods.filter((m) => m !== method));
      } else {
        onChange([...selectedMethods, method]);
      }
    },
    [selectedMethods, onChange]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          data-onboarding={dataOnboarding}
          className={cn(
            'w-full min-w-[140px] justify-start sm:w-auto',
            selectedMethods.length > 0 && 'bg-primary/10'
          )}
        >
          {selectedMethods.length > 0 ? (
            <div className='flex items-center gap-1'>
              <CreditCard className='mr-1 h-4 w-4' />
              <span className='max-w-[100px] truncate text-xs'>
                {methods.find((m) => m.value === selectedMethods[0])?.label ||
                  selectedMethods[0]}
              </span>
              {selectedMethods.length > 1 && (
                <span className='text-xs text-muted-foreground'>
                  +{selectedMethods.length - 1}
                </span>
              )}
            </div>
          ) : (
            <>
              <CreditCard className='mr-1 h-4 w-4' />
              {t.paymentMethod}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[200px] p-0' align='start'>
        <div className='max-h-[300px] space-y-1 overflow-y-auto p-2'>
          {methods.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.value}
                onClick={() => toggleMethod(method.value)}
                className={cn(
                  'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                  selectedMethods.includes(method.value) && 'bg-primary/10'
                )}
              >
                <Icon className='h-4 w-4' />
                <span className='flex-1'>{method.label}</span>
                {selectedMethods.includes(method.value) && (
                  <Check className='h-4 w-4 text-primary' />
                )}
              </button>
            );
          })}
        </div>
        {selectedMethods.length > 0 && (
          <div className='border-t p-2'>
            <Button
              variant='ghost'
              size='sm'
              className='w-full'
              onClick={() => onChange([])}
            >
              {t.clearAll}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
});

// ============================================================================
// Payment Processor Filter
// ============================================================================

interface PaymentProcessorFilterProps {
  processors: Array<{ id: string; name: string; patterns: string }>;
  selectedProcessors: string[];
  onChange: (processors: string[]) => void;
  translations: {
    paymentProcessor: string;
    clearAll: string;
  };
}

export const PaymentProcessorFilter = memo(function PaymentProcessorFilter({
  processors,
  selectedProcessors,
  onChange,
  translations: t,
}: PaymentProcessorFilterProps) {
  const [open, setOpen] = useState(false);

  const toggleProcessor = useCallback(
    (name: string) => {
      if (selectedProcessors.includes(name)) {
        onChange(selectedProcessors.filter((p) => p !== name));
      } else {
        onChange([...selectedProcessors, name]);
      }
    },
    [selectedProcessors, onChange]
  );

  if (processors.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          data-onboarding='transaction-payment-processor-filter'
          className={cn(
            'w-full min-w-[140px] justify-start sm:w-auto',
            selectedProcessors.length > 0 && 'bg-primary/10'
          )}
        >
          {selectedProcessors.length > 0 ? (
            <div className='flex items-center gap-1'>
              <Building2 className='mr-1 h-4 w-4' />
              <span className='max-w-[100px] truncate text-xs'>
                {selectedProcessors[0]}
              </span>
              {selectedProcessors.length > 1 && (
                <span className='text-xs text-muted-foreground'>
                  +{selectedProcessors.length - 1}
                </span>
              )}
            </div>
          ) : (
            <>
              <Building2 className='mr-1 h-4 w-4' />
              {t.paymentProcessor}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[220px] p-0' align='start'>
        <div className='max-h-[300px] space-y-1 overflow-y-auto p-2'>
          {processors.map((processor) => (
            <button
              key={processor.id}
              onClick={() => toggleProcessor(processor.name)}
              className={cn(
                'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                selectedProcessors.includes(processor.name) && 'bg-primary/10'
              )}
            >
              <span className='flex-1 truncate'>{processor.name}</span>
              {selectedProcessors.includes(processor.name) && (
                <Check className='h-4 w-4 text-primary' />
              )}
            </button>
          ))}
        </div>
        {selectedProcessors.length > 0 && (
          <div className='border-t p-2'>
            <Button
              variant='ghost'
              size='sm'
              className='w-full'
              onClick={() => onChange([])}
            >
              {t.clearAll}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
});
