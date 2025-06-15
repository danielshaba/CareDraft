import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

export interface ExtractedText {
  content: string
  metadata: {
    pages?: number
    wordCount: number
    fileName: string
    fileType: string
  }
}

export class DocumentExtractionService {
  /**
   * Extract text content from various document formats
   */
  static async extractText(file: File): Promise<ExtractedText> {
    const fileType = file.type.toLowerCase()
    const fileName = file.name
    
    try {
      let content: string = ''
      let metadata: any = {
        fileName,
        fileType,
        wordCount: 0
      }

      switch (fileType) {
        case 'application/pdf':
          content = await this.extractFromPDF(file)
          break
          
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          content = await this.extractFromWord(file)
          break
          
        case 'text/plain':
          content = await this.extractFromText(file)
          break
          
        default:
          throw new Error(`Unsupported file type: ${fileType}`)
      }

      // Calculate word count
      metadata.wordCount = content.split(/\s+/).filter(word => word.length > 0).length

      return {
        content: content.trim(),
        metadata
      }
    } catch (error) {
      console.error('Document extraction error:', error)
      throw new Error(`Failed to extract text from ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Extract text from PDF files
   */
  private static async extractFromPDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const data = await pdfParse(buffer)
      return data.text
    } catch (error) {
      console.error('PDF extraction error:', error)
      throw new Error('Failed to extract text from PDF file')
    }
  }

  /**
   * Extract text from Word documents (DOC/DOCX)
   */
  private static async extractFromWord(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    } catch (error) {
      console.error('Word extraction error:', error)
      throw new Error('Failed to extract text from Word document')
    }
  }

  /**
   * Extract text from plain text files
   */
  private static async extractFromText(file: File): Promise<string> {
    try {
      return await file.text()
    } catch (error) {
      console.error('Text extraction error:', error)
      throw new Error('Failed to read text file')
    }
  }

  /**
   * Clean and prepare text for AI processing
   */
  static preprocessText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters that might confuse AI
      .replace(/[^\w\s\.,;:!?()-]/g, ' ')
      // Normalize line breaks
      .replace(/\n+/g, '\n')
      // Trim and limit length (AI models have token limits)
      .trim()
      .substring(0, 50000) // Limit to ~50k characters
  }

  /**
   * Extract key sections from tender documents
   */
  static extractTenderSections(text: string): {
    title?: string
    overview?: string
    requirements?: string
    evaluation?: string
    timeline?: string
    contact?: string
  } {
    const sections: any = {}
    
    // Common tender document section patterns - fixed for compatibility
    const patterns = {
      title: /(?:tender|contract|rfp|rfx|itt)\s*(?:title|name|for)?\s*:?\s*(.+?)(?:\n|$)/i,
      overview: /(?:overview|description|background|scope|summary)\s*:?\s*([\s\S]*?)(?:\n\n|\n[A-Z])/i,
      requirements: /(?:requirements?|specification|criteria|mandatory)\s*:?\s*([\s\S]*?)(?:\n\n|\n[A-Z])/i,
      evaluation: /(?:evaluation|assessment|scoring|criteria|weighting)\s*:?\s*([\s\S]*?)(?:\n\n|\n[A-Z])/i,
      timeline: /(?:timeline|schedule|dates?|deadline|submission)\s*:?\s*([\s\S]*?)(?:\n\n|\n[A-Z])/i,
      contact: /(?:contact|enquir|question|clarification)\s*:?\s*([\s\S]*?)(?:\n\n|\n[A-Z])/i
    }

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern)
      if (match && match[1]) {
        sections[key] = match[1].trim().substring(0, 1000) // Limit section length
      }
    }

    return sections
  }
} 