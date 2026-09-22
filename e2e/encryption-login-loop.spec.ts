/**
 * Regression test: Encryption login loop after app restart
 *
 * Covers the 1.10 regression where:
 *  1. The database was created without encryption during onboarding
 *     (isEncryptionEnabled = false at DB init time)
 *  2. setupEncryption() was called later but the DB singleton was reused
 *  3. On restart, checkIfLegacy fired on the stale unencrypted IDB data
 *     -> jRead returned SQLITE_IOERR_READ -> DB error -> page reload
 *     -> lock screen reappeared -> infinite loop
 *
 * ⚠️  OPFS COVERAGE GAP
 * This test runs against http://localhost:5177 where `shouldUseOPFS` is false
 * (localhost is treated as dev mode → IDB is used instead of OPFS).
 * As a result, EncryptionVFS is never loaded here and the OPFS-specific paths
 * (needsReopen reload, migrateToEncrypted, jFileControl sync fix, decryptPage
 * throw-on-auth-failure, getSingleton OPFS no-reload guard) are NOT exercised.
 *
 * To exercise the deployed OPFS path with this test, use the external-target option:
 *   PLAYWRIGHT_BASE_URL=https://fluxby.app npx playwright test e2e/encryption-login-loop.spec.ts
 */

import { test, expect, Page } from '@playwright/test';

const TEST_PASSWORD = 'TestPassword1234';

async function completeFirstTimeSetup(page: Page) {
  await page.goto('/app/');
  await page.waitForTimeout(3000);

  // Language selection
  const english = page.getByRole('button', { name: /english/i });
  if (await english.isVisible({ timeout: 5000 }).catch(() => false)) {
    await english.click();
    await page.waitForTimeout(500);
  }

  // Name entry
  await page
    .getByText(/what.*your name|hoe heet je/i)
    .waitFor({ timeout: 15000 });
  await page.fill('input[type="text"]', 'Loop Test');
  await page.getByRole('button', { name: /^next$|^volgende$/i }).click();
  await page.waitForTimeout(500);

  // Password setup
  await page
    .getByText(/secure your data|beveilig je gegevens/i)
    .waitFor({ timeout: 10000 });
  await page.fill('input[placeholder*="password" i]', TEST_PASSWORD);
  await page.fill('input[placeholder*="confirm" i]', TEST_PASSWORD);
  await page.getByRole('button', { name: /get started|aan de slag/i }).click();

  // After submitting the password form, DatabaseContext detects that the DB
  // was opened without encryption and triggers a page reload to start fresh
  // with an encrypted database (avoids Asyncify VFS-switching errors).
  // Wait for either the Dashboard (if somehow fast) or the lock screen (after
  // the setup-time reload). Then unlock if needed.
  await page.waitForTimeout(3000); // give time for the reload to happen

  // If the lock screen appeared (due to the setup-time reload), unlock it
  const lockScreen = page.getByText(/unlock fluxby/i);
  if (await lockScreen.isVisible({ timeout: 5000 }).catch(() => false)) {
    await unlockApp(page);
  }

  // Now the dashboard should be visible
  await page
    .getByRole('link', { name: /dashboard/i })
    .waitFor({ timeout: 30000 });
}

async function unlockApp(page: Page) {
  await page.getByText(/unlock fluxby/i).waitFor({ timeout: 15000 });
  const pwInput = page.locator('input[type="password"]');
  await pwInput.fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /^unlock$|^ontgrendel$/i }).click();
}

test('login succeeds after restart without looping on lock screen', async ({
  page,
}) => {
  test.setTimeout(120_000);
  if (process.env.PLAYWRIGHT_LOG_BROWSER_CONSOLE) {
    page.on('console', (message) => {
      console.log(`[browser:${message.type()}] ${message.text()}`);
    });
  }
  await completeFirstTimeSetup(page);

  // The first tour must open automatically after security setup. Its welcome
  // button acknowledges the tour while continuing it in the current session.
  const welcome = page.getByRole('heading', {
    name: /welcome to fluxby|welkom bij fluxby/i,
  });
  await expect(welcome).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: /get started|aan de slag/i }).click();
  await expect(welcome).not.toBeVisible();

  // --- SIMULATE RESTART: reload the page ---
  await page.reload();
  await page.waitForTimeout(2000);

  // Lock screen must appear (encryption is configured)
  await expect(page.getByText(/unlock fluxby/i)).toBeVisible({
    timeout: 15000,
  });

  // --- LOGIN after restart ---
  await unlockApp(page);

  // Dashboard must appear — the DB opened successfully
  await page
    .getByRole('link', { name: /dashboard/i })
    .waitFor({ timeout: 30000 });

  // Lock screen must NOT reappear (this would indicate the loop)
  await page.waitForTimeout(1500);
  await expect(page.getByText(/unlock fluxby/i)).not.toBeVisible();
  await expect(welcome).not.toBeVisible();

  // --- SECOND RESTART: confirm stable behaviour ---
  await page.reload();
  await page.waitForTimeout(2000);
  await expect(page.getByText(/unlock fluxby/i)).toBeVisible({
    timeout: 15000,
  });
  await unlockApp(page);
  await page
    .getByRole('link', { name: /dashboard/i })
    .waitFor({ timeout: 30000 });
  await expect(page.getByText(/unlock fluxby/i)).not.toBeVisible();
  await expect(welcome).not.toBeVisible();
});
