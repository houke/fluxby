import React from 'react';
import { Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AddressBookEntryWithStats } from '@/hooks/useAddressBook';
import { ContactListItem } from './ContactListItem';
import {
  VirtualizedContactList,
  CONTACT_VIRTUALIZATION_THRESHOLD,
} from './VirtualizedContactList';

interface ContactListProps {
  contacts: AddressBookEntryWithStats[];
  isLoading: boolean;
  search: string;
  onAddContact: () => void;
  onEditContact: (contact: AddressBookEntryWithStats) => void;
  onDeleteContact: (id: string) => void;
  onUpdateContact: () => void;
  onCancelEdit: () => void;
  editingContactId: string | null;
  editContactName: string;
  setEditContactName: (name: string) => void;
  editContactDescription: string;
  setEditContactDescription: (desc: string) => void;
  expandedContactId: string | null;
  onToggleExpand: (id: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contactTransactions: any[] | undefined;
  isLoadingTransactions: boolean;
  onSplitContact: (contact: AddressBookEntryWithStats) => void;
  onSelectContactTransactions: (contact: AddressBookEntryWithStats) => void;
  hasSharedIban: (contact: AddressBookEntryWithStats) => boolean;
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

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  isLoading,
  search,
  onAddContact,
  onEditContact,
  onDeleteContact,
  onUpdateContact,
  onCancelEdit,
  editingContactId,
  editContactName,
  setEditContactName,
  editContactDescription,
  setEditContactDescription,
  expandedContactId,
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
}) => {
  return (
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
          ) : contacts.length === 0 ? (
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
              action={
                !search && (
                  <button
                    onClick={onAddContact}
                    className='text-sm text-purple-600 hover:text-purple-700 hover:underline dark:text-purple-400 dark:hover:text-purple-300'
                  >
                    {t.addressBook?.addContact || 'Add contact'}
                  </button>
                )
              }
            />
          ) : contacts.length >= CONTACT_VIRTUALIZATION_THRESHOLD ? (
            // Use virtualization for large contact lists
            <VirtualizedContactList
              contacts={contacts}
              onEditContact={onEditContact}
              onDeleteContact={onDeleteContact}
              onUpdateContact={onUpdateContact}
              onCancelEdit={onCancelEdit}
              editingContactId={editingContactId}
              editContactName={editContactName}
              setEditContactName={setEditContactName}
              editContactDescription={editContactDescription}
              setEditContactDescription={setEditContactDescription}
              expandedContactId={expandedContactId}
              onToggleExpand={onToggleExpand}
              contactTransactions={contactTransactions}
              isLoadingTransactions={isLoadingTransactions}
              onSplitContact={onSplitContact}
              onSelectContactTransactions={onSelectContactTransactions}
              hasSharedIban={hasSharedIban}
              addressBook={addressBook}
              onMergeContacts={onMergeContacts}
              isMergePending={isMergePending}
              assignPopoverOpen={assignPopoverOpen}
              setAssignPopoverOpen={setAssignPopoverOpen}
              assignSearchTerm={assignSearchTerm}
              setAssignSearchTerm={setAssignSearchTerm}
              modalContentElement={modalContentElement}
              translations={t}
              maxHeight={600}
            />
          ) : (
            <div className='space-y-0 sm:space-y-3'>
              {(() => {
                let firstMergedFound = false;
                return contacts.map((contact, contactIndex) => {
                  const isFirstMerged = !!(
                    !firstMergedFound &&
                    contact.isMerged &&
                    contact.ibans &&
                    contact.ibans.length > 1
                  );
                  if (isFirstMerged) firstMergedFound = true;

                  return (
                    <ContactListItem
                      key={contact.id}
                      contact={contact}
                      isFirst={contactIndex === 0}
                      isFirstMerged={isFirstMerged}
                      onEditContact={onEditContact}
                      onDeleteContact={onDeleteContact}
                      onUpdateContact={onUpdateContact}
                      onCancelEdit={onCancelEdit}
                      isEditing={editingContactId === contact.id}
                      editContactName={editContactName}
                      setEditContactName={setEditContactName}
                      editContactDescription={editContactDescription}
                      setEditContactDescription={setEditContactDescription}
                      isExpanded={expandedContactId === contact.id}
                      onToggleExpand={() => onToggleExpand(contact.id)}
                      contactTransactions={
                        expandedContactId === contact.id
                          ? contactTransactions
                          : undefined
                      }
                      isLoadingTransactions={
                        expandedContactId === contact.id
                          ? isLoadingTransactions
                          : false
                      }
                      onSplitContact={onSplitContact}
                      onSelectContactTransactions={onSelectContactTransactions}
                      hasSharedIban={hasSharedIban(contact)}
                      addressBook={addressBook}
                      onMergeContacts={onMergeContacts}
                      isMergePending={isMergePending}
                      assignPopoverOpen={assignPopoverOpen}
                      setAssignPopoverOpen={setAssignPopoverOpen}
                      assignSearchTerm={assignSearchTerm}
                      setAssignSearchTerm={setAssignSearchTerm}
                      modalContentElement={modalContentElement}
                      translations={t}
                    />
                  );
                });
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
