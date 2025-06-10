'use client'

import React, { useState, useEffect } from 'react'
import { EvaluationCriteria } from '@/types/tender'
import { Slider } from '@/components/ui/slider'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EvaluationCriteriaSlidersProps {
  value: EvaluationCriteria
  onChange: (criteria: EvaluationCriteria) => void
  error?: string
  disabled?: boolean
}

interface CriteriaDefinition {
  key: keyof EvaluationCriteria
  label: string
  description: string
}

const CRITERIA_DEFINITIONS: CriteriaDefinition[] = [
  {
    key: 'quality',
    label: 'Quality',
    description: 'Service quality, standards, and care outcomes'
  },
  {
    key: 'price',
    label: 'Price',
    description: 'Cost effectiveness and value for money'
  },
  {
    key: 'socialValue',
    label: 'Social Value',
    description: 'Community benefits and social impact'
  },
  {
    key: 'experience',
    label: 'Experience',
    description: 'Track record and relevant expertise'
  }
]

export function EvaluationCriteriaSliders({
  value,
  onChange,
  error,
  disabled = false
}: EvaluationCriteriaSlidersProps) {
  const [localValues, setLocalValues] = useState<EvaluationCriteria>(value)
  const [lastChangedKey, setLastChangedKey] = useState<keyof EvaluationCriteria | null>(null)

  // Calculate total percentage
  const total = localValues.quality + localValues.price + localValues.socialValue + localValues.experience
  const isValid = total === 100
  const remaining = 100 - total

  // Update local values when prop changes
  useEffect(() => {
    setLocalValues(value)
  }, [value])

  // Auto-balance function to distribute remaining percentage
  const autoBalance = (changedKey: keyof EvaluationCriteria, newValue: number) => {
    const otherKeys = CRITERIA_DEFINITIONS
      .map(def => def.key)
      .filter(key => key !== changedKey) as (keyof EvaluationCriteria)[]
    
    const currentOtherTotal = otherKeys.reduce((sum, key) => sum + localValues[key], 0)
    const targetOtherTotal = 100 - newValue
    
    if (targetOtherTotal < 0) {
      // If new value exceeds 100%, set others to 0
      const newCriteria: EvaluationCriteria = {
        quality: 0,
        price: 0,
        socialValue: 0,
        experience: 0,
        [changedKey]: Math.min(newValue, 100)
      }
      return newCriteria
    }
    
    if (currentOtherTotal === 0) {
      // If all others are 0, distribute equally
      const equalShare = Math.floor(targetOtherTotal / otherKeys.length)
      const remainder = targetOtherTotal % otherKeys.length
      
      const newCriteria: EvaluationCriteria = {
        quality: 0,
        price: 0,
        socialValue: 0,
        experience: 0,
        [changedKey]: newValue
      }
      
      otherKeys.forEach((key, index) => {
        newCriteria[key] = equalShare + (index < remainder ? 1 : 0)
      })
      
      return newCriteria
    }
    
    // Proportionally adjust other values
    const scaleFactor = targetOtherTotal / currentOtherTotal
    const newCriteria: EvaluationCriteria = {
      ...localValues,
      [changedKey]: newValue
    }
    
    let adjustedTotal = newValue
    otherKeys.forEach(key => {
      const adjustedValue = Math.round(localValues[key] * scaleFactor)
      newCriteria[key] = Math.max(0, adjustedValue)
      adjustedTotal += newCriteria[key]
    })
    
    // Handle rounding errors
    const difference = 100 - adjustedTotal
    if (difference !== 0) {
      // Find the key with the highest value to adjust
      const maxKey = otherKeys.reduce((max, key) => 
        newCriteria[key] > newCriteria[max] ? key : max
      )
      newCriteria[maxKey] = Math.max(0, newCriteria[maxKey] + difference)
    }
    
    return newCriteria
  }

  const handleSliderChange = (key: keyof EvaluationCriteria, newValue: number) => {
    setLastChangedKey(key)
    
    // Auto-balance to maintain 100% total
    const balancedCriteria = autoBalance(key, newValue)
    setLocalValues(balancedCriteria)
    onChange(balancedCriteria)
  }

  const handleReset = () => {
    const defaultCriteria: EvaluationCriteria = {
      quality: 40,
      price: 30,
      socialValue: 20,
      experience: 10
    }
    setLocalValues(defaultCriteria)
    onChange(defaultCriteria)
    setLastChangedKey(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
            Evaluation Criteria Weightings
          </h3>
          <p className="mt-1 text-sm text-gray-500" style={{ fontFamily: 'var(--font-open-sans)' }}>
            Adjust the percentage weightings for each evaluation criterion. Total must equal 100%.
          </p>
        </div>
        
        <button
          type="button"
          onClick={handleReset}
          disabled={disabled}
          className="text-sm text-brand-500 hover:text-brand-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: 'var(--font-open-sans)' }}
        >
          Reset to Defaults
        </button>
      </div>

      {/* Total Indicator */}
      <div className={cn(
        "flex items-center justify-between p-4 rounded-lg border-2 transition-colors",
        isValid 
          ? "border-green-200 bg-green-50" 
          : "border-red-200 bg-red-50"
      )}>
        <div className="flex items-center space-x-2">
          {isValid ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <span 
            className={cn(
              "font-medium",
              isValid ? "text-green-800" : "text-red-800"
            )}
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Total: {total}%
          </span>
        </div>
        
        {!isValid && (
          <span 
            className="text-sm text-red-600"
            style={{ fontFamily: 'var(--font-open-sans)' }}
          >
            {remaining > 0 ? `${remaining}% remaining` : `${Math.abs(remaining)}% over limit`}
          </span>
        )}
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CRITERIA_DEFINITIONS.map((criteria) => (
          <Slider
            key={criteria.key}
            label={criteria.label}
            value={localValues[criteria.key]}
            onChange={(newValue) => handleSliderChange(criteria.key, newValue)}
            min={0}
            max={100}
            step={1}
            disabled={disabled}
            description={criteria.description}
            error={!isValid && lastChangedKey === criteria.key ? 'Adjust to balance total' : undefined}
            className={cn(
              "transition-all duration-200",
              lastChangedKey === criteria.key && "ring-2 ring-brand-500/20 rounded-lg p-3 -m-3"
            )}
          />
        ))}
      </div>

      {/* Global Error */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm" style={{ fontFamily: 'var(--font-open-sans)' }}>
            {error}
          </span>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-brand-800 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
          How it works:
        </h4>
        <ul className="text-xs text-brand-700 space-y-1" style={{ fontFamily: 'var(--font-open-sans)' }}>
          <li>• When you adjust one slider, the others automatically rebalance to maintain 100% total</li>
          <li>• The system proportionally adjusts other criteria based on their current values</li>
          <li>• Use "Reset to Defaults" to return to recommended weightings (Quality 40%, Price 30%, Social Value 20%, Experience 10%)</li>
        </ul>
      </div>
    </div>
  )
} 