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
import { api } from '@/lib/api';
import {
  formatCurrency,
  formatDate,
  cn,
  findSimilarNameGroups,
} from '@/lib/utils';

// Filters on this page are intentionally local to the Transactions view.
// This prevents Dashboard/Analytics filters (global) from affecting Transactions and vice versa.
type TransactionTypeFilter = 'all' | 'income' | 'expense' | 'transfer';
import { useFilterParams, useFilters } from '@/contexts/FilterContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';

interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  description: string;
  merchantName: string | null;
  categoryId: string | null;
  paymentMethod: string | null;
  notes: string | null;
  opposingAccountIban: string | null;
  opposingAccountName: string | null;
  paymentProvider: string | null;
  addressBookId: string | null;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  parentId: string | null;
}

interface CategorySuggestion {
  categoryId: string | null;
  categoryName: string | null;
  confidence: number;
}

interface AddressBookEntry {
  id: string;
  iban: string;
  name: string;
  description: string | null;
  originalName?: string | null; // Original name from transaction (for shared IBAN merchants)
  originalNames?: string[]; // Legacy: array of original names
  ibans?: string[]; // All IBANs associated with this contact
}

interface Account {
  id: string;
  iban: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  bank: string;
  currentBalance: number;
  balance?: number;
}

export default function Transactions() {
  const { t, language: _language } = useLanguage();
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
  const [suggestions, setSuggestions] = useState<
    Record<string, CategorySuggestion>
  >({});
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

  const { data: addressBook, isLoading: addressBookLoading } = useQuery<
    AddressBookEntry[]
  >({
    queryKey: ['addressbook', activeProfileId],
    queryFn: () => api.getAddressBook() as Promise<AddressBookEntry[]>,
    staleTime: 60 * 1000, // 1 minute - addressBook may change but not often
    enabled: needsAddressBook, // Lazy load - only fetch when needed
  });

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
  interface SharedIban {
    iban: string;
    merchantCount: number;
    merchants: Array<{ name: string; transactionCount: number }>;
    inAddressBook: boolean;
    isMarkedShared: boolean;
    isPartiallyResolved: boolean;
    providerName: string | null;
    isKnownProvider: boolean;
    knownProviderName: string | null;
  }
  const { data: sharedIbans = [], isLoading: _sharedIbansLoading } = useQuery<
    SharedIban[]
  >({
    queryKey: ['sharedIbans', activeProfileId],
    queryFn: () => api.getSharedIbans() as Promise<SharedIban[]>,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

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

  // Cache for suggestions to avoid refetching same merchant names
  const suggestionsCache = useRef<Map<string, CategorySuggestion | null>>(
    new Map()
  );

  // Track last fetch time to prevent rapid re-fetching
  const lastFetchRef = useRef<number>(0);
  // Track the last transactions length to avoid re-processing same data
  const lastTransactionsLengthRef = useRef<number>(0);

  useEffect(() => {
    if (!transactions) return;

    // Skip if transactions length hasn't changed significantly
    // This prevents re-running when just filters change but data is same
    const currentLength = transactions.length;
    if (
      lastTransactionsLengthRef.current === currentLength &&
      currentLength > 0
    ) {
      return;
    }
    lastTransactionsLengthRef.current = currentLength;

    // Prevent rapid re-fetching (minimum 2 second gap between fetches)
    const now = Date.now();
    if (now - lastFetchRef.current < 2000) return;

    const uncategorized = transactions.filter(
      (tx) => !tx.categoryId && tx.merchantName
    );

    // Build initial suggestions from cache
    const newSuggestions: Record<string, CategorySuggestion> = {};
    const merchantsToFetch: Array<{ txId: string; merchantName: string }> = [];

    // Only process first 10 uncategorized transactions to reduce API calls
    for (const tx of uncategorized.slice(0, 10)) {
      if (!tx.merchantName) continue;

      const cached = suggestionsCache.current.get(tx.merchantName);
      if (cached !== undefined) {
        if (cached) {
          newSuggestions[tx.id] = cached;
        }
      } else {
        merchantsToFetch.push({ txId: tx.id, merchantName: tx.merchantName });
      }
    }

    // Apply cached suggestions immediately
    if (Object.keys(newSuggestions).length > 0) {
      setSuggestions((prev) => ({ ...prev, ...newSuggestions }));
    }

    // Limit to 5 API calls at a time for better performance
    const toFetch = merchantsToFetch.slice(0, 5);
    if (toFetch.length === 0) return;

    const timeoutId = setTimeout(async () => {
      lastFetchRef.current = Date.now();
      const fetched: Record<string, CategorySuggestion> = {};

      // Fetch in parallel but limit concurrency
      await Promise.all(
        toFetch.map(async ({ txId, merchantName }) => {
          try {
            const suggestion = (await api.suggestCategory(
              merchantName
            )) as CategorySuggestion | null;
            suggestionsCache.current.set(merchantName, suggestion);
            if (suggestion) {
              fetched[txId] = suggestion;
            }
          } catch {
            // Cache the failure too to avoid retrying
            suggestionsCache.current.set(merchantName, null);
          }
        })
      );

      if (Object.keys(fetched).length > 0) {
        setSuggestions((prev) => ({ ...prev, ...fetched }));
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [transactions]);

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
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: {
      iban: string;
      name: string;
      description?: string;
      notes?: string;
      transactionId?: string;
    }) => {
      // First create the address book entry
      const result = await api.createAddressBookEntry(data);
      // Then link the transaction to the new address book entry if a transactionId was provided
      // Support both direct return format and potentially wrapped format
      const contactId =
        (result as { data?: { id: string } }).data?.id ||
        (result as { id?: string }).id;
      if (data.transactionId && contactId) {
        await api.updateTransaction(data.transactionId, {
          addressBookId: contactId,
        });
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['addressbook', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });
      setAccountModalOpen(false);
      setAccountModalIban('');
      setAccountModalName('');
      toast.success(t.transactions.savedToAddressBook);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create contact');
    },
  });

  const resolveSharedMutation = useMutation({
    mutationFn: ({
      iban,
      name,
      originalNames,
      contactId,
    }: {
      iban: string;
      name: string;
      originalNames: string[];
      contactId?: string;
    }) => api.resolveSharedIban(iban, name, originalNames, contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sharedIbans', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['addressbook', activeProfileId],
      });
      toast.success('Toegevoegd aan adresboek');
    },
  });

  // Mutation for adding IBAN to existing contact
  const addIbanToContactMutation = useMutation({
    mutationFn: ({ contactId, iban }: { contactId: string; iban: string }) =>
      api.addContactIban(contactId, iban),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['addressbook', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['sharedIbans', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });
      setAssignPopoverOpen(null);
      setAssignSearchTerm('');
      toast.success(t.apiErrors?.ibanAddedToContact || 'Added to contact');
    },
  });

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

    setSuggestions((prev) => {
      const next = { ...prev };
      delete next[tx.id];
      return next;
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

    setSuggestions((prev) => {
      const next = { ...prev };
      delete next[tx.id];
      return next;
    });
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
      <div className='space-y-6'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold'>{t.transactions.title}</h1>
            <p className='mt-1 text-muted-foreground'>
              {t.transactions.subtitle}
            </p>
          </div>

          {/* Account Balance Cards - Same as Dashboard */}
          {accounts && accounts.length > 0 && (
            <div
              className='flex items-center gap-2'
              data-onboarding='transaction-accounts'
            >
              {accounts.length > 3 && (
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() =>
                    setAccountScrollIndex(Math.max(0, accountScrollIndex - 1))
                  }
                  disabled={accountScrollIndex === 0}
                  className='h-8 w-8'
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>
              )}

              <div className='flex gap-3'>
                {accounts
                  .slice(accountScrollIndex, accountScrollIndex + 3)
                  .map((account) => {
                    const balance = account.currentBalance || 0;

                    // Color logic: checking accounts are green/red based on balance, savings are blue
                    const getAccountColors = (
                      type: string,
                      balance: number
                    ) => {
                      if (type === 'checking') {
                        return balance >= 0
                          ? {
                              bg: 'bg-emerald-50 dark:bg-emerald-950',
                              text: 'text-emerald-600',
                            }
                          : {
                              bg: 'bg-red-50 dark:bg-red-950',
                              text: 'text-red-600',
                            };
                      } else if (type === 'savings') {
                        return {
                          bg: 'bg-blue-50 dark:bg-blue-950',
                          text: 'text-blue-600',
                        };
                      } else {
                        return {
                          bg: 'bg-gray-50 dark:bg-gray-950',
                          text: 'text-gray-600',
                        };
                      }
                    };

                    const colors = getAccountColors(account.type, balance);

                    return (
                      <div
                        key={account.id}
                        className='flex min-w-0 items-center gap-3 rounded-lg border bg-card px-4 py-2 shadow-sm'
                      >
                        <div className={`rounded-full p-2 ${colors.bg}`}>
                          {account.type === 'checking' && (
                            <Wallet className={`h-4 w-4 ${colors.text}`} />
                          )}
                          {account.type === 'savings' && (
                            <PiggyBank className={`h-4 w-4 ${colors.text}`} />
                          )}
                          {account.type === 'credit' && (
                            <CreditCard className={`h-4 w-4 ${colors.text}`} />
                          )}
                        </div>
                        <div className='min-w-0'>
                          <p className='truncate text-xs text-muted-foreground'>
                            {account.name}
                          </p>
                          <p className='font-semibold'>
                            {formatCurrency(balance)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {accounts.length > 3 && (
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() =>
                    setAccountScrollIndex(
                      Math.min(accounts.length - 3, accountScrollIndex + 1)
                    )
                  }
                  disabled={accountScrollIndex >= accounts.length - 3}
                  className='h-8 w-8'
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Summary Cards - Same as Dashboard */}
        <div
          className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'
          data-onboarding='transaction-summary'
        >
          <Card className='card-hover h-full'>
            <CardContent className='flex h-full flex-col justify-between p-6'>
              <div className='flex items-center justify-between'>
                <div className='mr-4 min-w-0 flex-1'>
                  <p className='text-sm text-muted-foreground'>
                    {t.dashboard.income}
                  </p>
                  <p className='mt-1 whitespace-nowrap text-2xl font-bold'>
                    {formatCurrency(totals.income)}
                  </p>
                </div>
                <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30'>
                  <ArrowUpRight className='h-6 w-6 text-emerald-600' />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className='card-hover h-full'>
            <CardContent className='flex h-full flex-col justify-between p-6'>
              <div className='flex items-center justify-between'>
                <div className='mr-4 min-w-0 flex-1'>
                  <p className='text-sm text-muted-foreground'>
                    {t.dashboard.expenses}
                  </p>
                  <p className='mt-1 whitespace-nowrap text-2xl font-bold'>
                    {formatCurrency(totals.expenses)}
                  </p>
                </div>
                <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30'>
                  <ArrowDownRight className='h-6 w-6 text-rose-600' />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className='card-hover h-full'>
            <CardContent className='flex h-full flex-col justify-between p-6'>
              <div className='flex items-center justify-between'>
                <div className='mr-4 min-w-0 flex-1'>
                  <p className='text-sm text-muted-foreground'>
                    {t.dashboard.toSavings}
                  </p>
                  <p className='mt-1 whitespace-nowrap text-2xl font-bold'>
                    {formatCurrency(totals.netSavingsTransfer)}
                  </p>
                  <p className='mt-1 whitespace-nowrap text-xs text-muted-foreground'>
                    +{formatCurrency(totals.transferToSavings)} / -
                    {formatCurrency(totals.transferFromSavings)}
                  </p>
                </div>
                <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30'>
                  <PiggyBank className='h-6 w-6 text-blue-600' />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className='card-hover h-full'>
            <CardContent className='flex h-full flex-col justify-between p-6'>
              <div className='flex items-center justify-between'>
                <div className='mr-4 min-w-0 flex-1'>
                  <p className='text-sm text-muted-foreground'>
                    {t.dashboard.netResult}
                  </p>
                  <p
                    className={cn(
                      'mt-1 whitespace-nowrap text-2xl font-bold',
                      totals.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    )}
                  >
                    {formatCurrency(totals.balance)}
                  </p>
                </div>
                <div
                  className={cn(
                    'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full',
                    totals.balance >= 0
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : 'bg-rose-100 dark:bg-rose-900/30'
                  )}
                >
                  <Wallet
                    className={cn(
                      'h-6 w-6',
                      totals.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card data-onboarding='transaction-filters'>
          <CardContent className='p-4'>
            <div className='flex flex-wrap gap-4'>
              <div
                className='min-w-[200px] flex-1'
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
                className='flex gap-2'
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

        {/* Transactions List */}
        <Card data-onboarding='transaction-list'>
          <CardHeader className='flex flex-row items-center justify-between gap-4 space-y-0'>
            <div className='min-w-0 flex-1'>
              <CardTitle className='flex items-center gap-2'>
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
          <CardContent>
            {/* Show skeleton during:
                1. Initial load (isLoading)
                2. Fetching with no data yet
                3. Actively fetching after filter changes (prevents "flash of empty state")
                Note: We check isPending (from useTransition) OR isFetching to catch filter changes */}
            {isLoading ||
            (isFetching && (!transactions?.length || isPending)) ? (
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
                    const paymentInfo = getPaymentMethodInfo(tx.paymentMethod);
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

                    return (
                      <div
                        key={tx.id}
                        className='rounded-lg border'
                        data-onboarding='transaction-row'
                      >
                        <div
                          className={cn(
                            'group flex items-center justify-between rounded-lg p-4 transition-colors hover:bg-muted/50',
                            recurring && 'cursor-pointer'
                          )}
                          onClick={() => {
                            if (recurring) {
                              startTransition(() => {
                                setExpandedMerchant(
                                  isExpanded ? null : `${merchantKey}-${tx.id}`
                                );
                              });
                            }
                          }}
                        >
                          <div className='flex min-w-0 flex-1 items-center gap-4'>
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
                                                className='absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 rounded-md p-0 text-muted-foreground hover:bg-purple-600 hover:text-white'
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
                                            disabled={updateMutation.isPending}
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
                                            disabled={updateMutation.isPending}
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
                                            className='flex-shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-colors hover:bg-muted focus:opacity-100 group-hover:opacity-100'
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
                                            {t.transactions.editTransactionName}
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
                                categoryColor={getCategoryColor(tx.categoryId)}
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
                              {formatCurrency(tx.amount)}
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
                                  {formatCurrency(historyTotal)}
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
                                        {formatCurrency(h.amount)}
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
                                const hiddenAfter = history.length - endIdx - 1;

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
              </>
            ) : hasActiveFilters ? (
              <div className='py-12 text-center'>
                <Search className='mx-auto mb-4 h-12 w-12 text-muted-foreground/50' />
                <h3 className='text-lg font-medium'>
                  {t.transactions.noTransactionsFound}
                </h3>
                <p className='mx-auto mt-2 max-w-xs text-muted-foreground'>
                  {t.transactions.adjustFilters}
                </p>
                <Button
                  variant='ghost'
                  className='mt-4 text-purple-600 hover:bg-purple-600 hover:text-white dark:text-purple-400 dark:hover:bg-purple-600 dark:hover:text-white'
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
              </div>
            ) : (
              // Empty state when NO filters are active - show "Import" CTA
              <div className='flex flex-col items-center justify-center py-12 text-center'>
                <History className='mx-auto mb-4 h-12 w-12 text-muted-foreground/50' />
                <h3 className='text-lg font-medium text-muted-foreground'>
                  {t.transactions.noTransactions || 'Nog geen transacties'}
                </h3>
                <p className='mt-2 text-sm text-muted-foreground'>
                  {t.transactions.importTransactions ||
                    'Importeer je eerste transacties om te beginnen.'}
                </p>
                <Button
                  onClick={() => navigate('/import/')}
                  variant='link'
                  className='mt-2 text-primary hover:underline'
                >
                  {t.transactions.goToImport || 'Ga naar importeren'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

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
                        {formatCurrency(createContactTransaction.amount)}
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
                    createAccountMutation.mutate({
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
                          <tr key={rt.id} className='text-sm hover:bg-muted/50'>
                            <td className='py-2'>
                              <Checkbox
                                checked={selectedRelatedIds.has(rt.id)}
                                onChange={(e) => {
                                  const target = e.target as HTMLInputElement;
                                  const newSet = new Set(selectedRelatedIds);
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
                              {formatCurrency(rt.amount)}
                            </td>
                            <td className='py-2'>
                              {rt.categoryId ? (
                                <span className='rounded bg-muted px-1.5 py-0.5 text-xs'>
                                  {categories?.find(
                                    (c) => c.id === rt.categoryId
                                  )?.name || '...'}
                                </span>
                              ) : (
                                <span className='text-xs italic text-muted-foreground'>
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
                      (c) => Number(c.id) === Number(existingRule.categoryId)
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
                            {formatCurrency(pendingTransferTransaction.amount)}
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
                        <tr key={rt.id} className='text-sm hover:bg-muted/50'>
                          <td className='py-2'>
                            <Checkbox
                              checked={selectedTransferRelatedIds.has(rt.id)}
                              onChange={(e) => {
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
                            {formatCurrency(rt.amount)}
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
