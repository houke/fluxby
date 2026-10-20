/** Refund allocations affect reporting, never the bank ledger balance.
 * Both ends must remain live in the same profile. The expense stays in its original period.
 */
function allocatedSQL(
  alias: string,
  column: 'source_id' | 'target_id'
): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(alias))
    throw new Error('Invalid SQL alias');
  return `COALESCE((SELECT SUM(l.amount) FROM transaction_links l JOIN transactions ls ON ls.id=l.source_id AND ls.profile_id=l.profile_id AND ls.is_deleted=0 AND ls.type='income' JOIN transactions lt ON lt.id=l.target_id AND lt.profile_id=l.profile_id AND lt.is_deleted=0 AND lt.type='expense' WHERE l.profile_id=${alias}.profile_id AND l.${column}=${alias}.id AND l.kind='refund' AND l.is_deleted=0),0)`;
}
export const effectiveExpenseSQL = (alias = 't') =>
  `MAX(0,ABS(${alias}.amount)-${allocatedSQL(alias, 'target_id')})`;
export const effectiveIncomeSQL = (alias = 't') =>
  `MAX(0,ABS(${alias}.amount)-${allocatedSQL(alias, 'source_id')})`;
