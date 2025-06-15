'use client'

import React, { useState } from 'react'
import { 
  X, 
  Edit, 
  Save, 
  Share2, 
  Download, 
  Copy, 
  Calendar, 
  Clock, 
  Search,
  ExternalLink,
  FileText,
  ChevronDown,
  FileSpreadsheet,
  FileType,
  FileType2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form-input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingButton } from '@/components/ui/loading-button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ResearchSession } from '@/lib/database.types'
import { useResearchSessionStore } from '@/lib/stores/researchSessionStore'
import { format } from 'date-fns'

interface ResearchSessionViewerProps {
  session: ResearchSession
  onClose?: () => void
  className?: string
}

interface ResearchResult {
  id?: string
  title: string
  url: string
  snippet: string
  source?: string
  date?: string
  relevance_score?: number
}

export function ResearchSessionViewer({
  session,
  onClose,
  className = ''
}: ResearchSessionViewerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(session.title)
  const [editedQuery, setEditedQuery] = useState(session.query)
  
  const { 
    updateSession, 
    setShowShareModal, 
    isLoading 
  } = useResearchSessionStore()

  const results = (session.results as unknown as ResearchResult[]) || []
  const metadata = (session.session_metadata as Record<string, unknown>) || {}

  const handleSaveEdit = async () => {
    if (!editedTitle.trim() || !editedQuery.trim()) return
    
    try {
      await updateSession(session.id, {
        title: editedTitle.trim(),
        query: editedQuery.trim()
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update session:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditedTitle(session.title)
    setEditedQuery(session.query)
    setIsEditing(false)
  }

  const handleShare = () => {
    setShowShareModal(true, session.id)
  }

  const handleExport = async (format: 'json' | 'csv' | 'pdf' | 'docx') => {
    try {
      if (format === 'json' || format === 'csv') {
        // Simple formats - keep existing logic
        const data = {
          session: {
            title: session.title,
            query: session.query,
            created_at: session.created_at,
            updated_at: session.updated_at
          },
          results: results
        }
        
        let content: string
        let mimeType: string
        let filename: string
        
        if (format === 'json') {
          content = JSON.stringify(data, null, 2)
          mimeType = 'application/json'
          filename = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
        } else {
          // Simple CSV export
          const headers = ['Title', 'URL', 'Snippet', 'Source']
          const rows = results.map(result => [
            `"${result.title.replace(/"/g, '""')}"`,
            result.url,
            `"${result.snippet.replace(/"/g, '""')}"`,
            result.source || ''
          ])
          content = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
          mimeType = 'text/csv'
          filename = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`
        }
        
        const blob = new Blob([content], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        // PDF/DOCX exports - use the export service
        const { researchSessionExportService } = await import('@/lib/services/research-session-export')
        
        const exportData = {
          id: session.id,
          title: session.title,
          query: session.query,
          results: results,
          created_at: session.created_at || new Date().toISOString(),
          updated_at: session.updated_at || new Date().toISOString(),
          session_metadata: session.session_metadata as Record<string, unknown> || {},
          user_id: session.created_by
        }

        const exportOptions = {
          format: format as 'pdf' | 'docx',
          includeQuery: true,
          includeMetadata: true,
          includeResultsMetadata: true,
          sortByRelevance: true
        }

        const result = await researchSessionExportService.exportResearchSession(exportData, exportOptions)
        
        if (result.success && result.data) {
          // Download the file
          const url = URL.createObjectURL(result.data.blob)
          const a = document.createElement('a')
          a.href = url
          a.download = result.data.filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        } else {
          console.error('Export failed:', result.error)
          // You might want to show a toast notification here
        }
      }
    } catch (error) {
      console.error('Failed to export session:', error)
      // You might want to show a toast notification here
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You might want to show a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP')
  }

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'pp')
  }

  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-4">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-lg font-semibold"
                  placeholder="Session title..."
                />
                <textarea
                  value={editedQuery}
                  onChange={(e) => setEditedQuery(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                  rows={3}
                  placeholder="Research query..."
                />
                <div className="flex gap-2">
                  <LoadingButton
                    size="sm"
                    onClick={handleSaveEdit}
                    isLoading={isLoading}
                    loadingText="Saving..."
                    className="gap-2"
                  >
                    <Save className="h-3 w-3" />
                    Save
                  </LoadingButton>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-xl font-semibold mb-2">{session.title}</h1>
                <p className="text-muted-foreground text-sm mb-3">{session.query}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Created {formatDate(session.created_at || '')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Updated {formatTime(session.updated_at || '')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>{results.length} results</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="gap-2"
                >
                  <Share2 className="h-3 w-3" />
                  Share
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Download className="h-3 w-3" />
                      Export
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport('json')}>
                      <FileText className="h-4 w-4 mr-2" />
                      JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      CSV
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                      <FileType className="h-4 w-4 mr-2" />
                      PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('docx')}>
                      <FileType2 className="h-4 w-4 mr-2" />
                      DOCX
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {results.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Results Yet</h3>
              <p className="text-muted-foreground text-sm">
                This research session doesn't have any results yet.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Results Summary */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Research Results</h2>
              <Badge variant="secondary">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {/* Results List */}
            <div className="space-y-3">
              {results.map((result, index) => (
                <Card key={result.id || index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-sm line-clamp-2 flex-1">
                        {result.title}
                      </h3>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(result.url)}
                          className="h-6 w-6 p-0"
                          title="Copy URL"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(result.url, '_blank')}
                          className="h-6 w-6 p-0"
                          title="Open in new tab"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                      {result.snippet}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <a 
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary truncate flex-1 mr-2"
                      >
                        {result.url}
                      </a>
                      {result.source && (
                        <Badge variant="outline" className="text-xs">
                          {result.source}
                        </Badge>
                      )}
                    </div>

                    {result.relevance_score && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Relevance:</span>
                          <div className="flex-1 bg-muted rounded-full h-1">
                            <div 
                              className="bg-primary h-1 rounded-full"
                              style={{ width: `${(result.relevance_score || 0) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round((result.relevance_score || 0) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Session Metadata */}
        {Object.keys(metadata).length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Session Details</CardTitle>
            </CardHeader>
            <CardContent className="text-xs">
              <pre className="whitespace-pre-wrap text-muted-foreground">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 