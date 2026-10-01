import { expect, test } from '@playwright/test';
import { dismissOnboardingTour } from './fixtures';

test('WebMCP registration follows consent, confirmation, privacy mode and reload', async ({
  page,
}) => {
  test.setTimeout(150000);
  await page.addInitScript(() => {
    const tools = new Map<
      string,
      {
        execute: (
          input: Record<string, unknown>,
          options: { signal: AbortSignal }
        ) => Promise<unknown>;
      }
    >();
    Object.assign(window, { __fluxbyTestTools: tools });
    Object.defineProperty(document, 'modelContext', {
      configurable: true,
      value: {
        registerTool: async (
          tool: {
            name: string;
            execute: (
              input: Record<string, unknown>,
              options: { signal: AbortSignal }
            ) => Promise<unknown>;
          },
          options: { signal: AbortSignal }
        ) => {
          if (tools.has(tool.name)) throw new Error('Duplicate tool');
          tools.set(tool.name, tool);
          options.signal.addEventListener(
            'abort',
            () => tools.delete(tool.name),
            {
              once: true,
            }
          );
        },
      },
    });
  });

  const registeredNames = () =>
    page.evaluate(() =>
      Array.from(
        (
          window as unknown as { __fluxbyTestTools: Map<string, unknown> }
        ).__fluxbyTestTools.keys()
      )
    );

  await page.goto('/app/');
  await page.getByRole('button', { name: /English|Engels/i }).click();
  await page.locator('input[type="text"]').fill('WebMCP test');
  await page.getByRole('button', { name: /^(Next|Volgende)/ }).click();
  await page.locator('input[type="password"]').nth(0).fill('test1234');
  await page.locator('input[type="password"]').nth(1).fill('test1234');
  await page.locator('button[type="submit"]').click();
  const unlock = page.getByRole('button', { name: 'Unlock', exact: true });
  const dashboard = page.getByRole('link', { name: 'Dashboard', exact: true });
  await expect(unlock.or(dashboard)).toBeVisible({ timeout: 30000 });
  if (await unlock.isVisible()) {
    await page.getByPlaceholder('Enter password').fill('test1234');
    await unlock.click();
  }
  await expect(dashboard).toBeVisible({ timeout: 60000 });
  await dismissOnboardingTour(page);
  expect(await registeredNames()).toEqual([]);

  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await page.getByRole('tab', { name: 'App settings' }).click();
  const settings = page.locator('[data-onboarding="settings-webmcp"]');
  await expect(settings).toContainText('Access disabled');
  await settings.getByRole('button', { name: 'Enable access' }).click();
  await expect.poll(async () => (await registeredNames()).length).toBe(20);

  const context = await page.evaluate(async () => {
    const tool = (
      window as unknown as {
        __fluxbyTestTools: Map<
          string,
          {
            execute: (
              input: Record<string, unknown>,
              options: { signal: AbortSignal }
            ) => Promise<unknown>;
          }
        >;
      }
    ).__fluxbyTestTools.get('fluxby_context');
    return tool?.execute({}, { signal: new AbortController().signal });
  });
  expect(context).toMatchObject({ language: 'en' });

  const write = page.evaluate(async () => {
    const tool = (
      window as unknown as {
        __fluxbyTestTools: Map<
          string,
          {
            execute: (
              input: Record<string, unknown>,
              options: { signal: AbortSignal }
            ) => Promise<unknown>;
          }
        >;
      }
    ).__fluxbyTestTools.get('fluxby_create_category');
    return tool?.execute(
      { name: 'WebMCP test category' },
      { signal: new AbortController().signal }
    );
  });
  await expect(page.getByRole('dialog')).toContainText(
    'Browser assistant change'
  );
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirm' })
    .click();
  const created = await write;
  expect(created).toHaveProperty('id');
  const categories = await page.evaluate(async () => {
    const tool = (
      window as unknown as {
        __fluxbyTestTools: Map<
          string,
          {
            execute: (
              input: Record<string, unknown>,
              options: { signal: AbortSignal }
            ) => Promise<unknown>;
          }
        >;
      }
    ).__fluxbyTestTools.get('fluxby_categories');
    return tool?.execute({}, { signal: new AbortController().signal });
  });
  expect(categories).toEqual(
    expect.arrayContaining([expect.objectContaining({ id: created.id })])
  );

  await page.locator('[data-onboarding="header-privacy-mode"]').click();
  await expect.poll(async () => (await registeredNames()).length).toBe(0);
  await page.locator('[data-onboarding="header-privacy-mode"]').click();
  expect(await registeredNames()).toEqual([]);

  await settings.getByRole('button', { name: 'Enable access' }).click();
  await expect.poll(async () => (await registeredNames()).length).toBe(20);
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await expect(unlock).toBeVisible({ timeout: 30000 });
  await page.getByPlaceholder('Enter password').fill('test1234');
  await unlock.click();
  await expect(dashboard).toBeVisible({ timeout: 60000 });
  expect(await registeredNames()).toEqual([]);
});

for (const language of ['en', 'nl'] as const) {
  test(`WebMCP help and developer pages render in ${language}`, async ({
    page,
  }) => {
    await page.addInitScript((selected) => {
      localStorage.setItem('fluxby.landing.language', selected);
    }, language);
    await page.goto('/help/webmcp');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      language === 'nl'
        ? 'Browserassistenten met WebMCP'
        : 'Browser assistants with WebMCP'
    );
    await page
      .getByRole('link', {
        name:
          language === 'nl'
            ? 'Bekijk de WebMCP-documentatie voor ontwikkelaars'
            : 'Read the WebMCP developer documentation',
      })
      .click();
    await expect(page).toHaveURL(/\/docs\/webmcp$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      language === 'nl'
        ? 'WebMCP voor de lokale webapp'
        : 'WebMCP for the local web app'
    );
    await expect(
      page.getByRole('cell', { name: 'fluxby_transactions', exact: true })
    ).toBeVisible();
  });
}
