import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  PiggyBank,
  CreditCard,
  Users,
  ChevronRight,
  ChevronLeft,
  History,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { api } from '@/lib/api';
import { useFilterParams, useFilters } from '@/contexts/FilterContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  CartesianGrid,
  Sector,
} from 'recharts';
import type { PieSectorDataItem } from 'recharts/types/polar/Pie';

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

interface Account {
  id: string;
  iban: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  bank: string;
  currentBalance: number;
  balance?: number;
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
  const { resetFilters } = useFilters();

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
  });

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ['accounts', activeProfileId],
    queryFn: () => api.getAccounts() as Promise<Account[]>,
  });

  const { data: dailyExpenses } = useQuery<DailyExpense[]>({
    queryKey: ['dailyExpenses', activeProfileId, startDate, endDate],
    queryFn: () =>
      api.getDailyExpenses(startDate, endDate) as Promise<DailyExpense[]>,
    enabled: !!startDate && !!endDate,
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
  });

  const monthlyData = useMemo(
    () => stats?.monthlyData || [],
    [stats?.monthlyData]
  );
  const categoryData = stats?.categoryBreakdown || [];
  const recentTransactions = stats?.recentTransactions || [];
  const dailyData = dailyExpenses || [];

  // Budget calculations
  const totalBudget =
    budgets?.reduce((sum, budget) => sum + budget.amount, 0) || 0;
  const totalSpent =
    budgets?.reduce((sum, budget) => sum + budget.spent, 0) || 0;

  // Calculate burn rate (expected spending based on current selected period)
  const now = new Date();
  // Determine period start/end from filters (fallback to current month)
  const periodStart = startDate
    ? new Date(startDate)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = endDate
    ? new Date(endDate)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0);

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

  // Use balance forecast from API
  const hasEnoughData =
    balanceForecast !== null && balanceForecast !== undefined;

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

  if (isLoading) {
    return <DashboardSkeleton />;
  }

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

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div data-onboarding='dashboard-greeting'>
          <h1 className='text-3xl leading-tight'>
            <span className='block font-bold'>
              {getGreeting()} {user?.name ?? ''} <span aria-hidden>👋</span>
            </span>
          </h1>
          <p className='mt-1 text-muted-foreground'>{t.dashboard.subtitle}</p>
        </div>

        {/* Account Balance Cards */}
        {accounts && accounts.length > 0 && (
          <div
            className='flex items-center gap-2'
            data-onboarding='dashboard-accounts'
          >
            {accounts.length > 3 && (
              <Button
                variant='ghost'
                size='icon'
                onClick={() =>
                  setAccountScrollIndex(Math.max(0, accountScrollIndex - 1))
                }
                disabled={accountScrollIndex === 0}
                className='h-8 w-8'
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
            )}

            <div
              className='-mx-2 flex gap-3 overflow-x-auto overscroll-contain px-2 pb-2 sm:overflow-x-visible'
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {accounts
                .slice(accountScrollIndex, accountScrollIndex + 3)
                .map((account) => {
                  const balance = account.currentBalance || 0;
                  const _isPositive = balance >= 0;

                  // Color logic: checking accounts are green/red based on balance, savings are blue
                  const getAccountColors = (type: string, balance: number) => {
                    if (type === 'checking') {
                      return balance >= 0
                        ? {
                            bg: 'bg-emerald-50 dark:bg-emerald-950',
                            text: 'text-emerald-600',
                          }
                        : {
                            bg: 'bg-red-50 dark:bg-red-950',
                            text: 'text-red-600',
                          };
                    } else if (type === 'savings') {
                      return {
                        bg: 'bg-blue-50 dark:bg-blue-950',
                        text: 'text-blue-600',
                      };
                    } else {
                      return {
                        bg: 'bg-gray-50 dark:bg-gray-950',
                        text: 'text-gray-600',
                      };
                    }
                  };

                  const colors = getAccountColors(account.type, balance);

                  return (
                    <div
                      key={account.id}
                      className='flex min-w-[12rem] flex-shrink-0 items-center gap-3 rounded-lg border bg-card px-4 py-2 shadow-sm'
                    >
                      <div className={`rounded-full p-2 ${colors.bg}`}>
                        {account.type === 'checking' && (
                          <Wallet className={`h-4 w-4 ${colors.text}`} />
                        )}
                        {account.type === 'savings' && (
                          <PiggyBank className={`h-4 w-4 ${colors.text}`} />
                        )}
                        {account.type === 'credit' && (
                          <CreditCard className={`h-4 w-4 ${colors.text}`} />
                        )}
                      </div>
                      <div className='min-w-0'>
                        <p className='truncate text-xs text-muted-foreground'>
                          {account.name}
                        </p>
                        <p className='font-semibold'>
                          {formatCurrency(balance)}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>

            {accounts.length > 3 && (
              <Button
                variant='ghost'
                size='icon'
                onClick={() =>
                  setAccountScrollIndex(
                    Math.min(accounts.length - 3, accountScrollIndex + 1)
                  )
                }
                disabled={accountScrollIndex >= accounts.length - 3}
                className='h-8 w-8'
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div
        className='grid grid-cols-2 gap-4 lg:grid-cols-4'
        data-onboarding='dashboard-stats'
      >
        <div data-onboarding='stat-income' className='h-full'>
          <StatsCard
            title={t.dashboard.income}
            value={formatCurrency(stats?.totalIncome || 0)}
            icon={ArrowUpRight}
            iconColor='text-emerald-600'
            trend={0}
          />
        </div>
        <div data-onboarding='stat-expenses' className='h-full'>
          <StatsCard
            title={t.dashboard.expenses}
            value={formatCurrency(stats?.totalExpenses || 0)}
            icon={ArrowDownRight}
            iconColor='text-rose-600'
            trend={0}
          />
        </div>
        <div data-onboarding='stat-savings' className='h-full'>
          <StatsCard
            title={t.dashboard.toSavings}
            value={formatCurrency(stats?.netSavingsTransfer || 0)}
            icon={PiggyBank}
            iconColor='text-blue-600'
            trend={0}
            trendLabel={`+${formatCurrency(
              stats?.transferToSavings || 0
            )} / -${formatCurrency(stats?.transferFromSavings || 0)}`}
          />
        </div>
        <div data-onboarding='stat-net-result' className='h-full'>
          <StatsCard
            title={t.dashboard.netResult}
            value={formatCurrency(stats?.totalBalance || 0)}
            icon={Wallet}
            iconColor={
              stats?.totalBalance === 0 || !stats?.totalBalance
                ? 'text-gray-400'
                : stats.totalBalance > 0
                  ? 'text-emerald-600'
                  : 'text-rose-600'
            }
            valueColor={
              stats?.totalBalance === 0 || !stats?.totalBalance
                ? 'text-gray-900 dark:text-gray-100'
                : stats.totalBalance > 0
                  ? 'text-emerald-600'
                  : 'text-rose-600'
            }
            bgColor={
              stats?.totalBalance === 0 || !stats?.totalBalance
                ? 'bg-gray-50 dark:bg-gray-900/20'
                : undefined
            }
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Monthly Earnings Chart */}
        <Card className='card-hover' data-onboarding='monthly-income-chart'>
          <CardHeader>
            <CardTitle>{t.dashboard.monthlyIncome}</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.reduce((sum, d) => sum + d.income, 0) > 0 ? (
              <div
                className={`h-[300px] overflow-y-hidden ${
                  monthlyData.length > 12
                    ? 'overflow-x-auto'
                    : 'overflow-x-hidden'
                }`}
                style={{ maxWidth: '100%' }}
                ref={monthlyIncomeScrollRef}
              >
                <div
                  ref={monthlyIncomeInnerRef}
                  style={{
                    width: '100%',
                    minWidth: '100%',
                    height: '100%',
                    minHeight: '300px',
                  }}
                >
                  <ResponsiveContainer
                    width='100%'
                    height='100%'
                    minHeight={1}
                    minWidth={1}
                  >
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient
                          id='colorIncome'
                          x1='0'
                          y1='0'
                          x2='0'
                          y2='1'
                        >
                          <stop
                            offset='5%'
                            stopColor='#8B5CF6'
                            stopOpacity={0.3}
                          />
                          <stop
                            offset='95%'
                            stopColor='#8B5CF6'
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey='month'
                        tickFormatter={(value) => {
                          const [, month] = value.split('-');
                          return t.common.monthsShort[parseInt(month) - 1];
                        }}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(value) =>
                          value >= 1000
                            ? `€${(value / 1000).toFixed(0)}k`
                            : `€${value}`
                        }
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 'auto']}
                      />
                      <Tooltip
                        formatter={(value) => [
                          formatCurrency(value as number),
                          t.dashboard.income,
                        ]}
                        labelFormatter={(label) => {
                          if (typeof label !== 'string') return '';
                          const [year, month] = label.split('-');
                          return `${
                            t.common.months[parseInt(month) - 1]
                          } ${year}`;
                        }}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type='monotone'
                        dataKey='income'
                        stroke='#8B5CF6'
                        strokeWidth={2}
                        fill='url(#colorIncome)'
                        isAnimationActive={monthlyData.length <= 10}
                        animationDuration={1500}
                        animationEasing='ease-out'
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className='flex h-[300px] flex-col items-center justify-center text-center'>
                <ArrowUpRight className='mb-4 h-12 w-12 text-muted-foreground/50' />
                <p className='text-muted-foreground'>{t.dashboard.noIncome}</p>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {t.dashboard.importTransactions}
                </p>
                <Button
                  onClick={() => navigate('/import/')}
                  variant='link'
                  className='mt-2'
                >
                  {t.dashboard.goToImport}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spending by Category */}
        <Card
          className='card-hover'
          onClick={() => {
            setActiveCategoryIndex(null);
            setPinnedCategoryIndex(null);
          }}
          data-onboarding='category-pie-chart'
        >
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle>{t.dashboard.expensesByCategory}</CardTitle>
            <span
              className='min-h-7 text-lg font-semibold'
              style={{
                color:
                  activeCategoryIndex !== null &&
                  categoryData[activeCategoryIndex]
                    ? categoryData[activeCategoryIndex].color
                    : 'transparent',
              }}
            >
              {activeCategoryIndex !== null && categoryData[activeCategoryIndex]
                ? formatCurrency(categoryData[activeCategoryIndex].amount)
                : '\u00A0'}
            </span>
          </CardHeader>
          <CardContent>
            <div className='flex h-[300px] items-center justify-center'>
              {categoryData.length > 0 ? (
                <ResponsiveContainer
                  width='100%'
                  height='100%'
                  minHeight={1}
                  minWidth={1}
                >
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx='50%'
                      cy='50%'
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey='amount'
                      nameKey='categoryName'
                      startAngle={90}
                      endAngle={-270}
                      isAnimationActive={false}
                      {...{
                        activeIndex:
                          activeCategoryIndex !== null
                            ? activeCategoryIndex
                            : undefined,
                      }}
                      activeShape={(props: PieSectorDataItem) => {
                        const {
                          cx,
                          cy,
                          innerRadius,
                          outerRadius,
                          startAngle,
                          endAngle,
                          fill,
                        } = props;
                        return (
                          <Sector
                            cx={cx}
                            cy={cy}
                            innerRadius={innerRadius}
                            outerRadius={(outerRadius || 100) + 15}
                            startAngle={startAngle}
                            endAngle={endAngle}
                            fill={fill}
                            style={{ outline: 'none' }}
                          />
                        );
                      }}
                      onClick={(_, index) => {
                        // Toggle selection on click - grows the segment
                        if (pinnedCategoryIndex === index) {
                          setPinnedCategoryIndex(null);
                          setActiveCategoryIndex(null);
                        } else {
                          setPinnedCategoryIndex(index);
                          setActiveCategoryIndex(index);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          opacity={
                            activeCategoryIndex !== null &&
                            activeCategoryIndex !== index
                              ? 0.3
                              : 1
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend
                      layout='vertical'
                      align='right'
                      verticalAlign='middle'
                      wrapperStyle={{
                        maxHeight: '280px',
                        overflowY: 'auto',
                      }}
                      content={() => (
                        <div ref={legendContainerRef} className='space-y-1'>
                          {categoryData.map((entry, index) => (
                            <div
                              key={index}
                              data-category-index={index}
                              className={`flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 ${
                                activeCategoryIndex === index
                                  ? 'bg-muted'
                                  : 'hover:bg-muted/50'
                              }`}
                              onClick={(event) => {
                                event.stopPropagation();
                                // Toggle selection on click - grows the segment
                                if (pinnedCategoryIndex === index) {
                                  setPinnedCategoryIndex(null);
                                  setActiveCategoryIndex(null);
                                } else {
                                  setPinnedCategoryIndex(index);
                                  setActiveCategoryIndex(index);
                                }
                              }}
                            >
                              <div
                                className='h-3 w-3 flex-shrink-0 rounded-full'
                                style={{ backgroundColor: entry.color }}
                              />
                              <span
                                className={`truncate text-sm text-foreground ${
                                  activeCategoryIndex === index
                                    ? 'font-bold'
                                    : ''
                                }`}
                              >
                                {entry.categoryName}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className='flex flex-col items-center justify-center py-8 text-center'>
                  <ArrowDownRight className='mb-4 h-12 w-12 text-muted-foreground/50' />
                  <p className='text-muted-foreground'>
                    {t.dashboard.noExpenses}
                  </p>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {t.dashboard.importTransactions}
                  </p>
                  <button
                    onClick={() => navigate('/import/')}
                    className='mt-3 text-sm text-primary hover:underline'
                  >
                    {t.dashboard.goToImport}
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income vs Expenses Chart */}
      <Card className='card-hover' data-onboarding='income-expenses-chart'>
        <CardHeader>
          <CardTitle>{t.dashboard.incomeVsExpenses}</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <div
              className='h-[300px] overflow-x-auto overflow-y-hidden'
              style={{ maxWidth: '100%' }}
              ref={monthlyComparisonScrollRef}
              data-testid='monthly-comparison-scroll'
            >
              <div
                style={{
                  width: `${Math.max(720, monthlyData.length * 60)}px`,
                  minWidth: '100%',
                  height: '100%',
                  minHeight: '300px',
                }}
              >
                <ResponsiveContainer
                  width='100%'
                  height='100%'
                  minHeight={1}
                  minWidth={1}
                >
                  <BarChart data={monthlyData}>
                    <CartesianGrid
                      strokeDasharray='3 3'
                      vertical={false}
                      stroke='hsl(var(--border))'
                    />
                    <XAxis
                      dataKey='month'
                      tickFormatter={(value) => {
                        const [, month] = value.split('-');
                        return t.common.monthsShort[parseInt(month) - 1];
                      }}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        value >= 1000
                          ? `€${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
                          : `€${Math.round(value)}`
                      }
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                      domain={[
                        0,
                        (dataMax: number) => {
                          if (dataMax <= 1000)
                            return Math.ceil(dataMax / 100) * 100;
                          if (dataMax <= 5000)
                            return Math.ceil(dataMax / 500) * 500;
                          if (dataMax <= 20000)
                            return Math.ceil(dataMax / 1000) * 1000;
                          return Math.ceil(dataMax / 5000) * 5000;
                        },
                      ]}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (
                          active &&
                          payload &&
                          payload.length &&
                          typeof label === 'string'
                        ) {
                          const income =
                            (payload.find((p) => p.dataKey === 'income')
                              ?.value as number) || 0;
                          const expenses =
                            (payload.find((p) => p.dataKey === 'expenses')
                              ?.value as number) || 0;
                          const balance = income - expenses;
                          const [year, month] = label.split('-');
                          return (
                            <div className='rounded-lg border bg-card p-3 shadow-lg'>
                              <p className='mb-2 font-medium'>
                                {t.common.months[parseInt(month) - 1]} {year}
                              </p>
                              <p className='text-emerald-600'>
                                {t.dashboard.income}: {formatCurrency(income)}
                              </p>
                              <p className='text-rose-600'>
                                {t.dashboard.expenses}:{' '}
                                {formatCurrency(expenses)}
                              </p>
                              <p
                                className={`mt-1 border-t pt-1 font-semibold ${
                                  balance >= 0
                                    ? 'text-emerald-600'
                                    : 'text-rose-600'
                                }`}
                              >
                                {t.common.total}: {formatCurrency(balance)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                    />
                    <Legend />
                    <Bar
                      dataKey='income'
                      name={t.dashboard.income}
                      fill='#10B981'
                      radius={[4, 4, 0, 0]}
                      activeBar={{ fill: '#047857' }}
                    />
                    <Bar
                      dataKey='expenses'
                      name={t.dashboard.expenses}
                      fill='#F43F5E'
                      radius={[4, 4, 0, 0]}
                      activeBar={{ fill: '#B91C1C' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className='flex h-[300px] flex-col items-center justify-center text-center'>
              <ArrowLeftRight className='mb-4 h-12 w-12 text-muted-foreground/50' />
              <p className='text-muted-foreground'>
                {t.dashboard.noComparison || 'Geen data beschikbaar'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Expenses Timeline */}
      <Card
        className='card-hover overflow-hidden'
        data-onboarding='daily-expenses-chart'
      >
        <CardHeader>
          <CardTitle>{t.dashboard.dailyExpenses}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex h-[200px] overflow-hidden'>
            {/* Fixed Y-Axis */}
            <div className='h-full w-[50px] flex-shrink-0'>
              <ResponsiveContainer
                width='100%'
                height='100%'
                minHeight={1}
                minWidth={1}
              >
                <BarChart data={dailyData} layout='horizontal'>
                  <YAxis
                    tickFormatter={(value) =>
                      value >= 1000
                        ? `€${(value / 1000).toFixed(1)}k`
                        : `€${Math.round(value)}`
                    }
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 11,
                    }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={false}
                    domain={[
                      0,
                      (dataMax: number) => {
                        if (dataMax <= 100) return Math.ceil(dataMax / 20) * 20;
                        if (dataMax <= 500)
                          return Math.ceil(dataMax / 100) * 100;
                        if (dataMax <= 2000)
                          return Math.ceil(dataMax / 500) * 500;
                        return Math.ceil(dataMax / 1000) * 1000;
                      },
                    ]}
                    width={50}
                    allowDecimals={false}
                    tickCount={5}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Scrollable Chart Content */}
            <div
              className='flex-1 overflow-x-auto overflow-y-hidden'
              ref={dailyScrollRef}
            >
              {dailyData.reduce((sum, day) => sum + day.expenses, 0) > 0 ? (
                <div
                  style={{
                    width:
                      dailyData.length > 15
                        ? `${dailyData.length * 25}px`
                        : '100%',
                    minWidth: '100%',
                    height: '100%',
                  }}
                >
                  <ResponsiveContainer
                    width='100%'
                    height='100%'
                    minHeight={1}
                    minWidth={1}
                  >
                    <BarChart data={dailyData} barCategoryGap='15%'>
                      <CartesianGrid
                        strokeDasharray='3 3'
                        vertical={false}
                        stroke='hsl(var(--border))'
                      />
                      <XAxis
                        dataKey='date'
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}`;
                        }}
                        tick={{
                          fill: 'hsl(var(--muted-foreground))',
                          fontSize: 11,
                        }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                      />
                      {/* Hidden YAxis to ensure same scale */}
                      <YAxis
                        hide
                        domain={[
                          0,
                          (dataMax: number) => {
                            if (dataMax <= 100)
                              return Math.ceil(dataMax / 20) * 20;
                            if (dataMax <= 500)
                              return Math.ceil(dataMax / 100) * 100;
                            if (dataMax <= 2000)
                              return Math.ceil(dataMax / 500) * 500;
                            return Math.ceil(dataMax / 1000) * 1000;
                          },
                        ]}
                      />
                      <Tooltip
                        formatter={(value) => [
                          formatCurrency(value as number),
                          t.dashboard.expenses,
                        ]}
                        labelFormatter={(label) => {
                          const date = new Date(label as string);
                          return date.toLocaleDateString(
                            language === 'nl' ? 'nl-NL' : 'en-US',
                            {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            }
                          );
                        }}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                        }}
                        cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                      />
                      <Bar
                        dataKey='expenses'
                        fill='#F43F5E'
                        radius={[4, 4, 0, 0]}
                        activeBar={{ fill: '#B91C1C' }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className='flex h-full items-center justify-center overflow-hidden text-muted-foreground'>
                  <div className='flex flex-col items-center justify-center text-center'>
                    <ArrowDownRight className='mb-4 h-12 w-12 text-muted-foreground/50' />
                    <p className='text-muted-foreground'>
                      {t.dashboard.noExpenses}
                    </p>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      {t.dashboard.importTransactions}
                    </p>
                    <button
                      onClick={() => navigate('/import/')}
                      className='mt-3 text-sm text-primary hover:underline'
                    >
                      {t.dashboard.goToImport}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget and Balance Widgets */}
      <div className='grid gap-4 md:grid-cols-2'>
        {/* Budget Widget */}
        <Card className='card-hover' data-onboarding='budget-progress'>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
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
                    {formatCurrency(totalBudget)}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>
                    {t.dashboard.spent}
                  </span>
                  <span className='font-semibold'>
                    {formatCurrency(totalSpent)}
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
                    {formatCurrency(totalBudget - totalSpent)}
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
              <div className='flex flex-col items-center justify-center py-8 text-center'>
                <PiggyBank className='mb-4 h-12 w-12 text-muted-foreground/50' />
                <p className='text-muted-foreground'>{t.dashboard.noBudgets}</p>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {t.dashboard.setBudgets}
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

        {/* Current vs Expected Balance Widget */}
        <Card className='card-hover' data-onboarding='balance-forecast'>
          <CardHeader>
            <CardTitle>
              {hasEnoughData && balanceForecast?.isPastPeriod
                ? t.dashboard.periodSummary
                : t.dashboard.forecast}
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
                    {formatCurrency(balanceForecast.currentMonthIncome)}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>
                    {t.dashboard.totalExpenses}
                  </span>
                  <span className='font-semibold text-rose-600'>
                    {formatCurrency(balanceForecast.currentMonthExpenses)}
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
                    {formatCurrency(balanceForecast.expectedEndBalance)}
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
                    {formatCurrency(balanceForecast.currentMonthIncome)}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>
                    {t.dashboard.expectedIncome}
                  </span>
                  <span className='font-semibold text-emerald-600'>
                    {formatCurrency(balanceForecast.expectedIncome)}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>
                    {t.dashboard.currentExpenses}
                  </span>
                  <span className='font-semibold text-rose-600'>
                    {formatCurrency(balanceForecast.currentMonthExpenses)}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>
                    {t.dashboard.expectedExpenses}
                  </span>
                  <span className='font-semibold text-rose-600'>
                    {formatCurrency(balanceForecast.expectedExpenses)}
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
                    {formatCurrency(balanceForecast.expectedEndBalance)}
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
                <button
                  onClick={() => navigate('/import/')}
                  className='mt-3 text-sm text-primary hover:underline'
                >
                  {t.dashboard.goToImport}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Top Accounts - Side by side on large screens */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Recent Transactions */}
        <Card className='card-hover' data-onboarding='recent-transactions'>
          <CardHeader>
            <CardTitle className='truncate pb-1'>Recente transacties</CardTitle>
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
                      {tx.amount > 0 ? '+' : ''}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
                <div className='pt-4'>
                  <Button
                    variant='outline'
                    onClick={() => {
                      resetFilters();
                      navigate('/transactions/');
                    }}
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
                <Button
                  onClick={() => navigate('/import/')}
                  variant='link'
                  className='mt-2'
                >
                  {t.dashboard.goToImport}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Accounts Widget */}
        <Card className='card-hover' data-onboarding='top-accounts'>
          <CardHeader>
            <CardTitle className='truncate pb-1'>
              {t.dashboard?.topAccounts || 'Top tegenrekeningen'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topAccounts && topAccounts.accounts.length > 0 ? (
              <div className='space-y-4'>
                {topAccounts.accounts.map((account) => (
                  <div
                    key={account.iban}
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
                      {account.netAmount > 0 ? '+' : ''}
                      {formatCurrency(account.netAmount)}
                    </span>
                  </div>
                ))}
                <div className='pt-4'>
                  <Button
                    variant='outline'
                    onClick={() => {
                      resetFilters();
                      navigate('/addressbook/');
                    }}
                  >
                    {t.dashboard?.viewAddressBook || 'Bekijk adresboek'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-8 text-center'>
                <Users className='mb-4 h-12 w-12 text-muted-foreground/50' />
                <p className='text-muted-foreground'>
                  {t.dashboard?.noTopAccounts ||
                    'Nog geen tegenrekeningen bekend'}
                </p>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {t.dashboard?.addContactsToAddressBook ||
                    'Voeg contacten toe aan je adresboek'}
                </p>
                <Button
                  onClick={() => navigate('/addressbook/')}
                  variant='link'
                  className='mt-2'
                >
                  {t.dashboard?.goToAddressBook || 'Ga naar adresboek'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  valueColor?: string;
  bgColor?: string;
  trend?: number;
  trendLabel?: string;
}

function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-primary',
  valueColor,
  bgColor,
  trend,
  trendLabel,
}: StatsCardProps) {
  // Map icon color to matching pastel background
  const getBgColor = (color: string) => {
    if (color.includes('emerald'))
      return 'bg-emerald-100 dark:bg-emerald-900/30';
    if (color.includes('rose')) return 'bg-rose-100 dark:bg-rose-900/30';
    if (color.includes('blue')) return 'bg-blue-100 dark:bg-blue-900/30';
    return 'bg-primary/10';
  };

  return (
    <Card className='card-hover h-full'>
      <CardContent className='flex h-full flex-col justify-between p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm text-muted-foreground'>{title}</p>
            <p className={`mt-1 text-2xl font-bold ${valueColor || ''}`}>
              {value}
            </p>
            {trend !== undefined && trend !== 0 ? (
              <div className='mt-1 flex items-center gap-1'>
                {trend > 0 ? (
                  <TrendingUp className='h-4 w-4 text-success' />
                ) : (
                  <TrendingDown className='h-4 w-4 text-destructive' />
                )}
                <span
                  className={`text-sm ${
                    trend > 0 ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {trend > 0 ? '+' : ''}
                  {trend.toFixed(1)}%
                </span>
                {trendLabel && (
                  <span className='text-sm text-muted-foreground'>
                    {trendLabel}
                  </span>
                )}
              </div>
            ) : trendLabel ? (
              <p className='mt-1 text-xs text-muted-foreground'>{trendLabel}</p>
            ) : (
              <p className='mt-1 text-xs text-transparent'>-</p>
            )}
          </div>
          <div
            className={`h-12 w-12 flex-shrink-0 rounded-full ${
              bgColor || getBgColor(iconColor)
            } flex items-center justify-center`}
          >
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className='space-y-6'>
      <Skeleton className='h-9 w-48' />
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
    </div>
  );
}
