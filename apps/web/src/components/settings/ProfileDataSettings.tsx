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
import { useConfirm } from '@/contexts/ConfirmContext';

export function ProfileDataSettings() {
  const { t } = useLanguage();
  const { activeProfile } = useProfile();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
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
    },
    {
      titleKey: 'deleteCategoriesTitle',
      descKey: 'deleteCategoriesDescription',
      confirmKey: 'deleteCategoriesConfirm',
      successKey: 'deleteCategoriesSuccess',
      errorKey: 'deleteCategoriesError',
      buttonKey: 'deleteCategoriesButton',
      action: api.deleteAllCategories,
    },
    {
      titleKey: 'deleteAccountsTitle',
      descKey: 'deleteAccountsDescription',
      confirmKey: 'deleteAccountsConfirm',
      successKey: 'deleteAccountsSuccess',
      errorKey: 'deleteAccountsError',
      buttonKey: 'deleteAccountsButton',
      action: api.deleteAllAccounts,
    },
    {
      titleKey: 'deleteBudgetsTitle',
      descKey: 'deleteBudgetsDescription',
      confirmKey: 'deleteBudgetsConfirm',
      successKey: 'deleteBudgetsSuccess',
      errorKey: 'deleteBudgetsError',
      buttonKey: 'deleteBudgetsButton',
      action: api.deleteAllBudgets,
    },
    {
      titleKey: 'deleteAddressBookTitle',
      descKey: 'deleteAddressBookDescription',
      confirmKey: 'deleteAddressBookConfirm',
      successKey: 'deleteAddressBookSuccess',
      errorKey: 'deleteAddressBookError',
      buttonKey: 'deleteAddressBookButton',
      action: api.deleteAllAddressBook,
    },
    {
      titleKey: 'deleteImportHistoryTitle',
      descKey: 'deleteImportHistoryDescription',
      confirmKey: 'deleteImportHistoryConfirm',
      successKey: 'deleteImportHistorySuccess',
      errorKey: 'deleteImportHistoryError',
      buttonKey: 'deleteImportHistoryButton',
      action: api.deleteImportHistory,
    },
    {
      titleKey: 'deleteSubscriptionsTitle',
      descKey: 'deleteSubscriptionsDescription',
      confirmKey: 'deleteSubscriptionsConfirm',
      successKey: 'deleteSubscriptionsSuccess',
      errorKey: 'deleteSubscriptionsError',
      buttonKey: 'deleteSubscriptionsButton',
      action: api.deleteAllRecurringPatterns,
    },
  ];

  const getText = (key: keyof typeof t.settings.profileData): string =>
    t.settings.profileData[key];

  return (
    <div className=''>
      <Card
        className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
        data-onboarding='settings-profile-data'
      >
        <CardHeader className='px-3 py-3 sm:px-6 sm:py-4'>
          <CardTitle className='flex items-center gap-2 text-base sm:text-lg'>
            {getText('title')}
          </CardTitle>
          <CardDescription className='text-xs sm:text-sm'>
            {getText('description').replace(
              '{profile}',
              activeProfile?.name || getText('profileNameFallback')
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className='px-3 pt-0 pb-3 sm:px-6 sm:pt-0 sm:pb-6'>
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
                      item.titleKey as keyof typeof t.settings.profileData
                    )}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {getText(
                      item.descKey as keyof typeof t.settings.profileData
                    )}
                  </p>
                </div>
                <Button
                  variant='outline'
                  className='border-orange-500 bg-orange-50 text-orange-700 hover:border-orange-600 hover:bg-orange-100 hover:text-orange-800 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-400 dark:hover:bg-orange-900'
                  disabled={isLoading}
                  onClick={async () => {
                    const confirmMsg = getText(
                      item.confirmKey as keyof typeof t.settings.profileData
                    );
                    const isConfirmed = await confirm({
                      title: getText(
                        item.titleKey as keyof typeof t.settings.profileData
                      ),
                      message: confirmMsg,
                      variant: 'danger',
                    });
                    if (isConfirmed) {
                      handleDelete(
                        item.action,
                        getText(
                          item.successKey as keyof typeof t.settings.profileData
                        ),
                        getText(
                          item.errorKey as keyof typeof t.settings.profileData
                        )
                      );
                    }
                  }}
                >
                  {isLoading && (
                    <RefreshCcw className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  {getText(
                    item.buttonKey as keyof typeof t.settings.profileData
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
