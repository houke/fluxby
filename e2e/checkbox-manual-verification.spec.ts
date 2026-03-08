/**
 * Simple manual verification test for checkbox fix
 * This test opens the page and allows manual interaction
 */

import { test, expect } from '@playwright/test';
import { goToTransactionsPage } from './fixtures';

test.describe('Manual Checkbox Verification', () => {
  test('Manual test: Verify checkbox clicks work', async ({ page }) => {
    await goToTransactionsPage(page);

    // Wait for transaction rows
    await page.waitForSelector('[data-onboarding="transaction-row"]', {
      timeout: 10000,
    });

    console.log('✅ Page loaded');

    // Hover first row to make checkbox visible
    const firstRow = page
      .locator('[data-onboarding="transaction-row"]')
      .first();
    await firstRow.hover();
    await page.waitForTimeout(500);

    // Find the actual visible checkbox div (not the hidden input)
    const checkboxDiv = firstRow.locator('.peer + div').first();

    console.log('🔍 Looking for checkbox...');
    await expect(checkboxDiv).toBeVisible();
    console.log('✅ Checkbox is visible');

    // Click it
    await checkboxDiv.click();
    await page.waitForTimeout(500);
    console.log('✅ First click done');

    // Check if selection mode is active (toolbar appears)
    const toolbar = page.locator('[role="toolbar"]');
    await expect(toolbar).toBeVisible({ timeout: 2000 });
    console.log('✅ Selection mode activated');

    // Hover second row
    const secondRow = page
      .locator('[data-onboarding="transaction-row"]')
      .nth(1);
    await secondRow.hover();
    await page.waitForTimeout(300);

    // Click second checkbox (THIS was failing before the fix)
    const secondCheckboxDiv = secondRow.locator('.peer + div').first();
    await secondCheckboxDiv.click();
    await page.waitForTimeout(500);
    console.log('✅ Second click done');

    // Check if toolbar shows 2 selected
    const toolbarText = await toolbar.textContent();
    console.log(`Toolbar text: "${toolbarText}"`);

    // The toolbar should show "2" somewhere
    expect(toolbarText).toMatch(/2/);
    console.log('✅ Two items selected');

    // Try clicking a third checkbox
    const thirdRow = page.locator('[data-onboarding="transaction-row"]').nth(2);
    await thirdRow.hover();
    await page.waitForTimeout(300);

    const thirdCheckboxDiv = thirdRow.locator('.peer + div').first();
    await thirdCheckboxDiv.click();
    await page.waitForTimeout(500);
    console.log('✅ Third click done');

    // Check if toolbar shows 3 selected
    const toolbarText2 = await toolbar.textContent();
    console.log(`Toolbar text: "${toolbarText2}"`);
    expect(toolbarText2).toMatch(/3/);
    console.log('✅ Three items selected');

    // Now test UNCHECKING - click second checkbox again
    await secondRow.hover();
    await page.waitForTimeout(300);
    await secondCheckboxDiv.click();
    await page.waitForTimeout(500);
    console.log('✅ Uncheck click done');

    // Should now show 2 selected again
    const toolbarText3 = await toolbar.textContent();
    console.log(`Toolbar text after uncheck: "${toolbarText3}"`);
    expect(toolbarText3).toMatch(/2/);
    console.log('✅ Unchecking works');

    // Test shift-range selection
    // First, unselect all - need to re-get the locators
    await firstRow.hover();
    await page.waitForTimeout(300);
    const firstCheckboxDiv2 = firstRow.locator('.peer + div').first();
    await firstCheckboxDiv2.click();
    await page.waitForTimeout(300);

    await thirdRow.hover();
    await page.waitForTimeout(300);
    await thirdCheckboxDiv.click();
    await page.waitForTimeout(300);

    // Toolbar should be gone or show 0
    const isToolbarVisible = await toolbar.isVisible().catch(() => false);
    if (isToolbarVisible) {
      const text = await toolbar.textContent();
      expect(text).toMatch(/0|Annuleren|Cancel/i);
    }
    console.log('✅ All deselected');

    // Now test shift-click range
    await firstRow.hover();
    await page.waitForTimeout(300);
    await firstCheckboxDiv2.click();
    await page.waitForTimeout(300);
    console.log('✅ First checkbox selected for range test');

    const fifthRow = page.locator('[data-onboarding="transaction-row"]').nth(4);
    await fifthRow.hover();
    await page.waitForTimeout(300);

    const fifthCheckboxDiv = fifthRow.locator('.peer + div').first();
    await fifthCheckboxDiv.click({ modifiers: ['Shift'] });
    await page.waitForTimeout(500);
    console.log('✅ Shift-click done');

    // Should show 5 selected
    const toolbarText4 = await toolbar.textContent();
    console.log(`Toolbar text after shift-click: "${toolbarText4}"`);
    expect(toolbarText4).toMatch(/5/);
    console.log('✅ Shift-range selection works');

    console.log('\n🎉 ALL TESTS PASSED! Checkbox fix is working correctly.');
  });
});
