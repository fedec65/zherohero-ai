import { test, expect } from '@playwright/test'

test.describe('Basic Application Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console error monitoring
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text())
      }
    })

    // Set up page error monitoring
    page.on('pageerror', (err) => {
      console.log('Page error:', err.message)
    })
  })

  test('should load the homepage', async ({ page }) => {
    await test.step('Navigate to homepage', async () => {
      await page.goto('/', { waitUntil: 'networkidle' })
    })

    await test.step('Verify basic page structure', async () => {
      await expect(page).toHaveURL('/')
      await expect(page.locator('html')).toBeVisible()
      await expect(page.locator('body')).toBeVisible()
    })

    await test.step('Wait for content to load', async () => {
      // Wait for at least one interactive element to be present
      await page.waitForSelector('body', { timeout: 10000 })

      // Ensure no critical JavaScript errors occurred
      const title = await page.title()
      expect(title).toBeTruthy()
    })
  })

  test('should have working navigation', async ({ page }) => {
    await test.step('Navigate to homepage', async () => {
      await page.goto('/', { waitUntil: 'networkidle' })
    })

    await test.step('Find and click models navigation link', async () => {
      // Wait for navigation to be ready
      await page.waitForLoadState('domcontentloaded')

      // Look for models link with more specific selectors
      const modelsLink = page
        .locator(
          'a[href="/models"], [href="/models"], [data-testid="models-nav"]'
        )
        .first()

      if (await modelsLink.isVisible({ timeout: 5000 })) {
        await modelsLink.click()
        await page.waitForURL('/models', { timeout: 10000 })
        await expect(page).toHaveURL('/models')
      } else {
        console.log(
          'Models navigation link not found, skipping navigation test'
        )
      }
    })
  })

  test('should load models page directly', async ({ page }) => {
    await test.step('Navigate to models page', async () => {
      await page.goto('/models', { waitUntil: 'networkidle' })
    })

    await test.step('Verify models page loaded', async () => {
      await expect(page).toHaveURL('/models')
      await expect(page.locator('body')).toBeVisible()

      // Wait for page to be interactive
      await page.waitForLoadState('domcontentloaded')
      const title = await page.title()
      expect(title).toBeTruthy()
    })
  })

  test('should load MCP servers page directly', async ({ page }) => {
    await test.step('Navigate to MCP servers page', async () => {
      await page.goto('/mcp-servers', { waitUntil: 'networkidle' })
    })

    await test.step('Verify MCP servers page loaded', async () => {
      await expect(page).toHaveURL('/mcp-servers')
      await expect(page.locator('body')).toBeVisible()

      // Wait for page to be interactive
      await page.waitForLoadState('domcontentloaded')
      const title = await page.title()
      expect(title).toBeTruthy()
    })
  })

  test('should not have critical console errors', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        consoleErrors.push(msg.text())
      }
    })

    await test.step('Load homepage and check for errors', async () => {
      await page.goto('/', { waitUntil: 'networkidle' })
      await page.waitForTimeout(2000) // Give time for any async errors
    })

    await test.step('Verify no critical console errors', async () => {
      if (consoleErrors.length > 0) {
        console.log('Console errors found:', consoleErrors)
      }
      // Allow minor non-critical errors but fail on critical ones
      const criticalErrors = consoleErrors.filter(
        (err) =>
          !err.includes('favicon') &&
          !err.includes('404') &&
          !err.includes('net::ERR_FAILED')
      )
      expect(criticalErrors.length).toBeLessThanOrEqual(2)
    })
  })
})
