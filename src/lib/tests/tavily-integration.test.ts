/**
 * Tavily Search MCP Integration Tests
 *
 * Comprehensive test suite for the Tavily Search MCP server integration.
 * These tests validate functionality without making actual API calls.
 */

// Mock the API calls for testing
global.fetch = jest.fn();

import { TavilySearchClient, TavilyError } from "../services/tavily-search";
import { TavilyMCPServer } from "../mcp/servers/tavily";
import { autoInjectionManager } from "../mcp/auto-injection";
import { useMCPStore } from "../stores/mcp-store";
import { useSettingsStore } from "../stores/settings-store";

// Mock stores
jest.mock("../stores/mcp-store");
jest.mock("../stores/settings-store");

describe("TavilySearchClient", () => {
  let client: TavilySearchClient;
  const mockApiKey = "tvly-test-key-12345678901234567890123456";

  beforeEach(() => {
    client = new TavilySearchClient({
      apiKey: mockApiKey,
      maxResults: 5,
      searchDepth: "basic",
      timeout: 5000,
    });

    // Reset fetch mock
    (fetch as jest.Mock).mockClear();
  });

  describe("API Key Validation", () => {
    it("should accept valid Tavily API key format", () => {
      expect(() => {
        new TavilySearchClient({
          apiKey: "tvly-abcd1234567890abcd1234567890abcd",
        });
      }).not.toThrow();
    });

    it("should reject invalid API key format", () => {
      expect(() => {
        new TavilySearchClient({ apiKey: "invalid-key" });
      }).toThrow(TavilyError);
    });

    it("should reject empty API key", () => {
      expect(() => {
        new TavilySearchClient({ apiKey: "" });
      }).toThrow(TavilyError);
    });
  });

  describe("Search Functionality", () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          answer: "Test answer",
          query: "test query",
          response_time: 0.5,
          results: [
            {
              title: "Test Result",
              url: "https://example.com",
              content: "Test content",
              score: 0.95,
            },
          ],
        }),
      });
    });

    it("should perform basic search", async () => {
      const result = await client.search({
        query: "test query",
        max_results: 5,
      });

      expect(result.query).toBe("test query");
      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe("Test Result");
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("should use cache for duplicate queries", async () => {
      // First search
      await client.search({ query: "test query" });

      // Second search (should use cache)
      await client.search({ query: "test query" });

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("should handle API errors gracefully", async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: async () => JSON.stringify({ error: "Invalid query" }),
      });

      await expect(client.search({ query: "test" })).rejects.toThrow(
        TavilyError,
      );
    });

    it("should retry on retryable errors", async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          text: async () => "Server Error",
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            query: "test",
            results: [],
            response_time: 0.1,
          }),
        });

      const result = await client.search({ query: "test" });
      expect(result.query).toBe("test");
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("Content Extraction", () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              url: "https://example.com",
              title: "Example Page",
              content: "Page content",
              status_code: 200,
            },
          ],
          failed_results: [],
        }),
      });
    });

    it("should extract content from URLs", async () => {
      const result = await client.extract({
        urls: ["https://example.com"],
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe("Example Page");
      expect(result.failed_results).toHaveLength(0);
    });

    it("should validate URL array length", async () => {
      const tooManyUrls = Array(10).fill("https://example.com");

      await expect(client.extract({ urls: tooManyUrls })).rejects.toThrow(
        "Maximum 5 URLs allowed",
      );
    });

    it("should require non-empty URL array", async () => {
      await expect(client.extract({ urls: [] })).rejects.toThrow(
        "URLs array cannot be empty",
      );
    });
  });

  describe("Connection Testing", () => {
    it("should test connection successfully", async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          query: "test connection",
          results: [],
          response_time: 0.1,
        }),
      });

      const result = await client.testConnection();
      expect(result.success).toBe(true);
      expect(result.latency).toBeGreaterThan(0);
    });

    it("should handle connection failures", async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const result = await client.testConnection();
      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });
});

describe("TavilyMCPServer", () => {
  let server: TavilyMCPServer;
  let mockServerConfig: any;

  beforeEach(() => {
    mockServerConfig = {
      id: "tavily-search",
      name: "Tavily Search",
      description: "Test server",
      url: "https://api.tavily.com/mcp",
      enabled: true,
      autoInject: true,
      capabilities: ["tools", "resources"],
      config: {
        apiKey: "tvly-test-key-12345678901234567890123456",
        maxResults: 5,
      },
      status: "disconnected",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    server = new TavilyMCPServer(mockServerConfig);

    // Mock TavilySearchClient
    (TavilySearchClient.prototype.testConnection as jest.Mock) = jest
      .fn()
      .mockResolvedValue({ success: true, latency: 100 });
  });

  describe("Server Initialization", () => {
    it("should initialize with valid configuration", async () => {
      await expect(server.initialize()).resolves.not.toThrow();
    });

    it("should fail initialization without API key", async () => {
      const configWithoutKey = { ...mockServerConfig, config: {} };
      const serverWithoutKey = new TavilyMCPServer(configWithoutKey);

      await expect(serverWithoutKey.initialize()).rejects.toThrow(
        "Tavily API key is required",
      );
    });
  });

  describe("Health Check", () => {
    beforeEach(async () => {
      await server.initialize();
    });

    it("should return healthy status when connected", async () => {
      const health = await server.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.latency).toBeGreaterThan(0);
      expect(health.capabilities).toContain("tools");
    });

    it("should return unhealthy when not initialized", async () => {
      const uninitializedServer = new TavilyMCPServer(mockServerConfig);
      const health = await uninitializedServer.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.capabilities).toHaveLength(0);
    });
  });

  describe("Tool Execution", () => {
    beforeEach(async () => {
      await server.initialize();

      // Mock successful search
      (TavilySearchClient.prototype.search as jest.Mock) = jest
        .fn()
        .mockResolvedValue({
          query: "test query",
          results: [
            {
              title: "Test",
              url: "https://test.com",
              content: "Content",
              score: 0.9,
            },
          ],
          response_time: 0.1,
        });
    });

    it("should execute search tool successfully", async () => {
      const result = await server.executeTool({
        name: "tavily_search",
        arguments: {
          query: "test query",
          max_results: 5,
        },
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("test query");
    });

    it("should handle invalid tool names", async () => {
      const result = await server.executeTool({
        name: "invalid_tool",
        arguments: {},
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Unknown tool");
    });

    it("should validate search query", async () => {
      const result = await server.executeTool({
        name: "tavily_search",
        arguments: {
          query: "", // Empty query
        },
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Invalid search query");
    });
  });

  describe("Resources", () => {
    beforeEach(async () => {
      await server.initialize();
    });

    it("should provide search history resource", async () => {
      const resources = server.getResources();
      const historyResource = resources.find(
        (r) => r.uri === "tavily://search-history",
      );

      expect(historyResource).toBeDefined();
      expect(historyResource?.name).toBe("Search History");
    });

    it("should return search history content", async () => {
      const resource = await server.getResource("tavily://search-history");

      expect(resource.mimeType).toBe("application/json");
      expect(() => JSON.parse(resource.content)).not.toThrow();
    });

    it("should handle unknown resources", async () => {
      await expect(server.getResource("tavily://unknown")).rejects.toThrow(
        "Unknown resource",
      );
    });
  });
});

describe("Auto-injection Manager", () => {
  let mockChatParams: any;
  let mockContext: any;

  beforeEach(() => {
    mockChatParams = {
      model: "gpt-4o",
      messages: [{ role: "user", content: "Test message" }],
    };

    mockContext = {
      chatId: "test-chat",
      messageId: "test-message",
      requestId: "test-request",
    };

    // Reset auto-injection manager
    autoInjectionManager.getRegisteredServers().clear();
  });

  describe("Tool Injection", () => {
    it("should inject tools when servers are available", async () => {
      const mockServer = {
        getTools: () => [
          {
            name: "tavily_search",
            description: "Search the web",
            inputSchema: {
              type: "object",
              properties: { query: { type: "string" } },
              required: ["query"],
            },
          },
        ],
      } as any;

      autoInjectionManager.registerServer("tavily-search", mockServer);

      const mockEnabledServers = [
        {
          id: "tavily-search",
          enabled: true,
          autoInject: true,
        } as any,
      ];

      const enhancedParams = await autoInjectionManager.injectTools(
        mockChatParams,
        mockEnabledServers,
        mockContext,
      );

      expect(enhancedParams.tools).toBeDefined();
      expect(enhancedParams.tools).toHaveLength(1);
      expect(enhancedParams.tools[0].function.name).toBe("tavily_search");
    });

    it("should not inject tools when no servers available", async () => {
      const enhancedParams = await autoInjectionManager.injectTools(
        mockChatParams,
        [],
        mockContext,
      );

      expect(enhancedParams.tools).toBeUndefined();
    });
  });

  describe("Function Call Processing", () => {
    it("should process function calls successfully", async () => {
      const mockServer = {
        executeTool: jest.fn().mockResolvedValue({
          content: [{ type: "text", text: "Search results here" }],
          isError: false,
        }),
        getTools: () => [
          {
            name: "tavily_search",
            description: "Search",
            inputSchema: { type: "object", properties: {} },
          },
        ],
      } as any;

      autoInjectionManager.registerServer("tavily-search", mockServer);

      const toolCalls = [
        {
          id: "call_123",
          type: "function" as const,
          function: {
            name: "tavily_search",
            arguments: JSON.stringify({ query: "test" }),
          },
        },
      ];

      const results = await autoInjectionManager.processFunctionCalls(
        toolCalls,
        mockContext,
      );

      expect(results).toHaveLength(1);
      expect(results[0].role).toBe("tool");
      expect(results[0].content).toContain("Search results here");
      expect(mockServer.executeTool).toHaveBeenCalledWith({
        name: "tavily_search",
        arguments: { query: "test" },
      });
    });

    it("should handle function call errors", async () => {
      const mockServer = {
        executeTool: jest.fn().mockRejectedValue(new Error("Tool error")),
        getTools: () => [{ name: "tavily_search" }],
      } as any;

      autoInjectionManager.registerServer("tavily-search", mockServer);

      const toolCalls = [
        {
          id: "call_123",
          type: "function" as const,
          function: {
            name: "tavily_search",
            arguments: JSON.stringify({ query: "test" }),
          },
        },
      ];

      const results = await autoInjectionManager.processFunctionCalls(
        toolCalls,
        mockContext,
      );

      expect(results[0].content).toContain("Error executing function");
    });
  });

  describe("Statistics", () => {
    it("should track function call statistics", () => {
      const stats = autoInjectionManager.getFunctionCallStats();

      expect(stats).toHaveProperty("totalChats");
      expect(stats).toHaveProperty("totalFunctionCalls");
      expect(stats).toHaveProperty("functionCounts");
      expect(stats).toHaveProperty("errorRate");
    });
  });
});

describe("Store Integration", () => {
  describe("MCP Store", () => {
    it("should have Tavily server in built-in servers", () => {
      const mcpStore = useMCPStore.getState();
      const tavilyServer = mcpStore.builtInServers.find(
        (s) => s.id === "tavily-search",
      );

      expect(tavilyServer).toBeDefined();
      expect(tavilyServer?.name).toBe("Tavily Search");
      expect(tavilyServer?.capabilities).toContain("tools");
    });
  });

  describe("Settings Store", () => {
    it("should validate Tavily API key format", async () => {
      const settingsStore = useSettingsStore.getState();

      const validKey = await settingsStore.validateApiKey(
        "tavily",
        "tvly-abcd1234567890abcd1234567890abcd",
      );
      expect(validKey).toBe(true);

      const invalidKey = await settingsStore.validateApiKey(
        "tavily",
        "invalid-key",
      );
      expect(invalidKey).toBe(false);
    });
  });
});

describe("Error Handling", () => {
  describe("TavilyError", () => {
    it("should create error with correct properties", () => {
      const error = new TavilyError("Test error", {
        status: 400,
        code: "BAD_REQUEST",
        retryable: false,
      });

      expect(error.message).toBe("Test error");
      expect(error.status).toBe(400);
      expect(error.code).toBe("BAD_REQUEST");
      expect(error.retryable).toBe(false);
    });

    it("should default retryable to true", () => {
      const error = new TavilyError("Test error");
      expect(error.retryable).toBe(true);
    });
  });
});

describe("Utility Functions", () => {
  describe("Query Validation", () => {
    const { validateSearchQuery } = require("../services/tavily-search");

    it("should validate correct queries", () => {
      const result = validateSearchQuery("valid search query");
      expect(result.isValid).toBe(true);
    });

    it("should reject empty queries", () => {
      const result = validateSearchQuery("");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("empty");
    });

    it("should reject too long queries", () => {
      const longQuery = "a".repeat(500);
      const result = validateSearchQuery(longQuery);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("too long");
    });
  });

  describe("Result Formatting", () => {
    const { formatSearchResultsForAI } = require("../services/tavily-search");

    it("should format search results correctly", () => {
      const mockResponse = {
        query: "test query",
        answer: "Test answer",
        results: [
          {
            title: "Test Result",
            url: "https://example.com",
            content: "Test content",
            score: 0.95,
          },
        ],
      };

      const formatted = formatSearchResultsForAI(mockResponse);
      expect(formatted).toContain("test query");
      expect(formatted).toContain("Test answer");
      expect(formatted).toContain("Test Result");
      expect(formatted).toContain("https://example.com");
    });
  });
});
