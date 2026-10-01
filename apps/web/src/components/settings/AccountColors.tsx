import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/contexts/ToastContext';
import { getDataService } from '@/lib/db-singleton';
export function AccountColors() {
  const { t } = useLanguage(),
    { activeProfileId } = useProfile(),
    toast = useToast(),
    client = useQueryClient();
  const { data } = useQuery({
    queryKey: ['accounts', activeProfileId],
    queryFn: () => getDataService().getAccounts(),
  });
  return (
    <div className='flex flex-wrap gap-4' data-onboarding='account-colors'>
      {data?.map((a) => (
        <label key={a.id} className='flex items-center gap-2 text-sm'>
          <input
            type='color'
            aria-label={`${t.householdBudget.color}: ${a.name}`}
            value={a.color || '#8b5cf6'}
            onChange={async (e) => {
              try {
                await getDataService().updateAccount(a.id, {
                  color: e.target.value,
                });
                await client.invalidateQueries({
                  queryKey: ['accounts', activeProfileId],
                });
                toast.success(t.householdBudget.saved);
              } catch {
                toast.error(t.householdBudget.failed);
              }
            }}
          />
          {a.name}
        </label>
      ))}
    </div>
  );
}
