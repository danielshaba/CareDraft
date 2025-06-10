'use client';

// Real-time Notification Test Page
// Comprehensive testing interface for the notification system

import React, { useState } from 'react';
import { Bell, Send, Trash2, Settings, RefreshCw, Users } from 'lucide-react';
import { RealtimeNotificationProvider, useNotificationContext } from '../../../../components/notifications/RealtimeNotificationProvider';
import { NotificationIndicator, NotificationCounter, ConnectionStatus } from '../../../../components/notifications/NotificationIndicator';

// Test component that uses the notification context
function NotificationTestContent() {
  const {
    isConnected,
    connectionError,
    latestNotification,
    realtimeNotifications,
    unreadCount,
    markAsRead,
    clearNotifications,
    removeNotification,
    reconnect,
    connect,
    disconnect,
  } = useNotificationContext();

  const [testUserId, setTestUserId] = useState('user-123-test');
  // Manual mode functionality removed as unused

  // Mock notification data for testing
  const mockNotifications = [
    {
      type: 'mention' as const,
      title: 'You were mentioned in a proposal',
      content: { message: 'John Doe mentioned you in "New Product Launch" proposal', proposal_id: 'prop-123' },
      priority: 3,
      action_url: '/proposals/prop-123'
    },
    {
      type: 'deadline' as const,
      title: 'Proposal deadline approaching',
      content: { message: 'Your proposal "Q4 Strategy" is due in 2 hours', proposal_id: 'prop-456' },
      priority: 4,
      action_url: '/proposals/prop-456'
    },
    {
      type: 'review_request' as const,
      title: 'Review request',
      content: { message: 'Sarah Johnson requested your review on "Budget Proposal"', proposal_id: 'prop-789' },
      priority: 2,
      action_url: '/proposals/prop-789'
    },
    {
      type: 'system_announcement' as const,
      title: 'System maintenance scheduled',
      content: { message: 'CareDraft will be undergoing maintenance tonight from 11 PM to 1 AM EST' },
      priority: 1,
      action_url: null
    },
    {
      type: 'team_invitation' as const,
      title: 'Team invitation',
      content: { message: 'You have been invited to join the "Marketing Team"', team_id: 'team-456' },
      priority: 3,
      action_url: '/teams/team-456'
    }
  ];

  const sendTestNotification = async (mockNotification: typeof mockNotifications[0]) => {
    try {
      // In a real app, this would call your API to create a notification
      // For testing, we'll simulate this by directly inserting into the database
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: testUserId,
          type: mockNotification.type,
          title: mockNotification.title,
          content: mockNotification.content,
          priority: mockNotification.priority,
          action_url: mockNotification.action_url,
        }),
      });

      if (!response.ok) {
        console.log('Test API not available - this is expected in development');
      }
    } catch {
      console.log('Test notification API call failed - this is expected without backend setup');
    }
  };

  const formatNotificationType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-600 bg-red-50';
    if (priority >= 3) return 'text-orange-600 bg-orange-50';
    if (priority >= 2) return 'text-brand-600 bg-brand-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-[brand-primary]" />
            <h1 className="text-2xl font-bold text-gray-900">Real-time Notification System Test</h1>
          </div>
          <NotificationIndicator size="lg" showConnectionStatus />
        </div>
        
        <p className="text-gray-600">
          Test the real-time notification system with live Supabase subscriptions and browser notifications.
        </p>
      </div>

      {/* Connection Management */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Connection Management
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test User ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter user ID for testing"
                />
                <button
                  onClick={() => connect(testUserId)}
                  disabled={!testUserId}
                  className="px-4 py-2 bg-[brand-primary] text-white rounded-md hover:bg-[#d66464] disabled:opacity-50"
                >
                  Connect
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ConnectionStatus showLabel />
              <span className="text-sm">
                {isConnected ? 'Real-time connection active' : 'Not connected'}
              </span>
            </div>

            {connectionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">Error: {connectionError.message}</p>
                <button
                  onClick={reconnect}
                  className="mt-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Reconnect
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={reconnect}
                className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reconnect
              </button>
              <button
                onClick={disconnect}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>

        {/* Notification Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Notification Stats
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-brand-50 rounded-lg">
                <div className="text-2xl font-bold text-brand-600">{unreadCount}</div>
                <div className="text-sm text-brand-600">Unread</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{realtimeNotifications.length}</div>
                <div className="text-sm text-green-600">Total Received</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">Notification Counter:</span>
              <NotificationCounter />
            </div>

            {latestNotification && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="text-sm font-medium text-yellow-800">Latest Notification:</div>
                <div className="text-sm text-yellow-700">{latestNotification.title}</div>
                <div className="text-xs text-yellow-600">
                  {new Date(latestNotification.created_at).toLocaleTimeString()}
                </div>
              </div>
            )}

            <button
              onClick={clearNotifications}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Notifications
            </button>
          </div>
        </div>
      </div>

      {/* Test Notification Triggers */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Send className="w-5 h-5" />
          Test Notification Triggers
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockNotifications.map((notification, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                  {formatNotificationType(notification.type)}
                </span>
                <span className="text-xs text-gray-500">
                  Priority {notification.priority}
                </span>
              </div>
              
              <h3 className="font-medium text-sm mb-2">{notification.title}</h3>
              <p className="text-xs text-gray-600 mb-3">
                {typeof notification.content === 'object' && notification.content.message}
              </p>
              
              <button
                onClick={() => sendTestNotification(notification)}
                disabled={!isConnected}
                className="w-full px-3 py-2 bg-[brand-primary] text-white rounded text-sm hover:bg-[#d66464] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Test
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-brand-50 border border-brand-200 rounded-md">
          <p className="text-brand-700 text-sm">
            <strong>Note:</strong> These test buttons simulate creating notifications that would trigger real-time updates. 
            In development, the API endpoints may not be available, but the real-time system will still demonstrate 
            connection management and UI updates.
          </p>
        </div>
      </div>

      {/* Real-time Notification Feed */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Real-time Notification Feed</h2>
        
        {realtimeNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No real-time notifications received yet.</p>
            <p className="text-sm">Connect and send test notifications to see them appear here instantly.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {realtimeNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg ${
                  notification.read_status ? 'bg-gray-50 border-gray-200' : 'bg-brand-50 border-brand-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                        {formatNotificationType(notification.type)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <h3 className="font-medium text-sm mb-1">{notification.title}</h3>
                    
                    {typeof notification.content === 'object' && notification.content && (
                      <p className="text-xs text-gray-600">
                        {(notification.content as Record<string, unknown>).message as string || 'No message content'}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!notification.read_status && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs px-2 py-1 bg-brand-600 text-white rounded hover:bg-brand-700"
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Main page component with provider
export default function RealtimeNotificationTestPage() {
  return (
    <RealtimeNotificationProvider
      userId="user-123-test"
      autoConnect={true}
      debug={true}
      showBrowserNotifications={true}
    >
      <NotificationTestContent />
    </RealtimeNotificationProvider>
  );
} 