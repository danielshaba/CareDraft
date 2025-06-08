import { createClient } from '@/lib/supabase'
import { Section, SectionInsert, SectionUpdate, SectionStatus } from '@/types/database'

const supabase = createClient()

export interface SectionWithChildren extends Section {
  children?: SectionWithChildren[]
  owner?: {
    id: string
    email?: string
    full_name?: string
  }
}

export interface CreateSectionData {
  title: string
  description?: string
  parentSectionId?: string
  wordCountLimit?: number
  ownerId?: string
  dueDate?: string
  projectId?: string
}

export interface UpdateSectionData {
  title?: string
  description?: string
  parentSectionId?: string
  wordCountLimit?: number
  status?: SectionStatus
  ownerId?: string
  dueDate?: string
  content?: string
  sortOrder?: number
}

/**
 * Get all sections for a project with hierarchical structure
 */
export async function getSectionsHierarchy(projectId?: string): Promise<SectionWithChildren[]> {
  try {
    let query = supabase
      .from('sections')
      .select(`
        *,
        owner:auth.users(id, email, raw_user_meta_data)
      `)
      .order('sort_order', { ascending: true })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data: sections, error } = await query

    if (error) throw error

    // Build hierarchical structure
    const sectionMap = new Map<string, SectionWithChildren>()
    const rootSections: SectionWithChildren[] = []

    // First pass: create map of all sections
    sections?.forEach(section => {
      const sectionWithChildren: SectionWithChildren = {
        ...section,
        children: [],
        owner: section.owner ? {
          id: section.owner.id,
          email: section.owner.email,
          full_name: section.owner.raw_user_meta_data?.full_name
        } : undefined
      }
      sectionMap.set(section.id, sectionWithChildren)
    })

    // Second pass: build hierarchy
    sections?.forEach(section => {
      const sectionWithChildren = sectionMap.get(section.id)!
      
      if (section.parent_section_id) {
        const parent = sectionMap.get(section.parent_section_id)
        if (parent) {
          parent.children!.push(sectionWithChildren)
        }
      } else {
        rootSections.push(sectionWithChildren)
      }
    })

    return rootSections
  } catch {
    console.error('Error fetching sections hierarchy:', error)
    throw error
  }
}

/**
 * Get a single section by ID
 */
export async function getSection(id: string): Promise<Section | null> {
  try {
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch {
    console.error('Error fetching section:', error)
    throw error
  }
}

/**
 * Create a new section
 */
export async function createSection(sectionData: CreateSectionData): Promise<Section> {
  try {
    // Get the next sort order for the parent
    let sortOrder = 0
    if (sectionData.parentSectionId) {
      const { data: siblings } = await supabase
        .from('sections')
        .select('sort_order')
        .eq('parent_section_id', sectionData.parentSectionId)
        .order('sort_order', { ascending: false })
        .limit(1)

      if (siblings && siblings.length > 0) {
        sortOrder = siblings[0].sort_order + 1
      }
    } else {
      const { data: rootSections } = await supabase
        .from('sections')
        .select('sort_order')
        .is('parent_section_id', null)
        .order('sort_order', { ascending: false })
        .limit(1)

      if (rootSections && rootSections.length > 0) {
        sortOrder = rootSections[0].sort_order + 1
      }
    }

    const insertData: SectionInsert = {
      title: sectionData.title,
      description: sectionData.description,
      parent_section_id: sectionData.parentSectionId,
      word_count_limit: sectionData.wordCountLimit || 0,
      owner_id: sectionData.ownerId,
      due_date: sectionData.dueDate,
      project_id: sectionData.projectId,
      sort_order: sortOrder
    }

    const { data, error } = await supabase
      .from('sections')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    return data
  } catch {
    console.error('Error creating section:', error)
    throw error
  }
}

/**
 * Update a section
 */
export async function updateSection(id: string, updates: UpdateSectionData): Promise<Section> {
  try {
    const updateData: SectionUpdate = {}

    // Only include defined fields in the update
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.parentSectionId !== undefined) updateData.parent_section_id = updates.parentSectionId
    if (updates.wordCountLimit !== undefined) updateData.word_count_limit = updates.wordCountLimit
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.ownerId !== undefined) updateData.owner_id = updates.ownerId
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate
    if (updates.content !== undefined) updateData.content = updates.content
    if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder

    const { data, error } = await supabase
      .from('sections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch {
    console.error('Error updating section:', error)
    throw error
  }
}

/**
 * Delete a section and all its children
 */
export async function deleteSection(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('sections')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch {
    console.error('Error deleting section:', error)
    throw error
  }
}

/**
 * Reorder sections within the same parent
 */
export async function reorderSections(sectionIds: string[], parentSectionId?: string): Promise<void> {
  try {
    const updates = sectionIds.map((id, index) => ({
      id,
      sort_order: index
    }))

    for (const update of updates) {
      await supabase
        .from('sections')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
    }
  } catch {
    console.error('Error reordering sections:', error)
    throw error
  }
}

/**
 * Move a section to a different parent
 */
export async function moveSectionToParent(
  sectionId: string, 
  newParentId?: string
): Promise<Section> {
  try {
    // Get the next sort order for the new parent
    let sortOrder = 0
    if (newParentId) {
      const { data: siblings } = await supabase
        .from('sections')
        .select('sort_order')
        .eq('parent_section_id', newParentId)
        .order('sort_order', { ascending: false })
        .limit(1)

      if (siblings && siblings.length > 0) {
        sortOrder = siblings[0].sort_order + 1
      }
    } else {
      const { data: rootSections } = await supabase
        .from('sections')
        .select('sort_order')
        .is('parent_section_id', null)
        .order('sort_order', { ascending: false })
        .limit(1)

      if (rootSections && rootSections.length > 0) {
        sortOrder = rootSections[0].sort_order + 1
      }
    }

    const { data, error } = await supabase
      .from('sections')
      .update({
        parent_section_id: newParentId,
        sort_order: sortOrder
      })
      .eq('id', sectionId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch {
    console.error('Error moving section:', error)
    throw error
  }
}

/**
 * Get sections by status
 */
export async function getSectionsByStatus(status: SectionStatus, projectId?: string): Promise<Section[]> {
  try {
    let query = supabase
      .from('sections')
      .select('*')
      .eq('status', status)
      .order('due_date', { ascending: true })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch {
    console.error('Error fetching sections by status:', error)
    throw error
  }
}

/**
 * Get sections assigned to a user
 */
export async function getSectionsByOwner(ownerId: string, projectId?: string): Promise<Section[]> {
  try {
    let query = supabase
      .from('sections')
      .select('*')
      .eq('owner_id', ownerId)
      .order('due_date', { ascending: true })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch {
    console.error('Error fetching sections by owner:', error)
    throw error
  }
}

/**
 * Get overdue sections
 */
export async function getOverdueSections(projectId?: string): Promise<Section[]> {
  try {
    const now = new Date().toISOString()
    
    let query = supabase
      .from('sections')
      .select('*')
      .lt('due_date', now)
      .neq('status', 'complete')
      .order('due_date', { ascending: true })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch {
    console.error('Error fetching overdue sections:', error)
    throw error
  }
}

/**
 * Reorder a section to a new position (handles both same-parent reordering and parent changes)
 */
export async function reorderSection(
  sectionId: string,
  destinationIndex: number,
  newParentId?: string
): Promise<Section> {
  try {
    // Get the section being moved
    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .select('*')
      .eq('id', sectionId)
      .single()

    if (sectionError) throw sectionError
    if (!section) throw new Error('Section not found')

    // Get all siblings in the destination parent
    let siblingsQuery = supabase
      .from('sections')
      .select('id, sort_order')
      .order('sort_order', { ascending: true })

    if (newParentId) {
      siblingsQuery = siblingsQuery.eq('parent_section_id', newParentId)
    } else {
      siblingsQuery = siblingsQuery.is('parent_section_id', null)
    }

    const { data: siblings, error: siblingsError } = await siblingsQuery

    if (siblingsError) throw siblingsError

    // Filter out the section being moved if it's already in this parent
    const filteredSiblings = (siblings || []).filter(s => s.id !== sectionId)

    // Insert the section at the destination index
    const newSiblings = [...filteredSiblings]
    newSiblings.splice(destinationIndex, 0, { id: sectionId, sort_order: 0 })

    // Update sort orders for all affected sections
    const updates = newSiblings.map((sibling, index) => ({
      id: sibling.id,
      sort_order: index,
      ...(sibling.id === sectionId && newParentId !== undefined ? { parent_section_id: newParentId } : {})
    }))

    // Execute all updates
    for (const update of updates) {
      const updateData: unknown = { sort_order: update.sort_order }
      if (update.parent_section_id !== undefined) {
        updateData.parent_section_id = update.parent_section_id
      }

      await supabase
        .from('sections')
        .update(updateData)
        .eq('id', update.id)
    }

    // Return the updated section
    const { data: updatedSection, error: updateError } = await supabase
      .from('sections')
      .select('*')
      .eq('id', sectionId)
      .single()

    if (updateError) throw updateError
    return updatedSection
  } catch {
    console.error('Error reordering section:', error)
    throw error
  }
} 