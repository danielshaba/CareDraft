'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Bell, Check, X, MessageCircle, AtSign } from 'lucide-react'
import type { Database } from '@/lib/database.types'
import { NotificationsService } from '@/lib/services/notifications'
import { formatTimeAgo } from '@/types/collaboration'

type Notification = Database['public']['Tables']['notifications']['Row']

interface NotificationBellProps {
  userId: string
  className?: string
}

export function NotificationBell({ userId, className = '' }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notificationsService = new NotificationsService()

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [notifs, count] = await Promise.all([
          notificationsService.getUserNotifications(userId),
          notificationsService.getUnreadCount(userId)
        ])
        setNotifications(notifs)
        setUnreadCount(count)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [userId])

  // Real-time subscription
  useEffect(() => {
    const subscription = notificationsService.subscribeToUserNotifications(
      userId,
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev])
        setUnreadCount(prev => prev + 1)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId)
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_status: true }
            : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead(userId)
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_status: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationsService.deleteNotification(notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      const notification = notifications.find(n => n.id === notificationId)
      if (notification && !notification.read_status) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return <AtSign className="w-4 h-4 text-brand-primary" />
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-brand-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const getNotificationMessage = (notification: Notification) => {
    return notification.title || 'New notification'
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-primary text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-brand-primary hover:text-brand-primary-dark font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="w-5 h-5 border border-gray-300 border-t-brand-primary rounded-full animate-spin mx-auto mb-2" />
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.read_status ? 'bg-brand-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        {getNotificationMessage(notification)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.read_status && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-1 rounded hover:bg-gray-200 transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-3 h-3 text-gray-500" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                        title="Delete notification"
                      >
                        <X className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>

                    {/* Unread indicator */}
                    {!notification.read_status && (
                      <div className="w-2 h-2 bg-brand-primary rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button className="text-xs text-gray-500 hover:text-gray-700">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 