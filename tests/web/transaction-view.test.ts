import { describe, expect, it } from 'vitest';
import {
  decodeTransactionView,
  encodeTransactionView,
  findMatchingRule,
  type TransactionView,
} from '@/lib/transaction-view';
import type { Transaction } from '@fluxby/shared';
const view: TransactionView = {
  search: 'café',
  type: 'expense',
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  categories: ['cat-a'],
  ibans: ['NL123'],
  accountName: null,
  addressBookId: null,
  methods: ['pin'],
  providers: [],
  compact: true,
};
describe('saved transaction views', () => {
  it('restores the complete filter snapshot and density', () =>
    expect(decodeTransactionView(encodeTransactionView(view))).toEqual(view));
  it.each([
    { ...view, startDate: '2026-02-30' },
    { ...view, endDate: '2026-08-01' },
    { ...view, type: 'unknown' },
    { ...view, categories: 'cat-a' },
    { ...view, methods: [null] },
    { ...view, compact: 'false' },
  ])('rejects invalid filters without applying them', (value) =>
    expect(
      decodeTransactionView({ version: '1', view: JSON.stringify(value) })
    ).toBeNull()
  );
  it('rejects unknown versions and corrupt JSON', () => {
    expect(
      decodeTransactionView({ version: '2', view: JSON.stringify(view) })
    ).toBeNull();
    expect(decodeTransactionView({ version: '1', view: '{}' })).toBeNull();
    expect(decodeTransactionView({ version: '1', view: '{' })).toBeNull();
  });
});
describe('current categorization explanations', () => {
  const tx = {
    merchantName: 'Café Noord',
    description: 'Diner',
    amount: -25,
  } as Transaction;
  it('uses accent-insensitive matching with highest priority first', () => {
    const rules = [
      { id: 'a', pattern: 'cafe', categoryId: 'coffee', priority: 1 },
      { id: 'b', pattern: 'diner', categoryId: 'dining', priority: 2 },
    ];
    expect(findMatchingRule(tx, rules)?.categoryId).toBe('dining');
    expect(rules[0].id).toBe('a');
  });
  it('ignores invalid patterns and does not invent provenance', () => {
    expect(
      findMatchingRule(tx, [
        { id: 'bad', pattern: '[', categoryId: 'x', priority: 10 },
      ])
    ).toBeNull();
  });
});
