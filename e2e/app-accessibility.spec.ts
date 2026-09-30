import { expect } from '@playwright/test';
import { test } from './browser-test';
import AxeBuilder from '@axe-core/playwright';
import { setupApp, dismissOnboardingTour } from './fixtures';

test('primary pages expose named controls and readable text', async ({
  page,
}) => {
  test.setTimeout(180000);
  await setupApp(page);
  await dismissOnboardingTour(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const findings: Array<{
    page: string;
    id: string;
    count: number;
    examples: unknown[];
  }> = [];
  for (const name of [
    'Dashboard',
    'Transactions',
    'Analytics',
    'Budgets',
    'Planning',
    'Subscriptions',
    'Categories',
    'Address Book',
    'Import',
    'Settings',
  ]) {
    const destination = page.getByRole('link', { name, exact: true }).first();
    if (!(await destination.isVisible())) {
      await page.getByRole('button', { name: 'More', exact: true }).click();
    }
    await destination.click();
    await page.waitForTimeout(700); // Charts and route enter transitions settle before contrast sampling.
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    findings.push(
      ...result.violations.map((violation) => ({
        page: name,
        id: violation.id,
        count: violation.nodes.length,
        examples: violation.nodes.slice(0, 3).map((node) => ({
          html: node.html,
          reason: node.failureSummary,
          target: node.target,
        })),
      }))
    );
  }
  expect(errors).toEqual([]);
  expect(findings).toEqual([]);
});
