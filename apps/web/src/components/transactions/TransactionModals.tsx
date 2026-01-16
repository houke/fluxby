import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Plus,
  UserPlus,
  Users,
  Scissors,
  Merge,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Currency } from '@/components/ui/currency';
import { formatDate, cn } from '@/lib/utils';
import type { Transaction, Category, AddressBookEntry } from '@fluxby/shared';

export interface SharedIbanGroup {
  id: number;
  entries: Array<{ name: string; transactionCount: number }>;
  editedName: string;
  isSplit: boolean;
}

export interface SharedIbanData {
  iban: string;
  merchants: Array<{ name: string; transactionCount: number }>;
}

interface TransactionModalsProps {
  // Create Contact Modal
  createContactModalOpen: boolean;
  setCreateContactModalOpen: (open: boolean) => void;
  createContactTransaction: Transaction | null;
  setCreateContactTransaction: (tx: Transaction | null) => void;
  createContactName: string;
  setCreateContactName: (name: string) => void;
  onAddContact: () => void;

  // Shared IBAN Modal
  sharedIbanModalOpen: boolean;
  setSharedIbanModalOpen: (open: boolean) => void;
  selectedSharedIban: SharedIbanData | null;
  setSelectedSharedIban: (data: SharedIbanData | null) => void;
  sharedIbanGroups: SharedIbanGroup[];
  setSharedIbanGroups: React.Dispatch<React.SetStateAction<SharedIbanGroup[]>>;
  splitInputValues: Record<string, string>;
  setSplitInputValues: (
    fn: (prev: Record<string, string>) => Record<string, string>
  ) => void;
  assignPopoverOpen: string | null;
  setAssignPopoverOpen: (id: string | null) => void;
  assignSearchTerm: string;
  setAssignSearchTerm: (term: string) => void;
  addressBook: AddressBookEntry[] | undefined;
  onResolveShared: (
    params: {
      iban: string;
      name: string;
      originalNames: string[];
      contactId?: string;
    },
    options?: Record<string, unknown>
  ) => void;
  isResolvePending: boolean;
  onAddIbanToContact: (
    data: { contactId: string; iban: string },
    options?: Record<string, unknown>
  ) => void;
  isAddIbanPending: boolean;

  // Rule Creation Modal
  ruleModalOpen: boolean;
  setRuleModalOpen: (open: boolean) => void;
  rulePattern: string;
  setRulePattern: (pattern: string) => void;
  pendingRuleTransaction: { tx: Transaction; categoryId: string } | null;
  setPendingRuleTransaction: (
    data: { tx: Transaction; categoryId: string } | null
  ) => void;
  relatedTransactions: Transaction[];
  setRelatedTransactions: (txs: Transaction[]) => void;
  selectedRelatedIds: Set<string>;
  setSelectedRelatedIds: (ids: Set<string>) => void;
  categories: Category[] | undefined;
  onSkipRule: () => void;
  onCreateRule: () => void;
  isCreateRulePending: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findExistingRule: (pattern: string) => any;

  // Transfer Toggle Modal
  transferModalOpen: boolean;
  setTransferModalOpen: (open: boolean) => void;
  pendingTransferTransaction: Transaction | null;
  setPendingTransferTransaction: (tx: Transaction | null) => void;
  transferRelatedTransactions: Transaction[];
  setTransferRelatedTransactions: (txs: Transaction[]) => void;
  selectedTransferRelatedIds: Set<string>;
  setSelectedTransferRelatedIds: (ids: Set<string>) => void;
  isMarkingAsTransfer: boolean;
  onDetectInternalTransfers: () => void;
  isDetectPending: boolean;
  onApplyTransferToRelated: () => void;
  isUpdatePending: boolean;

  // Global
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  translations: any;
}

export const TransactionModals: React.FC<TransactionModalsProps> = ({
  createContactModalOpen,
  setCreateContactModalOpen,
  createContactTransaction,
  setCreateContactTransaction,
  createContactName,
  setCreateContactName,
  onAddContact,
  sharedIbanModalOpen,
  setSharedIbanModalOpen,
  selectedSharedIban,
  setSelectedSharedIban,
  sharedIbanGroups,
  setSharedIbanGroups,
  splitInputValues,
  setSplitInputValues,
  assignPopoverOpen,
  setAssignPopoverOpen,
  assignSearchTerm,
  setAssignSearchTerm,
  addressBook,
  onResolveShared,
  isResolvePending,
  onAddIbanToContact: _onAddIbanToContact,
  isAddIbanPending,
  ruleModalOpen,
  setRuleModalOpen,
  rulePattern,
  setRulePattern,
  pendingRuleTransaction: _pendingRuleTransaction,
  setPendingRuleTransaction,
  relatedTransactions,
  setRelatedTransactions,
  selectedRelatedIds,
  setSelectedRelatedIds,
  categories,
  onSkipRule,
  onCreateRule,
  isCreateRulePending,
  findExistingRule,
  transferModalOpen,
  setTransferModalOpen,
  pendingTransferTransaction,
  setPendingTransferTransaction,
  transferRelatedTransactions,
  setTransferRelatedTransactions,
  selectedTransferRelatedIds,
  setSelectedTransferRelatedIds,
  isMarkingAsTransfer,
  onDetectInternalTransfers,
  isDetectPending,
  onApplyTransferToRelated,
  isUpdatePending,
  translations: t,
}) => {
  return (
    <>
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
            <Button onClick={onAddContact} disabled={!createContactName.trim()}>
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
                  <span className='font-mono'>{selectedSharedIban.iban}</span>
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
                                      disabled={isAddIbanPending}
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
                                              onResolveShared(
                                                {
                                                  iban: selectedSharedIban.iban,
                                                  name: contact.name,
                                                  originalNames: [entry.name],
                                                  contactId: contact.id,
                                                },
                                                {
                                                  onSuccess: () => {
                                                    setAssignPopoverOpen(null);
                                                    setAssignSearchTerm('');
                                                    // Remove this entry from the group
                                                    setSharedIbanGroups(
                                                      (prev) =>
                                                        prev
                                                          .map((g) => {
                                                            if (
                                                              g.id !== group.id
                                                            )
                                                              return g;
                                                            const newEntries =
                                                              g.entries.filter(
                                                                (_, i) =>
                                                                  i !== entryIdx
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
                                                            (
                                                              g
                                                            ): g is SharedIbanGroup =>
                                                              !!g
                                                          )
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

                                    onResolveShared(
                                      {
                                        iban: selectedSharedIban.iban,
                                        name,
                                        originalNames: [entry.name],
                                      },
                                      {
                                        onSuccess: () => {
                                          // Remove this entry from the group
                                          setSharedIbanGroups((prev) =>
                                            prev
                                              .map((g) => {
                                                if (g.id !== group.id) return g;
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
                                                (g): g is SharedIbanGroup => !!g
                                              )
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
                                  disabled={isResolvePending}
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
                            Mogelijk dezelfde ({group.entries.length} varianten,{' '}
                            {totalTransactions} transacties)
                          </span>
                        </div>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-muted-foreground hover:bg-purple-600 hover:text-white'
                          onClick={() => {
                            setSharedIbanGroups((prev) =>
                              prev.map((g) =>
                                g.id === group.id ? { ...g, isSplit: true } : g
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
                            if (!selectedSharedIban || !group.editedName.trim())
                              return;

                            // Get all original names from this group
                            const originalNames = group.entries.map(
                              (e) => e.name
                            );

                            onResolveShared(
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
                            !group.editedName.trim() || isResolvePending
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

                        onResolveShared(
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
                      disabled={!group.editedName.trim() || isResolvePending}
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
              {t.common.close || 'Sluiten'}
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
                              if (e.target.checked) {
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
                        <th className='pb-2'>{t.categories?.name || 'Naam'}</th>
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
                            const newSet = new Set(selectedRelatedIds);
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
                                const newSet = new Set(selectedRelatedIds);
                                if (e.target.checked) {
                                  newSet.add(rt.id);
                                } else {
                                  newSet.delete(rt.id);
                                }
                                setSelectedRelatedIds(newSet);
                              }}
                              onClick={(e) => e.stopPropagation()}
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
                                {categories?.find((c) => c.id === rt.categoryId)
                                  ?.name || '...'}
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
            <Button variant='outline' onClick={onSkipRule}>
              {relatedTransactions.length > 0 && selectedRelatedIds.size > 0
                ? t.transactions?.applyWithoutRule || 'Toepassen zonder regel'
                : t.transactions.skipButton || 'Skip'}
            </Button>
            <Button
              onClick={onCreateRule}
              disabled={
                isCreateRulePending ||
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
                            if (e.target.checked) {
                              setSelectedTransferRelatedIds(
                                new Set(
                                  transferRelatedTransactions.map((tx) => tx.id)
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
                              const newSet = new Set(
                                selectedTransferRelatedIds
                              );
                              if (e.target.checked) {
                                newSet.add(rt.id);
                              } else {
                                newSet.delete(rt.id);
                              }
                              setSelectedTransferRelatedIds(newSet);
                            }}
                            onClick={(e) => e.stopPropagation()}
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
                                : rt.type === 'expense'
                                  ? t.transactions?.expense || 'Uitgave'
                                  : ''}
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
                onClick={onDetectInternalTransfers}
                disabled={isDetectPending}
              >
                {t.transactions?.applyToAllData || 'Toepassen op alle data'}
              </Button>
            )}
            <Button
              onClick={onApplyTransferToRelated}
              disabled={isUpdatePending}
            >
              {(
                t.transactions?.applyToSelected ||
                'Toepassen op {count} transacties'
              ).replace('{count}', String(1 + selectedTransferRelatedIds.size))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
