/**
 * Anthropic Claude API Client - Supports all 10 Claude models
 */

import Anthropic from '@anthropic-ai/sdk';
import { Message, ModelConfig } from '../../lib/stores/types';
import { 
  BaseAPIClient, 
  ChatCompletionParams, 
  ChatCompletionResponse,
  StreamingResponse,
  APIMessage,
  APIError,
  ProviderConfig,
  RequestContext,
  ResponseMetadata
} from './types';

export class AnthropicClient implements BaseAPIClient {
  public readonly provider = 'anthropic' as const;
  private client: Anthropic;
  private config: ProviderConfig;

  // Supported Claude models (10 total as per model store)
  private static readonly SUPPORTED_MODELS = [
    // Claude Opus 4.1 (New)
    'claude-4.1-opus',
    // Claude 4 Series
    'claude-4-sonnet',
    'claude-4-haiku',
    // Claude 3.7/3.5 Sonnet
    'claude-3-7-sonnet',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620',
    // Claude 3 Series
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'claude-3-5-haiku-20241022'
  ];

  constructor(config: ProviderConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };

    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      timeout: this.config.timeout,
    });
  }

  async createChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    this.validateModel(params.model);

    const anthropicParams = this.transformParams(params);
    
    try {
      const response = await this.executeWithRetry(async () => {
        return await this.client.messages.create(anthropicParams);
      });

      return this.transformResponse(response, params.model);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async* streamChatCompletion(params: ChatCompletionParams): AsyncGenerator<StreamingResponse, void, unknown> {
    this.validateModel(params.model);

    const anthropicParams = this.transformParams({ ...params, stream: true });

    try {
      const stream = await this.client.messages.create(anthropicParams);

      let messageId = '';
      let messageIndex = 0;
      
      for await (const chunk of stream as any) {
        const transformedChunk = this.transformStreamChunk(chunk, messageId, messageIndex, params.model);
        if (transformedChunk) {
          if (!messageId && transformedChunk.id) {
            messageId = transformedChunk.id;
          }
          yield transformedChunk;
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  validateConfig(config: ModelConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.temperature < 0 || config.temperature > 1) {
      errors.push('Temperature must be between 0 and 1 for Claude models');
    }

    if (config.topP < 0 || config.topP > 1) {
      errors.push('Top P must be between 0 and 1');
    }

    // Claude doesn't support frequency/presence penalties
    if (config.frequencyPenalty !== 0) {
      errors.push('Claude models do not support frequency penalty');
    }

    if (config.presencePenalty !== 0) {
      errors.push('Claude models do not support presence penalty');
    }

    if (config.maxTokens !== undefined && config.maxTokens < 1) {
      errors.push('Max tokens must be at least 1');
    }

    if (config.maxTokens !== undefined && config.maxTokens > 8192) {
      errors.push('Claude models have a maximum output limit of 8192 tokens');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  estimateTokens(text: string): number {
    // Claude uses a different tokenization than GPT models
    // Rough estimation: ~3.5 characters per token for English
    return Math.ceil(text.length / 3.5);
  }

  formatMessages(messages: APIMessage[]): APIMessage[] {
    const formatted: APIMessage[] = [];
    
    // Claude requires alternating user/assistant messages
    // System messages are handled separately
    for (const msg of messages) {
      if (msg.role === 'system') continue; // Handle in system parameter
      
      formatted.push({
        role: msg.role,
        content: msg.content
      });
    }

    // Ensure first message is from user
    if (formatted.length > 0 && formatted[0].role === 'assistant') {
      formatted.unshift({
        role: 'user',
        content: '...' // Placeholder if needed
      });
    }

    return formatted;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Test with a simple completion
      await this.client.messages.create({
        model: 'claude-3-haiku-20240307', // Use fastest, cheapest model
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      });
      return true;
    } catch {
      return false;
    }
  }

  async testConnection(testMessage = 'Hello!'): Promise<{ success: boolean; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      await this.createChatCompletion({
        model: 'claude-3-haiku-20240307', // Use fastest, cheapest model for testing
        messages: [{ role: 'user', content: testMessage }],
        maxTokens: 10,
        temperature: 0
      });

      return {
        success: true,
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Private helper methods
  private validateModel(model: string): void {
    if (!AnthropicClient.SUPPORTED_MODELS.includes(model)) {
      throw new APIError(`Unsupported Anthropic model: ${model}`, 'anthropic');
    }
  }

  private transformParams(params: ChatCompletionParams): any {
    const messages = params.messages;
    const systemMessage = params.messages.find(m => m.role === 'system')?.content || params.systemPrompt;
    
    const anthropicParams: any = {
      model: this.mapModelName(params.model),
      max_tokens: params.maxTokens || 1024,
      messages,
      stream: params.stream || false
    };

    // Add system prompt if available
    if (systemMessage) {
      anthropicParams.system = systemMessage;
    }

    // Add optional parameters if provided
    if (params.temperature !== undefined) anthropicParams.temperature = params.temperature;
    if (params.topP !== undefined) anthropicParams.top_p = params.topP;
    if (params.topK !== undefined) anthropicParams.top_k = params.topK;
    if (params.stopSequences?.length) anthropicParams.stop_sequences = params.stopSequences;

    return anthropicParams;
  }

  private mapModelName(internalModel: string): string {
    // Map internal model names to Anthropic API model names
    const modelMap: Record<string, string> = {
      'claude-4.1-opus': 'claude-3-5-sonnet-20241022', // Fallback to latest available
      'claude-4-sonnet': 'claude-3-5-sonnet-20241022', // Fallback to latest available
      'claude-4-haiku': 'claude-3-5-haiku-20241022', // Fallback to latest available
      'claude-3-7-sonnet': 'claude-3-5-sonnet-20241022', // Fallback to latest available
      'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet-20240620': 'claude-3-5-sonnet-20240620',
      'claude-3-opus-20240229': 'claude-3-opus-20240229',
      'claude-3-sonnet-20240229': 'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307': 'claude-3-haiku-20240307',
      'claude-3-5-haiku-20241022': 'claude-3-5-haiku-20241022'
    };

    return modelMap[internalModel] || internalModel;
  }

  private transformResponse(response: any, originalModel: string): ChatCompletionResponse {
    const content = Array.isArray(response.content) 
      ? response.content.map((item: any) => item.text).join('')
      : response.content?.text || '';

    return {
      id: response.id || `anthropic-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: originalModel,
      usage: {
        promptTokens: response.usage?.input_tokens || 0,
        completionTokens: response.usage?.output_tokens || 0,
        totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
      },
      choices: [{
        index: 0,
        message: {
          role: 'assistant' as const,
          content
        },
        finishReason: this.mapStopReason(response.stop_reason)
      }]
    };
  }

  private transformStreamChunk(chunk: any, messageId: string, messageIndex: number, originalModel: string): StreamingResponse | null {
    if (chunk.type === 'message_start') {
      messageId = chunk.message?.id || `anthropic-${Date.now()}`;
      return {
        id: messageId,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: originalModel,
        choices: [{
          index: 0,
          delta: { role: 'assistant' },
          finishReason: null
        }]
      };
    }

    if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
      return {
        id: messageId || `anthropic-${Date.now()}`,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: originalModel,
        choices: [{
          index: 0,
          delta: { content: chunk.delta.text },
          finishReason: null
        }]
      };
    }

    if (chunk.type === 'message_delta' && chunk.delta?.stop_reason) {
      return {
        id: messageId || `anthropic-${Date.now()}`,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: originalModel,
        choices: [{
          index: 0,
          delta: {},
          finishReason: this.mapStopReason(chunk.delta.stop_reason)
        }]
      };
    }

    return null;
  }

  private mapStopReason(stopReason: string): 'stop' | 'length' | 'content_filter' | null {
    switch (stopReason) {
      case 'end_turn':
      case 'stop_sequence':
        return 'stop';
      case 'max_tokens':
        return 'length';
      default:
        return null;
    }
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < this.config.retryAttempts!; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain error types
        if (this.isNonRetryableError(error)) {
          break;
        }

        // Wait before retrying
        if (attempt < this.config.retryAttempts! - 1) {
          await this.delay(this.config.retryDelay! * (attempt + 1));
        }
      }
    }

    throw lastError;
  }

  private isNonRetryableError(error: any): boolean {
    // Don't retry on authentication, permission, or validation errors
    const status = error?.status || error?.response?.status;
    return status === 401 || status === 403 || status === 422 || status === 400;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleError(error: any): APIError {
    const apiError = new APIError(
      error.message || 'Anthropic API error',
      'anthropic'
    ) as APIError;
    
    apiError.status = error?.status || error?.response?.status;
    apiError.code = error?.code;
    apiError.type = error?.type;
    apiError.provider = 'anthropic';
    apiError.retryable = !this.isNonRetryableError(error);

    return apiError;
  }
}

