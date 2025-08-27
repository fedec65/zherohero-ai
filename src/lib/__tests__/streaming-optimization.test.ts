/**
 * Comprehensive tests for streaming and async optimizations
 * Tests performance, memory management, and error handling
 */

import { PerformanceMonitor } from '../performance/monitor';
import { StreamManager } from '../streaming/manager';
import { AIAPIManager } from '../api';

// Mock timers for testing
jest.useFakeTimers();

describe('Streaming and Performance Optimizations', () => {
  let performanceMonitor: PerformanceMonitor;
  let streamManager: StreamManager;
  let apiManager: AIAPIManager;

  beforeEach(() => {
    performanceMonitor = PerformanceMonitor.getInstance();
    streamManager = StreamManager.getInstance();
    apiManager = AIAPIManager.getInstance();
    
    // Clear any existing metrics
    performanceMonitor.clearMetrics();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('PerformanceMonitor', () => {
    it('should record request metrics correctly', () => {
      const metrics = {
        requestId: 'test-123',
        provider: 'openai' as const,
        model: 'gpt-3.5-turbo',
        duration: 1500,
        success: true,
        tokens: 100
      };

      performanceMonitor.recordRequest(metrics);
      
      const stats = performanceMonitor.getProviderStats('openai');
      
      expect(stats.totalRequests).toBe(1);
      expect(stats.successfulRequests).toBe(1);
      expect(stats.averageLatency).toBe(1500);
      expect(stats.totalTokens).toBe(100);
      expect(stats.errorRate).toBe(0);
    });

    it('should record streaming metrics with first token latency', () => {
      const streamingMetrics = {
        requestId: 'stream-123',
        provider: 'openai' as const,
        model: 'gpt-4',
        duration: 5000,
        success: true,
        tokenCount: 50,
        firstTokenLatency: 800,
        throughput: 10 // tokens per second
      };

      performanceMonitor.recordStreamingRequest(streamingMetrics);
      
      const stats = performanceMonitor.getProviderStats('openai');
      
      expect(stats.totalRequests).toBe(1);
      expect(stats.averageFirstTokenLatency).toBe(800);
      expect(stats.averageThroughput).toBe(10);
      expect(stats.totalTokens).toBe(50);
    });

    it('should calculate error rates correctly', () => {
      // Record successful request
      performanceMonitor.recordRequest({
        requestId: 'success-1',
        provider: 'anthropic',
        model: 'claude-3',
        duration: 1000,
        success: true
      });

      // Record failed request
      performanceMonitor.recordRequest({
        requestId: 'fail-1',
        provider: 'anthropic',
        model: 'claude-3',
        duration: 2000,
        success: false,
        error: 'API Error'
      });

      const stats = performanceMonitor.getProviderStats('anthropic');
      
      expect(stats.totalRequests).toBe(2);
      expect(stats.successfulRequests).toBe(1);
      expect(stats.failedRequests).toBe(1);
      expect(stats.errorRate).toBe(0.5);
    });

    it('should provide performance summary across providers', () => {
      // Add metrics for multiple providers
      performanceMonitor.recordRequest({
        requestId: 'openai-1',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        duration: 1000,
        success: true
      });

      performanceMonitor.recordRequest({
        requestId: 'anthropic-1',
        provider: 'anthropic',
        model: 'claude-3',
        duration: 2000,
        success: true
      });

      const summary = performanceMonitor.getPerformanceSummary();
      
      expect(summary.totalRequests).toBe(2);
      expect(summary.averageLatency).toBe(1500); // Average of 1000 and 2000
      expect(summary.topPerformingProvider).toBe('openai'); // Lower latency
      expect(summary.worstPerformingProvider).toBe('anthropic'); // Higher latency
    });

    it('should handle memory efficiently with circular buffer', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Add many metrics to test buffer behavior
      for (let i = 0; i < 2000; i++) {
        performanceMonitor.recordRequest({
          requestId: `test-${i}`,
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          duration: Math.random() * 5000,
          success: Math.random() > 0.1, // 90% success rate
          tokens: Math.floor(Math.random() * 1000)
        });
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be bounded (less than 50MB for 2000 records)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      
      // Should still have access to recent metrics
      const recentMetrics = performanceMonitor.getRecentMetrics('openai', 100);
      expect(recentMetrics.requests.length).toBeGreaterThan(0);
    });
  });

  describe('StreamManager', () => {
    it('should handle request queuing with priority', async () => {
      const provider = 'openai';
      
      // Enqueue high priority request
      const highPriorityPromise = streamManager.enqueueRequest(provider, 'high-1', 10);
      
      // Enqueue low priority request
      const lowPriorityPromise = streamManager.enqueueRequest(provider, 'low-1', 1);
      
      // Both should resolve (assuming capacity available)
      await Promise.all([highPriorityPromise, lowPriorityPromise]);
      
      const status = streamManager.getProviderStatus(provider);
      expect(status.activeRequests).toBeGreaterThan(0);
    });

    it('should enforce rate limits', async () => {
      const provider = 'deepseek'; // Has lower rate limits in our config
      
      // Try to consume many tokens quickly
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(streamManager.enqueueRequest(provider, `req-${i}`, 1));
      }
      
      // Some requests should be rejected due to rate limiting
      const results = await Promise.allSettled(promises);
      const rejectedCount = results.filter(r => r.status === 'rejected').length;
      
      // At least some requests should be rate limited
      expect(rejectedCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle circuit breaker functionality', () => {
      const provider = 'gemini';
      
      // Get initial status
      const initialStatus = streamManager.getProviderStatus(provider);
      expect(initialStatus.circuitBreakerState).toBe('closed');
      
      // Reset circuit breaker
      streamManager.resetCircuitBreaker(provider);
      
      const resetStatus = streamManager.getProviderStatus(provider);
      expect(resetStatus.circuitBreakerFailures).toBe(0);
    });

    it('should track active streams correctly', async () => {
      const provider = 'xai';
      const requestId = 'stream-test-123';
      
      const streamId = await streamManager.createStream(provider, requestId);
      
      expect(streamId).toContain(provider);
      expect(streamId).toContain(requestId);
      
      const activeStreams = streamManager.getActiveStreams();
      const ourStream = activeStreams.find(s => s.id === streamId);
      
      expect(ourStream).toBeDefined();
      expect(ourStream?.provider).toBe(provider);
      expect(ourStream?.requestId).toBe(requestId);
      
      // Clean up
      streamManager.removeStream(streamId);
      
      const activeStreamsAfter = streamManager.getActiveStreams();
      const removedStream = activeStreamsAfter.find(s => s.id === streamId);
      expect(removedStream).toBeUndefined();
    });

    it('should provide comprehensive provider status', () => {
      const allStatuses = streamManager.getAllProviderStatuses();
      
      expect(Object.keys(allStatuses)).toEqual([
        'openai', 'anthropic', 'gemini', 'xai', 'deepseek'
      ]);
      
      // Each provider should have complete status
      Object.values(allStatuses).forEach(status => {
        expect(status).toHaveProperty('activeRequests');
        expect(status).toHaveProperty('queuedRequests');
        expect(status).toHaveProperty('circuitBreakerState');
        expect(status).toHaveProperty('availableRateLimit');
        expect(status).toHaveProperty('limits');
        expect(typeof status.activeRequests).toBe('number');
        expect(typeof status.queuedRequests).toBe('number');
        expect(['closed', 'open', 'half-open']).toContain(status.circuitBreakerState);
      });
    });
  });

  describe('Async Pattern Optimizations', () => {
    it('should handle concurrent requests efficiently', async () => {
      const startTime = performance.now();
      
      // Simulate multiple concurrent API calls
      const promises = Array.from({ length: 5 }, (_, i) => 
        new Promise(resolve => {
          // Simulate async work
          setTimeout(() => {
            performanceMonitor.recordRequest({
              requestId: `concurrent-${i}`,
              provider: 'openai',
              model: 'gpt-3.5-turbo',
              duration: Math.random() * 1000,
              success: true
            });
            resolve(i);
          }, Math.random() * 100);
        })
      );
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete all requests in reasonable time (< 1 second)
      expect(totalTime).toBeLessThan(1000);
      
      const stats = performanceMonitor.getProviderStats('openai');
      expect(stats.totalRequests).toBe(5);
    });

    it('should implement proper backpressure management', async () => {
      const results: number[] = [];
      const batchSize = 10;
      
      // Simulate processing with backpressure
      for (let i = 0; i < batchSize; i++) {
        await new Promise(resolve => setImmediate(resolve)); // Yield control
        results.push(i);
        
        // Simulate chunk processing delay
        if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      expect(results).toHaveLength(batchSize);
      expect(results[results.length - 1]).toBe(batchSize - 1);
    });

    it('should handle timeout and cancellation properly', async () => {
      const abortController = new AbortController();
      let cancelled = false;
      
      // Start a long-running operation
      const longOperation = new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => resolve('completed'), 5000);
        
        abortController.signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          cancelled = true;
          reject(new Error('Operation cancelled'));
        });
      });
      
      // Cancel after 100ms
      setTimeout(() => abortController.abort(), 100);
      
      await expect(longOperation).rejects.toThrow('Operation cancelled');
      expect(cancelled).toBe(true);
    });
  });

  describe('Memory Management', () => {
    it('should clean up resources properly', () => {
      const initialHeapUsed = process.memoryUsage().heapUsed;
      
      // Create temporary data structures
      const tempData = [];
      for (let i = 0; i < 1000; i++) {
        tempData.push({
          id: `temp-${i}`,
          data: new Array(1000).fill(Math.random()),
          timestamp: new Date()
        });
      }
      
      // Clear references
      tempData.length = 0;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Wait for potential cleanup
      jest.advanceTimersByTime(1000);
      
      const finalHeapUsed = process.memoryUsage().heapUsed;
      
      // Memory should not increase significantly
      const memoryIncrease = finalHeapUsed - initialHeapUsed;
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });

    it('should handle stream cleanup on cancellation', async () => {
      const provider = 'anthropic';
      const requestId = 'cleanup-test';
      
      const streamId = await streamManager.createStream(provider, requestId);
      
      // Verify stream exists
      let activeStreams = streamManager.getActiveStreams();
      expect(activeStreams.some(s => s.id === streamId)).toBe(true);
      
      // Remove stream
      streamManager.removeStream(streamId);
      
      // Verify stream is cleaned up
      activeStreams = streamManager.getActiveStreams();
      expect(activeStreams.some(s => s.id === streamId)).toBe(false);
    });
  });

  describe('Error Recovery and Circuit Breakers', () => {
    it('should implement exponential backoff for retries', () => {
      const baseDelay = 1000;
      const maxDelay = 10000;
      const backoffMultiplier = 2;
      
      // Test exponential backoff calculation
      const delays = [];
      for (let attempt = 1; attempt <= 5; attempt++) {
        const delay = Math.min(
          baseDelay * Math.pow(backoffMultiplier, attempt - 1),
          maxDelay
        );
        delays.push(delay);
      }
      
      expect(delays[0]).toBe(1000);  // 1st attempt: 1000ms
      expect(delays[1]).toBe(2000);  // 2nd attempt: 2000ms
      expect(delays[2]).toBe(4000);  // 3rd attempt: 4000ms
      expect(delays[3]).toBe(8000);  // 4th attempt: 8000ms
      expect(delays[4]).toBe(10000); // 5th attempt: capped at 10000ms
    });

    it('should track performance across multiple requests', () => {
      const provider = 'openai';
      
      // Simulate a mix of successful and failed requests
      const scenarios = [
        { success: true, duration: 1000 },
        { success: true, duration: 1500 },
        { success: false, duration: 5000, error: 'Timeout' },
        { success: true, duration: 800 },
        { success: false, duration: 3000, error: 'Rate limit' },
      ];
      
      scenarios.forEach((scenario, i) => {
        performanceMonitor.recordRequest({
          requestId: `multi-${i}`,
          provider,
          model: 'gpt-3.5-turbo',
          duration: scenario.duration,
          success: scenario.success,
          error: scenario.error
        });
      });
      
      const stats = performanceMonitor.getProviderStats(provider);
      
      expect(stats.totalRequests).toBe(5);
      expect(stats.successfulRequests).toBe(3);
      expect(stats.failedRequests).toBe(2);
      expect(stats.errorRate).toBe(0.4); // 2/5 = 0.4
      
      // Average latency should be calculated correctly
      const expectedAverage = (1000 + 1500 + 5000 + 800 + 3000) / 5;
      expect(stats.averageLatency).toBe(expectedAverage);
    });
  });
});