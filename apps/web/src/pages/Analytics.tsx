import { useQuery } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  ExternalLink,
  ArrowLeftRight,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDataService } from '@/contexts/DatabaseContext';
import { api } from '@/lib/api';
import { Currency } from '@/components/ui/currency';
import { useFilters } from '@/contexts/FilterContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import {
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
  LineChart,
  Line,
  ReferenceLine,
  CartesianGrid,
  Rectangle,
  Sector,
} from 'recharts';
import type { PieSectorDataItem } from 'recharts/types/polar/Pie';
import type { RecurringPattern } from '@fluxby/shared';

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  [key: string]: string | number;
}

export default function Analytics() {
  const { t, language: _language } = useLanguage();
  const { activeProfileId } = useProfile();
  const dataService = useDataService();
  useDocumentTitle(t.analytics.title);
  const navigate = useNavigate();
  const {
    filters,
    setCategories,
    setTransactionType,
    clearOpposingAccountFilters,
  } = useFilters();

  // Get the year range from the selected dates
  const startYear = filters.dateRange.start.getFullYear();
  const endYear = filters.dateRange.end.getFullYear();

  // Create full year date range
  const yearStartDate = `${startYear}-01-01`;
  const yearEndDate = `${endYear}-12-31`;

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery<
    MonthlyData[]
  >({
    queryKey: ['monthly-data', activeProfileId, yearStartDate, yearEndDate],
    queryFn: () =>
      dataService.getMonthlyStats(yearStartDate, yearEndDate) as Promise<
        MonthlyData[]
      >,
  });

  const { data: expenseCategories, isLoading: expensesLoading } = useQuery<
    CategoryBreakdown[]
  >({
    queryKey: [
      'category-breakdown',
      activeProfileId,
      'expense',
      yearStartDate,
      yearEndDate,
    ],
    queryFn: () =>
      dataService.getCategoryStats(
        yearStartDate,
        yearEndDate,
        'expense'
      ) as Promise<CategoryBreakdown[]>,
  });

  const { data: incomeCategories, isLoading: incomeLoading } = useQuery<
    CategoryBreakdown[]
  >({
    queryKey: [
      'category-breakdown',
      activeProfileId,
      'income',
      yearStartDate,
      yearEndDate,
    ],
    queryFn: () =>
      dataService.getCategoryStats(
        yearStartDate,
        yearEndDate,
        'income'
      ) as Promise<CategoryBreakdown[]>,
  });

  const { data: recurringPatterns, isLoading: recurringLoading } = useQuery<
    RecurringPattern[]
  >({
    queryKey: [
      'recurring-patterns-history',
      activeProfileId,
      yearStartDate,
      yearEndDate,
    ],
    queryFn: () =>
      api.getRecurringPatternsWithHistory(yearStartDate, yearEndDate),
  });

  // Filter recurring patterns to only show expenses (subscriptions)
  const expensePatterns = recurringPatterns?.filter((p) => p.avgAmount < 0);

  const [activeExpenseIndex, setActiveExpenseIndex] = useState<number | null>(
    null
  );
  const [pinnedExpenseIndex, setPinnedExpenseIndex] = useState<number | null>(
    null
  );
  const [activeIncomeIndex, setActiveIncomeIndex] = useState<number | null>(
    null
  );
  const [pinnedIncomeIndex, setPinnedIncomeIndex] = useState<number | null>(
    null
  );
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const expenseLegendRef = useRef<HTMLDivElement>(null);
  const incomeLegendRef = useRef<HTMLDivElement>(null);

  const savingsChartScrollRef = useRef<HTMLDivElement>(null);
  const trendChartScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll savings chart to the end when data changes
    // Use setTimeout to ensure the chart is fully rendered
    const timer = setTimeout(() => {
      if (savingsChartScrollRef.current) {
        const el = savingsChartScrollRef.current;
        el.scrollLeft = el.scrollWidth - el.clientWidth;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [monthlyData]);

  useEffect(() => {
    // Auto-scroll trend chart to the end when data changes
    // Use setTimeout to ensure the chart is fully rendered
    const timer = setTimeout(() => {
      if (trendChartScrollRef.current) {
        const el = trendChartScrollRef.current;
        el.scrollLeft = el.scrollWidth - el.clientWidth;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [monthlyData]);

  const isLoading =
    monthlyLoading || expensesLoading || incomeLoading || recurringLoading;

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  const formatYearRange = () => {
    if (startYear === endYear) {
      return `${startYear}`;
    }
    return `${startYear} - ${endYear}`;
  };

  const netSavings = (monthlyData || []).map((m) => ({
    ...m,
    savings: m.income - m.expenses,
  }));

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold sm:text-3xl'>
            {t.analytics.title}
          </h1>
          <p className='mt-1 text-xs text-muted-foreground sm:text-sm'>
            {t.analytics.subtitle}
          </p>
        </div>
        <span className='text-muted-foreground'>{formatYearRange()}</span>
      </div>

      {/* Savings Over Time */}
      <div className='-mx-3 sm:mx-0'>
        <Card
          className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
          data-onboarding='net-savings-chart'
        >
          <CardHeader>
            <CardTitle className='text-base sm:text-lg'>
              {t.analytics.netOverTime}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className='h-[300px] overflow-x-auto'
              ref={savingsChartScrollRef}
            >
              {netSavings.length > 0 ? (
                <div
                  style={{
                    width: `${Math.max(12, netSavings.length) * 50}px`,
                    minWidth: '100%',
                    height: '100%',
                  }}
                >
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={netSavings}>
                      <CartesianGrid
                        strokeDasharray='3 3'
                        vertical={false}
                        stroke='hsl(var(--border))'
                      />
                      <XAxis
                        dataKey='month'
                        tickFormatter={(value) => {
                          const [year, month] = value.split('-');
                          const monthIdx = parseInt(month) - 1;
                          const monthName = t.common.monthsShort[monthIdx];
                          // Show year for January
                          if (month === '01') {
                            return `${monthName} '${year.slice(2)}`;
                          }
                          return monthName;
                        }}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                      />
                      <YAxis
                        tickFormatter={(value) =>
                          value >= 1000 || value <= -1000
                            ? `€${(value / 1000).toFixed(0)}k`
                            : `€${Math.round(value)}`
                        }
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        domain={[
                          (dataMin: number) => Math.min(dataMin, 0),
                          (dataMax: number) => Math.max(dataMax, 0),
                        ]}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload || !payload.length)
                            return null;
                          if (typeof label !== 'string') return null;
                          const value = payload[0].value as number;
                          const [year, month] = label.split('-');
                          const monthIdx = parseInt(month) - 1;
                          const monthName = t.common.months[monthIdx];
                          return (
                            <div
                              className='rounded-lg border bg-card p-2 shadow-sm'
                              style={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                              }}
                            >
                              <p className='text-sm text-muted-foreground'>
                                {monthName}{' '}
                                <span className='font-semibold'>{year}</span>
                              </p>
                              <p
                                className='text-sm font-semibold'
                                style={{
                                  color: value >= 0 ? '#10B981' : '#F43F5E',
                                }}
                              >
                                {value >= 0 ? '+' : ''}
                                <Currency amount={value} />
                              </p>
                            </div>
                          );
                        }}
                        cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                      />
                      <ReferenceLine y={0} stroke='hsl(var(--border))' />
                      {/* Year separator lines */}
                      {netSavings
                        .filter((d) => d.month.endsWith('-01'))
                        .map((d) => (
                          <ReferenceLine
                            key={d.month}
                            x={d.month}
                            stroke='hsl(var(--muted-foreground))'
                            strokeDasharray='5 5'
                            strokeOpacity={0.5}
                          />
                        ))}
                      <Bar
                        dataKey='savings'
                        radius={[4, 4, 0, 0]}
                        fill='#10B981'
                        activeBar={(props: unknown) => {
                          const typedProps = props as {
                            payload?: { savings: number };
                            x?: number;
                            y?: number;
                            width?: number;
                            height?: number;
                          };
                          const isPositive =
                            (typedProps.payload?.savings ?? 0) >= 0;
                          return (
                            <Rectangle
                              {...typedProps}
                              fill={isPositive ? '#047857' : '#BE123C'}
                            />
                          );
                        }}
                      >
                        {netSavings.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.savings >= 0 ? '#10B981' : '#F43F5E'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className='flex h-full flex-col items-center justify-center py-8 text-center text-muted-foreground'>
                  <ArrowLeftRight className='mb-4 h-12 w-12 text-muted-foreground/50' />
                  <p>{t.analytics.noData}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income vs Expenses Trend */}
      <div className='-mx-3 sm:mx-0'>
        <Card
          className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
          data-onboarding='income-expenses-trend'
        >
          <CardHeader>
            <CardTitle className='text-base sm:text-lg'>
              {t.analytics.incomeVsExpensesTrend}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className='h-[300px] overflow-x-auto'
              ref={trendChartScrollRef}
            >
              {monthlyData && monthlyData.length > 0 ? (
                <div
                  style={{
                    width: `${Math.max(12, monthlyData.length) * 60}px`,
                    minWidth: '100%',
                    height: '100%',
                  }}
                >
                  <ResponsiveContainer width='100%' height='100%'>
                    <LineChart data={monthlyData}>
                      <CartesianGrid
                        strokeDasharray='3 3'
                        vertical={false}
                        stroke='hsl(var(--border))'
                      />
                      <XAxis
                        dataKey='month'
                        tickFormatter={(value) => {
                          const [year, month] = value.split('-');
                          const monthIdx = parseInt(month) - 1;
                          const monthName = t.common.monthsShort[monthIdx];
                          // Show year for January
                          if (month === '01') {
                            return `${monthName} '${year.slice(2)}`;
                          }
                          return monthName;
                        }}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(value) =>
                          `€${(value / 1000).toFixed(1)}k`
                        }
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        allowDuplicatedCategory={false}
                        allowDecimals={true}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload || !payload.length)
                            return null;
                          if (typeof label !== 'string') return null;
                          const [year, month] = label.split('-');
                          const monthIdx = parseInt(month) - 1;
                          const monthName = t.common.monthsShort[monthIdx];
                          return (
                            <div
                              className='rounded-lg border bg-card p-2 shadow-sm'
                              style={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                              }}
                            >
                              <p className='mb-1 text-sm font-medium'>
                                {monthName} {year}
                              </p>
                              {payload.map((entry) => (
                                <p
                                  key={entry.dataKey}
                                  className='text-sm'
                                  style={{ color: entry.color }}
                                >
                                  {entry.dataKey === 'income'
                                    ? t.dashboard.income
                                    : t.dashboard.expenses}
                                  : <Currency amount={entry.value as number} />
                                </p>
                              ))}
                            </div>
                          );
                        }}
                      />
                      <ReferenceLine y={0} stroke='hsl(var(--border))' />
                      {/* Year separator lines */}
                      {monthlyData
                        .filter((d) => d.month.endsWith('-01'))
                        .map((d) => (
                          <ReferenceLine
                            key={d.month}
                            x={d.month}
                            stroke='hsl(var(--muted-foreground))'
                            strokeDasharray='5 5'
                            strokeOpacity={0.5}
                          />
                        ))}
                      <Legend />
                      <Line
                        type='monotone'
                        dataKey='income'
                        name='Inkomsten'
                        stroke='#10B981'
                        strokeWidth={2}
                        dot={{ fill: '#10B981', strokeWidth: 2 }}
                      />
                      <Line
                        type='monotone'
                        dataKey='expenses'
                        name='Uitgaven'
                        stroke='#F43F5E'
                        strokeWidth={2}
                        dot={{ fill: '#F43F5E', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className='flex h-full flex-col items-center justify-center py-8 text-center text-muted-foreground'>
                  <TrendingUp className='mb-4 h-12 w-12 text-muted-foreground/50' />
                  <p>{t.analytics.noData || 'Geen data beschikbaar'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className='-mx-3 sm:mx-0'>
        <div className='grid gap-px bg-border sm:gap-6 sm:bg-transparent md:grid-cols-2'>
          {/* Expense Categories */}
          <Card
            className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
            onClick={() => {
              setActiveExpenseIndex(null);
              setPinnedExpenseIndex(null);
            }}
            data-onboarding='expense-breakdown'
          >
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle className='text-base sm:text-lg'>
                {t.analytics.expenseBreakdown}
              </CardTitle>
              <span
                className='min-h-7 text-lg font-semibold'
                style={{
                  color:
                    activeExpenseIndex !== null &&
                    expenseCategories &&
                    expenseCategories[activeExpenseIndex]
                      ? expenseCategories[activeExpenseIndex].color
                      : 'transparent',
                }}
              >
                {activeExpenseIndex !== null &&
                expenseCategories &&
                expenseCategories[activeExpenseIndex] ? (
                  <Currency
                    amount={expenseCategories[activeExpenseIndex].amount}
                  />
                ) : (
                  '\u00A0'
                )}
              </span>
            </CardHeader>
            <CardContent>
              <div className='h-[300px]'>
                {expenseCategories && expenseCategories.length > 0 ? (
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                      <Pie
                        data={expenseCategories}
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
                            activeExpenseIndex !== null
                              ? activeExpenseIndex
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
                          if (pinnedExpenseIndex === index) {
                            setPinnedExpenseIndex(null);
                            setActiveExpenseIndex(null);
                          } else {
                            setPinnedExpenseIndex(index);
                            setActiveExpenseIndex(index);
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {expenseCategories.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            style={{ outline: 'none', cursor: 'pointer' }}
                            opacity={
                              activeExpenseIndex !== null &&
                              activeExpenseIndex !== index
                                ? 0.3
                                : 1
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number | undefined) => (
                          <Currency amount={value || 0} />
                        )}
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
                          paddingLeft: '10px',
                        }}
                        content={() => (
                          <div ref={expenseLegendRef} className='space-y-1'>
                            {expenseCategories.map((entry, index) => {
                              const isActive = activeExpenseIndex === index;
                              return (
                                <div
                                  key={index}
                                  data-expense-index={index}
                                  className={`flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 ${
                                    isActive ? 'bg-muted' : 'hover:bg-muted/50'
                                  }`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    // Double click navigates to transactions
                                    if (event.detail === 2) {
                                      clearOpposingAccountFilters();
                                      setCategories([entry.categoryId]);
                                      navigate('/transactions/');
                                    } else {
                                      // Toggle selection on single click - grows the segment
                                      if (pinnedExpenseIndex === index) {
                                        setPinnedExpenseIndex(null);
                                        setActiveExpenseIndex(null);
                                      } else {
                                        setPinnedExpenseIndex(index);
                                        setActiveExpenseIndex(index);
                                      }
                                    }
                                  }}
                                >
                                  <div
                                    className='h-3 w-3 flex-shrink-0 rounded-full'
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span
                                    className='truncate text-sm text-foreground'
                                    style={{
                                      fontWeight: isActive ? 'bold' : 'normal',
                                    }}
                                  >
                                    {entry.categoryName}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className='flex h-full flex-col items-center justify-center py-8 text-center text-muted-foreground'>
                    <ArrowDownRight className='mb-4 h-12 w-12 text-muted-foreground/50' />
                    <p>{t.analytics.noExpenseData}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Income Categories */}
          <Card
            className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
            onClick={() => {
              setActiveIncomeIndex(null);
              setPinnedIncomeIndex(null);
            }}
            data-onboarding='income-breakdown'
          >
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle className='text-base sm:text-lg'>
                {t.analytics.incomeBreakdown}
              </CardTitle>
              <span
                className='min-h-7 text-lg font-semibold'
                style={{
                  color:
                    activeIncomeIndex !== null &&
                    incomeCategories &&
                    incomeCategories[activeIncomeIndex]
                      ? incomeCategories[activeIncomeIndex].color
                      : 'transparent',
                }}
              >
                {activeIncomeIndex !== null &&
                incomeCategories &&
                incomeCategories[activeIncomeIndex] ? (
                  <Currency
                    amount={incomeCategories[activeIncomeIndex].amount}
                  />
                ) : (
                  '\u00A0'
                )}
              </span>
            </CardHeader>
            <CardContent>
              <div className='h-[300px]'>
                {incomeCategories && incomeCategories.length > 0 ? (
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                      <Pie
                        data={incomeCategories}
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
                            activeIncomeIndex !== null
                              ? activeIncomeIndex
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
                          if (pinnedIncomeIndex === index) {
                            setPinnedIncomeIndex(null);
                            setActiveIncomeIndex(null);
                          } else {
                            setPinnedIncomeIndex(index);
                            setActiveIncomeIndex(index);
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {incomeCategories.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            style={{ outline: 'none', cursor: 'pointer' }}
                            opacity={
                              activeIncomeIndex !== null &&
                              activeIncomeIndex !== index
                                ? 0.3
                                : 1
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number | undefined) => (
                          <Currency amount={value || 0} />
                        )}
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
                          paddingLeft: '10px',
                        }}
                        content={() => (
                          <div ref={incomeLegendRef} className='space-y-1'>
                            {incomeCategories.map((entry, index) => {
                              const isActive = activeIncomeIndex === index;
                              return (
                                <div
                                  key={index}
                                  data-income-index={index}
                                  className={`flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 ${
                                    isActive ? 'bg-muted' : 'hover:bg-muted/50'
                                  }`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    // Double click navigates to transactions
                                    if (event.detail === 2) {
                                      clearOpposingAccountFilters();
                                      setCategories([entry.categoryId]);
                                      navigate('/transactions/');
                                    } else {
                                      // Toggle selection on single click - grows the segment
                                      if (pinnedIncomeIndex === index) {
                                        setPinnedIncomeIndex(null);
                                        setActiveIncomeIndex(null);
                                      } else {
                                        setPinnedIncomeIndex(index);
                                        setActiveIncomeIndex(index);
                                      }
                                    }
                                  }}
                                >
                                  <div
                                    className='h-3 w-3 flex-shrink-0 rounded-full'
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span
                                    className='truncate text-sm text-foreground'
                                    style={{
                                      fontWeight: isActive ? 'bold' : 'normal',
                                    }}
                                  >
                                    {entry.categoryName}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className='flex h-full flex-col items-center justify-center py-8 text-center text-muted-foreground'>
                    <ArrowUpRight className='mb-4 h-12 w-12 text-muted-foreground/50' />
                    <p>{t.analytics.noIncomeData}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Breakdown Lists - 50/50 */}
      <div className='-mx-3 sm:mx-0'>
        <div className='grid gap-px bg-border sm:gap-6 sm:bg-transparent md:grid-cols-2'>
          {/* Expense Categories List */}
          <Card className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
            <CardHeader>
              <CardTitle className='text-base sm:text-lg'>
                {t.analytics.expenseBreakdown}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenseCategories && expenseCategories.length > 0 ? (
                <div className='max-h-96 space-y-2 overflow-y-auto'>
                  {expenseCategories.map((cat, index) => (
                    <button
                      key={cat.categoryId}
                      className='group flex w-full items-center gap-3 rounded px-2 py-2 text-left transition-colors hover:bg-muted/70'
                      {...(index === 0
                        ? { 'data-onboarding': 'analytics-category-link' }
                        : {})}
                      onClick={() => {
                        clearOpposingAccountFilters();
                        setTransactionType('expense');
                        setCategories([cat.categoryId]);
                        navigate('/transactions/');
                      }}
                    >
                      {/* Category icon with background */}
                      <div
                        className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-base'
                        style={{
                          backgroundColor: `${cat.color}36`,
                          color: cat.color,
                        }}
                      >
                        {cat.icon}
                      </div>
                      {/* Name and transaction count */}
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center gap-1.5 font-medium'>
                          <span className='truncate'>{cat.categoryName}</span>
                          <TooltipProvider delayDuration={100}>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <span className='inline-flex'>
                                  <ExternalLink className='h-4 w-4 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100' />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {t.analytics.viewTransactions ||
                                  'View transactions'}
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {cat.transactionCount}{' '}
                          {cat.transactionCount === 1
                            ? 'transactie'
                            : t.analytics.transactions}
                        </div>
                      </div>
                      {/* Amount and percentage */}
                      <div className='flex-shrink-0 text-right'>
                        <div className='font-semibold tabular-nums'>
                          <Currency amount={cat.amount} />
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {cat.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-8 text-center text-muted-foreground'>
                  <ArrowDownRight className='mb-4 h-12 w-12 text-muted-foreground/50' />
                  <p>{t.analytics.noExpenseData}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Income Categories List */}
          <Card className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
            <CardHeader>
              <CardTitle className='text-base sm:text-lg'>
                {t.analytics.incomeBreakdown}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incomeCategories && incomeCategories.length > 0 ? (
                <div className='max-h-96 space-y-2 overflow-y-auto'>
                  {incomeCategories.map((cat) => (
                    <button
                      key={cat.categoryId}
                      className='group flex w-full items-center gap-3 rounded px-2 py-2 text-left transition-colors hover:bg-muted/70'
                      onClick={() => {
                        clearOpposingAccountFilters();
                        setTransactionType('income');
                        setCategories([cat.categoryId]);
                        navigate('/transactions/');
                      }}
                    >
                      {/* Category icon with background */}
                      <div
                        className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-base'
                        style={{
                          backgroundColor: `${cat.color}36`,
                          color: cat.color,
                        }}
                      >
                        {cat.icon}
                      </div>
                      {/* Name and transaction count */}
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center gap-1.5 font-medium'>
                          <span className='truncate'>{cat.categoryName}</span>
                          <TooltipProvider delayDuration={100}>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <span className='inline-flex'>
                                  <ExternalLink className='h-4 w-4 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100' />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {t.analytics.viewTransactions ||
                                  'View transactions'}
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {cat.transactionCount}{' '}
                          {cat.transactionCount === 1
                            ? 'transactie'
                            : t.analytics.transactions}
                        </div>
                      </div>
                      {/* Amount and percentage */}
                      <div className='flex-shrink-0 text-right'>
                        <div className='font-semibold tabular-nums'>
                          <Currency amount={cat.amount} />
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {cat.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-8 text-center text-muted-foreground'>
                  <ArrowUpRight className='mb-4 h-12 w-12 text-muted-foreground/50' />
                  <p>{t.analytics.noIncomeData}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recurring Payments Analysis */}
      <div className='-mx-3 sm:mx-0'>
        <Card className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
          <CardHeader>
            <CardTitle className='text-base sm:text-lg'>
              {t.analytics?.recurringPayments || 'Recurring payments'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expensePatterns && expensePatterns.length > 0 ? (
              <div className='space-y-6'>
                {/* Subscription list with price history */}
                <div className='grid gap-4 lg:grid-cols-2'>
                  {/* List of subscriptions */}
                  <div className='space-y-2'>
                    {expensePatterns.map((pattern) => (
                      <button
                        key={pattern.id}
                        onClick={() =>
                          setSelectedPattern(
                            selectedPattern === pattern.id ? null : pattern.id
                          )
                        }
                        className={`flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors ${
                          selectedPattern === pattern.id
                            ? 'bg-primary/10 ring-1 ring-primary'
                            : 'bg-muted/50 hover:bg-muted'
                        }`}
                      >
                        <div className='min-w-0 flex-1'>
                          <p className='truncate font-medium'>
                            {pattern.merchantName ||
                              pattern.opposingIban ||
                              'Unknown'}
                          </p>
                          <p className='text-sm text-muted-foreground'>
                            {pattern.patternType === 'monthly'
                              ? t.subscriptions?.monthly || 'Monthly'
                              : pattern.patternType === 'yearly'
                                ? t.subscriptions?.yearly || 'Yearly'
                                : pattern.patternType === 'quarterly'
                                  ? t.subscriptions?.quarterly || 'Quarterly'
                                  : pattern.patternType === 'weekly'
                                    ? t.subscriptions?.weekly || 'Weekly'
                                    : pattern.patternType}
                          </p>
                        </div>
                        <div className='ml-4 text-right'>
                          <p className='font-semibold tabular-nums'>
                            <Currency amount={pattern.avgAmount} />
                          </p>
                          {(() => {
                            const history = pattern.priceHistory || [];

                            // If we have price history, calculate the average for the period
                            // and compare against the saved subscription amount (avgAmount)
                            if (history.length > 0) {
                              const periodAverage =
                                history.reduce((sum, h) => sum + h.amount, 0) /
                                history.length;
                              const savedAmount = pattern.avgAmount;

                              // Show difference if there's a significant change (>1% difference)
                              const diff = periodAverage - savedAmount;
                              const percentDiff =
                                Math.abs(diff / savedAmount) * 100;

                              if (percentDiff > 1) {
                                // For expenses (negative amounts), more negative = paying more = price increase
                                // Use absolute values to determine if price went up or down
                                const isHigher =
                                  Math.abs(periodAverage) > Math.abs(savedAmount);
                                return (
                                  <p
                                    className={`text-sm ${isHigher ? 'text-rose-600' : 'text-emerald-600'}`}
                                  >
                                    {isHigher ? '↑' : '↓'}{' '}
                                    <Currency amount={Math.abs(diff)} />
                                  </p>
                                );
                              }
                            }

                            return null;
                          })()}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Price history chart */}
                  <div className='flex min-h-[300px] flex-col'>
                    {selectedPattern ? (
                      (() => {
                        const pattern = expensePatterns?.find(
                          (p) => p.id === selectedPattern
                        );
                        if (!pattern?.priceHistory?.length) {
                          return (
                            <div className='flex flex-1 flex-col items-center justify-center text-center text-muted-foreground'>
                              <TrendingUp className='mb-4 h-12 w-12 text-muted-foreground/50' />
                              <p>
                                {t.analytics?.noPriceHistory ||
                                  'No price history available'}
                              </p>
                            </div>
                          );
                        }
                        return (
                          <div className='flex-1'>
                            <p className='mb-2 text-sm font-medium'>
                              {t.analytics?.priceHistory || 'Price history'}:{' '}
                              {pattern.merchantName ||
                                pattern.opposingIban ||
                                'Unknown'}
                            </p>
                            <ResponsiveContainer
                              width='100%'
                              height='100%'
                              minHeight={250}
                            >
                              <LineChart data={pattern.priceHistory}>
                                <CartesianGrid
                                  strokeDasharray='3 3'
                                  className='stroke-muted'
                                />
                                <XAxis
                                  dataKey='date'
                                  tick={{
                                    fill: 'hsl(var(--muted-foreground))',
                                    fontSize: 11,
                                  }}
                                  tickFormatter={(value) => {
                                    const date = new Date(value);
                                    return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
                                  }}
                                />
                                <YAxis
                                  tick={{
                                    fill: 'hsl(var(--muted-foreground))',
                                    fontSize: 11,
                                  }}
                                  tickFormatter={(value) => `€${value}`}
                                />
                                <Tooltip
                                  formatter={(value) => {
                                    if (typeof value !== 'number') return null;
                                    return [
                                      <Currency key='value' amount={value} />,
                                      t.transactions?.amount || 'Amount',
                                    ];
                                  }}
                                  labelFormatter={(label) => {
                                    const date = new Date(label);
                                    return date.toLocaleDateString();
                                  }}
                                  contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                  }}
                                />
                                <ReferenceLine
                                  y={pattern.avgAmount}
                                  stroke='hsl(var(--muted-foreground))'
                                  strokeDasharray='3 3'
                                  label={{
                                    value: t.analytics?.average || 'Avg',
                                    position: 'right',
                                    fill: 'hsl(var(--muted-foreground))',
                                    fontSize: 11,
                                  }}
                                />
                                <Line
                                  type='monotone'
                                  dataKey='amount'
                                  stroke='hsl(var(--primary))'
                                  strokeWidth={2}
                                  dot={{
                                    fill: 'hsl(var(--primary))',
                                    r: 4,
                                  }}
                                  activeDot={{
                                    r: 6,
                                    fill: 'hsl(var(--primary))',
                                  }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        );
                      })()
                    ) : (
                      <div className='flex flex-1 flex-col items-center justify-center text-center text-muted-foreground'>
                        <TrendingUp className='mb-4 h-12 w-12 text-muted-foreground/50' />
                        <p>
                          {t.analytics?.selectSubscription ||
                            'Select a subscription to view price history'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Link to subscriptions page */}
                <div className='border-t pt-4'>
                  <Button
                    variant='outline'
                    onClick={() => navigate('/subscriptions/')}
                  >
                    {t.dashboard?.viewSubscriptions || 'View all subscriptions'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-8 text-center'>
                <RefreshCw className='mb-4 h-12 w-12 text-muted-foreground/50' />
                <p className='text-muted-foreground'>
                  {t.analytics?.noRecurringPayments ||
                    'No confirmed recurring payments yet'}
                </p>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {t.analytics?.confirmSubscriptions ||
                    'Confirm detected subscriptions in the subscriptions page'}
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
  );
}

function AnalyticsSkeleton() {
  return (
    <div className='space-y-6'>
      <Skeleton className='h-9 w-48' />
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
  );
}
