'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { PenTool, ArrowLeft, Save, Download, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import EditorToolbar from './EditorToolbar'
import AIAssistPanel from './AIAssistPanel'
import UtilityPanel from './UtilityPanel'
import WordCountDisplay from './WordCountDisplay'
import ExportActionsModal from './ExportActionsModal'
import ProposalStatusBadge from '@/components/proposal-workflow/ProposalStatusBadge'
import StatusHistoryPanel from '@/components/proposal-workflow/StatusHistoryPanel'
import useProposalWorkflow from '@/lib/hooks/useProposalWorkflow'
import { useLoadingState } from '@/hooks/useLoadingState'
import { LoadingButton } from '@/components/ui/loading-button'

interface DraftBuilderInterfaceProps {
  proposalId?: string
}

export default function DraftBuilderInterface({ proposalId }: DraftBuilderInterfaceProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  
  // Initialize loading state for save operations
  const saveState = useLoadingState({
    onSuccess: () => {
      console.log('Draft saved successfully')
    },
    onError: (error) => {
      console.error('Failed to save draft:', error)
    }
  })
  
  // Initialize proposal workflow if proposalId is provided
  const [workflowState, workflowActions] = useProposalWorkflow({
    proposalId: proposalId || '',
    autoRefresh: true,
    refreshInterval: 30000,
  })

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
    ],
    content: `
      <h1>Proposal Draft</h1>
      <p>Welcome to the CareDraft proposal builder. Start writing your proposal here...</p>
      <p>You can use the AI assistance tools on the left to help improve your content, check compliance, and manage your document efficiently.</p>
      <h2>Key Features Available:</h2>
      <ul>
        <li><strong>AI Assist:</strong> Elaborate, summarize, or rewrite selected text</li>
        <li><strong>Compliance Check:</strong> Scan for industry keywords and requirements</li>
        <li><strong>Answer Bank:</strong> Insert pre-written responses and templates</li>
        <li><strong>Find & Replace:</strong> Quickly update content across your document</li>
        <li><strong>Real-time Stats:</strong> Track word count, characters, and reading time</li>
      </ul>
      <p>Select any text and use the AI tools, or use the formatting toolbar above to style your content.</p>
    `,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 p-6 min-h-[500px] text-gray-900',
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // Auto-save functionality could be added here
      // Reset any success state when content changes
      if (saveState.data) {
        saveState.reset()
      }
    },
  }, [saveState])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleSave = async () => {
    if (!editor) return
    
    try {
      await saveState.execute(async () => {
        // Simulate save operation
        await new Promise(resolve => setTimeout(resolve, 1000))
        return { message: 'Draft saved successfully' }
      })
    } catch (error) {
      // Error is already handled by the loading state hook
      console.error('Save failed:', error)
    }
  }

  const handleExport = () => {
    setIsExportModalOpen(true)
  }

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-2"></div>
          <div className="text-gray-500">Loading Draft Builder...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-brand-500 transition-colors group"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Back to Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-brand-50 rounded-lg">
                  <PenTool className="h-5 w-5 text-brand-500" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Draft Builder</h1>
                  <p className="text-sm text-gray-500">AI-powered proposal editor</p>
                </div>
              </div>
              
              {/* Proposal Status Badge - only show if proposalId exists */}
              {proposalId && workflowState.currentStatus && (
                <>
                  <div className="h-6 w-px bg-gray-300" />
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Status:</span>
                    <ProposalStatusBadge
                      status={workflowState.currentStatus}
                      size="sm"
                      showIcon={true}
                      showLabel={true}
                      disabled={workflowState.loading}
                    />
                  </div>
                </>
              )}
            </div>
            
            {/* Save actions */}
            <div className="flex items-center space-x-3">
              <LoadingButton
                onClick={handleSave}
                isLoading={saveState.isLoading}
                variant={saveState.error ? "destructive" : saveState.data ? "default" : "outline"}
                className={saveState.data ? "border-green-200 bg-green-50 text-green-700" : ""}
                loadingText="Saving..."
              >
                <Save className="h-4 w-4" />
                {saveState.data ? "Saved!" : "Save Draft"}
              </LoadingButton>
              <button 
                onClick={handleExport}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export & Actions</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Tools */}
          <div className="lg:col-span-1 space-y-4">
            {/* Proposal Status History - only show if proposalId exists */}
            {proposalId && workflowState.statusHistory && workflowState.statusHistory.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Status History</h3>
                  <StatusHistoryPanel
                    statusHistory={workflowState.statusHistory.slice(0, 5)}
                    loading={workflowState.historyLoading}
                    className="border-0 p-0 bg-transparent"
                  />
                </div>
              </div>
            )}
            
            {/* AI Assist */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">AI Tools</h3>
                <AIAssistPanel editor={editor} />
              </div>
            </div>
            
            {/* Utility Tools */}
            <UtilityPanel editor={editor} />
            
            {/* Document Stats */}
            <WordCountDisplay editor={editor} />
          </div>

          {/* Editor Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {/* Toolbar */}
              <EditorToolbar editor={editor} />

              {/* Editor */}
              <div className="relative">
                <EditorContent 
                  editor={editor}
                  className="min-h-[600px] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                />
                
                {/* Status bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 px-4 py-2 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>{editor?.getText().length || 0} characters</span>
                    <span>•</span>
                    <span>{editor?.getText().trim().split(/\s+/).length || 0} words</span>
                    {proposalId && (
                      <>
                        <span>•</span>
                        <span>Proposal ID: {proposalId}</span>
                      </>
                    )}
                  </div>
                  <div>
                    {saveState.data && (
                      <span className="text-green-600">Document saved</span>
                    )}
                    {saveState.error && (
                      <span className="text-red-600">Save failed</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportActionsModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        editor={editor}
      />
    </div>
  )
} 