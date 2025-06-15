'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Settings,
} from 'lucide-react'
import { useFactCheck } from './FactCheckProvider'

interface FactCheckOverlayProps {
  isVisible: boolean
  position: { x: number; y: number }
  selectedText: string
  onClose: () => void
  onApplyChanges?: (changes: string) => void
}

const FactCheckOverlay: React.FC<FactCheckOverlayProps> = ({
  isVisible,
  position,
  selectedText,
  onClose,
  onApplyChanges
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState<'verify' | 'sources' | 'settings'>('verify')
  const [showAllSources, setShowAllSources] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  
  const {
    isLoading,
    currentFactCheck,
    activeSources,
    selectedAISource,
    selectedWordLimit,
    selectedCitationStyle,
    performFactCheck,
    updateAISource,
    updateWordLimit,
    updateCitationStyle,
    clearFactCheck
  } = useFactCheck()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVisible, onClose])

  const handleFactCheck = async () => {
    try {
      await performFactCheck({
        text: selectedText,
        ai_source: selectedAISource,
        word_limit: selectedWordLimit,
        citation_style: selectedCitationStyle
      })
    } catch (error) {
      console.error('Fact check failed:', error)
    }
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high': return CheckCircle
      case 'medium': return AlertTriangle
      case 'low': return X
      default: return Info
    }
  }

  const handleCopyResult = () => {
    if (currentFactCheck?.expanded_content) {
      navigator.clipboard.writeText(currentFactCheck.expanded_content)
    }
  }

  const handleApplyChanges = () => {
    if (currentFactCheck?.expanded_content && onApplyChanges) {
      onApplyChanges(currentFactCheck.expanded_content)
      onClose()
    }
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 max-w-md w-96"
        style={{
          left: Math.min(position.x, window.innerWidth - 400),
          top: Math.min(position.y + 20, window.innerHeight - 500)
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-brand-600" />
            <h3 className="font-semibold text-gray-900">Fact Check Panel</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="p-4">
            {/* Selected Text Preview */}
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <div className="text-xs text-gray-500 mb-1">Selected Text:</div>
              <div className="text-sm text-gray-700 line-clamp-3">
                "{selectedText}"
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-4">
              {[
                { id: 'verify', label: 'Verify', icon: CheckCircle },
                { id: 'sources', label: 'Sources', icon: Info },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-brand-500 text-brand-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'verify' && (
              <div className="space-y-4">
                {!currentFactCheck && !isLoading && (
                  <div className="text-center py-6">
                    <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-4">
                      Click "Start Fact Check" to verify the selected text
                    </p>
                    <button
                      onClick={handleFactCheck}
                      disabled={isLoading}
                      className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50"
                    >
                      Start Fact Check
                    </button>
                  </div>
                )}

                {isLoading && (
                  <div className="text-center py-6">
                    <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Verifying information...</p>
                  </div>
                )}

                {currentFactCheck && (
                  <div className="space-y-4">
                    {/* Confidence Score */}
                    <div className={`p-3 rounded-md ${getConfidenceColor(currentFactCheck.confidence_score)}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {React.createElement(getConfidenceIcon(currentFactCheck.confidence_score), {
                          className: "w-5 h-5"
                        })}
                        <span className="font-medium capitalize">
                          {currentFactCheck.confidence_score} Confidence
                        </span>
                        {currentFactCheck.confidence_percentage && (
                          <span className="text-sm">
                            ({currentFactCheck.confidence_percentage}%)
                          </span>
                        )}
                      </div>
                      <p className="text-sm">
                        {currentFactCheck.is_verified 
                          ? "Information appears to be accurate based on available sources."
                          : "Some information may need verification or additional context."
                        }
                      </p>
                    </div>

                    {/* Enhanced Content */}
                    {currentFactCheck.expanded_content && (
                      <div className="border border-gray-200 rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">Enhanced Content</h4>
                          <div className="flex gap-1">
                            <button
                              onClick={handleCopyResult}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Copy to clipboard"
                            >
                              <Clipboard className="w-4 h-4 text-gray-500" />
                            </button>
                            {onApplyChanges && (
                              <button
                                onClick={handleApplyChanges}
                                className="px-2 py-1 text-xs bg-brand-600 text-white rounded hover:bg-brand-700"
                              >
                                Apply
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {currentFactCheck.expanded_content}
                        </div>
                      </div>
                    )}

                    {/* Citations */}
                    {currentFactCheck.citations && (
                      <div className="border border-gray-200 rounded-md p-3">
                        <h4 className="font-medium text-gray-900 mb-2">Citations</h4>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {currentFactCheck.citations}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sources' && (
              <div className="space-y-4">
                {activeSources.length === 0 ? (
                  <div className="text-center py-6">
                    <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      No sources available. Perform a fact check to see sources.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeSources.slice(0, showAllSources ? activeSources.length : 3).map((source) => (
                      <div key={source.id} className="border border-gray-200 rounded-md p-3">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 text-sm">{source.title}</h4>
                          {source.reliability_score && (
                            <span className="text-xs text-gray-500">
                              {Math.round(source.reliability_score * 100)}% reliable
                            </span>
                          )}
                        </div>
                        {source.author && (
                          <p className="text-xs text-gray-600 mb-1">By: {source.author}</p>
                        )}
                        {source.relevant_excerpt && (
                          <p className="text-sm text-gray-700 mb-2">"{source.relevant_excerpt}"</p>
                        )}
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-600 hover:underline"
                          >
                            View Source →
                          </a>
                        )}
                      </div>
                    ))}
                    
                    {activeSources.length > 3 && (
                      <button
                        onClick={() => setShowAllSources(!showAllSources)}
                        className="w-full text-sm text-brand-600 hover:underline"
                      >
                        {showAllSources ? 'Show Less' : `Show ${activeSources.length - 3} More Sources`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                {/* AI Source Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Source
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['library', 'creative', 'internet'].map((source) => (
                      <button
                        key={source}
                        onClick={() => updateAISource(source as any)}
                        className={`px-3 py-2 text-xs rounded-md border transition-colors ${
                          selectedAISource === source
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {source.charAt(0).toUpperCase() + source.slice(1)} AI
                      </button>
                    ))}
                  </div>
                </div>

                {/* Word Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Response Length
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[50, 100, 200].map((limit) => (
                      <button
                        key={limit}
                        onClick={() => updateWordLimit(limit as any)}
                        className={`px-3 py-2 text-xs rounded-md border transition-colors ${
                          selectedWordLimit === limit
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {limit} words
                      </button>
                    ))}
                  </div>
                </div>

                {/* Citation Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Citation Style
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['apa', 'mla', 'chicago'].map((style) => (
                      <button
                        key={style}
                        onClick={() => updateCitationStyle(style as any)}
                        className={`px-3 py-2 text-xs rounded-md border transition-colors ${
                          selectedCitationStyle === style
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {style.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={clearFactCheck}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Clear Results
                  </button>
                  <button
                    onClick={handleFactCheck}
                    disabled={isLoading}
                    className="flex-1 px-3 py-2 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying...' : 'Re-check'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default FactCheckOverlay 