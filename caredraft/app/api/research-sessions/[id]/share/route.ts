import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/database.types'
import { NotificationTriggersService } from '@/lib/services/notification-triggers'

interface Params {
  id: string
}

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if user has permission to share (must be owner)
    const { data: existingSession, error: fetchError } = await supabase
      .from('research_sessions')
      .select('created_by, shared_with')
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
      return NextResponse.json({ error: 'Permission denied: only session owner can share' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { user_ids } = body

    // Validate user_ids
    if (!Array.isArray(user_ids)) {
      return NextResponse.json({ 
        error: 'user_ids must be an array' 
      }, { status: 400 })
    }

    // Validate that all user_ids are valid UUIDs and users exist
    const { data: validUsers, error: userError } = await supabase
      .from('users')
      .select('id')
      .in('id', user_ids)

    if (userError) {
      console.error('Error validating users:', userError)
      return NextResponse.json({ error: 'Failed to validate users' }, { status: 500 })
    }

    const validUserIds = validUsers?.map(u => u.id) || []
    const invalidUserIds = user_ids.filter(id => !validUserIds.includes(id))

    if (invalidUserIds.length > 0) {
      return NextResponse.json({ 
        error: `Invalid user IDs: ${invalidUserIds.join(', ')}` 
      }, { status: 400 })
    }

    // Use database function to update sharing
    const { error } = await supabase.rpc('share_research_session', {
      session_id: id,
      user_ids: user_ids
    })

    if (error) {
      console.error('Error sharing research session:', error)
      return NextResponse.json({ error: 'Failed to share research session' }, { status: 500 })
    }

    // Get updated session
    const { data: updatedSession, error: sessionError } = await supabase
      .from('research_sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (sessionError) {
      console.error('Error fetching updated session:', sessionError)
      return NextResponse.json({ error: 'Failed to fetch updated session' }, { status: 500 })
    }

    // Create notifications for shared users
    try {
      const notificationService = new NotificationTriggersService()
      await notificationService.createResearchSessionSharedNotification({
        sessionId: id,
        sessionTitle: updatedSession.title,
        sharerId: user.id,
        sharedWithUserIds: user_ids,
        queryPreview: updatedSession.query?.substring(0, 100)
      })
    } catch (notificationError) {
      // Don't fail the sharing operation if notifications fail
      console.error('Failed to create sharing notifications:', notificationError)
    }

    return NextResponse.json({ 
      session: updatedSession,
      message: `Session shared with ${user_ids.length} user(s)`,
      shared_users: user_ids
    })

  } catch (error) {
    console.error('Unexpected error in research session share:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if user has permission to unshare (must be owner)
    const { data: existingSession, error: fetchError } = await supabase
      .from('research_sessions')
      .select('created_by, shared_with')
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
      return NextResponse.json({ error: 'Permission denied: only session owner can modify sharing' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { user_ids } = body

    // Validate user_ids
    if (!Array.isArray(user_ids)) {
      return NextResponse.json({ 
        error: 'user_ids must be an array' 
      }, { status: 400 })
    }

    // Get current shared_with array
    const currentSharedWith = (existingSession.shared_with as string[]) || []
    
    // Remove specified users from shared_with array
    const updatedSharedWith = currentSharedWith.filter(userId => !user_ids.includes(userId))

    // Update the research session
    const { data: session, error } = await supabase
      .from('research_sessions')
      .update({ shared_with: updatedSharedWith })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating session sharing:', error)
      return NextResponse.json({ error: 'Failed to update session sharing' }, { status: 500 })
    }

    return NextResponse.json({ 
      session,
      message: `Sharing removed for ${user_ids.length} user(s)`,
      removed_users: user_ids
    })

  } catch (error) {
    console.error('Unexpected error in research session unshare:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 