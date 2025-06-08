'use client'

import React from 'react'
import { Database, Sparkles, Globe } from 'lucide-react'

export type AISource = 'library' | 'creative' | 'internet'

interface AISourceConfig {
  id: AISource
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  available: boolean
}

const AI_SOURCES: AISourceConfig[] = [
  {
    id: 'library',
    name: 'Library AI',
    description: 'Uses your existing tender library and successful proposals',
    icon: Database,
    color: 'blue',
    available: true
  },
  {
    id: 'creative',
    name: 'Creative AI',
    description: 'Generates innovative ideas and creative approaches',
    icon: Sparkles,
    color: 'purple',
    available: true
  },
  {
    id: 'internet',
    name: 'Internet AI',
    description: 'Incorporates latest industry trends and best practices',
    icon: Globe,
    color: 'green',
    available: true
  }
]

interface AISourceSelectorProps {
  selectedSources: AISource[]
  onChange: (sources: AISource[]) => void
  disabled?: boolean
}

export function AISourceSelector({ 
  selectedSources, 
  onChange, 
  disabled = false 
}: AISourceSelectorProps) {
  
  const toggleSource = (sourceId: AISource) => {
    if (disabled) return
    
    if (selectedSources.includes(sourceId)) {
      onChange(selectedSources.filter(id => id !== sourceId))
    } else {
      onChange([...selectedSources, sourceId])
    }
  }

  const getColorClasses = (color: string, isSelected: boolean) => {
    if (isSelected) {
      switch (color) {
        case 'blue':
          return 'bg-blue-50 border-blue-200 text-blue-900'
        case 'purple':
          return 'bg-purple-50 border-purple-200 text-purple-900'
        case 'green':
          return 'bg-green-50 border-green-200 text-green-900'
        default:
          return 'bg-brand-primary-light border-brand-primary text-brand-primary-dark'
      }
    }
    return 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
  }

  const getIconColorClasses = (color: string, isSelected: boolean) => {
    if (isSelected) {
      switch (color) {
        case 'blue':
          return 'text-blue-600'
        case 'purple':
          return 'text-purple-600'
        case 'green':
          return 'text-green-600'
        default:
          return 'text-brand-primary'
      }
    }
    return 'text-gray-500'
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900" style={{ fontFamily: 'var(--font-open-sans)' }}>
          AI Sources
        </h3>
        <span className="text-xs text-gray-500">
          {selectedSources.length} selected
        </span>
      </div>
      
      <p className="text-xs text-gray-600" style={{ fontFamily: 'var(--font-open-sans)' }}>
        Select which AI sources to use for idea generation. You can choose multiple sources.
      </p>

      <div className="grid grid-cols-1 gap-3">
        {AI_SOURCES.map((source) => {
          const isSelected = selectedSources.includes(source.id)
          const isAvailable = source.available && !disabled
          const IconComponent = source.icon

          return (
            <button
              key={source.id}
              onClick={() => toggleSource(source.id)}
              disabled={!isAvailable}
              className={`
                w-full p-4 rounded-lg border-2 text-left transition-all duration-200
                ${getColorClasses(source.color, isSelected)}
                ${!isAvailable 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer hover:shadow-sm'
                }
                ${isSelected 
                  ? 'ring-2 ring-offset-2 ring-brand-primary' 
                  : 'hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 mt-0.5 ${getIconColorClasses(source.color, isSelected)}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium" style={{ fontFamily: 'var(--font-open-sans)' }}>
                      {source.name}
                    </h4>
                    
                    {/* Toggle Switch */}
                    <div className={`
                      relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                      ${isSelected 
                        ? source.color === 'blue' 
                          ? 'bg-blue-500' 
                          : source.color === 'purple' 
                          ? 'bg-purple-500' 
                          : source.color === 'green' 
                          ? 'bg-green-500' 
                          : 'bg-brand-primary-light0'
                        : 'bg-gray-300'
                      }
                    `}>
                      <span
                        className={`
                          inline-block h-3 w-3 transform rounded-full bg-white transition-transform
                          ${isSelected ? 'translate-x-5' : 'translate-x-1'}
                        `}
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs mt-1 opacity-80" style={{ fontFamily: 'var(--font-open-sans)' }}>
                    {source.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {selectedSources.length === 0 && (
        <div className="text-center py-3">
          <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-open-sans)' }}>
            Select at least one AI source to generate ideas
          </p>
        </div>
      )}

      {selectedSources.length > 0 && (
        <div className="bg-brand-primary-light border border-brand-primary rounded-md p-3">
          <p className="text-xs text-brand-primary-dark" style={{ fontFamily: 'var(--font-open-sans)' }}>
            <span className="font-medium">Selected:</span> {selectedSources.map(id => 
              AI_SOURCES.find(s => s.id === id)?.name
            ).join(', ')}
          </p>
        </div>
      )}
    </div>
  )
} 