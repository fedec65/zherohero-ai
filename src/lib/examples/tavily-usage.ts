/**
 * Tavily Search MCP Integration Usage Examples
 * 
 * This file demonstrates how to use the Tavily Search MCP integration
 * in various scenarios within the MindDeck application.
 */

import { useMCPStore } from '../stores/mcp-store';
import { useSettingsStore } from '../stores/settings-store';
import { autoInjectionManager } from '../mcp/auto-injection';
import { createOpenAIMCPClient } from '../api/openai-mcp';

/**
 * Example 1: Setup Tavily Search for a user
 */
export async function setupTavilySearch(apiKey: string): Promise<void> {
  // 1. Save API key to settings
  const settingsStore = useSettingsStore.getState();
  settingsStore.setApiKey('tavily', apiKey);

  // 2. Enable the Tavily server
  const mcpStore = useMCPStore.getState();
  mcpStore.toggleServerEnabled('tavily-search', true);

  console.log('Tavily Search configured and enabled successfully!');
}

/**
 * Example 2: Test Tavily Search connection
 */
export async function testTavilyConnection(): Promise<boolean> {
  const mcpStore = useMCPStore.getState();
  
  try {
    const result = await mcpStore.testConnection('tavily-search');
    console.log(`Tavily connection test: ${result ? 'SUCCESS' : 'FAILED'}`);
    return result;
  } catch (error) {
    console.error('Tavily connection test error:', error);
    return false;
  }
}

/**
 * Example 3: Use OpenAI with auto-injected Tavily Search
 */
export async function chatWithWebSearch(userMessage: string): Promise<string> {
  const settingsStore = useSettingsStore.getState();
  const openaiApiKey = settingsStore.getApiKey('openai');
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Create MCP-enhanced OpenAI client
  const client = createOpenAIMCPClient({ apiKey: openaiApiKey });

  try {
    const response = await client.createChatCompletion({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || 'No response received';
  } catch (error) {
    console.error('Chat with web search failed:', error);
    throw error;
  }
}

/**
 * Example 4: Direct Tavily server usage (advanced)
 */
export async function directTavilySearch(query: string): Promise<any> {
  const mcpStore = useMCPStore.getState();
  const tavilyServer = mcpStore.getTavilyServer('tavily-search');
  
  if (!tavilyServer) {
    throw new Error('Tavily server not initialized');
  }

  try {
    const result = await tavilyServer.executeTool({
      name: 'tavily_search',
      arguments: {
        query,
        search_depth: 'advanced',
        max_results: 10,
        include_answer: true,
      }
    });

    return result;
  } catch (error) {
    console.error('Direct Tavily search failed:', error);
    throw error;
  }
}

/**
 * Example 5: Monitor MCP integration health
 */
export async function monitorMCPHealth(): Promise<{
  tavilyHealthy: boolean;
  autoInjectionActive: boolean;
  stats: any;
}> {
  const mcpStore = useMCPStore.getState();

  try {
    // Check Tavily server health
    const healthResult = await mcpStore.performHealthCheck('tavily-search');
    
    // Check auto-injection status
    const autoInjectServers = mcpStore.getAutoInjectServers();
    const autoInjectionActive = autoInjectServers.length > 0 && 
                               mcpStore.globalSettings.autoInjectEnabled;

    // Get function call statistics
    const stats = autoInjectionManager.getFunctionCallStats();

    return {
      tavilyHealthy: healthResult.healthy,
      autoInjectionActive,
      stats,
    };
  } catch (error) {
    console.error('MCP health monitoring failed:', error);
    return {
      tavilyHealthy: false,
      autoInjectionActive: false,
      stats: {},
    };
  }
}

/**
 * Example 6: Handle different search scenarios
 */
export const searchExamples = {
  // Current events and news
  async getCurrentNews(topic: string): Promise<string> {
    return await chatWithWebSearch(
      `What are the latest news and developments about ${topic}? Please provide current information with sources.`
    );
  },

  // Research and facts
  async researchTopic(topic: string): Promise<string> {
    return await chatWithWebSearch(
      `I need comprehensive information about ${topic}. Please research this topic thoroughly and provide detailed findings with reliable sources.`
    );
  },

  // Real-time data
  async getRealTimeData(query: string): Promise<string> {
    return await chatWithWebSearch(
      `I need current, real-time information about: ${query}. Please search for the most up-to-date data available.`
    );
  },

  // Specific website content
  async analyzeWebsite(url: string, question: string): Promise<string> {
    const mcpStore = useMCPStore.getState();
    const tavilyServer = mcpStore.getTavilyServer('tavily-search');
    
    if (!tavilyServer) {
      throw new Error('Tavily server not available');
    }

    // First extract content from the URL
    const extractResult = await tavilyServer.executeTool({
      name: 'tavily_extract',
      arguments: {
        urls: [url],
      }
    });

    // Then analyze the content with ChatGPT
    return await chatWithWebSearch(
      `Based on the content from ${url}, please answer this question: ${question}\n\nHere's the content: ${extractResult.content?.[0]?.text}`
    );
  },
};

/**
 * Example 7: Error handling and fallbacks
 */
export async function robustWebSearch(query: string): Promise<{
  success: boolean;
  result?: string;
  error?: string;
  fallbackUsed: boolean;
}> {
  try {
    // Try MCP-enhanced search first
    const result = await chatWithWebSearch(query);
    return {
      success: true,
      result,
      fallbackUsed: false,
    };
  } catch (mcpError) {
    console.warn('MCP-enhanced search failed, trying fallback:', mcpError);
    
    try {
      // Fallback to direct OpenAI without MCP
      const settingsStore = useSettingsStore.getState();
      const openaiApiKey = settingsStore.getApiKey('openai');
      
      if (!openaiApiKey) {
        throw new Error('No OpenAI API key available');
      }

      // Create regular OpenAI client
      const { OpenAIClient } = await import('../api/openai');
      const client = new OpenAIClient({ apiKey: openaiApiKey });

      const response = await client.createChatCompletion({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant. Note: Web search is currently unavailable.'
          },
          {
            role: 'user',
            content: query
          }
        ],
      });

      return {
        success: true,
        result: response.choices[0].message.content || 'No response received',
        fallbackUsed: true,
      };
    } catch (fallbackError) {
      return {
        success: false,
        error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
        fallbackUsed: true,
      };
    }
  }
}

/**
 * Example 8: Configuration management
 */
export const tavilyConfig = {
  // Check if Tavily is properly configured
  isConfigured(): boolean {
    const settingsStore = useSettingsStore.getState();
    const mcpStore = useMCPStore.getState();
    
    const hasApiKey = settingsStore.hasApiKey('tavily');
    const serverEnabled = mcpStore.builtInServers
      .find(s => s.id === 'tavily-search')?.enabled || false;
    
    return hasApiKey && serverEnabled;
  },

  // Get current configuration status
  getStatus(): {
    apiKeyConfigured: boolean;
    serverEnabled: boolean;
    autoInjectEnabled: boolean;
    connected: boolean;
  } {
    const settingsStore = useSettingsStore.getState();
    const mcpStore = useMCPStore.getState();
    
    return {
      apiKeyConfigured: settingsStore.hasApiKey('tavily'),
      serverEnabled: mcpStore.builtInServers
        .find(s => s.id === 'tavily-search')?.enabled || false,
      autoInjectEnabled: mcpStore.globalSettings.autoInjectEnabled,
      connected: mcpStore.isServerHealthy('tavily-search'),
    };
  },

  // Update search configuration
  updateSearchConfig(config: {
    maxResults?: number;
    searchDepth?: 'basic' | 'advanced';
    includeAnswer?: boolean;
    includeImages?: boolean;
  }): void {
    const mcpStore = useMCPStore.getState();
    mcpStore.updateServerConfig('tavily-search', config);
  },
};

/**
 * Example 9: Integration with chat interface
 */
export function shouldEnableWebSearch(): boolean {
  const config = tavilyConfig.getStatus();
  return config.apiKeyConfigured && 
         config.serverEnabled && 
         config.autoInjectEnabled && 
         config.connected;
}

/**
 * Example 10: Cleanup and resource management
 */
export function cleanupTavilyIntegration(): void {
  const mcpStore = useMCPStore.getState();
  
  // Disable the server
  mcpStore.toggleServerEnabled('tavily-search', false);
  
  // Cleanup server instances
  mcpStore.cleanupServerInstances();
  
  console.log('Tavily integration cleaned up');
}