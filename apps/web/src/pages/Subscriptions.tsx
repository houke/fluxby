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
} from 'lucide-react';
import { useState, useMemo } from 'react';
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
  });

  const { data: stats, isLoading: loadingStats } = useQuery<RecurringStats>({
    queryKey: ['recurring-stats', activeProfileId],
    queryFn: () => api.getRecurringStats(),
  });

  const { data: calendarEntries } = useQuery<RecurringCalendarEntry[]>({
    queryKey: ['recurring-calendar', activeProfileId, startOfMonth, endOfMonth],
    queryFn: () => api.getRecurringCalendar(startOfMonth, endOfMonth),
    enabled: view === 'calendar',
  });

  // Mutations
  const detectMutation = useMutation({
    mutationFn: api.detectRecurringPatterns,
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['recurring-patterns', activeProfileId],
      });
      queryClient.invalidateQueries({
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

  // Handlers
  const handleConfirm = (id: string) => {
    confirmMutation.mutate(id);
  };

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

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: t.subscriptions?.delete || 'Delete',
      message:
        t.subscriptions?.dismissPatternDescription ||
        'Are you sure you want to delete this subscription?',
      variant: 'danger',
    });
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  // Computed values
  const pendingPatterns = useMemo(() => {
    return patterns?.filter((p) => !p.isConfirmed && p.isActive) || [];
  }, [patterns]);

  const confirmedPatterns = useMemo(() => {
    return patterns?.filter((p) => p.isConfirmed && p.isActive) || [];
  }, [patterns]);

  // Check for alerts (price increases, missed payments only - not new detections)
  const alerts = useMemo(() => {
    if (!patterns) return [];
    const alertList: Array<{
      id: string;
      type: 'price_increase' | 'missed_payment';
      pattern: RecurringPattern;
      message: string;
    }> = [];

    const today = new Date().toISOString().split('T')[0];

    for (const pattern of patterns) {
      // Only check confirmed subscriptions for alerts
      if (!pattern.isConfirmed) continue;

      // Price increase alert (>5% difference)
      if (pattern.lastAmount > pattern.avgAmount * 1.05) {
        alertList.push({
          id: `price-${pattern.id}`,
          type: 'price_increase',
          pattern,
          message:
            t.subscriptions?.priceIncreaseDescription ||
            'Latest amount is higher than average',
        });
      }

      // Missed payment alert (expected date passed)
      if (pattern.nextExpectedDate && pattern.nextExpectedDate < today) {
        alertList.push({
          id: `missed-${pattern.id}`,
          type: 'missed_payment',
          pattern,
          message:
            t.subscriptions?.missedPaymentDescription ||
            'Expected date has passed',
        });
      }
    }

    return alertList;
  }, [patterns, t]);

  const isLoading = loadingPatterns || loadingStats;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>
            {t.subscriptions?.title || 'Subscriptions'}
          </h1>
          <p className='text-muted-foreground'>
            {t.subscriptions?.subtitle || 'Manage your recurring payments'}
          </p>
        </div>
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
                    variant={view === 'list' ? 'secondary' : 'ghost'}
                    size='sm'
                    className='rounded-r-none'
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
                    variant={view === 'calendar' ? 'secondary' : 'ghost'}
                    size='sm'
                    className='rounded-l-none'
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
      </div>

      {/* Stats Cards */}
      <div
        className='grid gap-4 md:grid-cols-4'
        data-onboarding='subscriptions-stats'
      >
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              {t.subscriptions?.totalMonthlySpend || 'Total monthly spend'}
            </CardTitle>
            <CreditCard className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className='h-8 w-24' />
            ) : (
              <div className='text-2xl font-bold'>
                <Currency amount={stats?.totalMonthlySpend || 0} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              {t.subscriptions?.activeSubscriptions || 'Active subscriptions'}
            </CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className='h-8 w-16' />
            ) : (
              <div className='text-2xl font-bold'>
                {stats?.activeSubscriptions || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              {t.subscriptions?.confirmedSubscriptions || 'Confirmed'}
            </CardTitle>
            <Check className='h-4 w-4 text-green-500' />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className='h-8 w-16' />
            ) : (
              <div className='text-2xl font-bold'>
                {stats?.confirmedSubscriptions || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              {t.subscriptions?.pendingConfirmation || 'Pending confirmation'}
            </CardTitle>
            <Sparkles className='h-4 w-4 text-purple-500' />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className='h-8 w-16' />
            ) : (
              <div className='text-2xl font-bold'>
                {stats?.pendingConfirmation || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts - Price increases and missed payments only */}
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
                    {alert.type === 'price_increase' && (
                      <TrendingUp className='h-5 w-5 text-orange-500' />
                    )}
                    {alert.type === 'missed_payment' && (
                      <Clock className='h-5 w-5 text-red-500' />
                    )}
                    <div>
                      <p className='font-medium'>
                        {alert.pattern.merchantName || 'Unknown'}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        {alert.message}
                      </p>
                    </div>
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
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <Calendar className='mb-4 h-12 w-12 text-muted-foreground' />
            <h3 className='mb-2 text-lg font-semibold'>
              {t.subscriptions?.noSubscriptions ||
                'No subscriptions detected yet'}
            </h3>
            <p className='mb-4 text-center text-muted-foreground'>
              {t.subscriptions?.noSubscriptionsDescription ||
                'Import transactions to automatically detect recurring payments'}
            </p>
            <Button onClick={() => detectMutation.mutate()}>
              <RefreshCw className='mr-2 h-4 w-4' />
              {t.subscriptions?.detectPatterns || 'Detect patterns'}
            </Button>
          </CardContent>
        </Card>
      ) : view === 'list' ? (
        <div className='space-y-6'>
          {/* Suggested subscriptions - single card for all pending patterns */}
          {pendingPatterns.length > 0 && (
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
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confirmed subscriptions */}
          {confirmedPatterns.length > 0 && (
            <Card data-onboarding='subscriptions-confirmed'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Check className='h-5 w-5 text-green-500' />
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
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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
                      {entry.isConfirmed && (
                        <Badge variant='secondary' className='text-xs'>
                          <Check className='mr-1 h-3 w-3' />
                          {t.subscriptions?.confirm || 'Confirmed'}
                        </Badge>
                      )}
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

// Subscription card component
function SubscriptionCard({
  pattern,
  t,
  onConfirm,
  onDismiss,
  onDelete,
}: {
  pattern: RecurringPattern;
  t: ReturnType<typeof useLanguage>['t'];
  onConfirm?: () => void;
  onDismiss?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className='flex items-center justify-between rounded-lg border p-4'>
      <div className='flex-1'>
        <div className='flex items-center gap-2'>
          <p className='font-medium'>{pattern.merchantName || 'Unknown'}</p>
          {pattern.isVariable && (
            <Badge variant='outline' className='text-xs'>
              {t.subscriptions?.variable || 'Variable'}
            </Badge>
          )}
          {pattern.isConfirmed && (
            <Badge variant='secondary' className='text-xs'>
              <Check className='mr-1 h-3 w-3' />
            </Badge>
          )}
        </div>
        <div className='mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground'>
          <span>{getFrequencyLabel(pattern.patternType, t)}</span>
          <span>•</span>
          <span>
            {t.subscriptions?.avgAmount || 'Avg.'}:{' '}
            <Currency amount={pattern.avgAmount} />
          </span>
          <span>•</span>
          <span>
            {(
              t.subscriptions?.transactionsCount || '{count} transactions'
            ).replace('{count}', String(pattern.transactionCount))}
          </span>
        </div>
        {pattern.nextExpectedDate && (
          <p className='mt-1 text-sm'>
            <span className='text-muted-foreground'>
              {t.subscriptions?.nextPayment || 'Next payment'}:{' '}
            </span>
            <span className='font-medium'>
              {formatDate(pattern.nextExpectedDate)}
            </span>
          </p>
        )}
      </div>

      <div
        className='flex items-center gap-2'
        data-onboarding='subscription-actions'
      >
        <p className='mr-4 text-lg font-semibold'>
          <Currency amount={pattern.lastAmount} />
        </p>

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
      </div>
    </div>
  );
}
