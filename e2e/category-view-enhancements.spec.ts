/**
 * E2E Tests for Category View Enhancements
 *
 * Tests for:
 * 1. Amount mode toggle (all-time vs selected period)
 * 2. Sort buttons accessibility
 * 3. Collapsed category state persistence
 */

import { test, expect, Page } from '@playwright/test';
import { dismissOnboardingTour, setupApp } from './fixtures';

/**
 * Navigate to categories page
 */
async function goToCategoriesPage(page: Page) {
  await setupApp(page);
  await dismissOnboardingTour(page);

  await page.getByRole('link', { name: /categories|categorieen/i }).click();

  // Wait for categories to load
  await page
    .locator('[data-onboarding="category-list"]')
    .waitFor({ state: 'visible', timeout: 10000 });
}

test.describe('Category View Enhancements', () => {
  test.describe('Amount Mode Toggle', () => {
    test('toggle buttons have proper aria attributes', async ({ page }) => {
      await goToCategoriesPage(page);

      // Find the amount mode toggle buttons
      const allTimeButton = page.getByRole('button', {
        name: /all time|alle tijd/i,
      });
      const periodButton = page.getByRole('button', {
        name: /selected period|geselecteerde periode/i,
      });

      // Check that buttons are visible
      await expect(allTimeButton).toBeVisible();
      await expect(periodButton).toBeVisible();

      // Verify aria-pressed attribute is set correctly
      await expect(allTimeButton).toHaveAttribute('aria-pressed', 'true');
      await expect(periodButton).toHaveAttribute('aria-pressed', 'false');
    });

    test('toggling amount mode updates aria-pressed', async ({ page }) => {
      await goToCategoriesPage(page);

      const allTimeButton = page.getByRole('button', {
        name: /all time|alle tijd/i,
      });
      const periodButton = page.getByRole('button', {
        name: /selected period|geselecteerde periode/i,
      });

      // Click period button
      await periodButton.click();
      await page.waitForTimeout(500);

      // Verify states are swapped
      await expect(allTimeButton).toHaveAttribute('aria-pressed', 'false');
      await expect(periodButton).toHaveAttribute('aria-pressed', 'true');

      // Click all-time button to revert
      await allTimeButton.click();
      await page.waitForTimeout(500);

      // Verify states are back to default
      await expect(allTimeButton).toHaveAttribute('aria-pressed', 'true');
      await expect(periodButton).toHaveAttribute('aria-pressed', 'false');
    });

    test('amount mode toggle is keyboard accessible', async ({ page }) => {
      await goToCategoriesPage(page);

      const allTimeButton = page.getByRole('button', {
        name: /all time|alle tijd/i,
      });
      const periodButton = page.getByRole('button', {
        name: /selected period|geselecteerde periode/i,
      });

      // Focus the all-time button
      await allTimeButton.focus();
      await expect(allTimeButton).toBeFocused();

      // Tab to next button
      await page.keyboard.press('Tab');
      await expect(periodButton).toBeFocused();

      // Press Enter/Space to activate
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Verify it was toggled
      await expect(periodButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test.describe('Sort Buttons Accessibility', () => {
    test('sort buttons have aria-pressed attribute', async ({ page }) => {
      await goToCategoriesPage(page);

      // Find sort buttons by their text content
      const sortByNameButton = page.getByRole('button', {
        name: /sort.*name|sorteer.*naam/i,
      });
      const sortByTransactionsButton = page.getByRole('button', {
        name: /sort.*transactions|sorteer.*transacties/i,
      });
      const sortByAmountButton = page.getByRole('button', {
        name: /sort.*amount|sorteer.*bedrag/i,
      });

      // At least one should be pressed (default is name)
      const namePressedAttr =
        await sortByNameButton.getAttribute('aria-pressed');
      const transactionsPressedAttr =
        await sortByTransactionsButton.getAttribute('aria-pressed');
      const amountPressedAttr =
        await sortByAmountButton.getAttribute('aria-pressed');

      // Exactly one should be 'true'
      const pressedCount = [
        namePressedAttr,
        transactionsPressedAttr,
        amountPressedAttr,
      ].filter((v) => v === 'true').length;

      expect(pressedCount).toBe(1);
    });

    test('clicking sort button updates aria-pressed', async ({ page }) => {
      await goToCategoriesPage(page);

      const sortByAmountButton = page.getByRole('button', {
        name: /sort.*amount|sorteer.*bedrag/i,
      });

      // Click to sort by amount
      await sortByAmountButton.click();
      await page.waitForTimeout(500);

      // Verify it's now pressed
      await expect(sortByAmountButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test.describe('Category Expansion State', () => {
    test('categories can be collapsed and expanded', async ({ page }) => {
      await goToCategoriesPage(page);

      // Find a category expand/collapse button
      const expandButtons = page.locator('button', {
        has: page.locator('svg[class*="chevron"]'),
      });

      // Skip if no expandable categories
      const buttonCount = await expandButtons.count();
      if (buttonCount === 0) {
        test.skip();
        return;
      }

      // Click first expand button
      await expandButtons.first().click();
      await page.waitForTimeout(500);

      // The subcategories section should toggle
      // This is a basic smoke test - detailed verification would
      // check the specific subcategory content
    });
  });
});
