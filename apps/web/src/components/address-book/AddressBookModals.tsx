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
import { Plus, UserPlus, Merge, Users, Scissors, Check } from 'lucide-react';
import type { AddressBookEntryWithStats } from '@/hooks/useAddressBook';

// Use a simplified version if not exported, or define here if needed.
// Since we can't easily import from a component file if it's not set up for it,
// let's define the shape here to be safe and self-contained.
export interface SharedIbanEntry {
  name: string;
  transactionCount: number;
}

export interface AddressBookModalGroup {
  id: string;
  entries: SharedIbanEntry[];
  isSplit?: boolean;
  editedName?: string;
}

export interface ResolveSharedData {
  iban: string;
  name: string;
  originalNames: string[];
  contactId?: string;
}

interface AddressBookModalsProps {
  // Shared IBAN Edit Modal
  sharedIbanEditModalOpen: boolean;
  setSharedIbanEditModalOpen: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedSharedIban: any | null;
  editModalGroups: AddressBookModalGroup[];
  setEditModalGroups: (
    fn: (prev: AddressBookModalGroup[]) => AddressBookModalGroup[]
  ) => void;
  splitInputValues: Record<string, string>;
  setSplitInputValues: (
    fn: (prev: Record<string, string>) => Record<string, string>
  ) => void;
  assignPopoverOpen: string | null;
  setAssignPopoverOpen: (id: string | null) => void;
  assignSearchTerm: string;
  setAssignSearchTerm: (term: string) => void;
  addressBook: AddressBookEntryWithStats[] | undefined;
  onResolveShared: (
    data: ResolveSharedData,
    options: { onSuccess: () => void }
  ) => void;
  isResolvePending: boolean;
  onAddIbanToContact: (data: { contactId?: string; iban: string }) => void;
  isAddIbanPending: boolean;
  modalContentRef: React.RefObject<HTMLDivElement | null>;
  modalContentElement: HTMLDivElement | null;

  // Split Contact Modal
  splitModalOpen: boolean;
  setSplitModalOpen: (open: boolean) => void;
  splitContact: AddressBookEntryWithStats | null;
  setSplitContact: (contact: AddressBookEntryWithStats | null) => void;
  splitIbanNames: Record<string, string>;
  setSplitIbanNames: (
    fn: (prev: Record<string, string>) => Record<string, string>
  ) => void;
  splitNameWarning: string | null;
  setSplitNameWarning: (warning: string | null) => void;
  onSplitContact: (data: {
    contactId: string;
    ibans: string[];
    names: string[];
  }) => Promise<unknown>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  translations: any;
}

export const AddressBookModals = React.memo<AddressBookModalsProps>(
  ({
    sharedIbanEditModalOpen,
    setSharedIbanEditModalOpen,
    selectedSharedIban,
    editModalGroups,
    setEditModalGroups,
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
    modalContentRef,
    modalContentElement,

    splitModalOpen,
    setSplitModalOpen,
    splitContact,
    setSplitContact,
    splitIbanNames,
    setSplitIbanNames,
    splitNameWarning,
    setSplitNameWarning,
    onSplitContact,

    translations: t,
  }) => {
    return (
      <>
        {/* Edit Shared IBAN Modal */}
        <Dialog
          open={sharedIbanEditModalOpen}
          onOpenChange={(open) => {
            setSharedIbanEditModalOpen(open);
            if (!open) {
              setEditModalGroups(() => []);
              setSplitInputValues(() => ({}));
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
                  const isMultiEntry = group.entries.length > 1;
                  const isSplit = group.isSplit;

                  if (isSplit) {
                    return (
                      <div key={group.id} className='space-y-2'>
                        {group.entries.map((entry, entryIdx: number) => (
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
                                  <div className='max-h-48 overflow-y-auto'>
                                    <div className='space-y-1'>
                                      {addressBook
                                        ?.filter(
                                          (c) =>
                                            c.name
                                              .toLowerCase()
                                              .includes(
                                                assignSearchTerm.toLowerCase()
                                              ) ||
                                            c.iban
                                              ?.toLowerCase()
                                              .includes(
                                                assignSearchTerm.toLowerCase()
                                              )
                                        )
                                        .map((contact) => (
                                          <button
                                            key={contact.id}
                                            className='w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted'
                                            onClick={() =>
                                              onResolveShared(
                                                {
                                                  contactId: contact.id,
                                                  iban: selectedSharedIban.iban,
                                                  name: contact.name,
                                                  originalNames: [entry.name],
                                                },
                                                {
                                                  onSuccess: () => {
                                                    setAssignPopoverOpen(null);
                                                    setEditModalGroups((prev) =>
                                                      prev
                                                        .map((g) =>
                                                          g.id === group.id
                                                            ? {
                                                                ...g,
                                                                entries:
                                                                  g.entries.filter(
                                                                    (
                                                                      _: SharedIbanEntry,
                                                                      i: number
                                                                    ) =>
                                                                      i !==
                                                                      entryIdx
                                                                  ),
                                                              }
                                                            : g
                                                        )
                                                        .filter(
                                                          (g) =>
                                                            g.entries.length > 0
                                                        )
                                                    );
                                                  },
                                                }
                                              )
                                            }
                                          >
                                            <div className='font-medium'>
                                              {contact.name}
                                            </div>
                                            <div className='text-xs text-muted-foreground'>
                                              {contact.iban}
                                            </div>
                                          </button>
                                        ))}
                                    </div>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                            <Button
                              size='sm'
                              className='h-8 w-8 rounded-md bg-purple-600 p-0 hover:bg-purple-700'
                              onClick={() =>
                                onResolveShared(
                                  {
                                    iban: selectedSharedIban.iban,
                                    name:
                                      (
                                        splitInputValues[entry.name] ??
                                        entry.name
                                      ).trim() || entry.name,
                                    originalNames: [entry.name],
                                  },
                                  {
                                    onSuccess: () => {
                                      setEditModalGroups((prev) =>
                                        prev
                                          .map((g) =>
                                            g.id === group.id
                                              ? {
                                                  ...g,
                                                  entries: g.entries.filter(
                                                    (
                                                      _: SharedIbanEntry,
                                                      i: number
                                                    ) => i !== entryIdx
                                                  ),
                                                }
                                              : g
                                          )
                                          .filter((g) => g.entries.length > 0)
                                      );
                                    },
                                  }
                                )
                              }
                              disabled={isResolvePending}
                            >
                              <Plus className='h-4 w-4' />
                            </Button>
                          </div>
                        ))}
                      </div>
                    );
                  }

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
                                'Duplicates ({count})'
                              ).replace(
                                '{count}',
                                String(group.entries.length)
                              )}
                            </span>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-purple-600 hover:bg-purple-600 hover:text-white'
                            onClick={() =>
                              setEditModalGroups((prev) =>
                                prev.map((g) =>
                                  g.id === group.id
                                    ? { ...g, isSplit: true }
                                    : g
                                )
                              )
                            }
                          >
                            <Scissors className='mr-1 h-4 w-4' />
                            {t.addressBook?.split || 'Split'}
                          </Button>
                        </div>
                        <div className='mb-3 flex flex-wrap gap-1.5'>
                          {group.entries.map((entry, idx: number) => (
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
                        <div className='flex items-center gap-2'>
                          <Input
                            value={group.editedName || ''}
                            onChange={(e) =>
                              setEditModalGroups((prev) =>
                                prev.map((g) =>
                                  g.id === group.id
                                    ? { ...g, editedName: e.target.value }
                                    : g
                                )
                              )
                            }
                            className='h-9 flex-1'
                            placeholder='Naam voor adresboek'
                          />
                          <Button
                            className='bg-purple-600 hover:bg-purple-700'
                            onClick={() =>
                              onResolveShared(
                                {
                                  iban: selectedSharedIban.iban,
                                  name: (group.editedName || '').trim(),
                                  originalNames: group.entries.map(
                                    (e) => e.name
                                  ),
                                },
                                {
                                  onSuccess: () =>
                                    setEditModalGroups((prev) =>
                                      prev.filter((g) => g.id !== group.id)
                                    ),
                                }
                              )
                            }
                            disabled={
                              !(group.editedName || '').trim() ||
                              isResolvePending
                            }
                          >
                            <Merge className='mr-1 h-4 w-4' />
                            {t.addressBook?.merge || 'Merge'}
                          </Button>
                        </div>
                      </div>
                    );
                  }

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
                            ({group.entries[0].transactionCount} tx)
                          </span>
                        </div>
                        <div className='mt-2'>
                          <Input
                            value={group.editedName}
                            onChange={(e) =>
                              setEditModalGroups((prev) =>
                                prev.map((g) =>
                                  g.id === group.id
                                    ? { ...g, editedName: e.target.value }
                                    : g
                                )
                              )
                            }
                            className='h-8 text-sm'
                          />
                        </div>
                      </div>
                      <Button
                        size='sm'
                        className='h-8 w-8 rounded-md bg-purple-600 p-0 hover:bg-purple-700'
                        onClick={() =>
                          onResolveShared(
                            {
                              iban: selectedSharedIban.iban,
                              name: (group.editedName || '').trim(),
                              originalNames: [group.entries[0].name],
                            },
                            {
                              onSuccess: () =>
                                setEditModalGroups((prev) =>
                                  prev.filter((g) => g.id !== group.id)
                                ),
                            }
                          )
                        }
                        disabled={
                          !(group.editedName || '').trim() || isResolvePending
                        }
                      >
                        <Plus className='h-4 w-4' />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setSharedIbanEditModalOpen(false)}
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
              setSplitIbanNames(() => ({}));
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
                  'Split the contact into separate contacts per IBAN.'}
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
                      placeholder={splitContact.name}
                    />
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
                onClick={() => setSplitModalOpen(false)}
              >
                {t.common.cancel}
              </Button>
              <Button
                className='bg-purple-600 hover:bg-purple-700'
                onClick={async () => {
                  if (!splitContact) return;
                  try {
                    const ibans = Object.keys(splitIbanNames);
                    const names = ibans.map(
                      (i) => splitIbanNames[i] || splitContact.name
                    );
                    await onSplitContact({
                      contactId: splitContact.id,
                      ibans,
                      names,
                    });
                    setSplitModalOpen(false);
                  } catch (err) {
                    const message =
                      err instanceof Error
                        ? err.message
                        : String(err) || 'Error splitting contact';
                    setSplitNameWarning(message);
                  }
                }}
              >
                {t.addressBook?.split || 'Split'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);
