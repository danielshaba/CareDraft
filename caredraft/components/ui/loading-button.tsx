'use client';

import React from 'react';
import { Button } from './button';
import { LoadingSpinner } from '../LoadingSpinner';
import { cn } from '../../lib/utils';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
}

export function LoadingButton({
  isLoading = false,
  loadingText,
  variant = 'default',
  size = 'default',
  disabled,
  children,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || isLoading}
      className={cn(
        'relative',
        isLoading && 'cursor-not-allowed',
        className
      )}
      {...props}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      )}
      <span className={cn(isLoading && 'opacity-0')}>
        {isLoading && loadingText ? loadingText : children}
      </span>
    </Button>
  );
}

// Specialized loading buttons for common use cases
export function SaveButton({
  isLoading,
  ...props
}: Omit<LoadingButtonProps, 'loadingText'>) {
  return (
    <LoadingButton
      isLoading={isLoading}
      loadingText="Saving..."
      {...props}
    />
  );
}

export function SubmitButton({
  isLoading,
  ...props
}: Omit<LoadingButtonProps, 'loadingText'>) {
  return (
    <LoadingButton
      isLoading={isLoading}
      loadingText="Submitting..."
      type="submit"
      {...props}
    />
  );
}

export function DeleteButton({
  isLoading,
  ...props
}: Omit<LoadingButtonProps, 'loadingText' | 'variant'>) {
  return (
    <LoadingButton
      isLoading={isLoading}
      loadingText="Deleting..."
      variant="destructive"
      {...props}
    />
  );
}

export function LoadButton({
  isLoading,
  ...props
}: Omit<LoadingButtonProps, 'loadingText'>) {
  return (
    <LoadingButton
      isLoading={isLoading}
      loadingText="Loading..."
      {...props}
    />
  );
} 