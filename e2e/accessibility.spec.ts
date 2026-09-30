import { expect, Page } from '@playwright/test';
import { test } from './browser-test';
import AxeBuilder from '@axe-core/playwright';
import { goToTransactionsPage } from './fixtures';

async function openDeleteDialog(page: Page) {
  await page.getByTestId('transaction-checkbox').first().click();
  await page.getByTestId('bulk-delete-button').click();
  await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
}

async function audit(page: Page, selector?: string) {
  let builder = new AxeBuilder({ page }).withTags([
    'wcag2a',
    'wcag2aa',
    'wcag21aa',
    'wcag22aa',
  ]);
  if (selector) builder = builder.include(selector);
  const result = await builder.analyze();
  expect(
    result.violations.map(({ id, nodes }) => ({
      id,
      count: nodes.length,
      examples: nodes.slice(0, 3).map((node) => ({
        target: node.target,
        html: node.html,
        reason: node.failureSummary,
      })),
    }))
  ).toEqual([]);
}

test.describe('Accessible transaction workflows', () => {
  test.setTimeout(90000);
  test.beforeEach(async ({ page }) => {
    // Setup is deliberately desktop sized; then test the actual project viewport.
    const viewport = page.viewportSize();
    await page.setViewportSize({ width: 1440, height: 900 });
    await goToTransactionsPage(page);
    if (viewport) await page.setViewportSize(viewport);
    await expect(
      page.getByTestId('transaction-checkbox').first()
    ).toBeVisible();
  });

  test('transaction controls and text meet WCAG AA', async ({ page }) => {
    await audit(page);
  });

  test('selection and destructive controls remain named on mobile', async ({
    page,
  }) => {
    await page.getByTestId('transaction-checkbox').first().click();
    await expect(page.getByTestId('selection-toolbar')).toBeVisible();
    await expect(page.getByTestId('bulk-delete-button')).toHaveAccessibleName(
      /delete/i
    );
    await expect(page.getByTestId('cancel-selection')).toHaveAccessibleName(
      /cancel/i
    );
    await expect(page.getByTestId('selection-toolbar')).toHaveCSS(
      'opacity',
      '1'
    );
    await audit(page, '[data-testid="selection-toolbar"]');
  });

  test('keyboard selection announces the count and can be cancelled', async ({
    page,
  }) => {
    const checkbox = page.getByTestId('transaction-checkbox').first();
    await checkbox.focus();
    await page.keyboard.press('Space');
    await expect(checkbox).toBeChecked();
    await expect(page.getByTestId('selection-count')).toContainText('1');
    await expect(page.getByTestId('selection-count')).toHaveAttribute(
      'aria-live',
      'polite'
    );
    await page.getByTestId('cancel-selection').click();
    await expect(checkbox).not.toBeChecked();
    await expect(page.getByTestId('selection-toolbar')).toHaveCount(0);
  });

  test('delete confirmation is named, described, and accessible', async ({
    page,
  }) => {
    const dialog = await openDeleteDialog(page);
    await expect(dialog).toHaveAccessibleName(/delete/i);
    await expect(dialog).toHaveAttribute('aria-describedby', /.+/);
    await audit(page, '[role="dialog"]');
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByTestId('transaction-checkbox').first()
    ).toBeChecked();
  });

  test('confirmation traps focus and Escape safely dismisses it', async ({
    page,
  }) => {
    const dialog = await openDeleteDialog(page);
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      expect(
        await dialog.evaluate((element) =>
          element.contains(document.activeElement)
        )
      ).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByTestId('transaction-checkbox').first()
    ).toBeChecked();
  });

  test('reduced motion keeps the selection toolbar usable', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByTestId('transaction-checkbox').first().click();
    const toolbar = page.getByTestId('selection-toolbar');
    await expect(toolbar).toBeVisible();
    expect(
      await toolbar.evaluate(
        (element) => getComputedStyle(element).transitionDuration
      )
    ).toBe('0s');
  });
});
