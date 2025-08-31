export async function register() {
  // Only register Sentry in production and when DSN is available
  const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  
  if (process.env.NODE_ENV === 'production' && SENTRY_DSN) {
    try {
      if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('./sentry.server.config')
      }

      if (process.env.NEXT_RUNTIME === 'edge') {
        await import('./sentry.edge.config')
      }
    } catch (error) {
      console.warn('Sentry initialization failed:', error)
    }
  }
}

export const onRequestError = (
  error: Error,
  request: Request,
  context: any
) => {
  console.error('Request error:', error)
  console.error('Request URL:', request.url)
  console.error('Context:', context)
}
