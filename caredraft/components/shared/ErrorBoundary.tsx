'use client'

import React from 'react'
import Link from 'next/link'
import { AlertCircle, RefreshCw, Home, FileX, Wifi, Bug } from 'lucide-react'
import { formatErrorForDisplay, mapError } from '@/lib/services/error-mapping'
import { logError, addBreadcrumb } from '@/lib/services/error-logging'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{
    error: Error
    resetError: () => void
    errorId: string
  }>
  level?: 'global' | 'page' | 'component'
  onError?: (error: Error, errorInfo: React.ErrorInfo, errorId: string) => void
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = this.generateErrorId()
    return {
      hasError: true,
      error,
      errorId,
    }
  }

  static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = this.state.errorId || ErrorBoundary.generateErrorId()
    
    this.setState({
      error,
      errorInfo,
      errorId,
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Boundary (${this.props.level || 'unknown'})`)
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Error ID:', errorId)
      console.groupEnd()
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId)
    }

    // Report error to monitoring service
    this.reportError(error, errorInfo, errorId)
  }

  reportError = async (error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    try {
      // Add breadcrumb for context
      addBreadcrumb(
        'component',
        `Error boundary caught error in ${this.props.level || 'unknown'} level`,
        'error',
        {
          errorId,
          componentStack: errorInfo.componentStack,
          level: this.props.level
        }
      );

      // Log error using the new error logging system
      await logError(error, {
        action: 'component_error',
        metadata: {
          componentStack: errorInfo.componentStack,
          level: this.props.level || 'unknown',
          errorId
        }
      });

      // In development, also log to console
      if (process.env.NODE_ENV === 'development') {
        console.log('Error logged with ID:', errorId);
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })
  }

  getErrorType = (error: Error): 'network' | 'auth' | 'permission' | 'validation' | 'chunk' | 'generic' => {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network'
    }
    if (message.includes('auth') || message.includes('session') || message.includes('token')) {
      return 'auth'
    }
    if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'permission'
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return 'validation'
    }
    if (message.includes('chunk') || message.includes('loading chunk')) {
      return 'chunk'
    }
    
    return 'generic'
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback: Fallback } = this.props

      if (Fallback) {
        return (
          <Fallback
            error={this.state.error}
            resetError={this.resetError}
            errorId={this.state.errorId || 'unknown'}
          />
        )
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          errorId={this.state.errorId || 'unknown'}
          level={this.props.level || 'global'}
          errorType={this.getErrorType(this.state.error)}
        />
      )
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps {
  error: Error
  errorInfo: React.ErrorInfo | null
  resetError: () => void
  errorId: string
  level: string
  errorType: 'network' | 'auth' | 'permission' | 'validation' | 'chunk' | 'generic'
}

function DefaultErrorFallback({ 
  error, 
  resetError, 
  errorId, 
  level,
  errorType 
}: DefaultErrorFallbackProps) {
  const getErrorConfig = () => {
    switch (errorType) {
      case 'network':
        return {
          icon: Wifi,
          title: 'Connection Problem',
          description: 'Unable to connect to our servers. Please check your internet connection and try again.',
          bgColor: 'from-blue-50 to-indigo-50',
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100',
          buttonColor: 'bg-blue-600 hover:bg-blue-700',
        }
      case 'auth':
        return {
          icon: AlertCircle,
          title: 'Authentication Error',
          description: 'There was a problem with your authentication. Please sign in again.',
          bgColor: 'from-yellow-50 to-orange-50',
          iconColor: 'text-yellow-600',
          iconBg: 'bg-yellow-100',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
        }
      case 'permission':
        return {
          icon: AlertCircle,
          title: 'Access Denied',
          description: 'You don\'t have permission to access this resource.',
          bgColor: 'from-red-50 to-pink-50',
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          buttonColor: 'bg-red-600 hover:bg-red-700',
        }
      case 'chunk':
        return {
          icon: RefreshCw,
          title: 'Loading Error',
          description: 'There was a problem loading this page. This usually resolves with a refresh.',
          bgColor: 'from-purple-50 to-violet-50',
          iconColor: 'text-purple-600',
          iconBg: 'bg-purple-100',
          buttonColor: 'bg-purple-600 hover:bg-purple-700',
        }
      case 'validation':
        return {
          icon: FileX,
          title: 'Validation Error',
          description: 'There was a problem with the data provided. Please check your input and try again.',
          bgColor: 'from-orange-50 to-red-50',
          iconColor: 'text-orange-600',
          iconBg: 'bg-orange-100',
          buttonColor: 'bg-orange-600 hover:bg-orange-700',
        }
      default:
        return {
          icon: Bug,
          title: 'Something Went Wrong',
          description: 'An unexpected error occurred. Our team has been notified.',
          bgColor: 'from-gray-50 to-slate-50',
          iconColor: 'text-gray-600',
          iconBg: 'bg-gray-100',
          buttonColor: 'bg-gray-600 hover:bg-gray-700',
        }
    }
  }

  const config = getErrorConfig()
  const IconComponent = config.icon

  const handleRefresh = () => {
    resetError()
    window.location.reload()
  }

  const isComponentLevel = level === 'component'

  if (isComponentLevel) {
    return (
      <div className="bg-white border border-red-200 rounded-lg p-6 text-center">
        <div className={`mx-auto flex items-center justify-center w-12 h-12 ${config.iconBg} rounded-full mb-4`}>
          <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{config.title}</h3>
        <p className="text-gray-600 mb-4 text-sm">{config.description}</p>
        
        <div className="space-y-2">
          <button
            onClick={resetError}
            className={`inline-flex items-center justify-center px-4 py-2 text-white text-sm font-medium rounded-lg ${config.buttonColor} transition-colors`}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer">Error Details</summary>
            <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono text-gray-600">
              <p><strong>Error:</strong> {error.message}</p>
              <p><strong>ID:</strong> {errorId}</p>
            </div>
          </details>
        )}
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgColor} flex items-center justify-center px-4`}>
      <div className="max-w-lg w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Icon */}
          <div className={`mx-auto flex items-center justify-center w-16 h-16 ${config.iconBg} rounded-full mb-6`}>
            <IconComponent className={`w-8 h-8 ${config.iconColor}`} />
          </div>

          {/* Content */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{config.title}</h1>
          <p className="text-gray-600 mb-6 leading-relaxed">{config.description}</p>

          {/* Error ID */}
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Error ID: <span className="font-mono text-xs">{errorId}</span>
            </p>
          </div>

          {/* Error details (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-6 text-left">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer mb-2">
                Technical Details
              </summary>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Error Message:</p>
                <p className="text-xs text-gray-600 font-mono mb-3">{error.message}</p>
                
                {error.stack && (
                  <>
                    <p className="text-sm font-medium text-gray-700 mb-2">Stack Trace:</p>
                    <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap overflow-auto max-h-32">
                      {error.stack}
                    </pre>
                  </>
                )}
              </div>
            </details>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={resetError}
              className={`inline-flex items-center justify-center w-full text-white px-6 py-3 rounded-lg font-medium ${config.buttonColor} transition-colors`}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
            
            <button
              onClick={handleRefresh}
              className="inline-flex items-center justify-center w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </button>
            
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </div>

          {/* Help */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-3">
              If this problem persists, please contact support with the error ID above
            </p>
            <Link
              href="/contact"
              className={`text-sm ${config.iconColor} hover:opacity-80 font-medium`}
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const [errorBoundary, setErrorBoundary] = React.useState<{
    resetError: () => void
  } | null>(null)

  const throwError = React.useCallback((error: Error) => {
    throw error
  }, [])

  const handleError = React.useCallback((error: Error) => {
    console.error('Handled error:', error)
    
    // In development, log more details
    if (process.env.NODE_ENV === 'development') {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      })
    }

    // Throw the error to trigger the nearest error boundary
    throwError(error)
  }, [throwError])

  return { handleError, errorBoundary, setErrorBoundary }
}

export default ErrorBoundary 