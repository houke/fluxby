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
    const upload = async (
      name: string,
      date: string,
      description: string,
      lowercaseHeaders = false
    ) => {
      await page.locator('input[type="file"]').setInputFiles({
        name,
        mimeType: 'text/csv',
        buffer: Buffer.from(
          `${lowercaseHeaders ? 'datum;bedrag;omschrijving;rekening' : 'Datum;Bedrag;Omschrijving;Rekening'}\n${date};-12,50;${description};NL91ABNA0417164300`
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
    await expect(page.getByRole('dialog')).toContainText(
      nl ? '12,50' : '12.50'
    );
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
    await upload('qa-second.csv', '01-10-2026', 'QA second purchase', true);
    await page
      .getByLabel(nl ? 'Opgeslagen importprofiel' : 'Saved import profile', {
        exact: true,
      })
      .click();
    await page
      .getByRole('option', { name: 'QA saved layout', exact: true })
      .click();
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
    // A single amount column is optional when separate debit/credit columns
    // are configured. This previously enabled Start import but did nothing.
    await page.locator('input[type="file"]').setInputFiles({
      name: 'qa-debit-credit.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(
        'Datum;Af;Bij;Omschrijving;Rekening\n02-10-2026;9,99;;QA debit purchase;NL91ABNA0417164300\n02-10-2026;;20,00;QA credit repayment;NL91ABNA0417164300'
      ),
    });
    const mappingDialog = page.getByRole('dialog');
    await expect(mappingDialog).toBeVisible();
    await mappingDialog
      .locator('[data-onboarding="import-tools"] summary')
      .click();
    await mappingDialog
      .getByRole('combobox', {
        name: nl ? 'Kolom afschrijvingen' : 'Debit column',
        exact: true,
      })
      .click();
    await page.getByRole('option', { name: 'Af', exact: true }).click();
    await mappingDialog
      .getByRole('combobox', {
        name: nl ? 'Kolom bijschrijvingen' : 'Credit column',
        exact: true,
      })
      .click();
    await page.getByRole('option', { name: 'Bij', exact: true }).click();
    await expect(mappingDialog).toContainText(nl ? '9,99' : '9.99');
    await expect(mappingDialog).toContainText(nl ? '20,00' : '20.00');
    await mappingDialog
      .getByRole('button', { name: 'Start import', exact: true })
      .click();
    await expect(
      page
        .getByRole('dialog')
        .getByText(
          nl
            ? '2 transacties geïmporteerd, 0 overgeslagen'
            : '2 transactions imported, 0 skipped'
        )
    ).toBeVisible({ timeout: 30000 });
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^(Close|Sluiten)$/, exact: true })
      .first()
      .click();
    await page
      .getByRole('link', {
        name: nl ? 'Transacties' : 'Transactions',
        exact: true,
      })
      .click();
    const debitRow = page
      .locator('[data-onboarding="transaction-row"]')
      .filter({ hasText: 'QA debit purchase' });
    const creditRow = page
      .locator('[data-onboarding="transaction-row"]')
      .filter({ hasText: 'QA credit repayment' });
    await expect(debitRow).toContainText(nl ? '€ -9,99' : '-€9.99');
    await expect(creditRow).toContainText(nl ? '€ 20,00' : '€20.00');
    await page.getByRole('link', { name: /^import/i }).click();
    await page.screenshot({
      path: `.nexus/tmp/import-workflows-${language}.png`,
      fullPage: true,
    });
  });
}
