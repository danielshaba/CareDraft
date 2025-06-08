'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, Plus } from 'lucide-react'
import { CommentBubble } from './CommentBubble'
import { CommentForm } from './CommentForm'
import { Comment, CreateCommentInput } from '@/types/collaboration'
import { CommentsService } from '@/lib/services/collaboration'

interface CommentSystemProps {
  sectionId: string
  content: string
  comments: Comment[]
  currentUserId: string
  onCommentsUpdate: (comments: Comment[]) => void
  className?: string
}

interface CommentMarker {
  id: string
  start: number
  end: number
  comments: Comment[]
  position: { top: number; left: number }
}

interface TextSelection {
  start: number
  end: number
  selectedText: string
  position: { top: number; left: number }
}

export function CommentSystem({
  sectionId,
  content,
  comments,
  currentUserId,
  onCommentsUpdate,
  className = ''
}: CommentSystemProps) {
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [selectedText, setSelectedText] = useState<TextSelection | null>(null)
  const [activeCommentMarker, setActiveCommentMarker] = useState<string | null>(null)
  const [commentMarkers, setCommentMarkers] = useState<CommentMarker[]>([])
  
  const contentRef = useRef<HTMLDivElement>(null)
  const commentsService = new CommentsService()

  // Group comments by text range to create markers
  useEffect(() => {
    const markers: CommentMarker[] = []
    const groupedComments = new Map<string, Comment[]>()

    comments.forEach(comment => {
      if (comment.text_range_start !== null && comment.text_range_end !== null) {
        const key = `${comment.text_range_start}-${comment.text_range_end}`
        if (!groupedComments.has(key)) {
          groupedComments.set(key, [])
        }
        groupedComments.get(key)!.push(comment)
      }
    })

    groupedComments.forEach((commentGroup, key) => {
      const [start, end] = key.split('-').map(Number)
      markers.push({
        id: key,
        start,
        end,
        comments: commentGroup,
        position: { top: 0, left: 0 } // Will be calculated when needed
      })
    })

    setCommentMarkers(markers)
  }, [comments])

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || !contentRef.current || selection.rangeCount === 0) {
      setSelectedText(null)
      setShowCommentForm(false)
      return
    }

    const range = selection.getRangeAt(0)
    const selectedText = selection.toString().trim()

    if (selectedText.length === 0) {
      setSelectedText(null)
      setShowCommentForm(false)
      return
    }

    // Check if selection is within our content area
    if (!contentRef.current.contains(range.commonAncestorContainer)) {
      return
    }

    // Calculate position relative to content
    const contentRect = contentRef.current.getBoundingClientRect()
    const rangeRect = range.getBoundingClientRect()
    
    const position = {
      top: rangeRect.bottom - contentRect.top + 10,
      left: rangeRect.left - contentRect.left
    }

    // Calculate text offsets
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(contentRef.current)
    preCaretRange.setEnd(range.startContainer, range.startOffset)
    const start = preCaretRange.toString().length

    const end = start + selectedText.length

    setSelectedText({
      start,
      end,
      selectedText,
      position
    })
    setShowCommentForm(true)
  }, [])

  // Handle mouse up for text selection
  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(handleTextSelection, 10) // Small delay to ensure selection is complete
    }

    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [handleTextSelection])

  // Handle comment creation
  const handleCreateComment = async (commentData: CreateCommentInput) => {
    try {
      const newComment = await commentsService.createComment(commentData)
      const updatedComments = [...comments, newComment]
      onCommentsUpdate(updatedComments)
      setShowCommentForm(false)
      setSelectedText(null)
    } catch {
      console.error('Error creating comment:', error)
      throw error
    }
  }

  // Handle comment actions
  const handleReply = async (parentId: string, content: string) => {
    try {
      const replyData: CreateCommentInput = {
        section_id: sectionId,
        content,
        parent_id: parentId,
        text_range_start: null,
        text_range_end: null,
        selected_text: null
      }
      
      const newReply = await commentsService.createComment(replyData)
      const updatedComments = [...comments, newReply]
      onCommentsUpdate(updatedComments)
    } catch {
      console.error('Error creating reply:', error)
    }
  }

  const handleEdit = async (commentId: string, content: string) => {
    try {
      const updatedComment = await commentsService.updateComment(commentId, { content })
      const updatedComments = comments.map(c => 
        c.id === commentId ? updatedComment : c
      )
      onCommentsUpdate(updatedComments)
    } catch {
      console.error('Error updating comment:', error)
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      await commentsService.deleteComment(commentId)
      const updatedComments = comments.filter(c => c.id !== commentId)
      onCommentsUpdate(updatedComments)
    } catch {
      console.error('Error deleting comment:', error)
    }
  }

  const handleResolve = async (commentId: string) => {
    try {
      const updatedComment = await commentsService.resolveComment(commentId)
      const updatedComments = comments.map(c => 
        c.id === commentId ? updatedComment : c
      )
      onCommentsUpdate(updatedComments)
    } catch {
      console.error('Error resolving comment:', error)
    }
  }

  const handleUnresolve = async (commentId: string) => {
    try {
      const updatedComment = await commentsService.unresolveComment(commentId)
      const updatedComments = comments.map(c => 
        c.id === commentId ? updatedComment : c
      )
      onCommentsUpdate(updatedComments)
    } catch {
      console.error('Error unresolving comment:', error)
    }
  }

  // Render content with comment highlights
  const renderContentWithHighlights = () => {
    if (commentMarkers.length === 0) {
      return <div dangerouslySetInnerHTML={{ __html: content }} />
    }

    // Sort markers by start position
    const sortedMarkers = [...commentMarkers].sort((a, b) => a.start - b.start)
    
    let lastIndex = 0
    const elements: React.ReactNode[] = []

    sortedMarkers.forEach((marker, index) => {
      // Add text before this marker
      if (marker.start > lastIndex) {
        const beforeText = content.slice(lastIndex, marker.start)
        elements.push(
          <span key={`text-${index}`} dangerouslySetInnerHTML={{ __html: beforeText }} />
        )
      }

      // Add highlighted text with comment marker
      const highlightedText = content.slice(marker.start, marker.end)
      const unresolvedCount = marker.comments.filter(c => c.resolved_at === null).length
      
      elements.push(
        <span
          key={`highlight-${marker.id}`}
          className={`relative cursor-pointer transition-colors ${
            unresolvedCount > 0 
              ? 'bg-yellow-100 border-b-2 border-yellow-400 hover:bg-yellow-200' 
              : 'bg-green-100 border-b-2 border-green-400 hover:bg-green-200'
          }`}
          onClick={() => setActiveCommentMarker(
            activeCommentMarker === marker.id ? null : marker.id
          )}
          title={`${marker.comments.length} comment${marker.comments.length !== 1 ? 's' : ''}`}
        >
          <span dangerouslySetInnerHTML={{ __html: highlightedText }} />
          <MessageCircle className="inline w-3 h-3 ml-1 text-brand-primary" />
          {unresolvedCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
              {unresolvedCount}
            </span>
          )}
        </span>
      )

      lastIndex = marker.end
    })

    // Add remaining text
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex)
      elements.push(
        <span key="text-end" dangerouslySetInnerHTML={{ __html: remainingText }} />
      )
    }

    return <div>{elements}</div>
  }

  return (
    <div className={`relative ${className}`}>
      {/* Content area with text selection */}
      <div
        ref={contentRef}
        className="prose prose-lg max-w-none select-text"
        style={{ userSelect: 'text' }}
      >
        {renderContentWithHighlights()}
      </div>

      {/* Comment form for new selections */}
      {showCommentForm && selectedText && (
        <div
          className="absolute z-50"
          style={{
            top: selectedText.position.top,
            left: selectedText.position.left,
            maxWidth: '400px'
          }}
        >
          <CommentForm
            sectionId={sectionId}
            textRange={selectedText}
            onSubmit={handleCreateComment}
            onCancel={() => {
              setShowCommentForm(false)
              setSelectedText(null)
            }}
          />
        </div>
      )}

      {/* Comment bubbles for existing comments */}
      {activeCommentMarker && (
        <div className="absolute z-40">
          {commentMarkers
            .filter(marker => marker.id === activeCommentMarker)
            .map(marker => (
              <div
                key={marker.id}
                className="absolute"
                style={{
                  top: marker.position.top,
                  left: marker.position.left + 300, // Position to the right
                  maxWidth: '400px'
                }}
              >
                <CommentBubble
                  comments={marker.comments}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onResolve={handleResolve}
                  onUnresolve={handleUnresolve}
                  currentUserId={currentUserId}
                />
              </div>
            ))}
        </div>
      )}

      {/* Floating comment button for general comments */}
      <button
        onClick={() => {
          setSelectedText({
            start: 0,
            end: 0,
            selectedText: '',
            position: { top: 0, left: 0 }
          })
          setShowCommentForm(true)
        }}
        className="fixed bottom-6 right-6 w-12 h-12 bg-brand-primary text-white rounded-full shadow-lg hover:bg-brand-primary-dark transition-colors flex items-center justify-center z-30"
        title="Add general comment"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Click outside to close */}
      {(showCommentForm || activeCommentMarker) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setShowCommentForm(false)
            setSelectedText(null)
            setActiveCommentMarker(null)
          }}
        />
      )}
    </div>
  )
} 