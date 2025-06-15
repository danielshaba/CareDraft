'use client'

import React from 'react'
import Link from 'next/link'
import { RefreshCw, Home, Bug } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Global Error Boundary')
      console.error('Error:', error)
      console.error('Digest:', error.digest)
      console.groupEnd()
    }

    // Report error to monitoring service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      level: 'global',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      timestamp: new Date().toISOString(),
    }

    // TODO: Send to error monitoring service
    if (process.env.NODE_ENV === 'development') {
      console.log('Global Error Report:', errorReport)
    }
  }, [error])

  const handleRefresh = () => {
    reset()
    window.location.reload()
  }

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center px-4">
          <div className="max-w-lg w-full text-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              {/* CareDraft Logo */}
              <div className="mb-6">
                <Logo size="lg" className="mx-auto" />
              </div>

              {/* Icon */}
              <div className="mx-auto flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-6">
                <Bug className="w-8 h-8 text-teal-600" />
              </div>

              {/* Content */}
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Application Error
              </h1>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                A critical error occurred that prevented the application from loading. 
                Our team has been automatically notified.
              </p>

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
                  className="inline-flex items-center justify-center w-full bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>
                
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center justify-center w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Application
                </button>
                
                <Link
                  href="/"
                  className="inline-flex items-center justify-center w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Home
                </Link>
              </div>

              {/* Help */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-3">
                  If this problem persists, please contact our support team
                  {error.digest && (
                    <span> and include the error ID above</span>
                  )}
                </p>
                <Link
                  href="/contact"
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
} 