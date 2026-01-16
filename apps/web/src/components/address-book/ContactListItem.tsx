import React, { memo } from 'react';
import {
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Scissors,
  Check,
  X,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Currency } from '@/components/ui/currency';
import { cn } from '@/lib/utils';
import type { AddressBookEntryWithStats } from '@/hooks/useAddressBook';

interface ContactListItemProps {
  contact: AddressBookEntryWithStats;
  isFirst: boolean;
  isFirstMerged: boolean;
  onEditContact: (contact: AddressBookEntryWithStats) => void;
  onDeleteContact: (id: string) => void;
  onUpdateContact: () => void;
  onCancelEdit: () => void;
  isEditing: boolean;
  editContactName: string;
  setEditContactName: (name: string) => void;
  editContactDescription: string;
  setEditContactDescription: (desc: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contactTransactions: any[] | undefined;
  isLoadingTransactions: boolean;
  onSplitContact: (contact: AddressBookEntryWithStats) => void;
  onSelectContactTransactions: (contact: AddressBookEntryWithStats) => void;
  hasSharedIban: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addressBook: any[] | undefined;
  onMergeContacts: (data: { contactIds: string[]; name: string }) => void;
  isMergePending: boolean;
  assignPopoverOpen: string | null;
  setAssignPopoverOpen: (id: string | null) => void;
  assignSearchTerm: string;
  setAssignSearchTerm: (term: string) => void;
  modalContentElement: HTMLDivElement | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  translations: any;
}

/**
 * A single contact list item, extracted for use with virtualization.
 * Memoized to prevent unnecessary re-renders when scrolling.
 */
export const ContactListItem = memo(function ContactListItem({
  contact,
  isFirst,
  isFirstMerged,
  onEditContact,
  onDeleteContact,
  onUpdateContact,
  onCancelEdit,
  isEditing,
  editContactName,
  setEditContactName,
  editContactDescription,
  setEditContactDescription,
  isExpanded,
  onToggleExpand,
  contactTransactions,
  isLoadingTransactions,
  onSplitContact,
  onSelectContactTransactions,
  hasSharedIban,
  addressBook,
  onMergeContacts,
  isMergePending,
  assignPopoverOpen,
  setAssignPopoverOpen,
  assignSearchTerm,
  setAssignSearchTerm,
  modalContentElement,
  translations: t,
}: ContactListItemProps) {
  const isMergedWithMultipleIbans =
    contact.isMerged && contact.ibans && contact.ibans.length > 1;

  return (
    <div
      className='overflow-hidden border-x-0 border-t border-b-0 sm:rounded-lg sm:border'
      {...(isFirst
        ? { 'data-onboarding': 'addressbook-contact' }
        : isFirstMerged
          ? { 'data-onboarding': 'addressbook-merged-contact' }
          : {})}
    >
      <div
        className={cn(
          'group flex items-center justify-between bg-card px-3 py-4 sm:p-4',
          !isEditing && 'cursor-pointer transition-colors hover:bg-muted/50'
        )}
        onClick={(e) => {
          if (!isEditing && !(e.target as HTMLElement).closest('button')) {
            onSelectContactTransactions(contact);
          }
        }}
      >
        {isEditing ? (
          <div className='flex flex-1 items-center gap-3'>
            <Input
              value={editContactName}
              onChange={(e) => setEditContactName(e.target.value)}
              placeholder={t.settings.addressBook.namePlaceholder}
              className='flex-1'
            />
            <Input
              value={editContactDescription}
              onChange={(e) => setEditContactDescription(e.target.value)}
              placeholder={
                t.settings.addressBook.descriptionPlaceholder || 'Omschrijving'
              }
              className='flex-1'
            />
            <Popover
              open={assignPopoverOpen === `edit-${contact.id}`}
              onOpenChange={(open) => {
                setAssignPopoverOpen(open ? `edit-${contact.id}` : null);
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
                        disabled={isMergePending}
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
                      t.addressBook?.searchContacts || 'Search contacts...'
                    }
                    value={assignSearchTerm}
                    onChange={(e) => setAssignSearchTerm(e.target.value)}
                    className='h-8 text-sm'
                    autoFocus
                  />
                  <div
                    className='max-h-48 overflow-y-auto overscroll-contain'
                    onWheel={(e) => e.stopPropagation()}
                  >
                    <div className='space-y-1'>
                      {(() => {
                        const searchLower = assignSearchTerm.toLowerCase();
                        const filtered = addressBook
                          ?.filter(
                            (c) =>
                              (c.name.toLowerCase().includes(searchLower) ||
                                c.iban?.toLowerCase().includes(searchLower) ||
                                c.ibans?.some((i: string) =>
                                  i.toLowerCase().includes(searchLower)
                                )) &&
                              c.id !== contact.id
                          )
                          .sort((a, b) => a.name.localeCompare(b.name));
                        return filtered?.length ? (
                          filtered.map((targetContact) => (
                            <button
                              key={targetContact.id}
                              className='w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted'
                              onClick={() =>
                                onMergeContacts({
                                  contactIds: [contact.id, targetContact.id],
                                  name: targetContact.name,
                                })
                              }
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
              size='sm'
              variant='ghost'
              className='h-8 w-8 rounded-full hover:bg-purple-600 hover:text-white'
              onClick={onUpdateContact}
            >
              <Check className='h-4 w-4' />
            </Button>
            <Button
              size='sm'
              variant='ghost'
              className='h-8 w-8 rounded-full hover:bg-purple-600 hover:text-white'
              onClick={onCancelEdit}
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        ) : (
          <>
            <div className='flex items-center gap-3'>
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full font-medium',
                  isMergedWithMultipleIbans
                    ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {(contact.name || '').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className='flex items-center gap-2'>
                  <p className='font-medium'>{contact.name}</p>
                  {isMergedWithMultipleIbans && (
                    <Button
                      size='icon'
                      variant='ghost'
                      className='h-6 w-6 rounded-md text-purple-600 hover:bg-purple-600 hover:text-white'
                      onClick={(e) => {
                        e.stopPropagation();
                        onSplitContact(contact);
                      }}
                    >
                      <Scissors className='h-3 w-3' />
                    </Button>
                  )}
                  <ExternalLink className='h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100' />
                </div>
                {contact.description && (
                  <p className='text-sm text-muted-foreground'>
                    {contact.description}
                  </p>
                )}
                <p className='text-sm text-muted-foreground'>
                  {contact.iban}
                  {isMergedWithMultipleIbans && (
                    <span className='ml-1 font-medium text-purple-500'>
                      {(t.addressBook?.moreIbans || '+{count} more').replace(
                        '{count}',
                        String((contact.ibans?.length || 0) - 1)
                      )}
                    </span>
                  )}
                </p>
                <div className='mt-1 flex items-center gap-2'>
                  {contact.isMerged && (
                    <span className='rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'>
                      {t.addressBook?.mergedBadge || 'Samengevoegd'}
                    </span>
                  )}
                  {hasSharedIban && (
                    <span className='rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'>
                      {t.addressBook?.sharedIban || 'Gedeelde IBAN'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className='flex items-center gap-4'>
              <div className='hidden text-right sm:block'>
                <p className='font-medium'>
                  {contact.transactionCount || 0}{' '}
                  {t.settings.addressBook.transactions}
                </p>
                <div className='flex items-center justify-end gap-2 text-xs'>
                  {(contact.totalIncome || 0) > 0 && (
                    <span className='flex items-center text-emerald-600'>
                      <ArrowUpRight className='mr-0.5 h-3 w-3' />
                      <Currency amount={contact.totalIncome || 0} />
                    </span>
                  )}
                  {(contact.totalExpenses || 0) > 0 && (
                    <span className='flex items-center text-red-600'>
                      <ArrowDownRight className='mr-0.5 h-3 w-3' />
                      <Currency amount={contact.totalExpenses || 0} />
                    </span>
                  )}
                </div>
              </div>
              <div className='flex gap-1'>
                <Button
                  size='icon'
                  variant='ghost'
                  className='h-8 w-8 rounded-md transition-colors hover:bg-purple-600 hover:text-white'
                  onClick={() => onEditContact(contact)}
                >
                  <Edit2 className='h-4 w-4' />
                </Button>
                <Button
                  size='icon'
                  variant='ghost'
                  className='h-8 w-8 rounded-md text-destructive transition-colors hover:bg-red-600 hover:text-white dark:hover:bg-red-700'
                  onClick={() => onDeleteContact(contact.id)}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
                <Button
                  size='icon'
                  variant='ghost'
                  className='h-8 w-8 rounded-md text-muted-foreground transition-colors hover:bg-purple-600 hover:text-white'
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand();
                  }}
                >
                  {isExpanded ? (
                    <ChevronUp className='h-4 w-4' />
                  ) : (
                    <ChevronDown className='h-4 w-4' />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
      {isExpanded && (
        <div className='border-t bg-muted/30 px-3 py-4 sm:px-4'>
          {isLoadingTransactions ? (
            <div className='flex items-center justify-center py-4'>
              <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
            </div>
          ) : contactTransactions && contactTransactions.length > 0 ? (
            <div className='max-h-[500px] space-y-1 overflow-y-auto'>
              {contactTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className='flex flex-col gap-1 rounded-lg bg-card/50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between'
                >
                  <div className='min-w-0 flex-1'>
                    <p className='font-medium break-words'>
                      {tx.description || t.transactions?.unknown || 'Onbekend'}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'shrink-0 font-bold',
                      tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'
                    )}
                  >
                    {tx.amount > 0 ? '+' : ''}
                    <Currency amount={tx.amount} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='py-4 text-center text-sm text-muted-foreground'>
              {t.addressBook?.noTransactions || 'No transactions found'}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
