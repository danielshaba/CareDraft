import { describe, test, expect, beforeEach } from '@jest/globals';
import { DocumentExportService, ExportUtils, ExportError } from '@/lib/services/export';
import { ExportValidator } from '@/lib/validations/export.validation';
import { EXPORT_CONFIG } from '@/lib/config/export.config';

describe('Export Service Infrastructure', () => {
  let exportService: DocumentExportService;

  beforeEach(() => {
    exportService = DocumentExportService.getInstance();
  });

  describe('DocumentExportService', () => {
    test('should be a singleton', () => {
      const instance1 = DocumentExportService.getInstance();
      const instance2 = DocumentExportService.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('should generate valid filename', () => {
      const proposalData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Proposal Document',
        content: 'Test content',
        metadata: {}
      };

      const filename = exportService.generateFilename(proposalData, 'pdf');
      expect(filename).toMatch(/^test-proposal-document-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    test('should handle special characters in filename', () => {
      const proposalData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test/Proposal@Document#$%',
        content: 'Test content',
        metadata: {}
      };

      const filename = exportService.generateFilename(proposalData, 'docx');
      expect(filename).toMatch(/^test-proposal-document-\d{4}-\d{2}-\d{2}\.docx$/);
      expect(filename).not.toContain('/');
      expect(filename).not.toContain('@');
      expect(filename).not.toContain('#');
    });
  });

  describe('ExportUtils', () => {
    test('should sanitize HTML content', () => {
      const htmlWithScripts = '<p>Safe content</p><script>alert("xss")</script><iframe src="evil.com"></iframe>';
      const sanitized = ExportUtils.sanitizeHtml(htmlWithScripts);
      
      expect(sanitized).toBe('<p>Safe content</p>');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('<iframe>');
    });

    test('should extract text content from HTML', () => {
      const html = '<h1>Title</h1><p>This is a <strong>test</strong> paragraph.</p>';
      const text = ExportUtils.extractTextContent(html);
      
      expect(text).toBe('TitleThis is a test paragraph.');
    });

    test('should handle HTML entities', () => {
      const html = '&lt;div&gt;Hello &amp; welcome&nbsp;here&lt;/div&gt;';
      const text = ExportUtils.extractTextContent(html);
      
      expect(text).toBe('<div>Hello & welcome here</div>');
    });

    test('should estimate file sizes correctly', () => {
      const content = 'A'.repeat(1000); // 1000 characters
      
      const pdfSize = ExportUtils.estimateFileSize(content, 'pdf');
      const docxSize = ExportUtils.estimateFileSize(content, 'docx');
      
      expect(pdfSize).toBe(800); // 80% of original size (compression)
      expect(docxSize).toBe(1200); // 120% of original size (overhead)
    });
  });

  describe('ExportValidator', () => {
    test('should validate valid export options', () => {
      const validOptions = {
        format: 'pdf' as const,
        includeMetadata: true,
        includeCompliance: false
      };

      const result = ExportValidator.validateExportOptions(validOptions);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeNull();
    });

    test('should reject invalid export format', () => {
      const invalidOptions = {
        format: 'invalid',
        includeMetadata: true
      };

      const result = ExportValidator.validateExportOptions(invalidOptions);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].field).toBe('format');
    });

    test('should validate email addresses correctly', () => {
      const validEmails = ['test@example.com', 'user.name@domain.org'];
      const invalidEmails = ['invalid-email', 'missing@.com', '@domain.com'];
      const mixedEmails = [...validEmails, ...invalidEmails];

      const result = ExportValidator.validateEmailAddresses(mixedEmails);
      expect(result.valid).toBe(false);
      expect(result.validEmails).toEqual(validEmails);
      expect(result.invalidEmails).toEqual(invalidEmails);
    });

    test('should validate file sizes', () => {
      const validSize = 1024 * 1024; // 1MB
      const invalidSize = 100 * 1024 * 1024; // 100MB

      const validResult = ExportValidator.validateFileSize(validSize, 'pdf');
      expect(validResult.valid).toBe(true);

      const invalidResult = ExportValidator.validateFileSize(invalidSize, 'pdf');
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.error).toContain('exceeds maximum allowed size');
    });

    test('should validate and sanitize filenames', () => {
      const filename = 'Test Document@#$.pdf';
      const result = ExportValidator.validateFilename(filename, 'pdf');
      
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('test-document-.pdf');
    });

    test('should validate content length', () => {
      const shortContent = 'Short content';
      const longContent = 'A'.repeat(6 * 1024 * 1024); // 6MB

      const validResult = ExportValidator.validateContentLength(shortContent);
      expect(validResult.valid).toBe(true);

      const invalidResult = ExportValidator.validateContentLength(longContent);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.error).toContain('Content too large');
    });

    test('should validate proposal export data', () => {
      const validProposal = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Proposal',
        content: 'Proposal content here',
        metadata: {
          organization: 'Test Org',
          author: 'Test Author'
        }
      };

      const result = ExportValidator.validateProposalData(validProposal);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should reject invalid proposal data', () => {
      const invalidProposal = {
        id: 'invalid-uuid',
        title: '', // Empty title
        content: 'Content'
      };

      const result = ExportValidator.validateProposalData(invalidProposal);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('Export Configuration', () => {
    test('should have valid configuration constants', () => {
      expect(EXPORT_CONFIG.SUPPORTED_FORMATS).toContain('pdf');
      expect(EXPORT_CONFIG.SUPPORTED_FORMATS).toContain('docx');
      expect(EXPORT_CONFIG.MAX_FILE_SIZE.PDF).toBeGreaterThan(0);
      expect(EXPORT_CONFIG.MAX_FILE_SIZE.DOCX).toBeGreaterThan(0);
      expect(EXPORT_CONFIG.TIMEOUTS.PDF_GENERATION).toBeGreaterThan(0);
    });

    test('should have reasonable timeout values', () => {
      expect(EXPORT_CONFIG.TIMEOUTS.PDF_GENERATION).toBeLessThan(120000); // Less than 2 minutes
      expect(EXPORT_CONFIG.TIMEOUTS.DOCX_GENERATION).toBeLessThan(120000);
    });
  });

  describe('Error Handling', () => {
    test('should create ExportError correctly', () => {
      const error = new ExportError('Test error', 'TEST_CODE', { detail: 'test' });
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.name).toBe('ExportError');
    });
  });
}); 