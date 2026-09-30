/** Category reports allocate split amounts; cash-flow reports keep originals. */
export const CATEGORY_TRANSACTIONS_CTE = `
WITH category_transactions AS (
  SELECT t.id,t.date,t.type,t.profile_id,t.account_id,t.is_deleted,
    COALESCE(s.category_id,t.category_id) AS category_id,
    CASE WHEN s.id IS NULL THEN t.amount
      WHEN t.amount < 0 THEN -s.amount ELSE s.amount END AS amount
  FROM transactions t
  LEFT JOIN transaction_splits s ON s.transaction_id=t.id
    AND s.profile_id=t.profile_id AND s.is_deleted=0
)`;
