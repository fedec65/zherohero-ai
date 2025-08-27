/**
 * Next.js API Route - AI Provider Health Check
 * Monitors the status of all AI providers
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiAPI } from '../../../../lib/api';
import { AIProvider } from '../../../../../lib/stores/types';

export async function GET() {
  try {
    // Get current status of all providers
    const statuses = aiAPI.getAllProviderStatuses();
    
    // Perform health checks for initialized providers
    const healthResults = await aiAPI.healthCheckAll();
    
    // Combine status and health information
    const providers: AIProvider[] = ['openai', 'anthropic', 'gemini', 'xai', 'deepseek'];
    const providerDetails = providers.reduce((acc, provider) => {
      const status = statuses[provider];
      const health = healthResults[provider];
      
      acc[provider] = {
        initialized: status.initialized,
        hasApiKey: status.hasApiKey,
        healthy: health,
        lastHealthCheck: status.lastHealthCheck?.toISOString(),
        status: getProviderStatusText(status.initialized, status.hasApiKey, health)
      };
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate overall system health
    const initializedCount = Object.values(statuses).filter(s => s.initialized).length;
    const healthyCount = Object.values(healthResults).filter(h => h).length;
    
    const systemHealth = {
      status: healthyCount > 0 ? 'healthy' : 'unhealthy',
      providersInitialized: initializedCount,
      providersHealthy: healthyCount,
      totalProviders: providers.length
    };

    return NextResponse.json({
      system: systemHealth,
      providers: providerDetails,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        system: { status: 'error' },
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Test specific provider
export async function POST(request: NextRequest) {
  try {
    const { provider, testMessage } = await request.json();
    
    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      );
    }

    const validProviders: AIProvider[] = ['openai', 'anthropic', 'gemini', 'xai', 'deepseek'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    // Check if provider is initialized
    const status = aiAPI.getProviderStatus(provider);
    if (!status.initialized) {
      return NextResponse.json({
        provider,
        test: {
          success: false,
          error: 'Provider not initialized',
          latency: 0
        },
        timestamp: new Date().toISOString()
      });
    }

    // Test connection
    const testResult = await aiAPI.testProviderConnection(provider, testMessage);
    
    return NextResponse.json({
      provider,
      test: testResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Provider test error:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper function to get provider status text
function getProviderStatusText(
  initialized: boolean,
  hasApiKey: boolean,
  healthy?: boolean
): string {
  if (!initialized) {
    return hasApiKey ? 'not_initialized' : 'no_api_key';
  }
  
  if (healthy === undefined) {
    return 'unknown';
  }
  
  return healthy ? 'healthy' : 'unhealthy';
}