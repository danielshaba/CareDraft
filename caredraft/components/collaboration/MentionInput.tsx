'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { AtSign, User } from 'lucide-react'
import { UserSearchResult, UsersService } from '@/lib/services/users'
import { getUserDisplayName, getUserColor } from '@/types/collaboration'

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  onMentionSelect?: (user: UserSearchResult) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  maxLength?: number
  rows?: number
}

interface MentionMatch {
  start: number
  end: number
  query: string
}

export function MentionInput({
  value,
  onChange,
  onMentionSelect,
  placeholder = "Type @ to mention someone...",
  className = '',
  disabled = false,
  maxLength = 1000,
  rows = 3
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<UserSearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [currentMention, setCurrentMention] = useState<MentionMatch | null>(null)
  const [loading, setLoading] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const usersService = new UsersService()

  // Find mention pattern in text
  const findMentionMatch = useCallback((text: string, cursorPos: number): MentionMatch | null => {
    const beforeCursor = text.slice(0, cursorPos)
    const lastAtIndex = beforeCursor.lastIndexOf('@')
    
    if (lastAtIndex === -1) return null
    
    const afterAt = text.slice(lastAtIndex + 1)
    const spaceIndex = afterAt.indexOf(' ')
    const newlineIndex = afterAt.indexOf('\n')
    
    let endIndex = text.length
    if (spaceIndex !== -1) endIndex = Math.min(endIndex, lastAtIndex + 1 + spaceIndex)
    if (newlineIndex !== -1) endIndex = Math.min(endIndex, lastAtIndex + 1 + newlineIndex)
    
    const query = text.slice(lastAtIndex + 1, endIndex)
    
    // Only show suggestions if cursor is within the mention
    if (cursorPos >= lastAtIndex && cursorPos <= endIndex) {
      return {
        start: lastAtIndex,
        end: endIndex,
        query
      }
    }
    
    return null
  }, [])

  // Search users based on mention query
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    setLoading(true)
    try {
      const results = await usersService.searchUsers(query, 8)
      setSuggestions(results)
      setSelectedIndex(0)
    } catch {
      console.error('Error searching users:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [usersService])

  // Handle text change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart
    
    onChange(newValue)
    
    // Check for mention pattern
    const mention = findMentionMatch(newValue, cursorPos)
    setCurrentMention(mention)
    
    if (mention) {
      setShowSuggestions(true)
      searchUsers(mention.query)
    } else {
      setShowSuggestions(false)
      setSuggestions([])
    }
  }

  // Handle key navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % suggestions.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
        break
      case 'Enter':
      case 'Tab':
        e.preventDefault()
        insertMention(suggestions[selectedIndex])
        break
      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }

  // Insert selected mention
  const insertMention = (user: UserSearchResult) => {
    if (!currentMention || !textareaRef.current) return

    const displayName = getUserDisplayName(user)
    const beforeMention = value.slice(0, currentMention.start)
    const afterMention = value.slice(currentMention.end)
    const newValue = `${beforeMention}@${displayName} ${afterMention}`
    
    onChange(newValue)
    setShowSuggestions(false)
    setCurrentMention(null)
    
    // Set cursor position after the mention
    const newCursorPos = currentMention.start + displayName.length + 2
    setTimeout(() => {
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos)
      textareaRef.current?.focus()
    }, 0)
    
    onMentionSelect?.(user)
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [value])

  // Calculate suggestions position
  const getSuggestionsPosition = () => {
    if (!textareaRef.current || !currentMention) return { top: 0, left: 0 }

    const textarea = textareaRef.current
    const textBeforeMention = value.slice(0, currentMention.start)
    
    // Create a temporary element to measure text dimensions
    const temp = document.createElement('div')
    temp.style.position = 'absolute'
    temp.style.visibility = 'hidden'
    temp.style.whiteSpace = 'pre-wrap'
    temp.style.font = window.getComputedStyle(textarea).font
    temp.style.width = textarea.clientWidth + 'px'
    temp.textContent = textBeforeMention
    
    document.body.appendChild(temp)
    const rect = temp.getBoundingClientRect()
    document.body.removeChild(temp)
    
    // const _textareaRect = textarea.getBoundingClientRect()
    
    return {
      top: rect.height + 20,
      left: rect.width % textarea.clientWidth
    }
  }

  const suggestionsPosition = showSuggestions ? getSuggestionsPosition() : { top: 0, left: 0 }

  return (
    <div className={`relative ${className}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        rows={rows}
        className="w-full p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {/* Character count */}
      <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <AtSign className="w-3 h-3" />
          <span>Type @ to mention users</span>
        </div>
        <span className={value.length > maxLength * 0.9 ? 'text-orange-500' : ''}>
          {value.length}/{maxLength}
        </span>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto min-w-64"
          style={{
            top: suggestionsPosition.top,
            left: suggestionsPosition.left
          }}
        >
          {loading ? (
            <div className="p-3 text-center text-gray-500">
              <div className="w-4 h-4 border border-gray-300 border-t-brand-primary rounded-full animate-spin mx-auto mb-1" />
              Searching users...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-3 text-center text-gray-500">
              <User className="w-4 h-4 mx-auto mb-1" />
              No users found
            </div>
          ) : (
            suggestions.map((user, index) => (
              <button
                key={user.id}
                onClick={() => insertMention(user)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 transition-colors ${
                  index === selectedIndex ? 'bg-brand-primary-light border-l-2 border-brand-primary' : ''
                }`}
              >
                {/* Avatar */}
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={getUserDisplayName(user)}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                    style={{ backgroundColor: getUserColor(user.id) }}
                  >
                    {getUserDisplayName(user).charAt(0).toUpperCase()}
                  </div>
                )}

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {getUserDisplayName(user)}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {user.email}
                  </div>
                </div>

                {/* Mention indicator */}
                <AtSign className="w-3 h-3 text-brand-primary flex-shrink-0" />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
} 