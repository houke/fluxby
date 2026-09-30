import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Account } from '@fluxby/shared';
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

export function StatementReconciliation({
  accounts,
  startDate,
  endDate,
}: {
  accounts: Account[];
  startDate: string;
  endDate: string;
}) {
  const { t } = useLanguage();
  const copy = t.transactionTools;
  const { activeProfileId } = useProfile();
  const toast = useToast();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(endDate);
  const [opening, setOpening] = useState('');
  const [closing, setClosing] = useState('');
  const [busy, setBusy] = useState(false);
  const { data = [], error } = useQuery({
    queryKey: ['reconciliations', activeProfileId],
    queryFn: () => api.getReconciliations(),
    enabled: open && !!activeProfileId,
  });
  return (
    <>
      <Button
        variant='outline'
        size='sm'
        data-onboarding='reconciliation'
        onClick={() => {
          setStart(startDate);
          setEnd(endDate);
          setOpen(true);
        }}
      >
        {copy.reconcile}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{copy.reconcile}</DialogTitle>
            <DialogDescription>{copy.reconcileHelp}</DialogDescription>
          </DialogHeader>
          <form
            className='grid gap-3 sm:grid-cols-2'
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              try {
                await api.reconcileStatement({
                  accountId,
                  startDate: start,
                  endDate: end,
                  openingBalance: Number(opening),
                  closingBalance: Number(closing),
                });
                await client.invalidateQueries({
                  queryKey: ['reconciliations', activeProfileId],
                });
                toast.success(copy.saved);
              } catch {
                toast.error(t.common.error);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className='sm:col-span-2'>
              {copy.account}
              <select
                className='w-full rounded-md border bg-background p-2'
                value={accountId}
                onChange={(event) => setAccountId(event.target.value)}
                required
              >
                <option value=''>{copy.account}</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} · {account.iban}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {copy.startDate}
              <Input
                type='date'
                value={start}
                max={end}
                onChange={(event) => setStart(event.target.value)}
                required
              />
            </label>
            <label>
              {copy.endDate}
              <Input
                type='date'
                value={end}
                min={start}
                onChange={(event) => setEnd(event.target.value)}
                required
              />
            </label>
            <label>
              {copy.openingBalance}
              <Input
                type='number'
                step='0.01'
                value={opening}
                onChange={(event) => setOpening(event.target.value)}
                required
              />
            </label>
            <label>
              {copy.closingBalance}
              <Input
                type='number'
                step='0.01'
                value={closing}
                onChange={(event) => setClosing(event.target.value)}
                required
              />
            </label>
            <Button
              type='submit'
              disabled={busy || !accountId || opening === '' || closing === ''}
            >
              {copy.reconcile}
            </Button>
          </form>
          {error && <p role='alert'>{t.common.error}</p>}
          <div className='space-y-3'>
            {data.map((item) => (
              <div className='rounded-md border p-3 text-sm' key={item.id}>
                <p className='font-medium'>
                  {
                    accounts.find((account) => account.id === item.accountId)
                      ?.name
                  }{' '}
                  · {item.startDate} – {item.endDate}
                </p>
                <p>
                  {copy.expectedBalance}:{' '}
                  <Currency amount={item.expectedClosingBalance} />
                </p>
                <p>
                  {copy.closingBalance}:{' '}
                  <Currency amount={item.actualClosingBalance} />
                </p>
                <p className='font-medium'>
                  {item.status === 'matched' ? copy.matched : copy.difference}:{' '}
                  <Currency amount={item.difference} />
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
