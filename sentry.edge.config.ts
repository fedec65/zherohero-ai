import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

// Only initialize Sentry in production to avoid build issues
if (process.env.NODE_ENV === 'production' && SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Edge runtime has limited performance monitoring
    tracesSampleRate: 0,

    // Release tracking
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,

    // Minimal integrations for edge runtime
    integrations: [],

    // Context and tags
    initialScope: {
      tags: {
        component: 'edge',
        deployment: process.env.VERCEL_ENV,
        region: process.env.VERCEL_REGION,
      },
    },

    // Debug mode in development
    debug: false, // Keep false for edge runtime
  })
}

export {}
