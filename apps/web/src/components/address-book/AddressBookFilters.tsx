import React from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type SortOption = 'name' | 'transactionCount' | 'totalAmount' | 'recent';

interface AddressBookFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  sortBy: SortOption;
  setSortBy: (option: SortOption) => void;
  filteredCount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  translations: any;
  indicatorRef: React.RefObject<HTMLDivElement | null>;
  switchOuterRef: React.RefObject<HTMLDivElement | null>;
}

export const AddressBookFilters: React.FC<AddressBookFiltersProps> = ({
  search,
  setSearch,
  sortBy,
  setSortBy,
  filteredCount,
  translations: t,
  indicatorRef,
  switchOuterRef,
}) => {
  const sortOptions: { key: SortOption; label: string }[] = [
    { key: 'name', label: t.addressBook?.sortName || 'Name' },
    {
      key: 'transactionCount',
      label: t.addressBook?.sortTransactions || 'Transactions',
    },
    { key: 'totalAmount', label: t.addressBook?.sortAmount || 'Amount' },
    { key: 'recent', label: t.addressBook?.sortRecent || 'Recent' },
  ];

  return (
    <div className='-mx-3 sm:mx-0'>
      <Card
        className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
        data-onboarding='addressbook-search'
      >
        <CardContent className='p-4'>
          <div className='flex flex-col gap-4'>
            {/* Search bar */}
            <div className='relative flex-1'>
              <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder={t.addressBook?.searchPlaceholder || 'Search...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-10'
              />
            </div>

            {/* Sort Switch */}
            <div className='flex items-center justify-between'>
              <span className='text-sm text-muted-foreground'>
                {filteredCount} {t.addressBook?.contactsCount || 'contacts'}
              </span>
              <div
                ref={switchOuterRef}
                className='relative inline-flex items-center rounded-lg border border-border bg-muted/50 p-0.5'
              >
                {/* Sliding indicator */}
                <div
                  ref={indicatorRef}
                  className='absolute top-0.5 h-[calc(100%-4px)] rounded-md bg-purple-600 shadow-sm transition-all duration-200 ease-out'
                />
                {sortOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setSortBy(option.key)}
                    className={cn(
                      'relative z-10 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                      sortBy === option.key
                        ? 'text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
