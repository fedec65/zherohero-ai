/**
 * Performance Monitor - Tracks API performance and streaming metrics
 * Optimized for Node.js/Next.js environment
 */

import { AIProvider } from '../../lib/stores/types'

// Performance metrics interfaces
export interface RequestMetrics {
  requestId: string
  provider: AIProvider
  model: string
  duration: number // milliseconds
  success: boolean
  tokens?: number
  error?: string
  timestamp?: Date
}

export interface StreamingMetrics extends RequestMetrics {
  firstTokenLatency: number | null // Time to first token in ms
  tokenCount: number
  throughput?: number // tokens per second
}

export interface ProviderStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageLatency: number
  averageFirstTokenLatency: number
  totalTokens: number
  averageThroughput: number
  errorRate: number
  lastUpdated: Date
}

// Memory-efficient circular buffer for metrics
class MetricsBuffer<T> {
  private buffer: T[]
  private size: number
  private index: number = 0
  private count: number = 0

  constructor(maxSize: number = 1000) {
    this.size = maxSize
    this.buffer = new Array(maxSize)
  }

  add(item: T): void {
    this.buffer[this.index] = item
    this.index = (this.index + 1) % this.size
    this.count = Math.min(this.count + 1, this.size)
  }

  getAll(): T[] {
    if (this.count < this.size) {
      return this.buffer.slice(0, this.count)
    }

    // Return items in chronological order
    return [
      ...this.buffer.slice(this.index),
      ...this.buffer.slice(0, this.index),
    ]
  }

  clear(): void {
    this.index = 0
    this.count = 0
    this.buffer.fill(undefined as any)
  }

  get length(): number {
    return this.count
  }
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor

  // Separate buffers for different metric types
  private requestMetrics = new Map<AIProvider, MetricsBuffer<RequestMetrics>>()
  private streamingMetrics = new Map<
    AIProvider,
    MetricsBuffer<StreamingMetrics>
  >()

  // Real-time statistics cache
  private statsCache = new Map<AIProvider, ProviderStats>()
  private lastStatsUpdate = new Map<AIProvider, number>()

  // Performance optimization settings
  private readonly STATS_CACHE_TTL = 30000 // 30 seconds
  private readonly MAX_BUFFER_SIZE = 1000
  private readonly CLEANUP_INTERVAL = 300000 // 5 minutes

  private cleanupTimer: NodeJS.Timeout

  private constructor() {
    // Initialize buffers for all providers
    const providers: AIProvider[] = [
      'openai',
      'anthropic',
      'gemini',
      'xai',
      'deepseek',
    ]

    providers.forEach((provider) => {
      this.requestMetrics.set(provider, new MetricsBuffer(this.MAX_BUFFER_SIZE))
      this.streamingMetrics.set(
        provider,
        new MetricsBuffer(this.MAX_BUFFER_SIZE)
      )
    })

    // Only start timers and event listeners in runtime, not during build
    if (
      typeof window === 'undefined' &&
      process.env.NEXT_PHASE !== 'phase-production-build'
    ) {
      // Start cleanup timer
      this.cleanupTimer = setInterval(() => {
        this.performCleanup()
      }, this.CLEANUP_INTERVAL)

      // Cleanup on process exit
      process.on('exit', () => {
        if (this.cleanupTimer) {
          clearInterval(this.cleanupTimer)
        }
      })
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Record standard API request
  recordRequest(metrics: RequestMetrics): void {
    const buffer = this.requestMetrics.get(metrics.provider)
    if (!buffer) {
      console.warn(`No buffer found for provider: ${metrics.provider}`)
      return
    }

    const record: RequestMetrics = {
      ...metrics,
      timestamp: new Date(),
    }

    buffer.add(record)

    // Invalidate stats cache for this provider
    this.invalidateStatsCache(metrics.provider)

    // Log slow requests
    if (metrics.duration > 10000) {
      // > 10 seconds
      console.warn(
        `Slow request detected: ${metrics.requestId} - ${metrics.duration}ms`
      )
    }
  }

  // Record streaming request with additional metrics
  recordStreamingRequest(metrics: StreamingMetrics): void {
    const buffer = this.streamingMetrics.get(metrics.provider)
    if (!buffer) {
      console.warn(
        `No streaming buffer found for provider: ${metrics.provider}`
      )
      return
    }

    // Calculate throughput if available
    const record: StreamingMetrics = {
      ...metrics,
      timestamp: new Date(),
      throughput:
        metrics.tokenCount > 0 && metrics.duration > 0
          ? (metrics.tokenCount / metrics.duration) * 1000 // tokens per second
          : undefined,
    }

    buffer.add(record)

    // Invalidate stats cache
    this.invalidateStatsCache(metrics.provider)

    // Log performance issues
    if (metrics.firstTokenLatency && metrics.firstTokenLatency > 5000) {
      // > 5 seconds
      console.warn(
        `Slow first token: ${metrics.requestId} - ${metrics.firstTokenLatency}ms`
      )
    }
  }

  // Get performance statistics for a provider
  getProviderStats(provider: AIProvider): ProviderStats {
    const now = Date.now()
    const lastUpdate = this.lastStatsUpdate.get(provider) || 0

    // Return cached stats if still valid
    if (now - lastUpdate < this.STATS_CACHE_TTL) {
      const cached = this.statsCache.get(provider)
      if (cached) {
        return cached
      }
    }

    // Calculate fresh stats
    const stats = this.calculateProviderStats(provider)
    this.statsCache.set(provider, stats)
    this.lastStatsUpdate.set(provider, now)

    return stats
  }

  // Get all provider statistics
  getAllProviderStats(): Record<AIProvider, ProviderStats> {
    const providers: AIProvider[] = [
      'openai',
      'anthropic',
      'gemini',
      'xai',
      'deepseek',
    ]
    const allStats = {} as Record<AIProvider, ProviderStats>

    providers.forEach((provider) => {
      allStats[provider] = this.getProviderStats(provider)
    })

    return allStats
  }

  // Get recent metrics for debugging
  getRecentMetrics(
    provider: AIProvider,
    limit = 50
  ): {
    requests: RequestMetrics[]
    streaming: StreamingMetrics[]
  } {
    const requestBuffer = this.requestMetrics.get(provider)
    const streamingBuffer = this.streamingMetrics.get(provider)

    const requests = requestBuffer ? requestBuffer.getAll().slice(-limit) : []
    const streaming = streamingBuffer
      ? streamingBuffer.getAll().slice(-limit)
      : []

    return { requests, streaming }
  }

  // Get performance summary
  getPerformanceSummary(): {
    totalRequests: number
    totalStreamingRequests: number
    averageLatency: number
    averageFirstTokenLatency: number
    topPerformingProvider: AIProvider | null
    worstPerformingProvider: AIProvider | null
  } {
    const allStats = this.getAllProviderStats()
    const providers = Object.keys(allStats) as AIProvider[]

    let totalRequests = 0
    let totalStreamingRequests = 0
    let totalLatency = 0
    let totalFirstTokenLatency = 0
    let latencyCount = 0
    let firstTokenCount = 0

    let topProvider: AIProvider | null = null
    let worstProvider: AIProvider | null = null
    let bestLatency = Infinity
    let worstLatency = 0

    providers.forEach((provider) => {
      const stats = allStats[provider]
      totalRequests += stats.totalRequests

      const streamingBuffer = this.streamingMetrics.get(provider)
      const streamingCount = streamingBuffer ? streamingBuffer.length : 0
      totalStreamingRequests += streamingCount

      if (stats.totalRequests > 0) {
        totalLatency += stats.averageLatency * stats.totalRequests
        latencyCount += stats.totalRequests

        if (stats.averageLatency < bestLatency) {
          bestLatency = stats.averageLatency
          topProvider = provider
        }

        if (stats.averageLatency > worstLatency) {
          worstLatency = stats.averageLatency
          worstProvider = provider
        }
      }

      if (stats.averageFirstTokenLatency > 0) {
        totalFirstTokenLatency += stats.averageFirstTokenLatency
        firstTokenCount++
      }
    })

    return {
      totalRequests,
      totalStreamingRequests,
      averageLatency: latencyCount > 0 ? totalLatency / latencyCount : 0,
      averageFirstTokenLatency:
        firstTokenCount > 0 ? totalFirstTokenLatency / firstTokenCount : 0,
      topPerformingProvider: topProvider,
      worstPerformingProvider: worstProvider,
    }
  }

  // Clear all metrics (for testing/debugging)
  clearMetrics(provider?: AIProvider): void {
    if (provider) {
      this.requestMetrics.get(provider)?.clear()
      this.streamingMetrics.get(provider)?.clear()
      this.invalidateStatsCache(provider)
    } else {
      // Clear all
      this.requestMetrics.forEach((buffer) => buffer.clear())
      this.streamingMetrics.forEach((buffer) => buffer.clear())
      this.statsCache.clear()
      this.lastStatsUpdate.clear()
    }
  }

  // Private methods
  private calculateProviderStats(provider: AIProvider): ProviderStats {
    const requestBuffer = this.requestMetrics.get(provider)
    const streamingBuffer = this.streamingMetrics.get(provider)

    const requests = requestBuffer ? requestBuffer.getAll() : []
    const streaming = streamingBuffer ? streamingBuffer.getAll() : []

    const totalRequests = requests.length + streaming.length
    const successfulRequests =
      requests.filter((r) => r.success).length +
      streaming.filter((s) => s.success).length
    const failedRequests = totalRequests - successfulRequests

    // Calculate average latency
    const allDurations = [
      ...requests.map((r) => r.duration),
      ...streaming.map((s) => s.duration),
    ]
    const averageLatency =
      allDurations.length > 0
        ? allDurations.reduce((sum, d) => sum + d, 0) / allDurations.length
        : 0

    // Calculate average first token latency
    const firstTokenLatencies = streaming
      .map((s) => s.firstTokenLatency)
      .filter((latency): latency is number => latency !== null)
    const averageFirstTokenLatency =
      firstTokenLatencies.length > 0
        ? firstTokenLatencies.reduce((sum, l) => sum + l, 0) /
          firstTokenLatencies.length
        : 0

    // Calculate total tokens and throughput
    const totalTokens = [
      ...requests.map((r) => r.tokens || 0),
      ...streaming.map((s) => s.tokenCount || 0),
    ].reduce((sum, tokens) => sum + tokens, 0)

    const throughputs = streaming
      .map((s) => s.throughput)
      .filter((t): t is number => t !== undefined)
    const averageThroughput =
      throughputs.length > 0
        ? throughputs.reduce((sum, t) => sum + t, 0) / throughputs.length
        : 0

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageLatency,
      averageFirstTokenLatency,
      totalTokens,
      averageThroughput,
      errorRate: totalRequests > 0 ? failedRequests / totalRequests : 0,
      lastUpdated: new Date(),
    }
  }

  private invalidateStatsCache(provider: AIProvider): void {
    this.statsCache.delete(provider)
    this.lastStatsUpdate.delete(provider)
  }

  private performCleanup(): void {
    // Force garbage collection if available (Node.js with --expose-gc flag)
    if (global.gc) {
      global.gc()
    }

    // Log memory usage in development
    if (process.env.NODE_ENV === 'development') {
      const used = process.memoryUsage()
      console.log('Memory usage:', {
        rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
        external: `${Math.round(used.external / 1024 / 1024)} MB`,
      })
    }
  }

  // Cleanup resources
  destroy(): void {
    clearInterval(this.cleanupTimer)
    this.clearMetrics()
  }
}

export default PerformanceMonitor
