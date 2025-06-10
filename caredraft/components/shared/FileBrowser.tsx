'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  File, 
  Download, 
  Trash2, 
  MoreVertical, 
  Folder,
  Search,
  RefreshCw,
  Calendar,
  FileText
} from 'lucide-react'
import { 
  listFiles, 
  deleteFile, 
  createSignedUrl,
  getPublicUrl,
  STORAGE_BUCKETS,
  type StorageBucket
} from '@/lib/storage'
import { useUser } from '@/components/providers/MinimalAuthProvider'
import { useToast } from '@/components/ui/toast'

// Define FileMetadata type based on Supabase storage response
interface FileMetadata {
  name: string
  id?: string
  updated_at?: string
  created_at?: string
  last_accessed_at?: string
  size?: number
  metadata?: Record<string, unknown>
}

interface FileBrowserProps {
  bucket: StorageBucket
  className?: string
  onFileSelect?: (file: FileMetadata) => void
  showActions?: boolean
  allowDelete?: boolean
}

interface FileItemProps {
  file: FileMetadata
  onDownload: (file: FileMetadata) => void
  onDelete?: (file: FileMetadata) => void
  onSelect?: (file: FileMetadata) => void
  showActions: boolean
  allowDelete: boolean
}

function FileItem({ 
  file, 
  onDownload, 
  onDelete, 
  onSelect, 
  showActions, 
  allowDelete 
}: FileItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = () => {
    const extension = file.name.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-600" />
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-brand-600" />
      case 'txt':
      case 'md':
        return <FileText className="h-5 w-5 text-gray-600" />
      default:
        return <File className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-shrink-0">
        {getFileIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onSelect?.(file)}
            className="text-sm font-medium text-gray-900 hover:text-brand-600 transition-colors truncate"
          >
            {file.name}
          </button>
          
          {showActions && (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              
              {isMenuOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onDownload(file)
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                    
                    {allowDelete && onDelete && (
                      <button
                        onClick={() => {
                          onDelete(file)
                          setIsMenuOpen(false)
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
          <span>{formatFileSize(file.size || 0)}</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(file.updated_at || '')}
          </span>
        </div>
      </div>
    </div>
  )
}

export function FileBrowser({
  bucket,
  className = '',
  onFileSelect,
  showActions = true,
  allowDelete = false
}: FileBrowserProps) {
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const user = useUser()

  const loadFiles = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const result = await listFiles(bucket, user.id)
      
      if (result.error) {
        throw new Error(result.error)
      }

      setFiles(result.data || [])
    } catch {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load files'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [bucket, user])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  const handleDownload = useCallback(async (file: FileMetadata) => {
    if (!user) return

    try {
      // For public buckets, use public URL
      const publicUrl = getPublicUrl(bucket, file.name)
      if (publicUrl) {
        const link = document.createElement('a')
        link.href = publicUrl
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success(`Downloaded ${file.name}`)
        return
      }

      // For private buckets, create signed URL
      const signedUrlResult = await createSignedUrl(bucket, file.name, 3600)
      
      if (signedUrlResult.error) {
        throw new Error(signedUrlResult.error)
      }

      if (signedUrlResult.data?.signedUrl) {
        const link = document.createElement('a')
        link.href = signedUrlResult.data.signedUrl
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success(`Downloaded ${file.name}`)
      }
    } catch {
      const errorMessage = err instanceof Error ? err.message : 'Download failed'
      toast.error(errorMessage)
    }
  }, [bucket, user])

  const handleDelete = useCallback(async (file: FileMetadata) => {
    if (!user) return

    if (!confirm(`Are you sure you want to delete "${file.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const result = await deleteFile(bucket, file.name)
      
      if (result.error) {
        throw new Error(result.error)
      }

      setFiles(prev => prev.filter(f => f.name !== file.name))
      toast.success(`Deleted ${file.name}`)
    } catch {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed'
      toast.error(errorMessage)
    }
  }, [bucket, user])

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getBucketDisplayName = () => {
    switch (bucket) {
      case STORAGE_BUCKETS.TENDER_DOCUMENTS:
        return 'Tender Documents'
      case STORAGE_BUCKETS.EXPORTS:
        return 'Exports'
      case STORAGE_BUCKETS.KNOWLEDGE_BASE:
        return 'Knowledge Base'
      default:
        return 'Files'
    }
  }

  if (!user) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <p className="text-gray-500">Please sign in to view files</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">
            {getBucketDisplayName()}
          </h3>
        </div>
        
        <button
          onClick={loadFiles}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading files...</span>
        </div>
      ) : error ? (
        <div className="p-6 text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={loadFiles}
            className="text-brand-600 hover:text-brand-700 transition-colors"
          >
            Try again
          </button>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="p-6 text-center">
          <File className="mx-auto h-12 w-12 text-gray-400 mb-2" />
          <p className="text-gray-500">
            {searchTerm ? 'No files match your search' : 'No files uploaded yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFiles.map((file) => (
            <FileItem
              key={file.name}
              file={file}
              onDownload={handleDownload}
              onDelete={allowDelete ? handleDelete : undefined}
              onSelect={onFileSelect}
              showActions={showActions}
              allowDelete={allowDelete}
            />
          ))}
        </div>
      )}

      {filteredFiles.length > 0 && (
        <div className="text-xs text-gray-500 text-center">
          {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} 
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      )}
    </div>
  )
}

// Convenience components for specific buckets
export function TenderDocumentBrowser(props: Omit<FileBrowserProps, 'bucket'>) {
  return <FileBrowser {...props} bucket={STORAGE_BUCKETS.TENDER_DOCUMENTS} />
}

export function ExportsBrowser(props: Omit<FileBrowserProps, 'bucket'>) {
  return <FileBrowser {...props} bucket={STORAGE_BUCKETS.EXPORTS} />
}

export function KnowledgeBaseBrowser(props: Omit<FileBrowserProps, 'bucket'>) {
  return <FileBrowser {...props} bucket={STORAGE_BUCKETS.KNOWLEDGE_BASE} />
} 