import { NextRequest, NextResponse } from "next/server";

interface HealthCheckResult {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    ai_providers: "healthy" | "unhealthy" | "degraded";
    storage: "healthy" | "unhealthy" | "degraded";
    external_apis: "healthy" | "unhealthy" | "degraded";
  };
  performance: {
    memory_usage: number;
    cpu_usage?: number;
    response_time: number;
  };
  environment: string;
}

// Track service start time
const START_TIME = Date.now();

async function checkAIProviders(): Promise<
  "healthy" | "unhealthy" | "degraded"
> {
  const providers = [
    {
      name: "OpenAI",
      key: process.env.OPENAI_API_KEY,
      url: "https://api.openai.com/v1/models",
    },
    {
      name: "Anthropic",
      key: process.env.ANTHROPIC_API_KEY,
      url: "https://api.anthropic.com/v1/messages",
    },
    {
      name: "Google",
      key: process.env.GOOGLE_API_KEY,
      url: "https://generativelanguage.googleapis.com/v1beta/models",
    },
  ];

  let healthyCount = 0;
  let totalCount = 0;

  for (const provider of providers) {
    if (!provider.key) continue;

    totalCount++;

    try {
      const response = await fetch(provider.url, {
        method: "GET",
        headers: {
          Authorization:
            provider.name === "Google"
              ? `Bearer ${provider.key}`
              : `Bearer ${provider.key}`,
          "User-Agent": "MindDeckClone/1.0.0",
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (response.status < 500) {
        // Consider 4xx as healthy (auth issues are expected in health checks)
        healthyCount++;
      }
    } catch (error) {
      console.warn(`Health check failed for ${provider.name}:`, error);
    }
  }

  if (totalCount === 0) return "unhealthy"; // No providers configured
  if (healthyCount === totalCount) return "healthy";
  if (healthyCount > 0) return "degraded";
  return "unhealthy";
}

async function checkStorage(): Promise<"healthy" | "unhealthy" | "degraded"> {
  try {
    // Test localStorage availability (simulated on server)
    if (typeof window !== "undefined") {
      const testKey = "__health_check__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
    }

    return "healthy";
  } catch (error) {
    console.warn("Storage health check failed:", error);
    return "unhealthy";
  }
}

async function checkExternalAPIs(): Promise<
  "healthy" | "unhealthy" | "degraded"
> {
  // Check external services (Sentry, Analytics, etc.)
  const checks = [];

  // Check Sentry connectivity
  if (process.env.SENTRY_DSN) {
    checks.push(
      fetch("https://sentry.io/api/0/", {
        method: "GET",
        signal: AbortSignal.timeout(3000),
      })
        .then((res) => res.ok)
        .catch(() => false),
    );
  }

  // Check Vercel Analytics
  checks.push(
    fetch("https://vitals.vercel-insights.com/v1/vitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "health-check", value: 1 }),
      signal: AbortSignal.timeout(3000),
    })
      .then((res) => res.ok)
      .catch(() => false),
  );

  if (checks.length === 0) return "healthy";

  try {
    const results = await Promise.all(checks);
    const healthyCount = results.filter(Boolean).length;

    if (healthyCount === results.length) return "healthy";
    if (healthyCount > 0) return "degraded";
    return "unhealthy";
  } catch (error) {
    console.warn("External API health checks failed:", error);
    return "degraded";
  }
}

function getMemoryUsage(): number {
  if (typeof process !== "undefined" && process.memoryUsage) {
    const usage = process.memoryUsage();
    return Math.round(usage.heapUsed / 1024 / 1024); // MB
  }
  return 0;
}

function getUptime(): number {
  return Math.floor((Date.now() - START_TIME) / 1000); // seconds
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Run health checks in parallel
    const [aiProvidersHealth, storageHealth, externalAPIsHealth] =
      await Promise.all([
        checkAIProviders(),
        checkStorage(),
        checkExternalAPIs(),
      ]);

    const responseTime = Date.now() - startTime;

    // Determine overall status
    const services = {
      ai_providers: aiProvidersHealth,
      storage: storageHealth,
      external_apis: externalAPIsHealth,
    };
    const statuses = Object.values(services);

    let overallStatus: "healthy" | "unhealthy" | "degraded";
    if (statuses.every((s) => s === "healthy")) {
      overallStatus = "healthy";
    } else if (statuses.some((s) => s === "unhealthy")) {
      overallStatus = "degraded";
    } else {
      overallStatus = "degraded";
    }

    const healthCheck: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      uptime: getUptime(),
      services,
      performance: {
        memory_usage: getMemoryUsage(),
        response_time: responseTime,
      },
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    };

    // Set appropriate HTTP status code
    const statusCode =
      overallStatus === "healthy"
        ? 200
        : overallStatus === "degraded"
          ? 207
          : 503;

    // Add custom headers
    const headers = {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Health-Check": overallStatus,
      "X-Response-Time": responseTime.toString(),
    };

    return new NextResponse(JSON.stringify(healthCheck, null, 2), {
      status: statusCode,
      headers,
    });
  } catch (error) {
    console.error("Health check failed:", error);

    const errorResponse: HealthCheckResult = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      uptime: getUptime(),
      services: {
        ai_providers: "unhealthy",
        storage: "unhealthy",
        external_apis: "unhealthy",
      },
      performance: {
        memory_usage: getMemoryUsage(),
        response_time: Date.now() - startTime,
      },
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    };

    return new NextResponse(JSON.stringify(errorResponse, null, 2), {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Health-Check": "unhealthy",
      },
    });
  }
}

// Also support HEAD requests for simple uptime checks
export async function HEAD(request: NextRequest) {
  try {
    const startTime = Date.now();
    await checkStorage(); // Quick check
    const responseTime = Date.now() - startTime;

    return new NextResponse(null, {
      status: 200,
      headers: {
        "X-Health-Check": "healthy",
        "X-Response-Time": responseTime.toString(),
      },
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        "X-Health-Check": "unhealthy",
      },
    });
  }
}
