'use client'

import React from 'react'
import Link from 'next/link'
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Page Error Boundary')
      console.error('Error:', error)
      console.error('Digest:', error.digest)
      console.groupEnd()
    }

    // Report error to monitoring service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      level: 'page',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      timestamp: new Date().toISOString(),
    }

    // TODO: Send to error monitoring service
    if (process.env.NODE_ENV === 'development') {
      console.log('Page Error Report:', errorReport)
    }
  }, [error])

  const getErrorType = () => {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network'
    }
    if (message.includes('not found') || message.includes('404')) {
      return 'notFound'
    }
    if (message.includes('auth') || message.includes('session') || message.includes('token')) {
      return 'auth'
    }
    if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'permission'
    }
    
    return 'generic'
  }

  const getErrorConfig = () => {
    const errorType = getErrorType()
    
    switch (errorType) {
      case 'network':
        return {
          title: 'Connection Problem',
          description: 'Unable to load this page due to a network issue. Please check your connection and try again.',
          bgColor: 'from-brand-50 to-indigo-50',
          iconColor: 'text-brand-600',
          iconBg: 'bg-brand-100',
          buttonColor: 'bg-brand-600 hover:bg-brand-700',
        }
      case 'notFound':
        return {
          title: 'Page Not Found',
          description: 'The page you\'re looking for doesn\'t exist or has been moved.',
          bgColor: 'from-purple-50 to-violet-50',
          iconColor: 'text-purple-600',
          iconBg: 'bg-purple-100',
          buttonColor: 'bg-purple-600 hover:bg-purple-700',
        }
      case 'auth':
        return {
          title: 'Authentication Required',
          description: 'You need to sign in to access this page.',
          bgColor: 'from-yellow-50 to-orange-50',
          iconColor: 'text-yellow-600',
          iconBg: 'bg-yellow-100',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
        }
      case 'permission':
        return {
          title: 'Access Denied',
          description: 'You don\'t have permission to access this page.',
          bgColor: 'from-red-50 to-pink-50',
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          buttonColor: 'bg-red-600 hover:bg-red-700',
        }
      default:
        return {
          title: 'Something Went Wrong',
          description: 'An unexpected error occurred while loading this page.',
          bgColor: 'from-gray-50 to-slate-50',
          iconColor: 'text-gray-600',
          iconBg: 'bg-gray-100',
          buttonColor: 'bg-gray-600 hover:bg-gray-700',
        }
    }
  }

  const config = getErrorConfig()

  // Removed unused handleRefresh function since we have reset button working

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgColor} flex items-center justify-center px-4`}>
      <div className="max-w-lg w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Icon */}
          <div className={`mx-auto flex items-center justify-center w-16 h-16 ${config.iconBg} rounded-full mb-6`}>
            <AlertCircle className={`w-8 h-8 ${config.iconColor}`} />
          </div>

          {/* Content */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{config.title}</h1>
          <p className="text-gray-600 mb-6 leading-relaxed">{config.description}</p>

          {/* Error digest (helps with debugging) */}
          {error.digest && (
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Error ID: <span className="font-mono text-xs">{error.digest}</span>
              </p>
            </div>
          )}

          {/* Error details (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-6 text-left">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer mb-2">
                Technical Details (Development)
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
              onClick={reset}
              className={`inline-flex items-center justify-center w-full text-white px-6 py-3 rounded-lg font-medium ${config.buttonColor} transition-colors`}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleGoBack}
                className="inline-flex items-center justify-center bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </button>
              
              <Link
                href="/"
                className="inline-flex items-center justify-center bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
            </div>
          </div>

          {/* Help */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-3">
              If this problem persists, please contact support
              {error.digest && (
                <span> and include the error ID above</span>
              )}
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