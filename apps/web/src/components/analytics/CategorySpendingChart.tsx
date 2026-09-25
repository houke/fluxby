import { useState, useRef, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { Currency } from '@/components/ui/currency';

interface ParentCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface MonthlyExpenseData {
  month: string;
  [categoryName: string]: string | number;
}

interface CategorySpendingChartProps {
  data: MonthlyExpenseData[];
  parentCategories: ParentCategory[];
}

export function CategorySpendingChart({
  data,
  parentCategories,
}: CategorySpendingChartProps) {
  const { t } = useLanguage();
  const [disabledCategories, setDisabledCategories] = useState<Set<string>>(
    new Set()
  );
  const chartScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chart to the end when data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (chartScrollRef.current) {
        const el = chartScrollRef.current;
        el.scrollLeft = el.scrollWidth - el.clientWidth;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [data]);

  // Get all category names that actually have data (memoized)
  const categoriesWithData = useMemo(
    () =>
      parentCategories.filter((cat) =>
        data.some((d) => {
          const value = d[cat.name];
          return typeof value === 'number' && value > 0;
        })
      ),
    [data, parentCategories]
  );

  // Toggle category visibility
  const toggleCategory = (categoryName: string) => {
    setDisabledCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  // Filter out disabled categories from data for the chart (memoized)
  const filteredData = useMemo(
    () =>
      data.map((monthData) => {
        const filtered: MonthlyExpenseData = { month: monthData.month };
        for (const key of Object.keys(monthData)) {
          if (key === 'month') continue;
          if (!disabledCategories.has(key)) {
            filtered[key] = monthData[key];
          }
        }
        return filtered;
      }),
    [data, disabledCategories]
  );

  return (
    <div className='space-y-4'>
      {/* Chart */}
      <div className='flex h-[300px] overflow-hidden'>
        {/* Fixed Y-Axis */}
        <div className='h-full w-[50px] flex-shrink-0 border-r bg-card'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={filteredData}>
              <YAxis
                tickFormatter={(value) =>
                  value >= 1000
                    ? `€${(value / 1000).toFixed(0)}k`
                    : `€${Math.round(value)}`
                }
                tick={{
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              {categoriesWithData
                .filter((cat) => !disabledCategories.has(cat.name))
                .map((cat) => (
                  <Bar
                    key={cat.name}
                    dataKey={cat.name}
                    stackId='a'
                    fill='transparent'
                  />
                ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Scrollable Chart Content */}
        <div
          className='flex-1 overflow-x-auto overflow-y-hidden'
          ref={chartScrollRef}
        >
          <div
            style={{
              width: `${Math.max(12, data.length) * 50}px`,
              minWidth: '100%',
              height: '100%',
            }}
          >
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={filteredData}>
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
                <YAxis hide />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    if (typeof label !== 'string') return null;
                    const [year, month] = label.split('-');
                    const monthIdx = parseInt(month) - 1;
                    const monthName = t.common.months[monthIdx];

                    // Calculate total
                    const total = payload.reduce((sum, entry) => {
                      const value = entry.value as number;
                      return sum + (value || 0);
                    }, 0);

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
                        {payload
                          .slice()
                          .reverse()
                          .map((entry) => (
                            <p
                              key={entry.dataKey as string}
                              className='text-sm'
                              style={{ color: entry.color }}
                            >
                              {entry.dataKey as string}:{' '}
                              <Currency amount={entry.value as number} />
                            </p>
                          ))}
                        <p className='mt-1 border-t pt-1 text-sm font-semibold'>
                          {t.analytics?.total}: <Currency amount={total} />
                        </p>
                      </div>
                    );
                  }}
                  cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                />
                <ReferenceLine y={0} stroke='hsl(var(--border))' />
                {/* Year separator lines */}
                {data
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
                {/* Stacked bars for each category */}
                {categoriesWithData
                  .filter((cat) => !disabledCategories.has(cat.name))
                  .map((cat) => (
                    <Bar
                      key={cat.name}
                      dataKey={cat.name}
                      stackId='a'
                      fill={cat.color}
                      radius={[0, 0, 0, 0]}
                    />
                  ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Custom Legend */}
      <div
        className='flex flex-wrap gap-2 border-t pt-4'
        role='group'
        aria-label={t.analytics?.legendLabel}
      >
        {categoriesWithData.map((cat) => {
          const isDisabled = disabledCategories.has(cat.name);
          return (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.name)}
              aria-pressed={!isDisabled}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors ${
                isDisabled
                  ? 'bg-muted/50 text-muted-foreground line-through opacity-50'
                  : 'bg-muted/50 hover:bg-muted'
              }`}
            >
              <div
                className='h-3 w-3 flex-shrink-0 rounded-sm'
                style={{
                  backgroundColor: isDisabled
                    ? 'hsl(var(--muted-foreground))'
                    : cat.color,
                }}
              />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
