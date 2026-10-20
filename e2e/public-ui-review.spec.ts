import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/help/planning',
  '/help/transactions',
  '/docs/architecture',
  '/docs/authentication',
];

for (const language of ['nl', 'en'] as const) {
  test(`public pages remain readable and keyboard accessible (${language})`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript((locale) => {
      localStorage.setItem('fluxby.landing.language', locale);
    }, language);

    for (const width of [1440, 393]) {
      await page.setViewportSize({ width, height: 900 });
      for (const theme of ['light', 'dark'] as const) {
        await page.emulateMedia({
          colorScheme: theme,
          reducedMotion: 'reduce',
        });
        for (const route of routes) {
          await page.goto(route);
          await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
          await expect(page.locator('html')).toHaveClass(
            theme === 'dark' ? /dark/ : /^(?!.*dark)/
          );
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1
            ),
            `${language}/${theme}/${width}/${route}: horizontal overflow`
          ).toBe(true);
          const scan = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze();
          expect(
            scan.violations.map(({ id, nodes }) => ({
              id,
              targets: nodes.map(({ target }) => target),
            })),
            `${language}/${theme}/${width}/${route}: accessibility`
          ).toEqual([]);

          if (width === 393 && route === '/docs/authentication') {
            const code = page.locator('pre').first();
            expect(
              await code.evaluate(
                (element) => element.scrollWidth > element.clientWidth
              )
            ).toBe(true);
            await code.focus();
            await page.keyboard.press('ArrowRight');
            await expect
              .poll(() => code.evaluate((element) => element.scrollLeft))
              .toBeGreaterThan(0);
          }
        }
      }
    }
    expect(errors).toEqual([]);
  });
}
