'use client'

import React from 'react'
import { CheckCircle2, Circle, Clock, TrendingUp, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ComplianceStatsProps {
  stats: {
    total: number
    completed: number
    completionPercentage: number
    autoItems?: number
    manualItems?: number
  }
  className?: string
}

export function ComplianceStats({ stats, className = '' }: ComplianceStatsProps) {
  const { total, completed, completionPercentage, autoItems = 0, manualItems = 0 } = stats
  const pending = total - completed

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCompletionBadgeVariant = (percentage: number) => {
    if (percentage >= 90) return 'default' // Green
    if (percentage >= 70) return 'secondary' // Yellow
    return 'destructive' // Red
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Compliance Overview
          </h3>
          <Badge 
            variant={getCompletionBadgeVariant(completionPercentage)}
            className="text-sm font-medium"
          >
            {completionPercentage}% Complete
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className={`font-medium ${getCompletionColor(completionPercentage)}`}>
              {completed} of {total} requirements
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                completionPercentage >= 90 ? 'bg-green-500' :
                completionPercentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(completionPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Completed Items */}
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="flex-shrink-0">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{completed}</p>
              <p className="text-sm text-green-600">Completed</p>
            </div>
          </div>

          {/* Pending Items */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
              <Circle className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-700">{pending}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </div>

        {/* Source Breakdown */}
        {(autoItems > 0 || manualItems > 0) && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Source Breakdown</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">AI Extracted</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {autoItems} items
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-sm text-gray-600">Manual</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {manualItems} items
              </Badge>
            </div>
          </div>
        )}

        {/* Status Indicators */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              {completionPercentage >= 90 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">Excellent Progress</span>
                </>
              ) : completionPercentage >= 70 ? (
                <>
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-yellow-600 font-medium">Good Progress</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-red-600 font-medium">Needs Attention</span>
                </>
              )}
            </div>
            
            {total === 0 && (
              <span className="text-xs text-gray-500">
                No requirements added yet
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default ComplianceStats 