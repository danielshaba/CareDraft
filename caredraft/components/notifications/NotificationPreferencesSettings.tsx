'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { UserNotificationPreferences, UserNotificationPreferencesUpdate } from '@/lib/database.types'
import { useAuth } from '@/components/providers/MinimalAuthProvider'
import { 
  Bell, 
  Mail, 
  Clock, 
  Globe, 
  Save, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react'

interface NotificationPreferencesSettingsProps {
  className?: string
}

interface PreferencesState extends Partial<UserNotificationPreferences> {
  loading: boolean
  saving: boolean
  error: string | null
  success: boolean
}

export function NotificationPreferencesSettings({ className }: NotificationPreferencesSettingsProps) {
  const { user } = useAuth()
  const supabase = createClient()
  
  const [preferences, setPreferences] = useState<PreferencesState>({
    loading: true,
    saving: false,
    error: null,
    success: false
  })

  // Load user's current preferences
  useEffect(() => {
    if (!user?.id) return

    const loadPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from('user_notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') { // Not found error
          throw error
        }

        // If no preferences exist, create defaults
        if (!data) {
          const defaultPrefs = {
            user_id: user.id,
            email_mentions: true,
            email_deadlines: true,
            email_proposal_updates: true,
            email_review_requests: true,
            email_system_announcements: true,
            email_team_invitations: true,
            email_document_shared: true,
            app_mentions: true,
            app_deadlines: true,
            app_proposal_updates: true,
            app_review_requests: true,
            app_system_announcements: true,
            app_team_invitations: true,
            app_document_shared: true,
            email_digest_frequency: 'immediate' as const,
            quiet_hours_start: null,
            quiet_hours_end: null,
            timezone: 'UTC'
          }

          const { data: created, error: createError } = await supabase
            .from('user_notification_preferences')
            .insert(defaultPrefs)
            .select()
            .single()

          if (createError) throw createError

          setPreferences({
            ...created,
            loading: false,
            saving: false,
            error: null,
            success: false
          })
        } else {
          setPreferences({
            ...data,
            loading: false,
            saving: false,
            error: null,
            success: false
          })
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error)
        setPreferences(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load notification preferences'
        }))
      }
    }

    loadPreferences()
  }, [user?.id, supabase])

  // Update a preference field
  const updatePreference = (field: keyof UserNotificationPreferences, value: unknown) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value,
      success: false
    }))
  }

  // Save preferences to database
  const savePreferences = async () => {
    if (!user?.id) return

    setPreferences(prev => ({ ...prev, saving: true, error: null }))

    try {
      const updateData: UserNotificationPreferencesUpdate = {
        email_mentions: preferences.email_mentions,
        email_deadlines: preferences.email_deadlines,
        email_proposal_updates: preferences.email_proposal_updates,
        email_review_requests: preferences.email_review_requests,
        email_system_announcements: preferences.email_system_announcements,
        email_team_invitations: preferences.email_team_invitations,
        email_document_shared: preferences.email_document_shared,
        app_mentions: preferences.app_mentions,
        app_deadlines: preferences.app_deadlines,
        app_proposal_updates: preferences.app_proposal_updates,
        app_review_requests: preferences.app_review_requests,
        app_system_announcements: preferences.app_system_announcements,
        app_team_invitations: preferences.app_team_invitations,
        app_document_shared: preferences.app_document_shared,
        email_digest_frequency: preferences.email_digest_frequency,
        quiet_hours_start: preferences.quiet_hours_start,
        quiet_hours_end: preferences.quiet_hours_end,
        timezone: preferences.timezone
      }

      const { error } = await supabase
        .from('user_notification_preferences')
        .update(updateData)
        .eq('user_id', user.id)

      if (error) throw error

      setPreferences(prev => ({
        ...prev,
        saving: false,
        success: true
      }))

      // Clear success message after 3 seconds
      setTimeout(() => {
        setPreferences(prev => ({ ...prev, success: false }))
      }, 3000)
    } catch (error) {
      console.error('Error saving notification preferences:', error)
      setPreferences(prev => ({
        ...prev,
        saving: false,
        error: 'Failed to save preferences. Please try again.'
      }))
    }
  }

  if (preferences.loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 text-gray-400 animate-spin mr-2" />
          <span className="text-gray-600">Loading notification preferences...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <Settings className="h-5 w-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-medium text-gray-900">Notification Preferences</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Customize how and when you receive notifications from CareDraft
        </p>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* Error Alert */}
        {preferences.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700 font-medium">Error</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{preferences.error}</p>
          </div>
        )}

        {/* Success Alert */}
        {preferences.success && (
          <div className="bg-emerald-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-emerald-500 mr-2" />
              <span className="text-green-700 font-medium">Settings saved successfully!</span>
            </div>
          </div>
        )}

        {/* In-App Notifications */}
        <div>
          <div className="flex items-center mb-4">
            <Bell className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-md font-medium text-gray-900">In-App Notifications</h3>
          </div>
          <div className="space-y-4 ml-7">
            <PreferenceToggle
              label="Mentions"
              description="When someone mentions you in a comment or discussion"
              checked={preferences.app_mentions || false}
              onChange={(checked) => updatePreference('app_mentions', checked)}
            />
            <PreferenceToggle
              label="Deadlines"
              description="Reminders about upcoming proposal deadlines"
              checked={preferences.app_deadlines || false}
              onChange={(checked) => updatePreference('app_deadlines', checked)}
            />
            <PreferenceToggle
              label="Proposal Updates"
              description="When proposals you're involved with are updated"
              checked={preferences.app_proposal_updates || false}
              onChange={(checked) => updatePreference('app_proposal_updates', checked)}
            />
            <PreferenceToggle
              label="Review Requests"
              description="When someone requests your review on a proposal"
              checked={preferences.app_review_requests || false}
              onChange={(checked) => updatePreference('app_review_requests', checked)}
            />
            <PreferenceToggle
              label="System Announcements"
              description="Important updates and announcements from CareDraft"
              checked={preferences.app_system_announcements || false}
              onChange={(checked) => updatePreference('app_system_announcements', checked)}
            />
            <PreferenceToggle
              label="Team Invitations"
              description="When you're invited to join a team or proposal"
              checked={preferences.app_team_invitations || false}
              onChange={(checked) => updatePreference('app_team_invitations', checked)}
            />
            <PreferenceToggle
              label="Document Shared"
              description="When documents or resources are shared with you"
              checked={preferences.app_document_shared || false}
              onChange={(checked) => updatePreference('app_document_shared', checked)}
            />
            <PreferenceToggle
              label="Research Session Shared"
              description="When research sessions are shared with you"
              checked={preferences.app_research_session_shared || false}
              onChange={(checked) => updatePreference('app_research_session_shared', checked)}
            />
          </div>
        </div>

        {/* Email Notifications */}
        <div>
          <div className="flex items-center mb-4">
            <Mail className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-md font-medium text-gray-900">Email Notifications</h3>
          </div>
          <div className="space-y-4 ml-7">
            <PreferenceToggle
              label="Mentions"
              description="Email me when someone mentions me"
              checked={preferences.email_mentions || false}
              onChange={(checked) => updatePreference('email_mentions', checked)}
            />
            <PreferenceToggle
              label="Deadlines"
              description="Email me deadline reminders"
              checked={preferences.email_deadlines || false}
              onChange={(checked) => updatePreference('email_deadlines', checked)}
            />
            <PreferenceToggle
              label="Proposal Updates"
              description="Email me about proposal changes"
              checked={preferences.email_proposal_updates || false}
              onChange={(checked) => updatePreference('email_proposal_updates', checked)}
            />
            <PreferenceToggle
              label="Review Requests"
              description="Email me when my review is requested"
              checked={preferences.email_review_requests || false}
              onChange={(checked) => updatePreference('email_review_requests', checked)}
            />
            <PreferenceToggle
              label="System Announcements"
              description="Email me important system updates"
              checked={preferences.email_system_announcements || false}
              onChange={(checked) => updatePreference('email_system_announcements', checked)}
            />
            <PreferenceToggle
              label="Team Invitations"
              description="Email me team invitations"
              checked={preferences.email_team_invitations || false}
              onChange={(checked) => updatePreference('email_team_invitations', checked)}
            />
            <PreferenceToggle
              label="Document Shared"
              description="Email me when documents are shared"
              checked={preferences.email_document_shared || false}
              onChange={(checked) => updatePreference('email_document_shared', checked)}
            />
            <PreferenceToggle
              label="Research Session Shared"
              description="Email me when research sessions are shared"
              checked={preferences.email_research_session_shared || false}
              onChange={(checked) => updatePreference('email_research_session_shared', checked)}
            />
          </div>
        </div>

        {/* Email Timing Preferences */}
        <div>
          <div className="flex items-center mb-4">
            <Clock className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-md font-medium text-gray-900">Email Timing</h3>
          </div>
          <div className="ml-7 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Frequency
              </label>
              <select
                value={preferences.email_digest_frequency || 'immediate'}
                onChange={(e) => updatePreference('email_digest_frequency', e.target.value)}
                className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="immediate">Immediate</option>
                <option value="hourly">Hourly Digest</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Digest</option>
                <option value="never">Never</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                How often you want to receive email notifications
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiet Hours Start
                </label>
                <input
                  type="time"
                  value={preferences.quiet_hours_start || ''}
                  onChange={(e) => updatePreference('quiet_hours_start', e.target.value || null)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiet Hours End
                </label>
                <input
                  type="time"
                  value={preferences.quiet_hours_end || ''}
                  onChange={(e) => updatePreference('quiet_hours_end', e.target.value || null)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              No email notifications will be sent during quiet hours
            </p>
          </div>
        </div>

        {/* Timezone */}
        <div>
          <div className="flex items-center mb-4">
            <Globe className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-md font-medium text-gray-900">Timezone</h3>
          </div>
          <div className="ml-7">
            <select
              value={preferences.timezone || 'UTC'}
              onChange={(e) => updatePreference('timezone', e.target.value)}
              className="block w-full max-w-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Europe/Berlin">Berlin</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Asia/Shanghai">Shanghai</option>
              <option value="Australia/Sydney">Sydney</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Used for quiet hours and email timing
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <button
          onClick={savePreferences}
          disabled={preferences.saving}
          className="inline-flex items-center px-4 py-2 bg-brand-50 text-white text-sm font-medium rounded-md hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {preferences.saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  )
}

interface PreferenceToggleProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function PreferenceToggle({ label, description, checked, onChange }: PreferenceToggleProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="ml-4">
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
            checked ? 'bg-brand-50' : 'bg-gray-200'
          }`}
          role="switch"
          aria-checked={checked}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  )
} 