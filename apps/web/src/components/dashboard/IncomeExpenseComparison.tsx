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

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

interface IncomeExpenseComparisonProps {
  monthlyData: MonthlyData[];
  monthlyComparisonScrollRef: React.RefObject<HTMLDivElement | null>;
  t: any;
}

export function IncomeExpenseComparison({
  monthlyData,
  monthlyComparisonScrollRef,
  t,
}: IncomeExpenseComparisonProps) {
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
                              {t.dashboard.income}: <Currency amount={income} />
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
  );
}
