/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import {
  getCategoryAmountDirection,
  normalizeCategoryAmount,
} from '@/lib/category-signs';
import { getSettingsSection } from '@/lib/settings-navigation';

describe('scroll reset and category sign handling', () => {
  it('keeps old settings profile links useful', () => {
    expect(
      getSettingsSection(new URLSearchParams({ tab: 'manage-profiles' }))
    ).toBe('profiles');
  });

  it('normalizes category amounts to non-negative values for display', () => {
    expect(normalizeCategoryAmount(-42.5)).toBe(42.5);
    expect(normalizeCategoryAmount(42.5)).toBe(42.5);
    expect(normalizeCategoryAmount(0)).toBe(0);
  });

  it('keeps the signed net direction separate from display magnitude', () => {
    expect(getCategoryAmountDirection(-42.5)).toBe('expense');
    expect(getCategoryAmountDirection(42.5)).toBe('income');
    expect(getCategoryAmountDirection(0)).toBe('neutral');
  });
});
