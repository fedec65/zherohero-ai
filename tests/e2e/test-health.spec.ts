/**
 * Health check test to validate optimized test setup
 * This test verifies that our API mocking and optimizations work correctly
 */

import { test, expect, helpers } from './setup'

test.describe('Test Setup Health Check', () => {
  test('should complete setup quickly', async ({ page }) => {
    const monitor = await helpers.monitorPerformance(page)
    
    await test.step('Verify page loads with mocked APIs', async () => {
      // Page should be ready due to our optimized setup
      await expect(page).toHaveURL('/')
      await expect(page.locator('body')).toBeVisible()
    })
    
    await test.step('Test API mocking', async () => {
      // Test that our API mocking is working
      const response = await page.request.get('/api/health')
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.status).toBe('ok')
    })
    
    await test.step('Verify fast navigation', async () => {
      // Test navigation is fast
      await page.goto('/models')
      await expect(page).toHaveURL('/models')
      
      await page.goto('/mcp-servers')
      await expect(page).toHaveURL('/mcp-servers')
      
      await page.goto('/')
      await expect(page).toHaveURL('/')
    })
    
    const duration = monitor.end()
    console.log(`Test completed in ${duration}ms`)
    
    // Verify the test completed in reasonable time
    expect(duration).toBeLessThan(10000) // Less than 10 seconds
  })
  
  test('should handle API routing correctly', async ({ page }) => {
    await test.step('Test API endpoints are reachable', async () => {
      // Test health endpoint (should be mocked and return 200)
      const healthResponse = await page.request.get('/api/health')
      expect(healthResponse.status()).toBe(200)
      
      const healthData = await healthResponse.json()
      expect(healthData.status).toBe('ok')
      
      // Test AI endpoint returns proper validation error (503 is expected without API keys)
      const aiResponse = await page.request.post('/api/ai/chat', {
        data: {
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'test' }]
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      // In test environment, expect either 200 (mocked) or 503 (provider not configured)
      expect([200, 503]).toContain(aiResponse.status())
    })
  })
  
  test('should load all main pages quickly', async ({ page }) => {
    const pages = ['/', '/models', '/mcp-servers']
    
    for (const pagePath of pages) {
      await test.step(`Load ${pagePath}`, async () => {
        const monitor = await helpers.monitorPerformance(page)
        
        await page.goto(pagePath)
        await expect(page).toHaveURL(pagePath)
        await expect(page.locator('body')).toBeVisible()
        
        const duration = monitor.end()
        expect(duration).toBeLessThan(3000) // Each page should load in under 3s
      })
    }
  })
})