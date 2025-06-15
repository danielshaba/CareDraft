'use client'

// Disable static generation for this page since it has client-side functionality
export const dynamic = 'force-dynamic'




import React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowLeft, Mail } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error')
  const errorDescription = searchParams?.get('error_description')

  // Map common error codes to user-friendly messages
  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'access_denied':
        return {
          title: 'Access Denied',
          message: 'You canceled the authentication process.',
          suggestion: 'Please try signing in again to continue.'
        }
      case 'invalid_request':
        return {
          title: 'Invalid Request',
          message: 'There was an issue with the authentication request.',
          suggestion: 'Please try the process again from the beginning.'
        }
      case 'server_error':
        return {
          title: 'Server Error',
          message: 'There was a temporary issue with our authentication service.',
          suggestion: 'Please wait a moment and try again.'
        }
      case 'temporarily_unavailable':
        return {
          title: 'Service Temporarily Unavailable',
          message: 'The authentication service is currently unavailable.',
          suggestion: 'Please try again in a few minutes.'
        }
      default:
        return {
          title: 'Authentication Error',
          message: errorDescription || 'An unexpected error occurred during authentication.',
          suggestion: 'Please try signing in again or contact support if the problem persists.'
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <Logo size="lg" variant="full" />
          </div>
          
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          
          <CardTitle className="text-2xl font-bold text-red-600">
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {errorInfo.message}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {errorInfo.suggestion}
            </AlertDescription>
          </Alert>

          {/* Debug Information (only in development) */}
          {process.env.NODE_ENV === 'development' && (error || errorDescription) && (
            <div className="bg-gray-50 p-3 rounded-md border">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Debug Information:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                {error && (
                  <div>
                    <span className="font-medium">Error Code:</span> {error}
                  </div>
                )}
                {errorDescription && (
                  <div>
                    <span className="font-medium">Description:</span> {errorDescription}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button asChild className="w-full bg-brand-primary hover:bg-brand-accent">
              <Link href="/login">
                <Mail className="w-4 h-4 mr-2" />
                Try Signing In Again
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Home
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Still having trouble?{' '}
              <Link 
                href="/help" 
                className="text-brand-primary hover:text-brand-accent underline"
              >
                Contact Support
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
