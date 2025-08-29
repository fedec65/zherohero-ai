/**
 * Unified AI API Interface - Provider Factory and Main Interface
 */

import { AIProvider } from '../../lib/stores/types';
import { 
  BaseAPIClient, 
  ProviderConfig, 
  ChatCompletionParams, 
  ChatCompletionResponse,
  StreamingResponse,
  APIError,
  StreamingCallback
} from './types';

import { OpenAIClient } from './openai';
import { AnthropicClient } from './anthropic';
import { GeminiClient } from './gemini';
import { XAIClient } from './xai';
import { DeepSeekClient } from './deepseek';
import OpenRouterClient from './openrouter';

// Provider configuration registry
interface ProviderRegistry {
  [key: string]: {
    client: BaseAPIClient | null;
    config: ProviderConfig | null;
    lastHealthCheck?: Date;
    isHealthy?: boolean;
  };
}

// Main AI API Manager
export class AIAPIManager {
  private static instance: AIAPIManager;
  private registry: ProviderRegistry = {};

  private constructor() {}

  static getInstance(): AIAPIManager {
    if (!AIAPIManager.instance) {
      AIAPIManager.instance = new AIAPIManager();
    }
    return AIAPIManager.instance;
  }

  // Initialize a provider with configuration
  initializeProvider(provider: AIProvider, config: ProviderConfig): void {
    const client = this.createClient(provider, config);
    
    this.registry[provider] = {
      client,
      config,
      isHealthy: undefined // Will be determined on first health check
    };
  }

  // Get a provider client
  getProvider(provider: AIProvider): BaseAPIClient {
    const providerInfo = this.registry[provider];
    
    if (!providerInfo?.client) {
      throw new APIError(`Provider ${provider} not initialized`, provider as any);
    }
    
    return providerInfo.client;
  }

  // Create chat completion
  async createChatCompletion(
    provider: AIProvider, 
    params: ChatCompletionParams
  ): Promise<ChatCompletionResponse> {
    const client = this.getProvider(provider);
    
    try {
      return await client.createChatCompletion(params);
    } catch (error) {
      this.handleProviderError(provider, error);
      throw error;
    }
  }

  // Create streaming chat completion
  async* streamChatCompletion(
    provider: AIProvider, 
    params: ChatCompletionParams
  ): AsyncGenerator<StreamingResponse, void, unknown> {
    const client = this.getProvider(provider);
    
    try {
      yield* client.streamChatCompletion(params);
    } catch (error) {
      this.handleProviderError(provider, error);
      throw error;
    }
  }

  // Stream with callback (easier to use interface)
  async streamChatCompletionWithCallback(
    provider: AIProvider,
    params: ChatCompletionParams,
    callback: StreamingCallback,
    context?: { chatId: string; messageId: string }
  ): Promise<void> {
    try {
      let fullContent = '';
      
      for await (const chunk of this.streamChatCompletion(provider, params)) {
        const content = chunk.choices?.[0]?.delta?.content || '';
        const isComplete = chunk.choices?.[0]?.finishReason !== null;
        
        if (content) {
          fullContent += content;
        }
        
        callback({
          content: fullContent,
          isComplete,
        });
        
        if (isComplete) break;
      }
    } catch (error) {
      callback({
        content: '',
        isComplete: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Health check for a provider
  async checkProviderHealth(provider: AIProvider): Promise<boolean> {
    const client = this.getProvider(provider);
    
    try {
      const isHealthy = await client.healthCheck();
      this.registry[provider].isHealthy = isHealthy;
      this.registry[provider].lastHealthCheck = new Date();
      return isHealthy;
    } catch (error) {
      this.registry[provider].isHealthy = false;
      this.registry[provider].lastHealthCheck = new Date();
      return false;
    }
  }

  // Test connection for a provider
  async testProviderConnection(
    provider: AIProvider, 
    testMessage?: string
  ): Promise<{ success: boolean; latency: number; error?: string }> {
    const client = this.getProvider(provider);
    return client.testConnection(testMessage);
  }

  // Get provider status
  getProviderStatus(provider: AIProvider): {
    initialized: boolean;
    healthy?: boolean;
    lastHealthCheck?: Date;
    hasApiKey: boolean;
  } {
    const providerInfo = this.registry[provider];
    
    return {
      initialized: !!providerInfo?.client,
      healthy: providerInfo?.isHealthy,
      lastHealthCheck: providerInfo?.lastHealthCheck,
      hasApiKey: !!(providerInfo?.config?.apiKey)
    };
  }

  // Get all provider statuses
  getAllProviderStatuses(): Record<AIProvider, ReturnType<typeof this.getProviderStatus>> {
    const providers: AIProvider[] = ['openai', 'anthropic', 'gemini', 'xai', 'deepseek'];
    const statuses = {} as Record<AIProvider, ReturnType<typeof this.getProviderStatus>>;
    
    for (const provider of providers) {
      statuses[provider] = this.getProviderStatus(provider);
    }
    
    return statuses;
  }

  // Update provider configuration
  updateProviderConfig(provider: AIProvider, config: Partial<ProviderConfig>): void {
    const providerInfo = this.registry[provider];
    
    if (providerInfo) {
      providerInfo.config = { ...providerInfo.config!, ...config };
      
      // Reinitialize client if API key changed
      if (config.apiKey) {
        providerInfo.client = this.createClient(provider, providerInfo.config);
        providerInfo.isHealthy = undefined; // Reset health status
      }
    }
  }

  // Remove provider
  removeProvider(provider: AIProvider): void {
    delete this.registry[provider];
  }

  // Health check all providers
  async healthCheckAll(): Promise<Record<AIProvider, boolean>> {
    const providers: AIProvider[] = ['openai', 'anthropic', 'gemini', 'xai', 'deepseek'];
    const results = {} as Record<AIProvider, boolean>;
    
    const healthChecks = providers.map(async (provider) => {
      try {
        results[provider] = await this.checkProviderHealth(provider);
      } catch {
        results[provider] = false;
      }
    });
    
    await Promise.all(healthChecks);
    return results;
  }

  // Get recommended provider for a task
  getRecommendedProvider(
    task: 'chat' | 'code' | 'analysis' | 'creative' = 'chat',
    availableProviders?: AIProvider[]
  ): AIProvider | null {
    const providers = availableProviders || this.getHealthyProviders();
    
    if (providers.length === 0) return null;
    
    // Provider recommendations by task
    const recommendations = {
      chat: ['anthropic', 'openai', 'gemini', 'xai', 'deepseek'],
      code: ['openai', 'anthropic', 'deepseek', 'gemini', 'xai'],
      analysis: ['anthropic', 'gemini', 'openai', 'xai', 'deepseek'],
      creative: ['anthropic', 'openai', 'gemini', 'xai', 'deepseek']
    };
    
    for (const recommendedProvider of recommendations[task]) {
      if (providers.includes(recommendedProvider as AIProvider)) {
        return recommendedProvider as AIProvider;
      }
    }
    
    return providers[0]; // Fallback to first available
  }

  // Get healthy providers
  private getHealthyProviders(): AIProvider[] {
    const providers: AIProvider[] = ['openai', 'anthropic', 'gemini', 'xai', 'deepseek'];
    return providers.filter(provider => {
      const status = this.getProviderStatus(provider);
      return status.initialized && status.healthy !== false;
    });
  }

  // Create client instance
  private createClient(provider: AIProvider, config: ProviderConfig): BaseAPIClient {
    switch (provider) {
      case 'openai':
        return new OpenAIClient(config);
      case 'anthropic':
        return new AnthropicClient(config);
      case 'gemini':
        return new GeminiClient(config);
      case 'xai':
        return new XAIClient(config);
      case 'deepseek':
        return new DeepSeekClient(config);
      case 'openrouter':
        return new OpenRouterClient({
          apiKey: config.apiKey,
          appName: 'MindDeck',
          appUrl: 'https://minddeck.ai',
          baseURL: config.baseURL,
          timeout: config.timeout,
          retryAttempts: config.retryAttempts,
          retryDelay: config.retryDelay,
        });
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  // Handle provider-specific errors
  private handleProviderError(provider: AIProvider, error: any): void {
    // Mark provider as unhealthy if it's a persistent error
    if (error instanceof APIError && !error.retryable) {
      this.registry[provider].isHealthy = false;
    }
    
    // Log error for monitoring
    console.error(`Provider ${provider} error:`, error);
  }
}

// Convenience functions for easier usage
export const aiAPI = AIAPIManager.getInstance();

// Initialize provider with environment variables
export function initializeProviderFromEnv(provider: AIProvider): boolean {
  let apiKey: string | undefined;
  
  switch (provider) {
    case 'openai':
      apiKey = process.env.OPENAI_API_KEY;
      break;
    case 'anthropic':
      apiKey = process.env.ANTHROPIC_API_KEY;
      break;
    case 'gemini':
      apiKey = process.env.GOOGLE_API_KEY;
      break;
    case 'xai':
      apiKey = process.env.XAI_API_KEY;
      break;
    case 'deepseek':
      apiKey = process.env.DEEPSEEK_API_KEY;
      break;
    case 'openrouter':
      apiKey = process.env.OPENROUTER_API_KEY;
      break;
  }
  
  if (!apiKey) {
    console.warn(`No API key found for provider ${provider}`);
    return false;
  }
  
  try {
    aiAPI.initializeProvider(provider, { apiKey });
    return true;
  } catch (error) {
    console.error(`Failed to initialize provider ${provider}:`, error);
    return false;
  }
}

// Initialize all providers from environment
export function initializeAllProviders(): { initialized: AIProvider[]; failed: AIProvider[] } {
  const providers: AIProvider[] = ['openai', 'anthropic', 'gemini', 'xai', 'deepseek'];
  const initialized: AIProvider[] = [];
  const failed: AIProvider[] = [];
  
  for (const provider of providers) {
    if (initializeProviderFromEnv(provider)) {
      initialized.push(provider);
    } else {
      failed.push(provider);
    }
  }
  
  return { initialized, failed };
}

// Export all types and clients
export * from './types';
export { OpenAIClient } from './openai';
export { AnthropicClient } from './anthropic';
export { GeminiClient } from './gemini';
export { XAIClient } from './xai';
export { DeepSeekClient } from './deepseek';