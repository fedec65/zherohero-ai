import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

// Only initialize Sentry in production to avoid build issues
if (process.env.NODE_ENV === "production" && SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Performance monitoring (lower rate for server)
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.01 : 0.1,

    // Release tracking
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,

    // Server-specific configuration
    integrations: [
      new Sentry.Integrations.Http({
        tracing: true,
        breadcrumbs: true,
      }),
      new Sentry.Integrations.Console({
        levels: ["error", "warn"],
      }),
    ],

    // Error filtering for server
    beforeSend(event, hint) {
      const error = hint.originalException;

      if (error && typeof (error as any).message === "string") {
        const message = (error as any).message.toLowerCase();

        // Ignore common server errors that aren't actionable
        if (
          message.includes("enotfound") ||
          message.includes("econnrefused") ||
          message.includes("timeout") ||
          message.includes("socket hang up")
        ) {
          return null;
        }

        // Log AI API errors but with reduced detail for privacy
        if (
          message.includes("openai") ||
          message.includes("anthropic") ||
          message.includes("gemini")
        ) {
          // Remove potentially sensitive information
          if (event.extra) {
            delete event.extra.request;
            delete event.extra.response;
          }
        }
      }

      return event;
    },

    // Context and tags
    initialScope: {
      tags: {
        component: "server",
        deployment: process.env.VERCEL_ENV,
        region: process.env.VERCEL_REGION,
      },
    },

    // Debug mode in development
    debug: false,

    // Server-specific ignored errors
    ignoreErrors: [
      "ECONNRESET",
      "ETIMEDOUT",
      "ENOTFOUND",
      "ECONNREFUSED",
      "socket hang up",
    ],
  });
}

export {};
