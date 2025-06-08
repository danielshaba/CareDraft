import { z } from 'zod';
import { 
  EXPORT_CONFIG, 
  EXPORT_ERROR_CODES,
  type ExportFormat,
  type DocumentTemplate,
  type QualityPreset 
} from '@/lib/config/export.config';

// Export options validation schema
export const ExportOptionsSchema = z.object({
  format: z.enum(['pdf', 'docx'], {
    errorMap: () => ({ message: 'Format must be either "pdf" or "docx"' })
  }),
  includeMetadata: z.boolean().optional().default(true),
  includeCompliance: z.boolean().optional().default(true),
  template: z.enum(['PROPOSAL', 'REPORT', 'BRIEF']).optional(),
  quality: z.enum(['DRAFT', 'STANDARD', 'HIGH', 'PRINT']).optional().default('STANDARD'),
  customStyles: z.object({
    fontSize: z.number().min(8).max(24).optional(),
    fontFamily: z.string().optional(),
    margins: z.object({
      top: z.number().min(0).max(50),
      right: z.number().min(0).max(50),
      bottom: z.number().min(0).max(50),
      left: z.number().min(0).max(50),
    }).optional(),
    headerFooter: z.object({
      includeHeader: z.boolean(),
      includeFooter: z.boolean(),
      headerText: z.string().max(100).optional(),
      footerText: z.string().max(100).optional(),
    }).optional(),
  }).optional(),
  emailDelivery: z.object({
    enabled: z.boolean(),
    recipients: z.array(z.string().email('Invalid email address')).min(1, 'At least one recipient is required when email delivery is enabled'),
    subject: z.string().max(200).optional(),
    message: z.string().max(1000).optional(),
  }).optional().refine((data) => {
    if (data?.enabled && (!data.recipients || data.recipients.length === 0)) {
      return false;
    }
    return true;
  }, {
    message: 'Recipients are required when email delivery is enabled',
    path: ['recipients']
  }),
});

// Proposal export data validation schema
export const ProposalExportDataSchema = z.object({
  id: z.string().uuid('Invalid proposal ID format'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  metadata: z.object({
    organization: z.string().optional(),
    author: z.string().optional(),
    createdAt: z.string().datetime().optional(),
    lastModified: z.string().datetime().optional(),
    version: z.string().optional(),
  }),
  compliance: z.object({
    checklist: z.array(z.object({
      item: z.string(),
      status: z.enum(['complete', 'incomplete', 'not-applicable']),
      notes: z.string().optional(),
    })),
    requirements: z.array(z.string()),
  }).optional(),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    order: z.number().int().min(0),
  })).optional(),
});

// Email validation schema
export const EmailDeliverySchema = z.object({
  to: z.array(z.string().email()).min(1),
  subject: z.string().min(1).max(200),
  message: z.string().max(1000).optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.instanceof(Buffer),
    contentType: z.string(),
  })).max(5, 'Maximum 5 attachments allowed'),
});

// File validation schema
export const FileValidationSchema = z.object({
  filename: z.string().min(1),
  size: z.number().min(1),
  format: z.enum(['pdf', 'docx']),
  content: z.instanceof(Blob).or(z.instanceof(Buffer)),
});

// Export result validation schema
export const ExportResultSchema = z.object({
  success: z.boolean(),
  data: z.object({
    blob: z.instanceof(Blob),
    filename: z.string(),
    size: z.number(),
    downloadUrl: z.string().url().optional(),
    storageUrl: z.string().url().optional(),
  }).optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }).optional(),
  metadata: z.object({
    format: z.string(),
    generatedAt: z.string().datetime(),
    processingTime: z.number(),
  }),
});

// Validation utility class
export class ExportValidator {
  /**
   * Validate export options
   */
  static validateExportOptions(options: unknown) {
    try {
      return {
        success: true,
        data: ExportOptionsSchema.parse(options),
        errors: null,
      };
    } catch {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          data: null,
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        };
      }
      throw error;
    }
  }

  /**
   * Validate proposal export data
   */
  static validateProposalData(data: unknown) {
    try {
      return {
        success: true,
        data: ProposalExportDataSchema.parse(data),
        errors: null,
      };
    } catch {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          data: null,
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        };
      }
      throw error;
    }
  }

  /**
   * Validate file size constraints
   */
  static validateFileSize(size: number, format: ExportFormat): {
    valid: boolean;
    error?: string;
  } {
    const maxSize = format === 'pdf' 
      ? EXPORT_CONFIG.MAX_FILE_SIZE.PDF 
      : EXPORT_CONFIG.MAX_FILE_SIZE.DOCX;

    if (size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return {
        valid: false,
        error: `File size (${Math.round(size / (1024 * 1024))}MB) exceeds maximum allowed size (${maxSizeMB}MB) for ${format.toUpperCase()} format`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate email addresses
   */
  static validateEmailAddresses(emails: string[]): {
    valid: boolean;
    validEmails: string[];
    invalidEmails: string[];
  } {
    const validEmails: string[] = [];
    const invalidEmails: string[] = [];

    emails.forEach(email => {
      const emailSchema = z.string().email();
      const result = emailSchema.safeParse(email);
      if (result.success) {
        validEmails.push(email);
      } else {
        invalidEmails.push(email);
      }
    });

    return {
      valid: invalidEmails.length === 0,
      validEmails,
      invalidEmails,
    };
  }

  /**
   * Validate content length
   */
  static validateContentLength(content: string): {
    valid: boolean;
    error?: string;
  } {
    const maxLength = 5 * 1024 * 1024; // 5MB of text content
    
    if (content.length > maxLength) {
      return {
        valid: false,
        error: `Content too large (${Math.round(content.length / 1024)}KB). Maximum allowed: ${Math.round(maxLength / 1024)}KB`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate filename format
   */
  static validateFilename(filename: string, format: ExportFormat): {
    valid: boolean;
    sanitized?: string;
    error?: string;
  } {
    // Remove invalid characters
    const sanitized = filename
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    // Ensure it has the correct extension
    const expectedExtension = `.${format}`;
    const finalFilename = sanitized.endsWith(expectedExtension) 
      ? sanitized 
      : `${sanitized}${expectedExtension}`;

    // Check length
    if (finalFilename.length > 255) {
      return {
        valid: false,
        error: 'Filename too long (maximum 255 characters)',
      };
    }

    if (finalFilename.length < 5) {
      return {
        valid: false,
        error: 'Filename too short',
      };
    }

    return {
      valid: true,
      sanitized: finalFilename,
    };
  }

  /**
   * Validate export permissions (placeholder for future implementation)
   */
  static validateExportPermissions(
    userId: string, 
    proposalId: string, 
    organizationId: string
  ): {
    canExport: boolean;
    canEmail: boolean;
    canStore: boolean;
    restrictions?: string[];
  } {
    // Placeholder implementation - will be enhanced with actual permission logic
    return {
      canExport: true,
      canEmail: true,
      canStore: true,
      restrictions: [],
    };
  }

  /**
   * Validate rate limits (placeholder for future implementation)
   */
  static validateRateLimit(userId: string): {
    allowed: boolean;
    remainingQuota: number;
    resetTime?: Date;
    error?: string;
  } {
    // Placeholder implementation - will be enhanced with actual rate limiting
    return {
      allowed: true,
      remainingQuota: 100,
    };
  }
}

// Type exports
export type ValidatedExportOptions = z.infer<typeof ExportOptionsSchema>;
export type ValidatedProposalData = z.infer<typeof ProposalExportDataSchema>;
export type ValidatedEmailDelivery = z.infer<typeof EmailDeliverySchema>;
export type ValidationError = {
  field: string;
  message: string;
  code: string;
};

// Validation error factory
export class ExportValidationError extends Error {
  constructor(
    public errors: ValidationError[],
    message = 'Validation failed'
  ) {
    super(message);
    this.name = 'ExportValidationError';
  }

  static fromZodError(zodError: z.ZodError): ExportValidationError {
    const errors = zodError.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));
    return new ExportValidationError(errors);
  }
} 