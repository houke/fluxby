/**
 * No Data Modal Component
 * Shows a Fluxby avatar with a suggestion to navigate to a period with data
 */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FluxbyWebGL } from '@fluxby/shared';
import { useFilters } from '@/contexts/FilterContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useDataService } from '@/contexts/DatabaseContext';
import { format } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';

export function NoDataModal() {
  const location = useLocation();
  const { t, language } = useLanguage();
  const { filters, setDateRange } = useFilters();
  const { activeProfileId } = useProfile();
  const dataService = useDataService();
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedForPeriod, setDismissedForPeriod] = useState<string | null>(
    null
  );

  // Get min/max dates to determine if there's any data at all
  const { data: minMaxDates, isLoading: isLoadingMinMax } = useQuery<{
    minDate: string;
    maxDate: string;
  } | null>({
    queryKey: ['min-max-dates', activeProfileId],
    queryFn: () => dataService.getMinMaxDates(),
    enabled: !!activeProfileId,
  });

  // Get transaction count for current period
  const { data: transactionCount, isLoading: isLoadingCount } =
    useQuery<number>({
      queryKey: [
        'transaction-count-for-period',
        activeProfileId,
        filters.dateRange.start.toISOString(),
        filters.dateRange.end.toISOString(),
      ],
      queryFn: async () => {
        const transactions = await dataService.getTransactions({
          startDate: filters.dateRange.start.toISOString().split('T')[0],
          endDate: filters.dateRange.end.toISOString().split('T')[0],
          limit: '1',
        });
        return transactions.length;
      },
      enabled: !!activeProfileId,
    });

  // Generate a period key for tracking dismissals
  const currentPeriodKey = `${filters.dateRange.start.toISOString()}-${filters.dateRange.end.toISOString()}`;

  // Determine suggested period based on available data
  const getSuggestedPeriod = (): {
    start: Date;
    end: Date;
    label: string;
  } | null => {
    if (!minMaxDates) return null;

    const maxDate = new Date(minMaxDates.maxDate);
    const now = new Date();
    const locale = language === 'nl' ? nl : enUS;

    // If the most recent data is in the current month, suggest "Last Month"
    if (
      maxDate.getFullYear() === now.getFullYear() &&
      maxDate.getMonth() === now.getMonth()
    ) {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        start: lastMonthStart,
        end: lastMonthEnd,
        label: t.common?.filters?.lastMonth || 'Last month',
      };
    }

    // Otherwise, suggest the month containing the most recent transaction
    const suggestedStart = new Date(
      maxDate.getFullYear(),
      maxDate.getMonth(),
      1
    );
    const suggestedEnd = new Date(
      maxDate.getFullYear(),
      maxDate.getMonth() + 1,
      0
    );
    const monthLabel = format(suggestedStart, 'MMMM yyyy', { locale });

    return {
      start: suggestedStart,
      end: suggestedEnd,
      label: monthLabel,
    };
  };

  const suggestedPeriod = getSuggestedPeriod();

  // Format current period for display
  const formatCurrentPeriod = () => {
    const { start, end } = filters.dateRange;
    const locale = language === 'nl' ? nl : enUS;
    return `${format(start, 'd MMM', { locale })} - ${format(end, 'd MMM yyyy', { locale })}`;
  };

  // Check if we should show the modal
  useEffect(() => {
    if (isLoadingMinMax || isLoadingCount) return;

    // Don't show on import page (user just finished importing)
    if (location.pathname.includes('/import')) {
      setIsOpen(false);
      return;
    }

    // Don't show if there's no data at all (user should import first)
    if (!minMaxDates) {
      setIsOpen(false);
      return;
    }

    // Don't show if current period has transactions
    if (transactionCount && transactionCount > 0) {
      setIsOpen(false);
      return;
    }

    // Don't show if already dismissed for this period
    if (dismissedForPeriod === currentPeriodKey) {
      setIsOpen(false);
      return;
    }

    // Don't show if we don't have a suggestion
    if (!suggestedPeriod) {
      setIsOpen(false);
      return;
    }

    // Show the modal
    setIsOpen(true);
  }, [
    isLoadingMinMax,
    isLoadingCount,
    minMaxDates,
    transactionCount,
    dismissedForPeriod,
    currentPeriodKey,
    suggestedPeriod,
    location.pathname,
  ]);

  const handleJumpToPeriod = () => {
    if (suggestedPeriod) {
      setDateRange(suggestedPeriod.start, suggestedPeriod.end);
    }
    setIsOpen(false);
  };

  const handleDismiss = () => {
    setDismissedForPeriod(currentPeriodKey);
    setIsOpen(false);
  };

  // Don't render if no suggested period
  if (!suggestedPeriod) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className='p-0 sm:max-w-md'>
        <div className='overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900'>
          <DialogHeader className='px-6 pt-6 pb-4 text-center'>
            <div className='mx-auto flex h-24 w-24 items-center justify-center'>
              <FluxbyWebGL width={80} height={80} />
            </div>
            <DialogTitle className='text-center'>
              {t.dashboard?.noDataForPeriod || 'No data for this period'}
            </DialogTitle>
            <DialogDescription className='text-center'>
              {(
                t.dashboard?.noDataDescription ||
                'No transactions found for {period}. Would you like to view a period with data?'
              ).replace('{period}', formatCurrentPeriod())}
            </DialogDescription>
          </DialogHeader>
          <div className='flex gap-3 border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50'>
            <button
              onClick={handleDismiss}
              className='flex-1 rounded-lg border-0 px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-purple-600 focus:ring-0 focus:outline-none focus-visible:ring-0 dark:text-gray-300 dark:hover:bg-purple-900/10'
            >
              {t.common?.dismiss || 'Dismiss'}
            </button>
            <button
              onClick={handleJumpToPeriod}
              className='rounded-lg bg-purple-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:outline-none'
            >
              {(t.dashboard?.jumpToPeriod || 'Jump to {period}').replace(
                '{period}',
                suggestedPeriod.label
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
