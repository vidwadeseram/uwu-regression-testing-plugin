import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for uwu-regression-testing-plugin development
 * This config is used for testing the plugin itself
 */
export default defineConfig({
  testDir: './src/playwright/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'echo "No web server configured for plugin tests"',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});