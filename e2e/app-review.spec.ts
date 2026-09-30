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

  test('category splits preserve total and guarded undo removes them', async ({
    page,
  }) => {
    await goToTransactionsPage(page);
    await page.locator('[data-onboarding="transaction-inspector"]').click();
    const dialog = page.getByRole('dialog');
    const select = dialog.getByRole('combobox', {
      name: 'Select transaction',
      exact: true,
    });
    await expect
      .poll(() => select.locator('option').count())
      .toBeGreaterThan(1);
    const option = await select.locator('option').evaluateAll((options) =>
      options
        .map((item) => ({
          value: (item as HTMLOptionElement).value,
          text: item.textContent || '',
        }))
        .find((item) => item.value && / · -/.test(item.text))
    );
    expect(option).toBeDefined();
    if (!option) throw new Error('No expense transaction was available');
    await select.selectOption(option.value);
    const amount = Math.abs(Number(option.text.split(' · ').at(-1)));
    const categories = dialog.getByRole('combobox', {
      name: 'Category',
      exact: true,
    });
    const clearExisting = dialog.getByRole('button', {
      name: 'Remove split',
      exact: true,
    });
    const addCategory = dialog.getByRole('button', {
      name: 'Add category',
      exact: true,
    });
    await expect(addCategory).toBeEnabled();
    if (await clearExisting.isVisible()) {
      await clearExisting.click();
      await expect(categories).toHaveCount(0);
    }
    await expect(addCategory).toBeEnabled();
    await addCategory.click();
    await addCategory.click();
    await expect(categories).toHaveCount(2);
    await categories.nth(0).selectOption({ index: 1 });
    await categories.nth(1).selectOption({ index: 2 });
    const fields = dialog.getByRole('spinbutton', {
      name: 'Amount',
      exact: true,
    });
    await fields.nth(0).fill((Math.floor(amount * 50) / 100).toFixed(2));
    await fields
      .nth(1)
      .fill((amount - Math.floor(amount * 50) / 100).toFixed(2));
    const save = dialog.getByRole('button', { name: 'Save', exact: true });
    await expect(save).toBeEnabled();
    await save.click();
    await expect(
      dialog.getByRole('button', { name: 'Remove split', exact: true })
    ).toBeVisible();
    await dialog.getByRole('button', { name: 'Close', exact: true }).click();
    await page
      .getByRole('button', { name: 'Change history', exact: true })
      .click();
    const history = page.getByRole('dialog');
    await history
      .getByRole('button', { name: 'Undo change', exact: true })
      .first()
      .click();
    await history.getByRole('button', { name: 'Close', exact: true }).click();
    await page.locator('[data-onboarding="transaction-inspector"]').click();
    await page
      .getByRole('dialog')
      .getByRole('combobox', { name: 'Select transaction', exact: true })
      .selectOption(option.value);
    await expect(
      page
        .getByRole('dialog')
        .getByRole('button', { name: 'Remove split', exact: true })
    ).toHaveCount(0);
  });

  test('statement comparison records a difference without altering balances', async ({
    page,
  }) => {
    await goToTransactionsPage(page);
    await expect(
      page.getByTestId('transaction-checkbox').first()
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Reconcile statement', exact: true })
      .click();
    const dialog = page.getByRole('dialog');
    await dialog
      .getByRole('combobox', { name: 'Account', exact: true })
      .selectOption({ index: 1 });
    await dialog
      .getByRole('spinbutton', { name: 'Opening balance', exact: true })
      .fill('100');
    await dialog
      .getByRole('spinbutton', {
        name: 'Statement closing balance',
        exact: true,
      })
      .fill('999999');
    await dialog
      .getByRole('button', { name: 'Reconcile statement', exact: true })
      .click();
    await expect(
      dialog.getByText('Calculated closing balance:', { exact: false })
    ).toBeVisible();
    await expect(
      dialog.getByText('Difference:', { exact: false })
    ).toBeVisible();
  });
});
