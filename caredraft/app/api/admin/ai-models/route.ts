import { NextResponse } from 'next/server'
import { clientConfig } from '@/lib/api-client'

export async function GET() {
  try {
    // Get model configuration from the client
    const config = clientConfig

    const models = [
      {
        name: config.primaryModel,
        displayName: config.modelDisplayNames.primary,
        type: 'primary' as const,
        fineTuned: config.fineTunedModels.primary,
        status: 'active' as const,
        lastUsed: new Date(),
        tokensUsed: Math.floor(Math.random() * 100000), // This would come from actual logging
        requestCount: Math.floor(Math.random() * 1000),
        averageLatency: Math.floor(Math.random() * 2000) + 500,
        errorRate: Math.random() * 0.05,
      },
      {
        name: config.fallbackModel,
        displayName: config.modelDisplayNames.fallback,
        type: 'fallback' as const,
        fineTuned: config.fineTunedModels.fallback,
        status: 'active' as const,
        lastUsed: new Date(),
        tokensUsed: Math.floor(Math.random() * 80000),
        requestCount: Math.floor(Math.random() * 800),
        averageLatency: Math.floor(Math.random() * 1500) + 300,
        errorRate: Math.random() * 0.03,
      },
      {
        name: config.backupPrimaryModel,
        displayName: config.modelDisplayNames.backupPrimary,
        type: 'backup' as const,
        fineTuned: false,
        status: 'inactive' as const,
        lastUsed: undefined,
        tokensUsed: 0,
        requestCount: 0,
        averageLatency: 0,
        errorRate: 0,
      },
      {
        name: config.backupFallbackModel,
        displayName: config.modelDisplayNames.backupFallback,
        type: 'backup' as const,
        fineTuned: false,
        status: 'inactive' as const,
        lastUsed: undefined,
        tokensUsed: 0,
        requestCount: 0,
        averageLatency: 0,
        errorRate: 0,
      },
    ]

    return NextResponse.json({
      models,
      debugMode: config.debugMode,
      available: config.available
    })
  } catch (error) {
    console.error('Failed to get AI model info:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve model information' },
      { status: 500 }
    )
  }
} 