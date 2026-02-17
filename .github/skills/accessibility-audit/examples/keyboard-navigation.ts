/**
 * Keyboard Navigation Testing Examples
 *
 * Playwright tests for verifying keyboard accessibility.
 */

import { test, expect } from '@playwright/test';

// ============================================================================
// BASIC KEYBOARD NAVIGATION
// ============================================================================

test.describe('Keyboard Navigation', () => {
  test('can navigate entire page with Tab key', async ({ page }) => {
    await page.goto('/');

    // Start from body
    await page.keyboard.press('Tab');

    // Track all focused elements
    const focusedElements: string[] = [];
    let previousFocused = '';

    for (let i = 0; i < 50; i++) {
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? `${el.tagName}${el.id ? '#' + el.id : ''}` : 'none';
      });

      // Stop if we've looped back
      if (focused === focusedElements[0] && focusedElements.length > 5) {
        break;
      }

      // Only record if different from previous
      if (focused !== previousFocused) {
        focusedElements.push(focused);
        previousFocused = focused;
      }

      await page.keyboard.press('Tab');
    }

    console.log('Focus order:', focusedElements);

    // Verify interactive elements are reached
    expect(focusedElements.length).toBeGreaterThan(0);
  });

  test('focus is visible on all interactive elements', async ({ page }) => {
    await page.goto('/');

    // Tab to first interactive element
    await page.keyboard.press('Tab');

    for (let i = 0; i < 20; i++) {
      // Check focus is visible
      const hasFocusStyle = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return true;

        const styles = window.getComputedStyle(el);
        const hasOutline = styles.outline !== 'none' && styles.outline !== '';
        const hasBoxShadow = styles.boxShadow !== 'none';
        const hasBorder = styles.borderColor !== 'rgb(0, 0, 0)';

        return hasOutline || hasBoxShadow || hasBorder;
      });

      const focusedElement = await page.evaluate(
        () => document.activeElement?.tagName,
      );

      if (focusedElement !== 'BODY') {
        expect(
          hasFocusStyle,
          `Focus should be visible on ${focusedElement}`,
        ).toBe(true);
      }

      await page.keyboard.press('Tab');
    }
  });
});

// ============================================================================
// SKIP LINK TESTING
// ============================================================================

test.describe('Skip Links', () => {
  test('skip to main content link works', async ({ page }) => {
    await page.goto('/');

    // Tab to skip link (usually first focusable element)
    await page.keyboard.press('Tab');

    // Verify skip link exists
    const skipLink = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.textContent?.toLowerCase().includes('skip') ?? false;
    });

    expect(skipLink).toBe(true);

    // Activate skip link
    await page.keyboard.press('Enter');

    // Verify focus moved to main content
    const focusedInMain = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.closest('main') !== null || el?.id === 'main-content';
    });

    expect(focusedInMain).toBe(true);
  });
});

// ============================================================================
// MODAL KEYBOARD TESTING
// ============================================================================

test.describe('Modal Keyboard Interaction', () => {
  test('focus moves to modal when opened', async ({ page }) => {
    await page.goto('/');

    // Open modal
    await page.click('[data-testid="open-modal"]');

    // Verify focus is inside modal
    const focusInModal = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      return modal?.contains(document.activeElement) ?? false;
    });

    expect(focusInModal).toBe(true);
  });

  test('focus is trapped inside modal', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="open-modal"]');
    await page.waitForSelector('[role="dialog"]');

    // Get all focusable elements in modal
    const modalFocusableCount = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      return (
        modal?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ).length ?? 0
      );
    });

    // Tab through modal multiple times
    for (let i = 0; i < modalFocusableCount + 5; i++) {
      await page.keyboard.press('Tab');

      const focusInModal = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"]');
        return modal?.contains(document.activeElement) ?? false;
      });

      expect(focusInModal, `Focus should stay in modal on tab ${i}`).toBe(true);
    }
  });

  test('Escape closes modal', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="open-modal"]');
    await page.waitForSelector('[role="dialog"]');

    await page.keyboard.press('Escape');

    const modalVisible = await page.isVisible('[role="dialog"]');
    expect(modalVisible).toBe(false);
  });

  test('focus returns to trigger after modal closes', async ({ page }) => {
    await page.goto('/');

    const trigger = page.locator('[data-testid="open-modal"]');
    await trigger.click();
    await page.waitForSelector('[role="dialog"]');

    await page.keyboard.press('Escape');

    const triggerFocused = await trigger.evaluate(
      (el) => el === document.activeElement,
    );
    expect(triggerFocused).toBe(true);
  });
});

// ============================================================================
// DROPDOWN/MENU KEYBOARD TESTING
// ============================================================================

test.describe('Dropdown Menu Keyboard', () => {
  test('Arrow keys navigate menu items', async ({ page }) => {
    await page.goto('/');

    // Open dropdown
    await page.click('[data-testid="dropdown-trigger"]');
    await page.waitForSelector('[role="menu"]');

    // Get first item text
    const firstItem = await page.evaluate(() => {
      return document.activeElement?.textContent ?? '';
    });

    // Arrow down
    await page.keyboard.press('ArrowDown');
    const secondItem = await page.evaluate(() => {
      return document.activeElement?.textContent ?? '';
    });

    expect(secondItem).not.toBe(firstItem);

    // Arrow up should go back
    await page.keyboard.press('ArrowUp');
    const backToFirst = await page.evaluate(() => {
      return document.activeElement?.textContent ?? '';
    });

    expect(backToFirst).toBe(firstItem);
  });

  test('Enter activates menu item', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="dropdown-trigger"]');
    await page.waitForSelector('[role="menu"]');

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Menu should close after selection
    const menuVisible = await page.isVisible('[role="menu"]');
    expect(menuVisible).toBe(false);
  });

  test('Escape closes menu', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="dropdown-trigger"]');
    await page.waitForSelector('[role="menu"]');

    await page.keyboard.press('Escape');

    const menuVisible = await page.isVisible('[role="menu"]');
    expect(menuVisible).toBe(false);
  });
});

// ============================================================================
// TABS KEYBOARD TESTING
// ============================================================================

test.describe('Tabs Keyboard Navigation', () => {
  test('Arrow keys switch between tabs', async ({ page }) => {
    await page.goto('/tabs-example');

    // Focus on tab list
    await page.click('[role="tab"]');

    const initialTab = await page.evaluate(() => {
      return document.activeElement?.getAttribute('aria-selected');
    });

    expect(initialTab).toBe('true');

    // Arrow right to next tab
    await page.keyboard.press('ArrowRight');

    const nextTabSelected = await page.evaluate(() => {
      return document.activeElement?.getAttribute('aria-selected');
    });

    expect(nextTabSelected).toBe('true');
  });

  test('Tab key moves focus to panel content', async ({ page }) => {
    await page.goto('/tabs-example');

    await page.click('[role="tab"]');
    await page.keyboard.press('Tab');

    const focusInPanel = await page.evaluate(() => {
      const panel = document.querySelector('[role="tabpanel"]:not([hidden])');
      return panel?.contains(document.activeElement) ?? false;
    });

    expect(focusInPanel).toBe(true);
  });
});

// ============================================================================
// FORM KEYBOARD TESTING
// ============================================================================

test.describe('Form Keyboard Accessibility', () => {
  test('can complete form using only keyboard', async ({ page }) => {
    await page.goto('/contact');

    // Tab to first field
    await page.keyboard.press('Tab');

    // Fill name
    await page.keyboard.type('John Doe');
    await page.keyboard.press('Tab');

    // Fill email
    await page.keyboard.type('john@example.com');
    await page.keyboard.press('Tab');

    // Fill message
    await page.keyboard.type('Hello, this is a test message.');
    await page.keyboard.press('Tab');

    // Submit with Enter
    await page.keyboard.press('Enter');

    // Verify submission
    await expect(page.locator('[role="status"]')).toContainText('success');
  });

  test('error messages are keyboard accessible', async ({ page }) => {
    await page.goto('/contact');

    // Tab to submit without filling required fields
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }

    await page.keyboard.press('Enter');

    // Error should be announced/visible
    const errorVisible = await page.isVisible('[role="alert"]');
    expect(errorVisible).toBe(true);

    // Focus should move to first error
    const focusOnError = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.getAttribute('aria-invalid') === 'true';
    });

    expect(focusOnError).toBe(true);
  });
});
