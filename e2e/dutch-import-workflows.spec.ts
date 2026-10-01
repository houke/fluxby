import { expect, test } from '@playwright/test';
import { dismissOnboardingTour } from './fixtures';

for (const language of ['nl', 'en'] as const) {
  test(`Dutch import profiles, normalized preview and exact batch undo (${language})`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    const nl = language === 'nl';
    await page.goto('/app/');
    await page
      .getByRole('button', {
        name: nl ? /Nederlands|Dutch/i : /English|Engels/i,
      })
      .click();
    await page.locator('input[type="text"]').fill('Import workflow test');
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

    await expect(
      page.getByRole('link', { name: 'Dashboard', exact: true })
    ).toBeVisible({ timeout: 60000 });
    await dismissOnboardingTour(page);
    await page.getByRole('link', { name: /^import/i }).click();
    const upload = async (name: string, date: string, description: string) => {
      await page.locator('input[type="file"]').setInputFiles({
        name,
        mimeType: 'text/csv',
        buffer: Buffer.from(
          `Datum;Bedrag;Omschrijving;Rekening\n${date};-12,50;${description};NL91ABNA0417164300`
        ),
      });
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.locator('[data-onboarding="import-tools"] summary').click();
    };
    await upload('qa-first.csv', '30-09-2026', 'QA first purchase');
    await page
      .getByLabel(nl ? 'Naam importprofiel' : 'Import profile name', {
        exact: true,
      })
      .fill('QA saved layout');
    await page
      .getByRole('button', {
        name: nl ? 'Importprofiel opslaan' : 'Save import profile',
        exact: true,
      })
      .click();
    await expect(
      page.getByText(nl ? 'Importprofiel opgeslagen' : 'Import profile saved', {
        exact: true,
      })
    ).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('2026-09-30');
    await expect(page.getByRole('dialog')).toContainText('-12,50');
    await page
      .getByRole('button', {
        name: nl ? 'Start import' : 'Start import',
        exact: true,
      })
      .click();
    await expect(
      page
        .getByRole('dialog')
        .getByText(
          nl
            ? '1 transacties geïmporteerd, 0 overgeslagen'
            : '1 transactions imported, 0 skipped'
        )
    ).toBeVisible({ timeout: 30000 });
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^(Close|Sluiten)$/, exact: true })
      .first()
      .click();
    await upload('qa-second.csv', '01-10-2026', 'QA second purchase');
    await page
      .getByLabel(nl ? 'Opgeslagen importprofiel' : 'Saved import profile', {
        exact: true,
      })
      .selectOption({ label: 'QA saved layout' });
    await expect(
      page.getByText(
        nl ? 'Importprofiel toegepast' : 'Import profile applied',
        { exact: true }
      )
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Start import', exact: true })
      .click();
    await expect(
      page.getByRole('dialog').getByText(/qa-second.csv/)
    ).toBeVisible({ timeout: 30000 });
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^(Close|Sluiten)$/, exact: true })
      .first()
      .click();
    const recovery = page.locator('[data-onboarding="import-recovery"]');
    await recovery.locator('details summary').click();
    const undoName = nl ? 'Import ongedaan maken' : 'Undo import';
    const firstBatch = recovery
      .locator('div')
      .filter({
        has: page.getByRole('button', { name: undoName, exact: true }),
      })
      .filter({ hasText: 'qa-first.csv' })
      .last();
    await firstBatch
      .getByRole('button', { name: undoName, exact: true })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: undoName, exact: true })
      .click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(
      recovery.getByRole('button', { name: undoName, exact: true })
    ).toHaveCount(1);
    await expect(recovery).toContainText('qa-second.csv');
    await expect(
      recovery.getByRole('button', {
        name: nl ? 'Herstelbestand downloaden' : 'Download recovery file',
      })
    ).toHaveCount(2);
    await page.screenshot({
      path: `.nexus/tmp/import-workflows-${language}.png`,
      fullPage: true,
    });
  });
}
