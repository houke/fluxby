import { expect, test } from '@playwright/test';
import { dismissOnboardingTour, setupApp } from './fixtures';

const helpArticles = [
  '',
  'first-steps',
  'installation',
  'bank-connection',
  'transactions',
  'bulk-delete',
  'categories',
  'accounts',
  'address-book',
  'planning',
  'budgeting',
  'subscriptions',
  'analytics',
  'sync',
  'privacy',
  'ai',
  'webmcp',
];
const developerArticles = [
  '',
  'authentication',
  'profiles',
  'errors',
  'accounts',
  'transactions',
  'categories',
  'budgets',
  'subscriptions',
  'analytics',
  'addressbook',
  'import',
  'data',
  'architecture',
  'openapi',
  'ai',
  'webmcp',
];

for (const language of ['en', 'nl'] as const) {
  test(`documentation renders in ${language} on desktop and mobile`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(
      (locale) => localStorage.setItem('fluxby.landing.language', locale),
      language
    );
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [1440, 393]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of [
        ...helpArticles.map((slug) => `/help/${slug}`),
        ...developerArticles.map((slug) => `/docs/${slug}`),
      ]) {
        await page.goto(route);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(page.locator('main')).not.toContainText(
          /\bundefined\b|\[object Object\]/
        );
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1
          ),
          `${route}/${language}/${width}: overflow`
        ).toBe(true);
      }
    }
    await page.goto('/help/analytics');
    for (const name of language === 'en'
      ? ['Groceries', 'Transport', 'Housing', 'Other']
      : ['Boodschappen', 'Vervoer', 'Wonen', 'Overig']) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }
    if (language === 'en')
      await expect(page.locator('main')).not.toContainText('Boodschappen');
    const trendBars = page.locator('[data-help-chart="trends"] [role="img"]');
    await expect(trendBars).toHaveCount(10);
    for (const bar of await trendBars.all()) {
      await expect(bar).toBeVisible();
      expect((await bar.boundingBox())?.height).toBeGreaterThan(40);
      await expect(bar).toHaveAttribute('aria-label', /€\d+/);
    }
    await page.goto('/docs/ai');
    await expect(page.locator('main')).toContainText('confidence > 0.6');
    await expect(page.locator('main')).not.toContainText('confidence > 0.7');
    await expect(page.locator('main')).toContainText(
      'AUTO_CATEGORY_CONFIDENCE_THRESHOLD'
    );
    expect(errors).toEqual([]);
  });

  test(`Settings bank accounts and reduced motion (${language})`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await setupApp(page);
    await dismissOnboardingTour(page);
    await page.getByRole('link', { name: 'Settings', exact: true }).click();
    await page.getByRole('tab', { name: 'App settings', exact: true }).click();
    await page.getByRole('button', { name: 'Nederlands' }).click();
    if (language === 'en')
      await page.getByRole('button', { name: 'English' }).click();
    await page
      .getByRole('tab', {
        name: language === 'en' ? 'Active profile' : 'Actief profiel',
        exact: true,
      })
      .click();
    await expect(
      page.locator('[data-onboarding="settings-accounts"]')
    ).toContainText(language === 'en' ? 'Bank accounts' : 'Bankrekeningen');
    const motion = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.className = 'animate-count-up animate-spin';
      document.body.append(probe);
      const style = getComputedStyle(probe);
      const result = {
        duration: style.animationDuration,
        iterations: style.animationIterationCount,
        transition: style.transitionDuration,
      };
      probe.remove();
      return result;
    });
    expect(parseFloat(motion.duration)).toBeLessThanOrEqual(0.00001);
    expect(motion.iterations).toBe('1');
    expect(parseFloat(motion.transition)).toBe(0);
  });
}

test('hero CSS pauses offscreen and reduced motion keeps content visible', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const hero = page.locator('section[data-animation-paused]').first();
  await expect(hero).toHaveAttribute('data-animation-paused', 'false');
  const emoji = page.locator('.emoji-float').first();
  await expect(emoji).toHaveCSS('animation-play-state', 'running');
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await expect(hero).toHaveAttribute('data-animation-paused', 'true');
  await expect(emoji).toHaveCSS('animation-play-state', 'paused');
  const paused = await emoji.evaluate(
    (element) => getComputedStyle(element).transform
  );
  await page.waitForTimeout(150);
  expect(
    await emoji.evaluate((element) => getComputedStyle(element).transform)
  ).toBe(paused);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(emoji).toHaveCSS('animation-name', 'none');
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior
    )
  ).toBe('auto');
});
