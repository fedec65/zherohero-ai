import { defineConfig, devices } from '@playwright/test'

/**
 * Optimized Playwright configuration for CI/CD pipeline
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: !process.env.CI,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 0, // Increased retries for flaky CI
  workers: process.env.CI ? 2 : undefined, // Increase workers for better parallelization
  timeout: process.env.CI ? 60 * 1000 : 30 * 1000, // 60s in CI for complex operations
  globalTimeout: process.env.CI ? 10 * 60 * 1000 : 5 * 60 * 1000, // 10min CI, 5min local
  expect: {
    timeout: process.env.CI ? 15 * 1000 : 10 * 1000, // Increased for slow CI
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
    actionTimeout: process.env.CI ? 20 * 1000 : 10 * 1000, // Increased for slow operations
    navigationTimeout: process.env.CI ? 60 * 1000 : 30 * 1000, // Increased for app startup
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
        timeout: 120 * 1000,
      },
})
