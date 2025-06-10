'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Home, FileText } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

export class ProfileErrorBoundary extends Component<Props, State> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate a unique error ID for tracking
    const errorId = `profile_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log the error for monitoring
    console.error('ProfileErrorBoundary caught an error:', error, errorInfo)

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Send error to monitoring service (if implemented)
    this.reportError(error, errorInfo)
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // TODO: Integrate with error monitoring service (e.g., Sentry, LogRocket)
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      retryCount: this.retryCount
    }

    // For now, just log to console
    console.error('Error Report:', errorReport)

    // In production, you would send this to your monitoring service:
    // analytics.track('Profile Error', errorReport)
    // Sentry.captureException(error, { extra: errorReport })
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: ''
      })
    }
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-neutral-light py-8">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  Profile Loading Error
                </CardTitle>
                <CardDescription className="text-red-600">
                  We encountered an issue while loading your profile. This might be a temporary problem.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-red-200 bg-red-100">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Error Details:</strong> {this.state.error?.message || 'Unknown error occurred'}
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col sm:flex-row gap-3">
                  {this.retryCount < this.maxRetries && (
                    <Button 
                      onClick={this.handleRetry}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again ({this.maxRetries - this.retryCount} attempts left)
                    </Button>
                  )}
                  
                  <Button 
                    onClick={this.handleReload}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Page
                  </Button>
                </div>

                <div className="pt-4 border-t border-red-200">
                  <p className="text-sm text-red-600 mb-3">
                    If the problem persists, you can:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link href="/dashboard">
                      <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                        <Home className="w-4 h-4 mr-2" />
                        Go to Dashboard
                      </Button>
                    </Link>
                    <Link href="/settings">
                      <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                        <FileText className="w-4 h-4 mr-2" />
                        Back to Settings
                      </Button>
                    </Link>
                  </div>
                </div>

                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <div className="mt-6 p-4 bg-red-100 border border-red-200 rounded-md">
                    <h4 className="text-sm font-medium text-red-800 mb-2">Development Debug Info:</h4>
                    <pre className="text-xs text-red-600 overflow-auto max-h-32">
                      {this.state.error?.stack}
                    </pre>
                    <pre className="text-xs text-red-600 overflow-auto max-h-32 mt-2">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}

                <div className="text-xs text-red-500 pt-2 border-t border-red-200">
                  Error ID: {this.state.errorId}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ProfileErrorBoundary 