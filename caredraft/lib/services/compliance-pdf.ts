import jsPDF from 'jspdf'
import { ComplianceItem } from '@/lib/database.types'
import { complianceExtractionService } from './compliance-extraction'

// Types for compliance PDF generation
export interface CompliancePDFOptions {
  title?: string
  proposalName?: string
  organizationName?: string
  includeStatistics?: boolean
  includeNotes?: boolean
  includeConfidenceScores?: boolean
  includeSourcePages?: boolean
  pageFormat?: 'a4' | 'letter'
  orientation?: 'portrait' | 'landscape'
  watermark?: string
  showOnlyCompleted?: boolean
  showOnlyPending?: boolean
  groupBySource?: boolean
}

export interface CompliancePDFResult {
  success: boolean
  blob?: Blob
  filename: string
  error?: string
  statistics: {
    totalItems: number
    completedItems: number
    pendingItems: number
    autoItems: number
    manualItems: number
    completionPercentage: number
  }
}

export class CompliancePDFGenerator {
  private pdf: jsPDF
  private currentY: number = 20
  private pageWidth: number
  private pageHeight: number
  private margins = { top: 20, right: 20, bottom: 20, left: 20 }
  private pageNumber = 1

  constructor(options: CompliancePDFOptions = {}) {
    this.pdf = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: options.pageFormat || 'a4'
    })

    this.pageWidth = this.pdf.internal.pageSize.getWidth()
    this.pageHeight = this.pdf.internal.pageSize.getHeight()
  }

  /**
   * Generate compliance checklist PDF
   */
  async generateCompliancePDF(
    proposalId: string,
    options: CompliancePDFOptions = {}
  ): Promise<CompliancePDFResult> {
    try {
      // Get compliance items from database
      const items = await complianceExtractionService.getComplianceItems(proposalId)
      
      // Filter items if requested
      let filteredItems = items
      if (options.showOnlyCompleted) {
        filteredItems = items.filter(item => item.completed)
      } else if (options.showOnlyPending) {
        filteredItems = items.filter(item => !item.completed)
      }

      // Calculate statistics
      const statistics = this.calculateStatistics(items)

      // Add metadata
      this.addPDFMetadata(options)

      // Generate content
      this.addTitlePage(options, statistics)
      this.addNewPage()

      if (options.includeStatistics) {
        this.addStatisticsPage(statistics)
        this.addNewPage()
      }

      // Add compliance items
      if (options.groupBySource) {
        this.addGroupedComplianceItems(filteredItems, options)
      } else {
        this.addComplianceItems(filteredItems, options)
      }

      // Add watermark if specified
      if (options.watermark) {
        this.addWatermark(options.watermark)
      }

      // Add page numbers
      this.addPageNumbers()

      // Generate blob
      const pdfBlob = new Blob([this.pdf.output('arraybuffer')], {
        type: 'application/pdf'
      })

      const filename = this.generateFilename(options)

      return {
        success: true,
        blob: pdfBlob,
        filename,
        statistics
      }

    } catch (error) {
      console.error('Compliance PDF generation failed:', error)
      return {
        success: false,
        filename: 'compliance-checklist.pdf',
        error: error instanceof Error ? error.message : 'Unknown error',
        statistics: {
          totalItems: 0,
          completedItems: 0,
          pendingItems: 0,
          autoItems: 0,
          manualItems: 0,
          completionPercentage: 0
        }
      }
    }
  }

  /**
   * Add title page with overview
   */
  private addTitlePage(options: CompliancePDFOptions, statistics: any): void {
    const centerX = this.pageWidth / 2

    // Main title
    this.pdf.setFontSize(24)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(
      options.title || 'Compliance Checklist',
      centerX,
      40,
      { align: 'center' }
    )

    // Proposal name
    if (options.proposalName) {
      this.currentY = 60
      this.pdf.setFontSize(16)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.text(
        options.proposalName,
        centerX,
        this.currentY,
        { align: 'center' }
      )
      this.currentY += 15
    }

    // Organization name
    if (options.organizationName) {
      this.pdf.setFontSize(14)
      this.pdf.text(
        options.organizationName,
        centerX,
        this.currentY,
        { align: 'center' }
      )
      this.currentY += 20
    }

    // Quick statistics box
    this.currentY = 100
    this.addStatisticsBox(statistics, false)

    // Generation date
    this.currentY = this.pageHeight - 40
    this.pdf.setFontSize(10)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text(
      `Generated on: ${new Date().toLocaleDateString()}`,
      centerX,
      this.currentY,
      { align: 'center' }
    )
  }

  /**
   * Add detailed statistics page
   */
  private addStatisticsPage(statistics: any): void {
    this.currentY = 30

    this.pdf.setFontSize(18)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('Compliance Statistics', this.margins.left, this.currentY)
    this.currentY += 20

    this.addStatisticsBox(statistics, true)
  }

  /**
   * Add statistics box
   */
  private addStatisticsBox(statistics: any, detailed: boolean): void {
    const boxWidth = this.pageWidth - (this.margins.left + this.margins.right)
    const boxHeight = detailed ? 80 : 60
    const boxX = this.margins.left
    const boxY = this.currentY

    // Draw box border
    this.pdf.setDrawColor(200, 200, 200)
    this.pdf.setLineWidth(0.5)
    this.pdf.rect(boxX, boxY, boxWidth, boxHeight)

    // Add statistics content
    const statsY = boxY + 15
    this.pdf.setFontSize(12)
    this.pdf.setFont('helvetica', 'bold')

    // Row 1: Total and Completion
    this.pdf.text(`Total Items: ${statistics.totalItems}`, boxX + 10, statsY)
    this.pdf.text(
      `Completion: ${statistics.completionPercentage}%`,
      boxX + boxWidth - 80,
      statsY
    )

    // Row 2: Completed and Pending
    this.pdf.text(`Completed: ${statistics.completedItems}`, boxX + 10, statsY + 15)
    this.pdf.text(`Pending: ${statistics.pendingItems}`, boxX + boxWidth - 80, statsY + 15)

    if (detailed) {
      // Row 3: Source breakdown
      this.pdf.text(`AI Extracted: ${statistics.autoItems}`, boxX + 10, statsY + 30)
      this.pdf.text(`Manual: ${statistics.manualItems}`, boxX + boxWidth - 80, statsY + 30)

      // Progress bar
      const progressBarY = statsY + 50
      const progressBarWidth = boxWidth - 20
      const progressBarHeight = 8
      const completionWidth = (progressBarWidth * statistics.completionPercentage) / 100

      // Background
      this.pdf.setFillColor(240, 240, 240)
      this.pdf.rect(boxX + 10, progressBarY, progressBarWidth, progressBarHeight, 'F')

      // Progress
      if (statistics.completionPercentage >= 90) {
        this.pdf.setFillColor(34, 197, 94) // Green
      } else if (statistics.completionPercentage >= 70) {
        this.pdf.setFillColor(234, 179, 8) // Yellow
      } else {
        this.pdf.setFillColor(239, 68, 68) // Red
      }
      
      if (completionWidth > 0) {
        this.pdf.rect(boxX + 10, progressBarY, completionWidth, progressBarHeight, 'F')
      }
    }

    this.currentY = boxY + boxHeight + 15
  }

  /**
   * Add compliance items (ungrouped)
   */
  private addComplianceItems(items: ComplianceItem[], options: CompliancePDFOptions): void {
    this.pdf.setFontSize(16)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('Compliance Requirements', this.margins.left, this.currentY)
    this.currentY += 15

    items.forEach((item, index) => {
      this.addComplianceItem(item, index + 1, options)
    })
  }

  /**
   * Add compliance items grouped by source
   */
  private addGroupedComplianceItems(items: ComplianceItem[], options: CompliancePDFOptions): void {
    const autoItems = items.filter(item => item.source_type === 'auto')
    const manualItems = items.filter(item => item.source_type === 'manual')

    // AI Extracted Items
    if (autoItems.length > 0) {
      this.pdf.setFontSize(16)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text('AI Extracted Requirements', this.margins.left, this.currentY)
      this.currentY += 15

      autoItems.forEach((item, index) => {
        this.addComplianceItem(item, index + 1, options)
      })

      this.currentY += 10
    }

    // Manual Items
    if (manualItems.length > 0) {
      this.checkPageBreak(30)
      
      this.pdf.setFontSize(16)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text('Manual Requirements', this.margins.left, this.currentY)
      this.currentY += 15

      manualItems.forEach((item, index) => {
        this.addComplianceItem(item, autoItems.length + index + 1, options)
      })
    }
  }

  /**
   * Add single compliance item
   */
  private addComplianceItem(item: ComplianceItem, itemNumber: number, options: CompliancePDFOptions): void {
    this.checkPageBreak(25)

    const contentWidth = this.pageWidth - (this.margins.left + this.margins.right)
    const statusSymbol = item.completed ? '✓' : '○'
    const statusColor = item.completed ? [34, 197, 94] : [156, 163, 175]

    // Item header with status
    this.pdf.setFontSize(12)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setTextColor(0, 0, 0)
    
    this.pdf.text(`${itemNumber}.`, this.margins.left, this.currentY)
    
    // Status symbol with color
    this.pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2])
    this.pdf.text(statusSymbol, this.margins.left + 15, this.currentY)
    
    // Reset color for text
    this.pdf.setTextColor(0, 0, 0)
    this.pdf.setFont('helvetica', 'normal')

    // Requirement text with wrapping
    const requirementText = this.pdf.splitTextToSize(
      item.requirement,
      contentWidth - 25
    )
    
    requirementText.forEach((line: string, lineIndex: number) => {
      this.pdf.text(line, this.margins.left + 25, this.currentY + (lineIndex * 5))
    })
    
    this.currentY += requirementText.length * 5 + 5

    // Additional information
    if (options.includeNotes && item.notes) {
      this.pdf.setFontSize(10)
      this.pdf.setFont('helvetica', 'italic')
      this.pdf.setTextColor(100, 100, 100)
      
      const notesText = this.pdf.splitTextToSize(
        `Notes: ${item.notes}`,
        contentWidth - 25
      )
      
      notesText.forEach((line: string, lineIndex: number) => {
        this.pdf.text(line, this.margins.left + 25, this.currentY + (lineIndex * 4))
      })
      
      this.currentY += notesText.length * 4 + 3
    }

    // Confidence score and source page
    if ((options.includeConfidenceScores && item.confidence_score !== null) ||
        (options.includeSourcePages && item.source_page !== null)) {
      this.pdf.setFontSize(9)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.setTextColor(120, 120, 120)
      
      const metaInfo: string[] = []
      
      if (options.includeConfidenceScores && item.confidence_score !== null) {
        metaInfo.push(`Confidence: ${Math.round(item.confidence_score * 100)}%`)
      }
      
      if (options.includeSourcePages && item.source_page !== null) {
        metaInfo.push(`Source Page: ${item.source_page}`)
      }
      
      if (metaInfo.length > 0) {
        this.pdf.text(
          metaInfo.join(' • '),
          this.margins.left + 25,
          this.currentY
        )
        this.currentY += 8
      }
    }

    // Reset text color
    this.pdf.setTextColor(0, 0, 0)
    this.currentY += 5
  }

  /**
   * Check if we need a page break
   */
  private checkPageBreak(neededSpace: number): void {
    if (this.currentY + neededSpace > this.pageHeight - this.margins.bottom) {
      this.addNewPage()
    }
  }

  /**
   * Add a new page
   */
  private addNewPage(): void {
    this.pdf.addPage()
    this.pageNumber++
    this.currentY = this.margins.top
  }

  /**
   * Add watermark to all pages
   */
  private addWatermark(watermarkText: string): void {
    const pageCount = this.pdf.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i)
      
      this.pdf.saveGraphicsState()
      this.pdf.setGState(this.pdf.GState({ opacity: 0.1 }))
      this.pdf.setFontSize(50)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.setTextColor(128, 128, 128)
      
      const centerX = this.pageWidth / 2
      const centerY = this.pageHeight / 2
      
      this.pdf.text(
        watermarkText,
        centerX,
        centerY,
        { align: 'center', angle: 45 }
      )
      
      this.pdf.restoreGraphicsState()
    }
  }

  /**
   * Add page numbers to all pages
   */
  private addPageNumbers(): void {
    const pageCount = this.pdf.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i)
      
      this.pdf.setFontSize(10)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.setTextColor(100, 100, 100)
      
      this.pdf.text(
        `Page ${i} of ${pageCount}`,
        this.pageWidth - this.margins.right,
        this.pageHeight - 10,
        { align: 'right' }
      )
    }
  }

  /**
   * Calculate statistics from compliance items
   */
  private calculateStatistics(items: ComplianceItem[]) {
    const totalItems = items.length
    const completedItems = items.filter(item => item.completed).length
    const pendingItems = totalItems - completedItems
    const autoItems = items.filter(item => item.source_type === 'auto').length
    const manualItems = items.filter(item => item.source_type === 'manual').length
    const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

    return {
      totalItems,
      completedItems,
      pendingItems,
      autoItems,
      manualItems,
      completionPercentage
    }
  }

  /**
   * Generate filename for the PDF
   */
  private generateFilename(options: CompliancePDFOptions): string {
    const baseFilename = options.proposalName
      ? `${options.proposalName.replace(/[^a-zA-Z0-9]/g, '_')}_compliance_checklist`
      : 'compliance_checklist'
    
    const timestamp = new Date().toISOString().split('T')[0]
    
    return `${baseFilename}_${timestamp}.pdf`
  }

  /**
   * Add PDF metadata
   */
  private addPDFMetadata(options: CompliancePDFOptions): void {
    this.pdf.setProperties({
      title: options.title || 'Compliance Checklist',
      subject: options.proposalName || 'Proposal Compliance Requirements',
      author: options.organizationName || 'CareDraft',
      creator: 'CareDraft Compliance System'
    })
  }
}

// Export convenience function
export const compliancePDFGenerator = new CompliancePDFGenerator()

export default CompliancePDFGenerator 