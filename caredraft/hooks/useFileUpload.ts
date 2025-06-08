import { useState, useCallback } from 'react'
import { useToastActions } from '@/lib/stores/toastStore'
import { 
  uploadFile, 
  validateFile, 
  STORAGE_BUCKETS,
  type StorageBucket 
} from '@/lib/storage'
import { useUser } from '@/components/providers/MinimalAuthProvider'

export interface UploadProgress {
  fileName: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
  filePath?: string
}

export interface UseFileUploadOptions {
  bucket: StorageBucket
  onUploadComplete?: (filePath: string, fileName: string) => void
  onUploadError?: (error: string, fileName: string) => void
  maxFiles?: number
  autoUpload?: boolean
}

export interface UseFileUploadReturn {
  uploadFiles: (files: File[]) => Promise<void>
  uploadSingleFile: (file: File, customFilename?: string) => Promise<string | null>
  uploads: UploadProgress[]
  isUploading: boolean
  clearUploads: () => void
  removeUpload: (fileName: string) => void
}

export function useFileUpload(options: UseFileUploadOptions): UseFileUploadReturn {
  const { bucket, onUploadComplete, onUploadError, maxFiles = 10, autoUpload = true } = options
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const user = useUser()
  const toast = useToastActions()

  const isUploading = uploads.some(upload => upload.status === 'uploading')

  const clearUploads = useCallback(() => {
    setUploads([])
  }, [])

  const removeUpload = useCallback((fileName: string) => {
    setUploads(prev => prev.filter(upload => upload.fileName !== fileName))
  }, [])

  const updateUploadProgress = useCallback((fileName: string, updates: Partial<UploadProgress>) => {
    setUploads(prev => 
      prev.map(upload => 
        upload.fileName === fileName 
          ? { ...upload, ...updates }
          : upload
      )
    )
  }, [])

  const uploadSingleFile = useCallback(async (
    file: File, 
    customFilename?: string
  ): Promise<string | null> => {
    if (!user) {
      toast.error('You must be logged in to upload files')
      return null
    }

    // Validate file first
    const validation = validateFile(file, bucket)
    if (!validation.valid) {
      toast.error(`File validation failed: ${validation.error}`)
      if (onUploadError) {
        onUploadError(validation.error!, file.name)
      }
      return null
    }

    // Create upload progress entry
    const uploadEntry: UploadProgress = {
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }

    setUploads(prev => {
      // Remove any existing upload with same filename
      const filtered = prev.filter(u => u.fileName !== file.name)
      return [...filtered, uploadEntry]
    })

    try {
      // Simulate progress updates (since Supabase doesn't provide real progress)
      updateUploadProgress(file.name, { progress: 25 })
      
      const result = await uploadFile(
        file, 
        bucket, 
        customFilename, 
        user.id
      )

      if (result.error) {
        throw new Error(result.error)
      }

      updateUploadProgress(file.name, { 
        progress: 100, 
        status: 'completed',
        filePath: result.filePath 
      })

      toast.success(`File uploaded successfully: ${file.name}`)
      
      if (onUploadComplete && result.filePath) {
        onUploadComplete(result.filePath, file.name)
      }

      return result.filePath || null

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      
      updateUploadProgress(file.name, { 
        progress: 0, 
        status: 'error',
        error: errorMessage 
      })

      toast.error(`Upload failed: ${errorMessage}`)
      
      if (onUploadError) {
        onUploadError(errorMessage, file.name)
      }

      return null
    }
  }, [user, bucket, onUploadComplete, onUploadError, updateUploadProgress])

  const uploadFiles = useCallback(async (files: File[]) => {
    if (!user) {
      toast.error('You must be logged in to upload files')
      return
    }

    if (files.length === 0) {
      toast.error('No files selected')
      return
    }

    if (files.length > maxFiles) {
      toast.error(`Too many files selected. Maximum ${maxFiles} files allowed.`)
      return
    }

    // Check for existing uploads with same names
    const existingNames = uploads.map(u => u.fileName)
    const duplicates = files.filter(f => existingNames.includes(f.name))
    
    if (duplicates.length > 0) {
      toast.error(`Files with these names are already being processed: ${duplicates.map(f => f.name).join(', ')}`)
      return
    }

    // If autoUpload is disabled, just add files to the uploads list as pending
    if (!autoUpload) {
      const pendingUploads: UploadProgress[] = files.map(file => ({
        fileName: file.name,
        progress: 0,
        status: 'pending'
      }))
      
      setUploads(prev => [...prev, ...pendingUploads])
      return
    }

    // Auto upload all files
    for (const file of files) {
      await uploadSingleFile(file)
    }
  }, [user, maxFiles, uploads, autoUpload, uploadSingleFile])

  return {
    uploadFiles,
    uploadSingleFile,
    uploads,
    isUploading,
    clearUploads,
    removeUpload,
  }
}

// Convenience hooks for specific buckets
export function useTenderDocumentUpload(options?: Omit<UseFileUploadOptions, 'bucket'>) {
  return useFileUpload({
    ...options,
    bucket: STORAGE_BUCKETS.TENDER_DOCUMENTS,
  })
}

export function useExportsUpload(options?: Omit<UseFileUploadOptions, 'bucket'>) {
  return useFileUpload({
    ...options,
    bucket: STORAGE_BUCKETS.EXPORTS,
  })
}

export function useKnowledgeBaseUpload(options?: Omit<UseFileUploadOptions, 'bucket'>) {
  return useFileUpload({
    ...options,
    bucket: STORAGE_BUCKETS.KNOWLEDGE_BASE,
  })
} 