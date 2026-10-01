import { afterEach, beforeEach, describe, it, expect } from 'vitest';
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
beforeEach(() => {
  sqlite = new SQLite(':memory:');
  sqlite.pragma('foreign_keys=ON');
  sqlite.exec(SCHEMA_SQL);
  sqlite.exec(TRANSACTION_REVIEW_SCHEMA_SQL);
  sqlite.exec(
    'ALTER TABLE recurring_patterns ADD COLUMN manual_source INTEGER NOT NULL DEFAULT 0'
  );
  sqlite.exec(
    `INSERT INTO users(id,name) VALUES('u','User');INSERT INTO profiles(id,user_id,name) VALUES('p','u','Personal'),('q','u','Other');INSERT INTO accounts(id,iban,name,profile_id) VALUES('a','NL1','Account','p'),('b','NL2','Savings','p'),('c','NL3','Other','q');INSERT INTO categories(id,name,profile_id) VALUES('cat','Food','p'),('othercat','Other','q');`
  );
  pid = 'p';
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
    transactionAsync: async <T>(fn: () => Promise<T>) => {
      sqlite.exec('BEGIN');
      try {
        const result = await fn();
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
  it('marks a single expense as a confirmed bill idempotently', async () => {
    tx('e', -20);
    const id = await service.markTransactionRecurring('e', 'monthly');
    expect(await service.markTransactionRecurring('e', 'monthly')).toBe(id);
    expect(
      sqlite
        .prepare(
          'SELECT next_expected_date,is_confirmed,transaction_count FROM recurring_patterns'
        )
        .get()
    ).toEqual({
      next_expected_date: '2026-10-01',
      is_confirmed: 1,
      transaction_count: 1,
    });
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
      buildReviewCandidates(rows).some(
        (x) => x.kind === 'spike' && x.transaction.id === 'spike'
      )
    ).toBe(true);
    expect(await service.getTransactionLinks()).toHaveLength(0);
  });
  it('checks every saved view dimension for exports', () => {
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
      transactionAsync: async <T>(fn: () => Promise<T>) => fn(),
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
