import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDataService } from '@/contexts/DatabaseContext';
import { useFilterParams } from '@/contexts/FilterContext';
import { useProfile } from '@/contexts/ProfileContext';
import { api } from '@/lib/api';

// Minimal transaction type for totals calculation
interface TransactionForTotals {
  id: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
}

interface TransactionTotals {
  income: number;
  expenses: number;
  transferToSavings: number;
  transferFromSavings: number;
  netSavingsTransfer: number;
  balance: number;
  count: number;
}

/**
 * Shared hook for calculating transaction totals.
 * Uses the same calculation logic for both Dashboard and Transactions pages.
 *
 * Important: Transfers are NOT counted in income/expenses to avoid double counting.
 * - Income = positive amounts where type != 'transfer'
 * - Expenses = negative amounts where type != 'transfer'
 * - TransferToSavings = negative transfer amounts (money leaving checking)
 * - TransferFromSavings = positive transfer amounts (money coming back)
 */
export function useTransactionTotals(
  transactions?: TransactionForTotals[]
): TransactionTotals {
  return useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        income: 0,
        expenses: 0,
        transferToSavings: 0,
        transferFromSavings: 0,
        netSavingsTransfer: 0,
        balance: 0,
        count: 0,
      };
    }

    const result = transactions.reduce(
      (acc, tx) => {
        if (tx.type === 'transfer') {
          if (tx.amount < 0) {
            acc.transferToSavings += Math.abs(tx.amount);
          } else {
            acc.transferFromSavings += tx.amount;
          }
        } else if (tx.type === 'income') {
          acc.income += tx.amount;
        } else if (tx.type === 'expense') {
          acc.expenses += Math.abs(tx.amount);
        }
        return acc;
      },
      { income: 0, expenses: 0, transferToSavings: 0, transferFromSavings: 0 }
    );

    return {
      ...result,
      netSavingsTransfer: result.transferToSavings - result.transferFromSavings,
      balance: result.income - result.expenses,
      count: transactions.length,
    };
  }, [transactions]);
}

interface TransactionTotalsQuery {
  income: number;
  expenses: number;
  transferToSavings: number;
  transferFromSavings: number;
  netSavingsTransfer: number;
  balance: number;
  count: number;
}

/**
 * Hook to get transaction totals directly from database aggregation.
 * This is much more efficient than loading all transactions for large datasets.
 * Use this when you only need totals, not the individual transactions.
 */
export function useTransactionTotalsQuery(filters?: Record<string, string>) {
  const { activeProfileId } = useProfile();
  const { startDate, endDate } = useFilterParams();

  // Merge filter params with passed filters
  const mergedFilters = {
    startDate,
    endDate,
    ...filters,
  };

  const { data, isLoading } = useQuery<TransactionTotalsQuery>({
    queryKey: ['transaction-totals', activeProfileId, mergedFilters],
    queryFn: async () => {
      const result = await api.getTransactionTotals(mergedFilters);
      return {
        ...result,
        netSavingsTransfer:
          result.transferToSavings - result.transferFromSavings,
      };
    },
    staleTime: 60 * 1000, // 1 minute - totals are derived data
    enabled: !!activeProfileId,
  });

  return {
    totals: data || {
      income: 0,
      expenses: 0,
      transferToSavings: 0,
      transferFromSavings: 0,
      netSavingsTransfer: 0,
      balance: 0,
      count: 0,
    },
    isLoading,
  };
}

interface DashboardStats {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  totalTransfers: number;
  savingsRate: number;
  transactionCount: number;
}

/**
 * Hook to get totals from the API dashboard endpoint.
 * This ensures consistency with the Dashboard page.
 */
export function useDashboardTotals() {
  const dataService = useDataService();
  const { startDate, endDate } = useFilterParams();

  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard', startDate, endDate],
    queryFn: async () => {
      const stats = await dataService.getDashboardStats(startDate, endDate);
      return {
        totalBalance: stats.totalIncome - stats.totalExpenses,
        totalIncome: stats.totalIncome,
        totalExpenses: stats.totalExpenses,
        totalTransfers: 0,
        savingsRate:
          stats.totalIncome > 0
            ? ((stats.totalIncome - stats.totalExpenses) / stats.totalIncome) *
              100
            : 0,
        transactionCount: stats.transactionCount,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - consistency with dashboard
  });

  return {
    totals: {
      income: data?.totalIncome || 0,
      expenses: data?.totalExpenses || 0,
      transfers: data?.totalTransfers || 0,
      balance: data?.totalBalance || 0,
      count: data?.transactionCount || 0,
    },
    isLoading,
    data,
  };
}
