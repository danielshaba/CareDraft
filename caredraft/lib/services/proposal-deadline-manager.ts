/**
 * Proposal Deadline Manager Service (Stub Implementation)
 */

import { ProposalStatus } from '@/lib/database.types'

export interface DeadlineRule {
  id: string
  fromStatus: ProposalStatus
  toStatus: ProposalStatus
  deadlineHours: number
  notificationHours: number[]
  autoTransition: boolean
  requiresApproval: boolean
  description: string
}

export interface DeadlineCheckResult {
  proposalId: string
  currentStatus: ProposalStatus
  statusChangedAt: string
  deadlineAt: string
  hoursRemaining: number
  shouldNotify: boolean
  shouldTransition: boolean
  applicableRule: DeadlineRule | null
  nextNotificationHours: number | null
}

export interface DeadlineProcessingResult {
  processedAt: string
  proposalsChecked: number
  notificationsSent: number
  transitionsPerformed: number
  errors: Array<{
    proposalId: string
    error: string
    type: 'notification' | 'transition'
  }>
}

export class ProposalDeadlineManager {
  constructor() {
    console.log('Stub: ProposalDeadlineManager initialized')
  }

  async getDeadlineRules(): Promise<DeadlineRule[]> {
    return []
  }

  async updateDeadlineRules(_rules: DeadlineRule[]): Promise<boolean> {
    return false
  }

  async checkProposalDeadline(_proposalId: string): Promise<DeadlineCheckResult | null> {
    return null
  }

  async sendDeadlineNotification(
    _proposalId: string, 
    _recipientUserId: string, 
    _checkResult: DeadlineCheckResult
  ): Promise<boolean> {
    return false
  }

  async performAutomaticTransition(
    _proposalId: string, 
    _checkResult: DeadlineCheckResult
  ): Promise<boolean> {
    return false
  }

  async processAllProposalDeadlines(): Promise<DeadlineProcessingResult> {
    return {
      processedAt: new Date().toISOString(),
      proposalsChecked: 0,
      notificationsSent: 0,
      transitionsPerformed: 0,
      errors: []
    }
  }

  async getUpcomingDeadlines(_hoursAhead: number = 168): Promise<DeadlineCheckResult[]> {
    return []
  }
}

export const proposalDeadlineManager = new ProposalDeadlineManager()
