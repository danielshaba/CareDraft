import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'white'
  className?: string
  label?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  color = 'primary', 
  className = '',
  label = 'Loading...'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4'
  }

  const colorClasses = {
    primary: 'border-blue-600 border-t-transparent',
    secondary: 'border-gray-600 border-t-transparent', 
    white: 'border-white border-t-transparent'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
        role="status"
        aria-label={label}
      />
      {label && (
        <span className="sr-only">{label}</span>
      )}
    </div>
  )
}

// Fullscreen loading component for page-level loading
export function FullscreenLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  )
}

// Centered loading component for section-level loading
export function CenteredLoader({ 
  message = 'Loading...',
  className = 'min-h-[200px]' 
}: { 
  message?: string
  className?: string 
}) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <LoadingSpinner size="md" />
      <p className="mt-2 text-sm text-gray-500">{message}</p>
    </div>
  )
}

// Inline loading component for button states
export function InlineLoader({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return <LoadingSpinner size={size} className="mr-2" />
} 