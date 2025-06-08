// Collaboration service for handling comments, versions, user presence, and mentions
import { createClient } from '@/lib/supabase'
import type {
  Comment,
  Version,
  UserPresence,
  Mention,
  CreateCommentInput,
  CreateVersionInput,
  UpdateUserPresenceInput,
  CreateMentionInput,
  RealtimeCommentPayload,
  RealtimeVersionPayload,
  RealtimePresencePayload,
  RealtimeMentionPayload
} from '@/types/collaboration'

const supabase = createClient()

// Comments Service
export class CommentsService {
  // Get all comments for a section with user data and replies
  static async getCommentsBySection(sectionId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:auth.users(id, email, user_metadata),
        replies:comments!parent_comment_id(
          *,
          user:auth.users(id, email, user_metadata)
        )
      `)
      .eq('section_id', sectionId)
      .is('parent_comment_id', null) // Only get top-level comments
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      throw error
    }

    return data || []
  }

  // Create a new comment
  static async createComment(input: CreateCommentInput): Promise<Comment> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('comments')
      .insert({
        ...input,
        user_id: user.id
      })
      .select(`
        *,
        user:auth.users(id, email, user_metadata)
      `)
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      throw error
    }

    // Create mentions from comment content
    try {
      await MentionsService.createMentionsFromComment(data.id, input.content)
    } catch (mentionError) {
      console.error('Error creating mentions:', mentionError)
      // Don't fail the comment creation if mentions fail
    }

    return data
  }

  // Update a comment
  static async updateComment(commentId: string, content: string): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .update({ content })
      .eq('id', commentId)
      .select(`
        *,
        user:auth.users(id, email, user_metadata)
      `)
      .single()

    if (error) {
      console.error('Error updating comment:', error)
      throw error
    }

    return data
  }

  // Resolve/unresolve a comment
  static async toggleCommentResolution(commentId: string, isResolved: boolean): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .update({ is_resolved: isResolved })
      .eq('id', commentId)
      .select(`
        *,
        user:auth.users(id, email, user_metadata)
      `)
      .single()

    if (error) {
      console.error('Error toggling comment resolution:', error)
      throw error
    }

    return data
  }

  // Delete a comment
  static async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      console.error('Error deleting comment:', error)
      throw error
    }
  }

  // Subscribe to real-time comment changes for a section
  static subscribeToComments(
    sectionId: string,
    callback: (payload: RealtimeCommentPayload) => void
  ) {
    return supabase
      .channel(`comments:${sectionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `section_id=eq.${sectionId}`
        },
        (payload: unknown) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new as Comment,
            old: payload.old as Comment
          })
        }
      )
      .subscribe()
  }
}

// Versions Service
export class VersionsService {
  // Get all versions for a section
  static async getVersionsBySection(sectionId: string): Promise<Version[]> {
    const { data, error } = await supabase
      .from('versions')
      .select(`
        *,
        user:auth.users(id, email, user_metadata)
      `)
      .eq('section_id', sectionId)
      .order('version_number', { ascending: false })

    if (error) {
      console.error('Error fetching versions:', error)
      throw error
    }

    return data || []
  }

  // Create a new version
  static async createVersion(input: CreateVersionInput): Promise<Version> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Calculate word count if not provided
    const wordCount = input.word_count || 
      input.content_snapshot.trim().split(/\s+/).filter(word => word.length > 0).length

    const { data, error } = await supabase
      .from('versions')
      .insert({
        ...input,
        user_id: user.id,
        word_count: wordCount
      })
      .select(`
        *,
        user:auth.users(id, email, user_metadata)
      `)
      .single()

    if (error) {
      console.error('Error creating version:', error)
      throw error
    }

    return data
  }

  // Get a specific version
  static async getVersion(versionId: string): Promise<Version> {
    const { data, error } = await supabase
      .from('versions')
      .select(`
        *,
        user:auth.users(id, email, user_metadata)
      `)
      .eq('id', versionId)
      .single()

    if (error) {
      console.error('Error fetching version:', error)
      throw error
    }

    return data
  }

  // Subscribe to real-time version changes for a section
  static subscribeToVersions(
    sectionId: string,
    callback: (payload: RealtimeVersionPayload) => void
  ) {
    return supabase
      .channel(`versions:${sectionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'versions',
          filter: `section_id=eq.${sectionId}`
        },
        (payload: unknown) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new as Version,
            old: payload.old as Version
          })
        }
      )
      .subscribe()
  }
}

// User Presence Service
export class UserPresenceService {
  // Get active users for a section
  static async getActiveUsers(sectionId: string): Promise<UserPresence[]> {
    const { data, error } = await supabase
      .from('user_presence')
      .select(`
        *,
        user:auth.users(id, email, user_metadata)
      `)
      .eq('section_id', sectionId)
      .eq('is_active', true)
      .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Active in last 5 minutes

    if (error) {
      console.error('Error fetching active users:', error)
      throw error
    }

    return data || []
  }

  // Update user presence
  static async updatePresence(input: UpdateUserPresenceInput): Promise<UserPresence> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('user_presence')
      .upsert({
        user_id: user.id,
        ...input
      })
      .select(`
        *,
        user:auth.users(id, email, user_metadata)
      `)
      .single()

    if (error) {
      console.error('Error updating presence:', error)
      throw error
    }

    return data
  }

  // Set user as inactive
  static async setInactive(sectionId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('user_presence')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('section_id', sectionId)

    if (error) {
      console.error('Error setting user inactive:', error)
    }
  }

  // Subscribe to real-time presence changes for a section
  static subscribeToPresence(
    sectionId: string,
    callback: (payload: RealtimePresencePayload) => void
  ) {
    return supabase
      .channel(`presence:${sectionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `section_id=eq.${sectionId}`
        },
        (payload: unknown) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new as UserPresence,
            old: payload.old as UserPresence
          })
        }
      )
      .subscribe()
  }
}

// Mentions Service
export class MentionsService {
  // Get mentions for the current user
  static async getUserMentions(): Promise<Mention[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('mentions')
      .select(`
        *,
        comment:comments(*),
        mentioned_user:auth.users!mentioned_user_id(id, email, user_metadata),
        mentioning_user:auth.users!mentioning_user_id(id, email, user_metadata)
      `)
      .eq('mentioned_user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching mentions:', error)
      throw error
    }

    return data || []
  }

  // Create a mention
  static async createMention(input: CreateMentionInput): Promise<Mention> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('mentions')
      .insert({
        ...input,
        mentioning_user_id: user.id
      })
      .select(`
        *,
        comment:comments(*),
        mentioned_user:auth.users!mentioned_user_id(id, email, user_metadata),
        mentioning_user:auth.users!mentioning_user_id(id, email, user_metadata)
      `)
      .single()

    if (error) {
      console.error('Error creating mention:', error)
      throw error
    }

    return data
  }

  // Create mentions from comment content
  static async createMentionsFromComment(commentId: string, content: string): Promise<Mention[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Extract @mentions from content
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g
    const mentions: string[] = []
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1])
    }

    if (mentions.length === 0) return []

    // Find users by display names
    const mentionPromises = mentions.map(async (mentionName) => {
      const users = await searchUsers(mentionName)
      return users[0] // Take the first match
    })

    const mentionedUsers = (await Promise.all(mentionPromises)).filter(Boolean)

    // Create mention records
    const mentionData = mentionedUsers.map(mentionedUser => ({
      comment_id: commentId,
      mentioned_user_id: mentionedUser.id,
      mentioning_user_id: user.id,
      is_read: false
    }))

    if (mentionData.length === 0) return []

    const { data, error } = await supabase
      .from('mentions')
      .insert(mentionData)
      .select(`
        *,
        comment:comments(*),
        mentioned_user:auth.users!mentioned_user_id(id, email, user_metadata),
        mentioning_user:auth.users!mentioning_user_id(id, email, user_metadata)
      `)

    if (error) {
      console.error('Error creating mentions:', error)
      throw error
    }

    return data || []
  }

  // Mark mention as read
  static async markMentionAsRead(mentionId: string): Promise<void> {
    const { error } = await supabase
      .from('mentions')
      .update({ is_read: true })
      .eq('id', mentionId)

    if (error) {
      console.error('Error marking mention as read:', error)
      throw error
    }
  }

  // Subscribe to real-time mentions for the current user
  static subscribeToMentions(callback: (payload: RealtimeMentionPayload) => void) {
    return supabase.auth.getUser().then(({ data: { user } }: { data: { user: unknown } }) => {
      if (!user) return null

      return supabase
        .channel(`mentions:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'mentions',
            filter: `mentioned_user_id=eq.${user.id}`
          },
          (payload: unknown) => {
            callback({
              eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              new: payload.new as Mention,
              old: payload.old as Mention
            })
          }
        )
        .subscribe()
    })
  }
}

// Utility function to parse mentions from comment content
export function parseMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1])
  }

  return mentions
}

// Utility function to search users for mentions
export async function searchUsers(query: string): Promise<Array<{
  id: string
  email: string
  full_name?: string
}>> {
  const { data, error } = await supabase
    .from('auth.users')
    .select('id, email, user_metadata')
    .or(`email.ilike.%${query}%,user_metadata->>full_name.ilike.%${query}%`)
    .limit(10)

  if (error) {
    console.error('Error searching users:', error)
    return []
  }

  return data?.map((user: unknown) => ({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name
  })) || []
} 