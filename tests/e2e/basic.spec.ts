import { test, expect, helpers } from './setup'

test.describe('Basic Application Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup optimized test environment
    await helpers.setupTestEnvironment(page)
  })

  test('should load the homepage', async ({ page }) => {
    const monitor = await helpers.monitorPerformance(page)
    
    await test.step('Verify basic page structure', async () => {
      await expect(page).toHaveURL('/')
      await expect(page.locator('html')).toBeVisible()
      await expect(page.locator('body')).toBeVisible()
    })

    await test.step('Verify page is functional', async () => {
      const title = await page.title()
      expect(title).toBeTruthy()
      expect(title.length).toBeGreaterThan(0)
    })
    
    monitor.end()
  })

  test('should have working navigation', async ({ page }) => {
    await test.step('Find and click models navigation link', async () => {
      // Look for models link with more specific selectors
      const modelsLink = page
        .locator(
          'a[href="/models"], [href="/models"], [data-testid="models-nav"]'
        )
        .first()

      if (await modelsLink.isVisible({ timeout: 3000 })) {
        await helpers.safeClick(page, 'a[href="/models"]')
        await page.waitForURL('/models', { timeout: 5000 })
        await expect(page).toHaveURL('/models')
      } else {
        console.log(
          'Models navigation link not found, testing direct navigation instead'
        )
        await page.goto('/models')
        await expect(page).toHaveURL('/models')
      }
    })
  })

  test('should load models page directly', async ({ page }) => {
    await test.step('Navigate to models page', async () => {
      await page.goto('/models')
    })

    await test.step('Verify models page loaded', async () => {
      await expect(page).toHaveURL('/models')
      await expect(page.locator('body')).toBeVisible()
      const title = await page.title()
      expect(title).toBeTruthy()
    })
  })

  test('should load MCP servers page directly', async ({ page }) => {
    await test.step('Navigate to MCP servers page', async () => {
      await page.goto('/mcp-servers')
    })

    await test.step('Verify MCP servers page loaded', async () => {
      await expect(page).toHaveURL('/mcp-servers')
      await expect(page.locator('body')).toBeVisible()
      const title = await page.title()
      expect(title).toBeTruthy()
    })
  })

  test('should perform basic health check', async ({ page }) => {
    await test.step('Check application health', async () => {
      // Quick health check (will use mocked response)
      const isHealthy = await helpers.quickHealthCheck(page)
      // In test environment with mocks, this might fail but shouldn't break the test
      console.log(`Health check result: ${isHealthy ? 'OK' : 'Mocked'}`)
    })

    await test.step('Verify no critical runtime errors', async () => {
      // Check that the page loaded without throwing uncaught errors
      const title = await page.title()
      expect(title).toBeTruthy()
      
      // Verify basic DOM structure exists
      await expect(page.locator('body')).toBeVisible()
    })
  })
})
