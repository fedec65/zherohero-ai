/**
 * OpenAI API Client with MCP Auto-Injection Support
 *
 * Extends the base OpenAI client to automatically inject MCP server
 * capabilities (like Tavily Search) into OpenAI API calls.
 */

import { OpenAIClient } from './openai'
import {
  ChatCompletionParams,
  ChatCompletionResponse,
  StreamingResponse,
  APIMessage,
  APIError,
} from './types'
import {
  autoInjectionManager,
  AutoInjectionContext,
  EnhancedAPIMessage,
} from '../mcp/auto-injection'
import { useMCPStore } from '../stores/mcp-store'
import { nanoid } from 'nanoid'

/**
 * Enhanced OpenAI client that automatically injects MCP tools
 */
export class OpenAIMCPClient extends OpenAIClient {
  /**
   * Create chat completion with MCP auto-injection
   */
  async createChatCompletion(
    params: ChatCompletionParams
  ): Promise<ChatCompletionResponse> {
    try {
      // Check if auto-injection is available and enabled
      const mcpStore = useMCPStore.getState()
      const autoInjectServers = mcpStore.getAutoInjectServers()

      if (
        autoInjectServers.length === 0 ||
        !mcpStore.globalSettings.autoInjectEnabled
      ) {
        // No MCP servers available or auto-injection disabled, use base implementation
        return await super.createChatCompletion(params)
      }

      // Create context for this request
      const context: AutoInjectionContext = {
        chatId: nanoid(), // This would come from the chat context in real usage
        messageId: nanoid(),
        requestId: nanoid(),
      }

      // Inject MCP tools into the request
      const enhancedParams = await autoInjectionManager.injectTools(
        params,
        autoInjectServers,
        context
      )

      // Make the API call with enhanced parameters
      const response = await super.createChatCompletion(enhancedParams)

      // Process any tool calls in the response
      if (this.responseHasToolCalls(response)) {
        return await this.handleToolCallsInResponse(response, context)
      }

      return response
    } catch (error) {
      console.error('Error in OpenAI MCP chat completion:', error)
      // Fallback to base implementation if MCP processing fails
      return await super.createChatCompletion(params)
    }
  }

  /**
   * Stream chat completion with MCP auto-injection
   */
  async *streamChatCompletion(
    params: ChatCompletionParams
  ): AsyncGenerator<StreamingResponse, void, unknown> {
    try {
      // Check if auto-injection is available and enabled
      const mcpStore = useMCPStore.getState()
      const autoInjectServers = mcpStore.getAutoInjectServers()

      if (
        autoInjectServers.length === 0 ||
        !mcpStore.globalSettings.autoInjectEnabled
      ) {
        // No MCP servers available, use base implementation
        yield* super.streamChatCompletion(params)
        return
      }

      // Create context for this request
      const context: AutoInjectionContext = {
        chatId: nanoid(), // This would come from the chat context in real usage
        messageId: nanoid(),
        requestId: nanoid(),
      }

      // Inject MCP tools into the request
      const enhancedParams = await autoInjectionManager.injectTools(
        params,
        autoInjectServers,
        context
      )

      // Stream with enhanced parameters
      let completeResponse = ''
      let toolCalls: any[] = []
      let currentToolCall: any = null

      for await (const chunk of super.streamChatCompletion(enhancedParams)) {
        // Check for tool calls in streaming response
        if ((chunk.choices?.[0]?.delta as any)?.tool_calls) {
          const deltaToolCalls = (chunk.choices[0].delta as any).tool_calls

          for (const deltaToolCall of deltaToolCalls) {
            if (deltaToolCall.index !== undefined) {
              if (deltaToolCall.index >= toolCalls.length) {
                toolCalls.push({
                  id: deltaToolCall.id,
                  type: 'function',
                  function: { name: '', arguments: '' },
                })
              }

              const toolCall = toolCalls[deltaToolCall.index]
              if (deltaToolCall.function?.name) {
                toolCall.function.name = deltaToolCall.function.name
              }
              if (deltaToolCall.function?.arguments) {
                toolCall.function.arguments += deltaToolCall.function.arguments
              }
            }
          }
        }

        // Accumulate content for potential tool call processing
        if (chunk.choices?.[0]?.delta?.content) {
          completeResponse += chunk.choices[0].delta.content
        }

        yield chunk

        // If streaming is finished and we have tool calls, process them
        if (
          (chunk.choices?.[0]?.finishReason as any) === 'tool_calls' &&
          toolCalls.length > 0
        ) {
          yield* this.handleToolCallsInStream(
            toolCalls,
            context,
            enhancedParams
          )
        }
      }
    } catch (error) {
      console.error('Error in OpenAI MCP streaming completion:', error)
      // Fallback to base implementation if MCP processing fails
      yield* super.streamChatCompletion(params)
    }
  }

  /**
   * Check if response contains tool calls
   */
  private responseHasToolCalls(response: ChatCompletionResponse): boolean {
    return (
      response.choices?.[0]?.message &&
      'tool_calls' in response.choices[0].message &&
      Array.isArray((response.choices[0].message as any).tool_calls) &&
      (response.choices[0].message as any).tool_calls.length > 0
    )
  }

  /**
   * Handle tool calls in a complete response
   */
  private async handleToolCallsInResponse(
    response: ChatCompletionResponse,
    context: AutoInjectionContext
  ): Promise<ChatCompletionResponse> {
    const toolCalls = (response.choices[0].message as any).tool_calls

    if (!toolCalls || toolCalls.length === 0) {
      return response
    }

    try {
      // Process tool calls
      const toolResults = await autoInjectionManager.processFunctionCalls(
        toolCalls,
        context
      )

      // Create follow-up messages with tool results
      const messagesWithResults: any[] = [
        ...this.getOriginalMessages(response),
        {
          role: 'assistant',
          content: response.choices[0].message.content || '',
          tool_calls: toolCalls,
        },
        ...toolResults,
      ]

      // Make follow-up request with tool results
      const followUpParams: ChatCompletionParams = {
        model: response.model,
        messages: messagesWithResults,
      }

      // Call without MCP injection to avoid infinite recursion
      return await super.createChatCompletion(followUpParams)
    } catch (error) {
      console.error('Error processing tool calls:', error)

      // Return original response with error message appended
      return {
        ...response,
        choices: [
          {
            ...response.choices[0],
            message: {
              role: 'assistant',
              content:
                (response.choices[0].message.content || '') +
                `\n\n*Error processing tool calls: ${error instanceof Error ? error.message : 'Unknown error'}*`,
            },
          },
        ],
      }
    }
  }

  /**
   * Handle tool calls in streaming mode
   */
  private async *handleToolCallsInStream(
    toolCalls: any[],
    context: AutoInjectionContext,
    originalParams: ChatCompletionParams
  ): AsyncGenerator<StreamingResponse, void, unknown> {
    try {
      // Process tool calls
      const toolResults = await autoInjectionManager.processFunctionCalls(
        toolCalls,
        context
      )

      // Create messages with tool results for follow-up
      const messagesWithResults: any[] = [
        ...originalParams.messages,
        {
          role: 'assistant',
          content: '', // Content was already streamed
          tool_calls: toolCalls,
        },
        ...toolResults,
      ]

      // Stream follow-up response with tool results
      const followUpParams: ChatCompletionParams = {
        ...originalParams,
        messages: messagesWithResults,
      }

      // Stream follow-up without MCP injection to avoid recursion
      yield* super.streamChatCompletion(followUpParams)
    } catch (error) {
      console.error('Error processing tool calls in stream:', error)

      // Yield error message
      yield {
        id: nanoid(),
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: originalParams.model,
        choices: [
          {
            index: 0,
            delta: {
              content: `\n\n*Error processing tool calls: ${error instanceof Error ? error.message : 'Unknown error'}*`,
            },
            finishReason: null,
          },
        ],
      } as StreamingResponse
    }
  }

  /**
   * Extract original messages from response (helper method)
   */
  private getOriginalMessages(response: ChatCompletionResponse): APIMessage[] {
    // This would need to be passed from the original request
    // For now, return empty array - in real implementation,
    // we'd store the original messages in the context
    return []
  }

  /**
   * Get MCP integration statistics
   */
  getMCPStats(): {
    autoInjectionEnabled: boolean
    availableServers: number
    connectedServers: number
    functionCallHistory: any
  } {
    const mcpStore = useMCPStore.getState()
    const autoInjectServers = mcpStore.getAutoInjectServers()
    const connectedServers = autoInjectServers.filter((server) =>
      mcpStore.isServerHealthy(server.id)
    )

    return {
      autoInjectionEnabled: mcpStore.globalSettings.autoInjectEnabled,
      availableServers: autoInjectServers.length,
      connectedServers: connectedServers.length,
      functionCallHistory: autoInjectionManager.getFunctionCallStats(),
    }
  }

  /**
   * Test MCP integration
   */
  async testMCPIntegration(): Promise<{
    success: boolean
    serversHealthy: Record<string, boolean>
    error?: string
  }> {
    try {
      const mcpStore = useMCPStore.getState()
      const autoInjectServers = mcpStore.getAutoInjectServers()

      if (autoInjectServers.length === 0) {
        return {
          success: false,
          serversHealthy: {},
          error: 'No MCP servers configured for auto-injection',
        }
      }

      // Test health of all auto-inject servers
      const healthResults = await autoInjectionManager.healthCheckAllServers()
      const serversHealthy: Record<string, boolean> = {}
      let allHealthy = true

      for (const [serverId, result] of healthResults.entries()) {
        serversHealthy[serverId] = result.healthy
        if (!result.healthy) {
          allHealthy = false
        }
      }

      return {
        success: allHealthy,
        serversHealthy,
        error: allHealthy ? undefined : 'One or more MCP servers are unhealthy',
      }
    } catch (error) {
      return {
        success: false,
        serversHealthy: {},
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

// Export convenience function to create enhanced OpenAI client
export function createOpenAIMCPClient(config: {
  apiKey: string
  baseURL?: string
}): OpenAIMCPClient {
  return new OpenAIMCPClient(config)
}

// Type guard for checking if a client supports MCP
export function isOpenAIMCPClient(client: any): client is OpenAIMCPClient {
  return client instanceof OpenAIMCPClient
}
