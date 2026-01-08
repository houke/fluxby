import type { Transaction } from './transaction.js';

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Dashboard stats types
export interface DashboardStats {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  totalTransfers: number;
  transferToSavings: number;
  transferFromSavings: number;
  netSavingsTransfer: number;
  savingsRate: number;
  transactionCount: number;
  monthlyData: MonthlyData[];
  categoryBreakdown: CategoryBreakdown[];
  recentTransactions: Transaction[];
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}
