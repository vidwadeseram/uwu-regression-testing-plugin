import { defineConfig, devices } from '@playwright/test';

/**
 * Default Playwright configuration for uwu-regression-testing-plugin
 * This config can be imported and extended by workspace-specific configs
 */
export const defaultConfig = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'results.json' }],
    ['list'],
  ],
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
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});

/**
 * Minimal configuration for quick test runs
 */
export const minimalConfig = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

/**
 * CI-optimized configuration
 */
export const ciConfig = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: true,
  retries: 2,
  workers: 4,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'results.json' }],
    ['github'],
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

/**
 * Helper to create workspace-specific config
 */
export function createWorkspaceConfig(options: {
  testDir?: string;
  baseURL?: string;
  outputDir?: string;
  browsers?: Array<'chromium' | 'firefox' | 'webkit'>;
}) {
  const {
    testDir = './tests',
    baseURL = 'http://localhost:3000',
    outputDir = 'playwright-report',
    browsers = ['chromium'],
  } = options;

  const browserProjects = browsers.map(browser => ({
    name: browser,
    use: { ...devices[`Desktop ${browser.charAt(0).toUpperCase() + browser.slice(1)}` as keyof typeof devices] },
  }));

  return defineConfig({
    testDir,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
      ['html', { outputFolder: outputDir }],
      ['json', { outputFile: 'results.json' }],
      ['list'],
    ],
    use: {
      trace: 'on-first-retry',
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
      baseURL,
    },
    projects: browserProjects,
  });
}