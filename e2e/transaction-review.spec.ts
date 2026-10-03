import { readFile, unlink } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { dismissOnboardingTour } from './fixtures';

for (const language of ['nl', 'en'] as const) {
  test(`review, filtered CSV and manually created expense bill work (${language})`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    const nl = language === 'nl';
    await page.goto('/app/');
    await page
      .getByRole('button', {
        name: nl ? /Nederlands|Dutch/i : /English|Engels/i,
      })
      .click();
    await page
      .locator('input[type="text"]')
      .fill('Disposable transaction review');
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
    await dismissOnboardingTour(page);
    await page
      .getByRole('link', {
        name: nl ? 'Transacties' : 'Transactions',
        exact: true,
      })
      .click();
    for (const [name, amount] of [
      ['QA review household bill', '24.50'],
      ['QA review second purchase', '8.25'],
    ] as const) {
      if (name === 'QA review second purchase') {
        await page
          .getByRole('button', {
            name: nl ? /Schakel naar donkere modus/ : /Switch to dark mode/,
          })
          .click();
        await expect(page.locator('html')).toHaveClass(/dark/);
      }
      await page
        .getByRole('button', {
          name: nl ? 'Transactie toevoegen' : 'Add transaction',
          exact: true,
        })
        .click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('combobox', { name: 'Type', exact: true }).click();
      await page
        .getByRole('option', {
          name: nl ? 'Uitgaven' : 'Expenses',
          exact: true,
        })
        .click();
      await dialog
        .getByPlaceholder(nl ? '0,00' : '0.00', { exact: true })
        .fill(amount);
      await dialog
        .getByPlaceholder(
          nl
            ? 'Omschrijving van de transactie...'
            : 'Description of the transaction...'
        )
        .fill(name);
      await dialog
        .getByRole('combobox', {
          name: nl ? 'Rekening' : 'Account',
          exact: true,
        })
        .click();
      await page.getByRole('option').nth(1).click();
      // Each language saves one expense in light mode and another in dark mode.
      // Include the actual open modal after its transition settles.
      await expect(dialog).toHaveCSS('opacity', '1');
      const accessibility = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .include('[role="dialog"]')
        .analyze();
      expect(
        accessibility.violations.map(({ id, nodes }) => ({
          id,
          nodes: nodes.map(({ target, failureSummary }) => ({
            target,
            failureSummary,
          })),
        }))
      ).toEqual([]);
      await dialog
        .getByRole('button', { name: nl ? 'Toevoegen' : 'Add', exact: true })
        .click();
      await expect(dialog).not.toBeVisible();
    }
    await page
      .getByPlaceholder(
        nl
          ? 'Zoek op omschrijving, IBAN of categorie...'
          : 'Search by description, IBAN or category...'
      )
      .fill('QA review');
    await expect(
      page.locator('[data-onboarding="transaction-row"]')
    ).toHaveCount(2);
    const review = page.locator('[data-onboarding="transaction-review"]');
    const downloaded = page.waitForEvent('download');
    await review
      .getByRole('button', {
        name: nl ? 'Gefilterde CSV downloaden' : 'Download filtered CSV',
      })
      .click();
    const download = await downloaded;
    const exportPath = `.nexus/tmp/transaction-review-export-${language}.csv`;
    await download.saveAs(exportPath);
    try {
      const csv = await readFile(exportPath, 'utf8');
      expect(csv).toContain(
        nl ? '"Datum";"Bedrag";"Valuta"' : '"Date","Amount","Currency"'
      );
      expect(csv.replace(/^\uFEFF/, '').split('\r\n')).toHaveLength(3);
      expect(csv).toContain('QA review household bill');
      expect(csv).toContain(nl ? '"-24,50"' : '"-24.50"');
    } finally {
      await unlink(exportPath);
    }
    await review
      .getByRole('button', { name: nl ? 'Controle-inbox' : 'Review inbox' })
      .click();
    await expect(review.getByRole('article')).toBeVisible();
    const undoName = nl
      ? /Laatste beslissing herstellen/
      : /Undo last decision/;
    for (let count = 1; count <= 2; count++) {
      const later = review.getByRole('button', {
        name: nl ? 'Later (7 dagen)' : 'Later (7 days)',
        exact: true,
      });
      await expect(later).toBeEnabled();
      await later.click();
      await expect(
        review.getByRole('button', { name: undoName })
      ).toContainText(`(${count})`);
      await expect(later).toBeEnabled();
    }
    for (let count = 1; count >= 0; count--) {
      const undo = review.getByRole('button', { name: undoName });
      await expect(undo).toBeEnabled();
      await undo.click();
      if (count) await expect(undo).toContainText(`(${count})`);
      else await expect(undo).toBeDisabled();
    }
    await review
      .getByRole('button', {
        name: nl ? 'Vaste last maken' : 'Create recurring bill',
        exact: true,
      })
      .click();
    await review
      .getByRole('combobox', {
        name: nl ? 'Uitgave voor vaste last' : 'Expense for recurring bill',
      })
      .click();
    await page
      .getByRole('option', { name: /QA review household bill/ })
      .click();
    await review
      .getByRole('combobox', {
        name: nl ? 'Frequentie' : 'Frequency',
        exact: true,
      })
      .click();
    await page
      .getByRole('option', {
        name: nl ? 'Maandelijks' : 'Monthly',
        exact: true,
      })
      .click();
    await review
      .getByRole('button', {
        name: nl ? 'Vaste last opslaan' : 'Save recurring bill',
      })
      .click();
    await expect(
      page.getByText(nl ? 'Vaste last toegevoegd' : 'Recurring bill added', {
        exact: true,
      })
    ).toBeVisible();
    await page.getByRole('link', { name: 'Planning', exact: true }).click();
    await page
      .getByRole('tab', {
        name: nl ? 'Huishoudplanning' : 'Household planning',
        exact: true,
      })
      .click();
    const household = page.locator('[data-onboarding="household-planning"]');
    await household
      .getByRole('button', {
        name: nl ? 'Plan toevoegen' : 'Add plan',
        exact: true,
      })
      .click();
    const plan = page.getByRole('dialog');
    await plan
      .getByRole('combobox', { name: nl ? 'Soort' : 'Type', exact: true })
      .click();
    await page
      .getByRole('option', { name: nl ? 'Uitgave' : 'Expense', exact: true })
      .click();
    await plan
      .getByRole('combobox', {
        name: nl ? 'Vervangt terugkerende last' : 'Replaces recurring bill',
        exact: true,
      })
      .click();
    // This selector only includes active expense patterns (avg_amount < 0).
    await expect(
      page.getByRole('option', {
        name: 'QA review household bill',
        exact: true,
      })
    ).toBeVisible();
    await page
      .getByRole('option', { name: 'QA review household bill', exact: true })
      .click();
    await page.screenshot({
      path: `.nexus/tmp/transaction-review-${language}.png`,
      fullPage: true,
    });
  });
}
