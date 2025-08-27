/**
 * Performance Monitoring API - Real-time metrics and debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { PerformanceMonitor } from '../../../../lib/performance/monitor';
import { StreamManager } from '../../../../lib/streaming/manager';

const performanceMonitor = PerformanceMonitor.getInstance();
const streamManager = StreamManager.getInstance();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') as any;
    const metric = searchParams.get('metric') || 'summary';
    const limit = parseInt(searchParams.get('limit') || '50');

    switch (metric) {
      case 'summary':
        return NextResponse.json({
          performance: performanceMonitor.getPerformanceSummary(),
          providers: performanceMonitor.getAllProviderStats(),
          streaming: streamManager.getAllProviderStatuses(),
          timestamp: new Date().toISOString()
        });

      case 'provider':
        if (!provider) {
          return NextResponse.json(
            { error: 'Provider parameter required for provider metrics' },
            { status: 400 }
          );
        }
        
        return NextResponse.json({
          stats: performanceMonitor.getProviderStats(provider),
          streamingStatus: streamManager.getProviderStatus(provider),
          recentMetrics: performanceMonitor.getRecentMetrics(provider, limit),
          timestamp: new Date().toISOString()
        });

      case 'streams':
        return NextResponse.json({
          activeStreams: streamManager.getActiveStreams(),
          providerStatuses: streamManager.getAllProviderStatuses(),
          timestamp: new Date().toISOString()
        });

      case 'health':
        const allStats = performanceMonitor.getAllProviderStats();
        const health = Object.entries(allStats).map(([provider, stats]) => ({
          provider,
          healthy: stats.errorRate < 0.1 && stats.averageLatency < 10000,
          errorRate: stats.errorRate,
          averageLatency: stats.averageLatency,
          totalRequests: stats.totalRequests
        }));

        return NextResponse.json({
          overall: health.every(p => p.healthy),
          providers: health,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: `Unknown metric: ${metric}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Performance API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, provider } = body;

    switch (action) {
      case 'clear_metrics':
        performanceMonitor.clearMetrics(provider);
        return NextResponse.json({ success: true, message: 'Metrics cleared' });

      case 'reset_circuit_breaker':
        if (!provider) {
          return NextResponse.json(
            { error: 'Provider parameter required' },
            { status: 400 }
          );
        }
        streamManager.resetCircuitBreaker(provider);
        return NextResponse.json({ success: true, message: 'Circuit breaker reset' });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Performance API POST error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}