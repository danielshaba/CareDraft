'use client';

// Notification Indicator Component
// Shows notification count and connection status in navigation/header areas

import React from 'react';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { useNotificationConnectionStatus, useUnreadNotificationCount } from './RealtimeNotificationProvider';

interface NotificationIndicatorProps {
  /** Custom CSS classes */
  className?: string;
  /** Show connection status indicator */
  showConnectionStatus?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Click handler for the notification bell */
  onClick?: () => void;
  /** Show badge with unread count */
  showBadge?: boolean;
}

export function NotificationIndicator({
  className = '',
  showConnectionStatus = true,
  size = 'md',
  onClick,
  showBadge = true
}: NotificationIndicatorProps) {
  const { isConnected, connectionError, reconnect } = useNotificationConnectionStatus();
  const unreadCount = useUnreadNotificationCount();

  // Size variants for icons and text
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const badgeSizes = {
    sm: 'text-xs px-1 py-0.5',
    md: 'text-xs px-1.5 py-0.5',
    lg: 'text-sm px-2 py-1'
  };

  const buttonSizes = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={onClick}
        className={`relative rounded-full hover:bg-gray-100 transition-colors ${buttonSizes[size]} ${
          unreadCount > 0 ? 'text-brand-500' : 'text-gray-600'
        }`}
        title={`${unreadCount} unread notifications`}
      >
        {unreadCount > 0 ? (
          <Bell className={`${sizeClasses[size]} fill-current`} />
        ) : (
          <Bell className={sizeClasses[size]} />
        )}
        
        {/* Unread Count Badge */}
        {showBadge && unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 bg-brand-500 text-white rounded-full min-w-5 h-5 flex items-center justify-center ${badgeSizes[size]} leading-none`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Connection Status Indicator */}
      {showConnectionStatus && (
        <div className="flex items-center">
          {isConnected ? (
            <div className="flex items-center gap-1 text-emerald-600" title="Real-time notifications connected">
              <Wifi className="w-3 h-3" />
              {size === 'lg' && <span className="text-xs">Connected</span>}
            </div>
          ) : (
            <button
              onClick={reconnect}
              className="flex items-center gap-1 text-amber-500 hover:text-amber-600 transition-colors"
              title={connectionError ? `Connection error: ${connectionError.message}. Click to reconnect.` : 'Real-time notifications disconnected. Click to reconnect.'}
            >
              <WifiOff className="w-3 h-3" />
              {size === 'lg' && <span className="text-xs">Reconnect</span>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Simple notification counter for minimal displays
export function NotificationCounter({ 
  className = '',
  maxCount = 99 
}: { 
  className?: string;
  maxCount?: number;
}) {
  const unreadCount = useUnreadNotificationCount();

  if (unreadCount === 0) return null;

  return (
    <span className={`bg-brand-500 text-white text-xs rounded-full px-2 py-1 min-w-6 h-6 flex items-center justify-center ${className}`}>
      {unreadCount > maxCount ? `${maxCount}+` : unreadCount}
    </span>
  );
}

// Connection status only component
export function ConnectionStatus({ 
  className = '',
  showLabel = false 
}: { 
  className?: string;
  showLabel?: boolean;
}) {
  const { isConnected, connectionError, reconnect } = useNotificationConnectionStatus();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {isConnected ? (
        <>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          {showLabel && <span className="text-xs text-emerald-600">Live</span>}
        </>
      ) : (
        <button
          onClick={reconnect}
          className="flex items-center gap-1 text-amber-500 hover:text-amber-600 transition-colors"
          title={connectionError ? `Error: ${connectionError.message}` : 'Click to reconnect'}
        >
          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
          {showLabel && <span className="text-xs">Reconnect</span>}
        </button>
      )}
    </div>
  );
} 