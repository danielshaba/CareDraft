'use client';

// Notification Panel Component
// Dropdown panel that displays notifications with mark-as-read functionality

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Clock, 
  User, 
  FileText, 
  Calendar,
  AlertTriangle,
  Users,
  Settings,
  ExternalLink,
  Search
} from 'lucide-react';
import { useNotificationContext, useNotificationActions } from './RealtimeNotificationProvider';
import { Database } from '../../lib/database.types';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];

interface NotificationPanelProps {
  /** Whether the panel is visible */
  isOpen: boolean;
  /** Function to close the panel */
  onClose: () => void;
  /** Position relative to trigger element */
  position?: 'left' | 'right' | 'center';
  /** Maximum height of the panel */
  maxHeight?: number;
  /** Show header with title and actions */
  showHeader?: boolean;
  /** Custom CSS classes */
  className?: string;
}

export function NotificationPanel({
  isOpen,
  onClose,
  position = 'right',
  maxHeight = 400,
  showHeader = true,
  className = ''
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { 
    realtimeNotifications, 
    unreadCount, 
    isConnected,
    connectionError 
  } = useNotificationContext();
  const { markAsRead, clearNotifications, removeNotification } = useNotificationActions();
  
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Filter notifications based on selected filter
  const filteredNotifications = realtimeNotifications.filter(notification => {
    if (filter === 'unread') {
      return !notification.read_status;
    }
    return true;
  });

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return <User className="w-4 h-4" />;
      case 'deadline':
        return <Clock className="w-4 h-4" />;
      case 'proposal_update':
        return <FileText className="w-4 h-4" />;
      case 'review_request':
        return <FileText className="w-4 h-4" />;
      case 'system_announcement':
        return <Settings className="w-4 h-4" />;
      case 'team_invitation':
        return <Users className="w-4 h-4" />;
      case 'document_shared':
        return <FileText className="w-4 h-4" />;
      case 'research_session_shared':
        return <Search className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  // Get color for notification type
  const getNotificationColor = (type: string, priority: number) => {
    if (priority >= 4) return 'text-red-600 bg-red-50 border-red-200';
    
    switch (type) {
      case 'mention':
        return 'text-brand-600 bg-brand-50 border-brand-200';
      case 'deadline':
        return 'text-amber-600 bg-orange-50 border-orange-200';
      case 'proposal_update':
        return 'text-emerald-600 bg-emerald-50 border-green-200';
      case 'review_request':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'system_announcement':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'team_invitation':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'document_shared':
        return 'text-brand-500 bg-brand-50 border-brand-500';
      case 'research_session_shared':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Format notification type for display
  const formatNotificationType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - notificationTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return notificationTime.toLocaleDateString();
  };

  // Handle notification click
  const handleNotificationClick = (notification: NotificationRow) => {
    // Mark as read if unread
    if (!notification.read_status) {
      markAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    filteredNotifications.forEach(notification => {
      if (!notification.read_status) {
        markAsRead(notification.id);
      }
    });
  };

  // Get notification content message
  const getNotificationMessage = (notification: NotificationRow): string => {
    if (typeof notification.content === 'object' && notification.content) {
      return (notification.content as any).message || 
             (notification.content as any).description || 
             (notification.content as any).text || 
             'No message available';
    }
    return 'No message available';
  };

  if (!isOpen) return null;

  return (
    <div className={`absolute z-50 ${className}`}>
      {/* Panel */}
      <div
        ref={panelRef}
        className={`w-80 bg-white rounded-lg shadow-lg border border-gray-200 ${
          position === 'left' ? 'right-0' : position === 'right' ? 'left-0' : 'left-1/2 transform -translate-x-1/2'
        }`}
        style={{ maxHeight: `${maxHeight}px` }}
      >
        {/* Header */}
        {showHeader && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-brand-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Connection Status */}
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" title="Connected" />
                ) : (
                  <div className="w-2 h-2 bg-red-500 rounded-full" title={connectionError?.message || 'Disconnected'} />
                )}
              </div>
              
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded"
                title="Close"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === 'all' 
                  ? 'bg-brand-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All ({realtimeNotifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === 'unread' 
                  ? 'bg-brand-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="p-1 hover:bg-gray-100 rounded text-gray-600"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            
            {realtimeNotifications.length > 0 && (
              <button
                onClick={clearNotifications}
                className="p-1 hover:bg-gray-100 rounded text-gray-600"
                title="Clear all notifications"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="overflow-y-auto" style={{ maxHeight: `${maxHeight - 120}px` }}>
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {filter === 'unread' ? 'All caught up!' : 'New notifications will appear here'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 ${
                    notification.read_status 
                      ? 'border-l-transparent' 
                      : 'border-l-brand-500'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {/* Notification Icon */}
                    <div className={`p-2 rounded-full ${getNotificationColor(notification.type, notification.priority)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-600">
                            {formatNotificationType(notification.type)}
                          </span>
                                                     {notification.priority >= 4 && (
                             <AlertTriangle className="w-3 h-3 text-red-500" />
                           )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(notification.created_at)}
                          </span>
                          
                          {!notification.read_status && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-1 hover:bg-gray-200 rounded text-gray-600"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <h4 className={`text-sm font-medium mb-1 ${
                        notification.read_status ? 'text-gray-700' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </h4>

                      <p className={`text-xs ${
                        notification.read_status ? 'text-gray-500' : 'text-gray-600'
                      } line-clamp-2`}>
                        {getNotificationMessage(notification)}
                      </p>

                      {notification.action_url && (
                        <div className="flex items-center gap-1 mt-2">
                          <ExternalLink className="w-3 h-3 text-brand-500" />
                          <span className="text-xs text-brand-500">View details</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 