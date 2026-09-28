import { expect, test } from '@playwright/test';
import { dismissOnboardingTour } from './fixtures';

for (const language of ['en', 'nl'] as const) {
  test(`creates demo data in ${language} during fresh setup`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.goto('/app/');
    await page
      .getByRole('button', {
        name: language === 'en' ? /English|Engels/i : /Nederlands|Dutch/i,
      })
      .click();
    await page.locator('input[type="text"]').fill('Seed language test');
    await page.getByRole('button', { name: /^(Next|Volgende)/ }).click();
    await page.locator('input[type="password"]').nth(0).fill('test1234');
    await page.locator('input[type="password"]').nth(1).fill('test1234');
    await page.locator('button[type="submit"]').click();
    await expect(
      page.getByRole('link', { name: 'Dashboard', exact: true })
    ).toBeVisible({ timeout: 60000 });

    const accounts =
      language === 'en'
        ? ['Demo checking account', 'Demo savings account']
        : ['Demo Betaalrekening', 'Demo Spaarrekening'];
    for (const name of accounts) {
      await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
    }

    await dismissOnboardingTour(page);
    await page
      .getByRole('link', { name: /categories|categorieën|categorieen/i })
      .click({ timeout: 10000 });
    await expect(
      page.locator('[data-onboarding="category-list"]')
    ).toBeVisible();
    await expect(
      page
        .getByText(
          language === 'en' ? 'Housing & Living' : 'Wonen & Huisvesting',
          { exact: true }
        )
        .first()
    ).toBeVisible();
  });
}
