import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Transaction, Category } from '@fluxby/shared';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Currency } from '@/components/ui/currency';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { findMatchingRule, type MatchingRule } from '@/lib/transaction-view';

export function TransactionInspector({
  transactions,
  categories,
  rules,
}: {
  transactions: Transaction[];
  categories: Category[];
  rules: MatchingRule[];
}) {
  const { t } = useLanguage();
  const copy = t.transactionTools;
  const { activeProfileId } = useProfile();
  const toast = useToast();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [id, setId] = useState('');
  const [splits, setSplits] = useState<
    Array<{ categoryId: string; amount: string }>
  >([]);
  const [busy, setBusy] = useState(false);
  const tx = transactions.find((item) => item.id === id);
  const { data, isLoading, error } = useQuery({
    queryKey: ['transactionSplits', activeProfileId, id],
    queryFn: () => api.getTransactionSplits(id),
    enabled: open && !!id,
  });
  useEffect(() => {
    setSplits(
      (data || []).map((item) => ({
        categoryId: item.categoryId,
        amount: String(item.amount),
      }))
    );
  }, [data, id]);
  const rule = tx ? findMatchingRule(tx, rules) : null;
  const matched = useMemo(
    () =>
      rule
        ? transactions.filter(
            (item) => findMatchingRule(item, rules)?.id === rule.id
          )
        : [],
    [rule, rules, transactions]
  );
  const totalCents = splits.reduce(
    (sum, item) => sum + Math.round(Number(item.amount) * 100),
    0
  );
  const valid =
    !!tx &&
    splits.length >= 2 &&
    splits.every(
      (item) =>
        !!item.categoryId &&
        Number.isFinite(Number(item.amount)) &&
        Number(item.amount) > 0
    ) &&
    new Set(splits.map((item) => item.categoryId)).size === splits.length &&
    totalCents === Math.round(Math.abs(tx.amount) * 100);
  async function save(clear = false) {
    setBusy(true);
    try {
      await api.setTransactionSplits(
        id,
        clear
          ? []
          : splits.map((item) => ({
              categoryId: item.categoryId,
              amount: Number(item.amount),
            }))
      );
      await client.invalidateQueries();
      toast.success(copy.splitSaved);
    } catch {
      toast.error(t.common.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button
        size='sm'
        variant='outline'
        data-onboarding='transaction-inspector'
        onClick={() => setOpen(true)}
      >
        {copy.split} / {copy.explanation}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>{copy.currentRuleHelp}</DialogDescription>
          </DialogHeader>
          <label className='space-y-1 text-sm'>
            {copy.selectTransaction}
            <select
              className='w-full rounded-md border bg-background p-2'
              value={id}
              onChange={(event) => setId(event.target.value)}
            >
              <option value=''>{copy.selectTransaction}</option>
              {transactions.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.date} · {item.merchantName || item.description} ·{' '}
                  {item.amount}
                </option>
              ))}
            </select>
          </label>
          {tx && (
            <>
              <section className='space-y-2 rounded-md border p-3'>
                <h3 className='font-medium'>{copy.explanation}</h3>
                <p>
                  {t.budgets.category}:{' '}
                  {categories.find((item) => item.id === tx.categoryId)?.name ||
                    t.transactions.noCategory}
                </p>
                {rule ? (
                  <>
                    <p>
                      {copy.ruleMatch}:{' '}
                      <code className='break-all'>{rule.pattern}</code> →{' '}
                      {
                        categories.find((item) => item.id === rule.categoryId)
                          ?.name
                      }
                    </p>
                    <p>
                      {copy.matchedCount.replace(
                        '{count}',
                        String(matched.length)
                      )}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {copy.previewHelp}
                    </p>
                    <ul className='max-h-32 overflow-y-auto text-sm'>
                      {matched.slice(0, 20).map((item) => (
                        <li key={item.id}>
                          {item.date} · {item.merchantName || item.description}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p>{copy.noRule}</p>
                )}
              </section>
              {tx.type !== 'transfer' && (
                <section className='space-y-3 rounded-md border p-3'>
                  <h3 className='font-medium'>{copy.split}</h3>
                  <p className='text-sm text-muted-foreground'>
                    {copy.splitHelp}
                  </p>
                  <p>
                    <Currency amount={Math.abs(tx.amount)} /> ·{' '}
                    {copy.splitTotal}:{' '}
                    <Currency amount={totalCents / 100 || 0} />
                  </p>
                  {isLoading && <p>{t.common.loading}</p>}
                  {error && <p role='alert'>{t.common.error}</p>}
                  {splits.map((item, index) => (
                    <div key={index} className='flex flex-wrap items-end gap-2'>
                      <label className='min-w-40 flex-1 text-sm'>
                        {t.budgets.category}
                        <select
                          className='w-full rounded-md border bg-background p-2'
                          value={item.categoryId}
                          onChange={(event) =>
                            setSplits(
                              splits.map((value, i) =>
                                i === index
                                  ? { ...value, categoryId: event.target.value }
                                  : value
                              )
                            )
                          }
                        >
                          <option value=''>{t.transactions.noCategory}</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className='w-28 text-sm'>
                        {t.budgets.amount}
                        <Input
                          type='number'
                          step='0.01'
                          min='0.01'
                          value={item.amount}
                          onChange={(event) =>
                            setSplits(
                              splits.map((value, i) =>
                                i === index
                                  ? { ...value, amount: event.target.value }
                                  : value
                              )
                            )
                          }
                        />
                      </label>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() =>
                          setSplits(splits.filter((_, i) => i !== index))
                        }
                      >
                        {t.common.delete}
                      </Button>
                    </div>
                  ))}
                  <div className='flex flex-wrap gap-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      disabled={isLoading || busy || !!error}
                      onClick={() =>
                        setSplits([...splits, { categoryId: '', amount: '' }])
                      }
                    >
                      {copy.addSplit}
                    </Button>
                    <Button
                      size='sm'
                      disabled={!valid || busy || isLoading || !!error}
                      onClick={() => void save()}
                    >
                      {t.common.save}
                    </Button>
                    {(data?.length || 0) > 0 && (
                      <Button
                        size='sm'
                        variant='outline'
                        disabled={busy}
                        onClick={() => void save(true)}
                      >
                        {copy.clearSplits}
                      </Button>
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
