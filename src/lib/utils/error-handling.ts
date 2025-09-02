/**
 * Error handling utilities for better user experience and debugging
 */

// Error types for better categorization
export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  STORAGE = 'storage',
  API = 'api',
  PERMISSION = 'permission',
  RATE_LIMIT = 'rate_limit',
  UNKNOWN = 'unknown'
}

export interface AppError extends Error {
  type: ErrorType
  code?: string
  details?: any
  retryable?: boolean
  userMessage?: string
}

export class AppErrorClass extends Error implements AppError {
  type: ErrorType
  code?: string
  details?: any
  retryable?: boolean
  userMessage?: string

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    options?: {
      code?: string
      details?: any
      retryable?: boolean
      userMessage?: string
      cause?: Error
    }
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.code = options?.code
    this.details = options?.details
    this.retryable = options?.retryable ?? false
    this.userMessage = options?.userMessage
    
    if (options?.cause) {
      this.cause = options.cause
    }
  }
}

// Error factory functions
export const createValidationError = (message: string, details?: any) => 
  new AppErrorClass(message, ErrorType.VALIDATION, { 
    userMessage: 'Please check your input and try again.',
    details 
  })

export const createNetworkError = (message: string, retryable = true) => 
  new AppErrorClass(message, ErrorType.NETWORK, { 
    userMessage: 'Network error. Please check your connection and try again.',
    retryable 
  })

export const createStorageError = (message: string) => 
  new AppErrorClass(message, ErrorType.STORAGE, { 
    userMessage: 'Storage error. Your changes might not be saved.',
    retryable: false 
  })

export const createAPIError = (message: string, code?: string, retryable = false) => 
  new AppErrorClass(message, ErrorType.API, { 
    code,
    userMessage: 'Service error. Please try again later.',
    retryable 
  })

export const createRateLimitError = (message: string) => 
  new AppErrorClass(message, ErrorType.RATE_LIMIT, { 
    userMessage: 'Too many requests. Please wait a moment and try again.',
    retryable: true 
  })

// Error parsing utility
export const parseError = (error: unknown): AppError => {
  if (error instanceof AppErrorClass) {
    return error
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return createNetworkError(error.message)
    }
    
    // API key errors
    if (message.includes('api key') || message.includes('unauthorized') || message.includes('401')) {
      return createAPIError(error.message, 'API_KEY_ERROR', false)
    }
    
    // Rate limit errors
    if (message.includes('rate limit') || message.includes('quota') || message.includes('429')) {
      return createRateLimitError(error.message)
    }
    
    // Storage errors
    if (message.includes('storage') || message.includes('quota exceeded') || message.includes('disk full')) {
      return createStorageError(error.message)
    }
    
    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return createValidationError(error.message)
    }
    
    // Default to unknown error
    return new AppErrorClass(error.message, ErrorType.UNKNOWN, { 
      userMessage: 'An unexpected error occurred. Please try again.',
      retryable: true 
    })
  }

  // Handle string errors
  if (typeof error === 'string') {
    return new AppErrorClass(error, ErrorType.UNKNOWN, { 
      userMessage: error,
      retryable: true 
    })
  }

  // Handle unknown error types
  return new AppErrorClass('An unknown error occurred', ErrorType.UNKNOWN, { 
    userMessage: 'Something went wrong. Please try again.',
    retryable: true,
    details: error 
  })
}

// Error handling wrapper for async operations
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> => {
  try {
    return await operation()
  } catch (error) {
    const appError = parseError(error)
    
    // Log error for debugging (in development)
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error in ${context || 'operation'}:`, {
        error: appError,
        stack: appError.stack,
        details: appError.details
      })
    }
    
    throw appError
  }
}

// Retry wrapper with exponential backoff
export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number
    baseDelay?: number
    maxDelay?: number
    shouldRetry?: (error: AppError) => boolean
  } = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error) => error.retryable ?? false
  } = options

  let lastError: AppError

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      const appError = parseError(error)
      lastError = appError

      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === maxAttempts || !shouldRetry(appError)) {
        throw appError
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// Global error reporter (can be extended to send to external services)
export const reportError = (error: AppError, context?: string) => {
  // In production, this could send to error reporting service
  if (process.env.NODE_ENV === 'production') {
    console.error('Application Error:', {
      type: error.type,
      message: error.message,
      code: error.code,
      context,
      timestamp: new Date().toISOString()
    })
  } else {
    console.error('Application Error:', error, { context })
  }
}

// Error boundary fallback props
export interface ErrorFallbackProps {
  error: AppError
  retry: () => void
  context?: string
}

// Common error handling patterns
export const ErrorHandlers = {
  // Handle chat operations
  chatOperation: (error: unknown, operation: string) => {
    const appError = parseError(error)
    reportError(appError, `Chat operation: ${operation}`)
    
    // Return user-friendly message based on error type
    switch (appError.type) {
      case ErrorType.STORAGE:
        return 'Failed to save changes. Please try again.'
      case ErrorType.VALIDATION:
        return 'Invalid input. Please check your data.'
      case ErrorType.NETWORK:
        return 'Connection error. Please check your network.'
      default:
        return appError.userMessage || 'Operation failed. Please try again.'
    }
  },

  // Handle folder operations
  folderOperation: (error: unknown, operation: string) => {
    const appError = parseError(error)
    reportError(appError, `Folder operation: ${operation}`)
    
    switch (appError.type) {
      case ErrorType.VALIDATION:
        return 'Invalid folder name or operation.'
      case ErrorType.STORAGE:
        return 'Failed to update folder structure.'
      default:
        return appError.userMessage || 'Folder operation failed.'
    }
  },

  // Handle search operations
  searchOperation: (error: unknown) => {
    const appError = parseError(error)
    reportError(appError, 'Search operation')
    
    switch (appError.type) {
      case ErrorType.VALIDATION:
        return 'Invalid search query. Please try different keywords.'
      default:
        return 'Search failed. Please try again.'
    }
  }
}

// Storage quota check utility
export const checkStorageQuota = (): { available: boolean; usage?: number; quota?: number } => {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then((estimate) => {
        const usage = estimate.usage || 0
        const quota = estimate.quota || 0
        const usagePercent = (usage / quota) * 100
        
        if (usagePercent > 90) {
          console.warn('Storage quota nearly full:', { usage, quota, usagePercent })
        }
      })
    }
    
    // Check localStorage quota
    const testKey = '__quota_test__'
    const testValue = 'x'.repeat(1024) // 1KB test
    
    try {
      localStorage.setItem(testKey, testValue)
      localStorage.removeItem(testKey)
      return { available: true }
    } catch {
      return { available: false }
    }
  } catch (error) {
    console.warn('Storage quota check failed:', error)
    return { available: false }
  }
}