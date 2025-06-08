'use client'

import { createClient } from '@/lib/supabase'

// Dynamic imports to avoid SSR issues
let pdfjsLib: unknown = null
let mammoth: unknown = null
let JSZip: unknown = null

const initializeLibraries = async () => {
  // Only initialize on client-side
  if (typeof window === 'undefined') {
    throw new Error('Text extraction must be used client-side only')
  }

  if (!pdfjsLib) {
    const pdfjs = await import('pdfjs-dist')
    pdfjsLib = pdfjs.default || pdfjs
    
    // Configure worker for client-side use
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
    }
  }

  if (!mammoth) {
    mammoth = await import('mammoth')
  }

  if (!JSZip) {
    JSZip = (await import('jszip')).default
  }
}

export interface TextExtractionResult {
  text: string
  metadata: {
    wordCount: number
    characterCount: number
    pageCount?: number
    processingTime: number
    extractionMethod: 'pdf' | 'docx' | 'odt'
  }
  error?: string
}

export type ExtractionMethod = 'pdf' | 'docx' | 'odt'

/**
 * Extract text from a file stored in Supabase Storage
 */
export async function extractTextFromStorage(
  filePath: string,
  fileName: string
): Promise<TextExtractionResult> {
  const startTime = Date.now()

  try {
    // Ensure libraries are initialized
    await initializeLibraries()

    const supabase = createClient()
    
    // Download file from Supabase Storage
    const { data, error } = await supabase.storage
      .from('tender-documents')
      .download(filePath)

    if (error) {
      throw new Error(`Failed to download file: ${error.message}`)
    }

    if (!data) {
      throw new Error('No file data received')
    }

    // Convert blob to ArrayBuffer
    const arrayBuffer = await data.arrayBuffer()
    
    // Determine file type and extract text
    const fileExtension = fileName.toLowerCase().split('.').pop()
    let result: TextExtractionResult

    switch (fileExtension) {
      case 'pdf':
        result = await extractFromPDF(arrayBuffer)
        break
      case 'docx':
        result = await extractFromDOCX(arrayBuffer)
        break
      case 'odt':
        result = await extractFromODT(arrayBuffer)
        break
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`)
    }

    // Add processing time
    result.metadata.processingTime = Date.now() - startTime

    return result
  } catch {
    return {
      text: '',
      metadata: {
        wordCount: 0,
        characterCount: 0,
        processingTime: Date.now() - startTime,
        extractionMethod: 'pdf'
      },
      error: error instanceof Error ? error.message : 'Unknown extraction error'
    }
  }
}

/**
 * Extract text from PDF file
 */
async function extractFromPDF(arrayBuffer: ArrayBuffer): Promise<TextExtractionResult> {
  if (!pdfjsLib) {
    throw new Error('PDF.js not initialized')
  }

  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let fullText = ''

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      // Combine text items with proper spacing
      const pageText = textContent.items
        .map((item: unknown) => item.str)
        .join(' ')
      
      fullText += pageText + '\n\n'
    }

    // Clean up text
    const cleanText = fullText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim()

    return {
      text: cleanText,
      metadata: {
        wordCount: cleanText.split(/\s+/).filter((word: string) => word.length > 0).length,
        characterCount: cleanText.length,
        pageCount: pdf.numPages,
        processingTime: 0, // Will be set by caller
        extractionMethod: 'pdf'
      }
    }
  } catch {
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from DOCX file
 */
async function extractFromDOCX(arrayBuffer: ArrayBuffer): Promise<TextExtractionResult> {
  if (!mammoth) {
    throw new Error('Mammoth not initialized')
  }

  try {
    const result = await mammoth.default.extractRawText({ arrayBuffer })
    const text = result.value.trim()

    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).filter((word: string) => word.length > 0).length,
        characterCount: text.length,
        processingTime: 0, // Will be set by caller
        extractionMethod: 'docx'
      }
    }
  } catch {
    throw new Error(`DOCX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from ODT file
 */
async function extractFromODT(arrayBuffer: ArrayBuffer): Promise<TextExtractionResult> {
  if (!JSZip) {
    throw new Error('JSZip not initialized')
  }

  try {
    const zip = await JSZip.loadAsync(arrayBuffer)
    const contentFile = zip.file('content.xml')
    
    if (!contentFile) {
      throw new Error('content.xml not found in ODT file')
    }

    const contentXml = await contentFile.async('text')
    
    // Parse XML and extract text (basic implementation)
    const textMatches = contentXml.match(/<text:p[^>]*>(.*?)<\/text:p>/g) || []
    const text = textMatches
      .map((match: string) => match.replace(/<[^>]*>/g, '').trim())
      .filter((paragraph: string) => paragraph.length > 0)
      .join('\n\n')

    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).filter((word: string) => word.length > 0).length,
        characterCount: text.length,
        processingTime: 0, // Will be set by caller
        extractionMethod: 'odt'
      }
    }
  } catch {
    throw new Error(`ODT extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get human-readable extraction method name
 */
export function getExtractionMethodName(method: ExtractionMethod): string {
  switch (method) {
    case 'pdf':
      return 'PDF.js'
    case 'docx':
      return 'Mammoth'
    case 'odt':
      return 'JSZip + XML'
    default:
      return 'Unknown'
  }
} 