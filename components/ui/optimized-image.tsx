'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  aspectRatio?: 'square' | '4/3' | '16/9' | '21/9' | 'auto';
  quality?: number;
  priority?: boolean;
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onError?: () => void;
}

const aspectRatioClasses = {
  square: 'aspect-square',
  '4/3': 'aspect-[4/3]',
  '16/9': 'aspect-video',
  '21/9': 'aspect-[21/9]',
  auto: 'aspect-auto',
};

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  aspectRatio = 'auto',
  quality = 80,
  priority = false,
  className,
  objectFit = 'cover',
  objectPosition = 'center',
  sizes,
  placeholder = 'empty',
  blurDataURL,
  onError,
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = useCallback(() => {
    setImageError(true);
    setIsLoading(false);
    onError?.();
  }, [onError]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  if (imageError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 dark:bg-gray-800',
          aspectRatio !== 'auto' && aspectRatioClasses[aspectRatio],
          className
        )}
        style={{ width, height }}
      >
        <div className="text-center p-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">Failed to load image</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        aspectRatio !== 'auto' && aspectRatioClasses[aspectRatio],
        isLoading && 'animate-pulse bg-gray-200 dark:bg-gray-700',
        className
      )}
      style={{ width, height }}
    >
      {/* Loading state overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
      
      <Image
        src={imageError ? '/images/placeholder.svg' : src}
        alt={alt}
        fill={!width && !height}
        width={width}
        height={height}
        quality={quality}
        priority={priority}
        sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          `object-${objectFit}`,
          objectPosition && `object-${objectPosition}`
        )}
        style={{ objectPosition }}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
}

// Preset components for common use cases
export function AvatarImage({
  src,
  alt,
  size = 40,
  className,
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      aspectRatio="square"
      objectFit="cover"
      className={cn('rounded-full', className)}
      quality={90}
    />
  );
}

export function CardImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      aspectRatio="16/9"
      objectFit="cover"
      className={className}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}

export function ThumbnailImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      aspectRatio="4/3"
      objectFit="cover"
      quality={60}
      className={className}
      sizes="(max-width: 768px) 50vw, 25vw"
    />
  );
}

export function HeroImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      priority
      objectFit="cover"
      quality={90}
      className={className}
      sizes="100vw"
    />
  );
}

// Grid component for image collections
export function ImageGrid({
  images,
  columns = 3,
  gap = 4,
  className,
}: {
  images: Array<{ src: string; alt: string; id?: string }>;
  columns?: 2 | 3 | 4;
  gap?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid',
        {
          'grid-cols-2': columns === 2,
          'grid-cols-3': columns === 3,
          'grid-cols-4': columns === 4,
        },
        `gap-${gap}`,
        className
      )}
    >
      {images.map((image, index) => (
        <ThumbnailImage
          key={image.id || index}
          src={image.src}
          alt={image.alt}
        />
      ))}
    </div>
  );
} 