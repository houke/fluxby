import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDateISO } from '@fluxby/shared';
import { getDataService } from '@/lib/db-singleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Currency } from '@/components/ui/currency';
import { analyzeCashflow } from '@/lib/cashflow-analysis';
export function CashflowAnalysis({ month }: { month: string }) {
  const { t, language } = useLanguage(),
    copy = t.transactionReview,
    { activeProfileId } = useProfile();
  const [horizon, setHorizon] = useState<3 | 6 | 12>(3);
  const data = useQuery({
    queryKey: ['cashflowAnalysis', activeProfileId],
    queryFn: async () => ({
      rows: await getDataService().getReviewTransactions(),
      links: await getDataService().getTransactionLinks(),
    }),
    enabled: !!activeProfileId,
  });
  if (data.isLoading) return <p aria-busy='true'>{t.common.loading}</p>;
  if (!data.data) return <p role='alert'>{copy.loadError}</p>;
  const result = analyzeCashflow(
    data.data.rows,
    data.data.links,
    month,
    horizon,
    formatDateISO(new Date())
  );
  const points = [
    {
      label: copy.flowIncome,
      start: 0,
      end: result.income,
      amount: result.income,
    },
    ...result.steps.map((s) => ({ ...s, label: s.label || copy.noCategory })),
    {
      label: copy.flowRemaining,
      start: 0,
      end: result.net,
      amount: result.net,
    },
  ];
  const minimum = Math.min(0, ...points.flatMap((p) => [p.start, p.end])),
    maximum = Math.max(1, ...points.flatMap((p) => [p.start, p.end])),
    range = maximum - minimum;
  return (
    <section
      className='space-y-4 rounded-xl border bg-card p-4'
      data-onboarding='cashflow-analysis'
    >
      <h3 className='font-semibold'>
        {copy.cashflow} · {month}
      </h3>
      <p className='text-sm text-muted-foreground'>{copy.refundPolicy}</p>
      <div className='space-y-2' role='img' aria-label={copy.cashflow}>
        {points.map((point, i) => (
          <div
            key={`${point.label}-${i}`}
            className='grid grid-cols-[minmax(90px,1fr)_2fr_minmax(80px,1fr)] items-center gap-3 text-sm'
          >
            <span className='truncate'>{point.label}</span>
            <div className='relative h-5 rounded bg-muted'>
              <span
                className='absolute h-full border-l border-foreground/40'
                style={{ left: `${(-minimum / range) * 100}%` }}
              />
              <span
                className={`absolute h-full rounded ${i === 0 ? 'bg-emerald-600' : i === points.length - 1 ? 'bg-primary' : 'bg-orange-500'}`}
                style={{
                  left: `${((Math.min(point.start, point.end) - minimum) / range) * 100}%`,
                  width: `${Math.max(0.3, (Math.abs(point.end - point.start) / range) * 100)}%`,
                }}
              />
            </div>
            <span className='text-right'>
              <Currency amount={point.amount} />
            </span>
          </div>
        ))}
      </div>
      <label className='flex flex-wrap items-center gap-2 text-sm'>
        {copy.baseline}
        <select
          className='rounded-md border bg-background p-2'
          value={horizon}
          onChange={(e) => setHorizon(Number(e.target.value) as 3 | 6 | 12)}
        >
          {([3, 6, 12] as const).map((n) => (
            <option key={n} value={n}>
              {n} {copy.months}
            </option>
          ))}
        </select>
      </label>
      <p className='text-sm'>
        {copy.comparable
          .replace('{day}', String(result.elapsed))
          .replace('{count}', String(result.baselineMonths))}
      </p>
      {result.baseline !== null ? (
        <p>
          {copy.average}: <Currency amount={result.baseline} />
          {result.delta !== null && (
            <>
              {' '}
              · {copy.change}:{' '}
              {new Intl.NumberFormat(language === 'nl' ? 'nl-NL' : 'en-GB', {
                maximumFractionDigits: 1,
                signDisplay: 'always',
              }).format(result.delta)}
              %
            </>
          )}
        </p>
      ) : (
        <p>{copy.notEnoughHistory}</p>
      )}
      {result.baselineMonths < horizon && (
        <p className='text-sm text-muted-foreground'>{copy.limitedHistory}</p>
      )}
    </section>
  );
}
