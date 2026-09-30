import { expect } from '@playwright/test';
import { test } from './browser-test';
import { goToTransactionsPage, unlockTestApp } from './fixtures';

test.describe('App review improvements', () => {
  test.setTimeout(90000);

  test('direct import setup creates an empty profile', async ({ page }) => {
    await page.goto('/app/');
    await page.getByRole('button', { name: /English/ }).click();
    await page.getByPlaceholder('Your name...').fill('Import test');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('radio', { name: 'Import my transactions' }).check();
    await page
      .getByPlaceholder('Master password...', { exact: true })
      .fill('test1234');
    await page
      .getByPlaceholder('Confirm password...', { exact: true })
      .fill('test1234');
    await page
      .getByRole('button', { name: "Let's get started!", exact: true })
      .click();
    await expect
      .poll(
        async () => {
          await unlockTestApp(page);
          return await page
            .locator('[data-onboarding="import-dropzone"]')
            .isVisible();
        },
        { timeout: 30000 }
      )
      .toBe(true);
    await expect(page).toHaveURL(/\/import/);
    await page
      .getByRole('link', { name: 'Transactions', exact: true })
      .first()
      .click();
    await expect(
      page.locator('[data-onboarding="transaction-row"]')
    ).toHaveCount(0);
    await expect(page.locator('[class*="z-[9999]"]')).toHaveCount(0);
  });

  test('saved filters restore search and compact density', async ({ page }) => {
    await goToTransactionsPage(page);
    await expect(
      page.getByTestId('transaction-checkbox').first()
    ).toBeVisible();
    const search = page.locator('[data-onboarding="transaction-search"] input');
    await search.fill('Jumbo');
    await page
      .getByRole('button', { name: 'Compact view', exact: true })
      .click();
    await page
      .getByRole('textbox', { name: 'View name', exact: true })
      .fill('Groceries');
    await page
      .getByRole('button', { name: 'Save current filters', exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: 'Groceries', exact: true })
    ).toBeVisible();
    await search.fill('');
    await page
      .getByRole('button', { name: 'Comfortable view', exact: true })
      .click();
    await page.getByRole('button', { name: 'Groceries', exact: true }).click();
    await expect(search).toHaveValue('Jumbo');
    await expect(
      page.getByRole('button', { name: 'Comfortable view', exact: true })
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
