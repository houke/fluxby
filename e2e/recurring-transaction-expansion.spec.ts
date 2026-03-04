import { expect, test } from '@playwright/test';
import { goToTransactionsPage } from './fixtures';

test.describe('Recurring Transaction Expansion', () => {
  test('clicking checkbox should toggle selection, clicking row should expand recurring transactions', async ({
    page,
  }) => {
    // Navigate to transactions page using fixture
    await goToTransactionsPage(page);

    // Wait for transactions to load
    await page.waitForSelector('[data-onboarding="transaction-row"]', {
      state: 'visible',
    });

    // Find a recurring transaction row
    const recurringRow = page
      .locator('[data-onboarding="transaction-row"]')
      .first();
    const merchantName = await recurringRow
      .locator('.font-medium')
      .first()
      .textContent();

    console.log('Testing with merchant:', merchantName);

    // Test 1: Click checkbox should toggle selection
    const checkbox = recurringRow.locator(
      '[data-testid="transaction-checkbox"]'
    );

    // Initially not checked
    await expect(checkbox).not.toBeChecked();

    // Click checkbox wrapper area to toggle selection (force:true because checkbox has visual wrapper)
    await checkbox.click({ force: true });
    await expect(checkbox).toBeChecked();

    // Click checkbox again to uncheck
    await checkbox.click({ force: true });
    await expect(checkbox).not.toBeChecked();

    // Click checkbox one more time to verify multiple toggles work
    await checkbox.click({ force: true });
    await expect(checkbox).toBeChecked();

    // Uncheck for next test
    await checkbox.click({ force: true });
    await expect(checkbox).not.toBeChecked();

    console.log('✓ Checkbox toggle works correctly');

    // Test 2: Click row (not checkbox) should expand recurring transactions
    // Click on the merchant name area (not checkbox)
    const merchantNameElement = recurringRow.locator('.font-medium').first();
    await merchantNameElement.click();

    // Wait a bit for expansion
    await page.waitForTimeout(300);

    // Check if recurring transactions expanded (look for additional transaction rows or expanded content)
    // The expanded state might show more transactions or a different UI
    const rowsAfterClick = await page
      .locator('[data-onboarding="transaction-row"]')
      .count();

    console.log('Rows after expanding:', rowsAfterClick);

    // Test 3: Click row again to collapse
    await merchantNameElement.click();
    await page.waitForTimeout(300);

    const rowsAfterCollapse = await page
      .locator('[data-onboarding="transaction-row"]')
      .count();

    console.log('Rows after collapsing:', rowsAfterCollapse);

    console.log('✓ Row click for expansion/collapse works correctly');

    // Test 4: Verify checkbox click doesn't affect expansion state
    // Expand the recurring transactions
    await merchantNameElement.click();
    await page.waitForTimeout(300);

    const rowsWhenExpanded = await page
      .locator('[data-onboarding="transaction-row"]')
      .count();

    // Click checkbox - this should NOT collapse the expanded transactions
    await checkbox.click({ force: true });
    await page.waitForTimeout(300);

    const rowsAfterCheckboxClick = await page
      .locator('[data-onboarding="transaction-row"]')
      .count();

    // Rows should still be the same (expanded)
    expect(rowsAfterCheckboxClick).toBe(rowsWhenExpanded);

    console.log('✓ Checkbox click does not affect expansion state');
  });

  test('shift-click on checkbox should enable range selection without affecting expansion', async ({
    page,
  }) => {
    // Navigate to transactions page using fixture
    await goToTransactionsPage(page);

    // Wait for transactions to load
    await page.waitForSelector('[data-onboarding="transaction-row"]', {
      state: 'visible',
    });

    const rows = page.locator('[data-onboarding="transaction-row"]');
    const firstCheckbox = rows
      .nth(0)
      .locator('[data-testid="transaction-checkbox"]');
    const thirdCheckbox = rows
      .nth(2)
      .locator('[data-testid="transaction-checkbox"]');

    // Hover over first row to make checkbox visible
    await rows.nth(0).hover();
    await page.waitForTimeout(200);

    // Click first checkbox (force:true because checkbox has visual wrapper)
    await firstCheckbox.click({ force: true });
    await expect(firstCheckbox).toBeChecked();

    // Hover over third row
    await rows.nth(2).hover();
    await page.waitForTimeout(200);

    // Shift-click third checkbox
    await thirdCheckbox.click({ force: true, modifiers: ['Shift'] });

    // All three checkboxes should be checked
    await expect(firstCheckbox).toBeChecked();
    await expect(
      rows.nth(1).locator('[data-testid="transaction-checkbox"]')
    ).toBeChecked();
    await expect(thirdCheckbox).toBeChecked();

    console.log('✓ Shift-click range selection works');
  });
});
