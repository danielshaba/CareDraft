'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, AlertCircle, CheckCircle, Zap } from 'lucide-react'

interface GenerateButtonProps {
  onGenerate: () => Promise<void>
  disabled?: boolean
  isLoading?: boolean
  selectedSources?: string[]
  promptLength?: number
  className?: string
}

type GenerationState = 'idle' | 'generating' | 'success' | 'error'

const loadingMessages = [
  "Analyzing your prompt...",
  "Consulting AI sources...", 
  "Generating creative ideas...",
  "Refining suggestions...",
  "Almost ready..."
]

const sourceMessages: Record<string, string> = {
  'library': 'Searching your tender library...',
  'creative': 'Generating creative insights...',
  'internet': 'Researching latest trends...'
}

export default function GenerateButton({ 
  onGenerate, 
  disabled = false, 
  isLoading = false,
  selectedSources = [],
  promptLength = 0,
  className = ""
}: GenerateButtonProps) {
  const [generationState, setGenerationState] = useState<GenerationState>('idle')
  const [currentMessage, setCurrentMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Loading message rotation
  useEffect(() => {
    if (!isLoading) {
      setProgress(0)
      setCurrentMessage('')
      return
    }

    setGenerationState('generating')
    let messageIndex = 0
    let progressValue = 0

    // Initial message based on selected sources
    if (selectedSources.length > 0) {
      const sourceKey = selectedSources[0] as keyof typeof sourceMessages
      setCurrentMessage(sourceMessages[sourceKey] || loadingMessages[0])
    } else {
      setCurrentMessage(loadingMessages[0])
    }

    const interval = setInterval(() => {
      progressValue += Math.random() * 15 + 5 // Random progress increment
      setProgress(Math.min(progressValue, 95)) // Cap at 95% until completion

      if (progressValue > 20 && messageIndex < loadingMessages.length - 1) {
        messageIndex++
        setCurrentMessage(loadingMessages[messageIndex])
      }
    }, 1500)

    return () => clearInterval(interval)
  }, [isLoading, selectedSources])

  // Reset states when loading completes
  useEffect(() => {
    if (!isLoading && generationState === 'generating') {
      setProgress(100)
      setGenerationState('success')
      setCurrentMessage('Ideas generated successfully!')
      
      // Reset to idle after success message
      const timeout = setTimeout(() => {
        setGenerationState('idle')
        setCurrentMessage('')
        setProgress(0)
      }, 2000)

      return () => clearTimeout(timeout)
    }
    
    // Return empty cleanup function for other code paths
    return () => {}
  }, [isLoading, generationState])

  const handleGenerate = async () => {
    setError(null)
    setGenerationState('generating')
    
    try {
      await onGenerate()
    } catch (err) {
      setGenerationState('error')
      setError(err instanceof Error ? err.message : 'Failed to generate ideas')
      setCurrentMessage('Generation failed')
    }
  }

  const isButtonDisabled = disabled || isLoading || promptLength === 0 || selectedSources.length === 0

  const getButtonContent = () => {
    switch (generationState) {
      case 'generating':
        return (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating...</span>
          </div>
        )
      case 'success':
        return (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Generated!</span>
          </div>
        )
      case 'error':
        return (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>Try Again</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Generate Ideas</span>
          </div>
        )
    }
  }

  const getButtonStyles = () => {
    if (isButtonDisabled) {
      return 'bg-gray-100 text-gray-400 cursor-not-allowed'
    }
    
    switch (generationState) {
      case 'generating':
        return 'bg-brand-500 text-white cursor-wait'
      case 'success':
        return 'bg-green-500 text-white'
      case 'error':
        return 'bg-red-500 text-white hover:bg-red-600'
      default:
        return 'bg-brand-primary text-white hover:bg-brand-primary/90'
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isButtonDisabled}
        className={`
          w-full px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary/50
          ${getButtonStyles()}
        `}
      >
        {getButtonContent()}
      </button>

      {/* Progress Bar and Status Message */}
      {(isLoading || generationState !== 'idle') && (
        <div className="space-y-2">
          {/* Progress Bar */}
          {generationState === 'generating' && (
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-brand-primary to-brand-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Status Message */}
          <div className="flex items-center justify-center gap-2">
            {generationState === 'generating' && (
              <Sparkles className="w-3 h-3 text-brand-primary animate-pulse" />
            )}
            <p className={`text-xs font-medium ${
              generationState === 'error' 
                ? 'text-red-600' 
                : generationState === 'success'
                ? 'text-green-600'
                : 'text-gray-600'
            }`}>
              {currentMessage}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && generationState === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Generation Failed</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Generation Requirements */}
      {promptLength === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-amber-700">
              Please enter a prompt to generate ideas
            </p>
          </div>
        </div>
      )}

      {selectedSources.length === 0 && promptLength > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-amber-700">
              Please select at least one AI source
            </p>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {!isLoading && generationState === 'idle' && promptLength > 0 && selectedSources.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{selectedSources.length} source{selectedSources.length !== 1 ? 's' : ''} selected</span>
          <span>{promptLength} characters</span>
        </div>
      )}
    </div>
  )
} 