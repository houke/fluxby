import { describe, expect, it } from 'vitest';
import { DEMO_UNCATEGORIZED_EXPENSES, SEED_CATEGORIES } from '@fluxby/shared';

describe('uncategorized Jev demo expenses', () => {
  it('leaves repeatable expense examples for AI categorization', () => {
    const groups = new Map<string, number>();
    const rules = SEED_CATEGORIES.flatMap((category) =>
      category.subcategories.flatMap((subcategory) => subcategory.rules)
    );

    for (const expense of DEMO_UNCATEGORIZED_EXPENSES) {
      groups.set(expense.name, (groups.get(expense.name) ?? 0) + 1);
      expect(expense.amount).toBeLessThan(0);
      const text = `${expense.name} ${expense.description} ${expense.name}`;
      expect(rules.some((rule) => new RegExp(rule, 'i').test(text))).toBe(
        false
      );
    }

    expect([...groups.values()].every((count) => count >= 2)).toBe(true);
  });
});
