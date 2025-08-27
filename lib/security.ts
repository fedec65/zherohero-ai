import crypto from 'crypto';

// API Key management utilities
export class APIKeyManager {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;
  
  private static getEncryptionKey(): string {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    return key;
  }
  
  // Encrypt sensitive data
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipher(this.ALGORITHM, this.getEncryptionKey());
    cipher.setAAD(Buffer.from('minddeck-clone', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
  }
  
  // Decrypt sensitive data
  static decrypt(encryptedText: string): string {
    const [ivHex, encrypted, tagHex] = encryptedText.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    const decipher = crypto.createDecipher(this.ALGORITHM, this.getEncryptionKey());
    decipher.setAAD(Buffer.from('minddeck-clone', 'utf8'));
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  // Validate API key format
  static validateAPIKey(key: string, provider: string): boolean {
    const patterns = {
      openai: /^sk-[a-zA-Z0-9]{40,}$/,
      anthropic: /^sk-ant-[a-zA-Z0-9-]{50,}$/,
      google: /^AIza[a-zA-Z0-9-_]{35}$/,
      xai: /^xai-[a-zA-Z0-9]{40,}$/,
      deepseek: /^sk-[a-zA-Z0-9]{40,}$/,
    };
    
    const pattern = patterns[provider as keyof typeof patterns];
    return pattern ? pattern.test(key) : false;
  }
  
  // Mask API key for logging
  static maskAPIKey(key: string): string {
    if (!key || key.length < 8) return '[INVALID]';
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  }
}

// Rate limiting utilities
export class RateLimiter {
  private static requests = new Map<string, number[]>();
  
  static isRateLimited(
    identifier: string,
    maxRequests: number = 100,
    windowMs: number = 15 * 60 * 1000 // 15 minutes
  ): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing requests for this identifier
    const requests = this.requests.get(identifier) || [];
    
    // Filter out requests outside the current window
    const recentRequests = requests.filter(time => time > windowStart);
    
    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return true;
    }
    
    // Add current request and update
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return false;
  }
  
  static getRemainingRequests(
    identifier: string,
    maxRequests: number = 100,
    windowMs: number = 15 * 60 * 1000
  ): number {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const requests = this.requests.get(identifier) || [];
    const recentRequests = requests.filter(time => time > windowStart);
    
    return Math.max(0, maxRequests - recentRequests.length);
  }
  
  static getResetTime(
    identifier: string,
    windowMs: number = 15 * 60 * 1000
  ): number {
    const requests = this.requests.get(identifier) || [];
    if (requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...requests);
    return oldestRequest + windowMs;
  }
  
  // Cleanup old entries
  static cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    const entries = Array.from(this.requests.entries());
    for (const [identifier, requests] of entries) {
      const recentRequests = requests.filter(time => now - time < maxAge);
      
      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }
}

// Input sanitization
export class InputSanitizer {
  // Sanitize chat message content
  static sanitizeChatMessage(content: string): string {
    if (!content) return '';
    
    return content
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/vbscript:/gi, '') // Remove vbscript: URLs
      .replace(/onload=/gi, '') // Remove onload attributes
      .replace(/onerror=/gi, '') // Remove onerror attributes
      .slice(0, 32000); // Limit length
  }
  
  // Sanitize file names
  static sanitizeFileName(fileName: string): string {
    if (!fileName) return '';
    
    return fileName
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
      .replace(/\.\./g, '') // Remove path traversal attempts
      .replace(/^\.+/, '') // Remove leading dots
      .slice(0, 255); // Limit length
  }
  
  // Validate URL
  static isValidURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }
  
  // Sanitize HTML content
  static sanitizeHTML(html: string): string {
    // Basic HTML sanitization - in production, use a library like DOMPurify
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
}

// Request validation middleware
export const validateRequest = (req: Request): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const url = new URL(req.url);
  
  // Check content length
  const contentLength = parseInt(req.headers.get('content-length') || '0');
  if (contentLength > 10 * 1024 * 1024) { // 10MB limit
    errors.push('Request payload too large');
  }
  
  // Check for suspicious patterns in URL
  const suspiciousPatterns = [
    /\.\.\//, // Path traversal
    /<script/i, // XSS attempts
    /javascript:/i, // JavaScript protocol
    /data:text\/html/i, // Data URL with HTML
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url.pathname) || pattern.test(url.search)) {
      errors.push('Suspicious URL pattern detected');
      break;
    }
  }
  
  // Validate headers
  const userAgent = req.headers.get('user-agent');
  if (!userAgent || userAgent.length > 512) {
    errors.push('Invalid User-Agent header');
  }
  
  const origin = req.headers.get('origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  
  if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
    errors.push('Origin not allowed');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Generate secure tokens
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Hash sensitive data
export const hashSensitiveData = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

// CSRF protection
export const generateCSRFToken = (sessionId: string): string => {
  const secret = process.env.API_SECRET_KEY || 'fallback-secret';
  return crypto.createHmac('sha256', secret).update(sessionId).digest('hex');
};

export const validateCSRFToken = (token: string, sessionId: string): boolean => {
  const expectedToken = generateCSRFToken(sessionId);
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
};