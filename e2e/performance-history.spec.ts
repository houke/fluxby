import { expect, type Page } from '@playwright/test';
import { test } from './browser-test';
import { setupApp, dismissOnboardingTour, unlockTestApp } from './fixtures';
import { en } from '../apps/web/src/lib/i18n/en';

const historyCount = 61;
const merchant = 'Performance history merchant';
const historyDescription = /^Performance history record \d{3}$/;

async function createEncryptedApp(page: Page) {
  await setupApp(page);
  await dismissOnboardingTour(page);
  await page.getByRole('link', { name: 'Import', exact: true }).first().click();
  await expect(
    page.locator('[data-onboarding="import-dropzone"]')
  ).toBeVisible();
}

async function switchProfile(page: Page, from: string, to: string) {
  await page
    .getByRole('button', {
      name: `${en.profileSwitcher.currentProfile}: ${from}`,
      exact: true,
    })
    .click();
  await page.getByRole('menuitem', { name: to, exact: true }).click();
  // Check immediately after the switch, before a retry could hide a stale render.
  expect(await page.getByText(historyDescription).count()).toBe(0);
  await expect(
    page.getByRole('button', {
      name: `${en.profileSwitcher.currentProfile}: ${to}`,
      exact: true,
    })
  ).toBeVisible();
}

async function visitEveryHistoryPage(page: Page) {
  const records = page.getByText(historyDescription);
  const visited = new Set<string>();
  const firstPage: string[] = [];
  let maxRenderedRows = 0;
  const pageCount = Math.ceil(historyCount / 20);
  for (let index = 0; index < pageCount; index++) {
    const start = index * 20 + 1;
    const end = Math.min((index + 1) * 20, historyCount);
    await expect(
      page.getByText(`${start}–${end} / ${historyCount}`)
    ).toBeVisible();
    await expect(records).toHaveCount(end - start + 1);
    const descriptions = await records.allTextContents();
    maxRenderedRows = Math.max(maxRenderedRows, descriptions.length);
    descriptions.forEach((description) => visited.add(description));
    if (index === 0) firstPage.push(...descriptions);
    const next = page.getByRole('button', {
      name: en.common.next,
      exact: true,
    });
    if (index === pageCount - 1) await expect(next).toBeDisabled();
    else await next.click();
  }
  expect(visited.size).toBe(historyCount);
  for (let index = pageCount - 2; index >= 0; index--) {
    await page
      .getByRole('button', { name: en.common.previous, exact: true })
      .click();
    const start = index * 20 + 1;
    const end = Math.min((index + 1) * 20, historyCount);
    await expect(
      page.getByText(`${start}–${end} / ${historyCount}`)
    ).toBeVisible();
    await expect(records).toHaveCount(end - start + 1);
  }
  await expect(
    page.getByRole('button', { name: en.common.previous, exact: true })
  ).toBeDisabled();
  expect(await records.allTextContents()).toEqual(firstPage);
  return { reachable: visited.size, maxRenderedRows, pages: pageCount };
}

test.describe('Large-history performance regressions', () => {
  test.setTimeout(120000);
  test.skip(
    process.env.PLAYWRIGHT_PRODUCTION === 'true',
    'Requires Vite source-module access to seed the disposable database'
  );

  test('Spotlight retains contact stats, histories stay bounded and profile changes clear details', async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await createEncryptedApp(page);

    // This dev-server fixture seeds only this test's disposable browser database.
    // Exercise real SQLite, profile caches and rendered controls without a bulk import.
    const fixture = await page.evaluate(
      async ({ merchant, count }) => {
        const { getDataService, getGlobalDatabase } =
          await import('/app/src/lib/db-singleton.ts');
        const service = getDataService();
        const primary = await service.createProfile({
          name: 'History primary',
          type: 'personal',
          language: 'en',
        });
        const comparison = await service.createProfile({
          name: 'History comparison',
          type: 'business',
          language: 'en',
        });
        const account = await service.createAccount({
          name: 'History account',
          iban: 'NL91ABNA0417164300',
          type: 'checking',
          bank: 'ing',
          profileId: primary.id,
        });
        const db = getGlobalDatabase();
        const contactId = crypto.randomUUID();
        const patternId = crypto.randomUUID();
        const opposingIban = 'NL20INGB0001234567';
        const now = Date.now();
        const lastDate = new Date(now).toISOString().slice(0, 10);
        await db.transactionAsync(async (transaction: typeof db) => {
          await transaction.runAsync(
            `INSERT INTO address_book
             (id, iban, name, profile_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [contactId, opposingIban, merchant, primary.id, now, now]
          );
          await transaction.runAsync(
            `INSERT INTO contact_ibans
             (id, contact_id, iban, is_primary, created_at, updated_at)
             VALUES (?, ?, ?, 1, ?, ?)`,
            [crypto.randomUUID(), contactId, opposingIban, now, now]
          );
          for (let index = 0; index < count; index++) {
            const id = crypto.randomUUID();
            const date = new Date(now - (count - index - 1) * 30 * 86400000)
              .toISOString()
              .slice(0, 10);
            await transaction.runAsync(
              `INSERT INTO transactions
               (id, date, amount, type, description, merchant_name, account_id,
                opposing_account_iban, opposing_account_name, address_book_id,
                import_hash, profile_id, created_at, updated_at)
               VALUES (?, ?, -10, 'expense', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                id,
                date,
                `Performance history record ${String(index + 1).padStart(3, '0')}`,
                merchant,
                account.id,
                opposingIban,
                merchant,
                contactId,
                `history-fixture-${id}`,
                primary.id,
                now,
                now,
              ]
            );
          }
          await transaction.runAsync(
            `INSERT INTO recurring_patterns
             (id, opposing_iban, merchant_name, pattern_type, avg_amount,
              last_amount, last_date, next_expected_date, is_active,
              is_confirmed, is_variable, transaction_count, profile_id, updated_at)
             VALUES (?, ?, ?, 'monthly', -10, -10, ?, ?, 1, 1, 0, ?, ?, ?)`,
            [
              patternId,
              opposingIban,
              merchant,
              lastDate,
              lastDate,
              count,
              primary.id,
              now,
            ]
          );
        });
        return { primaryName: primary.name, comparisonName: comparison.name };
      },
      { merchant, count: historyCount }
    );

    // Refresh the profile list after creating the disposable fixtures outside React.
    // Reload also proves the password unlock and encrypted database persist.
    await page.reload();
    await expect(
      page.getByRole('button', { name: 'Unlock', exact: true })
    ).toBeVisible({ timeout: 30000 });
    await unlockTestApp(page);
    await expect(
      page.locator('[data-onboarding="import-dropzone"]')
    ).toBeVisible();
    await switchProfile(page, 'Demo', fixture.primaryName);
    let encryptedOpfs: boolean | null = null;
    if (new URL(page.url()).hostname === 'fluxby.local') {
      encryptedOpfs = await page.evaluate(async () => {
        const root = await navigator.storage.getDirectory();
        const file = await (await root.getFileHandle('fluxby.db')).getFile();
        return (
          file.size > 0 &&
          !(await file.slice(0, 16).text()).startsWith('SQLite format 3')
        );
      });
      expect(encryptedOpfs).toBe(true);
    }

    // Populate the shared contact cache through Spotlight before visiting AddressBook.
    await page.keyboard.press('Control+k');
    const spotlight = page.getByRole('dialog');
    await spotlight.getByRole('combobox').fill(merchant);
    const contactGroup = spotlight
      .locator('[cmdk-group]')
      .filter({ hasText: en.spotlight.contacts });
    await expect(
      contactGroup.getByText(merchant, { exact: true })
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(spotlight).not.toBeVisible();
    await page.locator('a[href="/app/addressbook"]').first().click();
    const contact = page.locator('[data-onboarding="addressbook-contact"]');
    await expect(contact.getByText(merchant, { exact: true })).toBeVisible();
    await expect(
      contact.getByText(
        `${historyCount} ${en.settings.addressBook.transactions}`,
        { exact: true }
      )
    ).toBeVisible();
    await contact
      .getByRole('button', {
        name: en.addressBook.showTransactions,
        exact: true,
      })
      .click();
    const contactHistory = await visitEveryHistoryPage(page);
    await page
      .getByRole('button', { name: en.common.next, exact: true })
      .click();
    await expect(page.getByText(`21–40 / ${historyCount}`)).toBeVisible();
    await switchProfile(page, fixture.primaryName, fixture.comparisonName);
    await switchProfile(page, fixture.comparisonName, fixture.primaryName);
    await expect(contact.getByText(merchant, { exact: true })).toBeVisible();
    await contact
      .getByRole('button', {
        name: en.addressBook.showTransactions,
        exact: true,
      })
      .click();
    await expect(page.getByText(`1–20 / ${historyCount}`)).toBeVisible();
    await expect(
      page.getByRole('button', { name: en.common.previous, exact: true })
    ).toBeDisabled();

    await page.locator('a[href="/app/subscriptions"]').first().click();
    await expect(page.getByText(merchant, { exact: true })).toBeVisible();
    await page
      .getByRole('button', {
        name: en.subscriptions.showTransactions,
        exact: true,
      })
      .click();
    const subscriptionHistory = await visitEveryHistoryPage(page);
    await page
      .getByRole('button', { name: en.common.next, exact: true })
      .click();
    await expect(page.getByText(`21–40 / ${historyCount}`)).toBeVisible();
    await switchProfile(page, fixture.primaryName, fixture.comparisonName);
    await switchProfile(page, fixture.comparisonName, fixture.primaryName);
    await expect(page.getByText(merchant, { exact: true })).toBeVisible();
    await page
      .getByRole('button', {
        name: en.subscriptions.showTransactions,
        exact: true,
      })
      .click();
    await expect(page.getByText(`1–20 / ${historyCount}`)).toBeVisible();
    await expect(
      page.getByRole('button', { name: en.common.previous, exact: true })
    ).toBeDisabled();
    expect(errors).toEqual([]);
    await testInfo.attach('history-performance-evidence', {
      body: JSON.stringify(
        { encryptedOpfs, contactHistory, subscriptionHistory, errors },
        null,
        2
      ),
      contentType: 'application/json',
    });
  });
});
