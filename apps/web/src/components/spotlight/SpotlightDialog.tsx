import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  useSpotlight,
  type SpotlightCommand,
} from '@/contexts/SpotlightContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function SpotlightDialog() {
  const { isOpen, close, commands, recentTransactions, contacts } =
    useSpotlight();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 150);

  // Reset search when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  // Filter function for commands
  const filterCommands = useCallback(
    (items: SpotlightCommand[], query: string): SpotlightCommand[] => {
      if (!query) return items;
      const lowerQuery = query.toLowerCase();
      return items.filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(lowerQuery);
        const subtitleMatch = item.subtitle?.toLowerCase().includes(lowerQuery);
        const keywordsMatch = item.keywords?.some((kw) =>
          kw.toLowerCase().includes(lowerQuery)
        );
        return titleMatch || subtitleMatch || keywordsMatch;
      });
    },
    []
  );

  // Group and filter commands based on search
  const { pages, actions, filteredTransactions, filteredContacts } =
    useMemo(() => {
      const pages = filterCommands(
        commands.filter((c) => c.group === 'pages'),
        debouncedSearch
      );
      const actions = filterCommands(
        commands.filter((c) => c.group === 'actions'),
        debouncedSearch
      );

      // Only show transactions/contacts when searching
      const filteredTransactions = debouncedSearch
        ? filterCommands(recentTransactions, debouncedSearch).slice(0, 5)
        : [];
      const filteredContacts = debouncedSearch
        ? filterCommands(contacts, debouncedSearch).slice(0, 5)
        : [];

      return { pages, actions, filteredTransactions, filteredContacts };
    }, [
      commands,
      recentTransactions,
      contacts,
      debouncedSearch,
      filterCommands,
    ]);

  const handleSelect = useCallback(
    (command: SpotlightCommand) => {
      command.onSelect();
      close();
    },
    [close]
  );

  // Platform detection for keyboard shortcut display
  const isMac =
    typeof navigator !== 'undefined' &&
    navigator.platform.toLowerCase().includes('mac');

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <Command
        className='rounded-lg border shadow-md'
        shouldFilter={false} // We handle filtering ourselves
      >
        <CommandInput
          placeholder={t.spotlight?.searchPlaceholder || 'Search...'}
          value={search}
          onValueChange={setSearch}
        />
        <CommandList className='max-h-[400px]'>
          <CommandEmpty>
            {t.spotlight?.noResults || 'No results found.'}
          </CommandEmpty>

          {/* Pages Group */}
          {pages.length > 0 && (
            <CommandGroup heading={t.spotlight?.pages || 'Pages'}>
              {pages.map((command) => (
                <CommandItem
                  key={command.id}
                  value={command.id}
                  onSelect={() => handleSelect(command)}
                  className='group cursor-pointer hover:!bg-purple-600 data-[selected=true]:bg-transparent data-[selected=true]:text-inherit'
                >
                  <command.icon className='mr-2 h-4 w-4 group-hover:text-white' />
                  <span className='group-hover:text-white'>
                    {command.title}
                  </span>
                  {command.subtitle && (
                    <span className='ml-2 text-xs text-gray-500 group-hover:text-purple-200'>
                      {command.subtitle}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Actions Group */}
          {actions.length > 0 && (
            <>
              {pages.length > 0 && <CommandSeparator />}
              <CommandGroup heading={t.spotlight?.actions || 'Actions'}>
                {actions.map((command) => (
                  <CommandItem
                    key={command.id}
                    value={command.id}
                    onSelect={() => handleSelect(command)}
                    className='group cursor-pointer hover:!bg-purple-600 data-[selected=true]:bg-transparent data-[selected=true]:text-inherit'
                  >
                    <command.icon className='mr-2 h-4 w-4 group-hover:text-white' />
                    <div className='flex flex-1 flex-col'>
                      <span className='group-hover:text-white'>
                        {command.title}
                      </span>
                      {command.subtitle && (
                        <span className='text-xs text-gray-500 group-hover:text-purple-200'>
                          {command.subtitle}
                        </span>
                      )}
                    </div>
                    {command.shortcut && (
                      <CommandShortcut>{command.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Transactions Group - Only shown when searching */}
          {filteredTransactions.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup
                heading={t.spotlight?.transactions || 'Transactions'}
              >
                {filteredTransactions.map((command) => (
                  <CommandItem
                    key={command.id}
                    value={command.id}
                    onSelect={() => handleSelect(command)}
                    className='group cursor-pointer hover:!bg-purple-600 data-[selected=true]:bg-transparent data-[selected=true]:text-inherit'
                  >
                    <command.icon className='mr-2 h-4 w-4 group-hover:text-white' />
                    <div className='flex flex-1 flex-col'>
                      <span
                        className={cn('privacy-blur group-hover:text-white')}
                      >
                        {command.title}
                      </span>
                      {command.subtitle && (
                        <span
                          className={cn(
                            'privacy-blur text-xs text-gray-500 group-hover:text-purple-200'
                          )}
                        >
                          {command.subtitle}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Contacts Group - Only shown when searching */}
          {filteredContacts.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t.spotlight?.contacts || 'Contacts'}>
                {filteredContacts.map((command) => (
                  <CommandItem
                    key={command.id}
                    value={command.id}
                    onSelect={() => handleSelect(command)}
                    className='group cursor-pointer hover:!bg-purple-600 data-[selected=true]:bg-transparent data-[selected=true]:text-inherit'
                  >
                    <command.icon className='mr-2 h-4 w-4 group-hover:text-white' />
                    <div className='flex flex-1 flex-col'>
                      <span
                        className={cn('privacy-blur group-hover:text-white')}
                      >
                        {command.title}
                      </span>
                      {command.subtitle && (
                        <span
                          className={cn(
                            'privacy-blur text-xs text-gray-500 group-hover:text-purple-200'
                          )}
                        >
                          {command.subtitle}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>

        {/* Footer with keyboard hint */}
        <div className='flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground'>
          <span>
            {t.spotlight?.hint || 'Type to search, use arrow keys to navigate'}
          </span>
          <span className='flex items-center gap-1'>
            <kbd className='rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]'>
              {isMac ? '⌘' : 'Ctrl'}
            </kbd>
            <kbd className='rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]'>
              K
            </kbd>
          </span>
        </div>
      </Command>
    </CommandDialog>
  );
}
