import { DocumentExportService, type ExportOptions, type ExportResult } from './export'
import { PDFGenerator } from './pdf-generator'
import { DOCXGenerator } from './docx-generator'
import { ExportValidator } from '@/lib/validations/export.validation'
import { EXPORT_CONFIG } from '@/lib/config/export.config'
import type { Database } from '@/lib/database.types'

// Types for research session export
type ResearchSession = Database['public']['Tables']['research_sessions']['Row']

export interface ResearchResult {
  id?: string
  title: string
  url: string
  snippet: string
  source?: string
  date?: string
  relevance_score?: number
}

export interface ResearchSessionExportData {
  id: string
  title: string
  query: string
  results: ResearchResult[]
  created_at: string
  updated_at: string
  session_metadata?: Record<string, unknown>
  organization_id?: string
  user_id: string
}

export interface ResearchSessionExportOptions extends Omit<ExportOptions, 'includeCompliance'> {
  includeQuery?: boolean
  includeMetadata?: boolean
  includeResultsMetadata?: boolean
  resultsLimit?: number
  groupBySource?: boolean
  sortByRelevance?: boolean
}

/**
 * Research Session Export Service
 * Leverages the existing DocumentExportService infrastructure to export research sessions
 */
export class ResearchSessionExportService {
  private static instance: ResearchSessionExportService

  private constructor() {}

  public static getInstance(): ResearchSessionExportService {
    if (!ResearchSessionExportService.instance) {
      ResearchSessionExportService.instance = new ResearchSessionExportService()
    }
    return ResearchSessionExportService.instance
  }

  /**
   * Export research session to PDF or DOCX
   */
  async exportResearchSession(
    sessionData: ResearchSessionExportData,
    options: ResearchSessionExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now()

    try {
      console.log(`Starting ${options.format.toUpperCase()} export for research session:`, sessionData.id)

      // Validate the export request
      this.validateExportRequest(sessionData, options)

      // Transform research session data to export-compatible format
      const exportData = this.transformSessionToExportData(sessionData, options)

      // Use the appropriate generator based on format
      let result: ExportResult

      switch (options.format) {
        case 'pdf':
          result = await this.generateResearchSessionPDF(exportData, options)
          break
        case 'docx':
          result = await this.generateResearchSessionDOCX(exportData, options)
          break
        default:
          throw new Error(`Unsupported export format: ${options.format}`)
      }

      const processingTime = Date.now() - startTime
      result.metadata.processingTime = processingTime

      console.log(`Research session export completed in ${processingTime}ms`)
      return result

    } catch {
      console.error('Research session export failed:', error)
      return {
        success: false,
        error: {
          code: 'RESEARCH_SESSION_EXPORT_FAILED',
          message: error instanceof Error ? error.message : 'Unknown export error',
          details: error
        },
        metadata: {
          format: options.format,
          generatedAt: new Date().toISOString(),
          processingTime: Date.now() - startTime
        }
      }
    }
  }

  /**
   * Generate PDF for research session
   */
  private async generateResearchSessionPDF(
    exportData: unknown,
    options: ResearchSessionExportOptions
  ): Promise<ExportResult> {
    try {
      // Create custom PDF generator for research sessions
      const generator = new ResearchSessionPDFGenerator()
      const result = await generator.generatePDF(exportData, options)

      return result

    } catch {
      console.error('Research session PDF generation failed:', error)
      throw error
    }
  }

  /**
   * Generate DOCX for research session
   */
  private async generateResearchSessionDOCX(
    exportData: unknown,
    options: ResearchSessionExportOptions
  ): Promise<ExportResult> {
    try {
      // Create custom DOCX generator for research sessions
      const generator = new ResearchSessionDOCXGenerator()
      const result = await generator.generateDOCX(exportData, options)

      return result

    } catch {
      console.error('Research session DOCX generation failed:', error)
      throw error
    }
  }

  /**
   * Transform research session data to export-compatible format
   */
  private transformSessionToExportData(
    sessionData: ResearchSessionExportData,
    options: ResearchSessionExportOptions
  ) {
    let results = sessionData.results || []

    // Apply results limit if specified
    if (options.resultsLimit && options.resultsLimit > 0) {
      results = results.slice(0, options.resultsLimit)
    }

    // Sort by relevance if requested
    if (options.sortByRelevance) {
      results = results.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
    }

    // Group by source if requested
    let groupedResults: Record<string, ResearchResult[]> | null = null
    if (options.groupBySource) {
      groupedResults = results.reduce((groups, result) => {
        const source = result.source || 'Unknown Source'
        if (!groups[source]) {
          groups[source] = []
        }
        groups[source].push(result)
        return groups
      }, {} as Record<string, ResearchResult[]>)
    }

    return {
      id: sessionData.id,
      title: sessionData.title,
      query: options.includeQuery !== false ? sessionData.query : undefined,
      results: groupedResults || results,
      metadata: {
        created_at: sessionData.created_at,
        updated_at: sessionData.updated_at,
        session_metadata: options.includeMetadata ? sessionData.session_metadata : undefined,
        total_results: sessionData.results?.length || 0,
        exported_results: results.length,
        export_options: {
          includeQuery: options.includeQuery,
          includeMetadata: options.includeMetadata,
          resultsLimit: options.resultsLimit,
          groupBySource: options.groupBySource,
          sortByRelevance: options.sortByRelevance
        }
      }
    }
  }

  /**
   * Validate export request
   */
  private validateExportRequest(
    sessionData: ResearchSessionExportData,
    options: ResearchSessionExportOptions
  ): void {
    // Validate session data
    if (!sessionData.id || !sessionData.title) {
      throw new Error('Invalid research session data: missing ID or title')
    }

    if (!sessionData.results || sessionData.results.length === 0) {
      throw new Error('Cannot export research session with no results')
    }

    // Basic validation for format
    if (!options.format || !['pdf', 'docx'].includes(options.format)) {
      throw new Error('Invalid export format. Must be either "pdf" or "docx"')
    }

    // Validate results limit
    if (options.resultsLimit && (options.resultsLimit < 1 || options.resultsLimit > 1000)) {
      throw new Error('Results limit must be between 1 and 1000')
    }
  }

  /**
   * Generate filename for research session export
   */
  generateFilename(sessionTitle: string, format: 'pdf' | 'docx'): string {
    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const sanitizedTitle = sessionTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50) // Limit length

    return `research-session-${sanitizedTitle}-${timestamp}.${format}`
  }

  /**
   * Get supported export formats
   */
  getSupportedFormats(): string[] {
    return ['pdf', 'docx']
  }

  /**
   * Estimate export file size
   */
  estimateFileSize(sessionData: ResearchSessionExportData, format: 'pdf' | 'docx'): number {
    // Calculate content length
    const titleLength = sessionData.title.length
    const queryLength = sessionData.query.length
    const resultsLength = sessionData.results.reduce((total, result) => {
      return total + result.title.length + result.snippet.length + result.url.length + (result.source?.length || 0)
    }, 0)

    const totalContentLength = titleLength + queryLength + resultsLength

    // Apply format-specific multipliers
    switch (format) {
      case 'pdf':
        return Math.round(totalContentLength * 0.8) // PDF compression
      case 'docx':
        return Math.round(totalContentLength * 1.2) // DOCX overhead
      default:
        return totalContentLength
    }
  }
}

/**
 * Custom PDF Generator for Research Sessions
 */
class ResearchSessionPDFGenerator {
  private pdf: unknown
  private currentY: number = 20

  constructor() {
    // Dynamic import will be handled in generatePDF
  }

  async generatePDF(exportData: unknown, options: unknown): Promise<ExportResult> {
    try {
      // Dynamic import for jsPDF
      const { default: jsPDF } = await import('jspdf')
      
      this.pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      this.currentY = 20

      // Add title
      this.addTitle(exportData.title)

      // Add query section
      if (exportData.query) {
        this.addSection('Research Query', exportData.query)
      }

      // Add results section
      this.addResultsSection(exportData.results, options)

      // Add metadata if requested
      if (exportData.metadata && options.includeMetadata) {
        this.addMetadataSection(exportData.metadata)
      }

      // Generate the PDF blob
      const pdfBlob = new Blob([this.pdf.output('arraybuffer')], {
        type: 'application/pdf'
      })

      const filename = `research-session-${exportData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`

      return {
        success: true,
        data: {
          blob: pdfBlob,
          filename,
          size: pdfBlob.size
        },
        metadata: {
          format: 'pdf',
          generatedAt: new Date().toISOString(),
          processingTime: 0
        }
      }

    } catch {
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private addTitle(title: string) {
    this.pdf.setFontSize(20)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(title, 20, this.currentY)
    this.currentY += 15
  }

  private addSection(title: string, content: string) {
    this.checkPageBreak(30)
    
    this.pdf.setFontSize(16)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(title, 20, this.currentY)
    this.currentY += 10

    this.pdf.setFontSize(12)
    this.pdf.setFont('helvetica', 'normal')
    const lines = this.pdf.splitTextToSize(content, 170)
    this.pdf.text(lines, 20, this.currentY)
    this.currentY += lines.length * 6 + 10
  }

  private addResultsSection(results: unknown, options: unknown) {
    this.checkPageBreak(30)
    
    this.pdf.setFontSize(16)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('Research Results', 20, this.currentY)
    this.currentY += 15

    if (Array.isArray(results)) {
      results.forEach((result, index) => {
        this.addResult(result, index + 1)
      })
    } else {
      // Grouped results
      Object.entries(results).forEach(([source, sourceResults]) => {
        this.addSourceGroup(source, sourceResults as ResearchResult[])
      })
    }
  }

  private addResult(result: ResearchResult, index: number) {
    this.checkPageBreak(50)

    // Result number and title
    this.pdf.setFontSize(14)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(`${index}. ${result.title}`, 20, this.currentY)
    this.currentY += 8

    // URL
    this.pdf.setFontSize(10)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setTextColor(0, 0, 255)
    this.pdf.text(result.url, 25, this.currentY)
    this.currentY += 8

    // Reset color
    this.pdf.setTextColor(0, 0, 0)

    // Snippet
    this.pdf.setFontSize(11)
    const snippetLines = this.pdf.splitTextToSize(result.snippet, 165)
    this.pdf.text(snippetLines, 25, this.currentY)
    this.currentY += snippetLines.length * 5

    // Source and relevance
    if (result.source || result.relevance_score) {
      this.pdf.setFontSize(9)
      this.pdf.setTextColor(128, 128, 128)
      let metadata = ''
      if (result.source) metadata += `Source: ${result.source}`
      if (result.relevance_score) {
        if (metadata) metadata += ' • '
        metadata += `Relevance: ${(result.relevance_score * 100).toFixed(1)}%`
      }
      this.pdf.text(metadata, 25, this.currentY)
      this.currentY += 6
    }

    this.pdf.setTextColor(0, 0, 0)
    this.currentY += 8
  }

  private addSourceGroup(source: string, results: ResearchResult[]) {
    this.checkPageBreak(40)

    this.pdf.setFontSize(14)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(`Source: ${source}`, 20, this.currentY)
    this.currentY += 12

    results.forEach((result, index) => {
      this.addResult(result, index + 1)
    })

    this.currentY += 10
  }

  private addMetadataSection(metadata: unknown) {
    this.checkPageBreak(40)
    
    this.pdf.setFontSize(16)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('Session Information', 20, this.currentY)
    this.currentY += 15

    this.pdf.setFontSize(11)
    this.pdf.setFont('helvetica', 'normal')

    if (metadata.created_at) {
      this.pdf.text(`Created: ${new Date(metadata.created_at).toLocaleDateString()}`, 25, this.currentY)
      this.currentY += 8
    }

    if (metadata.total_results) {
      this.pdf.text(`Total Results: ${metadata.total_results}`, 25, this.currentY)
      this.currentY += 8
    }

    if (metadata.exported_results) {
      this.pdf.text(`Exported Results: ${metadata.exported_results}`, 25, this.currentY)
      this.currentY += 8
    }
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.currentY + requiredSpace > 280) { // Near bottom of page
      this.pdf.addPage()
      this.currentY = 20
    }
  }
}

/**
 * Custom DOCX Generator for Research Sessions
 */
class ResearchSessionDOCXGenerator {
  async generateDOCX(exportData: unknown, options: unknown): Promise<ExportResult> {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ExternalHyperlink } = await import('docx')

      const children: unknown[] = []

      // Title
      children.push(
        new Paragraph({
          children: [new TextRun({ text: exportData.title, bold: true, size: 32 })],
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      )

      // Query section
      if (exportData.query) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: 'Research Query', bold: true, size: 24 })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          }),
          new Paragraph({
            children: [new TextRun({ text: exportData.query, size: 22 })],
            spacing: { after: 400 }
          })
        )
      }

      // Results section
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'Research Results', bold: true, size: 24 })],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      )

      // Add results
      if (Array.isArray(exportData.results)) {
        exportData.results.forEach((result: ResearchResult, index: number) => {
          this.addResultToDOCX(children, result, index + 1)
        })
      } else {
        // Grouped results
        Object.entries(exportData.results).forEach(([source, sourceResults]) => {
          this.addSourceGroupToDOCX(children, source, sourceResults as ResearchResult[])
        })
      }

      // Metadata section
      if (exportData.metadata && options.includeMetadata) {
        this.addMetadataToDOCX(children, exportData.metadata)
      }

      const doc = new Document({
        creator: 'CareDraft Research Session Export',
        title: exportData.title,
        description: 'Research Session Export',
        sections: [{
          properties: {},
          children
        }]
      })

      const buffer = await Packer.toBuffer(doc)
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      })

      const filename = `research-session-${exportData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.docx`

      return {
        success: true,
        data: {
          blob,
          filename,
          size: blob.size
        },
        metadata: {
          format: 'docx',
          generatedAt: new Date().toISOString(),
          processingTime: 0
        }
      }

    } catch {
      throw new Error(`DOCX generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private addResultToDOCX(children: unknown[], result: ResearchResult, index: number) {
    const { Paragraph, TextRun, HeadingLevel, ExternalHyperlink } = require('docx')

    // Result title
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${index}. ${result.title}`, bold: true, size: 22 })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 }
      })
    )

    // URL
    children.push(
      new Paragraph({
        children: [
          new ExternalHyperlink({
            children: [new TextRun({ text: result.url, style: 'Hyperlink', size: 20 })],
            link: result.url
          })
        ],
        spacing: { after: 100 }
      })
    )

    // Snippet
    children.push(
      new Paragraph({
        children: [new TextRun({ text: result.snippet, size: 20 })],
        spacing: { after: 100 }
      })
    )

    // Metadata
    if (result.source || result.relevance_score) {
      let metadata = ''
      if (result.source) metadata += `Source: ${result.source}`
      if (result.relevance_score) {
        if (metadata) metadata += ' • '
        metadata += `Relevance: ${(result.relevance_score * 100).toFixed(1)}%`
      }

      children.push(
        new Paragraph({
          children: [new TextRun({ text: metadata, size: 18, italics: true, color: '808080' })],
          spacing: { after: 200 }
        })
      )
    }
  }

  private addSourceGroupToDOCX(children: unknown[], source: string, results: ResearchResult[]) {
    const { Paragraph, TextRun, HeadingLevel } = require('docx')

    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Source: ${source}`, bold: true, size: 24 })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      })
    )

    results.forEach((result, index) => {
      this.addResultToDOCX(children, result, index + 1)
    })
  }

  private addMetadataToDOCX(children: unknown[], metadata: unknown) {
    const { Paragraph, TextRun, HeadingLevel } = require('docx')

    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Session Information', bold: true, size: 24 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 200 }
      })
    )

    if (metadata.created_at) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Created: ${new Date(metadata.created_at).toLocaleDateString()}`, size: 20 })],
          spacing: { after: 100 }
        })
      )
    }

    if (metadata.total_results) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Total Results: ${metadata.total_results}`, size: 20 })],
          spacing: { after: 100 }
        })
      )
    }

    if (metadata.exported_results) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Exported Results: ${metadata.exported_results}`, size: 20 })],
          spacing: { after: 100 }
        })
      )
    }
  }
}

// Export service instance
export const researchSessionExportService = ResearchSessionExportService.getInstance() 