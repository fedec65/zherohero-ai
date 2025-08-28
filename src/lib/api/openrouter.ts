/**
 * OpenRouter API Client - Integrates with OpenRouter.ai marketplace
 * Provides access to hundreds of AI models from various providers
 */

import { APIError, APIMessage, ChatCompletionParams, ChatCompletionResponse, StreamingResponse, BaseAPIClient } from './types';
import { Message, ModelConfig, AIProvider } from '../stores/types';
import { parseOpenRouterError, shouldRetry, getRetryDelay } from './openrouter-errors';

// OpenRouter-specific types
export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  created: number;
  pricing: {
    prompt: string; // USD per 1M tokens
    completion: string; // USD per 1M tokens
  };
  context_length: number;
  architecture: {
    tokenizer: string;
    instruct_type?: string;
  };
  top_provider?: {
    context_length: number;
    max_completion_tokens: number;
    is_moderated: boolean;
  };
  per_request_limits?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

export interface OpenRouterError {
  error: {
    code: number;
    message: string;
    type: string;
    metadata?: {
      raw?: string;
      [key: string]: any;
    };
  };
}

export interface OpenRouterProvider {
  code: string;
  name: string;
  description?: string;
  moderated: boolean;
  image_url?: string;
}

export interface OpenRouterProvidersResponse {
  data: OpenRouterProvider[];
}

interface OpenRouterRequestOptions {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    name?: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  repetition_penalty?: number;
  min_p?: number;
  top_a?: number;
  seed?: number;
  logit_bias?: { [key: string]: number };
  logprobs?: boolean;
  top_logprobs?: number;
  response_format?: { type: 'json_object' | 'text' };
  stop?: string | string[];
  stream?: boolean;
  tools?: Array<{
    type: 'function';
    function: {
      name: string;
      description?: string;
      parameters: any;
    };
  }>;
  tool_choice?: 'none' | 'auto' | { type: 'function'; function: { name: string } };
  transforms?: string[];
  models?: string[];
  route?: 'fallback';
  provider?: {
    order: string[];
    allow_fallbacks: boolean;
    data_collection: 'deny' | 'allow';
    quantizations?: string[];
  };
}

export class OpenRouterClient implements BaseAPIClient {
  readonly provider: AIProvider = 'custom'; // OpenRouter acts as custom provider
  private apiKey: string;
  private baseURL: string;
  private appName: string;
  private appUrl?: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(options: {
    apiKey: string;
    appName?: string;
    appUrl?: string;
    baseURL?: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
  }) {
    this.apiKey = options.apiKey;
    this.baseURL = options.baseURL || 'https://openrouter.ai/api/v1';
    this.appName = options.appName || 'MindDeck';
    this.appUrl = options.appUrl || 'https://minddeck.ai';
    this.timeout = options.timeout || 60000;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  private get headers(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': this.appUrl || 'https://minddeck.ai',
      'X-Title': this.appName,
      'User-Agent': `${this.appName}/1.0`,
    };
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.timeout),
    };

    let lastError: any = null;

    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorData: OpenRouterError;
          
          try {
            errorData = JSON.parse(errorText);
          } catch {
            const apiError = new APIError(
              `HTTP ${response.status}: ${response.statusText}`,
              this.provider,
              {
                status: response.status,
                retryable: response.status >= 500 || response.status === 429,
              }
            );
            
            // Parse using OpenRouter error handling
            const parsedError = parseOpenRouterError(apiError);
            
            if (attempt < this.retryAttempts && shouldRetry(parsedError, attempt)) {
              lastError = apiError;
              const delay = getRetryDelay(attempt, parsedError.code);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            
            throw apiError;
          }

          const apiError = new APIError(
            errorData.error.message || `HTTP ${response.status}`,
            this.provider,
            {
              status: response.status,
              code: errorData.error.code?.toString(),
              type: errorData.error.type,
              retryable: response.status >= 500 || response.status === 429,
            }
          );
          
          // Parse using OpenRouter error handling
          const parsedError = parseOpenRouterError(apiError);
          
          if (attempt < this.retryAttempts && shouldRetry(parsedError, attempt)) {
            lastError = apiError;
            const delay = getRetryDelay(attempt, parsedError.code);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          throw apiError;
        }

        return await response.json();
      } catch (error) {
        lastError = error;
        
        if (error instanceof APIError) {
          // Already handled above
          throw error;
        }

        // Network or other errors
        const apiError = new APIError(
          error instanceof Error ? error.message : 'Network request failed',
          this.provider,
          { retryable: true }
        );
        
        const parsedError = parseOpenRouterError(apiError);
        
        if (attempt < this.retryAttempts && shouldRetry(parsedError, attempt)) {
          const delay = getRetryDelay(attempt, parsedError.code);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw apiError;
      }
    }

    // This shouldn't be reached, but provide fallback
    throw new APIError(
      lastError?.message || 'Max retries exceeded', 
      this.provider, 
      { retryable: false }
    );
  }

  /**
   * Fetch all available models from OpenRouter
   */
  async fetchModels(): Promise<OpenRouterModel[]> {
    try {
      const response = await this.makeRequest<OpenRouterModelsResponse>('/models');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch OpenRouter models:', error);
      throw error;
    }
  }

  /**
   * Fetch available providers from OpenRouter
   */
  async fetchProviders(): Promise<OpenRouterProvider[]> {
    try {
      const response = await this.makeRequest<OpenRouterProvidersResponse>('/providers');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch OpenRouter providers:', error);
      throw error;
    }
  }

  /**
   * Get generation statistics for a model
   */
  async getGenerationStats(model: string): Promise<any> {
    try {
      return await this.makeRequest(`/generation?model=${encodeURIComponent(model)}`);
    } catch (error) {
      console.error('Failed to fetch generation stats:', error);
      throw error;
    }
  }

  async createChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    const requestBody: OpenRouterRequestOptions = {
      model: params.model,
      messages: this.formatMessages(params.messages),
      max_tokens: params.maxTokens,
      temperature: params.temperature,
      top_p: params.topP,
      top_k: params.topK,
      frequency_penalty: params.frequencyPenalty,
      presence_penalty: params.presencePenalty,
      stop: params.stopSequences,
      stream: false,
    };

    // Add system prompt as first message if provided
    if (params.systemPrompt) {
      requestBody.messages.unshift({
        role: 'system',
        content: params.systemPrompt,
      });
    }

    try {
      const response = await this.makeRequest<ChatCompletionResponse>('/chat/completions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      return response;
    } catch (error) {
      console.error('OpenRouter chat completion failed:', error);
      throw error;
    }
  }

  async *streamChatCompletion(params: ChatCompletionParams): AsyncGenerator<StreamingResponse, void, unknown> {
    const requestBody: OpenRouterRequestOptions = {
      model: params.model,
      messages: this.formatMessages(params.messages),
      max_tokens: params.maxTokens,
      temperature: params.temperature,
      top_p: params.topP,
      top_k: params.topK,
      frequency_penalty: params.frequencyPenalty,
      presence_penalty: params.presencePenalty,
      stop: params.stopSequences,
      stream: true,
    };

    // Add system prompt as first message if provided
    if (params.systemPrompt) {
      requestBody.messages.unshift({
        role: 'system',
        content: params.systemPrompt,
      });
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: OpenRouterError;
        
        try {
          errorData = JSON.parse(errorText);
          throw new APIError(errorData.error.message, this.provider, {
            status: response.status,
            code: errorData.error.code.toString(),
            type: errorData.error.type,
          });
        } catch {
          throw new APIError(`HTTP ${response.status}: ${response.statusText}`, this.provider, {
            status: response.status,
          });
        }
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new APIError('No response body', this.provider);
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const data = trimmed.slice(6);
              
              if (data === '[DONE]') {
                return;
              }

              try {
                const chunk = JSON.parse(data) as StreamingResponse;
                yield chunk;
              } catch (error) {
                console.warn('Failed to parse SSE chunk:', error);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('OpenRouter streaming failed:', error);
      throw error;
    }
  }

  formatMessages(messages: APIMessage[]): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
    return messages.map(message => ({
      role: message.role,
      content: message.content,
    }));
  }

  validateConfig(config: ModelConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.temperature < 0 || config.temperature > 2) {
      errors.push('Temperature must be between 0 and 2');
    }

    if (config.topP < 0 || config.topP > 1) {
      errors.push('Top P must be between 0 and 1');
    }

    if (config.frequencyPenalty && (config.frequencyPenalty < -2 || config.frequencyPenalty > 2)) {
      errors.push('Frequency penalty must be between -2 and 2');
    }

    if (config.presencePenalty && (config.presencePenalty < -2 || config.presencePenalty > 2)) {
      errors.push('Presence penalty must be between -2 and 2');
    }

    if (config.maxTokens && config.maxTokens < 1) {
      errors.push('Max tokens must be at least 1');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English
    return Math.ceil(text.length / 4);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest('/models', { method: 'GET' });
      return true;
    } catch {
      return false;
    }
  }

  async testConnection(testMessage = 'Hello'): Promise<{ success: boolean; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      // Use a lightweight model for testing
      const testModel = 'anthropic/claude-3-haiku';
      
      await this.createChatCompletion({
        model: testModel,
        messages: [{
          role: 'user',
          content: testMessage,
        }],
        maxTokens: 10,
        temperature: 0.1,
      });

      return {
        success: true,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if a model is available and get its current status
   */
  async checkModelAvailability(modelId: string): Promise<{
    available: boolean;
    queued?: number;
    error?: string;
  }> {
    try {
      const stats = await this.getGenerationStats(modelId);
      return {
        available: true,
        queued: stats?.queued || 0,
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get current credit balance
   */
  async getBalance(): Promise<{ balance: number; currency: string }> {
    try {
      const response = await this.makeRequest('/auth/key') as { usage?: { balance?: number } };
      return {
        balance: response.usage?.balance || 0,
        currency: 'USD',
      };
    } catch (error) {
      throw new APIError(
        'Failed to fetch balance',
        this.provider,
        { retryable: true }
      );
    }
  }
}

// Utility functions for OpenRouter model processing
export function convertOpenRouterModel(openRouterModel: OpenRouterModel): {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  maxTokens: number;
  pricing: {
    input: number;
    output: number;
  };
  capabilities: string[];
  description?: string;
  isNew?: boolean;
  availability?: {
    available: boolean;
    queued?: number;
  };
} {
  // Extract provider from model ID (e.g., "anthropic/claude-3-opus" -> "anthropic")
  const providerMatch = openRouterModel.id.match(/^([^\/]+)\//);
  const provider = providerMatch ? providerMatch[1] : 'unknown';

  return {
    id: openRouterModel.id,
    name: openRouterModel.name,
    provider,
    contextWindow: openRouterModel.context_length,
    maxTokens: openRouterModel.top_provider?.max_completion_tokens || Math.floor(openRouterModel.context_length * 0.25),
    pricing: {
      input: parseFloat(openRouterModel.pricing.prompt),
      output: parseFloat(openRouterModel.pricing.completion),
    },
    capabilities: ['text-generation'], // Most OpenRouter models support text generation
    description: openRouterModel.description,
    isNew: Date.now() - (openRouterModel.created * 1000) < 30 * 24 * 60 * 60 * 1000, // New if created within last 30 days
  };
}

// Model categorization helpers
export function categorizeOpenRouterModels(models: OpenRouterModel[]): {
  providers: Record<string, OpenRouterModel[]>;
  capabilities: Record<string, OpenRouterModel[]>;
  pricing: {
    free: OpenRouterModel[];
    cheap: OpenRouterModel[];
    moderate: OpenRouterModel[];
    expensive: OpenRouterModel[];
  };
} {
  const providers: Record<string, OpenRouterModel[]> = {};
  const capabilities: Record<string, OpenRouterModel[]> = {};
  const pricing = { free: [], cheap: [], moderate: [], expensive: [] } as {
    free: OpenRouterModel[];
    cheap: OpenRouterModel[];
    moderate: OpenRouterModel[];
    expensive: OpenRouterModel[];
  };

  models.forEach(model => {
    // Group by provider
    const providerMatch = model.id.match(/^([^\/]+)\//);
    const provider = providerMatch ? providerMatch[1] : 'unknown';
    
    if (!providers[provider]) {
      providers[provider] = [];
    }
    providers[provider].push(model);

    // Group by pricing (per 1M tokens)
    const inputPrice = parseFloat(model.pricing.prompt);
    const avgPrice = (inputPrice + parseFloat(model.pricing.completion)) / 2;

    if (avgPrice === 0) {
      pricing.free.push(model);
    } else if (avgPrice < 1) {
      pricing.cheap.push(model);
    } else if (avgPrice < 10) {
      pricing.moderate.push(model);
    } else {
      pricing.expensive.push(model);
    }
  });

  return { providers, capabilities, pricing };
}

export default OpenRouterClient;