import React from 'react';
import { ChevronUp, ChevronDown, Plus } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
      className='rounded-none border-x-0 border-blue-500/50 bg-blue-50/50 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm dark:bg-blue-950/10'
    >
      <CardHeader className='px-3 py-3 sm:px-6 sm:py-4'>
        <div className='flex items-center justify-between gap-2'>
          <CardTitle className='flex min-w-0 flex-wrap items-center gap-2 text-base text-blue-700 sm:text-lg dark:text-blue-400'>
            {t.addressBook?.suggestedContacts}
            <span className='rounded-full bg-blue-200 px-2 py-0.5 text-xs font-normal dark:bg-blue-800'>
              {suggestedContacts.length}
            </span>
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 shrink-0 rounded-md'
                  aria-label={t.addressBook?.suggestedContacts}
                  aria-expanded={showSuggestedContacts}
                  onClick={() =>
                    setShowSuggestedContacts(!showSuggestedContacts)
                  }
                >
                  {showSuggestedContacts ? <ChevronUp /> : <ChevronDown />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {t.addressBook?.suggestedContacts}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {!showSuggestedContacts && (
          <CardDescription>
            {t.addressBook?.suggestedContactsCollapsed}
          </CardDescription>
        )}
        {showSuggestedContacts && (
          <CardDescription>
            {t.addressBook?.suggestedContactsExpanded}
          </CardDescription>
        )}
      </CardHeader>
      {showSuggestedContacts && (
        <CardContent className='space-y-2 px-3 pb-3 sm:px-6 sm:pb-6'>
          {suggestedContacts.slice(0, 20).map((account) => (
            <div
              key={account.iban}
              className='flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white p-3 dark:bg-card'
            >
              <div className='min-w-0 flex-1'>
                <div className='flex flex-wrap items-center gap-x-2'>
                  <span className='truncate font-medium'>{account.name}</span>
                  <span className='text-xs text-muted-foreground'>
                    ({account.transactionCount} {t.addressBook?.transactions})
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
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-red-700 dark:text-red-400'
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <Button
                            size='sm'
                            variant='outline'
                            aria-label={t.addressBook?.addContact}
                            className='h-8 w-8 rounded-md p-0 hover:border-purple-600 hover:bg-purple-600 hover:text-white'
                            disabled={isCreateContactPending}
                          >
                            <Plus className='h-4 w-4' />
                          </Button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t.addressBook?.addContact}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <PopoverContent
                    className='w-72 p-3'
                    align='end'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className='space-y-3'>
                      <div>
                        <label className='mb-1 block text-xs font-medium text-muted-foreground'>
                          {t.addressBook?.addAsNewContact}
                        </label>
                        <div className='flex gap-2'>
                          <Input
                            aria-label={t.addressBook?.addAsNewContact}
                            value={suggestedContactEditName}
                            onChange={(e) =>
                              setSuggestedContactEditName(e.target.value)
                            }
                            className='h-8 text-sm'
                            placeholder={t.addressBook?.enterName}
                          />
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size='sm'
                                  aria-label={t.addressBook?.addAsNewContact}
                                  className='h-8 rounded-md px-3'
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
                              </TooltipTrigger>
                              <TooltipContent>
                                {t.addressBook?.addAsNewContact}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='h-px flex-1 bg-border' />
                        <span className='text-xs text-muted-foreground'>
                          {t.common?.or}
                        </span>
                        <div className='h-px flex-1 bg-border' />
                      </div>
                      <div>
                        <label className='mb-1 block text-xs font-medium text-muted-foreground'>
                          {t.addressBook?.assignToExisting}
                        </label>
                        <Input
                          aria-label={t.addressBook?.searchContacts}
                          value={suggestedContactSearch}
                          onChange={(e) =>
                            setSuggestedContactSearch(e.target.value)
                          }
                          className='mb-2 h-8 text-sm'
                          placeholder={t.addressBook?.searchContacts}
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
                                {t.addressBook?.noContactsFound}
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
              {t.addressBook?.andMoreSuggested?.replace(
                '{count}',
                String(suggestedContacts.length - 20)
              )}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
};
