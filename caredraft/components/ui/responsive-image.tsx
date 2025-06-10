'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  quality = 85,
  placeholder = 'empty',
  blurDataURL,
  ...props
}: ResponsiveImageProps) {
  const baseClasses = 'object-cover transition-opacity duration-300';
  const responsiveClasses = fill 
    ? '' 
    : 'w-full h-auto max-w-full sm:max-w-md md:max-w-lg lg:max-w-xl';

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt || 'Responsive image'}
        fill
        className={cn(baseClasses, className)}
        sizes={sizes}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        {...props}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt || 'Responsive image'}
      width={width}
      height={height}
      className={cn(baseClasses, responsiveClasses, className)}
      sizes={sizes}
      quality={quality}
      priority={priority}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      {...props}
    />
  );
}

// Auto-responsive wrapper for existing img tags
interface AutoResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackWidth?: number;
  fallbackHeight?: number;
}

export function AutoResponsiveImage({
  src,
  alt = '',
  className,
  fallbackWidth = 800,
  fallbackHeight = 600,
  ...props
}: AutoResponsiveImageProps) {
  if (!src) return null;

  const responsiveClasses = 'w-full h-auto max-w-full object-cover';

  return (
    <img
      src={src}
      alt={alt || 'Auto-responsive image'}
      className={cn(responsiveClasses, className)}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
}

// Higher-order component to make any image responsive
export function withResponsiveImage<T extends React.ComponentProps<'img'>>(
  Component: React.ComponentType<T>
) {
  return function ResponsiveImageWrapper(props: T) {
    const { className, ...rest } = props;
    const responsiveClasses = 'w-full h-auto max-w-full object-cover';
    
    return (
      <Component
        {...(rest as T)}
        className={cn(responsiveClasses, className)}
        loading="lazy"
        decoding="async"
      />
    );
  };
} 