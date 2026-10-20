import {
  addDaysToDateOnly,
  formatDateISO,
  getTransactionReviewDemoData,
} from '@fluxby/shared';
import type { FinancialDatabase } from './financial-planning';
/** Called within the demo seed's existing transaction. Net ledger effect is zero. */
export async function seedTransactionReviewDemo(
  db: FinancialDatabase,
  profileId: string,
  language: 'nl' | 'en'
) {
  const exists = await db.queryOneAsync(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='transaction_links'"
  );
  if (!exists) return;
  const account = await db.queryOneAsync<{ id: string }>(
    'SELECT id FROM accounts WHERE profile_id=? AND is_deleted=0 ORDER BY id LIMIT 1',
    [profileId]
  );
  if (!account) return;
  const category = await db.queryOneAsync<{ id: string }>(
    'SELECT id FROM categories WHERE profile_id=? AND is_deleted=0 ORDER BY name LIMIT 1',
    [profileId]
  );
  const data = getTransactionReviewDemoData(language),
    now = Date.now(),
    today = formatDateISO(new Date());
  const expense = crypto.randomUUID(),
    first = crypto.randomUUID(),
    second = crypto.randomUUID();
  const records = [
    {
      id: expense,
      amount: -60,
      type: 'expense',
      description: data.expense,
      merchant: data.merchant,
    },
    {
      id: first,
      amount: 20,
      type: 'income',
      description: data.first,
      merchant: 'Tikkie',
    },
    {
      id: second,
      amount: 40,
      type: 'income',
      description: data.second,
      merchant: 'Tikkie',
    },
  ];
  for (const record of records)
    await db.runAsync(
      'INSERT INTO transactions(id,date,amount,type,description,merchant_name,account_id,category_id,notes,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
      [
        record.id,
        record.type === 'expense' ? addDaysToDateOnly(today, -2) : today,
        record.amount,
        record.type,
        record.description,
        record.merchant,
        account.id,
        record.type === 'expense' ? category?.id || null : null,
        data.note,
        profileId,
        now,
        now,
      ]
    );
  for (const record of records.slice(1))
    await db.runAsync(
      "INSERT INTO transaction_links(id,source_id,target_id,kind,relation_type,amount,source_type,target_type,profile_id,created_at,updated_at) VALUES(?,?,?,'refund','reimbursement',?,'income','expense',?,?,?)",
      [
        crypto.randomUUID(),
        record.id,
        expense,
        record.amount,
        profileId,
        now,
        now,
      ]
    );
  // Complete incoming reimbursements need no independent category, keep the demo inbox focused.
  for (const id of [first, second])
    await db.runAsync(
      "INSERT INTO transaction_review_decisions(id,item_key,status,profile_id,created_at,updated_at) VALUES(?,?,'done',?,?,?)",
      [crypto.randomUUID(), `uncategorized:${id}`, profileId, now, now]
    );
}
