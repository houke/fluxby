import { memo, useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import { Calendar as CalendarIcon, Trash2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

import type { Account } from '@fluxby/shared';

export interface DateRangeDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts?: Account[];
  onConfirm: (startDate: string, endDate: string, accountId?: string) => void;
  onPreviewCount: (
    startDate: string,
    endDate: string,
    accountId?: string
  ) => Promise<number>;
  isLoading?: boolean;
}

/**
 * Dialog for deleting transactions by date range.
 *
 * Dialog Flow:
 * 1. User clicks "Delete by date range" button
 * 2. Modal opens with start/end date pickers
 * 3. As dates change, show preview count ("X transactions will be deleted")
 * 4. Confirm button triggers deletion
 */
export const DateRangeDeleteDialog = memo(function DateRangeDeleteDialog({
  open,
  onOpenChange,
  accounts = [],
  onConfirm,
  onPreviewCount,
  isLoading = false,
}: DateRangeDeleteDialogProps) {
  const { t, language } = useLanguage();
  const locale = language === 'nl' ? nl : enUS;

  // Form state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedAccountId('all');
      setPreviewCount(null);
    }
  }, [open]);

  // Fetch preview count when dates change
  const updatePreviewCount = useCallback(async () => {
    if (!startDate || !endDate) {
      setPreviewCount(null);
      return;
    }

    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');
    const accountId =
      selectedAccountId === 'all' ? undefined : selectedAccountId;

    setIsLoadingPreview(true);
    try {
      const count = await onPreviewCount(startStr, endStr, accountId);
      setPreviewCount(count);
    } catch (error) {
      console.error('Failed to fetch preview count:', error);
      setPreviewCount(null);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [startDate, endDate, selectedAccountId, onPreviewCount]);

  // Debounce preview count updates
  useEffect(() => {
    const timer = setTimeout(() => {
      updatePreviewCount();
    }, 300);
    return () => clearTimeout(timer);
  }, [updatePreviewCount]);

  const handleConfirm = () => {
    if (!startDate || !endDate) return;

    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');
    const accountId =
      selectedAccountId === 'all' ? undefined : selectedAccountId;

    onConfirm(startStr, endStr, accountId);
  };

  const canSubmit =
    startDate && endDate && previewCount !== null && previewCount > 0;

  // Prevent closing dialog while loading
  const handleOpenChange = (open: boolean) => {
    if (isLoading && !open) return;
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>
            {t.bulkDelete?.deleteByDateRange || 'Delete by date range'}
          </DialogTitle>
          <DialogDescription>
            {t.bulkDelete?.confirmWarning ||
              'This action cannot be undone after 5 minutes.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* Start date picker */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>
              {t.bulkDelete?.dateRange?.start || 'Start date'}
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {startDate
                    ? format(startDate, 'PPP', { locale })
                    : t.bulkDelete?.dateRange?.start || 'Pick a start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='single'
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) =>
                    date > new Date() || (endDate ? date > endDate : false)
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End date picker */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>
              {t.bulkDelete?.dateRange?.end || 'End date'}
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !endDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {endDate
                    ? format(endDate, 'PPP', { locale })
                    : t.bulkDelete?.dateRange?.end || 'Pick an end date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='single'
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) =>
                    date > new Date() || (startDate ? date < startDate : false)
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Account filter (optional) */}
          {accounts.length > 1 && (
            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                {t.import?.account || 'Account'} (
                {t.common?.optional || 'optional'})
              </label>
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.common?.all || 'All accounts'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>
                    {t.common?.all || 'All accounts'}
                  </SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Preview count */}
          <div className='rounded-lg bg-muted/50 p-4 text-center'>
            {isLoadingPreview ? (
              <div className='flex items-center justify-center gap-2 text-muted-foreground'>
                <Loader2 className='h-4 w-4 animate-spin' />
                <span className='text-sm'>
                  {t.common?.loading || 'Loading...'}
                </span>
              </div>
            ) : previewCount === null ? (
              <span className='text-sm text-muted-foreground'>
                {t.bulkDelete?.dateRange?.noMatches ||
                  'Select dates to see preview'}
              </span>
            ) : previewCount === 0 ? (
              <span className='text-sm text-muted-foreground'>
                {t.bulkDelete?.dateRange?.noMatches || 'No transactions found'}
              </span>
            ) : (
              <span
                className='text-sm font-medium text-destructive'
                data-testid='delete-preview-count'
              >
                {(
                  t.bulkDelete?.dateRange?.preview ||
                  '{count} transactions will be deleted'
                ).replace('{count}', String(previewCount))}
              </span>
            )}
          </div>
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button
            variant='ghost'
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t.common?.cancel || 'Cancel'}
          </Button>
          <Button
            variant='destructive'
            onClick={handleConfirm}
            disabled={!canSubmit || isLoading}
            className='gap-2'
          >
            {isLoading ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Trash2 className='h-4 w-4' />
            )}
            {t.common?.delete || 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default DateRangeDeleteDialog;
