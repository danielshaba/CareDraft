'use client';

import React, { useState } from 'react';
import { useNetworkAwareApi, useRetryableApiCall, useQueuedApiCall } from '@/hooks/useNetworkAwareApi';
import { NetworkStatus, NetworkIndicator } from '@/components/ui/network-status';
import { LoadingButton } from '@/components/ui/loading-button';
import { useLoadingState } from '@/hooks/useLoadingState';

export function NetworkDemo() {
  const [simulateError, setSimulateError] = useState(false);
  const [simulateSlowNetwork, setSimulateSlowNetwork] = useState(false);
  const { executeWithRetry, isOnline } = useNetworkAwareApi();

  // Example API functions that can fail
  const saveDataApi = async () => {
    await new Promise(resolve => setTimeout(resolve, simulateSlowNetwork ? 3000 : 1000));
    
    if (simulateError) {
      throw new Error('Simulated network error');
    }
    
    return { id: Math.random().toString(36), message: 'Data saved successfully' };
  };

  const uploadFileApi = async () => {
    await new Promise(resolve => setTimeout(resolve, simulateSlowNetwork ? 5000 : 2000));
    
    if (simulateError) {
      throw new Error('Upload failed - network timeout');
    }
    
    return { url: '/uploads/file.pdf', size: 1024 * 1024 };
  };

  // Loading state with network awareness
  const saveLoadingState = useLoadingState({
    showSuccessToast: true,
    showErrorToast: true,
    successMessage: 'Data saved successfully!',
    errorMessage: 'Failed to save data'
  });

  // Retryable API call with manual control
  const retryableUpload = useRetryableApiCall(uploadFileApi, {
    retryAttempts: 3,
    retryDelay: 2000,
    showRetryToast: true,
    actionType: 'file_upload'
  });

  // Queued API call (always queues when offline)
  const queuedSave = useQueuedApiCall(saveDataApi, {
    retryAttempts: 5,
    actionType: 'data_save'
  });

  const handleBasicSave = async () => {
    try {
      saveLoadingState.setLoading(true);
      const result = await executeWithRetry(saveDataApi, {
        retryAttempts: 3,
        showRetryToast: true,
        actionType: 'basic_save'
      });
      saveLoadingState.setData(result);
    } catch {
      saveLoadingState.setError(error instanceof Error ? error : new Error('Unknown error'));
    }
  };

  const handleRetryableUpload = async () => {
    try {
      const result = await retryableUpload.execute();
      console.log('Upload result:', result);
    } catch {
      console.error('Upload failed:', error);
    }
  };

  const handleQueuedSave = async () => {
    try {
      const result = await queuedSave();
      console.log('Queued save result:', result);
    } catch {
      console.error('Queued save failed:', error);
    }
  };

  const simulateOffline = () => {
    // Temporarily set navigator.onLine to false (for demo purposes)
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });
    
    // Trigger offline event
    window.dispatchEvent(new Event('offline'));
    
    // Restore after 10 seconds
    setTimeout(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
      window.dispatchEvent(new Event('online'));
    }, 10000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Network Awareness & Retry Mechanisms Demo
        </h1>
        
        {/* Network Status Display */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Network Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Compact Indicator</h3>
              <NetworkIndicator className="justify-start" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Detailed Status</h3>
              <NetworkStatus showDetails={true} />
            </div>
          </div>
        </div>

        {/* Demo Controls */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Demo Controls</h3>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={simulateError}
                onChange={(e) => setSimulateError(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Simulate Network Errors</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={simulateSlowNetwork}
                onChange={(e) => setSimulateSlowNetwork(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Simulate Slow Network</span>
            </label>
            
            <button
              onClick={simulateOffline}
              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Go Offline (10s)
            </button>
          </div>
        </div>

        {/* API Call Examples */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Basic Retry */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Retry</h3>
            <p className="text-sm text-gray-600">
              Automatic retry with exponential backoff. Queues when offline.
            </p>
            
            <LoadingButton
              onClick={handleBasicSave}
              isLoading={saveLoadingState.isLoading}
              variant={saveLoadingState.error ? "destructive" : "default"}
              className="w-full"
              loadingText="Saving..."
            >
              Save Data
            </LoadingButton>
            
            {saveLoadingState.error && (
              <p className="text-sm text-red-600">
                Error: {saveLoadingState.error.message}
              </p>
            )}
            
            {saveLoadingState.data && (
              <p className="text-sm text-emerald-600">
                Success! ID: {saveLoadingState.data.id}
              </p>
            )}
          </div>

          {/* Retryable API Call */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Retryable Upload</h3>
            <p className="text-sm text-gray-600">
              Manual retry control with progress tracking.
            </p>
            
            <div className="space-y-2">
              <LoadingButton
                onClick={handleRetryableUpload}
                isLoading={retryableUpload.isRetrying}
                className="w-full"
                loadingText={`Uploading... (${retryableUpload.retryCount}/${retryableUpload.maxRetries})`}
              >
                Upload File
              </LoadingButton>
              
              {retryableUpload.isRetrying && (
                <button
                  onClick={retryableUpload.cancel}
                  className="w-full px-3 py-2 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                >
                  Cancel Upload
                </button>
              )}
              
              <button
                onClick={retryableUpload.retry}
                disabled={retryableUpload.isRetrying}
                className="w-full px-3 py-2 text-sm text-sky-600 border border-sky-300 rounded hover:bg-sky-50 disabled:opacity-50"
              >
                Retry Upload
              </button>
            </div>
          </div>

          {/* Queued API Call */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Queued Save</h3>
            <p className="text-sm text-gray-600">
              Always queues when offline, with high retry attempts.
            </p>
            
            <button
              onClick={handleQueuedSave}
              disabled={!isOnline}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isOnline ? 'Save with Queue' : 'Will Queue When Offline'}
            </button>
            
            <p className="text-xs text-gray-500">
              This action will be queued automatically when offline and retried when connection is restored.
            </p>
          </div>
        </div>

        {/* Queued Actions Display */}
        <div className="mt-8">
          <NetworkStatus showDetails={true} showQueuedActions={true} />
        </div>

        {/* Usage Examples */}
        <div className="mt-8 p-4 bg-sky-50 rounded-lg">
          <h3 className="text-sm font-medium text-sky-900 mb-2">Usage Examples</h3>
          <div className="text-xs text-sky-800 space-y-1">
            <p><strong>Basic Retry:</strong> executeWithRetry(apiFunction, options)</p>
            <p><strong>Retryable Call:</strong> createRetryableCall(apiFunction, options)</p>
            <p><strong>Auto Queue:</strong> useQueuedApiCall(apiFunction, options)</p>
            <p><strong>Network Status:</strong> useNetworkStatus() hook</p>
            <p><strong>Queued Actions:</strong> useQueuedActions() hook</p>
          </div>
        </div>
      </div>
    </div>
  );
} 