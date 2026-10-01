import { describe, it, expect } from 'vitest';
import { analyzeCashflow } from '@/lib/cashflow-analysis';
import type {
  ReviewTransaction,
  TransactionLink,
} from '@/lib/data/transaction-review';
const tx = (id: string, date: string, amount: number, categoryId = 'food') =>
  ({
    id,
    date,
    amount,
    type: amount < 0 ? 'expense' : 'income',
    categoryId,
    categoryName: categoryId,
    accountId: 'account',
  }) as ReviewTransaction;
describe('cashflow analysis', () => {
  it('deducts partial reimbursements once on both ends and excludes own transfers', () => {
    const rows = [
      tx('salary', '2026-09-01', 2000),
      tx('food', '2026-09-10', -100),
      tx('refund', '2026-09-11', 30),
      { ...tx('transfer', '2026-09-11', -500), type: 'transfer' as const },
    ];
    const links = [
      {
        id: 'l',
        sourceId: 'refund',
        targetId: 'food',
        kind: 'refund',
        relationType: 'reimbursement',
        amount: 30,
      } satisfies TransactionLink,
    ];
    const result = analyzeCashflow(rows, links, '2026-09', 3, '2026-09-15');
    expect(result.income).toBe(2000);
    expect(result.expenses).toBe(70);
    expect(result.net).toBe(1930);
    expect(result.steps[0]).toMatchObject({
      start: 2000,
      end: 1930,
      amount: 70,
    });
  });
  it('compares same elapsed days across months and excludes first imported partial month', () => {
    const rows = [
      tx('first', '2026-05-05', -40),
      tx('jun', '2026-06-04', -100),
      tx('latejun', '2026-06-25', -900),
      tx('jul', '2026-07-02', -200),
      tx('aug', '2026-08-03', -300),
      tx('sep', '2026-09-03', -200),
    ];
    const result = analyzeCashflow(rows, [], '2026-09', 6, '2026-09-10');
    expect(result.baselineMonths).toBe(3);
    expect(result.baseline).toBe(200);
    expect(result.delta).toBe(0);
  });
  it('includes full historical month and handles negative remaining balance', () => {
    const result = analyzeCashflow(
      [tx('one', '2026-08-30', -100)],
      [],
      '2026-08',
      3,
      '2026-09-10'
    );
    expect(result.expenses).toBe(100);
    expect(result.net).toBe(-100);
    expect(result.elapsed).toBe(31);
    expect(result.baseline).toBeNull();
  });
  it('does not net deleted or absent counterpart links', () => {
    const result = analyzeCashflow(
      [tx('expense', '2026-09-10', -100)],
      [
        {
          id: 'l',
          sourceId: 'missing',
          targetId: 'expense',
          kind: 'refund',
          relationType: 'refund',
          amount: 30,
        },
      ],
      '2026-09',
      3,
      '2026-09-15'
    );
    expect(result.expenses).toBe(100);
  });
});
