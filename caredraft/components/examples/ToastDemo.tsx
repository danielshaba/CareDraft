'use client';

import React from 'react';
import { useToast } from '@/components/ui/toast';
import { useToastActions, useToastPosition } from '@/lib/stores/toastStore';
import { useLoadingState } from '@/hooks/useLoadingState';
import { LoadingButton } from '@/components/ui/loading-button';

export function ToastDemo() {
  const toast = useToast();
  const { setPosition, setMaxToasts, setDefaultDuration, clearAllToasts } = useToastActions();
  const position = useToastPosition();

  // Demo loading state with toast integration
  const saveState = useLoadingState({
    showSuccessToast: true,
    showErrorToast: true,
    successMessage: 'Data saved successfully!',
    errorMessage: 'Failed to save data',
  });

  const positions = [
    'top-left', 'top-center', 'top-right',
    'bottom-left', 'bottom-center', 'bottom-right'
  ] as const;

  // Demo API call function
  const simulateApiCall = async (shouldFail: boolean = false) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (shouldFail) {
      throw new Error('API request failed');
    }
    return { success: true, data: 'Mock data' };
  };

  const handleSaveWithToast = () => {
    saveState.execute(() => simulateApiCall(false));
  };

  const handleSaveWithError = () => {
    saveState.execute(() => simulateApiCall(true));
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Toast Notification Demo</h1>
        <p className="text-gray-600">Test all toast notification features and configurations</p>
      </div>

      {/* Basic Toast Types */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Basic Toast Types</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => toast.success('Success!', 'Operation completed successfully')}
            className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
          >
            Success Toast
          </button>
          
          <button
            onClick={() => toast.error('Error!', 'Something went wrong')}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            Error Toast
          </button>
          
          <button
            onClick={() => toast.warning('Warning!', 'Please check your input')}
            className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
          >
            Warning Toast
          </button>
          
          <button
            onClick={() => toast.info('Info', 'Here is some information')}
            className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors"
          >
            Info Toast
          </button>
        </div>
      </div>

      {/* Toast with Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Toast with Actions</h2>
        <div className="space-x-4">
          <button
            onClick={() => toast.success('Saved!', 'Document saved to drafts', {
              action: {
                label: 'View',
                onClick: () => alert('Opening document...')
              },
              duration: 10000
            })}
            className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
          >
            Toast with Action
          </button>
          
          <button
            onClick={() => toast.error('Upload failed', 'Failed to upload file', {
              action: {
                label: 'Retry',
                onClick: () => alert('Retrying upload...')
              },
              duration: 0 // Persistent until dismissed
            })}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            Persistent Error with Retry
          </button>
        </div>
      </div>

      {/* Loading State Integration */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Loading State Integration</h2>
        <div className="space-x-4">
          <LoadingButton
            onClick={handleSaveWithToast}
            isLoading={saveState.isLoading}
            variant="default"
            loadingText="Saving..."
          >
            Save with Success Toast
          </LoadingButton>
          
          <LoadingButton
            onClick={handleSaveWithError}
            isLoading={saveState.isLoading}
            variant="destructive"
            loadingText="Saving..."
          >
            Save with Error Toast
          </LoadingButton>
        </div>
        
        {saveState.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">Error: {saveState.error.message}</p>
          </div>
        )}
        
        {saveState.data && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700 text-sm">Success: Data saved!</p>
          </div>
        )}
      </div>

      {/* Position Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Toast Position</h2>
        <div className="mb-4">
          <span className="text-sm font-medium text-gray-700">Current Position: </span>
          <span className="text-sm text-blue-600 font-medium">{position}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {positions.map((pos) => (
            <button
              key={pos}
              onClick={() => {
                setPosition(pos);
                toast.info('Position changed', `Toast position set to ${pos}`);
              }}
              className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                position === pos
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {pos.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Options */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Toasts (currently displaying max 5)
            </label>
            <div className="space-x-2">
              {[3, 5, 7, 10].map(num => (
                <button
                  key={num}
                  onClick={() => {
                    setMaxToasts(num);
                    toast.info('Configuration updated', `Max toasts set to ${num}`);
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Duration (seconds)
            </label>
            <div className="space-x-2">
              {[3, 5, 7, 10].map(seconds => (
                <button
                  key={seconds}
                  onClick={() => {
                    setDefaultDuration(seconds * 1000);
                    toast.info('Configuration updated', `Default duration set to ${seconds}s`);
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  {seconds}s
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Queue Testing */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Toast Queue Testing</h2>
        <div className="space-x-4">
          <button
            onClick={() => {
              // Create multiple toasts quickly to test queuing
              for (let i = 1; i <= 8; i++) {
                setTimeout(() => {
                  toast.info(`Toast ${i}`, `This is toast number ${i}`);
                }, i * 200);
              }
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
          >
            Create 8 Toasts
          </button>
          
          <button
            onClick={() => clearAllToasts()}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Clear All Toasts
          </button>
        </div>
      </div>

      {/* Integration Examples */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Integration Examples</h2>
        <div className="space-y-3">
          <button
            onClick={() => {
              // Simulate form submission
              toast.info('Submitting form...', 'Please wait while we process your request');
              setTimeout(() => {
                toast.success('Form submitted!', 'Your information has been saved', {
                  action: {
                    label: 'View Submission',
                    onClick: () => alert('Opening submission...')
                  }
                });
              }, 2000);
            }}
            className="block w-full px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
          >
            Simulate Form Submission
          </button>
          
          <button
            onClick={() => {
              // Simulate file upload
              toast.info('Uploading file...', 'Please do not close this window');
                             setTimeout(() => {
                 if (Math.random() > 0.5) {
                   toast.success('Upload complete!', 'File has been uploaded successfully');
                 } else {
                   toast.error('Upload failed', 'Please check your connection and try again', {
                     action: {
                       label: 'Retry',
                       onClick: () => alert('Retrying upload...')
                     }
                   });
                 }
               }, 3000);
            }}
            className="block w-full px-4 py-2 bg-brand-primary-light0 text-white rounded-md hover:bg-brand-primary transition-colors"
          >
            Simulate File Upload
          </button>
        </div>
      </div>
    </div>
  );
} 