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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDataService } from '@/contexts/DatabaseContext';
import { formatCurrency } from '@/lib/utils';
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

  const isLoading = monthlyLoading || expensesLoading || incomeLoading;

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
          <h1 className='text-2xl font-bold sm:text-3xl'>{t.analytics.title}</h1>
          <p className='mt-1 text-xs text-muted-foreground sm:text-sm'>
            {t.analytics.subtitle}
          </p>
        </div>
        <span className='text-muted-foreground'>{formatYearRange()}</span>
      </div>

      {/* Savings Over Time */}
      <div className='-mx-3 sm:mx-0'>
      <Card className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm' data-onboarding='net-savings-chart'>
        <CardHeader>
          <CardTitle className='text-base sm:text-lg'>{t.analytics.netOverTime}</CardTitle>
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
                        if (!active || !payload || !payload.length) return null;
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
                              {formatCurrency(value)}
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
      <Card className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm' data-onboarding='income-expenses-trend'>
        <CardHeader>
          <CardTitle className='text-base sm:text-lg'>{t.analytics.incomeVsExpensesTrend}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-[300px] overflow-x-auto' ref={trendChartScrollRef}>
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
                        if (!active || !payload || !payload.length) return null;
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
                                : {formatCurrency(entry.value as number)}
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
            <CardTitle className='text-base sm:text-lg'>{t.analytics.expenseBreakdown}</CardTitle>
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
              expenseCategories[activeExpenseIndex]
                ? formatCurrency(expenseCategories[activeExpenseIndex].amount)
                : '\u00A0'}
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
            <CardTitle className='text-base sm:text-lg'>{t.analytics.incomeBreakdown}</CardTitle>
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
              incomeCategories[activeIncomeIndex]
                ? formatCurrency(incomeCategories[activeIncomeIndex].amount)
                : '\u00A0'}
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
            <CardTitle className='text-base sm:text-lg'>{t.analytics.expenseBreakdown}</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseCategories && expenseCategories.length > 0 ? (
              <div className='space-y-2'>
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
                        {formatCurrency(cat.amount)}
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
            <CardTitle className='text-base sm:text-lg'>{t.analytics.incomeBreakdown}</CardTitle>
          </CardHeader>
          <CardContent>
            {incomeCategories && incomeCategories.length > 0 ? (
              <div className='space-y-2'>
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
                        {formatCurrency(cat.amount)}
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
