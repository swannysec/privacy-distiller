import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Privacy Policy Distiller functional tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './src/test/functional',

  /* Maximum time one test can run for */
  timeout: 30 * 1000,

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Reporter to use */
  reporter: [
    ['list'],
    ['json', { outputFile: 'playwright-report/playwright-results.json' }],
    ['html', { outputFolder: 'playwright-report' }]
  ],

  /* Output folder for test artifacts */
  outputDir: 'test-results',

  /* Shared settings for all projects */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://localhost:8765/policy-analyzer/',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    /* Test against other browsers if needed
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    */

    /* Test against mobile viewports if needed
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    */
  ],

  /* Start servers automatically for tests */
  webServer: [
    {
      command: 'npm run dev -- --port 8765',
      url: 'http://localhost:8765/policy-analyzer/',
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: 'npm run preview -- --port 8766',
      url: 'http://localhost:8766/policy-analyzer/',
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
});
