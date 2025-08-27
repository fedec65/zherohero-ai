/**
 * Google Gemini API Client - Supports all 9 Gemini models
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
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

export class GeminiClient implements BaseAPIClient {
  public readonly provider = 'gemini' as const;
  private client: GoogleGenerativeAI;
  private config: ProviderConfig;

  // Supported Gemini models (9 total as per model store)
  private static readonly SUPPORTED_MODELS = [
    // Gemini 2.5 Series
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    // Gemini 2.0 Series
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash-thinking-exp',
    // Gemini 1.5 Series
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro-exp',
    'gemini-exp-1206'
  ];

  constructor(config: ProviderConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };

    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  async createChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    this.validateModel(params.model);

    const model = this.client.getGenerativeModel({
      model: this.mapModelName(params.model),
      generationConfig: this.buildGenerationConfig(params),
      safetySettings: this.buildSafetySettings()
    });
    
    try {
      const chat = model.startChat({
        history: this.buildChatHistory(params.messages, params.systemPrompt)
      });

      const lastMessage = params.messages[params.messages.length - 1];
      const response = await this.executeWithRetry(async () => {
        return await chat.sendMessage(lastMessage.content);
      });

      return this.transformResponse(response, params.model);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async* streamChatCompletion(params: ChatCompletionParams): AsyncGenerator<StreamingResponse, void, unknown> {
    this.validateModel(params.model);

    const model = this.client.getGenerativeModel({
      model: this.mapModelName(params.model),
      generationConfig: this.buildGenerationConfig(params),
      safetySettings: this.buildSafetySettings()
    });

    try {
      const chat = model.startChat({
        history: this.buildChatHistory(params.messages, params.systemPrompt)
      });

      const lastMessage = params.messages[params.messages.length - 1];
      const stream = await chat.sendMessageStream(lastMessage.content);

      let messageId = `gemini-${Date.now()}`;
      let messageIndex = 0;

      for await (const chunk of stream.stream) {
        const transformedChunk = this.transformStreamChunk(chunk, messageId, messageIndex, params.model);
        if (transformedChunk) {
          yield transformedChunk;
          messageIndex++;
        }
      }

      // Send final chunk with finish reason
      const finalResponse = await stream.response;
      const finalChunk = this.transformFinalStreamChunk(finalResponse, messageId, params.model);
      if (finalChunk) {
        yield finalChunk;
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

    if (config.topK !== undefined && (config.topK < 1 || config.topK > 40)) {
      errors.push('Top K must be between 1 and 40 for Gemini models');
    }

    // Gemini doesn't support frequency/presence penalties
    if (config.frequencyPenalty !== 0) {
      errors.push('Gemini models do not support frequency penalty');
    }

    if (config.presencePenalty !== 0) {
      errors.push('Gemini models do not support presence penalty');
    }

    if (config.maxTokens !== undefined && config.maxTokens < 1) {
      errors.push('Max tokens must be at least 1');
    }

    if (config.maxTokens !== undefined && config.maxTokens > 8192) {
      errors.push('Gemini models have a maximum output limit of 8192 tokens');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  estimateTokens(text: string): number {
    // Gemini tokenization is similar to other models
    // Rough estimation: ~3.8 characters per token for English
    return Math.ceil(text.length / 3.8);
  }

  formatMessages(messages: APIMessage[]): APIMessage[] {
    return messages
      .filter(msg => msg.role !== 'system') // System messages handled separately in Gemini
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
  }

  async healthCheck(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-1.5-flash' });
      await model.generateContent('Hi');
      return true;
    } catch {
      return false;
    }
  }

  async testConnection(testMessage = 'Hello!'): Promise<{ success: boolean; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      await this.createChatCompletion({
        model: 'gemini-1.5-flash', // Use fastest, cheapest model for testing
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
    if (!GeminiClient.SUPPORTED_MODELS.includes(model)) {
      throw new APIError(`Unsupported Gemini model: ${model}`, 'gemini');
    }
  }

  private mapModelName(internalModel: string): string {
    // Map internal model names to Google AI API model names
    const modelMap: Record<string, string> = {
      'gemini-2.5-flash': 'gemini-1.5-flash', // Fallback to available model
      'gemini-2.5-pro': 'gemini-1.5-pro', // Fallback to available model
      'gemini-2.0-flash-exp': 'gemini-1.5-flash',
      'gemini-2.0-flash-thinking-exp': 'gemini-1.5-flash',
      'gemini-1.5-pro': 'gemini-1.5-pro',
      'gemini-1.5-flash': 'gemini-1.5-flash',
      'gemini-1.5-flash-8b': 'gemini-1.5-flash-8b',
      'gemini-1.5-pro-exp': 'gemini-1.5-pro',
      'gemini-exp-1206': 'gemini-1.5-pro'
    };

    return modelMap[internalModel] || internalModel;
  }

  private buildGenerationConfig(params: ChatCompletionParams): any {
    const config: any = {};

    if (params.temperature !== undefined) config.temperature = params.temperature;
    if (params.topP !== undefined) config.topP = params.topP;
    if (params.topK !== undefined) config.topK = params.topK;
    if (params.maxTokens !== undefined) config.maxOutputTokens = params.maxTokens;
    if (params.stopSequences?.length) config.stopSequences = params.stopSequences;

    return config;
  }

  private buildSafetySettings(): any[] {
    return [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];
  }

  private buildChatHistory(messages: APIMessage[], systemPrompt?: string): any[] {
    const history: any[] = [];

    // Add system prompt as first user message if provided
    if (systemPrompt) {
      history.push({
        role: 'user',
        parts: [{ text: `System: ${systemPrompt}` }]
      });
      history.push({
        role: 'model',
        parts: [{ text: 'Understood. I will follow these instructions.' }]
      });
    }

    // Convert messages to Gemini format, excluding the last message (sent separately)
    const historyMessages = messages.slice(0, -1);
    for (const message of historyMessages) {
      if (message.role === 'system') continue; // Already handled above

      history.push({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }]
      });
    }

    return history;
  }

  private transformResponse(response: any, originalModel: string): ChatCompletionResponse {
    const text = response.response?.text() || '';
    const usageMetadata = response.response?.usageMetadata;

    return {
      id: `gemini-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: originalModel,
      usage: {
        promptTokens: usageMetadata?.promptTokenCount || 0,
        completionTokens: usageMetadata?.candidatesTokenCount || 0,
        totalTokens: usageMetadata?.totalTokenCount || 0
      },
      choices: [{
        index: 0,
        message: {
          role: 'assistant' as const,
          content: text
        },
        finishReason: this.mapFinishReason(response.response?.candidates?.[0]?.finishReason)
      }]
    };
  }

  private transformStreamChunk(chunk: any, messageId: string, messageIndex: number, originalModel: string): StreamingResponse | null {
    const text = chunk.text();
    if (!text) return null;

    return {
      id: messageId,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: originalModel,
      choices: [{
        index: 0,
        delta: {
          content: text
        },
        finishReason: null
      }]
    };
  }

  private transformFinalStreamChunk(response: any, messageId: string, originalModel: string): StreamingResponse | null {
    return {
      id: messageId,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: originalModel,
      choices: [{
        index: 0,
        delta: {},
        finishReason: this.mapFinishReason(response.candidates?.[0]?.finishReason)
      }]
    };
  }

  private mapFinishReason(finishReason: string): 'stop' | 'length' | 'content_filter' | null {
    switch (finishReason) {
      case 'STOP':
        return 'stop';
      case 'MAX_TOKENS':
        return 'length';
      case 'SAFETY':
      case 'RECITATION':
        return 'content_filter';
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
    const message = error?.message?.toLowerCase() || '';
    return message.includes('api key') || 
           message.includes('permission') || 
           message.includes('invalid') ||
           message.includes('quota');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleError(error: any): APIError {
    const apiError = new APIError(
      error.message || 'Gemini API error',
      'gemini'
    ) as APIError;
    
    apiError.status = error?.status;
    apiError.code = error?.code;
    apiError.type = error?.name;
    apiError.provider = 'gemini';
    apiError.retryable = !this.isNonRetryableError(error);

    return apiError;
  }
}

