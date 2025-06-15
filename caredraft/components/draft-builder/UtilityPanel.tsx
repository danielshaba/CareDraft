'use client'

import React, { useState, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { 
  ShieldCheck, 
  FileText, 
  Search, 
  AlertCircle, 
  CheckCircle, 
  Copy, 
  Plus,
  ExternalLink,
  Clipboard
} from 'lucide-react'

interface UtilityPanelProps {
  editor: Editor | null
}

// Sample compliance keywords
const COMPLIANCE_KEYWORDS = [
  'ISO 27001', 'GDPR', 'compliance', 'audit', 'certification', 
  'security', 'privacy', 'data protection', 'risk assessment'
]

interface Answer {
  id: string
  title: string
  content: string
  category?: {
    id: string
    name: string
    color?: string
  }
  usage_count: number
  average_rating: number
  is_template: boolean
}

export default function UtilityPanel({ editor }: UtilityPanelProps) {
  const [activeTab, setActiveTab] = useState<'compliance' | 'answers' | 'search'>('compliance')
  const [complianceResults, setComplianceResults] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [replaceTerm, setReplaceTerm] = useState('')
  
  // Answer Bank state
  const [recentAnswers, setRecentAnswers] = useState<Answer[]>([])
  const [popularAnswers, setPopularAnswers] = useState<Answer[]>([])
  const [loadingAnswers, setLoadingAnswers] = useState(false)

  // Load answers when the answers tab is active
  useEffect(() => {
    if (activeTab === 'answers') {
      loadRecentAnswers()
      loadPopularAnswers()
    }
  }, [activeTab])

  const loadRecentAnswers = async () => {
    setLoadingAnswers(true)
    try {
      const response = await fetch('/api/answers?sort_by=recent&sort_order=desc&limit=3')
      const result = await response.json()
      
      if (result.success) {
        setRecentAnswers(result.data.answers || [])
      }
    } catch (error) {
      console.error('Error loading recent answers:', error)
    } finally {
      setLoadingAnswers(false)
    }
  }

  const loadPopularAnswers = async () => {
    try {
      const response = await fetch('/api/answers?sort_by=usage&sort_order=desc&limit=3')
      const result = await response.json()
      
      if (result.success) {
        setPopularAnswers(result.data.answers || [])
      }
    } catch (error) {
      console.error('Error loading popular answers:', error)
    }
  }

  const runComplianceCheck = () => {
    if (!editor) return
    
    const content = editor.getText().toLowerCase()
    const foundKeywords = COMPLIANCE_KEYWORDS.filter(keyword => 
      content.includes(keyword.toLowerCase())
    )
    setComplianceResults(foundKeywords)
  }

  const insertAnswerBankItem = async (answer: Answer) => {
    if (!editor) return

    // Track usage
    try {
      await fetch(`/api/answers/${answer.id}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: 'proposal_draft' })
      })
    } catch (error) {
      console.error('Error tracking usage:', error)
    }

    // Insert content at cursor position
    editor.chain().focus().insertContent(answer.content).run()
    
    // Refresh the lists to update usage counts
    loadRecentAnswers()
    loadPopularAnswers()
  }

  const findAndReplace = () => {
    if (!editor || !searchTerm) return
    
    const content = editor.getHTML()
    const regex = new RegExp(searchTerm, 'gi')
    const newContent = content.replace(regex, replaceTerm)
    
    editor.commands.setContent(newContent)
    setSearchTerm('')
    setReplaceTerm('')
  }

  const TabButton = ({ 
    tab, 
    icon: Icon, 
    label 
  }: {
    tab: 'compliance' | 'answers' | 'search'
    icon: React.ComponentType<{ className?: string }>
    label: string
  }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
        activeTab === tab
          ? 'bg-brand-primary-light text-brand-primary-dark border border-brand-primary'
          : 'text-gray-600 hover:bg-gray-50 border border-transparent'
      }`}
    >
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </button>
  )

  const AnswerCard = ({ answer }: { answer: Answer }) => (
    <button
      key={answer.id}
      onClick={() => insertAnswerBankItem(answer)}
      className="w-full p-3 text-left text-xs border border-gray-200 rounded-lg hover:border-brand-primary hover:bg-brand-primary-light transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <div className="font-medium text-gray-900 truncate">{answer.title}</div>
            {answer.is_template && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-brand-100 text-brand-800">
                Template
              </span>
            )}
          </div>
          
          {answer.category && (
            <div className="mb-1">
              <span 
                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor: answer.category.color ? `${answer.category.color}20` : '#f3f4f6',
                  color: answer.category.color || '#6b7280'
                }}
              >
                {answer.category.name}
              </span>
            </div>
          )}
          
          <div className="text-gray-500 mt-1 line-clamp-2">
            {answer.content.length > 60 ? `${answer.content.substring(0, 60)}...` : answer.content}
          </div>
          
          <div className="flex items-center space-x-3 mt-2 text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <Copy className="h-3 w-3" />
              <span>{answer.usage_count} uses</span>
            </div>
            {answer.average_rating > 0 && (
              <div className="flex items-center space-x-1">
                <span>★ {answer.average_rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
        <Copy className="h-3 w-3 text-gray-400 ml-2 flex-shrink-0" />
      </div>
    </button>
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-4">
        <TabButton tab="compliance" icon={ShieldCheck} label="Compliance" />
        <TabButton tab="answers" icon={FileText} label="Answers" />
        <TabButton tab="search" icon={Search} label="Find/Replace" />
      </div>

      {/* Compliance Check Tab */}
      {activeTab === 'compliance' && (
        <div className="space-y-3">
          <button
            onClick={runComplianceCheck}
            className="w-full px-3 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-primary-dark transition-colors"
          >
            Run Compliance Check
          </button>
          
          {complianceResults.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-gray-700">Found {complianceResults.length} compliance keywords:</span>
              </div>
              <div className="space-y-1">
                {complianceResults.map((keyword, index) => (
                  <div key={index} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-200">
                    {keyword}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {complianceResults.length === 0 && editor && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <AlertCircle className="h-4 w-4" />
              <span>Click to check for compliance keywords</span>
            </div>
          )}
        </div>
      )}

      {/* Answer Bank Tab */}
      {activeTab === 'answers' && (
        <div className="space-y-4">
          {/* Quick Access Header */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">Quick Access</div>
            <a 
              href="/answer-bank"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-xs text-brand-primary hover:text-brand-primary-dark transition-colors"
            >
              <span>Manage All</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {loadingAnswers ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Popular Answers */}
              {popularAnswers.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-2">Most Used</div>
                  <div className="space-y-2">
                    {popularAnswers.map((answer) => (
                      <AnswerCard key={answer.id} answer={answer} />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Answers */}
              {recentAnswers.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-2">Recently Updated</div>
                  <div className="space-y-2">
                    {recentAnswers.map((answer) => (
                      <AnswerCard key={answer.id} answer={answer} />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {recentAnswers.length === 0 && popularAnswers.length === 0 && (
                <div className="text-center py-6">
                  <Clipboard className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <div className="text-xs font-medium text-gray-900 mb-1">No answers yet</div>
                  <div className="text-xs text-gray-500 mb-3">
                    Create your first answer to get started
                  </div>
                  <a 
                    href="/answer-bank"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-xs text-brand-primary hover:text-brand-primary-dark transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Create Answer</span>
                  </a>
                </div>
              )}

              {/* Browse All Button */}
              {(recentAnswers.length > 0 || popularAnswers.length > 0) && (
                <div className="pt-3 border-t border-gray-100">
                  <a 
                    href="/answer-bank"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium text-brand-primary bg-brand-primary-light rounded-lg hover:bg-brand-primary-light transition-colors"
                  >
                    <Clipboard className="h-3 w-3" />
                    <span>Browse All Answers</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Find & Replace Tab */}
      {activeTab === 'search' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Find</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search term..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Replace with</label>
            <input
              type="text"
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              placeholder="Replacement text..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>
          
          <button
            onClick={findAndReplace}
            disabled={!searchTerm}
            className="w-full px-3 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Find & Replace All
          </button>
        </div>
      )}

      {!editor && (
        <div className="text-xs text-gray-400 text-center mt-2">
          Editor loading...
        </div>
      )}
    </div>
  )
} 