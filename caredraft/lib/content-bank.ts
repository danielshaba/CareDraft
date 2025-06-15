/**
 * Content Bank Service
 * Manages saved extraction results and reusable content snippets
 */

export interface ContentBankItem {
  id: string
  content: string
  category: string
  categoryLabel: string
  confidence?: number
  sourceDocument: string
  sourceText?: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  isEdited: boolean
  originalContent?: string
}

export interface DraftItem {
  id: string
  content: string
  category: string
  categoryLabel: string
  position: number
  createdAt: Date
  updatedAt: Date
}

// In-memory storage for now (will be replaced with database integration)
let contentBank: ContentBankItem[] = []
let draftItems: DraftItem[] = []
let itemCounter = 0

/**
 * Save an extraction result to the content bank
 */
export function saveToContentBank(
  content: string,
  category: string,
  categoryLabel: string,
  sourceDocument: string,
  confidence?: number,
  sourceText?: string,
  tags: string[] = []
): ContentBankItem {
  const item: ContentBankItem = {
    id: `bank-${++itemCounter}`,
    content,
    category,
    categoryLabel,
    confidence,
    sourceDocument,
    sourceText,
    tags,
    createdAt: new Date(),
    updatedAt: new Date(),
    isEdited: false
  }
  
  contentBank.push(item)
  return item
}

/**
 * Add content to draft for tender response
 */
export function addToDraft(
  content: string,
  category: string,
  categoryLabel: string
): DraftItem {
  const item: DraftItem = {
    id: `draft-${++itemCounter}`,
    content,
    category,
    categoryLabel,
    position: draftItems.length,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  draftItems.push(item)
  return item
}

/**
 * Get all content bank items
 */
export function getContentBankItems(category?: string): ContentBankItem[] {
  if (category) {
    return contentBank.filter(item => item.category === category)
  }
  return [...contentBank]
}

/**
 * Get all draft items
 */
export function getDraftItems(category?: string): DraftItem[] {
  if (category) {
    return draftItems.filter(item => item.category === category)
  }
  return [...draftItems].sort((a, b) => a.position - b.position)
}

/**
 * Update content bank item
 */
export function updateContentBankItem(
  id: string,
  updates: Partial<Pick<ContentBankItem, 'content' | 'tags'>>
): ContentBankItem | null {
  const index = contentBank.findIndex(item => item.id === id)
  if (index === -1) return null
  
  const originalContent = contentBank[index].originalContent || contentBank[index].content
  
  contentBank[index] = {
    ...contentBank[index],
    ...updates,
    updatedAt: new Date(),
    isEdited: true,
    originalContent: contentBank[index].isEdited ? originalContent : contentBank[index].content
  }
  
  return contentBank[index]
}

/**
 * Remove item from content bank
 */
export function removeFromContentBank(id: string): boolean {
  const index = contentBank.findIndex(item => item.id === id)
  if (index === -1) return false
  
  contentBank.splice(index, 1)
  return true
}

/**
 * Remove item from draft
 */
export function removeFromDraft(id: string): boolean {
  const index = draftItems.findIndex(item => item.id === id)
  if (index === -1) return false
  
  draftItems.splice(index, 1)
  
  // Reorder positions
  draftItems.forEach((item, idx) => {
    item.position = idx
  })
  
  return true
}

/**
 * Reorder draft items
 */
export function reorderDraftItems(itemIds: string[]): boolean {
  try {
    const reorderedItems = itemIds.map((id, index) => {
      const item = draftItems.find(item => item.id === id)
      if (!item) throw new Error(`Draft item ${id} not found`)
      return { ...item, position: index }
    })
    
    draftItems = reorderedItems
    return true
  } catch (error) {
    console.error('Failed to reorder draft items:', error)
    return false
  }
}

/**
 * Export content bank as JSON
 */
export function exportContentBank(): string {
  return JSON.stringify({
    contentBank,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  }, null, 2)
}

/**
 * Export draft as text
 */
export function exportDraft(): string {
  const sortedItems = getDraftItems()
  
  let output = `# Tender Response Draft\n\nGenerated on: ${new Date().toLocaleDateString()}\n\n`
  
  const groupedByCategory = sortedItems.reduce((acc, item) => {
    if (!acc[item.categoryLabel]) {
      acc[item.categoryLabel] = []
    }
    acc[item.categoryLabel].push(item)
    return acc
  }, {} as Record<string, DraftItem[]>)
  
  Object.entries(groupedByCategory).forEach(([categoryLabel, items]) => {
    output += `## ${categoryLabel}\n\n`
    items.forEach((item, index) => {
      output += `${index + 1}. ${item.content}\n\n`
    })
  })
  
  return output
}

/**
 * Clear all data (for testing/reset)
 */
export function clearAllData(): void {
  contentBank = []
  draftItems = []
  itemCounter = 0
}

/**
 * Get statistics
 */
export function getStatistics() {
  return {
    contentBankCount: contentBank.length,
    draftItemsCount: draftItems.length,
    categoriesInBank: [...new Set(contentBank.map(item => item.category))].length,
    categoriesInDraft: [...new Set(draftItems.map(item => item.category))].length
  }
} 