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
    })).optional()
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
      const { error: metadataError } = await supabase
        .from('tender_metadata')
        .insert({
          workflow_id: workflow.id,
          evaluation_criteria: validatedData.parsed_metadata.evaluation_criteria || [],
          compliance_requirements: validatedData.parsed_metadata.compliance_requirements || [],
          key_dates: validatedData.parsed_metadata.key_dates || []
        })

      if (metadataError) {
        console.error('Error storing tender metadata:', metadataError)
        // Continue anyway - metadata is not critical
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