'use client'

import { AuthenticatedLayout } from '@/components/shared/Layout'
import { StatsOverview } from '@/components/dashboard/StatsOverview'
import { ProposalsGrid } from '@/components/dashboard/ProposalsGrid'
import { CreateProposalButton } from '@/components/dashboard/CreateProposalButton'
import { sampleStats } from '@/lib/sample-data'
import { useDashboardProposals } from '@/hooks/useProposals'

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
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
} 