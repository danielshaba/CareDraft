import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LucideIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ExtractionCategory {
  id: string
  label: string
  description: string
  icon: LucideIcon
  color: {
    background: string
    text: string
    icon: string
    hover: string
  }
}

interface SmartExtractionButtonProps {
  category: ExtractionCategory
  isLoading?: boolean
  isDisabled?: boolean
  hasResults?: boolean
  resultCount?: number
  onClick: (categoryId: string) => void
  className?: string
}

export function SmartExtractionButton({
  category,
  isLoading = false,
  isDisabled = false,
  hasResults = false,
  resultCount = 0,
  onClick,
  className
}: SmartExtractionButtonProps) {
  const { id, label, description, icon: Icon, color } = category

  const handleClick = () => {
    if (!isDisabled && !isLoading) {
      onClick(id)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={isDisabled || isLoading}
      className={cn(
        'h-auto p-4 flex flex-col items-start space-y-3 hover:shadow-md transition-all duration-200',
        color.hover,
        hasResults && 'ring-2 ring-green-200 bg-green-50',
        isLoading && 'cursor-not-allowed',
        className
      )}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          {isLoading ? (
            <Loader2 className={cn('h-5 w-5 animate-spin', color.icon)} />
          ) : (
            <Icon className={cn('h-5 w-5', color.icon)} />
          )}
          <span className={cn('font-medium text-left', color.text)}>
            {label}
          </span>
        </div>
        {hasResults && resultCount > 0 && (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {resultCount} items
          </Badge>
        )}
      </div>
      
      <p className="text-sm text-gray-600 text-left leading-relaxed">
        {description}
      </p>
      
      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Processing document...</span>
        </div>
      )}
    </Button>
  )
}

export default SmartExtractionButton 