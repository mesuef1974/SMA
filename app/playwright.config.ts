import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for the SMA Next.js application.
 *
 * Runs tests against a local dev server on port 3000.
 * Currently configured for Chromium only; additional browsers
 * can be added as projects when cross-browser coverage is needed.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  /* Maximum time one test can run */
  timeout: 30_000,

  /* Expect assertions timeout */
  expect: { timeout: 5_000 },

  /* Fail the build on CI if test.only was accidentally left in */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Single worker in CI for deterministic ordering */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter: list for local dev, HTML for CI */
  reporter: process.env.CI ? 'html' : 'list',

  /* Shared settings for all projects */
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  /* Browser projects */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Start the Next.js dev server before running tests */
  webServer: {
    command: 'pnpm dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
