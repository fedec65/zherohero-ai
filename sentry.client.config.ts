import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  
  // Error filtering
  beforeSend(event, hint) {
    // Filter out common non-critical errors
    const error = hint.originalException;
    
    if (error && typeof (error as any).message === 'string') {
      const message = (error as any).message.toLowerCase();
      
      // Ignore network errors that are likely user-related
      if (
        message.includes('network error') ||
        message.includes('fetch failed') ||
        message.includes('load failed') ||
        message.includes('script error')
      ) {
        return null;
      }
      
      // Ignore ResizeObserver loop errors (common browser issue)
      if (message.includes('resizeobserver loop limit exceeded')) {
        return null;
      }
      
      // Ignore non-Error objects in development
      if (process.env.NODE_ENV === 'development' && !(error as any).stack) {
        return null;
      }
    }
    
    return event;
  },
  
  // Performance monitoring configuration
  integrations: [
    new Sentry.BrowserTracing({
      // Track navigation transactions
      // routingInstrumentation: Sentry.nextRouterInstrumentation({}),
      
      // Track API calls
      traceFetch: true,
      traceXHR: true,
      
      // Disable automatic pageload transaction for SPA-style apps
      startTransactionOnLocationChange: false,
      
      // Custom transaction names
      beforeNavigate: (context) => {
        return {
          ...context,
          name: (context as any).location?.pathname || context.name,
          tags: {
            route: (context as any).location?.pathname || 'unknown',
          },
        };
      },
    }),
    
    // Session replay
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
      
      // Mask sensitive data
      maskTextSelector: '[data-sensitive], .sensitive, input[type="password"]',
      blockSelector: '.block-replay',
      
      // Network request/response capture
      networkDetailAllowUrls: [
        'https://api.openai.com',
        'https://api.anthropic.com',
        'https://generativelanguage.googleapis.com',
      ],
      networkCaptureBodies: true,
      networkRequestHeaders: ['Content-Type'],
      networkResponseHeaders: ['Content-Type'],
    }),
  ],
  
  // Context and tags
  initialScope: {
    tags: {
      component: 'client',
      deployment: process.env.VERCEL_ENV,
    },
    user: {
      // Will be populated by the app when user interacts
    },
  },
  
  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
  // Ignore certain URLs
  ignoreErrors: [
    // Browser extension errors
    'top.GLOBALS',
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'Can\'t find variable: ZiteReader',
    'jigsaw is not defined',
    'ComboSearch is not defined',
    'atomicFindClose',
    'fb_xd_fragment',
    'bmi_SafeAddOnload',
    'EBCallBackMessageReceived',
    'conduitPage',
  ],
  
  // Ignore certain transaction names
  ignoreTransactions: [
    '/api/health',
    '/_next/static',
    '/favicon.ico',
  ],
});

export {};