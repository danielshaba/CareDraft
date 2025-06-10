'use client'

import { createClient } from '@/lib/supabase'

// Type definitions for PDF.js
interface PDFDocumentProxy {
  numPages: number
  getPage: (pageNum: number) => Promise<PDFPageProxy>
}

interface PDFPageProxy {
  getTextContent: () => Promise<{ items: Array<{ str: string }> }>
}

interface PDFLib {
  getDocument: (config: { 
    data: ArrayBuffer
    verbosity?: number
    disableAutoFetch?: boolean
    disableStream?: boolean
  }) => { promise: Promise<PDFDocumentProxy> }
  GlobalWorkerOptions: { workerSrc: string }
  version: string
}

interface MammothLib {
  default: {
    extractRawText: (config: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>
  }
}

interface JSZipLib {
  loadAsync: (data: ArrayBuffer) => Promise<{
    file: (name: string) => { async: (type: string) => Promise<string> } | null
  }>
}

// Dynamic imports to avoid SSR issues
let pdfjsLib: PDFLib | null = null
let mammoth: MammothLib | null = null
let JSZip: JSZipLib | null = null

export interface TextExtractionResult {
  text: string
  metadata: {
    wordCount: number
    characterCount: number
    processingTime: number
    extractionMethod: string
    pageCount?: number
  }
  error?: string
}

const initializeLibraries = async () => {
  // Only initialize on client-side
  if (typeof window === 'undefined') {
    throw new Error('Text extraction must be used client-side only')
  }

  if (!pdfjsLib) {
    try {
      const pdfjs = await import('pdfjs-dist')
      pdfjsLib = (pdfjs.default || pdfjs) as PDFLib
      
      // Try multiple worker setup approaches
      if (typeof window !== 'undefined') {
        try {
          // First try using local worker
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
        } catch (workerError) {
          console.warn('Local worker setup failed, trying CDN fallback:', workerError)
          // Fallback to CDN
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`
        }
      }
    } catch (error) {
      console.error('Failed to initialize PDF.js:', error)
      throw new Error('PDF.js initialization failed')
    }
  }

  if (!mammoth) {
    mammoth = await import('mammoth') as MammothLib
  }

  if (!JSZip) {
    JSZip = (await import('jszip')).default as JSZipLib
  }
}

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
      case 'txt':
        result = await extractFromTXT(arrayBuffer)
        break
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`)
    }

    // Update processing time
    result.metadata.processingTime = Date.now() - startTime
    
    return result
  } catch (error) {
    return {
      text: '',
      metadata: {
        wordCount: 0,
        characterCount: 0,
        processingTime: Date.now() - startTime,
        extractionMethod: 'error'
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
    // Set up PDF loading options with error handling
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      verbosity: 0, // Reduce console noise
      disableAutoFetch: false,
      disableStream: false
    })
    
    const pdf = await loadingTask.promise
    let fullText = ''

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        // Combine text items with proper spacing
        const pageText = textContent.items
          .map((item: { str: string }) => item.str)
          .join(' ')
        
        if (pageText.trim()) {
          fullText += (fullText ? '\n\n' : '') + `Page ${pageNum}:\n${pageText.trim()}`
        }
      } catch (pageError) {
        console.warn(`Failed to extract text from page ${pageNum}:`, pageError)
        // Continue with other pages even if one fails
        continue
      }
    }

    if (!fullText.trim()) {
      throw new Error('No text content found in PDF')
    }

    return {
      text: fullText,
      metadata: {
        wordCount: fullText.split(/\s+/).filter(word => word.length > 0).length,
        characterCount: fullText.length,
        processingTime: 0, // Will be set by caller
        extractionMethod: 'pdf'
      }
    }
  } catch (error) {
    return {
      text: '',
      metadata: {
        wordCount: 0,
        characterCount: 0,
        processingTime: 0,
        extractionMethod: 'pdf'
      },
      error: error instanceof Error ? error.message : 'Unknown extraction error'
    }
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

    if (!text) {
      throw new Error('No text content found in DOCX file')
    }

    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
        characterCount: text.length,
        processingTime: 0, // Will be set by caller
        extractionMethod: 'docx'
      }
    }
  } catch (error) {
    return {
      text: '',
      metadata: {
        wordCount: 0,
        characterCount: 0,
        processingTime: 0,
        extractionMethod: 'docx'
      },
      error: error instanceof Error ? error.message : 'Unknown extraction error'
    }
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

    const xmlContent = await contentFile.async('text')
    
    // Basic XML text extraction (remove tags)
    const text = xmlContent
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (!text) {
      throw new Error('No text content found in ODT file')
    }

    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
        characterCount: text.length,
        processingTime: 0, // Will be set by caller
        extractionMethod: 'odt'
      }
    }
  } catch (error) {
    return {
      text: '',
      metadata: {
        wordCount: 0,
        characterCount: 0,
        processingTime: 0,
        extractionMethod: 'odt'
      },
      error: error instanceof Error ? error.message : 'Unknown extraction error'
    }
  }
}

/**
 * Extract text from TXT file
 */
async function extractFromTXT(arrayBuffer: ArrayBuffer): Promise<TextExtractionResult> {
  try {
    const decoder = new TextDecoder('utf-8')
    const text = decoder.decode(arrayBuffer).trim()

    if (!text) {
      throw new Error('No text content found in TXT file')
    }

    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
        characterCount: text.length,
        processingTime: 0, // Will be set by caller
        extractionMethod: 'txt'
      }
    }
  } catch (error) {
    return {
      text: '',
      metadata: {
        wordCount: 0,
        characterCount: 0,
        processingTime: 0,
        extractionMethod: 'txt'
      },
      error: error instanceof Error ? error.message : 'Unknown extraction error'
    }
  }
}

/**
 * Get a human-readable name for the extraction method
 */
export function getExtractionMethodName(method: string): string {
  switch (method) {
    case 'pdf':
      return 'PDF Text Extraction'
    case 'docx':
      return 'Word Document Extraction'
    case 'odt':
      return 'OpenDocument Text Extraction'
    case 'txt':
      return 'Plain Text Extraction'
    case 'error':
      return 'Extraction Failed'
    default:
      return 'Unknown Method'
  }
}