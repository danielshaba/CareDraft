import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  type ProposalExportData, 
  type ExportOptions, 
  type ExportResult,
  ExportUtils,
  GenerationError 
} from './export';
import { EXPORT_CONFIG, MIME_TYPES } from '@/lib/config/export.config';

interface PDFSection {
  id: string;
  title: string;
  content: string;
  level: number;
  children?: PDFSection[];
}

interface PDFGenerationOptions {
  title: string;
  author?: string;
  organization?: string;
  includeTableOfContents?: boolean;
  sections: PDFSection[];
  metadata?: {
    description?: string;
    subject?: string;
    keywords?: string[];
  };
  formatting?: {
    fontSize?: number;
    lineHeight?: number;
    margins?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
}

interface PDFExportResult {
  buffer: Uint8Array;
  filename: string;
  success: boolean;
  error?: string;
}

export interface PDFPageMetrics {
  width: number;
  height: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  contentWidth: number;
  contentHeight: number;
}

export class PDFGenerator {
  private pdf: jsPDF;
  private currentY: number = 0;
  private pageMetrics: PDFPageMetrics;
  private pageNumber: number = 1;
  private totalPages: number = 1;

  constructor(options: PDFGenerationOptions = { format: 'pdf' }) {
    // Initialize jsPDF with specified options
    this.pdf = new jsPDF({
      orientation: options.orientation || EXPORT_CONFIG.PDF.ORIENTATION,
      unit: EXPORT_CONFIG.PDF.UNIT,
      format: options.pageFormat || EXPORT_CONFIG.PDF.DEFAULT_FORMAT,
      compress: true
    });

    // Calculate page metrics
    this.pageMetrics = this.calculatePageMetrics(options);
    this.currentY = this.pageMetrics.margins.top;
  }

  /**
   * Generate a PDF document from structured content
   */
  static async generatePDF(options: PDFGenerationOptions): Promise<PDFExportResult> {
    try {
      const {
        title,
        author = 'CareDraft',
        organization = 'CareDraft',
        sections,
        metadata,
        formatting = {}
      } = options;

      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set document metadata
      doc.setProperties({
        title,
        author,
        subject: metadata?.subject || title,
        keywords: metadata?.keywords?.join(', ') || '',
        creator: organization
      });

      // Default formatting
      const defaultMargins = { top: 20, right: 20, bottom: 20, left: 20 };
      const margins = { ...defaultMargins, ...formatting.margins };
      const fontSize = formatting.fontSize || 12;
      const lineHeight = formatting.lineHeight || 1.5;

      let currentY = margins.top;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - margins.left - margins.right;

      // Add title page
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      const titleLines = doc.splitTextToSize(title, contentWidth);
      doc.text(titleLines, margins.left, currentY);
      currentY += titleLines.length * 10;

      // Add metadata
      if (author || organization) {
        currentY += 10;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        if (organization) {
          doc.text(organization, margins.left, currentY);
          currentY += 7;
        }
        if (author) {
          doc.text(`By: ${author}`, margins.left, currentY);
          currentY += 7;
        }
      }

      // Add date
      currentY += 10;
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, margins.left, currentY);

      // Start new page for content
      doc.addPage();
      currentY = margins.top;

      // Add table of contents if requested
      if (options.includeTableOfContents) {
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Table of Contents', margins.left, currentY);
        currentY += 15;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        sections.forEach((section, index) => {
          const pageNum = index + 3; // Rough page estimation
          const tocLine = `${section.title}...${pageNum}`;
          doc.text(tocLine, margins.left, currentY);
          currentY += 6;
          
          if (currentY > pageHeight - margins.bottom) {
            doc.addPage();
            currentY = margins.top;
          }
        });

        doc.addPage();
        currentY = margins.top;
      }

      // Add sections
      for (const section of sections) {
        // Check if we need a new page
        if (currentY > pageHeight - margins.bottom - 30) {
          doc.addPage();
          currentY = margins.top;
        }

        // Add section title
        const titleFontSize = Math.max(16 - (section.level * 2), 12);
        doc.setFontSize(titleFontSize);
        doc.setFont('helvetica', 'bold');
        
        const sectionTitleLines = doc.splitTextToSize(section.title, contentWidth);
        doc.text(sectionTitleLines, margins.left, currentY);
        currentY += sectionTitleLines.length * (titleFontSize * 0.35) + 5;

        // Add section content
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', 'normal');
        
        const contentLines = doc.splitTextToSize(section.content, contentWidth);
        
        for (const line of contentLines) {
          if (currentY > pageHeight - margins.bottom) {
            doc.addPage();
            currentY = margins.top;
          }
          
          doc.text(line, margins.left, currentY);
          currentY += fontSize * lineHeight * 0.35;
        }

        currentY += 10; // Space after section
      }

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.pdf`;

      // Get PDF as array buffer
      const pdfBuffer = doc.output('arraybuffer');
      const uint8Array = new Uint8Array(pdfBuffer);

      return {
        buffer: uint8Array,
        filename,
        success: true
      };

    } catch (error) {
      console.error('PDF generation error:', error);
      return {
        buffer: new Uint8Array(),
        filename: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate PDF from tender proposal data
   */
  static async generateTenderProposal(
    proposalData: {
      title: string;
      organization: string;
      sections: Array<{
        title: string;
        content: string;
        subsections?: Array<{ title: string; content: string }>;
      }>;
    }
  ): Promise<PDFExportResult> {
    const sections: PDFSection[] = proposalData.sections.map((section, index) => ({
      id: `section-${index}`,
      title: section.title,
      content: section.content,
      level: 1,
      children: section.subsections?.map((sub, subIndex) => ({
        id: `section-${index}-${subIndex}`,
        title: sub.title,
        content: sub.content,
        level: 2
      }))
    }));

    return this.generatePDF({
      title: proposalData.title,
      organization: proposalData.organization,
      sections,
      includeTableOfContents: true,
      metadata: {
        subject: 'Tender Proposal',
        keywords: ['tender', 'proposal', 'bid']
      }
    });
  }

  /**
   * Download PDF file in browser
   */
  static downloadPDF(result: PDFExportResult): void {
    if (!result.success) {
      throw new Error(result.error || 'PDF generation failed');
    }

    const blob = new Blob([result.buffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Generate PDF from proposal data
   */
  async generatePDF(
    proposalData: ProposalExportData,
    options: PDFGenerationOptions
  ): Promise<ExportResult> {
    try {
      console.log('Starting PDF generation for proposal:', proposalData.id);
      
      // Add metadata to PDF
      this.addMetadata(proposalData);
      
      // Generate document content
      await this.generateContent(proposalData, options);
      
      // Add headers and footers if requested
      if (options.customStyles?.headerFooter?.includeHeader || 
          options.customStyles?.headerFooter?.includeFooter) {
        this.addHeadersAndFooters(proposalData, options);
      }
      
      // Add watermark if specified
      if (options.watermark || options.customStyles) {
        this.addWatermark(options.watermark || '');
      }
      
      // Generate final PDF blob
      const pdfBlob = new Blob([this.pdf.output('arraybuffer')], {
        type: MIME_TYPES.pdf
      });
      
      const filename = this.generateFilename(proposalData);
      
      return {
        success: true,
        data: {
          blob: pdfBlob,
          filename,
          size: pdfBlob.size,
        },
        metadata: {
          format: 'pdf',
          generatedAt: new Date().toISOString(),
          processingTime: 0 // Will be set by calling service
        }
      };
      
    } catch {
      console.error('PDF generation failed:', error);
      throw new GenerationError(
        'PDF generation failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        error
      );
    }
  }

  /**
   * Generate document content with proper formatting
   */
  private async generateContent(
    proposalData: ProposalExportData,
    options: PDFGenerationOptions
  ): Promise<void> {
    // Add title page
    this.addTitlePage(proposalData);
    
    // Add table of contents if requested
    if (options.tableOfContents) {
      this.addNewPage();
      this.addTableOfContents(proposalData);
    }
    
    // Add executive summary if available
    if (proposalData.sections?.some(s => s.title.toLowerCase().includes('executive'))) {
      this.addNewPage();
      const execSection = proposalData.sections.find(s => 
        s.title.toLowerCase().includes('executive')
      );
      if (execSection) {
        this.addSection(execSection.title, execSection.content);
      }
    }
    
    // Add main content sections
    if (proposalData.sections && proposalData.sections.length > 0) {
      for (const section of proposalData.sections.sort((a, b) => a.order - b.order)) {
        if (!section.title.toLowerCase().includes('executive')) {
          this.addNewPage();
          this.addSection(section.title, section.content);
        }
      }
    } else {
      // If no sections, add the main content
      this.addNewPage();
      this.addSection('Proposal Content', proposalData.content);
    }
    
    // Add compliance checklist if available and requested
    if (options.includeCompliance && proposalData.compliance) {
      this.addNewPage();
      this.addComplianceSection(proposalData.compliance);
    }
    
    // Add metadata appendix if requested
    if (options.includeMetadata) {
      this.addNewPage();
      this.addMetadataSection(proposalData.metadata);
    }
  }

  /**
   * Add title page with proposal information
   */
  private addTitlePage(proposalData: ProposalExportData): void {
    const { contentWidth } = this.pageMetrics;
    
    // Main title
    this.pdf.setFontSize(EXPORT_CONFIG.PDF.FONT_SIZES.TITLE);
    this.pdf.setFont(EXPORT_CONFIG.PDF.FONTS.HEADING, 'bold');
    const titleLines = this.pdf.splitTextToSize(proposalData.title, contentWidth);
    
    this.currentY = 60; // Start title higher on page
    titleLines.forEach((line: string) => {
      this.pdf.text(line, this.pageMetrics.margins.left + contentWidth / 2, this.currentY, {
        align: 'center'
      });
      this.currentY += 10;
    });
    
    this.currentY += 20;
    
    // Organization info
    if (proposalData.metadata.organization) {
      this.pdf.setFontSize(EXPORT_CONFIG.PDF.FONT_SIZES.HEADING);
      this.pdf.setFont(EXPORT_CONFIG.PDF.FONTS.DEFAULT, 'normal');
      this.pdf.text(
        proposalData.metadata.organization,
        this.pageMetrics.margins.left + contentWidth / 2,
        this.currentY,
        { align: 'center' }
      );
      this.currentY += 15;
    }
    
    // Author info
    if (proposalData.metadata.author) {
      this.pdf.setFontSize(EXPORT_CONFIG.PDF.FONT_SIZES.BODY);
      this.pdf.text(
        `Prepared by: ${proposalData.metadata.author}`,
        this.pageMetrics.margins.left + contentWidth / 2,
        this.currentY,
        { align: 'center' }
      );
      this.currentY += 10;
    }
    
    // Date info
    if (proposalData.metadata.createdAt) {
      const date = new Date(proposalData.metadata.createdAt).toLocaleDateString();
      this.pdf.text(
        `Date: ${date}`,
        this.pageMetrics.margins.left + contentWidth / 2,
        this.currentY,
        { align: 'center' }
      );
      this.currentY += 10;
    }
    
    // Version info
    if (proposalData.metadata.version) {
      this.pdf.text(
        `Version: ${proposalData.metadata.version}`,
        this.pageMetrics.margins.left + contentWidth / 2,
        this.currentY,
        { align: 'center' }
      );
    }
  }

  /**
   * Add table of contents
   */
  private addTableOfContents(proposalData: ProposalExportData): void {
    this.addHeading('Table of Contents');
    this.currentY += 10;
    
    this.pdf.setFontSize(EXPORT_CONFIG.PDF.FONT_SIZES.BODY);
    this.pdf.setFont(EXPORT_CONFIG.PDF.FONTS.DEFAULT, 'normal');
    
    let pageNum = 3; // Start after title and TOC pages
    
    if (proposalData.sections) {
      proposalData.sections
        .sort((a, b) => a.order - b.order)
        .forEach((section) => {
          const dotLine = this.createDottedLine(section.title, pageNum.toString());
          this.pdf.text(dotLine, this.pageMetrics.margins.left, this.currentY);
          this.currentY += 6;
          pageNum++;
        });
    }
    
    // Add compliance and metadata sections if they will be included
    if (proposalData.compliance) {
      const dotLine = this.createDottedLine('Compliance Checklist', pageNum.toString());
      this.pdf.text(dotLine, this.pageMetrics.margins.left, this.currentY);
      this.currentY += 6;
      pageNum++;
    }
    
    const dotLine = this.createDottedLine('Document Information', pageNum.toString());
    this.pdf.text(dotLine, this.pageMetrics.margins.left, this.currentY);
  }

  /**
   * Add a section with heading and content
   */
  private addSection(title: string, content: string): void {
    this.addHeading(title);
    this.currentY += 10;
    
    // Process HTML content
    const cleanContent = ExportUtils.sanitizeHtml(content);
    const textContent = ExportUtils.extractTextContent(cleanContent);
    
    this.addBodyText(textContent);
  }

  /**
   * Add compliance checklist section
   */
  private addComplianceSection(compliance: NonNullable<ProposalExportData['compliance']>): void {
    this.addHeading('Compliance Checklist');
    this.currentY += 10;
    
    this.pdf.setFontSize(EXPORT_CONFIG.PDF.FONT_SIZES.BODY);
    this.pdf.setFont(EXPORT_CONFIG.PDF.FONTS.DEFAULT, 'normal');
    
    compliance.checklist.forEach((item) => {
      const statusSymbol = item.status === 'complete' ? '✓' : 
                          item.status === 'incomplete' ? '✗' : '○';
      const line = `${statusSymbol} ${item.item}`;
      
      this.addBodyText(line);
      
      if (item.notes) {
        this.currentY += 3;
        this.pdf.setFontSize(EXPORT_CONFIG.PDF.FONT_SIZES.BODY - 1);
        this.addBodyText(`   Notes: ${item.notes}`);
        this.pdf.setFontSize(EXPORT_CONFIG.PDF.FONT_SIZES.BODY);
      }
      
      this.currentY += 5;
    });
    
    // Add requirements if any
    if (compliance.requirements.length > 0) {
      this.currentY += 10;
      this.addSubheading('Requirements');
      this.currentY += 5;
      
      compliance.requirements.forEach((req, index) => {
        this.addBodyText(`${index + 1}. ${req}`);
        this.currentY += 3;
      });
    }
  }

  /**
   * Add metadata section
   */
  private addMetadataSection(metadata: ProposalExportData['metadata']): void {
    this.addHeading('Document Information');
    this.currentY += 10;
    
    this.pdf.setFontSize(EXPORT_CONFIG.PDF.FONT_SIZES.BODY);
    this.pdf.setFont(EXPORT_CONFIG.PDF.FONTS.DEFAULT, 'normal');
    
    const metadataItems = [
      { label: 'Organization', value: metadata.organization },
      { label: 'Author', value: metadata.author },
      { label: 'Created Date', value: metadata.createdAt ? new Date(metadata.createdAt).toLocaleDateString() : undefined },
      { label: 'Last Modified', value: metadata.lastModified ? new Date(metadata.lastModified).toLocaleDateString() : undefined },
      { label: 'Version', value: metadata.version },
      { label: 'Generated Date', value: new Date().toLocaleDateString() }
    ];
    
    metadataItems.forEach((item) => {
      if (item.value) {
        this.addBodyText(`${item.label}: ${item.value}`);
        this.currentY += 6;
      }
    });
  }

  /**
   * Add heading text
   */
  private addHeading(text: string): void {
    this.checkPageBreak(20);
    
    this.pdf.setFontSize(EXPORT_CONFIG.PDF.FONT_SIZES.HEADING);
    this.pdf.setFont(EXPORT_CONFIG.PDF.FONTS.HEADING, 'bold');
    this.pdf.text(text, this.pageMetrics.margins.left, this.currentY);
    this.currentY += 8;
  }

  /**
   * Add subheading text
   */
  private addSubheading(text: string): void {
    this.checkPageBreak(15);
    
    this.pdf.setFontSize(EXPORT_CONFIG.PDF.FONT_SIZES.SUBHEADING);
    this.pdf.setFont(EXPORT_CONFIG.PDF.FONTS.HEADING, 'bold');
    this.pdf.text(text, this.pageMetrics.margins.left, this.currentY);
    this.currentY += 6;
  }

  /**
   * Add body text with word wrapping
   */
  private addBodyText(text: string): void {
    this.pdf.setFontSize(EXPORT_CONFIG.PDF.FONT_SIZES.BODY);
    this.pdf.setFont(EXPORT_CONFIG.PDF.FONTS.BODY, 'normal');
    
    const lines = this.pdf.splitTextToSize(text, this.pageMetrics.contentWidth);
    
    lines.forEach((line: string) => {
      this.checkPageBreak(6);
      this.pdf.text(line, this.pageMetrics.margins.left, this.currentY);
      this.currentY += 6;
    });
  }

  /**
   * Check if we need a page break and add one if necessary
   */
  private checkPageBreak(neededSpace: number): void {
    if (this.currentY + neededSpace > this.pageMetrics.height - this.pageMetrics.margins.bottom) {
      this.addNewPage();
    }
  }

  /**
   * Add a new page
   */
  private addNewPage(): void {
    this.pdf.addPage();
    this.pageNumber++;
    this.currentY = this.pageMetrics.margins.top;
  }

  /**
   * Add headers and footers to all pages
   */
  private addHeadersAndFooters(
    proposalData: ProposalExportData,
    options: PDFGenerationOptions
  ): void {
    const pageCount = this.pdf.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i);
      
      // Add header
      if (options.customStyles?.headerFooter?.includeHeader) {
        this.pdf.setFontSize(EXPORT_CONFIG.PDF.FONT_SIZES.FOOTER);
        this.pdf.setFont(EXPORT_CONFIG.PDF.FONTS.DEFAULT, 'normal');
        
        const headerText = options.customStyles.headerFooter.headerText || 
                          proposalData.title;
        
        this.pdf.text(
          headerText,
          this.pageMetrics.margins.left,
          this.pageMetrics.margins.top - 5
        );
      }
      
      // Add footer
      if (options.customStyles?.headerFooter?.includeFooter) {
        this.pdf.setFontSize(EXPORT_CONFIG.PDF.FONT_SIZES.FOOTER);
        this.pdf.setFont(EXPORT_CONFIG.PDF.FONTS.DEFAULT, 'normal');
        
        const footerY = this.pageMetrics.height - this.pageMetrics.margins.bottom + 10;
        
        // Page number
        if (options.pageNumbers !== false) {
          this.pdf.text(
            `Page ${i} of ${pageCount}`,
            this.pageMetrics.width - this.pageMetrics.margins.right,
            footerY,
            { align: 'right' }
          );
        }
        
        // Custom footer text
        if (options.customStyles.headerFooter.footerText) {
          this.pdf.text(
            options.customStyles.headerFooter.footerText,
            this.pageMetrics.margins.left,
            footerY
          );
        }
      }
    }
  }

  /**
   * Add watermark to all pages
   */
  private addWatermark(watermarkText: string): void {
    if (!watermarkText) return;
    
    const pageCount = this.pdf.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i);
      
      // Save current state
      this.pdf.saveGraphicsState();
      
      // Set watermark properties
      this.pdf.setGState(this.pdf.GState({ opacity: 0.1 }));
      this.pdf.setFontSize(50);
      this.pdf.setFont(EXPORT_CONFIG.PDF.FONTS.DEFAULT, 'bold');
      this.pdf.setTextColor(128, 128, 128);
      
      // Rotate and center the watermark
      const centerX = this.pageMetrics.width / 2;
      const centerY = this.pageMetrics.height / 2;
      
      this.pdf.text(
        watermarkText,
        centerX,
        centerY,
        {
          align: 'center',
          angle: 45
        }
      );
      
      // Restore state
      this.pdf.restoreGraphicsState();
    }
  }

  /**
   * Calculate page metrics based on options
   */
  private calculatePageMetrics(options: PDFGenerationOptions): PDFPageMetrics {
    const pageSize = this.pdf.internal.pageSize;
    const margins = {
      top: options.customStyles?.margins?.top || EXPORT_CONFIG.PDF.MARGINS.TOP,
      right: options.customStyles?.margins?.right || EXPORT_CONFIG.PDF.MARGINS.RIGHT,
      bottom: options.customStyles?.margins?.bottom || EXPORT_CONFIG.PDF.MARGINS.BOTTOM,
      left: options.customStyles?.margins?.left || EXPORT_CONFIG.PDF.MARGINS.LEFT,
    };
    
    return {
      width: pageSize.getWidth(),
      height: pageSize.getHeight(),
      margins,
      contentWidth: pageSize.getWidth() - margins.left - margins.right,
      contentHeight: pageSize.getHeight() - margins.top - margins.bottom,
    };
  }

  /**
   * Generate filename for the PDF
   */
  private generateFilename(proposalData: ProposalExportData): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const title = proposalData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    return `${title}-${timestamp}.pdf`;
  }

  /**
   * Create dotted line for table of contents
   */
  private createDottedLine(title: string, pageNum: string): string {
    const maxLength = 70; // Adjust based on page width
    const titleLength = title.length;
    const pageNumLength = pageNum.length;
    const dotsNeeded = maxLength - titleLength - pageNumLength - 2;
    const dots = '.'.repeat(Math.max(dotsNeeded, 3));
    
    return `${title} ${dots} ${pageNum}`;
  }

  /**
   * Add PDF metadata
   */
  private addMetadata(proposalData: ProposalExportData): void {
    this.pdf.setProperties({
      title: proposalData.title,
      subject: 'Business Proposal',
      author: proposalData.metadata.author || 'CareDraft',
      creator: 'CareDraft Export System',
      keywords: 'proposal, business, export'
    });
  }
} 