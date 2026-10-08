import React from 'react';
import {
  Wallet,
  PiggyBank,
  CreditCard,
  Coins,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Currency } from '@/components/ui/currency';
import { Account } from '@fluxby/shared';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAccountIconStyle } from '@/lib/account-color';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AccountBalanceCardsProps {
  accounts: Account[];
  accountScrollIndex: number;
  setAccountScrollIndex: (index: number) => void;
}

export function AccountBalanceCards({
  accounts,
  accountScrollIndex,
  setAccountScrollIndex,
}: AccountBalanceCardsProps) {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const displayedAccounts = isMobile
    ? accounts
    : accounts.slice(accountScrollIndex, accountScrollIndex + 3);

  if (!accounts || accounts.length === 0) return null;

  // Color logic: checking accounts are green/red based on balance, savings are blue
  const getAccountColors = (type: string, balance: number) => {
    if (type === 'checking') {
      return balance >= 0
        ? {
            bg: 'bg-emerald-50 dark:bg-emerald-950',
            text: 'text-emerald-600',
          }
        : {
            bg: 'bg-red-50 dark:bg-red-950',
            text: 'text-red-600',
          };
    } else if (type === 'savings') {
      return {
        bg: 'bg-blue-50 dark:bg-blue-950',
        text: 'text-blue-600',
      };
    } else {
      return {
        bg: 'bg-gray-50 dark:bg-gray-950',
        text: 'text-gray-600',
      };
    }
  };

  return (
    <div
      className='flex w-full max-w-full min-w-0 items-center gap-2 sm:w-auto'
      data-onboarding='dashboard-accounts'
    >
      {!isMobile && accounts.length > 3 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                onClick={() =>
                  setAccountScrollIndex(Math.max(0, accountScrollIndex - 1))
                }
                disabled={accountScrollIndex === 0}
                className='h-8 w-8 rounded-md'
                aria-label={t.common.previous}
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t.common.previous}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <div
        className={`flex max-w-full min-w-0 gap-px overflow-x-auto overscroll-contain border-b-0 bg-border sm:flex-initial sm:gap-3 sm:bg-transparent sm:px-2 sm:pb-2 ${
          isMobile ? 'w-full' : 'flex-1'
        }`}
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none', // Hide scrollbar for cleaner look
          msOverflowStyle: 'none',
        }}
      >
        {displayedAccounts.map((account) => {
          const balance = account.currentBalance || 0;
          const colors = getAccountColors(account.type, balance);
          const iconStyle = getAccountIconStyle(account.color);
          const AccountIcon =
            account.type === 'savings'
              ? PiggyBank
              : account.type === 'credit' || account.type === 'loan'
                ? CreditCard
                : account.type === 'cash'
                  ? Coins
                  : account.type === 'investment'
                    ? TrendingUp
                    : Wallet;

          return (
            <div
              key={account.id}
              data-onboarding='transaction-account-card'
              className={`flex flex-1 flex-shrink-0 items-center gap-3 border-r border-border bg-card px-3 py-2 last:border-r-0 sm:flex-initial sm:rounded-lg sm:border sm:px-4 sm:shadow-sm ${
                isMobile && displayedAccounts.length === 1
                  ? 'min-w-full'
                  : 'min-w-[10rem] sm:min-w-[12rem]'
              }`}
            >
              <div
                className={`rounded-full p-2 ${iconStyle ? '' : colors.bg}`}
                style={iconStyle}
              >
                <AccountIcon
                  className={`h-4 w-4 ${iconStyle ? '' : colors.text}`}
                  aria-hidden
                />
              </div>
              <div className='min-w-0'>
                <p className='truncate text-xs text-muted-foreground'>
                  {account.name}
                </p>
                <p className='font-semibold'>
                  <Currency amount={balance} />
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {!isMobile && accounts.length > 3 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                onClick={() =>
                  setAccountScrollIndex(
                    Math.min(accounts.length - 3, accountScrollIndex + 1)
                  )
                }
                disabled={accountScrollIndex >= accounts.length - 3}
                className='h-8 w-8 rounded-md'
                aria-label={t.common.next}
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t.common.next}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
