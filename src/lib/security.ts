/**
 * Security utilities for rate limiting and request validation
 */

export class RateLimiter {
  private static instance: RateLimiter;
  private requests: Map<string, number[]> = new Map();

  private constructor() {}

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  checkRateLimit(identifier: string, limit = 10, windowMs = 60000): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= limit) {
      return false; // Rate limit exceeded
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true; // Request allowed
  }

  clearOldEntries(): void {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    
    const entries = Array.from(this.requests.entries());
    for (const [key, requests] of entries) {
      const validRequests = requests.filter(time => now - time < windowMs);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }

  static cleanup(): void {
    const instance = RateLimiter.getInstance();
    instance.clearOldEntries();
  }
}

export function validateApiKey(apiKey: string): boolean {
  // Basic API key validation
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // Check minimum length
  if (apiKey.length < 10) {
    return false;
  }
  
  // Check for common prefixes
  const validPrefixes = ['sk-', 'xai-', 'AIza'];
  const hasValidPrefix = validPrefixes.some(prefix => apiKey.startsWith(prefix));
  
  return hasValidPrefix || apiKey.length >= 32;
}

export function sanitizeInput(input: string): string {
  // Basic input sanitization
  return input
    .replace(/[<>]/g, '') // Remove basic HTML
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .trim();
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}