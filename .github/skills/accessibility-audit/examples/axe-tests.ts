/**
 * Axe-core Accessibility Testing Examples
 *
 * Integration patterns for automated accessibility testing.
 */

import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// ============================================================================
// BASIC AXE TEST
// ============================================================================

test.describe('Homepage Accessibility', () => {
  test('should not have any accessibility violations', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });
});

// ============================================================================
// WCAG LEVEL SPECIFIC TESTS
// ============================================================================

test.describe('WCAG Compliance', () => {
  test('should meet WCAG 2.1 Level A', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag21a'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('should meet WCAG 2.1 Level AA', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('should meet WCAG 2.2 Level AA', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});

// ============================================================================
// COMPONENT-SPECIFIC TESTS
// ============================================================================

test.describe('Component Accessibility', () => {
  test('navigation should be accessible', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page }).include('nav').analyze();

    expect(results.violations).toEqual([]);
  });

  test('form should be accessible', async ({ page }) => {
    await page.goto('/contact');

    const results = await new AxeBuilder({ page }).include('form').analyze();

    expect(results.violations).toEqual([]);
  });

  test('modal should be accessible when open', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="open-modal"]');

    // Wait for modal to be visible
    await page.waitForSelector('[role="dialog"]');

    const results = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .analyze();

    expect(results.violations).toEqual([]);
  });
});

// ============================================================================
// EXCLUDE KNOWN ISSUES
// ============================================================================

test.describe('Accessibility with Exclusions', () => {
  test('page should be accessible excluding third-party widgets', async ({
    page,
  }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .exclude('.third-party-widget')
      .exclude('#external-chat')
      .analyze();

    expect(results.violations).toEqual([]);
  });
});

// ============================================================================
// DISABLE SPECIFIC RULES
// ============================================================================

test.describe('Accessibility with Rule Exceptions', () => {
  test('page should be accessible (with documented exceptions)', async ({
    page,
  }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .disableRules([
        'color-contrast', // Temporarily disabled while design updates pending
      ])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});

// ============================================================================
// DETAILED VIOLATION REPORTING
// ============================================================================

test.describe('Detailed Accessibility Report', () => {
  test('should report all violations with details', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page }).analyze();

    // Log violations for debugging
    if (results.violations.length > 0) {
      console.log('Accessibility Violations Found:');
      results.violations.forEach((violation, index) => {
        console.log(
          `\n${index + 1}. ${violation.id}: ${violation.description}`,
        );
        console.log(`   Impact: ${violation.impact}`);
        console.log(
          `   WCAG: ${violation.tags.filter((t) => t.startsWith('wcag')).join(', ')}`,
        );
        console.log(`   Help: ${violation.helpUrl}`);
        console.log(`   Affected elements:`);
        violation.nodes.forEach((node) => {
          console.log(`   - ${node.html}`);
          console.log(`     Fix: ${node.failureSummary}`);
        });
      });
    }

    expect(results.violations).toEqual([]);
  });
});

// ============================================================================
// REUSABLE TEST HELPER
// ============================================================================

async function checkAccessibility(
  page: Page,
  options: {
    scope?: string;
    exclude?: string[];
    level?: 'A' | 'AA' | 'AAA';
  } = {},
) {
  let builder = new AxeBuilder({ page });

  // Apply scope
  if (options.scope) {
    builder = builder.include(options.scope);
  }

  // Apply exclusions
  options.exclude?.forEach((selector) => {
    builder = builder.exclude(selector);
  });

  // Apply WCAG level
  const levelTags: Record<string, string[]> = {
    A: ['wcag2a', 'wcag21a'],
    AA: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    AAA: ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag21aaa'],
  };

  if (options.level) {
    builder = builder.withTags(levelTags[options.level]);
  }

  const results = await builder.analyze();

  return {
    passes: results.passes.length,
    violations: results.violations,
    incomplete: results.incomplete,
  };
}

test.describe('Using Test Helper', () => {
  test('check specific component at AA level', async ({ page }) => {
    await page.goto('/');

    const { violations } = await checkAccessibility(page, {
      scope: 'main',
      exclude: ['.ad-banner'],
      level: 'AA',
    });

    expect(violations).toEqual([]);
  });
});

// ============================================================================
// SNAPSHOT TESTING FOR A11Y
// ============================================================================

test.describe('Accessibility Snapshot', () => {
  test('should maintain accessibility compliance', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Create a summary for snapshot
    const summary = {
      passCount: results.passes.length,
      violationCount: results.violations.length,
      violationIds: results.violations.map((v) => v.id).sort(),
    };

    // This will fail if new violations are introduced
    expect(summary).toMatchSnapshot('accessibility-summary');
  });
});

// ============================================================================
// TESTING DYNAMIC CONTENT
// ============================================================================

test.describe('Dynamic Content Accessibility', () => {
  test('content loaded after interaction should be accessible', async ({
    page,
  }) => {
    await page.goto('/');

    // Check initial state
    let results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);

    // Trigger dynamic content
    await page.click('[data-testid="load-more"]');
    await page.waitForSelector('[data-testid="dynamic-content"]');

    // Check after dynamic load
    results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('error states should be accessible', async ({ page }) => {
    await page.goto('/form');

    // Submit invalid form
    await page.click('button[type="submit"]');

    // Wait for error messages
    await page.waitForSelector('[role="alert"]');

    const results = await new AxeBuilder({ page }).include('form').analyze();

    expect(results.violations).toEqual([]);
  });
});
