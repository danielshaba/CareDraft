'use client'

// Disable static generation for this page since it has client-side functionality
export const dynamic = 'force-dynamic'




import React, { useState } from 'react'
import { AuthenticatedLayout } from '@/components/shared/Layout'
import { useAuth } from '@/components/providers/AuthProvider'
import { notificationTriggers } from '@/lib/services/notification-triggers'
import { 
  Send, 
  AtSign, 
  Clock, 
  FileText, 
  Eye,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface TestResult {
  success: boolean
  message: string
  data?: any
}

export default function NotificationTriggerTestPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, TestResult>>({})

  const addResult = (key: string, result: TestResult) => {
    setResults(prev => ({ ...prev, [key]: result }))
  }

  // Test mention notification
  const testMentionNotification = async () => {
    if (!user?.id) return
    
    setLoading('mention')
    try {
      const result = await notificationTriggers.createMentionNotification({
        mentionedUserId: user.id,
        senderId: user.id, // Self-mention for testing
        proposalId: 'test-proposal-id',
        sectionId: 'test-section-id',
        content: 'Hey @user, can you review this section about the technical requirements? I think we need to add more detail about the implementation timeline.',
        commentId: 'test-comment-id'
      })

      addResult('mention', {
        success: !!result,
        message: result ? 'Mention notification created successfully' : 'Failed to create mention notification',
        data: result
      })
    } catch (error) {
      addResult('mention', {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setLoading(null)
    }
  }

  // Test deadline notification
  const testDeadlineNotification = async () => {
    if (!user?.id) return
    
    setLoading('deadline')
    try {
      const deadline = new Date()
      deadline.setHours(deadline.getHours() + 1) // 1 hour from now

      const result = await notificationTriggers.createDeadlineNotification({
        proposalId: 'test-proposal-id',
        proposalTitle: 'Healthcare Technology Proposal',
        deadline: deadline.toISOString(),
        ownerId: user.id,
        hoursUntilDeadline: 1
      })

      addResult('deadline', {
        success: !!result,
        message: result ? 'Deadline notification created successfully' : 'Failed to create deadline notification',
        data: result
      })
    } catch (error) {
      addResult('deadline', {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setLoading(null)
    }
  }

  // Test proposal update notification
  const testProposalUpdateNotification = async () => {
    if (!user?.id) return
    
    setLoading('proposal')
    try {
      const result = await notificationTriggers.createProposalUpdateNotification({
        proposalId: 'test-proposal-id',
        proposalTitle: 'Healthcare Technology Proposal',
        updateType: 'status_change',
        updatedBy: user.id,
        affectedUsers: [user.id], // Self for testing
        details: {
          oldStatus: 'draft',
          newStatus: 'review',
          message: 'Proposal moved to review stage'
        }
      })

      addResult('proposal', {
        success: result.length > 0,
        message: result.length > 0 ? `Created ${result.length} proposal update notification(s)` : 'Failed to create proposal update notifications',
        data: result
      })
    } catch (error) {
      addResult('proposal', {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setLoading(null)
    }
  }

  // Test review request notification
  const testReviewRequestNotification = async () => {
    if (!user?.id) return
    
    setLoading('review')
    try {
      const deadline = new Date()
      deadline.setDate(deadline.getDate() + 3) // 3 days from now

      const result = await notificationTriggers.createReviewRequestNotification({
        proposalId: 'test-proposal-id',
        proposalTitle: 'Healthcare Technology Proposal',
        requestedBy: user.id,
        reviewerId: user.id, // Self-review for testing
        sectionId: 'test-section-id',
        deadline: deadline.toISOString()
      })

      addResult('review', {
        success: !!result,
        message: result ? 'Review request notification created successfully' : 'Failed to create review request notification',
        data: result
      })
    } catch (error) {
      addResult('review', {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setLoading(null)
    }
  }

  // Test system announcement
  const testSystemAnnouncement = async () => {
    if (!user?.id) return
    
    setLoading('system')
    try {
      const result = await notificationTriggers.createSystemAnnouncementNotification(
        'System Maintenance Scheduled',
        'CareDraft will undergo scheduled maintenance on Sunday, December 15th from 2:00 AM to 4:00 AM UTC. During this time, the system may be unavailable.',
        [user.id], // Self for testing
        3, // Medium priority
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Expires in 1 week
      )

      addResult('system', {
        success: result.length > 0,
        message: result.length > 0 ? `Created ${result.length} system announcement(s)` : 'Failed to create system announcement',
        data: result
      })
    } catch (error) {
      addResult('system', {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setLoading(null)
    }
  }

  const testButtons = [
    {
      key: 'mention',
      label: 'Test Mention Notification',
      description: 'Create a notification for when someone mentions you in a comment',
      icon: AtSign,
      action: testMentionNotification,
      color: 'bg-brand-500 hover:bg-brand-600'
    },
    {
      key: 'deadline',
      label: 'Test Deadline Notification',
      description: 'Create a deadline reminder notification (1 hour warning)',
      icon: Clock,
      action: testDeadlineNotification,
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      key: 'proposal',
      label: 'Test Proposal Update',
      description: 'Create a notification for proposal status changes',
      icon: FileText,
      action: testProposalUpdateNotification,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      key: 'review',
      label: 'Test Review Request',
      description: 'Create a notification for review requests',
      icon: Eye,
      action: testReviewRequestNotification,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      key: 'system',
      label: 'Test System Announcement',
      description: 'Create a system-wide announcement notification',
      icon: Send,
      action: testSystemAnnouncement,
      color: 'bg-brand-primary-light0 hover:bg-brand-primary'
    }
  ]

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Notification Trigger Testing</h1>
          <p className="text-gray-600 mt-2">
            Test the notification trigger system by creating different types of notifications.
            All notifications will be sent to your account for testing purposes.
          </p>
        </div>

        {/* Test Buttons */}
        <div className="grid gap-6 md:grid-cols-2">
          {testButtons.map(({ key, label, description, icon: Icon, action, color }) => (
            <div key={key} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{label}</h3>
                  <p className="text-sm text-gray-600 mb-4">{description}</p>
                  
                  <button
                    onClick={action}
                    disabled={loading === key}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md ${color} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                  >
                    {loading === key ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Icon className="h-4 w-4 mr-2" />
                        Test {label.split(' ')[1]}
                      </>
                    )}
                  </button>

                  {/* Result */}
                  {results[key] && (
                    <div className={`mt-4 p-3 rounded-md ${results[key].success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center">
                        {results[key].success ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <span className={`text-sm font-medium ${results[key].success ? 'text-green-800' : 'text-red-800'}`}>
                          {results[key].message}
                        </span>
                      </div>
                      {results[key].data && (
                        <pre className="mt-2 text-xs text-gray-600 overflow-x-auto">
                          {JSON.stringify(results[key].data, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-brand-50 border border-brand-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-brand-900 mb-2">How to Test</h3>
          <ol className="list-decimal list-inside space-y-2 text-brand-800">
            <li>Click any of the test buttons above to create different types of notifications</li>
            <li>Check the notification bell in the top navigation to see the new notifications</li>
            <li>Visit your notification preferences at <code>/settings/notifications</code> to customize settings</li>
            <li>Open your browser console to see email notification logs (emails are not actually sent in development)</li>
            <li>Check the notification panel to see real-time updates</li>
          </ol>
        </div>

        {/* Current User Info */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Current User Info</h4>
          <p className="text-sm text-gray-600">
            <strong>User ID:</strong> {user?.id || 'Not logged in'}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Email:</strong> {user?.email || 'No email available'}
          </p>
        </div>
      </div>
    </AuthenticatedLayout>
  )
} 
