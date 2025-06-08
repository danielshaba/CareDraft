// Error logging service with optional Sentry integration
// Note: Install @sentry/nextjs if you want Sentry integration

// Optional Sentry types (will be undefined if not installed)
type SentryType = {
  captureException: (error: Error, context?: Record<string, any>) => void;
  addBreadcrumb: (breadcrumb: any) => void;
  setTag: (key: string, value: string) => void;
  setUser: (user: any) => void;
  setContext: (key: string, context: any) => void;
  init: (options: any) => void;
  withScope: (callback: (scope: any) => void) => void;
};

// Try to import Sentry, but handle gracefully if not available
let Sentry: SentryType | undefined;
try {
  // Dynamic import to handle missing dependency gracefully
  Sentry = typeof window !== 'undefined' 
    ? require('@sentry/nextjs') 
    : undefined;
} catch (error) {
  // Sentry not installed, will use local logging
  console.warn('Sentry not available, using local error logging only');
}

export interface ErrorBreadcrumb {
  message: string;
  category: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  timestamp: number;
  data?: Record<string, any>;
}

export interface ErrorContext {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
  component?: string;
  action?: string;
  route?: string;
  userAgent?: string;
  timestamp: number;
}

interface LocalErrorLog {
  id: string;
  error: Error;
  context: ErrorContext;
  breadcrumbs: ErrorBreadcrumb[];
  timestamp: number;
  fingerprint: string;
}

class ErrorLoggingService {
  private breadcrumbs: ErrorBreadcrumb[] = [];
  private context: Partial<ErrorContext> = {};
  private localErrors: LocalErrorLog[] = [];
  private maxLocalErrors = 100;

  constructor() {
    this.initializeSentry();
    this.setupGlobalErrorHandlers();
  }

  private initializeSentry() {
    if (Sentry && typeof window !== 'undefined') {
      try {
        Sentry.init({
          dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
          environment: process.env.NODE_ENV,
          tracesSampleRate: 0.1,
          beforeSend: (event) => {
            // Filter out development errors if needed
            if (process.env.NODE_ENV === 'development') {
              return null; // Don't send dev errors to Sentry
            }
            return event;
          },
        });
      } catch (error) {
        console.warn('Failed to initialize Sentry:', error);
        Sentry = undefined;
      }
    }
  }

  private setupGlobalErrorHandlers() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.logError(new Error(event.message), {
          component: 'GlobalErrorHandler',
          action: 'unhandled_error',
          route: window.location.pathname,
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.logError(new Error(event.reason), {
          component: 'GlobalErrorHandler', 
          action: 'unhandled_promise_rejection',
          route: window.location.pathname,
        });
      });
    }
  }

  addBreadcrumb(breadcrumb: Omit<ErrorBreadcrumb, 'timestamp'>) {
    const fullBreadcrumb: ErrorBreadcrumb = {
      ...breadcrumb,
      timestamp: Date.now(),
    };

    this.breadcrumbs.push(fullBreadcrumb);
    
    // Keep only last 50 breadcrumbs
    if (this.breadcrumbs.length > 50) {
      this.breadcrumbs = this.breadcrumbs.slice(-50);
    }

    // Add to Sentry if available
    if (Sentry) {
      try {
        Sentry.addBreadcrumb({
          message: breadcrumb.message,
          category: breadcrumb.category,
          level: breadcrumb.level,
          timestamp: fullBreadcrumb.timestamp / 1000, // Sentry expects seconds
          data: breadcrumb.data,
        });
      } catch (error) {
        console.warn('Failed to add breadcrumb to Sentry:', error);
      }
    }
  }

  setContext(context: Partial<ErrorContext>) {
    this.context = { ...this.context, ...context };

    if (Sentry) {
      try {
        if (context.user) {
          Sentry.setUser(context.user);
        }
        if (context.component) {
          Sentry.setTag('component', context.component);
        }
        if (context.route) {
          Sentry.setTag('route', context.route);
        }
        if (context.action) {
          Sentry.setContext('action', { action: context.action });
        }
      } catch (error) {
        console.warn('Failed to set context in Sentry:', error);
      }
    }
  }

  logError(error: Error, context?: Partial<ErrorContext>) {
    const fullContext: ErrorContext = {
      ...this.context,
      ...context,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
    };

    // Generate fingerprint for grouping similar errors
    const fingerprint = this.generateFingerprint(error, fullContext);

    // Store locally
    this.storeLocalError({
      id: Math.random().toString(36),
      error,
      context: fullContext,
      breadcrumbs: [...this.breadcrumbs],
      timestamp: fullContext.timestamp,
      fingerprint,
    });

    // Log to Sentry if available
    if (Sentry) {
      try {
        Sentry.withScope((scope) => {
          scope.setTag('fingerprint', fingerprint);
          if (fullContext.component) {
            scope.setTag('component', fullContext.component);
          }
          if (fullContext.action) {
            scope.setContext('action', { action: fullContext.action });
          }
          Sentry.captureException(error);
        });
      } catch (sentryError) {
        console.warn('Failed to log error to Sentry:', sentryError);
      }
    }

    // Always log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', { error, context: fullContext, breadcrumbs: this.breadcrumbs });
    }
  }

  private generateFingerprint(error: Error, context: ErrorContext): string {
    const key = `${error.name}_${error.message}_${context.component}_${context.action}`;
    return btoa(key).slice(0, 16);
  }

  private storeLocalError(errorLog: LocalErrorLog) {
    this.localErrors.push(errorLog);
    
    // Rotate old errors
    if (this.localErrors.length > this.maxLocalErrors) {
      this.localErrors = this.localErrors.slice(-this.maxLocalErrors);
    }

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        const serializedErrors = this.localErrors.map(log => ({
          ...log,
          error: {
            name: log.error.name,
            message: log.error.message,
            stack: log.error.stack,
          },
        }));
        localStorage.setItem('error_logs', JSON.stringify(serializedErrors));
      } catch (error) {
        console.warn('Failed to store errors in localStorage:', error);
      }
    }
  }

  getLocalErrors(): LocalErrorLog[] {
    return [...this.localErrors];
  }

  clearLocalErrors() {
    this.localErrors = [];
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('error_logs');
      } catch (error) {
        console.warn('Failed to clear localStorage errors:', error);
      }
    }
  }

  // React component integration
  useErrorLogging() {
    return {
      logError: this.logError.bind(this),
      addBreadcrumb: this.addBreadcrumb.bind(this),
      setContext: this.setContext.bind(this),
    };
  }
}

// Create singleton instance
export const errorLoggingService = new ErrorLoggingService();

// Export hooks for React components
export const useErrorLogging = () => errorLoggingService.useErrorLogging(); 