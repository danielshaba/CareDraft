'use client'

import React, { useState } from 'react'
import { Editor } from '@tiptap/react'
import { Wand2, Loader2, ExpandIcon, Minimize2, RefreshCw } from 'lucide-react'

interface AIAssistPanelProps {
  editor: Editor | null
}

export default function AIAssistPanel({ editor }: AIAssistPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null)

  const getSelectedText = () => {
    if (!editor) return ''
    const { from, to } = editor.state.selection
    return editor.state.doc.textBetween(from, to, ' ')
  }

  const replaceSelectedText = (newText: string) => {
    if (!editor) return
    const { from, to } = editor.state.selection
    editor.chain().focus().deleteRange({ from, to }).insertContent(newText).run()
  }

  const handleAIFunction = async (functionType: 'elaborate' | 'summarize' | 'rewrite') => {
    const selectedText = getSelectedText()
    
    if (!selectedText.trim()) {
      alert('Please select some text first')
      return
    }

    setIsLoading(true)
    setSelectedFunction(functionType)

    try {
      // Simulate AI API call - replace with actual AI service
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      let result = ''
      switch (functionType) {
        case 'elaborate':
          result = `${selectedText} [This text has been elaborated with additional context and detail to provide a more comprehensive explanation of the concept.]`
          break
        case 'summarize':
          result = `Summary: ${selectedText.split(' ').slice(0, 10).join(' ')}...`
          break
        case 'rewrite':
          result = `Rewritten: ${selectedText.split(' ').reverse().join(' ')}`
          break
      }

      replaceSelectedText(result)
    } catch (error) {
      console.error('AI function failed:', error)
      alert('AI function failed. Please try again.')
    } finally {
      setIsLoading(false)
      setSelectedFunction(null)
    }
  }

  const AIButton = ({ 
    onClick, 
    icon: Icon, 
    label, 
    description,
    functionType 
  }: {
    onClick: () => void
    icon: React.ComponentType<{ className?: string }>
    label: string
    description: string
    functionType: string
  }) => (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`
        w-full p-3 text-left rounded-lg border transition-all
        ${isLoading && selectedFunction === functionType
          ? 'bg-brand-50 border-brand-500 text-brand-600'
                      : 'bg-white border-gray-200 hover:border-brand-500 hover:bg-brand-50'
        }
        ${isLoading ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
      `}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {isLoading && selectedFunction === functionType ? (
            <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
          ) : (
            <Icon className="h-4 w-4 text-brand-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900">{label}</div>
          <div className="text-xs text-gray-500 mt-1">{description}</div>
        </div>
      </div>
    </button>
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Wand2 className="h-4 w-4 text-brand-primary" />
        <h3 className="text-sm font-medium text-gray-900">AI Assist</h3>
      </div>

      <div className="space-y-3">
        <AIButton
          onClick={() => handleAIFunction('elaborate')}
          icon={ExpandIcon}
          label="Elaborate"
          description="Expand and add detail to selected text"
          functionType="elaborate"
        />

        <AIButton
          onClick={() => handleAIFunction('summarize')}
          icon={Minimize2}
          label="Summarize"
          description="Condense selected text to key points"
          functionType="summarize"
        />

        <AIButton
          onClick={() => handleAIFunction('rewrite')}
          icon={RefreshCw}
          label="Rewrite"
          description="Improve clarity and flow of selected text"
          functionType="rewrite"
        />
      </div>

      {!editor && (
        <div className="mt-4 text-xs text-gray-400 text-center">
          Editor loading...
        </div>
      )}

      {editor && (
        <div className="mt-4 text-xs text-gray-400 text-center">
          Select text in the editor to use AI functions
        </div>
      )}
    </div>
  )
} 