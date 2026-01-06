import { memo } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  PiggyBank,
  ChevronRight,
  ChevronLeft,
  Wallet,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, cn } from '@/lib/utils';

export interface Account {
  id: number;
  iban: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  bank: string;
  currentBalance: number;
  balance?: number;
}

export interface TransactionTotals {
  income: number;
  expenses: number;
  balance: number;
  netSavingsTransfer: number;
  transferToSavings: number;
  transferFromSavings: number;
}

export interface TransactionHeaderProps {
  title: string;
  subtitle: string;
  accounts: Account[] | undefined;
  accountScrollIndex: number;
  onAccountScrollIndexChange: (index: number) => void;
  totals: TransactionTotals;
  t: {
    dashboard: {
      income: string;
      expenses: string;
      toSavings: string;
      netResult: string;
    };
  };
}

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

export const TransactionHeader = memo(function TransactionHeader({
  title,
  subtitle,
  accounts,
  accountScrollIndex,
  onAccountScrollIndexChange,
  totals,
  t,
}: TransactionHeaderProps) {
  return (
    <>
      {/* Title and Account Cards */}
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold'>{title}</h1>
          <p className='mt-1 text-muted-foreground'>{subtitle}</p>
        </div>

        {/* Account Balance Cards */}
        {accounts && accounts.length > 0 && (
          <div
            className='flex items-center gap-2'
            data-onboarding='transaction-accounts'
          >
            {accounts.length > 3 && (
              <Button
                variant='ghost'
                size='icon'
                onClick={() =>
                  onAccountScrollIndexChange(
                    Math.max(0, accountScrollIndex - 1)
                  )
                }
                disabled={accountScrollIndex === 0}
                className='h-8 w-8'
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
            )}

            <div
              className='-mx-2 flex gap-3 overflow-x-auto overscroll-contain px-2 pb-2 sm:overflow-x-visible'
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
                      className='flex min-w-[12rem] flex-shrink-0 items-center gap-3 rounded-lg border bg-card px-4 py-2 shadow-sm'
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
                          {formatCurrency(balance)}
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
                  onAccountScrollIndexChange(
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
        )}
      </div>

      {/* Summary Cards */}
      <div
        className='grid grid-cols-2 gap-4 lg:grid-cols-4'
        data-onboarding='transaction-summary'
      >
        {/* Income Card */}
        <Card className='card-hover'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div className='mr-4 min-w-0 flex-1'>
                <p className='text-sm text-muted-foreground'>
                  {t.dashboard.income}
                </p>
                <p className='mt-1 text-2xl font-bold whitespace-nowrap'>
                  {formatCurrency(totals.income)}
                </p>
              </div>
              <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30'>
                <ArrowUpRight className='h-6 w-6 text-emerald-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card className='card-hover'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div className='mr-4 min-w-0 flex-1'>
                <p className='text-sm text-muted-foreground'>
                  {t.dashboard.expenses}
                </p>
                <p className='mt-1 text-2xl font-bold whitespace-nowrap'>
                  {formatCurrency(totals.expenses)}
                </p>
              </div>
              <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30'>
                <ArrowDownRight className='h-6 w-6 text-rose-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Savings Card */}
        <Card className='card-hover'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div className='mr-4 min-w-0 flex-1'>
                <p className='text-sm text-muted-foreground'>
                  {t.dashboard.toSavings}
                </p>
                <p className='mt-1 text-2xl font-bold whitespace-nowrap'>
                  {formatCurrency(totals.netSavingsTransfer)}
                </p>
                <p className='mt-1 text-xs whitespace-nowrap text-muted-foreground'>
                  +{formatCurrency(totals.transferToSavings)} / -
                  {formatCurrency(totals.transferFromSavings)}
                </p>
              </div>
              <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30'>
                <PiggyBank className='h-6 w-6 text-blue-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Result Card */}
        <Card className='card-hover'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div className='mr-4 min-w-0 flex-1'>
                <p className='text-sm text-muted-foreground'>
                  {t.dashboard.netResult}
                </p>
                <p
                  className={cn(
                    'mt-1 text-2xl font-bold whitespace-nowrap',
                    totals.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  )}
                >
                  {formatCurrency(totals.balance)}
                </p>
              </div>
              <div
                className={cn(
                  'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full',
                  totals.balance >= 0
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : 'bg-rose-100 dark:bg-rose-900/30'
                )}
              >
                <Wallet
                  className={cn(
                    'h-6 w-6',
                    totals.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
});

export default TransactionHeader;
