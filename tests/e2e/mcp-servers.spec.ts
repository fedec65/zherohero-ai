import { test, expect } from "@playwright/test";

test.describe("MCP Servers Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mcp-servers");
  });

  test("should display MCP servers page", async ({ page }) => {
    // Check for page title
    await expect(page.locator("h1", { hasText: "MCP Servers" })).toBeVisible();
    
    // Check for info banner
    await expect(page.locator("text=Model Context Protocol")).toBeVisible();
  });

  test("should display MCP server tabs", async ({ page }) => {
    // Check for server tabs
    await expect(page.locator("button", { hasText: "Built-in Servers" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Custom Servers" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Add Custom Server" })).toBeVisible();
  });

  test("should display Tavily Search server", async ({ page }) => {
    // Wait for server cards to load
    await page.waitForSelector('[data-testid="mcp-server-card"]', { timeout: 5000 });
    
    // Check for Tavily Search server
    await expect(page.locator("text=Tavily Search")).toBeVisible();
    await expect(page.locator("text=Web search capabilities")).toBeVisible();
  });

  test("should show server status indicators", async ({ page }) => {
    // Wait for server cards to load
    await page.waitForSelector('[data-testid="mcp-server-card"]', { timeout: 5000 });
    
    const serverCard = page.locator('[data-testid="mcp-server-card"]').first();
    
    // Check for status indicator (enabled/disabled)
    await expect(serverCard.locator('[data-testid="server-status"]')).toBeVisible();
  });

  test("should switch to custom servers tab", async ({ page }) => {
    // Click on Custom Servers tab
    await page.getByRole('button', { name: 'Custom Servers' }).click();
    
    // Wait for tab content to change
    await page.waitForTimeout(500);
    
    // Should show empty state or custom servers content
    await expect(page.locator("text=No custom servers")).toBeVisible();
  });

  test("should display info banner", async ({ page }) => {
    // Check for MCP info banner
    const infoBanner = page.locator('[data-testid="mcp-info-banner"]');
    await expect(infoBanner).toBeVisible();
    
    // Check banner content
    await expect(infoBanner).toContainText("Model Context Protocol");
    await expect(infoBanner).toContainText("auto-injected into OpenAI");
  });
});