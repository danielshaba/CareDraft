'use client'

import React from 'react'
import Link from 'next/link'
import { AlertCircle, RefreshCw, LogOut, Home } from 'lucide-react'
import { useAuth } from '@/components/providers/MinimalAuthProvider'

interface AuthErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface AuthErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{
    error: Error
    resetError: () => void
    signOut: () => void
  }>
}

export class AuthErrorBoundary extends React.Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Log authentication errors
    console.error('Authentication Error Boundary caught an error:', error)
    console.error('Error Info:', errorInfo)

    // Check if it's an authentication-related error
    if (this.isAuthError(error)) {
      console.error('Authentication-related error detected')
    }
  }

  isAuthError = (error: Error): boolean => {
    const authErrorKeywords = [
      'auth',
      'session',
      'token',
      'unauthorized',
      'permission',
      'supabase',
      'login',
      'authentication',
    ]

    const errorMessage = error.message.toLowerCase()
    return authErrorKeywords.some(keyword => errorMessage.includes(keyword))
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props

      if (Fallback && this.state.error) {
        return (
          <Fallback
            error={this.state.error}
            resetError={this.resetError}
            signOut={() => {
              // We'll need to access signOut through a context or prop
              window.location.href = '/login'
            }}
          />
        )
      }

      return (
        <DefaultAuthErrorFallback
          error={this.state.error}
          resetError={this.resetError}
        />
      )
    }

    return this.props.children
  }
}

interface DefaultAuthErrorFallbackProps {
  error: Error | null
  resetError: () => void
}

function DefaultAuthErrorFallback({ error, resetError }: DefaultAuthErrorFallbackProps) {
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/login'
    } catch (signOutError) {
      console.error('Error signing out:', signOutError)
      // Force redirect even if sign out fails
      window.location.href = '/login'
    }
  }

  const handleRefresh = () => {
    resetError()
    window.location.reload()
  }

  const isAuthError = error?.message?.toLowerCase().includes('auth') ||
                     error?.message?.toLowerCase().includes('session') ||
                     error?.message?.toLowerCase().includes('token')

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-100">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>

          {/* Content */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {isAuthError ? 'Authentication Error' : 'Something Went Wrong'}
          </h1>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            {isAuthError
              ? 'There was a problem with your authentication session. Please sign in again.'
              : 'An unexpected error occurred. This might be a temporary issue.'
            }
          </p>

          {/* Error details (only in development) */}
          {process.env.NODE_ENV === 'development' && error && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
              <p className="text-sm font-medium text-gray-700 mb-2">Error Details:</p>
              <p className="text-xs text-gray-600 font-mono">{error.message}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {isAuthError ? (
              <>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center justify-center w-full bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out & Try Again
                </button>
                
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center justify-center w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Page
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={resetError}
                  className="inline-flex items-center justify-center w-full bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>
                
                <Link
                  href="/"
                  className="inline-flex items-center justify-center w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Link>
              </>
            )}
          </div>

          {/* Help */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-3">
              If this problem persists, please contact support
            </p>
            <Link
              href="/contact"
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook for functional components to handle auth errors
 */
export function useAuthErrorHandler() {
  const { signOut } = useAuth()

  const handleAuthError = React.useCallback(async (error: Error) => {
    console.error('Authentication error:', error)

    // Check if it's a session expiration or auth error
    const errorMessage = error.message.toLowerCase()
    const isSessionError = errorMessage.includes('session') || 
                          errorMessage.includes('token') || 
                          errorMessage.includes('unauthorized')

    if (isSessionError) {
      try {
        await signOut()
      } catch (signOutError) {
        console.error('Error signing out after auth error:', signOutError)
      }
      
      // Redirect to login
      window.location.href = '/login'
    }
  }, [signOut])

  return { handleAuthError }
} 