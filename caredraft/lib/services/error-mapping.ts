// Error mapping service for converting technical errors to user-friendly messages
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 
  | 'network' 
  | 'authentication' 
  | 'authorization' 
  | 'validation' 
  | 'server' 
  | 'client' 
  | 'storage' 
  | 'external_service'
  | 'unknown';

export interface ErrorContext {
  route?: string;
  userAgent?: string;
  timestamp: number;
  userId?: string;
  organizationId?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface MappedError {
  code: string;
  title: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  userActions?: string[];
  technicalDetails?: string;
  reportable: boolean;
  retryable: boolean;
}

interface ErrorPattern {
  pattern: RegExp | string;
  mapping: Omit<MappedError, 'technicalDetails'>;
}

// Common error patterns and their user-friendly mappings
const ERROR_PATTERNS: ErrorPattern[] = [
  // Network Errors
  {
    pattern: /network|fetch|connection|timeout|ECONNREFUSED/i,
    mapping: {
      code: 'NETWORK_ERROR',
      title: 'Connection Problem',
      message: 'We\'re having trouble connecting to our servers. Please check your internet connection and try again.',
      category: 'network',
      severity: 'medium',
      userActions: ['Check your internet connection', 'Try again in a moment', 'Contact support if the problem persists'],
      reportable: true,
      retryable: true
    }
  },
  
  // Authentication Errors
  {
    pattern: /unauthorized|authentication|login|token|session/i,
    mapping: {
      code: 'AUTH_ERROR',
      title: 'Authentication Required',
      message: 'Your session has expired. Please sign in again to continue.',
      category: 'authentication',
      severity: 'medium',
      userActions: ['Sign in to your account', 'Check your credentials', 'Reset your password if needed'],
      reportable: false,
      retryable: false
    }
  },
  
  // Authorization Errors
  {
    pattern: /forbidden|permission|access.*denied|not.*allowed/i,
    mapping: {
      code: 'PERMISSION_ERROR',
      title: 'Access Denied',
      message: 'You don\'t have permission to perform this action. Please contact your administrator.',
      category: 'authorization',
      severity: 'low',
      userActions: ['Contact your administrator', 'Check your account permissions', 'Try a different action'],
      reportable: false,
      retryable: false
    }
  },
  
  // Validation Errors
  {
    pattern: /validation|invalid|required|format|schema/i,
    mapping: {
      code: 'VALIDATION_ERROR',
      title: 'Invalid Information',
      message: 'Some of the information you provided is invalid. Please check your input and try again.',
      category: 'validation',
      severity: 'low',
      userActions: ['Check the highlighted fields', 'Ensure all required information is provided', 'Follow the format requirements'],
      reportable: false,
      retryable: false
    }
  },
  
  // File/Storage Errors
  {
    pattern: /file.*not.*found|storage|upload|download|bucket/i,
    mapping: {
      code: 'STORAGE_ERROR',
      title: 'File Operation Failed',
      message: 'We encountered a problem with file storage. Please try uploading or accessing the file again.',
      category: 'storage',
      severity: 'medium',
      userActions: ['Try the operation again', 'Check file size and format', 'Contact support if the problem continues'],
      reportable: true,
      retryable: true
    }
  },
  
  // Server Errors (5xx)
  {
    pattern: /server.*error|internal.*error|5\d\d|service.*unavailable/i,
    mapping: {
      code: 'SERVER_ERROR',
      title: 'Server Problem',
      message: 'Our servers are experiencing technical difficulties. Please try again in a few minutes.',
      category: 'server',
      severity: 'high',
      userActions: ['Try again in a few minutes', 'Check our status page', 'Contact support if the problem persists'],
      reportable: true,
      retryable: true
    }
  },
  
  // Rate Limiting
  {
    pattern: /rate.*limit|too.*many.*requests|429/i,
    mapping: {
      code: 'RATE_LIMIT_ERROR',
      title: 'Too Many Requests',
      message: 'You\'ve made too many requests. Please wait a moment before trying again.',
      category: 'client',
      severity: 'low',
      userActions: ['Wait a moment and try again', 'Slow down your actions', 'Contact support if you think this is an error'],
      reportable: false,
      retryable: true
    }
  },
  
  // External Service Errors
  {
    pattern: /api.*key|quota.*exceeded|external.*service|third.*party/i,
    mapping: {
      code: 'EXTERNAL_SERVICE_ERROR',
      title: 'External Service Issue',
      message: 'A service we depend on is currently unavailable. We\'re working to resolve this.',
      category: 'external_service',
      severity: 'high',
      userActions: ['Try again later', 'Check our status page', 'Contact support for updates'],
      reportable: true,
      retryable: true
    }
  },
  
  // Payment/Billing Errors
  {
    pattern: /payment|billing|subscription|card.*declined|insufficient.*funds/i,
    mapping: {
      code: 'PAYMENT_ERROR',
      title: 'Payment Issue',
      message: 'There was a problem processing your payment. Please check your payment method.',
      category: 'client',
      severity: 'medium',
      userActions: ['Check your payment method', 'Update your billing information', 'Contact your bank if needed'],
      reportable: false,
      retryable: false
    }
  },
  
  // Database Errors
  {
    pattern: /database|query|constraint|duplicate.*key|foreign.*key/i,
    mapping: {
      code: 'DATABASE_ERROR',
      title: 'Data Problem',
      message: 'We encountered a problem saving your data. Please try again or contact support.',
      category: 'server',
      severity: 'high',
      userActions: ['Try the action again', 'Check for duplicate information', 'Contact support if the problem continues'],
      reportable: true,
      retryable: true
    }
  }
];

// HTTP status code mappings
const HTTP_STATUS_MAPPINGS: Record<number, Partial<MappedError>> = {
  400: {
    code: 'BAD_REQUEST',
    title: 'Invalid Request',
    message: 'The request was invalid. Please check your input and try again.',
    category: 'client',
    severity: 'low',
    retryable: false
  },
  401: {
    code: 'UNAUTHORIZED',
    title: 'Authentication Required',
    message: 'Please sign in to access this feature.',
    category: 'authentication',
    severity: 'medium',
    retryable: false
  },
  403: {
    code: 'FORBIDDEN',
    title: 'Access Denied',
    message: 'You don\'t have permission to perform this action.',
    category: 'authorization',
    severity: 'low',
    retryable: false
  },
  404: {
    code: 'NOT_FOUND',
    title: 'Not Found',
    message: 'The requested resource could not be found.',
    category: 'client',
    severity: 'low',
    retryable: false
  },
  409: {
    code: 'CONFLICT',
    title: 'Conflict',
    message: 'This action conflicts with existing data. Please refresh and try again.',
    category: 'client',
    severity: 'medium',
    retryable: false
  },
  429: {
    code: 'RATE_LIMITED',
    title: 'Too Many Requests',
    message: 'Please wait a moment before trying again.',
    category: 'client',
    severity: 'low',
    retryable: true
  },
  500: {
    code: 'INTERNAL_ERROR',
    title: 'Server Error',
    message: 'We\'re experiencing technical difficulties. Please try again later.',
    category: 'server',
    severity: 'high',
    retryable: true
  },
  502: {
    code: 'BAD_GATEWAY',
    title: 'Service Unavailable',
    message: 'Our service is temporarily unavailable. Please try again in a few minutes.',
    category: 'server',
    severity: 'high',
    retryable: true
  },
  503: {
    code: 'SERVICE_UNAVAILABLE',
    title: 'Service Unavailable',
    message: 'Our service is temporarily down for maintenance. Please try again later.',
    category: 'server',
    severity: 'high',
    retryable: true
  },
  504: {
    code: 'GATEWAY_TIMEOUT',
    title: 'Request Timeout',
    message: 'The request took too long to process. Please try again.',
    category: 'server',
    severity: 'medium',
    retryable: true
  }
};

// Default fallback error mapping
const DEFAULT_ERROR_MAPPING: MappedError = {
  code: 'UNKNOWN_ERROR',
  title: 'Something Went Wrong',
  message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
  category: 'unknown',
  severity: 'medium',
  userActions: ['Try again', 'Refresh the page', 'Contact support if the problem continues'],
  reportable: true,
  retryable: true
};

/**
 * Maps technical errors to user-friendly messages
 */
export function mapError(
  error: Error | string | { status?: number; message?: string; code?: string },
  _context?: Partial<ErrorContext>
): MappedError {
  let errorMessage = '';
  let statusCode: number | undefined;
  let errorCode: string | undefined;

  // Extract error information
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
    // Try to extract status code from error name or message
    const statusMatch = error.message.match(/(\d{3})/);
    if (statusMatch) {
      statusCode = parseInt(statusMatch[1]);
    }
  } else if (typeof error === 'object' && error !== null) {
    errorMessage = error.message || '';
    statusCode = error.status;
    errorCode = error.code;
  }

  // Try HTTP status code mapping first
  if (statusCode && HTTP_STATUS_MAPPINGS[statusCode]) {
    const statusMapping = HTTP_STATUS_MAPPINGS[statusCode];
    return {
      ...DEFAULT_ERROR_MAPPING,
      ...statusMapping,
      technicalDetails: errorMessage,
      code: errorCode || statusMapping.code || 'HTTP_' + statusCode
    };
  }

  // Try pattern matching
  for (const { pattern, mapping } of ERROR_PATTERNS) {
    const matches = typeof pattern === 'string' 
      ? errorMessage.includes(pattern)
      : pattern.test(errorMessage);
      
    if (matches) {
      return {
        ...mapping,
        technicalDetails: errorMessage,
        code: errorCode || mapping.code
      };
    }
  }

  // Return default mapping
  return {
    ...DEFAULT_ERROR_MAPPING,
    technicalDetails: errorMessage,
    code: errorCode || DEFAULT_ERROR_MAPPING.code
  };
}

/**
 * Collects contextual information for error reporting
 */
export function collectErrorContext(): ErrorContext {
  return {
    timestamp: Date.now(),
    route: typeof window !== 'undefined' ? window.location.pathname : undefined,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
  };
}

/**
 * Categorizes error severity based on error details
 */
export function categorizeErrorSeverity(error: MappedError): ErrorSeverity {
  if (error.category === 'server' && error.code.includes('5')) return 'critical';
  if (error.category === 'external_service') return 'high';
  if (error.category === 'network' && !error.retryable) return 'high';
  if (error.category === 'authentication') return 'medium';
  if (error.category === 'validation') return 'low';
  
  return error.severity;
}

/**
 * Determines if error should be reported to monitoring service
 */
export function shouldReportError(error: MappedError): boolean {
  // Always report critical and high severity errors
  if (error.severity === 'critical' || error.severity === 'high') return true;
  
  // Report server and external service errors
  if (['server', 'external_service', 'storage'].includes(error.category)) return true;
  
  // Report unknown errors
  if (error.category === 'unknown') return true;
  
  // Use the reportable flag for other cases
  return error.reportable;
}

/**
 * Gets appropriate user actions based on error type and context
 */
export function getUserActions(error: MappedError, context?: ErrorContext): string[] {
  const baseActions = error.userActions || [];
  
  // Add context-specific actions
  if (context?.route?.includes('/auth/') && error.category === 'authentication') {
    return ['Return to login page', 'Reset your password', 'Contact support'];
  }
  
  if (error.category === 'network' && error.retryable) {
    return ['Check your internet connection', 'Try again', 'Refresh the page'];
  }
  
  if (error.severity === 'critical') {
    return ['Contact support immediately', 'Check our status page', 'Try again later'];
  }
  
  return baseActions;
}

/**
 * Formats error for display in UI components
 */
export function formatErrorForDisplay(error: MappedError, showTechnical = false): {
  title: string;
  message: string;
  actions: string[];
  canRetry: boolean;
  severity: ErrorSeverity;
} {
  return {
    title: error.title,
    message: showTechnical && error.technicalDetails 
      ? `${error.message}\n\nTechnical details: ${error.technicalDetails}`
      : error.message,
    actions: error.userActions || [],
    canRetry: error.retryable,
    severity: error.severity
  };
}

// Export commonly used error mappings for direct usage
export const COMMON_ERRORS = {
  NETWORK_OFFLINE: mapError('Network connection lost'),
  AUTH_EXPIRED: mapError('unauthorized'),
  VALIDATION_REQUIRED: mapError('validation failed'),
  SERVER_ERROR: mapError('internal server error'),
  RATE_LIMITED: mapError('rate limit exceeded'),
  STORAGE_FULL: mapError('storage quota exceeded'),
  PAYMENT_FAILED: mapError('payment declined'),
} as const; 