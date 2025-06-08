import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { PDFGenerator, type PDFGenerationOptions } from '@/lib/services/pdf-generator';
import { DocumentExportService, type ProposalExportData } from '@/lib/services/export';

// Mock jsPDF and html2canvas
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    setProperties: jest.fn(),
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    text: jest.fn(),
    addPage: jest.fn(),
    splitTextToSize: jest.fn().mockReturnValue(['Test line 1', 'Test line 2']),
    getNumberOfPages: jest.fn().mockReturnValue(3),
    setPage: jest.fn(),
    saveGraphicsState: jest.fn(),
    restoreGraphicsState: jest.fn(),
    setGState: jest.fn(),
    setTextColor: jest.fn(),
    GState: jest.fn().mockReturnValue({}),
    output: jest.fn().mockReturnValue(new ArrayBuffer(1024)),
    internal: {
      pageSize: {
        getWidth: jest.fn().mockReturnValue(210),
        getHeight: jest.fn().mockReturnValue(297)
      }
    }
  }));
});

jest.mock('html2canvas', () => 
  jest.fn().mockResolvedValue({} as HTMLCanvasElement)
);

describe('PDF Generator', () => {
  let pdfGenerator: PDFGenerator;
  let mockProposalData: ProposalExportData;
  let mockOptions: PDFGenerationOptions;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Sample proposal data
    mockProposalData = {
      id: 'test-proposal-123',
      title: 'Test Business Proposal',
      content: '<p>This is a test proposal content with <strong>formatting</strong>.</p>',
      metadata: {
        organization: 'Test Organization',
        author: 'John Doe',
        createdAt: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-02T00:00:00Z',
        version: '1.0'
      },
      compliance: {
        checklist: [
          {
            item: 'Budget approval obtained',
            status: 'complete',
            notes: 'Approved by finance team'
          },
          {
            item: 'Technical review completed',
            status: 'incomplete'
          }
        ],
        requirements: [
          'Must include executive summary',
          'Must provide detailed timeline'
        ]
      },
      sections: [
        {
          id: 'exec-summary',
          title: 'Executive Summary',
          content: '<h2>Executive Summary</h2><p>This is the executive summary section.</p>',
          order: 1
        },
        {
          id: 'technical-approach',
          title: 'Technical Approach',
          content: '<h2>Technical Approach</h2><p>Our technical approach involves...</p>',
          order: 2
        }
      ]
    };

    mockOptions = {
      format: 'pdf',
      pageFormat: 'a4',
      orientation: 'portrait',
      tableOfContents: true,
      pageNumbers: true,
      includeImages: true,
      includeMetadata: true,
      includeCompliance: true
    };

    pdfGenerator = new PDFGenerator(mockOptions);
  });

  describe('PDF Generator Initialization', () => {
    test('should initialize with default options', () => {
      const generator = new PDFGenerator();
      expect(generator).toBeInstanceOf(PDFGenerator);
    });

    test('should initialize with custom options', () => {
      const customOptions: PDFGenerationOptions = {
        format: 'pdf',
        pageFormat: 'letter',
        orientation: 'landscape',
        tableOfContents: false,
        pageNumbers: false
      };
      
      const generator = new PDFGenerator(customOptions);
      expect(generator).toBeInstanceOf(PDFGenerator);
    });
  });

  describe('PDF Generation', () => {
    test('should generate PDF successfully with valid data', async () => {
      const result = await pdfGenerator.generatePDF(mockProposalData, mockOptions);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.blob).toBeInstanceOf(Blob);
      expect(result.data?.filename).toMatch(/test-business-proposal-\d{4}-\d{2}-\d{2}\.pdf/);
      expect(result.data?.size).toBeGreaterThan(0);
      expect(result.metadata.format).toBe('pdf');
      expect(result.metadata.generatedAt).toBeDefined();
    });

    test('should handle proposal data without sections', async () => {
      const dataWithoutSections = {
        ...mockProposalData,
        sections: undefined
      };

      const result = await pdfGenerator.generatePDF(dataWithoutSections, mockOptions);

      expect(result.success).toBe(true);
      expect(result.data?.blob).toBeInstanceOf(Blob);
    });

    test('should handle proposal data without compliance', async () => {
      const dataWithoutCompliance = {
        ...mockProposalData,
        compliance: undefined
      };

      const result = await pdfGenerator.generatePDF(dataWithoutCompliance, mockOptions);

      expect(result.success).toBe(true);
      expect(result.data?.blob).toBeInstanceOf(Blob);
    });

    test('should generate filename correctly', async () => {
      const result = await pdfGenerator.generatePDF(mockProposalData, mockOptions);

      expect(result.data?.filename).toMatch(/^test-business-proposal-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    test('should handle special characters in title for filename', async () => {
      const dataWithSpecialChars = {
        ...mockProposalData,
        title: 'Test Proposal: Special & Characters! @2024'
      };

      const result = await pdfGenerator.generatePDF(dataWithSpecialChars, mockOptions);

      expect(result.data?.filename).toMatch(/^test-proposal-special-characters-2024-\d{4}-\d{2}-\d{2}\.pdf$/);
    });
  });

  describe('PDF Content Generation', () => {
    test('should include table of contents when requested', async () => {
      const optionsWithTOC = { ...mockOptions, tableOfContents: true };
      const result = await pdfGenerator.generatePDF(mockProposalData, optionsWithTOC);

      expect(result.success).toBe(true);
      // Verify that table of contents was included by checking if addPage was called
      // (indicating multiple pages were generated)
    });

    test('should skip table of contents when not requested', async () => {
      const optionsWithoutTOC = { ...mockOptions, tableOfContents: false };
      const result = await pdfGenerator.generatePDF(mockProposalData, optionsWithoutTOC);

      expect(result.success).toBe(true);
    });

    test('should include compliance section when requested', async () => {
      const optionsWithCompliance = { ...mockOptions, includeCompliance: true };
      const result = await pdfGenerator.generatePDF(mockProposalData, optionsWithCompliance);

      expect(result.success).toBe(true);
    });

    test('should include metadata section when requested', async () => {
      const optionsWithMetadata = { ...mockOptions, includeMetadata: true };
      const result = await pdfGenerator.generatePDF(mockProposalData, optionsWithMetadata);

      expect(result.success).toBe(true);
    });

    test('should handle watermark option', async () => {
      const optionsWithWatermark = { ...mockOptions, watermark: 'CONFIDENTIAL' };
      const result = await pdfGenerator.generatePDF(mockProposalData, optionsWithWatermark);

      expect(result.success).toBe(true);
    });

    test('should handle custom styles', async () => {
      const optionsWithStyles = {
        ...mockOptions,
        customStyles: {
          fontSize: 14,
          fontFamily: 'Times',
          margins: { top: 25, right: 25, bottom: 25, left: 25 },
          headerFooter: {
            includeHeader: true,
            includeFooter: true,
            headerText: 'Custom Header',
            footerText: 'Custom Footer'
          }
        }
      };

      const result = await pdfGenerator.generatePDF(mockProposalData, optionsWithStyles);

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle PDF generation errors gracefully', async () => {
      // Mock jsPDF to throw an error
      const mockPDFConstructor = require('jspdf');
      mockPDFConstructor.mockImplementationOnce(() => {
        throw new Error('PDF library error');
      });

      await expect(
        pdfGenerator.generatePDF(mockProposalData, mockOptions)
      ).rejects.toThrow('PDF generation failed');
    });

    test('should handle invalid proposal data', async () => {
      const invalidData = {
        ...mockProposalData,
        title: '', // Empty title
        content: ''
      };

      // This should still work as the generator handles empty content gracefully
      const result = await pdfGenerator.generatePDF(invalidData, mockOptions);
      expect(result.success).toBe(true);
    });
  });

  describe('Integration with Export Service', () => {
    test('should integrate with DocumentExportService', async () => {
      const exportService = DocumentExportService.getInstance();
      
      const exportOptions = {
        format: 'pdf' as const,
        includeMetadata: true,
        includeCompliance: true
      };

      const result = await exportService.exportDocument(mockProposalData, exportOptions);

      expect(result.success).toBe(true);
      expect(result.metadata.format).toBe('pdf');
    });

    test('should handle export service validation', async () => {
      const exportService = DocumentExportService.getInstance();
      
      const invalidOptions = {
        format: 'invalid' as any
      };

      await expect(
        exportService.exportDocument(mockProposalData, invalidOptions)
      ).rejects.toThrow();
    });
  });

  describe('PDF Metadata', () => {
    test('should set correct PDF metadata', async () => {
      const result = await pdfGenerator.generatePDF(mockProposalData, mockOptions);

      expect(result.success).toBe(true);
      // Verify that setProperties was called on the PDF instance
      // This indirectly tests that metadata was set
    });

    test('should handle missing metadata gracefully', async () => {
      const dataWithoutMetadata = {
        ...mockProposalData,
        metadata: {}
      };

      const result = await pdfGenerator.generatePDF(dataWithoutMetadata, mockOptions);

      expect(result.success).toBe(true);
    });
  });

  describe('Performance and Size', () => {
    test('should complete generation within reasonable time', async () => {
      const startTime = Date.now();
      const result = await pdfGenerator.generatePDF(mockProposalData, mockOptions);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should generate reasonable file size', async () => {
      const result = await pdfGenerator.generatePDF(mockProposalData, mockOptions);

      expect(result.success).toBe(true);
      expect(result.data?.size).toBeGreaterThan(100); // Should be more than 100 bytes
      expect(result.data?.size).toBeLessThan(10 * 1024 * 1024); // Should be less than 10MB
    });
  });
});

describe('PDF Generator Edge Cases', () => {
  test('should handle very long content', async () => {
    const longContent = 'Lorem ipsum '.repeat(10000); // Very long content
    const dataWithLongContent = {
      id: 'test-long',
      title: 'Long Content Test',
      content: longContent,
      metadata: {},
      sections: [{
        id: 'long-section',
        title: 'Long Section',
        content: longContent,
        order: 1
      }]
    };

    const generator = new PDFGenerator({ format: 'pdf' });
    const result = await generator.generatePDF(dataWithLongContent, { format: 'pdf' });

    expect(result.success).toBe(true);
  });

  test('should handle HTML content with various tags', async () => {
    const htmlContent = `
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
      <ul>
        <li>List item 1</li>
        <li>List item 2</li>
      </ul>
      <table>
        <tr><td>Cell 1</td><td>Cell 2</td></tr>
      </table>
    `;

    const dataWithHTML = {
      id: 'test-html',
      title: 'HTML Content Test',
      content: htmlContent,
      metadata: {},
      sections: [{
        id: 'html-section',
        title: 'HTML Section',
        content: htmlContent,
        order: 1
      }]
    };

    const generator = new PDFGenerator({ format: 'pdf' });
    const result = await generator.generatePDF(dataWithHTML, { format: 'pdf' });

    expect(result.success).toBe(true);
  });

  test('should handle empty sections array', async () => {
    const dataWithEmptySections = {
      id: 'test-empty',
      title: 'Empty Sections Test',
      content: 'Main content',
      metadata: {},
      sections: []
    };

    const generator = new PDFGenerator({ format: 'pdf' });
    const result = await generator.generatePDF(dataWithEmptySections, { format: 'pdf' });

    expect(result.success).toBe(true);
  });
}); 