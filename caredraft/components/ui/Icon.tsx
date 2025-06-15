'use client'

import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface IconProps {
  /** Size of the icon */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** Custom className for additional styling */
  className?: string
  /** Custom alt text for accessibility */
  alt?: string
  /** Whether to prioritize loading */
  priority?: boolean
  /** Whether the icon should be clickable */
  clickable?: boolean
}

/**
 * Official CareDraft Icon Component
 * 
 * Displays the official CareDraft teal document icon with sparkle element.
 * Perfect for use in navigation, buttons, and other UI elements.
 */
export function Icon({
  size = 'md',
  className,
  alt = 'CareDraft',
  priority = false,
  clickable = false
}: IconProps) {
  // Size mappings
  const sizeClasses = {
    xs: 'h-4 w-4', // 16x16px
    sm: 'h-5 w-5', // 20x20px
    md: 'h-6 w-6', // 24x24px
    lg: 'h-8 w-8', // 32x32px
    xl: 'h-10 w-10', // 40x40px
    '2xl': 'h-12 w-12' // 48x48px
  }

  // Pixel dimensions for Image component
  const pixelSizes = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
    '2xl': 48
  }

  const iconElement = (
    <Image
      src="/caredraft-icon.svg"
      alt={alt}
      width={pixelSizes[size]}
      height={pixelSizes[size]}
      className={cn(
        sizeClasses[size],
        'object-contain',
        clickable && 'transition-transform duration-200 hover:scale-105',
        className
      )}
      priority={priority}
      quality={100}
    />
  )

  if (clickable) {
    return (
      <div 
        className={cn(
          'inline-flex items-center justify-center cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 rounded-lg',
          'transition-all duration-200'
        )}
        role="button"
        tabIndex={0}
      >
        {iconElement}
      </div>
    )
  }

  return iconElement
}

export default Icon 