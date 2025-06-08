'use client';

import React, { useEffect, useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  RefreshCw, 
  X, 
  SignalHigh,
  SignalLow,
  SignalMedium
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNetworkStore, useNetworkStatus, useQueuedActions } from '@/lib/stores/networkStore';
import { toast } from '@/lib/stores/toastStore';

interface NetworkStatusProps {
  className?: string;
  showDetails?: boolean;
  showQueuedActions?: boolean;
}

export function NetworkStatus({ 
  className, 
  showDetails = false, 
  showQueuedActions = true 
}: NetworkStatusProps) {
  const [isClient, setIsClient] = useState(false);
  const { isOnline, isConnected, connectionType, effectiveType, isSlowConnection } = useNetworkStatus();
  const { 
    queuedActions, 
    retryingActions, 
    retryAction, 
    retryAllActions, 
    removeQueuedAction, 
    clearQueue,
    hasQueuedActions 
  } = useQueuedActions();
  
  const { startNetworkMonitoring, stopNetworkMonitoring } = useNetworkStore();

  useEffect(() => {
    setIsClient(true);
    startNetworkMonitoring();
    return () => stopNetworkMonitoring();
  }, [startNetworkMonitoring, stopNetworkMonitoring]);

  // Don't render on server to prevent hydration mismatch
  if (!isClient) {
    return <div className={cn("flex items-center space-x-2", className)}>
      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
      <span className="text-sm text-gray-400">Loading...</span>
    </div>;
  }

  const getConnectionIcon = () => {
    if (!isOnline || !isConnected) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }

    if (isSlowConnection) {
      return <SignalLow className="h-4 w-4 text-yellow-500" />;
    }

    switch (effectiveType) {
      case '4g':
        return <SignalHigh className="h-4 w-4 text-green-500" />;
      case '3g':
        return <SignalMedium className="h-4 w-4 text-yellow-500" />;
      case '2g':
      case 'slow-2g':
        return <SignalLow className="h-4 w-4 text-orange-500" />;
      default:
        return <Wifi className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (!isConnected) return 'Disconnected';
    if (isSlowConnection) return 'Slow connection';
    return 'Online';
  };

  const getStatusColor = () => {
    if (!isOnline || !isConnected) return 'text-red-500';
    if (isSlowConnection) return 'text-yellow-500';
    return 'text-green-500';
  };

  const handleRetryAll = async () => {
    try {
      await retryAllActions();
      toast.success('Retrying all actions', 'Attempting to process queued requests');
    } catch {
      toast.error('Retry failed', 'Unable to retry actions at this time');
    }
  };

  const handleRetryAction = async (actionId: string) => {
    try {
      await retryAction(actionId);
    } catch {
      // Error handling is done in the network store
    }
  };

  const handleRemoveAction = (actionId: string) => {
    removeQueuedAction(actionId);
    toast.success('Action removed', 'Queued action has been cancelled');
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  if (!showDetails && !hasQueuedActions) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        {getConnectionIcon()}
        <span className={cn("text-sm font-medium", getStatusColor())}>
          {getStatusText()}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Network Status */}
      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center space-x-3">
          {getConnectionIcon()}
          <div>
            <p className={cn("text-sm font-medium", getStatusColor())}>
              {getStatusText()}
            </p>
            {showDetails && (
              <p className="text-xs text-gray-500">
                {connectionType !== 'unknown' && `${connectionType} • `}
                {effectiveType !== 'unknown' && effectiveType}
              </p>
            )}
          </div>
        </div>

        {hasQueuedActions && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              {queuedActions.length} queued
            </span>
            {isOnline && (
              <button
                onClick={handleRetryAll}
                disabled={queuedActions.length === 0}
                className="p-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                title="Retry all actions"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Queued Actions */}
      {showQueuedActions && hasQueuedActions && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">
                Queued Actions ({queuedActions.length})
              </h4>
              <div className="flex items-center space-x-2">
                {isOnline && (
                  <button
                    onClick={handleRetryAll}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Retry All
                  </button>
                )}
                <button
                  onClick={clearQueue}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {queuedActions.map((action) => {
              const isRetrying = retryingActions.has(action.id);
              
              return (
                <div
                  key={action.id}
                  className="p-3 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {isRetrying ? (
                          <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {action.type.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-xs text-gray-500">
                          {formatTimestamp(action.timestamp)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Attempt {action.retryCount + 1}/{action.maxRetries + 1}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isOnline && !isRetrying && (
                        <button
                          onClick={() => handleRetryAction(action.id)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Retry now"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveAction(action.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Remove action"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Progress indicator */}
                  {action.retryCount > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                          style={{
                            width: `${(action.retryCount / action.maxRetries) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact network indicator for navigation bars
export function NetworkIndicator({ className }: { className?: string }) {
  const [isClient, setIsClient] = useState(false);
  const { isOnline, isConnected, isSlowConnection } = useNetworkStatus();
  const { hasQueuedActions, queuedActions } = useQueuedActions();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render on server to prevent hydration mismatch
  if (!isClient) {
    return null;
  }

  if (isOnline && isConnected && !hasQueuedActions && !isSlowConnection) {
    return null; // Don't show when everything is fine
  }

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {(!isOnline || !isConnected) && (
        <div className="flex items-center space-x-1 px-2 py-1 bg-red-50 text-red-700 rounded text-xs">
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </div>
      )}
      
      {isSlowConnection && (
        <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs">
          <SignalLow className="h-3 w-3" />
          <span>Slow</span>
        </div>
      )}
      
      {hasQueuedActions && (
        <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
          <Clock className="h-3 w-3" />
          <span>{queuedActions.length}</span>
        </div>
      )}
    </div>
  );
} 