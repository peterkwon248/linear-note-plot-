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
    secondaryEntityContext: null as import("@/lib/store/types").SidePanelContext,
    editorTabs: [] as WorkspaceTab[],
    activeTabId: null as string | null,
    secondaryHistory: [] as string[],
    secondaryHistoryIndex: -1,

    setSecondaryEntityContext: (ctx: import("@/lib/store/types").SidePanelContext) => set({ secondaryEntityContext: ctx }),

    openInSecondary: (noteId: string) => {
      set((state: any) => {
        // Push to secondary history
        const history = state.secondaryHistory as string[]
        const index = state.secondaryHistoryIndex as number
        const newHistory = [...history.slice(0, index + 1), noteId].slice(-MAX_SECONDARY_HISTORY)
        // Derive type for sidePanelContext
        const isNote = state.notes.some((n: any) => n.id === noteId && !n.trashed)
        const type = isNote ? "note" : "wiki"
        return {
          secondaryNoteId: noteId,
          activePane: 'secondary' as const,
          _savedPrimaryContext: state._savedPrimaryContext || state.sidePanelContext,
          sidePanelContext: { type: type as "note" | "wiki", id: noteId },
          secondaryHistory: newHistory,
          secondaryHistoryIndex: newHistory.length - 1,
        }
      })
    },

    closeSecondary: () => {
      const state = get()
      set({
        secondaryNoteId: null,
        activePane: 'primary' as const,
        secondaryHistory: [],
        secondaryHistoryIndex: -1,
        secondaryEntityContext: null,
        // Restore primary context when closing secondary
        sidePanelContext: state._savedPrimaryContext || state.sidePanelContext,
        _savedPrimaryContext: null,
      })
      clearSecondaryRoute()
    },

    setActivePane: (pane: 'primary' | 'secondary') => {
      if (pane === 'secondary') {
        const state = get()
        if (!state.secondaryNoteId && !getSecondarySpace()) return

        // Derive secondary entity context
        let secCtx = state.secondaryEntityContext as import("@/lib/store/types").SidePanelContext
        if (!secCtx && state.secondaryNoteId) {
          const isNote = (state.notes as any[]).some((n: any) => n.id === state.secondaryNoteId && !n.trashed)
          secCtx = isNote
            ? { type: "note" as const, id: state.secondaryNoteId }
            : (state.wikiArticles as any[]).some((a: any) => a.id === state.secondaryNoteId)
              ? { type: "wiki" as const, id: state.secondaryNoteId }
              : null
        }

        set({
          activePane: pane,
          // Only save primary context if not already saved (prevent overwrite on repeated clicks)
          ...(state._savedPrimaryContext ? {} : { _savedPrimaryContext: state.sidePanelContext }),
          ...(secCtx ? { sidePanelContext: secCtx } : {}),
        })
      } else {
        const state = get()
        set({
          activePane: pane,
          sidePanelContext: state._savedPrimaryContext || state.sidePanelContext,
          _savedPrimaryContext: null,  // clear so it can be saved again next time
        })
      }
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
