import { nanoid } from "nanoid"
import type { Note } from "@/lib/types"
import type { WorkspaceTab } from "@/lib/workspace/types"
import { clearSecondaryRoute, getSecondarySpace } from "@/lib/table-route"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

const MAX_SECONDARY_HISTORY = 50

export function createWorkspaceSlice(set: Set, get: Get) {
  return {
    // Simplified dual pane
    secondaryNoteId: null as string | null,
    activePane: 'primary' as 'primary' | 'secondary',
    editorTabs: [] as WorkspaceTab[],
    activeTabId: null as string | null,
    secondaryHistory: [] as string[],
    secondaryHistoryIndex: -1,

    openInSecondary: (noteId: string) => {
      set((state: any) => {
        // Push to secondary history
        const history = state.secondaryHistory as string[]
        const index = state.secondaryHistoryIndex as number
        const newHistory = [...history.slice(0, index + 1), noteId].slice(-MAX_SECONDARY_HISTORY)
        return {
          secondaryNoteId: noteId,
          activePane: 'secondary' as const,
          secondaryHistory: newHistory,
          secondaryHistoryIndex: newHistory.length - 1,
        }
      })
    },

    closeSecondary: () => {
      set({
        secondaryNoteId: null,
        activePane: 'primary' as const,
        secondaryHistory: [],
        secondaryHistoryIndex: -1,
      })
      clearSecondaryRoute()
    },

    setActivePane: (pane: 'primary' | 'secondary') => {
      set((state: any) => {
        // Allow secondary if there's a note OR a secondary route/space is set
        if (pane === 'secondary' && !state.secondaryNoteId && !getSecondarySpace()) {
          return state
        }
        // Only change activePane — do NOT touch selectedNoteId
        return { activePane: pane }
      })
    },

    secondaryGoBack: (): boolean => {
      const state = get()
      const index = state.secondaryHistoryIndex as number
      if (index <= 0) return false
      const newIndex = index - 1
      const noteId = state.secondaryHistory[newIndex]
      if (!(state.notes as Note[]).some((n: Note) => n.id === noteId && !n.trashed)) return false
      set({ secondaryHistoryIndex: newIndex, secondaryNoteId: noteId })
      return true
    },

    secondaryGoForward: (): boolean => {
      const state = get()
      const history = state.secondaryHistory as string[]
      const index = state.secondaryHistoryIndex as number
      if (index >= history.length - 1) return false
      const newIndex = index + 1
      const noteId = history[newIndex]
      if (!(state.notes as Note[]).some((n: Note) => n.id === noteId && !n.trashed)) return false
      set({ secondaryHistoryIndex: newIndex, secondaryNoteId: noteId })
      return true
    },

    closeEditorTab: (tabId: string) => {
      set((state: any) => {
        const tab = state.editorTabs.find((t: WorkspaceTab) => t.id === tabId)
        if (!tab || tab.isPinned) return state

        const idx = state.editorTabs.indexOf(tab)
        const newTabs = state.editorTabs.filter((t: WorkspaceTab) => t.id !== tabId)

        let newActiveTabId = state.activeTabId
        let selectedNoteId = state.selectedNoteId

        if (state.activeTabId === tabId) {
          if (newTabs.length === 0) {
            newActiveTabId = null
            selectedNoteId = null
          } else {
            const newIdx = Math.min(idx, newTabs.length - 1)
            newActiveTabId = newTabs[newIdx].id
            selectedNoteId = newTabs[newIdx].noteId
          }
        }

        return { editorTabs: newTabs, activeTabId: newActiveTabId, selectedNoteId }
      })
    },

    setActiveEditorTab: (tabId: string) => {
      set((state: any) => {
        const tab = state.editorTabs.find((t: WorkspaceTab) => t.id === tabId)
        if (!tab) return state
        return {
          activeTabId: tabId,
          selectedNoteId: tab.noteId,
          activePane: 'primary' as const,
        }
      })
    },
  }
}
