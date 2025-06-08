'use client';

// Notification Dropdown Component
// Complete notification solution with bell indicator and dropdown panel

import React, { useState, useRef } from 'react';
import { NotificationIndicator } from './NotificationIndicator';
import { NotificationPanel } from './NotificationPanel';

interface NotificationDropdownProps {
  /** Size variant for the bell indicator */
  size?: 'sm' | 'md' | 'lg';
  /** Show connection status indicator */
  showConnectionStatus?: boolean;
  /** Panel position relative to the bell */
  panelPosition?: 'left' | 'right' | 'center';
  /** Maximum height of the notification panel */
  panelMaxHeight?: number;
  /** Custom CSS classes for the container */
  className?: string;
  /** Custom CSS classes for the panel */
  panelClassName?: string;
}

export function NotificationDropdown({
  size = 'md',
  showConnectionStatus = true,
  panelPosition = 'right',
  panelMaxHeight = 400,
  className = '',
  panelClassName = ''
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Notification Bell Indicator */}
      <NotificationIndicator
        size={size}
        showConnectionStatus={showConnectionStatus}
        onClick={handleToggle}
        showBadge={true}
      />

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute top-full mt-2 z-50">
          <NotificationPanel
            isOpen={isOpen}
            onClose={handleClose}
            position={panelPosition}
            maxHeight={panelMaxHeight}
            showHeader={true}
            className={panelClassName}
          />
        </div>
      )}
    </div>
  );
}

// Export all notification components for easy access
export { NotificationIndicator } from './NotificationIndicator';
export { NotificationPanel } from './NotificationPanel';
export { 
  RealtimeNotificationProvider, 
  useNotificationContext,
  useNotificationActions
} from './RealtimeNotificationProvider'; 