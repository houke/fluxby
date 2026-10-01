import { merchantSimilarity } from './import-tools';
import {
  addDaysToDateOnly,
  addMonthsToDateOnly,
  formatDateISO,
  type PatternType,
  type Transaction,
} from '@fluxby/shared';
import { moneyCents, type FinancialDatabase } from './financial-planning';
import type { TransactionView } from '../transaction-view';

export interface ReviewTransaction extends Transaction {
  accountName: string;
  categoryName: string | null;
}
export type ReviewKind =
  | 'uncategorized'
  | 'duplicate'
  | 'refund'
  | 'transfer'
  | 'spike'
  | 'newMerchant'
  | 'categorySpike';
export interface ReviewItem {
  key: string;
  kind: ReviewKind;
  transaction: ReviewTransaction;
  related?: ReviewTransaction;
  suggestedCategoryId?: string;
}
export interface TransactionLink {
  id: string;
  sourceId: string;
  targetId: string;
  kind: 'refund' | 'transfer';
  relationType: 'refund' | 'reimbursement' | 'transfer';
  amount: number;
}
const normalized = (s: string) =>
  s
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
const merchant = (t: ReviewTransaction) =>
  normalized(t.merchantName || t.opposingAccountName || t.description || '');
const day = (s: string) => Date.parse(`${s}T00:00:00Z`) / 86400000;
const signed = (t: ReviewTransaction) =>
  t.type === 'expense'
    ? -Math.abs(t.amount)
    : t.type === 'income'
      ? Math.abs(t.amount)
      : t.amount;

/** Suggestions only: never silently recategorize, delete, or treat a Tikkie as income/refund. */
export function buildReviewCandidates(rows: ReviewTransaction[]): ReviewItem[] {
  const items: ReviewItem[] = [];
  const sorted = [...rows].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)
  );
  const history = new Map<string, ReviewTransaction[]>();
  const recentAmounts = new Map<number, ReviewTransaction[]>();
  const newest = sorted[sorted.length - 1]?.date;
  for (let i = 0; i < sorted.length; i++) {
    const tx = sorted[i],
      key = merchant(tx),
      prior = history.get(key) || [];
    if (tx.type !== 'transfer' && !tx.categoryId) {
      const categorized = prior.filter(
        (t) => t.categoryId && t.type === tx.type
      );
      const counts = new Map<string, number>();
      for (const t of categorized)
        if (t.categoryId)
          counts.set(t.categoryId, (counts.get(t.categoryId) || 0) + 1);
      const suggested = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
      items.push({
        key: `uncategorized:${tx.id}`,
        kind: 'uncategorized',
        transaction: tx,
        suggestedCategoryId: suggested,
      });
    }
    const baseline = prior.filter(
      (t) => t.type === tx.type && day(tx.date) - day(t.date) <= 180
    );
    if (tx.type === 'expense' && baseline.length >= 3) {
      const amounts = baseline
          .map((t) => Math.abs(t.amount))
          .sort((a, b) => a - b),
        median = amounts[Math.floor(amounts.length / 2)];
      if (Math.abs(tx.amount) > Math.max(median * 2, median + 25))
        items.push({ key: `spike:${tx.id}`, kind: 'spike', transaction: tx });
    }
    if (
      key &&
      prior.length === 0 &&
      i >= 10 &&
      tx.type === 'expense' &&
      newest &&
      day(newest) - day(tx.date) <= 30
    )
      items.push({
        key: `newMerchant:${tx.id}`,
        kind: 'newMerchant',
        transaction: tx,
      });
    // Bound comparisons by amount or merchant; avoid a full 45-day cross-product.
    const amountKey = moneyCents(Math.abs(tx.amount));
    const amountMatches = (recentAmounts.get(amountKey) || []).filter(
      (other) => day(tx.date) - day(other.date) <= 3
    );
    const candidates = new Map(
      [
        ...amountMatches,
        ...(tx.type === 'income'
          ? prior.filter((other) => day(tx.date) - day(other.date) <= 45)
          : []),
      ].map((other) => [other.id, other])
    );
    for (const other of candidates.values()) {
      const distance = day(tx.date) - day(other.date);
      if (
        distance <= 3 &&
        tx.accountId !== other.accountId &&
        signed(tx) * signed(other) < 0 &&
        moneyCents(Math.abs(tx.amount)) ===
          moneyCents(Math.abs(other.amount)) &&
        tx.type !== 'transfer' &&
        other.type !== 'transfer'
      )
        items.push({
          key: `transfer:${[tx.id, other.id].sort().join(':')}`,
          kind: 'transfer',
          transaction: tx,
          related: other,
        });
      if (
        distance <= 3 &&
        tx.accountId === other.accountId &&
        tx.type === other.type &&
        moneyCents(Math.abs(tx.amount)) ===
          moneyCents(Math.abs(other.amount)) &&
        key &&
        merchantSimilarity(key, merchant(other)) >= 0.6
      )
        items.push({
          key: `duplicate:${[tx.id, other.id].sort().join(':')}`,
          kind: 'duplicate',
          transaction: tx,
          related: other,
        });
      if (
        tx.type === 'income' &&
        other.type === 'expense' &&
        key &&
        key === merchant(other) &&
        Math.abs(tx.amount) <= Math.abs(other.amount)
      )
        items.push({
          key: `refund:${tx.id}:${other.id}`,
          kind: 'refund',
          transaction: tx,
          related: other,
        });
    }
    history.set(key, [...prior, tx]);
    recentAmounts.set(amountKey, [...amountMatches, tx]);
  }
  if (newest) {
    const month = newest.slice(0, 7),
      elapsed = Number(newest.slice(8));
    const categoryMonths = new Map<string, Map<string, number>>();
    for (const tx of sorted) {
      if (
        tx.type !== 'expense' ||
        !tx.categoryId ||
        Number(tx.date.slice(8)) > elapsed
      )
        continue;
      const periods =
        categoryMonths.get(tx.categoryId) || new Map<string, number>();
      periods.set(
        tx.date.slice(0, 7),
        (periods.get(tx.date.slice(0, 7)) || 0) + Math.abs(tx.amount)
      );
      categoryMonths.set(tx.categoryId, periods);
    }
    for (const [categoryId, periods] of categoryMonths) {
      const prior = [...periods]
        .filter(([period]) => period < month)
        .sort()
        .slice(-6)
        .map(([, amount]) => amount);
      const current = periods.get(month) || 0;
      const mean = prior.reduce((sum, value) => sum + value, 0) / prior.length;
      const transaction = [...sorted]
        .reverse()
        .find(
          (tx) => tx.categoryId === categoryId && tx.date.slice(0, 7) === month
        );
      if (
        transaction &&
        prior.length >= 3 &&
        current > Math.max(mean * 1.5, mean + 50)
      )
        items.push({
          key: `categorySpike:${categoryId}:${month}`,
          kind: 'categorySpike',
          transaction,
        });
    }
  }
  return items.reverse();
}

export function matchesExportView(
  tx: ReviewTransaction,
  view: TransactionView
) {
  const includes = (values: string[], value: string | null) =>
    !values.length || values.includes(value || '');
  return (
    (!view.startDate || tx.date >= view.startDate) &&
    (!view.endDate || tx.date <= view.endDate) &&
    (view.type === 'all' || tx.type === view.type) &&
    (!view.categories.length ||
      view.categories.some((id) =>
        id === '' || id === '0' ? !tx.categoryId : id === tx.categoryId
      )) &&
    includes(view.ibans, tx.opposingAccountIban) &&
    includes(view.methods, tx.paymentMethod) &&
    includes(view.providers, tx.paymentProvider) &&
    (!view.accountName || tx.opposingAccountName === view.accountName) &&
    (!view.addressBookId || tx.addressBookId === view.addressBookId) &&
    (!view.search ||
      normalized(
        [
          tx.description,
          tx.merchantName,
          tx.opposingAccountName,
          tx.notes,
          tx.opposingAccountIban,
        ].join(' ')
      ).includes(normalized(view.search)))
  );
}
export function transactionCSV(
  rows: ReviewTransaction[],
  language: 'nl' | 'en'
) {
  const headers =
    language === 'nl'
      ? [
          'Datum',
          'Bedrag',
          'Valuta',
          'Type',
          'Omschrijving',
          'Handelaar',
          'Rekening',
          'Tegenrekening',
          'Naam tegenpartij',
          'Categorie',
          'Notities',
          'Betaalmethode',
          'Betaalprovider',
        ]
      : [
          'Date',
          'Amount',
          'Currency',
          'Type',
          'Description',
          'Merchant',
          'Account',
          'Counterparty IBAN',
          'Counterparty name',
          'Category',
          'Notes',
          'Payment method',
          'Payment provider',
        ];
  const delimiter = language === 'nl' ? ';' : ',';
  const escape = (value: unknown) =>
    `"${String(value ?? '')
      .replace(/^[\t\r\n ]*([=+@-])/, "'$1")
      .replace(/"/g, '""')}"`;
  const types =
    language === 'nl'
      ? { income: 'Inkomsten', expense: 'Uitgaven', transfer: 'Overboeking' }
      : { income: 'Income', expense: 'Expense', transfer: 'Transfer' };
  return (
    '\uFEFF' +
    [
      headers.map(escape).join(delimiter),
      ...rows.map((tx) =>
        [
          escape(tx.date),
          '"' +
            signed(tx)
              .toFixed(2)
              .replace('.', language === 'nl' ? ',' : '.') +
            '"',
          escape('EUR'),
          escape(types[tx.type]),
          ...[
            tx.description,
            tx.merchantName,
            tx.accountName,
            tx.opposingAccountIban,
            tx.opposingAccountName,
            tx.categoryName,
            tx.notes,
            tx.paymentMethod,
            tx.paymentProvider,
          ].map(escape),
        ].join(delimiter)
      ),
    ].join('\r\n')
  );
}

export function createTransactionReviewService(
  db: FinancialDatabase,
  currentProfileId: () => string | null
) {
  const profile = () => {
    const id = currentProfileId();
    if (!id) throw new Error('No active profile');
    return id;
  };
  const rows = async () =>
    db.queryAsync<ReviewTransaction>(
      `SELECT t.id,t.date,t.amount,t.type,COALESCE(t.description,'') description,t.merchant_name merchantName,t.account_id accountId,t.opposing_account_iban opposingAccountIban,t.opposing_account_name opposingAccountName,t.category_id categoryId,t.notes,t.payment_method paymentMethod,t.raw_data rawData,t.import_hash importHash,t.created_at createdAt,t.payment_provider paymentProvider,t.address_book_id addressBookId,a.name accountName,c.name categoryName FROM transactions t JOIN accounts a ON a.id=t.account_id AND a.profile_id=t.profile_id LEFT JOIN categories c ON c.id=t.category_id AND c.profile_id=t.profile_id WHERE t.profile_id=? AND t.is_deleted=0 AND a.is_deleted=0 ORDER BY t.date DESC,t.id`,
      [profile()]
    );
  const requireTx = async (id: string) => {
    const tx = (await rows()).find((t) => t.id === id);
    if (!tx) throw new Error('Transaction not found');
    return tx;
  };
  const service = {
    getReviewTransactions: rows,
    async getTransactionLinks(): Promise<TransactionLink[]> {
      return db.queryAsync<TransactionLink>(
        `SELECT l.id,l.source_id sourceId,l.target_id targetId,l.kind,l.relation_type relationType,l.amount FROM transaction_links l JOIN transactions s ON s.id=l.source_id AND s.profile_id=l.profile_id AND s.is_deleted=0 JOIN transactions t ON t.id=l.target_id AND t.profile_id=l.profile_id AND t.is_deleted=0 WHERE l.profile_id=? AND l.is_deleted=0`,
        [profile()]
      );
    },
    async getTransactionReviewInbox(
      includeLater = false
    ): Promise<ReviewItem[]> {
      const [transactions, decisions, links] = await Promise.all([
        rows(),
        db.queryAsync<{
          item_key: string;
          status: string;
          snoozed_until: string | null;
        }>(
          'SELECT item_key,status,snoozed_until FROM transaction_review_decisions WHERE profile_id=? AND is_deleted=0',
          [profile()]
        ),
        service.getTransactionLinks(),
      ]);
      const today = formatDateISO(new Date());
      return buildReviewCandidates(transactions).filter(
        (item) =>
          !decisions.some(
            (d) =>
              d.item_key === item.key &&
              (d.status === 'done' ||
                (!includeLater && !!d.snoozed_until && d.snoozed_until > today))
          ) &&
          !links.some(
            (l) =>
              item.related &&
              ((l.sourceId === item.transaction.id &&
                l.targetId === item.related.id) ||
                (l.targetId === item.transaction.id &&
                  l.sourceId === item.related.id))
          )
      );
    },
    async saveReviewDecision(key: string, status: 'done' | 'later') {
      if (!key || key.length > 500 || !['done', 'later'].includes(status))
        throw new Error('Invalid review decision');
      const now = Date.now();
      await db.runAsync(
        `INSERT INTO transaction_review_decisions(id,item_key,status,snoozed_until,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(profile_id,item_key) DO UPDATE SET status=excluded.status,snoozed_until=excluded.snoozed_until,updated_at=excluded.updated_at,is_deleted=0`,
        [
          crypto.randomUUID(),
          key,
          status,
          status === 'later'
            ? addDaysToDateOnly(formatDateISO(new Date()), 7)
            : null,
          profile(),
          now,
          now,
        ]
      );
    },
    async undoReviewDecision(key: string) {
      await db.runAsync(
        'UPDATE transaction_review_decisions SET is_deleted=1,updated_at=? WHERE profile_id=? AND item_key=?',
        [Date.now(), profile(), key]
      );
    },
    async saveReviewedCategory(
      transactionId: string,
      categoryId: string | null
    ) {
      await requireTx(transactionId);
      if (
        categoryId &&
        !(await db.queryOneAsync(
          'SELECT id FROM categories WHERE id=? AND profile_id=? AND is_deleted=0',
          [categoryId, profile()]
        ))
      )
        throw new Error('Category not found');
      const now = Date.now();
      await db.transactionAsync(async () => {
        await db.runAsync(
          'UPDATE transactions SET category_id=?,updated_at=? WHERE id=? AND profile_id=?',
          [categoryId, now, transactionId, profile()]
        );
        await db.runAsync(
          `INSERT INTO transaction_category_decisions(id,transaction_id,category_id,source,profile_id,created_at,updated_at) VALUES(?,?,?,'manual',?,?,?) ON CONFLICT(profile_id,transaction_id) DO UPDATE SET category_id=excluded.category_id,source='manual',updated_at=excluded.updated_at,is_deleted=0`,
          [crypto.randomUUID(), transactionId, categoryId, profile(), now, now]
        );
      });
    },
    async createTransactionLink(input: {
      sourceId: string;
      targetId: string;
      kind: 'refund' | 'transfer';
      relationType?: 'refund' | 'reimbursement';
      amount: number;
    }) {
      if (
        (input.relationType !== undefined &&
          !['refund', 'reimbursement'].includes(input.relationType)) ||
        input.sourceId === input.targetId ||
        !['refund', 'transfer'].includes(input.kind) ||
        moneyCents(input.amount) <= 0
      )
        throw new Error('Invalid link');
      const id = crypto.randomUUID(),
        now = Date.now();
      await db.transactionAsync(async () => {
        const source = await requireTx(input.sourceId),
          target = await requireTx(input.targetId),
          links = await service.getTransactionLinks();
        if (
          links.some(
            (l) =>
              l.kind === 'transfer' &&
              [l.sourceId, l.targetId].some(
                (x) => x === source.id || x === target.id
              )
          )
        )
          throw new Error('Transaction already paired');
        if (input.kind === 'refund') {
          if (source.type !== 'income' || target.type !== 'expense')
            throw new Error('Refund must link incoming money to an expense');
          const incoming = links
            .filter((l) => l.kind === 'refund' && l.sourceId === source.id)
            .reduce((n, l) => n + moneyCents(l.amount), 0);
          const outgoing = links
            .filter((l) => l.kind === 'refund' && l.targetId === target.id)
            .reduce((n, l) => n + moneyCents(l.amount), 0);
          if (
            incoming + moneyCents(input.amount) >
              moneyCents(Math.abs(source.amount)) ||
            outgoing + moneyCents(input.amount) >
              moneyCents(Math.abs(target.amount))
          )
            throw new Error('Link exceeds remaining amount');
        } else {
          if (
            source.accountId === target.accountId ||
            signed(source) * signed(target) >= 0 ||
            moneyCents(Math.abs(source.amount)) !==
              moneyCents(Math.abs(target.amount)) ||
            moneyCents(input.amount) !== moneyCents(Math.abs(source.amount)) ||
            links.some((l) =>
              [l.sourceId, l.targetId].some(
                (x) => x === source.id || x === target.id
              )
            )
          )
            throw new Error(
              'Transfer must pair equal opposite amounts on different accounts'
            );
          await db.runAsync(
            "UPDATE transactions SET type='transfer',updated_at=? WHERE profile_id=? AND id IN (?,?)",
            [now, profile(), source.id, target.id]
          );
        }
        await db.runAsync(
          'INSERT INTO transaction_links(id,source_id,target_id,kind,relation_type,amount,source_type,target_type,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
          [
            id,
            source.id,
            target.id,
            input.kind,
            input.kind === 'transfer'
              ? 'transfer'
              : input.relationType || 'refund',
            moneyCents(input.amount) / 100,
            source.type,
            target.type,
            profile(),
            now,
            now,
          ]
        );
      });
      return id;
    },
    async deleteTransactionLink(id: string) {
      await db.transactionAsync(async () => {
        const link = await db.queryOneAsync<{
          source_id: string;
          target_id: string;
          source_type: string;
          target_type: string;
          kind: string;
        }>(
          'SELECT * FROM transaction_links WHERE id=? AND profile_id=? AND is_deleted=0',
          [id, profile()]
        );
        if (!link) return;
        const now = Date.now();
        if (link.kind === 'transfer')
          for (const [tx, type] of [
            [link.source_id, link.source_type],
            [link.target_id, link.target_type],
          ])
            await db.runAsync(
              "UPDATE transactions SET type=?,updated_at=? WHERE id=? AND profile_id=? AND type='transfer'",
              [type, now, tx, profile()]
            );
        await db.runAsync(
          'UPDATE transaction_links SET is_deleted=1,updated_at=? WHERE id=? AND profile_id=?',
          [now, id, profile()]
        );
      });
    },
    async markTransactionRecurring(
      transactionId: string,
      frequency: PatternType
    ) {
      if (
        !['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'].includes(
          frequency
        )
      )
        throw new Error('Invalid frequency');
      const tx = await requireTx(transactionId);
      if (tx.type !== 'expense')
        throw new Error('Only an expense can become a bill');
      const existing = await db.queryOneAsync<{ id: string }>(
        `SELECT id FROM recurring_patterns WHERE profile_id=? AND is_deleted=0 AND is_active=1 AND COALESCE(merchant_name,'')=? AND COALESCE(opposing_iban,'')=?`,
        [
          profile(),
          tx.merchantName || tx.opposingAccountName || tx.description,
          tx.opposingAccountIban || '',
        ]
      );
      if (existing) return existing.id;
      const id = crypto.randomUUID(),
        now = Date.now();
      const next =
        frequency === 'weekly' || frequency === 'biweekly'
          ? addDaysToDateOnly(tx.date, frequency === 'weekly' ? 7 : 14)
          : addMonthsToDateOnly(
              tx.date,
              frequency === 'yearly' ? 12 : frequency === 'quarterly' ? 3 : 1
            );
      await db.runAsync(
        `INSERT INTO recurring_patterns(id,opposing_iban,merchant_name,pattern_type,avg_amount,last_amount,last_date,next_expected_date,is_active,is_confirmed,transaction_count,manual_source,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,1,1,1,1,?,?,?)`,
        [
          id,
          tx.opposingAccountIban,
          tx.merchantName || tx.opposingAccountName || tx.description,
          frequency,
          Math.abs(tx.amount),
          Math.abs(tx.amount),
          tx.date,
          next,
          profile(),
          now,
          now,
        ]
      );
      return id;
    },
    async exportFilteredTransactions(
      view: TransactionView,
      language: 'nl' | 'en'
    ) {
      return transactionCSV(
        (await rows()).filter((tx) => matchesExportView(tx, view)),
        language
      );
    },
  };
  return service;
}
