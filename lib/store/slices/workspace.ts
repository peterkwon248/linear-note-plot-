import { nanoid } from "nanoid"
import type { WorkspaceTab } from "@/lib/workspace/types"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

export function createWorkspaceSlice(set: Set, get: Get) {
  return {
    // Simplified dual pane
    secondaryNoteId: null as string | null,
    activePane: 'primary' as 'primary' | 'secondary',
    editorTabs: [] as WorkspaceTab[],
    activeTabId: null as string | null,

    openInSecondary: (noteId: string) => {
      set({ secondaryNoteId: noteId, activePane: 'secondary' as const })
    },

    closeSecondary: () => {
      set((state: any) => ({
        secondaryNoteId: null,
        activePane: 'primary' as const,
        // If the closed secondary's note was selectedNoteId, keep it
        selectedNoteId: state.activePane === 'secondary'
          ? (state.editorTabs.find((t: WorkspaceTab) => t.id === state.activeTabId)?.noteId ?? state.selectedNoteId)
          : state.selectedNoteId,
      }))
    },

    setActivePane: (pane: 'primary' | 'secondary') => {
      set((state: any) => {
        if (pane === 'secondary' && !state.secondaryNoteId) return state
        const selectedNoteId = pane === 'secondary'
          ? state.secondaryNoteId
          : (state.editorTabs.find((t: WorkspaceTab) => t.id === state.activeTabId)?.noteId ?? state.selectedNoteId)
        return { activePane: pane, selectedNoteId }
      })
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
