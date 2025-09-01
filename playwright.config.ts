import { defineConfig, devices } from '@playwright/test'

/**
 * Optimized Playwright configuration for CI/CD pipeline
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: !process.env.CI,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // Reduced retries from 3 to 1
  workers: process.env.CI ? 1 : undefined, // Reduced from 2 to 1 worker for stability
  timeout: process.env.CI ? 30 * 1000 : 15 * 1000, // Reduced from 60s to 30s
  globalTimeout: process.env.CI ? 5 * 60 * 1000 : 3 * 60 * 1000, // Reduced from 10min to 5min
  expect: {
    timeout: process.env.CI ? 10 * 1000 : 5 * 1000, // Reduced from 15s to 10s
  },
  reporter: process.env.CI
    ? [
        ['github'],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
      ]
    : [['html'], ['list']],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
    actionTimeout: process.env.CI ? 15 * 1000 : 8 * 1000, // Reduced from 20s to 15s
    navigationTimeout: process.env.CI ? 30 * 1000 : 15 * 1000, // Reduced from 60s to 30s
    // Add browser context optimizations
    ignoreHTTPSErrors: true,
    // Reduce resource usage in CI
    ...(process.env.CI && {
      locale: 'en-US',
      timezoneId: 'UTC',
      reducedMotion: 'reduce',
    }),
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Optimize for CI performance
        ...(process.env.CI && {
          viewport: { width: 1280, height: 720 },
          launchOptions: {
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu',
              '--no-first-run',
              '--no-default-browser-check',
              '--disable-background-timer-throttling',
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding',
              '--disable-features=TranslateUI',
              '--disable-ipc-flooding-protection',
              '--disable-web-security',
              '--disable-features=VizDisplayCompositor',
              '--single-process', // Reduce memory usage
              '--memory-pressure-off',
              '--max_old_space_size=4096',
            ],
          },
        }),
      },
    },
  ],

  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run build && npm start',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 60 * 1000, // Reduced from 120s to 60s
      },
})
