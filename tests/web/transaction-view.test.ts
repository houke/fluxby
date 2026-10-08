import { describe, expect, it } from 'vitest';
import { findMatchingRule } from '@/lib/transaction-view';
import type { Transaction } from '@fluxby/shared';
describe('category rule matching', () => {
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
  it('ignores invalid patterns', () => {
    expect(
      findMatchingRule(tx, [
        { id: 'bad', pattern: '[', categoryId: 'x', priority: 10 },
      ])
    ).toBeNull();
  });
});
