import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { dismissOnboardingTour } from './fixtures';

async function initializeProfile(page: Page, language: 'nl' | 'en') {
  const nl = language === 'nl';
  await page.goto('/app/');
  await page
    .getByRole('button', { name: nl ? /Nederlands|Dutch/i : /English|Engels/i })
    .click();
  await page
    .locator('input[type="text"]')
    .fill('Disposable category UI review');
  await page.getByRole('button', { name: /^(Next|Volgende)/ }).click();
  await page.locator('input[type="password"]').nth(0).fill('test1234');
  await page.locator('input[type="password"]').nth(1).fill('test1234');
  await page.locator('button[type="submit"]').click();
  const unlock = page.getByRole('button', {
    name: nl ? 'Ontgrendelen' : 'Unlock',
    exact: true,
  });
  const dashboard = page.getByRole('link', { name: 'Dashboard', exact: true });
  const unlockIfNeeded = async () => {
    if (await unlock.isVisible()) {
      await page
        .getByPlaceholder(nl ? 'Wachtwoord invoeren' : 'Enter password')
        .fill('test1234');
      await unlock.click();
    }
  };
  await expect(unlock.or(dashboard)).toBeVisible({ timeout: 90000 });
  await unlockIfNeeded();
  await expect(dashboard).toBeVisible({ timeout: 60000 });
  await expect(
    page.getByRole('button', { name: /let's get started|aan de slag/i })
  ).toBeVisible({ timeout: 60000 });
  await dismissOnboardingTour(page);
  await expect(page.locator('main h1').or(unlock)).toBeVisible({
    timeout: 30000,
  });
  await unlockIfNeeded();
  await expect(page.locator('main h1')).toBeVisible({ timeout: 30000 });
  await page
    .locator('a[href="/app/categories"]')
    .filter({ visible: true })
    .click();
  await expect(page.locator('main .animate-pulse')).toHaveCount(0);
  await expect(
    page.locator('[data-onboarding="category-list"] h3').first()
  ).toBeVisible();
}

for (const language of ['nl', 'en'] as const) {
  test(`category titles and editor controls remain accessible (${language})`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await initializeProfile(page, language);
    const nl = language === 'nl';
    const colors = nl ? /^Kies kleur:/ : /^Choose color:/;
    const icons = nl ? /^Kies icoon:/ : /^Choose icon:/;
    const output = process.env.CATEGORY_REVIEW_OUTPUT;
    if (output) await mkdir(resolve(output), { recursive: true });

    for (const width of [1440, 393]) {
      await page.setViewportSize({
        width,
        height: width === 1440 ? 1000 : 851,
      });
      for (const theme of ['light', 'dark']) {
        const isDark = await page
          .locator('html')
          .evaluate((html) => html.classList.contains('dark'));
        if (isDark !== (theme === 'dark')) {
          await page.locator('[data-onboarding="header-theme-toggle"]').click();
        }
        const scan = async (view: string) => {
          await expect
            .poll(() =>
              page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1
              )
            )
            .toBe(true);
          await expect
            .poll(() =>
              page
                .locator('main')
                .evaluate((main) => main.scrollWidth <= main.clientWidth + 1)
            )
            .toBe(true);
          const result = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze();
          expect(
            result.violations,
            `${language}/${theme}/${width}/${view}`
          ).toEqual([]);
          if (output)
            await page.screenshot({
              path: resolve(
                output,
                `${language}-${theme}-${width}-${view}.png`
              ),
            });
        };
        await scan('list');
        if (nl && width === 393) {
          const metrics = await page
            .getByRole('heading', { name: /eten.*uitgaan/i })
            .evaluate((heading) => ({
              width: heading.getBoundingClientRect().width,
              lines:
                heading.getBoundingClientRect().height /
                parseFloat(getComputedStyle(heading).lineHeight),
            }));
          expect(metrics.width).toBeGreaterThan(100);
          expect(metrics.lines).toBeLessThanOrEqual(2.1);
        }

        await page.locator('[data-onboarding="add-category-toggle"]').click();
        const form = page.locator('[data-onboarding="add-category-card"]');
        await expect(form).toBeVisible();
        const color = form.getByRole('button', { name: colors }).nth(1);
        await color.click();
        await expect(color).toHaveAttribute('aria-pressed', 'true');
        const icon = form.getByRole('button', { name: icons }).nth(1);
        await icon.click();
        await expect(icon).toHaveAttribute('aria-pressed', 'true');
        // A click dismisses Radix tooltips until the pointer leaves the trigger.
        await page.mouse.move(0, 0);
        await icon.hover();
        await expect(page.getByRole('tooltip')).toContainText(
          nl ? 'Kies icoon' : 'Choose icon'
        );
        await expect(page.getByRole('tooltip')).toHaveCSS('opacity', '1');
        await scan('create');
        await page.mouse.move(0, 0);
        await page.keyboard.press('Escape');
        await expect(page.getByRole('tooltip')).toBeHidden();
        await page.locator('[data-onboarding="add-category-toggle"]').click();

        await page
          .locator('[data-onboarding="category-list"]')
          .getByRole('button', { name: nl ? 'Bewerken' : 'Edit', exact: true })
          .first()
          .click();
        await expect(
          page.getByRole('button', { name: colors }).first()
        ).toBeVisible();
        const cancel = page.locator('main').getByRole('button', {
          name: nl ? 'Annuleren' : 'Cancel',
          exact: true,
        });
        await expect(cancel).toBeVisible();
        await scan('edit');
        await cancel.click();
      }
    }
    expect(errors).toEqual([]);
  });
}
