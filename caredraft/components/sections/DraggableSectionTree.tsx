'use client'

import React, { useState } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DragStart
} from '@hello-pangea/dnd'
import { SectionWithChildren } from '@/lib/sections'
import SectionTreeNode from './SectionTreeNode'

interface Owner {
  id: string
  email?: string
  full_name?: string
}

interface DraggableSectionTreeProps {
  sections: SectionWithChildren[]
  expandedSections: Set<string>
  selectedSectionId: string | null
  availableOwners?: Owner[]
  onToggleExpanded: (sectionId: string) => void
  onSelectSection: (sectionId: string) => void
  onUpdateSection: (sectionId: string, updates: Record<string, unknown>) => void
  onDeleteSection: (sectionId: string) => void
  onAddSubsection: (parentId: string) => void
  onReorderSections: (sourceId: string, destinationIndex: number) => void
}

export default function DraggableSectionTree({
  sections,
  expandedSections,
  selectedSectionId,
  availableOwners = [],
  onToggleExpanded,
  onSelectSection,
  onUpdateSection,
  onDeleteSection,
  onAddSubsection,
  onReorderSections
}: DraggableSectionTreeProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (start: DragStart) => {
    setIsDragging(true)
  }

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false)

    const { destination, source, draggableId } = result

    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    onReorderSections(draggableId, destination.index)
  }

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Droppable droppableId="section-tree">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-1 ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
          >
            {sections.map((section, index) => (
              <Draggable key={section.id} draggableId={section.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`${snapshot.isDragging ? 'shadow-lg bg-white rounded-lg' : ''}`}
                  >
                    <SectionTreeNode
                      section={section}
                      level={0}
                      isExpanded={expandedSections.has(section.id)}
                      isSelected={selectedSectionId === section.id}
                      onToggleExpanded={() => onToggleExpanded(section.id)}
                      onSelect={() => onSelectSection(section.id)}
                      onUpdate={(updates) => onUpdateSection(section.id, updates)}
                      onDelete={() => onDeleteSection(section.id)}
                      onAddChild={() => onAddSubsection(section.id)}
                      availableOwners={availableOwners}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
} 