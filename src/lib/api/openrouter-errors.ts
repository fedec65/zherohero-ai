/**
 * OpenRouter-specific error handling and user-friendly error messages
 */

import { APIError } from "./types";

export interface OpenRouterErrorDetails {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
  action?:
    | "check_key"
    | "check_balance"
    | "try_different_model"
    | "wait"
    | "contact_support";
}

// Common OpenRouter error codes and their meanings
const OPENROUTER_ERROR_CODES: Record<string, OpenRouterErrorDetails> = {
  // Authentication errors
  invalid_api_key: {
    code: "invalid_api_key",
    message: "Invalid API key provided",
    userMessage:
      "Your OpenRouter API key is invalid. Please check your API key in Settings.",
    retryable: false,
    action: "check_key",
  },
  insufficient_balance: {
    code: "insufficient_balance",
    message: "Insufficient balance to complete request",
    userMessage:
      "Insufficient OpenRouter balance. Please add funds to your OpenRouter account.",
    retryable: false,
    action: "check_balance",
  },

  // Rate limiting
  rate_limited: {
    code: "rate_limited",
    message: "Too many requests, please slow down",
    userMessage:
      "Too many requests to OpenRouter. Please wait a moment and try again.",
    retryable: true,
    action: "wait",
  },
  daily_limit_exceeded: {
    code: "daily_limit_exceeded",
    message: "Daily request limit exceeded",
    userMessage:
      "Daily OpenRouter limit exceeded. Try again tomorrow or upgrade your plan.",
    retryable: false,
    action: "check_balance",
  },

  // Model errors
  model_not_found: {
    code: "model_not_found",
    message: "The specified model was not found",
    userMessage:
      "This model is not available on OpenRouter. Please try a different model.",
    retryable: false,
    action: "try_different_model",
  },
  model_offline: {
    code: "model_offline",
    message: "The requested model is currently offline",
    userMessage:
      "This model is temporarily unavailable. Please try another model or wait a few minutes.",
    retryable: true,
    action: "try_different_model",
  },
  model_overloaded: {
    code: "model_overloaded",
    message: "The requested model is currently overloaded",
    userMessage:
      "This model is experiencing high demand. Please try again in a few minutes or use a different model.",
    retryable: true,
    action: "wait",
  },

  // Request errors
  invalid_request_format: {
    code: "invalid_request_format",
    message: "Invalid request format",
    userMessage:
      "There was an issue with your request format. Please try again.",
    retryable: false,
    action: "contact_support",
  },
  context_length_exceeded: {
    code: "context_length_exceeded",
    message: "Request exceeds maximum context length for this model",
    userMessage:
      "Your message is too long for this model. Please shorten your message or use a model with a larger context window.",
    retryable: false,
    action: "try_different_model",
  },
  content_filtered: {
    code: "content_filtered",
    message: "Content was filtered due to policy violations",
    userMessage:
      "Your request was filtered due to content policy. Please modify your message and try again.",
    retryable: false,
  },

  // Server errors
  internal_server_error: {
    code: "internal_server_error",
    message: "Internal server error occurred",
    userMessage:
      "OpenRouter is experiencing technical difficulties. Please try again in a few minutes.",
    retryable: true,
    action: "wait",
  },
  service_unavailable: {
    code: "service_unavailable",
    message: "Service temporarily unavailable",
    userMessage:
      "OpenRouter is temporarily unavailable. Please try again in a few minutes.",
    retryable: true,
    action: "wait",
  },
  timeout: {
    code: "timeout",
    message: "Request timed out",
    userMessage:
      "The request took too long to process. Please try again with a shorter message.",
    retryable: true,
  },
};

/**
 * Parse OpenRouter API error and return user-friendly details
 */
export function parseOpenRouterError(error: any): OpenRouterErrorDetails {
  // Default error details
  const defaultError: OpenRouterErrorDetails = {
    code: "unknown_error",
    message: "Unknown error occurred",
    userMessage: "An unexpected error occurred. Please try again.",
    retryable: true,
  };

  // Handle APIError instances
  if (error instanceof APIError) {
    const code = error.code?.toLowerCase() || "unknown_error";
    const knownError = OPENROUTER_ERROR_CODES[code];

    if (knownError) {
      return {
        ...knownError,
        message: error.message || knownError.message,
      };
    }

    // Handle HTTP status codes
    if (error.status) {
      switch (error.status) {
        case 400:
          return {
            code: "bad_request",
            message: error.message,
            userMessage:
              "Invalid request. Please check your input and try again.",
            retryable: false,
          };
        case 401:
          return OPENROUTER_ERROR_CODES["invalid_api_key"];
        case 402:
          return OPENROUTER_ERROR_CODES["insufficient_balance"];
        case 404:
          return OPENROUTER_ERROR_CODES["model_not_found"];
        case 429:
          return OPENROUTER_ERROR_CODES["rate_limited"];
        case 500:
          return OPENROUTER_ERROR_CODES["internal_server_error"];
        case 502:
        case 503:
        case 504:
          return OPENROUTER_ERROR_CODES["service_unavailable"];
        default:
          return {
            ...defaultError,
            message: error.message || `HTTP ${error.status}`,
            userMessage: `Request failed (${error.status}). Please try again.`,
          };
      }
    }

    return {
      ...defaultError,
      message: error.message,
      userMessage: error.message || defaultError.userMessage,
    };
  }

  // Handle network errors
  if (error.message?.includes("fetch")) {
    return {
      code: "network_error",
      message: "Network connection failed",
      userMessage:
        "Unable to connect to OpenRouter. Please check your internet connection and try again.",
      retryable: true,
    };
  }

  // Handle timeout errors
  if (
    error.message?.includes("timeout") ||
    error.message?.includes("aborted")
  ) {
    return OPENROUTER_ERROR_CODES["timeout"];
  }

  // Parse error message for known patterns
  const errorMessage = error.message?.toLowerCase() || "";

  for (const [code, details] of Object.entries(OPENROUTER_ERROR_CODES)) {
    if (
      errorMessage.includes(code.replace("_", " ")) ||
      errorMessage.includes(details.message.toLowerCase())
    ) {
      return {
        ...details,
        message: error.message || details.message,
      };
    }
  }

  return {
    ...defaultError,
    message: error.message || error.toString(),
    userMessage: error.message || defaultError.userMessage,
  };
}

/**
 * Determine if an error should trigger a retry
 */
export function shouldRetry(
  error: OpenRouterErrorDetails,
  attemptCount: number,
): boolean {
  if (!error.retryable || attemptCount >= 3) {
    return false;
  }

  // Don't retry authentication or balance errors
  if (
    [
      "invalid_api_key",
      "insufficient_balance",
      "daily_limit_exceeded",
    ].includes(error.code)
  ) {
    return false;
  }

  // Retry server errors and rate limits with exponential backoff
  if (
    [
      "internal_server_error",
      "service_unavailable",
      "rate_limited",
      "timeout",
    ].includes(error.code)
  ) {
    return true;
  }

  return false;
}

/**
 * Calculate retry delay with exponential backoff
 */
export function getRetryDelay(attemptCount: number, errorCode: string): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds

  // Longer delays for rate limiting
  const multiplier = errorCode === "rate_limited" ? 2 : 1;

  const delay = Math.min(
    baseDelay * Math.pow(2, attemptCount) * multiplier,
    maxDelay,
  );

  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

/**
 * Get user-friendly error message with action suggestions
 */
export function formatErrorMessage(error: OpenRouterErrorDetails): {
  title: string;
  message: string;
  action?: {
    text: string;
    url?: string;
    handler?: string;
  };
} {
  const result = {
    title: "OpenRouter Error",
    message: error.userMessage,
    action: undefined as any,
  };

  switch (error.action) {
    case "check_key":
      result.action = {
        text: "Check API Key",
        handler: "openSettings",
      };
      break;
    case "check_balance":
      result.action = {
        text: "Check Balance",
        url: "https://openrouter.ai/account",
      };
      break;
    case "try_different_model":
      result.action = {
        text: "Try Different Model",
        handler: "switchModel",
      };
      break;
    case "wait":
      result.action = {
        text: "Try Again Later",
      };
      break;
    case "contact_support":
      result.action = {
        text: "Contact Support",
        url: "https://discord.gg/openrouter",
      };
      break;
  }

  return result;
}

const OpenRouterErrorUtils = {
  parseOpenRouterError,
  shouldRetry,
  getRetryDelay,
  formatErrorMessage,
  OPENROUTER_ERROR_CODES,
};

export default OpenRouterErrorUtils;
