import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { getDataService } from '@/lib/db-singleton';
import type {
  AdvancedRuleInput,
  AllocationGroup,
} from '@/lib/data/household-budgets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
export function CategoryPlanning() {
  const { t } = useLanguage(),
    copy = t.householdBudget,
    { activeProfileId } = useProfile(),
    toast = useToast(),
    confirm = useConfirm(),
    client = useQueryClient(),
    service = getDataService();
  const [category, setCategory] = useState(''),
    [replacement, setReplacement] = useState(''),
    [busy, setBusy] = useState(false);
  const [rule, setRule] = useState<AdvancedRuleInput>({
    pattern: '',
    matchField: 'all',
    matchMode: 'contains',
    direction: 'any',
    categoryId: '',
    priority: 0,
  });
  const { data } = useQuery({
    queryKey: ['category-planning', activeProfileId],
    queryFn: async () => ({
      categories: await service.getCategories(true),
      preferences: await service.getCategoryPreferences(),
      rules: await service.getAdvancedCategoryRules(),
      accounts: await service.getAccounts(),
    }),
  });
  const { data: references } = useQuery({
    queryKey: ['category-references', activeProfileId, category],
    queryFn: () => service.getCategoryReferences(category),
    enabled: !!category,
  });
  const preference = data?.preferences.find((c) => c.category_id === category);
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
  const save = (
    input: Partial<{
      isFixed: boolean;
      allocationGroup: AllocationGroup;
      archived: boolean;
    }>
  ) =>
    run(() =>
      service.saveCategoryPreference(category, {
        isFixed: !!preference?.is_fixed,
        allocationGroup: preference?.allocation_group ?? 'needs',
        archived: !!preference?.archived,
        ...input,
      })
    );
  return (
    <Card data-onboarding='category-planning'>
      <CardHeader>
        <CardTitle>{copy.categories}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <label className='flex flex-wrap items-center gap-3'>
          {copy.category}
          <select
            className='rounded-md border bg-background p-2'
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setReplacement('');
            }}
          >
            <option value=''>{copy.category}</option>
            {data?.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {data.preferences.find((p) => p.category_id === c.id)?.archived
                  ? ` (${copy.archived})`
                  : ''}
              </option>
            ))}
          </select>
        </label>
        {category && (
          <div className='space-y-3'>
            <div className='flex flex-wrap items-center gap-3'>
              <label>
                <input
                  disabled={busy}
                  type='checkbox'
                  checked={!!preference?.is_fixed}
                  onChange={(e) => save({ isFixed: e.target.checked })}
                />{' '}
                {copy.fixed}
              </label>
              <select
                aria-label={copy.assigned}
                disabled={busy}
                value={preference?.allocation_group ?? 'needs'}
                onChange={(e) =>
                  save({ allocationGroup: e.target.value as AllocationGroup })
                }
              >
                {(['needs', 'wants', 'savings'] as const).map((g) => (
                  <option key={g} value={g}>
                    {copy[g]}
                  </option>
                ))}
              </select>
              {!!preference?.archived && (
                <Button
                  disabled={busy}
                  variant='outline'
                  onClick={() => save({ archived: false })}
                >
                  {copy.restore}
                </Button>
              )}
            </div>
            <p className='text-sm text-muted-foreground'>
              {copy.references}:{' '}
              {Object.values(references ?? {}).reduce((a, b) => a + b, 0)}
            </p>
            <label className='flex flex-wrap items-center gap-3'>
              {copy.replacement}
              <select
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
              >
                <option value=''>{copy.keepHistory}</option>
                {data?.categories
                  .filter((c) => c.id !== category)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
            <Button
              disabled={busy}
              variant='outline'
              onClick={async () => {
                if (
                  await confirm({
                    title: copy.retire,
                    message: copy.confirmRetire,
                    confirmLabel: copy.archive,
                  })
                )
                  await run(() =>
                    service.retireCategory(category, replacement || undefined)
                  );
              }}
            >
              {copy.archive}
            </Button>
          </div>
        )}
        <details>
          <summary className='cursor-pointer font-medium'>{copy.rules}</summary>
          <div className='mt-3 grid gap-3 sm:grid-cols-3'>
            <label>
              {copy.pattern}
              <Input
                value={rule.pattern}
                onChange={(e) => setRule({ ...rule, pattern: e.target.value })}
              />
            </label>
            <label>
              {copy.field}
              <select
                className='block w-full rounded border p-2'
                value={rule.matchField}
                onChange={(e) =>
                  setRule({
                    ...rule,
                    matchField: e.target
                      .value as AdvancedRuleInput['matchField'],
                  })
                }
              >
                {(['all', 'merchant', 'description'] as const).map((f) => (
                  <option key={f} value={f}>
                    {f === 'description' ? copy.descriptionField : copy[f]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {copy.pattern}
              <select
                className='block w-full rounded border p-2'
                value={rule.matchMode}
                onChange={(e) =>
                  setRule({
                    ...rule,
                    matchMode: e.target.value as 'contains' | 'regex',
                  })
                }
              >
                <option value='contains'>{copy.contains}</option>
                <option value='regex'>{copy.regex}</option>
              </select>
            </label>
            <label>
              {copy.direction}
              <select
                className='block w-full rounded border p-2'
                value={rule.direction}
                onChange={(e) =>
                  setRule({
                    ...rule,
                    direction: e.target.value as AdvancedRuleInput['direction'],
                  })
                }
              >
                {(['any', 'income', 'expense'] as const).map((d) => (
                  <option key={d} value={d}>
                    {copy[d]}
                  </option>
                ))}
              </select>
            </label>
            {(['minimumAmount', 'maximumAmount'] as const).map((k) => (
              <label key={k}>
                {k === 'minimumAmount' ? copy.minimum : copy.maximum}
                <Input
                  type='number'
                  min='0'
                  step='0.01'
                  value={rule[k] ?? ''}
                  onChange={(e) =>
                    setRule({
                      ...rule,
                      [k]:
                        e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                />
              </label>
            ))}
            <label>
              {copy.account}
              <select
                className='block w-full rounded border p-2'
                value={rule.accountId ?? ''}
                onChange={(e) =>
                  setRule({ ...rule, accountId: e.target.value || null })
                }
              >
                <option value=''>{copy.anyAccount}</option>
                {data?.accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {copy.category}
              <select
                className='block w-full rounded border p-2'
                value={rule.categoryId}
                onChange={(e) =>
                  setRule({ ...rule, categoryId: e.target.value })
                }
              >
                <option value=''>{copy.category}</option>
                {data?.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {copy.priority}
              <Input
                type='number'
                value={rule.priority}
                onChange={(e) =>
                  setRule({ ...rule, priority: Number(e.target.value) })
                }
              />
            </label>
          </div>
          <div className='my-3 flex gap-3'>
            <Button
              disabled={busy || !rule.pattern || !rule.categoryId}
              onClick={() =>
                run(() => service.createAdvancedCategoryRule(rule))
              }
            >
              {copy.addRule}
            </Button>
            <Button
              disabled={busy}
              variant='outline'
              onClick={() => run(() => service.applyAdvancedCategoryRules())}
            >
              {copy.applyRules}
            </Button>
          </div>
          {data?.rules.map((r) => (
            <div
              className='flex items-center justify-between border-t py-2'
              key={r.id}
            >
              <span>
                {r.pattern} →{' '}
                {data.categories.find((c) => c.id === r.categoryId)?.name}
              </span>
              <Button
                variant='ghost'
                disabled={busy}
                onClick={async () => {
                  if (
                    await confirm({
                      title: copy.delete,
                      message: copy.confirmDelete,
                      confirmLabel: copy.delete,
                      variant: 'danger',
                    })
                  )
                    await run(() => service.deleteAdvancedCategoryRule(r.id));
                }}
              >
                {copy.delete}
              </Button>
            </div>
          ))}
        </details>
      </CardContent>
    </Card>
  );
}
