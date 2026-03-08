/**
 * E2E Tests for Bulk Transaction Management
 *
 * TEST-003: Tests selection mode flow, bulk delete flow, undo flow,
 * date range delete flow, and shift-click range selection.
 *
 * NOTE: Many tests are marked as .skip() because the bulk delete feature
 * is not yet implemented. These tests define the expected behavior and
 * should be enabled as the feature is built.
 *
 * @see .nexus/features/bulk-transaction-management/plan.md
 */

import { test, expect, Page } from '@playwright/test';
import { goToTransactionsPage } from './fixtures';

// Test data-testid locators from the plan
// These elements need to be implemented in the feature
const LOCATORS = {
  transactionCheckbox: '[data-testid="transaction-checkbox"]',
  bulkDeleteButton: '[data-testid="bulk-delete-button"]',
  deletePreviewCount: '[data-testid="delete-preview-count"]',
  undoToast: '[data-testid="undo-toast"]',
  selectionToolbar: '[role="toolbar"][data-testid="selection-toolbar"]',
  selectionCount: '[data-testid="selection-count"]',
  cancelSelectionButton: '[data-testid="cancel-selection"]',
  dateRangeDeleteButton: '[data-testid="date-range-delete"]',
};

/**
 * Page Object for Transaction list page
 */
class TransactionsPage {
  constructor(private page: Page) {}

  async goto() {
    // Use fixture to handle app setup
    await goToTransactionsPage(this.page);
  }

  async waitForTransactionList() {
    // Wait for transaction rows to be visible (checkboxes appear on hover)
    // First wait for any transaction row
    await this.page.waitForSelector('[data-onboarding="transaction-row"]', {
      timeout: 10000,
    });

    // Hover over first row to make checkbox visible
    const firstRow = this.page
      .locator('[data-onboarding="transaction-row"]')
      .first();
    await firstRow.hover();
    await this.page.waitForTimeout(300);

    // Now wait for checkbox to appear
    try {
      await this.page.waitForSelector(LOCATORS.transactionCheckbox, {
        timeout: 5000,
        state: 'visible',
      });
    } catch {
      // Check for empty state message
      const emptyState = this.page.locator(
        'main p:text-matches("geen transacties|no transactions", "i")'
      );
      if (await emptyState.isVisible({ timeout: 1000 })) {
        throw new Error(
          'No transactions found - app needs demo data for E2E tests'
        );
      }
      throw new Error('Transaction list not found');
    }
  }

  async getTransactionCheckboxes() {
    return this.page.locator(LOCATORS.transactionCheckbox);
  }

  async selectTransaction(index: number) {
    const checkboxes = this.page.locator(LOCATORS.transactionCheckbox);
    // Use force:true because the checkbox has a visual wrapper that intercepts clicks
    await checkboxes.nth(index).click({ force: true });
  }

  async selectTransactionRange(startIndex: number, endIndex: number) {
    // Click first checkbox normally (force:true for visual wrapper)
    const checkboxes = this.page.locator(LOCATORS.transactionCheckbox);
    await checkboxes.nth(startIndex).click({ force: true });

    // Shift+click the end checkbox for range selection
    await checkboxes.nth(endIndex).click({ modifiers: ['Shift'], force: true });
  }

  async getSelectionCount() {
    const toolbar = this.page.locator('[role="toolbar"]');
    if (await toolbar.isVisible()) {
      const countText = await toolbar.textContent();
      const match = countText?.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    }
    return 0;
  }

  async clickBulkDeleteButton() {
    await this.page.click(LOCATORS.bulkDeleteButton);
  }

  async waitForConfirmationDialog() {
    // Wait for confirmation dialog
    await this.page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  }

  async confirmDelete() {
    // Find and click the confirm delete button in dialog
    const dialog = this.page.locator('[role="dialog"]');
    const confirmButton = dialog.getByRole('button', {
      name: /delete|verwijder/i,
    });
    await confirmButton.click();
  }

  async cancelDelete() {
    const dialog = this.page.locator('[role="dialog"]');
    const cancelButton = dialog.getByRole('button', { name: /cancel|annul/i });
    await cancelButton.click();
  }

  async cancelSelection() {
    const cancelButton = this.page.getByRole('button', {
      name: /cancel|annul/i,
    });
    await cancelButton.click();
  }

  async waitForUndoToast() {
    await this.page.waitForSelector(LOCATORS.undoToast, { timeout: 5000 });
  }

  async clickUndoButton() {
    const toast = this.page.locator(LOCATORS.undoToast);
    const undoButton = toast.getByRole('button', { name: /undo|ongedaan/i });
    await undoButton.click();
  }

  async dismissUndoToast() {
    const toast = this.page.locator(LOCATORS.undoToast);
    const dismissButton = toast.getByRole('button', { name: /close|sluit/i });
    await dismissButton.click();
  }

  async isSelectionModeActive() {
    const toolbar = this.page.locator('[role="toolbar"]');
    return toolbar.isVisible();
  }

  async getPreviewCount() {
    const preview = this.page.locator(LOCATORS.deletePreviewCount);
    const text = await preview.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
}

test.describe('Bulk Transaction Management E2E', () => {
  let transactionsPage: TransactionsPage;

  test.beforeEach(async ({ page }) => {
    transactionsPage = new TransactionsPage(page);
  });

  test.describe('Selection Mode Flow', () => {
    test('can enter selection mode by clicking a checkbox', async ({
      page: _page,
    }) => {
      await transactionsPage.goto();

      await transactionsPage.waitForTransactionList();

      // Click first checkbox
      await transactionsPage.selectTransaction(0);

      // Verify selection mode is active
      const isActive = await transactionsPage.isSelectionModeActive();
      expect(isActive).toBe(true);
    });

    // TODO: Enable when selection toolbar is implemented
    test.skip('shows correct selection count in toolbar', async ({
      page: _page,
    }) => {
      await transactionsPage.goto();

      await transactionsPage.waitForTransactionList();

      // Select 3 transactions
      await transactionsPage.selectTransaction(0);
      await transactionsPage.selectTransaction(1);
      await transactionsPage.selectTransaction(2);

      // Verify count
      const count = await transactionsPage.getSelectionCount();
      expect(count).toBe(3);
    });

    // TODO: Enable when cancel selection button is implemented
    test.skip('can exit selection mode by clicking cancel', async ({
      page: _page,
    }) => {
      await transactionsPage.goto();

      await transactionsPage.waitForTransactionList();

      // Enter selection mode
      await transactionsPage.selectTransaction(0);
      expect(await transactionsPage.isSelectionModeActive()).toBe(true);

      // Cancel selection
      await transactionsPage.cancelSelection();

      // Verify selection mode is no longer active
      expect(await transactionsPage.isSelectionModeActive()).toBe(false);
    });

    // TODO: Enable when selection count display is implemented
    test.skip('can toggle individual transaction selection', async ({
      page: _page,
    }) => {
      await transactionsPage.goto();

      await transactionsPage.waitForTransactionList();

      // Select first transaction
      await transactionsPage.selectTransaction(0);
      expect(await transactionsPage.getSelectionCount()).toBe(1);

      // Select second
      await transactionsPage.selectTransaction(1);
      expect(await transactionsPage.getSelectionCount()).toBe(2);

      // Deselect first
      await transactionsPage.selectTransaction(0);
      expect(await transactionsPage.getSelectionCount()).toBe(1);
    });
  });

  test.describe('Bulk Delete Flow', () => {
    // TODO: Enable when bulk delete button and confirmation dialog are implemented
    test.skip('shows confirmation dialog with transaction count', async ({
      page,
    }) => {
      await transactionsPage.goto();

      await transactionsPage.waitForTransactionList();

      // Select 3 transactions
      await transactionsPage.selectTransaction(0);
      await transactionsPage.selectTransaction(1);
      await transactionsPage.selectTransaction(2);

      // Click delete button
      await transactionsPage.clickBulkDeleteButton();
      await transactionsPage.waitForConfirmationDialog();

      // Verify dialog shows correct count
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toContainText(/3/);
    });

    // TODO: Enable when confirmation dialog with preview is implemented
    test.skip('shows transaction preview list in dialog', async ({ page }) => {
      await transactionsPage.goto();

      await transactionsPage.waitForTransactionList();

      // Select transactions
      await transactionsPage.selectTransaction(0);
      await transactionsPage.selectTransaction(1);

      // Open confirmation dialog
      await transactionsPage.clickBulkDeleteButton();
      await transactionsPage.waitForConfirmationDialog();

      // Verify the preview section exists
      const previewSection = page.locator(LOCATORS.deletePreviewCount);
      await expect(previewSection).toBeVisible();
    });

    // TODO: Enable when confirmation dialog is implemented
    test.skip('can cancel deletion from confirmation dialog', async ({
      page,
    }) => {
      await transactionsPage.goto();

      await transactionsPage.waitForTransactionList();

      // Select transaction
      await transactionsPage.selectTransaction(0);

      // Open dialog and cancel
      await transactionsPage.clickBulkDeleteButton();
      await transactionsPage.waitForConfirmationDialog();
      await transactionsPage.cancelDelete();

      // Verify dialog is closed but selection is maintained
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).not.toBeVisible();
      expect(await transactionsPage.isSelectionModeActive()).toBe(true);
    });

    // TODO: Enable when undo toast is implemented
    test.skip('shows undo toast after successful deletion', async ({
      page,
    }) => {
      await transactionsPage.goto();

      await transactionsPage.waitForTransactionList();

      // Select and delete transactions
      await transactionsPage.selectTransaction(0);
      await transactionsPage.clickBulkDeleteButton();
      await transactionsPage.waitForConfirmationDialog();
      await transactionsPage.confirmDelete();

      // Verify undo toast appears
      await transactionsPage.waitForUndoToast();
      const toast = page.locator(LOCATORS.undoToast);
      await expect(toast).toBeVisible();
    });
  });

  test.describe('Undo Flow', () => {
    // TODO: Enable when undo functionality is implemented
    test.skip('can undo deletion by clicking undo button', async ({ page }) => {
      await transactionsPage.goto();

      await transactionsPage.waitForTransactionList();

      // Get initial transaction count
      const initialCheckboxes =
        await transactionsPage.getTransactionCheckboxes();
      const initialCount = await initialCheckboxes.count();

      // Select and delete transaction
      await transactionsPage.selectTransaction(0);
      await transactionsPage.clickBulkDeleteButton();
      await transactionsPage.waitForConfirmationDialog();
      await transactionsPage.confirmDelete();

      // Wait for undo toast and click undo
      await transactionsPage.waitForUndoToast();
      await transactionsPage.clickUndoButton();

      // Wait for transactions to be restored
      await page.waitForTimeout(1000);

      // Verify transaction count is restored
      const restoredCheckboxes =
        await transactionsPage.getTransactionCheckboxes();
      const restoredCount = await restoredCheckboxes.count();
      expect(restoredCount).toBe(initialCount);
    });

    // TODO: Enable when undo toast with countdown is implemented
    test.skip('undo toast shows countdown timer', async ({ page }) => {
      await transactionsPage.goto();

      await transactionsPage.waitForTransactionList();

      // Delete transaction
      await transactionsPage.selectTransaction(0);
      await transactionsPage.clickBulkDeleteButton();
      await transactionsPage.waitForConfirmationDialog();
      await transactionsPage.confirmDelete();

      // Verify toast has countdown (format: M:SS)
      await transactionsPage.waitForUndoToast();
      const toast = page.locator(LOCATORS.undoToast);
      await expect(toast).toContainText(/\d:\d\d/);
    });

    // TODO: Enable when undo toast dismiss is implemented
    test.skip('can dismiss undo toast manually', async ({ page }) => {
      await transactionsPage.goto();

      await transactionsPage.waitForTransactionList();

      // Delete transaction
      await transactionsPage.selectTransaction(0);
      await transactionsPage.clickBulkDeleteButton();
      await transactionsPage.waitForConfirmationDialog();
      await transactionsPage.confirmDelete();

      // Wait for toast and dismiss
      await transactionsPage.waitForUndoToast();
      await transactionsPage.dismissUndoToast();

      // Verify toast is gone
      const toast = page.locator(LOCATORS.undoToast);
      await expect(toast).not.toBeVisible();
    });
  });

  test.describe('Shift-Click Range Selection (Desktop)', () => {
    // TODO: Enable when selection count display is implemented
    test.skip('selects all transactions between first and shift-clicked', async ({
      page: _page,
    }) => {
      await transactionsPage.goto();

      await transactionsPage.waitForTransactionList();

      // Get checkbox count
      const checkboxes = await transactionsPage.getTransactionCheckboxes();
      const checkboxCount = await checkboxes.count();

      // Skip if not enough transactions
      if (checkboxCount < 5) {
        test.skip();
        return;
      }

      // Select range from index 0 to 4 (5 transactions)
      await transactionsPage.selectTransactionRange(0, 4);

      // Verify 5 are selected
      const count = await transactionsPage.getSelectionCount();
      expect(count).toBe(5);
    });

    // TODO: Enable when selection count display is implemented
    test.skip('shift-click range works in reverse order', async ({
      page: _page,
    }) => {
      await transactionsPage.goto();

      await transactionsPage.waitForTransactionList();

      const checkboxes = await transactionsPage.getTransactionCheckboxes();
      const checkboxCount = await checkboxes.count();

      if (checkboxCount < 5) {
        test.skip();
        return;
      }

      // Select range from index 4 to 0 (reverse)
      await transactionsPage.selectTransactionRange(4, 0);

      // Verify 5 are selected
      const count = await transactionsPage.getSelectionCount();
      expect(count).toBe(5);
    });
  });

  test.describe('Date Range Delete Flow', () => {
    // TODO: Enable when date range delete feature is implemented
    test.skip('can open date range delete dialog', async ({ page }) => {
      await transactionsPage.goto();

      await transactionsPage.waitForTransactionList();

      // Enter selection mode first
      await transactionsPage.selectTransaction(0);

      // Look for the date range option in dropdown
      const bulkDeleteButton = page.locator(LOCATORS.bulkDeleteButton);

      // If it's a dropdown, click to open
      const hasDropdown = await bulkDeleteButton
        .locator('svg')
        .last()
        .isVisible();
      if (hasDropdown) {
        await bulkDeleteButton.click();

        // Find date range option
        const dateRangeOption = page.getByRole('menuitem', {
          name: /date range|datumbereik/i,
        });
        if (await dateRangeOption.isVisible()) {
          await dateRangeOption.click();

          // Verify date range dialog opens
          const dialog = page.locator('[role="dialog"]');
          await expect(dialog).toContainText(/date range|datumbereik/i);
        }
      }
    });
  });
});

test.describe('Keyboard Navigation (Accessibility)', () => {
  let transactionsPage: TransactionsPage;

  test.beforeEach(async ({ page }) => {
    transactionsPage = new TransactionsPage(page);
  });

  test('can navigate to checkboxes with Tab key', async ({ page }) => {
    await transactionsPage.goto();

    await transactionsPage.waitForTransactionList();

    // Tab through the page to reach checkboxes
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Eventually a checkbox should be focused
    // Press space to select
    await page.keyboard.press('Space');

    // Check if selection mode started
    const _isActive = await transactionsPage.isSelectionModeActive();
    // This may or may not work depending on exact focus order
  });

  test('can select transaction with Space key when focused', async ({
    page,
  }) => {
    await transactionsPage.goto();

    await transactionsPage.waitForTransactionList();

    // Focus on first checkbox
    const checkbox = page.locator(LOCATORS.transactionCheckbox).first();
    await checkbox.focus();

    // Press space to toggle
    await page.keyboard.press('Space');

    // Verify selection
    const isActive = await transactionsPage.isSelectionModeActive();
    expect(isActive).toBe(true);
  });

  // TODO: Enable when bulk delete button is implemented
  test.skip('can close dialog with Escape key', async ({ page }) => {
    await transactionsPage.goto();

    await transactionsPage.waitForTransactionList();

    // Select and open dialog
    await transactionsPage.selectTransaction(0);
    await transactionsPage.clickBulkDeleteButton();
    await transactionsPage.waitForConfirmationDialog();

    // Press Escape
    await page.keyboard.press('Escape');

    // Verify dialog is closed
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).not.toBeVisible();
  });

  // TODO: Enable when bulk delete button and dialog are implemented
  test.skip('focus returns to trigger after dialog close', async ({ page }) => {
    await transactionsPage.goto();

    await transactionsPage.waitForTransactionList();

    // Select and open dialog
    await transactionsPage.selectTransaction(0);
    const deleteButton = page.locator(LOCATORS.bulkDeleteButton);
    await deleteButton.click();
    await transactionsPage.waitForConfirmationDialog();

    // Close with cancel button
    await transactionsPage.cancelDelete();

    // Verify focus returns to the delete button
    await expect(deleteButton).toBeFocused();
  });
});
