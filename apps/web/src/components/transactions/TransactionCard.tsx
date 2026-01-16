import { memo } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Repeat,
  ChevronRight,
} from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { Currency } from '@/components/ui/currency';

import type { Transaction, Category, AddressBookEntry } from '@fluxby/shared';

interface TransactionCardProps {
  tx: Transaction;
  categoryName: string;
  categoryColor: string;
  addressBookEntry: AddressBookEntry | null;
  isRecurring: boolean;
  onClick: () => void;
}

/**
 * Mobile-optimized transaction card view.
 * Replaces the table row on screens < 640px.
 */
export const TransactionCard = memo(function TransactionCard({
  tx,
  categoryName,
  categoryColor,
  addressBookEntry,
  isRecurring,
  onClick,
}: TransactionCardProps) {
  // Get display name
  const displayName =
    tx.merchantName || tx.opposingAccountName || tx.description || 'Unknown';

  // Get description - use address book description if available
  const description = addressBookEntry?.description || tx.notes || null;

  return (
    <button
      onClick={onClick}
      className='group flex w-full items-start gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted/50 active:bg-muted/70'
    >
      {/* Transaction type icon */}
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
          tx.type === 'transfer'
            ? 'bg-blue-100 dark:bg-blue-950'
            : tx.amount > 0
              ? 'bg-emerald-100 dark:bg-emerald-950'
              : 'bg-rose-100 dark:bg-rose-950'
        )}
      >
        {tx.type === 'transfer' ? (
          <ArrowLeftRight className='h-5 w-5 text-blue-600' />
        ) : tx.amount > 0 ? (
          <ArrowUpRight className='h-5 w-5 text-emerald-600' />
        ) : (
          <ArrowDownRight className='h-5 w-5 text-rose-600' />
        )}
      </div>

      {/* Main content */}
      <div className='min-w-0 flex-1'>
        {/* Top row: Name and amount */}
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0 flex-1'>
            <p className='truncate leading-tight font-medium'>{displayName}</p>
            {description && (
              <p className='mt-0.5 truncate text-xs text-muted-foreground'>
                {description}
              </p>
            )}
          </div>
          <p
            className={cn(
              'flex-shrink-0 text-right font-bold',
              tx.type === 'transfer'
                ? 'text-blue-600'
                : tx.amount > 0
                  ? 'text-emerald-600'
                  : 'text-rose-600'
            )}
          >
            {tx.type === 'transfer' ? '' : tx.amount > 0 ? '+' : ''}
            <Currency amount={tx.amount} />
          </p>
        </div>

        {/* Bottom row: Date, category, recurring badge */}
        <div className='mt-2 flex items-center gap-2'>
          <span className='text-xs text-muted-foreground'>
            {formatDate(tx.date)}
          </span>

          {/* Category badge */}
          {tx.categoryId && (
            <>
              <span className='text-muted-foreground/50'>•</span>
              <span
                className='max-w-[120px] truncate rounded-full px-2 py-0.5 text-xs font-medium'
                style={{
                  backgroundColor: `${categoryColor}20`,
                  color: categoryColor,
                }}
              >
                {categoryName}
              </span>
            </>
          )}

          {/* Recurring badge */}
          {isRecurring && (
            <span className='inline-flex items-center gap-0.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'>
              <Repeat className='h-3 w-3' />
            </span>
          )}

          {/* Spacer and chevron */}
          <div className='flex-1' />
          <ChevronRight className='h-4 w-4 flex-shrink-0 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground' />
        </div>
      </div>
    </button>
  );
});

// Export type for category lookup helper
export interface CategoryLookup {
  get: (id: string) => Category | undefined;
}
