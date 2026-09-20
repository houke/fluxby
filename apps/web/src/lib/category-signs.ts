export function normalizeCategoryAmount(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.abs(amount);
}

export function getCategoryAmountDirection(
  amount: number
): 'income' | 'expense' | 'neutral' {
  if (amount > 0) return 'income';
  if (amount < 0) return 'expense';
  return 'neutral';
}
