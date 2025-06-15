import { 
  ChunkingConfig, 
  DocumentType
} from '@/types/rag'

export interface ProcessedChunk {
  content: string
  tokens: number
  index: number
  metadata: Record<string, unknown>
  page_number?: number
  section_title?: string
  overlap_tokens?: number
  start_char?: number
  end_char?: number
}

export interface DocumentMetadata {
  title?: string
  author?: string
  created_date?: string
  document_type?: DocumentType
  language?: string
  sections?: string[]
  keywords?: string[]
  care_sector_terms?: string[]
}

export class DocumentProcessor {
  private careSectorTerms = [
    'care plan', 'assessment', 'medication', 'safeguarding', 'wellbeing',
    'person-centred', 'dignity', 'independence', 'quality of life',
    'risk assessment', 'care package', 'support worker', 'key worker',
    'care coordinator', 'multidisciplinary', 'holistic care', 'advocacy',
    'mental capacity', 'best interests', 'consent', 'confidentiality',
    'CQC', 'regulation', 'compliance', 'standards', 'inspection',
    'domiciliary care', 'residential care', 'nursing home', 'day centre',
    'respite care', 'palliative care', 'dementia care', 'learning disability',
    'physical disability', 'mental health', 'substance misuse', 'autism',
    'ADHD', 'acquired brain injury', 'sensory impairment'
  ]

  async processDocument(
    content: string, 
    config: ChunkingConfig,
    metadata?: DocumentMetadata
  ): Promise<ProcessedChunk[]> {
    try {
      // Clean and normalize the content
      const cleanedContent = this.cleanContent(content)
      
      // Extract metadata from content if not provided
      const extractedMetadata = metadata || this.extractMetadata(cleanedContent)
      
      // Choose chunking strategy based on config
      let chunks: ProcessedChunk[]
      
      switch (config.chunk_strategy) {
        case 'semantic':
          chunks = await this.semanticChunking(cleanedContent, config, extractedMetadata)
          break
        case 'sentence':
          chunks = this.sentenceBasedChunking(cleanedContent, config, extractedMetadata)
          break
        case 'fixed':
        default:
          chunks = this.fixedSizeChunking(cleanedContent, config, extractedMetadata)
          break
      }

      // Add care sector specific metadata
      chunks = this.enrichWithCareSectorMetadata(chunks)
      
      return chunks
    } catch (error) {
      console.error('Error processing document:', error)
      throw error
    }
  }

  private cleanContent(content: string): string {
    // Remove excessive whitespace
    let cleaned = content.replace(/\s+/g, ' ')
    
    // Normalize line breaks
    cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    
    // Remove multiple consecutive line breaks
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
    
    // Clean up common document artifacts
    cleaned = cleaned.replace(/\f/g, '\n') // Form feeds
    cleaned = cleaned.replace(/\u00A0/g, ' ') // Non-breaking spaces
    
    // Remove page numbers and headers/footers (basic patterns)
    cleaned = cleaned.replace(/^Page \d+.*$/gm, '')
    cleaned = cleaned.replace(/^\d+\s*$/gm, '')
    
    return cleaned.trim()
  }

  private extractMetadata(content: string): DocumentMetadata {
    const metadata: DocumentMetadata = {}
    
    // Extract potential title (first line or heading)
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length > 0) {
      const firstLine = lines[0].trim()
      if (firstLine.length < 100 && !firstLine.includes('.')) {
        metadata.title = firstLine
      }
    }
    
    // Extract sections (lines that look like headings)
    const sections = content.match(/^[A-Z][A-Za-z\s]{2,50}$/gm) || []
    metadata.sections = sections.slice(0, 10) // Limit to first 10 sections
    
    // Extract care sector terms
    const foundTerms = this.careSectorTerms.filter(term => 
      content.toLowerCase().includes(term.toLowerCase())
    )
    metadata.care_sector_terms = foundTerms
    
    // Detect language (basic English detection)
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
    const wordCount = content.toLowerCase().split(/\s+/).length
    const englishWordCount = englishWords.reduce((count, word) => 
      count + (content.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length, 0
    )
    
    if (englishWordCount / wordCount > 0.05) {
      metadata.language = 'en'
    }
    
    return metadata
  }

  private fixedSizeChunking(
    content: string, 
    config: ChunkingConfig, 
    metadata: DocumentMetadata
  ): ProcessedChunk[] {
    const chunks: ProcessedChunk[] = []
    const sentences = this.splitIntoSentences(content)
    
    let currentChunk = ''
    let chunkIndex = 0
    let charPosition = 0
    
    for (const sentence of sentences) {
      const sentenceWithSpace = sentence.trim() + ' '
      
      if (currentChunk.length + sentenceWithSpace.length > config.max_chunk_size) {
        if (currentChunk.trim()) {
          const chunk = this.createChunk(
            currentChunk.trim(), 
            chunkIndex++, 
            metadata,
            charPosition - currentChunk.length,
            charPosition
          )
          chunks.push(chunk)
        }
        
        // Handle overlap
        if (config.overlap_size > 0 && chunks.length > 0) {
          const overlap = this.getOverlapText(currentChunk, config.overlap_size)
          currentChunk = overlap + ' ' + sentenceWithSpace
        } else {
          currentChunk = sentenceWithSpace
        }
      } else {
        currentChunk += sentenceWithSpace
      }
      
      charPosition += sentenceWithSpace.length
    }
    
    // Add final chunk
    if (currentChunk.trim()) {
      const chunk = this.createChunk(
        currentChunk.trim(), 
        chunkIndex, 
        metadata,
        charPosition - currentChunk.length,
        charPosition
      )
      chunks.push(chunk)
    }
    
    return chunks
  }

  private sentenceBasedChunking(
    content: string, 
    config: ChunkingConfig, 
    metadata: DocumentMetadata
  ): ProcessedChunk[] {
    const chunks: ProcessedChunk[] = []
    const sentences = this.splitIntoSentences(content)
    
    let currentChunk: string[] = []
    let chunkIndex = 0
    let charPosition = 0
    
    for (const sentence of sentences) {
      const testChunk = [...currentChunk, sentence].join(' ')
      
      if (testChunk.length > config.max_chunk_size && currentChunk.length > 0) {
        // Create chunk from current sentences
        const chunkText = currentChunk.join(' ')
        const chunk = this.createChunk(
          chunkText, 
          chunkIndex++, 
          metadata,
          charPosition - chunkText.length,
          charPosition
        )
        chunks.push(chunk)
        
        // Handle overlap by keeping last few sentences
        if (config.overlap_size > 0) {
          const overlapSentences = Math.min(2, currentChunk.length)
          currentChunk = currentChunk.slice(-overlapSentences)
          currentChunk.push(sentence)
        } else {
          currentChunk = [sentence]
        }
      } else {
        currentChunk.push(sentence)
      }
      
      charPosition += sentence.length + 1
    }
    
    // Add final chunk
    if (currentChunk.length > 0) {
      const chunkText = currentChunk.join(' ')
      const chunk = this.createChunk(
        chunkText, 
        chunkIndex, 
        metadata,
        charPosition - chunkText.length,
        charPosition
      )
      chunks.push(chunk)
    }
    
    return chunks
  }

  private async semanticChunking(
    content: string, 
    config: ChunkingConfig, 
    metadata: DocumentMetadata
  ): Promise<ProcessedChunk[]> {
    // For now, use sentence-based chunking with semantic boundaries
    // In a full implementation, this would use embeddings to find semantic breaks
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim())
    const chunks: ProcessedChunk[] = []
    
    let currentChunk = ''
    let chunkIndex = 0
    let charPosition = 0
    
    for (const paragraph of paragraphs) {
      const paragraphWithBreak = paragraph.trim() + '\n\n'
      
      if (currentChunk.length + paragraphWithBreak.length > config.max_chunk_size) {
        if (currentChunk.trim()) {
          const chunk = this.createChunk(
            currentChunk.trim(), 
            chunkIndex++, 
            metadata,
            charPosition - currentChunk.length,
            charPosition
          )
          chunks.push(chunk)
        }
        
        // For semantic chunking, we try to preserve paragraph boundaries
        currentChunk = paragraphWithBreak
      } else {
        currentChunk += paragraphWithBreak
      }
      
      charPosition += paragraphWithBreak.length
    }
    
    // Add final chunk
    if (currentChunk.trim()) {
      const chunk = this.createChunk(
        currentChunk.trim(), 
        chunkIndex, 
        metadata,
        charPosition - currentChunk.length,
        charPosition
      )
      chunks.push(chunk)
    }
    
    return chunks
  }

  private splitIntoSentences(text: string): string[] {
    // Enhanced sentence splitting that handles common abbreviations
    const abbreviations = ['Dr', 'Mr', 'Mrs', 'Ms', 'Prof', 'Ltd', 'Inc', 'Corp', 'etc', 'vs', 'e.g', 'i.e']
    
    // Replace abbreviations temporarily
    let processedText = text
    abbreviations.forEach((abbr, index) => {
      const regex = new RegExp(`\\b${abbr}\\.`, 'gi')
      processedText = processedText.replace(regex, `${abbr}__TEMP_${index}__`)
    })
    
    // Split on sentence endings
    const sentences = processedText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    // Restore abbreviations
    return sentences.map(sentence => {
      let restored = sentence
      abbreviations.forEach((abbr, index) => {
        restored = restored.replace(new RegExp(`${abbr}__TEMP_${index}__`, 'g'), `${abbr}.`)
      })
      return restored
    })
  }

  private createChunk(
    content: string, 
    index: number, 
    metadata: DocumentMetadata,
    startChar?: number,
    endChar?: number
  ): ProcessedChunk {
    return {
      content,
      tokens: this.estimateTokens(content),
      index,
      metadata: {
        ...metadata,
        word_count: content.split(/\s+/).length,
        char_count: content.length,
        has_care_terms: this.containsCareSectorTerms(content)
      },
      start_char: startChar,
      end_char: endChar
    }
  }

  private getOverlapText(text: string, overlapSize: number): string {
    const words = text.split(/\s+/)
    return words.slice(-overlapSize).join(' ')
  }

  private estimateTokens(text: string): number {
    // More accurate token estimation
    // Roughly 4 characters per token, but adjust for punctuation and spaces
    const words = text.split(/\s+/).length
    const chars = text.length
    return Math.ceil((words * 1.3 + chars * 0.25) / 4)
  }

  private containsCareSectorTerms(content: string): boolean {
    const lowerContent = content.toLowerCase()
    return this.careSectorTerms.some(term => 
      lowerContent.includes(term.toLowerCase())
    )
  }

  private enrichWithCareSectorMetadata(chunks: ProcessedChunk[]): ProcessedChunk[] {
    return chunks.map(chunk => {
      const careSectorTermsFound = this.careSectorTerms.filter(term =>
        chunk.content.toLowerCase().includes(term.toLowerCase())
      )
      
      // Identify potential section types based on content
      const sectionType = this.identifySectionType(chunk.content)
      
      return {
        ...chunk,
        metadata: {
          ...chunk.metadata,
          care_sector_terms_found: careSectorTermsFound,
          care_sector_term_count: careSectorTermsFound.length,
          section_type: sectionType,
          contains_assessment: chunk.content.toLowerCase().includes('assessment'),
          contains_care_plan: chunk.content.toLowerCase().includes('care plan'),
          contains_medication: chunk.content.toLowerCase().includes('medication'),
          contains_risk: chunk.content.toLowerCase().includes('risk'),
          regulatory_content: this.containsRegulatoryContent(chunk.content)
        }
      }
    })
  }

  private identifySectionType(content: string): string {
    const lowerContent = content.toLowerCase()
    
    if (lowerContent.includes('assessment') || lowerContent.includes('evaluate')) {
      return 'assessment'
    }
    if (lowerContent.includes('care plan') || lowerContent.includes('support plan')) {
      return 'care_plan'
    }
    if (lowerContent.includes('medication') || lowerContent.includes('prescription')) {
      return 'medication'
    }
    if (lowerContent.includes('risk') || lowerContent.includes('safety')) {
      return 'risk_management'
    }
    if (lowerContent.includes('policy') || lowerContent.includes('procedure')) {
      return 'policy'
    }
    if (lowerContent.includes('training') || lowerContent.includes('competency')) {
      return 'training'
    }
    
    return 'general'
  }

  private containsRegulatoryContent(content: string): boolean {
    const regulatoryTerms = [
      'CQC', 'regulation', 'compliance', 'standard', 'inspection',
      'fundamental standards', 'KLOE', 'outcome', 'requirement',
      'must', 'should', 'essential', 'mandatory'
    ]
    
    const lowerContent = content.toLowerCase()
    return regulatoryTerms.some(term => 
      lowerContent.includes(term.toLowerCase())
    )
  }

  // File processing methods for different document types
  async processFile(file: File, config: ChunkingConfig): Promise<ProcessedChunk[]> {
    const content = await this.extractTextFromFile(file)
    const metadata: DocumentMetadata = {
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      document_type: this.getDocumentTypeFromFile(file)
    }
    
    return this.processDocument(content, config, metadata)
  }

  private async extractTextFromFile(file: File): Promise<string> {
    // For now, handle text files. In production, you'd add PDF, Word, etc. parsers
    if (file.type.startsWith('text/')) {
      return await file.text()
    }
    
    // Placeholder for other file types
    throw new Error(`Unsupported file type: ${file.type}`)
  }

  private getDocumentTypeFromFile(file: File): DocumentType {
    const extension = file.name.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'pdf': return 'pdf'
      case 'doc':
      case 'docx': return 'word'
      case 'txt': return 'text'
      case 'md': return 'markdown'
      case 'xls':
      case 'xlsx': return 'excel'
      case 'ppt':
      case 'pptx': return 'powerpoint'
      default: return 'other'
    }
  }
}

export const documentProcessor = new DocumentProcessor() 