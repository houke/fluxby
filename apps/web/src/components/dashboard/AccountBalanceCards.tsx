import React from 'react';
import {
  Wallet,
  PiggyBank,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Currency } from '@/components/ui/currency';
import { Account } from '@fluxby/shared';

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
      className='-mx-3 flex items-center gap-2 sm:mx-0'
      data-onboarding='dashboard-accounts'
    >
      {accounts.length > 3 && (
        <Button
          variant='ghost'
          size='icon'
          onClick={() =>
            setAccountScrollIndex(Math.max(0, accountScrollIndex - 1))
          }
          disabled={accountScrollIndex === 0}
          className='h-8 w-8'
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>
      )}

      <div
        className='flex flex-1 gap-px overflow-x-auto overscroll-contain border-b-0 bg-border sm:flex-initial sm:gap-3 sm:bg-transparent sm:px-2 sm:pb-2'
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {accounts
          .slice(accountScrollIndex, accountScrollIndex + 3)
          .map((account) => {
            const balance = account.currentBalance || 0;
            const colors = getAccountColors(account.type, balance);

            return (
              <div
                key={account.id}
                className='flex min-w-[10rem] flex-1 flex-shrink-0 items-center gap-3 border-r border-border bg-card px-3 py-2 last:border-r-0 sm:min-w-[12rem] sm:flex-initial sm:rounded-lg sm:border sm:px-4 sm:shadow-sm'
              >
                <div className={`rounded-full p-2 ${colors.bg}`}>
                  {account.type === 'checking' && (
                    <Wallet className={`h-4 w-4 ${colors.text}`} />
                  )}
                  {account.type === 'savings' && (
                    <PiggyBank className={`h-4 w-4 ${colors.text}`} />
                  )}
                  {account.type === 'credit' && (
                    <CreditCard className={`h-4 w-4 ${colors.text}`} />
                  )}
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

      {accounts.length > 3 && (
        <Button
          variant='ghost'
          size='icon'
          onClick={() =>
            setAccountScrollIndex(
              Math.min(accounts.length - 3, accountScrollIndex + 1)
            )
          }
          disabled={accountScrollIndex >= accounts.length - 3}
          className='h-8 w-8'
        >
          <ChevronRight className='h-4 w-4' />
        </Button>
      )}
    </div>
  );
}
