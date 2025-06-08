import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, TableOfContents, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { 
  type ProposalExportData, 
  type ExportOptions, 
  type ExportResult,
  ExportUtils,
  GenerationError 
} from './export';
import { EXPORT_CONFIG, MIME_TYPES } from '@/lib/config/export.config';

export interface DOCXGenerationOptions extends Omit<ExportOptions, 'format'> {
  format?: 'docx'; // DOCX export format
  pageOrientation?: 'portrait' | 'landscape';
  includeTableOfContents?: boolean;
  includePageNumbers?: boolean;
  includeWatermark?: boolean;
  watermarkText?: string;
  documentTemplate?: 'proposal' | 'report' | 'brief';
  headerText?: string;
  footerText?: string;
}

export interface DOCXDocumentStructure {
  titlePage: Paragraph[];
  tableOfContents?: TableOfContents;
  executiveSummary?: Paragraph[];
  mainContent: Paragraph[];
  complianceSection?: Paragraph[];
  metadataSection?: Paragraph[];
}

export class DOCXGenerator {
  private options: DOCXGenerationOptions;
  private document: Document | null = null;

  constructor(options: DOCXGenerationOptions = { format: 'docx' }) {
    this.options = {
      pageOrientation: 'portrait',
      includeTableOfContents: true,
      includePageNumbers: true,
      includeWatermark: false,
      documentTemplate: 'proposal',
      includeMetadata: true,
      includeCompliance: true,
      ...options
    };
  }

  /**
   * Generate DOCX document from proposal data
   */
  async generateDOCX(
    proposalData: ProposalExportData,
    options: DOCXGenerationOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();
    
    try {
      console.log('Starting DOCX generation for proposal:', proposalData.id);
      
      // Merge options
      const mergedOptions = { ...this.options, ...options };
      
      // Build document structure
      const documentStructure = await this.buildDocumentStructure(proposalData, mergedOptions);
      
      // Create DOCX document
      this.document = this.createDocument(documentStructure, proposalData, mergedOptions);
      
      // Generate DOCX buffer
      const buffer = await Packer.toBuffer(this.document);
      const blob = new Blob([buffer], { type: MIME_TYPES.docx });
      const filename = this.generateFilename(proposalData.title);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`DOCX generation completed in ${processingTime}ms`);
      
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
          processingTime
        }
      };
      
    } catch {
      console.error('DOCX generation failed:', error);
      
      throw new GenerationError(
        `DOCX generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  /**
   * Build document structure from proposal data
   */
  private async buildDocumentStructure(
    proposalData: ProposalExportData,
    options: DOCXGenerationOptions
  ): Promise<DOCXDocumentStructure> {
    const structure: DOCXDocumentStructure = {
      titlePage: this.createTitlePage(proposalData),
      mainContent: []
    };

    // Add table of contents if requested
    if (options.includeTableOfContents) {
      structure.tableOfContents = new TableOfContents("Table of Contents", {
        hyperlink: true,
        headingStyleRange: "1-3",
      });
    }

    // Add executive summary if present
    if (proposalData.content && this.isExecutiveSummary(proposalData.content)) {
      structure.executiveSummary = this.createExecutiveSummary(proposalData.content);
    }

    // Add main content sections
    structure.mainContent = await this.createMainContent(proposalData);

    // Add compliance section if requested and data exists
    if (options.includeCompliance && proposalData.compliance) {
      structure.complianceSection = this.createComplianceSection(proposalData.compliance);
    }

    // Add metadata section if requested
    if (options.includeMetadata) {
      structure.metadataSection = this.createMetadataSection(proposalData);
    }

    return structure;
  }

  /**
   * Create DOCX document from structure
   */
  private createDocument(
    structure: DOCXDocumentStructure,
    proposalData: ProposalExportData,
    options: DOCXGenerationOptions
  ): Document {
    const sections: Array<Record<string, unknown>> = [];

    // Create main section with all content
    const children: Array<Paragraph | TableOfContents | Table> = [
      ...structure.titlePage,
      new Paragraph({ text: '', pageBreakBefore: true }), // Page break after title
    ];

    // Add table of contents
    if (structure.tableOfContents) {
      children.push(structure.tableOfContents);
      children.push(new Paragraph({ text: '', pageBreakBefore: true })); // Page break after TOC
    }

    // Add executive summary
    if (structure.executiveSummary) {
      children.push(...structure.executiveSummary);
      children.push(new Paragraph({ text: '' })); // Spacing
    }

    // Add main content
    children.push(...structure.mainContent);

    // Add compliance section
    if (structure.complianceSection) {
      children.push(new Paragraph({ text: '', pageBreakBefore: true })); // Page break before compliance
      children.push(...structure.complianceSection);
    }

    // Add metadata section
    if (structure.metadataSection) {
      children.push(new Paragraph({ text: '', pageBreakBefore: true })); // Page break before metadata
      children.push(...structure.metadataSection);
    }

    // Create document sections
    sections.push({
      properties: {
        page: {
          margin: {
            top: EXPORT_CONFIG.DOCX.DEFAULT_MARGINS.TOP,
            right: EXPORT_CONFIG.DOCX.DEFAULT_MARGINS.RIGHT,
            bottom: EXPORT_CONFIG.DOCX.DEFAULT_MARGINS.BOTTOM,
            left: EXPORT_CONFIG.DOCX.DEFAULT_MARGINS.LEFT,
          },
          pageNumbers: options.includePageNumbers ? {
            start: 1,
            formatType: 'decimal'
          } : undefined
        }
      },
      headers: options.headerText ? {
        default: {
          children: [
            new Paragraph({
              children: [new TextRun(options.headerText)],
              alignment: AlignmentType.CENTER
            })
          ]
        }
      } : undefined,
      footers: options.footerText ? {
        default: {
          children: [
            new Paragraph({
              children: [new TextRun(options.footerText)],
              alignment: AlignmentType.CENTER
            })
          ]
        }
      } : undefined,
      children
    });

    return new Document({
      creator: 'CareDraft Export System',
      title: proposalData.title,
      description: 'Business Proposal',
      sections,
      styles: {
        paragraphStyles: [
          {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              size: 32,
              bold: true,
              color: "2E74B5",
            },
            paragraph: {
              spacing: {
                after: 240,
                before: 240,
              },
            },
          },
          {
            id: "Heading2",
            name: "Heading 2",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              size: 26,
              bold: true,
              color: "2E74B5",
            },
            paragraph: {
              spacing: {
                after: 120,
                before: 240,
              },
            },
          },
          {
            id: "Heading3",
            name: "Heading 3",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              size: 22,
              bold: true,
              color: "1F4E79",
            },
            paragraph: {
              spacing: {
                after: 120,
                before: 240,
              },
            },
          }
        ]
      }
    });
  }

  /**
   * Create title page content
   */
  private createTitlePage(proposalData: ProposalExportData): Paragraph[] {
    const titlePage: Paragraph[] = [];

    // Main title
    titlePage.push(
      new Paragraph({
        children: [
          new TextRun({
            text: proposalData.title,
            bold: true,
            size: 48,
            color: "2E74B5"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 480 }
      })
    );

    // Subtitle
    titlePage.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Business Proposal",
            size: 24,
            color: "595959"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 960 }
      })
    );

    // Organization info
    if (proposalData.metadata.organization) {
      titlePage.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Prepared by: ${proposalData.metadata.organization}`,
              size: 20
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 }
        })
      );
    }

    // Author info
    if (proposalData.metadata.author) {
      titlePage.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Author: ${proposalData.metadata.author}`,
              size: 18
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 }
        })
      );
    }

    // Date
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    titlePage.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Date: ${date}`,
            size: 18
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 }
      })
    );

    // Version
    if (proposalData.metadata.version) {
      titlePage.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Version: ${proposalData.metadata.version}`,
              size: 16
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 }
        })
      );
    }

    return titlePage;
  }

  /**
   * Check if content appears to be an executive summary
   */
  private isExecutiveSummary(content: string): boolean {
    const lowerContent = content.toLowerCase();
    return lowerContent.includes('executive summary') || 
           lowerContent.includes('summary') ||
           lowerContent.includes('overview');
  }

  /**
   * Create executive summary section
   */
  private createExecutiveSummary(content: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Executive Summary",
            bold: true,
            size: 28,
            color: "2E74B5"
          })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 240 }
      })
    );

    // Process content and convert to paragraphs
    const cleanContent = ExportUtils.sanitizeHtml(content);
    const sentences = cleanContent.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
    
    sentences.forEach(sentence => {
      if (sentence.trim()) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: sentence.trim() + '.',
                size: 22
              })
            ],
            spacing: { after: 120 }
          })
        );
      }
    });

    return paragraphs;
  }

  /**
   * Create main content sections
   */
  private async createMainContent(proposalData: ProposalExportData): Promise<Paragraph[]> {
    const content: Paragraph[] = [];

    // Add main proposal content
    if (proposalData.content && !this.isExecutiveSummary(proposalData.content)) {
      content.push(...this.convertHTMLToParagraphs(proposalData.content));
    }

    // Add sections if they exist
    if (proposalData.sections && proposalData.sections.length > 0) {
      const sortedSections = proposalData.sections.sort((a, b) => a.order - b.order);
      
      for (const section of sortedSections) {
        // Section heading
        content.push(
          new Paragraph({
            children: [
              new TextRun({
                text: section.title,
                bold: true,
                size: 26,
                color: "2E74B5"
              })
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 480, after: 240 }
          })
        );

        // Section content
        content.push(...this.convertHTMLToParagraphs(section.content));
      }
    }

    return content;
  }

  /**
   * Convert HTML content to DOCX paragraphs
   */
  private convertHTMLToParagraphs(htmlContent: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    // Simple HTML stripping for now - can be enhanced later
    const cleanContent = htmlContent.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '');
    
    // Split content into paragraphs
    const textParagraphs = cleanContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    textParagraphs.forEach(paragraph => {
      const trimmed = paragraph.trim();
      if (trimmed) {
        // Check if it's a heading (starts with # or is all caps short text)
        if (trimmed.startsWith('#') || (trimmed.length < 50 && trimmed === trimmed.toUpperCase())) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: trimmed.replace(/^#+\s*/, ''),
                  bold: true,
                  size: 24,
                  color: "1F4E79"
                })
              ],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 360, after: 180 }
            })
          );
        } else {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: trimmed,
                  size: 22
                })
              ],
              spacing: { after: 120 }
            })
          );
        }
      }
    });

    return paragraphs;
  }

  /**
   * Create compliance section
   */
  private createComplianceSection(compliance: ProposalExportData['compliance']): Paragraph[] {
    if (!compliance) {
      return [];
    }
    const content: Paragraph[] = [];

    if (!compliance) {
      return content;
    }

    // Section heading
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Compliance Checklist",
            bold: true,
            size: 28,
            color: "2E74B5"
          })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 240 }
      })
    );

    // Checklist items
    if (compliance.checklist && compliance.checklist.length > 0) {
      compliance.checklist.forEach(item => {
        const statusSymbol = item.status === 'complete' ? '✓' : '○';
        const statusColor = item.status === 'complete' ? '008000' : 'FF0000';

        content.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${statusSymbol} ${item.item}`,
                size: 20,
                color: statusColor
              })
            ],
            spacing: { after: 120 }
          })
        );

        if (item.notes) {
          content.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `   Notes: ${item.notes}`,
                  size: 18,
                  italics: true,
                  color: "595959"
                })
              ],
              spacing: { after: 60 }
            })
          );
        }
      });
    }

    // Requirements
    if (compliance.requirements && compliance.requirements.length > 0) {
      content.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Requirements:",
              bold: true,
              size: 22
            })
          ],
          spacing: { before: 360, after: 120 }
        })
      );

      compliance.requirements.forEach(requirement => {
        content.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• ${requirement}`,
                size: 20
              })
            ],
            spacing: { after: 120 }
          })
        );
      });
    }

    return content;
  }

  /**
   * Create metadata section
   */
  private createMetadataSection(proposalData: ProposalExportData): Paragraph[] {
    const content: Paragraph[] = [];

    // Section heading
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Document Information",
            bold: true,
            size: 28,
            color: "2E74B5"
          })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 240 }
      })
    );

    // Create metadata table
    const metadataRows: TableRow[] = [];

    // Add metadata fields
    const metadataFields = [
      ['Document ID', proposalData.id],
      ['Title', proposalData.title],
      ['Organization', proposalData.metadata.organization || 'N/A'],
      ['Author', proposalData.metadata.author || 'N/A'],
      ['Created', proposalData.metadata.createdAt ? new Date(proposalData.metadata.createdAt).toLocaleDateString() : 'N/A'],
      ['Last Modified', proposalData.metadata.lastModified ? new Date(proposalData.metadata.lastModified).toLocaleDateString() : 'N/A'],
      ['Version', proposalData.metadata.version || 'N/A'],
      ['Export Date', new Date().toLocaleDateString()],
      ['Export Time', new Date().toLocaleTimeString()]
    ];

    metadataFields.forEach(([label, value]) => {
      metadataRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: label,
                      bold: true,
                      size: 20
                    })
                  ]
                })
              ],
              width: { size: 30, type: WidthType.PERCENTAGE }
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: value,
                      size: 20
                    })
                  ]
                })
              ],
              width: { size: 70, type: WidthType.PERCENTAGE }
            })
          ]
        })
      );
    });

    // Create table
    const metadataTable = new Table({
      rows: metadataRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
        insideVertical: { style: BorderStyle.SINGLE, size: 1 }
      }
    });

    content.push(
      new Paragraph({
        children: [metadataTable]
      })
    );

    return content;
  }

  /**
   * Generate filename for DOCX export
   */
  private generateFilename(title: string): string {
    const sanitized = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const timestamp = new Date().toISOString().split('T')[0];
    return `${sanitized}-${timestamp}.docx`;
  }
} 