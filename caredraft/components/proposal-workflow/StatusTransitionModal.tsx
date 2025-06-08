'use client'

import React from 'react'
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { ProposalStatus } from '@/lib/database.types'
import ProposalStatusBadge from './ProposalStatusBadge'

interface StatusTransitionModalProps {
  isOpen: boolean
  onClose: () => void
  fromStatus: ProposalStatus
  toStatus: ProposalStatus
  onConfirm: (comment?: string, reason?: string) => void
  loading?: boolean
  requiresComment?: boolean
  proposalTitle?: string
}

export default function StatusTransitionModal({
  isOpen,
  onClose,
  fromStatus,
  toStatus,
  onConfirm,
  loading = false,
  requiresComment = false,
  proposalTitle
}: StatusTransitionModalProps) {
  const [comment, setComment] = React.useState('')
  const [reason, setReason] = React.useState('')

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setComment('')
      setReason('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const getTransitionInfo = (from: ProposalStatus, to: ProposalStatus) => {
    const transitions: Record<string, { 
      title: string
      description: string
      icon: React.ReactNode
      iconColor: string
      isRejection?: boolean
      isSubmission?: boolean
    }> = {
      'draft->review': {
        title: 'Submit for Review',
        description: 'This proposal will be sent to reviewers for evaluation.',
        icon: <Info className="h-5 w-5" />,
        iconColor: 'text-blue-500'
      },
      'review->draft': {
        title: 'Return to Draft',
        description: 'This proposal will be returned to draft status for revisions.',
        icon: <AlertTriangle className="h-5 w-5" />,
        iconColor: 'text-yellow-500',
        isRejection: true
      },
      'review->submitted': {
        title: 'Submit Proposal',
        description: 'This proposal will be marked as submitted and finalized.',
        icon: <CheckCircle className="h-5 w-5" />,
        iconColor: 'text-green-500',
        isSubmission: true
      },
      'submitted->archived': {
        title: 'Archive Proposal',
        description: 'This proposal will be moved to archived status.',
        icon: <Info className="h-5 w-5" />,
        iconColor: 'text-slate-500'
      },
      'draft->archived': {
        title: 'Archive Proposal',
        description: 'This proposal will be moved to archived status.',
        icon: <Info className="h-5 w-5" />,
        iconColor: 'text-slate-500'
      }
    }

    return transitions[`${from}->${to}`] || {
      title: 'Change Status',
      description: `Change proposal status from ${from} to ${to}.`,
      icon: <Info className="h-5 w-5" />,
      iconColor: 'text-gray-500'
    }
  }

  const transitionInfo = getTransitionInfo(fromStatus, toStatus)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (requiresComment && !comment.trim()) {
      return
    }
    onConfirm(comment.trim() || undefined, reason.trim() || undefined)
  }

  const isFormValid = !requiresComment || comment.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          {/* Header */}
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={onClose}
              disabled={loading}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 sm:mx-0 sm:h-10 sm:w-10`}>
              <span className={transitionInfo.iconColor}>
                {transitionInfo.icon}
              </span>
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                {transitionInfo.title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {transitionInfo.description}
                </p>
              </div>
            </div>
          </div>

          {/* Proposal Title */}
          {proposalTitle && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-900 truncate">
                {proposalTitle}
              </p>
            </div>
          )}

          {/* Status Change Visual */}
          <div className="mt-4 flex items-center justify-center space-x-4">
            <ProposalStatusBadge status={fromStatus} size="sm" />
            <span className="text-gray-400">→</span>
            <ProposalStatusBadge status={toStatus} size="sm" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6">
            {/* Reason Selector for specific transitions */}
            {(transitionInfo.isRejection || transitionInfo.isSubmission) && (
              <div className="mb-4">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason {transitionInfo.isRejection ? '(for return to draft)' : '(for submission)'}
                </label>
                <select
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select a reason...</option>
                  {transitionInfo.isRejection ? (
                    <>
                      <option value="missing_information">Missing Information</option>
                      <option value="requires_revision">Requires Revision</option>
                      <option value="budget_concerns">Budget Concerns</option>
                      <option value="compliance_issues">Compliance Issues</option>
                      <option value="strategic_misalignment">Strategic Misalignment</option>
                      <option value="other">Other</option>
                    </>
                  ) : (
                    <>
                      <option value="meets_requirements">Meets All Requirements</option>
                      <option value="approved_with_conditions">Approved with Conditions</option>
                      <option value="expedited_approval">Expedited Approval</option>
                      <option value="standard_approval">Standard Approval</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {/* Comment Field */}
            <div className="mb-4">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Comments {requiresComment && <span className="text-red-500">*</span>}
              </label>
              <textarea
                id="comment"
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder={
                  transitionInfo.isRejection 
                    ? "Explain what needs to be revised..."
                    : transitionInfo.isSubmission
                    ? "Add any final notes or conditions..."
                    : "Add any relevant comments..."
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required={requiresComment}
              />
              {requiresComment && (
                <p className="mt-1 text-sm text-gray-500">
                  Comments are required for this status change.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:w-auto ${
                  transitionInfo.isRejection
                    ? 'bg-yellow-600 hover:bg-yellow-500 focus-visible:outline-yellow-600'
                    : transitionInfo.isSubmission
                    ? 'bg-green-600 hover:bg-green-500 focus-visible:outline-green-600'
                    : 'bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600'
                } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Processing...
                  </>
                ) : (
                  transitionInfo.title
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 