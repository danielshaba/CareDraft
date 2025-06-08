import { Metadata } from 'next'
import { TenderDetailsForm } from '@/components/tender/TenderDetailsForm'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Tender Details | CareDraft',
  description: 'Configure tender information and evaluation criteria',
}

export default function TenderDetailsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Container */}
      <div className="min-h-full">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-4xl mx-auto">
              {/* Breadcrumb Navigation */}
              <nav className="flex items-center mb-4" aria-label="Breadcrumb">
                <Link
                  href="/"
                  className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Dashboard
                </Link>
              </nav>

              {/* Page Title */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Tender Details Configuration
                </h1>
                <p className="mt-1 text-sm text-gray-500" style={{ fontFamily: 'var(--font-open-sans)' }}>
                  Set up tender information, evaluation criteria, and word limits for your proposal
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-4xl mx-auto">
            {/* Form Container */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <TenderDetailsForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 