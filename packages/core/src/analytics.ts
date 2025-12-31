/**
 * Analytics Calculations
 * All client-side analytics logic
 */

import type { Transaction } from '@fluxby/shared';

export interface DashboardStats {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  transferToSavings: number;
  transferFromSavings: number;
  totalTransfers: number;
  savingsRate: number;
  transactionCount: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface CategoryBreakdown {
  categoryId: string | null;
  categoryName: string;
  total: number;
  percentage: number;
  transactionCount: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Calculate dashboard statistics
 */
export function calculateDashboardStats(
  transactions: Transaction[],
  dateRange?: DateRange
): DashboardStats {
  let filtered = transactions;

  if (dateRange) {
    filtered = transactions.filter((t) => {
      return t.date >= dateRange.startDate && t.date <= dateRange.endDate;
    });
  }

  const stats = filtered.reduce(
    (acc, t) => {
      if (t.type === 'transfer') {
        if (t.amount < 0) {
          acc.transferToSavings += Math.abs(t.amount);
        } else {
          acc.transferFromSavings += t.amount;
        }
      } else if (t.amount > 0) {
        acc.totalIncome += t.amount;
      } else {
        acc.totalExpenses += Math.abs(t.amount);
      }
      acc.transactionCount++;
      return acc;
    },
    {
      totalIncome: 0,
      totalExpenses: 0,
      transferToSavings: 0,
      transferFromSavings: 0,
      transactionCount: 0,
    }
  );

  const totalBalance = stats.totalIncome - stats.totalExpenses;
  const totalTransfers = stats.transferToSavings + stats.transferFromSavings;
  const savingsRate =
    stats.totalIncome > 0
      ? (stats.transferToSavings / stats.totalIncome) * 100
      : 0;

  return {
    ...stats,
    totalBalance,
    totalTransfers,
    savingsRate,
  };
}

/**
 * Calculate monthly income/expense breakdown
 */
export function calculateMonthlyData(
  transactions: Transaction[],
  months: number = 12
): MonthlyData[] {
  const monthlyMap = new Map<string, { income: number; expenses: number }>();

  // Initialize last N months
  const now = new Date();
  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(key, { income: 0, expenses: 0 });
  }

  // Aggregate transactions
  for (const t of transactions) {
    if (t.type === 'transfer') continue;

    const monthKey = t.date.substring(0, 7); // YYYY-MM
    const data = monthlyMap.get(monthKey);

    if (data) {
      if (t.amount > 0) {
        data.income += t.amount;
      } else {
        data.expenses += Math.abs(t.amount);
      }
    }
  }

  // Convert to array sorted by date
  return Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      balance: data.income - data.expenses,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Calculate category breakdown
 */
export function calculateCategoryBreakdown(
  transactions: Transaction[],
  categories: Map<string, string>,
  type: 'income' | 'expense' | 'all' = 'expense'
): CategoryBreakdown[] {
  const categoryTotals = new Map<
    string | null,
    { total: number; count: number }
  >();
  let grandTotal = 0;

  for (const t of transactions) {
    // Filter by type
    if (type === 'income' && t.amount <= 0) continue;
    if (type === 'expense' && t.amount >= 0) continue;
    if (t.type === 'transfer') continue;

    const amount = Math.abs(t.amount);
    const catId = t.categoryId ? String(t.categoryId) : null;

    const existing = categoryTotals.get(catId) || { total: 0, count: 0 };
    categoryTotals.set(catId, {
      total: existing.total + amount,
      count: existing.count + 1,
    });

    grandTotal += amount;
  }

  // Convert to array with percentages
  return Array.from(categoryTotals.entries())
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: categoryId
        ? categories.get(categoryId) || 'Onbekend'
        : 'Niet gecategoriseerd',
      total: data.total,
      percentage: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
      transactionCount: data.count,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Calculate average spending per day
 */
export function calculateAverageSpending(
  transactions: Transaction[],
  dateRange?: DateRange
): number {
  let filtered = transactions.filter(
    (t) => t.amount < 0 && t.type !== 'transfer'
  );

  if (dateRange) {
    filtered = filtered.filter((t) => {
      return t.date >= dateRange.startDate && t.date <= dateRange.endDate;
    });
  }

  if (filtered.length === 0) return 0;

  const totalExpenses = filtered.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0
  );

  // Calculate number of days in range
  const dates = filtered.map((t) => new Date(t.date).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const days = Math.max(
    1,
    Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24))
  );

  return totalExpenses / days;
}

/**
 * Find recurring transactions
 */
export function findRecurringTransactions(transactions: Transaction[]): Array<{
  merchantName: string;
  averageAmount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  occurrences: number;
}> {
  // Group by merchant name
  const merchantGroups = new Map<string, Transaction[]>();

  for (const t of transactions) {
    if (!t.merchantName) continue;
    const key = t.merchantName.toLowerCase();
    const group = merchantGroups.get(key) || [];
    group.push(t);
    merchantGroups.set(key, group);
  }

  const recurring: Array<{
    merchantName: string;
    averageAmount: number;
    frequency: 'weekly' | 'monthly' | 'yearly';
    occurrences: number;
  }> = [];

  for (const [merchant, txns] of merchantGroups) {
    if (txns.length < 3) continue;

    // Calculate average time between transactions
    const sortedDates = txns
      .map((t) => new Date(t.date).getTime())
      .sort((a, b) => a - b);

    const intervals: number[] = [];
    for (let i = 1; i < sortedDates.length; i++) {
      intervals.push(sortedDates[i] - sortedDates[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const avgDays = avgInterval / (1000 * 60 * 60 * 24);

    // Determine frequency
    let frequency: 'weekly' | 'monthly' | 'yearly';
    if (avgDays < 10) {
      frequency = 'weekly';
    } else if (avgDays < 45) {
      frequency = 'monthly';
    } else {
      frequency = 'yearly';
    }

    // Check for consistency (low variance)
    const variance =
      intervals.reduce(
        (sum, interval) => sum + Math.pow(interval - avgInterval, 2),
        0
      ) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avgInterval;

    if (coefficientOfVariation < 0.5) {
      const avgAmount =
        txns.reduce((sum, t) => sum + t.amount, 0) / txns.length;

      recurring.push({
        merchantName: txns[0].merchantName || merchant,
        averageAmount: avgAmount,
        frequency,
        occurrences: txns.length,
      });
    }
  }

  return recurring.sort(
    (a, b) => Math.abs(b.averageAmount) - Math.abs(a.averageAmount)
  );
}
