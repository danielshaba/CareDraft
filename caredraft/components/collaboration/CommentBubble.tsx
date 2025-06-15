'use client'

import React, { useState } from 'react'
import { MessageCircle, MoreVertical, Check, X, Reply, Edit, Trash2 } from 'lucide-react'
import { Comment } from '@/types/collaboration'
import { formatTimeAgo, getUserDisplayName, getUserColor } from '@/types/collaboration'

interface CommentBubbleProps {
  comments: Comment[]
  onReply: (parentId: string, content: string) => void
  onEdit: (commentId: string, content: string) => void
  onDelete: (commentId: string) => void
  onResolve: (commentId: string) => void
  onUnresolve: (commentId: string) => void
  currentUserId: string
  className?: string
}

interface CommentItemProps {
  comment: Comment
  onReply: (content: string) => void
  onEdit: (content: string) => void
  onDelete: () => void
  onResolve: () => void
  onUnresolve: () => void
  canEdit: boolean
  canDelete: boolean
  level: number
  currentUserId: string
}

function CommentItem({
  comment,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  onUnresolve,
  canEdit,
  canDelete,
  level,
  currentUserId
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [editText, setEditText] = useState(comment.content)
  const [showActions, setShowActions] = useState(false)

  const userColor = getUserColor(comment.user_id)
  const displayName = getUserDisplayName(comment.user || { email: '', user_metadata: {} })
  const isResolved = comment.is_resolved

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (replyText.trim()) {
      onReply(replyText.trim())
      setReplyText('')
      setIsReplying(false)
    }
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editText.trim() && editText.trim() !== comment.content) {
      onEdit(editText.trim())
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditText(comment.content)
    setIsEditing(false)
  }

  return (
    <div 
      className={`relative ${level > 0 ? 'ml-8 mt-3' : ''}`}
      style={{ marginLeft: level > 0 ? `${level * 2}rem` : '0' }}
    >
      {/* Thread line for nested comments */}
      {level > 0 && (
        <div 
          className="absolute -left-4 top-0 bottom-0 w-0.5 bg-gray-200"
          style={{ left: `-${level * 0.5}rem` }}
        />
      )}

      <div className={`group p-3 rounded-lg border transition-colors ${
        isResolved 
          ? 'bg-green-50 border-green-200' 
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}>
        {/* Comment Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
              style={{ backgroundColor: userColor }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">{displayName}</span>
              <span className="text-xs text-gray-500">
                {formatTimeAgo(comment.created_at)}
                {comment.updated_at !== comment.created_at && ' (edited)'}
              </span>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>

            {showActions && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                {!isResolved && (
                  <button
                    onClick={() => {
                      setIsReplying(true)
                      setShowActions(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Reply className="w-3 h-3" />
                    Reply
                  </button>
                )}
                
                {canEdit && !isResolved && (
                  <button
                    onClick={() => {
                      setIsEditing(true)
                      setShowActions(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                )}

                {comment.parent_comment_id === null && (
                  <button
                    onClick={() => {
                      if (isResolved) { onUnresolve() } else { onResolve() }
                      setShowActions(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    {isResolved ? (
                      <>
                        <X className="w-3 h-3" />
                        Unresolve
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" />
                        Resolve
                      </>
                    )}
                  </button>
                )}

                {canDelete && (
                  <>
                    <div className="border-t border-gray-100" />
                    <button
                      onClick={() => {
                        onDelete()
                        setShowActions(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              rows={3}
              placeholder="Edit your comment..."
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!editText.trim() || editText.trim() === comment.content}
                className="px-3 py-1 text-xs font-medium text-white bg-brand-primary rounded hover:bg-brand-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</div>
        )}

        {/* Reply Form */}
        {isReplying && (
          <form onSubmit={handleReplySubmit} className="mt-3 space-y-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              rows={3}
              placeholder="Write a reply..."
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="px-3 py-1 text-xs font-medium text-white bg-brand-primary rounded hover:bg-brand-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reply
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsReplying(false)
                  setReplyText('')
                }}
                className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Resolution Badge */}
        {isResolved && (
          <div className="mt-2 flex items-center gap-1 text-xs text-green-700">
            <Check className="w-3 h-3" />
            Resolved
          </div>
        )}
      </div>

      {/* Render nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={(content) => onReply(content)}
              onEdit={(content) => onEdit(content)}
              onDelete={() => onDelete()}
              onResolve={() => onResolve()}
              onUnresolve={() => onUnresolve()}
              canEdit={reply.user_id === currentUserId}
              canDelete={reply.user_id === currentUserId}
              level={level + 1}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CommentBubble({
  comments,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  onUnresolve,
  currentUserId,
  className = ''
}: CommentBubbleProps) {
  // Sort comments to show unresolved first, then by creation date
  const sortedComments = [...comments].sort((a, b) => {
    if (!a.is_resolved && b.is_resolved) return -1
    if (a.is_resolved && !b.is_resolved) return 1
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  const unresolvedCount = comments.filter(c => !c.is_resolved).length
  const totalCount = comments.length

  if (comments.length === 0) return null

  return (
    <div className={`w-80 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-brand-primary" />
            <span className="text-sm font-medium text-gray-900">
              {totalCount} comment{totalCount !== 1 ? 's' : ''}
            </span>
          </div>
          {unresolvedCount > 0 && (
            <span className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-full">
              {unresolvedCount} unresolved
            </span>
          )}
        </div>
      </div>

      {/* Comments List */}
      <div className="p-4 space-y-4">
        {sortedComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onReply={(content) => onReply(comment.id, content)}
            onEdit={(content) => onEdit(comment.id, content)}
            onDelete={() => onDelete(comment.id)}
            onResolve={() => onResolve(comment.id)}
            onUnresolve={() => onUnresolve(comment.id)}
            canEdit={comment.user_id === currentUserId}
            canDelete={comment.user_id === currentUserId}
            level={0}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  )
} 