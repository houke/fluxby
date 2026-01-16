import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useDeferredValue,
  useTransition,
} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Wallet,
  History,
  Filter as _Filter,
} from 'lucide-react';
import { useTransactionTotals } from '@/hooks/useTransactionTotals';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { AccountBalanceCards } from '@/components/dashboard/AccountBalanceCards';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/contexts/ToastContext';
import { Currency } from '@/components/ui/currency';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { CategorySuggestion } from '@/hooks/useSuggestions';
import { useAddressBook } from '@/hooks/useAddressBook';
import { useSharedIbans } from '@/hooks/useSharedIbans';

import type {
  Transaction,
  Account,
  Category,
  AddressBookEntry,
} from '@fluxby/shared';

import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { TransactionModals } from '@/components/transactions/TransactionModals';
import {
  VirtualizedTransactionList,
  useVirtualizedTransactionData,
} from '@/components/transactions/VirtualizedTransactionList';

type TransactionTypeFilter = 'all' | 'income' | 'expense' | 'transfer';
import { useFilterParams, useFilters } from '@/contexts/FilterContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';

export default function Transactions() {
  const { t, language } = useLanguage();
  const { activeProfileId } = useProfile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  useDocumentTitle(t.nav.transactions);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const {
    filters,
    setCategories,
    setOpposingAccountIbans,
    setOpposingAccountName,
    setAddressBookId,
    setDateRange,
    setTransactionType: setContextTransactionType,
    clearOpposingAccountFilters: _clearOpposingAccountFilters,
  } = useFilters();

  // Initialize search from URL params (e.g., from Spotlight navigation)
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearch(searchParam);
      setDebouncedSearch(searchParam);
      // Clear the search param from URL after applying
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('search');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Debounce search input to avoid excessive re-renders/queries
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Sync transactionType state with context so navigation from Analytics works
  const [transactionType, setTransactionType] = useState<TransactionTypeFilter>(
    filters.transactionType || 'all'
  );
  const [debouncedType, setDebouncedType] = useState<TransactionTypeFilter>(
    filters.transactionType || 'all'
  );
  const [accountScrollIndex, setAccountScrollIndex] = useState(0);

  // Handle clearFilters query param from AddressBook navigation
  // Sets date range to show all transactions (10 years back)
  useEffect(() => {
    if (searchParams.get('clearFilters') === 'true') {
      // Clear the query param without triggering navigation
      setSearchParams({}, { replace: true });
      // Set date range to last 10 years to show all transactions
      const end = new Date();
      const start = new Date();
      start.setFullYear(start.getFullYear() - 10);
      setDateRange(start, end);
      // Reset transaction type to all
      setTransactionType('all');
      setDebouncedType('all');
      setContextTransactionType('all');
      setSelectedPaymentMethods([]);
      setSelectedPaymentProcessors([]);
      // Categories are already cleared in AddressBook before navigation
    }
  }, [searchParams, setSearchParams, setDateRange, setContextTransactionType]);

  // Get category filter from global context if set, otherwise empty
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    filters.categories || []
  );

  // Address book filter - synced with context
  const [selectedIbans, setSelectedIbans] = useState<string[]>(
    filters.opposingAccountIbans || []
  );
  const [selectedAccountName, setSelectedAccountName] = useState<string | null>(
    filters.opposingAccountName || null
  );
  const [selectedAddressBookId, setSelectedAddressBookId] = useState<
    string | null
  >(filters.addressBookId || null);
  // AddressBookFilter component manages its own open state internally

  // Global date range comes from the header (shared across all views)
  const { startDate, endDate } = useFilterParams();
  // Badge popover states are now managed internally by TransactionRowBadges component
  // CategoryFilter, AddressBookFilter manage their own open state internally
  const [_categoryFilterOpen, _setCategoryFilterOpen] = useState(false);
  // TypeFilter, PaymentMethodFilter, PaymentProcessorFilter, AddressBookFilter manage their own open state internally
  const [_typeFilterOpen, _setTypeFilterOpen] = useState(false);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<
    string[]
  >([]);
  const [selectedPaymentProcessors, setSelectedPaymentProcessors] = useState<
    string[]
  >([]);

  // Search state for filter dropdowns with debouncing for performance
  // CategoryFilter and AddressBookFilter manage their own search state internally
  const [_categorySearch, _setCategorySearch] = useState('');
  const [_debouncedCategorySearch, _setDebouncedCategorySearch] = useState('');
  // Track if address book filter has been opened (for lazy loading)
  const [addressBookFilterOpened, setAddressBookFilterOpened] = useState(false);

  // Account creation modal state - used in addToAddressBookMutation callbacks
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountModalIban, setAccountModalIban] = useState('');
  const [accountModalName, setAccountModalName] = useState('');
  // Ensure lint doesn't flag these as unused (they're used for tracking modal state)
  void accountModalOpen;
  void accountModalIban;
  void accountModalName;

  // Create contact modal with transaction context
  const [createContactModalOpen, setCreateContactModalOpen] = useState(false);
  const [createContactTransaction, setCreateContactTransaction] =
    useState<Transaction | null>(null);
  const [createContactName, setCreateContactName] = useState('');

  // Shared IBAN modal state (for payment processors with multiple merchants)
  const [sharedIbanModalOpen, setSharedIbanModalOpen] = useState(false);
  const [selectedSharedIban, setSelectedSharedIban] = useState<{
    iban: string;
    merchants: Array<{ name: string; transactionCount: number }>;
  } | null>(null);
  // Group-based state for merge/split functionality (matching AddressBook modal)
  const [sharedIbanGroups, setSharedIbanGroups] = useState<
    Array<{
      id: number;
      entries: Array<{ name: string; transactionCount: number }>;
      editedName: string;
      isSplit: boolean;
    }>
  >([]);
  // Split input values for controlled inputs
  const [splitInputValues, setSplitInputValues] = useState<
    Record<string, string>
  >({});
  // State for assign-to-existing contact popover
  const [assignPopoverOpen, setAssignPopoverOpen] = useState<string | null>(
    null
  );
  const [assignSearchTerm, setAssignSearchTerm] = useState('');

  // Toast: use shared ToastContext

  // Rule creation modal state
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [rulePattern, setRulePattern] = useState('');
  const [pendingRuleTransaction, setPendingRuleTransaction] = useState<{
    tx: Transaction;
    categoryId: string;
  } | null>(null);
  const [relatedTransactions, setRelatedTransactions] = useState<Transaction[]>(
    []
  );
  const [selectedRelatedIds, setSelectedRelatedIds] = useState<Set<string>>(
    new Set()
  );

  // Transfer type change modal state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [pendingTransferTransaction, setPendingTransferTransaction] =
    useState<Transaction | null>(null);
  const [transferRelatedTransactions, setTransferRelatedTransactions] =
    useState<Transaction[]>([]);
  const [selectedTransferRelatedIds, setSelectedTransferRelatedIds] = useState<
    Set<string>
  >(new Set());
  const [isMarkingAsTransfer] = useState(true);

  // Lazy loading state
  const [visibleCount, setVisibleCount] = useState(50);
  const loadMoreRef = useRef<HTMLButtonElement>(null);
  // Sentinel element to observe for automatic loading when scrolling
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  // Scroll position preservation for query invalidation
  const savedScrollPosition = useRef<number | null>(null);

  // Helper function to save scroll position before invalidation
  const saveScrollPosition = useCallback(() => {
    savedScrollPosition.current = window.scrollY;
  }, []);

  // Helper function to restore scroll position after refetch
  const restoreScrollPosition = useCallback(() => {
    if (savedScrollPosition.current !== null) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        window.scrollTo(0, savedScrollPosition.current || 0);
        savedScrollPosition.current = null;
      });
    }
  }, []);

  const hasActiveFilters =
    search !== '' ||
    transactionType !== 'all' ||
    selectedCategoryIds.length > 0 ||
    selectedIbans.length > 0 ||
    selectedAccountName !== null ||
    selectedAddressBookId !== null ||
    selectedPaymentMethods.length > 0 ||
    selectedPaymentProcessors.length > 0;

  const queryClient = useQueryClient();

  const toast = useToast();

  const typeParam = debouncedType === 'all' ? undefined : debouncedType;
  const categoryIdsParam =
    selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined;
  const ibansParam = selectedIbans.length > 0 ? selectedIbans : undefined;
  // When filtering by addressBookId, don't also filter by name - the addressBookId filter is sufficient
  // selectedAccountName is only used for display purposes in the filter button
  const nameParam =
    selectedAddressBookId === null
      ? selectedAccountName || undefined
      : undefined;
  const addressBookIdParam = selectedAddressBookId || undefined;
  const paymentMethodsParam =
    selectedPaymentMethods.length > 0 ? selectedPaymentMethods : undefined;
  const paymentProvidersParam =
    selectedPaymentProcessors.length > 0
      ? selectedPaymentProcessors
      : undefined;

  // Sync transaction type to debounced value
  useEffect(() => {
    setDebouncedType(transactionType);
  }, [transactionType]);

  // Sync transactionType state with context (for navigation from Analytics)
  // We use a ref to track the previous value and avoid unnecessary updates
  useEffect(() => {
    const contextType = filters.transactionType || 'all';
    setTransactionType(contextType);
    setDebouncedType(contextType);
    // Only depend on context changes, not local state
  }, [filters.transactionType]);

  const {
    data: transactions,
    isLoading,
    isFetching,
  } = useQuery<Transaction[]>({
    queryKey: [
      'transactions',
      activeProfileId,
      {
        search: debouncedSearch,
        type: typeParam,
        startDate,
        endDate,
        categoryIds: categoryIdsParam,
        opposingAccountIbans: ibansParam,
        opposingAccountName: nameParam,
        addressBookId: addressBookIdParam,
        paymentMethods: paymentMethodsParam,
        paymentProviders: paymentProvidersParam,
      },
    ],
    queryFn: () =>
      api.getTransactions({
        search: debouncedSearch,
        type: typeParam || '',
        startDate,
        endDate,
        ...(categoryIdsParam
          ? { categoryIds: categoryIdsParam.join(',') }
          : {}),
        opposingAccountIbans: ibansParam?.join(',') || '',
        opposingAccountName: nameParam || '',
        addressBookId: addressBookIdParam?.toString() || '',
        paymentMethods: paymentMethodsParam?.join(',') || '',
        paymentProviders: paymentProvidersParam?.join(',') || '',
      }) as Promise<Transaction[]>,
    staleTime: 30 * 1000, // 30 seconds - prevent constant refetching on focus
  });

  // Also fetch matching transactions across ALL data (no date range) so we can
  // show a specialized empty state when the current period has no matches but
  // the full dataset does.
  const { data: transactionsAllData } = useQuery<Transaction[]>({
    queryKey: [
      'transactions-all',
      activeProfileId,
      {
        search: debouncedSearch,
        type: typeParam,
        categoryIds: categoryIdsParam,
        opposingAccountIbans: ibansParam,
        opposingAccountName: nameParam,
        addressBookId: addressBookIdParam,
        paymentMethods: paymentMethodsParam,
        paymentProviders: paymentProvidersParam,
      },
    ],
    queryFn: () =>
      api.getTransactions({
        search: debouncedSearch,
        type: typeParam || '',
        ...(categoryIdsParam
          ? { categoryIds: categoryIdsParam.join(',') }
          : {}),
        opposingAccountIbans: ibansParam?.join(',') || '',
        opposingAccountName: nameParam || '',
        addressBookId: addressBookIdParam?.toString() || '',
        paymentMethods: paymentMethodsParam?.join(',') || '',
        paymentProviders: paymentProvidersParam?.join(',') || '',
      }) as Promise<Transaction[]>,
    // Only run when filters are active and the current period returned zero
    // transactions to avoid extra work during normal browsing.
    enabled: hasActiveFilters && (transactions?.length ?? 0) === 0,
    staleTime: 30 * 1000,
  });

  // React 19: Use deferred value with initial empty array for smoother first render
  // This allows the search input to remain responsive while the list updates
  const deferredTransactions = useDeferredValue(transactions, []);
  const isStale =
    transactions !== undefined && deferredTransactions !== transactions;

  // Track filter changes with transition to keep UI responsive
  const [isPending, startTransition] = useTransition();

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories', activeProfileId, false],
    queryFn: () => api.getCategories() as Promise<Category[]>,
    staleTime: 5 * 60 * 1000, // 5 minutes - categories rarely change
  });

  // Memoized category lookup Map for O(1) access instead of O(n) find()
  const categoryLookup = useMemo(() => {
    if (!categories) return new Map<string, Category>();
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  // Query address book for the filter - lazy loaded when filter is first opened
  // Also needed when a transaction has an addressBookId or for findAddressBookEntry lookups
  const needsAddressBook =
    addressBookFilterOpened ||
    selectedAddressBookId !== null ||
    (transactions?.some((tx) => tx.addressBookId !== null) ?? false);

  const {
    addressBook,
    isLoading: addressBookLoading,
    createContactMutation: createContactMutationHook,
  } = useAddressBook({
    enabled: needsAddressBook,
  });

  const {
    sharedIbans: _sharedIbans,
    isLoading: _sharedIbansLoading,
    resolveSharedMutation: resolveSharedMutationHook,
    addIbanToContactMutation: addIbanToContactHook,
  } = useSharedIbans();

  // Memoized addressBook lookup maps for O(1) access instead of O(n) filtering
  const addressBookLookup = useMemo((): {
    byId: Map<string, AddressBookEntry>;
    byIban: Map<string, AddressBookEntry[]>;
  } => {
    if (!addressBook)
      return {
        byId: new Map<string, AddressBookEntry>(),
        byIban: new Map<string, AddressBookEntry[]>(),
      };

    const byId = new Map<string, AddressBookEntry>();
    const byIban = new Map<string, AddressBookEntry[]>();

    for (const entry of addressBook) {
      byId.set(entry.id, entry);

      // Index by primary IBAN
      if (entry.iban) {
        const existing = byIban.get(entry.iban) || [];
        existing.push(entry);
        byIban.set(entry.iban, existing);
      }

      // Also index by secondary IBANs
      if (entry.ibans) {
        for (const iban of entry.ibans) {
          const existing = byIban.get(iban) || [];
          if (!existing.includes(entry)) {
            existing.push(entry);
            byIban.set(iban, existing);
          }
        }
      }
    }

    return { byId, byIban };
  }, [addressBook]);

  // Query shared IBANs (payment processors)

  // Memoized sharedIbans lookup map for O(1) access

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ['accounts', activeProfileId],
    queryFn: () => api.getAccounts() as Promise<Account[]>,
    staleTime: 5 * 60 * 1000, // 5 minutes - accounts rarely change
  });

  // Query category rules for checking if a rule already exists
  interface CategoryRule {
    id: string;
    pattern: string;
    categoryId: string;
    priority: number;
  }
  const { data: categoryRules = [] } = useQuery<CategoryRule[]>({
    queryKey: ['categoryRules', activeProfileId],
    queryFn: () => api.getCategoryRules() as Promise<CategoryRule[]>,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query payment provider rules for the filter dropdown
  const { data: paymentProviderRules = [] } = useQuery<
    Array<{ id: string; name: string; patterns: string }>
  >({
    queryKey: ['paymentProviderRules', activeProfileId],
    queryFn: () =>
      api.getPaymentProviderRules() as Promise<
        Array<{ id: string; name: string; patterns: string }>
      >,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get min/max dates to determine if there's data in other periods
  const { data: minMaxDates } = useQuery<{
    minDate: string;
    maxDate: string;
  } | null>({
    queryKey: ['min-max-dates', activeProfileId],
    queryFn: () =>
      api.getMinMaxDates() as Promise<{
        minDate: string;
        maxDate: string;
      } | null>,
    enabled: !!activeProfileId,
  });

  // Get count of transactions outside current date range
  const { data: outsideRangeCount } = useQuery({
    queryKey: [
      'transactions-outside-range',
      activeProfileId,
      startDate,
      endDate,
      debouncedSearch,
      typeParam,
      categoryIdsParam,
      ibansParam,
      nameParam,
      addressBookIdParam,
      paymentMethodsParam,
      paymentProvidersParam,
    ],
    queryFn: () =>
      api.getTransactionsCountOutsideRange(startDate || '', endDate || '', {
        search: debouncedSearch,
        type: typeParam || '',
        categoryIds: categoryIdsParam?.join(',') || '',
        opposingAccountIbans: ibansParam?.join(',') || '',
        opposingAccountName: nameParam || '',
        addressBookId: addressBookIdParam?.toString() || '',
        paymentMethods: paymentMethodsParam?.join(',') || '',
        paymentProviders: paymentProvidersParam?.join(',') || '',
      }) as Promise<{ before: number; after: number; total: number }>,
    enabled: !!activeProfileId && !!startDate && !!endDate,
  });

  // Determine suggested period based on available data (for empty state)
  const getSuggestedPeriod = (): {
    start: Date;
    end: Date;
    label: string;
  } | null => {
    if (!minMaxDates) return null;

    const maxDate = new Date(minMaxDates.maxDate);
    const locale = language === 'nl' ? nl : enUS;

    // Suggest the month containing the most recent transaction
    const suggestedStart = new Date(
      maxDate.getFullYear(),
      maxDate.getMonth(),
      1
    );
    const suggestedEnd = new Date(
      maxDate.getFullYear(),
      maxDate.getMonth() + 1,
      0
    );
    const monthLabel = format(suggestedStart, 'MMMM yyyy', { locale });

    return {
      start: suggestedStart,
      end: suggestedEnd,
      label: monthLabel,
    };
  };

  const suggestedPeriod = getSuggestedPeriod();

  // Check if we're already viewing the suggested period
  const isViewingSuggestedPeriod = useMemo(() => {
    if (!suggestedPeriod || !startDate || !endDate) return false;

    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);

    return (
      currentStart.getFullYear() === suggestedPeriod.start.getFullYear() &&
      currentStart.getMonth() === suggestedPeriod.start.getMonth() &&
      currentStart.getDate() === suggestedPeriod.start.getDate() &&
      currentEnd.getFullYear() === suggestedPeriod.end.getFullYear() &&
      currentEnd.getMonth() === suggestedPeriod.end.getMonth() &&
      currentEnd.getDate() === suggestedPeriod.end.getDate()
    );
  }, [suggestedPeriod, startDate, endDate]);

  // Handler for jumping to period with data
  const handleJumpToPeriod = () => {
    if (suggestedPeriod) {
      setDateRange(suggestedPeriod.start, suggestedPeriod.end);
    }
  };

  // Optimized category grouping: O(n) single pass instead of O(n²)
  const groupedCategories = useMemo(() => {
    if (!categories) return [];

    // Single pass: separate parents and build children map simultaneously
    const parents: Category[] = [];
    const childrenByParent = new Map<string, Category[]>();

    for (const c of categories) {
      if (c.parentId) {
        const existing = childrenByParent.get(c.parentId);
        if (existing) {
          existing.push(c);
        } else {
          childrenByParent.set(c.parentId, [c]);
        }
      } else {
        parents.push(c);
      }
    }

    // Build sorted list: parent followed by its children
    const result: Array<Category & { isChild?: boolean }> = [];
    for (const parent of parents) {
      result.push(parent);
      const children = childrenByParent.get(parent.id);
      if (children) {
        for (const child of children) {
          result.push({ ...child, isChild: true });
        }
      }
    }

    return result;
  }, [categories]);

  // Memoized filtered categories for search (debounced)
  // Now handled internally by CategoryFilter component
  const _filteredGroupedCategories = useMemo(() => {
    if (!_debouncedCategorySearch) return groupedCategories;
    const searchLower = _debouncedCategorySearch.toLowerCase();
    return groupedCategories.filter((category) =>
      category.name.toLowerCase().includes(searchLower)
    );
  }, [groupedCategories, _debouncedCategorySearch]);

  // Find the "Overboekingen" / "Internal transfers" category for auto-assignment
  const transferCategoryId = useMemo(() => {
    if (!categories) return null;
    const transferCat = categories.find(
      (c) =>
        c.parentId !== null &&
        (c.name.toLowerCase() === 'overboekingen' ||
          c.name.toLowerCase() === 'internal transfers')
    );
    return transferCat?.id || null;
  }, [categories]);

  // Helper to get child category IDs for a parent (uses categoryLookup for parent check, categories for children)
  const getChildCategoryIds = (parentId: string): string[] => {
    if (!categories) return [];
    return categories.filter((c) => c.parentId === parentId).map((c) => c.id);
  };

  // Toggle category with subcategory auto-selection
  // Now handled internally by CategoryFilter component
  const _toggleCategoryWithChildren = (categoryId: string) => {
    const category = categoryLookup.get(categoryId);
    if (!category) return;

    const isParent = !category.parentId;

    if (isParent) {
      // Parent category toggle
      const childIds = getChildCategoryIds(categoryId);

      if (selectedCategoryIds.includes(categoryId)) {
        // Deselect parent: remove parent and all its children
        const idsToRemove = new Set([categoryId, ...childIds]);
        setCategories(selectedCategoryIds.filter((id) => !idsToRemove.has(id)));
      } else {
        // Select parent: add parent and all its children
        const newIds = new Set([
          ...selectedCategoryIds,
          categoryId,
          ...childIds,
        ]);
        setCategories(Array.from(newIds));
      }
    } else {
      // Subcategory toggle
      const parentId = category.parentId;
      if (!parentId) return;
      const siblingIds = getChildCategoryIds(parentId);

      if (selectedCategoryIds.includes(categoryId)) {
        // Deselect subcategory: also deselect parent (keep other siblings selected)
        const newIds = selectedCategoryIds.filter(
          (id) => id !== categoryId && id !== parentId
        );
        setCategories(newIds);
      } else {
        // Select subcategory: add this child, and if all siblings are now selected, also select parent
        const newSelectedIds = new Set([...selectedCategoryIds, categoryId]);

        // Check if all siblings are now selected
        const allSiblingsSelected = siblingIds.every((id) =>
          newSelectedIds.has(id)
        );
        if (allSiblingsSelected) {
          newSelectedIds.add(parentId);
        }

        setCategories(Array.from(newSelectedIds));
      }
    }
  };

  // Fetch suggestions for uncategorized transactions
  useEffect(() => {
    // Reset visible count when date range changes
    setVisibleCount(50);
  }, [startDate, endDate]);

  // Sync category filter from context
  useEffect(() => {
    const newCategories = filters.categories || [];
    setSelectedCategoryIds(newCategories);
    // Only depend on context changes, not local state
  }, [filters.categories]);

  // Sync opposing account ibans filter from context
  useEffect(() => {
    const newIbans = filters.opposingAccountIbans || [];
    setSelectedIbans(newIbans);
    // Only depend on context changes, not local state
  }, [filters.opposingAccountIbans]);

  // Sync opposing account name filter from context
  useEffect(() => {
    const newName = filters.opposingAccountName || null;
    setSelectedAccountName(newName);
    // Only depend on context changes, not local state
  }, [filters.opposingAccountName]);

  // Sync address book ID filter from context
  // Also look up the name from addressBook when ID is set (e.g., on page refresh)
  useEffect(() => {
    const newId = filters.addressBookId || null;
    setSelectedAddressBookId(newId);

    // Look up the name from addressBook when we have an ID but no name
    if (newId && addressBook) {
      const entry = addressBook.find((e) => e.id === newId);
      if (entry) {
        setSelectedAccountName(entry.name);
      }
    } else if (!newId) {
      setSelectedAccountName(null);
    }
  }, [filters.addressBookId, addressBook]);

  // Note: Removed the cleanup effect that was clearing opposing account filters on unmount.
  // This was causing issues when navigating from AddressBook - the filters were being cleared
  // after they were set but before the component mounted.
  // Filters are now intentionally persisted to localStorage via FilterContext.

  // Ref to track if we're currently loading more (debounce intersection observer)
  const isLoadingMoreRef = useRef(false);

  // Intersection Observer for lazy loading on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only trigger if intersecting AND not already loading AND there's more to load
        if (entry.isIntersecting && !isLoadingMoreRef.current) {
          const hasMore = visibleCount < (deferredTransactions?.length || 0);
          if (hasMore) {
            isLoadingMoreRef.current = true;
            setVisibleCount((prev) => prev + 50);

            // Allow next trigger after current render cycle
            requestAnimationFrame(() => {
              isLoadingMoreRef.current = false;
            });
          }
        }
      },
      { threshold: 0.1, rootMargin: '200px 0px 800px 0px' }
    );

    const el = loadMoreSentinelRef.current || loadMoreRef.current;
    if (el) observer.observe(el as Element);

    return () => {
      if (el) observer.unobserve(el as Element);
      isLoadingMoreRef.current = false;
    };
  }, [deferredTransactions?.length, visibleCount]);

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        type?: 'income' | 'expense' | 'transfer';
        categoryId?: string | null;
        notes?: string;
        merchantName?: string | null;
        paymentMethod?: string | null;
        addressBookId?: string | null;
        paymentProvider?: string | null;
      };
    }) => api.updateTransaction(id, data),
    // Optimistic update for immediate UI feedback
    onMutate: async (variables) => {
      // Save scroll position before invalidation
      saveScrollPosition();

      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: ['transactions', activeProfileId],
      });

      // Snapshot current transactions
      const previousTransactions = queryClient.getQueryData<Transaction[]>([
        'transactions',
        activeProfileId,
      ]);

      // Optimistically update the cache
      if (previousTransactions) {
        queryClient.setQueryData<Transaction[]>(
          ['transactions', activeProfileId],
          previousTransactions.map((tx) =>
            tx.id === variables.id ? { ...tx, ...variables.data } : tx
          )
        );
      }

      return { previousTransactions };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousTransactions) {
        queryClient.setQueryData(
          ['transactions', activeProfileId],
          context.previousTransactions
        );
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', activeProfileId],
      });
      // If addressBookId was updated, also invalidate addressbook and sharedIbans
      if (variables.data.addressBookId !== undefined) {
        queryClient.invalidateQueries({
          queryKey: ['addressbook', activeProfileId],
        });
        queryClient.invalidateQueries({
          queryKey: ['sharedIbans', activeProfileId],
        });
      }
    },
    onSettled: () => {
      // Restore scroll position after mutation completes
      restoreScrollPosition();
    },
  });

  const detectInternalTransfersMutation = useMutation({
    mutationFn: () => api.detectInternalTransfers(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', activeProfileId],
      });
      setTransferModalOpen(false);
      setPendingTransferTransaction(null);
      setTransferRelatedTransactions([]);
      setSelectedTransferRelatedIds(new Set());
      toast.success(
        (
          t.transactions?.internalTransfersDetected ||
          '{count} transacties gemarkeerd als interne overboeking'
        ).replace('{count}', String(result.markedAsTransfer))
      );
    },
  });

  const _categorizeByCounterpartyMutation = useMutation({
    mutationFn: ({
      transactionId,
      categoryId,
    }: {
      transactionId: string;
      categoryId: string;
    }) => api.categorizeByCounterparty(transactionId, categoryId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', activeProfileId],
      });
      if (result.updated > 0) {
        toast.success(
          t.transactions.updatedCount.replace(
            '{count}',
            result.updated.toString()
          )
        );
      }
    },
  });

  const addToAddressBookMutation = {
    ...createContactMutationHook,
    mutate: (
      data: { iban: string; name: string; transactionId?: string },
      options?: {
        onSuccess?: (res: unknown, vars: unknown, ctx: unknown) => void;
      }
    ) =>
      createContactMutationHook.mutate(data, {
        ...options,
        onSuccess: (res: unknown, vars: unknown, ctx: unknown) => {
          setAccountModalOpen(false);
          setAccountModalIban('');
          setAccountModalName('');
          toast.success(t.transactions.savedToAddressBook);
          options?.onSuccess?.(res, vars, ctx);
        },
      }),
  };

  const resolveSharedMutation = {
    ...resolveSharedMutationHook,
    mutate: (
      data: {
        iban: string;
        name: string;
        originalNames: string[];
        contactId?: string;
      },
      options?: {
        onSuccess?: (res: unknown, vars: unknown, ctx: unknown) => void;
      }
    ) =>
      resolveSharedMutationHook.mutate(data, {
        ...options,
        onSuccess: (res: unknown, vars: unknown, ctx: unknown) => {
          options?.onSuccess?.(res, vars, ctx);
        },
      }),
  };

  const addIbanToContactMutation = {
    ...addIbanToContactHook,
    mutate: (
      data: { contactId: string; iban: string },
      options?: {
        onSuccess?: (res: unknown, vars: unknown, ctx: unknown) => void;
      }
    ) =>
      addIbanToContactHook.mutate(data, {
        ...options,
        onSuccess: (res: unknown, vars: unknown, ctx: unknown) => {
          setAssignPopoverOpen(null);
          setAssignSearchTerm('');
          options?.onSuccess?.(res, vars, ctx);
        },
      }),
  };

  // Find address book entry for a transaction
  // Priority: 1) Direct link via addressBookId, 2) IBAN match (including ibans array)
  // Uses memoized lookup maps for O(1) access instead of O(n) filtering
  const findAddressBookEntry = useCallback(
    (tx: Transaction) => {
      if (!addressBook) return null;

      // First check if transaction has a direct link to address book (O(1) lookup)
      if (tx.addressBookId) {
        const byId = addressBookLookup.byId.get(tx.addressBookId);
        if (byId) return byId;
      }

      if (!tx.opposingAccountIban) return null;

      // Get all address book entries with this IBAN using memoized map (O(1) lookup)
      const txIban = tx.opposingAccountIban;
      const entriesWithIban = addressBookLookup.byIban.get(txIban) || [];

      if (entriesWithIban.length === 0) return null;

      // Check if any entries have originalName (meaning they're for shared IBANs)
      const hasSharedIbanEntries = entriesWithIban.some(
        (e) => e.originalName || e.originalNames?.length
      );

      // If there are shared IBAN entries, use IBAN + name matching
      if (hasSharedIbanEntries) {
        const txName = tx.opposingAccountName || tx.merchantName;
        if (txName) {
          const lowerTxName = txName.toLowerCase().trim();
          const byName = entriesWithIban.find((entry) => {
            // Match against original name (exact match preferred)
            if (entry.originalName) {
              const lowerOrig = entry.originalName.toLowerCase().trim();
              if (lowerTxName === lowerOrig) return true;
              // Also try partial matching
              if (
                lowerTxName.includes(lowerOrig) ||
                lowerOrig.includes(lowerTxName)
              ) {
                return true;
              }
            }

            // Match against display name (bidirectional)
            if (
              lowerTxName.includes(entry.name.toLowerCase()) ||
              entry.name.toLowerCase().includes(lowerTxName)
            ) {
              return true;
            }

            // Also match against originalNames array (legacy support)
            if (entry.originalNames) {
              for (const origName of entry.originalNames) {
                const lowerOrig = origName.toLowerCase();
                if (
                  lowerTxName.includes(lowerOrig) ||
                  lowerOrig.includes(lowerTxName)
                ) {
                  return true;
                }
              }
            }

            return false;
          });

          if (byName) return byName;
        }
        return null;
      }

      // For non-shared IBANs, just return the first match
      return entriesWithIban[0];
    },
    [addressBook, addressBookLookup]
  );

  const createRuleMutation = useMutation({
    mutationFn: async ({
      pattern,
      categoryId,
      currentTransactionId,
    }: {
      pattern: string;
      categoryId: string;
      currentTransactionId?: string;
    }) => {
      // 1. Create the rule
      const response = (await api.createCategoryRule({
        pattern,
        categoryId,
        priority: 10,
      })) as { id: string };

      // 2. Apply the rule to ALL transactions (including this one and others)
      const applyResult = (await api.applyCategoryRule(response.id)) as {
        updated: number;
      };

      // 3. Explicitly update the current transaction to ensure it is categorized
      // (in case the rule pattern doesn't match the current transaction text exactly)
      if (currentTransactionId) {
        await api.updateTransaction(currentTransactionId, { categoryId });
      }

      return { ruleId: response.id, updated: applyResult.updated };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setRuleModalOpen(false);
      setPendingRuleTransaction(null);
      if (result.updated > 0) {
        toast.success(
          t.transactions.updatedCount.replace(
            '{count}',
            result.updated.toString()
          )
        );
      }
    },
  });

  const handleCreateRule = () => {
    if (!pendingRuleTransaction || !rulePattern.trim()) return;
    createRuleMutation.mutate({
      pattern: rulePattern,
      categoryId: pendingRuleTransaction.categoryId,
      currentTransactionId: pendingRuleTransaction.tx.id,
    });
  };

  const handleSkipRule = async () => {
    if (pendingRuleTransaction) {
      // Always update the current transaction
      updateMutation.mutate({
        id: pendingRuleTransaction.tx.id,
        data: { categoryId: pendingRuleTransaction.categoryId },
      });

      // Update selected related transactions
      if (selectedRelatedIds.size > 0) {
        // Batch update selected related transactions
        for (const txId of selectedRelatedIds) {
          updateMutation.mutate({
            id: txId,
            data: { categoryId: pendingRuleTransaction.categoryId },
          });
        }
      }
    }
    setRuleModalOpen(false);
    setPendingRuleTransaction(null);
    setRelatedTransactions([]);
    setSelectedRelatedIds(new Set());
  };

  // Apply transfer toggle to selected transactions
  const handleApplyTransferToRelated = () => {
    if (!pendingTransferTransaction) return;

    const newType = isMarkingAsTransfer
      ? 'transfer'
      : pendingTransferTransaction.amount > 0
        ? 'income'
        : 'expense';

    // Build update data with optional category assignment
    const mainUpdateData: {
      type: 'income' | 'expense' | 'transfer';
      categoryId?: string;
    } = { type: newType };
    if (isMarkingAsTransfer && transferCategoryId) {
      mainUpdateData.categoryId = transferCategoryId;
    }

    // Update the main transaction
    updateMutation.mutate({
      id: pendingTransferTransaction.id,
      data: mainUpdateData,
    });

    // Update selected related transactions
    for (const txId of selectedTransferRelatedIds) {
      const relTx = transferRelatedTransactions.find((t) => t.id === txId);
      const relNewType = isMarkingAsTransfer
        ? 'transfer'
        : relTx && relTx.amount > 0
          ? 'income'
          : 'expense';
      const relUpdateData: {
        type: 'income' | 'expense' | 'transfer';
        categoryId?: string;
      } = { type: relNewType };
      if (isMarkingAsTransfer && transferCategoryId) {
        relUpdateData.categoryId = transferCategoryId;
      }
      updateMutation.mutate({
        id: txId,
        data: relUpdateData,
      });
    }

    const totalUpdated = 1 + selectedTransferRelatedIds.size;
    toast.success(
      isMarkingAsTransfer
        ? (
            t.transactions?.markedMultipleAsTransfer ||
            '{count} transactions marked as transfer'
          ).replace('{count}', String(totalUpdated))
        : (
            t.transactions?.removedMultipleTransferMarks ||
            'Transfer mark removed from {count} transactions'
          ).replace('{count}', String(totalUpdated))
    );

    // Close modal and reset state
    setTransferModalOpen(false);
    setPendingTransferTransaction(null);
    setTransferRelatedTransactions([]);
    setSelectedTransferRelatedIds(new Set());
  };

  const getCategoryName = useCallback(
    (categoryId: string | null) => {
      if (!categoryId) return t.transactions.noCategory;
      const category = categoryLookup.get(categoryId);
      return category
        ? `${category.icon || ''} ${category.name}`.trim()
        : t.transactions.noCategory;
    },
    [categoryLookup, t.transactions.noCategory]
  );

  const getCategoryColor = useCallback(
    (categoryId: string | null) => {
      if (!categoryId) return '#9CA3AF';
      const category = categoryLookup.get(categoryId);
      return category?.color || '#9CA3AF';
    },
    [categoryLookup]
  );

  // Convert hex color to rgba with opacity for lighter backgrounds
  // (kept for potential future use in transaction badges)
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

  // Check if a rule pattern already exists (case-insensitive match)
  const findExistingRule = (pattern: string) => {
    if (!pattern.trim() || !categoryRules) return null;
    const normalizedPattern = pattern.trim().toLowerCase();
    return categoryRules.find(
      (rule) => rule.pattern.toLowerCase() === normalizedPattern
    );
  };

  // Handle address book selection for a transaction
  // This links the transaction to the address book entry

  // Payment method icon and label - returns data, icon rendered in JSX

  const _handleAcceptSuggestion = (
    tx: Transaction,
    suggestion: CategorySuggestion
  ) => {
    updateMutation.mutate({
      id: tx.id,
      data: { categoryId: suggestion.categoryId },
    });
  };

  const _handleAcceptAndCreateRule = (
    tx: Transaction,
    suggestion: CategorySuggestion
  ) => {
    updateMutation.mutate({
      id: tx.id,
      data: { categoryId: suggestion.categoryId },
    });

    if (tx.merchantName && suggestion.categoryId) {
      const pattern = tx.merchantName.split(' ')[0].toLowerCase();
      createRuleMutation.mutate({
        pattern,
        categoryId: suggestion.categoryId,
      });
    }
  };

  // Calculate totals using shared hook (same logic as Dashboard)
  const totals = useTransactionTotals(transactions);

  // Memoize recurring merchants computation - this is expensive for large transaction lists
  const recurringMerchants = useMemo(() => {
    if (!transactions) return new Map<string, Transaction[]>();
    const merchantMap = new Map<string, Transaction[]>();

    transactions.forEach((tx) => {
      const merchantName = tx.merchantName?.toLowerCase().trim() || '';
      const iban = tx.opposingAccountIban?.toLowerCase().trim() || '';
      // Use combination of IBAN and merchant name as key
      // This ensures transactions to the same name but different IBANs are not grouped
      const key = iban ? `${iban}|${merchantName}` : merchantName;
      if (key && merchantName) {
        const existing = merchantMap.get(key) || [];
        existing.push(tx);
        merchantMap.set(key, existing);
      }
    });

    // Only keep merchants with 2+ transactions (income or expense)
    const recurring = new Map<string, Transaction[]>();
    merchantMap.forEach((txs, key) => {
      if (txs.length >= 2) {
        recurring.set(
          key,
          txs.sort((a, b) => {
            if (b.date > a.date) return 1;
            if (b.date < a.date) return -1;
            return 0;
          })
        );
      }
    });
    return recurring;
  }, [transactions]);

  const isRecurring = useCallback(
    (tx: Transaction) => {
      const merchantName = tx.merchantName?.toLowerCase().trim() || '';
      const iban = tx.opposingAccountIban?.toLowerCase().trim() || '';
      const key = iban ? `${iban}|${merchantName}` : merchantName;
      return recurringMerchants.has(key);
    },
    [recurringMerchants]
  );

  // Prepare memoized data for virtualization at the top level to comply with rules of hooks
  const virtualizedData = useVirtualizedTransactionData(
    deferredTransactions,
    getCategoryName,
    getCategoryColor,
    findAddressBookEntry,
    isRecurring
  );

  return (
    <>
      {/* Toasts are handled via ToastContext */}
      <div className='space-y-0 sm:space-y-6'>
        <PageHeader
          title={t.transactions.title}
          subtitle={t.transactions.subtitle}
          dataOnboarding='transaction-greeting'
          actions={
            <AccountBalanceCards
              accounts={accounts || []}
              accountScrollIndex={accountScrollIndex}
              setAccountScrollIndex={setAccountScrollIndex}
            />
          }
        />

        {/* Summary Cards - Same as Dashboard */}
        <div
          className='-mx-3 grid grid-cols-2 gap-px bg-border sm:mx-0 sm:gap-4 sm:bg-transparent lg:grid-cols-4'
          data-onboarding='transaction-summary'
        >
          <div className='h-full'>
            <StatsCard
              title={t.dashboard.income}
              value={<Currency amount={totals.income} />}
              icon={ArrowUpRight}
              iconColor='text-emerald-900 dark:text-emerald-400'
            />
          </div>
          <div className='h-full'>
            <StatsCard
              title={t.dashboard.expenses}
              value={<Currency amount={totals.expenses} />}
              icon={ArrowDownRight}
              iconColor='text-rose-900 dark:text-rose-400'
            />
          </div>
          <div className='h-full'>
            <StatsCard
              title={t.dashboard.toSavings}
              value={<Currency amount={totals.netSavingsTransfer} />}
              icon={PiggyBank}
              iconColor='text-blue-900 dark:text-blue-400'
              trendLabel={
                <>
                  +<Currency amount={totals.transferToSavings} /> / -
                  <Currency amount={totals.transferFromSavings} />
                </>
              }
            />
          </div>
          <div className='h-full'>
            <StatsCard
              title={t.dashboard.netResult}
              value={<Currency amount={totals.balance} />}
              icon={Wallet}
              iconColor={
                totals.balance === 0
                  ? 'text-gray-400'
                  : totals.balance > 0
                    ? 'text-emerald-900 dark:text-emerald-400'
                    : 'text-rose-900 dark:text-rose-400'
              }
              valueColor={
                totals.balance === 0
                  ? 'text-gray-900 dark:text-gray-100'
                  : totals.balance > 0
                    ? 'text-emerald-900 dark:text-emerald-400'
                    : 'text-rose-900 dark:text-rose-400'
              }
            />
          </div>
        </div>

        {/* Filters */}
        <TransactionFilters
          search={search}
          setSearch={setSearch}
          transactionType={transactionType}
          setTransactionType={setTransactionType}
          categories={categories}
          selectedCategoryIds={selectedCategoryIds}
          onCategoriesChange={setCategories}
          addressBook={addressBook}
          addressBookLoading={addressBookLoading}
          selectedIbans={selectedIbans}
          onIbansChange={(ibans) => {
            setSelectedIbans(ibans);
            setOpposingAccountIbans(ibans);
          }}
          selectedAddressBookId={selectedAddressBookId}
          onAddressBookIdChange={(id) => {
            setSelectedAddressBookId(id);
            setAddressBookId(id);
          }}
          selectedAccountName={selectedAccountName}
          onAccountNameChange={(name) => {
            setSelectedAccountName(name);
            setOpposingAccountName(null);
          }}
          addressBookFilterOpened={addressBookFilterOpened}
          onAddressBookFilterOpen={() => {
            if (!addressBookFilterOpened) {
              setAddressBookFilterOpened(true);
            }
          }}
          selectedPaymentMethods={selectedPaymentMethods}
          onPaymentMethodsChange={setSelectedPaymentMethods}
          paymentProviderRules={paymentProviderRules}
          selectedPaymentProcessors={selectedPaymentProcessors}
          onPaymentProcessorsChange={setSelectedPaymentProcessors}
          translations={t}
          startTransition={startTransition}
        />

        {/* Transactions List */}
        <div className='-mx-3 sm:mx-0'>
          <Card
            className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
            data-onboarding='transaction-list'
          >
            <CardHeader className='flex flex-row items-center justify-between gap-4 space-y-0 px-3 py-3 sm:px-6 sm:py-4'>
              <div className='min-w-0 flex-1'>
                <CardTitle className='flex items-center gap-2 text-base sm:text-lg'>
                  {t.transactions.allTransactions}
                  {(isStale || isPending) && (
                    <span className='h-2 w-2 animate-pulse rounded-full bg-primary' />
                  )}
                </CardTitle>
                <CardDescription>
                  {deferredTransactions?.length || 0}{' '}
                  {t.transactions.transactionsFound}
                </CardDescription>
              </div>
              <div className='flex flex-shrink-0 items-center gap-2'>
                {/* Active filters summary */}
                <div className='flex flex-wrap items-center gap-2'>
                  {transactionType !== 'all' && (
                    <span className='rounded bg-muted px-2 py-1 text-xs'>
                      {transactionType === 'income'
                        ? t.transactions.income
                        : transactionType === 'expense'
                          ? t.transactions.expense
                          : t.transactions.transfer}
                    </span>
                  )}
                  {selectedCategoryIds.length > 0 && (
                    <span className='rounded bg-muted px-2 py-1 text-xs'>
                      {categories
                        ?.filter((c) => selectedCategoryIds.includes(c.id))
                        .slice(0, 2)
                        .map((c) => c.name)
                        .join(', ')}
                      {selectedCategoryIds.length > 2 &&
                        ` +${selectedCategoryIds.length - 2}`}
                    </span>
                  )}
                  {selectedAccountName && (
                    <span className='rounded bg-muted px-2 py-1 text-xs'>
                      {selectedAccountName}
                    </span>
                  )}
                  {!selectedAccountName && selectedIbans.length > 0 && (
                    <span className='rounded bg-muted px-2 py-1 text-xs'>
                      {selectedIbans.length}{' '}
                      {selectedIbans.length === 1
                        ? t.transactions.contacts
                        : t.transactions.contactsPlural}
                    </span>
                  )}
                  {selectedPaymentMethods.length > 0 && (
                    <span className='rounded bg-muted px-2 py-1 text-xs'>
                      {selectedPaymentMethods
                        .slice(0, 2)
                        .map((m) => {
                          if (m === 'pin')
                            return t.transactions.paymentMethods.pin;
                          if (m === 'ideal')
                            return t.transactions.paymentMethods.ideal;
                          if (m === 'transfer')
                            return t.transactions.paymentMethods.transfer;
                          if (m === 'incasso')
                            return t.transactions.paymentMethods.incasso;
                          if (m === 'geldautomaat')
                            return t.transactions.paymentMethods.atm;
                          return m;
                        })
                        .join(', ')}
                      {selectedPaymentMethods.length > 2 &&
                        ` +${selectedPaymentMethods.length - 2}`}
                    </span>
                  )}
                  {selectedPaymentProcessors.length > 0 && (
                    <span className='rounded bg-muted px-2 py-1 text-xs'>
                      {selectedPaymentProcessors.slice(0, 2).join(', ')}
                      {selectedPaymentProcessors.length > 2 &&
                        ` +${selectedPaymentProcessors.length - 2}`}
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className='px-0 pt-0 pb-3 sm:px-6 sm:pt-0 sm:pb-6'>
              {/* Show skeleton during:
                1. Initial load (isLoading)
                2. Any time data is being fetched (isFetching)
                3. When deferred value is stale (isStale) - matches purple dot indicator
                4. When a transition is pending (isPending) - matches purple dot indicator
                This ensures we never show "no transactions found" while data is loading,
                preventing the flash of empty state when filters change */}
              {isLoading || isFetching || isStale || isPending ? (
                <div className='space-y-4'>
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className='h-16' />
                  ))}
                </div>
              ) : (deferredTransactions?.length || 0) > 0 ? (
                <>
                  <div
                    className={cn(
                      'transition-opacity duration-150',
                      isStale && 'opacity-70'
                    )}
                  >
                    <div className='divide-y'>
                      {(() => {
                        // Use virtualization for large lists, regular list for small ones
                        // This provides the best of both worlds: extreme performance for large data,
                        // and simple, direct rendering for small results (which preserves
                        // expanded states better than virtualization).

                        return (
                          <VirtualizedTransactionList
                            transactions={virtualizedData}
                            onTransactionClick={(tx, recurring) => {
                              // Recurring transaction click handler (placeholder)
                              void tx;
                              void recurring;
                            }}
                            isStale={isStale}
                            useWindowScroll={true}
                          />
                        );
                      })()}
                    </div>
                  </div>

                  {visibleCount < (deferredTransactions?.length || 0) && (
                    <div className='mt-6 flex flex-col items-center gap-2'>
                      {/* Sentinel observed by IntersectionObserver for auto-loading */}
                      <div ref={loadMoreSentinelRef} className='h-4 w-full' />
                      <Button
                        ref={loadMoreRef}
                        variant='outline'
                        onClick={() => setVisibleCount((prev) => prev + 50)}
                      >
                        {t.transactions.loadMore}
                      </Button>
                    </div>
                  )}

                  {/* Show card if there are transactions outside the current date range */}
                  {outsideRangeCount &&
                    outsideRangeCount.total > 0 &&
                    minMaxDates && (
                      <div className='mt-4 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20'>
                        <div className='flex items-center justify-between'>
                          <div className='text-sm text-purple-700 dark:text-purple-300'>
                            {(
                              t.transactions?.transactionsOutsideRange ||
                              '{count} more transactions outside this date range'
                            ).replace(
                              '{count}',
                              String(outsideRangeCount.total)
                            )}
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-purple-600 hover:bg-purple-100 hover:text-purple-700 dark:text-purple-400 dark:hover:bg-purple-800 dark:hover:text-purple-300'
                            onClick={() => {
                              setDateRange(
                                new Date(minMaxDates.minDate),
                                new Date(minMaxDates.maxDate)
                              );
                            }}
                          >
                            {t.transactions?.expandDateRange ||
                              'Expand date range'}
                          </Button>
                        </div>
                      </div>
                    )}
                </>
              ) : hasActiveFilters ? (
                // If the filters returned no transactions in the current date range
                // but *do* return transactions across the full dataset, show a
                // specialized empty-state with a CTA to view all data.
                (transactionsAllData?.length || 0) > 0 ? (
                  <EmptyState
                    icon={Search}
                    title={
                      t.transactions.noTransactionsInRangeTitle ||
                      'No transactions found in this period'
                    }
                    description={
                      t.transactions.noTransactionsInRangeDescription ||
                      'No transactions found in the selected period, but there are matching transactions in your full data.'
                    }
                    action={
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='ghost'
                          className='text-purple-600 hover:bg-purple-600 hover:text-white dark:text-purple-400 dark:hover:bg-purple-600 dark:hover:text-white'
                          onClick={() => {
                            // Reset all filters
                            setSearch('');
                            setTransactionType('all');
                            setDebouncedType('all');
                            setContextTransactionType('all');
                            setSelectedCategoryIds([]);
                            setCategories([]);
                            setSelectedIbans([]);
                            setSelectedAccountName(null);
                            setSelectedAddressBookId(null);
                            setOpposingAccountIbans([]);
                            setOpposingAccountName(null);
                            setAddressBookId(null);
                            setSelectedPaymentMethods([]);
                            setSelectedPaymentProcessors([]);
                          }}
                        >
                          {t.addressBook?.clearFilters || 'Filters wissen'}
                        </Button>
                        <Button
                          onClick={() => {
                            if (minMaxDates) {
                              setDateRange(
                                new Date(minMaxDates.minDate),
                                new Date(minMaxDates.maxDate)
                              );
                            } else {
                              const end = new Date();
                              const start = new Date();
                              start.setFullYear(start.getFullYear() - 10);
                              setDateRange(start, end);
                            }
                          }}
                        >
                          {t.transactions.viewAllData || 'View all data'}
                        </Button>
                      </div>
                    }
                  />
                ) : (
                  <EmptyState
                    icon={Search}
                    title={t.transactions.noTransactionsFound}
                    description={t.transactions.adjustFilters}
                    action={
                      <Button
                        variant='ghost'
                        className='text-purple-600 hover:bg-purple-600 hover:text-white dark:text-purple-400 dark:hover:bg-purple-600 dark:hover:text-white'
                        onClick={() => {
                          // Reset all filters
                          setSearch('');
                          setTransactionType('all');
                          setDebouncedType('all');
                          setContextTransactionType('all');
                          setSelectedCategoryIds([]);
                          setCategories([]);
                          setSelectedIbans([]);
                          setSelectedAccountName(null);
                          setSelectedAddressBookId(null);
                          setOpposingAccountIbans([]);
                          setOpposingAccountName(null);
                          setAddressBookId(null);
                          setSelectedPaymentMethods([]);
                          setSelectedPaymentProcessors([]);
                        }}
                      >
                        {t.addressBook?.clearFilters || 'Filters wissen'}
                      </Button>
                    }
                  />
                )
              ) : (
                // Empty state when NO filters are active - show "Import" CTA
                <EmptyState
                  icon={History}
                  title={
                    t.transactions.noTransactions || 'Nog geen transacties'
                  }
                  description={
                    t.transactions.importTransactions ||
                    'Importeer je eerste transacties om te beginnen.'
                  }
                  action={
                    <div className='flex flex-wrap items-center justify-center gap-x-2'>
                      <button
                        onClick={() => navigate('/import/')}
                        className='text-sm text-primary hover:underline'
                      >
                        {t.transactions.goToImport || 'Ga naar importeren'}
                      </button>
                      {suggestedPeriod && !isViewingSuggestedPeriod && (
                        <>
                          <span className='text-muted-foreground'>
                            &middot;
                          </span>
                          <button
                            onClick={handleJumpToPeriod}
                            className='text-sm text-primary hover:underline'
                          >
                            {(
                              t.dashboard?.jumpToPeriod || 'Jump to {period}'
                            ).replace('{period}', suggestedPeriod.label)}
                          </button>
                        </>
                      )}
                    </div>
                  }
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create Contact Modal with Transaction Context */}
        <TransactionModals
          translations={t}
          categories={categories}
          addressBook={addressBook}
          createContactModalOpen={createContactModalOpen}
          setCreateContactModalOpen={setCreateContactModalOpen}
          createContactTransaction={createContactTransaction}
          setCreateContactTransaction={setCreateContactTransaction}
          createContactName={createContactName}
          setCreateContactName={setCreateContactName}
          onAddContact={() => {
            if (
              createContactTransaction?.opposingAccountIban &&
              createContactName.trim()
            ) {
              addToAddressBookMutation.mutate({
                iban: createContactTransaction.opposingAccountIban,
                name: createContactName.trim(),
                transactionId: createContactTransaction.id,
              });
              setCreateContactModalOpen(false);
              setCreateContactTransaction(null);
              setCreateContactName('');
            }
          }}
          sharedIbanModalOpen={sharedIbanModalOpen}
          setSharedIbanModalOpen={setSharedIbanModalOpen}
          selectedSharedIban={selectedSharedIban}
          setSelectedSharedIban={setSelectedSharedIban}
          sharedIbanGroups={sharedIbanGroups}
          setSharedIbanGroups={setSharedIbanGroups}
          splitInputValues={splitInputValues}
          setSplitInputValues={setSplitInputValues}
          assignPopoverOpen={assignPopoverOpen}
          setAssignPopoverOpen={setAssignPopoverOpen}
          assignSearchTerm={assignSearchTerm}
          setAssignSearchTerm={setAssignSearchTerm}
          onResolveShared={(params, options) =>
            resolveSharedMutation.mutate(params, options)
          }
          isResolvePending={resolveSharedMutation.isPending}
          onAddIbanToContact={(data, options) =>
            addIbanToContactMutation.mutate(data, options)
          }
          isAddIbanPending={addIbanToContactMutation.isPending}
          ruleModalOpen={ruleModalOpen}
          setRuleModalOpen={setRuleModalOpen}
          rulePattern={rulePattern}
          setRulePattern={setRulePattern}
          pendingRuleTransaction={pendingRuleTransaction}
          setPendingRuleTransaction={setPendingRuleTransaction}
          relatedTransactions={relatedTransactions}
          setRelatedTransactions={setRelatedTransactions}
          selectedRelatedIds={selectedRelatedIds}
          setSelectedRelatedIds={setSelectedRelatedIds}
          onCreateRule={handleCreateRule}
          onSkipRule={handleSkipRule}
          isCreateRulePending={createRuleMutation.isPending}
          findExistingRule={findExistingRule}
          transferModalOpen={transferModalOpen}
          setTransferModalOpen={setTransferModalOpen}
          pendingTransferTransaction={pendingTransferTransaction}
          setPendingTransferTransaction={setPendingTransferTransaction}
          transferRelatedTransactions={transferRelatedTransactions}
          setTransferRelatedTransactions={setTransferRelatedTransactions}
          selectedTransferRelatedIds={selectedTransferRelatedIds}
          setSelectedTransferRelatedIds={setSelectedTransferRelatedIds}
          isMarkingAsTransfer={isMarkingAsTransfer}
          onDetectInternalTransfers={() =>
            detectInternalTransfersMutation.mutate()
          }
          isDetectPending={detectInternalTransfersMutation.isPending}
          onApplyTransferToRelated={handleApplyTransferToRelated}
          isUpdatePending={updateMutation.isPending}
        />
      </div>
    </>
  );
}
