'use client'

import React, { useState, useEffect } from 'react'
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  MoreHorizontal,
  FileText,
  Folder,
  FolderOpen
} from 'lucide-react'
import { SectionWithChildren, reorderSection } from '@/lib/sections'
import { SectionStatus } from '@/types/database'
import SectionTreeNode from './SectionTreeNode'
import AddSectionModal from './AddSectionModal'
import DraggableSectionTree from './DraggableSectionTree'

interface SectionManagementSidebarProps {
  sections: SectionWithChildren[]
  onSectionSelect?: (sectionId: string) => void
  onSectionUpdate?: (sectionId: string, updates: Record<string, unknown>) => void
  onSectionCreate?: (sectionData: Record<string, unknown>) => void
  onSectionDelete?: (sectionId: string) => void
  onSectionReorder?: (sourceId: string, destinationIndex: number) => void
  selectedSectionId?: string
  className?: string
}

export default function SectionManagementSidebar({
  sections,
  onSectionSelect,
  onSectionUpdate,
  onSectionCreate,
  onSectionDelete,
  selectedSectionId,
  className = ''
}: SectionManagementSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [addModalParentId, setAddModalParentId] = useState<string | undefined>()

  // Auto-expand sections that have children or are selected
  useEffect(() => {
    const autoExpand = (sections: SectionWithChildren[], parentExpanded = true) => {
      sections.forEach(section => {
        if (section.children && section.children.length > 0) {
          setExpandedSections(prev => new Set([...prev, section.id]))
        }
        if (section.id === selectedSectionId && parentExpanded) {
          // Expand all parents of selected section
          let current = sections.find(s => s.id === selectedSectionId)
          while (current?.parent_section_id) {
            setExpandedSections(prev => new Set([...prev, current!.parent_section_id!]))
            current = findSectionById(sections, current.parent_section_id)
          }
        }
        if (section.children) {
          autoExpand(section.children, expandedSections.has(section.id))
        }
      })
    }
    autoExpand(sections)
  }, [sections, selectedSectionId])

  const findSectionById = (sections: SectionWithChildren[], id: string): SectionWithChildren | undefined => {
    for (const section of sections) {
      if (section.id === id) return section
      if (section.children) {
        const found = findSectionById(section.children, id)
        if (found) return found
      }
    }
    return undefined
  }

  const toggleExpanded = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const handleAddSection = (parentId?: string) => {
    setAddModalParentId(parentId)
    setShowAddModal(true)
  }

  const handleCreateSection = (sectionData: Record<string, unknown>) => {
    onSectionCreate?.({
      ...sectionData,
      parentSectionId: addModalParentId
    })
    setShowAddModal(false)
    setAddModalParentId(undefined)
  }

  const getStatusColor = (status: SectionStatus): string => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-700'
      case 'in_progress': return 'bg-brand-100 text-brand-700'
      case 'review': return 'bg-yellow-100 text-yellow-700'
      case 'complete': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const renderSectionTree = (sections: SectionWithChildren[], level = 0) => {
    return sections.map(section => (
      <SectionTreeNode
        key={section.id}
        section={section}
        level={level}
        isExpanded={expandedSections.has(section.id)}
        isSelected={section.id === selectedSectionId}
        onToggleExpanded={() => toggleExpanded(section.id)}
        onSelect={() => onSectionSelect?.(section.id)}
        onUpdate={(updates) => onSectionUpdate?.(section.id, updates)}
        onDelete={() => onSectionDelete?.(section.id)}
        onAddChild={() => handleAddSection(section.id)}
        getStatusColor={getStatusColor}
      >
        {section.children && section.children.length > 0 && expandedSections.has(section.id) && (
          <div className="ml-4">
            {renderSectionTree(section.children, level + 1)}
          </div>
        )}
      </SectionTreeNode>
    ))
  }

  return (
    <div className={`bg-white border-r border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Sections</h3>
          <button
            onClick={() => handleAddSection()}
            className="p-2 text-gray-500 hover:text-brand-primary hover:bg-gray-100 rounded-lg transition-colors"
            title="Add root section"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Organize your proposal content
        </p>
      </div>

      {/* Section Tree */}
      <div className="flex-1 overflow-y-auto">
        {sections.length === 0 ? (
          <div className="p-4 text-center">
            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-3">No sections yet</p>
            <button
              onClick={() => handleAddSection()}
              className="px-3 py-2 text-sm font-medium text-brand-primary bg-brand-primary-light rounded-lg hover:bg-brand-primary-light transition-colors"
            >
              Create first section
            </button>
          </div>
        ) : (
          <div className="p-2">
            <DraggableSectionTree
              sections={sections}
              expandedSections={expandedSections}
              selectedSectionId={selectedSectionId}
              onToggleExpanded={toggleExpanded}
              onSelectSection={(id) => onSectionSelect?.(id)}
              onUpdateSection={(id, updates) => onSectionUpdate?.(id, updates)}
              onDeleteSection={(id) => onSectionDelete?.(id)}
              onAddSubsection={handleAddSection}
              onReorderSections={async (sourceId, destinationIndex) => {
                try {
                  const { reorderSection } = await import('@/lib/sections')
                  await reorderSection(sourceId, destinationIndex)
                  // Refresh sections after reordering
                  window.location.reload() // Temporary - should use proper state management
                } catch {
                  console.error('Error reordering section:', error)
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Add Section Modal */}
      {showAddModal && (
        <AddSectionModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false)
            setAddModalParentId(undefined)
          }}
          onSubmit={handleCreateSection}
          parentSectionId={addModalParentId}
          parentSectionTitle={
            addModalParentId 
              ? findSectionById(sections, addModalParentId)?.title 
              : undefined
          }
        />
      )}
    </div>
  )
} 