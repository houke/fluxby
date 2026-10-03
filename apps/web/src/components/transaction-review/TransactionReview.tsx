import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDataService } from '@/lib/db-singleton';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Currency } from '@/components/ui/currency';
import { ReviewSelect } from './ReviewSelect';
import type { TransactionView } from '@/lib/transaction-view';
import type { PatternType } from '@fluxby/shared';

type UndoAction = () => Promise<void>;
const undoLimit = 20;

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
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const profileRef = useRef(activeProfileId);
  profileRef.current = activeProfileId;
  const busyRef = useRef(false),
    generation = useRef(0);
  const enabled = open && !!activeProfileId;
  const inbox = useQuery({
    queryKey: ['transactionReview', activeProfileId, includeLater],
    queryFn: () => getDataService().getTransactionReviewInbox(includeLater),
    enabled,
  });
  const transactions = useQuery({
    queryKey: ['reviewTransactions', activeProfileId],
    queryFn: () => getDataService().getReviewTransactions(),
    enabled,
  });
  const links = useQuery({
    queryKey: ['transactionLinks', activeProfileId],
    queryFn: () => getDataService().getTransactionLinks(),
    enabled,
  });
  const categories = useQuery({
    queryKey: ['categories', activeProfileId],
    queryFn: () => api.getCategories(),
    enabled,
  });
  const queries = [inbox, transactions, links, categories];
  const loadError = queries.some((query) => query.isError);
  const loading = queries.some((query) => query.isLoading);
  const items = inbox.data || [],
    position = Math.min(index, Math.max(0, items.length - 1)),
    item = items[position],
    rows = transactions.data || [];
  const disabled = busy || loading || loadError || !activeProfileId;
  useEffect(() => {
    generation.current += 1;
    busyRef.current = false;
    setBusy(false);
    setOpen(false);
    setUndoStack([]);
    setIndex(0);
    setSource('');
    setTarget('');
    setAmount('');
    setBill('');
    setRelationType('refund');
    setFrequency('monthly');
    setIncludeLater(false);
    setSections([]);
  }, [activeProfileId]);
  useEffect(() => {
    setCategory(item?.suggestedCategoryId || '');
  }, [item?.key, item?.suggestedCategoryId]);
  const rememberUndo = (undo: UndoAction) => {
    if (profileRef.current === activeProfileId)
      setUndoStack((stack) => [...stack, undo].slice(-undoLimit));
  };
  const action = async (
    operation: () => Promise<void>,
    message = copy.saved
  ) => {
    if (busyRef.current || !activeProfileId) return;
    const actionGeneration = generation.current;
    busyRef.current = true;
    setBusy(true);
    try {
      await operation();
      await client.invalidateQueries();
      if (
        actionGeneration === generation.current &&
        profileRef.current === activeProfileId
      )
        toast.success(message);
    } catch {
      if (
        actionGeneration === generation.current &&
        profileRef.current === activeProfileId
      )
        toast.error(copy.error);
    } finally {
      if (actionGeneration === generation.current) {
        busyRef.current = false;
        setBusy(false);
      }
    }
  };
  const decide = (status: 'done' | 'later') => {
    if (!item || disabled) return;
    const key = item.key;
    void action(async () => {
      const previous = await getDataService().saveReviewDecision(key, status);
      rememberUndo(() =>
        previous
          ? getDataService().undoReviewDecision(key, previous)
          : getDataService().undoReviewDecision(key)
      );
    });
  };
  const restore = () => {
    const undo = undoStack[undoStack.length - 1];
    if (undo && !disabled)
      void action(async () => {
        await undo();
        if (profileRef.current === activeProfileId)
          setUndoStack((stack) => stack.slice(0, -1));
      });
  };
  const caption = (id: string) => {
    const tx = rows.find((row) => row.id === id);
    return tx
      ? `${tx.date} · ${tx.merchantName || tx.description} · ${new Intl.NumberFormat(language === 'nl' ? 'nl-NL' : 'en-GB', { style: 'currency', currency: 'EUR' }).format(tx.amount)}`
      : id;
  };
  const transactionOptions = (type: 'income' | 'expense') =>
    rows
      .filter((tx) => tx.type === type)
      .map((tx) => ({ value: tx.id, label: caption(tx.id) }));
  const linkedAmount = Number(amount.replace(',', '.'));
  return (
    <Card data-onboarding='transaction-review'>
      <CardContent className='space-y-4 p-4 sm:p-6'>
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
            disabled={busy || !activeProfileId}
            onClick={() =>
              void action(async () => {
                const csv = await getDataService().exportFilteredTransactions(
                  view,
                  language
                );
                if (profileRef.current !== activeProfileId) return;
                const url = URL.createObjectURL(
                  new Blob([csv], { type: 'text/csv;charset=utf-8' })
                );
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = `fluxby-${view.startDate}-${view.endDate}.csv`;
                document.body.append(anchor);
                anchor.click();
                anchor.remove();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }, copy.exportDone)
            }
          >
            {copy.export}
          </Button>
        </div>
        <p className='text-xs text-muted-foreground'>{copy.exportHelp}</p>
        {open && (
          <div
            className='space-y-4 outline-none focus-visible:ring-1 focus-visible:ring-ring'
            tabIndex={0}
            aria-label={copy.title}
            onKeyDown={(event) => {
              const element = event.target as HTMLElement;
              if (
                element.closest(
                  'input, select, textarea, button, [role="combobox"]'
                ) ||
                event.ctrlKey ||
                event.metaKey ||
                event.altKey ||
                disabled
              )
                return;
              const key = event.key.toLowerCase();
              if (!['j', 'k', 'l', 'd', 'u'].includes(key)) return;
              event.preventDefault();
              if (key === 'j')
                setIndex(Math.min(position + 1, Math.max(0, items.length - 1)));
              if (key === 'k') setIndex(Math.max(0, position - 1));
              if (key === 'l') decide('later');
              if (key === 'd') decide('done');
              if (key === 'u') restore();
            }}
          >
            <div className='space-y-2'>
              <h3 className='text-lg font-semibold tracking-tight'>
                {copy.title}
              </h3>
              <p className='text-sm text-muted-foreground'>
                {copy.description} {copy.evidence}
              </p>
              <label className='flex cursor-pointer items-center gap-2 text-sm'>
                <Checkbox
                  checked={includeLater}
                  onChange={(event) => {
                    setIncludeLater(event.target.checked);
                    setIndex(0);
                  }}
                />
                {copy.includeLater}
              </label>
              <p className='text-xs text-muted-foreground'>{copy.keyboard}</p>
            </div>
            {loadError ? (
              <div
                role='alert'
                className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm'
              >
                {copy.loadError}
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    void Promise.all(queries.map((query) => query.refetch()))
                  }
                >
                  {copy.reload}
                </Button>
              </div>
            ) : loading ? (
              <p aria-busy='true'>{t.common.loading}</p>
            ) : item ? (
              <article className='space-y-4 rounded-xl border bg-muted/20 p-4'>
                <div className='flex flex-wrap justify-between gap-2'>
                  <strong>{copy[item.kind]}</strong>
                  <span className='text-sm text-muted-foreground'>
                    {position + 1} / {items.length} {copy.count}
                  </span>
                </div>
                <p className='break-words'>
                  {item.transaction.date} ·{' '}
                  {item.transaction.merchantName ||
                    item.transaction.description}{' '}
                  · <Currency amount={item.transaction.amount} />
                </p>
                <p className='text-sm break-words text-muted-foreground'>
                  {item.transaction.accountName} ·{' '}
                  {item.transaction.description}
                </p>
                {item.related && (
                  <p className='text-sm break-words'>
                    {copy.related}: {item.related.date} ·{' '}
                    {item.related.merchantName || item.related.description} ·{' '}
                    <Currency amount={item.related.amount} />
                  </p>
                )}
                {item.kind === 'uncategorized' && (
                  <div className='grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]'>
                    <ReviewSelect
                      label={copy.category}
                      value={category}
                      onChange={setCategory}
                      disabled={disabled}
                      placeholder={copy.noCategory}
                      options={(categories.data || []).map((entry) => ({
                        value: entry.id,
                        label:
                          entry.name +
                          (entry.id === item.suggestedCategoryId
                            ? ` (${copy.suggestion})`
                            : ''),
                      }))}
                    />
                    <Button
                      disabled={disabled || !category}
                      onClick={() =>
                        void action(async () => {
                          const tx = item.transaction;
                          const previous =
                            await getDataService().saveReviewedCategory(
                              tx.id,
                              category
                            );
                          rememberUndo(() =>
                            getDataService().undoReviewedCategory(
                              tx.id,
                              tx.categoryId,
                              previous
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
                      disabled={disabled}
                      onClick={() => {
                        const related = item.related;
                        if (!related) return;
                        if (item.kind === 'refund') {
                          setSource(item.transaction.id);
                          setTarget(related.id);
                          setAmount(String(Math.abs(item.transaction.amount)));
                          setRelationType('refund');
                          setSections((value) => [
                            ...new Set([...value, 'manual']),
                          ]);
                          return;
                        }
                        void action(async () => {
                          const id =
                            await getDataService().createTransactionLink({
                              sourceId: item.transaction.id,
                              targetId: related.id,
                              kind: 'transfer',
                              amount: Math.abs(item.transaction.amount),
                            });
                          rememberUndo(() =>
                            getDataService().deleteTransactionLink(id)
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
                    disabled={disabled || position <= 0}
                    onClick={() => setIndex(position - 1)}
                  >
                    {copy.previous}
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={disabled || position >= items.length - 1}
                    onClick={() => setIndex(position + 1)}
                  >
                    {copy.next}
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={disabled}
                    onClick={() => decide('later')}
                  >
                    {copy.later}
                  </Button>
                  <Button
                    size='sm'
                    disabled={disabled}
                    onClick={() => decide('done')}
                  >
                    {copy.done}
                  </Button>
                </div>
              </article>
            ) : (
              <p className='rounded-lg bg-muted/30 p-4 text-sm'>{copy.empty}</p>
            )}
            <Button
              size='sm'
              variant='outline'
              disabled={disabled || !undoStack.length}
              onClick={restore}
            >
              {copy.undo}
              {undoStack.length > 0 && ` (${undoStack.length})`}
            </Button>
            <Accordion
              type='multiple'
              value={sections}
              onValueChange={setSections}
            >
              <AccordionItem value='manual'>
                <AccordionTrigger>{copy.manual}</AccordionTrigger>
                <AccordionContent>
                  <p className='mb-4 text-sm text-muted-foreground'>
                    {copy.manualHelp} {copy.refundPolicy}
                  </p>
                  <form
                    className='grid gap-4 sm:grid-cols-2'
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (
                        !source ||
                        !target ||
                        !Number.isFinite(linkedAmount) ||
                        linkedAmount <= 0 ||
                        disabled
                      )
                        return;
                      void action(async () => {
                        const id = await getDataService().createTransactionLink(
                          {
                            sourceId: source,
                            targetId: target,
                            kind: 'refund',
                            relationType,
                            amount: linkedAmount,
                          }
                        );
                        rememberUndo(() =>
                          getDataService().deleteTransactionLink(id)
                        );
                        if (profileRef.current === activeProfileId)
                          setAmount('');
                      });
                    }}
                  >
                    <ReviewSelect
                      label={copy.incoming}
                      value={source}
                      onChange={setSource}
                      disabled={disabled}
                      placeholder={copy.select}
                      options={transactionOptions('income')}
                    />
                    <ReviewSelect
                      label={copy.expense}
                      value={target}
                      onChange={setTarget}
                      disabled={disabled}
                      placeholder={copy.select}
                      options={transactionOptions('expense')}
                    />
                    <ReviewSelect
                      label={copy.relationType}
                      value={relationType}
                      onChange={(value) =>
                        setRelationType(value as 'refund' | 'reimbursement')
                      }
                      disabled={disabled}
                      options={[
                        { value: 'refund', label: copy.refund },
                        { value: 'reimbursement', label: copy.reimbursement },
                      ]}
                    />
                    <div className='space-y-2'>
                      <Label htmlFor='review-refund-amount'>
                        {copy.amount}
                      </Label>
                      <Input
                        id='review-refund-amount'
                        required
                        inputMode='decimal'
                        disabled={disabled}
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                      />
                    </div>
                    <Button
                      className='sm:col-span-2 sm:justify-self-start'
                      disabled={
                        disabled ||
                        !source ||
                        !target ||
                        !Number.isFinite(linkedAmount) ||
                        linkedAmount <= 0
                      }
                      type='submit'
                    >
                      {copy.linkRefund}
                    </Button>
                  </form>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value='links'>
                <AccordionTrigger>
                  {copy.links} ({links.data?.length || 0})
                </AccordionTrigger>
                <AccordionContent className='space-y-3'>
                  {links.data?.map((link) => (
                    <div
                      key={link.id}
                      className='space-y-3 rounded-lg border p-4 text-sm'
                    >
                      <p className='break-words'>
                        {link.relationType === 'reimbursement'
                          ? copy.reimbursement
                          : copy[link.kind]}
                        : {caption(link.sourceId)} → {caption(link.targetId)} ·{' '}
                        <Currency amount={link.amount} />
                      </p>
                      <Button
                        size='sm'
                        variant='outline'
                        className='hover:border-red-600 hover:bg-red-600 hover:text-white'
                        disabled={disabled}
                        onClick={async () => {
                          const actionProfile = activeProfileId;
                          if (
                            (await confirm({
                              title: copy.unlink,
                              message: copy.unlinkConfirm,
                            })) &&
                            profileRef.current === actionProfile
                          )
                            void action(
                              () =>
                                getDataService().deleteTransactionLink(link.id),
                              copy.removed
                            );
                        }}
                      >
                        {copy.unlink}
                      </Button>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value='recurring'>
                <AccordionTrigger>{copy.recurring}</AccordionTrigger>
                <AccordionContent>
                  <form
                    className='grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(140px,auto)_auto]'
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!bill || disabled) return;
                      void action(async () => {
                        await getDataService().markTransactionRecurring(
                          bill,
                          frequency
                        );
                        if (profileRef.current === activeProfileId) setBill('');
                      }, copy.recorded);
                    }}
                  >
                    <ReviewSelect
                      label={copy.billTransaction}
                      value={bill}
                      onChange={setBill}
                      disabled={disabled}
                      placeholder={copy.select}
                      options={transactionOptions('expense')}
                    />
                    <ReviewSelect
                      label={copy.frequency}
                      value={frequency}
                      onChange={(value) => setFrequency(value as PatternType)}
                      disabled={disabled}
                      options={(
                        [
                          'weekly',
                          'biweekly',
                          'monthly',
                          'quarterly',
                          'yearly',
                        ] as const
                      ).map((value) => ({ value, label: copy[value] }))}
                    />
                    <Button disabled={disabled || !bill} type='submit'>
                      {copy.markBill}
                    </Button>
                  </form>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
