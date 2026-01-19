import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useFilterParams, useFilters } from '@/contexts/FilterContext';
import { useProfile } from '@/contexts/ProfileContext';
import { api } from '@/lib/api';
import { findSimilarNameGroups } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

import type {
  Transaction,
  Category,
  CategorySuggestion,
  AddressBookEntry,
  Account,
  SharedIban,
  SharedIbanGroup,
  CategoryRule,
  TransactionTypeFilter,
} from '@fluxby/shared';

// ============================================================================
// Search State Hook
// ============================================================================

export function useSearchState() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return { search, setSearch, debouncedSearch };
}

// ============================================================================
// Filter State Hook
// ============================================================================

export function useFilterState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    filters,
    setCategories,
    setOpposingAccountIbans,
    setOpposingAccountName,
    setAddressBookId,
    setDateRange,
    setTransactionType: setContextTransactionType,
  } = useFilters();

  // Transaction type filter with debouncing
  const [transactionType, setTransactionType] = useState<TransactionTypeFilter>(
    filters.transactionType || 'all'
  );
  const [debouncedType, setDebouncedType] = useState<TransactionTypeFilter>(
    filters.transactionType || 'all'
  );

  // Category filter
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

  // Payment filters
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<
    string[]
  >([]);
  const [selectedPaymentProcessors, setSelectedPaymentProcessors] = useState<
    string[]
  >([]);

  // Filter dropdown open states
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);
  const [typeFilterOpen, setTypeFilterOpen] = useState(false);
  const [addressBookFilterOpen, setAddressBookFilterOpen] = useState(false);
  const [paymentMethodFilterOpen, setPaymentMethodFilterOpen] = useState(false);
  const [paymentProcessorFilterOpen, setPaymentProcessorFilterOpen] =
    useState(false);

  // Search states for filter dropdowns with debouncing
  const [categorySearch, setCategorySearch] = useState('');
  const [debouncedCategorySearch, setDebouncedCategorySearch] = useState('');
  const [addressBookSearch, setAddressBookSearch] = useState('');
  const [debouncedAddressBookSearch, setDebouncedAddressBookSearch] =
    useState('');
  const [addressBookVisibleCount, setAddressBookVisibleCount] = useState(20);
  const [addressBookFilterOpened, setAddressBookFilterOpened] = useState(false);

  // Debounce category search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCategorySearch(categorySearch);
    }, 150);
    return () => clearTimeout(timer);
  }, [categorySearch]);

  // Debounce address book search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAddressBookSearch(addressBookSearch);
    }, 150);
    return () => clearTimeout(timer);
  }, [addressBookSearch]);

  // Sync transaction type to debounced value
  useEffect(() => {
    setDebouncedType(transactionType);
  }, [transactionType]);

  // Sync transactionType state with context
  useEffect(() => {
    const contextType = filters.transactionType || 'all';
    setTransactionType(contextType);
    setDebouncedType(contextType);
  }, [filters.transactionType]);

  // Handle clearFilters query param from AddressBook navigation
  useEffect(() => {
    if (searchParams.get('clearFilters') === 'true') {
      setSearchParams({}, { replace: true });
      const end = new Date();
      const start = new Date();
      start.setFullYear(start.getFullYear() - 10);
      setDateRange(start, end);
      setTransactionType('all');
      setDebouncedType('all');
      setContextTransactionType('all');
      setSelectedPaymentMethods([]);
      setSelectedPaymentProcessors([]);
    }
  }, [searchParams, setSearchParams, setDateRange, setContextTransactionType]);

  // Computed filter params for API calls
  const typeParam = debouncedType === 'all' ? undefined : debouncedType;
  const categoryIdsParam =
    selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined;
  const ibansParam = selectedIbans.length > 0 ? selectedIbans : undefined;
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

  const hasActiveFilters =
    transactionType !== 'all' ||
    selectedCategoryIds.length > 0 ||
    selectedIbans.length > 0 ||
    selectedAccountName !== null ||
    selectedAddressBookId !== null ||
    selectedPaymentMethods.length > 0 ||
    selectedPaymentProcessors.length > 0;

  const clearAllFilters = useCallback(() => {
    setTransactionType('all');
    setSelectedCategoryIds([]);
    setSelectedIbans([]);
    setSelectedAccountName(null);
    setSelectedAddressBookId(null);
    setSelectedPaymentMethods([]);
    setSelectedPaymentProcessors([]);
    setCategories([]);
    setOpposingAccountIbans([]);
    setOpposingAccountName(null);
    setAddressBookId(null);
    setContextTransactionType('all');
  }, [
    setCategories,
    setOpposingAccountIbans,
    setOpposingAccountName,
    setAddressBookId,
    setContextTransactionType,
  ]);

  return {
    // Transaction type
    transactionType,
    setTransactionType,
    debouncedType,

    // Category filter
    selectedCategoryIds,
    setSelectedCategoryIds,

    // Address book filter
    selectedIbans,
    setSelectedIbans,
    selectedAccountName,
    setSelectedAccountName,
    selectedAddressBookId,
    setSelectedAddressBookId,

    // Payment filters
    selectedPaymentMethods,
    setSelectedPaymentMethods,
    selectedPaymentProcessors,
    setSelectedPaymentProcessors,

    // Filter dropdown states
    categoryFilterOpen,
    setCategoryFilterOpen,
    typeFilterOpen,
    setTypeFilterOpen,
    addressBookFilterOpen,
    setAddressBookFilterOpen,
    paymentMethodFilterOpen,
    setPaymentMethodFilterOpen,
    paymentProcessorFilterOpen,
    setPaymentProcessorFilterOpen,

    // Filter search states
    categorySearch,
    setCategorySearch,
    debouncedCategorySearch,
    addressBookSearch,
    setAddressBookSearch,
    debouncedAddressBookSearch,
    addressBookVisibleCount,
    setAddressBookVisibleCount,
    addressBookFilterOpened,
    setAddressBookFilterOpened,

    // Computed params
    typeParam,
    categoryIdsParam,
    ibansParam,
    nameParam,
    addressBookIdParam,
    paymentMethodsParam,
    paymentProvidersParam,

    // Helpers
    hasActiveFilters,
    clearAllFilters,

    // Context sync helpers
    setCategories,
    setOpposingAccountIbans,
    setOpposingAccountName,
    setAddressBookId,
    setContextTransactionType,
  };
}

// ============================================================================
// Popover State Hook
// ============================================================================

export function usePopoverState() {
  const [openCategoryPopover, setOpenCategoryPopover] = useState<string | null>(
    null
  );
  const [openAddressBookPopover, setOpenAddressBookPopover] = useState<
    string | null
  >(null);
  const [openPaymentMethodPopover, setOpenPaymentMethodPopover] = useState<
    string | null
  >(null);
  const [openPaymentProcessorPopover, setOpenPaymentProcessorPopover] =
    useState<string | null>(null);

  // Search states for inline popovers
  const [addressBookPopoverSearch, setAddressBookPopoverSearch] = useState('');
  const [categoryPopoverSearch, setCategoryPopoverSearch] = useState('');

  const closeAllPopovers = useCallback(() => {
    setOpenCategoryPopover(null);
    setOpenAddressBookPopover(null);
    setOpenPaymentMethodPopover(null);
    setOpenPaymentProcessorPopover(null);
  }, []);

  return {
    openCategoryPopover,
    setOpenCategoryPopover,
    openAddressBookPopover,
    setOpenAddressBookPopover,
    openPaymentMethodPopover,
    setOpenPaymentMethodPopover,
    openPaymentProcessorPopover,
    setOpenPaymentProcessorPopover,
    addressBookPopoverSearch,
    setAddressBookPopoverSearch,
    categoryPopoverSearch,
    setCategoryPopoverSearch,
    closeAllPopovers,
  };
}

// ============================================================================
// Editing State Hook
// ============================================================================

export function useEditingState() {
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState('');
  const [originalLabelValue, setOriginalLabelValue] = useState('');
  const [expandedMerchant, setExpandedMerchant] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<
    Record<string, CategorySuggestion>
  >({});

  const startEditing = useCallback((id: string, currentValue: string) => {
    setEditingLabelId(id);
    setLabelDraft(currentValue);
    setOriginalLabelValue(currentValue);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingLabelId(null);
    setLabelDraft('');
    setOriginalLabelValue('');
  }, []);

  return {
    editingLabelId,
    setEditingLabelId,
    labelDraft,
    setLabelDraft,
    originalLabelValue,
    setOriginalLabelValue,
    expandedMerchant,
    setExpandedMerchant,
    suggestions,
    setSuggestions,
    startEditing,
    cancelEditing,
  };
}

// ============================================================================
// Modal State Hook
// ============================================================================

export function useModalState() {
  // Account creation modal
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountModalIban, setAccountModalIban] = useState('');
  const [accountModalName, setAccountModalName] = useState('');

  // Create contact modal
  const [createContactModalOpen, setCreateContactModalOpen] = useState(false);
  const [createContactTransaction, setCreateContactTransaction] =
    useState<Transaction | null>(null);
  const [createContactName, setCreateContactName] = useState('');

  // Shared IBAN modal
  const [sharedIbanModalOpen, setSharedIbanModalOpen] = useState(false);
  const [selectedSharedIban, setSelectedSharedIban] = useState<{
    iban: string;
    merchants: Array<{ name: string; transactionCount: number }>;
  } | null>(null);
  const [sharedIbanGroups, setSharedIbanGroups] = useState<SharedIbanGroup[]>(
    []
  );
  const [splitInputValues, setSplitInputValues] = useState<
    Record<string, string>
  >({});
  const [assignPopoverOpen, setAssignPopoverOpen] = useState<string | null>(
    null
  );
  const [assignSearchTerm, setAssignSearchTerm] = useState('');

  // Rule creation modal
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

  // Transfer modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [pendingTransferTransaction, setPendingTransferTransaction] =
    useState<Transaction | null>(null);
  const [transferRelatedTransactions, setTransferRelatedTransactions] =
    useState<Transaction[]>([]);
  const [selectedTransferRelatedIds, setSelectedTransferRelatedIds] = useState<
    Set<string>
  >(new Set());
  const [isMarkingAsTransfer, setIsMarkingAsTransfer] = useState(true);

  // Open create contact modal
  const openCreateContactModal = useCallback((transaction: Transaction) => {
    setCreateContactTransaction(transaction);
    setCreateContactName(transaction.opposingAccountName || '');
    setCreateContactModalOpen(true);
  }, []);

  // Close create contact modal
  const closeCreateContactModal = useCallback(() => {
    setCreateContactModalOpen(false);
    setCreateContactTransaction(null);
    setCreateContactName('');
  }, []);

  // Open shared IBAN modal
  const openSharedIbanModal = useCallback(
    (sharedIban: {
      iban: string;
      merchants: Array<{ name: string; transactionCount: number }>;
    }) => {
      setSelectedSharedIban(sharedIban);
      // Initialize groups with similar name detection
      // findSimilarNameGroups returns indices, so we map back to names
      const merchantNames = sharedIban.merchants.map((m) => m.name);
      const similarGroupIndices = findSimilarNameGroups(merchantNames);

      // Create groups from indices
      const groupedIndices = new Set<number>();
      const groups: SharedIbanGroup[] = [];

      // First add the similar groups
      similarGroupIndices.forEach((indexGroup, groupIndex) => {
        indexGroup.forEach((i) => groupedIndices.add(i));
        groups.push({
          id: String(groupIndex),
          entries: indexGroup.map((i) => ({
            name: merchantNames[i],
            transactionCount: sharedIban.merchants[i]?.transactionCount || 0,
          })),
          editedName: merchantNames[indexGroup[0]],
          isSplit: false,
        });
      });

      // Add remaining merchants: if multiple remain, group them together
      // This ensures shared IBAN merchants are shown as a single group
      const ungroupedEntries = merchantNames
        .map((name, i) => ({ name, i }))
        .filter(({ i }) => !groupedIndices.has(i))
        .map(({ name, i }) => ({
          name,
          transactionCount: sharedIban.merchants[i]?.transactionCount || 0,
        }));

      if (ungroupedEntries.length > 1) {
        // Multiple ungrouped items: present as one group (can be split)
        groups.push({
          id: String(groups.length),
          entries: ungroupedEntries,
          editedName: ungroupedEntries[0].name,
          isSplit: false,
        });
      } else if (ungroupedEntries.length === 1) {
        // Single ungrouped item: add as individual group
        groups.push({
          id: String(groups.length),
          entries: ungroupedEntries,
          editedName: ungroupedEntries[0].name,
          isSplit: false,
        });
      }

      setSharedIbanGroups(groups);
      setSplitInputValues({});
      setSharedIbanModalOpen(true);
    },
    []
  );

  // Close shared IBAN modal
  const closeSharedIbanModal = useCallback(() => {
    setSharedIbanModalOpen(false);
    setSelectedSharedIban(null);
    setSharedIbanGroups([]);
    setSplitInputValues({});
    setAssignPopoverOpen(null);
    setAssignSearchTerm('');
  }, []);

  // Open rule modal
  const openRuleModal = useCallback(
    (transaction: Transaction, categoryId: string, pattern: string) => {
      setPendingRuleTransaction({ tx: transaction, categoryId });
      setRulePattern(pattern);
      setApplyToRelated(true);
      setRelatedTransactions([]);
      setSelectedRelatedIds(new Set());
      setRuleModalOpen(true);
    },
    []
  );

  // Close rule modal
  const closeRuleModal = useCallback(() => {
    setRuleModalOpen(false);
    setPendingRuleTransaction(null);
    setRulePattern('');
    setRelatedTransactions([]);
    setSelectedRelatedIds(new Set());
  }, []);

  // Open transfer modal
  const openTransferModal = useCallback(
    (transaction: Transaction, isTransfer: boolean) => {
      setPendingTransferTransaction(transaction);
      setIsMarkingAsTransfer(isTransfer);
      setTransferRelatedTransactions([]);
      setSelectedTransferRelatedIds(new Set());
      setTransferModalOpen(true);
    },
    []
  );

  // Close transfer modal
  const closeTransferModal = useCallback(() => {
    setTransferModalOpen(false);
    setPendingTransferTransaction(null);
    setTransferRelatedTransactions([]);
    setSelectedTransferRelatedIds(new Set());
  }, []);

  return {
    // Account modal
    accountModalOpen,
    setAccountModalOpen,
    accountModalIban,
    setAccountModalIban,
    accountModalName,
    setAccountModalName,

    // Create contact modal
    createContactModalOpen,
    createContactTransaction,
    createContactName,
    setCreateContactName,
    openCreateContactModal,
    closeCreateContactModal,

    // Shared IBAN modal
    sharedIbanModalOpen,
    selectedSharedIban,
    sharedIbanGroups,
    setSharedIbanGroups,
    splitInputValues,
    setSplitInputValues,
    assignPopoverOpen,
    setAssignPopoverOpen,
    assignSearchTerm,
    setAssignSearchTerm,
    openSharedIbanModal,
    closeSharedIbanModal,

    // Rule modal
    ruleModalOpen,
    rulePattern,
    setRulePattern,
    pendingRuleTransaction,
    applyToRelated,
    setApplyToRelated,
    relatedTransactions,
    setRelatedTransactions,
    selectedRelatedIds,
    setSelectedRelatedIds,
    openRuleModal,
    closeRuleModal,

    // Transfer modal
    transferModalOpen,
    pendingTransferTransaction,
    transferRelatedTransactions,
    setTransferRelatedTransactions,
    selectedTransferRelatedIds,
    setSelectedTransferRelatedIds,
    isMarkingAsTransfer,
    openTransferModal,
    closeTransferModal,
  };
}

// ============================================================================
// Pagination State Hook
// ============================================================================

export function usePaginationState() {
  const [visibleCount, setVisibleCount] = useState(50);
  const [accountScrollIndex, setAccountScrollIndex] = useState(0);
  const loadMoreRef = useRef<HTMLButtonElement>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + 50);
  }, []);

  const resetPagination = useCallback(() => {
    setVisibleCount(50);
    setAccountScrollIndex(0);
  }, []);

  return {
    visibleCount,
    setVisibleCount,
    accountScrollIndex,
    setAccountScrollIndex,
    loadMoreRef,
    loadMoreSentinelRef,
    loadMore,
    resetPagination,
  };
}

// ============================================================================
// Transaction Data Hook
// ============================================================================

export function useTransactionData(
  filterState: ReturnType<typeof useFilterState>
) {
  const { activeProfileId } = useProfile();
  const { startDate, endDate } = useFilterParams();
  const queryClient = useQueryClient();

  const {
    typeParam,
    categoryIdsParam,
    ibansParam,
    nameParam,
    addressBookIdParam,
    paymentMethodsParam,
    paymentProvidersParam,
    addressBookFilterOpened,
    selectedAddressBookId,
  } = filterState;

  // Transactions query
  const {
    data: transactions,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = useQuery<Transaction[]>({
    queryKey: [
      'transactions',
      activeProfileId,
      {
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
        type: typeParam || '',
        startDate,
        endDate,
        // Pass undefined when no categories are selected. If an array is present
        // (even if it contains the empty-string marker '' for uncategorized),
        // we join and pass the resulting string.
        ...(categoryIdsParam
          ? { categoryIds: categoryIdsParam.join(',') }
          : {}),
        opposingAccountIbans: ibansParam?.join(',') || '',
        opposingAccountName: nameParam || '',
        addressBookId: addressBookIdParam?.toString() || '',
        paymentMethods: paymentMethodsParam?.join(',') || '',
        paymentProviders: paymentProvidersParam?.join(',') || '',
      }) as Promise<Transaction[]>,
    staleTime: 30 * 1000,
  });

  // Categories query
  const { data: categories, isLoading: categoriesLoading } = useQuery<
    Category[]
  >({
    queryKey: ['categories', activeProfileId],
    queryFn: () => api.getCategories() as Promise<Category[]>,
    staleTime: 5 * 60 * 1000,
  });

  // Address book query (lazy loaded)
  const needsAddressBook =
    addressBookFilterOpened ||
    selectedAddressBookId !== null ||
    (transactions?.some((tx) => tx.addressBookId !== null) ?? false);

  const { data: addressBook, isLoading: addressBookLoading } = useQuery<
    AddressBookEntry[]
  >({
    queryKey: ['addressbook', activeProfileId],
    queryFn: () => api.getAddressBook() as Promise<AddressBookEntry[]>,
    staleTime: 10 * 60 * 1000, // 10 minutes - match useAddressBook settings
    gcTime: 15 * 60 * 1000, // 15 minutes - keep in cache
    refetchOnMount: false, // Don't refetch when component mounts if data exists
    enabled: needsAddressBook,
  });

  // Address book lookup maps
  const addressBookLookup = useMemo((): {
    byId: Map<string, AddressBookEntry>;
    byIban: Map<string, AddressBookEntry[]>;
  } => {
    if (!addressBook) {
      return {
        byId: new Map<string, AddressBookEntry>(),
        byIban: new Map<string, AddressBookEntry[]>(),
      };
    }

    const byId = new Map<string, AddressBookEntry>();
    const byIban = new Map<string, AddressBookEntry[]>();

    for (const entry of addressBook) {
      byId.set(entry.id, entry);

      if (entry.iban) {
        const existing = byIban.get(entry.iban) || [];
        existing.push(entry);
        byIban.set(entry.iban, existing);
      }

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

  // Shared IBANs query
  const { data: sharedIbans = [], isLoading: sharedIbansLoading } = useQuery<
    SharedIban[]
  >({
    queryKey: ['sharedIbans', activeProfileId],
    queryFn: () => api.getSharedIbans() as Promise<SharedIban[]>,
    staleTime: 2 * 60 * 1000,
  });

  // Shared IBANs lookup map
  const sharedIbansLookup = useMemo(() => {
    const byIban = new Map<string, SharedIban>();
    for (const shared of sharedIbans) {
      byIban.set(shared.iban, shared);
    }
    return byIban;
  }, [sharedIbans]);

  // Accounts query
  const { data: accounts, isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ['accounts', activeProfileId],
    queryFn: () => api.getAccounts() as Promise<Account[]>,
    staleTime: 5 * 60 * 1000,
  });

  // Category rules query
  const { data: categoryRules = [] } = useQuery<CategoryRule[]>({
    queryKey: ['categoryRules', activeProfileId],
    queryFn: () => api.getCategoryRules() as Promise<CategoryRule[]>,
    staleTime: 5 * 60 * 1000,
  });

  // Payment provider rules query
  const { data: paymentProviderRules = [] } = useQuery<
    Array<{ id: string; name: string; patterns: string }>
  >({
    queryKey: ['paymentProviderRules', activeProfileId],
    queryFn: () =>
      api.getPaymentProviderRules() as Promise<
        Array<{ id: string; name: string; patterns: string }>
      >,
    staleTime: 5 * 60 * 1000,
  });

  // Grouped categories for dropdown
  const groupedCategories = useMemo(() => {
    if (!categories) return [];

    const parents: Category[] = [];
    const childrenByParent = new Map<string, Category[]>();

    for (const cat of categories) {
      if (cat.parentId === null) {
        parents.push(cat);
      } else {
        const children = childrenByParent.get(cat.parentId) || [];
        children.push(cat);
        childrenByParent.set(cat.parentId, children);
      }
    }

    const result: { parent: Category; children: Category[] }[] = [];
    for (const parent of parents) {
      result.push({
        parent,
        children: childrenByParent.get(parent.id) || [],
      });
    }

    return result;
  }, [categories]);

  // Invalidation helpers
  const invalidateTransactions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  }, [queryClient]);

  const invalidateAddressBook = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['addressbook'] });
  }, [queryClient]);

  const invalidateSharedIbans = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['sharedIbans'] });
  }, [queryClient]);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['addressbook'] });
    queryClient.invalidateQueries({ queryKey: ['sharedIbans'] });
  }, [queryClient]);

  return {
    // Data
    transactions,
    categories,
    addressBook,
    sharedIbans,
    accounts,
    categoryRules,
    paymentProviderRules,

    // Lookup maps
    addressBookLookup,
    sharedIbansLookup,
    groupedCategories,

    // Loading states
    isLoading:
      transactionsLoading ||
      categoriesLoading ||
      addressBookLoading ||
      sharedIbansLoading ||
      accountsLoading,
    transactionsLoading,
    categoriesLoading,
    addressBookLoading,
    sharedIbansLoading,
    accountsLoading,

    // Refetch helpers
    refetchTransactions,
    invalidateTransactions,
    invalidateAddressBook,
    invalidateSharedIbans,
    invalidateAll,

    // Query client
    queryClient,
  };
}
