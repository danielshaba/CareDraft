import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface RiskFactorInput {
  category: string
  risk: string
  level: 'high' | 'medium' | 'low'
  impact: number
  mitigation?: string
}

interface ComplianceRequirement {
  id: string
  title: string
  status: 'met' | 'partial' | 'missing' | 'not_applicable'
  priority: 'high' | 'medium' | 'low'
  description: string
}

interface RiskAssessmentResult {
  riskScore: number
  bidRecommendation: 'BID' | 'NO_BID' | 'CONDITIONAL_BID'
  confidenceLevel: number
  keyRiskFactors: RiskFactorInput[]
  complianceGaps: string[]
  recommendations: string[]
}

const calculateRiskScore = (
  riskFactors: RiskFactorInput[],
  complianceRequirements: ComplianceRequirement[]
): RiskAssessmentResult => {
  // Risk scoring algorithm
  const baseScore = 80 // Start with base score

  // Calculate technical risk impact
  const technicalRisks = riskFactors.filter(r => r.category === 'Technical')
  const technicalPenalty = technicalRisks.reduce((acc, risk) => {
    const multiplier = risk.level === 'high' ? 3 : risk.level === 'medium' ? 2 : 1
    return acc + (risk.impact * multiplier)
  }, 0)

  // Calculate commercial risk impact
  const commercialRisks = riskFactors.filter(r => r.category === 'Commercial')
  const commercialPenalty = commercialRisks.reduce((acc, risk) => {
    const multiplier = risk.level === 'high' ? 4 : risk.level === 'medium' ? 2.5 : 1
    return acc + (risk.impact * multiplier)
  }, 0)

  // Calculate compliance penalties
  const highPriorityGaps = complianceRequirements.filter(
    req => req.priority === 'high' && (req.status === 'missing' || req.status === 'partial')
  )
  const compliancePenalty = highPriorityGaps.length * 15

  // Apply penalties
  const finalScore = Math.max(0, Math.min(100, baseScore - (technicalPenalty + commercialPenalty + compliancePenalty)))

  // Determine bid recommendation
  let bidRecommendation: 'BID' | 'NO_BID' | 'CONDITIONAL_BID'
  let confidenceLevel: number

  if (finalScore >= 70) {
    bidRecommendation = 'BID'
    confidenceLevel = Math.min(95, finalScore + 10)
  } else if (finalScore >= 50) {
    bidRecommendation = 'CONDITIONAL_BID'
    confidenceLevel = finalScore + 5
  } else {
    bidRecommendation = 'NO_BID'
    confidenceLevel = Math.max(60, 100 - finalScore)
  }

  // Identify key risk factors (highest impact)
  const keyRiskFactors = riskFactors
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3)

  // Identify compliance gaps
  const complianceGaps = complianceRequirements
    .filter(req => req.status === 'missing' || req.status === 'partial')
    .map(req => req.title)

  // Generate recommendations
  const recommendations: string[] = []
  
  if (commercialPenalty > 20) {
    recommendations.push('Review pricing strategy and value proposition')
  }
  
  if (technicalPenalty > 15) {
    recommendations.push('Conduct technical feasibility assessment')
  }
  
  if (complianceGaps.length > 0) {
    recommendations.push('Address compliance gaps before submission')
  }
  
  if (finalScore < 70) {
    recommendations.push('Consider partnership opportunities to strengthen bid')
  }

  return {
    riskScore: Math.round(finalScore),
    bidRecommendation,
    confidenceLevel: Math.round(confidenceLevel),
    keyRiskFactors,
    complianceGaps,
    recommendations
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tenderId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => 
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenderId } = await params

    // Fetch tender data
    const { error: tenderError } = await supabase
      .from('tender_workflows')
      .select('*')
      .eq('id', tenderId)
      .eq('user_id', user.id)
      .single()

    if (tenderError) {
      return NextResponse.json({ error: 'Tender not found' }, { status: 404 })
    }

    // Mock risk factors for demonstration
    // In a real implementation, these would be extracted from tender documents
    // or calculated based on tender complexity, requirements, etc.
    const mockRiskFactors: RiskFactorInput[] = [
      {
        category: 'Technical',
        risk: 'Complex integration requirements',
        level: 'medium',
        impact: 6,
        mitigation: 'Leverage existing partnerships'
      },
      {
        category: 'Commercial',
        risk: 'Tight pricing requirements',
        level: 'high',
        impact: 8,
        mitigation: 'Value engineering approach'
      },
      {
        category: 'Timeline',
        risk: 'Aggressive delivery schedule',
        level: 'medium',
        impact: 5,
        mitigation: 'Phased implementation'
      },
      {
        category: 'Resource',
        risk: 'Specialized skill requirements',
        level: 'low',
        impact: 3,
        mitigation: 'Training and recruitment plan'
      }
    ]

    const mockComplianceRequirements: ComplianceRequirement[] = [
      {
        id: 'cqc',
        title: 'CQC Registration',
        status: 'met',
        priority: 'high',
        description: 'Current CQC registration required'
      },
      {
        id: 'tupe',
        title: 'TUPE Compliance',
        status: 'partial',
        priority: 'high',
        description: 'Transfer of undertakings compliance'
      },
      {
        id: 'gdpr',
        title: 'GDPR Compliance',
        status: 'met',
        priority: 'high',
        description: 'Data protection compliance required'
      },
      {
        id: 'social-value',
        title: 'Social Value Policy',
        status: 'missing',
        priority: 'medium',
        description: '10% minimum social value commitment'
      }
    ]

    // Calculate risk assessment
    const assessment = calculateRiskScore(mockRiskFactors, mockComplianceRequirements)

    return NextResponse.json({
      success: true,
      data: {
        tenderId,
        assessment,
        riskFactors: mockRiskFactors,
        complianceRequirements: mockComplianceRequirements,
        calculatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Risk assessment error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate risk assessment' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenderId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => 
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { riskFactors, complianceRequirements } = await request.json()
    const { tenderId } = await params

    // Calculate risk assessment with provided data
    const assessment = calculateRiskScore(riskFactors, complianceRequirements)

    // Store assessment in database
    const { error: insertError } = await supabase
      .from('tender_analytics')
      .upsert({
        tender_id: tenderId,
        user_id: user.id,
        risk_score: assessment.riskScore,
        bid_recommendation: assessment.bidRecommendation,
        confidence_level: assessment.confidenceLevel,
        risk_factors: riskFactors,
        compliance_status: complianceRequirements,
        recommendations: assessment.recommendations,
        updated_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save assessment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        tenderId,
        assessment,
        calculatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Risk assessment calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate risk assessment' },
      { status: 500 }
    )
  }
} 