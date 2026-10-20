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
  it('separates fixed, variable and savings expenses while adding integer cents', () => {
    const result = analyzeCashflow(
      [
        tx('salary', '2026-09-01', 10),
        tx('rent', '2026-09-01', -2, 'rent'),
        tx('food1', '2026-09-01', -0.1),
        tx('food2', '2026-09-02', -0.2),
        tx('saving', '2026-09-02', -1, 'savings'),
        {
          ...tx('internal', '2026-09-02', -5, 'savings'),
          type: 'transfer' as const,
        },
      ],
      [],
      '2026-09',
      3,
      '2026-09-15',
      [
        { category_id: 'rent', is_fixed: 1, allocation_group: 'needs' },
        { category_id: 'savings', is_fixed: 1, allocation_group: 'savings' },
      ]
    );
    expect(result).toMatchObject({
      income: 10,
      fixedExpenses: 2,
      variableExpenses: 0.3,
      savingsExpenses: 1,
      expenses: 3.3,
      net: 6.7,
    });
  });
  it('excludes missing baseline months while retaining months with actual zero spending', () => {
    const result = analyzeCashflow(
      [
        tx('first', '2026-05-01', -20),
        tx('jun', '2026-06-01', -90),
        tx('aug-income', '2026-08-01', 1000),
        tx('sep', '2026-09-01', -30),
      ],
      [],
      '2026-09',
      3,
      '2026-09-15'
    );
    expect(result.baselineMonths).toBe(2);
    expect(result.baseline).toBe(45);
  });
  it('inherits fixed-cost categorization from the parent category like forecasting', () => {
    const result = analyzeCashflow(
      [
        {
          ...tx('child-rent', '2026-09-01', -120, 'housing-rent'),
          parentCategoryId: 'housing',
        },
      ],
      [],
      '2026-09',
      3,
      '2026-09-15',
      [
        { category_id: 'housing', is_fixed: 1, allocation_group: 'needs' },
        { category_id: 'housing-rent', is_fixed: 0, allocation_group: 'needs' },
      ]
    );
    expect(result.fixedExpenses).toBe(120);
    expect(result.variableExpenses).toBe(0);
  });
});
