/**
 * DeepSeek API Client - Supports all 2 DeepSeek models
 */

import { Message, ModelConfig } from '../../../lib/stores/types';
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

export class DeepSeekClient implements BaseAPIClient {
  public readonly provider = 'deepseek' as const;
  private config: ProviderConfig;
  private baseURL: string;

  // Supported DeepSeek models (2 total as per model store)
  private static readonly SUPPORTED_MODELS = [
    // DeepSeek Chat (New)
    'deepseek-chat',
    // DeepSeek Reasoner (New)
    'deepseek-reasoner'
  ];

  constructor(config: ProviderConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };

    // DeepSeek API endpoint (follows OpenAI-compatible interface)
    this.baseURL = config.baseURL || 'https://api.deepseek.com/v1';
  }

  async createChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    this.validateModel(params.model);

    const deepseekParams = this.transformParams(params);
    
    try {
      const response = await this.executeWithRetry(async () => {
        return await this.makeAPICall('/chat/completions', {
          method: 'POST',
          body: JSON.stringify(deepseekParams),
        });
      });

      return this.transformResponse(response, params.model);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async* streamChatCompletion(params: ChatCompletionParams): AsyncGenerator<StreamingResponse, void, unknown> {
    this.validateModel(params.model);

    const deepseekParams = this.transformParams({ ...params, stream: true });

    try {
      const response = await this.makeAPICall('/chat/completions', {
        method: 'POST',
        body: JSON.stringify(deepseekParams),
      });

      if (!response.body) {
        throw new Error('No response body for streaming request');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data.trim() === '[DONE]') return;

              try {
                const parsed = JSON.parse(data);
                const transformedChunk = this.transformStreamChunk(parsed, params.model);
                if (transformedChunk) {
                  yield transformedChunk;
                }
              } catch (e) {
                // Skip invalid JSON chunks
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
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

    if (config.maxTokens !== undefined && config.maxTokens > 4096) {
      errors.push('DeepSeek models have a maximum output limit of 4096 tokens');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  estimateTokens(text: string): number {
    // DeepSeek tokenization is similar to GPT models
    // Rough estimation: ~4 characters per token for English
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
      await this.makeAPICall('/models');
      return true;
    } catch {
      return false;
    }
  }

  async testConnection(testMessage = 'Hello!'): Promise<{ success: boolean; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      await this.createChatCompletion({
        model: 'deepseek-chat', // Use standard chat model for testing
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
    if (!DeepSeekClient.SUPPORTED_MODELS.includes(model)) {
      throw new APIError(`Unsupported DeepSeek model: ${model}`, 'deepseek');
    }
  }

  private transformParams(params: ChatCompletionParams): any {
    const deepseekParams: any = {
      model: this.mapModelName(params.model),
      messages: params.messages,
      stream: params.stream || false
    };

    // Add optional parameters if provided
    if (params.temperature !== undefined) deepseekParams.temperature = params.temperature;
    if (params.maxTokens !== undefined) deepseekParams.max_tokens = params.maxTokens;
    if (params.topP !== undefined) deepseekParams.top_p = params.topP;
    if (params.frequencyPenalty !== undefined) deepseekParams.frequency_penalty = params.frequencyPenalty;
    if (params.presencePenalty !== undefined) deepseekParams.presence_penalty = params.presencePenalty;
    if (params.stopSequences?.length) deepseekParams.stop = params.stopSequences;

    // Add system prompt if provided
    if (params.systemPrompt) {
      deepseekParams.messages = [
        { role: 'system', content: params.systemPrompt },
        ...params.messages
      ];
    }

    return deepseekParams;
  }

  private mapModelName(internalModel: string): string {
    // Map internal model names to DeepSeek API model names
    const modelMap: Record<string, string> = {
      'deepseek-chat': 'deepseek-chat',
      'deepseek-reasoner': 'deepseek-reasoner'
    };

    return modelMap[internalModel] || 'deepseek-chat';
  }

  private async makeAPICall(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.config.timeout!)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `DeepSeek API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch {
        // Use the status text if JSON parsing fails
      }

      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    // For streaming responses, return the response directly
    if (options.body && JSON.parse(options.body as string).stream) {
      return response;
    }

    return response.json();
  }

  private transformResponse(response: any, originalModel: string): ChatCompletionResponse {
    return {
      id: response.id || `deepseek-${Date.now()}`,
      object: 'chat.completion',
      created: response.created || Math.floor(Date.now() / 1000),
      model: originalModel,
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

  private transformStreamChunk(chunk: any, originalModel: string): StreamingResponse | null {
    if (!chunk.choices?.length) return null;

    return {
      id: chunk.id || `deepseek-${Date.now()}`,
      object: 'chat.completion.chunk',
      created: chunk.created || Math.floor(Date.now() / 1000),
      model: originalModel,
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
    const status = error?.status;
    return status === 401 || status === 403 || status === 422 || status === 400;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleError(error: any): APIError {
    const apiError = new APIError(
      error.message || 'DeepSeek API error',
      'deepseek'
    ) as APIError;
    
    apiError.status = error?.status;
    apiError.code = error?.code;
    apiError.type = error?.type;
    apiError.provider = 'deepseek';
    apiError.retryable = !this.isNonRetryableError(error);

    return apiError;
  }
}

