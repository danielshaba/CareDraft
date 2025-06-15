'use client'

// Disable static generation for this page since it has client-side functionality
export const dynamic = 'force-dynamic'




import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain,
  Sparkles,
  FileText,
  Target,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Search,
  Download,
  Star,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface StrategySection {
  title: string
  content: string
  bullet_points: string[]
  relevance_score: number
  knowledge_sources: string[]
  case_studies?: string[]
}

interface BidStrategy {
  executive_summary: string
  key_strengths: string[]
  win_themes: string[]
  risk_mitigation: string[]
  sections: StrategySection[]
  recommended_approach: string
  competitive_advantages: string[]
  case_study_recommendations: string[]
  compliance_strategy: string[]
  pricing_strategy: string
  timeline_strategy: string
}

interface KnowledgeSource {
  id: string
  title: string
  content: string
  type: string
  relevance_score: number
  tags: string[]
}

export default function TenderStrategyPage() {
  const params = useParams()
  const tenderId = params.tenderId as string

  const [strategy, setStrategy] = useState<BidStrategy | null>(null)
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [strategyFocus, setStrategyFocus] = useState<'comprehensive' | 'competitive' | 'compliance' | 'innovation' | 'cost'>('comprehensive')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set())

  // Mock tender data
  const tenderData = {
    title: "Community Care Services - Yorkshire Region",
    issuing_authority: "NHS Yorkshire and Humber ICB",
    deadline: "2024-03-15",
    contract_value: 2500000,
    requirements: [
      "24/7 emergency response capability",
      "CQC Outstanding or Good rating required",
      "Minimum 5 years experience in community care",
      "Electronic care monitoring systems",
      "Local workforce development programs"
    ],
    evaluation_criteria: [
      { criteria: "Technical Quality", weight: 40 },
      { criteria: "Price", weight: 30 },
      { criteria: "Social Value", weight: 20 },
      { criteria: "Management Approach", weight: 10 }
    ],
    compliance_requirements: [
      "CQC registration and compliance",
      "Safeguarding policies and procedures",
      "GDPR data protection compliance",
      "Health and safety regulations",
      "Professional indemnity insurance"
    ]
  }

  // Mock knowledge sources
  const mockKnowledgeSources: KnowledgeSource[] = [
    {
      id: "1",
      title: "CQC Inspection Preparation Guide",
      content: "Comprehensive guide for preparing for CQC inspections including documentation requirements, staff training protocols, and quality assurance measures...",
      type: "document",
      relevance_score: 95,
      tags: ["cqc", "inspection", "compliance", "quality"]
    },
    {
      id: "2",
      title: "Community Care Best Practices",
      content: "Evidence-based approaches to community care delivery including person-centered planning, risk assessment methodologies, and outcome measurement...",
      type: "guide",
      relevance_score: 92,
      tags: ["community-care", "best-practices", "person-centered", "outcomes"]
    },
    {
      id: "3",
      title: "NHS Contract Success Case Study",
      content: "Detailed case study of successful NHS contract delivery highlighting innovation, quality improvements, and cost efficiencies achieved...",
      type: "case-study",
      relevance_score: 88,
      tags: ["nhs", "contract", "success", "innovation"]
    },
    {
      id: "4",
      title: "Social Value Framework",
      content: "Comprehensive framework for demonstrating social value including local employment, community engagement, and environmental sustainability measures...",
      type: "framework",
      relevance_score: 85,
      tags: ["social-value", "community", "employment", "sustainability"]
    }
  ]

  useEffect(() => {
    setKnowledgeSources(mockKnowledgeSources)
  }, [])

  const generateStrategy = async () => {
    setIsGenerating(true)
    
    try {
      const contextDocuments = Array.from(selectedSources).map(sourceId => {
        const source = knowledgeSources.find(s => s.id === sourceId)
        return source ? {
          title: source.title,
          content: source.content,
          type: source.type,
          relevance_score: source.relevance_score / 100
        } : null
      }).filter(Boolean)

      const response = await fetch('/api/ai/strategy-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tender_id: tenderId,
          tender_details: tenderData,
          context_documents: contextDocuments,
          strategy_focus: strategyFocus
        })
      })

      if (response.ok) {
        const data = await response.json()
        setStrategy(data.strategy)
      } else {
        console.error('Strategy generation failed')
      }
    } catch (error) {
      console.error('Error generating strategy:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleSection = (sectionTitle: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionTitle)) {
      newExpanded.delete(sectionTitle)
    } else {
      newExpanded.add(sectionTitle)
    }
    setExpandedSections(newExpanded)
  }

  const toggleSource = (sourceId: string) => {
    const newSelected = new Set(selectedSources)
    if (newSelected.has(sourceId)) {
      newSelected.delete(sourceId)
    } else {
      newSelected.add(sourceId)
    }
    setSelectedSources(newSelected)
  }

  const exportStrategy = () => {
    if (!strategy) return
    
    const strategyText = `
# Bid Strategy: ${tenderData.title}

## Executive Summary
${strategy.executive_summary}

## Recommended Approach
${strategy.recommended_approach}

## Key Strengths
${strategy.key_strengths.map(strength => `• ${strength}`).join('\n')}

## Win Themes
${strategy.win_themes.map(theme => `• ${theme}`).join('\n')}

## Strategy Sections
${strategy.sections.map(section => `
### ${section.title}
${section.content}

Key Points:
${section.bullet_points.map(point => `• ${point}`).join('\n')}
`).join('\n')}

## Risk Mitigation
${strategy.risk_mitigation.map(risk => `• ${risk}`).join('\n')}

## Competitive Advantages
${strategy.competitive_advantages.map(advantage => `• ${advantage}`).join('\n')}

## Compliance Strategy
${strategy.compliance_strategy.map(compliance => `• ${compliance}`).join('\n')}

## Pricing Strategy
${strategy.pricing_strategy}

## Timeline Strategy
${strategy.timeline_strategy}
`

    const blob = new Blob([strategyText], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bid-strategy-${tenderId}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Strategy Generation</h1>
              <p className="text-gray-600">Generate intelligent bid strategies using knowledge hub insights</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Knowledge Sources Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Knowledge Sources
                </CardTitle>
                <CardDescription>
                  Select relevant documents to inform your strategy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search knowledge..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Strategy Focus */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Strategy Focus
                  </label>
                  <Select value={strategyFocus} onValueChange={(value: any) => setStrategyFocus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprehensive">Comprehensive</SelectItem>
                      <SelectItem value="competitive">Competitive</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="innovation">Innovation</SelectItem>
                      <SelectItem value="cost">Cost-Focused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Knowledge Sources */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Available Sources</span>
                    <Badge variant="secondary">{knowledgeSources.length}</Badge>
                  </div>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {knowledgeSources
                      .filter(source => 
                        searchQuery === '' || 
                        source.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        source.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                      .map(source => (
                        <div
                          key={source.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedSources.has(source.id)
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => toggleSource(source.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">{source.title}</h4>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {source.content.substring(0, 100)}...
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {source.type}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-500" />
                                  <span className="text-xs text-gray-600">{source.relevance_score}%</span>
                                </div>
                              </div>
                            </div>
                            {selectedSources.has(source.id) && (
                              <CheckCircle2 className="h-4 w-4 text-purple-600 mt-1" />
                            )}
                          </div>
                        </div>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={generateStrategy}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating Strategy...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate AI Strategy
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Strategy Content */}
          <div className="lg:col-span-2">
            {!strategy ? (
              <Card className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Strategy Generated</h3>
                  <p className="text-gray-600 mb-4">
                    Select knowledge sources and click "Generate AI Strategy" to begin
                  </p>
                  <Button
                    onClick={generateStrategy}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get Started
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Strategy Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-purple-600" />
                          Bid Strategy Generated
                        </CardTitle>
                        <CardDescription>
                          AI-powered strategy for {tenderData.title}
                        </CardDescription>
                      </div>
                      <Button onClick={exportStrategy} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Executive Summary</h3>
                      <p className="text-gray-700">{strategy.executive_summary}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Strategy Tabs */}
                <Tabs defaultValue="approach" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="approach">Approach</TabsTrigger>
                    <TabsTrigger value="strengths">Strengths</TabsTrigger>
                    <TabsTrigger value="sections">Sections</TabsTrigger>
                    <TabsTrigger value="risks">Risks</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                  </TabsList>

                  <TabsContent value="approach" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Recommended Approach</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 mb-4">{strategy.recommended_approach}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Win Themes</h4>
                            <div className="space-y-2">
                              {strategy.win_themes.map((theme, index) => (
                                <div key={index} className="flex items-start gap-2">
                                  <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
                                  <span className="text-sm text-gray-700">{theme}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Competitive Advantages</h4>
                            <div className="space-y-2">
                              {strategy.competitive_advantages.map((advantage, index) => (
                                <div key={index} className="flex items-start gap-2">
                                  <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                                  <span className="text-sm text-gray-700">{advantage}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="strengths" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Key Strengths</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 gap-3">
                          {strategy.key_strengths.map((strength, index) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                              <span className="text-sm text-gray-700">{strength}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="sections" className="space-y-4">
                    {strategy.sections.map((section, index) => (
                      <Card key={index}>
                        <CardHeader 
                          className="cursor-pointer"
                          onClick={() => toggleSection(section.title)}
                        >
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-brand-600" />
                              {section.title}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {Math.round(section.relevance_score * 100)}% relevant
                              </Badge>
                              {expandedSections.has(section.title) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        
                        <AnimatePresence>
                          {expandedSections.has(section.title) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <CardContent>
                                <p className="text-gray-700 mb-4">{section.content}</p>
                                
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-900">Key Points:</h4>
                                  <ul className="space-y-2">
                                    {section.bullet_points.map((point, pointIndex) => (
                                      <li key={pointIndex} className="flex items-start gap-2">
                                        <div className="h-1.5 w-1.5 bg-brand-600 rounded-full mt-2"></div>
                                        <span className="text-sm text-gray-700">{point}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  
                                  <div className="flex flex-wrap gap-2 mt-4">
                                    {section.knowledge_sources.map((source, sourceIndex) => (
                                      <Badge key={sourceIndex} variant="outline" className="text-xs">
                                        <FileText className="h-3 w-3 mr-1" />
                                        {source}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="risks" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                          Risk Mitigation Strategies
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {strategy.risk_mitigation.map((risk, index) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
                              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                              <span className="text-sm text-gray-700">{risk}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="compliance" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Compliance Strategy</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {strategy.compliance_strategy.map((compliance, index) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-brand-50 rounded-lg">
                              <CheckCircle2 className="h-4 w-4 text-brand-600 mt-0.5" />
                              <span className="text-sm text-gray-700">{compliance}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 
