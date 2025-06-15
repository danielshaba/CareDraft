'use client'

// Disable static generation for this page since it uses AuthProvider context
export const dynamic = 'force-dynamic'

import React from 'react'
import { AuthenticatedLayout } from '@/components/shared/Layout'
import { NotificationPreferencesSettings } from '@/components/notifications/NotificationPreferencesSettings'

export default function NotificationSettingsPage() {
  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and notification preferences</p>
        </div>
        
        <NotificationPreferencesSettings />
      </div>
    </AuthenticatedLayout>
  )
} 