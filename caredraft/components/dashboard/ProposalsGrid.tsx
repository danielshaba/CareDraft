'use client'

import React, { useState, useMemo } from 'react'
import { ProposalCard, ProposalCardData } from './ProposalCard'

// Types for grid configuration
export interface ProposalsGridProps {
  proposals: ProposalCardData[]
  isLoading?: boolean
  error?: string | null
  onProposalClick?: (proposal: ProposalCardData) => void
  showFilters?: boolean
  showSorting?: boolean
  pageSize?: number
  className?: string
}

// Filter and sort types
type SortField = 'title' | 'deadline' | 'progress' | 'lastUpdated' | 'estimatedValue'
type SortDirection = 'asc' | 'desc'
type StatusFilter = ProposalCardData['status'] | 'all'

interface SortConfig {
  field: SortField
  direction: SortDirection
}

// Empty state component
const EmptyState: React.FC<{ 
  hasFilters: boolean 
  onClearFilters?: () => void 
}> = ({ hasFilters, onClearFilters }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-12 px-4">
    <div className="text-center">
      <svg
        className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
      <h3 
        className="text-lg font-medium text-gray-900 mb-2"
        style={{ fontFamily: 'var(--font-poppins)' }}
      >
        {hasFilters ? 'No proposals match your filters' : 'No proposals yet'}
      </h3>
      <p 
        className="text-sm text-gray-500 mb-4 max-w-sm"
        style={{ fontFamily: 'var(--font-open-sans)' }}
      >
        {hasFilters 
          ? 'Try adjusting your filters to see more results, or create a new proposal.'
          : 'Get started by creating your first tender proposal to track progress and manage deadlines.'
        }
      </p>
      {hasFilters && onClearFilters && (
        <button
          onClick={onClearFilters}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
          style={{ fontFamily: 'var(--font-open-sans)' }}
        >
          Clear filters
        </button>
      )}
    </div>
  </div>
)

// Error state component
const ErrorState: React.FC<{ error: string, onRetry?: () => void }> = ({ error, onRetry }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-12 px-4">
    <div className="text-center">
      <svg
        className="mx-auto h-12 w-12 text-red-400 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
      <h3 
        className="text-lg font-medium text-gray-900 mb-2"
        style={{ fontFamily: 'var(--font-poppins)' }}
      >
        Unable to load proposals
      </h3>
      <p 
        className="text-sm text-gray-500 mb-4 max-w-sm"
        style={{ fontFamily: 'var(--font-open-sans)' }}
      >
        {error}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
          style={{ fontFamily: 'var(--font-open-sans)' }}
        >
          Try again
        </button>
      )}
    </div>
  </div>
)

// Loading skeleton grid
const LoadingGrid: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <ProposalCard key={`skeleton-${index}`} proposal={{} as ProposalCardData} isLoading={true} />
    ))}
  </>
)

// Filter and sort controls
const GridControls: React.FC<{
  statusFilter: StatusFilter
  onStatusFilter: (status: StatusFilter) => void
  sortConfig: SortConfig
  onSort: (config: SortConfig) => void
  totalCount: number
  filteredCount: number
}> = ({ statusFilter, onStatusFilter, sortConfig, onSort, totalCount, filteredCount }) => {
  const statusOptions = [
    { value: 'all' as const, label: 'All Status', count: totalCount },
    { value: 'draft' as const, label: 'Draft', count: 0 },
    { value: 'review' as const, label: 'In Review', count: 0 },
    { value: 'submitted' as const, label: 'Submitted', count: 0 },
    { value: 'archived' as const, label: 'Archived', count: 0 },
  ]

  const sortOptions = [
    { value: 'lastUpdated' as const, label: 'Last Updated' },
    { value: 'deadline' as const, label: 'Deadline' },
    { value: 'title' as const, label: 'Title' },
    { value: 'progress' as const, label: 'Progress' },
    { value: 'estimatedValue' as const, label: 'Value' },
  ]

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label 
            htmlFor="status-filter" 
            className="text-sm font-medium text-gray-700"
            style={{ fontFamily: 'var(--font-open-sans)' }}
          >
            Status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => onStatusFilter(e.target.value as StatusFilter)}
            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-brand-500 focus:ring-brand-500"
            style={{ fontFamily: 'var(--font-open-sans)' }}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <label 
            htmlFor="sort-field" 
            className="text-sm font-medium text-gray-700"
            style={{ fontFamily: 'var(--font-open-sans)' }}
          >
            Sort by:
          </label>
          <select
            id="sort-field"
            value={sortConfig.field}
            onChange={(e) => onSort({ ...sortConfig, field: e.target.value as SortField })}
            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-brand-500 focus:ring-brand-500"
            style={{ fontFamily: 'var(--font-open-sans)' }}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => onSort({ 
              ...sortConfig, 
              direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' 
            })}
            className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 rounded"
            title={`Sort ${sortConfig.direction === 'asc' ? 'descending' : 'ascending'}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {sortConfig.direction === 'asc' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-open-sans)' }}>
        {filteredCount === totalCount 
          ? `${totalCount} proposal${totalCount === 1 ? '' : 's'}`
          : `${filteredCount} of ${totalCount} proposal${totalCount === 1 ? '' : 's'}`
        }
      </div>
    </div>
  )
}

// Main ProposalsGrid component
export const ProposalsGrid: React.FC<ProposalsGridProps> = ({
  proposals,
  isLoading = false,
  error = null,
  onProposalClick,
  showFilters = true,
  showSorting = true,
  pageSize = 12,
  className = ''
}) => {
  // State for filtering and sorting
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'lastUpdated',
    direction: 'desc'
  })

  // Filter and sort proposals
  const filteredAndSortedProposals = useMemo(() => {
    let filtered = proposals

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(proposal => proposal.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const { field, direction } = sortConfig
      let aValue: unknown = a[field]
      let bValue: unknown = b[field]

      // Handle special cases for different field types
      if (field === 'deadline' || field === 'lastUpdated') {
        aValue = aValue ? new Date(aValue).getTime() : 0
        bValue = bValue ? new Date(bValue).getTime() : 0
      } else if (field === 'title') {
        aValue = (aValue || '').toLowerCase()
        bValue = (bValue || '').toLowerCase()
      } else if (field === 'progress' || field === 'estimatedValue') {
        aValue = aValue || 0
        bValue = bValue || 0
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1
      if (aValue > bValue) return direction === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [proposals, statusFilter, sortConfig])

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter('all')
    setSortConfig({ field: 'lastUpdated', direction: 'desc' })
  }

  // Handle error state
  if (error) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 ${className}`}>
        <ErrorState error={error} />
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Controls */}
      {(showFilters || showSorting) && !isLoading && proposals.length > 0 && (
        <GridControls
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          sortConfig={sortConfig}
          onSort={setSortConfig}
          totalCount={proposals.length}
          filteredCount={filteredAndSortedProposals.length}
        />
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {isLoading ? (
          <LoadingGrid count={pageSize} />
        ) : filteredAndSortedProposals.length === 0 ? (
          <EmptyState 
            hasFilters={statusFilter !== 'all'} 
            onClearFilters={statusFilter !== 'all' ? clearFilters : undefined}
          />
        ) : (
          filteredAndSortedProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onClick={onProposalClick}
              showActions={true}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default ProposalsGrid 