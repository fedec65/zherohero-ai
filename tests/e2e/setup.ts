/**
 * Optimized E2E Test Setup and Utilities
 * Handles API mocking, performance optimization, and common test patterns
 */

import { test as base, expect } from '@playwright/test'

// Setup comprehensive API mocking
async function setupApiMocking(page: any) {
  // Mock all API routes to prevent 404/400 errors
  await page.route('**/api/**', async (route: any) => {
    const url = route.request().url()
    const method = route.request().method()
    
    // Health check endpoint
    if (url.includes('/api/health')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() })
      })
    }
    
    // AI endpoints
    if (url.includes('/api/ai/')) {
      if (method === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            choices: [{ message: { content: 'Test response' } }],
            usage: { total_tokens: 100 }
          })
        })
      } else {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'AI API ready' })
        })
      }
    }
    
    // Models endpoint
    if (url.includes('/api/models') || url.includes('/models')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          models: [
            { id: 'test-model', name: 'Test Model', provider: 'test' }
          ]
        })
      })
    }
    
    // MCP servers endpoint
    if (url.includes('/api/mcp-servers')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ servers: [] })
      })
    }
    
    // Chat endpoints
    if (url.includes('/api/chat')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'test-chat', messages: [] })
      })
    }
    
    // Default fallback for other API calls
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: null })
    })
  })
  
  // Mock external resources that might cause delays
  await page.route('**/*.{png,jpg,jpeg,gif,svg,webp,ico}', (route: any) => {
    route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    })
  })

  // Disable external requests that might slow down tests
  await page.route('**/fonts.googleapis.com/**', route => route.abort())
  await page.route('**/analytics.**', route => route.abort())
  await page.route('**/gtag/**', route => route.abort())
}

// Extend base test with optimized setup
export const test = base.extend({
  // Optimized page setup with API mocking
  page: async ({ page }, use) => {
    // Setup API mocking before navigation
    await setupApiMocking(page)
    
    // Navigate to page
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Wait for basic hydration (reduced timeout)
    await page.waitForFunction(
      () => {
        return window.document.readyState === 'complete'
      },
      { timeout: 10000 }
    )

    // Reduced wait time for API settling
    await page.waitForTimeout(200)

    await use(page)
  },
})

// Helper functions for common test patterns
export const helpers = {
  // Wait for element with reduced timeout
  async waitForElement(page: any, selector: string, timeout = 5000) {
    return await page.waitForSelector(selector, {
      state: 'visible',
      timeout,
    })
  },

  // Safe click with wait
  async safeClick(page: any, selector: string) {
    await this.waitForElement(page, selector)
    await page.click(selector)
    await page.waitForTimeout(50) // Reduced delay for state updates
  },

  // Safe type with clear
  async safeType(page: any, selector: string, text: string) {
    await this.waitForElement(page, selector)
    await page.fill(selector, text) // Use fill instead of type for speed
  },

  // Wait for network idle with reduced timeout
  async waitForNetworkIdle(page: any, timeout = 2000) {
    try {
      await page.waitForLoadState('networkidle', { timeout })
    } catch (error) {
      // Continue if network idle timeout (common in mocked environments)
      console.log('Network idle timeout (expected with mocked APIs)')
    }
  },

  // Check for console errors
  async getConsoleErrors(page: any): Promise<string[]> {
    const errors: string[] = []

    page.on('console', (msg: any) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    page.on('pageerror', (error: any) => {
      errors.push(error.message)
    })

    return errors
  },

  // Clear browser storage
  async clearStorage(page: any) {
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()

      // Clear IndexedDB
      if ('indexedDB' in window) {
        indexedDB.databases?.().then((databases) => {
          databases.forEach((db) => {
            if (db.name) {
              indexedDB.deleteDatabase(db.name)
            }
          })
        })
      }
    })
  },

  // Mock API responses for testing (deprecated - use setupApiMocking)
  async mockApiResponse(page: any, url: string, response: any) {
    await page.route(url, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      })
    })
  },

  // Setup optimized test environment
  async setupTestEnvironment(page: any) {
    // Set test mode and disable animations before page load
    await page.addInitScript(() => {
      // Set test mode
      window.localStorage.setItem('test-mode', 'true')
      
      // Disable animations and transitions for faster tests
      const style = document.createElement('style')
      style.innerHTML = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          transform: none !important;
        }
      `
      document.head.appendChild(style)
      
      // Mock console methods to reduce noise
      console.log = () => {}
      console.warn = () => {}
      console.info = () => {}
    })
  },

  // Add performance monitoring
  async monitorPerformance(page: any) {
    const startTime = Date.now()
    return {
      end: () => {
        const duration = Date.now() - startTime
        if (duration > 5000) {
          console.warn(`Test operation took ${duration}ms (over 5s threshold)`)
        }
        return duration
      }
    }
  },

  // Quick health check
  async quickHealthCheck(page: any) {
    try {
      const response = await page.request.get('/api/health', { timeout: 3000 })
      return response.ok()
    } catch (error) {
      console.log('Health check failed (expected in test environment)')
      return false
    }
  },
}

export { expect }