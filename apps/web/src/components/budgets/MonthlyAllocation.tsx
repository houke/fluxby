import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  formatCurrency,
  formatDateISO,
  type BudgetWithStats,
} from '@fluxby/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/contexts/ToastContext';
import { getDataService } from '@/lib/db-singleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
export function MonthlyAllocation() {
  const { t } = useLanguage(),
    copy = t.householdBudget,
    { activeProfileId } = useProfile(),
    toast = useToast(),
    client = useQueryClient();
  const [month, setMonth] = useState(formatDateISO(new Date()).slice(0, 7)),
    [income, setIncome] = useState(''),
    [drafts, setDrafts] = useState<Record<string, string>>({}),
    [baseline, setBaseline] = useState<3 | 6 | 12>(3),
    [busy, setBusy] = useState(false);
  const service = getDataService();
  const { data } = useQuery({
    queryKey: ['monthly-allocation', activeProfileId, month, baseline],
    queryFn: async () => ({
      budgets: await service.getBudgets(month),
      extensions: await service.getBudgetExtensions(),
      income: await service.getBudgetIncomePlan(month),
      commitments: await service.getBudgetCommitments(),
      suggestions: await service.getMonthlyBudgetSuggestions(baseline),
    }),
  });
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
      await client.invalidateQueries();
      toast.success(copy.saved);
    } catch {
      toast.error(copy.failed);
    } finally {
      setBusy(false);
    }
  };
  const assigned = (data?.budgets ?? []).reduce(
    (n, b) => n + b.amount - (b.carryover ?? 0),
    0
  );
  const grouped = { needs: 0, wants: 0, savings: 0 };
  for (const budget of data?.budgets ?? []) {
    const group =
      data?.extensions.categories.find(
        (c) => c.category_id === budget.categoryId
      )?.allocation_group ?? 'needs';
    grouped[group] += budget.amount - (budget.carryover ?? 0);
  }
  return (
    <Card data-onboarding='budget-monthly-allocation'>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <p className='text-sm text-muted-foreground'>{copy.description}</p>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex flex-wrap items-end gap-3'>
          <label>
            {copy.month}
            <Input
              type='month'
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setIncome('');
                setDrafts({});
              }}
            />
          </label>
          <label>
            {copy.expectedIncome}
            <Input
              type='number'
              min='0'
              step='0.01'
              value={income || String(data?.income ?? 0)}
              onChange={(e) => setIncome(e.target.value)}
            />
          </label>
          <Button
            disabled={busy}
            onClick={() =>
              run(() =>
                service.saveBudgetIncomePlan(
                  month,
                  Number(income || data?.income || 0)
                )
              )
            }
          >
            {copy.save}
          </Button>
          <Button
            variant='outline'
            disabled={busy}
            onClick={() => run(async()=>{await service.copyPreviousBudgetMonth(month);setDrafts({});})}
          >
            {copy.copy}
          </Button>
        </div>
        <dl className='grid grid-cols-2 gap-3 sm:grid-cols-5'>
          {(
            [
              ['assigned', assigned],
              ['unassigned', (data?.income ?? 0) - assigned],
              ...Object.entries(grouped),
            ] as [keyof typeof copy, number][]
          ).map(([key, value]) => (
            <div key={key}>
              <dt className='text-sm text-muted-foreground'>{copy[key]}</dt>
              <dd className='font-semibold'>{formatCurrency(value)}</dd>
            </div>
          ))}
        </dl>
        <div className='space-y-3'>
          {data?.budgets
            .filter((b) => b.period === 'monthly')
            .map((b: BudgetWithStats) => (
              <div
                key={b.id}
                className='flex flex-wrap items-center gap-2 border-t pt-3'
              >
                <span className='min-w-32 flex-1'>
                  {b.categoryName ?? copy.total}
                </span>
                <Input
                  className='w-28'
                  type='number'
                  min='0'
                  step='0.01'
                  aria-label={`${b.categoryName} — ${copy.override}`}
                  value={drafts[b.id] ?? String(b.amount - (b.carryover ?? 0))}
                  onChange={(e) =>
                    setDrafts({ ...drafts, [b.id]: e.target.value })
                  }
                />
                <Button
                  variant='outline'
                  disabled={busy}
                  onClick={() =>
                    run(() =>
                      service.setBudgetMonth(
                        b.id,
                        month,
                        Number(drafts[b.id] ?? b.amount - (b.carryover ?? 0))
                      )
                    )
                  }
                >
                  {copy.save}
                </Button>
                <Button
                  variant='ghost'
                  disabled={busy}
                  onClick={() =>
                    run(async () => {await service.setBudgetMonth(b.id, month, null);setDrafts(current=>{const next={...current};delete next[b.id];return next;});})
                  }
                >
                  {copy.reset}
                </Button>
                {b.rolloverEnabled && (
                  <label className='flex items-center gap-2 text-sm'>
                    <input
                      type='checkbox'
                      checked={
                        !!data.extensions.preferences.find(
                          (p) => p.budget_id === b.id
                        )?.carry_negative
                      }
                      onChange={(e) =>
                        run(() =>
                          service.setBudgetNegativeRollover(
                            b.id,
                            e.target.checked
                          )
                        )
                      }
                    />
                    {copy.negativeRollover}
                  </label>
                )}
              </div>
            ))}
        </div>
        {data && <p className='text-sm text-muted-foreground'>{copy.commitments}: {formatCurrency(data.commitments.bills+data.commitments.reserves)} · {copy.goals}: {formatCurrency(data.commitments.goals)}. {copy.commitmentsNote}</p>}
        <details>
          <summary className='cursor-pointer font-medium'>
            {copy.suggestions}
          </summary>
          <label className='my-3 flex items-center gap-2'>
            {copy.baseline}
            <select
              value={baseline}
              onChange={(e) =>
                setBaseline(Number(e.target.value) as 3 | 6 | 12)
              }
            >
              {[3, 6, 12].map((n) => (
                <option key={n} value={n}>
                  {n} {copy.months}
                </option>
              ))}
            </select>
          </label>
          {data?.suggestions.some((s) => s.limitedHistory) && (
            <p className='text-sm text-muted-foreground'>
              {copy.limitedHistory}
            </p>
          )}
          {data?.suggestions.map((s) => (
            <div
              className='flex items-center justify-between py-2'
              key={s.categoryId}
            >
              <span>
                {s.categoryName}: {formatCurrency(s.suggestedAmount)}
              </span>
              <Button
                variant='outline'
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const existing = data.budgets.find(
                      (b) => b.categoryId === s.categoryId
                    );
                    if (existing)
                      await service.setBudgetMonth(
                        existing.id,
                        month,
                        s.suggestedAmount
                      );
                    else
                      await service.createBudget({
                        categoryId: s.categoryId,
                        amount: s.suggestedAmount,
                      });
                  })
                }
              >
                {copy.useSuggestion}
              </Button>
            </div>
          ))}
        </details>
      </CardContent>
    </Card>
  );
}
