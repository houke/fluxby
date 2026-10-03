/** @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ContactListItem } from '@/components/address-book/ContactListItem';
import { en } from '@/lib/i18n/en';
import { nl } from '@/lib/i18n/nl';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en' }),
}));
afterEach(cleanup);

const contact = {
  id: 'contact',
  name: 'Shared household',
  iban: 'NL91ABNA0417164300',
  ibans: ['NL91ABNA0417164300', 'NL30RABO0123456789'],
  description: null,
  notes: null,
  createdAt: '2026-10-02',
  isMerged: true,
};

function setup(copy: typeof en, isEditing = false) {
  const actions = {
    onEditContact: vi.fn(),
    onDeleteContact: vi.fn(),
    onUpdateContact: vi.fn(),
    onCancelEdit: vi.fn(),
    onToggleExpand: vi.fn(),
    onSplitContact: vi.fn(),
    onSelectContactTransactions: vi.fn(),
    onMergeContacts: vi.fn(),
  };
  render(
    <ContactListItem
      contact={contact}
      isFirst
      isFirstMerged
      {...actions}
      isEditing={isEditing}
      editContactName={contact.name}
      setEditContactName={vi.fn()}
      editContactDescription=''
      setEditContactDescription={vi.fn()}
      isExpanded={false}
      contactTransactions={[]}
      isLoadingTransactions={false}
      hasSharedIban={false}
      addressBook={[]}
      isMergePending={false}
      assignPopoverOpen={null}
      setAssignPopoverOpen={vi.fn()}
      assignSearchTerm=''
      setAssignSearchTerm={vi.fn()}
      modalContentElement={null}
      translations={copy}
    />
  );
  return actions;
}

describe.each([
  ['English', en],
  ['Dutch', nl],
] as const)('contact action names in %s', (_language, copy) => {
  it('names icon actions before a tooltip opens and invokes the correct contact action', () => {
    const actions = setup(copy);
    fireEvent.click(screen.getByRole('button', { name: copy.common.edit }));
    expect(actions.onEditContact).toHaveBeenCalledWith(contact);
    fireEvent.click(screen.getByRole('button', { name: copy.common.delete }));
    expect(actions.onDeleteContact).toHaveBeenCalledWith(contact.id);
    fireEvent.click(
      screen.getByRole('button', { name: copy.addressBook.showTransactions })
    );
    expect(actions.onToggleExpand).toHaveBeenCalledOnce();
    fireEvent.click(
      screen.getByRole('button', { name: copy.addressBook.splitIntoSeparate })
    );
    expect(actions.onSplitContact).toHaveBeenCalledWith(contact);
    expect(actions.onSelectContactTransactions).not.toHaveBeenCalled();
  });

  it('names save, cancel, assignment and edit fields while editing', () => {
    const actions = setup(copy, true);
    expect(
      screen.getByLabelText(copy.settings.addressBook.namePlaceholder)
    ).toBeTruthy();
    expect(
      screen.getByLabelText(copy.settings.addressBook.descriptionPlaceholder)
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: copy.addressBook.assignToExisting })
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: copy.common.save }));
    expect(actions.onUpdateContact).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: copy.common.cancel }));
    expect(actions.onCancelEdit).toHaveBeenCalledOnce();
  });
});
