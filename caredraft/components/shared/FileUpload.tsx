'use client'

import React, { useCallback, useState, useRef } from 'react'
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useFileUpload, type UseFileUploadOptions, type UploadProgress } from '@/hooks/useFileUpload'
import { STORAGE_BUCKETS, type StorageBucket } from '@/lib/storage'

interface FileUploadProps extends Omit<UseFileUploadOptions, 'bucket'> {
  bucket: StorageBucket
  className?: string
  disabled?: boolean
  multiple?: boolean
  accept?: string
  children?: React.ReactNode
}

interface FileUploadAreaProps {
  isDragActive: boolean
  disabled?: boolean
  children: React.ReactNode
  onClick: () => void
}

function FileUploadArea({ isDragActive, disabled, children, onClick }: FileUploadAreaProps) {
  const baseClasses = "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer"
  const activeClasses = isDragActive 
    ? "border-blue-400 bg-blue-50" 
    : "border-gray-300 hover:border-gray-400"
  const disabledClasses = disabled 
    ? "opacity-50 cursor-not-allowed" 
    : ""

  return (
    <div 
      className={`${baseClasses} ${activeClasses} ${disabledClasses}`}
      onClick={disabled ? undefined : onClick}
    >
      {children}
    </div>
  )
}

interface UploadProgressItemProps {
  upload: UploadProgress
  onRemove: (fileName: string) => void
}

function UploadProgressItem({ upload, onRemove }: UploadProgressItemProps) {
  const getStatusIcon = () => {
    switch (upload.status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <File className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (upload.status) {
      case 'uploading':
        return 'bg-blue-600'
      case 'completed':
        return 'bg-green-600'
      case 'error':
        return 'bg-red-600'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="flex-shrink-0">
        {getStatusIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-gray-900 truncate">
            {upload.fileName}
          </p>
          <button
            onClick={() => onRemove(upload.fileName)}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {upload.status === 'uploading' && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
              style={{ width: `${upload.progress}%` }}
            />
          </div>
        )}
        
        {upload.status === 'error' && upload.error && (
          <p className="text-xs text-red-600 mt-1">{upload.error}</p>
        )}
        
        {upload.status === 'completed' && upload.filePath && (
          <p className="text-xs text-green-600 mt-1">Upload completed</p>
        )}
      </div>
    </div>
  )
}

export function FileUpload({
  bucket,
  className = '',
  disabled = false,
  multiple = true,
  accept,
  children,
  ...uploadOptions
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const {
    uploadFiles,
    uploads,
    isUploading,
    removeUpload,
    clearUploads
  } = useFileUpload({ bucket, ...uploadOptions })

  // Get bucket-specific accept types if not provided
  const getAcceptTypes = useCallback(() => {
    if (accept) return accept
    
    switch (bucket) {
      case STORAGE_BUCKETS.TENDER_DOCUMENTS:
        return '.pdf,.docx,.doc,.odt'
      case STORAGE_BUCKETS.EXPORTS:
        return '.pdf,.docx,.doc,.odt,.zip'
      case STORAGE_BUCKETS.KNOWLEDGE_BASE:
        return '.pdf,.docx,.doc,.odt,.txt,.md'
      default:
        return undefined
    }
  }, [bucket, accept])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragActive(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    
    if (disabled) return
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      uploadFiles(files)
    }
  }, [disabled, uploadFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      uploadFiles(files)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }, [uploadFiles])

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled])

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

  const getMaxFileSize = () => {
    switch (bucket) {
      case STORAGE_BUCKETS.TENDER_DOCUMENTS:
        return '50MB'
      case STORAGE_BUCKETS.EXPORTS:
        return '100MB'
      case STORAGE_BUCKETS.KNOWLEDGE_BASE:
        return '25MB'
      default:
        return '50MB'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={getAcceptTypes()}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        
        <FileUploadArea
          isDragActive={isDragActive}
          disabled={disabled}
          onClick={handleClick}
        >
          {children || (
            <div className="space-y-2">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="space-y-1">
                <p className="text-lg font-medium text-gray-900">
                  Upload {getBucketDisplayName()}
                </p>
                <p className="text-sm text-gray-600">
                  Drag and drop files here, or click to select
                </p>
                <p className="text-xs text-gray-500">
                  Max file size: {getMaxFileSize()}
                </p>
              </div>
            </div>
          )}
        </FileUploadArea>
      </div>

      {uploads.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Upload Progress ({uploads.length})
            </h4>
            {uploads.length > 0 && !isUploading && (
              <button
                onClick={clearUploads}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            {uploads.map((upload) => (
              <UploadProgressItem
                key={upload.fileName}
                upload={upload}
                onRemove={removeUpload}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Convenience components for specific buckets
export function TenderDocumentUpload(props: Omit<FileUploadProps, 'bucket'>) {
  return <FileUpload {...props} bucket={STORAGE_BUCKETS.TENDER_DOCUMENTS} />
}

export function ExportsUpload(props: Omit<FileUploadProps, 'bucket'>) {
  return <FileUpload {...props} bucket={STORAGE_BUCKETS.EXPORTS} />
}

export function KnowledgeBaseUpload(props: Omit<FileUploadProps, 'bucket'>) {
  return <FileUpload {...props} bucket={STORAGE_BUCKETS.KNOWLEDGE_BASE} />
} 