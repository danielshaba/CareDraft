'use client';

import { useState, useCallback } from 'react';
import { toast } from '@/lib/stores/toastStore';

export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  data: unknown;
}

export interface UseLoadingStateOptions {
  initialLoading?: boolean;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

export function useLoadingState<T = any>(options: UseLoadingStateOptions = {}) {
  const {
    initialLoading = false,
    onSuccess,
    onError,
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = 'Operation completed successfully',
    errorMessage = 'An error occurred'
  } = options;

  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null,
    data: null
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: Error | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
    if (error) {
      if (onError) {
        onError(error);
      }
      if (showErrorToast) {
        toast.error(errorMessage, error.message);
      }
    }
  }, [onError, showErrorToast, errorMessage]);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data, error: null, isLoading: false }));
    if (data) {
      if (onSuccess) {
        onSuccess(data);
      }
      if (showSuccessToast) {
        toast.success(successMessage);
      }
    }
  }, [onSuccess, showSuccessToast, successMessage]);

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await asyncFunction();
      setData(result);
      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      setError(errorObj);
      throw errorObj;
    }
  }, [setData, setError]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: null
    });
  }, []);

  return {
    ...state,
    setLoading,
    setError,
    setData,
    execute,
    reset
  };
}

// Hook for managing multiple loading states
export function useMultipleLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  }, []);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);
  const isLoading = useCallback((key: string) => loadingStates[key] || false, [loadingStates]);

  return {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading
  };
}

// Hook for async operations with automatic loading state
export function useAsyncOperation<T = any>(options: UseLoadingStateOptions = {}) {
  const loadingState = useLoadingState<T>(options);

  const executeAsync = useCallback(async (
    asyncFunction: () => Promise<T>
  ) => {
    try {
      return await loadingState.execute(asyncFunction);
    } catch {
      // Error is already handled in useLoadingState
      return null;
    }
  }, [loadingState]);

  return {
    ...loadingState,
    executeAsync
  };
} 