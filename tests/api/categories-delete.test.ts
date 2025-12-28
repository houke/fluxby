import { describe, it, expect } from 'vitest';

/**
 * Test suite for category deletion logic
 *
 * Tests verify the following behaviors:
 *
 * 1. DELETE SUBCATEGORY:
 *    - Subcategory is deleted
 *    - Transactions with that subcategory have category_id set to NULL
 *    - Category rules for that subcategory are deleted
 *
 * 2. DELETE PARENT CATEGORY:
 *    - Parent category is deleted
 *    - All subcategories are also deleted (cascade)
 *    - Transactions with parent or any subcategory have category_id set to NULL
 *    - Category rules for parent and all subcategories are deleted
 *
 * 3. CATEGORY REMOVAL FROM TRANSACTIONS:
 *    - When a category is deleted, transactions should have category_id = NULL
 *    - This applies to both direct deletions and cascade deletions
 */

// ============================================
// SIMULATED DELETE LOGIC
// ============================================

interface Category {
  id: number;
  name: string;
  parentId: number | null;
}

interface Transaction {
  id: number;
  categoryId: number | null;
}

interface CategoryRule {
  id: number;
  categoryId: number;
  pattern: string;
}

/**
 * Simulates the backend delete category logic
 * This mirrors the actual implementation in apps/api/src/routes/categories.ts
 */
function simulateDeleteCategory(
  categoryId: number,
  categories: Category[],
  transactions: Transaction[],
  categoryRules: CategoryRule[]
): {
  deletedCategories: number[];
  updatedTransactions: Transaction[];
  deletedRules: number[];
} {
  const deletedCategories: number[] = [];
  const deletedRules: number[] = [];

  // Find all subcategories (children of this category)
  const subcategoryIds = categories
    .filter((c) => c.parentId === categoryId)
    .map((c) => c.id);

  // All categories to delete (parent + subcategories)
  const allCategoryIds = [categoryId, ...subcategoryIds];

  // Update transactions: set category_id to NULL for all affected categories
  const updatedTransactions = transactions.map((tx) => {
    if (tx.categoryId !== null && allCategoryIds.includes(tx.categoryId)) {
      return { ...tx, categoryId: null };
    }
    return { ...tx };
  });

  // Delete category rules for all affected categories
  for (const rule of categoryRules) {
    if (allCategoryIds.includes(rule.categoryId)) {
      deletedRules.push(rule.id);
    }
  }

  // Mark categories as deleted
  deletedCategories.push(...allCategoryIds);

  return {
    deletedCategories,
    updatedTransactions,
    deletedRules,
  };
}

// ============================================
// TESTS
// ============================================

describe('Category Deletion Logic', () => {
  describe('Delete subcategory', () => {
    it('should delete only the subcategory', () => {
      const categories: Category[] = [
        { id: 1, name: 'Parent', parentId: null },
        { id: 2, name: 'Subcategory 1', parentId: 1 },
        { id: 3, name: 'Subcategory 2', parentId: 1 },
      ];
      const transactions: Transaction[] = [
        { id: 1, categoryId: 2 },
        { id: 2, categoryId: 3 },
        { id: 3, categoryId: 1 },
      ];
      const rules: CategoryRule[] = [
        { id: 1, categoryId: 2, pattern: 'test' },
        { id: 2, categoryId: 3, pattern: 'test2' },
      ];

      const result = simulateDeleteCategory(2, categories, transactions, rules);

      // Only subcategory 2 should be deleted
      expect(result.deletedCategories).toEqual([2]);
      // Only transaction 1 should be updated (it had categoryId: 2)
      expect(result.updatedTransactions[0].categoryId).toBeNull();
      expect(result.updatedTransactions[1].categoryId).toBe(3);
      expect(result.updatedTransactions[2].categoryId).toBe(1);
      // Only rule for category 2 should be deleted
      expect(result.deletedRules).toEqual([1]);
    });

    it('should set transaction category_id to NULL', () => {
      const categories: Category[] = [
        { id: 1, name: 'Parent', parentId: null },
        { id: 2, name: 'Groceries', parentId: 1 },
      ];
      const transactions: Transaction[] = [
        { id: 1, categoryId: 2 },
        { id: 2, categoryId: 2 },
        { id: 3, categoryId: null },
      ];
      const rules: CategoryRule[] = [];

      const result = simulateDeleteCategory(2, categories, transactions, rules);

      // All transactions with categoryId 2 should be NULL
      expect(result.updatedTransactions[0].categoryId).toBeNull();
      expect(result.updatedTransactions[1].categoryId).toBeNull();
      expect(result.updatedTransactions[2].categoryId).toBeNull();
    });

    it('should delete category rules for the subcategory', () => {
      const categories: Category[] = [
        { id: 1, name: 'Parent', parentId: null },
        { id: 2, name: 'Groceries', parentId: 1 },
      ];
      const transactions: Transaction[] = [];
      const rules: CategoryRule[] = [
        { id: 1, categoryId: 2, pattern: 'albert heijn' },
        { id: 2, categoryId: 2, pattern: 'jumbo' },
        { id: 3, categoryId: 1, pattern: 'other' },
      ];

      const result = simulateDeleteCategory(2, categories, transactions, rules);

      // Rules 1 and 2 should be deleted (they belong to category 2)
      expect(result.deletedRules).toEqual([1, 2]);
    });
  });

  describe('Delete parent category (cascades to subcategories)', () => {
    it('should delete parent and all subcategories', () => {
      const categories: Category[] = [
        { id: 1, name: 'Food', parentId: null },
        { id: 2, name: 'Groceries', parentId: 1 },
        { id: 3, name: 'Restaurants', parentId: 1 },
        { id: 4, name: 'Takeout', parentId: 1 },
        { id: 5, name: 'Transport', parentId: null },
      ];
      const transactions: Transaction[] = [];
      const rules: CategoryRule[] = [];

      const result = simulateDeleteCategory(1, categories, transactions, rules);

      // Parent (1) and all subcategories (2, 3, 4) should be deleted
      expect(result.deletedCategories.sort()).toEqual([1, 2, 3, 4]);
      // Transport (5) should NOT be deleted
      expect(result.deletedCategories).not.toContain(5);
    });

    it('should set all transactions with parent or subcategory to NULL', () => {
      const categories: Category[] = [
        { id: 1, name: 'Food', parentId: null },
        { id: 2, name: 'Groceries', parentId: 1 },
        { id: 3, name: 'Restaurants', parentId: 1 },
        { id: 4, name: 'Transport', parentId: null },
      ];
      const transactions: Transaction[] = [
        { id: 1, categoryId: 1 }, // Parent category
        { id: 2, categoryId: 2 }, // Subcategory
        { id: 3, categoryId: 3 }, // Another subcategory
        { id: 4, categoryId: 4 }, // Different parent - should NOT change
        { id: 5, categoryId: null }, // Already null
      ];
      const rules: CategoryRule[] = [];

      const result = simulateDeleteCategory(1, categories, transactions, rules);

      // Transactions 1, 2, 3 should be NULL (Food and its subcategories)
      expect(result.updatedTransactions[0].categoryId).toBeNull();
      expect(result.updatedTransactions[1].categoryId).toBeNull();
      expect(result.updatedTransactions[2].categoryId).toBeNull();
      // Transaction 4 should still have categoryId 4 (Transport)
      expect(result.updatedTransactions[3].categoryId).toBe(4);
      // Transaction 5 was already null
      expect(result.updatedTransactions[4].categoryId).toBeNull();
    });

    it('should delete rules for parent and all subcategories', () => {
      const categories: Category[] = [
        { id: 1, name: 'Food', parentId: null },
        { id: 2, name: 'Groceries', parentId: 1 },
        { id: 3, name: 'Restaurants', parentId: 1 },
        { id: 4, name: 'Transport', parentId: null },
      ];
      const transactions: Transaction[] = [];
      const rules: CategoryRule[] = [
        { id: 1, categoryId: 1, pattern: 'food' },
        { id: 2, categoryId: 2, pattern: 'albert heijn' },
        { id: 3, categoryId: 2, pattern: 'jumbo' },
        { id: 4, categoryId: 3, pattern: 'restaurant' },
        { id: 5, categoryId: 4, pattern: 'ns' }, // Should NOT be deleted
      ];

      const result = simulateDeleteCategory(1, categories, transactions, rules);

      // Rules 1, 2, 3, 4 should be deleted
      expect(result.deletedRules.sort()).toEqual([1, 2, 3, 4]);
      // Rule 5 should NOT be deleted
      expect(result.deletedRules).not.toContain(5);
    });
  });

  describe('Edge cases', () => {
    it('should handle parent with no subcategories', () => {
      const categories: Category[] = [
        { id: 1, name: 'Standalone', parentId: null },
      ];
      const transactions: Transaction[] = [{ id: 1, categoryId: 1 }];
      const rules: CategoryRule[] = [{ id: 1, categoryId: 1, pattern: 'test' }];

      const result = simulateDeleteCategory(1, categories, transactions, rules);

      expect(result.deletedCategories).toEqual([1]);
      expect(result.updatedTransactions[0].categoryId).toBeNull();
      expect(result.deletedRules).toEqual([1]);
    });

    it('should handle category with no transactions', () => {
      const categories: Category[] = [
        { id: 1, name: 'Empty', parentId: null },
        { id: 2, name: 'Subcategory', parentId: 1 },
      ];
      const transactions: Transaction[] = [];
      const rules: CategoryRule[] = [];

      const result = simulateDeleteCategory(1, categories, transactions, rules);

      expect(result.deletedCategories.sort()).toEqual([1, 2]);
      expect(result.updatedTransactions).toEqual([]);
      expect(result.deletedRules).toEqual([]);
    });

    it('should handle category with no rules', () => {
      const categories: Category[] = [
        { id: 1, name: 'NoRules', parentId: null },
      ];
      const transactions: Transaction[] = [{ id: 1, categoryId: 1 }];
      const rules: CategoryRule[] = [];

      const result = simulateDeleteCategory(1, categories, transactions, rules);

      expect(result.deletedCategories).toEqual([1]);
      expect(result.deletedRules).toEqual([]);
    });

    it('should not affect unrelated categories', () => {
      const categories: Category[] = [
        { id: 1, name: 'Category A', parentId: null },
        { id: 2, name: 'Sub A1', parentId: 1 },
        { id: 3, name: 'Category B', parentId: null },
        { id: 4, name: 'Sub B1', parentId: 3 },
      ];
      const transactions: Transaction[] = [
        { id: 1, categoryId: 1 },
        { id: 2, categoryId: 2 },
        { id: 3, categoryId: 3 },
        { id: 4, categoryId: 4 },
      ];
      const rules: CategoryRule[] = [
        { id: 1, categoryId: 1, pattern: 'a' },
        { id: 2, categoryId: 3, pattern: 'b' },
      ];

      // Delete Category A (id: 1)
      const result = simulateDeleteCategory(1, categories, transactions, rules);

      // Only category A and its subcategory should be deleted
      expect(result.deletedCategories.sort()).toEqual([1, 2]);
      // Category B transactions should be unchanged
      expect(result.updatedTransactions[2].categoryId).toBe(3);
      expect(result.updatedTransactions[3].categoryId).toBe(4);
      // Only rule for category A should be deleted
      expect(result.deletedRules).toEqual([1]);
    });
  });
});
