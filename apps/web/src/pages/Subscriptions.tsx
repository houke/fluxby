import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RefreshCw,
  Check,
  X,
  Trash2,
  Calendar,
  List,
  AlertTriangle,
  TrendingUp,
  Clock,
  CreditCard,
  Sparkles,
  Pencil,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Currency } from '@/components/ui/currency';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { Link } from 'react-router-dom';
import type {
  RecurringPattern,
  RecurringStats,
  RecurringCalendarEntry,
  PatternType,
} from '@fluxby/shared';

// Helper to format dates
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Helper to get frequency label
function getFrequencyLabel(
  type: PatternType,
  t: ReturnType<typeof useLanguage>['t']
): string {
  const labels: Record<PatternType, string> = {
    weekly: t.subscriptions?.weekly || 'Weekly',
    biweekly: t.subscriptions?.biweekly || 'Bi-weekly',
    monthly: t.subscriptions?.monthly || 'Monthly',
    quarterly: t.subscriptions?.quarterly || 'Quarterly',
    yearly: t.subscriptions?.yearly || 'Yearly',
  };
  return labels[type];
}

// Calculate monthly equivalent for display
function _getMonthlyEquivalent(
  amount: number,
  patternType: PatternType
): number {
  const multipliers: Record<PatternType, number> = {
    weekly: 4.33,
    biweekly: 2.17,
    monthly: 1,
    quarterly: 0.33,
    yearly: 0.083,
  };
  return amount * (multipliers[patternType] || 1);
}

export default function Subscriptions() {
  const { t } = useLanguage();
  const { activeProfileId } = useProfile();
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  useDocumentTitle(t.subscriptions?.title || 'Subscriptions');

  // View state
  const [view, setView] = useState<'list' | 'calendar'>('list');

  // Get current month dates for calendar
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];

  // Queries
  const { data: patterns, isLoading: loadingPatterns } = useQuery<
    RecurringPattern[]
  >({
    queryKey: ['recurring-patterns', activeProfileId],
    queryFn: () => api.getRecurringPatterns(),
    staleTime: 2 * 60 * 1000, // 2 minutes - patterns don't change often
  });

  const { data: stats, isLoading: loadingStats } = useQuery<RecurringStats>({
    queryKey: ['recurring-stats', activeProfileId],
    queryFn: () => api.getRecurringStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Query dismissed alerts from database (persisted)
  const { data: dismissedAlerts } = useQuery({
    queryKey: ['dismissed-alerts', activeProfileId],
    queryFn: () => api.getDismissedAlerts(),
    staleTime: 2 * 60 * 1000,
  });

  // Check if there are any transactions for this profile
  const { data: hasTransactions } = useQuery({
    queryKey: ['has-transactions', activeProfileId],
    queryFn: async () => {
      const txs = await api.getTransactions({ limit: '1' });
      return txs.length > 0;
    },
  });

  const { data: calendarEntries } = useQuery<RecurringCalendarEntry[]>({
    queryKey: ['recurring-calendar', activeProfileId, startOfMonth, endOfMonth],
    queryFn: () => api.getRecurringCalendar(startOfMonth, endOfMonth),
    enabled: view === 'calendar',
  });

  // Mutations
  const detectMutation = useMutation({
    mutationFn: async () => {
      // First, reset any dismissed patterns so they can be re-detected
      // This helps when patterns were incorrectly dismissed by category rules
      await api.resetDismissedPatterns();
      // Then run detection
      return api.detectRecurringPatterns();
    },
    onSuccess: async (result) => {
      // Force immediate refetch of patterns to show newly detected patterns
      await queryClient.refetchQueries({
        queryKey: ['recurring-patterns', activeProfileId],
      });
      await queryClient.refetchQueries({
        queryKey: ['recurring-stats', activeProfileId],
      });
      toast.success(
        `${result.detected} ${t.subscriptions?.detected || 'new patterns detected'}, ${result.updated} ${t.subscriptions?.updated || 'patterns updated'}`
      );
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: api.confirmRecurringPattern,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['recurring-patterns', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['recurring-stats', activeProfileId],
      });
      toast.success(t.subscriptions?.confirmed || 'Subscription confirmed');
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const dismissMutation = useMutation({
    mutationFn: api.dismissRecurringPattern,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['recurring-patterns', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['recurring-stats', activeProfileId],
      });
      toast.success(t.subscriptions?.dismissed || 'Subscription dismissed');
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteRecurringPattern,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['recurring-patterns', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['recurring-stats', activeProfileId],
      });
      toast.success(t.subscriptions?.deleted || 'Subscription deleted');
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: {
        merchantName?: string;
        patternType?: PatternType;
        avgAmount?: number;
      };
    }) => api.updateRecurringPattern(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['recurring-patterns', activeProfileId],
      });
      toast.success(t.subscriptions?.updated || 'Subscription updated');
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // State for expanded patterns and their transactions
  const [expandedPatternId, setExpandedPatternId] = useState<string | null>(
    null
  );

  // Query for transactions when a pattern is expanded
  const { data: patternTransactions, isLoading: loadingPatternTransactions } =
    useQuery({
      queryKey: ['pattern-transactions', expandedPatternId],
      queryFn: () =>
        expandedPatternId
          ? api.getTransactionsForPattern(expandedPatternId)
          : null,
      enabled: !!expandedPatternId,
    });

  // Handlers
  const handleConfirm = (id: string) => {
    confirmMutation.mutate(id);
  };

  const handleEdit = useCallback(
    (
      id: string,
      updates: {
        merchantName?: string;
        patternType?: PatternType;
        avgAmount?: number;
      }
    ) => {
      updateMutation.mutate({ id, updates });
    },
    [updateMutation]
  );

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedPatternId((prev) => (prev === id ? null : id));
  }, []);

  const handleDismiss = async (id: string) => {
    const confirmed = await confirm({
      title: t.subscriptions?.dismissPattern || 'Dismiss pattern',
      message:
        t.subscriptions?.dismissPatternDescription ||
        'This is not a subscription, hide this pattern',
    });
    if (confirmed) {
      dismissMutation.mutate(id);
    }
  };

  const handleDelete = async (id: string, isStale = false) => {
    const confirmed = await confirm({
      title: t.subscriptions?.delete || 'Delete',
      message: isStale
        ? t.subscriptions?.deleteStaleDescription ||
          'This subscription appears to be no longer active and will be removed from your profile.'
        : t.subscriptions?.deleteConfirmDescription ||
          'Are you sure you want to delete this subscription?',
      variant: 'danger',
    });
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  // Handle accepting a price change (update the subscription amount and dismiss alert)
  const acceptPriceChangeMutation = useMutation({
    mutationFn: ({
      patternId,
      newAmount,
    }: {
      patternId: string;
      newAmount: number;
    }) => api.acceptPriceChange(patternId, newAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['recurring-patterns', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['dismissed-alerts', activeProfileId],
      });
      toast.success(
        t.subscriptions?.priceUpdated || 'Subscription amount updated'
      );
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Handle dismissing an alert (persist to database)
  const dismissAlertMutation = useMutation({
    mutationFn: ({
      patternId,
      alertType,
      dismissedAmount,
    }: {
      patternId: string;
      alertType: 'price_change' | 'missed_payment' | 'stale';
      dismissedAmount?: number;
    }) => api.dismissSubscriptionAlert(patternId, alertType, dismissedAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['dismissed-alerts', activeProfileId],
      });
      toast.success(t.subscriptions?.alertDismissed || 'Alert dismissed');
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const handleAcceptPriceChange = (patternId: string, newAmount: number) => {
    acceptPriceChangeMutation.mutate({ patternId, newAmount });
  };

  // Handle rejecting a price change (dismiss the alert permanently)
  const handleRejectPriceChange = (
    patternId: string,
    currentAmount: number
  ) => {
    dismissAlertMutation.mutate({
      patternId,
      alertType: 'price_change',
      dismissedAmount: currentAmount,
    });
  };

  // Handle dismissing a missed payment alert
  const handleDismissMissedPayment = (patternId: string) => {
    dismissAlertMutation.mutate({
      patternId,
      alertType: 'missed_payment',
    });
  };

  // Computed values - show all active patterns (detection already filters by expense type)
  const pendingPatterns = useMemo(() => {
    return (
      patterns?.filter(
        (p) => !p.isConfirmed && p.isActive && typeof p.avgAmount === 'number'
      ) || []
    );
  }, [patterns]);

  const confirmedPatterns = useMemo(() => {
    return (
      patterns?.filter(
        (p) => p.isConfirmed && p.isActive && typeof p.avgAmount === 'number'
      ) || []
    );
  }, [patterns]);

  // Check for alerts (price changes, missed payments, stale subscriptions)
  // Only for confirmed subscriptions - alerts should never show for dismissed or unconfirmed patterns
  const alerts = useMemo(() => {
    if (!patterns) return [];
    const alertList: Array<{
      id: string;
      type: 'price_change' | 'missed_payment' | 'stale';
      pattern: RecurringPattern;
      message: string;
      newAmount?: number;
      isIncrease?: boolean;
    }> = [];

    const today = new Date().toISOString().split('T')[0];
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    // Helper to check if an alert type is dismissed for a pattern
    const isAlertDismissed = (
      patternId: string,
      alertType: 'price_change' | 'missed_payment' | 'stale',
      currentAmount?: number
    ): boolean => {
      if (!dismissedAlerts) return false;
      const patternDismissals = dismissedAlerts.get(patternId);
      if (!patternDismissals) return false;

      const dismissal = patternDismissals.find((d) => d.type === alertType);
      if (!dismissal) return false;

      // For price changes, check if the dismissed amount matches the current last amount
      // If the price changed again, show a new alert
      if (alertType === 'price_change' && currentAmount !== undefined) {
        // If the user dismissed at a different amount, they should see the new price change
        if (dismissal.dismissedAmount !== undefined) {
          const absDissmissed = Math.abs(dismissal.dismissedAmount);
          const absCurrent = Math.abs(currentAmount);
          // Allow 2% tolerance for rounding differences
          const percentDiff = Math.abs(absDissmissed - absCurrent) / absCurrent;
          return percentDiff < 0.02;
        }
      }

      return true;
    };

    for (const pattern of patterns) {
      // Only check confirmed subscriptions for alerts
      // Dismissed patterns (is_dismissed=1) are already filtered out in getRecurringPatterns
      if (!pattern.isConfirmed || typeof pattern.avgAmount !== 'number')
        continue;

      // Price change alert (>5% difference between last amount and saved average)
      // Skip if user has dismissed this alert at the same amount
      const absLast = Math.abs(pattern.lastAmount);
      const absAvg = Math.abs(pattern.avgAmount);
      const percentChange = Math.abs((absLast - absAvg) / absAvg) * 100;

      if (
        percentChange > 5 &&
        !isAlertDismissed(pattern.id, 'price_change', pattern.lastAmount)
      ) {
        // For expenses: more negative = higher cost = price increase
        const isIncrease = absLast > absAvg;
        alertList.push({
          id: `price-${pattern.id}`,
          type: 'price_change',
          pattern,
          message: isIncrease
            ? t.subscriptions?.priceIncreaseDetected ||
              'Price increase detected. Would you like to update the subscription amount?'
            : t.subscriptions?.priceDecreaseDetected ||
              'Price decrease detected. Would you like to update the subscription amount?',
          newAmount: pattern.lastAmount,
          isIncrease,
        });
      }

      // Missed payment alert (expected date passed)
      // Only show if not dismissed
      if (
        pattern.nextExpectedDate &&
        pattern.nextExpectedDate < today &&
        !isAlertDismissed(pattern.id, 'missed_payment')
      ) {
        alertList.push({
          id: `missed-${pattern.id}`,
          type: 'missed_payment',
          pattern,
          message:
            t.subscriptions?.missedPaymentDescription ||
            'Expected date has passed',
        });
      }

      // Stale subscription alert (no transactions in 2+ months)
      // Only show if not dismissed
      if (
        pattern.lastDate &&
        new Date(pattern.lastDate) < twoMonthsAgo &&
        !isAlertDismissed(pattern.id, 'stale')
      ) {
        alertList.push({
          id: `stale-${pattern.id}`,
          type: 'stale',
          pattern,
          message:
            t.subscriptions?.staleDescription ||
            'No transactions in 2+ months. Consider removing.',
        });
      }
    }

    return alertList;
  }, [patterns, t, dismissedAlerts]);

  const isLoading = loadingPatterns || loadingStats;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <PageHeader
        title={t.subscriptions?.title || 'Subscriptions'}
        subtitle={t.subscriptions?.subtitle || 'Manage your recurring payments'}
        dataOnboarding='subscriptions-greeting'
        actions={
          <div className='flex items-center gap-2'>
            {/* View toggle */}
            <div
              className='flex rounded-md border'
              data-onboarding='subscriptions-calendar-toggle'
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={'ghost'}
                      size='sm'
                      className={cn(
                        'rounded-r-none',
                        view === 'list' &&
                          'bg-purple-600 text-white hover:bg-purple-700'
                      )}
                      onClick={() => setView('list')}
                    >
                      <List className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t.subscriptions?.listView || 'List view'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={'ghost'}
                      size='sm'
                      className={cn(
                        'rounded-l-none',
                        view === 'calendar' &&
                          'bg-purple-600 text-white hover:bg-purple-700'
                      )}
                      onClick={() => setView('calendar')}
                    >
                      <Calendar className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t.subscriptions?.calendarView || 'Calendar view'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Detect button */}
            <Button
              onClick={() => detectMutation.mutate()}
              disabled={detectMutation.isPending}
              data-onboarding='detect-patterns-button'
            >
              <RefreshCw
                className={cn(
                  'mr-2 h-4 w-4',
                  detectMutation.isPending && 'animate-spin'
                )}
              />
              {detectMutation.isPending
                ? t.subscriptions?.detecting || 'Detecting...'
                : t.subscriptions?.detectPatterns || 'Detect patterns'}
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div
        className='-mx-3 grid grid-cols-2 gap-px bg-border sm:mx-0 sm:gap-4 sm:bg-transparent lg:grid-cols-4'
        data-onboarding='subscriptions-stats'
      >
        <Card className='group relative h-full overflow-hidden rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
          <CardContent className='relative z-10 flex h-full flex-col justify-between p-4 sm:p-6'>
            <div className='flex-1'>
              <p className='text-sm font-medium text-muted-foreground'>
                {t.subscriptions?.totalMonthlySpend || 'Total monthly spend'}
              </p>
              {loadingStats ? (
                <Skeleton className='mt-2 h-8 w-24' />
              ) : (
                <p className='mt-2 text-2xl font-bold sm:text-3xl'>
                  <Currency amount={stats?.totalMonthlySpend || 0} />
                </p>
              )}
            </div>
          </CardContent>
          <div className='absolute -top-12 -right-12 flex h-48 w-48 items-center justify-center rounded-full bg-rose-200 opacity-10 transition-transform duration-500 group-hover:scale-110 sm:-top-8 sm:-right-8 dark:bg-rose-900/50'>
            <CreditCard className='h-16 w-16 text-rose-900 dark:text-rose-400' />
          </div>
        </Card>

        <Card className='group relative h-full overflow-hidden rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
          <CardContent className='relative z-10 flex h-full flex-col justify-between p-4 sm:p-6'>
            <div className='flex-1'>
              <p className='text-sm font-medium text-muted-foreground'>
                {t.subscriptions?.activeSubscriptions || 'Active subscriptions'}
              </p>
              {loadingStats ? (
                <Skeleton className='mt-2 h-8 w-16' />
              ) : (
                <p className='mt-2 text-2xl font-bold sm:text-3xl'>
                  {stats?.activeSubscriptions || 0}
                </p>
              )}
            </div>
          </CardContent>
          <div className='absolute -top-12 -right-12 flex h-48 w-48 items-center justify-center rounded-full bg-blue-200 opacity-10 transition-transform duration-500 group-hover:scale-110 sm:-top-8 sm:-right-8 dark:bg-blue-900/50'>
            <Clock className='h-16 w-16 text-blue-900 dark:text-blue-400' />
          </div>
        </Card>

        <Card className='group relative h-full overflow-hidden rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
          <CardContent className='relative z-10 flex h-full flex-col justify-between p-4 sm:p-6'>
            <div className='flex-1'>
              <p className='text-sm font-medium text-muted-foreground'>
                {t.subscriptions?.confirmedSubscriptions || 'Confirmed'}
              </p>
              {loadingStats ? (
                <Skeleton className='mt-2 h-8 w-16' />
              ) : (
                <p className='mt-2 text-2xl font-bold sm:text-3xl'>
                  {stats?.confirmedSubscriptions || 0}
                </p>
              )}
            </div>
          </CardContent>
          <div className='absolute -top-12 -right-12 flex h-48 w-48 items-center justify-center rounded-full bg-emerald-200 opacity-10 transition-transform duration-500 group-hover:scale-110 sm:-top-8 sm:-right-8 dark:bg-emerald-900/50'>
            <Check className='h-16 w-16 text-emerald-900 dark:text-emerald-400' />
          </div>
        </Card>

        <Card className='group relative h-full overflow-hidden rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
          <CardContent className='relative z-10 flex h-full flex-col justify-between p-4 sm:p-6'>
            <div className='flex-1'>
              <p className='text-sm font-medium text-muted-foreground'>
                {t.subscriptions?.pendingConfirmation || 'Pending confirmation'}
              </p>
              {loadingStats ? (
                <Skeleton className='mt-2 h-8 w-16' />
              ) : (
                <p className='mt-2 text-2xl font-bold sm:text-3xl'>
                  {stats?.pendingConfirmation || 0}
                </p>
              )}
            </div>
          </CardContent>
          <div className='absolute -top-12 -right-12 flex h-48 w-48 items-center justify-center rounded-full bg-purple-200 opacity-10 transition-transform duration-500 group-hover:scale-110 sm:-top-8 sm:-right-8 dark:bg-purple-900/50'>
            <Sparkles className='h-16 w-16 text-purple-900 dark:text-purple-400' />
          </div>
        </Card>
      </div>

      {/* Alerts - Price changes, missed payments, and stale subscriptions */}
      {alerts.length > 0 && (
        <Card data-onboarding='subscriptions-alerts'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5 text-orange-500' />
              {t.subscriptions?.alerts || 'Alerts'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className='flex items-center justify-between rounded-lg border p-3'
                >
                  <div className='flex items-center gap-3'>
                    {alert.type === 'price_change' && (
                      <TrendingUp
                        className={`h-5 w-5 ${alert.isIncrease ? 'text-orange-500' : 'text-emerald-500'}`}
                      />
                    )}
                    {alert.type === 'missed_payment' && (
                      <Clock className='h-5 w-5 text-red-500' />
                    )}
                    {alert.type === 'stale' && (
                      <AlertTriangle className='h-5 w-5 text-amber-500' />
                    )}
                    <div>
                      <p className='font-medium'>
                        {alert.pattern.merchantName || 'Unknown'}
                        {alert.type === 'price_change' && alert.newAmount && (
                          <span
                            className={`ml-2 text-sm ${alert.isIncrease ? 'text-orange-600' : 'text-emerald-600'}`}
                          >
                            <Currency
                              amount={Math.abs(alert.pattern.avgAmount)}
                            />{' '}
                            → <Currency amount={Math.abs(alert.newAmount)} />
                          </span>
                        )}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        {alert.message}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-1'>
                    {alert.type === 'price_change' && alert.newAmount && (
                      <>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size='sm'
                                variant='ghost'
                                className='h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-600 hover:text-white focus:ring-0 focus:outline-none'
                                onClick={() => {
                                  if (alert.newAmount !== undefined) {
                                    handleAcceptPriceChange(
                                      alert.pattern.id,
                                      alert.newAmount
                                    );
                                  }
                                }}
                              >
                                <Check className='h-4 w-4' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t.subscriptions?.updateAmount ||
                                'Update subscription amount'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size='sm'
                                variant='ghost'
                                className='h-8 w-8 p-0 text-red-600 hover:bg-red-600 hover:text-white focus:ring-0 focus:outline-none'
                                onClick={() =>
                                  handleRejectPriceChange(
                                    alert.pattern.id,
                                    alert.newAmount!
                                  )
                                }
                              >
                                <X className='h-4 w-4' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t.subscriptions?.dismissAlert || 'Dismiss alert'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                    )}
                    {alert.type === 'missed_payment' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size='sm'
                              variant='ghost'
                              className='h-8 w-8 p-0 text-gray-600 hover:bg-gray-600 hover:text-white focus:ring-0 focus:outline-none'
                              onClick={() =>
                                handleDismissMissedPayment(alert.pattern.id)
                              }
                            >
                              <X className='h-4 w-4' />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t.subscriptions?.dismissAlert || 'Dismiss alert'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {alert.type === 'stale' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size='sm'
                              variant='ghost'
                              className='h-8 w-8 p-0 text-red-600 hover:bg-red-600 hover:text-white focus:ring-0 focus:outline-none'
                              onClick={() =>
                                handleDelete(alert.pattern.id, true)
                              }
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t.subscriptions?.removeStale ||
                              'Remove inactive subscription'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {isLoading ? (
        <div className='space-y-4'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className='h-24 w-full' />
          ))}
        </div>
      ) : !patterns || patterns.length === 0 ? (
        <Card>
          <CardContent className='pt-6'>
            <EmptyState
              icon={Calendar}
              title={
                t.subscriptions?.noSubscriptions ||
                'No subscriptions detected yet'
              }
              description={
                hasTransactions
                  ? t.subscriptions?.noSubscriptionsDescriptionWithData ||
                    'Detect recurring patterns from your imported transactions'
                  : t.subscriptions?.noSubscriptionsDescription ||
                    'Import transactions to automatically detect recurring payments'
              }
              action={
                hasTransactions ? (
                  <button
                    onClick={() => detectMutation.mutate()}
                    disabled={detectMutation.isPending}
                    className='text-sm text-purple-600 hover:text-purple-700 hover:underline disabled:opacity-50 dark:text-purple-400 dark:hover:text-purple-300'
                  >
                    {detectMutation.isPending
                      ? t.common?.loading || 'Loading...'
                      : t.subscriptions?.detectPatterns || 'Detect patterns'}
                  </button>
                ) : (
                  <Link
                    to='/import'
                    className='text-sm text-purple-600 hover:text-purple-700 hover:underline dark:text-purple-400 dark:hover:text-purple-300'
                  >
                    {t.dashboard?.goToImport || 'Go to import'}
                  </Link>
                )
              }
            />
          </CardContent>
        </Card>
      ) : view === 'list' ? (
        <div className='space-y-6'>
          {/* Suggested subscriptions - single card for all pending patterns */}
          {pendingPatterns.length > 0 ? (
            <Card data-onboarding='subscriptions-pending'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Sparkles className='h-5 w-5 text-purple-500' />
                  {t.subscriptions?.suggestedSubscriptions ||
                    'Suggested subscriptions'}
                </CardTitle>
                <CardDescription>
                  {t.subscriptions?.suggestedDescription ||
                    'We detected these recurring payments. Accept to track them or dismiss to hide.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {pendingPatterns.map((pattern) => (
                    <SubscriptionCard
                      key={pattern.id}
                      pattern={pattern}
                      t={t}
                      onConfirm={() => handleConfirm(pattern.id)}
                      onDismiss={() => handleDismiss(pattern.id)}
                      isExpanded={expandedPatternId === pattern.id}
                      onToggleExpand={() => handleToggleExpand(pattern.id)}
                      transactions={
                        expandedPatternId === pattern.id
                          ? patternTransactions || undefined
                          : undefined
                      }
                      isLoadingTransactions={
                        expandedPatternId === pattern.id &&
                        loadingPatternTransactions
                      }
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Confirmed subscriptions */}
          {confirmedPatterns.length > 0 ? (
            <Card data-onboarding='subscriptions-confirmed'>
              <CardHeader>
                <CardTitle>
                  {t.subscriptions?.activeSubscriptions ||
                    'Active subscriptions'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {confirmedPatterns.map((pattern) => (
                    <SubscriptionCard
                      key={pattern.id}
                      pattern={pattern}
                      t={t}
                      onDelete={() => handleDelete(pattern.id)}
                      onEdit={(updates) => handleEdit(pattern.id, updates)}
                      isExpanded={expandedPatternId === pattern.id}
                      onToggleExpand={() => handleToggleExpand(pattern.id)}
                      transactions={
                        expandedPatternId === pattern.id
                          ? patternTransactions || undefined
                          : undefined
                      }
                      isLoadingTransactions={
                        expandedPatternId === pattern.id &&
                        loadingPatternTransactions
                      }
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : (
        /* Calendar View */
        <Card>
          <CardHeader>
            <CardTitle>
              {t.subscriptions?.expectedPayments || 'Expected payments'}
            </CardTitle>
            <CardDescription>
              {t.common?.months?.[now.getMonth()] || ''} {now.getFullYear()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {calendarEntries && calendarEntries.length > 0 ? (
              <div className='space-y-2'>
                {calendarEntries.map((entry, index) => (
                  <div
                    key={`${entry.id}-${index}`}
                    className='flex items-center justify-between rounded-lg border p-3'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-muted text-xs'>
                        <span className='font-medium'>
                          {new Date(entry.date).getDate()}
                        </span>
                        <span className='text-muted-foreground'>
                          {t.common?.monthsShort?.[
                            new Date(entry.date).getMonth()
                          ] || ''}
                        </span>
                      </div>
                      <div>
                        <p className='font-medium'>
                          {entry.merchantName || 'Unknown'}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          {getFrequencyLabel(entry.patternType, t)}
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='font-medium'>
                        <Currency amount={entry.expectedAmount} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-center text-muted-foreground'>
                {t.subscriptions?.noAlerts || 'No expected payments this month'}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper to check if a subscription is stale (no transactions in 2+ months)
function isStaleSubscription(pattern: RecurringPattern): boolean {
  if (!pattern.lastDate) return false;
  const lastDate = new Date(pattern.lastDate);
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  return lastDate < twoMonthsAgo;
}

// Helper to check if next payment is in the past
function isNextPaymentOverdue(pattern: RecurringPattern): boolean {
  if (!pattern.nextExpectedDate) return false;
  const today = new Date().toISOString().split('T')[0];
  return pattern.nextExpectedDate < today;
}

// Helper to check if last transaction is in current month
function hasTransactionThisMonth(pattern: RecurringPattern): boolean {
  if (!pattern.lastDate) return false;
  const lastDate = new Date(pattern.lastDate);
  const now = new Date();
  return (
    lastDate.getFullYear() === now.getFullYear() &&
    lastDate.getMonth() === now.getMonth()
  );
}

// Subscription card component
function SubscriptionCard({
  pattern,
  t,
  onConfirm,
  onDismiss,
  onDelete,
  onEdit,
  isExpanded,
  onToggleExpand,
  transactions,
  isLoadingTransactions,
}: {
  pattern: RecurringPattern;
  t: ReturnType<typeof useLanguage>['t'];
  onConfirm?: () => void;
  onDismiss?: () => void;
  onDelete?: () => void;
  onEdit?: (updates: {
    merchantName?: string;
    patternType?: PatternType;
    avgAmount?: number;
  }) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  transactions?: Array<{
    id: string;
    date: string;
    amount: number;
    description: string;
  }>;
  isLoadingTransactions?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(pattern.merchantName || '');
  const [editFrequency, setEditFrequency] = useState<PatternType>(
    pattern.patternType
  );
  const [editAmount, setEditAmount] = useState(
    Math.abs(pattern.avgAmount).toString()
  );

  const handleSaveEdit = () => {
    if (onEdit) {
      const parsedAmount = parseFloat(editAmount);
      onEdit({
        merchantName: editName.trim() || undefined,
        patternType: editFrequency,
        avgAmount: !isNaN(parsedAmount) ? parsedAmount : undefined,
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(pattern.merchantName || '');
    setEditFrequency(pattern.patternType);
    setEditAmount(Math.abs(pattern.avgAmount).toString());
    setIsEditing(false);
  };

  const stale = isStaleSubscription(pattern);
  const overdue = isNextPaymentOverdue(pattern);
  const hasThisMonthTransaction = hasTransactionThisMonth(pattern);
  // Show 'awaiting' instead of 'overdue' if we don't have a transaction this month yet
  const showAwaiting = overdue && !hasThisMonthTransaction && !stale;

  return (
    <div className='rounded-lg border'>
      <div className='flex items-center justify-between p-4'>
        <div className='flex-1'>
          <div className='flex items-center gap-2'>
            {isEditing ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className='h-8 w-48'
                placeholder={t.subscriptions?.merchantName || 'Merchant name'}
                autoFocus
              />
            ) : (
              <p className='font-medium'>{pattern.merchantName || 'Unknown'}</p>
            )}
            {pattern.isVariable && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant='outline' className='cursor-help text-xs'>
                      {t.subscriptions?.variable || 'Variable'}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t.subscriptions?.variableTooltip ||
                      'Amount varies between payments'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {stale && pattern.isConfirmed && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant='destructive'
                      className='cursor-help text-xs'
                    >
                      <AlertTriangle className='mr-1 h-3 w-3' />
                      {t.subscriptions?.stale || 'Inactive'}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t.subscriptions?.staleTooltip ||
                      'No transactions in 2+ months. Consider removing.'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className='mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground'>
            {isEditing ? (
              <Select
                value={editFrequency}
                onValueChange={(v) => setEditFrequency(v as PatternType)}
              >
                <SelectTrigger className='h-7 w-32'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='weekly'>
                    {t.subscriptions?.weekly || 'Weekly'}
                  </SelectItem>
                  <SelectItem value='biweekly'>
                    {t.subscriptions?.biweekly || 'Bi-weekly'}
                  </SelectItem>
                  <SelectItem value='monthly'>
                    {t.subscriptions?.monthly || 'Monthly'}
                  </SelectItem>
                  <SelectItem value='quarterly'>
                    {t.subscriptions?.quarterly || 'Quarterly'}
                  </SelectItem>
                  <SelectItem value='yearly'>
                    {t.subscriptions?.yearly || 'Yearly'}
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span>{getFrequencyLabel(pattern.patternType, t)}</span>
            )}
            <span className='text-muted-foreground/60'>•</span>
            {isEditing ? (
              <span className='flex items-center gap-1'>
                <span>{t.subscriptions?.avgAmount || 'Avg.'}:</span>
                <Input
                  type='number'
                  step='0.01'
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className='h-7 w-20'
                />
              </span>
            ) : (
              <span>
                {t.subscriptions?.avgAmount || 'Avg.'}:{' '}
                <Currency amount={Math.abs(pattern.avgAmount)} />
              </span>
            )}
            <span className='text-muted-foreground/60'>•</span>
            <button
              type='button'
              className='cursor-pointer underline-offset-2 hover:underline'
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand?.();
              }}
            >
              {(
                t.subscriptions?.transactionsCount || '{count} transactions'
              ).replace('{count}', String(pattern.transactionCount))}
            </button>
          </div>
          {pattern.nextExpectedDate && (
            <p className='mt-1 text-sm'>
              <span className='text-muted-foreground'>
                {t.subscriptions?.nextPayment || 'Next payment'}:{' '}
              </span>
              <span
                className={cn(
                  'font-medium',
                  overdue && !showAwaiting && 'text-red-600',
                  showAwaiting && 'text-amber-600'
                )}
              >
                {formatDate(pattern.nextExpectedDate)}
                {showAwaiting ? (
                  <span className='ml-1 text-xs'>
                    ({t.subscriptions?.awaitingTransaction || 'awaiting'})
                  </span>
                ) : (
                  overdue && (
                    <span className='ml-1 text-xs'>
                      ({t.subscriptions?.overdue || 'overdue'})
                    </span>
                  )
                )}
              </span>
            </p>
          )}
        </div>

        <div
          className='flex items-center gap-2'
          data-onboarding='subscription-actions'
        >
          <p className='mr-4 text-lg font-semibold'>
            <Currency amount={Math.abs(pattern.lastAmount)} />
          </p>

          {isEditing ? (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='h-8 w-8 rounded-md hover:bg-green-600 hover:text-white'
                      onClick={handleSaveEdit}
                    >
                      <Check className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t.common?.save || 'Save'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='h-8 w-8 rounded-md hover:bg-gray-600 hover:text-white'
                      onClick={handleCancelEdit}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t.common?.cancel || 'Cancel'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          ) : (
            <>
              {!pattern.isConfirmed && onConfirm && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='h-8 w-8 rounded-md hover:bg-green-600 hover:text-white'
                        onClick={onConfirm}
                      >
                        <Check className='h-4 w-4' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t.subscriptions?.confirm || 'Confirm'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {!pattern.isConfirmed && onDismiss && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='h-8 w-8 rounded-md hover:bg-orange-600 hover:text-white'
                        onClick={onDismiss}
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t.subscriptions?.dismiss || 'Dismiss'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {pattern.isConfirmed && onEdit && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='h-8 w-8 rounded-md hover:bg-purple-600 hover:text-white'
                        onClick={() => setIsEditing(true)}
                      >
                        <Pencil className='h-4 w-4' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t.common?.edit || 'Edit'}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {onDelete && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='h-8 w-8 rounded-md hover:bg-red-600 hover:text-white'
                        onClick={onDelete}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t.subscriptions?.delete || 'Delete'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {onToggleExpand && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='h-8 w-8 rounded-md'
                        onClick={onToggleExpand}
                      >
                        {isExpanded ? (
                          <ChevronUp className='h-4 w-4' />
                        ) : (
                          <ChevronDown className='h-4 w-4' />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isExpanded
                        ? t.common?.collapse || 'Collapse'
                        : t.subscriptions?.showTransactions ||
                          'Show transactions'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </>
          )}
        </div>
      </div>

      {/* Expanded transactions table */}
      {isExpanded && (
        <div className='border-t bg-muted/30 p-4'>
          {isLoadingTransactions ? (
            <div className='flex items-center justify-center py-4'>
              <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className='space-y-1'>
              <h4 className='mb-2 text-sm font-medium'>
                {t.subscriptions?.transactionHistory || 'Transaction history'}
              </h4>
              <div className='max-h-64 overflow-y-auto'>
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className='flex items-center justify-between border-b border-dashed py-2 text-sm last:border-0'
                  >
                    <div className='flex items-center gap-3'>
                      <span className='text-muted-foreground'>
                        {formatDate(tx.date)}
                      </span>
                      <span className='max-w-xs truncate text-muted-foreground'>
                        {tx.description}
                      </span>
                    </div>
                    <span className='font-medium'>
                      <Currency amount={tx.amount} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className='text-center text-sm text-muted-foreground'>
              {t.subscriptions?.noTransactionsFound || 'No transactions found'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
