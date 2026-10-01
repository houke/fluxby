import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { addDaysToDateOnly, formatDateISO } from '@fluxby/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { getDataService } from '@/lib/db-singleton';
import {
  WEEKLY_CHECKS,
  cashflowDates,
  type CashflowInput,
  type PlannedCashflow,
} from '@/lib/data/household-planning';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Currency } from '@/components/ui/currency';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { TransitionLink } from '@/components/layout/TransitionLink';
const today = () => formatDateISO(new Date());
const emptyFlow = (): CashflowInput => ({
  name: '',
  kind: 'expense',
  amount: 0,
  dueDate: today(),
  frequency: 'once',
  reserved: 0,
  recurringPatternId: null,
});
const selectClass =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm';

export function HouseholdPlanning() {
  const { t, language } = useLanguage(),
    p = t.householdPlanning;
  const { activeProfileId } = useProfile(),
    toast = useToast(),
    confirm = useConfirm(),
    client = useQueryClient();
  const enabled = Boolean(activeProfileId),
    key = ['household-planning', activeProfileId];
  const [horizon, setHorizon] = useState<30 | 60 | 90>(30),
    [variable, setVariable] = useState('0'),
    [week, setWeek] = useState(today());
  const [editor, setEditor] = useState<PlannedCashflow | null | undefined>(
      undefined
    ),
    [form, setForm] = useState<CashflowInput>(emptyFlow);
  const [goalId, setGoalId] = useState<string | null>(null),
    [transactionId, setTransactionId] = useState(''),
    [contribution, setContribution] = useState('');
  const flows = useQuery({
    queryKey: [...key, 'flows'],
    queryFn: () => getDataService().getPlannedCashflows(),
    enabled,
  });
  const forecast = useQuery({
    queryKey: [...key, 'forecast', horizon],
    queryFn: () => getDataService().getDailyForecast(horizon),
    enabled,
  });
  const history = useQuery({
    queryKey: [...key, 'history'],
    queryFn: () => getDataService().getNetWorthHistory(),
    enabled,
  });
  const review = useQuery({
    queryKey: [...key, 'week', week],
    queryFn: () => getDataService().getWeeklyReview(week),
    enabled,
  });
  const goals = useQuery({
    queryKey: [...key, 'goals'],
    queryFn: () => getDataService().getGoalPlanning(),
    enabled,
  });
  const bills = useQuery({
    queryKey: [...key, 'bills'],
    queryFn: () => getDataService().getPlanningRecurringBills(),
    enabled,
  });
  const sources = useQuery({
    queryKey: [...key, 'sources'],
    queryFn: () => getDataService().getGoalContributionTransactions(),
    enabled: enabled && goalId !== null,
  });
  const links = useQuery({
    queryKey: [...key, 'links'],
    queryFn: () => getDataService().getGoalTransactionLinks(),
    enabled,
  });
  const variableDaily = forecast.data?.variableDaily;
  useEffect(() => {
    if (variableDaily !== undefined) setVariable(String(variableDaily));
  }, [variableDaily]);
  const change = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['household-planning'] });
      void client.invalidateQueries({ queryKey: ['planning'] });
      toast.success(p.saved);
    },
    onError: () => toast.error(p.failed),
  });
  const locale = language === 'nl' ? 'nl-NL' : 'en-GB';
  const dateLabel = (date: string) =>
    new Date(date + 'T00:00:00').toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  const saveFlow = (event: FormEvent) => {
    event.preventDefault();
    change.mutate(async () => {
      await getDataService().savePlannedCashflow(form, editor?.id);
      setEditor(undefined);
    });
  };
  const open = (flow: PlannedCashflow | null) => {
    setEditor(flow);
    setForm(flow ?? emptyFlow());
  };
  const rowLabel = (flow: PlannedCashflow) => {
    const next = cashflowDates(
      flow.dueDate,
      flow.frequency,
      today(),
      addDaysToDateOnly(today(), 366)
    )[0];
    const months = next
      ? Math.max(
          1,
          Math.ceil(
            (Date.parse(next) - Date.parse(today())) / 86400000 / 30.4375
          )
        )
      : 1;
    return (
      Math.ceil(
        Math.max(
          0,
          Math.round(flow.amount * 100) - Math.round(flow.reserved * 100)
        ) / months
      ) / 100
    );
  };
  const hasError =
    flows.isError ||
    forecast.isError ||
    history.isError ||
    review.isError ||
    goals.isError ||
    bills.isError ||
    links.isError;
  return (
    <section
      className='space-y-6'
      data-onboarding='household-planning'
      aria-label={p.title}
    >
      <div>
        <h2 className='text-xl font-semibold'>{p.title}</h2>
        <p className='text-sm text-muted-foreground'>{p.intro}</p>
      </div>
      {hasError && (
        <p role='alert' className='text-destructive'>
          {p.failed}
        </p>
      )}
      <Card>
        <CardHeader>
          <CardTitle>{p.cashflows}</CardTitle>
          <CardDescription>{p.reserveHelp}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Button onClick={() => open(null)}>{p.add}</Button>
          {!flows.data?.length && (
            <p className='text-sm text-muted-foreground'>{p.empty}</p>
          )}
          {flows.data?.map((flow) => (
            <div
              key={flow.id}
              className='flex flex-wrap items-start justify-between gap-3 rounded-md border p-3'
            >
              <div>
                <p className='font-medium'>
                  {flow.name} ·{' '}
                  <Currency
                    amount={flow.kind === 'income' ? flow.amount : -flow.amount}
                  />
                </p>
                <p className='text-sm text-muted-foreground'>
                  {p[flow.frequency]} · {dateLabel(flow.dueDate)}
                </p>
                {flow.kind === 'expense' && (
                  <p className='text-sm'>
                    {p.reserved}: <Currency amount={flow.reserved} /> ·{' '}
                    {p.monthlyReserve}: <Currency amount={rowLabel(flow)} />
                  </p>
                )}
              </div>
              <div className='flex gap-2'>
                <Button variant='outline' onClick={() => open(flow)}>
                  {p.edit}
                </Button>
                <Button
                  variant='outline'
                  disabled={change.isPending}
                  onClick={async () => {
                    if (
                      await confirm({
                        title: p.remove,
                        message: p.deleteConfirm,
                        variant: 'danger',
                      })
                    )
                      change.mutate(() =>
                        getDataService().deletePlannedCashflow(flow.id)
                      );
                  }}
                >
                  {p.remove}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card data-onboarding='daily-forecast'>
        <CardHeader>
          <CardTitle>{p.forecast}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <label className='space-y-1 text-sm'>
              {p.horizon}
              <select
                className={selectClass}
                value={horizon}
                onChange={(e) =>
                  setHorizon(Number(e.target.value) as 30 | 60 | 90)
                }
              >
                {([30, 60, 90] as const).map((days) => (
                  <option key={days} value={days}>
                    {days} {p.days}
                  </option>
                ))}
              </select>
            </label>
            <form
              className='flex items-end gap-2'
              onSubmit={(e) => {
                e.preventDefault();
                change.mutate(() =>
                  getDataService().updateVariableDaily(Number(variable))
                );
              }}
            >
              <label className='flex-1 space-y-1 text-sm'>
                {p.variableDaily}
                <Input
                  type='number'
                  step='0.01'
                  min='0'
                  required
                  value={variable}
                  onChange={(e) => setVariable(e.target.value)}
                />
              </label>
              <Button disabled={change.isPending} type='submit'>
                {p.save}
              </Button>
            </form>
          </div>
          <p className='text-sm text-muted-foreground'>{p.variableHelp}</p>
          {forecast.data?.variableDailySource === 'history' ? (
            <p className='text-sm text-muted-foreground'>
              {p.variableEstimate}
            </p>
          ) : (
            <Button
              variant='outline'
              disabled={change.isPending}
              onClick={() =>
                change.mutate(() => getDataService().resetVariableDaily())
              }
            >
              {p.variableReset}
            </Button>
          )}
          {forecast.data && (
            <>
              {forecast.data.staleAccounts > 0 && (
                <p
                  role='status'
                  className='text-sm text-amber-700 dark:text-amber-400'
                >
                  {p.stale}
                </p>
              )}
              {forecast.data.missingIncome && (
                <p className='text-sm text-muted-foreground'>
                  {p.missingIncome}
                </p>
              )}
              {forecast.data.limitedHistory && (
                <p className='text-sm text-muted-foreground'>{p.limited}</p>
              )}
              <dl className='grid gap-4 sm:grid-cols-3'>
                <div>
                  <dt className='text-sm text-muted-foreground'>{p.lowest}</dt>
                  <dd className='text-lg font-semibold'>
                    <Currency amount={forecast.data.lowestBalance} />
                  </dd>
                  <dd className='text-sm'>
                    {dateLabel(forecast.data.lowestDate)}
                  </dd>
                </div>
                <div>
                  <dt className='text-sm text-muted-foreground'>{p.floor}</dt>
                  <dd>
                    {forecast.data.firstShortfall
                      ? dateLabel(forecast.data.firstShortfall)
                      : p.noShortfall}
                  </dd>
                </div>
                <div>
                  <dt className='text-sm text-muted-foreground'>{p.daily}</dt>
                  <dd className='text-lg font-semibold'>
                    <Currency amount={forecast.data.perDay} />
                  </dd>
                </div>
              </dl>
              <p className='text-sm text-muted-foreground'>{p.dailyHelp}</p>
              {forecast.data.nextIncome && (
                <p className='text-sm'>
                  {p.nextIncome}: {dateLabel(forecast.data.nextIncome)}
                </p>
              )}
              <div className='h-64' role='img' aria-label={p.forecast}>
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={forecast.data.points}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis
                      dataKey='date'
                      tickFormatter={dateLabel}
                      minTickGap={60}
                    />
                    <YAxis />
                    <ChartTooltip
                      labelFormatter={(date) => dateLabel(String(date))}
                    />
                    <Line
                      type='monotone'
                      dataKey='balance'
                      name={p.balance}
                      stroke='#8b5cf6'
                      dot={false}
                    />
                    <Line
                      type='monotone'
                      dataKey='spendable'
                      name={p.spendable}
                      stroke='#0d9488'
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <details>
                <summary className='cursor-pointer text-sm'>
                  {p.forecast} · {p.date}
                </summary>
                <div className='max-h-72 overflow-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr>
                        {[
                          p.date,
                          p.income,
                          p.expenses,
                          p.balance,
                          p.spendable,
                        ].map((label) => (
                          <th className='p-2 text-left' key={label}>
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {forecast.data.points.map((point) => (
                        <tr key={point.date}>
                          <td className='p-2'>{dateLabel(point.date)}</td>
                          {[
                            point.income,
                            point.expenses,
                            point.balance,
                            point.spendable,
                          ].map((amount, index) => (
                            <td className='p-2' key={index}>
                              <Currency amount={amount} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{p.history}</CardTitle>
          <CardDescription>{p.captureHelp}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Button
            disabled={change.isPending}
            onClick={() =>
              change.mutate(() => getDataService().saveNetWorthSnapshot())
            }
          >
            {p.capture}
          </Button>
          <p>
            {p.change30}:{' '}
            {history.data?.change30Days != null ? (
              <Currency amount={history.data.change30Days} />
            ) : (
              <span className='text-sm text-muted-foreground'>
                {p.noComparator}
              </span>
            )}
          </p>
          {history.data?.snapshots.length ? (
            <>
              <div className='h-48' role='img' aria-label={p.history}>
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={history.data.snapshots}>
                    <XAxis dataKey='date' tickFormatter={dateLabel} />
                    <YAxis />
                    <ChartTooltip />
                    <Line
                      dataKey='total'
                      name={t.planning.netWorth}
                      stroke='#8b5cf6'
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <details>
                <summary>{p.history}</summary>
                {history.data.snapshots.map((snapshot) => (
                  <p key={snapshot.id}>
                    {dateLabel(snapshot.date)}:{' '}
                    <Currency amount={snapshot.total} />
                  </p>
                ))}
              </details>
            </>
          ) : (
            <p className='text-sm text-muted-foreground'>{p.noSnapshots}</p>
          )}
        </CardContent>
      </Card>
      <Card data-onboarding='weekly-review'>
        <CardHeader>
          <CardTitle>{p.weekly}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <label className='block max-w-xs space-y-1 text-sm'>
            {p.week}
            <Input
              type='date'
              value={week}
              max={today()}
              onChange={(e) => {
                if (e.target.value) setWeek(e.target.value);
              }}
            />
          </label>
          <p className='text-sm'>
            {review.data?.streak ?? 0} {p.streak}
          </p>
          {WEEKLY_CHECKS.map((check) => (
            <div
              key={check}
              className='flex items-center justify-between gap-3'
            >
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  disabled={change.isPending || !review.data}
                  checked={review.data?.checks[check] ?? false}
                  onChange={(e) =>
                    change.mutate(() =>
                      getDataService().updateWeeklyReview(week, {
                        ...review.data?.checks,
                        [check]: e.target.checked,
                      })
                    )
                  }
                />
                {p[check]}
              </label>
              <TransitionLink
                className='text-sm text-primary underline'
                to={
                  {
                    imports: '/import',
                    transactions: '/transactions',
                    bills: '/subscriptions',
                    budget: '/budgets',
                  }[check]
                }
              >
                {p.open}
              </TransitionLink>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{p.goals}</CardTitle>
          <CardDescription>{p.contributionHelp}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {goals.data?.map((goal) => (
            <div key={goal.id} className='rounded-md border p-3'>
              <div className='flex flex-wrap items-start justify-between gap-2'>
                <div>
                  <p className='font-medium'>
                    {goal.name} {goal.archived && `· ${p.archived}`}
                  </p>
                  <p className='text-sm'>
                    {goal.neededMonthly === null ? (
                      p.noDeadline
                    ) : (
                      <>
                        {p.needed}: <Currency amount={goal.neededMonthly} />
                      </>
                    )}
                    {goal.overdue && ` · ${p.overdue}`}
                  </p>
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    disabled={change.isPending}
                    onClick={() =>
                      change.mutate(() =>
                        getDataService().setSavingsGoalArchived(
                          goal.id,
                          !goal.archived
                        )
                      )
                    }
                  >
                    {goal.archived ? p.restore : p.archive}
                  </Button>
                  {!goal.archived && (
                    <Button
                      variant='outline'
                      onClick={() => {
                        setGoalId(goal.id);
                        setTransactionId('');
                        setContribution('');
                      }}
                    >
                      {p.link}
                    </Button>
                  )}
                </div>
              </div>
              {links.data
                ?.filter((link) => link.goalId === goal.id)
                .map((link) => (
                  <div
                    className='mt-2 flex items-center justify-between gap-2 text-sm'
                    key={link.id}
                  >
                    <span>
                      {link.description} · <Currency amount={link.amount} />
                    </span>
                    <Button
                      variant='ghost'
                      size='sm'
                      disabled={change.isPending}
                      onClick={async () => {
                        if (
                          await confirm({
                            title: p.unlink,
                            message: p.unlink,
                            variant: 'danger',
                          })
                        )
                          change.mutate(() =>
                            getDataService().deleteGoalTransactionContribution(
                              link.id
                            )
                          );
                      }}
                    >
                      {p.unlink}
                    </Button>
                  </div>
                ))}
            </div>
          ))}
        </CardContent>
      </Card>
      <Dialog
        open={editor !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditor(undefined);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editor ? p.edit : p.add}</DialogTitle>
            <DialogDescription>{p.reserveHelp}</DialogDescription>
          </DialogHeader>
          <form className='space-y-3' onSubmit={saveFlow}>
            <label className='block space-y-1 text-sm'>
              {p.name}
              <Input
                required
                maxLength={200}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <div className='grid grid-cols-2 gap-3'>
              <label className='space-y-1 text-sm'>
                {p.kind}
                <select
                  className={selectClass}
                  value={form.kind}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      kind: e.target.value as 'income' | 'expense',
                      reserved: 0,
                      recurringPatternId: null,
                    })
                  }
                >
                  <option value='income'>{p.income}</option>
                  <option value='expense'>{p.expense}</option>
                </select>
              </label>
              <label className='space-y-1 text-sm'>
                {p.amount}
                <Input
                  required
                  type='number'
                  min='0.01'
                  step='0.01'
                  value={form.amount || ''}
                  onChange={(e) =>
                    setForm({ ...form, amount: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <label className='space-y-1 text-sm'>
                {p.dueDate}
                <Input
                  required
                  type='date'
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                />
              </label>
              <label className='space-y-1 text-sm'>
                {p.frequency}
                <select
                  className={selectClass}
                  value={form.frequency}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      frequency: e.target.value as CashflowInput['frequency'],
                    })
                  }
                >
                  {(
                    [
                      'once',
                      'monthly',
                      'fourweekly',
                      'quarterly',
                      'yearly',
                    ] as const
                  ).map((frequency) => (
                    <option key={frequency} value={frequency}>
                      {p[frequency]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {form.kind === 'expense' && (
              <>
                <label className='block space-y-1 text-sm'>
                  {p.reserved}
                  <Input
                    type='number'
                    min='0'
                    max={form.amount}
                    step='0.01'
                    required
                    value={form.reserved}
                    onChange={(e) =>
                      setForm({ ...form, reserved: Number(e.target.value) })
                    }
                  />
                </label>
                <label className='block space-y-1 text-sm'>
                  {p.recurringBill}
                  <select
                    className={selectClass}
                    value={form.recurringPatternId ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        recurringPatternId: e.target.value || null,
                      })
                    }
                  >
                    <option value=''>{p.noBill}</option>
                    {bills.data?.map((bill) => (
                      <option key={bill.id} value={bill.id}>
                        {bill.name}
                      </option>
                    ))}
                  </select>
                </label>
                <p className='text-sm text-muted-foreground'>
                  {p.duplicateHelp}
                </p>
              </>
            )}
            <div className='flex justify-end gap-2'>
              <Button
                variant='outline'
                type='button'
                onClick={() => setEditor(undefined)}
              >
                {p.cancel}
              </Button>
              <Button type='submit' disabled={change.isPending}>
                {p.save}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={goalId !== null}
        onOpenChange={(open) => {
          if (!open) setGoalId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{p.link}</DialogTitle>
            <DialogDescription>{p.contributionHelp}</DialogDescription>
          </DialogHeader>
          <form
            className='space-y-4'
            onSubmit={(e) => {
              e.preventDefault();
              if (goalId)
                change.mutate(async () => {
                  await getDataService().addGoalTransactionContribution(
                    goalId,
                    transactionId,
                    Number(contribution)
                  );
                  setGoalId(null);
                });
            }}
          >
            <label className='block space-y-1 text-sm'>
              {p.transaction}
              <select
                className={selectClass}
                required
                value={transactionId}
                onChange={(e) => {
                  setTransactionId(e.target.value);
                  setContribution(
                    String(
                      Math.abs(
                        sources.data?.find(
                          (source) => source.id === e.target.value
                        )?.amount ?? 0
                      )
                    )
                  );
                }}
              >
                <option value=''>{p.selectTransaction}</option>
                {sources.data?.map((source) => (
                  <option key={source.id} value={source.id}>
                    {dateLabel(source.date)} · {source.description} ·{' '}
                    {source.amount.toLocaleString(locale, {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </option>
                ))}
              </select>
            </label>
            <label className='block space-y-1 text-sm'>
              {p.amount}
              <Input
                type='number'
                required
                min='0.01'
                step='0.01'
                value={contribution}
                onChange={(e) => setContribution(e.target.value)}
              />
            </label>
            <Button disabled={change.isPending || !transactionId} type='submit'>
              {p.save}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
