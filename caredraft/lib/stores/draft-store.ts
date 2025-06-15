import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DraftState {
  id: string
  title: string
  content: string
  type: 'proposal' | 'document' | 'template'
  organizationId: string
  createdAt: string
  updatedAt: string
  isAutoSaving: boolean
  lastSaved?: string
}

interface DraftStore {
  drafts: DraftState[]
  currentDraft: DraftState | null
  isLoading: boolean
  error: string | null
  
  // Actions
  createDraft: (draft: Omit<DraftState, 'id' | 'createdAt' | 'updatedAt' | 'isAutoSaving'>) => void
  updateDraft: (id: string, updates: Partial<DraftState>) => void
  deleteDraft: (id: string) => void
  setCurrentDraft: (draft: DraftState | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setAutoSaving: (id: string, saving: boolean) => void
  loadDrafts: (organizationId: string) => Promise<void>
}

export const useDraftStore = create<DraftStore>()(
  persist(
    (set, _get) => ({
      drafts: [],
      currentDraft: null,
      isLoading: false,
      error: null,

      createDraft: (draftData) => {
        const now = new Date().toISOString()
        const newDraft: DraftState = {
          ...draftData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
          isAutoSaving: false,
        }
        
        set((state) => ({
          drafts: [...state.drafts, newDraft],
          currentDraft: newDraft,
        }))
      },

      updateDraft: (id, updates) => {
        const now = new Date().toISOString()
        set((state) => ({
          drafts: state.drafts.map(draft =>
            draft.id === id 
              ? { ...draft, ...updates, updatedAt: now }
              : draft
          ),
          currentDraft: state.currentDraft?.id === id
            ? { ...state.currentDraft, ...updates, updatedAt: now }
            : state.currentDraft,
        }))
      },

      deleteDraft: (id) => {
        set((state) => ({
          drafts: state.drafts.filter(draft => draft.id !== id),
          currentDraft: state.currentDraft?.id === id ? null : state.currentDraft,
        }))
      },

      setCurrentDraft: (draft) => {
        set({ currentDraft: draft })
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setError: (error) => {
        set({ error })
      },

      setAutoSaving: (id, saving) => {
        set((state) => ({
          drafts: state.drafts.map(draft =>
            draft.id === id 
              ? { ...draft, isAutoSaving: saving, lastSaved: saving ? undefined : new Date().toISOString() }
              : draft
          ),
          currentDraft: state.currentDraft?.id === id
            ? { ...state.currentDraft, isAutoSaving: saving, lastSaved: saving ? undefined : new Date().toISOString() }
            : state.currentDraft,
        }))
      },

      loadDrafts: async (_organizationId) => {
        set({ isLoading: true, error: null })
        try {
          // TODO: Implement API call to load drafts
          // For now, return empty array
          set({ drafts: [], isLoading: false })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load drafts',
            isLoading: false 
          })
        }
      },
    }),
    {
      name: 'draft-store',
      partialize: (state) => ({
        drafts: state.drafts,
        currentDraft: state.currentDraft,
      }),
    }
  )
) 