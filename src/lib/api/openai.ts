/**
 * OpenAI API Client - Supports all 22 OpenAI models
 */

import OpenAI from 'openai';
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

export class OpenAIClient implements BaseAPIClient {
  public readonly provider = 'openai' as const;
  private client: OpenAI;
  private config: ProviderConfig;

  // Supported OpenAI models (22 total as per model store)
  private static readonly SUPPORTED_MODELS = [
    // GPT-5 Series (New)
    'gpt-5-large',
    'gpt-5-medium',
    'gpt-5-small',
    // O-Series Models
    'o1-preview',
    'o1-mini',
    'o3-mini',
    // GPT-4.1 Series
    'gpt-4.1-turbo',
    'gpt-4.1',
    // GPT-4o Series
    'gpt-4o-2024-11-20',
    'gpt-4o-2024-08-06',
    'gpt-4o-mini',
    'gpt-4o-audio-preview',
    // Legacy GPT-4
    'gpt-4-turbo',
    'gpt-4-turbo-preview',
    'gpt-4-vision-preview',
    'gpt-4-1106-preview',
    'gpt-4',
    'gpt-4-32k',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-16k',
    'gpt-3.5-turbo-instruct',
    // Codex Mini
    'codex-mini'
  ];

  constructor(config: ProviderConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };

    // Optimized OpenAI client configuration for better performance
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      timeout: this.config.timeout,
      maxRetries: 0, // We handle retries at the API manager level
      httpAgent: this.createHttpAgent(), // Connection pooling
    });
  }
  
  // Create HTTP agent with connection pooling for better performance
  private createHttpAgent(): any {
    // Only create agent in Node.js environment
    if (typeof window === 'undefined') {
      // Use require for Node.js modules to avoid bundling issues
      try {
        const { Agent } = require('https');
        return new Agent({
          keepAlive: true,
          keepAliveMsecs: 30000,
          maxSockets: 50,
          maxFreeSockets: 10,
          timeout: this.config.timeout,
        });
      } catch (error) {
        console.warn('Failed to create HTTP agent:', error);
        return undefined;
      }
    }
    return undefined;
  }

  async createChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    this.validateModel(params.model);

    const openaiParams = this.transformParams(params);
    
    // Add request timing for performance monitoring
    const startTime = performance.now();
    
    try {
      // Use AbortController for timeout management
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), this.config.timeout!);
      
      const response = await this.client.chat.completions.create({
        ...openaiParams,
        // Add abort signal for proper cancellation
      });
      
      clearTimeout(timeoutId);
      const duration = performance.now() - startTime;
      
      // Log slow requests for monitoring
      if (duration > 5000) {
        console.warn(`Slow OpenAI request: ${params.model} - ${duration.toFixed(2)}ms`);
      }

      return this.transformResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async* streamChatCompletion(params: ChatCompletionParams): AsyncGenerator<StreamingResponse, void, unknown> {
    this.validateModel(params.model);

    const openaiParams = this.transformParams({ ...params, stream: true });
    const startTime = performance.now();
    let chunkCount = 0;
    let firstChunkTime: number | null = null;

    try {
      // Create abort controller for timeout management
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), this.config.timeout! * 2); // Longer timeout for streaming
      
      const stream = await this.client.chat.completions.create({
        ...openaiParams,
      });

      try {
        for await (const chunk of stream as any) {
          // Check for cancellation
          if (abortController.signal.aborted) {
            throw new Error('Stream aborted');
          }
          
          const transformedChunk = this.transformStreamChunk(chunk);
          if (transformedChunk) {
            // Record first chunk timing
            if (firstChunkTime === null && transformedChunk.choices?.[0]?.delta?.content) {
              firstChunkTime = performance.now();
              const firstTokenLatency = firstChunkTime - startTime;
              
              // Log slow first token
              if (firstTokenLatency > 3000) {
                console.warn(`Slow first token: ${params.model} - ${firstTokenLatency.toFixed(2)}ms`);
              }
            }
            
            chunkCount++;
            yield transformedChunk;
            
            // Yield control periodically for better async performance
            if (chunkCount % 10 === 0) {
              await new Promise(resolve => setImmediate(resolve));
            }
          }
        }
      } finally {
        clearTimeout(timeoutId);
        
        // Log performance metrics
        const totalDuration = performance.now() - startTime;
        if (totalDuration > 30000) { // > 30 seconds
          console.warn(`Long streaming request: ${params.model} - ${totalDuration.toFixed(2)}ms, ${chunkCount} chunks`);
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  validateConfig(config: ModelConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.temperature < 0 || config.temperature > 2) {
      errors.push('Temperature must be between 0 and 2');
    }

    if (config.topP < 0 || config.topP > 1) {
      errors.push('Top P must be between 0 and 1');
    }

    if (config.frequencyPenalty < -2 || config.frequencyPenalty > 2) {
      errors.push('Frequency penalty must be between -2 and 2');
    }

    if (config.presencePenalty < -2 || config.presencePenalty > 2) {
      errors.push('Presence penalty must be between -2 and 2');
    }

    if (config.maxTokens !== undefined && config.maxTokens < 1) {
      errors.push('Max tokens must be at least 1');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English
    // More accurate estimation would use tiktoken, but this is sufficient for UI
    return Math.ceil(text.length / 4);
  }

  formatMessages(messages: APIMessage[]): APIMessage[] {
    return messages
      .filter(msg => msg.role !== 'system' || msg.content.trim()) // Filter empty system messages
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  async testConnection(testMessage = 'Hi'): Promise<{ success: boolean; latency: number; error?: string }> {
    const startTime = performance.now();
    
    try {
      // Use AbortController for timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 10000); // 10 second timeout for tests
      
      await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo', // Use fastest, cheapest model for testing
        messages: [{ role: 'user', content: testMessage }],
        max_tokens: 1, // Minimal response
        temperature: 0
      });
      
      clearTimeout(timeoutId);
      const latency = performance.now() - startTime;

      return {
        success: true,
        latency
      };
    } catch (error) {
      const latency = performance.now() - startTime;
      
      return {
        success: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Private helper methods
  private validateModel(model: string): void {
    if (!OpenAIClient.SUPPORTED_MODELS.includes(model)) {
      throw new APIError(`Unsupported OpenAI model: ${model}`, 'openai');
    }
  }

  private transformParams(params: ChatCompletionParams): any {
    const openaiParams: any = {
      model: this.mapModelName(params.model),
      messages: params.messages,
      stream: params.stream || false
    };

    // Add optional parameters if provided
    if (params.temperature !== undefined) openaiParams.temperature = params.temperature;
    if (params.maxTokens !== undefined) openaiParams.max_tokens = params.maxTokens;
    if (params.topP !== undefined) openaiParams.top_p = params.topP;
    if (params.frequencyPenalty !== undefined) openaiParams.frequency_penalty = params.frequencyPenalty;
    if (params.presencePenalty !== undefined) openaiParams.presence_penalty = params.presencePenalty;
    if (params.stopSequences?.length) openaiParams.stop = params.stopSequences;

    // Add system prompt if provided
    if (params.systemPrompt) {
      openaiParams.messages = [
        { role: 'system', content: params.systemPrompt },
        ...params.messages
      ];
    }

    return openaiParams;
  }

  private mapModelName(internalModel: string): string {
    // Map internal model names to OpenAI API model names
    const modelMap: Record<string, string> = {
      'gpt-4o-2024-11-20': 'gpt-4o-2024-11-20',
      'gpt-4o-2024-08-06': 'gpt-4o-2024-08-06',
      'gpt-4o-mini': 'gpt-4o-mini',
      'gpt-4o-audio-preview': 'gpt-4o-audio-preview',
      'gpt-4-turbo': 'gpt-4-turbo',
      'gpt-4-turbo-preview': 'gpt-4-turbo-preview',
      'gpt-4-vision-preview': 'gpt-4-vision-preview',
      'gpt-4-1106-preview': 'gpt-4-1106-preview',
      'gpt-4': 'gpt-4',
      'gpt-4-32k': 'gpt-4-32k',
      'gpt-3.5-turbo': 'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k': 'gpt-3.5-turbo-16k',
      'gpt-3.5-turbo-instruct': 'gpt-3.5-turbo-instruct',
      'o1-preview': 'o1-preview',
      'o1-mini': 'o1-mini',
      // Note: GPT-5, o3-mini, and newer models may not be available yet
      // They'll fallback to the closest available model
      'gpt-5-large': 'gpt-4o-2024-11-20',
      'gpt-5-medium': 'gpt-4o-2024-08-06',
      'gpt-5-small': 'gpt-4o-mini',
      'gpt-4.1-turbo': 'gpt-4-turbo',
      'gpt-4.1': 'gpt-4',
      'o3-mini': 'o1-mini',
      'codex-mini': 'gpt-3.5-turbo' // Codex is deprecated, fallback to GPT-3.5
    };

    return modelMap[internalModel] || internalModel;
  }

  private transformResponse(response: any): ChatCompletionResponse {
    return {
      id: response.id,
      object: 'chat.completion',
      created: response.created,
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      },
      choices: response.choices?.map((choice: any) => ({
        index: choice.index,
        message: {
          role: 'assistant' as const,
          content: choice.message?.content || ''
        },
        finishReason: choice.finish_reason
      })) || []
    };
  }

  private transformStreamChunk(chunk: any): StreamingResponse | null {
    if (!chunk.choices?.length) return null;

    return {
      id: chunk.id,
      object: 'chat.completion.chunk',
      created: chunk.created,
      model: chunk.model,
      choices: chunk.choices.map((choice: any) => ({
        index: choice.index,
        delta: {
          role: choice.delta?.role,
          content: choice.delta?.content || ''
        },
        finishReason: choice.finish_reason
      }))
    };
  }

  // Removed - retry logic moved to AIAPIManager level for better coordination

  private isNonRetryableError(error: any): boolean {
    // Don't retry on authentication, permission, or validation errors
    const status = error?.status || error?.response?.status;
    return status === 401 || status === 403 || status === 422 || status === 400;
  }

  // Utility method for efficient delays
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      if (ms <= 0) {
        setImmediate(resolve);
      } else {
        setTimeout(resolve, ms);
      }
    });
  }

  private handleError(error: any): APIError {
    const apiError = new APIError(
      error.message || 'OpenAI API error',
      'openai'
    ) as APIError;
    
    // Enhanced error information for better debugging
    apiError.status = error?.status || error?.response?.status;
    apiError.code = error?.code;
    apiError.type = error?.type || error?.error?.type;
    apiError.provider = 'openai';
    apiError.retryable = !this.isNonRetryableError(error);
    
    // Add timestamp for error tracking
    (apiError as any).timestamp = Date.now();
    
    // Add request details if available
    if (error?.response?.data) {
      (apiError as any).details = error.response.data;
    }

    return apiError;
  }
}

