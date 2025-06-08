import { useState, useEffect, useCallback } from 'react'
import { ProposalCardData } from '@/components/dashboard/ProposalCard'
import { getAllProposals } from '@/lib/sample-data'

interface UseProposalsReturn {
  proposals: ProposalCardData[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

interface UseProposalsOptions {
  limit?: number
  status?: string
  initialData?: ProposalCardData[]
}

/**
 * Custom hook for managing proposals data
 * Simulates API calls with loading states and error handling
 * In production, this would make actual API calls to Supabase
 */
export function useProposals(options: UseProposalsOptions = {}): UseProposalsReturn {
  const { limit, status, initialData = [] } = options
  
  const [proposals, setProposals] = useState<ProposalCardData[]>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProposals = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800))

      // In production, this would be an actual API call:
      // const { data, error } = await supabase
      //   .from('proposals')
      //   .select('*')
      //   .eq(status ? 'status' : '', status || '')
      //   .limit(limit || 100)
      //   .order('updated_at', { ascending: false })

      // For now, use sample data
      let data = getAllProposals()

      // Apply filters if specified
      if (status && status !== 'all') {
        data = data.filter(proposal => proposal.status === status)
      }

      // Apply limit if specified
      if (limit) {
        data = data.slice(0, limit)
      }

      setProposals(data)
    } catch {
      console.error('Error fetching proposals:', err)
      setError(err instanceof Error ? err.message : 'Failed to load proposals')
    } finally {
      setIsLoading(false)
    }
  }, [limit, status])

  const refetch = useCallback(() => {
    fetchProposals()
  }, [fetchProposals])

  useEffect(() => {
    // Only fetch if we don't have initial data
    if (initialData.length === 0) {
      fetchProposals()
    }
  }, [fetchProposals, initialData.length])

  return {
    proposals,
    isLoading,
    error,
    refetch
  }
}

/**
 * Hook specifically for dashboard recent proposals
 * Returns the most recent 6 proposals for the dashboard overview
 */
export function useDashboardProposals() {
  return useProposals({ 
    limit: 6,
    initialData: getAllProposals().slice(0, 6) // Use initial data to avoid loading state on dashboard
  })
}

/**
 * Hook for the full proposals page with filtering
 * Returns all proposals with full filtering capabilities
 */
export function useAllProposals() {
  return useProposals({
    // No limit - get all proposals
  })
}

export default useProposals 