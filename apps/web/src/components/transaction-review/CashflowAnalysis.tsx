import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDateISO } from '@fluxby/shared';
import { getDataService } from '@/lib/db-singleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Currency } from '@/components/ui/currency';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { analyzeCashflow } from '@/lib/cashflow-analysis';
import { ReviewSelect } from './ReviewSelect';

export function CashflowAnalysis({ month }: { month: string }) {
  const { t, language } = useLanguage(),
    copy = t.transactionReview,
    { activeProfileId } = useProfile();
  const [horizon, setHorizon] = useState<3 | 6 | 12>(3);
  const data = useQuery({
    queryKey: ['cashflowAnalysis', activeProfileId],
    queryFn: async () => {
      const service = getDataService();
      const [rows, links, extensions] = await Promise.all([
        service.getReviewTransactions(),
        service.getTransactionLinks(),
        service.getBudgetExtensions(),
      ]);
      return { rows, links, categories: extensions.categories };
    },
    enabled: !!activeProfileId,
  });
  const result = data.data
    ? analyzeCashflow(
        data.data.rows,
        data.data.links,
        month,
        horizon,
        formatDateISO(new Date()),
        data.data.categories
      )
    : null;
  const points = result
    ? [
        {
          label: copy.flowIncome,
          start: 0,
          end: result.income,
          amount: result.income,
          color: 'bg-emerald-600',
        },
        {
          label: copy.flowFixed,
          start: result.income,
          end: result.income - result.fixedExpenses,
          amount: result.fixedExpenses,
          color: 'bg-orange-500',
        },
        {
          label: copy.flowVariable,
          start: result.income - result.fixedExpenses,
          end: result.income - result.fixedExpenses - result.variableExpenses,
          amount: result.variableExpenses,
          color: 'bg-amber-500',
        },
        {
          label: copy.flowSavings,
          start: result.income - result.fixedExpenses - result.variableExpenses,
          end: result.net,
          amount: result.savingsExpenses,
          color: 'bg-purple-500',
        },
        {
          label: copy.flowRemaining,
          start: 0,
          end: result.net,
          amount: result.net,
          color: result.net < 0 ? 'bg-red-600' : 'bg-primary',
        },
      ]
    : [];
  const minimum = Math.min(
      0,
      ...points.flatMap((point) => [point.start, point.end])
    ),
    maximum = Math.max(
      1,
      ...points.flatMap((point) => [point.start, point.end])
    ),
    range = maximum - minimum;
  return (
    <Card data-onboarding='cashflow-analysis'>
      <CardHeader>
        <CardTitle>
          {copy.cashflow} · {month}
        </CardTitle>
        <CardDescription>
          {copy.refundPolicy} {copy.flowGroupingHelp}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {data.isLoading ? (
          <p aria-busy='true'>{t.common.loading}</p>
        ) : data.isError || !result ? (
          <div
            role='alert'
            className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm'
          >
            {copy.loadError}
            <Button
              variant='outline'
              size='sm'
              onClick={() => void data.refetch()}
            >
              {copy.reload}
            </Button>
          </div>
        ) : (
          <>
            <div className='space-y-3' aria-label={copy.cashflow}>
              {points.map((point) => (
                <div
                  key={point.label}
                  className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[minmax(120px,1fr)_2fr_minmax(90px,1fr)]'
                >
                  <span>{point.label}</span>
                  <div
                    className='relative col-span-2 row-start-2 h-5 rounded bg-muted sm:col-span-1 sm:row-start-auto'
                    aria-hidden='true'
                  >
                    <span
                      className='absolute h-full border-l border-foreground/40'
                      style={{ left: `${(-minimum / range) * 100}%` }}
                    />
                    <span
                      className={`absolute h-full rounded ${point.color}`}
                      style={{
                        left: `${((Math.min(point.start, point.end) - minimum) / range) * 100}%`,
                        width: `${(Math.abs(point.end - point.start) / range) * 100}%`,
                      }}
                    />
                  </div>
                  <span className='text-right'>
                    <Currency amount={point.amount} />
                  </span>
                </div>
              ))}
            </div>
            <div className='max-w-xs'>
              <ReviewSelect
                label={copy.baseline}
                value={String(horizon)}
                onChange={(value) => setHorizon(Number(value) as 3 | 6 | 12)}
                options={([3, 6, 12] as const).map((value) => ({
                  value: String(value),
                  label: `${value} ${copy.months}`,
                }))}
              />
            </div>
            <p className='text-sm'>
              {copy.comparable
                .replace('{day}', String(result.elapsed))
                .replace('{count}', String(result.baselineMonths))}
            </p>
            {result.baseline !== null ? (
              <p className='text-sm'>
                {copy.average}: <Currency amount={result.baseline} />
                {result.delta !== null && (
                  <>
                    {' '}
                    · {copy.change}:{' '}
                    {new Intl.NumberFormat(
                      language === 'nl' ? 'nl-NL' : 'en-GB',
                      { maximumFractionDigits: 1, signDisplay: 'always' }
                    ).format(result.delta)}
                    %
                  </>
                )}
              </p>
            ) : (
              <p className='text-sm text-muted-foreground'>
                {copy.notEnoughHistory}
              </p>
            )}
            {result.baselineMonths < horizon && (
              <p className='text-sm text-muted-foreground'>
                {copy.limitedHistory}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
