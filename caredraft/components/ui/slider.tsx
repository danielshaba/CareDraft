'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface SliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  error?: string
  description?: string
  showPercentage?: boolean
  className?: string
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ 
    label, 
    value, 
    onChange, 
    min = 0, 
    max = 100, 
    step = 1, 
    disabled = false,
    error,
    description,
    showPercentage = true,
    className,
    ...props 
  }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value, 10)
      onChange(newValue)
    }

    const percentage = ((value - min) / (max - min)) * 100

    return (
      <div className={cn("space-y-3", className)}>
        {/* Label and Value */}
        <div className="flex items-center justify-between">
          <label 
            className="block text-sm font-medium text-gray-700"
            style={{ fontFamily: 'var(--font-open-sans)' }}
          >
            {label}
          </label>
          {showPercentage && (
            <span 
              className={cn(
                "text-sm font-semibold",
                error ? "text-red-600" : "text-brand-primary"
              )}
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              {value}%
            </span>
          )}
        </div>

        {/* Slider Track and Thumb */}
        <div className="relative">
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className={cn(
              "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer",
              "focus:outline-none focus:ring-2 focus:ring-brand-primary/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "[&::-webkit-slider-thumb]:appearance-none",
              "[&::-webkit-slider-thumb]:h-5",
              "[&::-webkit-slider-thumb]:w-5",
              "[&::-webkit-slider-thumb]:rounded-full",
              "[&::-webkit-slider-thumb]:bg-brand-primary",
              "[&::-webkit-slider-thumb]:cursor-pointer",
              "[&::-webkit-slider-thumb]:border-2",
              "[&::-webkit-slider-thumb]:border-white",
              "[&::-webkit-slider-thumb]:shadow-md",
              "[&::-webkit-slider-thumb]:hover:bg-brand-primary-dark",
              "[&::-webkit-slider-thumb]:transition-colors",
              "[&::-moz-range-thumb]:h-5",
              "[&::-moz-range-thumb]:w-5",
              "[&::-moz-range-thumb]:rounded-full",
              "[&::-moz-range-thumb]:bg-brand-primary",
              "[&::-moz-range-thumb]:cursor-pointer",
              "[&::-moz-range-thumb]:border-2",
              "[&::-moz-range-thumb]:border-white",
              "[&::-moz-range-thumb]:shadow-md",
              "[&::-moz-range-thumb]:hover:bg-brand-primary-dark",
              "[&::-moz-range-thumb]:transition-colors",
              error && "[&::-webkit-slider-thumb]:bg-red-600 [&::-moz-range-thumb]:bg-red-600"
            )}
            {...props}
          />
          
          {/* Progress Fill */}
          <div 
            className={cn(
              "absolute top-0 left-0 h-2 rounded-lg transition-all duration-200",
              error ? "bg-red-500" : "bg-brand-primary-light0"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Description or Error */}
        {description && !error && (
          <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-open-sans)' }}>
            {description}
          </p>
        )}
        
        {error && (
          <p className="text-xs text-red-600" style={{ fontFamily: 'var(--font-open-sans)' }}>
            {error}
          </p>
        )}
      </div>
    )
  }
)

Slider.displayName = 'Slider' 