'use client'

import React, { useState } from 'react'
import { Editor } from '@tiptap/react'
import { Bold, Italic, Clipboard } from 'lucide-react'
import AnswerBankModal from './AnswerBankModal'

interface EditorToolbarProps {
  editor: Editor | null
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const [isAnswerBankOpen, setIsAnswerBankOpen] = useState(false)

  if (!editor) {
    return (
      <div className="flex items-center space-x-1 p-3 border-b border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-500">Toolbar loading...</div>
      </div>
    )
  }

  const handleInsertAnswer = (content: string) => {
    if (!editor) return
    
    // Get current cursor position
    // const { from } = editor.state.selection
    
    // Insert content at cursor position
    editor.chain().focus().insertContent(content).run()
    
    // Close the modal
    setIsAnswerBankOpen(false)
  }

  return (
    <>
      <div className="flex items-center space-x-2 p-3 border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded ${
            editor.isActive('bold') ? 'bg-brand-primary-light text-brand-primary-dark' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded ${
            editor.isActive('italic') ? 'bg-brand-primary-light text-brand-primary-dark' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>

        {/* Separator */}
        <div className="h-6 w-px bg-gray-300 mx-1" />

        {/* Answer Bank Button */}
        <button
          onClick={() => setIsAnswerBankOpen(true)}
          className="p-2 rounded text-gray-600 hover:bg-brand-primary-light hover:text-brand-primary-dark transition-colors"
          title="Answer Bank - Insert saved content"
        >
          <Clipboard className="h-4 w-4" />
        </button>

        <div className="ml-auto text-xs text-gray-500">
          Ready to format text
        </div>
      </div>

      {/* Answer Bank Modal */}
      <AnswerBankModal
        isOpen={isAnswerBankOpen}
        onClose={() => setIsAnswerBankOpen(false)}
        onInsert={handleInsertAnswer}
      />
    </>
  )
} 