'use client'

import React, { useState, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { FileText, Clock } from 'lucide-react'

interface WordCountDisplayProps {
  editor: Editor | null
}

export default function WordCountDisplay({ editor }: WordCountDisplayProps) {
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [readingTime, setReadingTime] = useState(0)

  useEffect(() => {
    if (!editor) return

    const updateCounts = () => {
      const text = editor.getText()
      const words = text.trim() ? text.trim().split(/\s+/).length : 0
      const chars = text.length
      const avgWordsPerMinute = 200
      const minutes = Math.ceil(words / avgWordsPerMinute)

      setWordCount(words)
      setCharCount(chars)
      setReadingTime(minutes)
    }

    // Update counts immediately
    updateCounts()

    // Listen for editor updates
    const updateHandler = () => {
      updateCounts()
    }

    editor.on('update', updateHandler)

    return () => {
      editor.off('update', updateHandler)
    }
  }, [editor])

  if (!editor) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
        <div className="flex items-center space-x-2 mb-2">
          <FileText className="h-4 w-4 text-brand-500" />
          <h3 className="text-sm font-medium text-gray-900">Document Stats</h3>
        </div>
        <div className="text-xs text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
      <div className="flex items-center space-x-2 mb-3">
        <FileText className="h-4 w-4 text-brand-500" />
        <h3 className="text-sm font-medium text-gray-900">Document Stats</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Words</span>
          <span className="text-sm font-medium text-gray-900">{wordCount.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Characters</span>
          <span className="text-sm font-medium text-gray-900">{charCount.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600 flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Reading time</span>
          </span>
          <span className="text-sm font-medium text-gray-900">
            {readingTime === 0 ? '< 1' : readingTime} min
          </span>
        </div>
        
        {/* Progress bar for word count */}
        <div className="pt-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{Math.min(Math.round((wordCount / 1000) * 100), 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-brand-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min((wordCount / 1000) * 100, 100)}%` 
              }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">Target: 1,000 words</div>
        </div>
      </div>
    </div>
  )
} 