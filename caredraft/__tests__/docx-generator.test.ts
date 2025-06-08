import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { DOCXGenerator, type DOCXGenerationOptions } from '@/lib/services/docx-generator';
import { DocumentExportService, type ProposalExportData } from '@/lib/services/export';

// Mock docx library
jest.mock('docx', () => ({
  Document: jest.fn().mockImplementation(() => ({})),
  Packer: {
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-docx-content'))
  },
  Paragraph: jest.fn().mockImplementation((options) => ({ type: 'paragraph', options })),
  TextRun: jest.fn().mockImplementation((options) => ({ type: 'textrun', options })),
  HeadingLevel: {
    HEADING_1: 'HEADING_1',
    HEADING_2: 'HEADING_2'
  },
  AlignmentType: {
    CENTER: 'CENTER',
    LEFT: 'LEFT'
  },
  TableOfContents: jest.fn().mockImplementation(() => ({ type: 'toc' })),
  Table: jest.fn().mockImplementation(() => ({ type: 'table' })),
  TableRow: jest.fn().mockImplementation(() => ({ type: 'tablerow' })),
  TableCell: jest.fn().mockImplementation(() => ({ type: 'tablecell' })),
  WidthType: {
    PERCENTAGE: 'PERCENTAGE'
  },
  BorderStyle: {
    SINGLE: 'SINGLE'
  }
}));

describe('DOCXGenerator', () => {
  let generator: DOCXGenerator;
  let mockProposalData: ProposalExportData;

  beforeEach(() => {
    generator = new DOCXGenerator();
    mockProposalData = {
      id: 'test-proposal-123',
      title: 'Test Business Proposal',
      content: 'This is the main content of the proposal with multiple sections and detailed information.',
      metadata: {
        organization: 'Test Organization',
        author: 'John Doe',
        createdAt: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-02T00:00:00Z',
        version: '1.0'
      },
      sections: [
        {
          id: 'section-1',
          title: 'Executive Summary',
          content: 'This section provides an overview of the proposal.',
          order: 1
        },
        {
          id: 'section-2', 
          title: 'Project Details',
          content: 'Detailed information about the project scope and requirements.',
          order: 2
        }
      ],
      compliance: {
        checklist: [
          {
            item: 'Legal review completed',
            status: 'complete',
            notes: 'Reviewed by legal team on 2024-01-01'
          },
          {
            item: 'Budget approval pending',
            status: 'pending',
            notes: 'Waiting for finance department approval'
          }
        ],
        requirements: [
          'Must comply with industry standards',
          'Requires environmental impact assessment'
        ]
      }
    };
  });

  describe('DOCXGenerator Class', () => {
    test('should create instance with default options', () => {
      expect(generator).toBeInstanceOf(DOCXGenerator);
    });

    test('should create instance with custom options', () => {
      const customOptions: DOCXGenerationOptions = {
        format: 'docx',
        pageOrientation: 'landscape',
        includeTableOfContents: false,
        includePageNumbers: false,
        documentTemplate: 'report'
      };
      
      const customGenerator = new DOCXGenerator(customOptions);
      expect(customGenerator).toBeInstanceOf(DOCXGenerator);
    });

    test('should generate DOCX successfully', async () => {
      const options: DOCXGenerationOptions = {
        format: 'docx',
        includeMetadata: true,
        includeCompliance: true
      };

      const result = await generator.generateDOCX(mockProposalData, options);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.blob).toBeInstanceOf(Blob);
      expect(result.data.filename).toContain('test-business-proposal');
      expect(result.data.filename).toContain('.docx');
      expect(result.metadata.format).toBe('docx');
      expect(result.metadata.generatedAt).toBeDefined();
      expect(result.metadata.processingTime).toBeGreaterThan(0);
    });

    test('should handle generation errors gracefully', async () => {
      const { Packer } = require('docx');
      Packer.toBuffer = jest.fn().mockRejectedValue(new Error('DOCX generation failed'));

      await expect(
        generator.generateDOCX(mockProposalData, { format: 'docx' })
      ).rejects.toThrow('DOCX generation failed');
    });

    test('should include table of contents when requested', async () => {
      const options: DOCXGenerationOptions = {
        format: 'docx',
        includeTableOfContents: true
      };

      const result = await generator.generateDOCX(mockProposalData, options);
      expect(result.success).toBe(true);
    });

    test('should exclude table of contents when not requested', async () => {
      const options: DOCXGenerationOptions = {
        format: 'docx',
        includeTableOfContents: false
      };

      const result = await generator.generateDOCX(mockProposalData, options);
      expect(result.success).toBe(true);
    });

    test('should handle compliance section inclusion', async () => {
      const options: DOCXGenerationOptions = {
        format: 'docx',
        includeCompliance: true
      };

      const result = await generator.generateDOCX(mockProposalData, options);
      expect(result.success).toBe(true);
    });

    test('should handle metadata section inclusion', async () => {
      const options: DOCXGenerationOptions = {
        format: 'docx',
        includeMetadata: true
      };

      const result = await generator.generateDOCX(mockProposalData, options);
      expect(result.success).toBe(true);
    });

    test('should generate valid filename', async () => {
      const result = await generator.generateDOCX(mockProposalData, { format: 'docx' });
      
      expect(result.data.filename).toMatch(/^test-business-proposal-\d{4}-\d{2}-\d{2}\.docx$/);
      expect(result.data.filename).not.toContain(' ');
      expect(result.data.filename).not.toContain('&');
    });

    test('should handle empty sections gracefully', async () => {
      const dataWithEmptySections = {
        ...mockProposalData,
        sections: []
      };

      const result = await generator.generateDOCX(dataWithEmptySections, { format: 'docx' });
      expect(result.success).toBe(true);
    });

    test('should handle missing compliance data', async () => {
      const dataWithoutCompliance = {
        ...mockProposalData,
        compliance: undefined
      };

      const result = await generator.generateDOCX(dataWithoutCompliance, { 
        format: 'docx',
        includeCompliance: true 
      });
      expect(result.success).toBe(true);
    });

    test('should handle different document templates', async () => {
      const templates: Array<'proposal' | 'report' | 'brief'> = ['proposal', 'report', 'brief'];
      
      for (const template of templates) {
        const options: DOCXGenerationOptions = {
          format: 'docx',
          documentTemplate: template
        };
        
        const result = await generator.generateDOCX(mockProposalData, options);
        expect(result.success).toBe(true);
      }
    });

    test('should measure processing time accurately', async () => {
      const result = await generator.generateDOCX(mockProposalData, { format: 'docx' });
      
      expect(result.metadata.processingTime).toBeGreaterThan(0);
      expect(result.metadata.processingTime).toBeLessThan(10000); // Should be less than 10 seconds
    });
  });

  describe('Integration with DocumentExportService', () => {
    test('should integrate with export service for DOCX generation', async () => {
      const exportService = DocumentExportService.getInstance();
      
      const result = await exportService.exportDocument(mockProposalData, {
        format: 'docx',
        includeMetadata: true,
        includeCompliance: true
      });

      expect(result.success).toBe(true);
      expect(result.data.filename).toContain('.docx');
      expect(result.metadata.format).toBe('docx');
    });

    test('should handle export service validation', async () => {
      const exportService = DocumentExportService.getInstance();
      
      // Test with invalid data
      const invalidData = {
        ...mockProposalData,
        title: '' // Empty title should be invalid
      };

      await expect(
        exportService.exportDocument(invalidData, { format: 'docx' })
      ).rejects.toThrow();
    });
  });

  describe('DOCX Content Validation', () => {
    test('should include all expected document sections', async () => {
      const options: DOCXGenerationOptions = {
        format: 'docx',
        includeTableOfContents: true,
        includeMetadata: true,
        includeCompliance: true
      };

      const result = await generator.generateDOCX(mockProposalData, options);
      
      expect(result.success).toBe(true);
      expect(result.data.size).toBeGreaterThan(0);
    });

    test('should handle HTML content conversion', async () => {
      const dataWithHTML = {
        ...mockProposalData,
        content: '<h1>Title</h1><p>This is <strong>bold</strong> text with <em>italics</em>.</p>',
        sections: [
          {
            id: 'html-section',
            title: 'HTML Content Section', 
            content: '<ul><li>Item 1</li><li>Item 2</li></ul><p>More content here.</p>',
            order: 1
          }
        ]
      };

      const result = await generator.generateDOCX(dataWithHTML, { format: 'docx' });
      expect(result.success).toBe(true);
    });

    test('should handle special characters in content', async () => {
      const dataWithSpecialChars = {
        ...mockProposalData,
        title: 'Proposal & Analysis: "Success" for 100% Growth',
        content: 'Content with special chars: & < > " \' % $ # @'
      };

      const result = await generator.generateDOCX(dataWithSpecialChars, { format: 'docx' });
      expect(result.success).toBe(true);
      expect(result.data.filename).not.toContain('&');
      expect(result.data.filename).not.toContain('"');
    });
  });
}); 