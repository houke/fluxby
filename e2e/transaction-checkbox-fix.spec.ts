/**
 * E2E Tests for Transaction Checkbox Fix
 *
 * Verification tests for the checkbox event propagation fix.
 * Root Cause: Parent row's onClick was intercepting checkbox clicks after
 * first click (when isSelecting=true), calling stopPropagation before
 * checkbox onChange could fire.
 *
 * Fix: Added onClick={(e) => e.stopPropagation()} to checkbox wrapper div
 * to prevent event bubbling to parent.
 *
 * Test Scenarios:
 * 1. Multiple checkbox clicks (without shift) - should work
 * 2. Unchecking checkboxes - should work
 * 3. Shift-range selection - should still work
 * 4. Row expansion (recurring transactions) - should work independently
 */

import { test, expect, Page } from '@playwright/test';
import { goToTransactionsPage } from './fixtures';

const LOCATORS = {
  transactionRow: '[data-onboarding="transaction-row"]',
  transactionCheckbox: '[data-testid="transaction-checkbox"]',
  selectionToolbar: '[role="toolbar"]',
};

class CheckboxTestPage {
  constructor(private page: Page) {}

  async goto() {
    await goToTransactionsPage(this.page);
    await this.waitForTransactionList();
  }

  async waitForTransactionList() {
    // Wait for transaction rows to be visible
    await this.page.waitForSelector(LOCATORS.transactionRow, {
      timeout: 10000,
    });

    // Hover over first row to make checkbox visible (desktop view)
    const firstRow = this.page.locator(LOCATORS.transactionRow).first();
    await firstRow.hover();
    await this.page.waitForTimeout(300);

    // Check if we have transactions
    const checkboxCount = await this.page
      .locator(LOCATORS.transactionCheckbox)
      .count();
    if (checkboxCount === 0) {
      throw new Error(
        'No transactions found - app needs demo data for E2E tests'
      );
    }
  }

  async getCheckbox(index: number) {
    return this.page.locator(LOCATORS.transactionCheckbox).nth(index);
  }

  async clickCheckbox(index: number, modifiers: string[] = []) {
    const checkbox = await this.getCheckbox(index);
    // Click the checkbox input - the wrapper now has stopPropagation
    // to prevent the click from bubbling to the row
    await checkbox.click({ force: true, modifiers });
  }

  async isCheckboxChecked(index: number): Promise<boolean> {
    const checkbox = await this.getCheckbox(index);
    // Check the actual checked property of the input
    return await checkbox.isChecked();
  }

  async isSelectionModeActive(): Promise<boolean> {
    const toolbar = this.page.locator(LOCATORS.selectionToolbar);
    return toolbar.isVisible({ timeout: 1000 }).catch(() => false);
  }

  async getSelectedCount(): Promise<number> {
    const toolbar = this.page.locator(LOCATORS.selectionToolbar);
    if (!(await toolbar.isVisible({ timeout: 1000 }).catch(() => false))) {
      return 0;
    }
    const text = await toolbar.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async hoverRow(index: number) {
    const row = this.page.locator(LOCATORS.transactionRow).nth(index);
    await row.hover();
    await this.page.waitForTimeout(100);
  }
}

test.describe('Transaction Checkbox Fix Verification', () => {
  let checkboxPage: CheckboxTestPage;

  test.beforeEach(async ({ page }) => {
    checkboxPage = new CheckboxTestPage(page);
    await checkboxPage.goto();
  });

  test('Scenario 1: Multiple checkbox clicks work (without shift)', async () => {
    // Click first checkbox
    await checkboxPage.clickCheckbox(0);

    // Verify first is checked
    expect(await checkboxPage.isCheckboxChecked(0)).toBe(true);
    expect(await checkboxPage.isSelectionModeActive()).toBe(true);

    // Click second checkbox (this was failing before the fix)
    await checkboxPage.hoverRow(1);
    await checkboxPage.clickCheckbox(1);

    // Verify both are checked
    expect(await checkboxPage.isCheckboxChecked(0)).toBe(true);
    expect(await checkboxPage.isCheckboxChecked(1)).toBe(true);

    // Click third checkbox
    await checkboxPage.hoverRow(2);
    await checkboxPage.clickCheckbox(2);

    // Verify all three are checked
    expect(await checkboxPage.isCheckboxChecked(0)).toBe(true);
    expect(await checkboxPage.isCheckboxChecked(1)).toBe(true);
    expect(await checkboxPage.isCheckboxChecked(2)).toBe(true);

    // Verify selection mode is still active
    expect(await checkboxPage.isSelectionModeActive()).toBe(true);
  });

  test('Scenario 2: Unchecking checkboxes works', async () => {
    // Select three checkboxes
    await checkboxPage.clickCheckbox(0);
    await checkboxPage.hoverRow(1);
    await checkboxPage.clickCheckbox(1);
    await checkboxPage.hoverRow(2);
    await checkboxPage.clickCheckbox(2);

    // Verify all are checked
    expect(await checkboxPage.isCheckboxChecked(0)).toBe(true);
    expect(await checkboxPage.isCheckboxChecked(1)).toBe(true);
    expect(await checkboxPage.isCheckboxChecked(2)).toBe(true);

    // Uncheck second checkbox (this was failing before the fix)
    await checkboxPage.hoverRow(1);
    await checkboxPage.clickCheckbox(1);

    // Verify second is unchecked, others still checked
    expect(await checkboxPage.isCheckboxChecked(0)).toBe(true);
    expect(await checkboxPage.isCheckboxChecked(1)).toBe(false);
    expect(await checkboxPage.isCheckboxChecked(2)).toBe(true);

    // Uncheck first checkbox
    await checkboxPage.hoverRow(0);
    await checkboxPage.clickCheckbox(0);

    // Verify first is unchecked
    expect(await checkboxPage.isCheckboxChecked(0)).toBe(false);
    expect(await checkboxPage.isCheckboxChecked(1)).toBe(false);
    expect(await checkboxPage.isCheckboxChecked(2)).toBe(true);

    // Uncheck last checkbox - should exit selection mode
    await checkboxPage.hoverRow(2);
    await checkboxPage.clickCheckbox(2);

    // Verify all are unchecked and selection mode is inactive
    expect(await checkboxPage.isCheckboxChecked(0)).toBe(false);
    expect(await checkboxPage.isCheckboxChecked(1)).toBe(false);
    expect(await checkboxPage.isCheckboxChecked(2)).toBe(false);
    expect(await checkboxPage.isSelectionModeActive()).toBe(false);
  });

  test('Scenario 3: Shift-range selection still works', async () => {
    // Click first checkbox
    await checkboxPage.clickCheckbox(0);
    expect(await checkboxPage.isCheckboxChecked(0)).toBe(true);

    // Shift+click fifth checkbox for range selection
    await checkboxPage.hoverRow(4);
    await checkboxPage.clickCheckbox(4, ['Shift']);

    // Verify range is selected (0-4)
    for (let i = 0; i <= 4; i++) {
      expect(await checkboxPage.isCheckboxChecked(i)).toBe(true);
    }

    // Verify selection mode is active
    expect(await checkboxPage.isSelectionModeActive()).toBe(true);
  });

  test('Scenario 4: Complex selection flow', async () => {
    // Select first two individually
    await checkboxPage.clickCheckbox(0);
    await checkboxPage.hoverRow(1);
    await checkboxPage.clickCheckbox(1);

    expect(await checkboxPage.isCheckboxChecked(0)).toBe(true);
    expect(await checkboxPage.isCheckboxChecked(1)).toBe(true);

    // Uncheck first
    await checkboxPage.hoverRow(0);
    await checkboxPage.clickCheckbox(0);
    expect(await checkboxPage.isCheckboxChecked(0)).toBe(false);
    expect(await checkboxPage.isCheckboxChecked(1)).toBe(true);

    // Shift+click from 1 to 5 for range
    await checkboxPage.hoverRow(5);
    await checkboxPage.clickCheckbox(5, ['Shift']);

    // Verify range 1-5 is selected, 0 is not
    expect(await checkboxPage.isCheckboxChecked(0)).toBe(false);
    for (let i = 1; i <= 5; i++) {
      expect(await checkboxPage.isCheckboxChecked(i)).toBe(true);
    }

    // Uncheck middle item
    await checkboxPage.hoverRow(3);
    await checkboxPage.clickCheckbox(3);
    expect(await checkboxPage.isCheckboxChecked(3)).toBe(false);

    // Verify others still selected
    expect(await checkboxPage.isCheckboxChecked(1)).toBe(true);
    expect(await checkboxPage.isCheckboxChecked(2)).toBe(true);
    expect(await checkboxPage.isCheckboxChecked(4)).toBe(true);
    expect(await checkboxPage.isCheckboxChecked(5)).toBe(true);
  });

  test('Scenario 5: Rapid successive clicks', async () => {
    // Rapidly click multiple checkboxes
    await checkboxPage.clickCheckbox(0);
    await checkboxPage.hoverRow(1);
    await checkboxPage.clickCheckbox(1);
    await checkboxPage.hoverRow(2);
    await checkboxPage.clickCheckbox(2);
    await checkboxPage.hoverRow(3);
    await checkboxPage.clickCheckbox(3);

    // Wait a bit for state to settle
    await checkboxPage.page.waitForTimeout(200);

    // Verify all are checked
    expect(await checkboxPage.isCheckboxChecked(0)).toBe(true);
    expect(await checkboxPage.isCheckboxChecked(1)).toBe(true);
    expect(await checkboxPage.isCheckboxChecked(2)).toBe(true);
    expect(await checkboxPage.isCheckboxChecked(3)).toBe(true);

    // Rapidly uncheck them
    await checkboxPage.hoverRow(0);
    await checkboxPage.clickCheckbox(0);
    await checkboxPage.hoverRow(1);
    await checkboxPage.clickCheckbox(1);
    await checkboxPage.hoverRow(2);
    await checkboxPage.clickCheckbox(2);
    await checkboxPage.hoverRow(3);
    await checkboxPage.clickCheckbox(3);

    // Wait for state to settle
    await checkboxPage.page.waitForTimeout(200);

    // Verify all are unchecked
    expect(await checkboxPage.isCheckboxChecked(0)).toBe(false);
    expect(await checkboxPage.isCheckboxChecked(1)).toBe(false);
    expect(await checkboxPage.isCheckboxChecked(2)).toBe(false);
    expect(await checkboxPage.isCheckboxChecked(3)).toBe(false);
    expect(await checkboxPage.isSelectionModeActive()).toBe(false);
  });

  test('Scenario 6: Toggle same checkbox repeatedly', async () => {
    // Click checkbox 5 times
    for (let i = 0; i < 5; i++) {
      await checkboxPage.hoverRow(0);
      await checkboxPage.clickCheckbox(0);
      await checkboxPage.page.waitForTimeout(100);

      // Check expected state (odd clicks = checked, even = unchecked)
      const shouldBeChecked = i % 2 === 0;
      expect(await checkboxPage.isCheckboxChecked(0)).toBe(shouldBeChecked);
    }
  });
});

test.describe('Checkbox and Row Click Independence', () => {
  let checkboxPage: CheckboxTestPage;

  test.beforeEach(async ({ page }) => {
    checkboxPage = new CheckboxTestPage(page);
    await checkboxPage.goto();
  });

  test('Row click does not trigger checkbox when not in selection mode', async ({
    page,
  }) => {
    // Get first row
    const firstRow = page.locator(LOCATORS.transactionRow).first();

    // Click on the row (not the checkbox)
    await firstRow.click({ position: { x: 200, y: 10 } });

    // Wait a bit
    await page.waitForTimeout(300);

    // Checkbox should not be checked
    expect(await checkboxPage.isCheckboxChecked(0)).toBe(false);

    // Selection mode should not be active
    expect(await checkboxPage.isSelectionModeActive()).toBe(false);
  });

  test('Row click triggers selection when in selection mode', async ({
    page,
  }) => {
    // Enter selection mode by clicking first checkbox
    await checkboxPage.clickCheckbox(0);
    expect(await checkboxPage.isSelectionModeActive()).toBe(true);
    expect(await checkboxPage.isCheckboxChecked(0)).toBe(true);

    // Now click on the second row (not checkbox)
    const secondRow = page.locator(LOCATORS.transactionRow).nth(1);
    await secondRow.click({ position: { x: 200, y: 10 } });

    // Wait a bit
    await page.waitForTimeout(300);

    // Second checkbox should be checked by row click
    expect(await checkboxPage.isCheckboxChecked(1)).toBe(true);
  });

  test('Checkbox click does not expand recurring transaction', async ({
    page,
  }) => {
    // Find a recurring transaction (if any)
    const recurringRow = page.locator(
      '[data-onboarding="transaction-row"]:has([data-testid="recurring-badge"])'
    );

    const recurringCount = await recurringRow.count();
    if (recurringCount === 0) {
      test.skip(true, 'No recurring transactions found - skipping test');
      return;
    }

    // Get the first recurring transaction's index
    const allRows = page.locator(LOCATORS.transactionRow);
    let recurringIndex = -1;
    for (let i = 0; i < (await allRows.count()); i++) {
      const badge = allRows.nth(i).locator('[data-testid="recurring-badge"]');
      if ((await badge.count()) > 0) {
        recurringIndex = i;
        break;
      }
    }

    if (recurringIndex === -1) {
      test.skip(true, 'Could not determine recurring transaction index');
      return;
    }

    // Click the checkbox of the recurring transaction
    await checkboxPage.hoverRow(recurringIndex);
    await checkboxPage.clickCheckbox(recurringIndex);

    // Wait a bit
    await page.waitForTimeout(300);

    // Checkbox should be checked
    expect(await checkboxPage.isCheckboxChecked(recurringIndex)).toBe(true);

    // But the transaction should NOT be expanded (no detail view)
    // Check if there's a recurring detail section below
    const detailSection = allRows
      .nth(recurringIndex)
      .locator('[data-testid="recurring-detail"]');
    const isExpanded = await detailSection.isVisible().catch(() => false);
    expect(isExpanded).toBe(false);
  });
});
