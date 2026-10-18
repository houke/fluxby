import { expect } from '@playwright/test';
import { test } from './browser-test';
import {
  dismissOnboardingTour,
  goToTransactionsPage,
  unlockTestApp,
} from './fixtures';
import { en } from '../apps/web/src/lib/i18n/en';
import { nl } from '../apps/web/src/lib/i18n/nl';

test.describe('App review improvements', () => {
  test.setTimeout(90000);

  for (const language of ['en', 'nl'] as const) {
    test(`setup seeds demo data and password controls work with the keyboard (${language})`, async ({
      page,
    }, testInfo) => {
      const copy = language === 'nl' ? nl : en;
      await page.goto('/app/');
      await page
        .getByRole('button', {
          name: language === 'en' ? /English/ : /Nederlands/,
        })
        .click();
      await page
        .getByPlaceholder(copy.security.initialSetup.namePlaceholder)
        .fill('Setup review');
      await page
        .getByRole('button', { name: copy.common.next, exact: true })
        .click();
      await expect(page.getByRole('radio')).toHaveCount(0);
      const password = page.getByLabel(copy.security.newPassword, {
        exact: true,
      });
      const confirmation = page.getByLabel(copy.security.confirmPassword, {
        exact: true,
      });
      await password.fill('test1234');
      await confirmation.fill('test1234');
      const show = page.getByRole('button', {
        name: copy.security.showPassword,
        exact: true,
      });
      await show.focus();
      await expect(page.getByRole('tooltip')).toContainText(
        copy.security.showPassword
      );
      await expect(page.getByRole('tooltip').locator('..')).toHaveCSS(
        'opacity',
        '1'
      );
      await page.screenshot({
        path: `.nexus/tmp/setup-${language}-${testInfo.project.name}.png`,
      });
      await page.keyboard.press('Space');
      await expect(password).toHaveAttribute('type', 'text');
      await expect(confirmation).toHaveAttribute('type', 'text');
      const hide = page.getByRole('button', {
        name: copy.security.hidePassword,
        exact: true,
      });
      await expect(hide).toHaveAttribute('aria-pressed', 'true');
      await page.keyboard.press('Space');
      await expect(password).toHaveAttribute('type', 'password');
      await page
        .getByRole('button', {
          name: copy.security.initialSetup.finish,
          exact: true,
        })
        .click();
      const unlock = page.getByRole('button', {
        name: copy.security.unlock,
        exact: true,
      });
      const welcome = page.getByTestId('onboarding-step');
      await expect(unlock.or(welcome)).toBeVisible({ timeout: 60000 });
      if (await unlock.isVisible()) {
        await page
          .getByLabel(copy.security.enterPassword, { exact: true })
          .fill('test1234');
        await unlock.click();
      }
      await dismissOnboardingTour(page, { waitForWelcome: true });
      await page
        .getByRole('link', { name: copy.nav.transactions, exact: true })
        .first()
        .click();
      await expect(
        page.locator('[data-onboarding="transaction-row"]').first()
      ).toBeVisible();
      await page.reload();
      await expect(unlock).toBeVisible({ timeout: 30000 });
      const unlockPassword = page.getByLabel(copy.security.enterPassword, {
        exact: true,
      });
      await unlockPassword.fill('test1234');
      await page
        .getByRole('button', { name: copy.security.showPassword, exact: true })
        .focus();
      await page.keyboard.press('Enter');
      await expect(unlockPassword).toHaveAttribute('type', 'text');
      await page
        .getByRole('button', { name: copy.security.hidePassword, exact: true })
        .click();
      await expect(unlockPassword).toHaveAttribute('type', 'password');
      await unlock.click();
      await expect(
        page.locator('[data-onboarding="transaction-row"]').first()
      ).toBeVisible();
      await expect(welcome).toHaveCount(0);
    });
  }

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
