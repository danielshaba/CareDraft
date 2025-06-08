import { Metadata } from 'next'
import { AuthenticatedLayout } from '@/components/shared/Layout'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Create Proposal | CareDraft',
  description: 'Create a new tender proposal',
}

export default function CreateProposalPage() {
  return (
    <AuthenticatedLayout className="bg-gray-50">
      <div className="min-h-full">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center">
                <Link
                  href="/"
                  className="mr-4 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  style={{ fontFamily: 'var(--font-open-sans)' }}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Dashboard
                </Link>
              </div>
              <div className="mt-2">
                <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Create New Proposal
                </h1>
                <p className="mt-1 text-sm text-gray-500" style={{ fontFamily: 'var(--font-open-sans)' }}>
                  Start a new tender proposal to track progress and manage deadlines
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Placeholder */}
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center py-12">
              <FileText className="mx-auto h-16 w-16 text-gray-400 mb-6" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                Create Proposal Form
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto" style={{ fontFamily: 'var(--font-open-sans)' }}>
                This page will contain the proposal creation form. The form will be implemented in a future task to allow users to create new tender proposals with all necessary details.
              </p>
              <div className="space-y-3 text-sm text-gray-500" style={{ fontFamily: 'var(--font-open-sans)' }}>
                <p>✅ Navigation from dashboard working</p>
                <p>✅ Responsive create button implemented</p>
                <p>⏳ Form implementation coming soon</p>
              </div>
              <div className="mt-8">
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
                  style={{ fontFamily: 'var(--font-open-sans)' }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
} 