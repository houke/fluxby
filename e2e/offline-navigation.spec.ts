import { expect, test, type Page } from '@playwright/test';
import { dismissOnboardingTour } from './fixtures';

// Run against the assembled production site: development disables its workers.
test.skip(
  process.env.PLAYWRIGHT_PRODUCTION !== 'true',
  'Requires the assembled production site and its generated service workers'
);

const appRoutes = [
  'dashboard',
  'transactions',
  'analytics',
  'budgets',
  'planning',
  'subscriptions',
  'addressbook',
  'categories',
  'import',
  'settings',
  'help',
];
const landingRoutes = [
  'help',
  ...[
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
  ].map((route) => `help/${route}`),
  'docs',
  ...[
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
  ].map((route) => `docs/${route}`),
  'privacy',
  'terms',
  'updates',
];

async function waitForController(page: Page, path: string) {
  await expect
    .poll(() =>
      page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)
    )
    .toBe(new URL(path, page.url()).href);
}

for (const language of ['en', 'nl'] as const) {
  test(`unvisited lazy routes and encrypted reloads work offline (${language})`, async ({
    page,
    context,
  }, testInfo) => {
    test.setTimeout(240000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    // Start on the landing page to exercise parent/app worker scope handoff.
    await page.goto('/');
    await waitForController(page, '/sw.js');
    await page.goto('/app/');
    await page
      .getByRole('button', {
        name: language === 'en' ? /English/ : /Nederlands/,
      })
      .click();
    await page.locator('input[type="text"]').fill('Offline review');
    await page.getByRole('button', { name: /^(Next|Volgende)$/ }).click();
    await page.locator('input[type="password"]').nth(0).fill('test1234');
    await page.locator('input[type="password"]').nth(1).fill('test1234');
    await page.locator('button[type="submit"]').click();
    const unlockButton = page.getByRole('button', {
      name: language === 'en' ? 'Unlock' : 'Ontgrendelen',
      exact: true,
    });
    await expect(page.locator('main h1').or(unlockButton)).toBeVisible({
      timeout: 60000,
    });
    if (await unlockButton.isVisible()) {
      await page
        .getByPlaceholder(/^(Enter password|Wachtwoord invoeren)$/)
        .fill('test1234');
      await unlockButton.click();
    }
    await expect(
      page.getByRole('button', { name: /let's get started|aan de slag/i })
    ).toBeVisible({ timeout: 60000 });
    await dismissOnboardingTour(page);
    await waitForController(page, '/app/sw.js');
    await page.evaluate((selectedLanguage) => {
      localStorage.setItem('fluxby.landing.language', selectedLanguage);
    }, language);

    const registrations = await page.evaluate(async () =>
      (await navigator.serviceWorker.getRegistrations())
        .map((registration) => new URL(registration.scope).pathname)
        .sort()
    );
    expect(registrations).toEqual(['/', '/app/']);
    await context.setOffline(true);

    const visited: string[] = [];
    // Direct navigations reload the shell and require previously unused chunks.
    for (const route of appRoutes) {
      await page.goto(`/app/${route}`, { waitUntil: 'domcontentloaded' });
      const unlock = page.getByRole('button', {
        name: language === 'en' ? 'Unlock' : 'Ontgrendelen',
        exact: true,
      });
      await expect(unlock).toBeVisible({ timeout: 30000 });
      await page
        .getByPlaceholder(/^(Enter password|Wachtwoord invoeren)$/)
        .fill('test1234');
      await unlock.click();
      await expect(page.locator('main h1')).toBeVisible({ timeout: 30000 });
      await expect(page).toHaveURL(new RegExp(`/app/${route}(?:\\?|$)`));
      await expect(page.locator('main .animate-pulse')).toHaveCount(0);
      visited.push(`/app/${route}`);
    }
    for (const route of landingRoutes) {
      await page.goto(`/${route}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`/${route}(?:\\?|$)`));
      await expect(page.getByRole('status')).toHaveCount(0);
      visited.push(`/${route}`);
      if (route === 'docs/openapi') {
        const document = await page.evaluate(async () => {
          const response = await fetch('/openapi.json');
          return { status: response.status, document: await response.json() };
        });
        expect(document.status).toBe(200);
        expect(Object.keys(document.document.paths).length).toBeGreaterThan(0);
      }
    }
    expect(errors).toEqual([]);
    await testInfo.attach('offline-routes', {
      body: JSON.stringify({ language, registrations, visited }, null, 2),
      contentType: 'application/json',
    });
  });
}
