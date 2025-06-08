import { createAdminClient } from './supabase'

// Storage bucket configuration
export const STORAGE_BUCKETS = {
  TENDER_DOCUMENTS: 'tender-documents',
  EXPORTS: 'exports',
  KNOWLEDGE_BASE: 'knowledge-base',
} as const

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS]

// File type configurations
export const BUCKET_CONFIG = {
  [STORAGE_BUCKETS.TENDER_DOCUMENTS]: {
    maxSizeBytes: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/vnd.oasis.opendocument.text', // .odt
    ] as string[],
    allowedExtensions: ['.pdf', '.docx', '.doc', '.odt'] as string[],
    isPublic: true,
    description: 'Uploaded tender documents and RFP files',
  },
  [STORAGE_BUCKETS.EXPORTS]: {
    maxSizeBytes: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.oasis.opendocument.text',
      'text/plain',
      'application/zip',
    ] as string[],
    allowedExtensions: ['.pdf', '.docx', '.doc', '.odt', '.txt', '.zip'] as string[],
    isPublic: false,
    description: 'Generated bid documents and exports',
  },
  [STORAGE_BUCKETS.KNOWLEDGE_BASE]: {
    maxSizeBytes: 25 * 1024 * 1024, // 25MB
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.oasis.opendocument.text',
      'text/plain',
      'text/markdown',
      'text/html',
    ] as string[],
    allowedExtensions: ['.pdf', '.docx', '.doc', '.odt', '.txt', '.md', '.html'] as string[],
    isPublic: false,
    description: 'Company knowledge base documents and templates',
  },
} as const

/**
 * Initialize storage buckets
 * This function should be run once to set up the storage infrastructure
 */
export async function initializeStorageBuckets() {
  const supabase = createAdminClient()
  
  const results = []
  
  for (const [bucketKey, bucketId] of Object.entries(STORAGE_BUCKETS)) {
    const config = BUCKET_CONFIG[bucketId]
    
    try {
      // Check if bucket exists
      const { data: existingBucket, error: listError } = await supabase
        .storage
        .getBucket(bucketId)
      
      if (existingBucket) {
        console.log(`✅ Bucket '${bucketId}' already exists`)
        results.push({ bucket: bucketId, status: 'exists', error: null })
        continue
      }
      
      // Create bucket if it doesn't exist
      const { data, error } = await supabase
        .storage
        .createBucket(bucketId, {
          public: config.isPublic,
          fileSizeLimit: config.maxSizeBytes,
          allowedMimeTypes: config.allowedMimeTypes,
        })
      
      if (error) {
        console.error(`❌ Failed to create bucket '${bucketId}':`, error)
        results.push({ bucket: bucketId, status: 'error', error })
      } else {
        console.log(`✅ Created bucket '${bucketId}' successfully`)
        results.push({ bucket: bucketId, status: 'created', error: null, data })
      }
    } catch {
      console.error(`❌ Exception creating bucket '${bucketId}':`, err)
      results.push({ bucket: bucketId, status: 'exception', error: err })
    }
  }
  
  return results
}

/**
 * Validate file before upload
 */
export function validateFile(file: File, bucket: StorageBucket): { valid: boolean; error?: string } {
  const config = BUCKET_CONFIG[bucket]
  
  // Check file size
  if (file.size > config.maxSizeBytes) {
    const maxSizeMB = Math.round(config.maxSizeBytes / (1024 * 1024))
    return {
      valid: false,
      error: `File size (${Math.round(file.size / (1024 * 1024))}MB) exceeds maximum allowed size of ${maxSizeMB}MB`,
    }
  }
  
  // Check MIME type
  if (!config.allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type '${file.type}' is not allowed. Supported types: ${config.allowedExtensions.join(', ')}`,
    }
  }
  
  // Check file extension
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  if (!config.allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `File extension '${fileExtension}' is not allowed. Supported extensions: ${config.allowedExtensions.join(', ')}`,
    }
  }
  
  return { valid: true }
}

/**
 * Generate a safe filename for storage
 */
export function sanitizeFilename(filename: string, userId?: string): string {
  // Remove dangerous characters and normalize
  const sanitized = filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
  
  // Add timestamp to prevent conflicts
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const extension = sanitized.includes('.') ? sanitized.substring(sanitized.lastIndexOf('.')) : ''
  const nameWithoutExt = sanitized.includes('.') ? sanitized.substring(0, sanitized.lastIndexOf('.')) : sanitized
  
  const prefix = userId ? `${userId}/` : ''
  return `${prefix}${nameWithoutExt}_${timestamp}${extension}`
}

/**
 * Upload file to specified bucket
 */
export async function uploadFile(
  file: File, 
  bucket: StorageBucket, 
  filename?: string,
  userId?: string
): Promise<{ data?: unknown; error?: string; filePath?: string }> {
  // Validate file
  const validation = validateFile(file, bucket)
  if (!validation.valid) {
    return { error: validation.error }
  }
  
  // Generate safe filename
  const safeFilename = filename ? sanitizeFilename(filename, userId) : sanitizeFilename(file.name, userId)
  
  const supabase = createAdminClient()
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(safeFilename, file, {
        cacheControl: '3600',
        upsert: false, // Prevent overwriting
      })
    
    if (error) {
      return { error: error.message }
    }
    
    return { 
      data, 
      filePath: data.path,
    }
  } catch {
    return { error: err instanceof Error ? err.message : 'Upload failed' }
  }
}

/**
 * Download file from bucket
 */
export async function downloadFile(bucket: StorageBucket, filePath: string) {
  const supabase = createAdminClient()
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath)
    
    if (error) {
      return { error: error.message }
    }
    
    return { data }
  } catch {
    return { error: err instanceof Error ? err.message : 'Download failed' }
  }
}

/**
 * Get public URL for file (only works for public buckets)
 */
export function getPublicUrl(bucket: StorageBucket, filePath: string): string | null {
  const config = BUCKET_CONFIG[bucket]
  if (!config.isPublic) {
    return null
  }
  
  const supabase = createAdminClient()
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)
  
  return data.publicUrl
}

/**
 * Create signed URL for private file access
 */
export async function createSignedUrl(
  bucket: StorageBucket, 
  filePath: string, 
  expiresInSeconds: number = 3600
) {
  const supabase = createAdminClient()
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresInSeconds)
    
    if (error) {
      return { error: error.message }
    }
    
    return { data }
  } catch {
    return { error: err instanceof Error ? err.message : 'Failed to create signed URL' }
  }
}

/**
 * List files in bucket
 */
export async function listFiles(bucket: StorageBucket, folder?: string, limit: number = 100) {
  const supabase = createAdminClient()
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit,
        sortBy: { column: 'created_at', order: 'desc' },
      })
    
    if (error) {
      return { error: error.message }
    }
    
    return { data }
  } catch {
    return { error: err instanceof Error ? err.message : 'Failed to list files' }
  }
}

/**
 * Delete file from bucket
 */
export async function deleteFile(bucket: StorageBucket, filePaths: string | string[]) {
  const supabase = createAdminClient()
  
  try {
    const pathsArray = Array.isArray(filePaths) ? filePaths : [filePaths]
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(pathsArray)
    
    if (error) {
      return { error: error.message }
    }
    
    return { data }
  } catch {
    return { error: err instanceof Error ? err.message : 'Failed to delete file' }
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(bucket: StorageBucket, filePath: string) {
  const supabase = createAdminClient()
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('', {
        search: filePath,
        limit: 1,
      })
    
    if (error) {
      return { error: error.message }
    }
    
    const file = data.find(f => f.name === filePath.split('/').pop())
    return { data: file }
  } catch {
    return { error: err instanceof Error ? err.message : 'Failed to get file metadata' }
  }
} 