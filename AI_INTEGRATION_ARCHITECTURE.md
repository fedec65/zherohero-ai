# AI Provider Integration Architecture for MindDeck Clone

## 1. Unified API Integration Architecture

### 1.1 Core Architecture Design

```typescript
// src/lib/ai/types.ts
export interface AIProvider {
  name: 'openai' | 'anthropic' | 'gemini' | 'xai' | 'deepseek';
  apiKey: string;
  baseURL?: string;
  organization?: string;
  maxRetries?: number;
  timeout?: number;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: AIProvider['name'];
  contextWindow: number;
  maxOutputTokens?: number;
  supportsFunctions?: boolean;
  supportsVision?: boolean;
  supportsStreaming?: boolean;
  costPer1kInput?: number;
  costPer1kOutput?: number;
  isNew?: boolean;
  deprecated?: boolean;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: any;
  tool_calls?: any[];
  metadata?: {
    tokens?: number;
    latency?: number;
    model?: string;
    timestamp?: number;
  };
}

export interface ChatCompletionParams {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  stream?: boolean;
  functions?: any[];
  tools?: any[];
  userId?: string;
  sessionId?: string;
  mcpServers?: MCPServer[];
}

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
      function_call?: any;
    };
    finish_reason?: string;
  }>;
}
```

### 1.2 Base AI Client Abstract Class

```typescript
// src/lib/ai/base-client.ts
import { EventEmitter } from 'events';

export abstract class BaseAIClient extends EventEmitter {
  protected apiKey: string;
  protected baseURL: string;
  protected maxRetries: number;
  protected timeout: number;
  protected rateLimiter: RateLimiter;
  protected tokenCounter: TokenCounter;
  protected cache: CacheManager;
  protected telemetry: TelemetryManager;

  constructor(config: AIProvider) {
    super();
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || this.getDefaultBaseURL();
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 60000;
    this.rateLimiter = new RateLimiter(this.getRateLimits());
    this.tokenCounter = new TokenCounter();
    this.cache = new CacheManager();
    this.telemetry = new TelemetryManager();
  }

  protected abstract getDefaultBaseURL(): string;
  protected abstract getRateLimits(): RateLimitConfig;
  protected abstract transformRequest(params: ChatCompletionParams): any;
  protected abstract transformResponse(response: any): ChatMessage;
  protected abstract transformStreamChunk(chunk: any): StreamChunk;

  async createChatCompletion(params: ChatCompletionParams): Promise<ChatMessage> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(params);
      const cached = await this.cache.get(cacheKey);
      if (cached && !params.stream) {
        this.telemetry.recordCacheHit(params.model);
        return cached;
      }

      // Apply rate limiting
      await this.rateLimiter.acquire();

      // Transform request to provider-specific format
      const requestBody = this.transformRequest(params);

      // Count input tokens
      const inputTokens = this.tokenCounter.countTokens(params.messages, params.model);
      
      // Check context window limits
      this.validateContextWindow(inputTokens, params.model);

      // Make API request with retry logic
      const response = await this.makeRequestWithRetry(requestBody);

      // Transform response to unified format
      const message = this.transformResponse(response);

      // Count output tokens
      const outputTokens = this.tokenCounter.countTokens([message], params.model);

      // Record telemetry
      this.telemetry.record({
        model: params.model,
        provider: this.constructor.name,
        inputTokens,
        outputTokens,
        latency: Date.now() - startTime,
        cost: this.calculateCost(inputTokens, outputTokens, params.model),
      });

      // Cache response
      if (!params.stream) {
        await this.cache.set(cacheKey, message);
      }

      return message;
    } catch (error) {
      this.handleError(error, params);
      throw error;
    } finally {
      this.rateLimiter.release();
    }
  }

  async *streamChatCompletion(params: ChatCompletionParams): AsyncGenerator<StreamChunk> {
    const startTime = Date.now();
    let totalTokens = 0;

    try {
      await this.rateLimiter.acquire();
      
      const requestBody = this.transformRequest({ ...params, stream: true });
      const inputTokens = this.tokenCounter.countTokens(params.messages, params.model);
      
      this.validateContextWindow(inputTokens, params.model);

      const stream = await this.makeStreamRequest(requestBody);
      
      for await (const chunk of stream) {
        const transformedChunk = this.transformStreamChunk(chunk);
        totalTokens += this.tokenCounter.countChunk(transformedChunk);
        yield transformedChunk;
      }

      this.telemetry.record({
        model: params.model,
        provider: this.constructor.name,
        inputTokens,
        outputTokens: totalTokens,
        latency: Date.now() - startTime,
        streaming: true,
      });
    } catch (error) {
      this.handleError(error, params);
      throw error;
    } finally {
      this.rateLimiter.release();
    }
  }

  protected async makeRequestWithRetry(body: any, retries = 0): Promise<any> {
    try {
      const response = await this.makeRequest(body);
      return response;
    } catch (error: any) {
      if (retries < this.maxRetries && this.isRetryableError(error)) {
        const delay = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequestWithRetry(body, retries + 1);
      }
      throw error;
    }
  }

  protected abstract makeRequest(body: any): Promise<any>;
  protected abstract makeStreamRequest(body: any): Promise<AsyncIterable<any>>;
  protected abstract isRetryableError(error: any): boolean;
  protected abstract handleError(error: any, params: ChatCompletionParams): void;
}
```

## 2. Provider-Specific Implementations

### 2.1 OpenAI Client Implementation

```typescript
// src/lib/ai/providers/openai.ts
import OpenAI from 'openai';
import { BaseAIClient } from '../base-client';

export class OpenAIClient extends BaseAIClient {
  private client: OpenAI;
  
  constructor(config: AIProvider) {
    super(config);
    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseURL,
      organization: config.organization,
      maxRetries: 0, // We handle retries ourselves
    });
  }

  protected getDefaultBaseURL(): string {
    return 'https://api.openai.com/v1';
  }

  protected getRateLimits(): RateLimitConfig {
    return {
      rpm: 10000, // Tier 5 limits
      tpm: 2000000,
      rpd: 10000,
    };
  }

  protected transformRequest(params: ChatCompletionParams): any {
    // Apply MCP injection for OpenAI
    const messages = params.mcpServers 
      ? this.injectMCPContext(params.messages, params.mcpServers)
      : params.messages;

    return {
      model: params.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        name: m.name,
        function_call: m.function_call,
      })),
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens,
      top_p: params.topP ?? 1,
      frequency_penalty: params.frequencyPenalty ?? 0,
      presence_penalty: params.presencePenalty ?? 0,
      stop: params.stopSequences,
      stream: params.stream ?? false,
      functions: params.functions,
      tools: params.tools,
      user: params.userId,
    };
  }

  protected transformResponse(response: any): ChatMessage {
    const choice = response.choices[0];
    return {
      role: choice.message.role,
      content: choice.message.content || '',
      function_call: choice.message.function_call,
      tool_calls: choice.message.tool_calls,
      metadata: {
        tokens: response.usage?.total_tokens,
        model: response.model,
        timestamp: Date.now(),
      },
    };
  }

  protected transformStreamChunk(chunk: any): StreamChunk {
    return chunk; // OpenAI format is our standard
  }

  protected async makeRequest(body: any): Promise<any> {
    const response = await this.client.chat.completions.create(body);
    return response;
  }

  protected async makeStreamRequest(body: any): Promise<AsyncIterable<any>> {
    const stream = await this.client.chat.completions.create({
      ...body,
      stream: true,
    });
    return stream;
  }

  protected isRetryableError(error: any): boolean {
    const status = error.status || error.response?.status;
    return [429, 500, 502, 503, 504].includes(status);
  }

  protected handleError(error: any, params: ChatCompletionParams): void {
    const errorCode = error.code || error.type;
    const status = error.status || error.response?.status;
    
    this.emit('error', {
      provider: 'openai',
      model: params.model,
      error: errorCode,
      status,
      message: error.message,
      timestamp: Date.now(),
    });

    // Log to telemetry
    this.telemetry.recordError({
      provider: 'openai',
      model: params.model,
      errorCode,
      status,
    });
  }

  private injectMCPContext(messages: ChatMessage[], mcpServers: MCPServer[]): ChatMessage[] {
    // MCP injection logic for OpenAI
    const contextMessage = this.buildMCPContextMessage(mcpServers);
    return [contextMessage, ...messages];
  }

  private buildMCPContextMessage(mcpServers: MCPServer[]): ChatMessage {
    const context = mcpServers
      .filter(s => s.enabled)
      .map(s => `[MCP Server: ${s.name}]\n${s.context}`)
      .join('\n\n');

    return {
      role: 'system',
      content: `Available context from MCP servers:\n\n${context}`,
    };
  }
}
```

### 2.2 Anthropic Claude Client

```typescript
// src/lib/ai/providers/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';
import { BaseAIClient } from '../base-client';

export class AnthropicClient extends BaseAIClient {
  private client: Anthropic;

  constructor(config: AIProvider) {
    super(config);
    this.client = new Anthropic({
      apiKey: this.apiKey,
      baseURL: this.baseURL,
    });
  }

  protected getDefaultBaseURL(): string {
    return 'https://api.anthropic.com';
  }

  protected getRateLimits(): RateLimitConfig {
    return {
      rpm: 4000,
      tpm: 400000,
      rpd: 10000,
    };
  }

  protected transformRequest(params: ChatCompletionParams): any {
    // Extract system message
    const systemMessage = params.messages.find(m => m.role === 'system');
    const otherMessages = params.messages.filter(m => m.role !== 'system');

    return {
      model: params.model,
      messages: otherMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      system: systemMessage?.content,
      max_tokens: params.maxTokens || 4096,
      temperature: params.temperature ?? 0.7,
      top_p: params.topP ?? 1,
      stop_sequences: params.stopSequences,
      stream: params.stream ?? false,
      metadata: {
        user_id: params.userId,
      },
    };
  }

  protected transformResponse(response: any): ChatMessage {
    return {
      role: 'assistant',
      content: response.content[0].text,
      metadata: {
        tokens: response.usage.input_tokens + response.usage.output_tokens,
        model: response.model,
        timestamp: Date.now(),
      },
    };
  }

  protected transformStreamChunk(chunk: any): StreamChunk {
    // Transform Anthropic stream format to OpenAI format
    if (chunk.type === 'content_block_delta') {
      return {
        id: chunk.index,
        object: 'chat.completion.chunk',
        created: Date.now(),
        model: 'claude',
        choices: [{
          index: 0,
          delta: {
            content: chunk.delta.text,
          },
          finish_reason: null,
        }],
      };
    }
    
    if (chunk.type === 'message_stop') {
      return {
        id: 'final',
        object: 'chat.completion.chunk',
        created: Date.now(),
        model: 'claude',
        choices: [{
          index: 0,
          delta: {},
          finish_reason: 'stop',
        }],
      };
    }

    return null;
  }

  protected async makeRequest(body: any): Promise<any> {
    const response = await this.client.messages.create(body);
    return response;
  }

  protected async makeStreamRequest(body: any): Promise<AsyncIterable<any>> {
    const stream = await this.client.messages.create({
      ...body,
      stream: true,
    });
    return stream;
  }

  protected isRetryableError(error: any): boolean {
    const status = error.status || error.response?.status;
    return [429, 500, 502, 503, 504, 529].includes(status);
  }

  protected handleError(error: any, params: ChatCompletionParams): void {
    const errorType = error.error?.type || 'unknown_error';
    const status = error.status;
    
    this.emit('error', {
      provider: 'anthropic',
      model: params.model,
      error: errorType,
      status,
      message: error.message,
      timestamp: Date.now(),
    });

    this.telemetry.recordError({
      provider: 'anthropic',
      model: params.model,
      errorCode: errorType,
      status,
    });
  }
}
```

### 2.3 Google Gemini Client

```typescript
// src/lib/ai/providers/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIClient } from '../base-client';

export class GeminiClient extends BaseAIClient {
  private client: GoogleGenerativeAI;

  constructor(config: AIProvider) {
    super(config);
    this.client = new GoogleGenerativeAI(this.apiKey);
  }

  protected getDefaultBaseURL(): string {
    return 'https://generativelanguage.googleapis.com';
  }

  protected getRateLimits(): RateLimitConfig {
    return {
      rpm: 2000,
      tpm: 1000000,
      rpd: 10000,
    };
  }

  protected transformRequest(params: ChatCompletionParams): any {
    const model = this.client.getGenerativeModel({ 
      model: params.model,
      generationConfig: {
        temperature: params.temperature ?? 0.7,
        topP: params.topP ?? 1,
        maxOutputTokens: params.maxTokens,
        stopSequences: params.stopSequences,
      },
    });

    // Convert messages to Gemini format
    const contents = this.convertToGeminiFormat(params.messages);

    return {
      model,
      contents,
      stream: params.stream,
    };
  }

  private convertToGeminiFormat(messages: ChatMessage[]): any[] {
    return messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
  }

  protected transformResponse(response: any): ChatMessage {
    return {
      role: 'assistant',
      content: response.response.text(),
      metadata: {
        tokens: response.response.usageMetadata?.totalTokenCount,
        model: 'gemini',
        timestamp: Date.now(),
      },
    };
  }

  protected transformStreamChunk(chunk: any): StreamChunk {
    return {
      id: Date.now().toString(),
      object: 'chat.completion.chunk',
      created: Date.now(),
      model: 'gemini',
      choices: [{
        index: 0,
        delta: {
          content: chunk.text(),
        },
        finish_reason: null,
      }],
    };
  }

  protected async makeRequest(body: any): Promise<any> {
    const { model, contents } = body;
    const chat = model.startChat({ history: contents.slice(0, -1) });
    const result = await chat.sendMessage(contents[contents.length - 1].parts[0].text);
    return result;
  }

  protected async makeStreamRequest(body: any): Promise<AsyncIterable<any>> {
    const { model, contents } = body;
    const chat = model.startChat({ history: contents.slice(0, -1) });
    const result = await chat.sendMessageStream(contents[contents.length - 1].parts[0].text);
    return result.stream;
  }

  protected isRetryableError(error: any): boolean {
    const status = error.status || error.response?.status;
    return [429, 500, 502, 503, 504].includes(status);
  }

  protected handleError(error: any, params: ChatCompletionParams): void {
    this.emit('error', {
      provider: 'gemini',
      model: params.model,
      error: error.message,
      timestamp: Date.now(),
    });

    this.telemetry.recordError({
      provider: 'gemini',
      model: params.model,
      errorCode: error.code,
    });
  }
}
```

### 2.4 xAI Grok Client

```typescript
// src/lib/ai/providers/xai.ts
import { BaseAIClient } from '../base-client';

export class XAIClient extends BaseAIClient {
  protected getDefaultBaseURL(): string {
    return 'https://api.x.ai/v1';
  }

  protected getRateLimits(): RateLimitConfig {
    return {
      rpm: 1000,
      tpm: 500000,
      rpd: 5000,
    };
  }

  protected transformRequest(params: ChatCompletionParams): any {
    // xAI uses OpenAI-compatible format
    return {
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens,
      top_p: params.topP ?? 1,
      frequency_penalty: params.frequencyPenalty ?? 0,
      presence_penalty: params.presencePenalty ?? 0,
      stop: params.stopSequences,
      stream: params.stream ?? false,
    };
  }

  protected transformResponse(response: any): ChatMessage {
    const choice = response.choices[0];
    return {
      role: choice.message.role,
      content: choice.message.content || '',
      metadata: {
        tokens: response.usage?.total_tokens,
        model: response.model,
        timestamp: Date.now(),
      },
    };
  }

  protected transformStreamChunk(chunk: any): StreamChunk {
    return chunk; // xAI uses OpenAI format
  }

  protected async makeRequest(body: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(`xAI API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  protected async *makeStreamRequest(body: any): AsyncIterable<any> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...body, stream: true }),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(`xAI API error: ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            yield JSON.parse(data);
          } catch (e) {
            console.error('Failed to parse stream chunk:', e);
          }
        }
      }
    }
  }

  protected isRetryableError(error: any): boolean {
    const status = error.status;
    return [429, 500, 502, 503, 504].includes(status);
  }

  protected handleError(error: any, params: ChatCompletionParams): void {
    this.emit('error', {
      provider: 'xai',
      model: params.model,
      error: error.message,
      timestamp: Date.now(),
    });
  }
}
```

### 2.5 DeepSeek Client

```typescript
// src/lib/ai/providers/deepseek.ts
import { BaseAIClient } from '../base-client';

export class DeepSeekClient extends BaseAIClient {
  protected getDefaultBaseURL(): string {
    return 'https://api.deepseek.com';
  }

  protected getRateLimits(): RateLimitConfig {
    return {
      rpm: 500,
      tpm: 200000,
      rpd: 5000,
    };
  }

  protected transformRequest(params: ChatCompletionParams): any {
    // DeepSeek uses OpenAI-compatible format
    return {
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens,
      top_p: params.topP ?? 1,
      frequency_penalty: params.frequencyPenalty ?? 0,
      presence_penalty: params.presencePenalty ?? 0,
      stop: params.stopSequences,
      stream: params.stream ?? false,
    };
  }

  protected transformResponse(response: any): ChatMessage {
    const choice = response.choices[0];
    return {
      role: choice.message.role,
      content: choice.message.content || '',
      metadata: {
        tokens: response.usage?.total_tokens,
        model: response.model,
        timestamp: Date.now(),
      },
    };
  }

  protected transformStreamChunk(chunk: any): StreamChunk {
    return chunk; // DeepSeek uses OpenAI format
  }

  protected async makeRequest(body: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    return response.json();
  }

  protected async *makeStreamRequest(body: any): AsyncIterable<any> {
    const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...body, stream: true }),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            yield JSON.parse(data);
          } catch (e) {
            console.error('Failed to parse stream chunk:', e);
          }
        }
      }
    }
  }

  protected isRetryableError(error: any): boolean {
    const status = error.status;
    return [429, 500, 502, 503, 504].includes(status);
  }

  protected handleError(error: any, params: ChatCompletionParams): void {
    this.emit('error', {
      provider: 'deepseek',
      model: params.model,
      error: error.message,
      timestamp: Date.now(),
    });
  }
}
```

## 3. Unified AI Manager

```typescript
// src/lib/ai/ai-manager.ts
import { OpenAIClient } from './providers/openai';
import { AnthropicClient } from './providers/anthropic';
import { GeminiClient } from './providers/gemini';
import { XAIClient } from './providers/xai';
import { DeepSeekClient } from './providers/deepseek';
import { ModelRegistry } from './model-registry';
import { MCPManager } from './mcp-manager';
import { BaseAIClient } from './base-client';

export class AIManager {
  private clients: Map<string, BaseAIClient> = new Map();
  private modelRegistry: ModelRegistry;
  private mcpManager: MCPManager;
  private activeModel: string = 'gpt-4-turbo-preview';

  constructor() {
    this.modelRegistry = new ModelRegistry();
    this.mcpManager = new MCPManager();
    this.initializeClients();
  }

  private initializeClients() {
    // Initialize clients lazily when API keys are available
    if (process.env.OPENAI_API_KEY) {
      this.clients.set('openai', new OpenAIClient({
        name: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
      }));
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.clients.set('anthropic', new AnthropicClient({
        name: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY,
      }));
    }

    if (process.env.GOOGLE_API_KEY) {
      this.clients.set('gemini', new GeminiClient({
        name: 'gemini',
        apiKey: process.env.GOOGLE_API_KEY,
      }));
    }

    if (process.env.XAI_API_KEY) {
      this.clients.set('xai', new XAIClient({
        name: 'xai',
        apiKey: process.env.XAI_API_KEY,
      }));
    }

    if (process.env.DEEPSEEK_API_KEY) {
      this.clients.set('deepseek', new DeepSeekClient({
        name: 'deepseek',
        apiKey: process.env.DEEPSEEK_API_KEY,
      }));
    }
  }

  async chat(params: ChatCompletionParams): Promise<ChatMessage> {
    const modelConfig = this.modelRegistry.getModel(params.model || this.activeModel);
    if (!modelConfig) {
      throw new Error(`Model ${params.model} not found`);
    }

    const client = this.clients.get(modelConfig.provider);
    if (!client) {
      throw new Error(`Provider ${modelConfig.provider} not initialized`);
    }

    // Apply MCP servers if using OpenAI
    if (modelConfig.provider === 'openai') {
      params.mcpServers = await this.mcpManager.getEnabledServers();
    }

    return client.createChatCompletion(params);
  }

  async *streamChat(params: ChatCompletionParams): AsyncGenerator<StreamChunk> {
    const modelConfig = this.modelRegistry.getModel(params.model || this.activeModel);
    if (!modelConfig) {
      throw new Error(`Model ${params.model} not found`);
    }

    const client = this.clients.get(modelConfig.provider);
    if (!client) {
      throw new Error(`Provider ${modelConfig.provider} not initialized`);
    }

    // Apply MCP servers if using OpenAI
    if (modelConfig.provider === 'openai') {
      params.mcpServers = await this.mcpManager.getEnabledServers();
    }

    yield* client.streamChatCompletion(params);
  }

  setActiveModel(modelId: string) {
    const model = this.modelRegistry.getModel(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }
    this.activeModel = modelId;
  }

  getAvailableModels() {
    return this.modelRegistry.getAllModels();
  }

  getModelsByProvider(provider: string) {
    return this.modelRegistry.getModelsByProvider(provider);
  }
}
```

## 4. Model Registry

```typescript
// src/lib/ai/model-registry.ts
export class ModelRegistry {
  private models: Map<string, ModelConfig> = new Map();

  constructor() {
    this.registerModels();
  }

  private registerModels() {
    // OpenAI Models (22)
    const openaiModels: ModelConfig[] = [
      // GPT-5 Series
      { id: 'gpt-5', name: 'GPT-5', provider: 'openai', contextWindow: 200000, isNew: true, supportsStreaming: true, supportsFunctions: true },
      { id: 'gpt-5-turbo', name: 'GPT-5 Turbo', provider: 'openai', contextWindow: 200000, isNew: true, supportsStreaming: true, supportsFunctions: true },
      { id: 'gpt-5-turbo-preview', name: 'GPT-5 Turbo Preview', provider: 'openai', contextWindow: 200000, isNew: true, supportsStreaming: true, supportsFunctions: true },
      
      // O-series
      { id: 'o-mini', name: 'O Mini', provider: 'openai', contextWindow: 128000, supportsStreaming: true, supportsFunctions: true },
      { id: 'o-mini-2024-07-18', name: 'O Mini 2024-07-18', provider: 'openai', contextWindow: 128000, supportsStreaming: true, supportsFunctions: true },
      { id: 'o1', name: 'O1', provider: 'openai', contextWindow: 200000, supportsStreaming: true, supportsFunctions: true },
      { id: 'o1-2024-12-17', name: 'O1 2024-12-17', provider: 'openai', contextWindow: 200000, supportsStreaming: true, supportsFunctions: true },
      { id: 'o1-preview', name: 'O1 Preview', provider: 'openai', contextWindow: 128000, supportsStreaming: true, supportsFunctions: true },
      { id: 'o1-preview-2024-09-12', name: 'O1 Preview 2024-09-12', provider: 'openai', contextWindow: 128000, supportsStreaming: true, supportsFunctions: true },
      
      // GPT-4.1
      { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'openai', contextWindow: 128000, supportsStreaming: true, supportsFunctions: true, supportsVision: true },
      { id: 'gpt-4.1-preview', name: 'GPT-4.1 Preview', provider: 'openai', contextWindow: 128000, supportsStreaming: true, supportsFunctions: true, supportsVision: true },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'openai', contextWindow: 128000, supportsStreaming: true, supportsFunctions: true },
      
      // GPT-4o Series
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextWindow: 128000, supportsStreaming: true, supportsFunctions: true, supportsVision: true },
      { id: 'gpt-4o-2024-08-06', name: 'GPT-4o 2024-08-06', provider: 'openai', contextWindow: 128000, supportsStreaming: true, supportsFunctions: true, supportsVision: true },
      { id: 'gpt-4o-2024-11-20', name: 'GPT-4o 2024-11-20', provider: 'openai', contextWindow: 128000, supportsStreaming: true, supportsFunctions: true, supportsVision: true },
      { id: 'gpt-4o-audio-preview', name: 'GPT-4o Audio Preview', provider: 'openai', contextWindow: 128000, supportsStreaming: true, supportsFunctions: true },
      { id: 'gpt-4o-audio-preview-2024-10-01', name: 'GPT-4o Audio Preview 2024-10-01', provider: 'openai', contextWindow: 128000, supportsStreaming: true, supportsFunctions: true },
      { id: 'gpt-4o-audio-preview-2024-12-17', name: 'GPT-4o Audio Preview 2024-12-17', provider: 'openai', contextWindow: 128000, supportsStreaming: true, supportsFunctions: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', contextWindow: 128000, supportsStreaming: true, supportsFunctions: true },
      { id: 'gpt-4o-mini-2024-07-18', name: 'GPT-4o Mini 2024-07-18', provider: 'openai', contextWindow: 128000, supportsStreaming: true, supportsFunctions: true },
      
      // Legacy
      { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo Preview', provider: 'openai', contextWindow: 128000, supportsStreaming: true, supportsFunctions: true, deprecated: true },
      { id: 'codex-mini', name: 'Codex Mini', provider: 'openai', contextWindow: 8000, supportsStreaming: true },
    ];

    // Anthropic Models (10)
    const anthropicModels: ModelConfig[] = [
      { id: 'claude-opus-4.1', name: 'Claude Opus 4.1', provider: 'anthropic', contextWindow: 200000, isNew: true, supportsStreaming: true },
      { id: 'claude-4', name: 'Claude 4', provider: 'anthropic', contextWindow: 200000, supportsStreaming: true },
      { id: 'claude-4-instant', name: 'Claude 4 Instant', provider: 'anthropic', contextWindow: 100000, supportsStreaming: true },
      { id: 'claude-3.7-sonnet-20250122', name: 'Claude 3.7 Sonnet', provider: 'anthropic', contextWindow: 200000, supportsStreaming: true },
      { id: 'claude-3.5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', contextWindow: 200000, supportsStreaming: true },
      { id: 'claude-3.5-sonnet-20240620', name: 'Claude 3.5 Sonnet (June)', provider: 'anthropic', contextWindow: 200000, supportsStreaming: true },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', contextWindow: 200000, supportsStreaming: true },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'anthropic', contextWindow: 200000, supportsStreaming: true },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', contextWindow: 200000, supportsStreaming: true },
      { id: 'claude-3.5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic', contextWindow: 200000, supportsStreaming: true },
    ];

    // Gemini Models (9)
    const geminiModels: ModelConfig[] = [
      { id: 'gemini-2.5-flash-exp-0128', name: 'Gemini 2.5 Flash Exp', provider: 'gemini', contextWindow: 1048576, supportsStreaming: true },
      { id: 'gemini-2.5-pro-002', name: 'Gemini 2.5 Pro', provider: 'gemini', contextWindow: 2097152, supportsStreaming: true },
      { id: 'gemini-2.0-flash-thinking-exp-0110', name: 'Gemini 2.0 Flash Thinking', provider: 'gemini', contextWindow: 32767, supportsStreaming: true },
      { id: 'gemini-2.0-flash-thinking-exp-1219', name: 'Gemini 2.0 Flash Thinking (Dec)', provider: 'gemini', contextWindow: 32767, supportsStreaming: true },
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Exp', provider: 'gemini', contextWindow: 1048576, supportsStreaming: true },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'gemini', contextWindow: 1048576, supportsStreaming: true },
      { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', provider: 'gemini', contextWindow: 1048576, supportsStreaming: true },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gemini', contextWindow: 2097152, supportsStreaming: true },
      { id: 'gemini-exp-1206', name: 'Gemini Exp 1206', provider: 'gemini', contextWindow: 2097152, supportsStreaming: true },
    ];

    // xAI Models (3)
    const xaiModels: ModelConfig[] = [
      { id: 'grok-4', name: 'Grok 4', provider: 'xai', contextWindow: 131072, isNew: true, supportsStreaming: true },
      { id: 'grok-3', name: 'Grok 3', provider: 'xai', contextWindow: 131072, supportsStreaming: true },
      { id: 'grok-3-turbo', name: 'Grok 3 Turbo', provider: 'xai', contextWindow: 131072, supportsStreaming: true },
    ];

    // DeepSeek Models (2)
    const deepseekModels: ModelConfig[] = [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek', contextWindow: 128000, isNew: true, supportsStreaming: true },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', provider: 'deepseek', contextWindow: 128000, isNew: true, supportsStreaming: true },
    ];

    // Register all models
    [...openaiModels, ...anthropicModels, ...geminiModels, ...xaiModels, ...deepseekModels].forEach(model => {
      this.models.set(model.id, model);
    });
  }

  getModel(id: string): ModelConfig | undefined {
    return this.models.get(id);
  }

  getAllModels(): ModelConfig[] {
    return Array.from(this.models.values());
  }

  getModelsByProvider(provider: string): ModelConfig[] {
    return Array.from(this.models.values()).filter(m => m.provider === provider);
  }
}
```

## 5. Supporting Infrastructure

### 5.1 Rate Limiter

```typescript
// src/lib/ai/rate-limiter.ts
export interface RateLimitConfig {
  rpm: number;  // requests per minute
  tpm: number;  // tokens per minute
  rpd: number;  // requests per day
}

export class RateLimiter {
  private requestsPerMinute: number;
  private tokensPerMinute: number;
  private requestsPerDay: number;
  
  private minuteWindow: number[] = [];
  private dayWindow: number[] = [];
  private tokenWindow: Map<number, number> = new Map();

  constructor(config: RateLimitConfig) {
    this.requestsPerMinute = config.rpm;
    this.tokensPerMinute = config.tpm;
    this.requestsPerDay = config.rpd;
  }

  async acquire(tokens: number = 0): Promise<void> {
    const now = Date.now();
    
    // Clean old entries
    this.cleanWindows(now);
    
    // Check rate limits
    if (this.minuteWindow.length >= this.requestsPerMinute) {
      const waitTime = 60000 - (now - this.minuteWindow[0]);
      await this.delay(waitTime);
      return this.acquire(tokens);
    }

    if (this.dayWindow.length >= this.requestsPerDay) {
      const waitTime = 86400000 - (now - this.dayWindow[0]);
      await this.delay(waitTime);
      return this.acquire(tokens);
    }

    if (tokens > 0) {
      const currentTokens = this.getCurrentTokensPerMinute(now);
      if (currentTokens + tokens > this.tokensPerMinute) {
        await this.delay(1000); // Wait 1 second and try again
        return this.acquire(tokens);
      }
      this.tokenWindow.set(now, tokens);
    }

    // Record request
    this.minuteWindow.push(now);
    this.dayWindow.push(now);
  }

  release(): void {
    // Cleanup if needed
  }

  private cleanWindows(now: number) {
    const minuteAgo = now - 60000;
    const dayAgo = now - 86400000;
    
    this.minuteWindow = this.minuteWindow.filter(t => t > minuteAgo);
    this.dayWindow = this.dayWindow.filter(t => t > dayAgo);
    
    // Clean token window
    for (const [timestamp] of this.tokenWindow) {
      if (timestamp < minuteAgo) {
        this.tokenWindow.delete(timestamp);
      }
    }
  }

  private getCurrentTokensPerMinute(now: number): number {
    const minuteAgo = now - 60000;
    let total = 0;
    
    for (const [timestamp, tokens] of this.tokenWindow) {
      if (timestamp > minuteAgo) {
        total += tokens;
      }
    }
    
    return total;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 5.2 Token Counter

```typescript
// src/lib/ai/token-counter.ts
import { encode } from '@dqbd/tiktoken';

export class TokenCounter {
  private encoders: Map<string, any> = new Map();

  countTokens(messages: ChatMessage[], model: string): number {
    const encoder = this.getEncoder(model);
    let totalTokens = 0;

    for (const message of messages) {
      // Count message tokens
      totalTokens += 4; // Every message follows <im_start>{role/name}\n{content}<im_end>\n
      totalTokens += encoder(message.role).length;
      totalTokens += encoder(message.content).length;
      
      if (message.name) {
        totalTokens += encoder(message.name).length;
        totalTokens -= 1; // Role is always there, so subtract 1 if name is present
      }
    }
    
    totalTokens += 2; // Every reply is primed with <im_start>assistant

    return totalTokens;
  }

  countChunk(chunk: StreamChunk): number {
    if (!chunk.choices[0]?.delta?.content) return 0;
    const encoder = this.getEncoder('gpt-4'); // Default encoder
    return encoder(chunk.choices[0].delta.content).length;
  }

  private getEncoder(model: string) {
    // Use appropriate encoder based on model
    // This is simplified - in reality you'd use different encoders for different models
    if (!this.encoders.has(model)) {
      this.encoders.set(model, (text: string) => encode(text));
    }
    return this.encoders.get(model);
  }
}
```

### 5.3 Cache Manager

```typescript
// src/lib/ai/cache-manager.ts
import crypto from 'crypto';

export class CacheManager {
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private readonly TTL = 60 * 60 * 1000; // 1 hour

  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  async set(key: string, data: any, ttl: number = this.TTL): Promise<void> {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });
    
    // Clean old entries periodically
    if (this.cache.size > 1000) {
      this.cleanup();
    }
  }

  getCacheKey(params: ChatCompletionParams): string {
    const keyData = {
      model: params.model,
      messages: params.messages,
      temperature: params.temperature,
      maxTokens: params.maxTokens,
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex');
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
}
```

### 5.4 MCP Manager

```typescript
// src/lib/ai/mcp-manager.ts
export interface MCPServer {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  endpoint: string;
  apiKey?: string;
  context?: string;
  capabilities: string[];
}

export class MCPManager {
  private servers: Map<string, MCPServer> = new Map();

  async addServer(server: MCPServer): Promise<void> {
    // Validate server connection
    await this.validateServer(server);
    this.servers.set(server.id, server);
  }

  async removeServer(id: string): Promise<void> {
    this.servers.delete(id);
  }

  async getEnabledServers(): Promise<MCPServer[]> {
    const enabled = Array.from(this.servers.values()).filter(s => s.enabled);
    
    // Fetch latest context from each server
    await Promise.all(enabled.map(async server => {
      server.context = await this.fetchServerContext(server);
    }));
    
    return enabled;
  }

  private async validateServer(server: MCPServer): Promise<void> {
    try {
      const response = await fetch(`${server.endpoint}/validate`, {
        method: 'POST',
        headers: {
          'Authorization': server.apiKey ? `Bearer ${server.apiKey}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ capabilities: server.capabilities }),
      });

      if (!response.ok) {
        throw new Error(`MCP server validation failed: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Failed to connect to MCP server ${server.name}: ${error}`);
    }
  }

  private async fetchServerContext(server: MCPServer): Promise<string> {
    try {
      const response = await fetch(`${server.endpoint}/context`, {
        method: 'GET',
        headers: {
          'Authorization': server.apiKey ? `Bearer ${server.apiKey}` : '',
        },
      });

      if (!response.ok) {
        return '';
      }

      const data = await response.json();
      return data.context || '';
    } catch (error) {
      console.error(`Failed to fetch context from ${server.name}:`, error);
      return '';
    }
  }

  async injectIntoMessages(messages: ChatMessage[], servers: MCPServer[]): Promise<ChatMessage[]> {
    if (servers.length === 0) return messages;

    const contextMessage: ChatMessage = {
      role: 'system',
      content: this.buildMCPContext(servers),
    };

    // Insert MCP context as the first system message
    const systemIndex = messages.findIndex(m => m.role === 'system');
    if (systemIndex >= 0) {
      // Merge with existing system message
      messages[systemIndex].content = `${contextMessage.content}\n\n${messages[systemIndex].content}`;
      return messages;
    } else {
      // Add as new system message
      return [contextMessage, ...messages];
    }
  }

  private buildMCPContext(servers: MCPServer[]): string {
    const contexts = servers
      .filter(s => s.enabled && s.context)
      .map(s => `[${s.name}]\n${s.context}`)
      .join('\n\n---\n\n');

    return `Available MCP Server Context:\n\n${contexts}`;
  }
}
```

### 5.5 Telemetry Manager

```typescript
// src/lib/ai/telemetry-manager.ts
export interface TelemetryData {
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  latency: number;
  cost?: number;
  streaming?: boolean;
  cached?: boolean;
  error?: string;
}

export class TelemetryManager {
  private events: TelemetryData[] = [];
  private readonly MAX_EVENTS = 10000;

  record(data: TelemetryData): void {
    this.events.push({
      ...data,
      timestamp: Date.now(),
    });

    // Maintain size limit
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Send to analytics service
    this.sendToAnalytics(data);
  }

  recordError(error: any): void {
    this.record({
      model: error.model,
      provider: error.provider,
      inputTokens: 0,
      outputTokens: 0,
      latency: 0,
      error: error.errorCode,
    });
  }

  recordCacheHit(model: string): void {
    this.record({
      model,
      provider: 'cache',
      inputTokens: 0,
      outputTokens: 0,
      latency: 0,
      cached: true,
    });
  }

  getStats(timeRange?: { start: number; end: number }) {
    let eventsToAnalyze = this.events;
    
    if (timeRange) {
      eventsToAnalyze = this.events.filter(
        e => e.timestamp >= timeRange.start && e.timestamp <= timeRange.end
      );
    }

    return {
      totalRequests: eventsToAnalyze.length,
      totalTokens: eventsToAnalyze.reduce((sum, e) => sum + e.inputTokens + e.outputTokens, 0),
      totalCost: eventsToAnalyze.reduce((sum, e) => sum + (e.cost || 0), 0),
      avgLatency: eventsToAnalyze.reduce((sum, e) => sum + e.latency, 0) / eventsToAnalyze.length,
      errorRate: eventsToAnalyze.filter(e => e.error).length / eventsToAnalyze.length,
      cacheHitRate: eventsToAnalyze.filter(e => e.cached).length / eventsToAnalyze.length,
      byModel: this.groupByModel(eventsToAnalyze),
      byProvider: this.groupByProvider(eventsToAnalyze),
    };
  }

  private groupByModel(events: TelemetryData[]) {
    const groups: Record<string, any> = {};
    
    for (const event of events) {
      if (!groups[event.model]) {
        groups[event.model] = {
          count: 0,
          tokens: 0,
          cost: 0,
          avgLatency: 0,
        };
      }
      
      groups[event.model].count++;
      groups[event.model].tokens += event.inputTokens + event.outputTokens;
      groups[event.model].cost += event.cost || 0;
      groups[event.model].avgLatency += event.latency;
    }

    // Calculate averages
    for (const model in groups) {
      groups[model].avgLatency /= groups[model].count;
    }

    return groups;
  }

  private groupByProvider(events: TelemetryData[]) {
    const groups: Record<string, any> = {};
    
    for (const event of events) {
      if (!groups[event.provider]) {
        groups[event.provider] = {
          count: 0,
          tokens: 0,
          cost: 0,
          errors: 0,
        };
      }
      
      groups[event.provider].count++;
      groups[event.provider].tokens += event.inputTokens + event.outputTokens;
      groups[event.provider].cost += event.cost || 0;
      if (event.error) groups[event.provider].errors++;
    }

    return groups;
  }

  private sendToAnalytics(data: TelemetryData): void {
    // Send to analytics service (e.g., Mixpanel, Amplitude)
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true') {
      // Implementation depends on analytics provider
    }
  }
}
```

## 6. Security Implementation

### 6.1 API Key Management

```typescript
// src/lib/ai/security/api-key-manager.ts
import crypto from 'crypto';

export class APIKeyManager {
  private encryptionKey: Buffer;
  private algorithm = 'aes-256-gcm';

  constructor() {
    // In production, this should come from a secure key management service
    this.encryptionKey = Buffer.from(
      process.env.ENCRYPTION_KEY || crypto.randomBytes(32)
    );
  }

  encrypt(apiKey: string): { encrypted: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  decrypt(encryptedData: { encrypted: string; iv: string; authTag: string }): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  rotateKey(oldKey: string): string {
    // Generate new API key
    const newKey = crypto.randomBytes(32).toString('hex');
    
    // Schedule old key deprecation
    this.scheduleKeyDeprecation(oldKey);
    
    return newKey;
  }

  private scheduleKeyDeprecation(key: string): void {
    // In production, this would mark the key for deletion after a grace period
    setTimeout(() => {
      console.log(`Deprecated API key: ${key.substring(0, 8)}...`);
    }, 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  validateKeyFormat(key: string, provider: string): boolean {
    const patterns: Record<string, RegExp> = {
      openai: /^sk-[a-zA-Z0-9]{48}$/,
      anthropic: /^sk-ant-[a-zA-Z0-9]{40,}$/,
      gemini: /^[a-zA-Z0-9_-]{39}$/,
      xai: /^xai-[a-zA-Z0-9]{32,}$/,
      deepseek: /^sk-[a-zA-Z0-9]{32,}$/,
    };

    return patterns[provider]?.test(key) || false;
  }
}
```

### 6.2 Request Sanitization

```typescript
// src/lib/ai/security/sanitizer.ts
export class RequestSanitizer {
  sanitizeMessages(messages: ChatMessage[]): ChatMessage[] {
    return messages.map(msg => ({
      ...msg,
      content: this.sanitizeContent(msg.content),
    }));
  }

  private sanitizeContent(content: string): string {
    // Remove potential injection attacks
    let sanitized = content;
    
    // Remove system prompts that try to override behavior
    sanitized = sanitized.replace(/ignore previous instructions/gi, '');
    sanitized = sanitized.replace(/disregard all prior/gi, '');
    
    // Remove potential data exfiltration attempts
    sanitized = sanitized.replace(/\b(?:api[_-]?key|password|secret|token)\b[:\s]*[^\s]+/gi, '[REDACTED]');
    
    // Limit length to prevent resource exhaustion
    if (sanitized.length > 100000) {
      sanitized = sanitized.substring(0, 100000) + '... [truncated]';
    }
    
    return sanitized;
  }

  validateRequest(params: ChatCompletionParams): void {
    // Validate temperature
    if (params.temperature !== undefined) {
      if (params.temperature < 0 || params.temperature > 2) {
        throw new Error('Temperature must be between 0 and 2');
      }
    }

    // Validate max tokens
    if (params.maxTokens !== undefined) {
      if (params.maxTokens < 1 || params.maxTokens > 128000) {
        throw new Error('Max tokens must be between 1 and 128000');
      }
    }

    // Validate messages
    if (!params.messages || params.messages.length === 0) {
      throw new Error('Messages array cannot be empty');
    }

    if (params.messages.length > 100) {
      throw new Error('Too many messages in conversation');
    }
  }
}
```

## 7. Usage Example

```typescript
// src/app/api/chat/route.ts
import { AIManager } from '@/lib/ai/ai-manager';
import { RequestSanitizer } from '@/lib/ai/security/sanitizer';

const aiManager = new AIManager();
const sanitizer = new RequestSanitizer();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Sanitize and validate input
    const sanitizedMessages = sanitizer.sanitizeMessages(body.messages);
    const params: ChatCompletionParams = {
      model: body.model || 'gpt-4-turbo-preview',
      messages: sanitizedMessages,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      stream: body.stream || false,
    };
    
    sanitizer.validateRequest(params);

    if (params.stream) {
      // Return streaming response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of aiManager.streamChat(params)) {
              const data = `data: ${JSON.stringify(chunk)}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Return regular response
      const response = await aiManager.chat(params);
      return Response.json(response);
    }
  } catch (error: any) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}
```

## 8. Performance Optimization

### 8.1 Request Batching

```typescript
// src/lib/ai/optimization/batch-processor.ts
export class BatchProcessor {
  private queue: Map<string, ChatCompletionParams[]> = new Map();
  private processing = false;
  private batchSize = 5;
  private batchDelay = 100; // ms

  async add(params: ChatCompletionParams): Promise<ChatMessage> {
    return new Promise((resolve, reject) => {
      const provider = this.getProvider(params.model);
      
      if (!this.queue.has(provider)) {
        this.queue.set(provider, []);
      }
      
      this.queue.get(provider)!.push({
        ...params,
        callback: { resolve, reject },
      });
      
      this.processBatch();
    });
  }

  private async processBatch() {
    if (this.processing) return;
    this.processing = true;
    
    await new Promise(resolve => setTimeout(resolve, this.batchDelay));
    
    for (const [provider, batch] of this.queue) {
      if (batch.length >= this.batchSize) {
        const processing = batch.splice(0, this.batchSize);
        await this.processBatchForProvider(provider, processing);
      }
    }
    
    this.processing = false;
  }

  private async processBatchForProvider(provider: string, batch: any[]) {
    try {
      // Process batch in parallel
      const promises = batch.map(item => 
        this.processItem(item).then(result => 
          item.callback.resolve(result)
        ).catch(error => 
          item.callback.reject(error)
        )
      );
      
      await Promise.all(promises);
    } catch (error) {
      batch.forEach(item => item.callback.reject(error));
    }
  }

  private async processItem(params: ChatCompletionParams): Promise<ChatMessage> {
    // Process individual item
    // This would use the AIManager
    return {} as ChatMessage;
  }

  private getProvider(model: string): string {
    // Extract provider from model name
    if (model.startsWith('gpt') || model.startsWith('o')) return 'openai';
    if (model.startsWith('claude')) return 'anthropic';
    if (model.startsWith('gemini')) return 'gemini';
    if (model.startsWith('grok')) return 'xai';
    if (model.startsWith('deepseek')) return 'deepseek';
    return 'unknown';
  }
}
```

### 8.2 Response Caching Strategy

```typescript
// src/lib/ai/optimization/cache-strategy.ts
export class CacheStrategy {
  private semanticCache: Map<string, any> = new Map();
  private exactCache: Map<string, any> = new Map();

  async getCached(params: ChatCompletionParams): Promise<ChatMessage | null> {
    // Try exact match first
    const exactKey = this.getExactKey(params);
    if (this.exactCache.has(exactKey)) {
      return this.exactCache.get(exactKey);
    }

    // Try semantic similarity
    const semanticKey = await this.getSemanticKey(params);
    if (this.semanticCache.has(semanticKey)) {
      return this.semanticCache.get(semanticKey);
    }

    return null;
  }

  async cache(params: ChatCompletionParams, response: ChatMessage): Promise<void> {
    const exactKey = this.getExactKey(params);
    this.exactCache.set(exactKey, response);

    const semanticKey = await this.getSemanticKey(params);
    this.semanticCache.set(semanticKey, response);

    // Implement cache eviction
    if (this.exactCache.size > 1000) {
      const firstKey = this.exactCache.keys().next().value;
      this.exactCache.delete(firstKey);
    }
  }

  private getExactKey(params: ChatCompletionParams): string {
    return JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature,
    });
  }

  private async getSemanticKey(params: ChatCompletionParams): Promise<string> {
    // Generate embedding for the conversation
    // This would use an embedding model
    return 'semantic_key_placeholder';
  }
}
```

This comprehensive architecture provides:

1. **Unified Interface**: Single API for all providers with consistent request/response formats
2. **Streaming Support**: Real-time streaming for all providers with standardized chunk format  
3. **MCP Integration**: Automatic injection of MCP server context into OpenAI requests
4. **Robust Error Handling**: Provider-specific error handling with retry logic
5. **Security**: Encrypted API key storage, input sanitization, and request validation
6. **Performance**: Request batching, response caching, and rate limiting
7. **Observability**: Comprehensive telemetry and analytics
8. **Token Management**: Accurate token counting and context window validation
9. **Cost Tracking**: Per-request cost calculation and aggregation

The architecture is designed to be extensible, allowing easy addition of new providers while maintaining consistency and reliability across all integrations.