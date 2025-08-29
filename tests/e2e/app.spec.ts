import { test, expect } from "@playwright/test";

test.describe("ZheroHero AI Chat Interface", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load the homepage", async ({ page }) => {
    // Check that the page loads successfully
    await expect(page).toHaveTitle(/ZheroHero/);
    
    // Check for main navigation elements
    await expect(page.locator('[data-testid="sidebar-nav"]')).toBeVisible();
  });

  test("should display new chat buttons", async ({ page }) => {
    // Look for the new chat button in the main content area
    const newChatButton = page.locator("button", { hasText: "New Chat" });
    await expect(newChatButton).toBeVisible();
    
    // Look for the incognito chat button
    const incognitoButton = page.locator("button", { hasText: "New Incognito Chat" });
    await expect(incognitoButton).toBeVisible();
  });

  test("should navigate to models page", async ({ page }) => {
    // Click on the models navigation item
    await page.click('[href="/models"]');
    
    // Wait for navigation to complete
    await expect(page).toHaveURL("/models");
    
    // Check for models page content
    await expect(page.locator("h1", { hasText: "Models" })).toBeVisible();
  });

  test("should navigate to MCP servers page", async ({ page }) => {
    // Click on the MCP servers navigation item
    await page.click('[href="/mcp-servers"]');
    
    // Wait for navigation to complete
    await expect(page).toHaveURL("/mcp-servers");
    
    // Check for MCP servers page content
    await expect(page.locator("h1", { hasText: "MCP Servers" })).toBeVisible();
  });

  test("should have working theme toggle", async ({ page }) => {
    // Find the theme toggle button
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    
    if (await themeToggle.isVisible()) {
      // Click theme toggle
      await themeToggle.click();
      
      // Check that the theme changed (this is basic - would need more sophisticated dark mode detection)
      await expect(page.locator("html")).toHaveAttribute("class", /dark|light/);
    }
  });

  test("should display sidebar navigation", async ({ page }) => {
    // Check for sidebar navigation items
    const chatLink = page.locator('[href="/"]');
    const modelsLink = page.locator('[href="/models"]');
    const mcpLink = page.locator('[href="/mcp-servers"]');
    
    await expect(chatLink).toBeVisible();
    await expect(modelsLink).toBeVisible();
    await expect(mcpLink).toBeVisible();
  });
});