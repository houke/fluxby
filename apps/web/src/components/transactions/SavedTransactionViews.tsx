import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useProfile } from '@/contexts/ProfileContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  decodeTransactionView,
  encodeTransactionView,
  type TransactionView,
} from '@/lib/transaction-view';

export function SavedTransactionViews({
  view,
  onApply,
  onCompactChange,
}: {
  view: TransactionView;
  onApply: (view: TransactionView) => void;
  onCompactChange: (compact: boolean) => void;
}) {
  const { t } = useLanguage();
  const copy = t.transactionTools;
  const { activeProfileId } = useProfile();
  const toast = useToast();
  const confirm = useConfirm();
  const client = useQueryClient();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const { data: views = [], error } = useQuery({
    queryKey: ['savedViews', activeProfileId],
    queryFn: () => api.getSavedViews(),
    enabled: !!activeProfileId,
  });
  const refresh = () =>
    client.invalidateQueries({ queryKey: ['savedViews', activeProfileId] });
  return (
    <div
      className='space-y-3 rounded-lg border bg-card p-3'
      data-onboarding='saved-views'
    >
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          variant='outline'
          size='sm'
          aria-pressed={view.compact}
          onClick={() => onCompactChange(!view.compact)}
        >
          {view.compact ? copy.comfortable : copy.compact}
        </Button>
        <form
          className='flex flex-wrap items-center gap-2'
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            try {
              await api.createSavedView({
                name: name.trim(),
                filters: encodeTransactionView(view),
              });
              setName('');
              await refresh();
              toast.success(copy.saved);
            } catch (err) {
              toast.error(err as Error);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Input
            className='w-44'
            value={name}
            aria-label={copy.viewName}
            placeholder={copy.viewName}
            maxLength={100}
            onChange={(event) => setName(event.target.value)}
          />
          <Button
            variant='outline'
            size='sm'
            type='submit'
            disabled={!name.trim() || busy}
          >
            {copy.saveView}
          </Button>
        </form>
      </div>
      {error && <p role='alert'>{t.common.error}</p>}
      {views.length > 0 && (
        <div className='flex flex-wrap gap-2' aria-label={copy.savedViews}>
          {views.map((saved) => (
            <div
              key={saved.id}
              className='flex items-center gap-1 rounded-md border p-1'
            >
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  const parsed = decodeTransactionView(saved.filters);
                  if (parsed) onApply(parsed);
                  else toast.error(copy.invalidFilters);
                }}
              >
                {saved.name}
              </Button>
              <Button
                variant='ghost'
                size='sm'
                disabled={busy}
                onClick={async () => {
                  if (
                    !(await confirm({
                      title: t.common.delete,
                      message: copy.confirmDelete,
                      confirmLabel: t.common.delete,
                      cancelLabel: t.common.cancel,
                      variant: 'danger',
                    }))
                  )
                    return;
                  setBusy(true);
                  try {
                    await api.deleteSavedView(saved.id);
                    await refresh();
                    toast.success(copy.deleted);
                  } catch (err) {
                    toast.error(err as Error);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {t.common.delete}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
