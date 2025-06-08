import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/database.types'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || undefined
    const offset = (page - 1) * limit

    // Use database function to get user's research sessions
    const { data: sessions, error } = await supabase.rpc('get_user_research_sessions', {
      user_id: user.id,
      page_size: limit,
      page_offset: offset,
      search_query: search
    })

    if (error) {
      console.error('Error fetching research sessions:', error)
      return NextResponse.json({ error: 'Failed to fetch research sessions' }, { status: 500 })
    }

    // Get total count for pagination
    let totalCount = 0
    const { count } = await supabase
      .from('research_sessions')
      .select('*', { count: 'exact', head: true })
      .or(`created_by.eq.${user.id},shared_with.cs.["${user.id}"]`)

    totalCount = count || 0

    return NextResponse.json({
      sessions: sessions || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: offset + limit < totalCount,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Unexpected error in research sessions GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 400 })
    }

    // Parse request body
    const body = await request.json()
    const { title, query, results = [], session_metadata = {} } = body

    // Validate required fields
    if (!title || !query) {
      return NextResponse.json({ 
        error: 'Missing required fields: title and query are required' 
      }, { status: 400 })
    }

    // Validate field lengths
    if (title.length > 200) {
      return NextResponse.json({ 
        error: 'Title must be 200 characters or less' 
      }, { status: 400 })
    }

    if (query.length > 2000) {
      return NextResponse.json({ 
        error: 'Query must be 2000 characters or less' 
      }, { status: 400 })
    }

    // Create research session
    const { data: session, error } = await supabase
      .from('research_sessions')
      .insert({
        title,
        query,
        results,
        session_metadata,
        created_by: user.id,
        organization_id: profile.organization_id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating research session:', error)
      return NextResponse.json({ error: 'Failed to create research session' }, { status: 500 })
    }

    return NextResponse.json({ session }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error in research sessions POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 