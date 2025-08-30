/**
 * Tavily Search Service - Real-time web search and content extraction
 *
 * Provides comprehensive web search capabilities through the Tavily API,
 * designed for AI applications with advanced search depth and content extraction.
 */

// Tavily Search API types
export interface TavilySearchParams {
  query: string
  search_depth?: 'basic' | 'advanced'
  include_images?: boolean
  include_answer?: boolean
  include_raw_content?: boolean
  max_results?: number
  include_domains?: string[]
  exclude_domains?: string[]
  days?: number // Restrict results to recent days
  topic?: 'general' | 'news' | 'finance' | 'academic'
}

export interface TavilySearchResult {
  title: string
  url: string
  content: string
  raw_content?: string
  score: number
  published_date?: string
}

export interface TavilySearchResponse {
  answer?: string
  query: string
  response_time: number
  results: TavilySearchResult[]
  images?: TavilyImageResult[]
}

export interface TavilyImageResult {
  url: string
  description?: string
}

export interface TavilyExtractParams {
  urls: string[]
  include_raw_content?: boolean
}

export interface TavilyExtractResult {
  url: string
  title: string
  content: string
  raw_content?: string
  status_code: number
}

export interface TavilyExtractResponse {
  results: TavilyExtractResult[]
  failed_results: Array<{
    url: string
    error: string
  }>
}

// Configuration interface
export interface TavilyConfig {
  apiKey: string
  maxResults: number
  searchDepth: 'basic' | 'advanced'
  includeImages: boolean
  includeAnswer: boolean
  includeRawContent: boolean
  defaultTopic: 'general' | 'news' | 'finance' | 'academic'
  timeout: number
  retryAttempts: number
  retryDelay: number
  cacheTTL: number // Cache time-to-live in milliseconds
}

// Default configuration
const DEFAULT_CONFIG: Omit<TavilyConfig, 'apiKey'> = {
  maxResults: 10,
  searchDepth: 'advanced',
  includeImages: false,
  includeAnswer: true,
  includeRawContent: false,
  defaultTopic: 'general',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  cacheTTL: 300000, // 5 minutes
}

// Error types
export class TavilyError extends Error {
  status?: number
  code?: string
  retryable: boolean

  constructor(
    message: string,
    options: { status?: number; code?: string; retryable?: boolean } = {}
  ) {
    super(message)
    this.name = 'TavilyError'
    this.status = options.status
    this.code = options.code
    this.retryable = options.retryable ?? true
  }
}

// Search result cache
interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

class TavilyCache<T> {
  private cache = new Map<string, CacheEntry<T>>()

  set(key: string, data: T, ttl: number): void {
    const now = Date.now()
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    })
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

/**
 * Tavily Search Client - Main class for interacting with Tavily API
 */
export class TavilySearchClient {
  private config: TavilyConfig
  private baseURL = 'https://api.tavily.com'
  private searchCache = new TavilyCache<TavilySearchResponse>()
  private extractCache = new TavilyCache<TavilyExtractResponse>()

  constructor(config: Partial<TavilyConfig> & { apiKey: string }) {
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Validate API key format
    if (!this.isValidApiKey(config.apiKey)) {
      throw new TavilyError('Invalid Tavily API key format', {
        retryable: false,
      })
    }

    // Set up periodic cache cleanup only in runtime
    if (
      typeof window === 'undefined' &&
      process.env.NEXT_PHASE !== 'phase-production-build'
    ) {
      setInterval(() => {
        this.searchCache.cleanup()
        this.extractCache.cleanup()
      }, 60000) // Clean up every minute
    }
  }

  /**
   * Validate Tavily API key format
   */
  private isValidApiKey(apiKey: string): boolean {
    // Tavily API keys are typically in format: tvly-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    return /^tvly-[a-zA-Z0-9]{32,}$/.test(apiKey.trim())
  }

  /**
   * Generate cache key for search parameters
   */
  private generateCacheKey(
    params: TavilySearchParams | TavilyExtractParams
  ): string {
    return JSON.stringify(params)
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    body: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    let lastError: Error | null = null

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.config.timeout
        )

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Api-Key': this.config.apiKey,
            'User-Agent': 'MindDeck-MCP/1.0',
          },
          body: JSON.stringify({
            ...body,
            api_key: this.config.apiKey, // Some endpoints expect this in body
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`

          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.error || errorData.message || errorMessage
          } catch {
            // Use default error message if parsing fails
          }

          const isRetryable = response.status >= 500 || response.status === 429
          throw new TavilyError(errorMessage, {
            status: response.status,
            code: response.status.toString(),
            retryable: isRetryable,
          })
        }

        const data = await response.json()
        return data as T
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')

        if (error instanceof TavilyError && !error.retryable) {
          throw error
        }

        if (attempt < this.config.retryAttempts - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.retryDelay * (attempt + 1))
          )
        }
      }
    }

    throw lastError || new TavilyError('Max retry attempts exceeded')
  }

  /**
   * Perform web search using Tavily API
   */
  async search(params: TavilySearchParams): Promise<TavilySearchResponse> {
    // Check cache first
    const cacheKey = this.generateCacheKey(params)
    const cachedResult = this.searchCache.get(cacheKey)
    if (cachedResult) {
      return cachedResult
    }

    // Prepare search parameters
    const searchParams = {
      query: params.query,
      search_depth: params.search_depth || this.config.searchDepth,
      include_images: params.include_images ?? this.config.includeImages,
      include_answer: params.include_answer ?? this.config.includeAnswer,
      include_raw_content:
        params.include_raw_content ?? this.config.includeRawContent,
      max_results: Math.min(params.max_results || this.config.maxResults, 20), // API limit
      topic: params.topic || this.config.defaultTopic,
      ...(params.include_domains && {
        include_domains: params.include_domains,
      }),
      ...(params.exclude_domains && {
        exclude_domains: params.exclude_domains,
      }),
      ...(params.days && { days: params.days }),
    }

    try {
      const result = await this.makeRequest<TavilySearchResponse>(
        '/search',
        searchParams
      )

      // Cache successful result
      this.searchCache.set(cacheKey, result, this.config.cacheTTL)

      return result
    } catch (error) {
      throw error instanceof TavilyError
        ? error
        : new TavilyError(
            `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
    }
  }

  /**
   * Extract content from specific URLs
   */
  async extract(params: TavilyExtractParams): Promise<TavilyExtractResponse> {
    // Check cache first
    const cacheKey = this.generateCacheKey(params)
    const cachedResult = this.extractCache.get(cacheKey)
    if (cachedResult) {
      return cachedResult
    }

    // Validate URLs
    if (!params.urls || params.urls.length === 0) {
      throw new TavilyError('URLs array cannot be empty', { retryable: false })
    }

    if (params.urls.length > 5) {
      throw new TavilyError('Maximum 5 URLs allowed per extraction request', {
        retryable: false,
      })
    }

    const extractParams = {
      urls: params.urls,
      include_raw_content:
        params.include_raw_content ?? this.config.includeRawContent,
    }

    try {
      const result = await this.makeRequest<TavilyExtractResponse>(
        '/extract',
        extractParams
      )

      // Cache successful result
      this.extractCache.set(cacheKey, result, this.config.cacheTTL)

      return result
    } catch (error) {
      throw error instanceof TavilyError
        ? error
        : new TavilyError(
            `Content extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
    }
  }

  /**
   * Test API connection and key validity
   */
  async testConnection(): Promise<{
    success: boolean
    latency: number
    error?: string
  }> {
    const startTime = Date.now()

    try {
      // Perform a minimal search to test the connection
      const result = await this.search({
        query: 'test connection',
        max_results: 1,
        include_answer: false,
        include_images: false,
        include_raw_content: false,
      })

      const latency = Date.now() - startTime

      return {
        success: true,
        latency,
      }
    } catch (error) {
      const latency = Date.now() - startTime
      return {
        success: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get API usage statistics
   */
  async getUsageStats(): Promise<{
    requests_made: number
    requests_remaining?: number
    reset_date?: string
  }> {
    try {
      return await this.makeRequest<{
        requests_made: number
        requests_remaining?: number
        reset_date?: string
      }>('/usage', {})
    } catch (error) {
      throw error instanceof TavilyError
        ? error
        : new TavilyError(
            `Failed to get usage stats: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
    }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<TavilyConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  /**
   * Get current configuration
   */
  getConfig(): TavilyConfig {
    return { ...this.config }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.searchCache.clear()
    this.extractCache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    searchCacheSize: number
    extractCacheSize: number
  } {
    return {
      searchCacheSize: this.searchCache.size(),
      extractCacheSize: this.extractCache.size(),
    }
  }
}

// Utility functions

/**
 * Format search results for AI consumption
 */
export function formatSearchResultsForAI(
  response: TavilySearchResponse
): string {
  let formatted = `Search Query: ${response.query}\n\n`

  if (response.answer) {
    formatted += `Quick Answer: ${response.answer}\n\n`
  }

  formatted += `Search Results (${response.results.length}):\n\n`

  response.results.forEach((result, index) => {
    formatted += `${index + 1}. **${result.title}**\n`
    formatted += `   URL: ${result.url}\n`
    formatted += `   Content: ${result.content}\n`
    if (result.published_date) {
      formatted += `   Published: ${result.published_date}\n`
    }
    formatted += `   Relevance Score: ${result.score.toFixed(2)}\n\n`
  })

  if (response.images && response.images.length > 0) {
    formatted += `Related Images (${response.images.length}):\n`
    response.images.forEach((image, index) => {
      formatted += `${index + 1}. ${image.url}`
      if (image.description) {
        formatted += ` - ${image.description}`
      }
      formatted += `\n`
    })
  }

  return formatted
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

/**
 * Validate search query
 */
export function validateSearchQuery(query: string): {
  isValid: boolean
  error?: string
} {
  if (!query || typeof query !== 'string') {
    return { isValid: false, error: 'Query must be a non-empty string' }
  }

  const trimmed = query.trim()
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Query cannot be empty' }
  }

  if (trimmed.length > 400) {
    return { isValid: false, error: 'Query is too long (max 400 characters)' }
  }

  return { isValid: true }
}
