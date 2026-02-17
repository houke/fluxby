import { defineConfig, devices } from '@playwright/test';

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
  retries: process.env.CI ? 2 : 1, // Add retry to handle flaky navigation
  workers: process.env.CI ? 1 : 2, // Limit workers to reduce flakiness
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    // Base URL for the web app (landing page proxies to /app/)
    baseURL: 'http://localhost:5177',
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
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5177',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
