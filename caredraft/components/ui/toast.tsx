'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToasts, useToastPosition, useToastActions, Toast, ToastPosition } from '@/lib/stores/toastStore';

const toastVariants = {
  success: {
    bg: 'bg-white border-green-200',
    iconBg: 'bg-green-100',
    icon: CheckCircle,
    iconColor: 'text-green-600',
    title: 'text-green-900',
    description: 'text-green-700',
    progress: 'bg-green-500'
  },
  error: {
    bg: 'bg-white border-red-200',
    iconBg: 'bg-red-100',
    icon: AlertCircle,
    iconColor: 'text-red-600',
    title: 'text-red-900',
    description: 'text-red-700',
    progress: 'bg-red-500'
  },
  warning: {
    bg: 'bg-white border-yellow-200',
    iconBg: 'bg-yellow-100',
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    title: 'text-yellow-900',
    description: 'text-yellow-700',
    progress: 'bg-yellow-500'
  },
  info: {
    bg: 'bg-white border-blue-200',
    iconBg: 'bg-blue-100',
    icon: Info,
    iconColor: 'text-blue-600',
    title: 'text-blue-900',
    description: 'text-blue-700',
    progress: 'bg-blue-500'
  },
};

const positionStyles: Record<ToastPosition, string> = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
};

const animationClasses = {
  'top-left': {
    enter: 'animate-in slide-in-from-left-full fade-in',
    exit: 'animate-out slide-out-to-left-full fade-out',
  },
  'top-right': {
    enter: 'animate-in slide-in-from-right-full fade-in',
    exit: 'animate-out slide-out-to-right-full fade-out',
  },
  'top-center': {
    enter: 'animate-in slide-in-from-top-full fade-in',
    exit: 'animate-out slide-out-to-top-full fade-out',
  },
  'bottom-left': {
    enter: 'animate-in slide-in-from-left-full fade-in',
    exit: 'animate-out slide-out-to-left-full fade-out',
  },
  'bottom-right': {
    enter: 'animate-in slide-in-from-right-full fade-in',
    exit: 'animate-out slide-out-to-right-full fade-out',
  },
  'bottom-center': {
    enter: 'animate-in slide-in-from-bottom-full fade-in',
    exit: 'animate-out slide-out-to-bottom-full fade-out',
  },
};

interface ToastItemProps {
  toast: Toast;
  position: ToastPosition;
}

function ToastItem({ toast, position }: ToastItemProps) {
  const { dismissToast } = useToastActions();
  const variant = toastVariants[toast.type];
  const Icon = variant.icon;
  const animation = animationClasses[position];

  const handleDismiss = () => {
    if (toast.dismissible) {
      dismissToast(toast.id);
    }
  };

  const handleAction = () => {
    if (toast.action) {
      toast.action.onClick();
      dismissToast(toast.id);
    }
  };

  return (
    <div
      className={cn(
        'relative flex w-full items-center space-x-4 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all duration-300',
        variant.bg,
        toast.isVisible ? animation.enter : animation.exit
      )}
      style={{
        maxWidth: '420px',
        minWidth: '300px',
      }}
    >
      {/* Icon */}
      <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full', variant.iconBg)}>
        <Icon className={cn('h-5 w-5', variant.iconColor)} />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1">
        <div className={cn('text-sm font-semibold', variant.title)}>
          {toast.title}
        </div>
        {toast.description && (
          <div className={cn('text-sm', variant.description)}>
            {toast.description}
          </div>
        )}
        
        {/* Action Button */}
        {toast.action && (
          <button
            onClick={handleAction}
            className={cn(
              'mt-2 inline-flex items-center rounded-md px-3 py-1 text-xs font-medium transition-colors',
              'bg-white/80 hover:bg-white border border-current/20 hover:border-current/30',
              variant.title
            )}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close Button */}
      {toast.dismissible && (
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Progress Bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <div
            className={cn('h-full transition-all ease-linear', variant.progress)}
            style={{
              animation: `toast-progress ${toast.duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToasts();
  const position = useToastPosition();

  useEffect(() => {
    // Add CSS for progress bar animation
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div
      className={cn(
        'pointer-events-none fixed z-[100] flex max-h-screen w-full flex-col-reverse space-y-4 space-y-reverse p-4 sm:flex-col sm:space-y-4',
        positionStyles[position]
      )}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} position={position} />
        </div>
      ))}
    </div>,
    document.body
  );
}

// Hook for easier integration
export function useToast() {
  const actions = useToastActions();
  return actions;
}

export default ToastContainer; 