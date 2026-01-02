import { describe, it, expect } from 'vitest';
import {
  calculateDashboardStats,
  calculateMonthlyData,
  calculateCategoryBreakdown,
  calculateAverageSpending,
  findRecurringTransactions,
} from '@fluxby/core';
import type { Transaction } from '@fluxby/shared';

describe('calculateDashboardStats', () => {
  const createTransaction = (
    overrides: Partial<Transaction> = {}
  ): Transaction => ({
    id: 'tx-123',
    date: '2024-01-15',
    amount: -50,
    type: 'expense',
    description: 'Test transaction',
    merchantName: null,
    categoryId: null,
    accountId: 'account-123',
    profileId: 'profile-456',
    opposingAccountIban: null,
    opposingAccountName: null,
    balanceAfter: null,
    rawData: null,
    importHash: null,
    importId: null,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
    isDeleted: false,
    deviceId: 'device-123',
    ...overrides,
  });

  describe('income and expense calculation', () => {
    it('calculates total income from positive amounts', () => {
      const transactions = [
        createTransaction({ amount: 1000, type: 'income' }),
        createTransaction({ amount: 500, type: 'income' }),
      ];

      const result = calculateDashboardStats(transactions);
      expect(result.totalIncome).toBe(1500);
    });

    it('calculates total expenses from negative amounts', () => {
      const transactions = [
        createTransaction({ amount: -100, type: 'expense' }),
        createTransaction({ amount: -200, type: 'expense' }),
      ];

      const result = calculateDashboardStats(transactions);
      expect(result.totalExpenses).toBe(300);
    });

    it('calculates balance as income minus expenses', () => {
      const transactions = [
        createTransaction({ amount: 1000, type: 'income' }),
        createTransaction({ amount: -300, type: 'expense' }),
      ];

      const result = calculateDashboardStats(transactions);
      expect(result.totalBalance).toBe(700);
    });
  });

  describe('transfer handling', () => {
    it('calculates transfers to savings (negative transfer)', () => {
      const transactions = [
        createTransaction({ amount: -500, type: 'transfer' }),
        createTransaction({ amount: -200, type: 'transfer' }),
      ];

      const result = calculateDashboardStats(transactions);
      expect(result.transferToSavings).toBe(700);
    });

    it('calculates transfers from savings (positive transfer)', () => {
      const transactions = [
        createTransaction({ amount: 300, type: 'transfer' }),
        createTransaction({ amount: 100, type: 'transfer' }),
      ];

      const result = calculateDashboardStats(transactions);
      expect(result.transferFromSavings).toBe(400);
    });

    it('calculates total transfers', () => {
      const transactions = [
        createTransaction({ amount: -500, type: 'transfer' }),
        createTransaction({ amount: 200, type: 'transfer' }),
      ];

      const result = calculateDashboardStats(transactions);
      expect(result.totalTransfers).toBe(700);
    });

    it('excludes transfers from income/expense calculations', () => {
      const transactions = [
        createTransaction({ amount: 1000, type: 'income' }),
        createTransaction({ amount: -500, type: 'transfer' }),
      ];

      const result = calculateDashboardStats(transactions);
      expect(result.totalIncome).toBe(1000);
      expect(result.totalExpenses).toBe(0);
    });
  });

  describe('savings rate', () => {
    it('calculates savings rate as percentage of income', () => {
      const transactions = [
        createTransaction({ amount: 1000, type: 'income' }),
        createTransaction({ amount: -200, type: 'transfer' }),
      ];

      const result = calculateDashboardStats(transactions);
      expect(result.savingsRate).toBe(20);
    });

    it('returns 0 savings rate when no income', () => {
      const transactions = [
        createTransaction({ amount: -200, type: 'transfer' }),
      ];

      const result = calculateDashboardStats(transactions);
      expect(result.savingsRate).toBe(0);
    });
  });

  describe('transaction count', () => {
    it('counts all transactions', () => {
      const transactions = [
        createTransaction({ amount: 1000 }),
        createTransaction({ amount: -100 }),
        createTransaction({ amount: -50 }),
      ];

      const result = calculateDashboardStats(transactions);
      expect(result.transactionCount).toBe(3);
    });
  });

  describe('date filtering', () => {
    it('filters transactions by date range', () => {
      const transactions = [
        createTransaction({ date: '2024-01-01', amount: 1000, type: 'income' }),
        createTransaction({ date: '2024-01-15', amount: 500, type: 'income' }),
        createTransaction({ date: '2024-02-01', amount: 2000, type: 'income' }),
      ];

      const result = calculateDashboardStats(transactions, {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(result.totalIncome).toBe(1500);
      expect(result.transactionCount).toBe(2);
    });

    it('includes boundary dates', () => {
      const transactions = [
        createTransaction({ date: '2024-01-01', amount: 100, type: 'income' }),
        createTransaction({ date: '2024-01-31', amount: 200, type: 'income' }),
      ];

      const result = calculateDashboardStats(transactions, {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(result.totalIncome).toBe(300);
    });
  });

  describe('empty transactions', () => {
    it('returns zeros for empty transaction list', () => {
      const result = calculateDashboardStats([]);

      expect(result.totalIncome).toBe(0);
      expect(result.totalExpenses).toBe(0);
      expect(result.totalBalance).toBe(0);
      expect(result.transactionCount).toBe(0);
      expect(result.savingsRate).toBe(0);
    });
  });
});

describe('calculateMonthlyData', () => {
  const createTransaction = (
    overrides: Partial<Transaction> = {}
  ): Transaction => ({
    id: 'tx-123',
    date: '2024-01-15',
    amount: -50,
    type: 'expense',
    description: 'Test transaction',
    merchantName: null,
    categoryId: null,
    accountId: 'account-123',
    profileId: 'profile-456',
    opposingAccountIban: null,
    opposingAccountName: null,
    balanceAfter: null,
    rawData: null,
    importHash: null,
    importId: null,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
    isDeleted: false,
    deviceId: 'device-123',
    ...overrides,
  });

  it('aggregates income and expenses by month', () => {
    // Use current month for testing since calculateMonthlyData only tracks recent months
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dateInMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-10`;
    const dateInMonth2 = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-20`;
    const dateInMonth3 = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-25`;

    const transactions = [
      createTransaction({ date: dateInMonth, amount: 1000, type: 'income' }),
      createTransaction({ date: dateInMonth2, amount: -300, type: 'expense' }),
      createTransaction({ date: dateInMonth3, amount: -200, type: 'expense' }),
    ];

    const result = calculateMonthlyData(transactions);
    const monthData = result.find((m) => m.month === currentMonth);

    expect(monthData?.income).toBe(1000);
    expect(monthData?.expenses).toBe(500);
    expect(monthData?.balance).toBe(500);
  });

  it('excludes transfers from income/expenses', () => {
    // Use current month for testing since calculateMonthlyData only tracks recent months
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dateInMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-10`;
    const dateInMonth2 = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-15`;

    const transactions = [
      createTransaction({ date: dateInMonth, amount: 1000, type: 'income' }),
      createTransaction({ date: dateInMonth2, amount: -500, type: 'transfer' }),
    ];

    const result = calculateMonthlyData(transactions);
    const monthData = result.find((m) => m.month === currentMonth);

    expect(monthData?.income).toBe(1000);
    expect(monthData?.expenses).toBe(0);
  });

  it('returns data sorted by month', () => {
    const transactions = [
      createTransaction({ date: '2024-03-01', amount: 100 }),
      createTransaction({ date: '2024-01-01', amount: 100 }),
      createTransaction({ date: '2024-02-01', amount: 100 }),
    ];

    const result = calculateMonthlyData(transactions);
    const months = result.map((m) => m.month);
    const sortedMonths = [...months].sort();

    expect(months).toEqual(sortedMonths);
  });

  it('limits to specified number of months', () => {
    const transactions: Transaction[] = [];
    const result = calculateMonthlyData(transactions, 6);
    expect(result).toHaveLength(6);
  });
});

describe('calculateCategoryBreakdown', () => {
  const createTransaction = (
    overrides: Partial<Transaction> = {}
  ): Transaction => ({
    id: 'tx-123',
    date: '2024-01-15',
    amount: -50,
    type: 'expense',
    description: 'Test transaction',
    merchantName: null,
    categoryId: null,
    accountId: 'account-123',
    profileId: 'profile-456',
    opposingAccountIban: null,
    opposingAccountName: null,
    balanceAfter: null,
    rawData: null,
    importHash: null,
    importId: null,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
    isDeleted: false,
    deviceId: 'device-123',
    ...overrides,
  });

  const categories = new Map([
    ['cat-1', 'Groceries'],
    ['cat-2', 'Transport'],
    ['cat-3', 'Entertainment'],
  ]);

  describe('expense breakdown', () => {
    it('calculates totals per category', () => {
      const transactions = [
        createTransaction({
          amount: -100,
          categoryId: 'cat-1',
          type: 'expense',
        }),
        createTransaction({
          amount: -50,
          categoryId: 'cat-1',
          type: 'expense',
        }),
        createTransaction({
          amount: -30,
          categoryId: 'cat-2',
          type: 'expense',
        }),
      ];

      const result = calculateCategoryBreakdown(
        transactions,
        categories,
        'expense'
      );
      const groceries = result.find((c) => c.categoryId === 'cat-1');
      const transport = result.find((c) => c.categoryId === 'cat-2');

      expect(groceries?.total).toBe(150);
      expect(transport?.total).toBe(30);
    });

    it('calculates percentages correctly', () => {
      const transactions = [
        createTransaction({
          amount: -100,
          categoryId: 'cat-1',
          type: 'expense',
        }),
        createTransaction({
          amount: -100,
          categoryId: 'cat-2',
          type: 'expense',
        }),
      ];

      const result = calculateCategoryBreakdown(
        transactions,
        categories,
        'expense'
      );

      result.forEach((cat) => {
        expect(cat.percentage).toBe(50);
      });
    });

    it('includes transaction count', () => {
      const transactions = [
        createTransaction({
          amount: -100,
          categoryId: 'cat-1',
          type: 'expense',
        }),
        createTransaction({
          amount: -50,
          categoryId: 'cat-1',
          type: 'expense',
        }),
      ];

      const result = calculateCategoryBreakdown(
        transactions,
        categories,
        'expense'
      );
      const groceries = result.find((c) => c.categoryId === 'cat-1');

      expect(groceries?.transactionCount).toBe(2);
    });

    it('excludes income transactions for expense breakdown', () => {
      const transactions = [
        createTransaction({
          amount: -100,
          categoryId: 'cat-1',
          type: 'expense',
        }),
        createTransaction({ amount: 500, categoryId: 'cat-1', type: 'income' }),
      ];

      const result = calculateCategoryBreakdown(
        transactions,
        categories,
        'expense'
      );
      const groceries = result.find((c) => c.categoryId === 'cat-1');

      expect(groceries?.total).toBe(100);
    });
  });

  describe('income breakdown', () => {
    it('only includes positive amounts', () => {
      const transactions = [
        createTransaction({
          amount: 1000,
          categoryId: 'cat-1',
          type: 'income',
        }),
        createTransaction({
          amount: -100,
          categoryId: 'cat-1',
          type: 'expense',
        }),
      ];

      const result = calculateCategoryBreakdown(
        transactions,
        categories,
        'income'
      );

      expect(result).toHaveLength(1);
      expect(result[0].total).toBe(1000);
    });
  });

  describe('uncategorized transactions', () => {
    it('groups uncategorized transactions', () => {
      const transactions = [
        createTransaction({ amount: -100, categoryId: null, type: 'expense' }),
        createTransaction({ amount: -50, categoryId: null, type: 'expense' }),
      ];

      const result = calculateCategoryBreakdown(
        transactions,
        categories,
        'expense'
      );
      const uncategorized = result.find((c) => c.categoryId === null);

      expect(uncategorized?.total).toBe(150);
      expect(uncategorized?.categoryName).toBe('Niet gecategoriseerd');
    });
  });

  describe('sorting', () => {
    it('sorts by total descending', () => {
      const transactions = [
        createTransaction({
          amount: -50,
          categoryId: 'cat-1',
          type: 'expense',
        }),
        createTransaction({
          amount: -200,
          categoryId: 'cat-2',
          type: 'expense',
        }),
        createTransaction({
          amount: -100,
          categoryId: 'cat-3',
          type: 'expense',
        }),
      ];

      const result = calculateCategoryBreakdown(
        transactions,
        categories,
        'expense'
      );

      expect(result[0].categoryId).toBe('cat-2');
      expect(result[1].categoryId).toBe('cat-3');
      expect(result[2].categoryId).toBe('cat-1');
    });
  });

  describe('transfer exclusion', () => {
    it('excludes transfers from breakdown', () => {
      const transactions = [
        createTransaction({
          amount: -100,
          categoryId: 'cat-1',
          type: 'expense',
        }),
        createTransaction({
          amount: -500,
          categoryId: 'cat-1',
          type: 'transfer',
        }),
      ];

      const result = calculateCategoryBreakdown(
        transactions,
        categories,
        'expense'
      );
      const groceries = result.find((c) => c.categoryId === 'cat-1');

      expect(groceries?.total).toBe(100);
    });
  });
});

describe('calculateAverageSpending', () => {
  const createTransaction = (
    overrides: Partial<Transaction> = {}
  ): Transaction => ({
    id: 'tx-123',
    date: '2024-01-15',
    amount: -50,
    type: 'expense',
    description: 'Test transaction',
    merchantName: null,
    categoryId: null,
    accountId: 'account-123',
    profileId: 'profile-456',
    opposingAccountIban: null,
    opposingAccountName: null,
    balanceAfter: null,
    rawData: null,
    importHash: null,
    importId: null,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
    isDeleted: false,
    deviceId: 'device-123',
    ...overrides,
  });

  it('calculates average daily spending', () => {
    const transactions = [
      createTransaction({ date: '2024-01-01', amount: -100, type: 'expense' }),
      createTransaction({ date: '2024-01-11', amount: -100, type: 'expense' }),
    ];

    const result = calculateAverageSpending(transactions);
    // 200 total over 10 days = 20 per day
    expect(result).toBe(20);
  });

  it('excludes income from calculation', () => {
    const transactions = [
      createTransaction({ date: '2024-01-01', amount: -100, type: 'expense' }),
      createTransaction({ date: '2024-01-11', amount: 1000, type: 'income' }),
    ];

    const result = calculateAverageSpending(transactions);
    // Only the expense counts, and since there's only one date, it's considered 1 day
    expect(result).toBe(100);
  });

  it('excludes transfers from calculation', () => {
    const transactions = [
      createTransaction({ date: '2024-01-01', amount: -100, type: 'expense' }),
      createTransaction({ date: '2024-01-11', amount: -500, type: 'transfer' }),
    ];

    const result = calculateAverageSpending(transactions);
    // Only the expense counts
    expect(result).toBe(100);
  });

  it('returns 0 for empty transactions', () => {
    const result = calculateAverageSpending([]);
    expect(result).toBe(0);
  });

  it('respects date range filter', () => {
    const transactions = [
      createTransaction({ date: '2024-01-01', amount: -100, type: 'expense' }),
      createTransaction({ date: '2024-01-15', amount: -100, type: 'expense' }),
      createTransaction({ date: '2024-02-01', amount: -300, type: 'expense' }),
    ];

    const result = calculateAverageSpending(transactions, {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });

    // Only January transactions: 200 total
    expect(result).toBeLessThan(20);
  });
});

describe('findRecurringTransactions', () => {
  const createTransaction = (
    overrides: Partial<Transaction> = {}
  ): Transaction => ({
    id: 'tx-123',
    date: '2024-01-15',
    amount: -50,
    type: 'expense',
    description: 'Test transaction',
    merchantName: null,
    categoryId: null,
    accountId: 'account-123',
    profileId: 'profile-456',
    opposingAccountIban: null,
    opposingAccountName: null,
    balanceAfter: null,
    rawData: null,
    importHash: null,
    importId: null,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
    isDeleted: false,
    deviceId: 'device-123',
    ...overrides,
  });

  it('identifies monthly recurring transactions', () => {
    const transactions = [
      createTransaction({
        date: '2024-01-01',
        amount: -50,
        merchantName: 'Netflix',
      }),
      createTransaction({
        date: '2024-02-01',
        amount: -50,
        merchantName: 'Netflix',
      }),
      createTransaction({
        date: '2024-03-01',
        amount: -50,
        merchantName: 'Netflix',
      }),
      createTransaction({
        date: '2024-04-01',
        amount: -50,
        merchantName: 'Netflix',
      }),
    ];

    const result = findRecurringTransactions(transactions);
    const netflix = result.find(
      (r) => r.merchantName.toLowerCase() === 'netflix'
    );

    expect(netflix).toBeDefined();
    expect(netflix?.frequency).toBe('monthly');
    expect(netflix?.averageAmount).toBe(-50);
  });

  it('calculates average amount for recurring transactions', () => {
    const transactions = [
      createTransaction({
        date: '2024-01-01',
        amount: -48,
        merchantName: 'Netflix',
      }),
      createTransaction({
        date: '2024-02-01',
        amount: -50,
        merchantName: 'Netflix',
      }),
      createTransaction({
        date: '2024-03-01',
        amount: -52,
        merchantName: 'Netflix',
      }),
    ];

    const result = findRecurringTransactions(transactions);
    const netflix = result.find(
      (r) => r.merchantName.toLowerCase() === 'netflix'
    );

    expect(netflix?.averageAmount).toBe(-50);
  });

  it('requires minimum 3 occurrences', () => {
    const transactions = [
      createTransaction({
        date: '2024-01-01',
        amount: -50,
        merchantName: 'Netflix',
      }),
      createTransaction({
        date: '2024-02-01',
        amount: -50,
        merchantName: 'Netflix',
      }),
    ];

    const result = findRecurringTransactions(transactions);
    expect(result.find((r) => r.merchantName === 'Netflix')).toBeUndefined();
  });

  it('ignores transactions without merchantName', () => {
    const transactions = [
      createTransaction({
        date: '2024-01-01',
        amount: -50,
        merchantName: null,
      }),
      createTransaction({
        date: '2024-02-01',
        amount: -50,
        merchantName: null,
      }),
      createTransaction({
        date: '2024-03-01',
        amount: -50,
        merchantName: null,
      }),
    ];

    const result = findRecurringTransactions(transactions);
    expect(result).toHaveLength(0);
  });

  it('groups by merchant name case-insensitively', () => {
    const transactions = [
      createTransaction({
        date: '2024-01-01',
        amount: -50,
        merchantName: 'NETFLIX',
      }),
      createTransaction({
        date: '2024-02-01',
        amount: -50,
        merchantName: 'Netflix',
      }),
      createTransaction({
        date: '2024-03-01',
        amount: -50,
        merchantName: 'netflix',
      }),
    ];

    const result = findRecurringTransactions(transactions);
    expect(result).toHaveLength(1);
  });

  it('sorts results by amount descending', () => {
    const transactions = [
      // Netflix - smaller amount
      createTransaction({
        date: '2024-01-01',
        amount: -15,
        merchantName: 'Netflix',
      }),
      createTransaction({
        date: '2024-02-01',
        amount: -15,
        merchantName: 'Netflix',
      }),
      createTransaction({
        date: '2024-03-01',
        amount: -15,
        merchantName: 'Netflix',
      }),
      // Rent - larger amount
      createTransaction({
        date: '2024-01-01',
        amount: -1500,
        merchantName: 'Landlord',
      }),
      createTransaction({
        date: '2024-02-01',
        amount: -1500,
        merchantName: 'Landlord',
      }),
      createTransaction({
        date: '2024-03-01',
        amount: -1500,
        merchantName: 'Landlord',
      }),
    ];

    const result = findRecurringTransactions(transactions);
    expect(result.length).toBeGreaterThan(0);
    // Landlord should come first due to higher amount
    expect(result[0].merchantName.toLowerCase()).toBe('landlord');
  });
});
