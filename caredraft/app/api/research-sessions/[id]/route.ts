import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/database.types'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(_: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get research session
    const { data: session, error } = await supabase
      .from('research_sessions')
      .select('*')
      .eq('id', id)
      .or(`created_by.eq.${user.id},shared_with.cs.["${user.id}"]`)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Research session not found' }, { status: 404 })
      }
      console.error('Error fetching research session:', error)
      return NextResponse.json({ error: 'Failed to fetch research session' }, { status: 500 })
    }

    return NextResponse.json({ session })

  } catch (error) {
    console.error('Unexpected error in research session GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user has permission to update (must be owner)
    const { data: existingSession, error: fetchError } = await supabase
      .from('research_sessions')
      .select('created_by')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Research session not found' }, { status: 404 })
      }
      console.error('Error checking session ownership:', fetchError)
      return NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 })
    }

    if (existingSession.created_by !== user.id) {
      return NextResponse.json({ error: 'Permission denied: only session owner can update' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { title, query, results, session_metadata } = body

    // Build update object with only provided fields
    const updateData: any = {}
    
    if (title !== undefined) {
      if (title.length > 200) {
        return NextResponse.json({ 
          error: 'Title must be 200 characters or less' 
        }, { status: 400 })
      }
      updateData.title = title
    }

    if (query !== undefined) {
      if (query.length > 2000) {
        return NextResponse.json({ 
          error: 'Query must be 2000 characters or less' 
        }, { status: 400 })
      }
      updateData.query = query
    }

    if (results !== undefined) {
      updateData.results = results
    }

    if (session_metadata !== undefined) {
      updateData.session_metadata = session_metadata
    }

    // Update research session
    const { data: session, error } = await supabase
      .from('research_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating research session:', error)
      return NextResponse.json({ error: 'Failed to update research session' }, { status: 500 })
    }

    return NextResponse.json({ session })

  } catch (error) {
    console.error('Unexpected error in research session PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user has permission to delete (must be owner)
    const { data: existingSession, error: fetchError } = await supabase
      .from('research_sessions')
      .select('created_by')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Research session not found' }, { status: 404 })
      }
      console.error('Error checking session ownership:', fetchError)
      return NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 })
    }

    if (existingSession.created_by !== user.id) {
      return NextResponse.json({ error: 'Permission denied: only session owner can delete' }, { status: 403 })
    }

    // Delete research session
    const { error } = await supabase
      .from('research_sessions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting research session:', error)
      return NextResponse.json({ error: 'Failed to delete research session' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Research session deleted successfully' })

  } catch (error) {
    console.error('Unexpected error in research session DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 