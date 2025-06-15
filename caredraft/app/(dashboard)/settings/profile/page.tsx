'use client'

// Disable static generation for this page since it has client-side functionality
export const dynamic = 'force-dynamic'




import React, { ErrorInfo } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import CareDraftLogo from '@/components/ui/CareDraftLogo'
import ProfileForm from '@/components/forms/ProfileForm'
import { ProfileErrorBoundary } from '@/components/ui/ProfileErrorBoundary'

export default function ProfileSettingsPage() {
  return (
    <ProfileErrorBoundary
      onError={(error: Error, errorInfo: ErrorInfo) => {
        // Log profile-specific errors for analytics
        console.error('Profile page error:', error, errorInfo)
        // TODO: Send to analytics/monitoring service
      }}
    >
      <div className="min-h-screen bg-neutral-light py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/settings" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Link>
            
            {/* CareDraft Logo and Header */}
            <div className="flex items-center space-x-4 mb-4">
              <CareDraftLogo size="md" variant="icon-only" />
              <div>
                <h1 className="text-3xl font-bold text-brand-primary-dark mb-2">Profile Settings</h1>
                <p className="text-lg text-neutral-600">
                  Manage your personal information and profile preferences
                </p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <ProfileForm />
        </div>
      </div>
    </ProfileErrorBoundary>
  )
} 
