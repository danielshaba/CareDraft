import { createClient } from '@/lib/supabase'
import { TextExtractionResult } from '@/lib/text-extraction'
import { ExtractedDocument, ExtractedDocumentInsert, ExtractedDocumentUpdate } from '@/types/database'

/**
 * Get all extracted documents for the current user
 */
export async function getExtractedDocuments(
  limit = 50,
  offset = 0,
  status?: 'pending' | 'processing' | 'completed' | 'failed'
): Promise<{ data: ExtractedDocument[] | null; error: string | null }> {
  const supabase = createClient()
  
  let query = supabase
    .from('extracted_documents')
    .select('*')
    .order('uploaded_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (status) {
    query = query.eq('extraction_status', status)
  }
  
  const { data, error } = await query
  
  if (error) {
    return { data: null, error: error.message }
  }
  
  return { data, error: null }
}

/**
 * Get a specific extracted document by ID
 */
export async function getExtractedDocument(
  id: string
): Promise<{ data: ExtractedDocument | null; error: string | null }> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('extracted_documents')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    return { data: null, error: error.message }
  }
  
  return { data, error: null }
}

/**
 * Create a new extracted document record
 */
export async function createExtractedDocument(
  documentData: ExtractedDocumentInsert
): Promise<{ data: ExtractedDocument | null; error: string | null }> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('extracted_documents')
    .insert(documentData)
    .select()
    .single()
  
  if (error) {
    return { data: null, error: error.message }
  }
  
  return { data, error: null }
}

/**
 * Update an extracted document with extraction results
 */
export async function updateExtractedDocument(
  id: string,
  updates: ExtractedDocumentUpdate
): Promise<{ data: ExtractedDocument | null; error: string | null }> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('extracted_documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    return { data: null, error: error.message }
  }
  
  return { data, error: null }
}

/**
 * Delete an extracted document
 */
export async function deleteExtractedDocument(
  id: string
): Promise<{ error: string | null }> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('extracted_documents')
    .delete()
    .eq('id', id)
  
  return { error: error?.message || null }
}

/**
 * Search extracted documents by text content
 */
export async function searchExtractedDocuments(
  searchTerm: string,
  limit = 20
): Promise<{ data: ExtractedDocument[] | null; error: string | null }> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('extracted_documents')
    .select('*')
    .textSearch('original_text', searchTerm)
    .eq('extraction_status', 'completed')
    .order('uploaded_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    return { data: null, error: error.message }
  }
  
  return { data, error: null }
}

/**
 * Get document statistics for the current user
 */
export async function getDocumentStatistics(): Promise<{
  data: {
    total: number
    pending: number
    processing: number
    completed: number
    failed: number
    totalWords: number
    totalCharacters: number
  } | null
  error: string | null
}> {
  const supabase = createClient()
  
  // Get counts by status
  const { data: statusData, error: statusError } = await supabase
    .from('extracted_documents')
    .select('extraction_status, word_count, character_count')
  
  if (statusError) {
    return { data: null, error: statusError.message }
  }
  
  const statistics = {
    total: statusData.length,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    totalWords: 0,
    totalCharacters: 0
  }
  
  statusData.forEach((doc: { extraction_status: string; word_count: number; character_count: number }) => {
    const status = doc.extraction_status as 'pending' | 'processing' | 'completed' | 'failed'
    if (status in statistics) {
      (statistics as any)[status]++
    }
    statistics.totalWords += doc.word_count || 0
    statistics.totalCharacters += doc.character_count || 0
  })
  
  return { data: statistics, error: null }
}

/**
 * Create document record and update with extraction results
 */
export async function saveExtractedDocument(
  filePath: string,
  fileName: string,
  fileSize: number,
  fileType: string,
  extractionResult: TextExtractionResult,
  userId: string
): Promise<{ data: ExtractedDocument | null; error: string | null }> {
  const supabase = createClient()
  
  // First, create the document record
  const documentData: ExtractedDocumentInsert = {
    user_id: userId,
    file_name: fileName,
    file_path: filePath,
    file_size: fileSize,
    file_type: fileType,
    extraction_status: 'processing'
  }
  
  const { data: document, error: createError } = await createExtractedDocument(documentData)
  
  if (createError || !document) {
    return { data: null, error: createError || 'Failed to create document record' }
  }
  
  // Then update with extraction results
  const updateData: ExtractedDocumentUpdate = {
    original_text: extractionResult.text,
    word_count: extractionResult.metadata.wordCount,
    character_count: extractionResult.metadata.characterCount,
    page_count: extractionResult.metadata.pageCount,
    extraction_method: extractionResult.metadata.extractionMethod,
    processing_time: extractionResult.metadata.processingTime,
    extraction_status: extractionResult.error ? 'failed' : 'completed',
    extraction_error: extractionResult.error,
    extracted_at: new Date().toISOString()
  }
  
  const { data: updatedDocument, error: updateError } = await updateExtractedDocument(
    document.id,
    updateData
  )
  
  if (updateError) {
    return { data: null, error: updateError }
  }
  
  return { data: updatedDocument, error: null }
}

/**
 * Get recent documents for dashboard display
 */
export async function getRecentDocuments(
  limit = 5
): Promise<{ data: ExtractedDocument[] | null; error: string | null }> {
  return getExtractedDocuments(limit, 0)
}

/**
 * Check if document already exists by file path
 */
export async function getDocumentByFilePath(
  filePath: string
): Promise<{ data: ExtractedDocument | null; error: string | null }> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('extracted_documents')
    .select('*')
    .eq('file_path', filePath)
    .single()
  
  if (error && error.code === 'PGRST116') {
    // No rows returned - this is expected for new files
    return { data: null, error: null }
  }
  
  if (error) {
    return { data: null, error: error.message }
  }
  
  return { data, error: null }
} 