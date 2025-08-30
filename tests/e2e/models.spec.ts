import { test, expect } from '@playwright/test'

test.describe('Models Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/models')
  })

  test('should display model tabs', async ({ page }) => {
    // Check for model tabs
    await expect(
      page.locator('button', { hasText: 'Built-in Models' })
    ).toBeVisible()
    await expect(
      page.locator('button', { hasText: 'Custom Models' })
    ).toBeVisible()
    await expect(
      page.locator('button', { hasText: 'Add Custom Model' })
    ).toBeVisible()
    await expect(
      page.locator('button', { hasText: 'OpenRouter' })
    ).toBeVisible()
  })

  test('should display model providers', async ({ page }) => {
    // Check for provider sections
    await expect(page.locator('text=OpenAI')).toBeVisible()
    await expect(page.locator('text=Anthropic')).toBeVisible()
    await expect(page.locator('text=Gemini')).toBeVisible()
    await expect(page.locator('text=xAI')).toBeVisible()
    await expect(page.locator('text=DeepSeek')).toBeVisible()
  })

  test('should display model cards', async ({ page }) => {
    // Wait for model cards to load
    await page.waitForSelector('[data-testid="model-card"]', {
      timeout: 10000,
    })

    // Check that model cards are displayed
    const modelCards = page.locator('[data-testid="model-card"]')
    await expect(modelCards.first()).toBeVisible()

    // Count should be greater than 0
    const count = await modelCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should show model details', async ({ page }) => {
    // Wait for model cards to load
    await page.waitForSelector('[data-testid="model-card"]', {
      timeout: 10000,
    })

    const firstModelCard = page.locator('[data-testid="model-card"]').first()

    // Check that model card has basic information
    await expect(firstModelCard).toContainText(
      /GPT|Claude|Gemini|Grok|DeepSeek/
    )

    // Check for configure button
    const configureButton = firstModelCard.locator('button', {
      hasText: 'Configure',
    })
    await expect(configureButton).toBeVisible()
  })

  test('should switch between model tabs', async ({ page }) => {
    // Click on Custom Models tab
    await page.getByRole('button', { name: 'Custom Models' }).click()

    // Wait for tab content to change
    await page.waitForTimeout(500)

    // Should show empty state or custom models content
    await expect(page.locator('text=No custom models')).toBeVisible()
  })
})
