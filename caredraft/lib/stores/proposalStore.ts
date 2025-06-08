import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { createClient } from '@supabase/supabase-js'
import type { 
  ProposalStore, 
  ActiveProposal, 
  ProposalSection, 
  ProposalOperation,
  ProposalCollaborator 
} from '@/lib/types/store.types'
import type { Database, ProposalStatus } from '@/lib/database.types'

// Create Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Auto-save interval (5 seconds)
const AUTO_SAVE_INTERVAL = 5000

// Initial state
const initialState = {
  // Active proposal
  activeProposal: null,
  isLoadingProposal: false,
  
  // Sections management
  sections: [],
  expandedSections: new Set<string>(),
  isDraftMode: true,
  
  // Editing state
  isEditingSection: null,
  hasUnsavedChanges: false,
  lastSaved: null,
  autoSaveEnabled: true,
  isSaving: false,
  
  // Collaboration
  collaborators: [],
  isLoadingCollaborators: false,
  
  // History and operations
  operationHistory: [],
  undoStack: [],
  redoStack: [],
  
  // Real-time sync
  isOnline: true,
  lastSyncTime: null,
  pendingOperations: [],
  
  // Error handling
  error: null,
  lastError: null,
}

// Auto-save timer
let autoSaveTimer: NodeJS.Timeout | null = null

export const useProposalStore = create<ProposalStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,

          // ==================== PROPOSAL MANAGEMENT ====================
          
          loadProposal: async (proposalId: string) => {
            set((state) => {
              state.isLoadingProposal = true
              state.error = null
            })

            try {
              // Load proposal data
              const { data: proposal, error: proposalError } = await supabase
                .from('proposals')
                .select('*')
                .eq('id', proposalId)
                .single()

              if (proposalError) {
                throw new Error(proposalError.message)
              }

              // Load sections
              const { data: sections, error: sectionsError } = await supabase
                .from('sections')
                .select('*')
                .eq('proposal_id', proposalId)
                .order('order_index')

              if (sectionsError) {
                throw new Error(sectionsError.message)
              }

              // Create active proposal with sections
              const activeProposal: ActiveProposal = {
                ...proposal,
                sections: sections?.map(section => ({
                  ...section,
                  isExpanded: false,
                  isEditing: false,
                  hasUnsavedChanges: false,
                  lastSaved: new Date(),
                })) || [],
                collaborators: [], // Will be loaded separately
                isOwner: true, // Will be determined by current user
              }

              set((state) => {
                state.activeProposal = activeProposal
                state.sections = activeProposal.sections
                state.isLoadingProposal = false
                state.hasUnsavedChanges = false
                state.lastSaved = new Date()
                state.error = null
              })

              // Load collaborators
              get().loadCollaborators(proposalId)

              return true
            } catch (error: unknown) {
              const errorMessage = error.message || 'Failed to load proposal'
              set((state) => {
                state.isLoadingProposal = false
                state.error = errorMessage
                state.lastError = new Date()
              })
              return false
            }
          },

          createProposal: async (proposalData: unknown) => {
            set((state) => {
              state.isLoadingProposal = true
              state.error = null
            })

            try {
              const { data: proposal, error } = await supabase
                .from('proposals')
                .insert(proposalData)
                .select()
                .single()

              if (error) {
                throw new Error(error.message)
              }

              const activeProposal: ActiveProposal = {
                ...proposal,
                sections: [],
                collaborators: [],
                isOwner: true,
              }

              set((state) => {
                state.activeProposal = activeProposal
                state.sections = []
                state.isLoadingProposal = false
                state.hasUnsavedChanges = false
                state.lastSaved = new Date()
                state.error = null
              })

              return proposal.id
            } catch (error: unknown) {
              const errorMessage = error.message || 'Failed to create proposal'
              set((state) => {
                state.isLoadingProposal = false
                state.error = errorMessage
                state.lastError = new Date()
              })
              return null
            }
          },

          updateProposal: async (updates: unknown) => {
            const state = get()
            if (!state.activeProposal) return false

            try {
              const { data, error } = await supabase
                .from('proposals')
                .update(updates)
                .eq('id', state.activeProposal.id)
                .select()
                .single()

              if (error) {
                throw new Error(error.message)
              }

              set((state) => {
                if (state.activeProposal && data) {
                  state.activeProposal = { ...state.activeProposal, ...data }
                  state.lastSaved = new Date()
                }
              })

              return true
            } catch (error: unknown) {
              set((state) => {
                state.error = error.message || 'Failed to update proposal'
                state.lastError = new Date()
              })
              return false
            }
          },

          // ==================== SECTION MANAGEMENT ====================

          addSection: async (section: Partial<any>) => {
            const state = get()
            if (!state.activeProposal) return null

            // Optimistic update
            const tempId = `temp-${Date.now()}`
            const newSection: ProposalSection = {
              id: tempId,
              proposal_id: state.activeProposal.id,
              title: section.title || 'New Section',
              content: section.content || '',
              order_index: state.sections.length,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              isExpanded: true,
              isEditing: true,
              hasUnsavedChanges: true,
              lastSaved: new Date(),
            }

            set((state) => {
              state.sections.push(newSection)
              state.hasUnsavedChanges = true
            })

            try {
              const { data, error } = await supabase
                .from('sections')
                .insert({
                  proposal_id: state.activeProposal.id,
                  title: section.title || 'New Section',
                  content: section.content || '',
                  order_index: state.sections.length - 1,
                })
                .select()
                .single()

              if (error) {
                // Rollback optimistic update
                set((state) => {
                  state.sections = state.sections.filter(s => s.id !== tempId)
                })
                throw new Error(error.message)
              }

              // Update with real ID
              set((state) => {
                const sectionIndex = state.sections.findIndex(s => s.id === tempId)
                if (sectionIndex !== -1 && data) {
                  state.sections[sectionIndex] = {
                    ...data,
                    isExpanded: true,
                    isEditing: true,
                    hasUnsavedChanges: false,
                    lastSaved: new Date(),
                  }
                }
              })

              return data.id
            } catch (error: unknown) {
              set((state) => {
                state.error = error.message || 'Failed to add section'
                state.lastError = new Date()
              })
              return null
            }
          },

          updateSection: async (sectionId: string, updates: unknown) => {
            // Optimistic update
            set((state) => {
              const sectionIndex = state.sections.findIndex(s => s.id === sectionId)
              if (sectionIndex !== -1) {
                state.sections[sectionIndex] = {
                  ...state.sections[sectionIndex],
                  ...updates,
                  hasUnsavedChanges: true,
                }
                state.hasUnsavedChanges = true
              }
            })

            try {
              const { data, error } = await supabase
                .from('sections')
                .update(updates)
                .eq('id', sectionId)
                .select()
                .single()

              if (error) {
                throw new Error(error.message)
              }

              // Update with server data
              set((state) => {
                const sectionIndex = state.sections.findIndex(s => s.id === sectionId)
                if (sectionIndex !== -1 && data) {
                  state.sections[sectionIndex] = {
                    ...state.sections[sectionIndex],
                    ...data,
                    hasUnsavedChanges: false,
                    lastSaved: new Date(),
                  }
                }
              })

              return true
            } catch (error: unknown) {
              set((state) => {
                state.error = error.message || 'Failed to update section'
                state.lastError = new Date()
              })
              return false
            }
          },

          deleteSection: async (sectionId: string) => {
            // Store section for potential rollback
            const state = get()
            const sectionToDelete = state.sections.find(s => s.id === sectionId)
            if (!sectionToDelete) return false

            // Optimistic update
            set((state) => {
              state.sections = state.sections.filter(s => s.id !== sectionId)
              state.hasUnsavedChanges = true
            })

            try {
              const { error } = await supabase
                .from('sections')
                .delete()
                .eq('id', sectionId)

              if (error) {
                // Rollback
                set((state) => {
                  state.sections.push(sectionToDelete)
                  state.sections.sort((a, b) => a.order_index - b.order_index)
                })
                throw new Error(error.message)
              }

              return true
            } catch (error: unknown) {
              set((state) => {
                state.error = error.message || 'Failed to delete section'
                state.lastError = new Date()
              })
              return false
            }
          },

          reorderSections: async (sectionIds: string[]) => {
            // Optimistic update
            const state = get()
            const reorderedSections = sectionIds.map((id, index) => {
              const section = state.sections.find(s => s.id === id)
              return section ? { ...section, order_index: index } : null
            }).filter(Boolean) as ProposalSection[]

            set((state) => {
              state.sections = reorderedSections
              state.hasUnsavedChanges = true
            })

            try {
              // Update order in database
              const updates = sectionIds.map((id, index) => ({
                id,
                order_index: index,
              }))

              for (const update of updates) {
                const { error } = await supabase
                  .from('sections')
                  .update({ order_index: update.order_index })
                  .eq('id', update.id)

                if (error) {
                  throw new Error(error.message)
                }
              }

              return true
            } catch (error: unknown) {
              // Rollback would be complex, so we'll reload the proposal
              if (state.activeProposal?.id) {
                get().loadProposal(state.activeProposal.id)
              }
              set((state) => {
                state.error = error.message || 'Failed to reorder sections'
                state.lastError = new Date()
              })
              return false
            }
          },

          // ==================== COLLABORATION ====================

          loadCollaborators: async (proposalId: string) => {
            set((state) => {
              state.isLoadingCollaborators = true
            })

            try {
              // This would load collaborators from a collaborators table
              // For now, we'll set empty array
              set((state) => {
                state.collaborators = []
                state.isLoadingCollaborators = false
              })

              return true
            } catch (error: unknown) {
              set((state) => {
                state.isLoadingCollaborators = false
                state.error = error.message || 'Failed to load collaborators'
                state.lastError = new Date()
              })
              return false
            }
          },

          // ==================== AUTO-SAVE ====================

          enableAutoSave: () => {
            set((state) => {
              state.autoSaveEnabled = true
            })

            // Start auto-save timer
            if (autoSaveTimer) {
              clearInterval(autoSaveTimer)
            }

            autoSaveTimer = setInterval(() => {
              const state = get()
              if (state.hasUnsavedChanges && state.autoSaveEnabled && !state.isSaving) {
                get().saveProposal()
              }
            }, AUTO_SAVE_INTERVAL)
          },

          disableAutoSave: () => {
            set((state) => {
              state.autoSaveEnabled = false
            })

            if (autoSaveTimer) {
              clearInterval(autoSaveTimer)
              autoSaveTimer = null
            }
          },

          saveProposal: async () => {
            const state = get()
            if (!state.activeProposal || !state.hasUnsavedChanges) return true

            set((state) => {
              state.isSaving = true
            })

            try {
              // Save proposal updates
              await get().updateProposal({
                updated_at: new Date().toISOString(),
              })

              // Save section updates
              for (const section of state.sections) {
                if (section.hasUnsavedChanges) {
                  await get().updateSection(section.id, {
                    title: section.title,
                    content: section.content,
                    updated_at: new Date().toISOString(),
                  })
                }
              }

              set((state) => {
                state.hasUnsavedChanges = false
                state.lastSaved = new Date()
                state.isSaving = false
              })

              return true
            } catch (error: unknown) {
              set((state) => {
                state.isSaving = false
                state.error = error.message || 'Failed to save proposal'
                state.lastError = new Date()
              })
              return false
            }
          },

          // ==================== UI STATE MANAGEMENT ====================

          toggleSectionExpanded: (sectionId: string) => {
            set((state) => {
              if (state.expandedSections.has(sectionId)) {
                state.expandedSections.delete(sectionId)
              } else {
                state.expandedSections.add(sectionId)
              }
            })
          },

          setEditingSection: (sectionId: string | null) => {
            set((state) => {
              state.isEditingSection = sectionId
            })
          },

          setSectionExpanded: (sectionId: string, expanded: boolean) => {
            set((state) => {
              const sectionIndex = state.sections.findIndex(s => s.id === sectionId)
              if (sectionIndex !== -1) {
                state.sections[sectionIndex].isExpanded = expanded
              }
            })
          },

          setSectionEditing: (sectionId: string, editing: boolean) => {
            set((state) => {
              const sectionIndex = state.sections.findIndex(s => s.id === sectionId)
              if (sectionIndex !== -1) {
                state.sections[sectionIndex].isEditing = editing
              }
            })
          },

          // ==================== STATE MANAGEMENT ====================

          setDraftMode: (isDraft: boolean) => {
            set((state) => {
              state.isDraftMode = isDraft
            })
          },

          setError: (error: string | null) => {
            set((state) => {
              state.error = error
              if (error) {
                state.lastError = new Date()
              }
            })
          },

          clearError: () => {
            set((state) => {
              state.error = null
            })
          },

          reset: () => {
            if (autoSaveTimer) {
              clearInterval(autoSaveTimer)
              autoSaveTimer = null
            }
            set(() => ({ ...initialState }))
          },
        }))
      ),
      {
        name: 'proposal-store',
        partialize: (state) => ({
          activeProposal: state.activeProposal,
          sections: state.sections,
          isDraftMode: state.isDraftMode,
          expandedSections: Array.from(state.expandedSections),
        }),
      }
    ),
    {
      name: 'ProposalStore',
    }
  )
)

// Initialize auto-save when store is created
useProposalStore.getState().enableAutoSave()

export default useProposalStore 