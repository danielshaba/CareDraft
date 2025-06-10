'use client'

import { useState } from 'react'
import { Plus, RotateCcw, Trash2, Star, StarHalf, Copy, Check, ExternalLink } from 'lucide-react'

interface IdeaCardProps {
  id: string
  title: string
  content: string
  source: 'library' | 'creative' | 'internet'
  rating?: number
  isSelected?: boolean
  complianceKeywords?: string[]
  onAddToDraft?: (id: string) => void
  onRegenerate?: (id: string) => void
  onDiscard?: (id: string) => void
  onRate?: (id: string, rating: number) => void
  onCopy?: (id: string) => void
  className?: string
}

interface GeneratedIdea {
  id: string
  title: string
  content: string
  source: 'library' | 'creative' | 'internet'
  rating: number
  complianceKeywords: string[]
  timestamp: Date
}

interface IdeaCardsProps {
  ideas: GeneratedIdea[]
  onAddToDraft?: (id: string) => void
  onRegenerate?: (id: string) => void
  onDiscard?: (id: string) => void
  onRate?: (id: string, rating: number) => void
  isLoading?: boolean
  className?: string
}

const sourceConfig = {
  library: {
    name: 'Library AI',
    color: 'bg-brand-50 text-brand-700 border-brand-200',
    iconColor: 'text-brand-600'
  },
  creative: {
    name: 'Creative AI',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    iconColor: 'text-purple-600'
  },
  internet: {
    name: 'Internet AI',
    color: 'bg-green-50 text-green-700 border-green-200',
    iconColor: 'text-green-600'
  }
}

// const _complianceTerms = [
//   'compliance', 'regulatory', 'standards', 'quality assurance', 'best practices',
//   'governance', 'policy', 'procedure', 'audit', 'certification', 'accreditation',
//   'safety', 'security', 'privacy', 'data protection', 'GDPR', 'confidentiality',
//   'risk management', 'mitigation', 'contingency', 'accountability', 'transparency'
// ]

function IdeaCard({ 
  id, 
  title, 
  content, 
  source, 
  rating = 0, 
  complianceKeywords = [],
  onAddToDraft,
  onRegenerate, 
  onDiscard,
  onRate,
  onCopy,
  className = ""
}: IdeaCardProps) {
  const [copied, setCopied] = useState(false)
  const [currentRating, setCurrentRating] = useState(rating)

  const sourceInfo = sourceConfig[source]

  // Highlight compliance keywords in content
  const highlightKeywords = (text: string, keywords: string[]) => {
    if (keywords.length === 0) return text
    
    const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi')
    const parts = text.split(keywordRegex)
    
    return parts.map((part, index) => {
      const isKeyword = keywords.some(keyword => 
        keyword.toLowerCase() === part.toLowerCase()
      )
      
      if (isKeyword) {
        return (
          <span 
            key={index}
            className="bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded text-sm font-medium"
            title="Compliance keyword"
          >
            {part}
          </span>
        )
      }
      return part
    })
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      onCopy?.(id)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const handleRating = (newRating: number) => {
    setCurrentRating(newRating)
    onRate?.(id, newRating)
  }

  const renderStars = () => {
    const stars = []
    const fullStars = Math.floor(currentRating)
    const hasHalfStar = currentRating % 1 !== 0

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <button
            key={i}
            onClick={() => handleRating(i)}
            className="text-yellow-400 hover:text-yellow-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-yellow-400 rounded"
            aria-label={`Rate ${i} stars`}
          >
            <Star className="w-4 h-4 fill-current" />
          </button>
        )
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <button
            key={i}
            onClick={() => handleRating(i)}
            className="text-yellow-400 hover:text-yellow-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-yellow-400 rounded"
            aria-label={`Rate ${i} stars`}
          >
            <StarHalf className="w-4 h-4 fill-current" />
          </button>
        )
      } else {
        stars.push(
          <button
            key={i}
            onClick={() => handleRating(i)}
            className="text-gray-300 hover:text-yellow-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-yellow-400 rounded"
            aria-label={`Rate ${i} stars`}
          >
            <Star className="w-4 h-4" />
          </button>
        )
      }
    }

    return stars
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2" style={{ fontFamily: 'var(--font-poppins)' }}>
            {title}
          </h4>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${sourceInfo.color}`}>
              {sourceInfo.name}
            </span>
            {complianceKeywords.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                {complianceKeywords.length} compliance term{complianceKeywords.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 ml-4">
          <button
            onClick={handleCopy}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
            title="Copy content"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-gray-700 text-sm leading-relaxed" style={{ fontFamily: 'var(--font-open-sans)' }}>
          {highlightKeywords(content, complianceKeywords)}
        </p>
      </div>

      {/* Rating */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 font-medium">Quality:</span>
          <div className="flex items-center gap-1">
            {renderStars()}
          </div>
          <span className="text-xs text-gray-500 ml-1">
            ({currentRating.toFixed(1)})
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onAddToDraft?.(id)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
        >
          <Plus className="w-4 h-4" />
          Add to Draft
        </button>
        
        <button
          onClick={() => onRegenerate?.(id)}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          title="Regenerate this idea"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => onDiscard?.(id)}
          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          title="Discard this idea"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function IdeaCards({ 
  ideas, 
  onAddToDraft,
  onRegenerate,
  onDiscard,
  onRate,
  isLoading = false,
  className = ""
}: IdeaCardsProps) {
  const [, setCopiedId] = useState<string | null>(null)

  const handleCopy = (id: string) => {
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Loading Skeletons */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div key={star} className="w-4 h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (ideas.length === 0) {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${className}`}>
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <ExternalLink className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
            No Ideas Generated Yet
          </h3>
          <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-open-sans)' }}>
            Enter a prompt and click &quot;Generate Ideas&quot; to see AI-powered suggestions for your tender proposal.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
            Generated Ideas
          </h3>
          <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-open-sans)' }}>
            {ideas.length} idea{ideas.length !== 1 ? 's' : ''} generated • Review and add the best ones to your draft
          </p>
        </div>
        
        {/* Sort/Filter Controls */}
        <div className="flex items-center gap-2">
          <select className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary">
            <option value="rating">Sort by Rating</option>
            <option value="source">Sort by Source</option>
            <option value="recent">Most Recent</option>
          </select>
        </div>
      </div>

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 gap-6">
        {ideas.map((idea) => (
          <IdeaCard
            key={idea.id}
            id={idea.id}
            title={idea.title}
            content={idea.content}
            source={idea.source}
            rating={idea.rating}
            complianceKeywords={idea.complianceKeywords}
            onAddToDraft={onAddToDraft}
            onRegenerate={onRegenerate}
            onDiscard={onDiscard}
            onRate={onRate}
            onCopy={handleCopy}
          />
        ))}
      </div>
    </div>
  )
} 