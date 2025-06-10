import { NextRequest, NextResponse } from 'next/server'
import { generateWithCustomModel, clientConfig } from '@/lib/api-client'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { model } = await request.json()
    
    if (!model) {
      return NextResponse.json(
        { error: 'Model parameter is required' },
        { status: 400 }
      )
    }

    const testMessage = "Write a brief professional summary about improving care quality in UK residential homes."
    
    const startTime = Date.now()
    
    const result = await generateWithCustomModel([
      { 
        role: 'system', 
        content: 'You are an expert UK care sector advisor. Provide professional, concise responses focused on care quality improvement.' 
      },
      { 
        role: 'user', 
        content: testMessage 
      }
    ], model)
    
    const endTime = Date.now()
    const latency = endTime - startTime

    return NextResponse.json({
      success: true,
      model: result.model,
      modelDisplayName: getModelDisplayName(result.model),
      fineTuned: result.fineTuned,
      latency,
      tokensUsed: result.tokensUsed?.total || 0,
      inputTokens: result.tokensUsed?.input || 0,
      outputTokens: result.tokensUsed?.output || 0,
      fallback: result.fallback,
      attempts: result.attempts,
      responsePreview: result.text.substring(0, 200) + (result.text.length > 200 ? '...' : ''),
      testMessage
    })
  } catch (error: unknown) {
    console.error('AI model test failed:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Model test failed'
    const errorType = (error as any)?.type || 'unknown'
    const errorModel = (error as any)?.model || 'unknown'
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      type: errorType,
      model: errorModel
    }, { 
      status: errorType === 'authentication' ? 401 : 
              errorType === 'rate_limit' ? 429 : 
              errorType === 'validation' ? 400 : 500 
    })
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return NextResponse.json({
    availableModels: {
      primary: clientConfig.primaryModel,
      fallback: clientConfig.fallbackModel,
      backupPrimary: clientConfig.backupPrimaryModel,
      backupFallback: clientConfig.backupFallbackModel
    },
    displayNames: clientConfig.modelDisplayNames,
    fineTunedModels: clientConfig.fineTunedModels,
    debugMode: clientConfig.debugMode
  })
}

function getModelDisplayName(model: string): string {
  const modelMappings = process.env.MODEL_DISPLAY_MAPPINGS ? 
    JSON.parse(process.env.MODEL_DISPLAY_MAPPINGS) : {}
  
  for (const [jobId, displayName] of Object.entries(modelMappings)) {
    if (model.includes(jobId)) return displayName as string
  }
  
  if (model.startsWith('ft:')) return `Fine-tuned: ${model.split(':').pop()?.substring(0, 12) || 'Unknown'}`
  return model
} 