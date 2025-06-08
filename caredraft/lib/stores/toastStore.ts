'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  createdAt: number;
  isVisible: boolean;
}

interface ToastState {
  toasts: Toast[];
  position: ToastPosition;
  maxToasts: number;
  defaultDuration: number;
}

interface ToastActions {
  addToast: (toast: Omit<Toast, 'id' | 'createdAt' | 'isVisible'>) => string;
  removeToast: (id: string) => void;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  setPosition: (position: ToastPosition) => void;
  setMaxToasts: (max: number) => void;
  setDefaultDuration: (duration: number) => void;
  
  // Convenience methods
  success: (title: string, description?: string, options?: Partial<Toast>) => string;
  error: (title: string, description?: string, options?: Partial<Toast>) => string;
  warning: (title: string, description?: string, options?: Partial<Toast>) => string;
  info: (title: string, description?: string, options?: Partial<Toast>) => string;
}

type ToastStore = ToastState & ToastActions;

// Default configuration
const DEFAULT_DURATION = 5000;
const DEFAULT_MAX_TOASTS = 5;
const DEFAULT_POSITION: ToastPosition = 'bottom-right';

let toastCounter = 0;

const useToastStore = create<ToastStore>()(
  subscribeWithSelector(
    (set, get) => ({
      // State
      toasts: [],
      position: DEFAULT_POSITION,
      maxToasts: DEFAULT_MAX_TOASTS,
      defaultDuration: DEFAULT_DURATION,

      // Actions
      addToast: (toastData) => {
        const id = `toast-${++toastCounter}`;
        const { defaultDuration, maxToasts } = get();
        
        const toast: Toast = {
          id,
          type: toastData.type,
          title: toastData.title,
          description: toastData.description,
          duration: toastData.duration ?? defaultDuration,
          dismissible: toastData.dismissible ?? true,
          action: toastData.action,
          createdAt: Date.now(),
          isVisible: true,
        };

        set((state) => {
          let newToasts = [...state.toasts, toast];
          
          // Limit the number of toasts
          if (newToasts.length > maxToasts) {
            // Remove oldest toasts
            newToasts = newToasts.slice(-maxToasts);
          }
          
          return { toasts: newToasts };
        });

        // Auto-dismiss if duration is set
        if (toast.duration && toast.duration > 0) {
          setTimeout(() => {
            get().dismissToast(id);
          }, toast.duration);
        }

        return id;
      },

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter(toast => toast.id !== id)
        }));
      },

      dismissToast: (id) => {
        set((state) => ({
          toasts: state.toasts.map(toast =>
            toast.id === id ? { ...toast, isVisible: false } : toast
          )
        }));

        // Remove after animation completes
        setTimeout(() => {
          get().removeToast(id);
        }, 300);
      },

      clearAllToasts: () => {
        set({ toasts: [] });
      },

      updateToast: (id, updates) => {
        set((state) => ({
          toasts: state.toasts.map(toast =>
            toast.id === id ? { ...toast, ...updates } : toast
          )
        }));
      },

      setPosition: (position) => {
        set({ position });
      },

      setMaxToasts: (maxToasts) => {
        set({ maxToasts });
      },

      setDefaultDuration: (defaultDuration) => {
        set({ defaultDuration });
      },

      // Convenience methods
      success: (title, description, options = {}) => {
        return get().addToast({
          type: 'success',
          title,
          description,
          ...options
        });
      },

      error: (title, description, options = {}) => {
        return get().addToast({
          type: 'error',
          title,
          description,
          duration: options.duration ?? 7000, // Longer duration for errors
          ...options
        });
      },

      warning: (title, description, options = {}) => {
        return get().addToast({
          type: 'warning',
          title,
          description,
          duration: options.duration ?? 6000, // Slightly longer for warnings
          ...options
        });
      },

      info: (title, description, options = {}) => {
        return get().addToast({
          type: 'info',
          title,
          description,
          ...options
        });
      },
    })
  )
);

// Export selectors for performance optimization
export const useToasts = () => useToastStore((state) => state.toasts);
export const useToastPosition = () => useToastStore((state) => state.position);
export const useToastActions = () => useToastStore((state) => ({
  addToast: state.addToast,
  removeToast: state.removeToast,
  dismissToast: state.dismissToast,
  clearAllToasts: state.clearAllToasts,
  updateToast: state.updateToast,
  setPosition: state.setPosition,
  setMaxToasts: state.setMaxToasts,
  setDefaultDuration: state.setDefaultDuration,
  success: state.success,
  error: state.error,
  warning: state.warning,
  info: state.info,
}));

// Export store for direct access when needed
export { useToastStore };

// Export a simple toast API for easier usage
export const toast = {
  success: (title: string, description?: string, options?: Partial<Toast>) => {
    return useToastStore.getState().success(title, description, options);
  },
  error: (title: string, description?: string, options?: Partial<Toast>) => {
    return useToastStore.getState().error(title, description, options);
  },
  warning: (title: string, description?: string, options?: Partial<Toast>) => {
    return useToastStore.getState().warning(title, description, options);
  },
  info: (title: string, description?: string, options?: Partial<Toast>) => {
    return useToastStore.getState().info(title, description, options);
  },
  dismiss: (id: string) => {
    return useToastStore.getState().dismissToast(id);
  },
  clear: () => {
    return useToastStore.getState().clearAllToasts();
  },
};

export default useToastStore; 