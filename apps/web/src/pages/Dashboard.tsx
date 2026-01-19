import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { format } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import {
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  PiggyBank,
  Users,
  History,
  RefreshCw,
  Check,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from '@/components/dashboard/StatsCard';
import type {
  RecurringStats,
  Account,
  Transaction,
} from '@fluxby/shared';

// Lazy load chart components
const AccountBalanceCards = lazy(() =>
  import('@/components/dashboard/AccountBalanceCards').then((m) => ({
    default: m.AccountBalanceCards,
  }))
);
const SpendingPieChart = lazy(() =>
  import('@/components/dashboard/SpendingPieChart').then((m) => ({
    default: m.SpendingPieChart,
  }))
);
const MonthlyIncomeChart = lazy(() =>
  import('@/components/dashboard/MonthlyIncomeChart').then((m) => ({
    default: m.MonthlyIncomeChart,
  }))
);
const IncomeExpenseComparison = lazy(() =>
  import('@/components/dashboard/IncomeExpenseComparison').then((m) => ({
    default: m.IncomeExpenseComparison,
  }))
);
const DailyExpensesTimeline = lazy(() =>
  import('@/components/dashboard/DailyExpensesTimeline').then((m) => ({
    default: m.DailyExpensesTimeline,
  }))
);

// Loading skeleton for charts
const ChartSkeleton = () => (
  <Card className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
    <CardHeader>
      <Skeleton className='h-6 w-1/3' />
    </CardHeader>
    <CardContent>
      <Skeleton className='h-[300px] w-full' />
    </CardContent>
  </Card>
);

import { PageHeader } from '@/components/layout/PageHeader';
import { formatDateShort } from '@/lib/utils';
import { Currency } from '@/components/ui/currency';
import { api } from '@/lib/api';
import { useFilterParams, useFilters } from '@/contexts/FilterContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';

interface DashboardStats {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  transferToSavings: number;
  transferFromSavings: number;
  netSavingsTransfer: number;
  savingsRate: number;
  transactionCount: number;
  monthlyData: Array<{
    month: string;
    income: number;
    expenses: number;
    balance: number;
  }>;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    color: string;
    amount: number;
    percentage: number;
  }>;
  recentTransactions: Array<{
    id: string;
    date: string;
    merchantName: string | null;
    description: string;
    opposingAccountName: string | null;
    amount: number;
    categoryId: string;
    type: 'income' | 'expense' | 'transfer';
  }>;
}

interface DailyExpense {
  date: string;
  expenses: number;
}

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { activeProfileId } = useProfile();
  useDocumentTitle(t.nav.dashboard);
  const { data: user, isLoading: _isLoadingUser } = useQuery<{
    id: string;
    name: string;
  }>({
    queryKey: ['user'],
    queryFn: () => {
      return api.getUser() as Promise<{ id: string; name: string }>;
    },
  });
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(
    null
  );
  const [pinnedCategoryIndex, setPinnedCategoryIndex] = useState<number | null>(
    null
  );
  const legendContainerRef = useRef<HTMLDivElement>(null);
  const [accountScrollIndex, setAccountScrollIndex] = useState(0);
  const navigate = useNavigate();
  const { startDate, endDate } = useFilterParams();
  const { setDateRange } = useFilters();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard', activeProfileId, startDate, endDate],
    queryFn: () => {
      return api.getDashboardStats(
        startDate,
        endDate,
        undefined,
        []
      ) as Promise<DashboardStats>;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard data doesn't need constant refresh
    enabled: !!activeProfileId,
  });

  // Get recent transactions with date filter applied
  const { data: recentTransactionsData } = useQuery<Transaction[]>({
    queryKey: ['recentTransactions', activeProfileId, startDate, endDate],
    queryFn: async () => {
      const transactions = await api.getTransactions({
        startDate,
        endDate,
        limit: '10',
      });
      return transactions || [];
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!activeProfileId,
  });

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ['accounts', activeProfileId],
    queryFn: () => api.getAccounts() as Promise<Account[]>,
    staleTime: 5 * 60 * 1000, // 5 minutes - accounts rarely change
    enabled: !!activeProfileId,
  });

  const { data: dailyExpenses } = useQuery<DailyExpense[]>({
    queryKey: ['dailyExpenses', activeProfileId, startDate, endDate],
    queryFn: () =>
      api.getDailyExpenses(startDate, endDate) as Promise<DailyExpense[]>,
    enabled: !!activeProfileId && !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000, // 2 minutes - daily data is static for past periods
  });

  const { data: budgets } = useQuery<
    Array<{
      id: string;
      categoryId: string | null;
      amount: number;
      period: 'monthly' | 'yearly';
      startDate: string | null;
      endDate: string | null;
      createdAt: string;
      spent: number;
      remaining: number;
      percentage: number;
      categoryName: string | null;
      categoryColor: string | null;
    }>
  >({
    queryKey: ['budgets', activeProfileId, startDate, endDate],
    queryFn: () => {
      // Pass full date range so budget is scaled by months
      return api.getBudgets(undefined, startDate, endDate) as Promise<
        Array<{
          id: string;
          categoryId: string | null;
          amount: number;
          period: 'monthly' | 'yearly';
          startDate: string | null;
          endDate: string | null;
          createdAt: string;
          spent: number;
          remaining: number;
          percentage: number;
          categoryName: string | null;
          categoryColor: string | null;
        }>
      >;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - budget data doesn't change frequently
    enabled: !!activeProfileId,
  });

  const { data: balanceForecast } = useQuery<{
    currentMonthIncome: number;
    currentMonthExpenses: number;
    expectedIncome: number;
    expectedExpenses: number;
    expectedEndBalance: number;
    confidence: 'low' | 'medium' | 'high';
    basedOnMonths: number;
    isPastPeriod?: boolean;
  } | null>({
    queryKey: ['balanceForecast', activeProfileId, startDate, endDate],
    queryFn: () =>
      api.getBalanceForecast(startDate, endDate) as Promise<{
        currentMonthIncome: number;
        currentMonthExpenses: number;
        expectedIncome: number;
        expectedExpenses: number;
        expectedEndBalance: number;
        confidence: 'low' | 'medium' | 'high';
        basedOnMonths: number;
        isPastPeriod?: boolean;
      } | null>,
    staleTime: 2 * 60 * 1000, // 2 minutes - forecast is expensive to calculate
    enabled: !!activeProfileId,
  });

  const { data: topAccounts } = useQuery<{
    accounts: Array<{
      iban: string;
      name: string;
      description: string | null;
      isInAddressBook: boolean;
      addressBookId: number | null;
      transactionCount: number;
      totalAmount: number;
      netAmount: number;
    }>;
    totalCount: number;
    hasMore: boolean;
  }>({
    queryKey: ['topAccounts', activeProfileId, startDate, endDate],
    queryFn: () =>
      api.getTopAccounts(10, 'all', startDate, endDate) as Promise<{
        accounts: Array<{
          iban: string;
          name: string;
          description: string | null;
          isInAddressBook: boolean;
          addressBookId: number | null;
          transactionCount: number;
          totalAmount: number;
          netAmount: number;
        }>;
        totalCount: number;
        hasMore: boolean;
      }>,
    staleTime: 2 * 60 * 1000, // 2 minutes - top accounts are computed
    enabled: !!activeProfileId,
  });

  const { data: recurringStats } = useQuery<RecurringStats>({
    queryKey: ['recurring-stats', activeProfileId, startDate, endDate],
    queryFn: () =>
      api.getRecurringStats(startDate, endDate) as Promise<RecurringStats>,
    enabled: !!activeProfileId,
    staleTime: 2 * 60 * 1000, // 2 minutes - recurring stats are computed
  });

  // Get min/max dates to determine if there's data in other periods
  const { data: minMaxDates } = useQuery<{
    minDate: string;
    maxDate: string;
  } | null>({
    queryKey: ['min-max-dates', activeProfileId],
    queryFn: () =>
      api.getMinMaxDates() as Promise<{
        minDate: string;
        maxDate: string;
      } | null>,
    enabled: !!activeProfileId,
    staleTime: 5 * 60 * 1000, // 5 minutes - min/max dates change rarely
  });

  const monthlyData = useMemo(
    () => stats?.monthlyData || [],
    [stats?.monthlyData]
  );
  const categoryData = stats?.categoryBreakdown || [];
  const recentTransactions = recentTransactionsData || [];

  // Filter leading zero-expense days from daily chart data
  // to avoid whitespace at the start of the chart
  const dailyData = useMemo(() => {
    const rawData = dailyExpenses || [];
    // Find first day with non-zero expenses
    const firstNonZeroIndex = rawData.findIndex((day) => day.expenses > 0);
    if (firstNonZeroIndex === -1) return rawData;
    return rawData.slice(firstNonZeroIndex);
  }, [dailyExpenses]);

  // Budget calculations
  const totalBudget =
    budgets?.reduce((sum, budget) => sum + budget.amount, 0) || 0;
  const totalSpent =
    budgets?.reduce((sum, budget) => sum + budget.spent, 0) || 0;

  // Calculate burn rate (expected spending based on current selected period)
  const now = useMemo(() => new Date(), []);
  // Determine period start/end from filters (fallback to current month)
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const periodStart = useMemo(
    () => (startDate ? new Date(startDate) : new Date(nowYear, nowMonth, 1)),
    [startDate, nowYear, nowMonth]
  );
  const periodEnd = useMemo(
    () => (endDate ? new Date(endDate) : new Date(nowYear, nowMonth + 1, 0)),
    [endDate, nowYear, nowMonth]
  );

  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays =
    Math.floor((periodEnd.getTime() - periodStart.getTime()) / msPerDay) + 1;
  let daysPassed = 0;
  if (now < periodStart) daysPassed = 0;
  else if (now > periodEnd) daysPassed = totalDays;
  else
    daysPassed =
      Math.floor((now.getTime() - periodStart.getTime()) / msPerDay) + 1;

  const periodProgress = totalDays > 0 ? daysPassed / totalDays : 0;
  const expectedSpent = totalBudget * periodProgress;
  const _burnRate = expectedSpent > 0 ? (totalSpent / expectedSpent) * 100 : 0;

  // Create period label for cards
  const locale = language === 'nl' ? nl : enUS;
  const periodLabel = useMemo(() => {
    const startMonth = format(periodStart, 'MMM', { locale });
    const endMonth = format(periodEnd, 'MMM', { locale });
    const startYear = periodStart.getFullYear();
    const endYear = periodEnd.getFullYear();

    // Same month and year
    if (
      periodStart.getMonth() === periodEnd.getMonth() &&
      startYear === endYear
    ) {
      return format(periodStart, 'MMMM yyyy', { locale });
    }
    // Same year, different months
    if (startYear === endYear) {
      return `${startMonth} - ${endMonth} ${startYear}`;
    }
    // Different years
    return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
  }, [periodStart, periodEnd, locale]);

  // Use balance forecast from API
  const hasEnoughData =
    balanceForecast !== null && balanceForecast !== undefined;

  // Determine suggested period based on available data (for empty states)
  const getSuggestedPeriod = (): {
    start: Date;
    end: Date;
    label: string;
  } | null => {
    if (!minMaxDates) return null;

    const maxDate = new Date(minMaxDates.maxDate);
    const locale = language === 'nl' ? nl : enUS;

    // Suggest the month containing the most recent transaction
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

  // Check if we're already viewing the suggested period
  const isViewingSuggestedPeriod = useMemo(() => {
    if (!suggestedPeriod || !startDate || !endDate) return false;

    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);

    return (
      currentStart.getFullYear() === suggestedPeriod.start.getFullYear() &&
      currentStart.getMonth() === suggestedPeriod.start.getMonth() &&
      currentStart.getDate() === suggestedPeriod.start.getDate() &&
      currentEnd.getFullYear() === suggestedPeriod.end.getFullYear() &&
      currentEnd.getMonth() === suggestedPeriod.end.getMonth() &&
      currentEnd.getDate() === suggestedPeriod.end.getDate()
    );
  }, [suggestedPeriod, startDate, endDate]);

  // Handler for jumping to period with data
  const handleJumpToPeriod = () => {
    if (suggestedPeriod) {
      setDateRange(suggestedPeriod.start, suggestedPeriod.end);
    }
  };

  const dailyScrollRef = useRef<HTMLDivElement>(null);
  const monthlyIncomeScrollRef = useRef<HTMLDivElement>(null);
  const monthlyIncomeInnerRef = useRef<HTMLDivElement>(null);
  const monthlyComparisonScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll daily chart container to the end when data changes
    if (dailyScrollRef.current) {
      const el = dailyScrollRef.current;
      // Use setTimeout + requestAnimationFrame to ensure chart is fully rendered
      const scrollToEnd = () => {
        requestAnimationFrame(() => {
          el.scrollLeft = el.scrollWidth - el.clientWidth;
        });
      };
      // Multiple attempts to handle slow chart rendering
      setTimeout(scrollToEnd, 100);
      setTimeout(scrollToEnd, 300);
      setTimeout(scrollToEnd, 500);
    }
  }, [dailyExpenses]);

  useEffect(() => {
    // Auto-scroll monthly income chart to the end when data changes
    // Ensure 12 entries fit before scrolling: set inner width only when >12
    if (monthlyIncomeInnerRef.current) {
      const inner = monthlyIncomeInnerRef.current;
      const months = monthlyData.length;
      if (months <= 12) {
        inner.style.width = '100%';
      } else {
        const monthWidth = 80; // px per month when scrolling
        inner.style.width = `${months * monthWidth}px`;
      }
    }
    if (monthlyIncomeScrollRef.current) {
      const el = monthlyIncomeScrollRef.current;
      // Use setTimeout to ensure DOM has updated after inner width change
      setTimeout(() => {
        el.scrollLeft = el.scrollWidth - el.clientWidth;
      }, 100);
    }
  }, [monthlyData]);

  useEffect(() => {
    // Auto-scroll monthly comparison chart (Income vs Expenses) to the end when data changes
    if (monthlyComparisonScrollRef.current) {
      const el = monthlyComparisonScrollRef.current;
      // small timeout ensures inner width/layout has settled (e.g., when font/rendering happens)
      setTimeout(() => {
        el.scrollLeft = el.scrollWidth - el.clientWidth;
      }, 100);
    }
  }, [monthlyData]);

  // Get accounts by type
  const _checkingAccount = accounts?.find((a) => a.type === 'checking');
  const _savingsAccount = accounts?.find((a) => a.type === 'savings');

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t.dashboard.greetings.morning;
    if (hour >= 12 && hour < 18) return t.dashboard.greetings.afternoon;
    if (hour >= 18 && hour < 23) return t.dashboard.greetings.evening;
    return t.dashboard.greetings.night;
  };

  // Show skeleton only for initial load, not when switching dates
  const isInitialLoading = isLoading && !stats;

  if (isInitialLoading) {
    return (
      <div className='space-y-0 sm:space-y-6'>
        <PageHeader
          title={
            <>
              {getGreeting()}{' '}
              {user?.name ?? <Skeleton className='inline-block h-6 w-24' />}{' '}
              <span aria-hidden>👋</span>
            </>
          }
          subtitle={t.dashboard.subtitle}
          dataOnboarding='dashboard-greeting'
          actions={
            <Suspense fallback={<Skeleton className='h-12 w-48' />}>
              <AccountBalanceCards
                accounts={accounts || []}
                accountScrollIndex={accountScrollIndex}
                setAccountScrollIndex={setAccountScrollIndex}
              />
            </Suspense>
          }
        />
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className='space-y-0 sm:space-y-6'>
      <PageHeader
        title={
          <>
            {getGreeting()} {user?.name ?? ''} <span aria-hidden>👋</span>
          </>
        }
        subtitle={t.dashboard.subtitle}
        dataOnboarding='dashboard-greeting'
        actions={
          <Suspense fallback={<Skeleton className='h-12 w-48' />}>
            <AccountBalanceCards
              accounts={accounts || []}
              accountScrollIndex={accountScrollIndex}
              setAccountScrollIndex={setAccountScrollIndex}
            />
          </Suspense>
        }
      />

      {/* Stats Cards */}
      <div
        className='grid grid-cols-2 gap-px bg-border sm:gap-4 sm:bg-transparent lg:grid-cols-4'
        data-onboarding='dashboard-stats'
      >
        <div data-onboarding='stat-income' className='h-full'>
          <StatsCard
            title={t.dashboard.income}
            value={<Currency amount={stats?.totalIncome || 0} />}
            icon={ArrowUpRight}
            iconColor='text-emerald-900 dark:text-emerald-400'
            trend={0}
          />
        </div>
        <div data-onboarding='stat-expenses' className='h-full'>
          <StatsCard
            title={t.dashboard.expenses}
            value={<Currency amount={stats?.totalExpenses || 0} />}
            icon={ArrowDownRight}
            iconColor='text-rose-900 dark:text-rose-400'
            trend={0}
          />
        </div>
        <div data-onboarding='stat-savings' className='h-full'>
          <StatsCard
            title={t.dashboard.toSavings}
            value={<Currency amount={stats?.netSavingsTransfer || 0} />}
            icon={PiggyBank}
            iconColor='text-blue-900 dark:text-blue-400'
            trend={0}
            trendLabel={
              <>
                +<Currency amount={stats?.transferToSavings || 0} /> / -
                <Currency amount={stats?.transferFromSavings || 0} />
              </>
            }
          />
        </div>
        <div data-onboarding='stat-net-result' className='h-full'>
          <StatsCard
            title={t.dashboard.netResult}
            value={<Currency amount={stats?.totalBalance || 0} />}
            icon={Wallet}
            iconColor={
              stats?.totalBalance === 0 || !stats?.totalBalance
                ? 'text-gray-400'
                : stats.totalBalance > 0
                  ? 'text-emerald-900 dark:text-emerald-400'
                  : 'text-rose-900 dark:text-rose-400'
            }
            valueColor={
              stats?.totalBalance === 0 || !stats?.totalBalance
                ? 'text-gray-900 dark:text-gray-100'
                : stats.totalBalance > 0
                  ? 'text-emerald-900 dark:text-emerald-400'
                  : 'text-rose-900 dark:text-rose-400'
            }
          />
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-2'>
        <Suspense fallback={<ChartSkeleton />}>
          <MonthlyIncomeChart
            monthlyData={monthlyData}
            monthlyIncomeScrollRef={monthlyIncomeScrollRef}
            monthlyIncomeInnerRef={monthlyIncomeInnerRef}
            t={t}
            navigate={navigate}
            suggestedPeriod={suggestedPeriod}
            isViewingSuggestedPeriod={isViewingSuggestedPeriod}
            handleJumpToPeriod={handleJumpToPeriod}
          />
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <SpendingPieChart
            categoryData={categoryData}
            activeCategoryIndex={activeCategoryIndex}
            setActiveCategoryIndex={setActiveCategoryIndex}
            pinnedCategoryIndex={pinnedCategoryIndex}
            setPinnedCategoryIndex={setPinnedCategoryIndex}
            legendContainerRef={legendContainerRef}
            t={t}
            navigate={navigate}
            suggestedPeriod={suggestedPeriod}
            isViewingSuggestedPeriod={isViewingSuggestedPeriod}
            handleJumpToPeriod={handleJumpToPeriod}
          />
        </Suspense>
      </div>

      {/* Income vs Expenses - Full Width */}
      <Suspense fallback={<ChartSkeleton />}>
        <IncomeExpenseComparison
          monthlyData={monthlyData}
          monthlyComparisonScrollRef={monthlyComparisonScrollRef}
          t={t}
          navigate={navigate}
          suggestedPeriod={suggestedPeriod}
          isViewingSuggestedPeriod={isViewingSuggestedPeriod}
          handleJumpToPeriod={handleJumpToPeriod}
        />
      </Suspense>

      {/* Daily Expenses Timeline */}
      <Suspense fallback={<ChartSkeleton />}>
        <DailyExpensesTimeline
          dailyData={dailyData}
          dailyScrollRef={dailyScrollRef}
          t={t}
          language={language}
          navigate={navigate}
          suggestedPeriod={suggestedPeriod}
          isViewingSuggestedPeriod={isViewingSuggestedPeriod}
          handleJumpToPeriod={handleJumpToPeriod}
        />
      </Suspense>

      {/* Budget, Balance Forecast, and Subscriptions Widgets */}
      <div>
        <div className='grid gap-px bg-border sm:gap-4 sm:bg-transparent md:grid-cols-2 lg:grid-cols-3'>
          {/* Budget Widget */}
          <Card
            className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
            data-onboarding='budget-progress'
          >
            <CardHeader>
              <CardTitle className='flex items-center justify-between text-base sm:text-lg'>
                <span>{t.dashboard.budget}</span>
                <span className='text-sm font-normal text-muted-foreground'>
                  {t.dashboard.daysProgress
                    .replace('{passed}', daysPassed.toString())
                    .replace('{total}', totalDays.toString())}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalBudget > 0 ? (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>
                      {t.dashboard.totalBudget}
                    </span>
                    <span className='font-semibold'>
                      <Currency amount={totalBudget} />
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>
                      {t.dashboard.spent}
                    </span>
                    <span className='font-semibold text-rose-600'>
                      <Currency amount={totalSpent} />
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>
                      {t.budgets.remaining}
                    </span>
                    <span
                      className={`font-semibold ${
                        totalBudget - totalSpent >= 0
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      <Currency amount={totalBudget - totalSpent} />
                    </span>
                  </div>
                  {/* Progress bar at the bottom */}
                  <div className='space-y-2 border-t pt-2'>
                    {(() => {
                      const spentPercentage =
                        totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
                      const isOverBudget = spentPercentage > 100;
                      const roundedPercentage = Math.round(spentPercentage);

                      return (
                        <>
                          <div className='flex justify-between text-sm'>
                            <span>{t.dashboard.spent}</span>
                            <span
                              className={
                                isOverBudget
                                  ? 'font-semibold text-rose-600'
                                  : 'text-emerald-600'
                              }
                            >
                              {isOverBudget
                                ? t.dashboard.overBudget
                                : t.dashboard.underBudget}
                            </span>
                          </div>
                          {/* Progress bar container with 100% marker */}
                          <div className='relative'>
                            <div className='h-4 w-full overflow-hidden rounded-full bg-muted'>
                              {isOverBudget ? (
                                // Over budget: show green up to 100%, then red for excess
                                <div className='relative flex h-full'>
                                  <div
                                    className='h-full bg-emerald-500'
                                    style={{
                                      width: `${(100 / spentPercentage) * 100}%`,
                                    }}
                                  />
                                  <div
                                    className='flex h-full items-center justify-end bg-rose-500 pr-1'
                                    style={{
                                      width: `${
                                        ((spentPercentage - 100) /
                                          spentPercentage) *
                                        100
                                      }%`,
                                    }}
                                  >
                                    <span className='text-xs font-semibold text-white'>
                                      {roundedPercentage}%
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                // Under budget: green bar with percentage inside or outside
                                <div className='relative h-full'>
                                  <div
                                    className='flex h-full items-center justify-end rounded-full bg-emerald-500 transition-all duration-300'
                                    style={{ width: `${spentPercentage}%` }}
                                  >
                                    {spentPercentage >= 10 && (
                                      <span className='pr-1 text-xs font-semibold text-white'>
                                        {roundedPercentage}%
                                      </span>
                                    )}
                                  </div>
                                  {spentPercentage < 10 &&
                                    spentPercentage > 0 && (
                                      <span
                                        className='absolute top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground'
                                        style={{
                                          left: `${Math.max(
                                            spentPercentage + 2,
                                            5
                                          )}%`,
                                        }}
                                      >
                                        {roundedPercentage}%
                                      </span>
                                    )}
                                </div>
                              )}
                            </div>
                            {/* 100% marker line when over budget */}
                            {isOverBudget && (
                              <div
                                className='absolute top-0 h-4 w-0.5 bg-foreground/70'
                                style={{
                                  left: `${(100 / spentPercentage) * 100}%`,
                                }}
                              />
                            )}
                          </div>
                          <div className='flex justify-between text-xs text-muted-foreground'>
                            <span>0%</span>
                            {!isOverBudget && <span>100%</span>}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className='flex h-[200px] flex-col items-center justify-center text-center'>
                  <PiggyBank className='mb-4 h-12 w-12 text-muted-foreground/50' />
                  <p className='text-muted-foreground'>
                    {t.dashboard.noBudgets}
                  </p>
                  <button
                    onClick={() => navigate('/budgets/')}
                    className='mt-3 text-sm text-primary hover:underline'
                  >
                    {t.dashboard.goToBudgets}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Balance Forecast Widget */}
          <Card
            className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
            data-onboarding='balance-forecast'
          >
            <CardHeader>
              <CardTitle className='flex items-center justify-between text-base sm:text-lg'>
                <span>
                  {hasEnoughData && balanceForecast?.isPastPeriod
                    ? t.dashboard.periodSummary
                    : t.dashboard.forecast}
                </span>
                <span className='text-sm font-normal text-muted-foreground'>
                  {periodLabel}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasEnoughData && balanceForecast?.isPastPeriod ? (
                // Past period - show totals
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>
                      {t.dashboard.totalIncome}
                    </span>
                    <span className='font-semibold text-emerald-600'>
                      <Currency amount={balanceForecast.currentMonthIncome} />
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>
                      {t.dashboard.totalExpenses}
                    </span>
                    <span className='font-semibold text-rose-600'>
                      <Currency amount={balanceForecast.currentMonthExpenses} />
                    </span>
                  </div>
                  <div className='flex items-center justify-between border-t pt-2'>
                    <span className='text-sm text-muted-foreground'>
                      {t.dashboard.netResult}
                    </span>
                    <span
                      className={`font-semibold ${
                        balanceForecast.expectedEndBalance >= 0
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      <Currency amount={balanceForecast.expectedEndBalance} />
                    </span>
                  </div>
                </div>
              ) : hasEnoughData && balanceForecast ? (
                // Current/future period - show forecast
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>
                      {t.dashboard.currentIncome}
                    </span>
                    <span className='font-semibold text-emerald-600'>
                      <Currency amount={balanceForecast.currentMonthIncome} />
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>
                      {t.dashboard.expectedIncome}
                    </span>
                    <span className='font-semibold text-emerald-600'>
                      <Currency amount={balanceForecast.expectedIncome} />
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>
                      {t.dashboard.currentExpenses}
                    </span>
                    <span className='font-semibold text-rose-600'>
                      <Currency amount={balanceForecast.currentMonthExpenses} />
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>
                      {t.dashboard.expectedExpenses}
                    </span>
                    <span className='font-semibold text-rose-600'>
                      <Currency amount={balanceForecast.expectedExpenses} />
                    </span>
                  </div>
                  <div className='flex items-center justify-between border-t pt-2'>
                    <span className='text-sm text-muted-foreground'>
                      {t.dashboard.expectedResult}
                    </span>
                    <span
                      className={`font-semibold ${
                        balanceForecast.expectedEndBalance >= 0
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      <Currency amount={balanceForecast.expectedEndBalance} />
                    </span>
                  </div>
                </div>
              ) : recentTransactions.length > 0 ? (
                // Has transactions but not enough historical data for forecast
                <div className='flex flex-col items-center justify-center py-8 text-center'>
                  <TrendingUp className='mb-4 h-12 w-12 text-muted-foreground/50' />
                  <p className='text-muted-foreground'>
                    {t.dashboard.insufficientData}
                  </p>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {t.dashboard.needMoreHistory}
                  </p>
                </div>
              ) : (
                // No transactions at all
                <div className='flex flex-col items-center justify-center py-8 text-center'>
                  <TrendingUp className='mb-4 h-12 w-12 text-muted-foreground/50' />
                  <p className='text-muted-foreground'>
                    {t.dashboard.noForecast}
                  </p>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {t.dashboard.importTransactions}
                  </p>
                  <div className='mt-3 flex flex-wrap items-center justify-center gap-x-2'>
                    <button
                      onClick={() => navigate('/import/')}
                      className='text-sm text-primary hover:underline'
                    >
                      {t.dashboard.goToImport}
                    </button>
                    {suggestedPeriod && !isViewingSuggestedPeriod && (
                      <>
                        <span className='text-muted-foreground'>&middot;</span>
                        <button
                          onClick={handleJumpToPeriod}
                          className='text-sm text-primary hover:underline'
                        >
                          {(
                            t.dashboard?.jumpToPeriod || 'Jump to {period}'
                          ).replace('{period}', suggestedPeriod.label)}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscriptions Widget */}
          <Card
            className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
            data-onboarding='subscriptions-summary'
          >
            <CardHeader>
              <CardTitle className='flex items-center justify-between text-base sm:text-lg'>
                <span>{t.subscriptions?.title || 'Subscriptions'}</span>
                <span className='text-sm font-normal text-muted-foreground'>
                  {periodLabel}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recurringStats &&
              (recurringStats.activeSubscriptions > 0 ||
                recurringStats.pendingConfirmation > 0) ? (
                <div className='space-y-4'>
                  {recurringStats.expectedPeriodExpenses !== undefined &&
                    recurringStats.expectedPeriodExpenses > 0 && (
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-muted-foreground'>
                          {t.subscriptions?.expectedThisPeriod ||
                            'Expected this period'}
                        </span>
                        <span className='font-semibold'>
                          <Currency
                            amount={recurringStats.expectedPeriodExpenses}
                          />
                        </span>
                      </div>
                    )}
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>
                      {t.subscriptions?.totalMonthlySpend ||
                        'Total monthly spend'}
                    </span>
                    <span className='font-semibold text-rose-600'>
                      <Currency
                        amount={Math.abs(recurringStats.totalMonthlySpend)}
                      />
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Check className='h-4 w-4 text-emerald-500' />
                      <span className='text-sm text-muted-foreground'>
                        {t.subscriptions?.confirmedSubscriptions || 'Confirmed'}
                      </span>
                    </div>
                    <span className='font-semibold'>
                      {recurringStats.confirmedSubscriptions}
                    </span>
                  </div>
                  {recurringStats.pendingConfirmation > 0 && (
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <Sparkles className='h-4 w-4 text-purple-500' />
                        <span className='text-sm text-muted-foreground'>
                          {t.subscriptions?.suggestedSubscriptions ||
                            'Suggested'}
                        </span>
                      </div>
                      <span className='font-semibold text-purple-600'>
                        {recurringStats.pendingConfirmation}
                      </span>
                    </div>
                  )}
                  <div className='border-t pt-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => navigate('/subscriptions/')}
                      className='w-full'
                    >
                      {t.dashboard?.viewSubscriptions || 'View subscriptions'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-8 text-center'>
                  <RefreshCw className='mb-4 h-12 w-12 text-muted-foreground/50' />
                  <p className='text-muted-foreground'>
                    {t.dashboard?.noSubscriptions ||
                      'No subscriptions detected yet'}
                  </p>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {t.dashboard?.detectSubscriptions ||
                      'Detect recurring payments automatically'}
                  </p>
                  <button
                    onClick={() => navigate('/subscriptions/')}
                    className='mt-3 text-sm text-primary hover:underline'
                  >
                    {t.dashboard?.goToSubscriptions || 'Go to subscriptions'}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions & Top Accounts - Side by side on large screens */}
      <div>
        <div className='grid grid-cols-1 gap-px bg-border sm:gap-6 sm:bg-transparent lg:grid-cols-2'>
          {/* Recent Transactions */}
          <Card
            className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
            data-onboarding='recent-transactions'
          >
            <CardHeader>
              <CardTitle className='truncate pb-1 text-base sm:text-lg'>
                Recente transacties
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className='space-y-4'>
                  {recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className='flex items-center justify-between gap-3 border-b py-2 last:border-0'
                    >
                      <div className='flex min-w-0 flex-1 items-center gap-3'>
                        <div
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                            tx.type === 'transfer'
                              ? 'bg-blue-100'
                              : tx.amount > 0
                                ? 'bg-emerald-100'
                                : 'bg-rose-100'
                          }`}
                        >
                          {tx.type === 'transfer' ? (
                            <ArrowLeftRight className='h-5 w-5 text-blue-600' />
                          ) : tx.amount > 0 ? (
                            <ArrowUpRight className='h-5 w-5 text-emerald-600' />
                          ) : (
                            <ArrowDownRight className='h-5 w-5 text-rose-600' />
                          )}
                        </div>
                        <div className='min-w-0 flex-1'>
                          <p className='truncate font-medium'>
                            {tx.merchantName ||
                              tx.opposingAccountName ||
                              tx.description ||
                              'Onbekend'}
                          </p>
                          <p className='text-sm text-muted-foreground'>
                            {formatDateShort(tx.date)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`flex-shrink-0 font-semibold ${
                          tx.type === 'transfer'
                            ? 'text-blue-600'
                            : tx.amount > 0
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                        }`}
                      >
                        <Currency amount={tx.amount} />
                      </span>
                    </div>
                  ))}
                  <div className='pt-4'>
                    <Button
                      variant='outline'
                      onClick={() => navigate('/transactions/')}
                    >
                      Alle transacties
                    </Button>
                  </div>
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-8 text-center'>
                  <History className='mb-4 h-12 w-12 text-muted-foreground/50' />
                  <p className='text-muted-foreground'>
                    {t.dashboard.noTransactions}
                  </p>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {t.dashboard.importTransactions}
                  </p>
                  <div className='mt-3 flex flex-wrap items-center justify-center gap-x-2'>
                    <button
                      onClick={() => navigate('/import/')}
                      className='text-sm text-primary hover:underline'
                    >
                      {t.dashboard.goToImport}
                    </button>
                    {suggestedPeriod && !isViewingSuggestedPeriod && (
                      <>
                        <span className='text-muted-foreground'>&middot;</span>
                        <button
                          onClick={handleJumpToPeriod}
                          className='text-sm text-primary hover:underline'
                        >
                          {(
                            t.dashboard?.jumpToPeriod || 'Jump to {period}'
                          ).replace('{period}', suggestedPeriod.label)}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Accounts Widget */}
          <Card
            className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
            data-onboarding='top-accounts'
          >
            <CardHeader>
              <CardTitle className='truncate pb-1 text-base sm:text-lg'>
                {t.dashboard?.topAccounts || 'Top tegenrekeningen'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topAccounts && topAccounts.accounts.length > 0 ? (
                <div className='space-y-4'>
                  {topAccounts.accounts.map((account) => (
                    <div
                      key={`${account.iban}-${account.name}`}
                      className='flex items-center justify-between gap-3 border-b py-2 last:border-0'
                    >
                      <div className='flex min-w-0 flex-1 items-center gap-3'>
                        <div
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                            account.netAmount > 0
                              ? 'bg-emerald-100'
                              : 'bg-rose-100'
                          }`}
                        >
                          {account.netAmount > 0 ? (
                            <ArrowUpRight className='h-5 w-5 text-emerald-600' />
                          ) : (
                            <ArrowDownRight className='h-5 w-5 text-rose-600' />
                          )}
                        </div>
                        <div className='min-w-0 flex-1'>
                          <p className='truncate font-medium'>{account.name}</p>
                          <p className='text-sm text-muted-foreground'>
                            {account.transactionCount} transacties
                          </p>
                        </div>
                      </div>
                      <span
                        className={`flex-shrink-0 font-semibold ${
                          account.netAmount > 0
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        <Currency amount={account.netAmount} />
                      </span>
                    </div>
                  ))}
                  <div className='pt-4'>
                    <Button
                      variant='outline'
                      onClick={() => navigate('/addressbook/')}
                    >
                      {t.dashboard?.viewAddressBook || 'Bekijk adresboek'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className='flex h-[200px] flex-col items-center justify-center text-center'>
                  <Users className='mb-4 h-12 w-12 text-muted-foreground/50' />
                  <p className='text-muted-foreground'>
                    {t.dashboard?.noTopAccounts ||
                      'Nog geen tegenrekeningen bekend'}
                  </p>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {t.dashboard?.addContactsToAddressBook ||
                      'Voeg contacten toe aan je adresboek'}
                  </p>
                  <div className='mt-3 flex flex-wrap items-center justify-center gap-x-2'>
                    <button
                      onClick={() => navigate('/addressbook/')}
                      className='text-sm text-primary hover:underline'
                    >
                      {t.dashboard?.goToAddressBook || 'Ga naar adresboek'}
                    </button>
                    {suggestedPeriod && !isViewingSuggestedPeriod && (
                      <>
                        <span className='text-muted-foreground'>&middot;</span>
                        <button
                          onClick={handleJumpToPeriod}
                          className='text-sm text-primary hover:underline'
                        >
                          {(
                            t.dashboard?.jumpToPeriod || 'Jump to {period}'
                          ).replace('{period}', suggestedPeriod.label)}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className='p-6'>
              <Skeleton className='mb-2 h-4 w-24' />
              <Skeleton className='h-8 w-32' />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardContent className='p-6'>
            <Skeleton className='h-32' />
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-6'>
            <Skeleton className='h-32' />
          </CardContent>
        </Card>
      </div>
      <div className='grid gap-6 lg:grid-cols-2'>
        <Card>
          <CardContent className='p-6'>
            <Skeleton className='h-[300px]' />
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-6'>
            <Skeleton className='h-[300px]' />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
