/**
 * E2E Test Setup and Utilities
 * Handles common test patterns and ensures proper initialization
 */

import { test as base, expect } from '@playwright/test'

// Extend base test with common setup
export const test = base.extend({
  // Auto-wait for app to be ready before each test
  page: async ({ page }, use) => {
    // Wait for the app to fully load
    await page.goto('/')

    // Wait for hydration to complete
    await page.waitForFunction(
      () => {
        return (
          window.document.readyState === 'complete' &&
          !document.querySelector('[data-testid="loading"]')
        )
      },
      { timeout: 30000 }
    )

    // Wait for any initial API calls to settle
    await page.waitForTimeout(1000)

    // Ensure no React errors
    const errors = await page.evaluate(() => {
      const errors: string[] = []

      // Check for React error messages
      const errorElements = document.querySelectorAll('[data-testid="error"]')
      errorElements.forEach((el) => {
        if (el.textContent) errors.push(el.textContent)
      })

      return errors
    })

    if (errors.length > 0) {
      throw new Error(`React errors detected: ${errors.join(', ')}`)
    }

    await use(page)
  },
})

// Helper functions for common test patterns
export const helpers = {
  // Wait for element with retry logic
  async waitForElement(page: any, selector: string, timeout = 10000) {
    return await page.waitForSelector(selector, {
      state: 'visible',
      timeout,
    })
  },

  // Safe click with wait
  async safeClick(page: any, selector: string) {
    await this.waitForElement(page, selector)
    await page.click(selector)
    await page.waitForTimeout(100) // Small delay for state updates
  },

  // Safe type with clear
  async safeType(page: any, selector: string, text: string) {
    await this.waitForElement(page, selector)
    await page.fill(selector, '') // Clear first
    await page.type(selector, text, { delay: 50 }) // Slower typing
  },

  // Wait for network idle
  async waitForNetworkIdle(page: any, timeout = 5000) {
    await page.waitForLoadState('networkidle', { timeout })
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

  // Mock API responses for testing
  async mockApiResponse(page: any, url: string, response: any) {
    await page.route(url, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      })
    })
  },

  // Setup test environment
  async setupTestEnvironment(page: any) {
    // Mock external API calls
    await this.mockApiResponse(page, '**/api/ai/**', {
      success: true,
      data: { message: 'Test response' },
    })

    // Set test mode
    await page.addInitScript(() => {
      window.localStorage.setItem('test-mode', 'true')
    })

    // Disable animations for faster tests
    await page.addInitScript(() => {
      const style = document.createElement('style')
      style.innerHTML = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
      document.head.appendChild(style)
    })
  },
}

export { expect }
