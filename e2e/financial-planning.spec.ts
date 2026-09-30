import { expect, test, type Page } from '@playwright/test';
import { dismissOnboardingTour, setupApp, unlockTestApp } from './fixtures';

async function unlockAfterNavigation(page: Page) {
  await expect(
    page.getByRole('button', { name: 'Unlock', exact: true })
  ).toBeVisible({ timeout: 30000 });
  await unlockTestApp(page);
}

test('planning goals, contributions, reserves, net worth, and review persist', async ({
  page,
}) => {
  test.setTimeout(120000);
  await setupApp(page);
  await dismissOnboardingTour(page);
  await page.goto('/app/planning');
  await unlockAfterNavigation(page);
  await expect(
    page.getByRole('heading', { name: 'Planning', exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Add savings goal' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name', { exact: true }).fill('QA holiday reserve');
  await dialog.getByLabel('Target amount', { exact: true }).fill('1200');
  await dialog.getByLabel('Monthly contribution', { exact: true }).fill('100');
  await dialog
    .getByLabel('Target date (optional)', { exact: true })
    .fill('2027-08-01');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  const goal = page
    .locator('[data-onboarding="planning-goals"] .rounded-lg.border')
    .filter({
      has: page.getByRole('heading', {
        name: 'QA holiday reserve',
        exact: true,
      }),
    });
  await expect(goal).toBeVisible();
  await goal.getByRole('button', { name: 'Record contribution' }).click();
  await page
    .getByRole('dialog')
    .getByLabel('Contribution amount', { exact: true })
    .fill('50');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Save', exact: true })
    .click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(goal).toContainText('€50.00');
  await page.getByLabel('Minimum balance', { exact: true }).fill('250');
  await page.getByLabel('Other reserved savings', { exact: true }).fill('100');
  await page.getByRole('button', { name: 'Save reserves' }).click();
  await expect(
    page.getByText('Planning preferences saved', { exact: true })
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Net worth', exact: true }).click();
  await page.getByRole('button', { name: 'Add asset or liability' }).click();
  await page
    .getByRole('dialog')
    .getByLabel('Name', { exact: true })
    .fill('QA loan');
  await page
    .getByRole('dialog')
    .getByLabel('Type', { exact: true })
    .selectOption('liability');
  await page
    .getByRole('dialog')
    .getByLabel('Current value', { exact: true })
    .fill('500');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Save', exact: true })
    .click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByText('QA loan', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Monthly review', exact: true }).click();
  await page.getByLabel('Review month', { exact: true }).fill('2026-08');
  const firstCheck = page.getByLabel(
    'Categorize transactions that need attention',
    { exact: true }
  );
  await firstCheck.click();
  await expect(firstCheck).toBeChecked();
  await expect(firstCheck).toBeEnabled();
  await page.reload();
  await unlockAfterNavigation(page);
  await expect(page.getByLabel('Minimum balance', { exact: true })).toHaveValue(
    '250'
  );
  await expect(
    page.getByLabel('Other reserved savings', { exact: true })
  ).toHaveValue('100');
  await expect(
    page.getByRole('heading', { name: 'QA holiday reserve', exact: true })
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Monthly review', exact: true }).click();
  await page.getByLabel('Review month', { exact: true }).fill('2026-08');
  await expect(
    page.getByLabel('Categorize transactions that need attention', {
      exact: true,
    })
  ).toBeChecked();
});

test('subscription contract dates save without flipping an expense into income', async ({
  page,
}) => {
  test.setTimeout(120000);
  await setupApp(page);
  await dismissOnboardingTour(page);
  await page.goto('/app/subscriptions');
  await unlockAfterNavigation(page);
  const confirmed = page.locator('[data-onboarding="subscriptions-confirmed"]');
  await expect(confirmed).toBeVisible();
  await confirmed
    .getByRole('button', { name: 'Edit', exact: true })
    .first()
    .click();
  await confirmed
    .getByLabel('Renewal date', { exact: true })
    .fill('2027-01-01');
  await confirmed
    .getByLabel('Cancellation deadline', { exact: true })
    .fill('2026-12-01');
  await confirmed.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    confirmed.getByLabel('Renewal date', { exact: true })
  ).not.toBeVisible();
  await expect(confirmed).toContainText('Renewal date: 1 Jan 2027');
  await expect(confirmed).toContainText('Cancellation deadline: 1 Dec 2026');
  await page.reload();
  await unlockAfterNavigation(page);
  await expect(
    page.locator('[data-onboarding="subscriptions-confirmed"]')
  ).toContainText('Renewal date: 1 Jan 2027');
});

test('budget rollover persists and annual editing uses the stored monthly amount', async ({
  page,
}) => {
  test.setTimeout(120000);
  await setupApp(page);
  await dismissOnboardingTour(page);
  await page.goto('/app/budgets');
  await unlockAfterNavigation(page);
  const editButton = page
    .getByRole('button', { name: 'Edit Budget', exact: true })
    .first();
  await editButton.click();
  const amount = page.getByRole('spinbutton', { name: 'Amount per month' });
  await amount.fill('123');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(amount).not.toBeVisible();
  await page
    .locator('button')
    .filter({ has: page.locator('svg[class*="lucide-calendar"]') })
    .first()
    .click();
  await page.getByRole('button', { name: 'This year', exact: true }).click();
  await editButton.click();
  await expect(amount).toHaveValue('123');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(amount).not.toBeVisible();
  const rollover = page
    .getByLabel('Carry unused budget forward', { exact: true })
    .first();
  await rollover.click();
  await expect(rollover).toBeChecked();
  await expect(rollover).toBeEnabled();
  await page.reload();
  await unlockAfterNavigation(page);
  await expect(
    page.getByLabel('Carry unused budget forward', { exact: true }).first()
  ).toBeChecked();
});
