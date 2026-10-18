import type { AsyncDatabaseConnection } from '@fluxby/database';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import SQLite from 'better-sqlite3';
import { SCHEMA_SQL } from '../../packages/database/src/schema';
import { TRANSACTION_REVIEW_SCHEMA_SQL } from '../../packages/database/src/migrations/019_transaction_review';
import {
  createTransactionReviewService,
  transactionCSV,
  buildReviewCandidates,
  matchesExportView,
  type ReviewTransaction,
} from '@/lib/data/transaction-review';
import { seedTransactionReviewDemo } from '@/lib/data/transaction-review-demo';
import { getTransactionReviewDemoData } from '@fluxby/shared';
import type { TransactionView } from '@/lib/transaction-view';
let sqlite: SQLite.Database;
let pid = 'p';
let service: ReturnType<typeof createTransactionReviewService>;
let afterQuery: (() => void) | null = null;
let pointQueries: { sql: string; params: unknown[] }[];
beforeEach(() => {
  sqlite = new SQLite(':memory:');
  sqlite.pragma('foreign_keys=ON');
  sqlite.exec(SCHEMA_SQL);
  sqlite.exec(TRANSACTION_REVIEW_SCHEMA_SQL);
  sqlite.exec(
    'ALTER TABLE recurring_patterns ADD COLUMN manual_source INTEGER NOT NULL DEFAULT 0'
  );
  sqlite.exec(
    'ALTER TABLE recurring_patterns ADD COLUMN is_dismissed INTEGER NOT NULL DEFAULT 0'
  );
  sqlite.exec(
    `INSERT INTO users(id,name) VALUES('u','User');INSERT INTO profiles(id,user_id,name) VALUES('p','u','Personal'),('q','u','Other');INSERT INTO accounts(id,iban,name,profile_id) VALUES('a','NL1','Account','p'),('b','NL2','Savings','p'),('c','NL3','Other','q');INSERT INTO categories(id,name,profile_id) VALUES('cat','Food','p'),('othercat','Other','q');`
  );
  pid = 'p';
  afterQuery = null;
  pointQueries = [];
  const db = {
    queryAsync: async <T>(sql: string, params: unknown[] = []) => {
      const rows = sqlite.prepare(sql).all(...params) as T[];
      afterQuery?.();
      return rows;
    },
    queryOneAsync: async <T>(sql: string, params: unknown[] = []) => {
      pointQueries.push({ sql, params });
      const row = (sqlite.prepare(sql).get(...params) as T) || null;
      afterQuery?.();
      return row;
    },
    runAsync: async (sql: string, params: unknown[] = []) => {
      const result = sqlite.prepare(sql).run(...params);
      return {
        changes: result.changes,
        lastInsertRowId: Number(result.lastInsertRowid),
      };
    },
    transactionAsync: async function <T>(
      this: unknown,
      fn: (connection: AsyncDatabaseConnection) => Promise<T>
    ) {
      sqlite.exec('BEGIN');
      try {
        const result = await fn(this as AsyncDatabaseConnection);
        sqlite.exec('COMMIT');
        return result;
      } catch (e) {
        sqlite.exec('ROLLBACK');
        throw e;
      }
    },
  };
  service = createTransactionReviewService(db, () => pid);
});
afterEach(() => sqlite.close());
function tx(
  id: string,
  amount: number,
  date = '2026-09-01',
  account = 'a',
  type = amount < 0 ? 'expense' : 'income'
) {
  sqlite
    .prepare(
      'INSERT INTO transactions(id,date,amount,type,description,merchant_name,account_id,profile_id) VALUES(?,?,?,?,?,?,?,?)'
    )
    .run(
      id,
      date,
      amount,
      type,
      'Shop purchase',
      'Shop',
      account,
      account === 'c' ? 'q' : 'p'
    );
}
const view: TransactionView = {
  search: '',
  type: 'all',
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  categories: [],
  ibans: [],
  accountName: null,
  addressBookId: null,
  methods: [],
  providers: [],
  compact: false,
};
describe('transaction review', () => {
  it('looks up a single owned transaction without loading its profile history', async () => {
    for (let i = 0; i < 1000; i++) tx(`history-${i}`, -10);
    tx('foreign', -20, '2026-09-01', 'c');
    tx('deleted', -30);
    sqlite.exec("UPDATE transactions SET is_deleted=1 WHERE id='deleted'");
    const fullHistory = vi.spyOn(sqlite, 'prepare');
    await service.saveReviewedCategory('history-500', 'cat');
    const lookup = pointQueries.find(({ sql }) =>
      sql.includes('FROM transactions t')
    );
    expect(lookup?.sql).toContain('AND t.id=? LIMIT 1');
    expect(lookup?.params).toEqual(['p', 'history-500']);
    expect(
      fullHistory.mock.calls.some(([sql]) =>
        sql.includes('ORDER BY t.date DESC,t.id')
      )
    ).toBe(false);
    expect(
      sqlite
        .prepare("SELECT category_id FROM transactions WHERE id='history-500'")
        .get()
    ).toEqual({ category_id: 'cat' });
    await expect(
      service.saveReviewedCategory('foreign', 'cat')
    ).rejects.toThrow('Transaction not found');
    await expect(
      service.saveReviewedCategory('deleted', 'cat')
    ).rejects.toThrow('Transaction not found');
    sqlite.exec("UPDATE accounts SET is_deleted=1 WHERE id='a'");
    await expect(
      service.saveReviewedCategory('history-500', 'cat')
    ).rejects.toThrow('Transaction not found');
  });
  it('persists snoozes and decisions and undo without leaking profiles', async () => {
    tx('e', -100);
    tx('f', -100, '2026-09-02');
    tx('foreign', -100, '2026-09-01', 'c');
    const initial = await service.getTransactionReviewInbox();
    expect(initial.some((x) => x.kind === 'duplicate')).toBe(true);
    expect(initial.some((x) => x.transaction.id === 'foreign')).toBe(false);
    const key = initial[0].key;
    await service.saveReviewDecision(key, 'later');
    expect(
      (await service.getTransactionReviewInbox()).some((x) => x.key === key)
    ).toBe(false);
    expect(
      (await service.getTransactionReviewInbox(true)).some((x) => x.key === key)
    ).toBe(true);
    await service.saveReviewDecision(key, 'done');
    expect(
      (await service.getTransactionReviewInbox(true)).some((x) => x.key === key)
    ).toBe(false);
    await service.undoReviewDecision(key);
    expect(
      (await service.getTransactionReviewInbox()).some((x) => x.key === key)
    ).toBe(true);
  });
  it('permits multiple partial refunds but rejects over-allocation and cross-profile links atomically', async () => {
    tx('e', -100);
    tx('r1', 60);
    tx('r2', 50);
    tx('other', -100, '2026-09-01', 'c');
    await service.createTransactionLink({
      sourceId: 'r1',
      targetId: 'e',
      kind: 'refund',
      amount: 60,
    });
    await service.createTransactionLink({
      sourceId: 'r2',
      targetId: 'e',
      kind: 'refund',
      amount: 40,
    });
    await expect(
      service.createTransactionLink({
        sourceId: 'r2',
        targetId: 'e',
        kind: 'refund',
        amount: 10,
      })
    ).rejects.toThrow('remaining');
    await expect(
      service.createTransactionLink({
        sourceId: 'r2',
        targetId: 'other',
        kind: 'refund',
        amount: 10,
      })
    ).rejects.toThrow('not found');
    expect(await service.getTransactionLinks()).toHaveLength(2);
    expect(
      sqlite.prepare("SELECT amount FROM transactions WHERE id='e'").get()
    ).toEqual({ amount: -100 });
  });
  it('pairs opposite transfers and restores types when unlinked', async () => {
    tx('out', -50);
    tx('in', 50, '2026-09-02', 'b');
    const id = await service.createTransactionLink({
      sourceId: 'out',
      targetId: 'in',
      kind: 'transfer',
      amount: 50,
    });
    expect(
      (await service.getReviewTransactions()).every(
        (t) => t.type === 'transfer'
      )
    ).toBe(true);
    await expect(
      service.createTransactionLink({
        sourceId: 'out',
        targetId: 'in',
        kind: 'transfer',
        amount: 50,
      })
    ).rejects.toThrow();
    await service.deleteTransactionLink(id);
    expect(
      (await service.getReviewTransactions()).map((t) => t.type).sort()
    ).toEqual(['expense', 'income']);
  });
  it('suggests the closest available transfer once and does not depend on input order', async () => {
    tx('early-out', -50, '2026-09-01');
    tx('near-out', -50, '2026-09-03');
    tx('incoming', 50, '2026-09-03', 'b');
    const rows = await service.getReviewTransactions();
    const pairs = buildReviewCandidates(rows).filter(
      (item) => item.kind === 'transfer'
    );
    expect(pairs).toHaveLength(1);
    expect(pairs[0].key).toBe('transfer:incoming:near-out');
    expect(pairs[0].evidence).toEqual({
      kind: 'transfer',
      distanceDays: 0,
      ownIban: false,
    });
    expect(
      buildReviewCandidates([...rows].reverse()).filter(
        (item) => item.kind === 'transfer'
      )
    ).toEqual(pairs);
    expect(await service.getTransactionLinks()).toHaveLength(0);
  });
  it('prefers supplied own-IBAN evidence and keeps all suggested transfers one-to-one', async () => {
    sqlite
      .prepare(
        "INSERT INTO accounts(id,iban,name,profile_id) VALUES('d','NL4','Joint','p')"
      )
      .run();
    tx('own-iban-out', -50, '2026-09-01');
    tx('closer-out', -50, '2026-09-03', 'b');
    tx('incoming', 50, '2026-09-03', 'd');
    sqlite
      .prepare(
        "UPDATE transactions SET opposing_account_iban='nl 1' WHERE id='incoming'"
      )
      .run();
    let pairs = buildReviewCandidates(
      await service.getReviewTransactions()
    ).filter((item) => item.kind === 'transfer');
    expect(pairs).toHaveLength(1);
    expect(pairs[0].key).toBe('transfer:incoming:own-iban-out');
    expect(pairs[0].evidence).toEqual({
      kind: 'transfer',
      distanceDays: 2,
      ownIban: true,
    });
    tx('second-incoming', 50, '2026-09-03');
    pairs = buildReviewCandidates(await service.getReviewTransactions()).filter(
      (item) => item.kind === 'transfer'
    );
    expect(pairs).toHaveLength(2);
    expect(
      new Set(pairs.flatMap((item) => [item.transaction.id, item.related?.id]))
        .size
    ).toBe(4);
  });
  it('keeps confirmed reimbursements intact when their category is explicitly inherited and undone', async () => {
    tx('original', -50);
    tx('reimbursement', 20);
    await service.saveReviewedCategory('original', 'cat');
    const linkId = await service.createTransactionLink({
      sourceId: 'reimbursement',
      targetId: 'original',
      kind: 'refund',
      relationType: 'reimbursement',
      amount: 20,
    });
    const previous = await service.saveReviewedCategory('reimbursement', 'cat');
    expect(previous).toBeNull();
    expect(
      sqlite
        .prepare(
          "SELECT category_id,source FROM transaction_category_decisions WHERE transaction_id='reimbursement' AND is_deleted=0"
        )
        .get()
    ).toEqual({ category_id: 'cat', source: 'manual' });
    await service.undoReviewedCategory('reimbursement', null, previous);
    expect(
      sqlite
        .prepare(
          "SELECT category_id,amount,type FROM transactions WHERE id='reimbursement'"
        )
        .get()
    ).toEqual({ category_id: null, amount: 20, type: 'income' });
    expect(await service.getTransactionLinks()).toEqual([
      expect.objectContaining({ id: linkId, amount: 20 }),
    ]);
  });
  it('records deliberate category provenance and rejects categories in another profile', async () => {
    tx('e', -20);
    await service.saveReviewedCategory('e', 'cat');
    expect(
      sqlite
        .prepare(
          'SELECT category_id,source FROM transaction_category_decisions'
        )
        .get()
    ).toEqual({ category_id: 'cat', source: 'manual' });
    await expect(
      service.saveReviewedCategory('e', 'othercat')
    ).rejects.toThrow();
    expect(
      (await service.getTransactionReviewInbox()).some(
        (x) => x.kind === 'uncategorized'
      )
    ).toBe(false);
  });
  it('undoes both the category and its deliberate-review protection', async () => {
    tx('expense', -20);
    const previous = await service.saveReviewedCategory('expense', 'cat');
    expect(previous).toBeNull();
    await service.undoReviewedCategory('expense', null, previous);
    expect(
      sqlite
        .prepare("SELECT category_id FROM transactions WHERE id='expense'")
        .get()
    ).toEqual({ category_id: null });
    expect(
      sqlite
        .prepare(
          'SELECT COUNT(*) count FROM transaction_category_decisions WHERE is_deleted=0'
        )
        .get()
    ).toEqual({ count: 0 });
  });
  it('marks a single expense as a confirmed bill idempotently', async () => {
    tx('e', -20);
    const id = await service.markTransactionRecurring('e', 'monthly');
    expect(await service.markTransactionRecurring('e', 'monthly')).toBe(id);
    expect(
      sqlite
        .prepare(
          'SELECT next_expected_date,is_confirmed,transaction_count,avg_amount,last_amount,manual_source FROM recurring_patterns'
        )
        .get()
    ).toEqual({
      next_expected_date: '2026-10-01',
      is_confirmed: 1,
      transaction_count: 1,
      avg_amount: -20,
      last_amount: -20,
      manual_source: 1,
    });
  });
  it.each([
    ['2026-01-31', 'monthly', '2026-02-28'],
    ['2026-11-30', 'quarterly', '2027-02-28'],
    ['2024-02-29', 'yearly', '2025-02-28'],
  ] as const)(
    'clamps a %s manual bill to the next %s due month',
    async (date, frequency, expected) => {
      tx('month-end-bill', -20, date);
      const id = await service.markTransactionRecurring(
        'month-end-bill',
        frequency
      );
      expect(
        sqlite
          .prepare(
            'SELECT next_expected_date FROM recurring_patterns WHERE id=?'
          )
          .get(id)
      ).toEqual({ next_expected_date: expected });
    }
  );
  it('restores the previous snooze when undoing a later done decision', async () => {
    tx('expense', -10);
    const key = 'uncategorized:expense';
    await service.saveReviewDecision(key, 'later');
    const previous = await service.saveReviewDecision(key, 'done');
    expect(previous?.status).toBe('later');
    await service.undoReviewDecision(key, previous || undefined);
    expect(
      (await service.getTransactionReviewInbox()).some(
        (item) => item.key === key
      )
    ).toBe(false);
    expect(
      (await service.getTransactionReviewInbox(true)).some(
        (item) => item.key === key
      )
    ).toBe(true);
  });
  it('confirms an existing detected bill and applies its chosen cadence without duplicating it', async () => {
    tx('expense', -20);
    const id = await service.markTransactionRecurring('expense', 'monthly');
    sqlite
      .prepare(
        'UPDATE recurring_patterns SET is_confirmed=0,manual_source=0 WHERE id=?'
      )
      .run(id);
    expect(await service.markTransactionRecurring('expense', 'biweekly')).toBe(
      id
    );
    expect(
      sqlite
        .prepare(
          'SELECT pattern_type,next_expected_date,is_confirmed,manual_source,avg_amount FROM recurring_patterns'
        )
        .get()
    ).toEqual({
      pattern_type: 'biweekly',
      next_expected_date: '2026-09-15',
      is_confirmed: 1,
      manual_source: 1,
      avg_amount: -20,
    });
    expect(
      sqlite.prepare('SELECT COUNT(*) count FROM recurring_patterns').get()
    ).toEqual({ count: 1 });
  });
  it('aborts link and bill creation if the profile changes during validation', async () => {
    tx('expense', -10);
    tx('refund', 10);
    afterQuery = () => {
      pid = 'q';
    };
    await expect(
      service.createTransactionLink({
        sourceId: 'refund',
        targetId: 'expense',
        kind: 'refund',
        amount: 10,
      })
    ).rejects.toThrow('Active profile changed');
    expect(
      sqlite.prepare('SELECT COUNT(*) count FROM transaction_links').get()
    ).toEqual({ count: 0 });
    pid = 'p';
    await expect(
      service.markTransactionRecurring('expense', 'monthly')
    ).rejects.toThrow('Active profile changed');
    expect(
      sqlite.prepare('SELECT COUNT(*) count FROM recurring_patterns').get()
    ).toEqual({ count: 0 });
  });
  it('exports all matching transactions safely in Dutch CSV format', async () => {
    tx('e', -20);
    tx('r', 30);
    sqlite
      .prepare("UPDATE transactions SET description=?,notes=? WHERE id='e'")
      .run('=HYPERLINK("bad")', 'a;b\nline');
    const csv = await service.exportFilteredTransactions(
      { ...view, type: 'expense' },
      'nl'
    );
    expect(csv).toContain('"Datum";"Bedrag"');
    expect(csv).toContain('"-20,00"');
    expect(csv).toContain('"\'=HYPERLINK');
    expect(csv).toContain('a;b\nline');
    expect(csv).not.toContain('30,00');
  });
  it('makes merchant anomaly suggestions only after evidence, and never mutates rows', async () => {
    for (let i = 1; i <= 3; i++) tx(`e${i}`, -10, `2026-09-0${i}`);
    tx('spike', -80, '2026-09-04');
    const rows = await service.getReviewTransactions();
    expect(
      buildReviewCandidates(rows).find(
        (x) => x.kind === 'spike' && x.transaction.id === 'spike'
      )?.evidence
    ).toEqual({ kind: 'spike', median: 10, count: 3, windowDays: 180 });
    expect(await service.getTransactionLinks()).toHaveLength(0);
  });
  it('requires substantial new-merchant amounts and expense history, and reports its evidence', async () => {
    for (let index = 0; index < 10; index++)
      tx(`expense-${index}`, -10, '2026-09-01');
    tx('small-new', -5, '2026-09-02');
    tx('large-new', -100, '2026-09-03');
    sqlite
      .prepare(
        "UPDATE transactions SET merchant_name=id WHERE id IN ('small-new','large-new')"
      )
      .run();
    const alerts = buildReviewCandidates(
      await service.getReviewTransactions()
    ).filter((item) => item.kind === 'newMerchant');
    expect(alerts).toHaveLength(1);
    expect(alerts[0].transaction.id).toBe('large-new');
    expect(alerts[0].evidence).toEqual({
      kind: 'newMerchant',
      minimumAmount: 100,
      historyCount: 11,
    });
    sqlite
      .prepare(
        "UPDATE transactions SET type='income' WHERE id LIKE 'expense-%'"
      )
      .run();
    expect(
      buildReviewCandidates(await service.getReviewTransactions()).some(
        (item) => item.kind === 'newMerchant'
      )
    ).toBe(false);
  });
  it('reports comparable elapsed-day category totals instead of full prior months', async () => {
    for (const month of ['06', '07', '08']) {
      tx(`early-${month}`, -20, `2026-${month}-05`);
      tx(`late-${month}`, -200, `2026-${month}-20`);
    }
    tx('current', -100, '2026-09-10');
    tx('zz-income', 5, '2026-09-10');
    sqlite.prepare("UPDATE transactions SET category_id='cat'").run();
    const item = buildReviewCandidates(
      await service.getReviewTransactions()
    ).find((candidate) => candidate.kind === 'categorySpike');
    expect(item?.evidence).toEqual({
      kind: 'categorySpike',
      amount: 100,
      average: 20,
      count: 3,
      elapsedDay: 10,
    });
    expect(item?.transaction.id).toBe('current');
  });
  it('checks every active filter dimension for exports', () => {
    const row = {
      date: '2026-09-01',
      type: 'expense',
      categoryId: 'cat',
      opposingAccountIban: 'NL1',
      paymentMethod: 'card',
      paymentProvider: 'ideal',
      opposingAccountName: 'Shop',
      addressBookId: 'contact',
      description: 'Food',
      merchantName: 'Shop',
      notes: '',
    } as ReviewTransaction;
    expect(
      matchesExportView(row, {
        ...view,
        categories: ['cat'],
        ibans: ['NL1'],
        methods: ['card'],
        providers: ['ideal'],
        accountName: 'Shop',
        addressBookId: 'contact',
        search: 'food',
      })
    ).toBe(true);
    expect(matchesExportView(row, { ...view, methods: ['cash'] })).toBe(false);
    expect(transactionCSV([], 'en')).toContain('"Date","Amount"');
  });
  it('seeds localized linked reimbursement examples with zero ledger effect', async () => {
    const db = {
      queryAsync: async <T>(sql: string, params: unknown[] = []) =>
        sqlite.prepare(sql).all(...params) as T[],
      queryOneAsync: async <T>(sql: string, params: unknown[] = []) =>
        (sqlite.prepare(sql).get(...params) as T) || null,
      runAsync: async (sql: string, params: unknown[] = []) => {
        const result = sqlite.prepare(sql).run(...params);
        return {
          changes: result.changes,
          lastInsertRowId: Number(result.lastInsertRowid),
        };
      },
      transactionAsync: async function <T>(
        this: unknown,
        fn: (connection: AsyncDatabaseConnection) => Promise<T>
      ) {
        return fn(this as AsyncDatabaseConnection);
      },
    };
    await seedTransactionReviewDemo(db, 'p', 'nl');
    expect(
      (await service.getReviewTransactions()).some(
        (t) => t.description === getTransactionReviewDemoData('nl').expense
      )
    ).toBe(true);
    expect(await service.getTransactionLinks()).toHaveLength(2);
    expect(
      sqlite
        .prepare(
          "SELECT SUM(amount) total FROM transactions WHERE profile_id='p'"
        )
        .get()
    ).toEqual({ total: 0 });
    expect(
      (await service.getReviewTransactions()).some(
        (t) => t.description === getTransactionReviewDemoData('en').expense
      )
    ).toBe(false);
  });
  it('ignores deleted link endpoints when calculating the remaining reimbursement', async () => {
    tx('expense', -40);
    tx('refund', 40);
    tx('replacement', -40);
    await service.createTransactionLink({
      sourceId: 'refund',
      targetId: 'expense',
      kind: 'refund',
      amount: 40,
    });
    sqlite
      .prepare("UPDATE transactions SET is_deleted=1 WHERE id='expense'")
      .run();
    expect(await service.getTransactionLinks()).toHaveLength(0);
    await expect(
      service.createTransactionLink({
        sourceId: 'refund',
        targetId: 'replacement',
        kind: 'refund',
        amount: 40,
      })
    ).resolves.toBeTypeOf('string');
  });
  it('recognizes fuzzy merchant duplicates and persists dismissals', async () => {
    tx('first', -30);
    tx('second', -30, '2026-09-02');
    sqlite
      .prepare(
        "UPDATE transactions SET merchant_name='Albert Heijn Amsterdam' WHERE id='first'"
      )
      .run();
    sqlite
      .prepare(
        "UPDATE transactions SET merchant_name='Albert Heijn Utrecht' WHERE id='second'"
      )
      .run();
    const item = (await service.getTransactionReviewInbox()).find(
      (i) => i.kind === 'duplicate'
    );
    expect(item).toBeDefined();
    if (!item) throw new Error('Expected duplicate candidate');
    await service.saveReviewDecision(item.key, 'done');
    expect(
      (await service.getTransactionReviewInbox()).some(
        (i) => i.kind === 'duplicate'
      )
    ).toBe(false);
  });
});
