import {
  useEffect,
  useRef,
  useState,
  useLayoutEffect,
  useMemo,
  useCallback,
  useDeferredValue,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/contexts/ToastContext';
import { Plus, Settings2 } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useFilters } from '@/contexts/FilterContext';
import { cn, findSimilarNameGroups } from '@/lib/utils';
import {
  useAddressBook,
  AddressBookEntryWithStats,
} from '@/hooks/useAddressBook';
import { useSharedIbans } from '@/hooks/useSharedIbans';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useConfirm } from '@/contexts/ConfirmContext';

import { AddressBookFilters } from '@/components/address-book/AddressBookFilters';
import { CleanupRulesManager } from '@/components/address-book/CleanupRulesManager';
import { SharedIbanManager } from '@/components/address-book/SharedIbanManager';
import { SuggestedContacts } from '@/components/address-book/SuggestedContacts';
import { ContactList } from '@/components/address-book/ContactList';
import {
  AddressBookModals,
  type AddressBookModalGroup,
} from '@/components/address-book/AddressBookModals';

import type { AddressBookEntry, SharedIban } from '@fluxby/shared';

type SortOption = 'name' | 'transactionCount' | 'totalAmount' | 'recent';

export default function AddressBook() {
  const { t } = useLanguage();
  const { activeProfileId } = useProfile();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const {
    setOpposingAccountIbans,
    setOpposingAccountName,
    setAddressBookId,
    setCategories,
    setTransactionType,
  } = useFilters();
  useDocumentTitle(t.addressBook?.title || t.settings.addressBook.title);

  const queryClient = useQueryClient();
  const {
    addressBook,
    cleanupRules,
    suggestedContacts,
    isLoading,
    createContactMutation: createContactMutationHook,
    updateContactMutation: updateContactMutationHook,
    deleteContactMutation: deleteContactMutationHook,
    createRuleMutation: createRuleMutationHook,
    deleteRuleMutation: deleteRuleMutationHook,
    applyRulesMutation: applyRulesMutationHook,
    mergeContactsMutation: mergeContactsMutationHook,
  } = useAddressBook();

  const {
    sharedIbans,
    isLoading: sharedIbansLoading,
    detectSharedMutation: detectSharedMutationHook,
    resolveSharedMutation: resolveSharedMutationHook,
    addIbanToContactMutation: addIbanToContactHook,
  } = useSharedIbans();

  // Search and sort state
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [sortBy, setSortBy] = useState<SortOption>('name');

  // Add contact card toggle state
  const [showAddForm, setShowAddForm] = useState(false);

  // lazy count removed, replaced by virtualization

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
  >(null);
  const [suggestedContactEditName, setSuggestedContactEditName] = useState('');
  const [suggestedContactSearch, setSuggestedContactSearch] = useState('');

  // Shared IBAN edit modal state
  const [sharedIbanEditModalOpen, setSharedIbanEditModalOpen] = useState(false);
  const [selectedSharedIban, setSelectedSharedIban] =
    useState<SharedIban | null>(null);
  const [editModalGroups, setEditModalGroups] = useState<
    AddressBookModalGroup[]
  >([]);
  const [splitInputValues, setSplitInputValues] = useState<
    Record<string, string>
  >({});

  // Split contact modal state
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [splitContact, setSplitContact] =
    useState<AddressBookEntryWithStats | null>(null);
  const [splitIbanNames, setSplitIbanNames] = useState<Record<string, string>>(
    {}
  );
  const [splitNameWarning, setSplitNameWarning] = useState<string | null>(null);

  // Expanded contact state for showing transactions
  const [expandedContactId, setExpandedContactId] = useState<string | null>(
    null
  );

  // State for assign-to-existing contact popover
  const [assignPopoverOpen, setAssignPopoverOpen] = useState<string | null>(
    null
  );
  const [assignSearchTerm, setAssignSearchTerm] = useState('');

  // Toast
  const toast = useToast();

  // Refs for indicator
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const switchOuterRef = useRef<HTMLDivElement | null>(null);

  // Modal content ref
  const modalContentRef = useRef<HTMLDivElement | null>(null);
  const [modalContentElement, setModalContentElement] =
    useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setModalContentElement(modalContentRef.current);
  }, [sharedIbanEditModalOpen]);

  const { data: contactTransactions, isLoading: loadingContactTransactions } =
    useQuery({
      queryKey: ['contact-transactions', expandedContactId],
      queryFn: () =>
        expandedContactId
          ? api.getTransactionsForContact(expandedContactId)
          : null,
      enabled: !!expandedContactId,
    });

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedContactId((prev) => (prev === id ? null : id));
  }, []);

  const handleUpdateContact = useCallback(async () => {
    if (!editingContactId) return;
    updateContactMutationHook.mutate({
      id: editingContactId,
      data: { name: editContactName, description: editContactDescription },
    });
    setEditingContactId(null);
  }, [
    editingContactId,
    editContactName,
    editContactDescription,
    updateContactMutationHook,
  ]);

  const handleAddContact = useCallback(() => {
    if (!newContactIban || !newContactName) return;
    createContactMutationHook.mutate({
      iban: newContactIban,
      name: newContactName,
      description: newContactDescription,
    });
    setNewContactIban('');
    setNewContactName('');
    setNewContactDescription('');
    setShowAddForm(false);
  }, [
    newContactIban,
    newContactName,
    newContactDescription,
    createContactMutationHook,
  ]);

  const handleSelectContactTransactions = useCallback(
    (contact: AddressBookEntryWithStats) => {
      setCategories([]);
      setTransactionType('all');
      setOpposingAccountIbans([]);
      setOpposingAccountName(null);
      setAddressBookId(contact.id);
      navigate('/transactions/');
    },
    [
      navigate,
      setAddressBookId,
      setCategories,
      setOpposingAccountIbans,
      setOpposingAccountName,
      setTransactionType,
    ]
  );

  const hasSharedIban = useCallback(
    (contact: AddressBookEntry | AddressBookEntryWithStats) => {
      return (
        (contact.iban && sharedIbans?.some((s) => s.iban === contact.iban)) ||
        false
      );
    },
    [sharedIbans]
  );

  const filteredContacts = useMemo(() => {
    if (!addressBook) return [];
    const searchLower = deferredSearch.toLowerCase();
    const filtered = addressBook.filter(
      (contact) =>
        contact.name.toLowerCase().includes(searchLower) ||
        contact.iban?.toLowerCase().includes(searchLower) ||
        contact.description?.toLowerCase().includes(searchLower) ||
        contact.ibans?.some((iban: string) =>
          iban.toLowerCase().includes(searchLower)
        )
    );

    return filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'transactionCount')
        return (b.transactionCount || 0) - (a.transactionCount || 0);
      if (sortBy === 'totalAmount')
        return (b.totalExpenses || 0) - (a.totalExpenses || 0);
      if (sortBy === 'recent') {
        const dateA = a.lastTransactionDate
          ? new Date(a.lastTransactionDate).getTime()
          : 0;
        const dateB = b.lastTransactionDate
          ? new Date(b.lastTransactionDate).getTime()
          : 0;
        return dateB - dateA;
      }
      return 0;
    });
  }, [addressBook, deferredSearch, sortBy]);

  const visibleContacts = filteredContacts;

  useLayoutEffect(() => {
    const sortOptions = [
      { key: 'name', label: 'Naam' },
      { key: 'transactionCount', label: 'Transacties' },
      { key: 'totalAmount', label: 'Totaal' },
      { key: 'recent', label: 'Recent' },
    ];
    if (indicatorRef.current && switchOuterRef.current) {
      const activeIdx = sortOptions.findIndex((opt) => opt.key === sortBy);
      const buttons = switchOuterRef.current.querySelectorAll('button');
      const activeBtn = buttons[activeIdx];
      if (activeBtn) {
        indicatorRef.current.style.width = `${activeBtn.offsetWidth}px`;
        indicatorRef.current.style.left = `${activeBtn.offsetLeft}px`;
      }
    }
  }, [sortBy]);

  return (
    <div className='space-y-0 sm:space-y-6'>
      <PageHeader
        title={t.addressBook?.title || t.settings.addressBook.title}
        subtitle={
          t.addressBook?.subtitle || 'Beheer je adresboek en opschoonregels.'
        }
        actions={
          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={() => setShowCleanupRules(!showCleanupRules)}
              className={cn(showCleanupRules && 'bg-muted')}
            >
              <Settings2 className='mr-2 h-4 w-4' />
              {t.addressBook?.cleanupRules || 'Cleanup rules'}
            </Button>
            <Button
              className='bg-purple-600 hover:bg-purple-700'
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className='mr-2 h-4 w-4' />
              {t.addressBook?.addContact || 'Add contact'}
            </Button>
          </div>
        }
      />

      {showAddForm && (
        <Card className='border-purple-100 bg-purple-50/30 dark:border-purple-900/30 dark:bg-purple-900/10'>
          <CardHeader>
            <CardTitle className='text-base sm:text-lg'>
              {t.addressBook?.createNewContact || 'Nieuw contact toevoegen'}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>
                  {t.settings?.profile?.nameLabel || 'Naam'}
                </label>
                <Input
                  placeholder={t.settings?.addressBook?.namePlaceholder}
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>IBAN</label>
                <Input
                  placeholder='NL00 BANK 0000 0000 00'
                  value={newContactIban}
                  onChange={(e) => setNewContactIban(e.target.value)}
                />
              </div>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                {t.settings?.addressBook?.descriptionPlaceholder ||
                  'Omschrijving'}
              </label>
              <Input
                placeholder={
                  t.settings?.addressBook?.descriptionPlaceholder ||
                  'Bijv. Werkgever, Huur, etc.'
                }
                value={newContactDescription}
                onChange={(e) => setNewContactDescription(e.target.value)}
              />
            </div>
            <div className='flex justify-end gap-2'>
              <Button variant='ghost' onClick={() => setShowAddForm(false)}>
                {t.common.cancel}
              </Button>
              <Button
                className='bg-purple-600 hover:bg-purple-700'
                onClick={handleAddContact}
                disabled={
                  !newContactIban ||
                  !newContactName ||
                  createContactMutationHook.isPending
                }
              >
                {t.common.add}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showCleanupRules && (
        <CleanupRulesManager
          cleanupRules={cleanupRules}
          newRulePattern={newRulePattern}
          setNewRulePattern={setNewRulePattern}
          onCreateRule={(pattern) => {
            createRuleMutationHook.mutate(pattern);
            setNewRulePattern('');
          }}
          onDeleteRule={(id) => deleteRuleMutationHook.mutate(id)}
          onApplyToAddressBook={() => applyRulesMutationHook.mutate()}
          onApplyToTransactions={() => applyRulesMutationHook.mutate()}
          isCreatePending={createRuleMutationHook.isPending}
          isDeletePending={deleteRuleMutationHook.isPending}
          isApplyAddressBookPending={applyRulesMutationHook.isPending}
          isApplyTransactionsPending={applyRulesMutationHook.isPending}
          translations={t}
        />
      )}

      <SharedIbanManager
        sharedIbans={sharedIbans || []}
        isLoading={sharedIbansLoading}
        showSharedIbans={showSharedIbans}
        setShowSharedIbans={setShowSharedIbans}
        onDetectShared={() => detectSharedMutationHook.mutate()}
        isDetectPending={detectSharedMutationHook.isPending}
        onEditShared={useCallback(
          (shared: SharedIban) => {
            setSelectedSharedIban(shared);
            const names = shared.merchants.map((m) => m.name);
            const similarGroups = findSimilarNameGroups(
              names,
              0.6,
              cleanupRules
            );
            const assignedIndices = new Set<number>();
            const groups: AddressBookModalGroup[] = [];
            for (const similarGroup of similarGroups) {
              const entries = similarGroup.map((idx) => {
                assignedIndices.add(idx);
                const m = shared.merchants[idx];
                return { name: m.name, transactionCount: m.transactionCount };
              });
              const mostCommon = entries.reduce((a, b) =>
                a.transactionCount > b.transactionCount ? a : b
              );
              groups.push({
                id: crypto.randomUUID(),
                entries,
                editedName: mostCommon.name,
                isSplit: false,
              });
            }
            const ungroupedEntries = shared.merchants
              .filter((_, idx) => !assignedIndices.has(idx))
              .map((m) => ({
                name: m.name,
                transactionCount: m.transactionCount,
              }));
            if (ungroupedEntries.length > 0) {
              const mostCommon = ungroupedEntries.reduce((a, b) =>
                a.transactionCount > b.transactionCount ? a : b
              );
              groups.push({
                id: crypto.randomUUID(),
                entries: ungroupedEntries,
                editedName: mostCommon.name,
                isSplit: false,
              });
            }
            setEditModalGroups(groups);
            setSharedIbanEditModalOpen(true);
          },
          [cleanupRules]
        )}
        cleanupRules={cleanupRules}
        translations={t}
      />

      <SuggestedContacts
        suggestedContacts={suggestedContacts || []}
        showSuggestedContacts={showSuggestedContacts}
        setShowSuggestedContacts={setShowSuggestedContacts}
        suggestedContactPopover={suggestedContactPopover}
        setSuggestedContactPopover={setSuggestedContactPopover}
        suggestedContactEditName={suggestedContactEditName}
        setSuggestedContactEditName={setSuggestedContactEditName}
        suggestedContactSearch={suggestedContactSearch}
        setSuggestedContactSearch={setSuggestedContactSearch}
        addressBook={addressBook}
        onCreateContact={(data) => createContactMutationHook.mutate(data)}
        onAddIbanToContact={(data) => {
          if (data.contactId) {
            addIbanToContactHook.mutate({
              contactId: data.contactId as string,
              iban: data.iban,
            });
          }
        }}
        isCreateContactPending={createContactMutationHook.isPending}
        translations={t}
      />

      <AddressBookFilters
        search={search}
        setSearch={setSearch}
        sortBy={sortBy}
        setSortBy={setSortBy}
        filteredCount={filteredContacts.length}
        translations={t}
        indicatorRef={indicatorRef}
        switchOuterRef={switchOuterRef}
      />

      <ContactList
        contacts={filteredContacts}
        isLoading={isLoading}
        search={search}
        onAddContact={() => setShowAddForm(true)}
        onEditContact={(contact) => {
          setEditingContactId(contact.id);
          setEditContactName(contact.name);
          setEditContactDescription(contact.description || '');
        }}
        onDeleteContact={async (id) => {
          const isConfirmed = await confirm({
            title: t.addressBook?.deleteContactTitle || 'Delete contact',
            message: t.settings.addressBook.deleteConfirm,
            variant: 'danger',
          });
          if (isConfirmed) deleteContactMutationHook.mutate(id);
        }}
        onUpdateContact={handleUpdateContact}
        onCancelEdit={() => setEditingContactId(null)}
        editingContactId={editingContactId}
        editContactName={editContactName}
        setEditContactName={setEditContactName}
        editContactDescription={editContactDescription}
        setEditContactDescription={setEditContactDescription}
        expandedContactId={expandedContactId}
        onToggleExpand={handleToggleExpand}
        contactTransactions={contactTransactions || []}
        isLoadingTransactions={loadingContactTransactions}
        onSplitContact={(contact) => {
          setSplitContact(contact);
          const init: Record<string, string> = {};
          (contact.ibans || []).forEach((i) => {
            init[i] = contact.name + '';
          });
          setSplitIbanNames(() => init);
          setSplitModalOpen(true);
        }}
        onSelectContactTransactions={handleSelectContactTransactions}
        hasSharedIban={hasSharedIban}
        addressBook={addressBook}
        onMergeContacts={(data) => mergeContactsMutationHook.mutate(data)}
        isMergePending={mergeContactsMutationHook.isPending}
        assignPopoverOpen={assignPopoverOpen}
        setAssignPopoverOpen={setAssignPopoverOpen}
        assignSearchTerm={assignSearchTerm}
        setAssignSearchTerm={setAssignSearchTerm}
        modalContentElement={modalContentElement}
        translations={t}
      />

      {/* Load more button removed, virtualization handles all data now */}

      <AddressBookModals
        sharedIbanEditModalOpen={sharedIbanEditModalOpen}
        setSharedIbanEditModalOpen={setSharedIbanEditModalOpen}
        selectedSharedIban={selectedSharedIban}
        editModalGroups={editModalGroups}
        setEditModalGroups={setEditModalGroups}
        splitInputValues={splitInputValues}
        setSplitInputValues={setSplitInputValues}
        assignPopoverOpen={assignPopoverOpen}
        setAssignPopoverOpen={setAssignPopoverOpen}
        assignSearchTerm={assignSearchTerm}
        setAssignSearchTerm={setAssignSearchTerm}
        addressBook={addressBook}
        onResolveShared={(data, options) =>
          resolveSharedMutationHook.mutate(data, options)
        }
        isResolvePending={resolveSharedMutationHook.isPending}
        onAddIbanToContact={(data) => {
          if (data.contactId) {
            addIbanToContactHook.mutate({
              contactId: data.contactId as string,
              iban: data.iban,
            });
          }
        }}
        isAddIbanPending={addIbanToContactHook.isPending}
        modalContentRef={modalContentRef}
        modalContentElement={modalContentElement}
        splitModalOpen={splitModalOpen}
        setSplitModalOpen={setSplitModalOpen}
        splitContact={splitContact}
        setSplitContact={setSplitContact}
        splitIbanNames={splitIbanNames}
        setSplitIbanNames={setSplitIbanNames}
        splitNameWarning={splitNameWarning}
        setSplitNameWarning={setSplitNameWarning}
        onSplitContact={async (data) => {
          const result = await api.splitContact(
            data.contactId,
            data.ibans,
            data.names
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
          toast.success(
            (
              t.addressBook?.contactSplit || 'Contact split ({count} created)'
            ).replace('{count}', String(result.newContacts.length))
          );
          return result;
        }}
        translations={t}
      />
    </div>
  );
}
