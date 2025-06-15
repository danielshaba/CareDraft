'use client'

import React from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export interface CreateProposalButtonProps {
  variant?: 'floating' | 'inline' | 'responsive'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  href?: string
  disabled?: boolean
}

/**
 * Create Proposal Button Component
 * 
 * Features:
 * - Responsive design: floating on mobile, inline on desktop
 * - CareDraft brand colors: Accessible Teal (#2A6F6F) primary with Darker Teal (#1F4949) accents
 * - Full accessibility support with keyboard navigation
 * - Multiple variants and sizes
 * - Next.js Link integration for navigation
 */
export const CreateProposalButton: React.FC<CreateProposalButtonProps> = ({
  variant = 'responsive',
  size = 'md',
  className = '',
  onClick,
  href = '/proposals/create/upload',
  disabled = false
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      inline: 'px-3 py-1.5 text-sm',
      floating: 'h-12 w-12',
      icon: 'h-4 w-4'
    },
    md: {
      inline: 'px-4 py-2 text-sm',
      floating: 'h-14 w-14',
      icon: 'h-5 w-5'
    },
    lg: {
      inline: 'px-6 py-3 text-base',
      floating: 'h-16 w-16',
      icon: 'h-6 w-6'
    }
  }

  // Base styles
  const baseStyles = `
    inline-flex items-center justify-center
    font-medium rounded-lg
    bg-brand-500 hover:bg-brand-600 
    text-white
    border border-transparent
    shadow-lg hover:shadow-xl
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-500
    group
  `

  // Variant-specific styles
  const variantStyles = {
    inline: `${sizeConfig[size].inline} ${baseStyles}`,
    floating: `
      ${sizeConfig[size].floating} ${baseStyles}
      fixed bottom-6 right-6 z-50 rounded-full
      hover:scale-105 active:scale-95
      md:hidden
    `,
    responsive: {
      inline: `${sizeConfig[size].inline} ${baseStyles} hidden md:inline-flex`,
      floating: `
        ${sizeConfig[size].floating} ${baseStyles}
        fixed bottom-6 right-6 z-50 rounded-full
        hover:scale-105 active:scale-95
        md:hidden
      `
    }
  }

  // Content for the button
  const buttonContent = (
    <>
      <Plus 
        className={`${sizeConfig[size].icon} ${variant === 'floating' || variant === 'responsive' ? '' : 'mr-2'}`}
        aria-hidden="true" 
      />
      {(variant === 'inline' || (variant === 'responsive')) && (
        <span className="hidden md:inline" style={{ fontFamily: 'var(--font-open-sans)' }}>
          Create New Proposal
        </span>
      )}
    </>
  )

  const handleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (disabled) {
      e.preventDefault()
      return
    }
    if (onClick) {
      onClick()
    }
  }

  // If href is provided, use Link component
  if (href && !disabled) {
    return (
      <>
        {variant === 'responsive' ? (
          <>
            {/* Inline version for desktop */}
            <Link
              href={href}
              className={`${variantStyles.responsive.inline} ${className}`}
              onClick={handleClick}
              aria-label="Create new proposal"
            >
              {buttonContent}
            </Link>
            {/* Floating version for mobile */}
            <Link
              href={href}
              className={`${variantStyles.responsive.floating} ${className}`}
              onClick={handleClick}
              aria-label="Create new proposal"
            >
              <Plus className={sizeConfig[size].icon} aria-hidden="true" />
            </Link>
          </>
        ) : (
          <Link
            href={href}
            className={`${variantStyles[variant]} ${className}`}
            onClick={handleClick}
            aria-label={variant === 'floating' ? 'Create new proposal' : undefined}
          >
            {buttonContent}
          </Link>
        )}
      </>
    )
  }

  // Button version (no navigation)
  return (
    <>
      {variant === 'responsive' ? (
        <>
          {/* Inline version for desktop */}
          <button
            type="button"
            className={`${variantStyles.responsive.inline} ${className}`}
            onClick={handleClick}
            disabled={disabled}
            aria-label="Create new proposal"
          >
            {buttonContent}
          </button>
          {/* Floating version for mobile */}
          <button
            type="button"
            className={`${variantStyles.responsive.floating} ${className}`}
            onClick={handleClick}
            disabled={disabled}
            aria-label="Create new proposal"
          >
            <Plus className={sizeConfig[size].icon} aria-hidden="true" />
          </button>
        </>
      ) : (
        <button
          type="button"
          className={`${variantStyles[variant]} ${className}`}
          onClick={handleClick}
          disabled={disabled}
          aria-label={variant === 'floating' ? 'Create new proposal' : undefined}
        >
          {buttonContent}
        </button>
      )}
    </>
  )
}

export default CreateProposalButton 