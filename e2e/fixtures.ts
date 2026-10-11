/**
 * E2E Test Fixtures for Fluxby
 *
 * These fixtures handle app setup, authentication, and demo data
 * for E2E testing with Playwright.
 */

import { test as base, Page, BrowserContext, expect } from '@playwright/test';

/**
 * App setup fixture - ensures the app has a profile and demo data
 */
export async function setupApp(page: Page) {
  await page.goto('/app/', { waitUntil: 'domcontentloaded' });

  const dashboardLink = page.getByRole('link', { name: /dashboard/i });
  const languageHeading = page.getByRole('heading', {
    name: /kies je taal|choose.*language|select.*language/i,
  });
  const nameHeading = page.getByText(/What's your name\?|Hoe heet je\?/i);

  // Cold CI startup can outlast a fixed sleep. Wait for the actual setup or
  // dashboard controls before deciding whether onboarding is needed.
  await languageHeading.or(nameHeading).or(dashboardLink).first().waitFor({
    state: 'visible',
    timeout: 60000,
  });

  if (await dashboardLink.isVisible()) return;

  await handleLanguageSelection(page);
  await completeOnboarding(page);
}

/**
 * Handle language selection screen
 */
async function handleLanguageSelection(page: Page) {
  // Check for language selection heading
  const languageHeading = page.getByRole('heading', {
    name: /kies je taal|choose.*language|select.*language/i,
  });

  if (await languageHeading.isVisible({ timeout: 2000 })) {
    // Click English to use English for tests
    const englishButton = page.getByRole('button', { name: /english/i });
    if (await englishButton.isVisible()) {
      await englishButton.click();
      await page.waitForTimeout(500);
    } else {
      // Fall back to Nederlands
      const dutchButton = page.getByRole('button', { name: /nederlands/i });
      if (await dutchButton.isVisible()) {
        await dutchButton.click();
        await page.waitForTimeout(500);
      }
    }
  }
}

/**
 * Complete the onboarding/setup flow
 *
 * This function walks through the app's initial setup:
 * 1. Profile creation (name, password)
 * 2. Demo data selection (if available)
 */
async function completeOnboarding(page: Page) {
  // Step 1: Name entry screen
  // Wait for the name title to appear
  await page
    .getByText(/What's your name\?|Hoe heet je\?/i)
    .waitFor({ state: 'visible', timeout: 10000 });

  // Fill in the name input using CSS selector (same approach as MCP)
  await page.fill('input[type="text"]', 'Test User');

  // Click Next button
  await page.click('button:has-text("Next")');

  // Step 2: Password screen - wait for it to appear
  await page
    .getByText(/Secure your data|Beveilig je gegevens/i)
    .waitFor({ state: 'visible', timeout: 10000 });

  // Fill both password fields
  await page.fill('input[placeholder="Master password..."]', 'test1234');
  await page.fill('input[placeholder="Confirm password..."]', 'test1234');

  // Click "Let's get started!" button
  await page.click('button:has-text("Let\'s get started!")');

  // Wait for dashboard to appear (indicates setup complete)
  // Use a more specific selector to avoid matching multiple elements
  const dashboardLink = page.getByRole('link', { name: 'Dashboard' });
  await dashboardLink.waitFor({ state: 'visible', timeout: 60000 });

  // Encryption can reload the app before the first tour is mounted. The
  // sidebar alone does not mean setup is ready for navigation yet.
  await page
    .locator('[class*="z-[9999]"]')
    .getByRole('button', { name: /let's get started|aan de slag/i })
    .waitFor({ state: 'visible', timeout: 15000 });
}

/**
 * Navigate to transactions page (with app setup)
 */
export async function goToTransactionsPage(page: Page) {
  await setupApp(page);

  // Ensure any onboarding tour is dismissed
  await dismissOnboardingTour(page);

  // Click on transactions in sidebar
  const transactionsLink = page.getByRole('link', {
    name: /transactions|transacties/i,
  });

  // If link is not visible, try mobile menu
  if (!(await transactionsLink.isVisible({ timeout: 2000 }))) {
    // Click hamburger menu
    const menuButton = page.getByRole('button', { name: /menu/i });
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500);
    }
  }

  // Try clicking, if blocked by tour, dismiss and retry
  try {
    await transactionsLink.click({ timeout: 5000 });
  } catch {
    await dismissOnboardingTour(page);
    await transactionsLink.click({ timeout: 5000 });
  }
  await page.waitForLoadState('networkidle');

  // Wait for transactions page to load
  await expect(page).toHaveURL(/transactions/);

  // Wait for the transactions page content to load
  // The transactions page should have transactions heading or list
  await page.waitForTimeout(2000); // Allow React to render

  // Ensure we're seeing transaction-related content
  const transactionsHeading = page.getByRole('heading', {
    name: /transactions|transacties/i,
  });
  const transactionRows = page.locator('[data-onboarding="transaction-row"]');

  // Wait for either heading or transaction rows to appear
  await Promise.race([
    transactionsHeading.waitFor({ state: 'visible', timeout: 10000 }),
    transactionRows.first().waitFor({ state: 'visible', timeout: 10000 }),
  ]).catch(() => {
    // If neither appears, that's ok - the test will handle it
  });
}

/**
 * Dismiss onboarding tour if it's visible
 * The onboarding has multiple screens:
 * - Welcome modal with "Let's get started!" button
 * - Tour steps with X (Skip) button in corner
 */
export async function dismissOnboardingTour(
  page: Page,
  { waitForWelcome = false }: { waitForWelcome?: boolean } = {}
) {
  const tour = page.locator('[class*="z-[9999]"]');
  const startButton = tour.getByRole('button', {
    name: /let's get started|aan de slag/i,
  });
  const skipButton = tour.getByRole('button', { name: /^(skip|overslaan)$/i });
  const closeButton = tour.getByRole('button', { name: /^(close|sluiten)$/i });

  // Specs that walk through setup themselves must also wait for the pending
  // welcome tour, which can mount after the dashboard is already visible.
  if (waitForWelcome) {
    await startButton.waitFor({ state: 'visible', timeout: 15000 });
  }

  const overlays = page.locator('[class*="z-[9998]"], [class*="z-[9999]"]');
  if ((await overlays.count()) === 0) return;

  await startButton.or(skipButton).or(closeButton).first().waitFor({
    state: 'visible',
    timeout: 10000,
  });

  // The welcome step is mandatory. Advance it once, then dismiss the tour
  // through its own control rather than forcing clicks through the overlay.
  if (await startButton.isVisible()) {
    await startButton.click();
    await skipButton.waitFor({ state: 'visible', timeout: 10000 });
  }

  await skipButton.or(closeButton).first().click();
  // Closing includes a shrink animation and a "see you later" message. Wait
  // for both layers to unmount before any test clicks the app underneath.
  await expect(overlays).toHaveCount(0, { timeout: 10000 });
}

/**
 * Custom test context with app setup
 */
interface TestFixtures {
  setupPage: Page;
}

/**
 * Extended test with app setup fixture
 */
export const test = base.extend<TestFixtures>({
  setupPage: async ({ page }, use) => {
    await setupApp(page);
    await use(page);
  },
});

export { expect };

/**
 * Storage state file for reusing authentication
 */
export const STORAGE_STATE = 'e2e/.auth/storage-state.json';

/**
 * Setup test that creates and saves auth state
 */
export async function globalSetup(page: Page, context: BrowserContext) {
  await setupApp(page);

  // Save storage state
  await context.storageState({ path: STORAGE_STATE });
}
