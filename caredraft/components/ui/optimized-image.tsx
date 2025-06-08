'use client'

import Image from 'next/image'
import { useState, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean
  sizes?: string
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  loading?: 'lazy' | 'eager'
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string
  onLoad?: () => void
  onError?: () => void
  fallbackSrc?: string
  aspectRatio?: 'square' | '4/3' | '16/9' | '21/9' | 'auto'
  responsive?: boolean
}

export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({
    src,
    alt,
    width,
    height,
    className,
    fill = false,
    sizes,
    priority = false,
    quality = 80,
    placeholder = 'empty',
    blurDataURL,
    loading = 'lazy',
    objectFit = 'cover',
    objectPosition = 'center',
    onLoad,
    onError,
    fallbackSrc = '/images/placeholder.svg',
    aspectRatio = 'auto',
    responsive = false,
    ...props
  }, ref) => {
    const [imgSrc, setImgSrc] = useState(src)
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)

    const handleLoad = () => {
      setIsLoading(false)
      onLoad?.()
    }

    const handleError = () => {
      setHasError(true)
      setIsLoading(false)
      if (imgSrc !== fallbackSrc) {
        setImgSrc(fallbackSrc)
      }
      onError?.()
    }

    // Responsive sizes based on common breakpoints
    const responsiveSizes = responsive 
      ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
      : sizes

    // Aspect ratio classes
    const aspectRatioClasses = {
      'square': 'aspect-square',
      '4/3': 'aspect-[4/3]',
      '16/9': 'aspect-video',
      '21/9': 'aspect-[21/9]',
      'auto': ''
    }

    const imageClassName = cn(
      'transition-opacity duration-200',
      aspectRatioClasses[aspectRatio],
      {
        'opacity-0': isLoading,
        'opacity-100': !isLoading,
      },
      className
    )

    const imageProps = {
      src: imgSrc,
      alt,
      className: imageClassName,
      onLoad: handleLoad,
      onError: handleError,
      priority,
      quality,
      placeholder,
      blurDataURL,
      sizes: responsiveSizes,
      style: {
        objectFit,
        objectPosition,
      },
      ...props,
    }

    if (fill) {
      return (
        <div className={cn('relative overflow-hidden', aspectRatioClasses[aspectRatio])}>
          <Image
            fill
            {...imageProps}
            ref={ref as any}
          />
          {isLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
        </div>
      )
    }

    return (
      <div className="relative">
        <Image
          width={width}
          height={height}
          {...imageProps}
          ref={ref as any}
        />
        {isLoading && width && height && (
          <div 
            className="absolute inset-0 bg-gray-200 animate-pulse"
            style={{ width, height }}
          />
        )}
      </div>
    )
  }
)

OptimizedImage.displayName = 'OptimizedImage'

// Preset component variations for common use cases
export const AvatarImage = forwardRef<HTMLImageElement, Omit<OptimizedImageProps, 'aspectRatio'>>(
  (props, ref) => (
    <OptimizedImage
      {...props}
      aspectRatio="square"
      objectFit="cover"
      className={cn('rounded-full', props.className)}
      ref={ref}
    />
  )
)

AvatarImage.displayName = 'AvatarImage'

export const CardImage = forwardRef<HTMLImageElement, Omit<OptimizedImageProps, 'aspectRatio'>>(
  (props, ref) => (
    <OptimizedImage
      {...props}
      aspectRatio="16/9"
      objectFit="cover"
      responsive
      ref={ref}
    />
  )
)

CardImage.displayName = 'CardImage'

export const ThumbnailImage = forwardRef<HTMLImageElement, Omit<OptimizedImageProps, 'aspectRatio' | 'loading'>>(
  (props, ref) => (
    <OptimizedImage
      {...props}
      aspectRatio="4/3"
      objectFit="cover"
      loading="lazy"
      quality={60}
      ref={ref}
    />
  )
)

ThumbnailImage.displayName = 'ThumbnailImage'

export const HeroImage = forwardRef<HTMLImageElement, Omit<OptimizedImageProps, 'priority' | 'loading'>>(
  (props, ref) => (
    <OptimizedImage
      {...props}
      priority
      loading="eager"
      quality={90}
      responsive
      ref={ref}
    />
  )
)

HeroImage.displayName = 'HeroImage'

// Image grid component for galleries
interface ImageGridProps {
  images: Array<{
    src: string
    alt: string
    caption?: string
  }>
  columns?: 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ImageGrid({ 
  images, 
  columns = 3, 
  gap = 'md',
  className 
}: ImageGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  }

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }

  return (
    <div className={cn(
      'grid',
      gridCols[columns],
      gapClasses[gap],
      className
    )}>
      {images.map((image, index) => (
        <div key={index} className="group">
          <ThumbnailImage
            src={image.src}
            alt={image.alt}
            width={300}
            height={200}
            className="w-full h-auto transition-transform group-hover:scale-105"
          />
          {image.caption && (
            <p className="mt-2 text-sm text-gray-600">{image.caption}</p>
          )}
        </div>
      ))}
    </div>
  )
} 