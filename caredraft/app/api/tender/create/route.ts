import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

const createTenderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  issuing_authority: z.string().optional(),
  deadline: z.string().optional(),
  contract_value: z.number().optional(),
  region: z.string().optional(),
  description: z.string().optional(),
  workflow_type: z.enum(['manual', 'auto_parsed']).default('manual'),
  parsed_metadata: z.object({
    evaluation_criteria: z.array(z.object({
      criteria: z.string(),
      weight: z.number()
    })).optional(),
    compliance_requirements: z.array(z.string()).optional(),
    key_dates: z.array(z.object({
      date: z.string(),
      description: z.string()
    })).optional(),
    extraction_confidence: z.number().min(0).max(100).optional(),
    document_count: z.number().positive().optional(),
    modified_fields: z.array(z.string()).optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTenderSchema.parse(body)

    // Create tender workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('tender_workflows')
      .insert({
        user_id: user.id,
        title: validatedData.title,
        issuing_authority: validatedData.issuing_authority,
        submission_deadline: validatedData.deadline ? new Date(validatedData.deadline).toISOString() : null,
        contract_value: validatedData.contract_value,
        region: validatedData.region,
        description: validatedData.description,
        workflow_type: validatedData.workflow_type,
        current_step: 1,
        status: 'draft'
      })
      .select()
      .single()

    if (workflowError) {
      console.error('Error creating tender workflow:', workflowError)
      return NextResponse.json({ error: 'Failed to create tender' }, { status: 500 })
    }

    // If parsed metadata is provided, store it
    if (validatedData.parsed_metadata) {
      // Prepare evaluation criteria for storage
      const evaluationCriteria = validatedData.parsed_metadata.evaluation_criteria 
        ? validatedData.parsed_metadata.evaluation_criteria.reduce((acc, item) => {
            acc[item.criteria] = item.weight
            return acc
          }, {} as Record<string, number>)
        : {}

      const { error: metadataError } = await supabase
        .from('tender_metadata')
        .insert({
          tender_workflow_id: workflow.id,
          tender_name: validatedData.title,
          issuing_body: validatedData.issuing_authority,
          submission_deadline: validatedData.deadline ? new Date(validatedData.deadline).toISOString() : null,
          contract_value_min: validatedData.contract_value ? Math.round(validatedData.contract_value * 100) : null, // Convert to cents
          evaluation_criteria: evaluationCriteria,
          scoring_weightings: evaluationCriteria, // Store same data in scoring_weightings for compatibility
          compliance_requirements: validatedData.parsed_metadata.compliance_requirements || []
        })

      if (metadataError) {
        console.error('Error storing tender metadata:', metadataError)
        // Continue anyway - metadata is not critical
      }

      // Store key dates separately if needed - for now they go in the workflow
      if (validatedData.parsed_metadata.key_dates && validatedData.parsed_metadata.key_dates.length > 0) {
        // Store additional analytics data about AI extraction
        const { error: analyticsError } = await supabase
          .from('tender_analytics')
          .insert({
            tender_workflow_id: workflow.id,
            team_members: [{
              extraction_confidence: validatedData.parsed_metadata.extraction_confidence || 75,
              document_count: validatedData.parsed_metadata.document_count || 1,
              modified_fields: validatedData.parsed_metadata.modified_fields || [],
              key_dates: validatedData.parsed_metadata.key_dates
            }]
          })

        if (analyticsError) {
          console.error('Error storing AI analytics:', analyticsError)
          // Non-critical, continue
        }
      }
    }

    return NextResponse.json({
      success: true,
      tender_id: workflow.id,
      workflow
    })

  } catch (error) {
    console.error('Error in tender creation:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 