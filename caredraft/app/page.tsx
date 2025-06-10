'use client'

import { useAuth } from '@/components/providers/AuthProvider'

import Link from 'next/link'

export default function LandingPage() {
  const { user, loading } = useAuth()

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  // Show landing page with appropriate navigation based on auth status
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-brand-600">CareDraft</h1>
            </div>
            <div className="space-x-4">
              {user ? (
                // Show dashboard link for authenticated users
                <Link
                  href="/dashboard"
                  className="bg-brand-600 text-white hover:bg-brand-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Go to Dashboard
                </Link>
              ) : (
                // Show login/signup for unauthenticated users
                <>
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-brand-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-brand-600 text-white hover:bg-brand-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Streamline Your
            <span className="text-brand-600"> Tender Proposals</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            CareDraft helps you create, manage, and track tender proposals with intelligent automation, 
            collaborative features, and comprehensive progress monitoring.
          </p>
          <div className="space-x-4">
            {user ? (
              // Show dashboard button for authenticated users
              <Link
                href="/dashboard"
                className="bg-brand-600 text-white hover:bg-brand-700 px-8 py-4 rounded-lg text-lg font-semibold inline-block"
              >
                View Dashboard
              </Link>
            ) : (
              // Show signup/login for unauthenticated users
              <>
                <Link
                  href="/signup"
                  className="bg-brand-600 text-white hover:bg-brand-700 px-8 py-4 rounded-lg text-lg font-semibold inline-block"
                >
                  Start Creating Proposals
                </Link>
                <Link
                  href="/login"
                  className="border border-brand-600 text-brand-600 hover:bg-brand-50 px-8 py-4 rounded-lg text-lg font-semibold inline-block"
                >
                  Sign In to Dashboard
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-brand-600 text-2xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Drafting</h3>
            <p className="text-gray-600">
              AI-powered assistance to help you create compelling tender proposals with industry best practices.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-brand-600 text-2xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Progress Tracking</h3>
            <p className="text-gray-600">
              Monitor your proposal pipeline, deadlines, and submission status all in one place.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-brand-600 text-2xl mb-4">🤝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Team Collaboration</h3>
            <p className="text-gray-600">
              Work seamlessly with your team on proposals with real-time collaboration features.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
