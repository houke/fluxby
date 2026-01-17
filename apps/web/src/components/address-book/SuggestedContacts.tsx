import React from 'react';
import { UserPlus, ChevronUp, ChevronDown, Plus } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Currency } from '@/components/ui/currency';
import { cn } from '@/lib/utils';
import type { AddressBookEntry } from '@fluxby/shared';

interface SuggestedContactsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suggestedContacts: any[];
  showSuggestedContacts: boolean;
  setShowSuggestedContacts: (show: boolean) => void;
  suggestedContactPopover: string | null;
  setSuggestedContactPopover: (iban: string | null) => void;
  suggestedContactEditName: string;
  setSuggestedContactEditName: (name: string) => void;
  suggestedContactSearch: string;
  setSuggestedContactSearch: (search: string) => void;
  addressBook: AddressBookEntry[] | undefined;
  onCreateContact: (data: { iban: string; name: string }) => void;
  onAddIbanToContact: (data: { contactId: string; iban: string }) => void;
  isCreateContactPending: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  translations: any;
}

export const SuggestedContacts: React.FC<SuggestedContactsProps> = ({
  suggestedContacts,
  showSuggestedContacts,
  setShowSuggestedContacts,
  suggestedContactPopover,
  setSuggestedContactPopover,
  suggestedContactEditName,
  setSuggestedContactEditName,
  suggestedContactSearch,
  setSuggestedContactSearch,
  addressBook,
  onCreateContact,
  onAddIbanToContact,
  isCreateContactPending,
  translations: t,
}) => {
  if (suggestedContacts.length === 0) return null;

  return (
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
                  <span className='truncate font-medium'>{account.name}</span>
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
                    account.netAmount >= 0 ? 'text-green-600' : 'text-red-500'
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
                      disabled={isCreateContactPending}
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
                            onClick={() =>
                              onCreateContact({
                                iban: account.iban,
                                name: suggestedContactEditName.trim(),
                              })
                            }
                            disabled={
                              isCreateContactPending ||
                              !suggestedContactEditName.trim()
                            }
                          >
                            <Plus className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='h-px flex-1 bg-border' />
                        <span className='text-xs text-muted-foreground'>
                          {t.common?.or || 'or'}
                        </span>
                        <div className='h-px flex-1 bg-border' />
                      </div>
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
                                (c) =>
                                  c.name.toLowerCase().includes(searchLower) ||
                                  c.iban?.toLowerCase().includes(searchLower)
                              )
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .slice(0, 10);

                            return filtered?.length ? (
                              filtered.map((contact) => (
                                <button
                                  key={contact.id}
                                  className='flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted'
                                  onClick={() =>
                                    onAddIbanToContact({
                                      contactId: contact.id,
                                      iban: account.iban,
                                    })
                                  }
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
                              ))
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
  );
};
