'use client'

import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  /** Size of the logo */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** Logo variant to display */
  variant?: 'full' | 'wordmark' | 'icon-only'
  /** Whether the logo should be clickable/linkable */
  clickable?: boolean
  /** Custom className for additional styling */
  className?: string
  /** Custom alt text for accessibility */
  alt?: string
  /** Whether to prioritize loading (for above-the-fold logos) */
  priority?: boolean
}

/**
 * Official CareDraft Logo Component
 * 
 * Features the official CareDraft branding with teal document icon and wordmark.
 * Supports multiple sizes and variants for different use cases.
 */
export function Logo({
  size = 'md',
  variant = 'full',
  clickable = false,
  className,
  alt = 'CareDraft - AI-Powered Care Proposal Platform',
  priority = false
}: LogoProps) {
  // Size mappings for different variants
  const sizeClasses = {
    xs: {
      full: 'h-6', // ~24px height
      wordmark: 'h-5', // ~20px height  
      icon: 'h-4 w-4' // 16x16px
    },
    sm: {
      full: 'h-8', // ~32px height
      wordmark: 'h-6', // ~24px height
      icon: 'h-6 w-6' // 24x24px
    },
    md: {
      full: 'h-10', // ~40px height
      wordmark: 'h-8', // ~32px height
      icon: 'h-8 w-8' // 32x32px
    },
    lg: {
      full: 'h-12', // ~48px height  
      wordmark: 'h-10', // ~40px height
      icon: 'h-10 w-10' // 40x40px
    },
    xl: {
      full: 'h-16', // ~64px height
      wordmark: 'h-12', // ~48px height
      icon: 'h-12 w-12' // 48x48px
    },
    '2xl': {
      full: 'h-20', // ~80px height
      wordmark: 'h-16', // ~64px height
      icon: 'h-16 w-16' // 64x64px
    }
  }

  // Get the appropriate size class
  const getSizeClass = () => {
    if (variant === 'icon-only') {
      return sizeClasses[size].icon
    } else if (variant === 'wordmark') {
      return sizeClasses[size].wordmark
    } else {
      return sizeClasses[size].full
    }
  }

  // Determine which asset to use
  const getImageSrc = () => {
    if (variant === 'icon-only') {
      return '/caredraft-icon.svg'
    } else {
      return '/caredraft-logo-official.svg'
    }
  }

  // Base logo element
  const logoElement = (
    <Image
      src={getImageSrc()}
      alt={alt}
      width={variant === 'icon-only' ? 48 : 280}
      height={variant === 'icon-only' ? 48 : 80}
      className={cn(
        getSizeClass(),
        'object-contain',
        clickable && 'transition-transform duration-200 hover:scale-105',
        className
      )}
      priority={priority}
      quality={100}
    />
  )

  // If clickable, wrap in a link-like div (actual Link should be added by parent)
  if (clickable) {
    return (
      <div 
        className={cn(
          'inline-flex items-center cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 rounded-lg',
          'transition-all duration-200'
        )}
        role="button"
        tabIndex={0}
      >
        {logoElement}
      </div>
    )
  }

  return logoElement
}

export default Logo 