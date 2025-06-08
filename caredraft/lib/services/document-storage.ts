'use client'

import { 
  uploadFile, 
  createSignedUrl, 
  deleteFile, 
  listFiles, 
  getFileMetadata,
  STORAGE_BUCKETS 
} from '@/lib/storage'
import { createClient } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

// Document metadata for exported files
export interface ExportedDocumentMetadata {
  id: string
  filename: string
  originalTitle: string
  exportFormat: 'pdf' | 'docx'
  organizationId: string
  userId: string
  proposalId?: string
  fileSize: number
  filePath: string
  downloadCount: number
  shareableLink?: string
  expiresAt?: string
  version: number
  metadata: {
    exportedAt: string
    exportOptions: Record<string, unknown>
    processingTime: number
    userAgent?: string
  }
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

// Document access log entry
export interface DocumentAccessLog {
  id: string
  documentId: string
  userId?: string
  accessType: 'download' | 'view' | 'share' | 'delete'
  ipAddress?: string
  userAgent?: string
  success: boolean
  errorMessage?: string
  accessedAt: string
}

// Document sharing configuration
export interface DocumentSharingConfig {
  expiresInHours?: number
  allowDownload?: boolean
  requireAuthentication?: boolean
  customMessage?: string
  notifyOnAccess?: boolean
  maxDownloads?: number
}

// Default expiration times
const DEFAULT_EXPIRATION = {
  SIGNED_URL: 3600, // 1 hour
  SHARED_DOCUMENT: 24 * 7, // 7 days  
  TEMPORARY_EXPORT: 24, // 1 day
  PERMANENT_EXPORT: null // No expiration
}

export class DocumentStorageService {
  private static instance: DocumentStorageService
  private supabase = createClient()

  private constructor() {}

  static getInstance(): DocumentStorageService {
    if (!DocumentStorageService.instance) {
      DocumentStorageService.instance = new DocumentStorageService()
    }
    return DocumentStorageService.instance
  }

  /**
   * Store exported document in Supabase storage
   */
  async storeExportedDocument(
    documentBlob: Blob,
    metadata: Omit<ExportedDocumentMetadata, 'id' | 'filePath' | 'createdAt' | 'updatedAt' | 'downloadCount' | 'version'>
  ): Promise<{ success: boolean; data?: ExportedDocumentMetadata; error?: string }> {
    try {
      // Generate unique filename with user folder structure
      const timestamp = new Date().toISOString().split('T')[0]
      const uniqueId = crypto.randomUUID().split('-')[0]
      const filename = `${metadata.userId}/${timestamp}/${uniqueId}_${metadata.filename}`
      
      // Convert blob to file for upload
      const file = new File([documentBlob], metadata.filename, { 
        type: metadata.exportFormat === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      })

      // Upload to exports bucket
      const uploadResult = await uploadFile(file, STORAGE_BUCKETS.EXPORTS, filename, metadata.userId)
      
      if (uploadResult.error || !uploadResult.filePath) {
        throw new Error(uploadResult.error || 'Upload failed')
      }

      // Store document metadata in database
      const documentMetadata: ExportedDocumentMetadata = {
        id: crypto.randomUUID(),
        ...metadata,
        filePath: uploadResult.filePath,
        downloadCount: 0,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('exported_documents')
        .insert([documentMetadata])
        .select()
        .single()

      if (error) {
        // Clean up uploaded file if database insert fails
        await deleteFile(STORAGE_BUCKETS.EXPORTS, uploadResult.filePath)
        throw new Error(`Database error: ${error.message}`)
      }

      // Log the export activity
      await this.logDocumentAccess(documentMetadata.id, metadata.userId, 'create', true)

      return { success: true, data: data as ExportedDocumentMetadata }
    } catch {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to store document' 
      }
    }
  }

  /**
   * Create secure download link for document
   */
  async createDownloadLink(
    documentId: string,
    userId: string,
    expiresInSeconds: number = DEFAULT_EXPIRATION.SIGNED_URL
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Verify user has access to document
      const { data: document, error } = await this.supabase
        .from('exported_documents')
        .select('*')
        .eq('id', documentId)
        .eq('userId', userId) // Only owner can create download links
        .single()

      if (error || !document) {
        throw new Error('Document not found or access denied')
      }

      // Create signed URL
      const signedUrlResult = await createSignedUrl(
        STORAGE_BUCKETS.EXPORTS,
        document.filePath,
        expiresInSeconds
      )

      if (signedUrlResult.error || !signedUrlResult.data) {
        throw new Error(signedUrlResult.error || 'Failed to create signed URL')
      }

      // Log the access
      await this.logDocumentAccess(documentId, userId, 'share', true)

      return { success: true, url: signedUrlResult.data.signedUrl }
    } catch {
      await this.logDocumentAccess(documentId, userId, 'share', false, error instanceof Error ? error.message : undefined)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create download link' 
      }
    }
  }

  /**
   * Create shareable public link with custom expiration
   */
  async createShareableLink(
    documentId: string,
    userId: string,
    config: DocumentSharingConfig = {}
  ): Promise<{ success: boolean; shareId?: string; error?: string }> {
    try {
      // Verify document ownership
      const { data: document, error: docError } = await this.supabase
        .from('exported_documents')
        .select('*')
        .eq('id', documentId)
        .eq('userId', userId)
        .single()

      if (docError || !document) {
        throw new Error('Document not found or access denied')
      }

      // Calculate expiration
      const expiresAt = config.expiresInHours 
        ? new Date(Date.now() + config.expiresInHours * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + DEFAULT_EXPIRATION.SHARED_DOCUMENT * 60 * 60 * 1000).toISOString()

      // Create share record
      const shareId = crypto.randomUUID()
      const { error } = await this.supabase
        .from('document_shares')
        .insert([{
          id: shareId,
          documentId,
          sharedBy: userId,
          expiresAt,
          allowDownload: config.allowDownload ?? true,
          requireAuthentication: config.requireAuthentication ?? false,
          customMessage: config.customMessage,
          notifyOnAccess: config.notifyOnAccess ?? false,
          maxDownloads: config.maxDownloads,
          downloadCount: 0,
          createdAt: new Date().toISOString()
        }])

      if (error) {
        throw new Error(`Failed to create share: ${error.message}`)
      }

      // Update document with shareable link flag
      await this.supabase
        .from('exported_documents')
        .update({ 
          shareableLink: `/shared/${shareId}`,
          updatedAt: new Date().toISOString()
        })
        .eq('id', documentId)

      await this.logDocumentAccess(documentId, userId, 'share', true)

      return { success: true, shareId }
    } catch {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create shareable link' 
      }
    }
  }

  /**
   * Get user's exported documents with filtering and pagination
   */
  async getUserDocuments(
    userId: string,
    options: {
      page?: number
      limit?: number
      format?: 'pdf' | 'docx'
      proposalId?: string
      sortBy?: 'createdAt' | 'filename' | 'downloadCount'
      sortOrder?: 'asc' | 'desc'
    } = {}
  ): Promise<{ success: boolean; data?: ExportedDocumentMetadata[]; total?: number; error?: string }> {
    try {
      const {
        page = 1,
        limit = 20,
        format,
        proposalId,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options

      let query = this.supabase
        .from('exported_documents')
        .select('*', { count: 'exact' })
        .eq('userId', userId)

      // Apply filters
      if (format) {
        query = query.eq('exportFormat', format)
      }
      if (proposalId) {
        query = query.eq('proposalId', proposalId)
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      return { 
        success: true, 
        data: data as ExportedDocumentMetadata[], 
        total: count || 0 
      }
    } catch {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get documents' 
      }
    }
  }

  /**
   * Delete exported document and clean up storage
   */
  async deleteDocument(
    documentId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get document info
      const { data: document, error: fetchError } = await this.supabase
        .from('exported_documents')
        .select('*')
        .eq('id', documentId)
        .eq('userId', userId)
        .single()

      if (fetchError || !document) {
        throw new Error('Document not found or access denied')
      }

      // Delete from storage
      const deleteResult = await deleteFile(STORAGE_BUCKETS.EXPORTS, [document.filePath])
      if (deleteResult.error) {
        console.warn('Failed to delete file from storage:', deleteResult.error)
        // Continue with database deletion even if storage deletion fails
      }

      // Delete shares
      await this.supabase
        .from('document_shares')
        .delete()
        .eq('documentId', documentId)

      // Delete access logs
      await this.supabase
        .from('document_access_logs')
        .delete()
        .eq('documentId', documentId)

      // Delete document record
      const { error: deleteError } = await this.supabase
        .from('exported_documents')
        .delete()
        .eq('id', documentId)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      await this.logDocumentAccess(documentId, userId, 'delete', true)

      return { success: true }
    } catch {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete document' 
      }
    }
  }

  /**
   * Log document access for audit trail
   */
  private async logDocumentAccess(
    documentId: string,
    userId: string,
    accessType: DocumentAccessLog['accessType'],
    success: boolean,
    errorMessage?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('document_access_logs')
        .insert([{
          id: crypto.randomUUID(),
          documentId,
          userId,
          accessType,
          success,
          errorMessage,
          ipAddress,
          userAgent,
          accessedAt: new Date().toISOString()
        }])
    } catch {
      console.warn('Failed to log document access:', error)
      // Don't throw error for logging failures
    }
  }

  /**
   * Get document access analytics
   */
  async getDocumentAnalytics(
    userId: string,
    documentId?: string
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      let query = this.supabase
        .from('document_access_logs')
        .select(`
          *,
          exported_documents!inner(userId, filename, exportFormat)
        `)
        .eq('exported_documents.userId', userId)

      if (documentId) {
        query = query.eq('documentId', documentId)
      }

      const { data, error } = await query
        .order('accessedAt', { ascending: false })
        .limit(100)

      if (error) {
        throw new Error(error.message)
      }

      return { success: true, data }
    } catch {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get analytics' 
      }
    }
  }

  /**
   * Clean up expired documents and shares
   */
  async cleanupExpiredDocuments(): Promise<{ success: boolean; cleaned?: number; error?: string }> {
    try {
      const now = new Date().toISOString()
      
      // Get expired documents
      const { data: expiredDocs, error: fetchError } = await this.supabase
        .from('exported_documents')
        .select('*')
        .not('expiresAt', 'is', null)
        .lt('expiresAt', now)

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      if (!expiredDocs || expiredDocs.length === 0) {
        return { success: true, cleaned: 0 }
      }

      // Delete expired documents
      for (const doc of expiredDocs) {
        await this.deleteDocument(doc.id, doc.userId)
      }

      // Clean up expired shares
      await this.supabase
        .from('document_shares')
        .delete()
        .lt('expiresAt', now)

      return { success: true, cleaned: expiredDocs.length }
    } catch {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to cleanup documents' 
      }
    }
  }
} 