/**
 * Tavily Search MCP Server Implementation
 * 
 * Implements the Model Context Protocol for Tavily Search integration,
 * providing web search tools and resources for AI models.
 */

import { 
  TavilySearchClient, 
  TavilyConfig, 
  TavilyError,
  formatSearchResultsForAI,
  validateSearchQuery,
  extractDomain
} from '../../services/tavily-search';
import { MCPServer, MCPCapability } from '../../stores/types';

// MCP Protocol types
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPToolCallParams {
  name: string;
  arguments: Record<string, unknown>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

/**
 * Tavily MCP Server - Handles MCP protocol communication for Tavily Search
 */
export class TavilyMCPServer {
  private client: TavilySearchClient | null = null;
  private config: MCPServer;
  private isConnected = false;
  private lastHealthCheck: Date | null = null;
  private searchHistory: Array<{
    query: string;
    timestamp: Date;
    resultCount: number;
  }> = [];

  constructor(config: MCPServer) {
    this.config = config;
  }

  /**
   * Initialize the Tavily client
   */
  async initialize(): Promise<void> {
    const apiKey = this.config.config.apiKey as string;
    
    if (!apiKey) {
      throw new Error('Tavily API key is required');
    }

    try {
      this.client = new TavilySearchClient({
        apiKey,
        maxResults: (this.config.config.maxResults as number) || 10,
        searchDepth: (this.config.config.searchDepth as 'basic' | 'advanced') || 'advanced',
        includeImages: (this.config.config.includeImages as boolean) || false,
        includeAnswer: (this.config.config.includeAnswer as boolean) ?? true,
        includeRawContent: (this.config.config.includeRawContent as boolean) || false,
      });

      // Test the connection
      const testResult = await this.client.testConnection();
      if (!testResult.success) {
        throw new Error(testResult.error || 'Connection test failed');
      }

      this.isConnected = true;
      this.lastHealthCheck = new Date();
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Disconnect the server
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.clearCache();
      this.client = null;
    }
    this.isConnected = false;
  }

  /**
   * Check if server is healthy
   */
  async healthCheck(): Promise<{ healthy: boolean; latency: number; capabilities: MCPCapability[] }> {
    if (!this.client || !this.isConnected) {
      return {
        healthy: false,
        latency: 0,
        capabilities: [],
      };
    }

    try {
      const testResult = await this.client.testConnection();
      this.lastHealthCheck = new Date();
      
      return {
        healthy: testResult.success,
        latency: testResult.latency,
        capabilities: this.getCapabilities(),
      };
    } catch (error) {
      return {
        healthy: false,
        latency: 0,
        capabilities: [],
      };
    }
  }

  /**
   * Get server capabilities
   */
  getCapabilities(): MCPCapability[] {
    return ['tools', 'resources'];
  }

  /**
   * Get available tools
   */
  getTools(): MCPTool[] {
    return [
      {
        name: 'tavily_search',
        description: 'Search the web using Tavily API for real-time information, news, and content. Returns relevant search results with content summaries.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query to execute',
            },
            search_depth: {
              type: 'string',
              enum: ['basic', 'advanced'],
              description: 'Search depth: basic for quick results, advanced for comprehensive search',
              default: 'advanced',
            },
            max_results: {
              type: 'integer',
              minimum: 1,
              maximum: 20,
              description: 'Maximum number of search results to return',
              default: 10,
            },
            include_answer: {
              type: 'boolean',
              description: 'Include a quick answer summary if available',
              default: true,
            },
            include_images: {
              type: 'boolean',
              description: 'Include related images in results',
              default: false,
            },
            include_domains: {
              type: 'array',
              items: { type: 'string' },
              description: 'Only include results from these domains',
            },
            exclude_domains: {
              type: 'array',
              items: { type: 'string' },
              description: 'Exclude results from these domains',
            },
            days: {
              type: 'integer',
              minimum: 1,
              maximum: 365,
              description: 'Restrict results to content from the last N days',
            },
            topic: {
              type: 'string',
              enum: ['general', 'news', 'finance', 'academic'],
              description: 'Search topic focus',
              default: 'general',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'tavily_extract',
        description: 'Extract and summarize content from specific URLs using Tavily API. Useful for getting clean, readable content from web pages.',
        inputSchema: {
          type: 'object',
          properties: {
            urls: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
              maxItems: 5,
              description: 'URLs to extract content from (max 5)',
            },
            include_raw_content: {
              type: 'boolean',
              description: 'Include raw HTML content along with processed text',
              default: false,
            },
          },
          required: ['urls'],
        },
      },
      {
        name: 'tavily_get_usage',
        description: 'Get current API usage statistics and remaining quota for Tavily API.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  /**
   * Get available resources
   */
  getResources(): MCPResource[] {
    const resources: MCPResource[] = [
      {
        uri: 'tavily://search-history',
        name: 'Search History',
        description: 'Recent search queries and their results',
        mimeType: 'application/json',
      },
      {
        uri: 'tavily://cache-stats',
        name: 'Cache Statistics',
        description: 'Current cache usage and performance statistics',
        mimeType: 'application/json',
      },
    ];

    // Add search history entries as individual resources
    this.searchHistory.forEach((entry, index) => {
      resources.push({
        uri: `tavily://search-history/${index}`,
        name: `Search: "${entry.query.substring(0, 50)}${entry.query.length > 50 ? '...' : ''}"`,
        description: `Search performed on ${entry.timestamp.toLocaleString()} (${entry.resultCount} results)`,
        mimeType: 'application/json',
      });
    });

    return resources;
  }

  /**
   * Execute a tool call
   */
  async executeTool(params: MCPToolCallParams): Promise<MCPToolResult> {
    if (!this.client || !this.isConnected) {
      return {
        content: [{
          type: 'text',
          text: 'Tavily Search server is not connected. Please check your API key and connection.',
        }],
        isError: true,
      };
    }

    try {
      switch (params.name) {
        case 'tavily_search':
          return await this.executeSearch(params.arguments);
        case 'tavily_extract':
          return await this.executeExtract(params.arguments);
        case 'tavily_get_usage':
          return await this.executeGetUsage();
        default:
          throw new Error(`Unknown tool: ${params.name}`);
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error executing ${params.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }

  /**
   * Execute search tool
   */
  private async executeSearch(args: Record<string, unknown>): Promise<MCPToolResult> {
    const query = args.query as string;
    
    // Validate query
    const validation = validateSearchQuery(query);
    if (!validation.isValid) {
      return {
        content: [{
          type: 'text',
          text: `Invalid search query: ${validation.error}`,
        }],
        isError: true,
      };
    }

    try {
      const searchParams = {
        query,
        search_depth: (args.search_depth as 'basic' | 'advanced') || 'advanced',
        max_results: (args.max_results as number) || 10,
        include_answer: (args.include_answer as boolean) ?? true,
        include_images: (args.include_images as boolean) || false,
        include_domains: args.include_domains as string[] | undefined,
        exclude_domains: args.exclude_domains as string[] | undefined,
        days: args.days as number | undefined,
        topic: (args.topic as 'general' | 'news' | 'finance' | 'academic') || 'general',
      };

      const result = await this.client!.search(searchParams);
      
      // Add to search history
      this.searchHistory.unshift({
        query,
        timestamp: new Date(),
        resultCount: result.results.length,
      });
      
      // Keep only last 50 searches
      if (this.searchHistory.length > 50) {
        this.searchHistory = this.searchHistory.slice(0, 50);
      }

      // Format results for AI consumption
      const formattedResults = formatSearchResultsForAI(result);
      
      const content: MCPToolResult['content'] = [{
        type: 'text',
        text: formattedResults,
      }];

      // Add structured data as JSON
      content.push({
        type: 'text',
        text: `\n\n--- RAW DATA ---\n${JSON.stringify(result, null, 2)}`,
      });

      return { content };
    } catch (error) {
      const errorMessage = error instanceof TavilyError 
        ? `Tavily API Error: ${error.message}` 
        : `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`;

      return {
        content: [{
          type: 'text',
          text: errorMessage,
        }],
        isError: true,
      };
    }
  }

  /**
   * Execute extract tool
   */
  private async executeExtract(args: Record<string, unknown>): Promise<MCPToolResult> {
    const urls = args.urls as string[];
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'URLs array is required and cannot be empty',
        }],
        isError: true,
      };
    }

    if (urls.length > 5) {
      return {
        content: [{
          type: 'text',
          text: 'Maximum 5 URLs allowed per extraction request',
        }],
        isError: true,
      };
    }

    try {
      const extractParams = {
        urls,
        include_raw_content: (args.include_raw_content as boolean) || false,
      };

      const result = await this.client!.extract(extractParams);
      
      let formattedContent = `Content Extraction Results:\n\n`;
      formattedContent += `Successfully extracted: ${result.results.length} URLs\n`;
      formattedContent += `Failed extractions: ${result.failed_results.length} URLs\n\n`;

      // Format successful extractions
      result.results.forEach((item, index) => {
        formattedContent += `${index + 1}. **${item.title}**\n`;
        formattedContent += `   URL: ${item.url}\n`;
        formattedContent += `   Status: ${item.status_code}\n`;
        formattedContent += `   Content:\n   ${item.content}\n\n`;
      });

      // Format failed extractions
      if (result.failed_results.length > 0) {
        formattedContent += `Failed Extractions:\n`;
        result.failed_results.forEach((item, index) => {
          formattedContent += `${index + 1}. ${item.url} - Error: ${item.error}\n`;
        });
      }

      const content: MCPToolResult['content'] = [{
        type: 'text',
        text: formattedContent,
      }];

      // Add raw data
      content.push({
        type: 'text',
        text: `\n\n--- RAW DATA ---\n${JSON.stringify(result, null, 2)}`,
      });

      return { content };
    } catch (error) {
      const errorMessage = error instanceof TavilyError 
        ? `Tavily API Error: ${error.message}` 
        : `Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`;

      return {
        content: [{
          type: 'text',
          text: errorMessage,
        }],
        isError: true,
      };
    }
  }

  /**
   * Execute get usage tool
   */
  private async executeGetUsage(): Promise<MCPToolResult> {
    try {
      const usage = await this.client!.getUsageStats();
      const cacheStats = this.client!.getCacheStats();
      
      const usageInfo = `Tavily API Usage Statistics:

API Usage:
- Requests Made: ${usage.requests_made}
- Requests Remaining: ${usage.requests_remaining || 'Unknown'}
- Reset Date: ${usage.reset_date || 'Unknown'}

Cache Statistics:
- Search Cache Size: ${cacheStats.searchCacheSize}
- Extract Cache Size: ${cacheStats.extractCacheSize}

Server Status:
- Connected: ${this.isConnected}
- Last Health Check: ${this.lastHealthCheck?.toLocaleString() || 'Never'}
- Search History Entries: ${this.searchHistory.length}

Configuration:
- Max Results: ${this.config.config.maxResults}
- Search Depth: ${this.config.config.searchDepth}
- Include Answer: ${this.config.config.includeAnswer}
- Include Images: ${this.config.config.includeImages}`;

      return {
        content: [{
          type: 'text',
          text: usageInfo,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Failed to get usage statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }

  /**
   * Get resource content
   */
  async getResource(uri: string): Promise<{ content: string; mimeType: string }> {
    switch (uri) {
      case 'tavily://search-history':
        return {
          content: JSON.stringify(this.searchHistory, null, 2),
          mimeType: 'application/json',
        };

      case 'tavily://cache-stats':
        const cacheStats = this.client?.getCacheStats() || { searchCacheSize: 0, extractCacheSize: 0 };
        return {
          content: JSON.stringify(cacheStats, null, 2),
          mimeType: 'application/json',
        };

      default:
        // Check for individual search history entries
        const historyMatch = uri.match(/^tavily:\/\/search-history\/(\d+)$/);
        if (historyMatch) {
          const index = parseInt(historyMatch[1], 10);
          if (index >= 0 && index < this.searchHistory.length) {
            return {
              content: JSON.stringify(this.searchHistory[index], null, 2),
              mimeType: 'application/json',
            };
          }
        }

        throw new Error(`Unknown resource: ${uri}`);
    }
  }

  /**
   * Update server configuration
   */
  async updateConfig(updates: Partial<MCPServer['config']>): Promise<void> {
    this.config.config = { ...this.config.config, ...updates };
    
    // If API key changed, reinitialize
    if (updates.apiKey && this.client) {
      await this.disconnect();
      await this.initialize();
    } else if (this.client) {
      // Update client configuration
      this.client.updateConfig({
        maxResults: (this.config.config.maxResults as number) || 10,
        searchDepth: (this.config.config.searchDepth as 'basic' | 'advanced') || 'advanced',
        includeImages: (this.config.config.includeImages as boolean) || false,
        includeAnswer: (this.config.config.includeAnswer as boolean) ?? true,
        includeRawContent: (this.config.config.includeRawContent as boolean) || false,
      });
    }
  }

  /**
   * Get server info
   */
  getInfo(): {
    name: string;
    description: string;
    version: string;
    capabilities: MCPCapability[];
    status: 'connected' | 'disconnected' | 'error';
    tools: number;
    resources: number;
  } {
    return {
      name: this.config.name,
      description: this.config.description,
      version: '1.0.0',
      capabilities: this.getCapabilities(),
      status: this.isConnected ? 'connected' : 'disconnected',
      tools: this.getTools().length,
      resources: this.getResources().length,
    };
  }
}