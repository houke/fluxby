// Transaction types
export interface Transaction {
  id: number;
  date: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  description: string;
  merchantName: string | null;
  accountId: number;
  opposingAccountIban: string | null;
  opposingAccountName: string | null;
  categoryId: number | null;
  notes: string | null;
  paymentMethod: string | null;
  rawData: string | null;
  importHash: string;
  createdAt: string;
  paymentProvider: string | null;
  addressBookId: number | null;
}

export interface TransactionCreate {
  date: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  description: string;
  merchantName?: string | null;
  accountId: number;
  opposingAccountIban?: string | null;
  opposingAccountName?: string | null;
  categoryId?: number | null;
  notes?: string | null;
  balanceAfter?: number | null;
  paymentMethod?: string | null;
  rawData?: string | null;
  importHash: string;
}

// Account types
export interface Account {
  id: number;
  iban: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  bank: string;
  currentBalance: number;
  orderIndex?: number;
  createdAt: string;
}

export interface AccountCreate {
  iban: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  bank?: string;
}

// User profile
export interface UserProfile {
  id: number;
  name: string;
  avatar: string | null;
  createdAt: string;
}

// Tenant profiles (multi-tenant support)
export type ProfileType =
  | 'personal'
  | 'business'
  | 'shared'
  | 'savings'
  | 'investing';

export interface Profile {
  id: number;
  userId: number;
  name: string;
  type: ProfileType;
  avatarUrl: string | null;
  createdAt: string;
}

export interface ProfileCreate {
  name: string;
  type: ProfileType;
  avatarUrl?: string | null;
}

// Category types
export interface Category {
  id: number;
  name: string;
  parentId: number | null;
  icon: string | null;
  color: string | null;
  description: string | null;
  createdAt: string;
}

export interface CategoryCreate {
  name: string;
  parentId?: number | null;
  icon?: string | null;
  color?: string | null;
}

// Budget types
export interface Budget {
  id: number;
  categoryId: number | null;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface BudgetCreate {
  categoryId?: number | null;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate?: string | null;
  endDate?: string | null;
}

// Category rule types (for auto-categorization)
export interface CategoryRule {
  id: number;
  pattern: string;
  categoryId: number;
  priority: number;
  createdAt: string;
}

export interface CategoryRuleCreate {
  pattern: string;
  categoryId: number;
  priority?: number;
}

// Import types
export interface Import {
  id: number;
  filename: string;
  importedAt: string;
  transactionCount: number;
  status: 'pending' | 'completed' | 'failed';
}

// ING CSV specific types
export interface INGTransaction {
  datum: string;
  naamOmschrijving: string;
  rekening: string;
  tegenrekening: string;
  code: string;
  afBij: 'Af' | 'Bij';
  bedrag: string;
  mutatiesoort: string;
  mededelingen: string;
  saldoNaMutatie: string;
  tag: string;
}

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
  categoryId: number;
  categoryName: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

// Filter types
export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  type?: 'income' | 'expense' | 'transfer';
  categoryId?: number;
  categoryIds?: number[];
  accountId?: number;
  profileId?: number; // Filter transactions by profile (via account's profile_id)
  search?: string;
  opposingAccountIban?: string;
  opposingAccountIbans?: string[];
  opposingAccountName?: string;
  paymentMethods?: string[];
  paymentProviders?: string[];
  addressBookId?: number;
}
