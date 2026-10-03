import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDateISO, type BudgetWithStats } from '@fluxby/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/contexts/ToastContext';
import { getDataService } from '@/lib/db-singleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormSelect } from '@/components/ui/form-select';
import { Currency } from '@/components/ui/currency';
export function MonthlyAllocation() {
  const { t } = useLanguage(),
    copy = t.householdBudget,
    { activeProfileId } = useProfile(),
    toast = useToast(),
    client = useQueryClient();
  const [month, setMonth] = useState(formatDateISO(new Date()).slice(0, 7)),
    [income, setIncome] = useState<string | null>(null),
    [drafts, setDrafts] = useState<Record<string, string>>({}),
    [baseline, setBaseline] = useState<3 | 6 | 12>(3),
    [busy, setBusy] = useState(false);
  const service = getDataService();
  const { data, isError } = useQuery({
    queryKey: ['monthly-allocation', activeProfileId, month, baseline],
    queryFn: async () => ({
      budgets: await service.getBudgets(month),
      categories: await service.getCategories(true),
      extensions: await service.getBudgetExtensions(),
      income: await service.getBudgetIncomePlan(month),
      commitments: await service.getBudgetCommitments(),
      suggestions: await service.getMonthlyBudgetSuggestions(baseline),
    }),
    enabled: Boolean(activeProfileId) && /^\d{4}-(0[1-9]|1[0-2])$/.test(month),
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
  const monthlyBudgets = (data?.budgets ?? []).filter(
    (budget) => budget.period === 'monthly'
  );
  const assigned = monthlyBudgets.reduce(
    (n, b) => n + b.amount - (b.carryover ?? 0),
    0
  );
  const grouped = { needs: 0, wants: 0, savings: 0 };
  for (const budget of monthlyBudgets) {
    const category = data?.categories.find(
      (item) => item.id === budget.categoryId
    );
    const group =
      data?.extensions.categories.find(
        (c) => c.category_id === budget.categoryId
      )?.allocation_group ??
      data?.extensions.categories.find(
        (c) => c.category_id === category?.parentId
      )?.allocation_group ??
      'needs';
    grouped[group] += budget.amount - (budget.carryover ?? 0);
  }
  return (
    <Card
      data-onboarding='budget-monthly-allocation'
      className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
    >
      <CardHeader className='px-3 sm:px-6'>
        <CardTitle className='text-base sm:text-lg'>{copy.title}</CardTitle>
        <p className='text-sm text-muted-foreground'>{copy.description}</p>
      </CardHeader>
      <CardContent className='space-y-4 px-3 sm:px-6'>
        {isError && (
          <p role='alert' className='text-destructive'>
            {copy.failed}
          </p>
        )}
        <form
          className='flex flex-wrap items-end gap-3'
          onSubmit={(event) => {
            event.preventDefault();
            void run(() =>
              service.saveBudgetIncomePlan(
                month,
                Number(income ?? data?.income ?? 0)
              )
            );
          }}
        >
          <label className='space-y-2 text-sm font-medium'>
            {copy.month}
            <Input
              type='month'
              required
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setIncome(null);
                setDrafts({});
              }}
            />
          </label>
          <label className='space-y-2 text-sm font-medium'>
            {copy.expectedIncome}
            <Input
              type='number'
              min='0'
              step='0.01'
              required
              value={income ?? String(data?.income ?? 0)}
              onChange={(e) => setIncome(e.target.value)}
            />
          </label>
          <Button type='submit' disabled={busy || !data}>
            {copy.save}
          </Button>
          <Button
            type='button'
            variant='outline'
            disabled={busy || !data}
            onClick={() =>
              run(async () => {
                await service.copyPreviousBudgetMonth(month);
                setDrafts({});
              })
            }
          >
            {copy.copy}
          </Button>
        </form>
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
              <dd className='font-semibold'>
                <Currency amount={value} />
              </dd>
            </div>
          ))}
        </dl>
        <p className='text-sm text-muted-foreground'>{copy.monthlyOnly}</p>
        <div className='space-y-3'>
          {monthlyBudgets.map((b: BudgetWithStats) => (
            <form
              key={b.id}
              className='flex flex-wrap items-center gap-2 border-t pt-3'
              onSubmit={(event) => {
                event.preventDefault();
                void run(() =>
                  service.setBudgetMonth(
                    b.id,
                    month,
                    Number(drafts[b.id] ?? b.amount - (b.carryover ?? 0))
                  )
                );
              }}
            >
              <span className='min-w-32 flex-1'>
                {b.categoryName ?? copy.total}
              </span>
              <Input
                className='w-28'
                type='number'
                min='0'
                step='0.01'
                required
                aria-label={`${b.categoryName} — ${copy.override}`}
                value={drafts[b.id] ?? String(b.amount - (b.carryover ?? 0))}
                onChange={(e) =>
                  setDrafts({ ...drafts, [b.id]: e.target.value })
                }
              />
              <Button variant='outline' type='submit' disabled={busy}>
                {copy.save}
              </Button>
              <Button
                type='button'
                variant='ghost'
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await service.setBudgetMonth(b.id, month, null);
                    setDrafts((current) => {
                      const next = { ...current };
                      delete next[b.id];
                      return next;
                    });
                  })
                }
              >
                {copy.reset}
              </Button>
              {b.rolloverEnabled && (
                <label className='flex items-center gap-2 text-sm'>
                  <Checkbox
                    disabled={busy}
                    checked={
                      !!data?.extensions.preferences.find(
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
            </form>
          ))}
        </div>
        {monthlyBudgets.some((budget) => budget.rolloverEnabled) && (
          <p className='text-sm text-muted-foreground'>
            {copy.negativeRolloverHelp}
          </p>
        )}
        {data && (
          <p className='text-sm text-muted-foreground'>
            {copy.commitments}:{' '}
            <Currency
              amount={data.commitments.bills + data.commitments.reserves}
            />{' '}
            · {copy.goals}: <Currency amount={data.commitments.goals} />.{' '}
            {copy.commitmentsNote}
          </p>
        )}
        <details>
          <summary className='cursor-pointer font-medium'>
            {copy.suggestions}
          </summary>
          <label className='my-3 block max-w-xs space-y-2 text-sm font-medium'>
            {copy.baseline}
            <FormSelect
              label={copy.baseline}
              value={String(baseline)}
              onChange={(value) => setBaseline(Number(value) as 3 | 6 | 12)}
              options={[3, 6, 12].map((n) => ({
                value: String(n),
                label: `${n} ${copy.months}`,
              }))}
            />
          </label>
          {data?.suggestions.some((s) => s.limitedHistory) && (
            <p className='text-sm text-muted-foreground'>
              {copy.limitedHistory}
            </p>
          )}
          {data?.suggestions.map((s) => (
            <div
              className='flex flex-wrap items-center justify-between gap-3 border-t py-3'
              key={s.categoryId}
            >
              <span>
                {s.categoryName}: <Currency amount={s.suggestedAmount} />
              </span>
              <Button
                variant='outline'
                disabled={busy}
                onClick={() =>
                  run(() =>
                    service.applyMonthlyBudgetSuggestion(
                      s.categoryId,
                      month,
                      s.suggestedAmount
                    )
                  )
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
