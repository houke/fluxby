import { useRef, memo, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Transaction, Category, AddressBookEntry } from '@fluxby/shared';
import { TransactionCard } from './TransactionCard';
import { cn } from '@/lib/utils';

/**
 * Props for each transaction row - passed from parent to avoid recalculating in virtualizer
 */
export interface TransactionRowData {
  tx: Transaction;
  categoryName: string;
  categoryColor: string;
  addressBookEntry: AddressBookEntry | null;
  isRecurring: boolean;
}

interface VirtualizedTransactionListProps {
  transactions: TransactionRowData[];
  onTransactionClick: (tx: Transaction, isRecurring: boolean) => void;
  isStale?: boolean;
  className?: string;
  /**
   * Estimated height per row in pixels.
   * Mobile cards are typically ~96px, desktop rows ~72px.
   */
  estimatedItemSize?: number;
  /**
   * Number of items to render outside the visible area.
   * Higher values = smoother scrolling, more memory usage.
   */
  overscan?: number;
  /**
   * If true, uses window as scroll container (for full-page virtualization).
   * If false, uses a fixed-height container.
   */
  useWindowScroll?: boolean;
  /**
   * Maximum height of the container when not using window scroll.
   * Defaults to 600px.
   */
  maxHeight?: number;
}

export interface VirtualizedTransactionListRef {
  scrollToTop: () => void;
  scrollToIndex: (index: number) => void;
}

/**
 * Virtualized transaction list using @tanstack/react-virtual.
 * Only renders visible rows + overscan, dramatically improving performance
 * for lists with 1000+ transactions.
 *
 * For small lists (<50 items), virtualization overhead may not be worth it.
 * Consider using the regular list for those cases.
 */
export const VirtualizedTransactionList = memo(
  forwardRef<VirtualizedTransactionListRef, VirtualizedTransactionListProps>(
    function VirtualizedTransactionList(
      {
        transactions,
        onTransactionClick,
        isStale = false,
        className,
        estimatedItemSize = 88,
        overscan = 5,
        useWindowScroll = false,
        maxHeight = 600,
      },
      ref
    ) {
      const parentRef = useRef<HTMLDivElement>(null);

      const rowVirtualizer = useVirtualizer({
        count: transactions.length,
        getScrollElement: useWindowScroll
          ? () => document.documentElement
          : () => parentRef.current,
        estimateSize: () => estimatedItemSize,
        overscan,
        // Enable smooth scrolling behavior
        scrollMargin: useWindowScroll ? 0 : undefined,
      });

      // Expose imperative methods
      useImperativeHandle(ref, () => ({
        scrollToTop: () => rowVirtualizer.scrollToOffset(0),
        scrollToIndex: (index: number) =>
          rowVirtualizer.scrollToIndex(index, { align: 'start' }),
      }));

      const items = rowVirtualizer.getVirtualItems();

      // Memoize total size to avoid layout thrashing
      const totalSize = rowVirtualizer.getTotalSize();

      if (transactions.length === 0) {
        return null;
      }

      return (
        <div
          ref={parentRef}
          className={cn(
            'overflow-auto',
            !useWindowScroll && `max-h-[${maxHeight}px]`,
            className
          )}
          style={!useWindowScroll ? { maxHeight } : undefined}
        >
          <div
            className={cn(
              'relative w-full transition-opacity duration-150',
              isStale && 'opacity-70'
            )}
            style={{ height: `${totalSize}px` }}
          >
            {items.map((virtualRow) => {
              const rowData = transactions[virtualRow.index];
              if (!rowData) return null;

              return (
                <div
                  key={rowData.tx.id}
                  className='absolute top-0 left-0 w-full'
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <TransactionCard
                    tx={rowData.tx}
                    categoryName={rowData.categoryName}
                    categoryColor={rowData.categoryColor}
                    addressBookEntry={rowData.addressBookEntry}
                    isRecurring={rowData.isRecurring}
                    onClick={() =>
                      onTransactionClick(rowData.tx, rowData.isRecurring)
                    }
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

/**
 * Hook to prepare transaction data for the virtualized list.
 * Memoizes row data to prevent unnecessary re-renders.
 */
export function useVirtualizedTransactionData(
  transactions: Transaction[] | undefined,
  getCategoryName: (id: string | null) => string,
  getCategoryColor: (id: string | null) => string,
  findAddressBookEntry: (tx: Transaction) => AddressBookEntry | null,
  isRecurring: (tx: Transaction) => boolean
): TransactionRowData[] {
  return useMemo(() => {
    if (!transactions) return [];

    return transactions.map((tx) => ({
      tx,
      categoryName: getCategoryName(tx.categoryId),
      categoryColor: getCategoryColor(tx.categoryId),
      addressBookEntry: findAddressBookEntry(tx),
      isRecurring: isRecurring(tx),
    }));
  }, [
    transactions,
    getCategoryName,
    getCategoryColor,
    findAddressBookEntry,
    isRecurring,
  ]);
}

/**
 * Threshold for when to use virtualization.
 * Below this count, the overhead of virtualization isn't worth it.
 */
export const VIRTUALIZATION_THRESHOLD = 50;
