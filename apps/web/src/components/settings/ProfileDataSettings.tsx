import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';

export function ProfileDataSettings() {
  const { t } = useLanguage();
  const { activeProfile } = useProfile();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-hide notice
  React.useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleDelete = async (
    action: () => Promise<unknown>,
    successMsg: string,
    errorMsg: string
  ) => {
    setIsLoading(true);
    try {
      await action();
      queryClient.invalidateQueries();
      setNotice({ type: 'success', text: successMsg });
    } catch {
      setNotice({ type: 'error', text: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItems = [
    {
      titleKey: 'deleteTransactionsTitle',
      descKey: 'deleteTransactionsDescription',
      confirmKey: 'deleteTransactionsConfirm',
      successKey: 'deleteTransactionsSuccess',
      errorKey: 'deleteTransactionsError',
      buttonKey: 'deleteTransactionsButton',
      action: api.deleteAllTransactions,
      fallbackTitle: 'Transacties verwijderen',
      fallbackDesc: 'Verwijder alle transacties van dit profiel',
      fallbackConfirm:
        'Weet je zeker dat je alle transacties van dit profiel wilt verwijderen?',
      fallbackSuccess: 'Alle transacties verwijderd',
      fallbackError: 'Fout bij verwijderen transacties',
      fallbackButton: 'Verwijder transacties',
    },
    {
      titleKey: 'deleteCategoriesTitle',
      descKey: 'deleteCategoriesDescription',
      confirmKey: 'deleteCategoriesConfirm',
      successKey: 'deleteCategoriesSuccess',
      errorKey: 'deleteCategoriesError',
      buttonKey: 'deleteCategoriesButton',
      action: api.deleteAllCategories,
      fallbackTitle: 'Categorieën verwijderen',
      fallbackDesc: 'Verwijder alle categorieën, regels en budgetten',
      fallbackConfirm:
        'Weet je zeker dat je alle categorieën wilt verwijderen? Dit verwijdert ook alle regels en budgetten.',
      fallbackSuccess: 'Alle categorieën verwijderd',
      fallbackError: 'Fout bij verwijderen categorieën',
      fallbackButton: 'Verwijder categorieën',
    },
    {
      titleKey: 'deleteAccountsTitle',
      descKey: 'deleteAccountsDescription',
      confirmKey: 'deleteAccountsConfirm',
      successKey: 'deleteAccountsSuccess',
      errorKey: 'deleteAccountsError',
      buttonKey: 'deleteAccountsButton',
      action: api.deleteAllAccounts,
      fallbackTitle: 'Rekeningen verwijderen',
      fallbackDesc: 'Verwijder alle rekeningen (en bijbehorende transacties)',
      fallbackConfirm:
        'Weet je zeker dat je alle rekeningen wilt verwijderen? Dit verwijdert ook alle transacties.',
      fallbackSuccess: 'Alle rekeningen verwijderd',
      fallbackError: 'Fout bij verwijderen rekeningen',
      fallbackButton: 'Verwijder rekeningen',
    },
    {
      titleKey: 'deleteBudgetsTitle',
      descKey: 'deleteBudgetsDescription',
      confirmKey: 'deleteBudgetsConfirm',
      successKey: 'deleteBudgetsSuccess',
      errorKey: 'deleteBudgetsError',
      buttonKey: 'deleteBudgetsButton',
      action: api.deleteAllBudgets,
      fallbackTitle: 'Budgetten verwijderen',
      fallbackDesc: 'Verwijder alle budgetten',
      fallbackConfirm: 'Weet je zeker dat je alle budgetten wilt verwijderen?',
      fallbackSuccess: 'Alle budgetten verwijderd',
      fallbackError: 'Fout bij verwijderen budgetten',
      fallbackButton: 'Verwijder budgetten',
    },
  ];

  // Helper to get translation with fallback
  const getText = (
    key: keyof typeof t.settings.profileData,
    fallback: string
  ): string => {
    const profileData = t.settings.profileData as
      | Record<string, string>
      | undefined;
    return profileData?.[key] || fallback;
  };

  return (
    <Card data-onboarding='settings-profile-data'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          {getText('title', 'Profielgegevens verwijderen')}
        </CardTitle>
        <CardDescription>
          {(
            getText('description', 'Verwijder gegevens van {profile}') as string
          ).replace('{profile}', activeProfile?.name || 'dit profiel')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {notice && (
            <div
              className={`rounded border px-3 py-2 text-sm ${
                notice.type === 'success'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {notice.text}
            </div>
          )}

          {deleteItems.map((item, index) => (
            <div
              key={item.titleKey}
              className={`flex items-center justify-between py-3 ${index > 0 ? 'border-t' : ''}`}
            >
              <div>
                <p className='font-medium text-orange-600'>
                  {getText(
                    item.titleKey as keyof typeof t.settings.profileData,
                    item.fallbackTitle
                  )}
                </p>
                <p className='text-sm text-muted-foreground'>
                  {getText(
                    item.descKey as keyof typeof t.settings.profileData,
                    item.fallbackDesc
                  )}
                </p>
              </div>
              <Button
                variant='outline'
                className='border-orange-500 bg-orange-50 text-orange-700 hover:border-orange-600 hover:bg-orange-100 hover:text-orange-800 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-400 dark:hover:bg-orange-900'
                disabled={isLoading}
                onClick={() => {
                  const confirmMsg = getText(
                    item.confirmKey as keyof typeof t.settings.profileData,
                    item.fallbackConfirm
                  );
                  if (confirm(confirmMsg)) {
                    handleDelete(
                      item.action,
                      getText(
                        item.successKey as keyof typeof t.settings.profileData,
                        item.fallbackSuccess
                      ),
                      getText(
                        item.errorKey as keyof typeof t.settings.profileData,
                        item.fallbackError
                      )
                    );
                  }
                }}
              >
                {isLoading && (
                  <RefreshCcw className='mr-2 h-4 w-4 animate-spin' />
                )}
                {getText(
                  item.buttonKey as keyof typeof t.settings.profileData,
                  item.fallbackButton
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
