import {
  useEffect,
  useRef,
  useState,
  useLayoutEffect,
  useMemo,
  useCallback,
} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  RefreshCcw,
  Pencil,
  Trash2,
  ExternalLink,
  Check,
  ChevronDown,
  Info,
  MoreVertical,
  Settings2,
  UserPlus,
  History,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Building2,
  Wallet,
  PiggyBank,
  CheckCircle2,
  Scissors,
  Merge,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  ChevronUp,
  Settings,
  RefreshCw,
  Loader2,
  Edit2,
  X,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useFilters } from '@/contexts/FilterContext';
import { useToast } from '@/contexts/ToastContext';
import { cn, findSimilarNameGroups } from '@/lib/utils';
import { Currency } from '@/components/ui/currency';
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
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { api } from '@/lib/api';
import { useConfirm } from '@/contexts/ConfirmContext';

interface AddressBookEntry {
  id: string;
  iban: string;
  ibans?: string[];
  name: string;
  description: string | null;
  notes: string | null;
  createdAt: string;
  isMerged?: boolean;
  transactionCount?: number;
  totalIncome?: number;
  totalExpenses?: number;
  netAmount?: number;
  lastTransactionDate?: string | null;
  knownProviderName?: string | null;
}

interface SharedIban {
  iban: string;
  merchantCount: number;
  merchants: { name: string; transactionCount: number }[];
  inAddressBook: boolean;
  addressBookId: string | null;
  isMarkedShared: boolean;
  isPartiallyResolved: boolean;
  providerName: string | null;
  isKnownProvider: boolean;
  knownProviderName: string | null;
}

interface CleanupRule {
  id: string;
  pattern: string;
  isActive: boolean;
  createdAt: string;
}

type SortOption = 'name' | 'transactionCount' | 'totalAmount' | 'recent';

export default function AddressBook() {
  const { t } = useLanguage();
  const { activeProfileId } = useProfile();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const {
    filters,
    setOpposingAccountIbans,
    setOpposingAccountName,
    setAddressBookId,
    setCategories,
    setTransactionType,
    clearOpposingAccountFilters,
  } = useFilters();
  useDocumentTitle(t.addressBook?.title || t.settings.addressBook.title);

  const queryClient = useQueryClient();

  // Search and sort state
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');

  // Add contact card toggle state
  const [showAddForm, setShowAddForm] = useState(false);

  // Lazy loading state
  const [visibleCount, setVisibleCount] = useState(25);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLButtonElement>(null);

  // Form state for adding new contact
  const [newContactIban, setNewContactIban] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactDescription, setNewContactDescription] = useState('');

  // Edit state
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editContactName, setEditContactName] = useState('');
  const [editContactDescription, setEditContactDescription] = useState('');

  // Cleanup rules state
  const [showCleanupRules, setShowCleanupRules] = useState(false);
  const [newRulePattern, setNewRulePattern] = useState('');

  // Shared IBANs card state
  const [showSharedIbans, setShowSharedIbans] = useState(false);

  // Suggested contacts card state
  const [showSuggestedContacts, setShowSuggestedContacts] = useState(false);
  const [suggestedContactPopover, setSuggestedContactPopover] = useState<
    string | null
  >(null); // IBAN of the suggested contact with open popover
  const [suggestedContactEditName, setSuggestedContactEditName] = useState('');
  const [suggestedContactSearch, setSuggestedContactSearch] = useState('');

  // Shared IBAN edit modal state
  const [sharedIbanEditModalOpen, setSharedIbanEditModalOpen] = useState(false);
  const [selectedSharedIban, setSelectedSharedIban] =
    useState<SharedIban | null>(null);
  // Edit modal state - groups that can be merged or split
  const [editModalGroups, setEditModalGroups] = useState<
    Array<{
      id: string;
      entries: Array<{
        name: string;
        transactionCount: number;
      }>;
      editedName: string;
      isSplit: boolean; // if true, entries are shown individually
    }>
  >([]);
  const [splitInputValues, setSplitInputValues] = useState<
    Record<string, string>
  >({});

  // Split contact modal state
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [splitContact, setSplitContact] = useState<AddressBookEntry | null>(
    null
  );
  const [splitIbanNames, setSplitIbanNames] = useState<Record<string, string>>(
    {}
  );
  const [splitNameWarning, setSplitNameWarning] = useState<string | null>(null);

  // Expanded contact state for showing transactions
  const [expandedContactId, setExpandedContactId] = useState<string | null>(
    null
  );

  // Toast (global context)
  const toast = useToast();

  // Sort switch indicator ref
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const switchOuterRef = useRef<HTMLDivElement | null>(null);

  // Modal content ref for tooltip collision boundary
  const modalContentRef = useRef<HTMLDivElement | null>(null);
  const [modalContentElement, setModalContentElement] =
    useState<HTMLDivElement | null>(null);

  // Update modal content element when ref changes
  useEffect(() => {
    setModalContentElement(modalContentRef.current);
  }, [sharedIbanEditModalOpen]); // Update when modal opens

  // Query address book
  const { data: addressBook, isLoading } = useQuery<AddressBookEntry[]>({
    queryKey: ['addressbook', activeProfileId],
    queryFn: () => api.getAddressBook() as Promise<AddressBookEntry[]>,
  });

  // Query top accounts (for suggested contacts)
  interface TopAccount {
    iban: string;
    name: string;
    description: string | null;
    isInAddressBook: boolean;
    addressBookId: string | null;
    transactionCount: number;
    totalAmount: number;
    netAmount: number;
  }
  const { data: topAccountsData, isLoading: _topAccountsLoading } = useQuery<{
    accounts: TopAccount[];
  }>({
    queryKey: ['topAccounts', activeProfileId, 'all'],
    queryFn: () =>
      api.getTopAccounts(100, 'all') as Promise<{ accounts: TopAccount[] }>,
    enabled: !!activeProfileId,
  });

  // Query for transactions when a contact is expanded
  const { data: contactTransactions, isLoading: loadingContactTransactions } =
    useQuery({
      queryKey: ['contact-transactions', expandedContactId],
      queryFn: () =>
        expandedContactId
          ? api.getTransactionsForContact(expandedContactId)
          : null,
      enabled: !!expandedContactId,
    });

  // Toggle contact expansion handler
  const handleToggleExpand = useCallback((id: string) => {
    setExpandedContactId((prev) => (prev === id ? null : id));
  }, []);

  // Mutations
  const createContactMutation = useMutation({
    mutationFn: api.createAddressBookEntry,
    onSuccess: async (result) => {
      // Await all query invalidations to ensure UI updates before we show toast
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['addressbook', activeProfileId],
        }),
        // Use exact: false to match all topAccounts queries regardless of the type parameter
        queryClient.invalidateQueries({
          queryKey: ['topAccounts', activeProfileId],
          exact: false,
        }),
        queryClient.invalidateQueries({
          queryKey: ['transactions', activeProfileId],
        }),
      ]);
      // Clear form but keep card open for quick entry
      setNewContactIban('');
      setNewContactName('');
      setNewContactDescription('');
      // Close suggested contact popover if open (entry was added from there)
      setSuggestedContactPopover(null);
      const mergedResult = result as
        | {
            merged?: boolean;
            mergeReason?: 'name' | 'iban';
          }
        | undefined;
      if (mergedResult?.merged) {
        if (mergedResult.mergeReason === 'name') {
          // Merged because a contact with the same name already exists
          toast.info(
            t.addressBook?.ibanAddedToMatchingName ||
              'IBAN added to contact with matching name'
          );
        } else {
          // Merged because IBAN already exists - shouldn't happen from suggested contacts
          // as these IBANs should not be in the address book
          toast.info(
            t.addressBook?.ibanAddedToExisting ||
              'IBAN added to existing contact'
          );
        }
      } else {
        toast.success(t.addressBook?.contactAdded || 'Contact added');
      }
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          t.addressBook?.createError ||
          'Failed to create contact'
      );
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; description?: string };
    }) => api.updateAddressBookEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['addressbook', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['topAccounts', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });
      setEditingContactId(null);
      toast.success(t.addressBook?.contactUpdated || 'Contact updated');
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: api.deleteAddressBookEntry,
    onSuccess: (_data, deletedId) => {
      queryClient.invalidateQueries({
        queryKey: ['addressbook', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['topAccounts', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['sharedIbans', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });
      // If the deleted contact was selected in the filter, clear the filter
      if (filters.addressBookId === deletedId) {
        clearOpposingAccountFilters();
      }
      toast.success(t.addressBook?.contactDeleted || 'Contact verwijderd');
    },
  });

  // Cleanup rules query and mutations - always fetch for similarity matching
  const { data: cleanupRules } = useQuery<CleanupRule[]>({
    queryKey: ['cleanupRules', activeProfileId],
    queryFn: () => api.getCleanupRules() as Promise<CleanupRule[]>,
  });

  const createRuleMutation = useMutation({
    mutationFn: api.createCleanupRule,
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['cleanupRules', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['addressbook', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['topAccounts', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });
      setNewRulePattern('');
      // Show toast with auto-apply results
      const data = result as {
        data?: { addressBookUpdated?: number; transactionsUpdated?: number };
      };
      const addressBookCount = data?.data?.addressBookUpdated || 0;
      const transactionsCount = data?.data?.transactionsUpdated || 0;
      const total = addressBookCount + transactionsCount;
      if (total > 0) {
        toast.success(
          (
            t.addressBook?.ruleAppliedAuto ||
            'Rule added and applied: {addressBook} contacts, {transactions} transactions updated'
          )
            .replace('{addressBook}', String(addressBookCount))
            .replace('{transactions}', String(transactionsCount))
        );
      } else {
        toast.success(t.addressBook?.ruleAdded || 'Cleanup rule added');
      }
    },
    onError: (error) => {
      const errorMessage = (error as { message?: string })?.message || '';
      if (
        errorMessage.includes('409') ||
        errorMessage.includes('already exists')
      ) {
        toast.warning(t.addressBook?.ruleExists || 'Rule already exists');
      }
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: api.deleteCleanupRule,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['cleanupRules', activeProfileId],
      });
    },
  });

  const applyRulesMutation = useMutation({
    mutationFn: api.applyCleanupRules,
    onSuccess: (_result) => {
      queryClient.invalidateQueries({
        queryKey: ['addressbook', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['topAccounts', activeProfileId],
      });
      toast.info(
        t.addressBook?.namesUpdatedInAddressBook ||
          'Cleanup rules applied to address book'
      );
    },
  });

  const applyRulesToTransactionsMutation = useMutation({
    mutationFn: api.applyCleanupRulesToTransactions,
    onSuccess: (_result) => {
      queryClient.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['sharedIbans', activeProfileId],
      });
      toast.info(
        t.addressBook?.transactionNamesUpdated ||
          'Cleanup rules applied to transactions'
      );
    },
  });

  const _backfillMutation = useMutation({
    mutationFn: api.backfillAddressbook,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['addressbook', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['topAccounts', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['sharedIbans', activeProfileId],
      });
    },
  });

  // Shared IBANs query and mutations
  const { data: sharedIbans = [], isLoading: sharedIbansLoading } = useQuery<
    SharedIban[]
  >({
    queryKey: ['sharedIbans', activeProfileId],
    queryFn: () => api.getSharedIbans() as Promise<SharedIban[]>,
  });

  // Compute suggested contacts: accounts not in addressbook and not in sharedIbans
  const suggestedContacts = useMemo(() => {
    if (!topAccountsData?.accounts) return [];
    const sharedIbanSet = new Set(sharedIbans.map((s) => s.iban));
    return topAccountsData.accounts.filter(
      (account) => !account.isInAddressBook && !sharedIbanSet.has(account.iban)
    );
  }, [topAccountsData, sharedIbans]);

  const _markAsSharedMutation = useMutation({
    mutationFn: ({
      iban,
      providerName,
    }: {
      iban: string;
      providerName?: string;
    }) => api.markIbanAsShared(iban, providerName),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sharedIbans', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['addressbook', activeProfileId],
      });
    },
  });

  const _removeSharedMutation = useMutation({
    mutationFn: api.removeSharedIban,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sharedIbans', activeProfileId],
      });
    },
  });

  const detectSharedMutation = useMutation({
    mutationFn: api.detectSharedIbans,
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['sharedIbans', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['addressbook', activeProfileId],
      });
      const data = result as {
        detected?: number;
        unresolved?: number;
        removedFromAddressBook?: number;
        addedToShared?: number;
      };
      const detectedCount = data.detected || 0;
      const addedCount = data.addedToShared || 0;
      if (addedCount > 0) {
        toast.success(
          (
            t.addressBook?.sharedIbansDetected ||
            '{added} shared IBANs added ({detected} detected)'
          )
            .replace('{added}', String(addedCount))
            .replace('{detected}', String(detectedCount))
        );
      } else if (detectedCount > 0) {
        toast.info(
          (
            t.addressBook?.sharedIbansDetected ||
            '{added} shared IBANs ({detected} detected)'
          )
            .replace('{added}', '0')
            .replace('{detected}', String(detectedCount))
        );
      } else {
        toast.info(
          t.addressBook?.noSharedIbansFound || 'No shared IBANs found'
        );
      }
    },
  });

  // Mutation for resolving a shared IBAN entry to address book
  const resolveSharedMutation = useMutation({
    mutationFn: (data: {
      iban: string;
      name: string;
      originalNames: string[];
      contactId?: string;
    }) =>
      api.resolveSharedIban(
        data.iban,
        data.name,
        data.originalNames,
        data.contactId
      ),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['addressbook', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['sharedIbans', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });
      const data = result as { data?: { transactionsUpdated?: number } };
      toast.success(
        (
          t.addressBook?.contactAddedTransactionsUpdated ||
          'Contact added, {count} transactions updated'
        ).replace('{count}', String(data.data?.transactionsUpdated || 0))
      );
    },
    onError: (error: Error) => {
      if (error.message.includes('already exists')) {
        toast.error(
          t.addressBook?.contactAlreadyExists ||
            'Contact with this IBAN already exists'
        );
      } else {
        toast.error(
          t.addressBook?.errorAddingContact || 'Error adding contact'
        );
      }
    },
  });

  // State for assign-to-existing contact popover
  const [assignPopoverOpen, setAssignPopoverOpen] = useState<string | null>(
    null
  );
  const [assignSearchTerm, setAssignSearchTerm] = useState('');

  // Mutation for adding IBAN to existing contact
  const addIbanToContactMutation = useMutation({
    mutationFn: ({ contactId, iban }: { contactId: string; iban: string }) =>
      api.addContactIban(contactId, iban),
    onSuccess: async () => {
      // Await all query invalidations to ensure UI updates before we show toast
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['addressbook', activeProfileId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['topAccounts', activeProfileId],
          exact: false,
        }),
        queryClient.invalidateQueries({
          queryKey: ['sharedIbans', activeProfileId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['transactions', activeProfileId],
        }),
      ]);
      // Close suggested contact popover and assign popover if open
      setSuggestedContactPopover(null);
      setAssignPopoverOpen(null);
      toast.success(
        t.addressBook?.ibanAddedToExisting || 'IBAN added to existing contact'
      );
    },
    onError: (error: Error) => {
      toast.error(
        error.message || t.addressBook?.errorAddingIban || 'Error adding IBAN'
      );
    },
  });

  // Mutation for merging contacts (assign one contact to another)
  const mergeContactsMutation = useMutation({
    mutationFn: ({
      contactIds,
      name,
    }: {
      contactIds: string[];
      name?: string;
    }) => api.mergeContacts(contactIds, name),
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
      setEditingContactId(null);
      toast.success(
        t.addressBook?.contactsMerged || 'Contacts merged successfully'
      );
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          t.addressBook?.errorMergingContacts ||
          'Error merging contacts'
      );
    },
  });

  // Handlers
  const handleCreateContact = () => {
    if (!newContactIban.trim() || !newContactName.trim()) return;
    createContactMutation.mutate({
      iban: newContactIban.trim(),
      name: newContactName.trim(),
      description: newContactDescription.trim() || undefined,
    });
  };

  const startEditingContact = (contact: AddressBookEntry) => {
    // If contact is merged (multiple IBANs), show split modal first
    if (contact.isMerged && contact.ibans && contact.ibans.length > 1) {
      setSplitContact(contact);
      // Pre-fill mappings with current IBANs and default names
      const init: Record<string, string> = {};
      (contact.ibans || []).forEach((i) => {
        init[i] = contact.name + '';
      });
      setSplitIbanNames(init);
      setSplitModalOpen(true);
    } else {
      // Regular contact - open inline edit mode
      setEditingContactId(contact.id);
      setEditContactName(contact.name);
      setEditContactDescription(contact.description || '');
    }
  };

  const handleUpdateContact = () => {
    if (editingContactId === null) return;
    updateContactMutation.mutate({
      id: editingContactId,
      data: {
        name: editContactName,
        description: editContactDescription.trim(),
      },
    });
  };

  // Filter and sort contacts
  const filteredContacts = (() => {
    if (!addressBook) return [];

    let filtered = [...addressBook];

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchLower) ||
          contact.description?.toLowerCase().includes(searchLower) ||
          contact.iban.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'transactionCount':
        filtered.sort(
          (a, b) => (b.transactionCount || 0) - (a.transactionCount || 0)
        );
        break;
      case 'totalAmount':
        filtered.sort(
          (a, b) => Math.abs(b.netAmount || 0) - Math.abs(a.netAmount || 0)
        );
        break;
      case 'recent':
        filtered.sort((a, b) => {
          if (!a.lastTransactionDate && !b.lastTransactionDate) return 0;
          if (!a.lastTransactionDate) return 1;
          if (!b.lastTransactionDate) return -1;
          return (
            new Date(b.lastTransactionDate).getTime() -
            new Date(a.lastTransactionDate).getTime()
          );
        });
        break;
    }

    return filtered;
  })();

  // Build a map of IBANs that are shared across multiple contacts
  const sharedIbanMap = (() => {
    if (!addressBook) return new Map<string, number>();

    const ibanUsageCount = new Map<string, number>();

    // Count how many contacts use each IBAN
    for (const contact of addressBook) {
      const ibans = contact.ibans || (contact.iban ? [contact.iban] : []);
      for (const iban of ibans) {
        if (iban) {
          ibanUsageCount.set(iban, (ibanUsageCount.get(iban) || 0) + 1);
        }
      }
    }

    return ibanUsageCount;
  })();

  // Check if a contact has any shared IBANs (IBANs used by multiple contacts)
  const hasSharedIban = (contact: AddressBookEntry): boolean => {
    const ibans = contact.ibans || (contact.iban ? [contact.iban] : []);
    return ibans.some((iban) => (sharedIbanMap.get(iban) || 0) > 1);
  };

  const visibleContacts = filteredContacts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredContacts.length;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(25);
  }, [search, sortBy]);

  // Measure the active button and size the indicator
  useLayoutEffect(() => {
    const outer = switchOuterRef.current;
    const indicator = indicatorRef.current;
    if (!outer || !indicator) return;

    const buttons = Array.from(
      outer.querySelectorAll('button')
    ) as HTMLElement[];
    const idxMap: Record<SortOption, number> = {
      name: 0,
      transactionCount: 1,
      totalAmount: 2,
      recent: 3,
    };
    const idx = idxMap[sortBy];
    const btn = buttons[idx];
    if (!btn) return;

    const outerRect = outer.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const left = btnRect.left - outerRect.left + 2;
    const width = Math.max(40, btnRect.width - 4);

    indicator.style.left = `${left}px`;
    indicator.style.width = `${width}px`;
  }, [sortBy, t]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore) {
          setVisibleCount((prev) => prev + 25);
        }
      },
      { threshold: 0.1, rootMargin: '200px 0px 200px 0px' }
    );

    const el = loadMoreSentinelRef.current || loadMoreRef.current;
    if (el) observer.observe(el as Element);

    return () => {
      if (el) observer.unobserve(el as Element);
    };
  }, [hasMore, visibleCount]);

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: 'name', label: t.addressBook?.sortName || 'Name' },
    {
      key: 'transactionCount',
      label: t.addressBook?.sortTransactions || 'Transactions',
    },
    { key: 'totalAmount', label: t.addressBook?.sortAmount || 'Amount' },
    { key: 'recent', label: t.addressBook?.sortRecent || 'Recent' },
  ];

  return (
    <>
      <div className='space-y-6'>
        <PageHeader
          title={t.addressBook?.title || t.settings.addressBook.title}
          subtitle={
            t.addressBook?.subtitle || t.settings.addressBook.description
          }
          dataOnboarding='addressbook-greeting'
          actions={
            <div className='flex gap-2'>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setShowCleanupRules(!showCleanupRules)}
                      variant={showCleanupRules ? 'secondary' : 'outline'}
                      size='icon'
                      data-onboarding='addressbook-settings-toggle'
                    >
                      <Settings2 className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t.addressBook?.cleanupRules || 'Cleanup rules'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                variant={showAddForm ? 'secondary' : 'default'}
                data-onboarding='add-contact-toggle'
              >
                {showAddForm ? (
                  <>
                    <ChevronUp className='mr-2 h-4 w-4' />
                    {t.common.close}
                  </>
                ) : (
                  <>
                    <Plus className='mr-2 h-4 w-4' />
                    {t.addressBook?.addContact || 'Add contact'}
                  </>
                )}
              </Button>
            </div>
          }
        />

        {/* Cleanup Rules Card */}
        {showCleanupRules && (
          <Card data-onboarding='cleanup-rules-card'>
            <CardHeader>
              <CardTitle>
                {t.addressBook?.cleanupRules || 'Name cleanup rules'}
              </CardTitle>
              <CardDescription>
                {t.addressBook?.cleanupRulesDescription ||
                  'Text parts that are automatically removed from account names.'}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Add new rule */}
              <div className='flex gap-2'>
                <Input
                  placeholder={
                    t.addressBook?.patternPlaceholder || 'Text to remove...'
                  }
                  value={newRulePattern}
                  onChange={(e) => setNewRulePattern(e.target.value)}
                  className='flex-1'
                />
                <Button
                  onClick={() => createRuleMutation.mutate(newRulePattern)}
                  disabled={
                    !newRulePattern.trim() || createRuleMutation.isPending
                  }
                >
                  <Plus className='mr-2 h-4 w-4' />
                  {t.common.add}
                </Button>
              </div>

              {/* Existing rules */}
              <div className='space-y-2'>
                {cleanupRules?.map((rule) => (
                  <div
                    key={rule.id}
                    className='flex items-center justify-between rounded-md bg-muted/50 p-2'
                  >
                    <code className='text-sm'>{rule.pattern}</code>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='rounded-md transition-colors hover:bg-red-600 hover:text-white dark:hover:bg-red-700'
                      onClick={async () => {
                        const isConfirmed = await confirm({
                          title:
                            t.addressBook?.deleteRuleTitle || 'Delete rule',
                          message:
                            t.addressBook?.confirmDeleteRule ||
                            'Are you sure you want to delete this rule?',
                          variant: 'danger',
                        });
                        if (isConfirmed) {
                          deleteRuleMutation.mutate(rule.id);
                        }
                      }}
                      disabled={deleteRuleMutation.isPending}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
                {(!cleanupRules || cleanupRules.length === 0) && (
                  <p className='py-2 text-center text-sm text-muted-foreground'>
                    {t.addressBook?.noRulesDefined || 'No rules defined'}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className='flex flex-wrap gap-2 border-t pt-2'>
                <Button
                  variant='outline'
                  onClick={() => applyRulesMutation.mutate()}
                  disabled={applyRulesMutation.isPending}
                >
                  <RefreshCw
                    className={cn(
                      'mr-2 h-4 w-4',
                      applyRulesMutation.isPending && 'animate-spin'
                    )}
                  />
                  {t.addressBook?.applyToAddressBook || 'Apply to address book'}
                </Button>
                <Button
                  variant='outline'
                  onClick={() => applyRulesToTransactionsMutation.mutate()}
                  disabled={applyRulesToTransactionsMutation.isPending}
                >
                  <RefreshCw
                    className={cn(
                      'mr-2 h-4 w-4',
                      applyRulesToTransactionsMutation.isPending &&
                        'animate-spin'
                    )}
                  />
                  {t.addressBook?.applyToTransactions ||
                    'Apply to transactions'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add New Contact Card - collapsible */}
        {showAddForm && (
          <Card data-onboarding='add-contact-card'>
            <CardHeader>
              <CardTitle>{t.settings.addressBook.addTitle}</CardTitle>
              <CardDescription>
                {t.addressBook?.addDescription ||
                  'Add a new contact to your address book'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex flex-wrap gap-2'>
                <Input
                  placeholder={t.settings.accounts.ibanPlaceholder}
                  value={newContactIban}
                  onChange={(e) =>
                    setNewContactIban(
                      e.target.value.toUpperCase().replace(/\s/g, '')
                    )
                  }
                  className='min-w-[200px] flex-1'
                />
                <Input
                  placeholder={t.settings.addressBook.namePlaceholder}
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className='min-w-[150px] flex-1'
                />
                <Input
                  placeholder={
                    t.settings.addressBook.descriptionPlaceholder ||
                    'Omschrijving (optioneel)'
                  }
                  value={newContactDescription}
                  onChange={(e) => setNewContactDescription(e.target.value)}
                  className='min-w-[150px] flex-1'
                />
                <Button
                  onClick={handleCreateContact}
                  disabled={
                    createContactMutation.isPending ||
                    !newContactIban.trim() ||
                    !newContactName.trim()
                  }
                >
                  <Plus className='mr-2 h-4 w-4' />
                  {t.settings.addressBook.add}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shared IBANs Card - Payment Processors with multiple merchants */}
        {sharedIbans.length > 0 && (
          <Card
            data-onboarding='shared-ibans-card'
            className='border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/10'
          >
            <CardHeader
              className='cursor-pointer'
              onClick={() => setShowSharedIbans(!showSharedIbans)}
            >
              <div className='flex items-center justify-between'>
                <CardTitle className='flex items-center gap-2 text-amber-700 dark:text-amber-400'>
                  <AlertTriangle className='h-5 w-5' />
                  {t.addressBook?.sharedIbans || 'Shared IBANs'}
                  <span className='rounded-full bg-amber-200 px-2 py-0.5 text-xs font-normal dark:bg-amber-800'>
                    {sharedIbans.length}
                  </span>
                  {showSharedIbans ? (
                    <ChevronUp className='ml-1 h-4 w-4' />
                  ) : (
                    <ChevronDown className='ml-1 h-4 w-4' />
                  )}
                </CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={(e) => {
                          e.stopPropagation();
                          detectSharedMutation.mutate();
                        }}
                        disabled={detectSharedMutation.isPending}
                        className='text-muted-foreground hover:bg-muted hover:text-foreground'
                      >
                        <RefreshCw
                          className={cn(
                            'h-4 w-4',
                            detectSharedMutation.isPending && 'animate-spin'
                          )}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {t.addressBook?.rescanSharedIbans ||
                          'Rescan for shared IBANs'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {!showSharedIbans && (
                <CardDescription>
                  {t.addressBook?.sharedIbansCollapsed ||
                    'IBANs with multiple different names in transactions. Click to expand.'}
                </CardDescription>
              )}
              {showSharedIbans && (
                <CardDescription>
                  {t.addressBook?.sharedIbansExpanded ||
                    'IBANs with multiple different names in transactions (payment processors like Adyen, Mollie, etc.). These are not automatically added to the address book.'}
                </CardDescription>
              )}
            </CardHeader>
            {showSharedIbans && (
              <CardContent className='space-y-3'>
                <TooltipProvider>
                  {sharedIbansLoading ? (
                    <div className='space-y-2'>
                      <Skeleton className='h-16 w-full' />
                      <Skeleton className='h-16 w-full' />
                    </div>
                  ) : (
                    sharedIbans.map((shared) => (
                      <div
                        key={shared.iban}
                        className={cn(
                          'rounded-lg border p-3 transition-colors',
                          selectedSharedIban?.iban === shared.iban
                            ? 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20'
                            : 'bg-white hover:bg-muted/50 dark:bg-card'
                        )}
                      >
                        <div className='flex items-start justify-between gap-2'>
                          <div className='min-w-0 flex-1'>
                            <div className='flex items-center gap-2'>
                              <Building2 className='h-4 w-4 flex-shrink-0 text-amber-600' />
                              <span className='truncate text-sm'>
                                {shared.iban}
                              </span>
                              {shared.isKnownProvider && (
                                <span className='rounded-full bg-blue-100 px-2 py-0.5 text-xs whitespace-nowrap text-blue-700 dark:bg-blue-900 dark:text-blue-300'>
                                  {shared.knownProviderName}
                                </span>
                              )}
                            </div>
                            <div className='mt-1 text-xs text-muted-foreground'>
                              {(
                                t.addressBook?.differentNames ||
                                '{count} different names:'
                              ).replace(
                                '{count}',
                                String(shared.merchantCount)
                              )}
                            </div>
                            <div className='mt-1.5 flex flex-wrap gap-1.5'>
                              {(() => {
                                // Find similar name groups for this IBAN
                                // Apply cleanup rules before comparing for better matching
                                const names = shared.merchants.map(
                                  (m) => m.name
                                );
                                const similarGroups = findSimilarNameGroups(
                                  names,
                                  0.6,
                                  cleanupRules
                                );

                                // Create a map of index to group color
                                const groupColors = [
                                  'ring-2 ring-offset-1 ring-purple-400',
                                  'ring-2 ring-offset-1 ring-blue-400',
                                  'ring-2 ring-offset-1 ring-green-400',
                                  'ring-2 ring-offset-1 ring-orange-400',
                                  'ring-2 ring-offset-1 ring-pink-400',
                                ];
                                const indexToGroupColor: Record<
                                  number,
                                  string
                                > = {};
                                similarGroups.forEach((group, groupIdx) => {
                                  const color =
                                    groupColors[groupIdx % groupColors.length];
                                  group.forEach((idx) => {
                                    indexToGroupColor[idx] = color;
                                  });
                                });

                                return shared.merchants.map((m, idx) => {
                                  const groupColor = indexToGroupColor[idx];
                                  const isInSimilarGroup =
                                    groupColor !== undefined;

                                  return (
                                    <Tooltip key={idx}>
                                      <TooltipTrigger asChild>
                                        <span
                                          className={cn(
                                            'max-w-[200px] cursor-default truncate rounded bg-muted px-2 py-0.5 text-xs',
                                            groupColor,
                                            isInSimilarGroup && 'mx-0.5'
                                          )}
                                        >
                                          {m.name}{' '}
                                          <span className='text-muted-foreground'>
                                            ({m.transactionCount})
                                          </span>
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className='font-medium'>{m.name}</p>
                                        <p className='text-xs text-muted-foreground'>
                                          {m.transactionCount}{' '}
                                          {t.addressBook?.transactions ||
                                            'transactions'}
                                        </p>
                                        {isInSimilarGroup && (
                                          <p className='mt-1 text-xs text-purple-400'>
                                            ⚡{' '}
                                            {t.addressBook
                                              ?.possiblySamePerson ||
                                              'Possibly the same person/organization'}
                                          </p>
                                        )}
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                          <div className='flex flex-shrink-0 gap-1'>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 rounded-md transition-colors hover:bg-purple-600 hover:text-white'
                              onClick={() => {
                                setSelectedSharedIban(shared);
                                // Group similar names together
                                const names = shared.merchants.map(
                                  (m) => m.name
                                );
                                const similarGroups = findSimilarNameGroups(
                                  names,
                                  0.6,
                                  cleanupRules
                                );

                                // Create groups: similar items grouped, others as single-entry groups
                                const assignedIndices = new Set<number>();
                                const groups: typeof editModalGroups = [];

                                // First, create groups from similar names
                                for (const similarGroup of similarGroups) {
                                  const entries = similarGroup.map((idx) => {
                                    assignedIndices.add(idx);
                                    const m = shared.merchants[idx];
                                    return {
                                      name: m.name,
                                      transactionCount: m.transactionCount,
                                    };
                                  });
                                  // Use the most common name as default
                                  const mostCommon = entries.reduce((a, b) =>
                                    a.transactionCount > b.transactionCount
                                      ? a
                                      : b
                                  );
                                  groups.push({
                                    id: crypto.randomUUID(),
                                    entries,
                                    editedName: mostCommon.name,
                                    isSplit: false,
                                  });
                                }

                                // Add ungrouped items: if multiple remain, group them together
                                // This ensures shared IBAN merchants are shown as a single group
                                // giving the user the option to merge or split them
                                const ungroupedEntries = shared.merchants
                                  .filter((_, idx) => !assignedIndices.has(idx))
                                  .map((m) => ({
                                    name: m.name,
                                    transactionCount: m.transactionCount,
                                  }));

                                if (ungroupedEntries.length > 1) {
                                  // Multiple ungrouped items: present as one group (can be split)
                                  const mostCommon = ungroupedEntries.reduce(
                                    (a, b) =>
                                      a.transactionCount > b.transactionCount
                                        ? a
                                        : b
                                  );
                                  groups.push({
                                    id: crypto.randomUUID(),
                                    entries: ungroupedEntries,
                                    editedName: mostCommon.name,
                                    isSplit: false,
                                  });
                                } else if (ungroupedEntries.length === 1) {
                                  // Single ungrouped item: add as individual group
                                  groups.push({
                                    id: crypto.randomUUID(),
                                    entries: ungroupedEntries,
                                    editedName: ungroupedEntries[0].name,
                                    isSplit: false,
                                  });
                                }

                                setEditModalGroups(groups);
                                setSharedIbanEditModalOpen(true);
                              }}
                            >
                              <Edit2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </TooltipProvider>
              </CardContent>
            )}
          </Card>
        )}

        {/* Edit Shared IBAN Modal - Add entries individually */}
        <Dialog
          open={sharedIbanEditModalOpen}
          onOpenChange={(open) => {
            setSharedIbanEditModalOpen(open);
            if (!open) {
              setSelectedSharedIban(null);
              setEditModalGroups([]);
              setSplitInputValues({});
            }
          }}
        >
          <DialogContent
            ref={modalContentRef}
            className='max-h-[80vh] max-w-2xl overflow-y-auto'
          >
            <DialogHeader>
              <DialogTitle>
                {selectedSharedIban
                  ? `${t.addressBook?.editSharedIban || 'Edit shared IBAN'} - ${selectedSharedIban.iban}`
                  : t.addressBook?.editSharedIban || 'Edit shared IBAN'}
              </DialogTitle>
              <DialogDescription>
                {t.addressBook?.editSharedIbanDescription ||
                  'Add names to your address book. Similar names are grouped.'}
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              {editModalGroups.length === 0 ? (
                <div className='py-8 text-center text-muted-foreground'>
                  <Check className='mx-auto mb-2 h-12 w-12 text-green-500' />
                  <p>
                    {t.addressBook?.allNamesProcessed ||
                      'All names have been processed!'}
                  </p>
                </div>
              ) : (
                editModalGroups.map((group) => {
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
                                  {t.addressBook?.transactions ||
                                    'transactions'}
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
                                  <TooltipContent
                                    collisionBoundary={modalContentElement}
                                  >
                                    {t.addressBook?.assignToExisting ||
                                      'Assign to existing contact'}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <PopoverContent
                                className='w-64 p-2'
                                align='end'
                                collisionBoundary={modalContentElement}
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
                                            const isExactMatch =
                                              selectedSharedIban?.addressBookId !=
                                                null &&
                                              c.id ===
                                                selectedSharedIban.addressBookId;
                                            return matches && !isExactMatch;
                                          })
                                          .sort((a, b) => {
                                            // Prioritize contacts with the same IBAN
                                            const aHasIban =
                                              currentIban &&
                                              (a.iban === currentIban ||
                                                a.ibans?.includes(currentIban));
                                            const bHasIban =
                                              currentIban &&
                                              (b.iban === currentIban ||
                                                b.ibans?.includes(currentIban));
                                            if (aHasIban && !bHasIban)
                                              return -1;
                                            if (bHasIban && !aHasIban) return 1;
                                            return a.name.localeCompare(b.name);
                                          });
                                        return filtered?.length ? (
                                          filtered.map((contact) => (
                                            <button
                                              key={contact.id}
                                              className='w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted'
                                              onClick={() => {
                                                if (!selectedSharedIban) return;
                                                resolveSharedMutation.mutate(
                                                  {
                                                    contactId: contact.id,
                                                    iban: selectedSharedIban.iban,
                                                    name: contact.name, // Keep existing contact name
                                                    originalNames: [entry.name],
                                                  },
                                                  {
                                                    onSuccess: () => {
                                                      setAssignPopoverOpen(
                                                        null
                                                      );
                                                      setAssignSearchTerm('');
                                                      // Remove this entry from the group
                                                      setEditModalGroups(
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
                                                      // Clean up the input value for this entry
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
                                            setEditModalGroups(
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
                                <TooltipContent
                                  collisionBoundary={modalContentElement}
                                >
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
                              {(
                                t.addressBook?.possibleDuplicates ||
                                'Possibly the same ({count} variants, {transactions} transactions)'
                              )
                                .replace(
                                  '{count}',
                                  String(group.entries.length)
                                )
                                .replace(
                                  '{transactions}',
                                  String(totalTransactions)
                                )}
                            </span>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-purple-600 hover:bg-purple-600 hover:text-white dark:text-purple-400 dark:hover:bg-purple-600 dark:hover:text-white'
                            onClick={() => {
                              setEditModalGroups((prev) =>
                                prev.map((g) =>
                                  g.id === group.id
                                    ? { ...g, isSplit: true }
                                    : g
                                )
                              );
                            }}
                          >
                            <Scissors className='mr-1 h-4 w-4' />
                            {t.addressBook?.split || 'Split'}
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
                              setEditModalGroups((prev) =>
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
                          {/* Assign merged group to existing contact */}
                          <Popover
                            open={assignPopoverOpen === `merge-${group.id}`}
                            onOpenChange={(open) => {
                              setAssignPopoverOpen(
                                open ? `merge-${group.id}` : null
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
                                      className='h-9 w-9 rounded-md p-0 hover:border-purple-600 hover:bg-purple-600 hover:text-white'
                                      disabled={
                                        addIbanToContactMutation.isPending
                                      }
                                    >
                                      <UserPlus className='h-4 w-4' />
                                    </Button>
                                  </PopoverTrigger>
                                </TooltipTrigger>
                                <TooltipContent
                                  collisionBoundary={modalContentElement}
                                >
                                  {t.addressBook?.assignToExisting ||
                                    'Assign to existing contact'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <PopoverContent
                              className='w-64 p-2'
                              align='end'
                              collisionBoundary={modalContentElement}
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
                                        ?.filter(
                                          (c) =>
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
                                            )
                                        )
                                        .sort((a, b) => {
                                          const aHasIban =
                                            currentIban &&
                                            (a.iban === currentIban ||
                                              a.ibans?.includes(currentIban));
                                          const bHasIban =
                                            currentIban &&
                                            (b.iban === currentIban ||
                                              b.ibans?.includes(currentIban));
                                          if (aHasIban && !bHasIban) return -1;
                                          if (bHasIban && !aHasIban) return 1;
                                          return a.name.localeCompare(b.name);
                                        });
                                      return filtered?.length ? (
                                        filtered.map((contact) => (
                                          <button
                                            key={contact.id}
                                            className='w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted'
                                            onClick={() => {
                                              if (!selectedSharedIban) return;
                                              resolveSharedMutation.mutate(
                                                {
                                                  contactId: contact.id,
                                                  iban: selectedSharedIban.iban,
                                                  name: contact.name,
                                                  originalNames:
                                                    group.entries.map(
                                                      (e) => e.name
                                                    ),
                                                },
                                                {
                                                  onSuccess: () => {
                                                    setAssignPopoverOpen(null);
                                                    setAssignSearchTerm('');
                                                    setEditModalGroups((prev) =>
                                                      prev.filter(
                                                        (g) => g.id !== group.id
                                                      )
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
                                    setEditModalGroups((prev) =>
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
                            {t.addressBook?.merge || 'Merge'}
                          </Button>
                        </div>

                        <p className='mt-2 text-xs text-muted-foreground'>
                          {(
                            t.addressBook?.allVariantsMerged ||
                            'All {count} variants will be merged under this name.'
                          ).replace('{count}', String(group.entries.length))}
                        </p>
                      </div>
                    );
                  }

                  // Single entry (no grouping needed)
                  return (
                    <div
                      key={group.id}
                      className='flex items-end gap-3 rounded-lg border bg-card p-3'
                    >
                      <div className='min-w-0 flex-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='font-medium'>
                            {group.entries[0].name}
                          </span>
                          <span className='text-xs text-muted-foreground'>
                            ({group.entries[0].transactionCount}{' '}
                            {t.addressBook?.transactions || 'transactions'})
                          </span>
                        </div>
                        <div className='mt-2'>
                          <Input
                            value={group.editedName}
                            onChange={(e) => {
                              setEditModalGroups((prev) =>
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
                      {/* Assign to existing contact button */}
                      <Popover
                        open={assignPopoverOpen === `single-${group.id}`}
                        onOpenChange={(open) => {
                          setAssignPopoverOpen(
                            open ? `single-${group.id}` : null
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
                                  disabled={addIbanToContactMutation.isPending}
                                >
                                  <UserPlus className='h-4 w-4' />
                                </Button>
                              </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent
                              collisionBoundary={modalContentElement}
                            >
                              {t.addressBook?.assignToExisting ||
                                'Assign to existing contact'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <PopoverContent
                          className='w-64 p-2'
                          align='end'
                          collisionBoundary={modalContentElement}
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
                                  const currentIban = selectedSharedIban?.iban;
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
                                          i.toLowerCase().includes(searchLower)
                                        );
                                      const isExactMatch =
                                        selectedSharedIban?.addressBookId !=
                                          null &&
                                        c.id ===
                                          selectedSharedIban.addressBookId;
                                      return matches && !isExactMatch;
                                    })
                                    .sort((a, b) => {
                                      // Prioritize contacts with the same IBAN
                                      const aHasIban =
                                        currentIban &&
                                        (a.iban === currentIban ||
                                          a.ibans?.includes(currentIban));
                                      const bHasIban =
                                        currentIban &&
                                        (b.iban === currentIban ||
                                          b.ibans?.includes(currentIban));
                                      if (aHasIban && !bHasIban) return -1;
                                      if (bHasIban && !aHasIban) return 1;
                                      return a.name.localeCompare(b.name);
                                    });
                                  return filtered?.length ? (
                                    filtered.map((contact) => (
                                      <button
                                        key={contact.id}
                                        className='w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted'
                                        onClick={() => {
                                          if (!selectedSharedIban) return;
                                          // Use resolveSharedMutation to properly track originalName for shared IBANs
                                          resolveSharedMutation.mutate(
                                            {
                                              iban: selectedSharedIban.iban,
                                              name: contact.name,
                                              originalNames: [
                                                group.entries[0].name,
                                              ],
                                              contactId: contact.id,
                                            },
                                            {
                                              onSuccess: () => {
                                                setAssignPopoverOpen(null);
                                                setAssignSearchTerm('');
                                                setEditModalGroups((prev) =>
                                                  prev.filter(
                                                    (g) => g.id !== group.id
                                                  )
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
                                if (
                                  !selectedSharedIban ||
                                  !group.editedName.trim()
                                )
                                  return;

                                resolveSharedMutation.mutate(
                                  {
                                    iban: selectedSharedIban.iban,
                                    name: group.editedName.trim(),
                                    originalNames: [group.entries[0].name],
                                  },
                                  {
                                    onSuccess: () => {
                                      setEditModalGroups((prev) =>
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
                              <Plus className='h-4 w-4' />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent
                            collisionBoundary={modalContentElement}
                          >
                            {t.addressBook?.addToAddressBook ||
                              'Add to address book'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  );
                })
              )}
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  setSharedIbanEditModalOpen(false);
                  setSelectedSharedIban(null);
                  setEditModalGroups([]);
                }}
              >
                {editModalGroups.length === 0
                  ? t.common.close
                  : t.common.cancel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Split Contact Modal */}
        <Dialog
          open={splitModalOpen}
          onOpenChange={(open) => {
            setSplitModalOpen(open);
            if (!open) {
              setSplitContact(null);
              setSplitIbanNames({});
              setSplitNameWarning(null);
            }
          }}
        >
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle>
                {t.addressBook?.splitContact || 'Split contact'}
              </DialogTitle>
              <DialogDescription>
                {t.addressBook?.splitContactDescription ||
                  'Split the contact into separate contacts per IBAN. If a name already exists, this IBAN will be linked to the existing contact.'}
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4 py-3'>
              {splitContact ? (
                (splitContact.ibans || []).map((iban) => (
                  <div key={iban} className='space-y-1.5'>
                    <span className='block text-xs text-muted-foreground'>
                      {iban}
                    </span>
                    <Input
                      value={splitIbanNames[iban] || ''}
                      onChange={(e) =>
                        setSplitIbanNames((prev) => ({
                          ...prev,
                          [iban]: e.target.value,
                        }))
                      }
                      className='w-full'
                      placeholder={splitContact.name}
                    />
                    {(splitIbanNames[iban] || splitContact.name)
                      .trim()
                      .toLowerCase() ===
                    (splitContact.name || '').trim().toLowerCase() ? (
                      <span className='text-xs text-amber-600'>
                        {t.addressBook?.nameEqualsOriginal ||
                          'Name equals original — will not be split'}
                      </span>
                    ) : null}
                  </div>
                ))
              ) : (
                <p>No contact selected</p>
              )}

              {splitNameWarning && (
                <p className='text-sm text-amber-600'>{splitNameWarning}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  setSplitModalOpen(false);
                  setSplitContact(null);
                  setSplitIbanNames({});
                  setSplitNameWarning(null);
                }}
              >
                {t.common.cancel}
              </Button>
              <Button
                className='bg-purple-600 hover:bg-purple-700'
                onClick={async () => {
                  if (!splitContact) return;

                  try {
                    const mappings = Object.entries(splitIbanNames).map(
                      ([iban, name]) => ({
                        iban,
                        name: name || splitContact.name,
                      })
                    );
                    const ibans = mappings.map((m) => m.iban);
                    const names = mappings.map((m) => m.name);
                    const result = await api.splitContact(
                      splitContact.id,
                      ibans,
                      names
                    );
                    queryClient.invalidateQueries({
                      queryKey: ['addressbook', activeProfileId],
                    });
                    queryClient.invalidateQueries({
                      queryKey: ['transactions', activeProfileId],
                    });
                    queryClient.invalidateQueries({
                      queryKey: ['sharedIbans', activeProfileId],
                    });
                    setSplitModalOpen(false);

                    toast.success(
                      (
                        t.addressBook?.contactSplit ||
                        'Contact split ({count} created)'
                      ).replace('{count}', String(result.newContacts.length))
                    );
                  } catch (err: unknown) {
                    const errMessage =
                      err instanceof Error ? err.message : String(err);
                    setSplitNameWarning(
                      errMessage ||
                        t.addressBook?.errorSplitting ||
                        'Error splitting contact'
                    );
                  }
                }}
              >
                {t.addressBook?.split || 'Split'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Suggested Contacts Card */}
        {suggestedContacts.length > 0 && (
          <Card
            data-onboarding='suggested-contacts-card'
            className='border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/10'
          >
            <CardHeader
              className='cursor-pointer'
              onClick={() => setShowSuggestedContacts(!showSuggestedContacts)}
            >
              <div className='flex items-center justify-between'>
                <CardTitle className='flex items-center gap-2 text-blue-700 dark:text-blue-400'>
                  <UserPlus className='h-5 w-5' />
                  {t.addressBook?.suggestedContacts || 'Suggested contacts'}
                  <span className='rounded-full bg-blue-200 px-2 py-0.5 text-xs font-normal dark:bg-blue-800'>
                    {suggestedContacts.length}
                  </span>
                  {showSuggestedContacts ? (
                    <ChevronUp className='ml-1 h-4 w-4' />
                  ) : (
                    <ChevronDown className='ml-1 h-4 w-4' />
                  )}
                </CardTitle>
              </div>
              {!showSuggestedContacts && (
                <CardDescription>
                  {t.addressBook?.suggestedContactsCollapsed ||
                    'Transaction counterparties not yet in your address book. Click to expand.'}
                </CardDescription>
              )}
              {showSuggestedContacts && (
                <CardDescription>
                  {t.addressBook?.suggestedContactsExpanded ||
                    'These are counterparties from your transactions that are not in your address book yet. Add them to track spending per contact.'}
                </CardDescription>
              )}
            </CardHeader>
            {showSuggestedContacts && (
              <CardContent className='space-y-2'>
                {suggestedContacts.slice(0, 20).map((account) => (
                  <div
                    key={account.iban}
                    className='flex items-center justify-between rounded-lg border bg-white p-3 dark:bg-card'
                  >
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='truncate font-medium'>
                          {account.name}
                        </span>
                        <span className='text-xs text-muted-foreground'>
                          ({account.transactionCount}{' '}
                          {t.addressBook?.transactions || 'transactions'})
                        </span>
                      </div>
                      <div className='truncate text-xs text-muted-foreground'>
                        {account.iban}
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span
                        className={cn(
                          'text-sm font-medium',
                          account.netAmount >= 0
                            ? 'text-green-600'
                            : 'text-red-500'
                        )}
                      >
                        {account.netAmount >= 0 ? '+' : ''}
                        <Currency amount={account.netAmount} />
                      </span>
                      <Popover
                        open={suggestedContactPopover === account.iban}
                        onOpenChange={(open) => {
                          if (open) {
                            setSuggestedContactPopover(account.iban);
                            setSuggestedContactEditName(account.name);
                            setSuggestedContactSearch('');
                          } else {
                            setSuggestedContactPopover(null);
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            size='sm'
                            variant='outline'
                            className='h-8 w-8 rounded-md p-0 hover:border-purple-600 hover:bg-purple-600 hover:text-white'
                            disabled={createContactMutation.isPending}
                          >
                            <Plus className='h-4 w-4' />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className='w-72 p-3'
                          align='end'
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className='space-y-3'>
                            {/* Option 1: Add as new contact with editable name */}
                            <div>
                              <label className='mb-1 block text-xs font-medium text-muted-foreground'>
                                {t.addressBook?.addAsNewContact ||
                                  'Add as new contact'}
                              </label>
                              <div className='flex gap-2'>
                                <Input
                                  value={suggestedContactEditName}
                                  onChange={(e) =>
                                    setSuggestedContactEditName(e.target.value)
                                  }
                                  className='h-8 text-sm'
                                  placeholder={
                                    t.addressBook?.enterName || 'Enter name...'
                                  }
                                />
                                <Button
                                  size='sm'
                                  className='h-8 px-3'
                                  onClick={() => {
                                    createContactMutation.mutate({
                                      iban: account.iban,
                                      name: suggestedContactEditName.trim(),
                                    });
                                  }}
                                  disabled={
                                    createContactMutation.isPending ||
                                    !suggestedContactEditName.trim()
                                  }
                                >
                                  <Plus className='h-4 w-4' />
                                </Button>
                              </div>
                            </div>

                            {/* Divider */}
                            <div className='flex items-center gap-2'>
                              <div className='h-px flex-1 bg-border' />
                              <span className='text-xs text-muted-foreground'>
                                {t.common?.or || 'or'}
                              </span>
                              <div className='h-px flex-1 bg-border' />
                            </div>

                            {/* Option 2: Assign to existing contact */}
                            <div>
                              <label className='mb-1 block text-xs font-medium text-muted-foreground'>
                                {t.addressBook?.assignToExisting ||
                                  'Assign to existing contact'}
                              </label>
                              <Input
                                value={suggestedContactSearch}
                                onChange={(e) =>
                                  setSuggestedContactSearch(e.target.value)
                                }
                                className='mb-2 h-8 text-sm'
                                placeholder={
                                  t.addressBook?.searchContacts ||
                                  'Search contacts...'
                                }
                              />
                              <div className='max-h-32 overflow-y-auto'>
                                {(() => {
                                  const searchLower =
                                    suggestedContactSearch.toLowerCase();
                                  const filtered = addressBook
                                    ?.filter(
                                      (c: AddressBookEntry) =>
                                        c.name
                                          .toLowerCase()
                                          .includes(searchLower) ||
                                        c.iban
                                          ?.toLowerCase()
                                          .includes(searchLower)
                                    )
                                    .sort(
                                      (
                                        a: AddressBookEntry,
                                        b: AddressBookEntry
                                      ) => a.name.localeCompare(b.name)
                                    )
                                    .slice(0, 10);

                                  return filtered?.length ? (
                                    filtered.map(
                                      (contact: AddressBookEntry) => (
                                        <button
                                          key={contact.id}
                                          className='flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted'
                                          onClick={() => {
                                            // Add the IBAN to the existing contact
                                            addIbanToContactMutation.mutate({
                                              contactId: contact.id,
                                              iban: account.iban,
                                            });
                                          }}
                                        >
                                          <div className='min-w-0'>
                                            <div className='truncate font-medium'>
                                              {contact.name}
                                            </div>
                                            {contact.iban && (
                                              <div className='truncate text-xs text-muted-foreground'>
                                                {contact.iban}
                                              </div>
                                            )}
                                          </div>
                                        </button>
                                      )
                                    )
                                  ) : (
                                    <div className='py-2 text-center text-sm text-muted-foreground'>
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
                    </div>
                  </div>
                ))}
                {suggestedContacts.length > 20 && (
                  <p className='text-center text-sm text-muted-foreground'>
                    {(
                      t.addressBook?.andMoreSuggested || '...and {count} more'
                    ).replace('{count}', String(suggestedContacts.length - 20))}
                  </p>
                )}
              </CardContent>
            )}
          </Card>
        )}

        {/* Filter Card - separate like Transactions */}
        <div className='-mx-3 sm:mx-0'>
          <Card
            className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
            data-onboarding='addressbook-search'
          >
            <CardContent className='p-4'>
              <div className='flex flex-col gap-4'>
                {/* Search bar */}
                <div className='relative flex-1'>
                  <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    placeholder={
                      t.addressBook?.searchPlaceholder || 'Search...'
                    }
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='pl-10'
                  />
                </div>

                {/* Sort Switch - like Transactions page */}
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>
                    {filteredContacts.length}{' '}
                    {t.addressBook?.contactsCount || 'contacts'}
                  </span>
                  <div
                    ref={switchOuterRef}
                    className='relative inline-flex items-center rounded-lg border border-border bg-muted/50 p-0.5'
                  >
                    {/* Sliding indicator */}
                    <div
                      ref={indicatorRef}
                      className='absolute top-0.5 h-[calc(100%-4px)] rounded-md bg-purple-600 shadow-sm transition-all duration-200 ease-out'
                    />
                    {sortOptions.map((option) => (
                      <button
                        key={option.key}
                        onClick={() => setSortBy(option.key)}
                        className={cn(
                          'relative z-10 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                          sortBy === option.key
                            ? 'text-white'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contacts List Card */}
        <div className='-mx-3 sm:mx-0'>
          <Card
            className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
            data-onboarding='contact-list'
          >
            <CardHeader className='px-3 py-3 sm:px-6 sm:py-4'>
              <CardTitle className='text-base sm:text-lg'>
                {t.addressBook?.contactsTitle || 'Contacts'}
              </CardTitle>
            </CardHeader>
            <CardContent className='px-3 pt-0 pb-3 sm:px-6 sm:pt-0 sm:pb-6'>
              {isLoading ? (
                <div className='space-y-3'>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className='h-20 w-full' />
                  ))}
                </div>
              ) : visibleContacts.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title={
                    search
                      ? t.addressBook?.noResults || 'No contacts found'
                      : t.settings.addressBook.emptyTitle
                  }
                  description={
                    search
                      ? t.addressBook?.tryDifferentSearch ||
                        'Try a different search term'
                      : t.settings.addressBook.emptyDescription
                  }
                />
              ) : (
                <div className='space-y-0 sm:space-y-3'>
                  {(() => {
                    let firstMergedFound = false;
                    return visibleContacts.map((contact, contactIndex) => {
                      const isFirstMerged =
                        !firstMergedFound &&
                        contact.isMerged &&
                        contact.ibans &&
                        contact.ibans.length > 1;
                      if (isFirstMerged) firstMergedFound = true;

                      return (
                        <div
                          key={contact.id}
                          className='overflow-hidden border-x-0 border-t border-b-0 sm:rounded-lg sm:border'
                          {...(contactIndex === 0
                            ? { 'data-onboarding': 'addressbook-contact' }
                            : isFirstMerged
                              ? {
                                  'data-onboarding':
                                    'addressbook-merged-contact',
                                }
                              : {})}
                        >
                          <div
                            className={cn(
                              'group flex items-center justify-between bg-card px-3 py-4 sm:p-4',
                              editingContactId !== contact.id &&
                                'cursor-pointer transition-colors hover:bg-muted/50'
                            )}
                            onClick={(e) => {
                              // Only navigate if not editing and click wasn't on a button
                              if (
                                editingContactId !== contact.id &&
                                !(e.target as HTMLElement).closest('button')
                              ) {
                                // Clear other filters and set address book ID for filtering
                                // Using addressBookId is more reliable than name matching
                                // as it directly links to the address book entry
                                // Keep the current date range - don't reset it
                                setCategories([]);
                                setTransactionType('all');
                                setOpposingAccountIbans([]);
                                setOpposingAccountName(null);
                                setAddressBookId(contact.id);
                                navigate('/transactions/');
                              }
                            }}
                          >
                            {editingContactId === contact.id ? (
                              <div className='flex flex-1 items-center gap-3'>
                                <Input
                                  value={editContactName}
                                  onChange={(e) =>
                                    setEditContactName(e.target.value)
                                  }
                                  placeholder={
                                    t.settings.addressBook.namePlaceholder
                                  }
                                  className='flex-1'
                                />
                                <Input
                                  value={editContactDescription}
                                  onChange={(e) =>
                                    setEditContactDescription(e.target.value)
                                  }
                                  placeholder={
                                    t.settings.addressBook
                                      .descriptionPlaceholder || 'Omschrijving'
                                  }
                                  className='flex-1'
                                />
                                {/* Assign to existing contact button */}
                                <Popover
                                  open={
                                    assignPopoverOpen === `edit-${contact.id}`
                                  }
                                  onOpenChange={(open) => {
                                    setAssignPopoverOpen(
                                      open ? `edit-${contact.id}` : null
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
                                            variant='ghost'
                                            className='h-8 w-8 rounded-full p-0 hover:border-purple-600 hover:bg-purple-600 hover:text-white'
                                            disabled={
                                              mergeContactsMutation.isPending
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
                                    collisionBoundary={modalContentElement}
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
                                            const filtered = addressBook
                                              ?.filter(
                                                (c) =>
                                                  (c.name
                                                    .toLowerCase()
                                                    .includes(searchLower) ||
                                                    c.iban
                                                      ?.toLowerCase()
                                                      .includes(searchLower) ||
                                                    c.ibans?.some((i) =>
                                                      i
                                                        .toLowerCase()
                                                        .includes(searchLower)
                                                    )) &&
                                                  c.id !== contact.id // Exclude current contact
                                              )
                                              .sort((a, b) =>
                                                a.name.localeCompare(b.name)
                                              );
                                            return filtered?.length ? (
                                              filtered.map((targetContact) => (
                                                <button
                                                  key={targetContact.id}
                                                  className='w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted'
                                                  onClick={() => {
                                                    // Merge current contact into target contact
                                                    mergeContactsMutation.mutate(
                                                      {
                                                        contactIds: [
                                                          contact.id,
                                                          targetContact.id,
                                                        ],
                                                        name: targetContact.name, // Keep target contact's name
                                                      },
                                                      {
                                                        onSuccess: () => {
                                                          setAssignPopoverOpen(
                                                            null
                                                          );
                                                          setAssignSearchTerm(
                                                            ''
                                                          );
                                                        },
                                                      }
                                                    );
                                                  }}
                                                >
                                                  <div className='font-medium'>
                                                    {targetContact.name}
                                                  </div>
                                                  <div className='truncate text-xs text-muted-foreground'>
                                                    {targetContact.iban}
                                                  </div>
                                                </button>
                                              ))
                                            ) : (
                                              <div className='py-4 text-center text-sm text-muted-foreground'>
                                                {t.addressBook
                                                  ?.noContactsFound ||
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
                                        variant='ghost'
                                        className='h-8 w-8 rounded-full hover:bg-purple-600 hover:text-white'
                                        onClick={handleUpdateContact}
                                      >
                                        <Check className='h-4 w-4' />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{t.common.save}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider delayDuration={100}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size='sm'
                                        variant='ghost'
                                        className='h-8 w-8 rounded-full hover:bg-purple-600 hover:text-white'
                                        onClick={() =>
                                          setEditingContactId(null)
                                        }
                                      >
                                        <X className='h-4 w-4' />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{t.common.cancel}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            ) : (
                              <>
                                <div className='flex items-center gap-3'>
                                  <div
                                    className={cn(
                                      'flex h-10 w-10 items-center justify-center rounded-full font-medium',
                                      contact.isMerged &&
                                        contact.ibans &&
                                        contact.ibans.length > 1
                                        ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                                        : 'bg-muted text-muted-foreground'
                                    )}
                                  >
                                    {(contact.name || '')
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                  <div>
                                    <div className='flex items-center gap-2'>
                                      <p className='font-medium'>
                                        {contact.name}
                                      </p>
                                      {contact.isMerged &&
                                        contact.ibans &&
                                        contact.ibans.length > 1 && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  size='icon'
                                                  variant='ghost'
                                                  className='h-6 w-6 rounded-md text-purple-600 hover:bg-purple-600 hover:text-white'
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSplitContact(contact);
                                                    // Pre-fill mappings with current IBANs and default names
                                                    const init: Record<
                                                      string,
                                                      string
                                                    > = {};
                                                    (
                                                      contact.ibans || []
                                                    ).forEach((i) => {
                                                      init[i] =
                                                        contact.name + '';
                                                    });
                                                    setSplitIbanNames(init);
                                                    setSplitModalOpen(true);
                                                  }}
                                                >
                                                  <Scissors className='h-3 w-3' />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>
                                                  {t.addressBook
                                                    ?.splitIntoSeparate ||
                                                    'Split account into separate contacts'}
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                      {/* Navigate icon - appears on hover */}
                                      <TooltipProvider delayDuration={100}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className='inline-flex'>
                                              <ExternalLink className='h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100' />
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            {t.addressBook?.viewTransactions ||
                                              'View transactions'}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                    {contact.description && (
                                      <p className='text-sm text-muted-foreground'>
                                        {contact.description}
                                      </p>
                                    )}
                                    <p className='text-sm text-muted-foreground'>
                                      {contact.iban}
                                      {contact.isMerged &&
                                        contact.ibans &&
                                        contact.ibans.length > 1 && (
                                          <span className='ml-1 font-medium text-purple-500'>
                                            {(
                                              t.addressBook?.moreIbans ||
                                              '+{count} more'
                                            ).replace(
                                              '{count}',
                                              String(contact.ibans.length - 1)
                                            )}
                                          </span>
                                        )}
                                    </p>
                                    {/* Badges below IBAN */}
                                    {(contact.isMerged ||
                                      hasSharedIban(contact)) && (
                                      <div className='mt-1 flex items-center gap-2'>
                                        {contact.isMerged && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <span className='rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'>
                                                  {t.addressBook?.mergedBadge ||
                                                    'Samengevoegd'}
                                                </span>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>
                                                  {(
                                                    t.addressBook
                                                      ?.mergedContact ||
                                                    'Merged contact ({count} IBANs)'
                                                  ).replace(
                                                    '{count}',
                                                    String(
                                                      contact.ibans?.length
                                                    )
                                                  )}
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                        {hasSharedIban(contact) && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <span className='rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'>
                                                  {t.addressBook?.sharedIban ||
                                                    'Gedeelde IBAN'}
                                                </span>
                                              </TooltipTrigger>
                                              <TooltipContent className='max-w-xs'>
                                                <p>
                                                  {t.addressBook
                                                    ?.sharedIbanTooltip ||
                                                    'Deze IBAN wordt door meerdere contacten gebruikt, waarschijnlijk via een payment provider zoals Adyen of Mollie'}
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className='flex items-center gap-4'>
                                  {/* Transaction stats */}
                                  <div className='hidden text-right sm:block'>
                                    <p className='font-medium'>
                                      {contact.transactionCount || 0}{' '}
                                      {t.settings.addressBook.transactions}
                                    </p>
                                    <div className='flex items-center justify-end gap-2 text-xs'>
                                      {(contact.totalIncome || 0) > 0 && (
                                        <span className='flex items-center text-emerald-600'>
                                          <ArrowUpRight className='mr-0.5 h-3 w-3' />
                                          <Currency
                                            amount={contact.totalIncome || 0}
                                          />
                                        </span>
                                      )}
                                      {(contact.totalExpenses || 0) > 0 && (
                                        <span className='flex items-center text-red-600'>
                                          <ArrowDownRight className='mr-0.5 h-3 w-3' />
                                          <Currency
                                            amount={contact.totalExpenses || 0}
                                          />
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className='flex gap-1'>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size='icon'
                                            variant='ghost'
                                            className='h-8 w-8 rounded-md transition-colors hover:bg-purple-600 hover:text-white'
                                            onClick={() =>
                                              startEditingContact(contact)
                                            }
                                          >
                                            <Edit2 className='h-4 w-4' />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{t.common.edit}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size='icon'
                                            variant='ghost'
                                            className='h-8 w-8 rounded-md text-destructive transition-colors hover:bg-red-600 hover:text-white dark:hover:bg-red-700'
                                            onClick={async () => {
                                              const isConfirmed = await confirm(
                                                {
                                                  title:
                                                    t.addressBook
                                                      ?.deleteContactTitle ||
                                                    'Delete contact',
                                                  message:
                                                    t.settings.addressBook
                                                      .deleteConfirm,
                                                  variant: 'danger',
                                                }
                                              );
                                              if (isConfirmed) {
                                                deleteContactMutation.mutate(
                                                  contact.id
                                                );
                                              }
                                            }}
                                          >
                                            <Trash2 className='h-4 w-4' />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{t.common.delete}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size='icon'
                                            variant='ghost'
                                            className='h-8 w-8 rounded-md text-muted-foreground transition-colors hover:bg-purple-600 hover:text-white'
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleToggleExpand(contact.id);
                                            }}
                                          >
                                            {expandedContactId ===
                                            contact.id ? (
                                              <ChevronUp className='h-4 w-4' />
                                            ) : (
                                              <ChevronDown className='h-4 w-4' />
                                            )}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          {expandedContactId === contact.id
                                            ? t.common?.collapse || 'Collapse'
                                            : t.addressBook?.showTransactions ||
                                              'Show transactions'}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                          {/* Expanded transactions section */}
                          {expandedContactId === contact.id && (
                            <div className='border-t bg-muted/30 px-3 py-4 sm:px-4'>
                              {loadingContactTransactions ? (
                                <div className='flex items-center justify-center py-4'>
                                  <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
                                </div>
                              ) : contactTransactions &&
                                contactTransactions.length > 0 ? (
                                <div className='space-y-1'>
                                  <h4 className='mb-2 text-sm font-medium'>
                                    {t.addressBook?.transactionHistory ||
                                      'Transaction history'}
                                  </h4>
                                  <div className='max-h-64 overflow-y-auto'>
                                    {contactTransactions.map((tx) => (
                                      <div
                                        key={tx.id}
                                        className='flex items-center justify-between border-b border-dashed py-2 text-sm last:border-0'
                                      >
                                        <div className='flex items-center gap-3'>
                                          <span className='text-muted-foreground'>
                                            {new Date(
                                              tx.date
                                            ).toLocaleDateString('nl-NL', {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric',
                                            })}
                                          </span>
                                          <span className='max-w-xs truncate text-muted-foreground'>
                                            {tx.description}
                                          </span>
                                        </div>
                                        <span className='font-medium'>
                                          <Currency amount={tx.amount} />
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <p className='text-center text-sm text-muted-foreground'>
                                  {t.addressBook?.noTransactionsFound ||
                                    'No transactions found'}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}

                  {/* Load more sentinel and button */}
                  {hasMore && (
                    <>
                      <div ref={loadMoreSentinelRef} className='h-1' />
                      <div className='flex justify-center pt-4'>
                        <Button
                          ref={loadMoreRef}
                          variant='outline'
                          onClick={() => setVisibleCount((prev) => prev + 25)}
                        >
                          {t.addressBook?.loadMore || 'Load more'} (
                          {filteredContacts.length - visibleCount}{' '}
                          {t.addressBook?.remaining || 'remaining'})
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
