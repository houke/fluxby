import { mkdir, writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { dismissOnboardingTour } from './fixtures';

const routes = [
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

async function navigate(page: Page, route: string) {
  if (new URL(page.url()).pathname.replace(/\/$/, '') !== `/app/${route}`) {
    const links = page.locator(`a[href='/app/${route}']`);
    if (!(await links.filter({ visible: true }).first().isVisible())) {
      await page.getByRole('button', { name: /^(More|Meer)$/ }).click();
    }
    await links.filter({ visible: true }).first().click();
  }
  await expect(page).toHaveURL(new RegExp(`/app/${route}(?:\\?|$)`));
  await expect(page.locator('main h1')).toBeVisible();
  // Allow route transitions to settle before checking asynchronously mounted data.
  await page.waitForTimeout(650);
  await expect(page.locator('main .animate-pulse')).toHaveCount(0, {
    timeout: 15000,
  });
  if (route === 'addressbook') {
    await expect(
      page
        .locator(
          '[data-onboarding="addressbook-contact"], [data-onboarding="addressbook-merged-contact"]'
        )
        .first()
    ).toBeVisible();
  }
  if (route === 'transactions') {
    await expect(
      page
        .locator(
          '[data-onboarding="transaction-row"], main button.group.items-start'
        )
        .first()
    ).toBeVisible();
  }
}

async function captureContent(page: Page, path: string) {
  const main = page.locator('main');
  await main.evaluate((element) => element.scrollTo({ top: 0 }));
  await page.screenshot({ path: `${path}.png`, fullPage: true });
  const height = await main.evaluate((element) => ({
    content: element.scrollHeight,
    viewport: element.clientHeight,
  }));
  if (height.content > height.viewport * 1.5) {
    await main.evaluate((element) =>
      element.scrollTo({ top: element.scrollHeight / 2 })
    );
    await page.screenshot({ path: `${path}-middle.png`, fullPage: true });
  }
  if (height.content > height.viewport + 1) {
    await main.evaluate((element) =>
      element.scrollTo({ top: element.scrollHeight })
    );
    await page.screenshot({ path: `${path}-bottom.png`, fullPage: true });
  }
  await main.evaluate((element) => element.scrollTo({ top: 0 }));
}

for (const language of ['nl', 'en'] as const) {
  test(`all app routes and settings remain usable across themes and widths (${language})`, async ({
    page,
  }) => {
    test.setTimeout(360000);
    page.setDefaultTimeout(15000);
    const nl = language === 'nl';
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/app/');
    await page
      .getByRole('button', {
        name: nl ? /Nederlands|Dutch/i : /English|Engels/i,
      })
      .click();
    await page
      .locator('input[type="text"]')
      .fill('Disposable app style review');
    await page.getByRole('button', { name: /^(Next|Volgende)/ }).click();
    await page.locator('input[type="password"]').nth(0).fill('test1234');
    await page.locator('input[type="password"]').nth(1).fill('test1234');
    await page.locator('button[type="submit"]').click();
    const unlock = page.getByRole('button', {
      name: nl ? 'Ontgrendelen' : 'Unlock',
      exact: true,
    });
    const dashboard = page.getByRole('link', {
      name: 'Dashboard',
      exact: true,
    });
    await expect(unlock.or(dashboard)).toBeVisible({ timeout: 90000 });
    if (await unlock.isVisible()) {
      await page
        .getByPlaceholder(nl ? 'Wachtwoord invoeren' : 'Enter password')
        .fill('test1234');
      await unlock.click();
    }
    await expect(dashboard).toBeVisible({ timeout: 60000 });
    // A fresh profile's tour starts after asynchronous demo initialization.
    await expect(
      page.getByRole('button', { name: /let's get started|aan de slag/i })
    ).toBeVisible({ timeout: 60000 });
    await dismissOnboardingTour(page);
    // Completing first-run setup may return the disposable profile to its lock.
    await expect(page.locator('main h1').or(unlock)).toBeVisible({
      timeout: 30000,
    });
    if (await unlock.isVisible()) {
      await page
        .getByPlaceholder(nl ? 'Wachtwoord invoeren' : 'Enter password')
        .fill('test1234');
      await unlock.click();
    }
    await expect(page.locator('main h1')).toBeVisible({ timeout: 30000 });
    const snapshotRoot = '.nexus/tmp/full-app-review/screenshots';
    await mkdir(snapshotRoot, { recursive: true });
    const findings: unknown[] = [];
    const layouts: unknown[] = [];
    for (const width of [1440, 393]) {
      await page.setViewportSize({
        width,
        height: width === 1440 ? 1000 : 851,
      });
      for (const theme of ['light', 'dark']) {
        const dark = await page
          .locator('html')
          .evaluate((html) => html.classList.contains('dark'));
        if (dark !== (theme === 'dark')) {
          await page.locator('[data-onboarding="header-theme-toggle"]').click();
        }
        await expect(page.locator('html')).toHaveClass(
          theme === 'dark' ? /dark/ : /^(?!.*dark)/
        );
        for (const route of routes) {
          await navigate(page, route);
          const layout = await page.locator('main').evaluate((main) => {
            const rect = main.getBoundingClientRect();
            const headerElement = document.querySelector('header');
            if (!headerElement) throw new Error('Missing app header');
            const header = headerElement.getBoundingClientRect();
            return {
              content: main.scrollWidth,
              viewport: main.clientWidth,
              scrollLeft: main.scrollLeft,
              left: rect.left,
              right: rect.right,
              headerLeft: header.left,
              windowScroll: window.scrollX,
              ancestorScroll: (() => {
                const ancestors = [];
                let element = main.parentElement;
                while (element) {
                  if (element.scrollLeft !== 0)
                    ancestors.push({
                      tag: element.tagName,
                      classes: element.className,
                      scrollLeft: element.scrollLeft,
                    });
                  element = element.parentElement;
                }
                return ancestors;
              })(),
              offenders: [...main.querySelectorAll<HTMLElement>('*')]
                .filter(
                  (element) =>
                    element.getBoundingClientRect().right > rect.right + 1
                )
                .slice(0, 10)
                .map((element) => ({
                  tag: element.tagName,
                  classes: element.className,
                })),
            };
          });
          layouts.push({ language, theme, width, route, ...layout });
          expect
            .soft(
              layout.left,
              `${language}/${theme}/${width}/${route}: panel shifted left`
            )
            .toBeGreaterThanOrEqual(0);
          expect
            .soft(
              layout.headerLeft,
              `${language}/${theme}/${width}/${route}: header shifted left`
            )
            .toBeGreaterThanOrEqual(0);
          expect
            .soft(
              layout.scrollLeft,
              `${language}/${theme}/${width}/${route}: retained horizontal scrolling`
            )
            .toBe(0);
          expect
            .soft(
              layout.ancestorScroll,
              `${language}/${theme}/${width}/${route}: ancestor retained horizontal scrolling`
            )
            .toEqual([]);
          expect
            .soft(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1
              ),
              `${language}/${theme}/${width}/${route}: document overflows horizontally`
            )
            .toBe(true);
          expect
            .soft(
              await page
                .locator('main')
                .evaluate((main) => main.scrollWidth <= main.clientWidth + 1),
              `${language}/${theme}/${width}/${route}: content overflows horizontally`
            )
            .toBe(true);
          await captureContent(
            page,
            `${snapshotRoot}/${language}-${theme}-${width}-${route}`
          );
          const scan = async (view: string) => {
            const result = await new AxeBuilder({ page })
              .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
              .analyze();
            findings.push(
              ...result.violations.map((violation) => ({
                language,
                theme,
                width,
                route,
                view,
                id: violation.id,
                nodes: violation.nodes.map((node) => ({
                  html: node.html,
                  reason: node.failureSummary,
                  target: node.target,
                })),
              }))
            );
          };
          await scan('default');
          if (route === 'settings' || route === 'planning') {
            const tabs = page.locator('main [role="tab"]');
            const names = await tabs.allTextContents();
            for (const name of names) {
              await page
                .getByRole('tab', { name: name.trim(), exact: true })
                .click();
              await page.waitForTimeout(300);
              await expect(page.getByRole('tabpanel').first()).toBeVisible();
              await expect(page.locator('main .animate-pulse')).toHaveCount(0, {
                timeout: 15000,
              });
              expect
                .soft(
                  await page
                    .locator('main')
                    .evaluate(
                      (main) => main.scrollWidth <= main.clientWidth + 1
                    ),
                  `${language}/${theme}/${width}/${route}/${name.trim()}: tab content overflows horizontally`
                )
                .toBe(true);
              await scan(name.trim());
              await captureContent(
                page,
                `${snapshotRoot}/${language}-${theme}-${width}-${route}-tab-${names.indexOf(name)}`
              );
            }
          }
        }
      }
    }
    await writeFile(
      `.nexus/tmp/full-app-review/findings-${language}.json`,
      JSON.stringify({ errors, findings, layouts }, null, 2)
    );
    expect(errors).toEqual([]);
    expect(findings).toEqual([]);
  });
}
