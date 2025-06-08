// Export configuration and constants
export const EXPORT_CONFIG = {
  // Supported formats
  SUPPORTED_FORMATS: ['pdf', 'docx'] as const,
  
  // File size limits (in bytes)
  MAX_FILE_SIZE: {
    PDF: 50 * 1024 * 1024, // 50MB
    DOCX: 25 * 1024 * 1024, // 25MB
  },
  
  // Processing timeouts (in milliseconds)
  TIMEOUTS: {
    PDF_GENERATION: 60000, // 1 minute
    DOCX_GENERATION: 45000, // 45 seconds
    CANVAS_CAPTURE: 30000, // 30 seconds
  },
  
  // Image processing
  IMAGE: {
    MAX_WIDTH: 1920,
    MAX_HEIGHT: 1080,
    QUALITY: 0.8,
    FORMAT: 'jpeg' as const,
  },
  
  // PDF specific settings
  PDF: {
    DEFAULT_FORMAT: 'a4' as const,
    ORIENTATION: 'portrait' as const,
    UNIT: 'mm' as const,
    MARGINS: {
      TOP: 20,
      RIGHT: 20,
      BOTTOM: 20,
      LEFT: 20,
    },
    FONTS: {
      DEFAULT: 'Arial',
      HEADING: 'Arial Bold',
      BODY: 'Arial',
    },
    FONT_SIZES: {
      TITLE: 20,
      HEADING: 16,
      SUBHEADING: 14,
      BODY: 12,
      FOOTER: 10,
    },
    LINE_HEIGHT: 1.4,
  },
  
  // DOCX specific settings
  DOCX: {
    DEFAULT_MARGINS: {
      TOP: 1440, // 1 inch in twips
      RIGHT: 1440,
      BOTTOM: 1440,
      LEFT: 1440,
    },
    FONTS: {
      DEFAULT: 'Arial',
      HEADING: 'Arial',
      BODY: 'Arial',
    },
    FONT_SIZES: {
      TITLE: 24,
      HEADING: 18,
      SUBHEADING: 16,
      BODY: 12,
      FOOTER: 10,
    },
    LINE_SPACING: 276, // 1.15 line spacing in twips
  },
  
  // Email delivery settings
  EMAIL: {
    MAX_ATTACHMENT_SIZE: 25 * 1024 * 1024, // 25MB
    ALLOWED_DOMAINS: [], // Empty array means all domains allowed
    RATE_LIMIT: {
      MAX_EMAILS_PER_HOUR: 50,
      MAX_EMAILS_PER_DAY: 200,
    },
  },
  
  // Storage settings
  STORAGE: {
    BUCKET_NAME: 'exports',
    EXPIRY_DAYS: 30, // Delete files after 30 days
    MAX_FILES_PER_USER: 100,
    ALLOWED_EXTENSIONS: ['.pdf', '.docx'],
  },
  
  // Compliance and metadata
  COMPLIANCE: {
    INCLUDE_TIMESTAMP: true,
    INCLUDE_WATERMARK: false,
    INCLUDE_VERSION: true,
    TRACK_DOWNLOADS: true,
  },
} as const;

// Export format MIME types
export const MIME_TYPES = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const;

// Export status constants
export const EXPORT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

// Error codes
export const EXPORT_ERROR_CODES = {
  INVALID_FORMAT: 'INVALID_FORMAT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  GENERATION_FAILED: 'GENERATION_FAILED',
  TIMEOUT: 'TIMEOUT',
  STORAGE_ERROR: 'STORAGE_ERROR',
  EMAIL_ERROR: 'EMAIL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
} as const;

// Template configurations for different document types
export const DOCUMENT_TEMPLATES = {
  PROPOSAL: {
    name: 'Business Proposal',
    includeCompliance: true,
    includeTOC: true,
    includeExecutiveSummary: true,
    sections: [
      'executive-summary',
      'project-overview',
      'methodology',
      'timeline',
      'budget',
      'team',
      'appendices',
    ],
  },
  REPORT: {
    name: 'Project Report',
    includeCompliance: false,
    includeTOC: true,
    includeExecutiveSummary: true,
    sections: [
      'introduction',
      'methodology',
      'findings',
      'recommendations',
      'conclusion',
    ],
  },
  BRIEF: {
    name: 'Project Brief',
    includeCompliance: false,
    includeTOC: false,
    includeExecutiveSummary: false,
    sections: [
      'overview',
      'requirements',
      'deliverables',
      'timeline',
    ],
  },
} as const;

// Quality presets for exports
export const QUALITY_PRESETS = {
  DRAFT: {
    name: 'Draft Quality',
    pdfQuality: 0.6,
    imageCompression: 0.7,
    fontSize: 11,
    includeImages: true,
    watermark: 'DRAFT',
  },
  STANDARD: {
    name: 'Standard Quality',
    pdfQuality: 0.8,
    imageCompression: 0.8,
    fontSize: 12,
    includeImages: true,
    watermark: null,
  },
  HIGH: {
    name: 'High Quality',
    pdfQuality: 1.0,
    imageCompression: 0.9,
    fontSize: 12,
    includeImages: true,
    watermark: null,
  },
  PRINT: {
    name: 'Print Ready',
    pdfQuality: 1.0,
    imageCompression: 1.0,
    fontSize: 12,
    includeImages: true,
    watermark: null,
  },
} as const;

// Export type definitions based on config
export type ExportFormat = typeof EXPORT_CONFIG.SUPPORTED_FORMATS[number];
export type ExportStatus = typeof EXPORT_STATUS[keyof typeof EXPORT_STATUS];
export type ExportErrorCode = typeof EXPORT_ERROR_CODES[keyof typeof EXPORT_ERROR_CODES];
export type DocumentTemplate = keyof typeof DOCUMENT_TEMPLATES;
export type QualityPreset = keyof typeof QUALITY_PRESETS;
export type MimeType = typeof MIME_TYPES[keyof typeof MIME_TYPES]; 