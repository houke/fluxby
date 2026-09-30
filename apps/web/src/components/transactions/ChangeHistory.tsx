import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export function ChangeHistory() {
  const { t, language } = useLanguage();
  const copy = t.transactionTools;
  const { activeProfileId } = useProfile();
  const toast = useToast();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['changeHistory', activeProfileId],
    queryFn: () => api.getChangeHistory(),
    enabled: open && !!activeProfileId,
  });
  return (
    <>
      <Button
        variant='outline'
        size='sm'
        data-onboarding='change-history'
        onClick={() => setOpen(true)}
      >
        {copy.history}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{copy.history}</DialogTitle>
            <DialogDescription>{copy.undoHelp}</DialogDescription>
          </DialogHeader>
          {isLoading && <p>{t.common.loading}</p>}
          {error && <p role='alert'>{t.common.error}</p>}
          {!isLoading && !error && data.length === 0 && <p>{copy.noHistory}</p>}
          <ul className='space-y-3'>
            {data.map((item) => (
              <li
                key={item.id}
                className='flex flex-wrap items-center justify-between gap-2 rounded-md border p-3'
              >
                <div className='min-w-0'>
                  <p className='font-medium break-words'>
                    {copy.entities[item.entityType] || copy.history} ·{' '}
                    {copy.actions[item.action] || t.common.edit}
                    {item.description ? ` · ${item.description}` : ''}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {new Date(item.createdAt).toLocaleString(
                      language === 'nl' ? 'nl-NL' : 'en-GB'
                    )}
                  </p>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={busy || !item.canUndo}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await api.undoChange(item.id);
                      await client.invalidateQueries();
                      toast.success(copy.saved);
                    } catch {
                      toast.error(t.common.error);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {copy.undo}
                </Button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
