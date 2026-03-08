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
  // Navigate to app
  await page.goto('/app/', { waitUntil: 'domcontentloaded' });

  // Wait for app to initialize (may take a moment due to OPFS setup)
  await page.waitForTimeout(2000);

  // Step 1: Handle language selection (if shown)
  await handleLanguageSelection(page);

  // Check if we are already on a main page or need setup
  const url = page.url();
  if (
    url.includes('dashboard') ||
    url.includes('transactions') ||
    url.includes('analytics')
  ) {
    return; // Already set up
  }

  // Check if we're on an onboarding/setup screen
  const needsSetup = await needsAppSetup(page);

  if (needsSetup) {
    await completeOnboarding(page);
  }

  // Wait for navigation to complete
  await page.waitForTimeout(1000);

  // Check if we reached a main page (dashboard or transactions)
  const finalUrl = page.url();
  if (!finalUrl.includes('dashboard') && !finalUrl.includes('transactions')) {
    // Try clicking on a known nav link
    const dashboardLink = page.getByRole('link', { name: /dashboard/i });
    if (await dashboardLink.isVisible({ timeout: 2000 })) {
      await dashboardLink.click();
      await page.waitForLoadState('networkidle');
    }
  }
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
 * Check if app needs initial setup
 */
async function needsAppSetup(page: Page): Promise<boolean> {
  // Check for common setup indicators
  const setupIndicators = [
    'text=/welkom|welcome|setup|onboarding/i',
    'text=/profiel aanmaken|create profile/i',
    "text=/what's your name|hoe heet je/i", // Name entry screen
    'text=/secure your data|beveilig je gegevens/i', // Password screen
    'text=/choose your language|kies je taal/i', // Language selection
    '[data-testid="setup-wizard"]',
    '[data-testid="onboarding"]',
  ];

  for (const indicator of setupIndicators) {
    try {
      const element = page.locator(indicator);
      if (await element.isVisible({ timeout: 1000 })) {
        return true;
      }
    } catch {
      // Element not found, continue checking
    }
  }

  // Check URL for setup routes
  const url = page.url();
  if (url.includes('setup') || url.includes('onboarding')) {
    return true;
  }

  return false;
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
  await page.waitForTimeout(500);

  // Click Next button
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(1000);

  // Step 2: Password screen - wait for it to appear
  await page
    .getByText(/Secure your data|Beveilig je gegevens/i)
    .waitFor({ state: 'visible', timeout: 10000 });

  // Fill both password fields
  await page.fill('input[placeholder="Master password..."]', 'test1234');
  await page.fill('input[placeholder="Confirm password..."]', 'test1234');
  await page.waitForTimeout(500);

  // Click "Let's get started!" button
  await page.click('button:has-text("Let\'s get started!")');

  // Wait for main app to load (loading screen + dashboard)
  await page.waitForTimeout(5000);

  // Wait for dashboard to appear (indicates setup complete)
  // Use a more specific selector to avoid matching multiple elements
  const dashboardLink = page.getByRole('link', { name: 'Dashboard' });
  await dashboardLink.waitFor({ state: 'visible', timeout: 60000 });
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
async function dismissOnboardingTour(page: Page) {
  // Wait for any modal to fully appear and stabilize
  await page.waitForTimeout(1500);

  // Try multiple times to dismiss all onboarding modals
  for (let attempt = 0; attempt < 10; attempt++) {
    // Check if there's an active onboarding overlay (z-index 9998/9999)
    const overlayCount = await page
      .locator('[class*="z-[9998]"], [class*="z-[9999]"]')
      .count();

    if (overlayCount === 0) {
      // No onboarding overlay, we're done
      return;
    }

    // Small wait for DOM stability
    await page.waitForTimeout(300);

    // Try clicking Skip button by accessible name
    try {
      const skipButton = page.getByRole('button', { name: /skip|overslaan/i });
      if ((await skipButton.count()) > 0) {
        await skipButton.first().click({ force: true, timeout: 2000 });
        await page.waitForTimeout(800);
        continue;
      }
    } catch {
      // Button may have disappeared, try next option
    }

    // Try to find "Let's get started!" or "Aan de slag!" button
    try {
      const startButton = page.getByRole('button', {
        name: /let's get started|aan de slag/i,
      });
      if ((await startButton.count()) > 0) {
        await startButton.first().click({ force: true, timeout: 2000 });
        await page.waitForTimeout(800);
        continue;
      }
    } catch {
      // Button may have disappeared, try next option
    }

    // Try to find any Next/Volgende button
    try {
      const nextButton = page.getByRole('button', {
        name: /next|volgende/i,
      });
      if ((await nextButton.count()) > 0) {
        await nextButton.first().click({ force: true, timeout: 2000 });
        await page.waitForTimeout(800);
        continue;
      }
    } catch {
      // Button may have disappeared, try next option
    }

    // Try to find Finish/Voltooien/Done/Klaar button
    try {
      const finishButton = page.getByRole('button', {
        name: /finish|voltooien|done|klaar/i,
      });
      if ((await finishButton.count()) > 0) {
        await finishButton.first().click({ force: true, timeout: 2000 });
        await page.waitForTimeout(800);
        continue;
      }
    } catch {
      // Button may have disappeared, try next option
    }

    // Try clicking any button with X icon (close button)
    try {
      const closeIconButton = page.locator('button:has(svg.lucide-x)');
      if ((await closeIconButton.count()) > 0) {
        await closeIconButton.first().click({ force: true, timeout: 2000 });
        await page.waitForTimeout(800);
        continue;
      }
    } catch {
      // Button may have disappeared
    }

    // If nothing found, wait a bit longer and try again
    await page.waitForTimeout(500);
  }

  // Final wait for any animations to complete
  await page.waitForTimeout(500);
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
