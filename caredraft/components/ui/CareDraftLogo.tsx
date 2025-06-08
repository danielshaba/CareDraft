import React from 'react'

interface CareDraftLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'icon-only' | 'text-only'
  className?: string
}

const CareDraftLogo: React.FC<CareDraftLogoProps> = ({ 
  size = 'md', 
  variant = 'full',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-20'
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  }

  if (variant === 'text-only') {
    return (
      <div className={`flex items-center ${className}`}>
        <span className={`font-bold text-brand-primary ${textSizeClasses[size]}`}>
          CareDraft
        </span>
      </div>
    )
  }

  if (variant === 'icon-only') {
    return (
      <div className={`flex items-center ${className}`}>
        <svg 
          className={`${sizeClasses[size]} w-auto`}
          viewBox="0 0 48 48" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Care Hand Icon */}
          <g>
            {/* Palm */}
            <path
              d="M24 8C19.5817 8 16 11.5817 16 16V24C16 28.4183 19.5817 32 24 32C28.4183 32 32 28.4183 32 24V16C32 11.5817 28.4183 8 24 8Z"
              fill="currentColor"
              className="text-brand-primary"
            />
            {/* Fingers */}
            <rect x="20" y="6" width="2" height="8" rx="1" fill="currentColor" className="text-brand-primary" />
            <rect x="23" y="4" width="2" height="8" rx="1" fill="currentColor" className="text-brand-primary" />
            <rect x="26" y="6" width="2" height="8" rx="1" fill="currentColor" className="text-brand-primary" />
            {/* Document Lines */}
            <rect x="12" y="36" width="24" height="2" rx="1" fill="currentColor" className="text-brand-primary-dark" />
            <rect x="12" y="40" width="20" height="2" rx="1" fill="currentColor" className="text-brand-primary-dark" />
            <rect x="12" y="44" width="16" height="2" rx="1" fill="currentColor" className="text-brand-primary-dark" />
          </g>
        </svg>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <svg 
        className={`${sizeClasses[size]} w-auto`}
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Care Hand Icon */}
        <g>
          {/* Palm */}
          <path
            d="M24 8C19.5817 8 16 11.5817 16 16V24C16 28.4183 19.5817 32 24 32C28.4183 32 32 28.4183 32 24V16C32 11.5817 28.4183 8 24 8Z"
            fill="currentColor"
            className="text-brand-primary"
          />
          {/* Fingers */}
          <rect x="20" y="6" width="2" height="8" rx="1" fill="currentColor" className="text-brand-primary" />
          <rect x="23" y="4" width="2" height="8" rx="1" fill="currentColor" className="text-brand-primary" />
          <rect x="26" y="6" width="2" height="8" rx="1" fill="currentColor" className="text-brand-primary" />
          {/* Document Lines */}
          <rect x="12" y="36" width="24" height="2" rx="1" fill="currentColor" className="text-brand-primary-dark" />
          <rect x="12" y="40" width="20" height="2" rx="1" fill="currentColor" className="text-brand-primary-dark" />
          <rect x="12" y="44" width="16" height="2" rx="1" fill="currentColor" className="text-brand-primary-dark" />
        </g>
      </svg>
      <span className={`font-bold text-brand-primary ${textSizeClasses[size]}`}>
        CareDraft
      </span>
    </div>
  )
}

export default CareDraftLogo 