import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  formatDate,
  formatDateISO,
  type SavingsGoal,
  type NetWorthItem,
  type MonthlyReview,
} from '@fluxby/shared';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Currency } from '@/components/ui/currency';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useConfirm } from '@/contexts/ConfirmContext';
import { useFilters } from '@/contexts/FilterContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/contexts/ToastContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { api } from '@/lib/api';

function IconAction({
  label,
  onClick,
  children,
  destructive = false,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size='icon'
            variant='ghost'
            className={
              destructive
                ? 'rounded-md hover:bg-red-600 hover:text-white'
                : 'rounded-md hover:bg-purple-600 hover:text-white'
            }
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const emptyGoal = {
  name: '',
  targetAmount: '',
  deadline: '',
  monthlyContribution: '0',
};
const emptyItem = {
  name: '',
  type: 'asset' as 'asset' | 'liability',
  amount: '',
};
const validAmount = (value: string, allowZero = false) =>
  value.trim() !== '' &&
  Number.isFinite(Number(value)) &&
  (allowZero ? Number(value) >= 0 : Number(value) > 0);

export default function Planning() {
  const { t, language } = useLanguage();
  const p = t.planning;
  const { activeProfileId } = useProfile();
  const toast = useToast();
  const confirm = useConfirm();
  const {
    setDateRange,
    setCategories,
    setTransactionType,
    clearOpposingAccountFilters,
  } = useFilters();
  const queryClient = useQueryClient();
  useDocumentTitle(p.title);
  const key = ['planning', activeProfileId];
  const enabled = Boolean(activeProfileId);
  const goals = useQuery({
    queryKey: [...key, 'goals'],
    queryFn: api.getSavingsGoals,
    enabled,
  });
  const preferences = useQuery({
    queryKey: [...key, 'preferences'],
    queryFn: api.getPlanningPreferences,
    enabled,
  });
  const forecast = useQuery({
    queryKey: [...key, 'safe-to-spend'],
    queryFn: api.getSafeToSpend,
    enabled,
  });
  const netWorth = useQuery({
    queryKey: [...key, 'net-worth'],
    queryFn: api.getNetWorth,
    enabled,
  });
  const [reviewMonth, setReviewMonth] = useState(() =>
    formatDateISO(new Date()).slice(0, 7)
  );
  const review = useQuery({
    queryKey: [...key, 'review', reviewMonth],
    queryFn: () => api.getMonthlyReview(reviewMonth),
    enabled,
  });
  const [minimumBalance, setMinimumBalance] = useState('0');
  const [reservedSavings, setReservedSavings] = useState('0');
  const [goalEditor, setGoalEditor] = useState<{ id?: string } | null>(null);
  const [goalForm, setGoalForm] = useState(emptyGoal);
  const [contributionGoal, setContributionGoal] = useState<SavingsGoal | null>(
    null
  );
  const [contributionAmount, setContributionAmount] = useState('');
  const [itemEditor, setItemEditor] = useState<{ id?: string } | null>(null);
  const [itemForm, setItemForm] = useState(emptyItem);

  useEffect(() => {
    if (preferences.data) {
      setMinimumBalance(String(preferences.data.minimumBalance));
      setReservedSavings(String(preferences.data.reservedSavings));
    }
  }, [preferences.data]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: key });
  const failed = () => toast.error(p.saveFailed);
  const savePreferences = useMutation({
    mutationFn: api.updatePlanningPreferences,
    onSuccess: () => {
      refresh();
      toast.success(p.preferencesSaved);
    },
    onError: failed,
  });
  const saveGoal = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id?: string;
      input: {
        name: string;
        targetAmount: number;
        deadline: string | null;
        monthlyContribution: number;
      };
    }) => {
      if (id) await api.updateSavingsGoal(id, input);
      else await api.createSavingsGoal(input);
    },
    onSuccess: (_result, { id }) => {
      refresh();
      setGoalEditor(null);
      toast.success(id ? p.goalUpdated : p.goalCreated);
    },
    onError: failed,
  });
  const removeGoal = useMutation({
    mutationFn: api.deleteSavingsGoal,
    onSuccess: () => {
      refresh();
      toast.success(p.goalDeleted);
    },
    onError: failed,
  });
  const contribute = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      api.addSavingsContribution(id, amount),
    onSuccess: () => {
      refresh();
      setContributionGoal(null);
      toast.success(p.contributionSaved);
    },
    onError: failed,
  });
  const saveItem = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id?: string;
      input: { name: string; type: 'asset' | 'liability'; amount: number };
    }) => {
      if (id) await api.updateNetWorthItem(id, input);
      else await api.createNetWorthItem(input);
    },
    onSuccess: (_result, { id }) => {
      refresh();
      setItemEditor(null);
      toast.success(id ? p.itemUpdated : p.itemCreated);
    },
    onError: failed,
  });
  const removeItem = useMutation({
    mutationFn: api.deleteNetWorthItem,
    onSuccess: () => {
      refresh();
      toast.success(p.itemDeleted);
    },
    onError: failed,
  });
  const saveReview = useMutation({
    mutationFn: ({
      month,
      checks,
      status,
    }: {
      month: string;
      checks?: Record<string, boolean>;
      status?: 'open' | 'complete';
    }) => api.updateMonthlyReview(month, { checks, status }),
    onMutate: ({ month, checks, status }) => {
      const queryKey = [...key, 'review', month];
      void queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<MonthlyReview>(queryKey);
      queryClient.setQueryData<MonthlyReview>(queryKey, {
        month,
        status: status ?? previous?.status ?? 'open',
        checks: { ...previous?.checks, ...checks },
      });
      return { previous, queryKey };
    },
    onSuccess: async () => {
      await refresh();
      toast.success(p.reviewSaved);
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
      failed();
    },
  });

  const openGoal = (goal?: SavingsGoal) => {
    setGoalForm(
      goal
        ? {
            name: goal.name,
            targetAmount: String(goal.targetAmount),
            deadline: goal.deadline ?? '',
            monthlyContribution: String(goal.monthlyContribution),
          }
        : emptyGoal
    );
    setGoalEditor(goal ? { id: goal.id } : {});
  };
  const openItem = (item?: NetWorthItem) => {
    setItemForm(
      item
        ? { name: item.name, type: item.type, amount: String(item.amount) }
        : emptyItem
    );
    setItemEditor(item ? { id: item.id } : {});
  };
  const handleGoal = (event: FormEvent) => {
    event.preventDefault();
    if (
      !goalForm.name.trim() ||
      !validAmount(goalForm.targetAmount) ||
      !validAmount(goalForm.monthlyContribution, true)
    ) {
      toast.error(p.invalidAmount);
      return;
    }
    saveGoal.mutate({
      id: goalEditor?.id,
      input: {
        name: goalForm.name.trim(),
        targetAmount: Number(goalForm.targetAmount),
        deadline: goalForm.deadline || null,
        monthlyContribution: Number(goalForm.monthlyContribution),
      },
    });
  };
  const handleItem = (event: FormEvent) => {
    event.preventDefault();
    if (!itemForm.name.trim() || !validAmount(itemForm.amount, true)) {
      toast.error(p.invalidAmount);
      return;
    }
    saveItem.mutate({
      id: itemEditor?.id,
      input: {
        name: itemForm.name.trim(),
        type: itemForm.type,
        amount: Number(itemForm.amount),
      },
    });
  };

  const reviewSteps = [
    {
      id: 'uncategorized',
      label: p.reviewUncategorized,
      route: '/transactions',
    },
    { id: 'spending', label: p.reviewSpending, route: '/transactions' },
    { id: 'budgets', label: p.reviewBudgets, route: '/budgets' },
    {
      id: 'subscriptions',
      label: p.reviewSubscriptions,
      route: '/subscriptions',
    },
    { id: 'backup', label: p.reviewBackup, route: '/settings' },
  ];
  const done = reviewSteps.filter(
    (step) => review.data?.checks[step.id]
  ).length;
  const hasError =
    goals.isError ||
    preferences.isError ||
    forecast.isError ||
    netWorth.isError ||
    review.isError;

  return (
    <div className='space-y-6'>
      <PageHeader
        title={p.title}
        subtitle={p.subtitle}
        dataOnboarding='planning-greeting'
      />
      {hasError && (
        <Card role='alert'>
          <CardContent className='flex items-center justify-between pt-6'>
            <p>{p.loadFailed}</p>
            <Button variant='outline' onClick={() => refresh()}>
              {p.retry}
            </Button>
          </CardContent>
        </Card>
      )}
      <Card data-onboarding='planning-forecast'>
        <CardHeader>
          <CardTitle>{p.safeToSpend}</CardTitle>
          <CardDescription>{p.safeToSpendDescription}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {forecast.isPending ? (
            <Skeleton className='h-16' />
          ) : (
            forecast.data && (
              <>
                <p
                  className={`text-3xl font-semibold ${forecast.data.safeToSpend < 0 ? 'text-destructive' : ''}`}
                >
                  <Currency amount={forecast.data.safeToSpend} />
                </p>
                <dl className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
                  {[
                    {
                      label: p.availableBalance,
                      amount: forecast.data.availableBalance,
                    },
                    {
                      label: p.upcomingObligations,
                      amount: forecast.data.upcomingObligations,
                    },
                    {
                      label: p.goalReservations,
                      amount: forecast.data.goalReservations,
                    },
                    {
                      label: p.minimumBalance,
                      amount: forecast.data.minimumBalance,
                    },
                    {
                      label: p.reservedSavings,
                      amount: forecast.data.reservedSavings,
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <dt className='text-sm text-muted-foreground'>
                        {item.label}
                      </dt>
                      <dd className='mt-1 font-medium'>
                        <Currency amount={item.amount} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </>
            )
          )}
          <form
            className='flex flex-wrap items-end gap-4'
            onSubmit={(event) => {
              event.preventDefault();
              if (
                !validAmount(minimumBalance, true) ||
                !validAmount(reservedSavings, true)
              ) {
                toast.error(p.invalidAmount);
                return;
              }
              savePreferences.mutate({
                minimumBalance: Number(minimumBalance),
                reservedSavings: Number(reservedSavings),
              });
            }}
          >
            <div className='space-y-2'>
              <Label htmlFor='planning-minimum'>{p.minimumBalance}</Label>
              <Input
                id='planning-minimum'
                type='number'
                min='0'
                step='0.01'
                value={minimumBalance}
                onChange={(event) => setMinimumBalance(event.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='planning-reserved'>{p.reservedSavings}</Label>
              <Input
                id='planning-reserved'
                type='number'
                min='0'
                step='0.01'
                value={reservedSavings}
                onChange={(event) => setReservedSavings(event.target.value)}
              />
            </div>
            <Button
              type='submit'
              disabled={savePreferences.isPending || !preferences.data}
            >
              {p.savePreferences}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Tabs defaultValue='goals' className='space-y-4'>
        <TabsList className='h-auto flex-wrap' aria-label={p.title}>
          <TabsTrigger value='goals'>{p.goals}</TabsTrigger>
          <TabsTrigger value='net-worth'>{p.netWorth}</TabsTrigger>
          <TabsTrigger value='review'>{p.monthlyReview}</TabsTrigger>
        </TabsList>
        <TabsContent value='goals'>
          <Card data-onboarding='planning-goals'>
            <CardHeader className='flex flex-wrap items-start justify-between gap-3 sm:flex-row'>
              <div className='space-y-2'>
                <CardTitle>{p.goals}</CardTitle>
                <CardDescription>{p.goalsDescription}</CardDescription>
              </div>
              <Button onClick={() => openGoal()}>
                <Plus className='mr-2 h-4 w-4' />
                {p.addGoal}
              </Button>
            </CardHeader>
            <CardContent className='space-y-4'>
              {goals.isPending ? (
                <Skeleton className='h-28' />
              ) : !goals.data?.length ? (
                <p className='text-muted-foreground'>{p.noGoals}</p>
              ) : (
                goals.data.map((goal) => (
                  <div
                    key={goal.id}
                    className='space-y-3 rounded-lg border p-4'
                  >
                    <div className='flex items-center justify-between gap-3'>
                      <h3 className='font-medium'>{goal.name}</h3>
                      <div className='flex gap-1'>
                        <IconAction
                          label={`${p.editGoal}: ${goal.name}`}
                          onClick={() => openGoal(goal)}
                        >
                          <Pencil className='h-4 w-4' />
                        </IconAction>
                        <IconAction
                          label={`${t.common.delete}: ${goal.name}`}
                          destructive
                          disabled={removeGoal.isPending}
                          onClick={async () => {
                            if (
                              await confirm({
                                title: t.common.delete,
                                message: p.deleteGoalConfirm,
                                variant: 'danger',
                              })
                            )
                              removeGoal.mutate(goal.id);
                          }}
                        >
                          <Trash2 className='h-4 w-4' />
                        </IconAction>
                      </div>
                    </div>
                    <Progress
                      value={Math.min(
                        100,
                        (goal.currentAmount / goal.targetAmount) * 100
                      )}
                      aria-label={goal.name}
                    />
                    <div className='flex flex-wrap items-center justify-between gap-3 text-sm'>
                      <span>
                        {p.currentAmount}:{' '}
                        <Currency amount={goal.currentAmount} /> {t.common.of}{' '}
                        <Currency amount={goal.targetAmount} />
                      </span>
                      <span>
                        {p.monthlyContribution}:{' '}
                        <Currency amount={goal.monthlyContribution} />
                      </span>
                      {goal.deadline && (
                        <span>
                          {formatDate(
                            goal.deadline,
                            language === 'en' ? 'en-GB' : 'nl-NL'
                          )}
                        </span>
                      )}
                    </div>
                    {goal.currentAmount >= goal.targetAmount && (
                      <p className='text-sm font-medium'>{p.goalComplete}</p>
                    )}
                    <Button
                      variant='outline'
                      onClick={() => {
                        setContributionGoal(goal);
                        setContributionAmount('');
                      }}
                    >
                      {p.contribute}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value='net-worth'>
          <Card data-onboarding='planning-net-worth'>
            <CardHeader className='flex flex-wrap items-start justify-between gap-3 sm:flex-row'>
              <div className='space-y-2'>
                <CardTitle>{p.netWorth}</CardTitle>
                <CardDescription>{p.netWorthDescription}</CardDescription>
              </div>
              <Button onClick={() => openItem()}>
                <Plus className='mr-2 h-4 w-4' />
                {p.addItem}
              </Button>
            </CardHeader>
            <CardContent className='space-y-6'>
              {netWorth.isPending ? (
                <Skeleton className='h-28' />
              ) : (
                netWorth.data && (
                  <>
                    <dl className='grid gap-4 sm:grid-cols-4'>
                      {[
                        { label: p.cash, amount: netWorth.data.cash },
                        { label: p.assets, amount: netWorth.data.assets },
                        {
                          label: p.liabilities,
                          amount: netWorth.data.liabilities,
                        },
                        { label: p.total, amount: netWorth.data.total },
                      ].map((item) => (
                        <div key={item.label}>
                          <dt className='text-sm text-muted-foreground'>
                            {item.label}
                          </dt>
                          <dd className='mt-1 text-lg font-semibold'>
                            <Currency amount={item.amount} />
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {!netWorth.data.items.length ? (
                      <p className='text-muted-foreground'>{p.noItems}</p>
                    ) : (
                      <ul className='divide-y'>
                        {netWorth.data.items.map((item) => (
                          <li
                            key={item.id}
                            className='flex flex-wrap items-center justify-between gap-3 py-3'
                          >
                            <div>
                              <p className='font-medium'>{item.name}</p>
                              <p className='text-sm text-muted-foreground'>
                                {item.type === 'asset' ? p.asset : p.liability}
                              </p>
                            </div>
                            <div className='flex items-center gap-2'>
                              <Currency amount={item.amount} />
                              <IconAction
                                label={`${t.common.edit}: ${item.name}`}
                                onClick={() => openItem(item)}
                              >
                                <Pencil className='h-4 w-4' />
                              </IconAction>
                              <IconAction
                                label={`${t.common.delete}: ${item.name}`}
                                destructive
                                disabled={removeItem.isPending}
                                onClick={async () => {
                                  if (
                                    await confirm({
                                      title: t.common.delete,
                                      message: p.deleteItemConfirm,
                                      variant: 'danger',
                                    })
                                  )
                                    removeItem.mutate(item.id);
                                }}
                              >
                                <Trash2 className='h-4 w-4' />
                              </IconAction>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value='review'>
          <Card data-onboarding='planning-review'>
            <CardHeader>
              <CardTitle>{p.monthlyReview}</CardTitle>
              <CardDescription>{p.monthlyReviewDescription}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='max-w-xs space-y-2'>
                <Label htmlFor='planning-review-month'>{p.reviewMonth}</Label>
                <Input
                  id='planning-review-month'
                  type='month'
                  value={reviewMonth}
                  onChange={(event) => {
                    if (event.target.value) setReviewMonth(event.target.value);
                  }}
                />
              </div>
              <p className='text-sm text-muted-foreground'>
                {p.reviewProgress
                  .replace('{done}', String(done))
                  .replace('{total}', String(reviewSteps.length))}
              </p>
              {review.isPending ? (
                <Skeleton className='h-36' />
              ) : (
                review.data && (
                  <ul className='space-y-3'>
                    {reviewSteps.map((step) => (
                      <li
                        key={step.id}
                        className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3'
                      >
                        <label className='flex items-center gap-3'>
                          <input
                            type='checkbox'
                            className='h-4 w-4 accent-purple-600'
                            checked={Boolean(review.data?.checks[step.id])}
                            disabled={saveReview.isPending}
                            onChange={(event) =>
                              saveReview.mutate({
                                month: reviewMonth,
                                checks: {
                                  ...review.data?.checks,
                                  [step.id]: event.target.checked,
                                },
                                status: 'open',
                              })
                            }
                          />
                          {step.label}
                        </label>
                        <Button asChild variant='outline' size='sm'>
                          <Link
                            to={step.route}
                            onClick={() => {
                              const [year, month] = reviewMonth
                                .split('-')
                                .map(Number);
                              setDateRange(
                                new Date(year, month - 1, 1),
                                new Date(year, month, 0)
                              );
                              setCategories(
                                step.id === 'uncategorized' ? ['0'] : []
                              );
                              setTransactionType('all');
                              clearOpposingAccountFilters();
                            }}
                          >
                            {p.openArea}
                          </Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )
              )}
              {review.data?.status === 'complete' ? (
                <div className='flex flex-wrap items-center gap-3'>
                  <p className='font-medium'>{p.reviewComplete}</p>
                  <Button
                    variant='outline'
                    disabled={saveReview.isPending}
                    onClick={() =>
                      saveReview.mutate({ month: reviewMonth, status: 'open' })
                    }
                  >
                    {p.reopenReview}
                  </Button>
                </div>
              ) : (
                <Button
                  disabled={done !== reviewSteps.length || saveReview.isPending}
                  onClick={() =>
                    saveReview.mutate({
                      month: reviewMonth,
                      status: 'complete',
                    })
                  }
                >
                  {p.finishReview}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={goalEditor !== null}
        onOpenChange={(open) => {
          if (!open) setGoalEditor(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{goalEditor?.id ? p.editGoal : p.addGoal}</DialogTitle>
            <DialogDescription>{p.goalsDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGoal} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='goal-name'>{p.name}</Label>
              <Input
                id='goal-name'
                required
                maxLength={200}
                value={goalForm.name}
                onChange={(event) =>
                  setGoalForm({ ...goalForm, name: event.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='goal-target'>{p.targetAmount}</Label>
              <Input
                id='goal-target'
                required
                type='number'
                min='0.01'
                step='0.01'
                value={goalForm.targetAmount}
                onChange={(event) =>
                  setGoalForm({ ...goalForm, targetAmount: event.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='goal-monthly'>{p.monthlyContribution}</Label>
              <Input
                id='goal-monthly'
                required
                type='number'
                min='0'
                step='0.01'
                value={goalForm.monthlyContribution}
                onChange={(event) =>
                  setGoalForm({
                    ...goalForm,
                    monthlyContribution: event.target.value,
                  })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='goal-deadline'>{p.deadline}</Label>
              <Input
                id='goal-deadline'
                type='date'
                value={goalForm.deadline}
                onChange={(event) =>
                  setGoalForm({ ...goalForm, deadline: event.target.value })
                }
              />
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setGoalEditor(null)}
              >
                {t.common.cancel}
              </Button>
              <Button type='submit' disabled={saveGoal.isPending}>
                {t.common.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={contributionGoal !== null}
        onOpenChange={(open) => {
          if (!open) setContributionGoal(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{p.contribute}</DialogTitle>
            <DialogDescription>{contributionGoal?.name}</DialogDescription>
          </DialogHeader>
          <form
            className='space-y-4'
            onSubmit={(event) => {
              event.preventDefault();
              if (!contributionGoal || !validAmount(contributionAmount)) {
                toast.error(p.invalidAmount);
                return;
              }
              contribute.mutate({
                id: contributionGoal.id,
                amount: Number(contributionAmount),
              });
            }}
          >
            <div className='space-y-2'>
              <Label htmlFor='goal-contribution'>{p.contributionAmount}</Label>
              <Input
                id='goal-contribution'
                required
                type='number'
                min='0.01'
                step='0.01'
                value={contributionAmount}
                onChange={(event) => setContributionAmount(event.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setContributionGoal(null)}
              >
                {t.common.cancel}
              </Button>
              <Button type='submit' disabled={contribute.isPending}>
                {t.common.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={itemEditor !== null}
        onOpenChange={(open) => {
          if (!open) setItemEditor(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{itemEditor?.id ? p.editItem : p.addItem}</DialogTitle>
            <DialogDescription>{p.netWorthDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleItem} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='worth-name'>{p.name}</Label>
              <Input
                id='worth-name'
                required
                maxLength={200}
                value={itemForm.name}
                onChange={(event) =>
                  setItemForm({ ...itemForm, name: event.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='worth-type'>{p.itemType}</Label>
              <select
                id='worth-type'
                className='h-10 w-full rounded-md border bg-background px-3 text-sm'
                value={itemForm.type}
                onChange={(event) =>
                  setItemForm({
                    ...itemForm,
                    type: event.target.value as 'asset' | 'liability',
                  })
                }
              >
                <option value='asset'>{p.asset}</option>
                <option value='liability'>{p.liability}</option>
              </select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='worth-amount'>{p.amount}</Label>
              <Input
                id='worth-amount'
                required
                type='number'
                min='0'
                step='0.01'
                value={itemForm.amount}
                onChange={(event) =>
                  setItemForm({ ...itemForm, amount: event.target.value })
                }
              />
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setItemEditor(null)}
              >
                {t.common.cancel}
              </Button>
              <Button type='submit' disabled={saveItem.isPending}>
                {t.common.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
