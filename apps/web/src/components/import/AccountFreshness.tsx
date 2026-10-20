import { formatDate } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { getDataService } from '@/lib/db-singleton';
import { importToolsTranslations } from '@/lib/i18n/import-tools';
import { getAccountFreshnessStatus } from '@/lib/importers/account-freshness';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function AccountFreshness() {
  const { language } = useLanguage();
  const text = importToolsTranslations[language];
  const { activeProfileId } = useProfile();
  const {
    data: accounts = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['import-freshness', activeProfileId],
    queryFn: () => getDataService().getAccountImportFreshness(),
    enabled: Boolean(activeProfileId),
  });
  return (
    <Card
      className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
      data-onboarding='account-freshness'
    >
      <CardHeader className='px-3 py-3 sm:px-6 sm:py-4'>
        <CardTitle className='text-base sm:text-lg'>{text.freshness}</CardTitle>
        <CardDescription>{text.freshnessHelp}</CardDescription>
      </CardHeader>
      <CardContent className='px-3 pt-0 pb-3 sm:px-6 sm:pt-0 sm:pb-6'>
        {isLoading ? (
          <p className='text-sm text-muted-foreground'>{text.loading}</p>
        ) : isError ? (
          <div
            className='flex flex-wrap items-center gap-3 text-sm'
            role='alert'
          >
            <p className='text-destructive'>{text.loadFailed}</p>
            <Button variant='outline' size='sm' onClick={() => void refetch()}>
              {text.retry}
            </Button>
          </div>
        ) : accounts.length === 0 ? (
          <p className='text-sm text-muted-foreground'>{text.emptyAccounts}</p>
        ) : (
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {accounts.map((account) => {
              const status = getAccountFreshnessStatus(account);
              return (
                <div key={account.id} className='rounded-lg border p-3 text-sm'>
                  <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
                    <span className='font-medium'>{account.name}</span>
                    <Badge
                      variant='outline'
                      className={
                        status === 'fresh'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                          : status === 'aging'
                            ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200'
                            : status === 'stale'
                              ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
                              : 'bg-muted text-slate-600 dark:text-slate-300'
                      }
                    >
                      {text[status]}
                    </Badge>
                  </div>
                  <p className='text-muted-foreground'>
                    {text.imported}:{' '}
                    {account.lastImportedAt === null
                      ? text.never
                      : formatDate(new Date(account.lastImportedAt))}
                  </p>
                  <p className='text-muted-foreground'>
                    {text.newest}:{' '}
                    {account.newestTransactionDate
                      ? formatDate(account.newestTransactionDate)
                      : '—'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
