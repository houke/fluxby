import { memo } from 'react';
import {
  Check,
  Plus,
  Users,
  UserPlus,
  Scissors,
  Merge,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { formatDate, cn } from '@/lib/utils';
import { Currency } from '@/components/ui/currency';

// Types
import type {
  Transaction,
  Category,
  AddressBookEntry,
  CategoryRule,
  SharedIbanGroup,
} from '@fluxby/shared';

// ============= Create Contact Modal =============
export interface CreateContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  contactName: string;
  onContactNameChange: (name: string) => void;
  onSubmit: () => void;
  t: {
    addressBook?: {
      createNewContact?: string;
      createNewContactWithIban?: string;
      transactionDetails?: string;
    };
    transactions?: {
      date?: string;
      amount?: string;
      counterparty?: string;
      details?: string;
    };
    settings?: {
      addressBook?: {
        namePlaceholder?: string;
      };
    };
    common: {
      cancel: string;
      add?: string;
    };
  };
}

export const CreateContactModal = memo(function CreateContactModal({
  open,
  onOpenChange,
  transaction,
  contactName,
  onContactNameChange,
  onSubmit,
  t,
}: CreateContactModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
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
        {transaction && (
          <div className='space-y-4 py-4'>
            {/* Transaction details card */}
            <div className='rounded-lg border bg-muted/50 p-3'>
              <p className='mb-2 text-xs font-medium text-muted-foreground'>
                {t.addressBook?.transactionDetails || 'Transactiegegevens'}
              </p>
              <div className='space-y-1.5 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>
                    {t.transactions?.date || 'Datum'}:
                  </span>
                  <span className='font-medium'>
                    {formatDate(transaction.date)}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>
                    {t.transactions?.amount || 'Bedrag'}:
                  </span>
                  <span
                    className={cn(
                      'font-medium',
                      transaction.amount > 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    )}
                  >
                    <Currency amount={transaction.amount} />
                  </span>
                </div>
                <div className='flex justify-between gap-2'>
                  <span className='text-muted-foreground'>IBAN:</span>
                  <span className='truncate text-xs'>
                    {transaction.opposingAccountIban}
                  </span>
                </div>
                <div className='flex justify-between gap-2'>
                  <span className='text-muted-foreground'>
                    {t.transactions?.counterparty || 'Tegenrekening'}:
                  </span>
                  <span className='truncate text-right'>
                    {transaction.opposingAccountName ||
                      transaction.merchantName ||
                      '-'}
                  </span>
                </div>
                {(transaction.notes || transaction.description) && (
                  <div className='flex justify-between gap-2'>
                    <span className='text-muted-foreground'>
                      {t.transactions?.details || 'Details'}:
                    </span>
                    <span className='max-w-[200px] truncate text-right text-xs'>
                      {transaction.notes || transaction.description}
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
                value={contactName}
                onChange={(e) => onContactNameChange(e.target.value)}
                placeholder={t.settings?.addressBook?.namePlaceholder || 'Naam'}
                autoFocus
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button onClick={onSubmit} disabled={!contactName.trim()}>
            {t.common.add || 'Toevoegen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// ============= Shared IBAN Modal =============
export interface SharedIbanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSharedIban: {
    iban: string;
    merchants: Array<{ name: string; transactionCount: number }>;
  } | null;
  groups: SharedIbanGroup[];
  onGroupsChange: (groups: SharedIbanGroup[]) => void;
  splitInputValues: Record<string, string>;
  onSplitInputValuesChange: (values: Record<string, string>) => void;
  assignPopoverOpen: string | null;
  onAssignPopoverOpenChange: (id: string | null) => void;
  assignSearchTerm: string;
  onAssignSearchTermChange: (term: string) => void;
  addressBook: AddressBookEntry[] | undefined;
  onResolve: (data: {
    iban: string;
    name: string;
    originalNames: string[];
    contactId?: string;
  }) => void;
  isResolving: boolean;
  isAddingIban: boolean;
  t: {
    transactions: {
      addToAddressBookTitle?: string;
      addToAddressBookDescription?: string;
      allNamesProcessed?: string;
      addButton?: string;
      possiblySameGroup?: string;
      variants?: string;
      transaction?: string;
      transactionsPlural?: string;
      split?: string;
      merge?: string;
      nameForAddressBook?: string;
      allVariantsMergedInfo?: string;
      close?: string;
    };
    addressBook?: {
      assignToExisting?: string;
      searchContacts?: string;
      noContactsFound?: string;
      addToAddressBook?: string;
    };
    apiErrors?: {
      ibanAddedToContact?: string;
    };
    common?: {
      close?: string;
    };
  };
}

export const SharedIbanModal = memo(function SharedIbanModal({
  open,
  onOpenChange,
  selectedSharedIban,
  groups,
  onGroupsChange,
  splitInputValues,
  onSplitInputValuesChange,
  assignPopoverOpen,
  onAssignPopoverOpenChange,
  assignSearchTerm,
  onAssignSearchTermChange,
  addressBook,
  onResolve,
  isResolving,
  isAddingIban,
  t,
}: SharedIbanModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          onGroupsChange([]);
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
          {groups.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>
              <Check className='mx-auto mb-2 h-12 w-12 text-green-500' />
              <p>
                {t.transactions.allNamesProcessed ||
                  'All names have been processed!'}
              </p>
            </div>
          ) : (
            groups.map((group) => {
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
                              value={splitInputValues[entry.name] ?? entry.name}
                              onChange={(e) =>
                                onSplitInputValuesChange({
                                  ...splitInputValues,
                                  [entry.name]: e.target.value,
                                })
                              }
                              className='h-8 text-sm'
                              placeholder={
                                t.transactions?.nameForAddressBook ||
                                'Naam voor adresboek'
                              }
                            />
                          </div>
                        </div>
                        {/* Assign to existing contact button */}
                        <Popover
                          open={
                            assignPopoverOpen ===
                            `split-${group.id}-${entryIdx}`
                          }
                          onOpenChange={(isOpen) => {
                            onAssignPopoverOpenChange(
                              isOpen ? `split-${group.id}-${entryIdx}` : null
                            );
                            if (!isOpen) onAssignSearchTermChange('');
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
                                    disabled={isAddingIban}
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
                                  onAssignSearchTermChange(e.target.value)
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
                                        const hasIban =
                                          c.iban === currentIban ||
                                          c.ibans?.includes(currentIban || '');
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
                                            onResolve({
                                              iban: selectedSharedIban.iban,
                                              name: contact.name,
                                              originalNames: [entry.name],
                                              contactId: contact.id,
                                            });
                                            onAssignPopoverOpenChange(null);
                                            onAssignSearchTermChange('');
                                            // Remove this entry from the group
                                            const newGroups = groups
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
                                                Boolean
                                              ) as SharedIbanGroup[];
                                            onGroupsChange(newGroups);
                                            // Clean up the input value
                                            const newValues = {
                                              ...splitInputValues,
                                            };
                                            delete newValues[entry.name];
                                            onSplitInputValuesChange(newValues);
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
                                      splitInputValues[entry.name] ?? entry.name
                                    ).trim() || entry.name;

                                  onResolve({
                                    iban: selectedSharedIban.iban,
                                    name,
                                    originalNames: [entry.name],
                                  });
                                  // Remove this entry from the group
                                  const newGroups = groups
                                    .map((g) => {
                                      if (g.id !== group.id) return g;
                                      const newEntries = g.entries.filter(
                                        (_, i) => i !== entryIdx
                                      );
                                      if (newEntries.length === 0) return null;
                                      return { ...g, entries: newEntries };
                                    })
                                    .filter(Boolean) as SharedIbanGroup[];
                                  onGroupsChange(newGroups);
                                  // Clean up the input value
                                  const newValues = { ...splitInputValues };
                                  delete newValues[entry.name];
                                  onSplitInputValuesChange(newValues);
                                }}
                                disabled={isResolving}
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

              // Multi-entry group (not split)
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
                          {t.transactions?.possiblySameGroup ||
                            'Mogelijk dezelfde'}{' '}
                          ({group.entries.length}{' '}
                          {t.transactions?.variants || 'varianten'},{' '}
                          {totalTransactions}{' '}
                          {t.transactions?.transactionsPlural || 'transacties'})
                        </span>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-muted-foreground hover:bg-purple-600 hover:text-white'
                        onClick={() => {
                          onGroupsChange(
                            groups.map((g) =>
                              g.id === group.id ? { ...g, isSplit: true } : g
                            )
                          );
                        }}
                      >
                        <Scissors className='mr-1 h-4 w-4' />
                        {t.transactions?.split || 'Splitsen'}
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
                          onGroupsChange(
                            groups.map((g) =>
                              g.id === group.id
                                ? { ...g, editedName: e.target.value }
                                : g
                            )
                          );
                        }}
                        className='h-9 flex-1'
                        placeholder={
                          t.transactions?.nameForAddressBook ||
                          'Naam voor adresboek'
                        }
                      />
                      <Button
                        className='bg-purple-600 hover:bg-purple-700'
                        onClick={() => {
                          if (!selectedSharedIban || !group.editedName.trim())
                            return;
                          const originalNames = group.entries.map(
                            (e) => e.name
                          );
                          onResolve({
                            iban: selectedSharedIban.iban,
                            name: group.editedName.trim(),
                            originalNames,
                          });
                          onGroupsChange(
                            groups.filter((g) => g.id !== group.id)
                          );
                        }}
                        disabled={!group.editedName.trim() || isResolving}
                      >
                        <Merge className='mr-1 h-4 w-4' />
                        {t.transactions?.merge || 'Samenvoegen'}
                      </Button>
                    </div>

                    <p className='mt-2 text-xs text-muted-foreground'>
                      {(
                        t.transactions?.allVariantsMergedInfo ||
                        'Alle {count} varianten worden samengevoegd onder deze naam.'
                      ).replace('{count}', String(group.entries.length))}
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
                          ? t.transactions?.transaction || 'transactie'
                          : t.transactions?.transactionsPlural || 'transacties'}
                        )
                      </span>
                    </div>
                    <div className='mt-2'>
                      <Input
                        value={group.editedName}
                        onChange={(e) => {
                          onGroupsChange(
                            groups.map((g) =>
                              g.id === group.id
                                ? { ...g, editedName: e.target.value }
                                : g
                            )
                          );
                        }}
                        className='h-8 text-sm'
                        placeholder={
                          t.transactions?.nameForAddressBook ||
                          'Naam voor adresboek'
                        }
                      />
                    </div>
                  </div>
                  <Button
                    size='sm'
                    className='bg-purple-600 hover:bg-purple-700'
                    onClick={() => {
                      if (!selectedSharedIban || !group.editedName.trim())
                        return;
                      onResolve({
                        iban: selectedSharedIban.iban,
                        name: group.editedName.trim(),
                        originalNames: [group.entries[0].name],
                      });
                      onGroupsChange(groups.filter((g) => g.id !== group.id));
                    }}
                    disabled={!group.editedName.trim() || isResolving}
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
              onOpenChange(false);
              onGroupsChange([]);
            }}
          >
            {t.transactions?.close || t.common?.close || 'Sluiten'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// ============= Rule Creation Modal =============
export interface RuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rulePattern: string;
  onRulePatternChange: (pattern: string) => void;
  relatedTransactions: Transaction[];
  selectedRelatedIds: Set<string>;
  onSelectedRelatedIdsChange: (ids: Set<string>) => void;
  categories: Category[] | undefined;
  existingRule: CategoryRule | null;
  onCreateRule: () => void;
  onSkipRule: () => void;
  isCreating: boolean;
  t: {
    transactions: {
      createRuleTitle?: string;
      createRuleDescription?: string;
      applyToRelated?: string;
      relatedTransactionsDescription?: string;
      searchPattern?: string;
      searchPatternPlaceholder?: string;
      searchPatternHelp?: string;
      ruleExistsInCategory?: string;
      unknownCategory?: string;
      applyWithoutRule?: string;
      skipButton?: string;
      createRuleButton?: string;
      amount: string;
    };
    categories?: {
      name?: string;
    };
    budgets?: {
      category?: string;
    };
    common: {
      selected?: string;
      none?: string;
    };
  };
}

export const RuleModal = memo(function RuleModal({
  open,
  onOpenChange,
  rulePattern,
  onRulePatternChange,
  relatedTransactions,
  selectedRelatedIds,
  onSelectedRelatedIdsChange,
  categories,
  existingRule,
  onCreateRule,
  onSkipRule,
  isCreating,
  t,
}: RuleModalProps) {
  const existingCategory = existingRule
    ? categories?.find((c) => String(c.id) === String(existingRule.categoryId))
    : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          onSelectedRelatedIdsChange(new Set());
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
                            selectedRelatedIds.size < relatedTransactions.length
                          }
                          onChange={(e) => {
                            const target = e.target as HTMLInputElement;
                            if (target.checked) {
                              onSelectedRelatedIdsChange(
                                new Set(relatedTransactions.map((tx) => tx.id))
                              );
                            } else {
                              onSelectedRelatedIdsChange(new Set());
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
                      <tr key={rt.id} className='text-sm hover:bg-muted/50'>
                        <td className='py-2'>
                          <Checkbox
                            checked={selectedRelatedIds.has(rt.id)}
                            onChange={(e) => {
                              const target = e.target as HTMLInputElement;
                              const newSet: Set<string> = new Set(
                                selectedRelatedIds
                              );
                              if (target.checked) {
                                newSet.add(rt.id);
                              } else {
                                newSet.delete(rt.id);
                              }
                              onSelectedRelatedIdsChange(newSet);
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
                          className={`py-2 pr-4 text-right ${rt.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}
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
              onChange={(e) => onRulePatternChange(e.target.value)}
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
            {existingRule && (
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
            )}
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
            disabled={isCreating || !rulePattern.trim() || !!existingRule}
          >
            {t.transactions.createRuleButton || 'Create rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// ============= Transfer Toggle Modal =============
export interface TransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingTransaction: Transaction | null;
  relatedTransactions: Transaction[];
  selectedRelatedIds: Set<string>;
  onSelectedRelatedIdsChange: (ids: Set<string>) => void;
  isMarkingAsTransfer: boolean;
  onApply: () => void;
  onDetectAll: () => void;
  isPending: boolean;
  isDetecting: boolean;
  t: {
    transactions?: {
      markAsTransferTitle?: string;
      removeTransferTitle?: string;
      markAsTransferDescription?: string;
      removeTransferDescription?: string;
      relatedTransactionsFound?: string;
      applyToAllData?: string;
      applyToSelected?: string;
      transfer?: string;
      income?: string;
      expense?: string;
      type?: string;
      amount: string;
    };
    categories?: {
      name?: string;
    };
    common?: {
      selected?: string;
    };
  };
}

export const TransferModal = memo(function TransferModal({
  open,
  onOpenChange,
  pendingTransaction,
  relatedTransactions,
  selectedRelatedIds,
  onSelectedRelatedIdsChange,
  isMarkingAsTransfer,
  onApply,
  onDetectAll,
  isPending,
  isDetecting,
  t,
}: TransferModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          onSelectedRelatedIdsChange(new Set());
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
                ).replace('{count}', String(relatedTransactions.length))}
              </span>
              {selectedRelatedIds.size > 0 && (
                <span className='text-xs text-muted-foreground'>
                  {selectedRelatedIds.size}{' '}
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
                          selectedRelatedIds.size === relatedTransactions.length
                        }
                        indeterminate={
                          selectedRelatedIds.size > 0 &&
                          selectedRelatedIds.size < relatedTransactions.length
                        }
                        onChange={(e) => {
                          const target = e.target as HTMLInputElement;
                          if (target.checked) {
                            onSelectedRelatedIdsChange(
                              new Set(relatedTransactions.map((tx) => tx.id))
                            );
                          } else {
                            onSelectedRelatedIdsChange(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className='pb-2'>{t.categories?.name || 'Naam'}</th>
                    <th className='pb-2 text-right'>
                      {t.transactions?.amount}
                    </th>
                    <th className='w-20 pb-2'>
                      {t.transactions?.type || 'Type'}
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border/50'>
                  {pendingTransaction && (
                    <tr className='bg-muted/20 text-sm hover:bg-muted/50'>
                      <td className='py-2'>
                        <Checkbox checked disabled />
                      </td>
                      <td className='max-w-[200px] py-2'>
                        <div className='truncate font-medium'>
                          {pendingTransaction.merchantName ||
                            pendingTransaction.opposingAccountName ||
                            pendingTransaction.description}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          {formatDate(pendingTransaction.date)}
                        </div>
                      </td>
                      <td
                        className={`py-2 text-right ${
                          pendingTransaction.type === 'transfer'
                            ? 'text-blue-600'
                            : pendingTransaction.amount > 0
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                        }`}
                      >
                        <Currency amount={pendingTransaction.amount} />
                      </td>
                      <td className='py-2'>
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-xs',
                            pendingTransaction.type === 'transfer'
                              ? 'bg-blue-100 text-blue-700'
                              : pendingTransaction.amount > 0
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                          )}
                        >
                          {pendingTransaction.type === 'transfer'
                            ? t.transactions?.transfer || 'Overboeking'
                            : pendingTransaction.type === 'income'
                              ? t.transactions?.income || 'Inkomst'
                              : t.transactions?.expense || 'Uitgave'}
                        </span>
                      </td>
                    </tr>
                  )}
                  {relatedTransactions.map((rt) => (
                    <tr key={rt.id} className='text-sm hover:bg-muted/50'>
                      <td className='py-2'>
                        <Checkbox
                          checked={selectedRelatedIds.has(rt.id)}
                          onChange={(e) => {
                            const target = e.target as HTMLInputElement;
                            const newSet: Set<string> = new Set(
                              selectedRelatedIds
                            );
                            if (target.checked) {
                              newSet.add(rt.id);
                            } else {
                              newSet.delete(rt.id);
                            }
                            onSelectedRelatedIdsChange(newSet);
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
              onClick={onDetectAll}
              disabled={isDetecting}
            >
              {t.transactions?.applyToAllData || 'Toepassen op alle data'}
            </Button>
          )}
          <Button onClick={onApply} disabled={isPending}>
            {(
              t.transactions?.applyToSelected ||
              'Toepassen op {count} transacties'
            ).replace('{count}', String(1 + selectedRelatedIds.size))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default {
  CreateContactModal,
  SharedIbanModal,
  RuleModal,
  TransferModal,
};
