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
  ArrowLeftRight,
  CreditCard,
  Smartphone,
  Building2,
  RefreshCcw,
  Repeat,
  Check,
  PiggyBank,
  ChevronRight,
  ChevronLeft,
  Wallet,
  Pencil,
  Info,
  Plus,
  X,
  Users,
  UserPlus,
  History,
  Filter as _Filter,
  Scissors,
  Merge,
  RotateCcw,
  AlertCircle,
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
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { useToast } from '@/contexts/ToastContext';
import { SearchInput } from '@/components/ui/search-input';
import {
  TypeFilter,
  CategoryFilter,
  AddressBookFilter,
  PaymentMethodFilter,
  PaymentProcessorFilter,
} from '@/components/transactions/OptimizedFilters';
import { TransactionRowBadges } from '@/components/transactions/TransactionRowBadges';
import { TransactionCard } from '@/components/transactions/TransactionCard';
import { Currency } from '@/components/ui/currency';
import { api } from '@/lib/api';
import { formatDate, cn, findSimilarNameGroups } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useSuggestions, CategorySuggestion } from '@/hooks/useSuggestions';
import { useAddressBook } from '@/hooks/useAddressBook';
import { useSharedIbans } from '@/hooks/useSharedIbans';

// Filters on this page are intentionally local to the Transactions view.
// This prevents Dashboard/Analytics filters (global) from affecting Transactions and vice versa.
import type {
  Transaction,
  Account,
  Category,
  AddressBookEntry,
  SharedIban,
} from '@fluxby/shared';

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
  const isMobile = useIsMobile();
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
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState('');
  const [originalLabelValue, setOriginalLabelValue] = useState('');
  const [expandedMerchant, setExpandedMerchant] = useState<string | null>(null);
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
  const [applyToRelated, setApplyToRelated] = useState(true);
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
  const [isMarkingAsTransfer, setIsMarkingAsTransfer] = useState(true);

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

  // Use centralized suggestions hook
  const suggestions = useSuggestions(transactions);

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
    sharedIbans,
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
  const sharedIbansLookup = useMemo(() => {
    const byIban = new Map<string, SharedIban>();
    for (const shared of sharedIbans) {
      byIban.set(shared.iban, shared);
    }
    return byIban;
  }, [sharedIbans]);

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

  const renameCounterpartyMutation = useMutation({
    mutationFn: ({
      transactionId,
      merchantName,
    }: {
      transactionId: string;
      merchantName: string | null;
    }) => api.renameByCounterparty(transactionId, merchantName),
    onMutate: () => {
      // Save scroll position before invalidation
      saveScrollPosition();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['addressbook', activeProfileId],
      });
      setEditingLabelId(null);
      setLabelDraft('');
      if (result.updated > 0) {
        toast.success(
          t.transactions.updatedCount.replace(
            '{count}',
            result.updated.toString()
          )
        );
      }
    },
    onSettled: () => {
      // Restore scroll position after mutation completes
      restoreScrollPosition();
    },
  });

  const addToAddressBookMutation = {
    ...createContactMutationHook,
    mutate: (data: any, options?: any) =>
      createContactMutationHook.mutate(data, {
        ...options,
        onSuccess: (res: any, vars: any, ctx: any) => {
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
    mutate: (data: any, options?: any) =>
      resolveSharedMutationHook.mutate(data, {
        ...options,
        onSuccess: (res: any, vars: any, ctx: any) => {
          options?.onSuccess?.(res, vars, ctx);
        },
      }),
  };

  const addIbanToContactMutation = {
    ...addIbanToContactHook,
    mutate: (data: { contactId: string; iban: string }, options?: any) =>
      addIbanToContactHook.mutate(data, {
        ...options,
        onSuccess: (res: any, vars: any, ctx: any) => {
          setAssignPopoverOpen(null);
          setAssignSearchTerm('');
          options?.onSuccess?.(res, vars, ctx);
        },
      }),
  };

  // Check if transaction is linked to address book
  const isInAddressBook = (tx: Transaction) => {
    return findAddressBookEntry(tx) !== null;
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

  // Check if IBAN is a shared IBAN (payment processor) - O(1) lookup
  const getSharedIbanData = (iban: string | null) => {
    if (!iban) return null;
    return sharedIbansLookup.get(iban) || null;
  };

  // Add transaction counterparty to address book
  const addToAddressBook = (tx: Transaction) => {
    const iban = tx.opposingAccountIban;
    const name =
      tx.merchantName || tx.opposingAccountName || tx.description || '';

    // Prevent duplicates - check if already in address book
    if (!iban || !name || isInAddressBook(tx)) return;

    // Check if this is a shared IBAN (payment processor)
    const sharedData = getSharedIbanData(iban);
    if (sharedData && sharedData.merchantCount > 1) {
      // Show modal for selecting which merchants to add
      setSelectedSharedIban({
        iban: sharedData.iban,
        merchants: sharedData.merchants,
      });

      // Group similar names together (same as AddressBook modal)
      const merchantNames = sharedData.merchants.map((m) => m.name);
      const similarGroups = findSimilarNameGroups(merchantNames);

      // Create groups: similar items grouped, others as single-entry groups
      const processedIndices = new Set<number>();
      const groups: typeof sharedIbanGroups = [];
      let groupId = 0;

      // First, create groups from similar names
      for (const similarGroup of similarGroups) {
        const entries = similarGroup.map((idx) => {
          processedIndices.add(idx);
          return {
            name: sharedData.merchants[idx].name,
            transactionCount: sharedData.merchants[idx].transactionCount,
          };
        });

        // Use the first name as default edited name
        const defaultName = entries[0].name;
        groups.push({
          id: groupId++,
          entries,
          editedName: defaultName,
          isSplit: false,
        });
      }

      // Add remaining items: if multiple remain, group them together
      // This ensures shared IBAN merchants are shown as a single group
      const ungroupedEntries = sharedData.merchants
        .filter((_, idx) => !processedIndices.has(idx))
        .map((merchant) => ({
          name: merchant.name,
          transactionCount: merchant.transactionCount,
        }));

      if (ungroupedEntries.length > 1) {
        // Multiple ungrouped items: present as one group (can be split)
        groups.push({
          id: groupId++,
          entries: ungroupedEntries,
          editedName: ungroupedEntries[0].name,
          isSplit: false,
        });
      } else if (ungroupedEntries.length === 1) {
        // Single ungrouped item: add as individual group
        groups.push({
          id: groupId++,
          entries: ungroupedEntries,
          editedName: ungroupedEntries[0].name,
          isSplit: false,
        });
      }

      setSharedIbanGroups(groups);
      setSharedIbanModalOpen(true);
    } else {
      // For non-shared IBANs, show the create contact modal so user can confirm/edit the name
      setCreateContactTransaction(tx);
      setCreateContactName(name);
      setCreateContactModalOpen(true);
    }
  };

  // Helper function to categorize transaction and all related transactions (same counterparty)
  const handleCategorySelect = (tx: Transaction, categoryId: string) => {
    // Note: popover is managed by TransactionRowBadges component internally

    // Find related transactions (same counterparty/merchant or same IBAN)
    const txName = tx.merchantName || tx.opposingAccountName || '';
    const txIban = tx.opposingAccountIban;
    const related = (transactions || []).filter((t) => {
      if (t.id === tx.id) return false; // Exclude current transaction
      if (t.categoryId === categoryId) return false; // Already has this category
      // Match by name (case insensitive)
      const tName = t.merchantName || t.opposingAccountName || '';
      if (txName && tName && txName.toLowerCase() === tName.toLowerCase()) {
        return true;
      }
      // Match by IBAN
      if (txIban && t.opposingAccountIban === txIban) return true;
      return false;
    });
    setRelatedTransactions(related);
    setApplyToRelated(related.length > 0);
    // Pre-select ALL related transactions by default
    setSelectedRelatedIds(new Set(related.map((t) => t.id)));

    // Determine default pattern
    // Prefer merchantName, then opposingAccountName, then description
    let defaultPattern =
      tx.merchantName || tx.opposingAccountName || tx.description || '';

    // Simple cleanup: remove common suffixes if present at end of string
    defaultPattern = defaultPattern
      .replace(/\s+(B\.V\.|N\.V\.|BV|NV)$/i, '')
      .trim();

    // Make pattern more flexible by extracting core merchant name
    // Take first 1-2 words to capture the brand name, avoiding location specifics
    const words = defaultPattern.split(/\s+/);
    if (words.length >= 3) {
      // For names with 3+ words, take first 2 words (likely the brand)
      defaultPattern = words.slice(0, 2).join(' ');
    }
    // Keep full name for short names (1-2 words)

    setRulePattern(defaultPattern);
    setPendingRuleTransaction({ tx, categoryId });
    setRuleModalOpen(true);
  };

  const startLabelEdit = (tx: Transaction) => {
    setEditingLabelId(tx.id);
    const currentValue = tx.merchantName || tx.opposingAccountName || '';
    setLabelDraft(currentValue);
    // Store the original bank statement value for reset, NOT the current edited value
    // This allows resetting to the true original even after multiple edits
    setOriginalLabelValue(tx.opposingAccountName || '');
  };

  const cancelLabelEdit = () => {
    setEditingLabelId(null);
    setLabelDraft('');
    setOriginalLabelValue('');
  };

  const saveLabel = (txId: string) => {
    const value = labelDraft.trim();
    // Rename related transactions as well
    renameCounterpartyMutation.mutate({
      transactionId: txId,
      merchantName: value === '' ? null : value,
    });
  };

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

      // If apply to related is enabled, update selected related transactions
      if (applyToRelated && selectedRelatedIds.size > 0) {
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

  // Handler for toggling transfer type - shows modal if there are related transactions
  const handleTransferToggle = (tx: Transaction) => {
    const isCurrentlyTransfer = tx.type === 'transfer';
    const newType = isCurrentlyTransfer
      ? tx.amount > 0
        ? 'income'
        : 'expense'
      : 'transfer';

    // Find related transactions (same IBAN or same name)
    const txName = tx.merchantName || tx.opposingAccountName || '';
    const txIban = tx.opposingAccountIban;
    const related = (transactions || []).filter((t) => {
      if (t.id === tx.id) return false; // Exclude current transaction
      // For marking as transfer, find transactions that are not transfers
      // For unmarking, find transactions that are transfers
      if (isCurrentlyTransfer) {
        if (t.type !== 'transfer') return false;
      } else {
        if (t.type === 'transfer') return false;
      }
      // Match by name (case insensitive)
      const tName = t.merchantName || t.opposingAccountName || '';
      if (txName && tName && txName.toLowerCase() === tName.toLowerCase()) {
        return true;
      }
      // Match by IBAN
      if (txIban && t.opposingAccountIban === txIban) return true;
      return false;
    });

    if (related.length > 0) {
      // Show modal to ask about related transactions
      setPendingTransferTransaction(tx);
      setTransferRelatedTransactions(related);
      setSelectedTransferRelatedIds(new Set(related.map((t) => t.id)));
      setIsMarkingAsTransfer(!isCurrentlyTransfer);
      setTransferModalOpen(true);
    } else {
      // No related transactions, just update this one
      // Include category assignment when marking as transfer
      const updateData: {
        type: 'income' | 'expense' | 'transfer';
        categoryId?: string;
      } = { type: newType };
      if (newType === 'transfer' && transferCategoryId) {
        updateData.categoryId = transferCategoryId;
      }
      updateMutation.mutate(
        { id: tx.id, data: updateData },
        {
          onSuccess: () => {
            toast.success(
              newType === 'transfer'
                ? t.transactions?.markedAsTransfer ||
                    'Marked as internal transfer'
                : t.transactions?.transferMarkRemoved || 'Transfer mark removed'
            );
          },
        }
      );
    }
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
  // If the transaction has a different IBAN, add it to the contact's IBANs
  const handleAddressBookSelect = async (
    tx: Transaction,
    contact: AddressBookEntry
  ) => {
    // Note: popover is managed by TransactionRowBadges component internally
    const txIban = tx.opposingAccountIban;
    const contactIbans = contact.ibans || [contact.iban];

    // Check if the transaction's IBAN is already in the contact's IBANs
    const ibanAlreadyInContact =
      txIban && contactIbans.some((iban) => iban === txIban);

    // If the IBAN is different, first add it to the contact
    if (txIban && !ibanAlreadyInContact) {
      try {
        await api.addContactIban(contact.id, txIban);
        queryClient.invalidateQueries({
          queryKey: ['addressbook', activeProfileId],
        });
      } catch {
        // If adding IBAN fails (e.g., already exists on another contact), just continue
        // The transaction will still be linked
      }
    }

    // Then link the transaction to the contact
    updateMutation.mutate({ id: tx.id, data: { addressBookId: contact.id } });
  };

  // Handle payment method selection for a transaction
  const handlePaymentMethodSelect = (
    tx: Transaction,
    method: string | null
  ) => {
    // Note: popover is managed by TransactionRowBadges component internally
    updateMutation.mutate({ id: tx.id, data: { paymentMethod: method } });
  };

  // Handle payment processor selection for a transaction
  const handlePaymentProcessorSelect = (
    tx: Transaction,
    provider: string | null
  ) => {
    // Note: popover is managed by TransactionRowBadges component internally
    updateMutation.mutate({ id: tx.id, data: { paymentProvider: provider } });
  };

  // Available payment methods
  const paymentMethods = [
    {
      value: 'pin',
      label: t.transactions.paymentMethods.pin,
      icon: <CreditCard className='h-3.5 w-3.5' />,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      value: 'ideal',
      label: t.transactions.paymentMethods.ideal,
      icon: <Smartphone className='h-3.5 w-3.5' />,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      value: 'transfer',
      label: t.transactions.paymentMethods.transfer,
      icon: <Building2 className='h-3.5 w-3.5' />,
      color: 'text-gray-600 bg-gray-100',
    },
    {
      value: 'incasso',
      label: t.transactions.paymentMethods.incasso,
      icon: <RefreshCcw className='h-3.5 w-3.5' />,
      color: 'text-orange-500 bg-orange-50',
    },
    {
      value: 'geldautomaat',
      label: t.transactions.paymentMethods.atm,
      icon: <CreditCard className='h-3.5 w-3.5' />,
      color: 'text-green-600 bg-green-100',
    },
  ];

  // Payment method data lookup - memoized to avoid recreating objects on each render
  const paymentMethodData = useMemo(
    () => ({
      pin: {
        iconType: 'creditCard' as const,
        label: t.transactions.paymentMethods.pin,
        color: 'text-blue-600 bg-blue-100',
      },
      ideal: {
        iconType: 'smartphone' as const,
        label: t.transactions.paymentMethods.ideal,
        color: 'text-purple-600 bg-purple-100',
      },
      transfer: {
        iconType: 'building' as const,
        label: t.transactions.paymentMethods.transfer,
        color: 'text-gray-600 bg-gray-100',
      },
      incasso: {
        iconType: 'refresh' as const,
        label: t.transactions.paymentMethods.incasso,
        color: 'text-orange-500 bg-orange-50',
      },
      geldautomaat: {
        iconType: 'creditCard' as const,
        label: t.transactions.paymentMethods.atm,
        color: 'text-green-600 bg-green-100',
      },
      other: {
        iconType: null,
        label: t.transactions.paymentMethods.other || '',
        color: 'text-gray-500 bg-gray-50',
      },
    }),
    [t.transactions.paymentMethods]
  );

  // Payment method icon and label - returns data, icon rendered in JSX
  const getPaymentMethodInfo = useCallback(
    (method: string | null) => {
      const key = (method || '').toLowerCase();
      // Normalize some legacy / ambiguous codes
      const normalized =
        key === 'diversen' ? 'incasso' : key === 'overig' ? 'other' : key;

      const data =
        paymentMethodData[normalized as keyof typeof paymentMethodData] ||
        paymentMethodData.other;

      // Create icon based on type
      let icon: React.ReactNode = null;
      switch (data.iconType) {
        case 'creditCard':
          icon = <CreditCard className='h-3.5 w-3.5' />;
          break;
        case 'smartphone':
          icon = <Smartphone className='h-3.5 w-3.5' />;
          break;
        case 'building':
          icon = <Building2 className='h-3.5 w-3.5' />;
          break;
        case 'refresh':
          icon = <RefreshCcw className='h-3.5 w-3.5' />;
          break;
      }

      return {
        icon,
        label: data.label || normalized || '',
        color: data.color,
      };
    },
    [paymentMethodData]
  );

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

  const getRecurringHistory = useCallback(
    (tx: Transaction) => {
      const merchantName = tx.merchantName?.toLowerCase().trim() || '';
      const iban = tx.opposingAccountIban?.toLowerCase().trim() || '';
      const key = iban ? `${iban}|${merchantName}` : merchantName;
      return recurringMerchants.get(key) || [];
    },
    [recurringMerchants]
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
          <Card className='h-full rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
            <CardContent className='relative flex h-full flex-col justify-between overflow-hidden p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6'>
              <div className='flex-1 sm:mr-4'>
                <p className='text-xs text-muted-foreground sm:text-sm'>
                  {t.dashboard.income}
                </p>
                <p className='mt-1 text-lg font-bold whitespace-nowrap sm:text-2xl'>
                  <Currency amount={totals.income} />
                </p>
              </div>
              <div className='absolute -top-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 sm:relative sm:inset-auto sm:top-auto sm:right-auto sm:ml-4 sm:flex-shrink-0 dark:bg-emerald-900/30'>
                <ArrowUpRight className='h-5 w-5 text-emerald-600 sm:h-6 sm:w-6' />
              </div>
            </CardContent>
          </Card>
          <Card className='h-full rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
            <CardContent className='relative flex h-full flex-col justify-between overflow-hidden p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6'>
              <div className='flex-1 sm:mr-4'>
                <p className='text-xs text-muted-foreground sm:text-sm'>
                  {t.dashboard.expenses}
                </p>
                <p className='mt-1 text-lg font-bold whitespace-nowrap sm:text-2xl'>
                  <Currency amount={totals.expenses} />
                </p>
              </div>
              <div className='absolute -top-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 sm:relative sm:inset-auto sm:top-auto sm:right-auto sm:ml-4 sm:flex-shrink-0 dark:bg-rose-900/30'>
                <ArrowDownRight className='h-5 w-5 text-rose-600 sm:h-6 sm:w-6' />
              </div>
            </CardContent>
          </Card>
          <Card className='h-full rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
            <CardContent className='relative flex h-full flex-col justify-between overflow-hidden p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6'>
              <div className='flex-1 sm:mr-4'>
                <p className='text-xs text-muted-foreground sm:text-sm'>
                  {t.dashboard.toSavings}
                </p>
                <p className='mt-1 text-lg font-bold whitespace-nowrap sm:text-2xl'>
                  <Currency amount={totals.netSavingsTransfer} />
                </p>
                <p className='mt-1 text-xs whitespace-nowrap text-muted-foreground'>
                  +<Currency amount={totals.transferToSavings} /> / -
                  <Currency amount={totals.transferFromSavings} />
                </p>
              </div>
              <div className='absolute -top-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 sm:relative sm:inset-auto sm:top-auto sm:right-auto sm:ml-4 sm:flex-shrink-0 dark:bg-blue-900/30'>
                <PiggyBank className='h-5 w-5 text-blue-600 sm:h-6 sm:w-6' />
              </div>
            </CardContent>
          </Card>
          <Card className='h-full rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
            <CardContent className='relative flex h-full flex-col justify-between overflow-hidden p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6'>
              <div className='flex-1 sm:mr-4'>
                <p className='text-xs text-muted-foreground sm:text-sm'>
                  {t.dashboard.netResult}
                </p>
                <p
                  className={cn(
                    'mt-1 text-lg font-bold whitespace-nowrap sm:text-2xl',
                    totals.balance === 0
                      ? 'text-gray-900 dark:text-gray-100'
                      : totals.balance > 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                  )}
                >
                  <Currency amount={totals.balance} />
                </p>
              </div>
              <div
                className={cn(
                  'absolute -top-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full sm:relative sm:inset-auto sm:top-auto sm:right-auto sm:ml-4 sm:flex-shrink-0',
                  totals.balance === 0
                    ? 'bg-gray-100 dark:bg-gray-900/30'
                    : totals.balance > 0
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : 'bg-rose-100 dark:bg-rose-900/30'
                )}
              >
                <Wallet
                  className={cn(
                    'h-5 w-5 sm:h-6 sm:w-6',
                    totals.balance === 0
                      ? 'text-gray-400'
                      : totals.balance > 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
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
                    placeholder={t.transactions.searchPlaceholder}
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
                      startTransition(() => setTransactionType(type))
                    }
                    translations={{
                      transactions: t.nav.transactions,
                      income: t.transactions.income,
                      expense: t.transactions.expense,
                      transfer: t.transactions.transfer,
                      clearAll: t.common.clearAll,
                    }}
                  />

                  {/* Category Filter - Optimized */}
                  <CategoryFilter
                    categories={categories}
                    selectedIds={selectedCategoryIds}
                    onChange={setCategories}
                    translations={{
                      categories: t.transactions.categories,
                      noCategory: t.transactions.noCategory || 'Geen categorie',
                      search: t.common.search || 'Zoeken...',
                      clearAll: t.common.clearAll,
                    }}
                  />

                  {/* Address Book Filter - Optimized */}
                  <AddressBookFilter
                    addressBook={addressBook}
                    isLoading={addressBookLoading}
                    selectedIbans={selectedIbans}
                    selectedAddressBookId={selectedAddressBookId}
                    selectedAccountName={selectedAccountName}
                    onIbansChange={(ibans) => {
                      setSelectedIbans(ibans);
                      setOpposingAccountIbans(ibans);
                    }}
                    onAddressBookIdChange={(id) => {
                      setSelectedAddressBookId(id);
                      setAddressBookId(id);
                    }}
                    onAccountNameChange={(name) => {
                      setSelectedAccountName(name);
                      setOpposingAccountName(null);
                    }}
                    onOpen={() => {
                      if (!addressBookFilterOpened) {
                        setAddressBookFilterOpened(true);
                      }
                    }}
                    data-onboarding='transaction-addressbook-filter'
                    translations={{
                      addressBook: t.transactions.addressBook,
                      search: t.common.search || 'Zoeken...',
                      clearAll: t.common.clearAll,
                      loading: t.common?.loading || 'Laden...',
                      noContacts: t.transactions.noContacts,
                      contacts: t.transactions.contacts,
                      contactsPlural: t.transactions.contactsPlural,
                    }}
                  />

                  {/* Payment Method Filter - Optimized */}
                  <PaymentMethodFilter
                    selectedMethods={selectedPaymentMethods}
                    onChange={setSelectedPaymentMethods}
                    data-onboarding='transaction-payment-filter'
                    translations={{
                      paymentMethod: t.transactions.paymentMethodFilter,
                      pin: t.transactions.paymentMethods.pin,
                      ideal: t.transactions.paymentMethods.ideal,
                      transfer: t.transactions.paymentMethods.transfer,
                      incasso: t.transactions.paymentMethods.incasso,
                      atm: t.transactions.paymentMethods.atm,
                      clearAll: t.common.clearAll,
                    }}
                  />

                  {/* Payment Processor Filter - Optimized */}
                  <PaymentProcessorFilter
                    processors={paymentProviderRules}
                    selectedProcessors={selectedPaymentProcessors}
                    onChange={setSelectedPaymentProcessors}
                    translations={{
                      paymentProcessor: t.transactions.paymentProcessorFilter,
                      clearAll: t.common.clearAll,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                      'space-y-2 transition-opacity duration-150',
                      isStale && 'opacity-70'
                    )}
                  >
                    {deferredTransactions?.slice(0, visibleCount).map((tx) => {
                      const paymentInfo = getPaymentMethodInfo(
                        tx.paymentMethod
                      );
                      const recurring = isRecurring(tx);
                      const merchantKey =
                        tx.merchantName?.toLowerCase().trim() || '';
                      const isExpanded =
                        expandedMerchant === `${merchantKey}-${tx.id}`;
                      const history = recurring ? getRecurringHistory(tx) : [];
                      const _suggestion = suggestions[tx.id];
                      const addressBookEntry = findAddressBookEntry(tx);
                      const _sharedData = getSharedIbanData(
                        tx.opposingAccountIban
                      );
                      const historyTotal = history.reduce(
                        (sum, h) => sum + h.amount,
                        0
                      );

                      // Mobile card view
                      if (isMobile) {
                        return (
                          <TransactionCard
                            key={tx.id}
                            tx={tx}
                            categoryName={getCategoryName(tx.categoryId)}
                            categoryColor={getCategoryColor(tx.categoryId)}
                            addressBookEntry={addressBookEntry}
                            isRecurring={recurring}
                            onClick={() => {
                              if (recurring) {
                                setExpandedMerchant(
                                  isExpanded ? null : `${merchantKey}-${tx.id}`
                                );
                              }
                            }}
                          />
                        );
                      }

                      // Desktop row view
                      return (
                        <div
                          key={tx.id}
                          className='border-x-0 border-t border-b-0 sm:rounded-lg sm:border'
                          data-onboarding='transaction-row'
                        >
                          <div
                            className={cn(
                              'group flex items-center justify-between p-0 transition-colors hover:bg-muted/50 sm:rounded-lg sm:p-4',
                              recurring && 'cursor-pointer'
                            )}
                            onClick={() => {
                              if (recurring) {
                                // Don't use startTransition here - it causes the skeleton to flash
                                // because isPending becomes true during the transition
                                setExpandedMerchant(
                                  isExpanded ? null : `${merchantKey}-${tx.id}`
                                );
                              }
                            }}
                          >
                            <div className='flex min-w-0 flex-1 items-center gap-4 px-3 py-4 sm:p-0'>
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
                                <div className='flex items-center gap-2'>
                                  {editingLabelId === tx.id ? (
                                    <div
                                      className='relative z-10 flex items-center gap-2'
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className='relative'>
                                        <Input
                                          value={labelDraft}
                                          onChange={(e) =>
                                            setLabelDraft(e.target.value)
                                          }
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
                                                  className='absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 rounded-md p-0 text-muted-foreground hover:bg-purple-600 hover:text-white'
                                                  onClick={() =>
                                                    setLabelDraft(
                                                      originalLabelValue
                                                    )
                                                  }
                                                >
                                                  <RotateCcw className='h-3.5 w-3.5' />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                {t.transactions
                                                  ?.resetToOriginal ||
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
                                              onClick={() => saveLabel(tx.id)}
                                              disabled={
                                                updateMutation.isPending
                                              }
                                            >
                                              <Check className='h-4 w-4' />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            {t.common.save}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      <TooltipProvider delayDuration={100}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size='sm'
                                              variant='ghost'
                                              className='h-7 w-7 rounded-md p-0 hover:bg-purple-600 hover:text-white'
                                              onClick={cancelLabelEdit}
                                              disabled={
                                                updateMutation.isPending
                                              }
                                            >
                                              <X className='h-4 w-4' />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            {t.common.cancel}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  ) : (
                                    <div className='flex min-w-0 items-center gap-2'>
                                      <p
                                        className='min-w-0 truncate font-medium'
                                        title={
                                          tx.opposingAccountName ||
                                          tx.description ||
                                          undefined
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
                                          <TooltipContent className='max-w-xs break-words whitespace-normal'>
                                            <div className='space-y-1 text-sm'>
                                              {tx.description && (
                                                <p>
                                                  <span className='font-semibold'>
                                                    {t.transactions.description}
                                                    :
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
                                                    {
                                                      t.transactions
                                                        .counterAccount
                                                    }
                                                    :
                                                  </span>{' '}
                                                  {addressBookEntry.name}
                                                  {addressBookEntry.description && (
                                                    <span className='ml-2 font-normal text-muted-foreground'>
                                                      (
                                                      {
                                                        addressBookEntry.description
                                                      }
                                                      )
                                                    </span>
                                                  )}
                                                </p>
                                              ) : (
                                                tx.opposingAccountName && (
                                                  <p>
                                                    <span className='font-semibold'>
                                                      {
                                                        t.transactions
                                                          .counterAccount
                                                      }
                                                      :
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
                                              className='flex-shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-colors group-hover:opacity-100 hover:bg-muted focus:opacity-100'
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                startLabelEdit(tx);
                                              }}
                                            >
                                              <Pencil className='h-4 w-4' />
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>
                                              {
                                                t.transactions
                                                  .editTransactionName
                                              }
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  )}
                                </div>
                                {/* Date and IBAN on one line */}
                                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                  <span className='flex-shrink-0'>
                                    {formatDate(tx.date)}
                                  </span>
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
                                {/* Badges row - Optimized component with internal state management */}
                                <TransactionRowBadges
                                  transaction={tx}
                                  categories={categories}
                                  categoryName={getCategoryName(tx.categoryId)}
                                  categoryColor={getCategoryColor(
                                    tx.categoryId
                                  )}
                                  paymentInfo={paymentInfo}
                                  paymentMethods={paymentMethods}
                                  paymentProviderRules={paymentProviderRules}
                                  addressBook={addressBook}
                                  addressBookEntry={addressBookEntry}
                                  isInAddressBook={isInAddressBook(tx)}
                                  onCategorySelect={handleCategorySelect}
                                  onPaymentMethodSelect={
                                    handlePaymentMethodSelect
                                  }
                                  onPaymentProcessorSelect={
                                    handlePaymentProcessorSelect
                                  }
                                  onAddressBookSelect={handleAddressBookSelect}
                                  onAddToAddressBook={addToAddressBook}
                                  onTransferToggle={handleTransferToggle}
                                  isUpdatePending={updateMutation.isPending}
                                  translations={{
                                    searchCategories:
                                      t.categories?.searchCategories ||
                                      'Zoek categorie...',
                                    paymentMethods: {
                                      other:
                                        t.transactions.paymentMethods.other ||
                                        'Onbekend',
                                    },
                                    remove: t.common?.remove || 'Verwijderen',
                                    addToAddressBook:
                                      t.transactions.addToAddressBook,
                                    inAddressBook: t.transactions.inAddressBook,
                                    searchContacts:
                                      t.addressBook?.searchContacts ||
                                      'Zoek contact...',
                                    noContactsFound:
                                      t.addressBook?.noContactsFound ||
                                      'Geen contacten gevonden',
                                    internalTransfer:
                                      t.transactions.internalTransfer ||
                                      'Internal transfer',
                                    removeTransferMark:
                                      t.transactions.removeTransferMark ||
                                      'Remove internal transfer mark',
                                    markAsTransfer:
                                      t.transactions.markAsTransfer ||
                                      'Mark as internal transfer',
                                  }}
                                />
                              </div>
                            </div>
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
                                {tx.type === 'transfer'
                                  ? ''
                                  : tx.amount > 0
                                    ? '+'
                                    : ''}
                                <Currency amount={tx.amount} />
                              </p>
                              {recurring && (
                                <span
                                  data-onboarding='transaction-recurring-badge'
                                  className='inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700'
                                >
                                  <Repeat className='h-3 w-3' />
                                  {history.length}×
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
                                  <span className='font-bold'>
                                    <Currency amount={historyTotal} />
                                  </span>
                                </div>
                              </div>
                              <div className='grid gap-2'>
                                {(() => {
                                  // Smart truncation: show max 7 items - 3 before, current, 3 after
                                  const MAX_VISIBLE = 7;
                                  const CONTEXT_SIZE = 3;
                                  const currentIndex = history.findIndex(
                                    (h) => h.id === tx.id
                                  );

                                  if (history.length <= MAX_VISIBLE) {
                                    // Show all if small list
                                    return history.map((h) => (
                                      <div
                                        key={h.id}
                                        className={cn(
                                          '-mx-2 flex items-center justify-between rounded border-b border-dashed px-2 py-1 text-sm last:border-0',
                                          h.id === tx.id &&
                                            'bg-purple-100 dark:bg-purple-900/30'
                                        )}
                                      >
                                        <span className='text-muted-foreground'>
                                          {formatDate(h.date)}
                                        </span>
                                        <span className='font-medium'>
                                          <Currency amount={h.amount} />
                                        </span>
                                      </div>
                                    ));
                                  }

                                  // Calculate window around current transaction
                                  const _beforeCount = currentIndex;
                                  const _afterCount =
                                    history.length - currentIndex - 1;

                                  let startIdx = Math.max(
                                    0,
                                    currentIndex - CONTEXT_SIZE
                                  );
                                  let endIdx = Math.min(
                                    history.length - 1,
                                    currentIndex + CONTEXT_SIZE
                                  );

                                  // Adjust window if at edges
                                  if (startIdx === 0) {
                                    endIdx = Math.min(
                                      history.length - 1,
                                      MAX_VISIBLE - 1
                                    );
                                  } else if (endIdx === history.length - 1) {
                                    startIdx = Math.max(
                                      0,
                                      history.length - MAX_VISIBLE
                                    );
                                  }

                                  const visibleHistory = history.slice(
                                    startIdx,
                                    endIdx + 1
                                  );
                                  const hiddenBefore = startIdx;
                                  const hiddenAfter =
                                    history.length - endIdx - 1;

                                  return (
                                    <>
                                      {hiddenBefore > 0 && (
                                        <div className='-mx-2 flex items-center justify-center gap-2 px-2 py-1 text-xs text-muted-foreground'>
                                          <span className='flex-1 border-b border-dashed' />
                                          <span>
                                            {hiddenBefore}{' '}
                                            {hiddenBefore === 1
                                              ? t.transactions
                                                  ?.laterTransaction ||
                                                'latere transactie'
                                              : t.transactions
                                                  ?.laterTransactions ||
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
                                            h.id === tx.id &&
                                              'bg-purple-100 dark:bg-purple-900/30'
                                          )}
                                        >
                                          <span className='text-muted-foreground'>
                                            {formatDate(h.date)}
                                          </span>
                                          <span className='font-medium'>
                                            <Currency amount={h.amount} />
                                          </span>
                                        </div>
                                      ))}
                                      {hiddenAfter > 0 && (
                                        <div className='-mx-2 flex items-center justify-center gap-2 px-2 py-1 text-xs text-muted-foreground'>
                                          <span className='flex-1 border-b border-dashed' />
                                          <span>
                                            {hiddenAfter}{' '}
                                            {hiddenAfter === 1
                                              ? t.transactions
                                                  ?.earlierTransaction ||
                                                'eerdere transactie'
                                              : t.transactions
                                                  ?.earlierTransactions ||
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
                    })}
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
        <Dialog
          open={createContactModalOpen}
          onOpenChange={(open) => {
            setCreateContactModalOpen(open);
            if (!open) {
              setCreateContactTransaction(null);
              setCreateContactName('');
            }
          }}
        >
          <DialogContent className='max-w-md'>
            <DialogHeader>
              <DialogTitle>
                {t.addressBook?.createNewContact || 'Nieuw contact aanmaken'}
              </DialogTitle>
              <DialogDescription>
                {t.addressBook?.createNewContactWithIban ||
                  'Nieuw contact aanmaken met IBAN'}
              </DialogDescription>
            </DialogHeader>
            {createContactTransaction && (
              <div className='space-y-4 py-4'>
                {/* Transaction details card */}
                <div className='rounded-lg border bg-muted/50 p-3'>
                  <p className='mb-2 text-xs font-medium text-muted-foreground'>
                    {t.addressBook?.transactionDetails || 'Transactiegegevens'}
                  </p>
                  <div className='space-y-1.5 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>
                        {t.transactions.date || 'Datum'}:
                      </span>
                      <span className='font-medium'>
                        {formatDate(createContactTransaction.date)}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>
                        {t.transactions.amount || 'Bedrag'}:
                      </span>
                      <span
                        className={cn(
                          'font-medium',
                          createContactTransaction.amount > 0
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        )}
                      >
                        <Currency amount={createContactTransaction.amount} />
                      </span>
                    </div>
                    <div className='flex justify-between gap-2'>
                      <span className='text-muted-foreground'>IBAN:</span>
                      <span className='truncate text-xs'>
                        {createContactTransaction.opposingAccountIban}
                      </span>
                    </div>
                    <div className='flex justify-between gap-2'>
                      <span className='text-muted-foreground'>
                        {t.transactions?.counterparty || 'Tegenrekening'}:
                      </span>
                      <span className='truncate text-right'>
                        {createContactTransaction.opposingAccountName ||
                          createContactTransaction.merchantName ||
                          '-'}
                      </span>
                    </div>
                    {(createContactTransaction.notes ||
                      createContactTransaction.description) && (
                      <div className='flex justify-between gap-2'>
                        <span className='text-muted-foreground'>
                          {t.transactions?.details || 'Details'}:
                        </span>
                        <span className='max-w-[200px] truncate text-right text-xs'>
                          {createContactTransaction.notes ||
                            createContactTransaction.description}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Name input */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    {t.settings?.addressBook?.namePlaceholder || 'Naam'}
                  </label>
                  <Input
                    value={createContactName}
                    onChange={(e) => setCreateContactName(e.target.value)}
                    placeholder={
                      t.settings?.addressBook?.namePlaceholder || 'Naam'
                    }
                    autoFocus
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setCreateContactModalOpen(false)}
              >
                {t.common.cancel}
              </Button>
              <Button
                onClick={() => {
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
                disabled={!createContactName.trim()}
              >
                {t.common.add || 'Toevoegen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Shared IBAN Modal - Add merchants to address book (group-based like AddressBook) */}
        <Dialog
          open={sharedIbanModalOpen}
          onOpenChange={(open) => {
            setSharedIbanModalOpen(open);
            if (!open) {
              setSelectedSharedIban(null);
              setSharedIbanGroups([]);
            }
          }}
        >
          <DialogContent className='max-h-[80vh] max-w-2xl overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>
                {t.transactions.addToAddressBookTitle || 'Add to address book'}
              </DialogTitle>
              <DialogDescription>
                {selectedSharedIban && (
                  <>
                    {(
                      t.transactions.addToAddressBookDescription ||
                      'Add names from {iban} to your address book. Similar names are grouped.'
                    ).replace('{iban}', '')}
                    <span>{selectedSharedIban.iban}</span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              {sharedIbanGroups.length === 0 ? (
                <div className='py-8 text-center text-muted-foreground'>
                  <Check className='mx-auto mb-2 h-12 w-12 text-green-500' />
                  <p>
                    {t.transactions.allNamesProcessed ||
                      'All names have been processed!'}
                  </p>
                </div>
              ) : (
                sharedIbanGroups.map((group) => {
                  const totalTransactions = group.entries.reduce(
                    (sum, e) => sum + e.transactionCount,
                    0
                  );
                  const isMultiEntry = group.entries.length > 1;
                  const isSplit = group.isSplit;

                  // If split, show each entry separately
                  if (isSplit) {
                    return (
                      <div key={group.id} className='space-y-2'>
                        {group.entries.map((entry, entryIdx) => (
                          <div
                            key={`${group.id}-${entryIdx}`}
                            className='flex items-end gap-3 rounded-lg border bg-card p-3'
                          >
                            <div className='min-w-0 flex-1'>
                              <div className='flex flex-wrap items-center gap-2'>
                                <span className='text-sm font-medium'>
                                  {entry.name}
                                </span>
                                <span className='text-xs text-muted-foreground'>
                                  ({entry.transactionCount}{' '}
                                  {entry.transactionCount === 1
                                    ? 'transactie'
                                    : 'transacties'}
                                  )
                                </span>
                              </div>
                              <div className='mt-2'>
                                <Input
                                  value={
                                    splitInputValues[entry.name] ?? entry.name
                                  }
                                  onChange={(e) =>
                                    setSplitInputValues((prev) => ({
                                      ...prev,
                                      [entry.name]: e.target.value,
                                    }))
                                  }
                                  className='h-8 text-sm'
                                  placeholder='Naam voor adresboek'
                                />
                              </div>
                            </div>
                            {/* Assign to existing contact button */}
                            <Popover
                              open={
                                assignPopoverOpen ===
                                `split-${group.id}-${entryIdx}`
                              }
                              onOpenChange={(open) => {
                                setAssignPopoverOpen(
                                  open ? `split-${group.id}-${entryIdx}` : null
                                );
                                if (!open) setAssignSearchTerm('');
                              }}
                            >
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <PopoverTrigger asChild>
                                      <Button
                                        size='sm'
                                        variant='outline'
                                        className='h-8 w-8 rounded-md p-0 hover:border-purple-600 hover:bg-purple-600 hover:text-white'
                                        disabled={
                                          addIbanToContactMutation.isPending
                                        }
                                      >
                                        <UserPlus className='h-4 w-4' />
                                      </Button>
                                    </PopoverTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {t.addressBook?.assignToExisting ||
                                      'Assign to existing contact'}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <PopoverContent
                                className='w-64 p-2'
                                align='end'
                                onWheel={(e) => e.stopPropagation()}
                              >
                                <div className='space-y-2'>
                                  <Input
                                    placeholder={
                                      t.addressBook?.searchContacts ||
                                      'Search contacts...'
                                    }
                                    value={assignSearchTerm}
                                    onChange={(e) =>
                                      setAssignSearchTerm(e.target.value)
                                    }
                                    className='h-8 text-sm'
                                    autoFocus
                                  />
                                  <div
                                    className='max-h-48 overflow-y-auto overscroll-contain'
                                    onWheel={(e) => e.stopPropagation()}
                                  >
                                    <div className='space-y-1'>
                                      {(() => {
                                        const searchLower =
                                          assignSearchTerm.toLowerCase();
                                        const currentIban =
                                          selectedSharedIban?.iban;
                                        const filtered = addressBook
                                          ?.filter((c) => {
                                            const matches =
                                              c.name
                                                .toLowerCase()
                                                .includes(searchLower) ||
                                              c.iban
                                                ?.toLowerCase()
                                                .includes(searchLower) ||
                                              c.ibans?.some((i) =>
                                                i
                                                  .toLowerCase()
                                                  .includes(searchLower)
                                              );
                                            // Exclude contacts that already have this IBAN
                                            const hasIban =
                                              c.iban === currentIban ||
                                              c.ibans?.includes(
                                                currentIban || ''
                                              );
                                            return matches && !hasIban;
                                          })
                                          .sort((a, b) =>
                                            a.name.localeCompare(b.name)
                                          );
                                        return filtered?.length ? (
                                          filtered.map((contact) => (
                                            <button
                                              key={contact.id}
                                              className='w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted'
                                              onClick={() => {
                                                if (!selectedSharedIban) return;
                                                // Use resolveSharedMutation with contactId to assign to existing contact
                                                resolveSharedMutation.mutate(
                                                  {
                                                    iban: selectedSharedIban.iban,
                                                    name: contact.name,
                                                    originalNames: [entry.name],
                                                    contactId: contact.id,
                                                  },
                                                  {
                                                    onSuccess: () => {
                                                      setAssignPopoverOpen(
                                                        null
                                                      );
                                                      setAssignSearchTerm('');
                                                      // Remove this entry from the group
                                                      setSharedIbanGroups(
                                                        (prev) =>
                                                          prev
                                                            .map((g) => {
                                                              if (
                                                                g.id !==
                                                                group.id
                                                              )
                                                                return g;
                                                              const newEntries =
                                                                g.entries.filter(
                                                                  (_, i) =>
                                                                    i !==
                                                                    entryIdx
                                                                );
                                                              if (
                                                                newEntries.length ===
                                                                0
                                                              )
                                                                return null;
                                                              return {
                                                                ...g,
                                                                entries:
                                                                  newEntries,
                                                              };
                                                            })
                                                            .filter(
                                                              Boolean
                                                            ) as typeof prev
                                                      );
                                                      // Clean up the input value
                                                      setSplitInputValues(
                                                        (prev) => {
                                                          const newValues = {
                                                            ...prev,
                                                          };
                                                          delete newValues[
                                                            entry.name
                                                          ];
                                                          return newValues;
                                                        }
                                                      );
                                                    },
                                                  }
                                                );
                                              }}
                                            >
                                              <div className='font-medium'>
                                                {contact.name}
                                              </div>
                                              <div className='truncate text-xs text-muted-foreground'>
                                                {contact.iban}
                                              </div>
                                            </button>
                                          ))
                                        ) : (
                                          <div className='py-4 text-center text-sm text-muted-foreground'>
                                            {t.addressBook?.noContactsFound ||
                                              'No contacts found'}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size='sm'
                                    className='h-8 w-8 rounded-md bg-purple-600 p-0 hover:bg-purple-700'
                                    onClick={() => {
                                      if (!selectedSharedIban) return;
                                      const name =
                                        (
                                          splitInputValues[entry.name] ??
                                          entry.name
                                        ).trim() || entry.name;

                                      resolveSharedMutation.mutate(
                                        {
                                          iban: selectedSharedIban.iban,
                                          name,
                                          originalNames: [entry.name],
                                        },
                                        {
                                          onSuccess: () => {
                                            // Remove this entry from the group
                                            setSharedIbanGroups(
                                              (prev) =>
                                                prev
                                                  .map((g) => {
                                                    if (g.id !== group.id)
                                                      return g;
                                                    const newEntries =
                                                      g.entries.filter(
                                                        (_, i) => i !== entryIdx
                                                      );
                                                    if (newEntries.length === 0)
                                                      return null;
                                                    return {
                                                      ...g,
                                                      entries: newEntries,
                                                    };
                                                  })
                                                  .filter(
                                                    Boolean
                                                  ) as typeof prev
                                            );
                                            // Clean up the input value for this entry
                                            setSplitInputValues((prev) => {
                                              const newValues = { ...prev };
                                              delete newValues[entry.name];
                                              return newValues;
                                            });
                                          },
                                        }
                                      );
                                    }}
                                    disabled={resolveSharedMutation.isPending}
                                  >
                                    <Plus className='h-4 w-4' />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {t.addressBook?.addToAddressBook ||
                                    'Add to address book'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  // Multi-entry group (not split) - show grouped with merge option
                  if (isMultiEntry) {
                    return (
                      <div
                        key={group.id}
                        className='rounded-lg border-2 border-dashed border-purple-300 bg-purple-50/50 p-3 dark:border-purple-700 dark:bg-purple-950/20'
                      >
                        <div className='mb-3 flex items-center justify-between gap-2'>
                          <div className='flex items-center gap-2'>
                            <Users className='h-4 w-4 text-purple-600' />
                            <span className='text-sm font-medium text-purple-700 dark:text-purple-300'>
                              Mogelijk dezelfde ({group.entries.length}{' '}
                              varianten, {totalTransactions} transacties)
                            </span>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-muted-foreground hover:bg-purple-600 hover:text-white'
                            onClick={() => {
                              setSharedIbanGroups((prev) =>
                                prev.map((g) =>
                                  g.id === group.id
                                    ? { ...g, isSplit: true }
                                    : g
                                )
                              );
                            }}
                          >
                            <Scissors className='mr-1 h-4 w-4' />
                            Splitsen
                          </Button>
                        </div>

                        {/* Show entry names as tags */}
                        <div className='mb-3 flex flex-wrap gap-1.5'>
                          {group.entries.map((entry, idx) => (
                            <span
                              key={idx}
                              className='rounded border bg-white px-2 py-1 text-xs dark:bg-card'
                            >
                              {entry.name}{' '}
                              <span className='text-muted-foreground'>
                                ({entry.transactionCount})
                              </span>
                            </span>
                          ))}
                        </div>

                        {/* Single input for merged name */}
                        <div className='flex items-center gap-2'>
                          <Input
                            value={group.editedName}
                            onChange={(e) => {
                              setSharedIbanGroups((prev) =>
                                prev.map((g) =>
                                  g.id === group.id
                                    ? { ...g, editedName: e.target.value }
                                    : g
                                )
                              );
                            }}
                            className='h-9 flex-1'
                            placeholder='Naam voor adresboek'
                          />
                          <Button
                            className='bg-purple-600 hover:bg-purple-700'
                            onClick={() => {
                              if (
                                !selectedSharedIban ||
                                !group.editedName.trim()
                              )
                                return;

                              // Get all original names from this group
                              const originalNames = group.entries.map(
                                (e) => e.name
                              );

                              resolveSharedMutation.mutate(
                                {
                                  iban: selectedSharedIban.iban,
                                  name: group.editedName.trim(),
                                  originalNames,
                                },
                                {
                                  onSuccess: () => {
                                    // Remove this group
                                    setSharedIbanGroups((prev) =>
                                      prev.filter((g) => g.id !== group.id)
                                    );
                                  },
                                }
                              );
                            }}
                            disabled={
                              !group.editedName.trim() ||
                              resolveSharedMutation.isPending
                            }
                          >
                            <Merge className='mr-1 h-4 w-4' />
                            Samenvoegen
                          </Button>
                        </div>

                        <p className='mt-2 text-xs text-muted-foreground'>
                          Alle {group.entries.length} varianten worden
                          samengevoegd onder deze naam.
                        </p>
                      </div>
                    );
                  }

                  // Single entry (no grouping needed)
                  return (
                    <div
                      key={group.id}
                      className='flex items-center gap-3 rounded-lg border bg-card p-3'
                    >
                      <div className='min-w-0 flex-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='font-medium'>
                            {group.entries[0].name}
                          </span>
                          <span className='text-xs text-muted-foreground'>
                            ({group.entries[0].transactionCount}{' '}
                            {group.entries[0].transactionCount === 1
                              ? 'transactie'
                              : 'transacties'}
                            )
                          </span>
                        </div>
                        <div className='mt-2'>
                          <Input
                            value={group.editedName}
                            onChange={(e) => {
                              setSharedIbanGroups((prev) =>
                                prev.map((g) =>
                                  g.id === group.id
                                    ? { ...g, editedName: e.target.value }
                                    : g
                                )
                              );
                            }}
                            className='h-8 text-sm'
                            placeholder='Naam voor adresboek'
                          />
                        </div>
                      </div>
                      <Button
                        size='sm'
                        className='bg-purple-600 hover:bg-purple-700'
                        onClick={() => {
                          if (!selectedSharedIban || !group.editedName.trim())
                            return;

                          resolveSharedMutation.mutate(
                            {
                              iban: selectedSharedIban.iban,
                              name: group.editedName.trim(),
                              originalNames: [group.entries[0].name],
                            },
                            {
                              onSuccess: () => {
                                // Remove this group
                                setSharedIbanGroups((prev) =>
                                  prev.filter((g) => g.id !== group.id)
                                );
                              },
                            }
                          );
                        }}
                        disabled={
                          !group.editedName.trim() ||
                          resolveSharedMutation.isPending
                        }
                      >
                        <Plus className='mr-1 h-4 w-4' />
                        {t.transactions.addButton || 'Add'}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  setSharedIbanModalOpen(false);
                  setSelectedSharedIban(null);
                  setSharedIbanGroups([]);
                }}
              >
                Sluiten
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rule Creation Modal */}
        <Dialog
          open={ruleModalOpen}
          onOpenChange={(open) => {
            setRuleModalOpen(open);
            if (!open) {
              setRelatedTransactions([]);
              setSelectedRelatedIds(new Set());
              setPendingRuleTransaction(null);
            }
          }}
        >
          <DialogContent className='max-w-lg'>
            <DialogHeader>
              <DialogTitle>
                {t.transactions.createRuleTitle || 'Create category rule'}
              </DialogTitle>
              <DialogDescription>
                {t.transactions.createRuleDescription ||
                  'Would you like to create a rule so transactions with a similar name are automatically categorized?'}
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              {/* Related transactions section */}
              {relatedTransactions.length > 0 && (
                <div className='space-y-3 rounded-lg border bg-muted/30 p-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>
                      {(
                        t.transactions?.applyToRelated ||
                        'Ook toepassen op {count} gerelateerde transacties'
                      ).replace('{count}', String(relatedTransactions.length))}
                    </span>
                    {selectedRelatedIds.size > 0 && (
                      <span className='text-xs text-muted-foreground'>
                        {selectedRelatedIds.size}{' '}
                        {t.common?.selected || 'geselecteerd'}
                      </span>
                    )}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {t.transactions?.relatedTransactionsDescription ||
                      'Deze transacties hebben dezelfde tegenrekening of naam. Selecteer welke je ook wilt categoriseren.'}
                  </p>
                  <div className='max-h-64 space-y-2 overflow-y-auto'>
                    <table className='w-full'>
                      <thead className='sticky top-0 bg-muted/80 backdrop-blur-sm'>
                        <tr className='text-left text-xs text-muted-foreground'>
                          <th className='w-8 pb-2'>
                            <Checkbox
                              checked={
                                selectedRelatedIds.size ===
                                relatedTransactions.length
                              }
                              indeterminate={
                                selectedRelatedIds.size > 0 &&
                                selectedRelatedIds.size <
                                  relatedTransactions.length
                              }
                              onChange={(e) => {
                                const target = e.target as HTMLInputElement;
                                if (target.checked) {
                                  setSelectedRelatedIds(
                                    new Set(
                                      relatedTransactions.map((tx) => tx.id)
                                    )
                                  );
                                } else {
                                  setSelectedRelatedIds(new Set());
                                }
                              }}
                            />
                          </th>
                          <th className='pb-2'>
                            {t.categories?.name || 'Naam'}
                          </th>
                          <th className='pb-2 text-right'>
                            {t.transactions.amount}
                          </th>
                          <th className='w-24 pb-2'>
                            {t.budgets?.category || 'Categorie'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-border/50'>
                        {relatedTransactions.map((rt) => (
                          <tr
                            key={rt.id}
                            className='cursor-pointer text-sm hover:bg-muted/50'
                            onClick={() => {
                              const newSet: Set<string> = new Set(
                                selectedRelatedIds
                              );
                              if (selectedRelatedIds.has(rt.id)) {
                                newSet.delete(rt.id);
                              } else {
                                newSet.add(rt.id);
                              }
                              setSelectedRelatedIds(newSet);
                            }}
                          >
                            <td className='py-2'>
                              <Checkbox
                                checked={selectedRelatedIds.has(rt.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const target = e.target as HTMLInputElement;
                                  const newSet: Set<string> = new Set(
                                    selectedRelatedIds
                                  );
                                  if (target.checked) {
                                    newSet.add(rt.id);
                                  } else {
                                    newSet.delete(rt.id);
                                  }
                                  setSelectedRelatedIds(newSet);
                                }}
                              />
                            </td>
                            <td className='max-w-[200px] py-2'>
                              <div className='truncate'>
                                {rt.merchantName ||
                                  rt.opposingAccountName ||
                                  rt.description}
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                {formatDate(rt.date)}
                              </div>
                            </td>
                            <td
                              className={`py-2 text-right ${
                                rt.amount > 0
                                  ? 'text-emerald-600'
                                  : 'text-rose-600'
                              }`}
                            >
                              <Currency amount={rt.amount} />
                            </td>
                            <td className='py-2'>
                              {rt.categoryId ? (
                                <span className='rounded bg-muted px-1.5 py-0.5 text-xs'>
                                  {categories?.find(
                                    (c) => c.id === rt.categoryId
                                  )?.name || '...'}
                                </span>
                              ) : (
                                <span className='text-xs text-muted-foreground italic'>
                                  {t.common?.none || 'Geen'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Rule pattern section */}
              <div className='space-y-2'>
                <label className='text-sm font-medium'>
                  {t.transactions.searchPattern || 'Search pattern'}
                </label>
                <Input
                  value={rulePattern}
                  onChange={(e) => setRulePattern(e.target.value)}
                  placeholder={
                    t.transactions.searchPatternPlaceholder ||
                    'Search pattern for merchant name...'
                  }
                />
                <p className='text-xs text-muted-foreground'>
                  {t.transactions.searchPatternHelp ||
                    'Transactions with this pattern in the name will be automatically categorized'}
                </p>

                {/* Existing rule indicator */}
                {(() => {
                  const existingRule = findExistingRule(rulePattern);
                  if (existingRule) {
                    const existingCategory = categories?.find(
                      (c) => String(c.id) === String(existingRule.categoryId)
                    );
                    return (
                      <div className='flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200'>
                        <AlertCircle className='h-4 w-4 flex-shrink-0' />
                        <span className='text-xs'>
                          {(
                            t.transactions.ruleExistsInCategory ||
                            'A rule for "{pattern}" already exists in {category}'
                          )
                            .replace('{pattern}', rulePattern)
                            .replace(
                              '{category}',
                              existingCategory?.name ||
                                t.transactions?.unknownCategory ||
                                'Unknown category'
                            )}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
            <DialogFooter className='flex gap-2'>
              <Button variant='outline' onClick={handleSkipRule}>
                {relatedTransactions.length > 0 && selectedRelatedIds.size > 0
                  ? t.transactions?.applyWithoutRule || 'Toepassen zonder regel'
                  : t.transactions.skipButton || 'Skip'}
              </Button>
              <Button
                onClick={handleCreateRule}
                disabled={
                  createRuleMutation.isPending ||
                  !rulePattern.trim() ||
                  !!findExistingRule(rulePattern)
                }
              >
                {t.transactions.createRuleButton || 'Create rule'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transfer Toggle Modal - for applying to related transactions */}
        <Dialog
          open={transferModalOpen}
          onOpenChange={(open) => {
            setTransferModalOpen(open);
            if (!open) {
              setTransferRelatedTransactions([]);
              setSelectedTransferRelatedIds(new Set());
              setPendingTransferTransaction(null);
            }
          }}
        >
          <DialogContent className='max-w-lg'>
            <DialogHeader>
              <DialogTitle>
                {isMarkingAsTransfer
                  ? t.transactions?.markAsTransferTitle ||
                    'Markeren als overboeking'
                  : t.transactions?.removeTransferTitle ||
                    'Overboeking markering verwijderen'}
              </DialogTitle>
              <DialogDescription>
                {isMarkingAsTransfer
                  ? t.transactions?.markAsTransferDescription ||
                    'Er zijn gerelateerde transacties gevonden. Wil je deze ook markeren als overboeking?'
                  : t.transactions?.removeTransferDescription ||
                    'Er zijn gerelateerde transacties gevonden. Wil je de overboeking markering ook verwijderen?'}
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div className='space-y-3 rounded-lg border bg-muted/30 p-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>
                    {(
                      t.transactions?.relatedTransactionsFound ||
                      '{count} gerelateerde transacties gevonden'
                    ).replace(
                      '{count}',
                      String(transferRelatedTransactions.length)
                    )}
                  </span>
                  {selectedTransferRelatedIds.size > 0 && (
                    <span className='text-xs text-muted-foreground'>
                      {selectedTransferRelatedIds.size}{' '}
                      {t.common?.selected || 'geselecteerd'}
                    </span>
                  )}
                </div>
                <div className='max-h-64 space-y-2 overflow-y-auto'>
                  <table className='w-full'>
                    <thead className='sticky top-0 bg-muted/80 backdrop-blur-sm'>
                      <tr className='text-left text-xs text-muted-foreground'>
                        <th className='w-8 pb-2'>
                          <Checkbox
                            checked={
                              selectedTransferRelatedIds.size ===
                              transferRelatedTransactions.length
                            }
                            indeterminate={
                              selectedTransferRelatedIds.size > 0 &&
                              selectedTransferRelatedIds.size <
                                transferRelatedTransactions.length
                            }
                            onChange={(e) => {
                              const target = e.target as HTMLInputElement;
                              if (target.checked) {
                                setSelectedTransferRelatedIds(
                                  new Set(
                                    transferRelatedTransactions.map(
                                      (tx) => tx.id
                                    )
                                  )
                                );
                              } else {
                                setSelectedTransferRelatedIds(new Set());
                              }
                            }}
                          />
                        </th>
                        <th className='pb-2'>{t.categories?.name || 'Naam'}</th>
                        <th className='pb-2 text-right'>
                          {t.transactions.amount}
                        </th>
                        <th className='w-20 pb-2'>
                          {t.transactions?.type || 'Type'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-border/50'>
                      {pendingTransferTransaction && (
                        <tr className='bg-muted/20 text-sm hover:bg-muted/50'>
                          <td className='py-2'>
                            <Checkbox checked disabled />
                          </td>
                          <td className='max-w-[200px] py-2'>
                            <div className='truncate font-medium'>
                              {pendingTransferTransaction.merchantName ||
                                pendingTransferTransaction.opposingAccountName ||
                                pendingTransferTransaction.description}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              {formatDate(pendingTransferTransaction.date)}
                            </div>
                          </td>
                          <td
                            className={`py-2 text-right ${
                              pendingTransferTransaction.type === 'transfer'
                                ? 'text-blue-600'
                                : pendingTransferTransaction.amount > 0
                                  ? 'text-emerald-600'
                                  : 'text-rose-600'
                            }`}
                          >
                            <Currency
                              amount={pendingTransferTransaction.amount}
                            />
                          </td>
                          <td className='py-2'>
                            <span
                              className={cn(
                                'rounded px-1.5 py-0.5 text-xs',
                                pendingTransferTransaction.type === 'transfer'
                                  ? 'bg-blue-100 text-blue-700'
                                  : pendingTransferTransaction.amount > 0
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-rose-100 text-rose-700'
                              )}
                            >
                              {pendingTransferTransaction.type === 'transfer'
                                ? t.transactions?.transfer || 'Overboeking'
                                : pendingTransferTransaction.type === 'income'
                                  ? t.transactions?.income || 'Inkomst'
                                  : t.transactions?.expense || 'Uitgave'}
                            </span>
                          </td>
                        </tr>
                      )}
                      {transferRelatedTransactions.map((rt) => (
                        <tr
                          key={rt.id}
                          className='cursor-pointer text-sm hover:bg-muted/50'
                          onClick={() => {
                            const newSet = new Set(selectedTransferRelatedIds);
                            if (selectedTransferRelatedIds.has(rt.id)) {
                              newSet.delete(rt.id);
                            } else {
                              newSet.add(rt.id);
                            }
                            setSelectedTransferRelatedIds(newSet);
                          }}
                        >
                          <td className='py-2'>
                            <Checkbox
                              checked={selectedTransferRelatedIds.has(rt.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                const target = e.target as HTMLInputElement;
                                const newSet = new Set(
                                  selectedTransferRelatedIds
                                );
                                if (target.checked) {
                                  newSet.add(rt.id);
                                } else {
                                  newSet.delete(rt.id);
                                }
                                setSelectedTransferRelatedIds(newSet);
                              }}
                            />
                          </td>
                          <td className='max-w-[200px] py-2'>
                            <div className='truncate'>
                              {rt.merchantName ||
                                rt.opposingAccountName ||
                                rt.description}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              {formatDate(rt.date)}
                            </div>
                          </td>
                          <td
                            className={`py-2 text-right ${
                              rt.type === 'transfer'
                                ? 'text-blue-600'
                                : rt.amount > 0
                                  ? 'text-emerald-600'
                                  : 'text-rose-600'
                            }`}
                          >
                            <Currency amount={rt.amount} />
                          </td>
                          <td className='py-2'>
                            <span
                              className={cn(
                                'rounded px-1.5 py-0.5 text-xs',
                                rt.type === 'transfer'
                                  ? 'bg-blue-100 text-blue-700'
                                  : rt.type === 'income'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-rose-100 text-rose-700'
                              )}
                            >
                              {rt.type === 'transfer'
                                ? t.transactions?.transfer || 'Overboeking'
                                : rt.type === 'income'
                                  ? t.transactions?.income || 'Inkomst'
                                  : t.transactions?.expense || 'Uitgave'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <DialogFooter className='flex flex-col gap-2 sm:flex-row'>
              {isMarkingAsTransfer && (
                <Button
                  variant='secondary'
                  onClick={() => detectInternalTransfersMutation.mutate()}
                  disabled={detectInternalTransfersMutation.isPending}
                >
                  {t.transactions?.applyToAllData || 'Toepassen op alle data'}
                </Button>
              )}
              <Button
                onClick={handleApplyTransferToRelated}
                disabled={updateMutation.isPending}
              >
                {(
                  t.transactions?.applyToSelected ||
                  'Toepassen op {count} transacties'
                ).replace(
                  '{count}',
                  String(1 + selectedTransferRelatedIds.size)
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
