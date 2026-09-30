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

export interface BudgetWithStats extends Budget {
  /** Unscaled amount saved for the budget's monthly or yearly period. */
  baseAmount?: number;
  rolloverEnabled?: boolean;
  carryover?: number;
  spent: number;
  remaining: number;
  percentage: number;
  categoryName: string | null;
  categoryColor: string | null;
  categoryIcon?: string | null;
}
