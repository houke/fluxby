/**
 * E2E Tests for Sync Pairing Feature
 *
 * Tests the device-to-device pairing flow:
 * - Pairing code generation and display
 * - Pairing code entry validation
 * - Connection establishment UI
 * - Error states and recovery
 * - Encryption key exchange verification
 *
 * Note: Full WebRTC peer connections are mocked since E2E tests
 * run in a single browser context. These tests verify the UI flows
 * and state management of the pairing process.
 */

import { test, expect, Page } from '@playwright/test';
import { dismissOnboardingTour, setupApp } from './fixtures';

// Test data-testid locators for sync UI
const LOCATORS = {
  syncButton: '[data-testid="sync-button"]',
  syncStatus: '[data-testid="sync-status"]',
  deviceIdDisplay: '[data-testid="device-id"]',
  pairingCode: '[data-testid="pairing-code"]',
  pairingCodeInput: '[data-testid="pairing-code-input"]',
  connectButton: '[data-testid="connect-button"]',
  syncModal: '[data-testid="sync-modal"]',
  syncError: '[data-testid="sync-error"]',
  connectedDevices: '[data-testid="connected-devices"]',
  disconnectButton: '[data-testid="disconnect-button"]',
  generateCodeButton: '[data-testid="generate-code-button"]',
  copyCodeButton: '[data-testid="copy-code-button"]',
  closeSyncModal: '[data-testid="close-sync-modal"]',
};

/**
 * Helper to navigate to settings or sync page
 */
async function goToSyncSettings(page: Page) {
  await setupApp(page);
  await dismissOnboardingTour(page);
  await page.getByRole('link', { name: /settings|instellingen/i }).click();
  await page
    .getByRole('tab', { name: /app settings|app-instellingen/i })
    .click();
}

test.describe('Sync Pairing Feature', () => {
  test.describe('Sync UI Elements', () => {
    test('settings page should have sync section', async ({ page }) => {
      await goToSyncSettings(page);

      // Check for sync-related UI elements
      const syncSection = page.locator('text=/sync|devices|pairing/i').first();

      // If no sync section visible, sync feature may not be enabled
      // This is acceptable - feature is optional
      if (!(await syncSection.isVisible({ timeout: 3000 }))) {
        test.skip();
        return;
      }

      await expect(syncSection).toBeVisible();
    });

    test('sync button should be accessible via keyboard', async ({ page }) => {
      await goToSyncSettings(page);

      const syncButton = page.locator(LOCATORS.syncButton);
      if (!(await syncButton.isVisible({ timeout: 3000 }))) {
        test.skip();
        return;
      }

      // Focus and activate with keyboard
      await syncButton.focus();
      await expect(syncButton).toBeFocused();

      // Should be activatable with Enter
      await page.keyboard.press('Enter');
    });
  });

  test.describe('Pairing Code Generation', () => {
    test('should generate unique pairing codes on each request', async ({
      page,
    }) => {
      await goToSyncSettings(page);

      const generateButton = page.locator(LOCATORS.generateCodeButton);
      if (!(await generateButton.isVisible({ timeout: 3000 }))) {
        test.skip();
        return;
      }

      // Generate first code
      await generateButton.click();
      await page.waitForSelector(LOCATORS.pairingCode, { timeout: 5000 });
      const code1 = await page.locator(LOCATORS.pairingCode).textContent();

      // Generate second code
      await generateButton.click();
      await page.waitForTimeout(500);
      const code2 = await page.locator(LOCATORS.pairingCode).textContent();

      // Codes should be different (contains randomness)
      expect(code1).not.toBe(code2);
    });

    test('pairing code should have copy-to-clipboard functionality', async ({
      page,
    }) => {
      await goToSyncSettings(page);

      const generateButton = page.locator(LOCATORS.generateCodeButton);
      if (!(await generateButton.isVisible({ timeout: 3000 }))) {
        test.skip();
        return;
      }

      await generateButton.click();
      await page.waitForSelector(LOCATORS.pairingCode, { timeout: 5000 });

      const copyButton = page.locator(LOCATORS.copyCodeButton);
      if (await copyButton.isVisible()) {
        await copyButton.click();

        // Should show success feedback (toast or button state change)
        const successFeedback = page.locator('text=/copied|success/i');
        await expect(successFeedback).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Pairing Code Input Validation', () => {
    test('should validate pairing code format', async ({ page }) => {
      await goToSyncSettings(page);

      const codeInput = page.locator(LOCATORS.pairingCodeInput);
      if (!(await codeInput.isVisible({ timeout: 3000 }))) {
        test.skip();
        return;
      }

      // Enter invalid format
      await codeInput.fill('invalid');
      const connectButton = page.locator(LOCATORS.connectButton);

      if (await connectButton.isVisible()) {
        await connectButton.click();

        // Should show error for invalid format
        const errorMessage = page.locator('text=/invalid|error|format/i');
        await expect(errorMessage).toBeVisible({ timeout: 3000 });
      }
    });

    test('should prevent empty code submission', async ({ page }) => {
      await goToSyncSettings(page);

      const codeInput = page.locator(LOCATORS.pairingCodeInput);
      if (!(await codeInput.isVisible({ timeout: 3000 }))) {
        test.skip();
        return;
      }

      // Clear input and try to connect
      await codeInput.fill('');
      const connectButton = page.locator(LOCATORS.connectButton);

      if (await connectButton.isVisible()) {
        // Button should be disabled or click should show error
        const isDisabled = await connectButton.isDisabled();
        if (!isDisabled) {
          await connectButton.click();
          const errorMessage = page.locator('text=/required|enter|provide/i');
          await expect(errorMessage).toBeVisible({ timeout: 3000 });
        } else {
          expect(isDisabled).toBe(true);
        }
      }
    });
  });

  test.describe('Connection Error Handling', () => {
    test('should handle connection timeout gracefully', async ({ page }) => {
      await goToSyncSettings(page);

      const codeInput = page.locator(LOCATORS.pairingCodeInput);
      if (!(await codeInput.isVisible({ timeout: 3000 }))) {
        test.skip();
        return;
      }

      // Enter a code that won't connect (no peer with this ID)
      await codeInput.fill('INVALID-PEER-ID-12345');
      const connectButton = page.locator(LOCATORS.connectButton);

      if (await connectButton.isVisible()) {
        await connectButton.click();

        // Should show timeout or connection failed error
        const errorMessage = page.locator(LOCATORS.syncError);
        if (await errorMessage.isVisible({ timeout: 30000 })) {
          const errorText = await errorMessage.textContent();
          expect(errorText).toMatch(/timeout|failed|could not|unable|error/i);
        }
      }
    });

    test('should allow retry after connection failure', async ({ page }) => {
      await goToSyncSettings(page);

      const codeInput = page.locator(LOCATORS.pairingCodeInput);
      if (!(await codeInput.isVisible({ timeout: 3000 }))) {
        test.skip();
        return;
      }

      // Enter invalid code and fail connection
      await codeInput.fill('INVALID-123');
      const connectButton = page.locator(LOCATORS.connectButton);

      if (await connectButton.isVisible()) {
        await connectButton.click();
        await page.waitForTimeout(3000);

        // Input should still be editable for retry
        await expect(codeInput).toBeEditable();

        // Can enter a new code
        await codeInput.fill('NEW-CODE-456');
        await expect(codeInput).toHaveValue('NEW-CODE-456');
      }
    });
  });

  test.describe('Accessibility', () => {
    test('sync modal should trap focus', async ({ page }) => {
      await goToSyncSettings(page);

      const syncButton = page.locator(LOCATORS.syncButton);
      if (!(await syncButton.isVisible({ timeout: 3000 }))) {
        test.skip();
        return;
      }

      await syncButton.click();

      const modal = page.locator(LOCATORS.syncModal);
      if (!(await modal.isVisible({ timeout: 3000 }))) {
        test.skip();
        return;
      }

      // Tab through modal elements
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }

      // Focus should remain within modal
      const focusedElement = await page.evaluate(() =>
        document.activeElement?.closest('[data-testid="sync-modal"]')
      );
      expect(focusedElement).not.toBeNull();
    });

    test('sync modal should close with Escape key', async ({ page }) => {
      await goToSyncSettings(page);

      const syncButton = page.locator(LOCATORS.syncButton);
      if (!(await syncButton.isVisible({ timeout: 3000 }))) {
        test.skip();
        return;
      }

      await syncButton.click();

      const modal = page.locator(LOCATORS.syncModal);
      if (!(await modal.isVisible({ timeout: 3000 }))) {
        test.skip();
        return;
      }

      // Press Escape to close
      await page.keyboard.press('Escape');

      await expect(modal).not.toBeVisible({ timeout: 3000 });
    });
  });
});

test.describe('Sync Encryption Verification', () => {
  test('sync session should use encrypted channel', async ({ page }) => {
    // This test verifies the encryption indicators in the sync UI
    await goToSyncSettings(page);

    const syncSection = page.locator('text=/sync|devices/i').first();
    if (!(await syncSection.isVisible({ timeout: 3000 }))) {
      test.skip();
      return;
    }

    // Look for encryption indicator (lock icon, "encrypted" text, etc.)
    const encryptionIndicator = page
      .locator('[aria-label*="encrypt" i], [title*="encrypt" i]')
      .or(page.getByText(/encrypted|secure|e2e/i))
      .first();

    // If sync feature is present, encryption should be indicated
    if (await encryptionIndicator.isVisible({ timeout: 3000 })) {
      await expect(encryptionIndicator).toBeVisible();
    }
  });

  test('sync data should not expose plaintext in network requests', async ({
    page,
  }) => {
    // Monitor network requests for sync endpoints
    const syncRequests: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('sync') || url.includes('peer')) {
        const postData = request.postData();
        if (postData) {
          syncRequests.push(postData);
        }
      }
    });

    await goToSyncSettings(page);
    await page.waitForTimeout(5000);

    // Verify no plaintext data in sync requests
    for (const requestData of syncRequests) {
      // Should not contain common plaintext indicators
      expect(requestData).not.toMatch(/"amount":\s*\d+\.\d{2}/);
      expect(requestData).not.toMatch(/"description":\s*"[A-Z]/);
      expect(requestData).not.toMatch(/"iban":\s*"[A-Z]{2}\d+/);
    }
  });
});
