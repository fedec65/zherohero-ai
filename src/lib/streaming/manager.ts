/**
 * Stream Manager - Optimized connection pooling and request queuing
 * Handles backpressure and concurrent request management
 */

import { AIProvider } from "../../lib/stores/types";

// Queue and stream management interfaces
interface QueuedRequest {
  id: string;
  provider: AIProvider;
  priority: number; // Higher = more priority
  timestamp: Date;
  resolve: () => void;
  reject: (error: Error) => void;
  timeoutId: NodeJS.Timeout;
}

interface ActiveStream {
  id: string;
  provider: AIProvider;
  requestId: string;
  startTime: Date;
  abortController?: AbortController;
}

interface ProviderLimits {
  maxConcurrentRequests: number;
  maxQueueSize: number;
  requestTimeout: number;
  rateLimit: {
    requests: number;
    window: number; // milliseconds
  };
}

// Default provider limits (conservative estimates)
const DEFAULT_PROVIDER_LIMITS: Record<AIProvider, ProviderLimits> = {
  openai: {
    maxConcurrentRequests: 20,
    maxQueueSize: 100,
    requestTimeout: 120000, // 2 minutes
    rateLimit: { requests: 3500, window: 60000 }, // 3500 per minute
  },
  anthropic: {
    maxConcurrentRequests: 15,
    maxQueueSize: 75,
    requestTimeout: 120000,
    rateLimit: { requests: 2000, window: 60000 }, // 2000 per minute
  },
  gemini: {
    maxConcurrentRequests: 10,
    maxQueueSize: 50,
    requestTimeout: 120000,
    rateLimit: { requests: 1500, window: 60000 }, // 1500 per minute
  },
  xai: {
    maxConcurrentRequests: 10,
    maxQueueSize: 50,
    requestTimeout: 120000,
    rateLimit: { requests: 1000, window: 60000 }, // 1000 per minute
  },
  deepseek: {
    maxConcurrentRequests: 8,
    maxQueueSize: 40,
    requestTimeout: 120000,
    rateLimit: { requests: 800, window: 60000 }, // 800 per minute
  },
  openrouter: {
    maxConcurrentRequests: 12,
    maxQueueSize: 60,
    requestTimeout: 120000,
    rateLimit: { requests: 1200, window: 60000 }, // 1200 per minute
  },
  custom: {
    maxConcurrentRequests: 5,
    maxQueueSize: 25,
    requestTimeout: 120000,
    rateLimit: { requests: 500, window: 60000 }, // 500 per minute - conservative for custom providers
  },
  tavily: {
    maxConcurrentRequests: 10,
    maxQueueSize: 50,
    requestTimeout: 90000,
    rateLimit: { requests: 1000, window: 60000 }, // 1000 per minute for search API
  },
};

// Circuit breaker for handling provider failures
class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: Date | null = null;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(
    private readonly failureThreshold = 5,
    private readonly resetTimeout = 60000, // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (this.shouldAttemptReset()) {
        this.state = "half-open";
      } else {
        throw new Error(
          "Circuit breaker is open - provider temporarily unavailable",
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = "closed";
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = new Date();

    if (this.failures >= this.failureThreshold) {
      this.state = "open";
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    return Date.now() - this.lastFailureTime.getTime() > this.resetTimeout;
  }

  getState(): string {
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }
}

// Rate limiter using token bucket algorithm
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly capacity: number,
    private readonly refillRate: number, // tokens per millisecond
    private readonly refillInterval: number = 1000, // milliseconds
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  tryConsume(tokens = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;

    if (timePassed >= this.refillInterval) {
      const tokensToAdd =
        Math.floor(timePassed / this.refillInterval) *
        (this.refillRate * this.refillInterval);
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }
}

export class StreamManager {
  private static instance: StreamManager;

  // Request queues per provider
  private queues = new Map<AIProvider, QueuedRequest[]>();

  // Active requests and streams tracking
  private activeRequests = new Map<AIProvider, Set<string>>();
  private activeStreams = new Map<string, ActiveStream>();

  // Circuit breakers per provider
  private circuitBreakers = new Map<AIProvider, CircuitBreaker>();

  // Rate limiters per provider
  private rateLimiters = new Map<AIProvider, TokenBucket>();

  // Provider limits
  private limits: Record<AIProvider, ProviderLimits>;

  // Cleanup timer
  private cleanupTimer: NodeJS.Timeout;

  private constructor() {
    this.limits = { ...DEFAULT_PROVIDER_LIMITS };

    // Initialize data structures for all providers
    const providers: AIProvider[] = [
      "openai",
      "anthropic",
      "gemini",
      "xai",
      "deepseek",
    ];

    providers.forEach((provider) => {
      this.queues.set(provider, []);
      this.activeRequests.set(provider, new Set());
      this.circuitBreakers.set(provider, new CircuitBreaker());

      const limits = this.limits[provider];
      this.rateLimiters.set(
        provider,
        new TokenBucket(
          limits.rateLimit.requests,
          limits.rateLimit.requests / limits.rateLimit.window,
        ),
      );
    });

    // Only start timers and event listeners in runtime, not during build
    if (
      typeof window === "undefined" &&
      process.env.NEXT_PHASE !== "phase-production-build"
    ) {
      // Start cleanup timer
      this.cleanupTimer = setInterval(() => {
        this.performCleanup();
      }, 30000); // 30 seconds

      // Cleanup on process exit
      process.on("exit", () => {
        if (this.cleanupTimer) {
          clearInterval(this.cleanupTimer);
        }
      });
    }
  }

  static getInstance(): StreamManager {
    if (!StreamManager.instance) {
      StreamManager.instance = new StreamManager();
    }
    return StreamManager.instance;
  }

  // Enqueue a request with priority handling and rate limiting
  async enqueueRequest(
    provider: AIProvider,
    requestId: string,
    priority = 1,
  ): Promise<void> {
    const circuitBreaker = this.circuitBreakers.get(provider)!;
    const rateLimiter = this.rateLimiters.get(provider)!;
    const activeSet = this.activeRequests.get(provider)!;
    const limits = this.limits[provider];

    return new Promise((resolve, reject) => {
      // Check circuit breaker
      if (circuitBreaker.getState() === "open") {
        reject(new Error(`Provider ${provider} circuit breaker is open`));
        return;
      }

      // Check rate limits
      if (!rateLimiter.tryConsume()) {
        reject(new Error(`Rate limit exceeded for provider ${provider}`));
        return;
      }

      // Check if we can process immediately
      if (activeSet.size < limits.maxConcurrentRequests) {
        activeSet.add(requestId);
        resolve();
        return;
      }

      // Add to queue
      const queue = this.queues.get(provider)!;

      // Check queue size limit
      if (queue.length >= limits.maxQueueSize) {
        reject(new Error(`Queue full for provider ${provider}`));
        return;
      }

      // Create timeout
      const timeoutId = setTimeout(() => {
        this.removeFromQueue(provider, requestId);
        reject(new Error(`Request timeout in queue for provider ${provider}`));
      }, limits.requestTimeout);

      // Add to queue with priority ordering
      const queuedRequest: QueuedRequest = {
        id: requestId,
        provider,
        priority,
        timestamp: new Date(),
        resolve,
        reject,
        timeoutId,
      };

      // Insert with priority (higher priority first, then FIFO)
      const insertIndex = queue.findIndex(
        (req) =>
          req.priority < priority ||
          (req.priority === priority &&
            req.timestamp > queuedRequest.timestamp),
      );

      if (insertIndex === -1) {
        queue.push(queuedRequest);
      } else {
        queue.splice(insertIndex, 0, queuedRequest);
      }
    });
  }

  // Dequeue a request and process next in queue
  dequeueRequest(provider: AIProvider, requestId: string): void {
    const activeSet = this.activeRequests.get(provider)!;
    const queue = this.queues.get(provider)!;
    const limits = this.limits[provider];

    // Remove from active set
    activeSet.delete(requestId);

    // Process next in queue if available
    if (queue.length > 0 && activeSet.size < limits.maxConcurrentRequests) {
      const nextRequest = queue.shift()!;

      // Clear timeout
      clearTimeout(nextRequest.timeoutId);

      // Add to active set
      activeSet.add(nextRequest.id);

      // Resolve the promise
      nextRequest.resolve();
    }
  }

  // Create a new stream tracking entry
  async createStream(provider: AIProvider, requestId: string): Promise<string> {
    const streamId = `${provider}-${requestId}-${Date.now()}`;

    const stream: ActiveStream = {
      id: streamId,
      provider,
      requestId,
      startTime: new Date(),
      abortController: new AbortController(),
    };

    this.activeStreams.set(streamId, stream);
    return streamId;
  }

  // Remove stream tracking
  removeStream(streamId: string): void {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      // Abort if still active
      stream.abortController?.abort();
      this.activeStreams.delete(streamId);
    }
  }

  // Get provider status and metrics
  getProviderStatus(provider: AIProvider): {
    activeRequests: number;
    queuedRequests: number;
    circuitBreakerState: string;
    circuitBreakerFailures: number;
    availableRateLimit: number;
    limits: ProviderLimits;
  } {
    const activeSet = this.activeRequests.get(provider)!;
    const queue = this.queues.get(provider)!;
    const circuitBreaker = this.circuitBreakers.get(provider)!;
    const rateLimiter = this.rateLimiters.get(provider)!;

    return {
      activeRequests: activeSet.size,
      queuedRequests: queue.length,
      circuitBreakerState: circuitBreaker.getState(),
      circuitBreakerFailures: circuitBreaker.getFailures(),
      availableRateLimit: rateLimiter.getAvailableTokens(),
      limits: this.limits[provider],
    };
  }

  // Get all provider statuses
  getAllProviderStatuses(): Record<
    AIProvider,
    ReturnType<typeof this.getProviderStatus>
  > {
    const providers: AIProvider[] = [
      "openai",
      "anthropic",
      "gemini",
      "xai",
      "deepseek",
    ];
    const statuses = {} as Record<
      AIProvider,
      ReturnType<typeof this.getProviderStatus>
    >;

    providers.forEach((provider) => {
      statuses[provider] = this.getProviderStatus(provider);
    });

    return statuses;
  }

  // Get active streams information
  getActiveStreams(): ActiveStream[] {
    return Array.from(this.activeStreams.values());
  }

  // Update provider limits (for runtime configuration)
  updateProviderLimits(
    provider: AIProvider,
    limits: Partial<ProviderLimits>,
  ): void {
    this.limits[provider] = { ...this.limits[provider], ...limits };

    // Update rate limiter if rate limit changed
    if (limits.rateLimit) {
      const newLimits = this.limits[provider];
      this.rateLimiters.set(
        provider,
        new TokenBucket(
          newLimits.rateLimit.requests,
          newLimits.rateLimit.requests / newLimits.rateLimit.window,
        ),
      );
    }
  }

  // Force reset circuit breaker
  resetCircuitBreaker(provider: AIProvider): void {
    this.circuitBreakers.set(provider, new CircuitBreaker());
  }

  // Private helper methods
  private removeFromQueue(provider: AIProvider, requestId: string): void {
    const queue = this.queues.get(provider)!;
    const index = queue.findIndex((req) => req.id === requestId);

    if (index !== -1) {
      const removed = queue.splice(index, 1)[0];
      clearTimeout(removed.timeoutId);
    }
  }

  private performCleanup(): void {
    const now = Date.now();
    const STREAM_TIMEOUT = 300000; // 5 minutes

    // Clean up old streams
    for (const [streamId, stream] of this.activeStreams.entries()) {
      if (now - stream.startTime.getTime() > STREAM_TIMEOUT) {
        console.warn(`Cleaning up old stream: ${streamId}`);
        this.removeStream(streamId);
      }
    }

    // Clean up timed out queued requests
    for (const [provider, queue] of this.queues.entries()) {
      const before = queue.length;
      this.queues.set(
        provider,
        queue.filter((req) => {
          const isExpired =
            now - req.timestamp.getTime() >
            this.limits[provider].requestTimeout;
          if (isExpired) {
            clearTimeout(req.timeoutId);
            req.reject(new Error("Request expired in queue"));
          }
          return !isExpired;
        }),
      );

      if (queue.length !== before) {
        console.log(
          `Cleaned up ${before - queue.length} expired requests for ${provider}`,
        );
      }
    }
  }

  // Cleanup resources
  destroy(): void {
    clearInterval(this.cleanupTimer);

    // Clear all queues and reject pending requests
    for (const [provider, queue] of this.queues.entries()) {
      queue.forEach((req) => {
        clearTimeout(req.timeoutId);
        req.reject(new Error("Stream manager shutting down"));
      });
      queue.length = 0;
    }

    // Abort all active streams
    for (const stream of this.activeStreams.values()) {
      stream.abortController?.abort();
    }

    this.activeStreams.clear();
  }
}

export default StreamManager;
