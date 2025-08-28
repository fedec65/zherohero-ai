/**
 * Next.js API Route - AI Chat Completions
 * Handles secure server-side AI provider communication with optimized streaming
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiAPI, initializeAllProviders } from '../../../../lib/api';
import { AIProvider } from '../../../../../lib/stores/types';
import { PerformanceMonitor } from '../../../../lib/performance/monitor';
import { StreamManager } from '../../../../lib/streaming/manager';

// Initialize providers on server startup
const { initialized } = initializeAllProviders();
console.log(`Initialized AI providers: ${initialized.join(', ')}`);

// Performance monitoring
const performanceMonitor = PerformanceMonitor.getInstance();
const streamManager = StreamManager.getInstance();

// Request types
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

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();
  
  try {
    // Handle request cancellation
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 120000); // 2 minute timeout
    
    // Parse request body with timeout
    const body: ChatRequest = await Promise.race([
      request.json(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request body parsing timeout')), 5000)
      )
    ]) as ChatRequest;
    
    // Extract API keys from request headers (sent securely from client)
    const apiKeys = extractApiKeysFromHeaders(request.headers);
    
    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      performanceMonitor.recordRequest({
        requestId,
        provider: body.provider || 'openai',
        model: body.model || 'unknown',
        duration: performance.now() - startTime,
        success: false,
        error: validation.error
      });
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Initialize provider with API key from request if provided
    const providerApiKey = apiKeys[body.provider];
    if (providerApiKey) {
      // Initialize/update provider with the API key for this request
      try {
        aiAPI.initializeProvider(body.provider, { apiKey: providerApiKey });
      } catch (error) {
        // If already initialized, update the config
        aiAPI.updateProviderConfig(body.provider, { apiKey: providerApiKey });
      }
    }
    
    // Check provider status with circuit breaker
    const providerStatus = aiAPI.getProviderStatus(body.provider);
    if (!providerStatus.initialized || !providerStatus.hasApiKey) {
      performanceMonitor.recordRequest({
        requestId,
        provider: body.provider,
        model: body.model,
        duration: performance.now() - startTime,
        success: false,
        error: 'Provider not configured or missing API key'
      });
      return NextResponse.json(
        { error: `Provider ${body.provider} is not properly configured. Please check your API key in Settings.` },
        { status: 503 }
      );
    }

    // Prepare parameters
    const params = {
      model: body.model,
      messages: body.messages,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      topP: body.topP,
      topK: body.topK,
      frequencyPenalty: body.frequencyPenalty,
      presencePenalty: body.presencePenalty,
      systemPrompt: body.systemPrompt,
      stopSequences: body.stopSequences,
      stream: body.stream || false
    };

    // Handle streaming vs non-streaming requests
    let response: NextResponse;
    if (body.stream) {
      response = await handleStreamingRequest(body.provider, params, { requestId, abortController, timeoutId });
    } else {
      response = await handleNonStreamingRequest(body.provider, params, { requestId, startTime });
    }
    
    clearTimeout(timeoutId);
    return response;

  } catch (error) {
    console.error('AI API Error:', error);
    
    performanceMonitor.recordRequest({
      requestId,
      provider: 'openai',
      model: 'unknown',
      duration: performance.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        requestId
      },
      { status: 500 }
    );
  }
}

// Handle non-streaming requests with performance optimization
async function handleNonStreamingRequest(
  provider: AIProvider, 
  params: any, 
  context: { requestId: string; startTime: number }
) {
  const { requestId, startTime } = context;
  
  try {
    // Add request to queue for rate limiting
    await streamManager.enqueueRequest(provider, requestId);
    
    const response = await aiAPI.createChatCompletion(provider, params);
    
    // Record successful request
    performanceMonitor.recordRequest({
      requestId,
      provider,
      model: params.model,
      duration: performance.now() - startTime,
      success: true,
      tokens: response.usage.totalTokens
    });
    
    return NextResponse.json({
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      choices: response.choices,
      usage: response.usage,
      metadata: {
        requestId,
        latency: performance.now() - startTime,
        provider
      }
    });

  } catch (error) {
    const status = (error as any)?.status || 500;
    const message = error instanceof Error ? error.message : 'AI provider error';
    
    // Record failed request
    performanceMonitor.recordRequest({
      requestId,
      provider,
      model: params.model,
      duration: performance.now() - startTime,
      success: false,
      error: message
    });
    
    return NextResponse.json(
      { error: message, requestId },
      { status }
    );
  } finally {
    // Remove from queue
    streamManager.dequeueRequest(provider, requestId);
  }
}

// Handle streaming requests with optimized backpressure and memory management
async function handleStreamingRequest(
  provider: AIProvider, 
  params: any,
  context: { requestId: string; abortController: AbortController; timeoutId: NodeJS.Timeout }
) {
  const { requestId, abortController, timeoutId } = context;
  const encoder = new TextEncoder();
  const startTime = performance.now();
  let tokenCount = 0;
  let firstTokenTime: number | null = null;
  
  try {
    // Add request to streaming manager
    const streamId = await streamManager.createStream(provider, requestId);
    
    const stream = new ReadableStream({
      async start(controller) {
        const cleanup = () => {
          clearTimeout(timeoutId);
          streamManager.removeStream(streamId);
        };
        
        try {
          // Set up abort handling
          abortController.signal.addEventListener('abort', () => {
            controller.error(new Error('Request aborted'));
            cleanup();
          });
          
          let buffer = '';
          const maxBufferSize = 64 * 1024; // 64KB buffer
          
          for await (const chunk of aiAPI.streamChatCompletion(provider, params)) {
            // Check if request was aborted
            if (abortController.signal.aborted) {
              break;
            }
            
            // Record first token time
            if (firstTokenTime === null && chunk.choices?.[0]?.delta?.content) {
              firstTokenTime = performance.now();
            }
            
            tokenCount++;
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            buffer += data;
            
            // Implement backpressure management
            if (buffer.length >= maxBufferSize) {
              const encoded = encoder.encode(buffer);
              controller.enqueue(encoded);
              buffer = '';
              
              // Allow event loop to process other tasks
              await new Promise(resolve => setImmediate(resolve));
            }
          }
          
          // Flush remaining buffer
          if (buffer.length > 0) {
            controller.enqueue(encoder.encode(buffer));
          }
          
          // Send completion signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          
          // Record successful streaming request
          performanceMonitor.recordStreamingRequest({
            requestId,
            provider,
            model: params.model,
            duration: performance.now() - startTime,
            firstTokenLatency: firstTokenTime ? firstTokenTime - startTime : null,
            tokenCount,
            success: true
          });
          
          controller.close();
          cleanup();
          
        } catch (error) {
          console.error('Streaming error:', error);
          
          const errorData = {
            error: {
              message: error instanceof Error ? error.message : 'Streaming error',
              type: 'stream_error',
              requestId
            }
          };
          
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`)
            );
          } catch (controllerError) {
            console.error('Controller error:', controllerError);
          }
          
          // Record failed streaming request
          performanceMonitor.recordStreamingRequest({
            requestId,
            provider,
            model: params.model,
            duration: performance.now() - startTime,
            firstTokenLatency: firstTokenTime ? firstTokenTime - startTime : null,
            tokenCount,
            success: false,
            error: error instanceof Error ? error.message : 'Streaming error'
          });
          
          controller.close();
          cleanup();
        }
      },
      
      // Handle stream cancellation
      cancel() {
        abortController.abort();
        streamManager.removeStream(streamId);
        
        performanceMonitor.recordStreamingRequest({
          requestId,
          provider,
          model: params.model,
          duration: performance.now() - startTime,
          firstTokenLatency: firstTokenTime ? firstTokenTime - startTime : null,
          tokenCount,
          success: false,
          error: 'Stream cancelled by client'
        });
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'X-Request-ID': requestId,
      },
    });

  } catch (error) {
    const status = (error as any)?.status || 500;
    const message = error instanceof Error ? error.message : 'Streaming error';
    
    performanceMonitor.recordStreamingRequest({
      requestId,
      provider,
      model: params.model,
      duration: performance.now() - startTime,
      firstTokenLatency: null,
      tokenCount: 0,
      success: false,
      error: message
    });
    
    return NextResponse.json(
      { error: message, requestId },
      { status }
    );
  }
}

// Extract API keys from request headers
function extractApiKeysFromHeaders(headers: Headers): Partial<Record<AIProvider, string>> {
  const apiKeys: Partial<Record<AIProvider, string>> = {};
  
  // Extract API keys from secure headers
  const openaiKey = headers.get('x-openai-key');
  const anthropicKey = headers.get('x-anthropic-key');
  const geminiKey = headers.get('x-gemini-key');
  const xaiKey = headers.get('x-xai-key');
  const deepseekKey = headers.get('x-deepseek-key');
  
  if (openaiKey) apiKeys.openai = openaiKey;
  if (anthropicKey) apiKeys.anthropic = anthropicKey;
  if (geminiKey) apiKeys.gemini = geminiKey;
  if (xaiKey) apiKeys.xai = xaiKey;
  if (deepseekKey) apiKeys.deepseek = deepseekKey;
  
  return apiKeys;
}

// Request validation
function validateRequest(body: ChatRequest): { valid: boolean; error?: string } {
  if (!body.provider) {
    return { valid: false, error: 'Provider is required' };
  }

  const validProviders: AIProvider[] = ['openai', 'anthropic', 'gemini', 'xai', 'deepseek'];
  if (!validProviders.includes(body.provider)) {
    return { valid: false, error: 'Invalid provider' };
  }

  if (!body.model) {
    return { valid: false, error: 'Model is required' };
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return { valid: false, error: 'Messages array is required and must not be empty' };
  }

  // Validate message structure
  for (const message of body.messages) {
    if (!message.role || !['user', 'assistant', 'system'].includes(message.role)) {
      return { valid: false, error: 'Each message must have a valid role' };
    }
    if (!message.content || typeof message.content !== 'string') {
      return { valid: false, error: 'Each message must have content' };
    }
  }

  // Validate optional parameters
  if (body.temperature !== undefined && (body.temperature < 0 || body.temperature > 2)) {
    return { valid: false, error: 'Temperature must be between 0 and 2' };
  }

  if (body.maxTokens !== undefined && body.maxTokens < 1) {
    return { valid: false, error: 'Max tokens must be at least 1' };
  }

  if (body.topP !== undefined && (body.topP < 0 || body.topP > 1)) {
    return { valid: false, error: 'Top P must be between 0 and 1' };
  }

  return { valid: true };
}

// Health check endpoint
export async function GET() {
  try {
    const statuses = aiAPI.getAllProviderStatuses();
    
    return NextResponse.json({
      status: 'ok',
      providers: statuses,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}