'use client'

import React, { useEffect, useState } from 'react'
import { 
  Search, 
  Plus, 
  Calendar, 
  Share2, 
  Trash2, 
  Filter,
  ChevronDown,
  Clock,
  FileText,
  Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form-input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorDisplay } from '@/components/ui/error-display'
import { useResearchSessionStore } from '@/lib/stores/researchSessionStore'
import { ResearchSession } from '@/lib/database.types'
import { format } from 'date-fns'

interface ResearchSessionSidebarProps {
  onSessionSelect?: (session: ResearchSession) => void
  selectedSessionId?: string | null
  className?: string
}

export function ResearchSessionSidebar({
  onSessionSelect,
  selectedSessionId,
  className = ''
}: ResearchSessionSidebarProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [localSearch, setLocalSearch] = useState('')
  
  const {
    sessions,
    stats,
    isLoading,
    error,
    selectedSessionIds,
    filters,
    pagination,
    loadSessions,
    loadStats,
    deleteSession,
    duplicateSession,
    clearSelection,
    setShowCreateModal,
    setShowShareModal,
    setFilters,
    resetFilters,
    setPage
  } = useResearchSessionStore()

  // Load sessions and stats on mount
  useEffect(() => {
    loadSessions()
    loadStats()
  }, [loadSessions, loadStats])

  // Handle search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: localSearch })
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch, setFilters])

  const handleSessionClick = (session: ResearchSession) => {
    onSessionSelect?.(session)
  }

  const handleDeleteSession = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (confirm('Are you sure you want to delete this research session?')) {
      await deleteSession(sessionId)
    }
  }

  const handleDuplicateSession = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    await duplicateSession(sessionId)
  }

  const handleShareSession = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setShowShareModal(true, sessionId)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy')
  }

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm')
  }

  const getResultCount = (session: ResearchSession) => {
    const results = session.results as unknown[] | null
    return results?.length || 0
  }

  const getQueryPreview = (query: string) => {
    return query.length > 60 ? `${query.substring(0, 60)}...` : query
  }

  if (error) {
    return (
      <div className={`w-80 border-r bg-background ${className}`}>
        <div className="p-4">
          <ErrorDisplay 
            error={error}
            onRetry={() => loadSessions()}
            className="h-full"
          />
        </div>
      </div>
    )
  }

  return (
    <div className={`w-80 border-r bg-background flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Research Sessions</h2>
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-lg font-semibold">{stats.total_sessions}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-lg font-semibold">{stats.recent_activity.sessions_last_7_days}</div>
              <div className="text-xs text-muted-foreground">This Week</div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </Button>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mt-3">
            <CardContent className="p-3 space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Sort by</label>
                <select 
                  className="w-full text-sm border rounded px-2 py-1"
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ sortBy: e.target.value as any })}
                >
                  <option value="updated_at">Last Updated</option>
                  <option value="created_at">Created Date</option>
                  <option value="title">Title</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Order</label>
                <select 
                  className="w-full text-sm border rounded px-2 py-1"
                  value={filters.sortOrder}
                  onChange={(e) => setFilters({ sortOrder: e.target.value as any })}
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="w-full"
              >
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-3">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No research sessions found</p>
            <p className="text-xs mt-1">Create your first session to get started</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {sessions.map((session) => (
              <Card 
                key={session.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedSessionId === session.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleSessionClick(session)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm line-clamp-2 flex-1">
                      {session.title}
                    </h3>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleShareSession(session.id, e)}
                        className="h-6 w-6 p-0"
                      >
                        <Share2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDuplicateSession(session.id, e)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {getQueryPreview(session.query)}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(session.created_at || '')}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {getResultCount(session)} results
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Updated {formatTime(session.updated_at || '')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPage(pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPage(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedSessionIds.length > 0 && (
        <div className="p-4 border-t bg-muted">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {selectedSessionIds.length} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="text-xs"
            >
              Clear
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowShareModal(true)}
            >
              <Share2 className="h-3 w-3 mr-1" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 