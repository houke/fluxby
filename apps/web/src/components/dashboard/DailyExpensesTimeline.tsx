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
  ResponsiveContainer,
} from 'recharts';
import { ArrowDownRight } from 'lucide-react';

interface DailyData {
  date: string;
  expenses: number;
}

interface DailyExpensesTimelineProps {
  dailyData: DailyData[];
  dailyScrollRef: React.RefObject<HTMLDivElement | null>;
  t: any;
  language: string;
  navigate: (path: string) => void;
  suggestedPeriod: { label: string } | null;
  isViewingSuggestedPeriod: boolean;
  handleJumpToPeriod: () => void;
}

export function DailyExpensesTimeline({
  dailyData,
  dailyScrollRef,
  t,
  language,
  navigate,
  suggestedPeriod,
  isViewingSuggestedPeriod,
  handleJumpToPeriod,
}: DailyExpensesTimelineProps) {
  return (
    <Card
      className='overflow-hidden rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
      data-onboarding='daily-expenses-chart'
    >
      <CardHeader>
        <CardTitle className='text-base sm:text-lg'>
          {t.dashboard.dailyExpenses}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {dailyData.reduce((sum, day) => sum + day.expenses, 0) > 0 ? (
          <div className='flex h-[200px] overflow-hidden'>
            {/* Fixed Y-Axis */}
            <div className='h-full w-[50px] flex-shrink-0 border-r bg-card'>
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
                  <Bar dataKey='expenses' fill='transparent' />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Scrollable Chart Content */}
            <div
              className='flex-1 overflow-x-auto overflow-y-hidden'
              ref={dailyScrollRef}
            >
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
                        <Currency key='amount' amount={value as number} />,
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
            </div>
          </div>
        ) : (
          <div className='flex h-[200px] items-center justify-center overflow-hidden text-muted-foreground'>
            <div className='flex flex-col items-center justify-center text-center'>
              <ArrowDownRight className='mb-4 h-12 w-12 text-muted-foreground/50' />
              <p className='text-muted-foreground'>{t.dashboard.noExpenses}</p>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
