'use client'

import React, { useState } from 'react'
import { ContextPanel } from './ContextPanel'
import { AISourceSelector, AISource } from './AISourceSelector'
import PromptInput from './PromptInput'
import { Lightbulb, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import GenerateButton from './GenerateButton'
import IdeaCards from './IdeaCard'

// Mock data for demonstration - in real app this would come from context/API
const mockTenderContext = {
  tenderName: 'Residential Care Services for Elderly - East London Borough',
  tenderReference: 'ELB-RCS-2024-001',
  issuingAuthority: 'East London Borough Council',
  submissionDeadline: new Date('2024-12-31'),
  currentSection: 'Service Delivery Approach',
  wordLimit: 1500,
  currentWordCount: 750,
  progress: 35
}

// Mock generated ideas data
const mockIdeasData = [
  {
    id: 'idea-1',
    title: 'Person-Centered Care Approach',
    content: 'Our service delivery will center around individualized care plans that prioritize each resident\'s unique needs, preferences, and dignity. We implement comprehensive assessments, regular reviews, and family involvement to ensure quality standards and regulatory compliance throughout the care journey.',
    source: 'creative' as const,
    rating: 4.5,
    complianceKeywords: ['regulatory compliance', 'quality standards', 'comprehensive assessments'],
    timestamp: new Date()
  },
  {
    id: 'idea-2', 
    title: 'Integrated Technology Solutions',
    content: 'We propose implementing digital health monitoring systems, electronic care records, and communication platforms to enhance service delivery efficiency. Our technology framework includes data protection measures, staff training programs, and regular system audits to maintain security and privacy standards.',
    source: 'library' as const,
    rating: 4.2,
    complianceKeywords: ['data protection', 'privacy', 'security', 'audit'],
    timestamp: new Date()
  },
  {
    id: 'idea-3',
    title: 'Community Partnership Model',
    content: 'Our approach involves building strategic partnerships with local healthcare providers, community organizations, and family networks. This collaborative model ensures seamless care coordination, reduces isolation, and maintains accountability through transparent reporting and stakeholder engagement.',
    source: 'internet' as const,
    rating: 3.8,
    complianceKeywords: ['accountability', 'transparent reporting'],
    timestamp: new Date()
  }
]

export function BrainstormInterface() {
  // AI source selection state
  const [selectedSources, setSelectedSources] = useState<AISource[]>(['creative'])
  
  // Prompt input state
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Generated ideas state
  const [ideas, setIdeas] = useState<unknown[]>([])

  // Handle prompt submission
  const handlePromptSubmit = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    try {
      console.log('Generating ideas with:', {
        prompt: prompt,
        sources: selectedSources,
        context: mockTenderContext
      })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Simulate generated ideas based on selected sources
      const filteredIdeas = mockIdeasData.filter(idea => 
        selectedSources.includes(idea.source)
      )
      
      setIdeas(filteredIdeas.length > 0 ? filteredIdeas : [mockIdeasData[0]])
    } catch {
      console.error('Error generating ideas:', error)
      throw error // Re-throw to let GenerateButton handle the error state
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle idea actions
  const handleAddToDraft = (ideaId: string) => {
    console.log('Adding idea to draft:', ideaId)
    // TODO: Implement add to draft functionality
  }

  const handleRegenerate = async (ideaId: string) => {
    console.log('Regenerating idea:', ideaId)
    // TODO: Implement regenerate idea functionality
  }

  const handleDiscard = (ideaId: string) => {
    setIdeas(ideas.filter(idea => idea.id !== ideaId))
    console.log('Discarded idea:', ideaId)
  }

  const handleRate = (ideaId: string, rating: number) => {
    setIdeas(ideas.map(idea => 
      idea.id === ideaId ? { ...idea, rating } : idea
    ))
    console.log('Rated idea:', ideaId, 'Rating:', rating)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center mb-4" aria-label="Breadcrumb">
              <Link
                href="/dashboard"
                className="flex items-center text-sm font-medium text-gray-500 hover:text-brand-primary transition-colors"
                style={{ fontFamily: 'var(--font-open-sans)' }}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-sm font-medium text-gray-900" style={{ fontFamily: 'var(--font-open-sans)' }}>
                Brainstorm
              </span>
            </nav>

            {/* Page Title */}
            <div className="flex items-center">
              <Lightbulb className="h-8 w-8 text-brand-primary mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  AI Brainstorm
                </h1>
                <p className="text-gray-600 mt-1" style={{ fontFamily: 'var(--font-open-sans)' }}>
                  Generate creative ideas and content for your tender proposal
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Context Panel - Sidebar */}
            <div className="lg:col-span-1">
              <ContextPanel context={mockTenderContext} />
            </div>

            {/* Main Brainstorm Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Input Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Generate Ideas
                </h2>
                
                {/* AI Source Selection */}
                <div className="mb-6">
                  <AISourceSelector
                    selectedSources={selectedSources}
                    onChange={setSelectedSources}
                  />
                </div>

                {/* Prompt Input */}
                <div className="mb-6">
                  <PromptInput
                    value={prompt}
                    onChange={setPrompt}
                    tenderContext={{
                      name: mockTenderContext.tenderName,
                      deadline: mockTenderContext.submissionDeadline.toLocaleDateString(),
                      authority: mockTenderContext.issuingAuthority,
                      currentSection: mockTenderContext.currentSection
                    }}
                  />
                </div>

                {/* Generate Button */}
                <GenerateButton
                  onGenerate={handlePromptSubmit}
                  isLoading={isGenerating}
                  selectedSources={selectedSources}
                  promptLength={prompt.length}
                />
              </div>

              {/* Results Section */}
              <div>
                <IdeaCards
                  ideas={ideas}
                  onAddToDraft={handleAddToDraft}
                  onRegenerate={handleRegenerate}
                  onDiscard={handleDiscard}
                  onRate={handleRate}
                  isLoading={isGenerating}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 