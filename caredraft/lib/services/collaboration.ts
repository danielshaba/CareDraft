// Stub implementation for collaboration services
// This is a placeholder until the comments and versions tables are added to the database

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

export interface CreateCommentInput {
  section_id: string
  content: string
  parent_comment_id?: string | null
  text_range_start?: number | null
  text_range_end?: number | null
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
  user?: {
    id: string
    email?: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export interface CreateVersionInput {
  section_id: string
  content_snapshot: string
  change_summary?: string | null
  word_count?: number
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
  user?: {
    id: string
    email?: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export interface UpdateUserPresenceInput {
  section_id: string
  cursor_position: number
  selection_start?: number | null
  selection_end?: number | null
  is_active?: boolean
}

export class CommentsService {
  static async getCommentsBySection(_sectionId: string): Promise<Comment[]> {
    console.log('Stub: getCommentsBySection called')
    return []
  }

  static async createComment(_input: CreateCommentInput): Promise<Comment> {
    console.log('Stub: createComment called')
    return {
      id: 'stub-comment-id',
      section_id: 'stub-section-id',
      user_id: 'stub-user-id',
      content: 'Stub comment',
      parent_comment_id: null,
      text_range_start: null,
      text_range_end: null,
      is_resolved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  static async updateComment(_commentId: string, _content: string): Promise<Comment> {
    console.log('Stub: updateComment called')
    return {
      id: 'stub-comment-id',
      section_id: 'stub-section-id',
      user_id: 'stub-user-id',
      content: 'Updated stub comment',
      parent_comment_id: null,
      text_range_start: null,
      text_range_end: null,
      is_resolved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  static async deleteComment(_commentId: string): Promise<void> {
    console.log('Stub: deleteComment called')
  }

  static async resolveComment(_commentId: string): Promise<Comment> {
    console.log('Stub: resolveComment called')
    return {
      id: 'stub-comment-id',
      section_id: 'stub-section-id',
      user_id: 'stub-user-id',
      content: 'Resolved stub comment',
      parent_comment_id: null,
      text_range_start: null,
      text_range_end: null,
      is_resolved: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  static async toggleCommentResolution(_commentId: string, _isResolved: boolean): Promise<Comment> {
    console.log('Stub: toggleCommentResolution called')
    return {
      id: 'stub-comment-id',
      section_id: 'stub-section-id',
      user_id: 'stub-user-id',
      content: 'Toggled resolution stub comment',
      parent_comment_id: null,
      text_range_start: null,
      text_range_end: null,
      is_resolved: _isResolved,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
}

export class VersionsService {
  static async getVersionsBySection(_sectionId: string): Promise<Version[]> {
    console.log('Stub: getVersionsBySection called')
    return []
  }

  static async createVersion(input: CreateVersionInput): Promise<Version> {
    console.log('Stub: createVersion called')
    return {
      id: 'stub-version-id',
      section_id: input.section_id,
      user_id: 'stub-user-id',
      content_snapshot: input.content_snapshot,
      version_number: 1,
      change_summary: input.change_summary || null,
      word_count: input.word_count || 10,
      created_at: new Date().toISOString()
    }
  }

  static async restoreVersion(_versionId: string): Promise<Version> {
    console.log('Stub: restoreVersion called')
    return {
      id: 'stub-version-id',
      section_id: 'stub-section-id',
      user_id: 'stub-user-id',
      content_snapshot: 'Restored stub version content',
      version_number: 1,
      change_summary: null,
      word_count: 15,
      created_at: new Date().toISOString()
    }
  }

  static async compareVersions(_versionId1: string, _versionId2: string): Promise<{
    additions: string[]
    deletions: string[]
    changes: string[]
  }> {
    console.log('Stub: compareVersions called')
    return {
      additions: [],
      deletions: [],
      changes: []
    }
  }
}

export class RealTimeService {
  static async subscribeToSection(_sectionId: string, _callback: (event: any) => void): Promise<() => void> {
    console.log('Stub: subscribeToSection called')
    return () => console.log('Stub: unsubscribe called')
  }

  static async broadcastPresence(_sectionId: string, _presence: any): Promise<void> {
    console.log('Stub: broadcastPresence called')
  }

  static async subscribeToPresence(_sectionId: string, _callback: (presences: any[]) => void): Promise<() => void> {
    console.log('Stub: subscribeToPresence called')
    return () => console.log('Stub: unsubscribe presence called')
  }
}

export class UserPresenceService {
  static async getActiveUsers(_sectionId: string): Promise<UserPresence[]> {
    console.log('Stub: getActiveUsers called')
    return []
  }

  static async updatePresence(_input: UpdateUserPresenceInput): Promise<UserPresence> {
    console.log('Stub: updatePresence called')
    return {
      id: 'stub-presence-id',
      user_id: 'stub-user-id',
      section_id: 'stub-section-id',
      cursor_position: 0,
      selection_start: null,
      selection_end: null,
      is_active: true,
      last_seen: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
  }

  static async setInactive(_sectionId: string): Promise<void> {
    console.log('Stub: setInactive called')
  }

  static subscribeToPresence(
    _sectionId: string,
    _callback: (payload: any) => void
  ): any {
    console.log('Stub: subscribeToPresence called')
    // Return a mock RealtimeChannel-like object
    return {
      unsubscribe: () => console.log('Stub: unsubscribe presence called'),
      // Add other required properties as empty/stub values
      topic: 'stub-topic',
      params: {},
      socket: null,
      bindings: [],
      timeout: 10000,
      joinedOnce: false,
      joinRef: null,
      pushBuffer: [],
      stateChangeCallbacks: {},
      rejoinTimer: null,
      state: 'closed',
      // Add stub methods
      join: () => ({ receive: () => ({}) }),
      leave: () => ({ receive: () => ({}) }),
      onClose: () => ({}),
      onError: () => ({}),
      on: () => ({}),
      off: () => ({}),
      canPush: () => false,
      push: () => ({ receive: () => ({}) }),
      updateJoinPayload: () => ({}),
      rejoin: () => ({}),
      trigger: () => ({}),
      replyEventName: () => 'stub-reply',
      isClosed: () => true,
      isErrored: () => false,
      isJoined: () => false,
      isJoining: () => false,
      isLeaving: () => false
    }
  }
} 