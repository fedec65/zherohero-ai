/**
 * MCP Auto-Injection System
 *
 * Automatically injects MCP server capabilities into OpenAI API calls
 * when servers are enabled and configured for auto-injection.
 */

import {
  TavilyMCPServer,
  MCPToolCallParams,
  MCPToolResult,
} from './servers/tavily'
import { ChatCompletionParams, APIMessage } from '../api/types'
import { MCPServer } from '../stores/types'

// OpenAI function calling types
export interface OpenAIFunction {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export interface OpenAIFunctionCall {
  name: string
  arguments: string // JSON string
}

export interface OpenAIToolChoice {
  type: 'function'
  function: OpenAIFunctionCall
}

// Enhanced API message with tool support
export interface EnhancedAPIMessage extends APIMessage {
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: OpenAIFunctionCall
  }>
  tool_call_id?: string
  name?: string // For tool responses
}

// Auto-injection context
export interface AutoInjectionContext {
  chatId: string
  messageId: string
  userId?: string
  requestId: string
}

/**
 * MCP Auto-Injection Manager
 *
 * Handles automatic injection of MCP tools into OpenAI API calls
 * and processes function call responses.
 */
export class MCPAutoInjectionManager {
  private servers: Map<string, TavilyMCPServer> = new Map()
  private functionCallHistory: Map<
    string,
    Array<{
      function: string
      arguments: Record<string, unknown>
      result: MCPToolResult
      timestamp: Date
    }>
  > = new Map()

  /**
   * Register an MCP server for auto-injection
   */
  registerServer(serverId: string, server: TavilyMCPServer): void {
    this.servers.set(serverId, server)
  }

  /**
   * Unregister an MCP server
   */
  unregisterServer(serverId: string): void {
    this.servers.delete(serverId)
  }

  /**
   * Get all registered servers
   */
  getRegisteredServers(): Map<string, TavilyMCPServer> {
    return new Map(this.servers)
  }

  /**
   * Check if any servers are available for auto-injection
   */
  hasAutoInjectableServers(): boolean {
    return this.servers.size > 0
  }

  /**
   * Inject MCP tools into OpenAI chat completion parameters
   */
  async injectTools(
    params: ChatCompletionParams,
    enabledServers: MCPServer[],
    context: AutoInjectionContext
  ): Promise<
    ChatCompletionParams & {
      functions?: OpenAIFunction[]
      function_call?: 'auto' | 'none'
      tools?: Array<{ type: 'function'; function: OpenAIFunction }>
      tool_choice?: 'auto' | 'none'
    }
  > {
    // Filter servers that are enabled and have auto-inject enabled
    const autoInjectServers = enabledServers.filter(
      (server) =>
        server.enabled && server.autoInject && this.servers.has(server.id)
    )

    if (autoInjectServers.length === 0) {
      return params
    }

    // Collect all available tools from enabled servers
    const availableTools: OpenAIFunction[] = []

    for (const serverConfig of autoInjectServers) {
      const server = this.servers.get(serverConfig.id)
      if (server) {
        try {
          const tools = server.getTools()
          for (const tool of tools) {
            availableTools.push({
              name: tool.name,
              description: tool.description,
              parameters: tool.inputSchema,
            })
          }
        } catch (error) {
          console.warn(
            `Failed to get tools from server ${serverConfig.id}:`,
            error
          )
        }
      }
    }

    if (availableTools.length === 0) {
      return params
    }

    // Use tools format (newer OpenAI API)
    const enhancedParams = {
      ...params,
      tools: availableTools.map((func) => ({
        type: 'function' as const,
        function: func,
      })),
      tool_choice: 'auto' as const,
    }

    // Add system message about available tools if not present
    const hasSystemMessage = params.messages.some(
      (msg) => msg.role === 'system'
    )
    if (!hasSystemMessage) {
      const toolDescriptions = availableTools
        .map((tool) => `- ${tool.name}: ${tool.description}`)
        .join('\n')

      enhancedParams.messages = [
        {
          role: 'system',
          content: `You have access to the following tools for web search and information retrieval:\n\n${toolDescriptions}\n\nUse these tools when you need current information, real-time data, or to search the web. Always explain what information you're looking for before using the tools.`,
        },
        ...params.messages,
      ]
    }

    return enhancedParams
  }

  /**
   * Process function calls from OpenAI response
   */
  async processFunctionCalls(
    toolCalls: Array<{
      id: string
      type: 'function'
      function: OpenAIFunctionCall
    }>,
    context: AutoInjectionContext
  ): Promise<
    Array<{
      tool_call_id: string
      role: 'tool'
      content: string
      name: string
    }>
  > {
    const results: Array<{
      tool_call_id: string
      role: 'tool'
      content: string
      name: string
    }> = []

    for (const toolCall of toolCalls) {
      try {
        const functionName = toolCall.function.name
        const functionArgs = JSON.parse(toolCall.function.arguments)

        // Find the server that handles this function
        const server = this.findServerForFunction(functionName)
        if (!server) {
          results.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: `Error: No server found for function ${functionName}`,
            name: functionName,
          })
          continue
        }

        // Execute the function
        const toolParams: MCPToolCallParams = {
          name: functionName,
          arguments: functionArgs,
        }

        const result = await server.executeTool(toolParams)

        // Store function call history
        this.storeFunctionCall(context.chatId, {
          function: functionName,
          arguments: functionArgs,
          result,
          timestamp: new Date(),
        })

        // Format result for OpenAI
        const content = this.formatToolResultForOpenAI(result)

        results.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          content,
          name: functionName,
        })
      } catch (error) {
        console.error(
          `Error processing function call ${toolCall.function.name}:`,
          error
        )
        results.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          content: `Error executing function: ${error instanceof Error ? error.message : 'Unknown error'}`,
          name: toolCall.function.name,
        })
      }
    }

    return results
  }

  /**
   * Find the server that handles a specific function
   */
  private findServerForFunction(functionName: string): TavilyMCPServer | null {
    for (const server of this.servers.values()) {
      try {
        const tools = server.getTools()
        if (tools.some((tool) => tool.name === functionName)) {
          return server
        }
      } catch (error) {
        // Server might not be connected, skip
        continue
      }
    }
    return null
  }

  /**
   * Format MCP tool result for OpenAI consumption
   */
  private formatToolResultForOpenAI(result: MCPToolResult): string {
    if (result.isError) {
      return `Error: ${result.content.map((c) => c.text).join('\n')}`
    }

    // Combine all content parts
    const textContent = result.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n\n')

    return textContent || 'Tool executed successfully but returned no content.'
  }

  /**
   * Store function call in history
   */
  private storeFunctionCall(
    chatId: string,
    call: {
      function: string
      arguments: Record<string, unknown>
      result: MCPToolResult
      timestamp: Date
    }
  ): void {
    if (!this.functionCallHistory.has(chatId)) {
      this.functionCallHistory.set(chatId, [])
    }

    const history = this.functionCallHistory.get(chatId)!
    history.push(call)

    // Keep only last 50 function calls per chat
    if (history.length > 50) {
      history.splice(0, history.length - 50)
    }
  }

  /**
   * Get function call history for a chat
   */
  getFunctionCallHistory(chatId: string): Array<{
    function: string
    arguments: Record<string, unknown>
    result: MCPToolResult
    timestamp: Date
  }> {
    return this.functionCallHistory.get(chatId) || []
  }

  /**
   * Clear function call history for a chat
   */
  clearFunctionCallHistory(chatId: string): void {
    this.functionCallHistory.delete(chatId)
  }

  /**
   * Get statistics about function call usage
   */
  getFunctionCallStats(): {
    totalChats: number
    totalFunctionCalls: number
    functionCounts: Record<string, number>
    serverCounts: Record<string, number>
    errorRate: number
  } {
    let totalFunctionCalls = 0
    const functionCounts: Record<string, number> = {}
    const serverCounts: Record<string, number> = {}
    let errorCount = 0

    for (const history of this.functionCallHistory.values()) {
      for (const call of history) {
        totalFunctionCalls++

        // Count function usage
        functionCounts[call.function] = (functionCounts[call.function] || 0) + 1

        // Count server usage (approximate based on function names)
        const serverName = this.getServerNameForFunction(call.function)
        if (serverName) {
          serverCounts[serverName] = (serverCounts[serverName] || 0) + 1
        }

        // Count errors
        if (call.result.isError) {
          errorCount++
        }
      }
    }

    return {
      totalChats: this.functionCallHistory.size,
      totalFunctionCalls,
      functionCounts,
      serverCounts,
      errorRate: totalFunctionCalls > 0 ? errorCount / totalFunctionCalls : 0,
    }
  }

  /**
   * Get server name based on function name
   */
  private getServerNameForFunction(functionName: string): string | null {
    // Map function names to server types
    if (functionName.startsWith('tavily_')) {
      return 'Tavily Search'
    }

    return null
  }

  /**
   * Health check all registered servers
   */
  async healthCheckAllServers(): Promise<
    Map<
      string,
      {
        healthy: boolean
        latency: number
        error?: string
      }
    >
  > {
    const results = new Map()

    for (const [serverId, server] of this.servers.entries()) {
      try {
        const health = await server.healthCheck()
        results.set(serverId, {
          healthy: health.healthy,
          latency: health.latency,
        })
      } catch (error) {
        results.set(serverId, {
          healthy: false,
          latency: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return results
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    // Clear all history
    this.functionCallHistory.clear()

    // Disconnect all servers
    for (const server of this.servers.values()) {
      server.disconnect().catch(console.error)
    }

    this.servers.clear()
  }
}

// Global auto-injection manager instance
export const autoInjectionManager = new MCPAutoInjectionManager()

// Utility functions

/**
 * Check if a message contains tool calls
 */
export function messageHasToolCalls(message: EnhancedAPIMessage): boolean {
  return !!(message.tool_calls && message.tool_calls.length > 0)
}

/**
 * Extract tool calls from a message
 */
export function extractToolCalls(message: EnhancedAPIMessage): Array<{
  id: string
  type: 'function'
  function: OpenAIFunctionCall
}> {
  return message.tool_calls || []
}

/**
 * Create a system message explaining available tools
 */
export function createToolSystemMessage(
  availableFunctions: string[]
): APIMessage {
  if (availableFunctions.length === 0) {
    return {
      role: 'system',
      content: 'You are a helpful AI assistant.',
    }
  }

  const toolList = availableFunctions
    .map((name) => {
      // Provide human-readable descriptions for common functions
      const descriptions: Record<string, string> = {
        tavily_search:
          'Search the web for current information and real-time data',
        tavily_extract: 'Extract and summarize content from specific web pages',
        tavily_get_usage: 'Check API usage statistics and quota',
      }

      return `- ${name}: ${descriptions[name] || 'Execute custom function'}`
    })
    .join('\n')

  return {
    role: 'system',
    content: `You are a helpful AI assistant with access to real-time web search capabilities through the following tools:

${toolList}

Use these tools when you need current information, recent news, real-time data, or to verify facts. Always explain what you're looking for before using the tools, and summarize the key findings for the user in a clear and helpful way.

When using web search:
- Be specific with your search queries
- Use recent date filters when looking for current information
- Summarize and synthesize information from multiple sources
- Cite sources when presenting facts or statistics`,
  }
}
