import type { Note, ActiveView, LayoutMode } from "../../types"
import type { ViewState, ViewContextKey } from "../../view-engine/types"
import { now, type AppendEventFn } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

const MAX_HISTORY = 100

export function createUISlice(set: Set, get: Get, appendEvent: AppendEventFn) {
  // Internal flag to prevent openNote from pushing to history during goBack/goForward
  let _navigating = false

  return {
    setActiveView: (view: ActiveView) => set({ activeView: view, selectedNoteId: null }),
    setSelectedNoteId: (id: string | null) => set({ selectedNoteId: id }),

    openNote: (id: string) => {
      set((state: any) => {
        if (!state.notes.some((n: Note) => n.id === id)) return state
        const updates: any = {
          selectedNoteId: id,
          notes: state.notes.map((n: Note) =>
            n.id === id ? { ...n, reads: (n.reads ?? 0) + 1, lastTouchedAt: now() } : n
          ),
        }

        // Push to navigation history (skip if we're navigating via goBack/goForward)
        if (!_navigating) {
          const history = state.navigationHistory as string[]
          const index = state.navigationIndex as number
          // Truncate forward entries and push new
          const newHistory = [...history.slice(0, index + 1), id].slice(-MAX_HISTORY)
          updates.navigationHistory = newHistory
          updates.navigationIndex = newHistory.length - 1
        }

        return updates
      })
      appendEvent(id, "opened")
      // Sync editor tab state
      get().openNoteInTab(id)
    },

    goBack: () => {
      set((state: any) => {
        const index = state.navigationIndex as number
        // At index 0 with an open note → close editor (return to table/view)
        if (index <= 0 && state.selectedNoteId) {
          return { selectedNoteId: null, navigationIndex: -1 }
        }
        if (index <= 0) return state
        const newIndex = index - 1
        const noteId = state.navigationHistory[newIndex]
        // Check if note still exists
        if (!state.notes.some((n: Note) => n.id === noteId && !n.trashed)) {
          return state
        }
        _navigating = true
        setTimeout(() => { _navigating = false }, 0)
        return {
          navigationIndex: newIndex,
          selectedNoteId: noteId,
        }
      })
    },

    goForward: () => {
      set((state: any) => {
        const history = state.navigationHistory as string[]
        const index = state.navigationIndex as number
        if (history.length === 0 || index >= history.length - 1) return state
        const newIndex = index + 1
        const noteId = history[newIndex]
        if (!state.notes.some((n: Note) => n.id === noteId && !n.trashed)) {
          return state
        }
        _navigating = true
        setTimeout(() => { _navigating = false }, 0)
        return {
          navigationIndex: newIndex,
          selectedNoteId: noteId,
        }
      })
    },

    setSearchQuery: (query: string) => set({ searchQuery: query }),
    setSearchOpen: (open: boolean) => set({ searchOpen: open }),
    setShortcutOverlayOpen: (open: boolean) => set({ shortcutOverlayOpen: open }),
    setDetailsOpen: (open: boolean) => set({ detailsOpen: open }),
    toggleDetailsOpen: () => set((s: any) => ({ detailsOpen: !s.detailsOpen })),

    // Layout Mode
    setLayoutMode: (mode: LayoutMode) => {
      set((state: any) => {
        const current = state.layoutMode as LayoutMode
        const updates: Record<string, unknown> = { layoutMode: mode }

        if (mode === "focus" && current !== "focus") {
          // Save current mode before entering focus
          updates._preFocusLayoutMode = current
          updates.sidebarCollapsed = true
          updates.sidebarPeek = false
          updates.detailsOpen = false
        } else if (current === "focus" && mode !== "focus") {
          // Leaving focus — clear saved mode
          updates._preFocusLayoutMode = null
        }

        if (mode === "three-column") {
          // Force sidebar open in three-column
          updates.sidebarCollapsed = false
          updates.sidebarPeek = false
        }

        return updates
      })
    },

    setListPaneWidth: (width: number) => set({ listPaneWidth: Math.max(200, Math.min(500, width)) }),

    // Sidebar
    setSidebarWidth: (width: number) => set({ sidebarWidth: width, sidebarLastWidth: width }),
    setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed, sidebarPeek: false }),
    setSidebarPeek: (peek: boolean) => set({ sidebarPeek: peek }),
    restoreSidebar: () => set((s: any) => ({ sidebarCollapsed: false, sidebarPeek: false, sidebarWidth: s.sidebarLastWidth })),

    // Merge
    setMergePickerOpen: (open: boolean, sourceId?: string | null) => {
      set({ mergePickerOpen: open, mergePickerSourceId: open ? (sourceId ?? null) : null })
    },

    // Link
    setLinkPickerOpen: (open: boolean, sourceId?: string | null) => {
      set({ linkPickerOpen: open, linkPickerSourceId: open ? (sourceId ?? null) : null })
    },

    // View Engine
    setViewState: (ctx: ViewContextKey, patch: Partial<ViewState>) => {
      set((state: any) => ({
        viewStateByContext: {
          ...state.viewStateByContext,
          [ctx]: { ...state.viewStateByContext[ctx], ...patch },
        },
      }))
    },
  }
}
