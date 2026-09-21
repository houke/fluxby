import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5177';
const isExternalTarget = !!process.env.PLAYWRIGHT_BASE_URL;

/**
 * Playwright E2E Test Configuration for Fluxby
 *
 * Run tests:
 *   npm run test:e2e
 *   npm run test:e2e -- --headed (visual mode)
 *   npm run test:e2e -- --ui (interactive mode)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Each test gets isolated browser storage, so the local-first database can
  // safely initialize in parallel. Serial CI execution was the main source of
  // the 30+ minute runtime.
  workers: process.env.CI ? 2 : 1,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    // Base URL for the web app (landing page proxies to /app/)
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Add more browsers for CI
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // Mobile
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // Start dev server before running tests
  webServer: isExternalTarget
    ? undefined
    : {
        command: 'npm run dev:localhost',
        url: 'http://localhost:5177',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});
