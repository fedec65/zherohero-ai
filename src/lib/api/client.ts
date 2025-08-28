/**
 * Client-side AI API Service
 * Interfaces with Next.js API routes from the browser
 */

import { AIProvider, Message, ModelConfig } from '../stores/types';

// Request/Response types
interface ChatRequest {
  provider: AIProvider;
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt?: string;
  stopSequences?: string[];
}

interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finishReason: string | null;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface StreamingChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
    };
    finishReason?: string | null;
  }>;
}

export interface StreamingOptions {
  onContent?: (content: string, isComplete: boolean) => void;
  onError?: (error: string) => void;
  onComplete?: (fullContent: string) => void;
  signal?: AbortSignal;
}

export class AIClientAPI {
  private static instance: AIClientAPI;
  private baseURL = '/api/ai';

  private constructor() {}

  static getInstance(): AIClientAPI {
    if (!AIClientAPI.instance) {
      AIClientAPI.instance = new AIClientAPI();
    }
    return AIClientAPI.instance;
  }

  // Create non-streaming chat completion
  async createChatCompletion(request: ChatRequest): Promise<ChatResponse> {
    // Get API keys from settings store
    const { useSettingsStore } = await import('../stores/settings-store');
    const settingsState = useSettingsStore.getState();
    
    // Prepare headers with API keys for secure transmission
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add API key for the requested provider
    const apiKey = settingsState.getApiKey(request.provider);
    if (apiKey) {
      headers[`x-${request.provider}-key`] = apiKey;
    }
    
    const response = await fetch(`${this.baseURL}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...request, stream: false }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Create streaming chat completion
  async streamChatCompletion(
    request: ChatRequest,
    options: StreamingOptions = {}
  ): Promise<void> {
    // Get API keys from settings store
    const { useSettingsStore } = await import('../stores/settings-store');
    const settingsState = useSettingsStore.getState();
    
    // Prepare headers with API keys for secure transmission
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add API key for the requested provider
    const apiKey = settingsState.getApiKey(request.provider);
    if (apiKey) {
      headers[`x-${request.provider}-key`] = apiKey;
    }
    
    const response = await fetch(`${this.baseURL}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...request, stream: true }),
      signal: options.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
      options.onError?.(error);
      throw new Error(error);
    }

    if (!response.body) {
      const error = 'No response body for streaming request';
      options.onError?.(error);
      throw new Error(error);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              options.onComplete?.(fullContent);
              return;
            }

            try {
              const parsed: StreamingChunk = JSON.parse(data);
              
              // Check for errors
              if ((parsed as any).error) {
                const error = (parsed as any).error.message || 'Streaming error';
                options.onError?.(error);
                return;
              }

              const content = parsed.choices?.[0]?.delta?.content || '';
              const isComplete = parsed.choices?.[0]?.finishReason !== null && parsed.choices?.[0]?.finishReason !== undefined;

              if (content) {
                fullContent += content;
              }

              options.onContent?.(fullContent, isComplete);

              if (isComplete) {
                options.onComplete?.(fullContent);
                return;
              }

            } catch (e) {
              // Skip invalid JSON chunks
              console.warn('Failed to parse streaming chunk:', data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // Get provider health status
  async getHealthStatus(): Promise<{
    system: {
      status: string;
      providersInitialized: number;
      providersHealthy: number;
      totalProviders: number;
    };
    providers: Record<string, {
      initialized: boolean;
      hasApiKey: boolean;
      healthy: boolean;
      status: string;
    }>;
  }> {
    const response = await fetch(`${this.baseURL}/health`);
    
    if (!response.ok) {
      throw new Error(`Failed to get health status: ${response.statusText}`);
    }

    return response.json();
  }

  // Test specific provider
  async testProvider(provider: AIProvider, testMessage = 'Hello!'): Promise<{
    provider: string;
    test: {
      success: boolean;
      latency: number;
      error?: string;
    };
  }> {
    const response = await fetch(`${this.baseURL}/health`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ provider, testMessage }),
    });

    if (!response.ok) {
      throw new Error(`Failed to test provider: ${response.statusText}`);
    }

    return response.json();
  }

  // Get available models
  async getModels(provider?: AIProvider): Promise<any> {
    const url = provider 
      ? `${this.baseURL}/models?provider=${provider}&includeStatus=true`
      : `${this.baseURL}/models?includeStatus=true`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to get models: ${response.statusText}`);
    }

    return response.json();
  }

  // Get model recommendations
  async getModelRecommendations(
    task: 'chat' | 'code' | 'analysis' | 'creative',
    providers?: AIProvider[]
  ): Promise<{
    task: string;
    recommendation: {
      provider: AIProvider;
      models: any[];
      status: any;
    } | null;
  }> {
    const response = await fetch(`${this.baseURL}/models`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task, providers }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get recommendations: ${response.statusText}`);
    }

    return response.json();
  }

  // Convert store messages to API format
  static formatMessages(messages: Message[]): ChatRequest['messages'] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  // Convert model config to API parameters
  static formatModelConfig(config: ModelConfig): Partial<ChatRequest> {
    return {
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      topP: config.topP,
      topK: config.topK,
      frequencyPenalty: config.frequencyPenalty,
      presencePenalty: config.presencePenalty,
      systemPrompt: config.systemPrompt,
      stopSequences: config.stopSequences
    };
  }
}

// Export singleton instance
export const aiClientAPI = AIClientAPI.getInstance();