export interface DemoRecurringPatternTemplate {
  merchantName: string;
  patternType: 'monthly' | 'weekly' | 'yearly' | string;
  avgAmount: number;
  lastAmount: number;
  isConfirmed: boolean;
  isVariable: boolean;
  transactionCount: number;
}

export interface TxRow {
  date: string; // YYYY-MM-DD
  amount: number;
}

export interface BuiltRecurringPattern {
  merchantName: string | null;
  patternType: string;
  avgAmount: number;
  lastAmount: number;
  lastDate: string; // YYYY-MM-DD
  nextExpectedDate: string; // YYYY-MM-DD
  isConfirmed: number;
  isVariable: number;
  transactionCount: number;
}

/**
 * Build a recurring pattern object (used for inserting into DB)
 * given a DEMO template and an optional latest transaction row.
 * This encapsulates the logic: prefer latest transaction's amount/date
 * when available, otherwise fall back to template values and a sensible
 * "last date" (previous month, day 3).
 */
export function buildRecurringPatternFromTemplate(
  template: DemoRecurringPatternTemplate,
  latestTx?: TxRow,
  referenceDate?: Date
): BuiltRecurringPattern {
  const now = referenceDate ? new Date(referenceDate) : new Date();

  let lastDateStr: string;
  let lastAmountVal: number;

  if (latestTx && latestTx.date) {
    lastDateStr = latestTx.date;
    lastAmountVal = latestTx.amount;
  } else {
    const lastDate = new Date(now);
    lastDate.setDate(3);
    lastDate.setMonth(lastDate.getMonth() - 1);
    lastDateStr = lastDate.toISOString().split('T')[0];
    lastAmountVal = template.lastAmount;
  }

  const nextDate = new Date(lastDateStr + 'T00:00:00Z');
  nextDate.setMonth(nextDate.getMonth() + 1);

  return {
    merchantName: template.merchantName,
    patternType: template.patternType,
    avgAmount: template.avgAmount,
    lastAmount: lastAmountVal,
    lastDate: lastDateStr,
    nextExpectedDate: nextDate.toISOString().split('T')[0],
    isConfirmed: template.isConfirmed ? 1 : 0,
    isVariable: template.isVariable ? 1 : 0,
    transactionCount: template.transactionCount,
  };
}
