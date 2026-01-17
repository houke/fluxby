import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Currency } from '@/components/ui/currency';
import { ArrowUpRight } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import type { TranslationKeys } from '@/lib/i18n/nl';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface MonthlyIncomeChartProps {
  monthlyData: Array<{
    month: string;
    income: number;
    expenses: number;
    balance: number;
  }>;
  monthlyIncomeScrollRef: React.RefObject<HTMLDivElement | null>;
  monthlyIncomeInnerRef: React.RefObject<HTMLDivElement | null>;
  t: TranslationKeys;
  navigate: (path: string) => void;
  suggestedPeriod: {
    start: Date;
    end: Date;
    label: string;
  } | null;
  isViewingSuggestedPeriod: boolean;
  handleJumpToPeriod: () => void;
}

export function MonthlyIncomeChart({
  monthlyData,
  monthlyIncomeScrollRef,
  monthlyIncomeInnerRef,
  t,
  navigate,
  suggestedPeriod,
  isViewingSuggestedPeriod,
  handleJumpToPeriod,
}: MonthlyIncomeChartProps) {
  const hasIncome = monthlyData.reduce((sum, d) => sum + d.income, 0) > 0;
  const isMobile = useIsMobile();

  return (
    <Card
      className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
      data-onboarding='monthly-income-chart'
    >
      <CardHeader>
        <CardTitle className='text-base sm:text-lg'>
          {t.dashboard.monthlyIncome}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasIncome ? (
          <div
            className={`h-[300px] overflow-y-hidden ${
              monthlyData.length > 12 ? 'overflow-x-auto' : 'overflow-x-hidden'
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
                      <stop offset='5%' stopColor='#8B5CF6' stopOpacity={0.3} />
                      <stop offset='95%' stopColor='#8B5CF6' stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                    tickFormatter={(value) =>
                      value >= 1000
                        ? `€${(value / 1000).toFixed(0)}k`
                        : `€${value}`
                    }
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: isMobile ? 9 : 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 'auto']}
                    width={isMobile ? 35 : 50}
                  />
                  <Tooltip
                    formatter={(value) => [
                      <Currency key='amount' amount={value as number} />,
                      t.dashboard.income,
                    ]}
                    labelFormatter={(label) => {
                      if (typeof label !== 'string') return '';
                      const [year, month] = label.split('-');
                      return `${t.common.months[parseInt(month) - 1]} ${year}`;
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
