/**
 * Core API types and interfaces for AI provider integration
 */

import { Message, ModelConfig, AIProvider } from '../stores/types/index';

// Chat completion request types
export interface ChatCompletionParams {
  model: string;
  messages: APIMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt?: string;
  stopSequences?: string[];
  stream?: boolean;
}

export interface APIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Chat completion response types
export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finishReason: 'stop' | 'length' | 'content_filter' | null;
  }>;
}

export interface StreamingResponse {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
    };
    finishReason?: 'stop' | 'length' | 'content_filter' | null;
  }>;
}

// API Error types
export class APIError extends Error {
  status?: number;
  code?: string;
  type?: string;
  provider: AIProvider;
  retryable?: boolean;

  constructor(
    message: string, 
    provider: AIProvider, 
    options: Partial<Pick<APIError, 'status' | 'code' | 'type' | 'retryable'>> = {}
  ) {
    super(message);
    this.name = 'APIError';
    this.provider = provider;
    this.status = options.status;
    this.code = options.code;
    this.type = options.type;
    this.retryable = options.retryable ?? true;
  }
}

// Provider-specific configuration
export interface ProviderConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// Base API client interface
export interface BaseAPIClient {
  provider: AIProvider;
  
  // Core methods
  createChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse>;
  streamChatCompletion(params: ChatCompletionParams): AsyncGenerator<StreamingResponse, void, unknown>;
  
  // Utility methods
  validateConfig(config: ModelConfig): { isValid: boolean; errors: string[] };
  estimateTokens(text: string): number;
  formatMessages(messages: Message[]): APIMessage[];
  
  // Health and testing
  healthCheck(): Promise<boolean>;
  testConnection(testMessage?: string): Promise<{ success: boolean; latency: number; error?: string }>;
}

// Streaming callback types
export type StreamingCallback = (chunk: {
  content: string;
  isComplete: boolean;
  error?: string;
}) => void;

// Request context for tracking and debugging
export interface RequestContext {
  requestId: string;
  userId?: string;
  chatId: string;
  messageId: string;
  provider: AIProvider;
  model: string;
  timestamp: Date;
}

// Rate limiting types
export interface RateLimit {
  requests: number;
  tokens: number;
  resetTime: Date;
}

export interface RateLimitStatus {
  remaining: RateLimit;
  limit: RateLimit;
  retryAfter?: number;
}

// Provider-specific model mappings
export type ProviderModelMap = {
  [K in AIProvider]: string[];
};

// Configuration validation types
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// API response metadata
export interface ResponseMetadata {
  requestId: string;
  provider: AIProvider;
  model: string;
  latency: number;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  cached?: boolean;
  rateLimit?: RateLimitStatus;
}

// Performance monitoring types
export interface PerformanceMetrics {
  requestId: string;
  provider: AIProvider;
  model: string;
  duration: number;
  success: boolean;
  tokens?: number;
  error?: string;
  timestamp?: Date;
}

export interface StreamingPerformanceMetrics extends PerformanceMetrics {
  firstTokenLatency: number | null;
  tokenCount: number;
  throughput?: number; // tokens per second
}

// Connection pool and queue management
export interface ConnectionPoolStats {
  activeConnections: number;
  availableConnections: number;
  pendingRequests: number;
  connectionReuse: number;
}

export interface QueueStats {
  pendingRequests: number;
  averageWaitTime: number;
  maxQueueSize: number;
  rejectedRequests: number;
}

// Circuit breaker status
export interface CircuitBreakerStatus {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
}

// Enhanced provider status with performance data
export interface EnhancedProviderStatus {
  initialized: boolean;
  healthy?: boolean;
  lastHealthCheck?: Date;
  hasApiKey: boolean;
  performance: {
    averageLatency: number;
    averageFirstTokenLatency: number;
    throughput: number;
    errorRate: number;
    totalRequests: number;
  };
  circuitBreaker: CircuitBreakerStatus;
  connectionPool: ConnectionPoolStats;
  queue: QueueStats;
}