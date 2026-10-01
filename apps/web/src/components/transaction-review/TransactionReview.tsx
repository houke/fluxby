import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDataService } from '@/lib/db-singleton';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Currency } from '@/components/ui/currency';
import type { TransactionView } from '@/lib/transaction-view';
import type { PatternType } from '@fluxby/shared';

export function TransactionReview({ view }: { view: TransactionView }) {
  const { t, language } = useLanguage(),
    copy = t.transactionReview;
  const { activeProfileId } = useProfile(),
    toast = useToast(),
    confirm = useConfirm(),
    client = useQueryClient();
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [includeLater, setIncludeLater] = useState(false),
    [index, setIndex] = useState(0);
  const [category, setCategory] = useState(''),
    [source, setSource] = useState(''),
    [target, setTarget] = useState(''),
    [amount, setAmount] = useState('');
  const [relationType, setRelationType] = useState<'refund' | 'reimbursement'>(
    'refund'
  );
  const [bill, setBill] = useState(''),
    [frequency, setFrequency] = useState<PatternType>('monthly');
  const [undo, setUndo] = useState<null | (() => Promise<void>)>(null);
  const inbox = useQuery({
    queryKey: ['transactionReview', activeProfileId, includeLater],
    queryFn: () => getDataService().getTransactionReviewInbox(includeLater),
    enabled: open && !!activeProfileId,
  });
  const transactions = useQuery({
    queryKey: ['reviewTransactions', activeProfileId],
    queryFn: () => getDataService().getReviewTransactions(),
    enabled: open && !!activeProfileId,
  });
  const links = useQuery({
    queryKey: ['transactionLinks', activeProfileId],
    queryFn: () => getDataService().getTransactionLinks(),
    enabled: open && !!activeProfileId,
  });
  const categories = useQuery({
    queryKey: ['categories', activeProfileId],
    queryFn: () => api.getCategories(),
    enabled: open && !!activeProfileId,
  });
  const items = inbox.data || [],
    item = items[Math.min(index, Math.max(0, items.length - 1))],
    rows = transactions.data || [];
  useEffect(() => {
    setOpen(false);
    setUndo(null);
    setIndex(0);
    setSource('');
    setTarget('');
    setBill('');
  }, [activeProfileId]);
  useEffect(() => {
    setCategory(item?.suggestedCategoryId || '');
  }, [item?.key, item?.suggestedCategoryId]);
  const refresh = () => client.invalidateQueries();
  const action = async (
    operation: () => Promise<void>,
    message = copy.saved
  ) => {
    if (busy) return;
    setBusy(true);
    try {
      await operation();
      await refresh();
      toast.success(message);
    } catch {
      toast.error(copy.error);
    } finally {
      setBusy(false);
    }
  };
  const decide = (status: 'done' | 'later') => {
    if (!item) return;
    const key = item.key;
    void action(async () => {
      await getDataService().saveReviewDecision(key, status);
      setUndo(() => () => getDataService().undoReviewDecision(key));
    });
  };
  const restore = () => {
    if (undo)
      void action(async () => {
        await undo();
        setUndo(null);
      });
  };
  const caption = (id: string) => {
    const tx = rows.find((r) => r.id === id);
    return tx
      ? `${tx.date} · ${tx.merchantName || tx.description} · ${tx.amount.toFixed(2)}`
      : id;
  };
  return (
    <section
      className='space-y-3 rounded-lg border bg-card p-3'
      data-onboarding='transaction-review'
    >
      <div className='flex flex-wrap gap-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          {open ? copy.close : copy.open}
        </Button>
        <Button
          variant='outline'
          size='sm'
          disabled={busy}
          onClick={() =>
            void action(async () => {
              const csv = await getDataService().exportFilteredTransactions(
                view,
                language
              );
              const url = URL.createObjectURL(
                new Blob([csv], { type: 'text/csv;charset=utf-8' })
              );
              const a = document.createElement('a');
              a.href = url;
              a.download = `fluxby-${view.startDate}-${view.endDate}.csv`;
              document.body.append(a);
              a.click();
              a.remove();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }, copy.exportDone)
          }
        >
          {copy.export}
        </Button>
      </div>
      {open && (
        <div
          className='space-y-4'
          tabIndex={0}
          aria-label={copy.title}
          onKeyDown={(event) => {
            const element = event.target as HTMLElement;
            if (
              ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(
                element.tagName
              ) ||
              event.ctrlKey ||
              event.metaKey ||
              event.altKey ||
              busy
            )
              return;
            const key = event.key.toLowerCase();
            if (!['j', 'k', 'l', 'd', 'u'].includes(key)) return;
            event.preventDefault();
            if (key === 'j') setIndex(Math.min(index + 1, items.length - 1));
            if (key === 'k') setIndex(Math.max(0, index - 1));
            if (key === 'l') decide('later');
            if (key === 'd') decide('done');
            if (key === 'u') restore();
          }}
        >
          <h3 className='font-semibold'>{copy.title}</h3>
          <p className='text-sm text-muted-foreground'>
            {copy.description} {copy.evidence}
          </p>
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              checked={includeLater}
              onChange={(e) => setIncludeLater(e.target.checked)}
            />
            {copy.includeLater}
          </label>
          <p className='text-xs text-muted-foreground'>{copy.keyboard}</p>
          {inbox.error ? (
            <div role='alert'>
              {copy.loadError}
              <Button variant='outline' onClick={() => void inbox.refetch()}>
                {copy.reload}
              </Button>
            </div>
          ) : inbox.isLoading ? (
            <p aria-busy='true'>{t.common.loading}</p>
          ) : item ? (
            <article className='space-y-3 rounded-md border p-3'>
              <div className='flex flex-wrap justify-between gap-2'>
                <strong>{copy[item.kind]}</strong>
                <span className='text-sm'>
                  {Math.min(index + 1, items.length)} / {items.length}{' '}
                  {copy.count}
                </span>
              </div>
              <p>
                {item.transaction.date} ·{' '}
                {item.transaction.merchantName || item.transaction.description}{' '}
                · <Currency amount={item.transaction.amount} />
              </p>
              <p className='text-sm text-muted-foreground'>
                {item.transaction.accountName} · {item.transaction.description}
              </p>
              {item.related && (
                <p className='text-sm'>
                  {copy.related}: {item.related.date} ·{' '}
                  {item.related.merchantName || item.related.description} ·{' '}
                  <Currency amount={item.related.amount} />
                </p>
              )}
              {item.kind === 'uncategorized' && (
                <div className='flex flex-wrap gap-2'>
                  <label className='space-y-1 text-sm'>
                    {copy.category}
                    <select
                      className='block rounded-md border bg-background p-2'
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value=''>{copy.noCategory}</option>
                      {categories.data?.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                          {c.id === item.suggestedCategoryId
                            ? ` (${copy.suggestion})`
                            : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button
                    disabled={busy || !category}
                    onClick={() =>
                      void action(async () => {
                        const tx = item.transaction;
                        await getDataService().saveReviewedCategory(
                          tx.id,
                          category
                        );
                        setUndo(
                          () => () =>
                            getDataService().saveReviewedCategory(
                              tx.id,
                              tx.categoryId
                            )
                        );
                      })
                    }
                  >
                    {copy.apply}
                  </Button>
                </div>
              )}
              {item.related &&
                (item.kind === 'refund' || item.kind === 'transfer') && (
                  <Button
                    disabled={busy}
                    onClick={() => {
                      const related = item.related;
                      if (!related) return;
                      if (item.kind === 'refund') {
                        setSource(item.transaction.id);
                        setTarget(related.id);
                        setAmount(String(Math.abs(item.transaction.amount)));
                        return;
                      }
                      void action(async () => {
                        const id = await getDataService().createTransactionLink(
                          {
                            sourceId: item.transaction.id,
                            targetId: related.id,
                            kind: 'transfer',
                            amount: Math.abs(item.transaction.amount),
                          }
                        );
                        setUndo(
                          () => () => getDataService().deleteTransactionLink(id)
                        );
                      });
                    }}
                  >
                    {item.kind === 'refund'
                      ? copy.linkRefund
                      : copy.linkTransfer}
                  </Button>
                )}
              <div className='flex flex-wrap gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  disabled={index <= 0}
                  onClick={() => setIndex(index - 1)}
                >
                  {copy.previous}
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  disabled={index >= items.length - 1}
                  onClick={() => setIndex(index + 1)}
                >
                  {copy.next}
                </Button>
                <Button
                  size='sm'
                  disabled={busy}
                  onClick={() => decide('later')}
                >
                  {copy.later}
                </Button>
                <Button
                  size='sm'
                  disabled={busy}
                  onClick={() => decide('done')}
                >
                  {copy.done}
                </Button>
              </div>
            </article>
          ) : (
            <p>{copy.empty}</p>
          )}
          <Button
            size='sm'
            variant='outline'
            disabled={busy || !undo}
            onClick={restore}
          >
            {copy.undo}
          </Button>
          <details open={!!source}>
            <summary className='cursor-pointer font-medium'>
              {copy.manual}
            </summary>
            <p className='my-2 text-sm text-muted-foreground'>
              {copy.manualHelp} {copy.refundPolicy}
            </p>
            <form
              className='grid gap-3 sm:grid-cols-2'
              onSubmit={(e) => {
                e.preventDefault();
                void action(async () => {
                  const id = await getDataService().createTransactionLink({
                    sourceId: source,
                    targetId: target,
                    kind: 'refund',
                    relationType,
                    amount: Number(amount.replace(',', '.')),
                  });
                  setUndo(
                    () => () => getDataService().deleteTransactionLink(id)
                  );
                  setAmount('');
                });
              }}
            >
              <label className='text-sm'>
                {copy.incoming}
                <select
                  required
                  className='block w-full rounded-md border bg-background p-2'
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                >
                  <option value=''>{copy.select}</option>
                  {rows
                    .filter((tx) => tx.type === 'income')
                    .map((tx) => (
                      <option key={tx.id} value={tx.id}>
                        {caption(tx.id)}
                      </option>
                    ))}
                </select>
              </label>
              <label className='text-sm'>
                {copy.expense}
                <select
                  required
                  className='block w-full rounded-md border bg-background p-2'
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  <option value=''>{copy.select}</option>
                  {rows
                    .filter((tx) => tx.type === 'expense')
                    .map((tx) => (
                      <option key={tx.id} value={tx.id}>
                        {caption(tx.id)}
                      </option>
                    ))}
                </select>
              </label>
              <label className='text-sm'>
                {copy.relationType}
                <select
                  className='block rounded-md border bg-background p-2'
                  value={relationType}
                  onChange={(e) =>
                    setRelationType(
                      e.target.value as 'refund' | 'reimbursement'
                    )
                  }
                >
                  <option value='refund'>{copy.refund}</option>
                  <option value='reimbursement'>{copy.reimbursement}</option>
                </select>
              </label>
              <label className='text-sm'>
                {copy.amount}
                <Input
                  required
                  inputMode='decimal'
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
              <Button
                disabled={busy || !source || !target || !amount}
                type='submit'
              >
                {copy.linkRefund}
              </Button>
            </form>
          </details>
          <details>
            <summary className='cursor-pointer font-medium'>
              {copy.links} ({links.data?.length || 0})
            </summary>
            <div className='space-y-2'>
              {links.data?.map((link) => (
                <div key={link.id} className='rounded-md border p-2 text-sm'>
                  <p>
                    {link.relationType === 'reimbursement'
                      ? copy.reimbursement
                      : copy[link.kind]}
                    : {caption(link.sourceId)} → {caption(link.targetId)} ·{' '}
                    <Currency amount={link.amount} />
                  </p>
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={busy}
                    onClick={async () => {
                      if (
                        await confirm({
                          title: copy.unlink,
                          message: copy.unlinkConfirm,
                        })
                      )
                        void action(
                          () => getDataService().deleteTransactionLink(link.id),
                          copy.removed
                        );
                    }}
                  >
                    {copy.unlink}
                  </Button>
                </div>
              ))}
            </div>
          </details>
          <details>
            <summary className='cursor-pointer font-medium'>
              {copy.recurring}
            </summary>
            <form
              className='mt-2 flex flex-wrap items-end gap-2'
              onSubmit={(e) => {
                e.preventDefault();
                void action(async () => {
                  await getDataService().markTransactionRecurring(
                    bill,
                    frequency
                  );
                  setBill('');
                }, copy.recorded);
              }}
            >
              <label className='text-sm'>
                {copy.billTransaction}
                <select
                  required
                  className='block max-w-full rounded-md border bg-background p-2'
                  value={bill}
                  onChange={(e) => setBill(e.target.value)}
                >
                  <option value=''>{copy.select}</option>
                  {rows
                    .filter((tx) => tx.type === 'expense')
                    .map((tx) => (
                      <option key={tx.id} value={tx.id}>
                        {caption(tx.id)}
                      </option>
                    ))}
                </select>
              </label>
              <label className='text-sm'>
                {copy.frequency}
                <select
                  className='block rounded-md border bg-background p-2'
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as PatternType)}
                >
                  {(
                    [
                      'weekly',
                      'biweekly',
                      'monthly',
                      'quarterly',
                      'yearly',
                    ] as const
                  ).map((f) => (
                    <option key={f} value={f}>
                      {copy[f]}
                    </option>
                  ))}
                </select>
              </label>
              <Button disabled={busy || !bill} type='submit'>
                {copy.markBill}
              </Button>
            </form>
          </details>
        </div>
      )}
    </section>
  );
}
