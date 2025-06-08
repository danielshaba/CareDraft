import jsPDF from 'jspdf';
import { Document, Packer } from 'docx';
import html2canvas from 'html2canvas';

// Export types and interfaces
export interface ExportOptions {
  format: 'pdf' | 'docx';
  includeMetadata?: boolean;
  includeCompliance?: boolean;
  customStyles?: ExportStyles;
  emailDelivery?: EmailDeliveryOptions;
}

export interface ExportStyles {
  fontSize?: number;
  fontFamily?: string;
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  headerFooter?: {
    includeHeader: boolean;
    includeFooter: boolean;
    headerText?: string;
    footerText?: string;
  };
}

export interface EmailDeliveryOptions {
  enabled: boolean;
  recipients: string[];
  subject?: string;
  message?: string;
}

export interface ExportResult {
  success: boolean;
  data?: {
    blob: Blob;
    filename: string;
    size: number;
    downloadUrl?: string;
    storageUrl?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata: {
    format: string;
    generatedAt: string;
    processingTime: number;
  };
}

export interface ProposalExportData {
  id: string;
  title: string;
  content: string;
  metadata: {
    organization?: string;
    author?: string;
    createdAt?: string;
    lastModified?: string;
    version?: string;
  };
  compliance?: {
    checklist: Array<{
      item: string;
      status: 'complete' | 'incomplete' | 'not-applicable';
      notes?: string;
    }>;
    requirements: string[];
  };
  sections?: Array<{
    id: string;
    title: string;
    content: string;
    order: number;
  }>;
}

// Main export service class
export class DocumentExportService {
  private static instance: DocumentExportService;

  public static getInstance(): DocumentExportService {
    if (!DocumentExportService.instance) {
      DocumentExportService.instance = new DocumentExportService();
    }
    return DocumentExportService.instance;
  }

  /**
   * Export a proposal document in the specified format
   */
  async exportDocument(
    proposalData: ProposalExportData,
    options: ExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();
    
    try {
      console.log(`Starting ${options.format.toUpperCase()} export for proposal:`, proposalData.id);
      
      let result: ExportResult;
      
      switch (options.format) {
        case 'pdf':
          result = await this.generatePDF(proposalData, options);
          break;
        case 'docx':
          result = await this.generateDOCX(proposalData, options);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      const processingTime = Date.now() - startTime;
      result.metadata.processingTime = processingTime;
      
      console.log(`Export completed in ${processingTime}ms`);
      return result;
      
    } catch {
      console.error('Export failed:', error);
      return {
        success: false,
        error: {
          code: 'EXPORT_FAILED',
          message: error instanceof Error ? error.message : 'Unknown export error',
          details: error
        },
        metadata: {
          format: options.format,
          generatedAt: new Date().toISOString(),
          processingTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Generate PDF document using the PDF generator
   */
  private async generatePDF(
    proposalData: ProposalExportData,
    options: ExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();
    
    try {
      console.log('Generating PDF for proposal:', proposalData.id);
      
      // Import PDF generator dynamically
      const { PDFGenerator } = await import('./pdf-generator');
      
      // Create PDF generation options
      const pdfOptions = {
        ...options,
        format: 'pdf' as const,
        pageFormat: 'a4' as const,
        orientation: 'portrait' as const,
        tableOfContents: true,
        pageNumbers: true,
        includeImages: true
      };
      
      // Generate PDF
      const generator = new PDFGenerator(pdfOptions);
      const result = await generator.generatePDF(proposalData, pdfOptions);
      
      const processingTime = Date.now() - startTime;
      result.metadata.processingTime = processingTime;
      
      console.log(`PDF generation completed in ${processingTime}ms`);
      return result;
      
    } catch {
      const processingTime = Date.now() - startTime;
      console.error('PDF generation failed:', error);
      
      throw new GenerationError(
        `PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  /**
   * Generate DOCX document using the DOCX generator
   */
  private async generateDOCX(
    proposalData: ProposalExportData,
    options: ExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();
    
    try {
      console.log('Generating DOCX for proposal:', proposalData.id);
      
      // Import DOCX generator dynamically
      const { DOCXGenerator } = await import('./docx-generator');
      
      // Create DOCX generation options
      const docxOptions = {
        ...options,
        format: 'docx' as const,
        pageOrientation: options.customStyles?.margins ? 'portrait' as const : 'portrait' as const,
        includeTableOfContents: true,
        includePageNumbers: true,
        documentTemplate: 'proposal' as const
      };
      
      // Create generator instance
      const generator = new DOCXGenerator(docxOptions);
      
      // Generate DOCX
      const result = await generator.generateDOCX(proposalData, docxOptions);
      
      const processingTime = Date.now() - startTime;
      console.log(`DOCX generation completed in ${processingTime}ms`);
      
      return result;
      
    } catch {
      const processingTime = Date.now() - startTime;
      console.error('DOCX generation failed:', error);
      
      return {
        success: false,
        error: {
          code: 'DOCX_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown DOCX generation error',
          details: error
        }
      };
    }
  }

  /**
   * Validate export options
   */
  private validateOptions(options: ExportOptions): void {
    if (!options.format) {
      throw new Error('Export format is required');
    }
    
    if (!['pdf', 'docx'].includes(options.format)) {
      throw new Error(`Invalid export format: ${options.format}`);
    }

    if (options.emailDelivery?.enabled && !options.emailDelivery.recipients?.length) {
      throw new Error('Email recipients are required when email delivery is enabled');
    }
  }

  /**
   * Generate filename based on proposal data and format
   */
  generateFilename(proposalData: ProposalExportData, format: string): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const title = proposalData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    return `${title}-${timestamp}.${format}`;
  }

  /**
   * Get export statistics
   */
  async getExportStats(): Promise<{
    totalExports: number;
    formatBreakdown: Record<string, number>;
    recentExports: Array<{
      id: string;
      format: string;
      timestamp: string;
      size: number;
    }>;
  }> {
    // Placeholder for analytics - will be enhanced later
    return {
      totalExports: 0,
      formatBreakdown: { pdf: 0, docx: 0 },
      recentExports: []
    };
  }
}

// Export utilities
export class ExportUtils {
  /**
   * Convert HTML content to canvas for PDF generation
   */
  static async htmlToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
    try {
      return await html2canvas(element, {
        useCORS: true,
        allowTaint: false,
        background: '#ffffff',
        width: element.offsetWidth * 2, // Higher resolution
        height: element.offsetHeight * 2
      });
    } catch {
      console.error('HTML to canvas conversion failed:', error);
      throw new Error('Failed to convert HTML to canvas');
    }
  }

  /**
   * Sanitize HTML content for export
   */
  static sanitizeHtml(html: string): string {
    // Remove scripts and potentially dangerous elements
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+="[^"]*"/g, '') // Remove event handlers
      .trim();
  }

  /**
   * Extract text content from HTML
   */
  static extractTextContent(html: string): string {
    // Simple HTML tag removal for plain text extraction
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  /**
   * Calculate estimated file size
   */
  static estimateFileSize(content: string, format: 'pdf' | 'docx'): number {
    const baseSize = content.length;
    
    // Rough estimates based on format overhead
    switch (format) {
      case 'pdf':
        return Math.round(baseSize * 0.8); // PDF compression
      case 'docx':
        return Math.round(baseSize * 1.2); // DOCX overhead
      default:
        return baseSize;
    }
  }
}

// Error classes
export class ExportError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ExportError';
  }
}

export class ValidationError extends ExportError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

export class GenerationError extends ExportError {
  constructor(message: string, details?: unknown) {
    super(message, 'GENERATION_ERROR', details);
  }
}

// Export factory for easy service access
export const exportService = DocumentExportService.getInstance();

// Default export options
export const DEFAULT_EXPORT_OPTIONS: Partial<ExportOptions> = {
  includeMetadata: true,
  includeCompliance: true,
  customStyles: {
    fontSize: 12,
    fontFamily: 'Arial',
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    },
    headerFooter: {
      includeHeader: true,
      includeFooter: true
    }
  },
  emailDelivery: {
    enabled: false,
    recipients: []
  }
}; 