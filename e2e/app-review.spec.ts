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

  test('transaction actions share the filter card and compact density persists', async ({
    page,
  }, testInfo) => {
    await goToTransactionsPage(page);
    await expect(
      page.getByTestId('transaction-checkbox').first()
    ).toBeVisible();
    const filters = page.locator('[data-onboarding="transaction-filters"]');
    const actions = filters.locator('[data-onboarding="transaction-actions"]');
    await expect(actions.getByRole('button')).toHaveCount(3);
    for (const name of [
      'Compact view',
      'Review transactions',
      'Download filtered CSV',
    ]) {
      await expect(
        actions.getByRole('button', { name, exact: true })
      ).toBeVisible();
      await expect(
        actions.getByRole('button', { name, exact: true }).locator('svg')
      ).toHaveCount(1);
    }
    await expect(
      filters.locator('[data-onboarding="transaction-review"]')
    ).toHaveCSS('border-top-width', '1px');
    await filters.screenshot({
      path: `.nexus/tmp/transaction-actions-${testInfo.project.name}.png`,
    });
    await expect(page.locator('[data-onboarding="saved-views"]')).toHaveCount(
      0
    );
    await expect(
      page.getByRole('button', { name: 'Save current filters', exact: true })
    ).toHaveCount(0);
    const search = filters.locator(
      '[data-onboarding="transaction-search"] input'
    );
    await search.fill('Jumbo');
    await actions
      .getByRole('button', { name: 'Compact view', exact: true })
      .click();
    await expect(
      actions.getByRole('button', { name: 'Comfortable view', exact: true })
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(search).toHaveValue('Jumbo');
    await page.reload();
    await expect(
      page
        .getByRole('button', { name: 'Unlock', exact: true })
        .or(
          actions.getByRole('button', { name: 'Comfortable view', exact: true })
        )
    ).toBeVisible({ timeout: 30000 });
    await unlockTestApp(page);
    await expect(
      actions.getByRole('button', { name: 'Comfortable view', exact: true })
    ).toHaveAttribute('aria-pressed', 'true');
    await actions
      .getByRole('button', { name: 'Comfortable view', exact: true })
      .click();
    await expect(
      actions.getByRole('button', { name: 'Compact view', exact: true })
    ).toHaveAttribute('aria-pressed', 'false');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1
      )
    ).toBe(true);
  });
});
