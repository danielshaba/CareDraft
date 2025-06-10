'use client'

import React, { useState, useCallback } from 'react'
import Image, { ImageProps } from 'next/image'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string
  showLoading?: boolean
  loadingClassName?: string
  errorClassName?: string
  containerClassName?: string
  onLoadComplete?: () => void
  onLoadError?: (error: Error) => void
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/images/placeholder.svg',
  showLoading = true,
  loadingClassName,
  errorClassName,
  containerClassName,
  className,
  onLoadComplete,
  onLoadError,
  priority = false,
  quality = 90,
  placeholder = 'blur',
  blurDataURL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPg==',
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
    onLoadComplete?.()
  }, [onLoadComplete])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
    
    // Try fallback if main image fails and we haven't tried fallback yet
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
      setIsLoading(true)
      setHasError(false)
    } else {
      const error = new Error(`Failed to load image: ${src}`)
      onLoadError?.(error)
    }
  }, [src, fallbackSrc, currentSrc, onLoadError])

  return (
    <div className={cn('relative', containerClassName)}>
      {/* Loading State */}
      {isLoading && showLoading && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center bg-gray-100',
            'rounded-md animate-pulse',
            loadingClassName
          )}
        >
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      )}

      {/* Error State */}
      {hasError && currentSrc === fallbackSrc && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center bg-gray-100',
            'rounded-md text-gray-500 text-sm',
            errorClassName
          )}
        >
          <span>Failed to load image</span>
        </div>
      )}

      {/* Optimized Image */}
      <Image
        {...props}
        src={currentSrc}
        alt={alt || 'Optimized image'}
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          hasError && currentSrc === fallbackSrc ? 'opacity-0' : '',
          className
        )}
        // Performance optimizations
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    </div>
  )
}

// Avatar component with optimized loading
interface OptimizedAvatarProps {
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fallback?: string
  className?: string
}

export function OptimizedAvatar({
  src,
  alt,
  size = 'md',
  fallback,
  className,
}: OptimizedAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  }

  const fallbackInitials = fallback || alt.charAt(0).toUpperCase()

  if (!src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-brand-100 text-brand-600 font-medium',
          sizeClasses[size],
          className
        )}
      >
        {fallbackInitials}
      </div>
    )
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64}
      height={size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64}
      className={cn('rounded-full object-cover', sizeClasses[size], className)}
      containerClassName="relative"
      fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&background=eaf7f7&color=2a6f6f&size=128`}
      priority={false}
      quality={85}
    />
  )
}

// Logo component with brand-specific optimizations
interface OptimizedLogoProps {
  variant?: 'full' | 'icon' | 'text'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function OptimizedLogo({
  variant = 'full',
  size = 'md',
  className,
}: OptimizedLogoProps) {
  const sizeClasses = {
    sm: variant === 'icon' ? 'h-6 w-6' : 'h-6',
    md: variant === 'icon' ? 'h-8 w-8' : 'h-8',
    lg: variant === 'icon' ? 'h-12 w-12' : 'h-12',
  }

  if (variant === 'text') {
    return (
      <span
        className={cn(
          'font-bold text-brand-600',
          size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl',
          className
        )}
      >
        CareDraft
      </span>
    )
  }

  return (
    <OptimizedImage
      src="/caredraft-logo.svg"
      alt="CareDraft Logo"
      width={variant === 'icon' ? (size === 'sm' ? 24 : size === 'md' ? 32 : 48) : undefined}
      height={variant === 'icon' ? (size === 'sm' ? 24 : size === 'md' ? 32 : 48) : undefined}
      className={cn(sizeClasses[size], className)}
      priority={true}
      quality={100}
      fallbackSrc="/favicon.ico"
    />
  )
} 