/**
 * @jest-environment jsdom
 */

import { describe, expect, it } from "@jest/globals";

// Basic test to ensure Jest is working
describe("Utils Tests", () => {
  it("should pass a basic test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle environment variables", () => {
    expect(process.env.NODE_ENV).toBe("test");
  });

  it("should have test API keys set", () => {
    expect(process.env.OPENAI_API_KEY).toBeDefined();
    expect(process.env.ANTHROPIC_API_KEY).toBeDefined();
  });
});
