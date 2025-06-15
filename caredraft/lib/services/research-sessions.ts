import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database, ResearchSession, ResearchSessionWithStats } from '@/lib/database.types'

// Response types for API operations
export interface ResearchSessionListResponse {
  sessions: ResearchSessionWithStats[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ResearchSessionResponse {
  session: ResearchSession
}

export interface ShareSessionResponse {
  session: ResearchSession
  message: string
  shared_users: string[]
}

export interface ResearchSessionStats {
  total_sessions: number
  own_sessions: number
  shared_sessions: number
  total_results: number
  avg_results_per_session: number
  recent_activity: {
    sessions_last_7_days: number
    results_last_7_days: number
  }
}

// Search filters for research sessions
export interface ResearchSessionFilters {
  search?: string
  page?: number
  limit?: number
  dateFrom?: string
  dateTo?: string
  hasResults?: boolean
  isShared?: boolean
}

// Client for research session management
class ResearchSessionService {
  private supabase = createClientComponentClient<Database>()

  /**
   * Get list of research sessions with filtering and pagination
   */
  async getResearchSessions(filters: ResearchSessionFilters = {}): Promise<ResearchSessionListResponse> {
    const { search, page = 1, limit = 20 } = filters

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    })

    const response = await fetch(`/api/research-sessions?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch research sessions: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get a specific research session by ID
   */
  async getResearchSession(id: string): Promise<ResearchSessionResponse> {
    const response = await fetch(`/api/research-sessions/${id}`)
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Research session not found')
      }
      throw new Error(`Failed to fetch research session: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Create a new research session
   */
  async createResearchSession(data: {
    title: string
    query: string
    results?: unknown[]
    session_metadata?: Record<string, unknown>
  }): Promise<ResearchSessionResponse> {
    const response = await fetch('/api/research-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to create research session: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Update an existing research session
   */
  async updateResearchSession(
    id: string,
    data: Partial<{
      title: string
      query: string
      results: unknown[]
      session_metadata: Record<string, unknown>
    }>
  ): Promise<ResearchSessionResponse> {
    const response = await fetch(`/api/research-sessions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to update research session: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Delete a research session
   */
  async deleteResearchSession(id: string): Promise<{ message: string }> {
    const response = await fetch(`/api/research-sessions/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to delete research session: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Share a research session with other users
   */
  async shareResearchSession(id: string, userIds: string[]): Promise<ShareSessionResponse> {
    const response = await fetch(`/api/research-sessions/${id}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_ids: userIds }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to share research session: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Remove sharing for specific users
   */
  async unshareResearchSession(id: string, userIds: string[]): Promise<ShareSessionResponse> {
    const response = await fetch(`/api/research-sessions/${id}/share`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_ids: userIds }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to unshare research session: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get research session statistics for the current user
   */
  async getResearchSessionStats(): Promise<ResearchSessionStats> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase.rpc('get_research_session_stats', {
      user_id: user.id
    })

    if (error) {
      throw new Error(`Failed to get research session stats: ${error.message}`)
    }

    return (data as unknown as ResearchSessionStats) || {
      total_sessions: 0,
      own_sessions: 0,
      shared_sessions: 0,
      total_results: 0,
      avg_results_per_session: 0,
      recent_activity: {
        sessions_last_7_days: 0,
        results_last_7_days: 0
      }
    }
  }

  /**
   * Save search results to a research session
   */
  async saveSearchResults(sessionId: string, searchResults: unknown[]): Promise<ResearchSessionResponse> {
    return this.updateResearchSession(sessionId, {
      results: searchResults,
      session_metadata: {
        last_search_timestamp: new Date().toISOString(),
        result_count: searchResults.length
      }
    })
  }

  /**
   * Clone an existing research session
   */
  async cloneResearchSession(id: string, newTitle?: string): Promise<ResearchSessionResponse> {
    const { session } = await this.getResearchSession(id)
    
    return this.createResearchSession({
      title: newTitle || `${session.title} (Copy)`,
      query: session.query,
      results: session.results as unknown[] || [],
      session_metadata: {
        ...session.session_metadata as Record<string, unknown> || {},
        cloned_from: id,
        cloned_at: new Date().toISOString()
      }
    })
  }

  /**
   * Get users in the same organization for sharing
   */
  async getShareableUsers(): Promise<{ id: string; email: string; full_name?: string }[]> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get user's organization
    const { data: profile } = await this.supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      throw new Error('User organization not found')
    }

    // Get other users in the same organization
    const { data: users, error } = await this.supabase
      .from('users')
      .select('id, email, full_name')
      .eq('organization_id', profile.organization_id)
      .neq('id', user.id)

    if (error) {
      throw new Error(`Failed to get organization users: ${error.message}`)
    }

    return users || []
  }

  /**
   * Search research sessions by content
   */
  async searchResearchSessions(query: string, filters: Omit<ResearchSessionFilters, 'search'> = {}): Promise<ResearchSessionListResponse> {
    return this.getResearchSessions({ ...filters, search: query })
  }

  /**
   * Get recent research sessions
   */
  async getRecentResearchSessions(limit: number = 5): Promise<ResearchSessionWithStats[]> {
    const response = await this.getResearchSessions({ limit, page: 1 })
    return response.sessions
  }

  /**
   * Export research session data
   */
  async exportResearchSession(id: string, format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const { session } = await this.getResearchSession(id)
    
    if (format === 'json') {
      const jsonData = JSON.stringify(session, null, 2)
      return new Blob([jsonData], { type: 'application/json' })
    } else {
      // Convert to CSV format
      const results = session.results as unknown[] || []
      if (results.length === 0) {
        return new Blob(['No results to export'], { type: 'text/plain' })
      }

      const headers = Object.keys(results[0] as Record<string, unknown>).join(',')
      const rows = results.map(result => 
        Object.values(result as Record<string, unknown>).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      )
      
      const csvData = [headers, ...rows].join('\n')
      return new Blob([csvData], { type: 'text/csv' })
    }
  }
}

// Export singleton instance
export const researchSessionService = new ResearchSessionService()
export default researchSessionService 