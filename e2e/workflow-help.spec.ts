import { expect, test } from '@playwright/test';

const articles = [
  'bank-connection',
  'transactions',
  'planning',
  'budgeting',
  'categories',
  'accounts',
];

for (const language of ['nl', 'en'] as const) {
  test(`workflow help remains reachable and readable (${language})`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/help/bank-connection');
    await page
      .getByRole('button', { name: language.toUpperCase(), exact: true })
      .click();
    const headings = new Map<string, string>();
    for (const width of [1440, 393]) {
      await page.setViewportSize({ width, height: 900 });
      for (const article of articles) {
        const response = await page.goto(`/help/${article}`);
        // GitHub Pages serves the SPA handoff through 404.html on direct routes.
        // Confirm the restored article below instead of rejecting that handoff.
        if (process.env.PLAYWRIGHT_PRODUCTION === 'true')
          expect([200, 404]).toContain(response?.status());
        else expect(response?.ok()).toBe(true);
        const heading = page.getByRole('heading', { level: 1 });
        await expect(heading).toBeVisible();
        await expect(page).toHaveURL(new RegExp(`/help/${article}(?:\\?|$)`));
        const name = await heading.innerText();
        expect(name.trim().length).toBeGreaterThan(0);
        if (headings.has(article)) expect(name).toBe(headings.get(article));
        headings.set(article, name);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1
          ),
          `${article}/${language}/${width}: horizontal overflow`
        ).toBe(true);
        await expect(page.locator('main')).not.toContainText(
          /\bundefined\b|\[object Object\]/
        );
      }
    }
    expect(errors).toEqual([]);
  });
}
