import { merchantSimilarity } from './import-tools';
import {
  addDaysToDateOnly,
  formatDateISO,
  type PatternType,
  type Transaction,
} from '@fluxby/shared';
import { moneyCents, type FinancialDatabase } from './financial-planning';
import { addPlanningMonths } from './household-planning';
import type { TransactionView } from '../transaction-view';

export interface ReviewTransaction extends Transaction {
  accountName: string;
  accountIban?: string | null;
  categoryName: string | null;
  parentCategoryId?: string | null;
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
  evidence?:
    | { kind: 'spike'; median: number; count: number; windowDays: number }
    | {
        kind: 'categorySpike';
        amount: number;
        average: number;
        count: number;
        elapsedDay: number;
      }
    | { kind: 'newMerchant'; minimumAmount: number; historyCount: number }
    | { kind: 'transfer'; distanceDays: number; ownIban: boolean };
}
export interface TransactionLink {
  id: string;
  sourceId: string;
  targetId: string;
  kind: 'refund' | 'transfer';
  relationType: 'refund' | 'reimbursement' | 'transfer';
  amount: number;
}
export interface ReviewDecision {
  status: 'done' | 'later';
  snoozedUntil: string | null;
}
export interface CategoryDecision {
  categoryId: string | null;
  source: string;
}
const normalized = (s: string) =>
  s
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
const merchant = (t: ReviewTransaction) =>
  normalized(t.merchantName || t.opposingAccountName || t.description || '');
const normalizedIban = (iban: string) => iban.replace(/\s+/g, '').toUpperCase();
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
  const transferCandidates: ReviewItem[] = [];
  const sorted = [...rows].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)
  );
  const history = new Map<string, ReviewTransaction[]>();
  const recentAmounts = new Map<number, ReviewTransaction[]>();
  const newest = sorted[sorted.length - 1]?.date;
  let expenseHistoryCount = 0;
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
    if (key && tx.type === 'expense' && baseline.length >= 3) {
      const amounts = baseline
          .map((t) => Math.abs(t.amount))
          .sort((a, b) => a - b),
        median = amounts[Math.floor(amounts.length / 2)];
      if (Math.abs(tx.amount) > Math.max(median * 2, median + 25))
        items.push({
          key: `spike:${tx.id}`,
          kind: 'spike',
          transaction: tx,
          evidence: {
            kind: 'spike',
            median,
            count: baseline.length,
            windowDays: 180,
          },
        });
    }
    if (
      key &&
      prior.length === 0 &&
      expenseHistoryCount >= 10 &&
      tx.type === 'expense' &&
      Math.abs(tx.amount) >= 100 &&
      newest &&
      day(newest) - day(tx.date) <= 30
    )
      items.push({
        key: `newMerchant:${tx.id}`,
        kind: 'newMerchant',
        transaction: tx,
        evidence: {
          kind: 'newMerchant',
          minimumAmount: 100,
          historyCount: expenseHistoryCount,
        },
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
        transferCandidates.push({
          key: `transfer:${[tx.id, other.id].sort().join(':')}`,
          kind: 'transfer',
          transaction: tx,
          related: other,
          evidence: {
            kind: 'transfer',
            distanceDays: distance,
            ownIban:
              (!!tx.opposingAccountIban &&
                normalizedIban(tx.opposingAccountIban) ===
                  normalizedIban(other.accountIban || '')) ||
              (!!other.opposingAccountIban &&
                normalizedIban(other.opposingAccountIban) ===
                  normalizedIban(tx.accountIban || '')),
          },
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
    if (tx.type === 'expense') expenseHistoryCount += 1;
  }
  // Prefer explicit own-account evidence, then the nearest available date.
  // Each transaction appears in at most one suggested pair; confirmation remains explicit.
  const assignedTransfers = new Set<string>();
  for (const candidate of transferCandidates.sort((a, b) => {
    const first = a.evidence,
      second = b.evidence;
    if (first?.kind !== 'transfer' || second?.kind !== 'transfer') return 0;
    return (
      Number(second.ownIban) - Number(first.ownIban) ||
      first.distanceDays - second.distanceDays ||
      a.key.localeCompare(b.key)
    );
  })) {
    if (
      !candidate.related ||
      assignedTransfers.has(candidate.transaction.id) ||
      assignedTransfers.has(candidate.related.id)
    )
      continue;
    assignedTransfers.add(candidate.transaction.id);
    assignedTransfers.add(candidate.related.id);
    items.push(candidate);
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
          (tx) =>
            tx.type === 'expense' &&
            tx.categoryId === categoryId &&
            tx.date.slice(0, 7) === month
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
          evidence: {
            kind: 'categorySpike',
            amount: current,
            average: mean,
            count: prior.length,
            elapsedDay: elapsed,
          },
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
  const assertProfile = (id: string) => {
    if (currentProfileId() !== id) throw new Error('Active profile changed');
  };
  const transactionSQL = `SELECT t.id,t.date,t.amount,t.type,COALESCE(t.description,'') description,t.merchant_name merchantName,t.account_id accountId,t.opposing_account_iban opposingAccountIban,t.opposing_account_name opposingAccountName,t.category_id categoryId,t.notes,t.payment_method paymentMethod,t.raw_data rawData,t.import_hash importHash,t.created_at createdAt,t.payment_provider paymentProvider,t.address_book_id addressBookId,a.name accountName,a.iban accountIban,c.name categoryName,c.parent_id parentCategoryId FROM transactions t JOIN accounts a ON a.id=t.account_id AND a.profile_id=t.profile_id LEFT JOIN categories c ON c.id=t.category_id AND c.profile_id=t.profile_id WHERE t.profile_id=? AND t.is_deleted=0 AND a.is_deleted=0`;
  const rows = async (id = profile(), connection = db) =>
    connection.queryAsync<ReviewTransaction>(
      `${transactionSQL} ORDER BY t.date DESC,t.id`,
      [id]
    );
  const requireTx = async (id: string, profileId: string, connection = db) => {
    const tx = await connection.queryOneAsync<ReviewTransaction>(
      `${transactionSQL} AND t.id=? LIMIT 1`,
      [profileId, id]
    );
    if (!tx) throw new Error('Transaction not found');
    return tx;
  };
  const getLinks = (id: string, connection = db) =>
    connection.queryAsync<TransactionLink>(
      `SELECT l.id,l.source_id sourceId,l.target_id targetId,l.kind,l.relation_type relationType,l.amount FROM transaction_links l JOIN transactions s ON s.id=l.source_id AND s.profile_id=l.profile_id AND s.is_deleted=0 JOIN transactions t ON t.id=l.target_id AND t.profile_id=l.profile_id AND t.is_deleted=0 WHERE l.profile_id=? AND l.is_deleted=0`,
      [id]
    );
  const writeCategory = async (
    transactionId: string,
    categoryId: string | null,
    decision: CategoryDecision | null
  ) => {
    const profileId = profile();
    await requireTx(transactionId, profileId);
    if (
      categoryId &&
      !(await db.queryOneAsync(
        'SELECT id FROM categories WHERE id=? AND profile_id=? AND is_deleted=0',
        [categoryId, profileId]
      ))
    )
      throw new Error('Category not found');
    const now = Date.now();
    return db.transactionAsync(async (db) => {
      const previous = await db.queryOneAsync<CategoryDecision>(
        'SELECT category_id AS categoryId,source FROM transaction_category_decisions WHERE transaction_id=? AND profile_id=? AND is_deleted=0',
        [transactionId, profileId]
      );
      assertProfile(profileId);
      await db.runAsync(
        'UPDATE transactions SET category_id=?,updated_at=? WHERE id=? AND profile_id=?',
        [categoryId, now, transactionId, profileId]
      );
      if (decision)
        await db.runAsync(
          `INSERT INTO transaction_category_decisions(id,transaction_id,category_id,source,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(profile_id,transaction_id) DO UPDATE SET category_id=excluded.category_id,source=excluded.source,updated_at=excluded.updated_at,is_deleted=0`,
          [
            crypto.randomUUID(),
            transactionId,
            decision.categoryId,
            decision.source,
            profileId,
            now,
            now,
          ]
        );
      else
        await db.runAsync(
          'UPDATE transaction_category_decisions SET is_deleted=1,updated_at=? WHERE transaction_id=? AND profile_id=?',
          [now, transactionId, profileId]
        );
      assertProfile(profileId);
      return previous;
    });
  };
  const service = {
    getReviewTransactions: () => rows(),
    async getTransactionLinks(): Promise<TransactionLink[]> {
      return getLinks(profile());
    },
    async getTransactionReviewInbox(
      includeLater = false
    ): Promise<ReviewItem[]> {
      const profileId = profile();
      const [transactions, decisions, links] = await Promise.all([
        rows(profileId),
        db.queryAsync<{
          item_key: string;
          status: string;
          snoozed_until: string | null;
        }>(
          'SELECT item_key,status,snoozed_until FROM transaction_review_decisions WHERE profile_id=? AND is_deleted=0',
          [profileId]
        ),
        getLinks(profileId),
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
      const profileId = profile(),
        now = Date.now();
      return db.transactionAsync(async (db) => {
        const previous = await db.queryOneAsync<ReviewDecision>(
          'SELECT status,snoozed_until AS snoozedUntil FROM transaction_review_decisions WHERE profile_id=? AND item_key=? AND is_deleted=0',
          [profileId, key]
        );
        assertProfile(profileId);
        await db.runAsync(
          `INSERT INTO transaction_review_decisions(id,item_key,status,snoozed_until,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(profile_id,item_key) DO UPDATE SET status=excluded.status,snoozed_until=excluded.snoozed_until,updated_at=excluded.updated_at,is_deleted=0`,
          [
            crypto.randomUUID(),
            key,
            status,
            status === 'later'
              ? addDaysToDateOnly(formatDateISO(new Date()), 7)
              : null,
            profileId,
            now,
            now,
          ]
        );
        assertProfile(profileId);
        return previous;
      });
    },
    async undoReviewDecision(key: string, previous?: ReviewDecision) {
      const profileId = profile();
      if (previous)
        await db.runAsync(
          'UPDATE transaction_review_decisions SET status=?,snoozed_until=?,is_deleted=0,updated_at=? WHERE profile_id=? AND item_key=?',
          [previous.status, previous.snoozedUntil, Date.now(), profileId, key]
        );
      else
        await db.runAsync(
          'UPDATE transaction_review_decisions SET is_deleted=1,updated_at=? WHERE profile_id=? AND item_key=?',
          [Date.now(), profileId, key]
        );
    },
    async saveReviewedCategory(
      transactionId: string,
      categoryId: string | null
    ) {
      return writeCategory(transactionId, categoryId, {
        categoryId,
        source: 'manual',
      });
    },
    async undoReviewedCategory(
      transactionId: string,
      categoryId: string | null,
      previous: CategoryDecision | null
    ) {
      if (previous && previous.categoryId !== categoryId)
        throw new Error('Invalid category undo');
      await writeCategory(transactionId, categoryId, previous);
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
      const profileId = profile();
      const id = crypto.randomUUID(),
        now = Date.now();
      await db.transactionAsync(async (db) => {
        const source = await requireTx(input.sourceId, profileId, db),
          target = await requireTx(input.targetId, profileId, db),
          links = await getLinks(profileId, db);
        assertProfile(profileId);
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
            [now, profileId, source.id, target.id]
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
            profileId,
            now,
            now,
          ]
        );
        assertProfile(profileId);
      });
      return id;
    },
    async deleteTransactionLink(id: string) {
      const profileId = profile();
      await db.transactionAsync(async (db) => {
        const link = await db.queryOneAsync<{
          source_id: string;
          target_id: string;
          source_type: string;
          target_type: string;
          kind: string;
        }>(
          'SELECT * FROM transaction_links WHERE id=? AND profile_id=? AND is_deleted=0',
          [id, profileId]
        );
        if (!link) return;
        assertProfile(profileId);
        const now = Date.now();
        if (link.kind === 'transfer')
          for (const [tx, type] of [
            [link.source_id, link.source_type],
            [link.target_id, link.target_type],
          ])
            await db.runAsync(
              "UPDATE transactions SET type=?,updated_at=? WHERE id=? AND profile_id=? AND type='transfer'",
              [type, now, tx, profileId]
            );
        await db.runAsync(
          'UPDATE transaction_links SET is_deleted=1,updated_at=? WHERE id=? AND profile_id=?',
          [now, id, profileId]
        );
        assertProfile(profileId);
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
      const profileId = profile();
      const tx = await requireTx(transactionId, profileId);
      if (tx.type !== 'expense')
        throw new Error('Only an expense can become a bill');
      const existing = await db.queryOneAsync<{
        id: string;
        last_date: string;
        avg_amount: number;
        last_amount: number;
      }>(
        `SELECT id,last_date,avg_amount,last_amount FROM recurring_patterns WHERE profile_id=? AND is_deleted=0 AND is_active=1 AND (avg_amount<0 OR manual_source=1) AND COALESCE(merchant_name,'')=? AND COALESCE(opposing_iban,'')=?`,
        [
          profileId,
          tx.merchantName || tx.opposingAccountName || tx.description,
          tx.opposingAccountIban || '',
        ]
      );
      assertProfile(profileId);
      const id = crypto.randomUUID(),
        now = Date.now();
      const baseDate =
        existing?.last_date && existing.last_date > tx.date
          ? existing.last_date
          : tx.date;
      const next =
        frequency === 'weekly' || frequency === 'biweekly'
          ? addDaysToDateOnly(baseDate, frequency === 'weekly' ? 7 : 14)
          : addPlanningMonths(
              baseDate,
              frequency === 'yearly' ? 12 : frequency === 'quarterly' ? 3 : 1
            );
      return db.transactionAsync(async (db) => {
        assertProfile(profileId);
        if (existing) {
          await db.runAsync(
            'UPDATE recurring_patterns SET pattern_type=?,next_expected_date=?,is_confirmed=1,is_dismissed=0,manual_source=1,avg_amount=?,last_amount=?,updated_at=? WHERE id=? AND profile_id=?',
            [
              frequency,
              next,
              -Math.abs(existing.avg_amount),
              -Math.abs(existing.last_amount),
              now,
              existing.id,
              profileId,
            ]
          );
          assertProfile(profileId);
          return existing.id;
        }
        await db.runAsync(
          `INSERT INTO recurring_patterns(id,opposing_iban,merchant_name,pattern_type,avg_amount,last_amount,last_date,next_expected_date,is_active,is_confirmed,transaction_count,manual_source,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,1,1,1,1,?,?,?)`,
          [
            id,
            tx.opposingAccountIban,
            tx.merchantName || tx.opposingAccountName || tx.description,
            frequency,
            -Math.abs(tx.amount),
            -Math.abs(tx.amount),
            tx.date,
            next,
            profileId,
            now,
            now,
          ]
        );
        assertProfile(profileId);
        return id;
      });
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
