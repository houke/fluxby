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
import { Checkbox } from '@/components/ui/checkbox';
import { FormSelect } from '@/components/ui/form-select';
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
  const { data, isError } = useQuery({
    queryKey: ['category-planning', activeProfileId],
    queryFn: async () => ({
      categories: await service.getCategories(true),
      preferences: await service.getCategoryPreferences(),
      rules: await service.getAdvancedCategoryRules(),
      accounts: await service.getAccounts(),
    }),
    enabled: Boolean(activeProfileId),
  });
  const { data: references } = useQuery({
    queryKey: ['category-references', activeProfileId, category],
    queryFn: () => service.getCategoryReferences(category),
    enabled: Boolean(activeProfileId) && !!category,
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
    <Card
      data-onboarding='category-planning'
      className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
    >
      <CardHeader className='px-3 sm:px-6'>
        <CardTitle className='text-base sm:text-lg'>
          {copy.categories}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 px-3 sm:px-6'>
        {isError && (
          <p role='alert' className='text-destructive dark:text-red-400'>
            {copy.failed}
          </p>
        )}
        <label className='block max-w-md space-y-2 text-sm font-medium'>
          {copy.category}
          <FormSelect
            label={copy.category}
            disabled={busy}
            value={category}
            onChange={(value) => {
              setCategory(value);
              setReplacement('');
            }}
            options={[
              { value: '', label: copy.category },
              ...(data?.categories ?? []).map((c) => ({
                value: c.id,
                label:
                  c.name +
                  (data?.preferences.find((p) => p.category_id === c.id)
                    ?.archived
                    ? ` (${copy.archived})`
                    : ''),
              })),
            ]}
          />
        </label>
        {category && (
          <div className='space-y-3'>
            <div className='flex flex-wrap items-center gap-3'>
              <label className='flex items-center gap-2 text-sm'>
                <Checkbox
                  disabled={busy}
                  checked={!!preference?.is_fixed}
                  onChange={(e) => save({ isFixed: e.target.checked })}
                />{' '}
                {copy.fixed}
              </label>
              <FormSelect
                label={copy.assigned}
                disabled={busy}
                value={preference?.allocation_group ?? 'needs'}
                onChange={(value) =>
                  save({ allocationGroup: value as AllocationGroup })
                }
                options={(['needs', 'wants', 'savings'] as const).map(
                  (group) => ({ value: group, label: copy[group] })
                )}
              />
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
              {copy.fixedParentHelp}
            </p>
            <p className='text-sm text-muted-foreground'>
              {copy.references}:{' '}
              {Object.values(references ?? {}).reduce((a, b) => a + b, 0)}
            </p>
            <label className='block max-w-md space-y-2 text-sm font-medium'>
              {copy.replacement}
              <FormSelect
                label={copy.replacement}
                disabled={busy}
                value={replacement}
                onChange={setReplacement}
                options={[
                  { value: '', label: copy.keepHistory },
                  ...(data?.categories ?? [])
                    .filter(
                      (c) =>
                        c.id !== category &&
                        !data?.preferences.find((p) => p.category_id === c.id)
                          ?.archived
                    )
                    .map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
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
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                await service.createAdvancedCategoryRule(rule);
                setRule({ ...rule, pattern: '' });
              });
            }}
          >
            <div className='mt-3 grid gap-3 sm:grid-cols-3'>
              <label className='block space-y-2 text-sm font-medium'>
                {copy.pattern}
                <Input
                  value={rule.pattern}
                  onChange={(e) =>
                    setRule({ ...rule, pattern: e.target.value })
                  }
                />
              </label>
              <label className='block space-y-2 text-sm font-medium'>
                {copy.field}
                <FormSelect
                  label={copy.field}
                  value={rule.matchField}
                  onChange={(value) =>
                    setRule({
                      ...rule,
                      matchField: value as AdvancedRuleInput['matchField'],
                    })
                  }
                  options={(['all', 'merchant', 'description'] as const).map(
                    (field) => ({
                      value: field,
                      label:
                        field === 'description'
                          ? copy.descriptionField
                          : copy[field],
                    })
                  )}
                />
              </label>
              <label className='block space-y-2 text-sm font-medium'>
                {copy.matchMode}
                <FormSelect
                  label={copy.matchMode}
                  value={rule.matchMode}
                  onChange={(value) =>
                    setRule({
                      ...rule,
                      matchMode: value as 'contains' | 'regex',
                    })
                  }
                  options={[
                    { value: 'contains', label: copy.contains },
                    { value: 'regex', label: copy.regex },
                  ]}
                />
              </label>
              <label className='block space-y-2 text-sm font-medium'>
                {copy.direction}
                <FormSelect
                  label={copy.direction}
                  value={rule.direction}
                  onChange={(value) =>
                    setRule({
                      ...rule,
                      direction: value as AdvancedRuleInput['direction'],
                    })
                  }
                  options={(['any', 'income', 'expense'] as const).map(
                    (direction) => ({
                      value: direction,
                      label: copy[direction],
                    })
                  )}
                />
              </label>
              {(['minimumAmount', 'maximumAmount'] as const).map((k) => (
                <label key={k} className='block space-y-2 text-sm font-medium'>
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
              <label className='block space-y-2 text-sm font-medium'>
                {copy.account}
                <FormSelect
                  label={copy.account}
                  value={rule.accountId ?? ''}
                  onChange={(value) =>
                    setRule({ ...rule, accountId: value || null })
                  }
                  options={[
                    { value: '', label: copy.anyAccount },
                    ...(data?.accounts ?? []).map((account) => ({
                      value: account.id,
                      label: account.name,
                    })),
                  ]}
                />
              </label>
              <label className='block space-y-2 text-sm font-medium'>
                {copy.category}
                <FormSelect
                  label={copy.category}
                  value={rule.categoryId}
                  onChange={(value) => setRule({ ...rule, categoryId: value })}
                  options={[
                    { value: '', label: copy.category },
                    ...(data?.categories ?? [])
                      .filter(
                        (c) =>
                          !data?.preferences.find((p) => p.category_id === c.id)
                            ?.archived
                      )
                      .map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              </label>
              <label className='block space-y-2 text-sm font-medium'>
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
                type='submit'
                disabled={busy || !rule.pattern.trim() || !rule.categoryId}
              >
                {copy.addRule}
              </Button>
              <Button
                disabled={busy}
                variant='outline'
                type='button'
                onClick={() => run(() => service.applyAdvancedCategoryRules())}
              >
                {copy.applyRules}
              </Button>
            </div>
          </form>
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
                className='text-destructive hover:bg-red-600 hover:text-white dark:text-red-400 dark:hover:bg-red-700 dark:hover:text-white'
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
