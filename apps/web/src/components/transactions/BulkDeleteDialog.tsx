import { memo, useMemo } from 'react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Currency } from '@/components/ui/currency';
import { formatDate, cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

import type { Transaction } from '@fluxby/shared';

export interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  onConfirm: () => void;
  isLoading?: boolean;
}

const MAX_PREVIEW_ITEMS = 5;

/**
 * Confirmation dialog for bulk deletion of transactions.
 *
 * Layout (from Visual spec):
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  ⚠️  48px red-100 circle, AlertTriangle icon                    │
 * │                                                                 │
 * │  Delete X transaction(s)?              ← text-xl, semibold     │
 * │  This action cannot be undone after 5 minutes.  ← text-sm      │
 * │                                                                 │
 * │  ┌─────────────────────────────────────────────────────────────┐
 * │  │  PREVIEW LIST (max 5, then "and X more")                    │
 * │  └─────────────────────────────────────────────────────────────┘
 * │                                                                 │
 * │  Total impact: -€3,138.51              ← red for negative      │
 * │                                                                 │
 * │         [Cancel]              [🗑 Delete X transactions]       │
 * └─────────────────────────────────────────────────────────────────┘
 */
export const BulkDeleteDialog = memo(function BulkDeleteDialog({
  open,
  onOpenChange,
  transactions,
  onConfirm,
  isLoading = false,
}: BulkDeleteDialogProps) {
  const { t } = useLanguage();

  const { previewItems, remainingCount, totalAmount } = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return {
      previewItems: sorted.slice(0, MAX_PREVIEW_ITEMS),
      remainingCount: Math.max(0, transactions.length - MAX_PREVIEW_ITEMS),
      totalAmount: transactions.reduce((sum, tx) => sum + tx.amount, 0),
    };
  }, [transactions]);

  const count = transactions.length;

  // Prevent closing dialog while loading
  const handleOpenChange = (open: boolean) => {
    if (isLoading && !open) return;
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader className='flex flex-col items-center text-center'>
          {/* Warning icon */}
          <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40'>
            <AlertTriangle className='h-6 w-6 text-red-600 dark:text-red-400' />
          </div>

          <DialogTitle className='text-xl font-semibold'>
            {(
              t.bulkDelete?.confirmTitle || 'Delete {count} transaction(s)?'
            ).replace('{count}', String(count))}
          </DialogTitle>

          <DialogDescription className='text-sm text-muted-foreground'>
            {t.bulkDelete?.confirmWarning ||
              'This action cannot be undone after 5 minutes.'}
          </DialogDescription>
        </DialogHeader>

        {/* Preview list */}
        {previewItems.length > 0 && (
          <ScrollArea className='max-h-60 rounded-lg bg-muted/50 p-3 dark:bg-neutral-900'>
            <div className='space-y-2'>
              {previewItems.map((tx) => (
                <div
                  key={tx.id}
                  className='flex items-center justify-between gap-3 text-sm'
                >
                  <div className='flex min-w-0 items-center gap-2'>
                    <span className='flex-shrink-0 text-muted-foreground'>
                      {formatDate(tx.date)}
                    </span>
                    <span className='truncate font-medium'>
                      {tx.merchantName ||
                        tx.opposingAccountName ||
                        tx.description}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'flex-shrink-0 font-medium',
                      tx.amount < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    )}
                  >
                    {tx.amount > 0 ? '+' : ''}
                    <Currency amount={tx.amount} />
                  </span>
                </div>
              ))}
              {remainingCount > 0 && (
                <div className='pt-1 text-center text-sm text-muted-foreground'>
                  {(t.bulkDelete?.andMore || 'and {count} more').replace(
                    '{count}',
                    String(remainingCount)
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Total impact */}
        <div
          className='flex items-center justify-between rounded-lg bg-muted/30 px-4 py-2'
          data-testid='delete-preview-count'
        >
          <span className='text-sm font-medium'>
            {t.bulkDelete?.totalImpact || 'Total impact'}
          </span>
          <span
            className={cn(
              'text-lg font-bold',
              totalAmount < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-emerald-600 dark:text-emerald-400'
            )}
          >
            {totalAmount > 0 ? '+' : ''}
            <Currency amount={totalAmount} />
          </span>
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button
            variant='ghost'
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t.common.cancel}
          </Button>
          <Button
            variant='destructive'
            onClick={onConfirm}
            disabled={isLoading || count === 0}
            className='gap-2'
          >
            {isLoading ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Trash2 className='h-4 w-4' />
            )}
            {(
              t.bulkDelete?.deleteSelected || 'Delete {count} transactions'
            ).replace('{count}', String(count))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default BulkDeleteDialog;
