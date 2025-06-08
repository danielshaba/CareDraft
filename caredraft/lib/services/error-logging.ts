// Error logging and monitoring integration service
import { mapError, collectErrorContext, shouldReportError, type MappedError, type ErrorContext } from './error-mapping';

export interface ErrorReport {
  id: string;
  error: MappedError;
  context: ErrorContext;
  timestamp: number;
  fingerprint: string;
  tags: Record<string, string>;
  extra: Record<string, unknown>;
  breadcrumbs: Breadcrumb[];
}

export interface Breadcrumb {
  timestamp: number;
  category: string;
  message: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

export interface MonitoringConfig {
  dsn?: string;
  environment: string;
  release?: string;
  enableLocalLogging: boolean;
  maxBreadcrumbs: number;
  beforeSend?: (report: ErrorReport) => ErrorReport | null;
  enableUserFeedback: boolean;
}

// Mock Sentry-like interface for type safety
interface SentryLike {
  captureException(error: Error, context?: Record<string, unknown>): string;
  captureMessage(message: string, level?: string, context?: Record<string, unknown>): string;
  setContext(key: string, context: Record<string, unknown>): void;
  setTag(key: string, value: string): void;
  setUser(user: { id?: string; email?: string; username?: string }): void;
  addBreadcrumb(breadcrumb: Breadcrumb): void;
  configureScope(callback: (scope: unknown) => void): void;
  init(config: { dsn: string; environment: string; release?: string }): void;
}

class ErrorLoggingService {
  private config: MonitoringConfig;
  private sentry: SentryLike | null = null;
  private breadcrumbs: Breadcrumb[] = [];
  private isInitialized = false;
  private localErrors: ErrorReport[] = [];

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring service (Sentry or similar)
   */
  private async initializeMonitoring() {
    try {
      // Try to load Sentry if DSN is provided
      if (this.config.dsn && typeof window !== 'undefined') {
        // Dynamic import of Sentry to avoid SSR issues
        const Sentry = await import('@sentry/nextjs').catch(() => null) as any;
        
        if (Sentry) {
          Sentry.init({
            dsn: this.config.dsn,
            environment: this.config.environment,
            release: this.config.release,
                         beforeSend: (event: unknown) => {
              // Convert Sentry event to our format if beforeSend is configured
              if (this.config.beforeSend) {
                const report = this.sentryEventToErrorReport(event);
                const processedReport = this.config.beforeSend(report);
                return processedReport ? this.errorReportToSentryEvent(processedReport) : null;
              }
              return event;
            }
          });
          
          this.sentry = Sentry as unknown as SentryLike;
          this.isInitialized = true;
          
          // Add default context
          this.setContext('app', {
            name: 'CareDraft',
            version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'
          });
        }
      }
    } catch {
      console.warn('Failed to initialize error monitoring:', error);
      // Fall back to local logging
      this.isInitialized = true;
    }
    
    if (!this.isInitialized) {
      this.isInitialized = true;
    }
  }

  /**
   * Convert Sentry event to our ErrorReport format
   */
  private sentryEventToErrorReport(event: unknown): ErrorReport {
    // This is a simplified conversion - would need proper typing in real implementation
    return {
      id: Math.random().toString(36),
      error: mapError('Sentry event'),
      context: collectErrorContext(),
      timestamp: Date.now(),
      fingerprint: 'sentry-event',
      tags: {},
      extra: { sentryEvent: event },
      breadcrumbs: this.breadcrumbs
    };
  }

  /**
   * Convert our ErrorReport to Sentry event format
   */
  private errorReportToSentryEvent(report: ErrorReport): unknown {
    // This would need proper Sentry event structure in real implementation
    return {
      message: report.error.message,
      tags: report.tags,
      extra: report.extra,
      fingerprint: [report.fingerprint]
    };
  }

  /**
   * Log an error with full context and mapping
   */
  async logError(
    error: Error | string | { status?: number; message?: string; code?: string },
    additionalContext?: Partial<ErrorContext>
  ): Promise<string | null> {
    try {
      // Map the error to user-friendly format
      const mappedError = mapError(error, additionalContext);
      
      // Don't report if error mapping says not to
      if (!shouldReportError(mappedError)) {
        return null;
      }

      // Collect full context
      const baseContext = collectErrorContext();
      const fullContext: ErrorContext = {
        ...baseContext,
        ...additionalContext,
        timestamp: Date.now()
      };

      // Create error report
      const report: ErrorReport = {
        id: this.generateErrorId(),
        error: mappedError,
        context: fullContext,
        timestamp: Date.now(),
        fingerprint: this.generateFingerprint(mappedError, fullContext),
        tags: this.generateTags(mappedError, fullContext),
        extra: this.generateExtra(mappedError, fullContext),
        breadcrumbs: [...this.breadcrumbs]
      };

      // Apply beforeSend filter if configured
      const processedReport = this.config.beforeSend ? this.config.beforeSend(report) : report;
      if (!processedReport) return null;

      // Send to monitoring service
      let reportId: string | null = null;
      if (this.sentry) {
        try {
          if (error instanceof Error) {
            reportId = this.sentry.captureException(error, {
              tags: processedReport.tags,
              extra: processedReport.extra,
              contexts: { errorContext: processedReport.context }
            });
          } else {
            reportId = this.sentry.captureMessage(
              processedReport.error.message, 
              this.severityToSentryLevel(processedReport.error.severity),
              {
                tags: processedReport.tags,
                extra: processedReport.extra,
                contexts: { errorContext: processedReport.context }
              }
            );
          }
        } catch (sentryError) {
          console.warn('Failed to send error to Sentry:', sentryError);
        }
      }

      // Local logging fallback
      if (this.config.enableLocalLogging) {
        this.localErrors.push(processedReport);
        // Keep only last 100 errors to prevent memory bloat
        if (this.localErrors.length > 100) {
          this.localErrors = this.localErrors.slice(-100);
        }
        
                 console.error('Error logged:', {
           id: processedReport.id,
           code: processedReport.error.code,
           message: processedReport.error.message,
           severity: processedReport.error.severity,
           category: processedReport.error.category,
           context: processedReport.context
         });
      }

      return reportId || processedReport.id;
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
      return null;
    }
  }

  /**
   * Add breadcrumb for debugging context
   */
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    const fullBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: Date.now()
    };

    this.breadcrumbs.push(fullBreadcrumb);

    // Limit breadcrumbs to configured maximum
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
    }

    // Send to Sentry if available
    if (this.sentry) {
      try {
        this.sentry.addBreadcrumb(fullBreadcrumb);
      } catch {
        console.warn('Failed to add breadcrumb to Sentry:', error);
      }
    }
  }

  /**
   * Set user context for error reports
   */
  setUser(user: { id?: string; email?: string; username?: string; organizationId?: string }): void {
    if (this.sentry) {
      try {
        this.sentry.setUser({
          id: user.id,
          email: user.email,
          username: user.username
        });
        
        if (user.organizationId) {
          this.sentry.setTag('organizationId', user.organizationId);
        }
      } catch {
        console.warn('Failed to set user context:', error);
      }
    }
  }

  /**
   * Set additional context for error reports
   */
  setContext(key: string, context: Record<string, unknown>): void {
    if (this.sentry) {
      try {
        this.sentry.setContext(key, context);
      } catch {
        console.warn('Failed to set context:', error);
      }
    }
  }

  /**
   * Set tags for error filtering and grouping
   */
  setTag(key: string, value: string): void {
    if (this.sentry) {
      try {
        this.sentry.setTag(key, value);
      } catch {
        console.warn('Failed to set tag:', error);
      }
    }
  }

  /**
   * Get local error logs (for debugging or when Sentry is unavailable)
   */
  getLocalErrors(): ErrorReport[] {
    return [...this.localErrors];
  }

  /**
   * Clear local error logs
   */
  clearLocalErrors(): void {
    this.localErrors = [];
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate error fingerprint for grouping similar errors
   */
  private generateFingerprint(error: MappedError, context: ErrorContext): string {
    const components = [
      error.code,
      error.category,
      context.route || 'unknown-route',
      error.technicalDetails?.substring(0, 100) || ''
    ];
    
    return components.join('|');
  }

  /**
   * Generate tags for error filtering
   */
  private generateTags(error: MappedError, context: ErrorContext): Record<string, string> {
    return {
      errorCode: error.code,
      errorCategory: error.category,
      errorSeverity: error.severity,
      route: context.route || 'unknown',
      retryable: error.retryable.toString(),
      reportable: error.reportable.toString()
    };
  }

  /**
   * Generate extra context data
   */
  private generateExtra(error: MappedError, context: ErrorContext): Record<string, unknown> {
    return {
      mappedError: error,
      errorContext: context,
      breadcrumbsCount: this.breadcrumbs.length,
      userAgent: context.userAgent,
      timestamp: context.timestamp
    };
  }

  /**
   * Convert our severity to Sentry level
   */
  private severityToSentryLevel(severity: string): string {
    switch (severity) {
      case 'critical': return 'fatal';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'error';
    }
  }
}

// Default configuration
const DEFAULT_CONFIG: MonitoringConfig = {
  environment: process.env.NODE_ENV || 'development',
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  enableLocalLogging: true,
  maxBreadcrumbs: 50,
  enableUserFeedback: true
};

// Global error logging service instance
let errorLoggingService: ErrorLoggingService | null = null;

/**
 * Initialize the error logging service
 */
export function initializeErrorLogging(config: Partial<MonitoringConfig> = {}): ErrorLoggingService {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  errorLoggingService = new ErrorLoggingService(fullConfig);
  return errorLoggingService;
}

/**
 * Get the current error logging service instance
 */
export function getErrorLogger(): ErrorLoggingService {
  if (!errorLoggingService) {
    errorLoggingService = initializeErrorLogging();
  }
  return errorLoggingService;
}

/**
 * Convenience function to log an error
 */
export async function logError(
  error: Error | string | { status?: number; message?: string; code?: string },
  context?: Partial<ErrorContext>
): Promise<string | null> {
  return getErrorLogger().logError(error, context);
}

/**
 * Convenience function to add breadcrumb
 */
export function addBreadcrumb(
  category: string,
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, unknown>
): void {
  getErrorLogger().addBreadcrumb({ category, message, level, data });
}

/**
 * Convenience function to set user context
 */
export function setUserContext(user: { 
  id?: string; 
  email?: string; 
  username?: string; 
  organizationId?: string 
}): void {
  getErrorLogger().setUser(user);
}

/**
 * Enhanced error boundary hook for React components
 */
export function useErrorLogging() {
  const logger = getErrorLogger();

  const logComponentError = async (
    error: Error,
    errorInfo: { componentStack: string },
    componentName?: string
  ) => {
    // Add component-specific breadcrumb
    logger.addBreadcrumb({
      category: 'component',
      message: `Error in component: ${componentName || 'Unknown'}`,
      level: 'error',
      data: { componentStack: errorInfo.componentStack }
    });

    // Log the error with component context
    return logger.logError(error, {
      action: 'component_render',
      metadata: {
        componentName,
        componentStack: errorInfo.componentStack
      }
    });
  };

  return {
    logComponentError,
    addBreadcrumb: (category: string, message: string, level?: 'debug' | 'info' | 'warning' | 'error', data?: Record<string, unknown>) => 
      logger.addBreadcrumb({ category, message, level: level || 'info', data }),
    logError: (error: Error | string, context?: Partial<ErrorContext>) => 
      logger.logError(error, context)
  };
}

// Export types and service
export { ErrorLoggingService }; 