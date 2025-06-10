'use client'

import React from 'react'

// TypeScript interfaces for stats data
export interface DashboardStats {
  totalProposals: number
  pendingDeadlines: number
  winRate: number // Percentage (0-100)
}

export interface StatCardData {
  label: string
  value: string | number
  subtext?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
  isLoading?: boolean
}

interface StatsOverviewProps {
  stats?: DashboardStats
  isLoading?: boolean
  className?: string
}

// Individual stat card component
const StatCard: React.FC<StatCardData> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="ml-3 flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 text-brand-500">
            {icon}
          </div>
        </div>
        <div className="ml-3 flex-1">
          <p 
            className="text-sm font-medium text-gray-500 truncate"
            style={{ fontFamily: 'var(--font-open-sans)' }}
          >
            {label}
          </p>
          <p 
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            {value}
          </p>
        </div>
      </div>
      
      {(subtext || trend) && (
        <div className="mt-4">
          {trend && (
            <div className="flex items-center text-sm">
              <span
                className={`flex items-center ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
                style={{ fontFamily: 'var(--font-open-sans)' }}
              >
                <svg
                  className={`h-3 w-3 mr-1 ${
                    trend.isPositive ? 'rotate-0' : 'rotate-180'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                    clipRule="evenodd"
                  />
                </svg>
                {Math.abs(trend.value)}%
              </span>
              <span 
                className="ml-2 text-gray-500"
                style={{ fontFamily: 'var(--font-open-sans)' }}
              >
                {trend.label}
              </span>
            </div>
          )}
          {subtext && !trend && (
            <p 
              className="text-sm text-gray-500"
              style={{ fontFamily: 'var(--font-open-sans)' }}
            >
              {subtext}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Main stats overview component
export const StatsOverview: React.FC<StatsOverviewProps> = ({ 
  stats, 
  isLoading = false,
  className = ''
}) => {
  // Generate stat cards data
  const getStatCards = (): StatCardData[] => {
    if (!stats && !isLoading) {
      // Default/empty state
      return [
        {
          label: 'Total Proposals',
          value: 0,
          subtext: 'No proposals yet',
          icon: (
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          isLoading
        },
        {
          label: 'Pending Deadlines',
          value: 0,
          subtext: 'All caught up',
          icon: (
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          isLoading
        },
        {
          label: 'Win Rate',
          value: '0%',
          subtext: 'No submissions yet',
          icon: (
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
          isLoading
        }
      ]
    }

    if (!stats) return []

    return [
      {
        label: 'Total Proposals',
        value: stats.totalProposals,
        subtext: stats.totalProposals === 1 ? 'Active proposal' : 'Active proposals',
        icon: (
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        trend: stats.totalProposals > 0 ? {
          value: 12,
          isPositive: true,
          label: 'from last month'
        } : undefined,
        isLoading
      },
      {
        label: 'Pending Deadlines',
        value: stats.pendingDeadlines,
        subtext: stats.pendingDeadlines === 0 
          ? 'All caught up' 
          : stats.pendingDeadlines === 1 
            ? 'Deadline approaching' 
            : 'Deadlines approaching',
        icon: (
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        trend: stats.pendingDeadlines > 0 ? {
          value: 8,
          isPositive: false,
          label: 'this week'
        } : undefined,
        isLoading
      },
      {
        label: 'Win Rate',
        value: `${Math.round(stats.winRate)}%`,
        subtext: stats.winRate > 0 ? 'Success rate' : 'No submissions yet',
        icon: (
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
        trend: stats.winRate > 0 ? {
          value: 5,
          isPositive: true,
          label: 'vs industry avg'
        } : undefined,
        isLoading
      }
    ]
  }

  const statCards = getStatCards()

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 ${className}`}>
      {statCards.map((card, index) => (
        <StatCard key={index} {...card} />
      ))}
    </div>
  )
}

export default StatsOverview 