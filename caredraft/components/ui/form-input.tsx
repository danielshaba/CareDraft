'use client'

import React from 'react'
import { cn } from '@/lib/utils'

// Base Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  description?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, description, type, ...props }, ref) => {
    const id = props.id || `input-${Math.random().toString(36).substr(2, 9)}`
    
    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={id}
            className="block text-sm font-medium text-gray-700"
            style={{ fontFamily: 'var(--font-open-sans)' }}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <input
          type={type}
          id={id}
          className={cn(
            "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
            "placeholder:text-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          ref={ref}
          {...props}
        />
        
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
Input.displayName = 'Input'

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  description?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, description, options, placeholder, ...props }, ref) => {
    const id = props.id || `select-${Math.random().toString(36).substr(2, 9)}`
    
    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={id}
            className="block text-sm font-medium text-gray-700"
            style={{ fontFamily: 'var(--font-open-sans)' }}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <select
          id={id}
          className={cn(
            "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
            "focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          ref={ref}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
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
Select.displayName = 'Select'

// Currency Input Component
interface CurrencyInputProps extends Omit<InputProps, 'type'> {
  currency?: string
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ currency = 'GBP', ...props }, ref) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/[^\d.]/g, '')
      const numericValue = value ? parseFloat(value) : ''
      e.target.value = numericValue.toString()
      if (props.onChange) {
        props.onChange(e)
      }
    }

    return (
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
          £
        </div>
        <Input
          {...props}
          type="text"
          className={cn("pl-8", props.className)}
          onChange={handleInputChange}
          placeholder="0.00"
          ref={ref}
        />
      </div>
    )
  }
)
CurrencyInput.displayName = 'CurrencyInput'

// Date Input Component
interface DateInputProps extends Omit<InputProps, 'type'> {
  min?: string | number
  max?: string | number
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ min, max, ...props }, ref) => {
    // Filter out any non-string min/max values that might come from React Hook Form
    const dateProps = {
      ...props,
      type: 'date' as const,
      min: typeof min === 'string' ? min : undefined,
      max: typeof max === 'string' ? max : undefined,
    }
    
    return (
      <Input
        {...dateProps}
        ref={ref}
      />
    )
  }
)
DateInput.displayName = 'DateInput'

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  required?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, required, className, ...props }, ref) => {
    const id = React.useId()
    
    return (
      <div className="space-y-1">
        {label && (
          <label 
            htmlFor={id} 
            className="block text-sm font-medium text-gray-900"
            style={{ fontFamily: 'var(--font-open-sans)' }}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          id={id}
          ref={ref}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
            "placeholder:text-gray-500 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors duration-200",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600" style={{ fontFamily: 'var(--font-open-sans)' }}>
            {error}
          </p>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea' 