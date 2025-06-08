import { ProposalCardData } from '@/components/dashboard/ProposalCard'
import { DashboardStats } from '@/components/dashboard/StatsOverview'

// Sample proposal data for testing
export const sampleProposals: ProposalCardData[] = [
  {
    id: '1',
    title: 'Municipal Waste Management System Implementation',
    description: 'Comprehensive waste collection and recycling program for the City of Springfield, including route optimization and citizen engagement platform.',
    status: 'draft',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    progress: 35,
    organizationName: 'Springfield Municipal Authority',
    estimatedValue: 750000,
    lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    isUrgent: false
  },
  {
    id: '2',
    title: 'Smart City Infrastructure Upgrade',
    description: 'IoT sensors, traffic management, and digital services integration across downtown core.',
    status: 'review',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    progress: 78,
    organizationName: 'Department of Transportation',
    estimatedValue: 1200000,
    lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    isUrgent: true
  },
  {
    id: '3',
    title: 'Healthcare IT System Modernization',
    description: 'Electronic health records integration and patient portal development for regional medical center.',
    status: 'submitted',
    deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (overdue)
    progress: 100,
    organizationName: 'Regional Health Network',
    estimatedValue: 2500000,
    lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    isUrgent: false
  },
  {
    id: '4',
    title: 'Educational Technology Platform',
    description: 'Learning management system with virtual classroom capabilities for K-12 schools.',
    status: 'draft',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    progress: 12,
    organizationName: 'Board of Education',
    estimatedValue: 450000,
    lastUpdated: new Date(),
    isUrgent: false
  },
  {
    id: '5',
    title: 'Public Transit Mobile App',
    description: 'Real-time tracking, trip planning, and digital ticketing system for bus and rail services.',
    status: 'review',
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    progress: 67,
    organizationName: 'Metro Transit Authority',
    estimatedValue: 320000,
    lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    isUrgent: false
  },
  {
    id: '6',
    title: 'Emergency Response Communication System',
    description: 'Unified dispatch and coordination platform for police, fire, and medical emergency services.',
    status: 'archived',
    deadline: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    progress: 90,
    organizationName: 'Emergency Services Department',
    estimatedValue: 850000,
    lastUpdated: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
    isUrgent: false
  }
]

// Sample dashboard stats
export const sampleStats: DashboardStats = {
  totalProposals: 6,
  pendingDeadlines: 3,
  winRate: 72
}

// Utility functions for sample data
export const getAllProposals = () => sampleProposals

export const getActiveProposals = () => 
  sampleProposals.filter(p => p.status !== 'archived')

export const getRecentProposals = (limit: number = 5) => 
  sampleProposals
    .sort((a, b) => new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime())
    .slice(0, limit)

export const getProposalsByStatus = (status: ProposalCardData['status']) => 
  sampleProposals.filter(p => p.status === status)

export const getUrgentProposals = () => 
  sampleProposals.filter(p => p.isUrgent || (
    p.deadline && 
    new Date(p.deadline).getTime() - Date.now() <= 3 * 24 * 60 * 60 * 1000 && // 3 days or less
    new Date(p.deadline).getTime() > Date.now() // not overdue
  ))

export const getOverdueProposals = () => 
  sampleProposals.filter(p => 
    p.deadline && 
    new Date(p.deadline).getTime() < Date.now() &&
    p.status !== 'submitted' &&
    p.status !== 'archived'
  ) 