// Recurring pattern types for subscription detection

export type PatternType =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export interface RecurringPattern {
  id: string;
  opposingIban: string | null;
  merchantName: string | null;
  patternType: PatternType;
  avgAmount: number;
  lastAmount: number;
  lastDate: string;
  nextExpectedDate: string | null;
  isActive: boolean;
  isConfirmed: boolean;
  isDismissed: boolean;
  isVariable: boolean;
  transactionCount: number;
  profileId: string;
  createdAt: string;
  /** Price history for tracking changes over time */
  priceHistory?: { date: string; amount: number }[];
}

export interface RecurringPatternCreate {
  opposingIban?: string | null;
  merchantName?: string | null;
  patternType: PatternType;
  avgAmount: number;
  lastAmount: number;
  lastDate: string;
  nextExpectedDate?: string | null;
  isVariable?: boolean;
  transactionCount?: number;
}

export interface RecurringCalendarEntry {
  id: string;
  date: string;
  merchantName: string | null;
  expectedAmount: number;
  patternType: PatternType;
  isConfirmed: boolean;
}

export interface RecurringStats {
  totalMonthlySpend: number;
  activeSubscriptions: number;
  confirmedSubscriptions: number;
  pendingConfirmation: number;
  /** Expected subscription expenses for a specific period (if queried with date range) */
  expectedPeriodExpenses?: number;
}

/**
 * Pattern detection configuration
 */
export const PATTERN_INTERVALS: Record<
  PatternType,
  { min: number; max: number }
> = {
  weekly: { min: 5, max: 9 },
  biweekly: { min: 12, max: 16 },
  monthly: { min: 27, max: 34 },
  quarterly: { min: 85, max: 95 },
  yearly: { min: 360, max: 370 },
};

/**
 * Tolerance for date matching (in days)
 * Relaxed from 3 to 12 days to better handle payment timing variations
 */
export const DATE_TOLERANCE_DAYS = 12;

/**
 * Minimum number of transactions required for pattern detection
 */
export const MIN_TRANSACTIONS_FOR_PATTERN = 3;

/**
 * Minimum number of months a pattern must span to be considered a subscription
 * For monthly patterns, this means at least 3 transactions over ~3 months
 */
export const MIN_MONTHS_FOR_SUBSCRIPTION = 3;

/**
 * Amount variance threshold (percentage) to flag as variable
 */
export const AMOUNT_VARIANCE_THRESHOLD = 0.1; // 10%

/**
 * Price change threshold (percentage) to flag as price increase
 */
export const PRICE_CHANGE_THRESHOLD = 0.05; // 5%
