import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Allow 1 retry locally for flake detection
  workers: process.env.CI ? 1 : undefined,

  // Enhanced reporting for artifacts
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'], // Console output with progress
  ],

  use: {
    baseURL: 'http://localhost:5173',

    // Enhanced tracing and artifacts for debugging
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Anti-flake settings
    actionTimeout: 15000, // 15s for individual actions
    navigationTimeout: 30000, // 30s for page navigation

    // Ensure consistent viewport
    viewport: { width: 1280, height: 720 },

    // Disable animations to reduce flakes
    launchOptions: {
      slowMo: process.env.SLOW_MO ? 100 : 0,
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  expect: {
    // Visual regression threshold
    threshold: 0.2,
    // Increased timeout for assertions to reduce flakes
    timeout: 10000,
    // Animation handling
    toHaveScreenshot: {
      mode: 'css',
      animations: 'disabled',
    },
  },

  // Output directories for artifacts
  outputDir: 'test-results',
});