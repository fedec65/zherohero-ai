/**
 * Custom hook for optimized streaming with performance monitoring
 * Client-side optimizations for better user experience
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { AIProvider } from '../../lib/stores/types';

interface StreamingOptions {
  provider: AIProvider;
  model: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  temperature?: number;
  maxTokens?: number;
  onChunk?: (content: string, isComplete: boolean) => void;
  onError?: (error: string) => void;
  onComplete?: (content: string, metadata: StreamingMetadata) => void;
}

interface StreamingMetadata {
  totalTime: number;
  firstTokenTime: number | null;
  tokenCount: number;
  averageTokenTime: number;
  throughput: number; // tokens per second
}

interface StreamingState {
  isStreaming: boolean;
  content: string;
  error: string | null;
  metadata: StreamingMetadata | null;
}

// Client-side performance optimizations
export function useStreamingOptimization() {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    content: '',
    error: null,
    metadata: null,
  });

  // Refs for performance tracking
  const startTimeRef = useRef<number | null>(null);
  const firstTokenTimeRef = useRef<number | null>(null);
  const tokenCountRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const contentBufferRef = useRef<string>('');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Reset state
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setState({
      isStreaming: false,
      content: '',
      error: null,
      metadata: null,
    });
    
    startTimeRef.current = null;
    firstTokenTimeRef.current = null;
    tokenCountRef.current = 0;
    contentBufferRef.current = '';
  }, []);

  // Optimized streaming with backpressure handling
  const startStreaming = useCallback(async (options: StreamingOptions) => {
    const { 
      provider, 
      model, 
      messages, 
      temperature, 
      maxTokens, 
      onChunk, 
      onError, 
      onComplete 
    } = options;

    reset();
    
    // Create abort controller for cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    setState(prev => ({ ...prev, isStreaming: true }));
    
    startTimeRef.current = performance.now();
    let accumulatedContent = '';
    
    try {
      // Optimized fetch with proper headers for streaming
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          provider,
          model,
          messages,
          temperature,
          maxTokens,
          stream: true,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body available for streaming');
      }

      // Use optimized reader with proper backpressure handling
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      
      // Performance tracking
      let chunkCount = 0;
      const chunkTimes: number[] = [];
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          if (abortController.signal.aborted) break;
          
          // Decode chunk
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              
              if (data === '[DONE]') {
                break;
              }
              
              try {
                const chunk = JSON.parse(data);
                const content = chunk.choices?.[0]?.delta?.content || '';
                
                if (content) {
                  // Record first token time
                  if (firstTokenTimeRef.current === null) {
                    firstTokenTimeRef.current = performance.now();
                  }
                  
                  chunkCount++;
                  chunkTimes.push(performance.now());
                  tokenCountRef.current++;
                  
                  accumulatedContent += content;
                  contentBufferRef.current = accumulatedContent;
                  
                  // Optimized state updates with throttling
                  const now = performance.now();
                  if (now - lastUpdateTimeRef.current > 16) { // ~60 FPS
                    setState(prev => ({ ...prev, content: accumulatedContent }));
                    onChunk?.(accumulatedContent, false);
                    lastUpdateTimeRef.current = now;
                  }
                }
                
                // Check if complete
                const isComplete = chunk.choices?.[0]?.finish_reason !== null;
                if (isComplete) {
                  break;
                }
                
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
            }
          }
        }
        
        // Final update
        const endTime = performance.now();
        const totalTime = startTimeRef.current ? endTime - startTimeRef.current : 0;
        const firstTokenTime = firstTokenTimeRef.current && startTimeRef.current 
          ? firstTokenTimeRef.current - startTimeRef.current 
          : null;
        
        const metadata: StreamingMetadata = {
          totalTime,
          firstTokenTime,
          tokenCount: tokenCountRef.current,
          averageTokenTime: chunkTimes.length > 1 
            ? (chunkTimes[chunkTimes.length - 1] - chunkTimes[0]) / (chunkTimes.length - 1)
            : 0,
          throughput: totalTime > 0 ? (tokenCountRef.current / totalTime) * 1000 : 0,
        };
        
        setState(prev => ({ 
          ...prev, 
          isStreaming: false, 
          content: accumulatedContent,
          metadata 
        }));
        
        onChunk?.(accumulatedContent, true);
        onComplete?.(accumulatedContent, metadata);
        
      } finally {
        reader.releaseLock();
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({ 
        ...prev, 
        isStreaming: false, 
        error: errorMessage 
      }));
      
      onError?.(errorMessage);
      
      // Log performance data even on error
      if (startTimeRef.current) {
        console.warn('Streaming failed with performance data:', {
          totalTime: performance.now() - startTimeRef.current,
          firstTokenTime: firstTokenTimeRef.current ? 
            firstTokenTimeRef.current - startTimeRef.current : null,
          tokenCount: tokenCountRef.current,
          error: errorMessage
        });
      }
    }
  }, [reset]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const endTime = performance.now();
    const totalTime = startTimeRef.current ? endTime - startTimeRef.current : 0;
    const firstTokenTime = firstTokenTimeRef.current && startTimeRef.current 
      ? firstTokenTimeRef.current - startTimeRef.current 
      : null;
    
    const metadata: StreamingMetadata = {
      totalTime,
      firstTokenTime,
      tokenCount: tokenCountRef.current,
      averageTokenTime: 0,
      throughput: totalTime > 0 ? (tokenCountRef.current / totalTime) * 1000 : 0,
    };
    
    setState(prev => ({ 
      ...prev, 
      isStreaming: false,
      content: contentBufferRef.current,
      metadata 
    }));
  }, []);

  // Get performance metrics
  const getPerformanceMetrics = useCallback((): StreamingMetadata | null => {
    if (!startTimeRef.current) return null;
    
    const currentTime = performance.now();
    const totalTime = currentTime - startTimeRef.current;
    const firstTokenTime = firstTokenTimeRef.current 
      ? firstTokenTimeRef.current - startTimeRef.current 
      : null;
    
    return {
      totalTime,
      firstTokenTime,
      tokenCount: tokenCountRef.current,
      averageTokenTime: 0, // Would need more tracking for real-time calculation
      throughput: totalTime > 0 ? (tokenCountRef.current / totalTime) * 1000 : 0,
    };
  }, []);

  return {
    ...state,
    startStreaming,
    stopStreaming,
    reset,
    getPerformanceMetrics,
    
    // Additional utilities
    isConnected: state.isStreaming && !state.error,
    hasStarted: startTimeRef.current !== null,
    currentTokenCount: tokenCountRef.current,
  };
}

// Helper hook for monitoring overall API performance
export function useAPIPerformance() {
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchPerformanceData = useCallback(async (provider?: AIProvider) => {
    setLoading(true);
    try {
      const url = provider 
        ? `/api/ai/performance?metric=provider&provider=${provider}`
        : '/api/ai/performance?metric=summary';
        
      const response = await fetch(url);
      const data = await response.json();
      setPerformanceData(data);
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMetrics = useCallback(async (provider?: AIProvider) => {
    try {
      await fetch('/api/ai/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_metrics', provider }),
      });
      
      // Refresh data
      await fetchPerformanceData(provider);
    } catch (error) {
      console.error('Failed to clear metrics:', error);
    }
  }, [fetchPerformanceData]);

  return {
    performanceData,
    loading,
    fetchPerformanceData,
    clearMetrics,
  };
}

export default useStreamingOptimization;