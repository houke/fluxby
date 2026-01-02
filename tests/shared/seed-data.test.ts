import { describe, it, expect } from 'vitest';
import {
  getText,
  getCategoriesForLanguage,
  SEED_CATEGORIES,
  type BilingualText,
} from '@fluxby/shared';

describe('getText', () => {
  it('returns Dutch text when language is nl', () => {
    const text: BilingualText = { nl: 'Hallo', en: 'Hello' };
    expect(getText(text, 'nl')).toBe('Hallo');
  });

  it('returns English text when language is en', () => {
    const text: BilingualText = { nl: 'Hallo', en: 'Hello' };
    expect(getText(text, 'en')).toBe('Hello');
  });

  it('returns string as-is for non-bilingual text', () => {
    const text = 'Simple string';
    expect(getText(text, 'nl')).toBe('Simple string');
    expect(getText(text, 'en')).toBe('Simple string');
  });

  it('falls back to Dutch if English is missing', () => {
    const text = { nl: 'Alleen Nederlands' } as BilingualText;
    expect(getText(text, 'en')).toBe('Alleen Nederlands');
  });
});

describe('getCategoriesForLanguage', () => {
  it('returns categories with Dutch text for nl language', () => {
    const result = getCategoriesForLanguage(SEED_CATEGORIES, 'nl');

    expect(result.length).toBeGreaterThan(0);
    // First category should be in Dutch
    const firstCategory = result[0];
    expect(firstCategory.name).toBeDefined();
    expect(typeof firstCategory.name).toBe('string');
  });

  it('returns categories with English text for en language', () => {
    const result = getCategoriesForLanguage(SEED_CATEGORIES, 'en');

    expect(result.length).toBeGreaterThan(0);
    const firstCategory = result[0];
    expect(firstCategory.name).toBeDefined();
    expect(typeof firstCategory.name).toBe('string');
  });

  it('preserves category structure', () => {
    const result = getCategoriesForLanguage(SEED_CATEGORIES, 'nl');

    result.forEach((category) => {
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('icon');
      expect(category).toHaveProperty('color');
      expect(category).toHaveProperty('description');
      expect(category).toHaveProperty('subcategories');
      expect(Array.isArray(category.subcategories)).toBe(true);
    });
  });

  it('preserves subcategory structure', () => {
    const result = getCategoriesForLanguage(SEED_CATEGORIES, 'nl');
    const categoryWithSubs = result.find((c) => c.subcategories.length > 0);

    expect(categoryWithSubs).toBeDefined();
    categoryWithSubs?.subcategories.forEach((sub) => {
      expect(sub).toHaveProperty('name');
      expect(sub).toHaveProperty('icon');
      expect(sub).toHaveProperty('description');
      expect(sub).toHaveProperty('rules');
      expect(Array.isArray(sub.rules)).toBe(true);
    });
  });

  it('translates both categories and subcategories', () => {
    const nlResult = getCategoriesForLanguage(SEED_CATEGORIES, 'nl');
    const enResult = getCategoriesForLanguage(SEED_CATEGORIES, 'en');

    // Find a bilingual category
    const bilingualCategory = SEED_CATEGORIES.find(
      (c) => typeof c.name === 'object'
    );
    if (bilingualCategory) {
      const nlCat = nlResult.find((c) =>
        c.name.includes(
          getText((bilingualCategory.name as BilingualText).nl, 'nl')
        )
      );
      const enCat = enResult.find((c) =>
        c.name.includes(
          getText((bilingualCategory.name as BilingualText).en, 'en')
        )
      );

      expect(nlCat).toBeDefined();
      expect(enCat).toBeDefined();
    }
  });
});

describe('SEED_CATEGORIES', () => {
  it('is an array', () => {
    expect(Array.isArray(SEED_CATEGORIES)).toBe(true);
  });

  it('has multiple categories', () => {
    expect(SEED_CATEGORIES.length).toBeGreaterThan(5);
  });

  it('each category has required fields', () => {
    SEED_CATEGORIES.forEach((category) => {
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('icon');
      expect(category).toHaveProperty('color');
      expect(category).toHaveProperty('description');
      expect(category).toHaveProperty('subcategories');
    });
  });

  it('categories have valid colors (hex format)', () => {
    SEED_CATEGORIES.forEach((category) => {
      expect(category.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('categories have emoji icons', () => {
    SEED_CATEGORIES.forEach((category) => {
      // Basic check that icon is not empty
      expect(category.icon.length).toBeGreaterThan(0);
    });
  });

  it('subcategories have rules for auto-categorization', () => {
    const allSubcategories = SEED_CATEGORIES.flatMap((c) => c.subcategories);
    const subsWithRules = allSubcategories.filter((s) => s.rules.length > 0);

    // Most subcategories should have rules
    expect(subsWithRules.length).toBeGreaterThan(allSubcategories.length * 0.5);
  });

  describe('common categories', () => {
    it('includes housing category', () => {
      const housing = getCategoriesForLanguage(SEED_CATEGORIES, 'en').find(
        (c) =>
          c.name.toLowerCase().includes('housing') ||
          c.name.toLowerCase().includes('living')
      );
      expect(housing).toBeDefined();
    });

    it('includes groceries category', () => {
      const groceries = getCategoriesForLanguage(SEED_CATEGORIES, 'en').find(
        (c) =>
          c.name.toLowerCase().includes('groceries') ||
          c.name.toLowerCase().includes('food')
      );
      expect(groceries).toBeDefined();
    });

    it('includes transport category', () => {
      const transport = getCategoriesForLanguage(SEED_CATEGORIES, 'en').find(
        (c) =>
          c.name.toLowerCase().includes('transport') ||
          c.name.toLowerCase().includes('travel')
      );
      expect(transport).toBeDefined();
    });

    it('includes income category', () => {
      const income = getCategoriesForLanguage(SEED_CATEGORIES, 'en').find((c) =>
        c.name.toLowerCase().includes('income')
      );
      expect(income).toBeDefined();
    });
  });

  describe('Dutch merchant rules', () => {
    it('includes Dutch supermarkets', () => {
      const allRules = SEED_CATEGORIES.flatMap((c) =>
        c.subcategories.flatMap((s) => s.rules)
      );
      const rulesLower = allRules.map((r) => r.toLowerCase());

      expect(rulesLower.some((r) => r.includes('albert heijn'))).toBe(true);
      expect(rulesLower.some((r) => r.includes('jumbo'))).toBe(true);
    });

    it('includes Dutch banks', () => {
      const allRules = SEED_CATEGORIES.flatMap((c) =>
        c.subcategories.flatMap((s) => s.rules)
      );
      const rulesLower = allRules.map((r) => r.toLowerCase());

      expect(
        rulesLower.some(
          (r) =>
            r.includes('abn') || r.includes('rabobank') || r.includes('ing')
        )
      ).toBe(true);
    });

    it('includes Dutch utility providers', () => {
      const allRules = SEED_CATEGORIES.flatMap((c) =>
        c.subcategories.flatMap((s) => s.rules)
      );
      const rulesLower = allRules.map((r) => r.toLowerCase());

      expect(
        rulesLower.some(
          (r) =>
            r.includes('eneco') ||
            r.includes('vattenfall') ||
            r.includes('essent')
        )
      ).toBe(true);
    });
  });
});
