export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
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
