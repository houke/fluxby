/**
 * manual_source is set only by the expense-only mark-as-bill action. Normalize
 * legacy backup/peer rows before storage, without touching dates or cadence.
 * Detected income patterns have manual_source=0 and retain their positive sign.
 */
export function normalizeManualBillAmounts<T extends Record<string, unknown>>(
  table: string,
  row: T
): T {
  if (table !== 'recurring_patterns' || Number(row.manual_source) !== 1)
    return row;
  const normalized = { ...row };
  for (const column of ['avg_amount', 'last_amount'] as const) {
    const amount = normalized[column];
    if (typeof amount === 'number' && amount > 0)
      Object.assign(normalized, { [column]: -amount });
  }
  return normalized;
}
