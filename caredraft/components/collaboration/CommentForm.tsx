'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, X, Bold, Italic, Link, AtSign } from 'lucide-react'
import { CreateCommentInput } from '@/types/collaboration'

interface CommentFormProps {
  sectionId: string
  textRange?: {
    start: number
    end: number
    selectedText: string
  }
  onSubmit: (comment: CreateCommentInput) => Promise<void>
  onCancel: () => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

interface MentionSuggestion {
  id: string
  name: string
  email: string
}

export function CommentForm({
  sectionId,
  textRange,
  onSubmit,
  onCancel,
  placeholder = "Add a comment...",
  autoFocus = true,
  className = ''
}: CommentFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([])
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLDivElement>(null)

  // Mock mention suggestions - in real app this would come from API
  const mockUsers: MentionSuggestion[] = [
    { id: '1', name: 'John Smith', email: 'john.smith@example.com' },
    { id: '2', name: 'Sarah Johnson', email: 'sarah.johnson@example.com' },
    { id: '3', name: 'Mike Davis', email: 'mike.davis@example.com' },
    { id: '4', name: 'Emily Brown', email: 'emily.brown@example.com' },
  ]

  // Auto-focus textarea
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [content])

  // Handle mention detection
  useEffect(() => {
    const lastAtIndex = content.lastIndexOf('@')
    if (lastAtIndex !== -1) {
      const textAfterAt = content.slice(lastAtIndex + 1)
      const spaceIndex = textAfterAt.indexOf(' ')
      const query = spaceIndex === -1 ? textAfterAt : textAfterAt.slice(0, spaceIndex)
      
      if (query.length >= 0 && spaceIndex === -1) {
        setMentionQuery(query)
        setShowMentions(true)
        setMentionSuggestions(
          mockUsers.filter(user => 
            user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase())
          )
        )
        setSelectedMentionIndex(0)
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }, [content])

  // Handle keyboard navigation for mentions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions && mentionSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedMentionIndex(prev => 
          prev < mentionSuggestions.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : mentionSuggestions.length - 1
        )
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(mentionSuggestions[selectedMentionIndex])
      } else if (e.key === 'Escape') {
        setShowMentions(false)
      }
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const insertMention = (user: MentionSuggestion) => {
    const lastAtIndex = content.lastIndexOf('@')
    const beforeAt = content.slice(0, lastAtIndex)
    const afterMention = content.slice(lastAtIndex + mentionQuery.length + 1)
    
    setContent(`${beforeAt}@${user.name} ${afterMention}`)
    setShowMentions(false)
    textareaRef.current?.focus()
  }

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const commentData: CreateCommentInput = {
        section_id: sectionId,
        content: content.trim(),
        text_range_start: textRange?.start || null,
        text_range_end: textRange?.end || null,
      }

      await onSubmit(commentData)
      setContent('')
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setContent('')
    setShowMentions(false)
    onCancel()
  }

  const insertFormatting = (format: 'bold' | 'italic' | 'link') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.slice(start, end)

    let replacement = ''
    let cursorOffset = 0

    switch (format) {
      case 'bold':
        replacement = `**${selectedText}**`
        cursorOffset = selectedText ? 0 : 2
        break
      case 'italic':
        replacement = `*${selectedText}*`
        cursorOffset = selectedText ? 0 : 1
        break
      case 'link':
        replacement = `[${selectedText || 'link text'}](url)`
        cursorOffset = selectedText ? -5 : -9
        break
    }

    const newContent = content.slice(0, start) + replacement + content.slice(end)
    setContent(newContent)

    // Set cursor position
    setTimeout(() => {
      const newPosition = start + replacement.length + cursorOffset
      textarea.setSelectionRange(newPosition, newPosition)
      textarea.focus()
    }, 0)
  }

  return (
    <div ref={formRef} className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-brand-primary" />
          <span className="text-sm font-medium text-gray-900">
            {textRange ? 'Comment on selection' : 'Add comment'}
          </span>
        </div>
        <button
          onClick={handleCancel}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Selected text preview */}
      {textRange && (
        <div className="px-4 py-2 bg-brand-50 border-b border-gray-200">
          <div className="text-xs text-brand-600 font-medium mb-1">Selected text:</div>
          <div className="text-sm text-gray-700 italic">&quot;{textRange.selectedText}&quot;</div>
        </div>
      )}

      {/* Content area */}
      <div className="p-4">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full min-h-[100px] max-h-[300px] p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            disabled={isSubmitting}
          />

          {/* Mention suggestions */}
          {showMentions && mentionSuggestions.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
              {mentionSuggestions.map((user, index) => (
                <button
                  key={user.id}
                  onClick={() => insertMention(user)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${
                    index === selectedMentionIndex ? 'bg-brand-primary-light border-l-2 border-brand-primary' : ''
                  }`}
                >
                  <div className="w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center text-xs font-medium text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Formatting toolbar */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => insertFormatting('bold')}
              className="p-2 rounded hover:bg-gray-100 transition-colors"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => insertFormatting('italic')}
              className="p-2 rounded hover:bg-gray-100 transition-colors"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => insertFormatting('link')}
              className="p-2 rounded hover:bg-gray-100 transition-colors"
              title="Add link"
            >
              <Link className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setContent(prev => prev + '@')}
              className="p-2 rounded hover:bg-gray-100 transition-colors"
              title="Mention user"
            >
              <AtSign className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {content.length}/1000
            </span>
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting || content.length > 1000}
              className="px-3 py-1.5 text-sm font-medium text-white bg-brand-primary rounded hover:bg-brand-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  Comment
                </>
              )}
            </button>
          </div>
        </div>

        {/* Help text */}
        <div className="mt-2 text-xs text-gray-500">
          <span>Tip: Use @ to mention users, **bold**, *italic*, or </span>
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+Enter</kbd>
          <span> to submit</span>
        </div>
      </div>
    </div>
  )
} 