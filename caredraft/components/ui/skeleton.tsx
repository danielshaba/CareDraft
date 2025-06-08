import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  animate?: boolean
}

// Base skeleton component
export function Skeleton({ className, animate = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gray-200 rounded',
        animate && 'animate-pulse',
        className
      )}
    />
  )
}

// Text skeleton variants
export function SkeletonText({ 
  lines = 1, 
  className = '',
  animate = true 
}: { 
  lines?: number
  className?: string
  animate?: boolean 
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            'h-4',
            index === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )}
          animate={animate}
        />
      ))}
    </div>
  )
}

// Avatar skeleton
export function SkeletonAvatar({ 
  size = 'md',
  className = '',
  animate = true 
}: { 
  size?: 'sm' | 'md' | 'lg'
  className?: string
  animate?: boolean 
}) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  }

  return (
    <Skeleton
      className={cn(
        'rounded-full',
        sizeClasses[size],
        className
      )}
      animate={animate}
    />
  )
}

// Button skeleton
export function SkeletonButton({ 
  size = 'md',
  className = '',
  animate = true 
}: { 
  size?: 'sm' | 'md' | 'lg'
  className?: string
  animate?: boolean 
}) {
  const sizeClasses = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-28'
  }

  return (
    <Skeleton
      className={cn(
        'rounded-lg',
        sizeClasses[size],
        className
      )}
      animate={animate}
    />
  )
}

// Card skeleton
export function SkeletonCard({ 
  className = '',
  animate = true,
  showAvatar = false,
  showButton = false 
}: { 
  className?: string
  animate?: boolean
  showAvatar?: boolean
  showButton?: boolean 
}) {
  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-6', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {showAvatar && <SkeletonAvatar animate={animate} />}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" animate={animate} />
              <Skeleton className="h-3 w-1/2" animate={animate} />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" animate={animate} />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" animate={animate} />
          <Skeleton className="h-4 w-5/6" animate={animate} />
          <Skeleton className="h-4 w-2/3" animate={animate} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-3 w-24" animate={animate} />
          {showButton && <SkeletonButton size="sm" animate={animate} />}
        </div>
      </div>
    </div>
  )
}

// Table skeleton
export function SkeletonTable({ 
  rows = 5,
  columns = 4,
  className = '',
  animate = true 
}: { 
  rows?: number
  columns?: number
  className?: string
  animate?: boolean 
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} className="h-5 w-full" animate={animate} />
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div 
            key={`row-${rowIndex}`}
            className="grid gap-4" 
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={`cell-${rowIndex}-${colIndex}`} 
                className="h-4 w-full" 
                animate={animate} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// List skeleton
export function SkeletonList({ 
  items = 5,
  className = '',
  animate = true,
  showAvatar = false 
}: { 
  items?: number
  className?: string
  animate?: boolean
  showAvatar?: boolean 
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3">
          {showAvatar && <SkeletonAvatar animate={animate} />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" animate={animate} />
            <Skeleton className="h-3 w-1/2" animate={animate} />
          </div>
        </div>
      ))}
    </div>
  )
}

// Form skeleton
export function SkeletonForm({ 
  fields = 4,
  className = '',
  animate = true 
}: { 
  fields?: number
  className?: string
  animate?: boolean 
}) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" animate={animate} />
          <Skeleton className="h-10 w-full rounded-lg" animate={animate} />
        </div>
      ))}
      <div className="flex space-x-3 pt-4">
        <SkeletonButton animate={animate} />
        <SkeletonButton animate={animate} />
      </div>
    </div>
  )
}

// Page skeleton for full page loading
export function SkeletonPage({ 
  className = '',
  animate = true 
}: { 
  className?: string
  animate?: boolean 
}) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" animate={animate} />
          <Skeleton className="h-4 w-96" animate={animate} />
        </div>
        <SkeletonButton size="lg" animate={animate} />
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} animate={animate} />
        ))}
      </div>
    </div>
  )
}

// Sidebar skeleton
export function SkeletonSidebar({ 
  className = '',
  animate = true 
}: { 
  className?: string
  animate?: boolean 
}) {
  return (
    <div className={cn('space-y-6 p-4', className)}>
      {/* User section */}
      <div className="flex items-center space-x-3">
        <SkeletonAvatar animate={animate} />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-24" animate={animate} />
          <Skeleton className="h-3 w-16" animate={animate} />
        </div>
      </div>

      {/* Navigation */}
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-3">
            <Skeleton className="h-5 w-5" animate={animate} />
            <Skeleton className="h-4 w-20" animate={animate} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default Skeleton 