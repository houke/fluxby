// Transaction types
export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  description: string;
  merchantName: string | null;
  accountId: string;
  opposingAccountIban: string | null;
  opposingAccountName: string | null;
  categoryId: string | null;
  notes: string | null;
  paymentMethod: string | null;
  rawData: string | null;
  importHash: string;
  createdAt: string;
  paymentProvider: string | null;
  addressBookId: string | null;
}

export interface TransactionCreate {
  date: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  description: string;
  merchantName?: string | null;
  accountId: string;
  opposingAccountIban?: string | null;
  opposingAccountName?: string | null;
  categoryId?: string | null;
  notes?: string | null;
  balanceAfter?: number | null;
  paymentMethod?: string | null;
  rawData?: string | null;
  importHash: string;
}

// Account types
export interface Account {
  id: string;
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
  id: string;
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

// Reserved ID for demo profile (must use this exact UUID)
export const DEMO_PROFILE_ID = '00000000-0000-0000-0000-000000000001';

export interface Profile {
  id: string;
  userId: string;
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
  id: string;
  name: string;
  parentId: string | null;
  icon: string | null;
  color: string | null;
  description: string | null;
  createdAt: string;
  // Optional fields populated when withCounts=true
  transactionCount?: number;
  totalExpenses?: number;
}

export interface CategoryCreate {
  name: string;
  parentId?: string | null;
  icon?: string | null;
  color?: string | null;
}

// Budget types
export interface Budget {
  id: string;
  categoryId: string | null;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface BudgetCreate {
  categoryId?: string | null;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate?: string | null;
  endDate?: string | null;
}

// Category rule types (for auto-categorization)
export interface CategoryRule {
  id: string;
  pattern: string;
  categoryId: string;
  categoryName: string | null;
  categoryIcon: string | null;
  priority: number;
  createdAt: string;
}

export interface CategoryRuleCreate {
  pattern: string;
  categoryId: string;
  priority?: number;
}

// Import types
export interface Import {
  id: string;
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
  categoryId: string;
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
  categoryId?: string;
  categoryIds?: string[];
  accountId?: string;
  profileId?: string; // Filter transactions by profile (via account's profile_id)
  search?: string;
  opposingAccountIban?: string;
  opposingAccountIbans?: string[];
  opposingAccountName?: string;
  paymentMethods?: string[];
  paymentProviders?: string[];
  addressBookId?: string;
}

// Address Book types
export interface AddressBookEntry {
  id: string;
  iban: string;
  name: string;
  description: string | null;
  notes: string | null;
  originalName?: string | null;
  createdAt: string;
}

// Cleanup Rule types
export interface CleanupRule {
  id: string;
  pattern: string;
  isActive: boolean;
  createdAt: string;
}

// Category Suggestion types
export interface CategorySuggestion {
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  confidence: number;
  source: 'rule' | 'history' | 'ai' | null;
}

// Payment Provider Rule types
export interface PaymentProviderRule {
  id: string;
  name: string;
  patterns: string;
}
