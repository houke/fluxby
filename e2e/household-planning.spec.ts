import { expect, test } from '@playwright/test';
import { dismissOnboardingTour } from './fixtures';

for (const language of ['nl', 'en'] as const) {
  test(`Dated household plans, weekly review and snapshots persist (${language})`, async ({
    page,
  }) => {
    test.setTimeout(150000);
    const nl = language === 'nl';
    await page.goto('/app/');
    await page
      .getByRole('button', {
        name: nl ? /Nederlands|Dutch/i : /English|Engels/i,
      })
      .click();
    await page.locator('input[type="text"]').fill('Planning workflow test');
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
    await page.getByRole('link', { name: 'Planning', exact: true }).click();
    const householdTab = page.getByRole('tab', {
      name: nl ? 'Huishoudplanning' : 'Household planning',
      exact: true,
    });
    await householdTab.click();
    const household = page.locator('[data-onboarding="household-planning"]');
    await expect(household).toBeVisible();
    await expect(household.getByRole('alert')).toHaveCount(0);
    const dateOffset = (days: number) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    for (const kind of ['income', 'expense'] as const) {
      await household
        .getByRole('button', {
          name: nl ? 'Plan toevoegen' : 'Add plan',
          exact: true,
        })
        .click();
      const dialog = page.getByRole('dialog');
      await dialog
        .getByLabel(nl ? 'Naam' : 'Name', { exact: true })
        .fill(kind === 'income' ? 'QA four-week income' : 'QA annual bill');
      await dialog
        .getByLabel(nl ? 'Soort' : 'Type', { exact: true })
        .selectOption(kind);
      await dialog
        .getByLabel(nl ? 'Bedrag' : 'Amount', { exact: true })
        .fill(kind === 'income' ? '1400' : '240');
      await dialog
        .getByLabel(nl ? 'Eerste betaaldatum' : 'First payment date', {
          exact: true,
        })
        .fill(dateOffset(kind === 'income' ? 7 : 20));
      await dialog
        .getByLabel(nl ? 'Herhaling' : 'Frequency', { exact: true })
        .selectOption(kind === 'income' ? 'fourweekly' : 'yearly');
      if (kind === 'expense')
        await dialog
          .getByLabel(nl ? 'Al gereserveerd' : 'Already reserved', {
            exact: true,
          })
          .fill('100');
      await dialog
        .getByRole('button', { name: nl ? 'Opslaan' : 'Save', exact: true })
        .click();
      await expect(dialog).not.toBeVisible();
      await expect(
        household.getByText(
          kind === 'income' ? 'QA four-week income' : 'QA annual bill',
          { exact: false }
        )
      ).toBeVisible();
    }
    await household
      .getByLabel(nl ? 'Prognoseperiode' : 'Forecast period', { exact: true })
      .selectOption('90');
    await expect(
      household.getByLabel(nl ? 'Prognoseperiode' : 'Forecast period', {
        exact: true,
      })
    ).toHaveValue('90');
    const forecast = page.locator('[data-onboarding="daily-forecast"]');
    await expect(forecast).toContainText(
      nl ? 'Volgende geplande inkomsten' : 'Next planned income'
    );
    await household
      .getByRole('button', {
        name: nl ? 'Momentopname van vandaag bewaren' : 'Save today’s snapshot',
        exact: true,
      })
      .click();
    await expect(household).not.toContainText(
      nl ? 'Bewaar je eerste momentopname' : 'Save your first snapshot'
    );
    await expect(household).toContainText(
      nl
        ? 'Nog geen volledige momentopnames'
        : 'Complete snapshots for both today'
    );
    const weekly = page.locator('[data-onboarding="weekly-review"]');
    for (const checkbox of await weekly.getByRole('checkbox').all()) {
      await checkbox.check();
      await expect(checkbox).toBeChecked();
      await expect(checkbox).toBeEnabled();
    }
    await expect(weekly).toContainText(
      nl ? '1 aaneengesloten afgeronde weken' : '1 consecutive completed weeks'
    );
    await page.reload();
    await expect(unlock).toBeVisible({ timeout: 30000 });
    await page
      .getByPlaceholder(nl ? 'Wachtwoord invoeren' : 'Enter password')
      .fill('test1234');
    await unlock.click();
    await householdTab.click();
    await expect(
      household.getByText('QA four-week income', { exact: false })
    ).toBeVisible();
    await expect(household).toContainText(
      nl ? 'Elke vier weken' : 'Every four weeks'
    );
    await expect(household).toContainText(
      nl ? 'Maandelijks nog opzijzetten' : 'Still to set aside per month'
    );
    await expect(weekly.getByRole('checkbox').first()).toBeChecked();
    await expect(household).not.toContainText(
      nl ? 'Bewaar je eerste momentopname' : 'Save your first snapshot'
    );
    await expect(household.getByRole('alert')).toHaveCount(0);
    await page.screenshot({
      path: `.nexus/tmp/household-planning-${language}.png`,
      fullPage: true,
    });
  });
}
