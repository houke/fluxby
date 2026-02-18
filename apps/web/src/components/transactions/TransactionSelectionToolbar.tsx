import { memo, useEffect, useState } from 'react';
import { Trash2, X, ChevronDown, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export interface TransactionSelectionToolbarProps {
  selectionCount: number;
  onCancelSelection: () => void;
  onDeleteSelected: () => void;
  onDeleteByDateRange?: () => void;
  isDeleting?: boolean;
}

/**
 * Toolbar that appears when transactions are selected.
 * Shows count, cancel button, and delete actions.
 *
 * Layout (from UX spec):
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │   [✓] 3 selected   [Cancel Selection]              [🗑 Delete ▼]   │
 * └─────────────────────────────────────────────────────────────────────┘
 */
export const TransactionSelectionToolbar = memo(
  function TransactionSelectionToolbar({
    selectionCount,
    onCancelSelection,
    onDeleteSelected,
    onDeleteByDateRange,
    isDeleting = false,
  }: TransactionSelectionToolbarProps) {
    const { t } = useLanguage();
    const [isVisible, setIsVisible] = useState(false);

    // Animate in when mounted
    useEffect(() => {
      // Small delay for mount animation
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    }, []);

    const hasDateRangeOption = !!onDeleteByDateRange;

    return (
      <div
        className={cn(
          'flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3 shadow-sm transition-all duration-200 motion-reduce:transition-none',
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
        )}
        role='toolbar'
        aria-label={t.bulkDelete?.selectionMode || 'Selection mode'}
        data-testid='selection-toolbar'
      >
        {/* Left side: Selection count */}
        <div className='flex items-center gap-3'>
          <div className='flex h-8 w-8 items-center justify-center rounded-md bg-primary/10'>
            <span className='text-sm font-semibold text-primary'>
              {selectionCount}
            </span>
          </div>
          <span
            className='text-sm font-medium text-foreground'
            data-testid='selection-count'
            aria-live='polite'
            aria-atomic='true'
          >
            {(t.bulkDelete?.selected || '{count} selected').replace(
              '{count}',
              String(selectionCount)
            )}
          </span>
        </div>

        {/* Right side: Actions */}
        <div className='flex items-center gap-2'>
          {/* Cancel button */}
          <Button
            variant='ghost'
            size='sm'
            onClick={onCancelSelection}
            disabled={isDeleting}
            className='gap-1.5'
            data-testid='cancel-selection'
            aria-label={t.bulkDelete?.cancelSelection || 'Cancel selection'}
          >
            <X className='h-4 w-4' aria-hidden='true' />
            <span className='hidden sm:inline'>
              {t.bulkDelete?.cancelSelection || 'Cancel selection'}
            </span>
          </Button>

          {/* Delete button(s) */}
          {hasDateRangeOption ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='destructive'
                  size='sm'
                  disabled={isDeleting}
                  data-testid='bulk-delete-button'
                  className='gap-1.5'
                >
                  {isDeleting ? (
                    <Loader2
                      className='h-4 w-4 animate-spin'
                      aria-hidden='true'
                    />
                  ) : (
                    <Trash2 className='h-4 w-4' aria-hidden='true' />
                  )}
                  <span className='hidden sm:inline'>
                    {isDeleting
                      ? t.bulkDelete?.deleting || 'Deleting...'
                      : t.bulkDelete?.deleteSelected || 'Delete selected'}
                  </span>
                  {!isDeleting && (
                    <ChevronDown className='h-3.5 w-3.5' aria-hidden='true' />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  onClick={onDeleteSelected}
                  disabled={selectionCount === 0}
                  className='gap-2 text-destructive focus:bg-destructive focus:text-white'
                >
                  <Trash2 className='h-4 w-4' aria-hidden='true' />
                  {(
                    t.bulkDelete?.deleteSelected || 'Delete {count} selected'
                  ).replace('{count}', String(selectionCount))}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDeleteByDateRange}
                  className='gap-2 text-destructive focus:bg-destructive focus:text-white'
                  data-testid='date-range-delete'
                >
                  <Calendar className='h-4 w-4' aria-hidden='true' />
                  {t.bulkDelete?.deleteByDateRange || 'Delete by date range'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant='destructive'
              size='sm'
              onClick={onDeleteSelected}
              disabled={isDeleting || selectionCount === 0}
              data-testid='bulk-delete-button'
              className='gap-1.5'
            >
              {isDeleting ? (
                <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' />
              ) : (
                <Trash2 className='h-4 w-4' aria-hidden='true' />
              )}
              <span className='hidden sm:inline'>
                {isDeleting
                  ? t.bulkDelete?.deleting || 'Deleting...'
                  : t.bulkDelete?.deleteSelected || 'Delete selected'}
              </span>
            </Button>
          )}
        </div>
      </div>
    );
  }
);

export default TransactionSelectionToolbar;
