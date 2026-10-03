import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/contexts/ToastContext';
import { getDataService } from '@/lib/db-singleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
export function AccountColors() {
  const { t } = useLanguage(),
    { activeProfileId } = useProfile(),
    toast = useToast(),
    client = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const { data, isError } = useQuery({
    queryKey: ['accounts', activeProfileId],
    queryFn: () => getDataService().getAccounts(),
    enabled: Boolean(activeProfileId),
  });
  const save = useMutation({
    mutationFn: ({ id, color }: { id: string; color: string }) =>
      getDataService().updateAccount(id, { color }),
    onSuccess: async (_, { id }) => {
      await client.invalidateQueries({
        queryKey: ['accounts', activeProfileId],
      });
      await client.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });
      setDrafts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      toast.success(t.householdBudget.saved);
    },
    onError: () => toast.error(t.householdBudget.failed),
  });
  if (!data?.length && !isError) return null;
  return (
    <section
      className='space-y-3 border-t pt-4'
      data-onboarding='account-colors'
      aria-label={t.householdBudget.color}
    >
      <h3 className='text-sm font-semibold'>{t.householdBudget.color}</h3>
      {isError && (
        <p role='alert' className='text-sm text-destructive'>
          {t.householdBudget.failed}
        </p>
      )}
      {data?.map((a) => (
        <div key={a.id} className='flex flex-wrap items-center gap-3'>
          <label className='flex min-w-48 flex-1 items-center gap-3 text-sm'>
            <Input
              type='color'
              className='h-10 w-12 cursor-pointer p-1'
              aria-label={`${t.householdBudget.color}: ${a.name}`}
              value={drafts[a.id] ?? a.color ?? '#8b5cf6'}
              disabled={save.isPending}
              onChange={(event) =>
                setDrafts({ ...drafts, [a.id]: event.target.value })
              }
            />
            {a.name}
          </label>
          <Button
            variant='outline'
            size='sm'
            aria-label={`${t.householdBudget.save}: ${a.name}`}
            disabled={
              save.isPending ||
              !drafts[a.id] ||
              drafts[a.id] === (a.color ?? '#8b5cf6')
            }
            onClick={() => save.mutate({ id: a.id, color: drafts[a.id] })}
          >
            {t.householdBudget.save}
          </Button>
        </div>
      ))}
    </section>
  );
}
