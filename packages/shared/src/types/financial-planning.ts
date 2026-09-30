export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  monthlyContribution: number;
}
export interface SavingsGoalInput {
  name: string;
  targetAmount: number;
  deadline?: string | null;
  monthlyContribution?: number;
}
export interface PlanningPreferences {
  minimumBalance: number;
  reservedSavings: number;
}
export interface SafeToSpendSummary extends PlanningPreferences {
  availableBalance: number;
  upcomingObligations: number;
  goalReservations: number;
  safeToSpend: number;
  startDate: string;
  endDate: string;
}
export interface NetWorthItem {
  id: string;
  name: string;
  type: 'asset' | 'liability';
  amount: number;
}
export type NetWorthItemInput = Omit<NetWorthItem, 'id'>;
export interface NetWorthSummary {
  cash: number;
  assets: number;
  liabilities: number;
  total: number;
  items: NetWorthItem[];
}
export interface MonthlyReview {
  month: string;
  status: 'open' | 'complete';
  checks: Record<string, boolean>;
}
export interface TransactionSplit {
  id: string;
  transactionId: string;
  categoryId: string;
  amount: number;
}
export interface SavedTransactionView {
  id: string;
  name: string;
  filters: Record<string, string>;
  version: number;
}
export interface StatementReconciliationInput {
  accountId: string;
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
}
export interface StatementReconciliation {
  id: string;
  accountId: string;
  startDate: string;
  endDate: string;
  expectedClosingBalance: number;
  actualClosingBalance: number;
  difference: number;
  transactionCount: number;
  status: 'matched' | 'difference';
}
export interface FinancialChange {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  description: string;
  createdAt: string;
  canUndo: boolean;
}
