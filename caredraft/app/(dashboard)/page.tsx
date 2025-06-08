'use client'

import { Metadata } from 'next'
import { AuthenticatedLayout } from '@/components/shared/Layout'
import { StatsOverview } from '@/components/dashboard/StatsOverview'
import { ProposalsGrid } from '@/components/dashboard/ProposalsGrid'
import { CreateProposalButton } from '@/components/dashboard/CreateProposalButton'
import { sampleStats } from '@/lib/sample-data'
import { useDashboardProposals } from '@/hooks/useProposals'

export const metadata: Metadata = {
  title: 'Dashboard | CareDraft',
  description: 'Manage your tender proposals and track progress',
}

export default function DashboardPage() {
  // Use custom hook for proposals data with loading states
  const { proposals: recentProposals, isLoading: proposalsLoading, error: proposalsError } = useDashboardProposals()
  
  return (
    <AuthenticatedLayout className="bg-gray-50">
      {/* Main Dashboard Container */}
      <div className="min-h-full">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500" style={{ fontFamily: 'var(--font-open-sans)' }}>
                Overview of your proposal projects and deadlines
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {/* Quick Stats Section */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
                Quick Overview
              </h2>
              {/* Stats Overview Component */}
              <StatsOverview stats={sampleStats} isLoading={false} />
            </section>

            {/* Proposals Section */}
            <section className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Recent Proposals
                  </h2>
                  <p className="mt-1 text-sm text-gray-500" style={{ fontFamily: 'var(--font-open-sans)' }}>
                    Track progress on your active tender submissions
                  </p>
                </div>
                {/* Create New Proposal Button */}
                <div className="mt-4 sm:mt-0">
                  <CreateProposalButton 
                    variant="responsive"
                    size="md"
                    href="/proposals/create"
                  />
                </div>
              </div>

              {/* Proposals Grid */}
              <ProposalsGrid
                proposals={recentProposals}
                isLoading={proposalsLoading}
                error={proposalsError}
                onProposalClick={(proposal) => {
                  console.log('Clicked proposal:', proposal.title)
                  // This will be handled by Next.js routing via the Link component
                }}
                showFilters={true}
                showSorting={true}
              />
            </section>

            {/* Empty State (shown when no proposals) */}
            <section className="hidden">
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg
                    className="h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  No proposals yet
                </h3>
                <p className="mt-1 text-sm text-gray-500" style={{ fontFamily: 'var(--font-open-sans)' }}>
                  Get started by creating your first tender proposal.
                </p>
                <div className="mt-6">
                  <CreateProposalButton 
                    variant="inline"
                    size="md"
                    href="/proposals/create"
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
} 