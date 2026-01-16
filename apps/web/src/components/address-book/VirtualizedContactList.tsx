import React, {
  useRef,
  memo,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ContactListItem } from './ContactListItem';
import type { AddressBookEntryWithStats } from '@/hooks/useAddressBook';

/**
 * Props for the virtualized contact list
 */
export interface VirtualizedContactListProps {
  contacts: AddressBookEntryWithStats[];
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
  /**
   * Estimated height per row in pixels.
   * Contact cards are typically ~80px collapsed, ~200px expanded.
   */
  estimatedItemSize?: number;
  /**
   * Number of items to render outside the visible area.
   * Higher values = smoother scrolling, more memory usage.
   */
  overscan?: number;
  /**
   * Maximum height of the container.
   * Defaults to 600px.
   */
  maxHeight?: number;
  className?: string;
}

export interface VirtualizedContactListRef {
  scrollToTop: () => void;
  scrollToIndex: (index: number) => void;
}

/**
 * Threshold for when to use virtualization.
 * Below this count, the overhead of virtualization isn't worth it.
 */
export const CONTACT_VIRTUALIZATION_THRESHOLD = 50;

/**
 * Virtualized contact list using @tanstack/react-virtual.
 * Only renders visible rows + overscan, dramatically improving performance
 * for lists with 100+ contacts.
 *
 * For small lists (<50 items), virtualization overhead may not be worth it.
 * Consider using the regular list for those cases.
 */
export const VirtualizedContactList = memo(
  forwardRef<VirtualizedContactListRef, VirtualizedContactListProps>(
    function VirtualizedContactList(
      {
        contacts,
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
        estimatedItemSize = 88,
        overscan = 5,
        maxHeight = 600,
        className,
      },
      ref
    ) {
      const parentRef = useRef<HTMLDivElement>(null);

      // Track which contact is the first merged contact for onboarding
      const firstMergedIndex = contacts.findIndex(
        (c) => c.isMerged && c.ibans && c.ibans.length > 1
      );

      // Dynamic size estimation based on expanded state
      const getItemSize = useCallback(
        (index: number) => {
          const contact = contacts[index];
          if (!contact) return estimatedItemSize;

          // Base size for collapsed contact
          let size = estimatedItemSize;

          // If this contact is expanded, add space for transactions
          if (expandedContactId === contact.id) {
            // Estimate: header (88px) + transaction area (~200px minimum)
            const transactionCount = contactTransactions?.length || 0;
            const transactionHeight = Math.max(
              100,
              Math.min(transactionCount * 50, 300)
            );
            size += transactionHeight + 48; // 48px for padding/loading indicator
          }

          // If in editing mode, add a bit more space for inputs
          if (editingContactId === contact.id) {
            size += 20;
          }

          return size;
        },
        [
          contacts,
          expandedContactId,
          editingContactId,
          contactTransactions,
          estimatedItemSize,
        ]
      );

      const rowVirtualizer = useVirtualizer({
        count: contacts.length,
        getScrollElement: () => parentRef.current,
        estimateSize: getItemSize,
        overscan,
        // Enable dynamic measurements
        measureElement: (el) => el.getBoundingClientRect().height,
      });

      // Expose imperative methods
      useImperativeHandle(ref, () => ({
        scrollToTop: () => rowVirtualizer.scrollToOffset(0),
        scrollToIndex: (index: number) =>
          rowVirtualizer.scrollToIndex(index, { align: 'start' }),
      }));

      const items = rowVirtualizer.getVirtualItems();
      const totalSize = rowVirtualizer.getTotalSize();

      if (contacts.length === 0) {
        return null;
      }

      return (
        <div
          ref={parentRef}
          className={className}
          style={{ maxHeight, overflow: 'auto' }}
        >
          <div className='relative w-full' style={{ height: `${totalSize}px` }}>
            {items.map((virtualRow) => {
              const contact = contacts[virtualRow.index];
              if (!contact) return null;

              const isFirstMerged = virtualRow.index === firstMergedIndex;
              const isFirst = virtualRow.index === 0;

              return (
                <div
                  key={contact.id}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  className='absolute top-0 left-0 w-full'
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <ContactListItem
                    contact={contact}
                    isFirst={isFirst}
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
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  )
);
