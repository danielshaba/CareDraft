'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, MessageCircle, Target, Users, Lightbulb, FileText, Clock } from 'lucide-react'

interface PromptTemplate {
  id: string
  title: string
  category: string
  icon: React.ComponentType<{ className?: string }>
  prompt: string
  description: string
}

interface PromptInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  tenderContext?: {
    name?: string
    deadline?: string
    authority?: string
    currentSection?: string
  }
}

const promptTemplates: PromptTemplate[] = [
  {
    id: 'capability-analysis',
    title: 'Capability Analysis',
    category: 'Analysis',
    icon: Target,
    prompt: 'Analyze our organization\'s capabilities and strengths relevant to this tender. Consider our past experience, technical expertise, team qualifications, and unique value propositions that align with the requirements.',
    description: 'Identify and articulate your organization\'s key strengths'
  },
  {
    id: 'risk-mitigation',
    title: 'Risk Mitigation Strategy',
    category: 'Strategy',
    icon: Users,
    prompt: 'Identify potential risks associated with this project and develop comprehensive mitigation strategies. Consider operational, financial, technical, and timeline risks, along with contingency plans.',
    description: 'Develop strategies to address potential project risks'
  },
  {
    id: 'value-proposition',
    title: 'Value Proposition',
    category: 'Value',
    icon: Lightbulb,
    prompt: 'Craft a compelling value proposition that highlights the unique benefits and outcomes we can deliver. Focus on measurable impacts, cost-effectiveness, and long-term value for the client.',
    description: 'Create compelling reasons why you should be selected'
  },
  {
    id: 'methodology-approach',
    title: 'Methodology & Approach',
    category: 'Methodology',
    icon: FileText,
    prompt: 'Describe our proposed methodology and approach for delivering this project. Include project phases, key activities, deliverables, quality assurance measures, and stakeholder engagement strategies.',
    description: 'Outline your approach to project delivery'
  },
  {
    id: 'timeline-planning',
    title: 'Timeline & Planning',
    category: 'Planning',
    icon: Clock,
    prompt: 'Develop a realistic timeline and project plan that demonstrates our ability to meet deadlines while maintaining quality. Include key milestones, dependencies, and buffer time for unforeseen circumstances.',
    description: 'Create a comprehensive project timeline'
  },
  {
    id: 'stakeholder-engagement',
    title: 'Stakeholder Engagement',
    category: 'Engagement',
    icon: Users,
    prompt: 'Outline our strategy for engaging with key stakeholders throughout the project lifecycle. Include communication plans, feedback mechanisms, and collaborative approaches to ensure alignment.',
    description: 'Plan effective stakeholder communication and collaboration'
  }
]

export default function PromptInput({ 
  value, 
  onChange, 
  placeholder = "Enter your brainstorming prompt...",
  maxLength = 1000,
  tenderContext
}: PromptInputProps) {
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const categories = ['all', ...Array.from(new Set(promptTemplates.map(t => t.category)))]
  
  const filteredTemplates = selectedCategory === 'all' 
    ? promptTemplates 
    : promptTemplates.filter(t => t.category === selectedCategory)

  const characterCount = value.length
  const isOverLimit = characterCount > maxLength
  const progressPercentage = Math.min((characterCount / maxLength) * 100, 100)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTemplates(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [value])

  const handleTemplateSelect = (template: PromptTemplate) => {
    const contextualizedPrompt = tenderContext 
      ? `For the ${tenderContext.name || 'tender'} ${tenderContext.currentSection ? `(${tenderContext.currentSection} section)` : ''}: ${template.prompt}`
      : template.prompt

    onChange(contextualizedPrompt)
    setShowTemplates(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="space-y-4">
      {/* Context Banner */}
      {tenderContext && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <MessageCircle className="w-4 h-4" />
            <span className="font-medium">
              Brainstorming for: {tenderContext.name}
              {tenderContext.currentSection && (
                <span className="text-blue-600"> • Section: {tenderContext.currentSection}</span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Template Selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-brand-primary" />
            <span>Choose a template</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
        </button>

        {showTemplates && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
            {/* Category Filter */}
            <div className="border-b border-gray-100 p-3">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-brand-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {category === 'all' ? 'All' : category}
                  </button>
                ))}
              </div>
            </div>

            {/* Template List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredTemplates.map((template) => {
                const IconComponent = template.icon
                return (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <IconComponent className="w-4 h-4 text-brand-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 text-sm">{template.title}</h4>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {template.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Prompt Input */}
      <div className="space-y-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full min-h-[120px] max-h-[300px] px-4 py-3 border rounded-lg resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary ${
            isOverLimit 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300 bg-white'
          }`}
          style={{ fontFamily: 'inherit' }}
        />

        {/* Character Count and Progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`text-sm ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
              {characterCount}/{maxLength} characters
            </div>
            <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  isOverLimit ? 'bg-red-500' : progressPercentage > 80 ? 'bg-orange-500' : 'bg-brand-primary'
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 