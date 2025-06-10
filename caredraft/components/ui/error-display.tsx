'use client';

import React from 'react';
import { 
  AlertCircle, 
  Wifi, 
  RefreshCw, 
  Home, 
  Bug, 
  Shield, 
  FileX, 
  Clock,
  ExternalLink,
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mapError, formatErrorForDisplay, type MappedError } from '@/lib/services/error-mapping';
import { useNetworkAwareApi } from '@/hooks/useNetworkAwareApi';
import { LoadingButton } from '@/components/ui/loading-button';

interface ErrorDisplayProps {
  error: Error | string | { status?: number; message?: string; code?: string };
  className?: string;
  showTechnicalDetails?: boolean;
  onRetry?: () => void | Promise<void>;
  onDismiss?: () => void;
  contextInfo?: {
    component?: string;
    action?: string;
    route?: string;
  };
}

const ERROR_ICONS = {
  network: Wifi,
  authentication: Shield,
  authorization: Shield,
  validation: AlertCircle,
  server: Bug,
  client: AlertCircle,
  storage: FileX,
  external_service: ExternalLink,
  unknown: AlertCircle
} as const;

const ERROR_COLORS = {
  low: {
    bg: 'from-brand-50 to-brand-100',
    border: 'border-brand-200',
    icon: 'text-brand-600',
    iconBg: 'bg-brand-100',
    button: 'bg-brand-600 hover:bg-brand-700'
  },
  medium: {
    bg: 'from-yellow-50 to-yellow-100',
    border: 'border-yellow-200',
    icon: 'text-yellow-600',
    iconBg: 'bg-yellow-100',
    button: 'bg-yellow-600 hover:bg-yellow-700'
  },
  high: {
    bg: 'from-orange-50 to-orange-100',
    border: 'border-orange-200',
    icon: 'text-orange-600',
    iconBg: 'bg-orange-100',
    button: 'bg-orange-600 hover:bg-orange-700'
  },
  critical: {
    bg: 'from-red-50 to-red-100',
    border: 'border-red-200',
    icon: 'text-red-600',
    iconBg: 'bg-red-100',
    button: 'bg-red-600 hover:bg-red-700'
  }
} as const;

export function ErrorDisplay({
  error,
  className,
  showTechnicalDetails = false,
  onRetry,
  onDismiss,
  contextInfo
}: ErrorDisplayProps) {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [technicalDetailsVisible, setTechnicalDetailsVisible] = React.useState(false);
  const { executeWithRetry } = useNetworkAwareApi();

  // Map the error to user-friendly format
  const mappedError = React.useMemo(() => {
    return mapError(error, {
      route: contextInfo?.route,
      action: contextInfo?.action
    });
  }, [error, contextInfo]);

  const displayInfo = formatErrorForDisplay(mappedError, technicalDetailsVisible);
  const IconComponent = ERROR_ICONS[mappedError.category];
  const colors = ERROR_COLORS[mappedError.severity];

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      if (mappedError.category === 'network') {
        // Use network-aware retry for network errors
        await executeWithRetry(async () => {
          const result = onRetry();
          if (result instanceof Promise) {
            await result;
          }
        });
      } else {
        const result = onRetry();
        if (result instanceof Promise) {
          await result;
        }
      }
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  const copyErrorDetails = async () => {
    try {
      const errorDetails = `
Error Code: ${mappedError.code}
Category: ${mappedError.category}
Severity: ${mappedError.severity}
Message: ${mappedError.message}
Technical Details: ${mappedError.technicalDetails || 'None'}
Context: ${JSON.stringify(contextInfo, null, 2)}
Timestamp: ${new Date().toISOString()}
      `.trim();
      
      await navigator.clipboard.writeText(errorDetails);
      // Could show a toast here
    } catch (clipboardError) {
      console.error('Failed to copy error details:', clipboardError);
    }
  };

  return (
    <div className={cn(
      'rounded-lg border p-6 bg-gradient-to-br',
      colors.bg,
      colors.border,
      className
    )}>
      {/* Header with icon and title */}
      <div className="flex items-start gap-4">
        <div className={cn(
          'flex-shrink-0 p-2 rounded-full',
          colors.iconBg
        )}>
          <IconComponent className={cn('h-6 w-6', colors.icon)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {displayInfo.title}
          </h3>
          
          <p className="text-gray-700 mb-4 leading-relaxed">
            {displayInfo.message}
          </p>

          {/* User Actions */}
          {displayInfo.actions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">
                What you can do:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                {displayInfo.actions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Context Information */}
          {contextInfo && (
            <div className="mb-4 p-3 bg-white/50 rounded border border-gray-200">
              <h4 className="text-sm font-medium text-gray-800 mb-2">
                Error Context:
              </h4>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600">
                {contextInfo.component && (
                  <>
                    <dt className="font-medium">Component:</dt>
                    <dd className="sm:col-span-2">{contextInfo.component}</dd>
                  </>
                )}
                {contextInfo.action && (
                  <>
                    <dt className="font-medium">Action:</dt>
                    <dd className="sm:col-span-2">{contextInfo.action}</dd>
                  </>
                )}
                {contextInfo.route && (
                  <>
                    <dt className="font-medium">Route:</dt>
                    <dd className="sm:col-span-2">{contextInfo.route}</dd>
                  </>
                )}
              </dl>
            </div>
          )}

          {/* Technical Details (Collapsible) */}
          {showTechnicalDetails && mappedError.technicalDetails && (
            <div className="mb-4">
              <button
                onClick={() => setTechnicalDetailsVisible(!technicalDetailsVisible)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Bug className="h-4 w-4" />
                Technical Details
                <div className={cn(
                  'transition-transform',
                  technicalDetailsVisible ? 'rotate-90' : 'rotate-0'
                )}>
                  ▶
                </div>
              </button>
              
              {technicalDetailsVisible && (
                <div className="mt-2 p-3 bg-gray-100 rounded border font-mono text-xs text-gray-700 whitespace-pre-wrap">
                  {mappedError.technicalDetails}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {displayInfo.canRetry && onRetry && (
                             <LoadingButton
                 onClick={handleRetry}
                 isLoading={isRetrying}
                 className={cn(
                   'text-white',
                   colors.button
                 )}
                 size="sm"
               >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </LoadingButton>
            )}

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors"
              >
                Dismiss
              </button>
            )}

            <button
              onClick={() => window.location.href = '/'}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors"
            >
              <Home className="h-4 w-4 mr-2 inline" />
              Go Home
            </button>

            {showTechnicalDetails && (
              <button
                onClick={copyErrorDetails}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors"
                title="Copy error details for support"
              >
                <Copy className="h-4 w-4 mr-2 inline" />
                Copy Details
              </button>
            )}
          </div>

          {/* Error ID for support */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Error Code: <span className="font-mono">{mappedError.code}</span>
              {' • '}
              <time dateTime={new Date().toISOString()}>
                {new Date().toLocaleString()}
              </time>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact version for inline errors
export function InlineErrorDisplay({
  error,
  onRetry,
  className
}: {
  error: Error | string;
  onRetry?: () => void;
  className?: string;
}) {
  const mappedError = mapError(error);
  const IconComponent = ERROR_ICONS[mappedError.category];
  const colors = ERROR_COLORS[mappedError.severity];

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-md border',
      colors.bg,
      colors.border,
      className
    )}>
      <IconComponent className={cn('h-5 w-5 flex-shrink-0', colors.icon)} />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {mappedError.title}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          {mappedError.message}
        </p>
      </div>

      {mappedError.retryable && onRetry && (
        <button
          onClick={onRetry}
          className={cn(
            'flex-shrink-0 p-2 rounded text-white transition-colors',
            colors.button
          )}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Hook for using error display in components
export function useErrorDisplay() {
  const [error, setError] = React.useState<Error | string | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  const showError = (err: Error | string) => {
    setError(err);
    setIsVisible(true);
  };

  const hideError = () => {
    setIsVisible(false);
    setTimeout(() => setError(null), 300); // Delay to allow exit animation
  };

  const retryAction = async (action: () => Promise<void>) => {
    try {
      await action();
      hideError();
    } catch (retryError) {
      if (retryError instanceof Error) {
        setError(retryError);
      }
    }
  };

  return {
    error,
    isVisible,
    showError,
    hideError,
    retryAction,
    ErrorDisplay: error && isVisible ? (
      <ErrorDisplay
        error={error}
        onDismiss={hideError}
        onRetry={() => retryAction}
        showTechnicalDetails={process.env.NODE_ENV === 'development'}
      />
    ) : null
  };
} 