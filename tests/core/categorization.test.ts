import { describe, it, expect } from 'vitest';
import {
  applyCategoryRules,
  suggestCategory,
  defaultCategoryPatterns,
} from '@fluxby/core';
import type { TransactionCreate, CategoryRule } from '@fluxby/shared';

describe('applyCategoryRules', () => {
  const createTransaction = (
    overrides: Partial<TransactionCreate> = {}
  ): TransactionCreate => ({
    date: '2024-01-01',
    amount: -50,
    type: 'expense',
    description: 'Test transaction',
    merchantName: null,
    accountId: 'account-123',
    opposingAccountIban: null,
    opposingAccountName: null,
    balanceAfter: null,
    rawData: null,
    importHash: 'hash123',
    ...overrides,
  });

  const createRule = (
    pattern: string,
    categoryId: string,
    priority: number = 10
  ): CategoryRule => ({
    id: `rule-${pattern}`,
    pattern,
    categoryId,
    priority,
    profileId: 'profile-123',
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
    deviceId: 'device-123',
    matchType: 'contains',
  });

  describe('rule matching', () => {
    it('matches transaction by description', () => {
      const transactions = [createTransaction({ description: 'Albert Heijn' })];
      const rules = [createRule('albert heijn', 'groceries-cat')];

      const result = applyCategoryRules(transactions, rules);
      expect(result[0].categoryId).toBe('groceries-cat');
    });

    it('matches transaction by merchantName', () => {
      const transactions = [createTransaction({ merchantName: 'IKEA' })];
      const rules = [createRule('ikea', 'furniture-cat')];

      const result = applyCategoryRules(transactions, rules);
      expect(result[0].categoryId).toBe('furniture-cat');
    });

    it('matches case-insensitively', () => {
      const transactions = [createTransaction({ description: 'ALBERT HEIJN' })];
      const rules = [createRule('albert heijn', 'groceries-cat')];

      const result = applyCategoryRules(transactions, rules);
      expect(result[0].categoryId).toBe('groceries-cat');
    });

    it('matches accented characters (accent-insensitive)', () => {
      const transactions = [createTransaction({ description: 'Café Zürich' })];
      const rules = [createRule('cafe zurich', 'dining-cat')];

      const result = applyCategoryRules(transactions, rules);
      expect(result[0].categoryId).toBe('dining-cat');
    });

    it('combines merchantName and description for matching', () => {
      const transactions = [
        createTransaction({
          merchantName: 'Unknown',
          description: 'Betaling Albert Heijn',
        }),
      ];
      const rules = [createRule('albert heijn', 'groceries-cat')];

      const result = applyCategoryRules(transactions, rules);
      expect(result[0].categoryId).toBe('groceries-cat');
    });
  });

  describe('priority handling', () => {
    it('applies highest priority rule first', () => {
      const transactions = [createTransaction({ description: 'Albert Heijn' })];
      const rules = [
        createRule('albert', 'general-cat', 5),
        createRule('albert heijn', 'groceries-cat', 10),
      ];

      const result = applyCategoryRules(transactions, rules);
      expect(result[0].categoryId).toBe('groceries-cat');
    });

    it('stops at first match', () => {
      const transactions = [createTransaction({ description: 'Albert Heijn' })];
      const rules = [
        createRule('albert heijn', 'groceries-cat', 10),
        createRule('heijn', 'other-cat', 5),
      ];

      const result = applyCategoryRules(transactions, rules);
      expect(result[0].categoryId).toBe('groceries-cat');
    });
  });

  describe('skip already categorized', () => {
    it('does not override existing categoryId', () => {
      const transactions = [
        createTransaction({
          description: 'Albert Heijn',
          categoryId: 'existing-cat',
        }),
      ];
      const rules = [createRule('albert heijn', 'groceries-cat')];

      const result = applyCategoryRules(transactions, rules);
      expect(result[0].categoryId).toBe('existing-cat');
    });
  });

  describe('no match', () => {
    it('leaves categoryId undefined when no rule matches', () => {
      const transactions = [
        createTransaction({ description: 'Unknown Store' }),
      ];
      const rules = [createRule('albert heijn', 'groceries-cat')];

      const result = applyCategoryRules(transactions, rules);
      expect(result[0].categoryId).toBeUndefined();
    });
  });

  describe('multiple transactions', () => {
    it('processes all transactions', () => {
      const transactions = [
        createTransaction({ description: 'Albert Heijn' }),
        createTransaction({ description: 'Shell' }),
        createTransaction({ description: 'Unknown' }),
      ];
      const rules = [
        createRule('albert heijn', 'groceries-cat'),
        createRule('shell', 'transport-cat'),
      ];

      const result = applyCategoryRules(transactions, rules);
      expect(result[0].categoryId).toBe('groceries-cat');
      expect(result[1].categoryId).toBe('transport-cat');
      expect(result[2].categoryId).toBeUndefined();
    });
  });
});

describe('suggestCategory', () => {
  const createPartialTransaction = (
    overrides: Partial<TransactionCreate> = {}
  ): Partial<TransactionCreate> => ({
    description: 'Test transaction',
    merchantName: null,
    ...overrides,
  });

  const createRule = (
    pattern: string,
    categoryId: string,
    priority: number = 10
  ): CategoryRule => ({
    id: `rule-${pattern}`,
    pattern,
    categoryId,
    priority,
    profileId: 'profile-123',
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
    deviceId: 'device-123',
    matchType: 'contains',
  });

  describe('custom rules', () => {
    it('returns categoryId from matching custom rule', () => {
      const transaction = createPartialTransaction({
        description: 'Albert Heijn',
      });
      const rules = [createRule('albert heijn', 'custom-groceries')];

      const result = suggestCategory(transaction, rules);
      expect(result).toBe('custom-groceries');
    });

    it('prioritizes custom rules over default patterns', () => {
      const transaction = createPartialTransaction({
        description: 'Albert Heijn',
      });
      const rules = [createRule('albert heijn', 'custom-groceries')];

      const result = suggestCategory(transaction, rules);
      expect(result).toBe('custom-groceries');
    });

    it('respects rule priority order', () => {
      const transaction = createPartialTransaction({
        description: 'Albert Heijn',
      });
      const rules = [
        createRule('albert', 'general', 5),
        createRule('albert heijn', 'specific', 10),
      ];

      const result = suggestCategory(transaction, rules);
      expect(result).toBe('specific');
    });
  });

  describe('default patterns', () => {
    it('matches Dutch groceries merchants', () => {
      const merchants = ['albert heijn', 'jumbo', 'lidl', 'aldi'];

      for (const merchant of merchants) {
        const transaction = createPartialTransaction({
          description: merchant,
        });
        const result = suggestCategory(transaction, []);
        expect(result).toBe('00000000-0000-0000-0000-000000000001');
      }
    });

    it('matches dining merchants', () => {
      const merchants = ['mcdonalds', 'starbucks', 'thuisbezorgd'];

      for (const merchant of merchants) {
        const transaction = createPartialTransaction({
          description: merchant,
        });
        const result = suggestCategory(transaction, []);
        expect(result).not.toBeNull();
      }
    });

    it('matches transport merchants', () => {
      const merchants = ['ns-', 'shell', 'parking'];

      for (const merchant of merchants) {
        const transaction = createPartialTransaction({
          description: merchant,
        });
        const result = suggestCategory(transaction, []);
        expect(result).toBe('00000000-0000-0000-0000-000000000003');
      }
    });
  });

  describe('no match', () => {
    it('returns null when no pattern matches', () => {
      const transaction = createPartialTransaction({
        description: 'XYZ Unknown Store 12345',
      });
      const result = suggestCategory(transaction, []);
      expect(result).toBeNull();
    });

    it('returns null for empty description', () => {
      const transaction = createPartialTransaction({
        description: '',
        merchantName: null,
      });
      const result = suggestCategory(transaction, []);
      expect(result).toBeNull();
    });
  });

  describe('accent handling', () => {
    it('matches accented text to non-accented pattern', () => {
      const transaction = createPartialTransaction({
        description: 'Café Restaurant',
      });
      // If 'cafe' is in the default patterns
      const rules = [createRule('cafe', 'dining-cat')];
      const result = suggestCategory(transaction, rules);
      expect(result).toBe('dining-cat');
    });
  });
});

describe('defaultCategoryPatterns', () => {
  it('contains grocery patterns', () => {
    const groceryPattern = defaultCategoryPatterns.find(
      (p) => p.categoryId === '00000000-0000-0000-0000-000000000001'
    );
    expect(groceryPattern).toBeDefined();
    expect(groceryPattern?.pattern).toContain('albert heijn');
  });

  it('contains transport patterns', () => {
    const transportPattern = defaultCategoryPatterns.find(
      (p) => p.categoryId === '00000000-0000-0000-0000-000000000003'
    );
    expect(transportPattern).toBeDefined();
    expect(transportPattern?.pattern).toContain('shell');
  });

  it('contains entertainment patterns', () => {
    const entertainmentPattern = defaultCategoryPatterns.find(
      (p) => p.categoryId === '00000000-0000-0000-0000-000000000005'
    );
    expect(entertainmentPattern).toBeDefined();
    expect(entertainmentPattern?.pattern).toContain('netflix');
  });

  it('contains salary patterns', () => {
    const salaryPattern = defaultCategoryPatterns.find(
      (p) => p.categoryId === '00000000-0000-0000-0000-000000000009'
    );
    expect(salaryPattern).toBeDefined();
    expect(salaryPattern?.pattern).toContain('salaris');
  });

  it('has unique category IDs', () => {
    const categoryIds = defaultCategoryPatterns.map((p) => p.categoryId);
    const uniqueIds = new Set(categoryIds);
    expect(uniqueIds.size).toBe(categoryIds.length);
  });
});
