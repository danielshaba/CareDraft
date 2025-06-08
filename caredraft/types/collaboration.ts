// Types for collaboration features - comments, versions, user presence, and mentions

export interface Comment {
  id: string
  section_id: string
  user_id: string
  content: string
  parent_comment_id?: string | null
  text_range_start?: number | null
  text_range_end?: number | null
  is_resolved: boolean
  created_at: string
  updated_at: string
  // Joined data
  user?: {
    id: string
    email?: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
  replies?: Comment[]
}

export interface Version {
  id: string
  section_id: string
  user_id: string
  content_snapshot: string
  version_number: number
  change_summary?: string | null
  word_count: number
  created_at: string
  // Joined data
  user?: {
    id: string
    email?: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export interface UserPresence {
  id: string
  user_id: string
  section_id: string
  cursor_position: number
  selection_start?: number | null
  selection_end?: number | null
  is_active: boolean
  last_seen: string
  created_at: string
  // Joined data
  user?: {
    id: string
    email?: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export interface Mention {
  id: string
  comment_id: string
  mentioned_user_id: string
  mentioning_user_id: string
  is_read: boolean
  created_at: string
  // Joined data
  comment?: Comment
  mentioned_user?: {
    id: string
    email?: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
  mentioning_user?: {
    id: string
    email?: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

// Input types for creating new records
export interface CreateCommentInput {
  section_id: string
  content: string
  parent_comment_id?: string | null
  text_range_start?: number | null
  text_range_end?: number | null
}

export interface CreateVersionInput {
  section_id: string
  content_snapshot: string
  change_summary?: string | null
  word_count?: number
}

export interface UpdateUserPresenceInput {
  section_id: string
  cursor_position: number
  selection_start?: number | null
  selection_end?: number | null
  is_active?: boolean
}

export interface CreateMentionInput {
  comment_id: string
  mentioned_user_id: string
}

// Real-time subscription payload types
export interface RealtimeCommentPayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: Comment
  old?: Comment
}

export interface RealtimeVersionPayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: Version
  old?: Version
}

export interface RealtimePresencePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: UserPresence
  old?: UserPresence
}

export interface RealtimeMentionPayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: Mention
  old?: Mention
}

// Utility types for collaboration features
export interface CollaborationState {
  comments: Comment[]
  versions: Version[]
  activeUsers: UserPresence[]
  mentions: Mention[]
  isLoading: boolean
  error?: string | null
}

export interface CommentThread {
  parentComment: Comment
  replies: Comment[]
  totalReplies: number
}

export interface VersionDiff {
  additions: string[]
  deletions: string[]
  modifications: Array<{
    old: string
    new: string
  }>
}

// User colors for collaborative cursors
export const USER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Light Yellow
  '#BB8FCE', // Light Purple
  '#85C1E9', // Light Blue
] as const

export type UserColor = typeof USER_COLORS[number]

// Helper function to get user color based on user ID
export function getUserColor(userId: string): UserColor {
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length]
}

// Helper function to get user display name
export function getUserDisplayName(user: {
  email?: string
  user_metadata?: {
    full_name?: string
  }
}): string {
  return user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous'
}

// Helper function to format time ago
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }
}

// Helper function to format relative time (alias for formatTimeAgo)
export const formatRelativeTime = formatTimeAgo

// Helper function to format full date time
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
} 