import { test, expect } from "@playwright/test";

test.describe("Basic Application Tests", () => {
  test("should load the homepage", async ({ page }) => {
    await page.goto("/");

    // Just check that the page loads and doesn't have any critical errors
    await expect(page).toHaveURL("/");

    // Check for basic HTML structure
    await expect(page.locator("html")).toBeVisible();
    await expect(page.locator("body")).toBeVisible();
  });

  test("should have working navigation", async ({ page }) => {
    await page.goto("/");

    // Try to navigate to models page
    const modelsLink = page
      .locator('a[href="/models"], [href="/models"]')
      .first();
    if (await modelsLink.isVisible()) {
      await modelsLink.click();
      await expect(page).toHaveURL("/models");
    }
  });

  test("should load models page directly", async ({ page }) => {
    await page.goto("/models");

    // Just check that the models page loads
    await expect(page).toHaveURL("/models");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should load MCP servers page directly", async ({ page }) => {
    await page.goto("/mcp-servers");

    // Just check that the MCP servers page loads
    await expect(page).toHaveURL("/mcp-servers");
    await expect(page.locator("body")).toBeVisible();
  });
});
