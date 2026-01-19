import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Currency } from '@/components/ui/currency';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ArrowLeftRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

interface IncomeExpenseComparisonProps {
  monthlyData: MonthlyData[];
  monthlyComparisonScrollRef: React.RefObject<HTMLDivElement | null>;
  t: any;
  navigate: (path: string) => void;
  suggestedPeriod: { start: Date; end: Date; label: string } | null;
  isViewingSuggestedPeriod: boolean;
  handleJumpToPeriod: () => void;
}

export function IncomeExpenseComparison({
  monthlyData,
  monthlyComparisonScrollRef,
  t,
  navigate,
  suggestedPeriod,
  isViewingSuggestedPeriod,
  handleJumpToPeriod,
}: IncomeExpenseComparisonProps) {
  const isMobile = useIsMobile();

  // On mobile, show fewer months to fit bars in the card without scrolling
  const mobileBarWidth = 35; // Width per month on mobile
  const desktopBarWidth = 60; // Width per month on desktop

  return (
    <Card
      className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
      data-onboarding='income-expenses-chart'
    >
      <CardHeader>
        <CardTitle className='text-base sm:text-lg'>
          {t.dashboard.incomeVsExpenses}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {monthlyData.length > 0 ? (
          <div className='flex h-[300px] overflow-hidden'>
            {/* Fixed Y-Axis */}
            <div className='h-full w-[50px] flex-shrink-0 border-r bg-card'>
              <ResponsiveContainer
                width='100%'
                height='100%'
                minHeight={1}
                minWidth={1}
              >
                <BarChart data={monthlyData}>
                  <YAxis
                    width={50}
                    tickFormatter={(value) =>
                      value >= 1000
                        ? `€${(value / 1000).toFixed(0)}k`
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
                        if (dataMax <= 1000)
                          return Math.ceil(dataMax / 100) * 100;
                        if (dataMax <= 5000)
                          return Math.ceil(dataMax / 500) * 500;
                        if (dataMax <= 10000)
                          return Math.ceil(dataMax / 1000) * 1000;
                        return Math.ceil(dataMax / 5000) * 5000;
                      },
                    ]}
                    allowDecimals={false}
                  />
                  <Bar dataKey='income' fill='transparent' />
                  <Bar dataKey='expenses' fill='transparent' />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Scrollable Chart Content */}
            <div
              className='flex-1 overflow-x-auto overflow-y-hidden'
              ref={monthlyComparisonScrollRef}
              data-testid='monthly-comparison-scroll'
            >
              <div
                style={{
                  width: isMobile
                    ? `${Math.max(280, monthlyData.length * mobileBarWidth)}px`
                    : `${Math.max(720, monthlyData.length * desktopBarWidth)}px`,
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
                  <BarChart data={monthlyData} barGap={isMobile ? 1 : 4}>
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
                      tick={{
                        fill: 'hsl(var(--muted-foreground))',
                        fontSize: isMobile ? 10 : 12,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      hide
                      domain={[
                        0,
                        (dataMax: number) => {
                          if (dataMax <= 1000)
                            return Math.ceil(dataMax / 100) * 100;
                          if (dataMax <= 5000)
                            return Math.ceil(dataMax / 500) * 500;
                          if (dataMax <= 10000)
                            return Math.ceil(dataMax / 1000) * 1000;
                          return Math.ceil(dataMax / 5000) * 5000;
                        },
                      ]}
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
                                {t.dashboard.income}:{' '}
                                <Currency amount={income} />
                              </p>
                              <p className='text-rose-600'>
                                {t.dashboard.expenses}:{' '}
                                <Currency amount={expenses} />
                              </p>
                              <p
                                className={`mt-1 border-t pt-1 font-semibold ${
                                  balance >= 0
                                    ? 'text-emerald-600'
                                    : 'text-rose-600'
                                }`}
                              >
                                {t.common.total}: <Currency amount={balance} />
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                    <Bar
                      dataKey='income'
                      name={t.dashboard.income}
                      fill='#10B981'
                      radius={[4, 4, 0, 0]}
                      activeBar={{ fill: '#047857' }}
                      maxBarSize={isMobile ? 12 : 40}
                    />
                    <Bar
                      dataKey='expenses'
                      name={t.dashboard.expenses}
                      fill='#F43F5E'
                      radius={[4, 4, 0, 0]}
                      activeBar={{ fill: '#B91C1C' }}
                      maxBarSize={isMobile ? 12 : 40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className='flex h-[300px] flex-col items-center justify-center text-center'>
            <ArrowLeftRight className='mb-4 h-12 w-12 text-muted-foreground/50' />
            <p className='text-muted-foreground'>
              {t.dashboard.noComparison || 'Geen data beschikbaar'}
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
                    {(t.dashboard?.jumpToPeriod || 'Jump to {period}').replace(
                      '{period}',
                      suggestedPeriod.label
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
