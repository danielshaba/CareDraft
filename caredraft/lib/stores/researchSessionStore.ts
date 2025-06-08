import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { ResearchSession } from '@/lib/database.types'
import { 
  researchSessionService, 
  ResearchSessionListResponse,
  ResearchSessionFilters as ServiceFilters,
  ResearchSessionStats
} from '@/lib/services/research-sessions'

export interface ResearchSessionFilters {
  search: string
  sortBy: 'created_at' | 'updated_at' | 'title'
  sortOrder: 'asc' | 'desc'
  dateRange: {
    from?: Date
    to?: Date
  }
}

export interface ResearchSessionStore {
  // Data State
  sessions: ResearchSession[]
  currentSession: ResearchSession | null
  stats: ResearchSessionStats | null
  
  // UI State
  isLoading: boolean
  error: string | null
  selectedSessionIds: string[]
  showCreateModal: boolean
  showShareModal: boolean
  shareSessionId: string | null
  filters: ResearchSessionFilters
  
  // Pagination
  pagination: {
    page: number
    limit: number
    totalPages: number
    totalCount: number
  }
  
  // Actions - Data Management
  loadSessions: (page?: number) => Promise<void>
  createSession: (data: { title: string; query: string; results?: unknown[]; session_metadata?: Record<string, unknown> }) => Promise<void>
  updateSession: (id: string, data: Partial<{ title: string; query: string; results: unknown[]; session_metadata: Record<string, unknown> }>) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  duplicateSession: (id: string) => Promise<void>
  
  // Actions - Session Management
  setCurrentSession: (session: ResearchSession | null) => void
  loadSessionById: (id: string) => Promise<ResearchSession | null>
  
  // Actions - Sharing
  shareSession: (sessionId: string, userIds: string[]) => Promise<void>
  removeSharing: (sessionId: string, userIds: string[]) => Promise<void>
  
  // Actions - Statistics
  loadStats: () => Promise<void>
  
  // Actions - UI State
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSelectedSessions: (ids: string[]) => void
  toggleSessionSelection: (id: string) => void
  clearSelection: () => void
  setShowCreateModal: (show: boolean) => void
  setShowShareModal: (show: boolean, sessionId?: string) => void
  setFilters: (filters: Partial<ResearchSessionFilters>) => void
  resetFilters: () => void
  
  // Actions - Pagination
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  
  // Actions - Bulk Operations
  deleteSelectedSessions: () => Promise<void>
  exportSessions: (sessionIds: string[], format: 'json' | 'csv') => Promise<void>
}

const defaultFilters: ResearchSessionFilters = {
  search: '',
  sortBy: 'updated_at',
  sortOrder: 'desc',
  dateRange: {}
}

const defaultPagination = {
  page: 1,
  limit: 10,
  totalPages: 1,
  totalCount: 0
}

export const useResearchSessionStore = create<ResearchSessionStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      sessions: [],
      currentSession: null,
      stats: null,
      isLoading: false,
      error: null,
      selectedSessionIds: [],
      showCreateModal: false,
      showShareModal: false,
      shareSessionId: null,
      filters: defaultFilters,
      pagination: defaultPagination,
      
      // Data Management Actions
      loadSessions: async (page?: number) => {
        const state = get()
        const currentPage = page ?? state.pagination.page
        
        set({ isLoading: true, error: null })
        
        try {
          const serviceFilters: ServiceFilters = {
            page: currentPage,
            limit: state.pagination.limit
          }
          
          if (state.filters.search) {
            serviceFilters.search = state.filters.search
          }
          
          const response = await researchSessionService.getResearchSessions(serviceFilters)
          
          set({
            sessions: response.sessions.map(s => s as unknown as ResearchSession),
            pagination: {
              page: currentPage,
              limit: state.pagination.limit,
              totalPages: response.pagination.totalPages,
              totalCount: response.pagination.total
            },
            isLoading: false
          })
        } catch {
          console.error('Failed to load sessions:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to load sessions',
            isLoading: false
          })
        }
      },
      
      createSession: async (data) => {
        set({ isLoading: true, error: null })
        
        try {
          await researchSessionService.createResearchSession(data)
          
          // Reload sessions to get updated list
          await get().loadSessions()
          
          set({ isLoading: false, showCreateModal: false })
        } catch {
          console.error('Failed to create session:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to create session',
            isLoading: false
          })
        }
      },
      
      updateSession: async (id, data) => {
        set({ isLoading: true, error: null })
        
        try {
          await researchSessionService.updateResearchSession(id, data)
          
          // Update local state
          const state = get()
          const updatedSessions = state.sessions.map(session =>
            session.id === id ? { ...session, ...data } : session
          )
          
          set({
            sessions: updatedSessions,
            currentSession: state.currentSession?.id === id 
              ? { ...state.currentSession, ...data }
              : state.currentSession,
            isLoading: false
          })
        } catch {
          console.error('Failed to update session:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to update session',
            isLoading: false
          })
        }
      },
      
      deleteSession: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
          await researchSessionService.deleteResearchSession(id)
          
          // Update local state
          const state = get()
          const filteredSessions = state.sessions.filter(session => session.id !== id)
          
          set({
            sessions: filteredSessions,
            currentSession: state.currentSession?.id === id ? null : state.currentSession,
            selectedSessionIds: state.selectedSessionIds.filter(selectedId => selectedId !== id),
            isLoading: false
          })
        } catch {
          console.error('Failed to delete session:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to delete session',
            isLoading: false
          })
        }
      },
      
      duplicateSession: async (id) => {
        const state = get()
        const originalSession = state.sessions.find(s => s.id === id)
        
        if (!originalSession) {
          set({ error: 'Session not found' })
          return
        }
        
        const duplicateData = {
          title: `${originalSession.title} (Copy)`,
          query: originalSession.query,
          results: originalSession.results as unknown[],
          session_metadata: originalSession.session_metadata as Record<string, unknown>
        }
        
        await get().createSession(duplicateData)
      },
      
      // Session Management Actions
      setCurrentSession: (session) => {
        set({ currentSession: session })
      },
      
      loadSessionById: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await researchSessionService.getResearchSession(id)
          const session = response.session
          
          set({ 
            currentSession: session,
            isLoading: false 
          })
          
          return session
        } catch {
          console.error('Failed to load session:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to load session',
            isLoading: false
          })
          return null
        }
      },
      
      // Sharing Actions
      shareSession: async (sessionId, userIds) => {
        set({ isLoading: true, error: null })
        
        try {
          await researchSessionService.shareResearchSession(sessionId, userIds)
          
          // Reload sessions to get updated sharing info
          await get().loadSessions()
          
          set({ 
            isLoading: false,
            showShareModal: false,
            shareSessionId: null
          })
        } catch {
          console.error('Failed to share session:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to share session',
            isLoading: false
          })
        }
      },
      
      removeSharing: async (sessionId, userIds) => {
        set({ isLoading: true, error: null })
        
        try {
          await researchSessionService.unshareResearchSession(sessionId, userIds)
          
          // Reload sessions to get updated sharing info
          await get().loadSessions()
          
          set({ isLoading: false })
        } catch {
          console.error('Failed to remove sharing:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to remove sharing',
            isLoading: false
          })
        }
      },
      
      // Statistics Actions
      loadStats: async () => {
        try {
          const stats = await researchSessionService.getResearchSessionStats()
          set({ stats })
        } catch {
          console.error('Failed to load stats:', error)
        }
      },
      
      // UI State Actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      
      setSelectedSessions: (ids) => set({ selectedSessionIds: ids }),
      
      toggleSessionSelection: (id) => {
        const state = get()
        const isSelected = state.selectedSessionIds.includes(id)
        const newSelection = isSelected
          ? state.selectedSessionIds.filter(selectedId => selectedId !== id)
          : [...state.selectedSessionIds, id]
        
        set({ selectedSessionIds: newSelection })
      },
      
      clearSelection: () => set({ selectedSessionIds: [] }),
      
      setShowCreateModal: (show) => set({ showCreateModal: show }),
      
      setShowShareModal: (show, sessionId) => set({ 
        showShareModal: show, 
        shareSessionId: sessionId || null 
      }),
      
      setFilters: (newFilters) => {
        const state = get()
        const updatedFilters = { ...state.filters, ...newFilters }
        
        set({ 
          filters: updatedFilters,
          pagination: { ...state.pagination, page: 1 } // Reset to first page when filtering
        })
        
        // Auto-reload sessions when filters change
        get().loadSessions(1)
      },
      
      resetFilters: () => {
        set({ 
          filters: defaultFilters,
          pagination: { ...get().pagination, page: 1 }
        })
        get().loadSessions(1)
      },
      
      // Pagination Actions
      setPage: (page) => {
        set(state => ({
          pagination: { ...state.pagination, page }
        }))
        get().loadSessions(page)
      },
      
      setLimit: (limit) => {
        set(state => ({
          pagination: { ...state.pagination, limit, page: 1 }
        }))
        get().loadSessions(1)
      },
      
      // Bulk Operations
      deleteSelectedSessions: async () => {
        const state = get()
        const sessionIds = state.selectedSessionIds
        
        if (sessionIds.length === 0) return
        
        set({ isLoading: true, error: null })
        
        try {
          await Promise.all(sessionIds.map(id => researchSessionService.deleteResearchSession(id)))
          
          // Reload sessions
          await get().loadSessions()
          
          set({ 
            selectedSessionIds: [],
            isLoading: false
          })
        } catch {
          console.error('Failed to delete sessions:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to delete sessions',
            isLoading: false
          })
        }
      },
      
      exportSessions: async (sessionIds, format) => {
        set({ isLoading: true, error: null })
        
        try {
          // Export each session individually since service doesn't have bulk export
          for (const sessionId of sessionIds) {
            const blob = await researchSessionService.exportResearchSession(sessionId, format)
            const session = await researchSessionService.getResearchSession(sessionId)
            
            // Trigger download
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${session.session.title}.${format}`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }
          
          set({ isLoading: false })
        } catch {
          console.error('Failed to export sessions:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to export sessions',
            isLoading: false
          })
        }
      }
    }),
    {
      name: 'research-session-store'
    }
  )
) 