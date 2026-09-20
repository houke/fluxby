/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import {
  getCategoryAmountDirection,
  normalizeCategoryAmount,
} from '@/lib/category-signs';
import { createSettingsTabHandler } from '@/lib/settings-tabs';

describe('scroll reset and category sign handling', () => {
  it('resets scroll when a settings tab changes', () => {
    const scrollToMock = vi
      .spyOn(window, 'scrollTo')
      .mockImplementation(() => undefined);
    const setSearchParams = vi.fn();

    const handleTabChange = createSettingsTabHandler(setSearchParams);
    handleTabChange('manage-profiles');

    expect(setSearchParams).toHaveBeenCalledWith(
      { tab: 'manage-profiles' },
      { replace: true }
    );
    expect(scrollToMock).toHaveBeenCalledWith({ top: 0 });
    scrollToMock.mockRestore();
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
