'use client';

import { useCallback } from 'react';
import { useNetworkStore, useNetworkStatus, useQueuedActions } from '@/lib/stores/networkStore';
import { toast } from '@/lib/stores/toastStore';

export interface ApiCallOptions {
  retryAttempts?: number;
  retryDelay?: number;
  showOfflineToast?: boolean;
  showRetryToast?: boolean;
  queueWhenOffline?: boolean;
  actionType?: string;
  onSuccess?: (result: unknown) => void;
  onError?: (error: Error) => void;
  onFinalFailure?: (error: Error) => void;
}

export interface RetryableApiCall<T> {
  execute: () => Promise<T>;
  cancel: () => void;
  retry: () => Promise<T>;
  isRetrying: boolean;
  retryCount: number;
  maxRetries: number;
}

export function useNetworkAwareApi() {
  const { isOnline, isConnected } = useNetworkStatus();
  const { queueAction } = useQueuedActions();

  const executeWithRetry = useCallback(async <T>(
    apiFunction: () => Promise<T>,
    options: ApiCallOptions = {}
  ): Promise<T> => {
    const {
      retryAttempts = 3,
      retryDelay = 1000,
      showOfflineToast = true,
      showRetryToast = true,
      queueWhenOffline = true,
      actionType = 'api_call',
      onSuccess,
      onError,
      onFinalFailure
    } = options;

    // If offline and queuing is enabled, queue the action
    if (!isOnline && queueWhenOffline) {
      if (showOfflineToast) {
        const queueId = queueAction({
          type: actionType,
          payload: {},
          maxRetries: retryAttempts,
          exponentialDelay: retryDelay,
          originalFunction: apiFunction,
          onSuccess: (result) => {
            toast.success('Action completed', 'Your request was processed when connection was restored');
            if (onSuccess) onSuccess(result);
          },
          onError: (error) => {
            if (showRetryToast) {
              toast.warning('Retrying...', `Attempt failed, retrying automatically`);
            }
            if (onError) onError(error);
          },
          onFinalFailure: (error) => {
            toast.error('Action failed', 'Unable to complete your request after multiple attempts', {
              action: {
                label: 'Retry',
                onClick: () => executeWithRetry(apiFunction, options)
              }
            });
            if (onFinalFailure) onFinalFailure(error);
          }
        });

        toast.info('Request queued', 'Your request will be processed when connection is restored', {
          action: {
            label: 'Cancel',
            onClick: () => {
              useNetworkStore.getState().removeQueuedAction(queueId);
              toast.success('Request cancelled');
            }
          },
          duration: 8000
        });
      }

      throw new Error('Offline: Request queued for retry when connection is restored');
    }

    // Execute with retry logic
    let lastError: Error = new Error('Unknown error');
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        const result = await apiFunction();
        
        if (onSuccess) {
          onSuccess(result);
        }
        
        return result;
      } catch {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on final attempt
        if (attempt === retryAttempts) {
          break;
        }

        // Don't retry certain types of errors
        if (!shouldRetryError(lastError)) {
          break;
        }

        // Show retry toast if enabled
        if (showRetryToast && attempt < retryAttempts) {
          toast.warning('Retrying...', `Attempt ${attempt + 1} failed, retrying in ${Math.ceil((retryDelay * Math.pow(2, attempt)) / 1000)}s`);
        }

        // Wait before retrying with exponential backoff
        const delay = retryDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        if (onError) {
          onError(lastError);
        }
      }
    }

    // All retries failed
    if (onFinalFailure) {
      onFinalFailure(lastError);
    } else if (onError) {
      onError(lastError);
    }

    throw lastError;
  }, [isOnline, isConnected, queueAction]);

  const createRetryableCall = useCallback(<T>(
    apiFunction: () => Promise<T>,
    options: ApiCallOptions = {}
  ): RetryableApiCall<T> => {
    let isCancelled = false;
    let currentRetryCount = 0;
    const maxRetries = options.retryAttempts || 3;

    const execute = async (): Promise<T> => {
      if (isCancelled) {
        throw new Error('API call was cancelled');
      }
      
      return executeWithRetry(apiFunction, {
        ...options,
        onError: (error) => {
          currentRetryCount++;
          if (options.onError) options.onError(error);
        }
      });
    };

    const cancel = () => {
      isCancelled = true;
    };

    const retry = async (): Promise<T> => {
      currentRetryCount = 0;
      isCancelled = false;
      return execute();
    };

    return {
      execute,
      cancel,
      retry,
      get isRetrying() { return currentRetryCount > 0 && currentRetryCount < maxRetries; },
      get retryCount() { return currentRetryCount; },
      maxRetries
    };
  }, [executeWithRetry]);

  return {
    executeWithRetry,
    createRetryableCall,
    isOnline,
    isConnected
  };
}

// Helper function to determine if an error should be retried
function shouldRetryError(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  // Don't retry these error types
  const nonRetryableErrors = [
    'authentication',
    'authorization',
    'forbidden',
    'not found',
    'bad request',
    'validation',
    'invalid',
    'expired'
  ];

  // Don't retry if it's a client error (4xx)
  if (message.includes('400') || message.includes('401') || 
      message.includes('403') || message.includes('404') || 
      message.includes('422')) {
    return false;
  }

  // Check for non-retryable error types
  return !nonRetryableErrors.some(type => message.includes(type));
}

// Specific hooks for common API patterns
export function useRetryableApiCall<T>(
  apiFunction: () => Promise<T>,
  options: ApiCallOptions = {}
) {
  const { createRetryableCall } = useNetworkAwareApi();
  return createRetryableCall(apiFunction, options);
}

export function useQueuedApiCall<T>(
  apiFunction: () => Promise<T>,
  options: Omit<ApiCallOptions, 'queueWhenOffline'> = {}
) {
  const { executeWithRetry } = useNetworkAwareApi();
  
  return useCallback(async () => {
    return executeWithRetry(apiFunction, {
      ...options,
      queueWhenOffline: true
    });
  }, [apiFunction, executeWithRetry, options]);
} 