import type { Note, ActiveView } from "../../types"
import type { ViewState, ViewContextKey } from "../../view-engine/types"
import { now, type AppendEventFn } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void

const MAX_HISTORY = 100

export function createUISlice(set: Set, appendEvent: AppendEventFn) {
  // Internal flag to prevent openNote from pushing to history during goBack/goForward
  let _navigating = false

  return {
    setActiveView: (view: ActiveView) => set({ activeView: view, selectedNoteId: null }),
    setSelectedNoteId: (id: string | null) => set({ selectedNoteId: id }),

    openNote: (id: string) => {
      set((state: any) => {
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
    },

    goBack: () => {
      set((state: any) => {
        const index = state.navigationIndex as number
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
        if (index >= history.length - 1) return state
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

    // Sidebar
    setSidebarWidth: (width: number) => set({ sidebarWidth: width, sidebarLastWidth: width }),
    setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed, sidebarPeek: false }),
    setSidebarPeek: (peek: boolean) => set({ sidebarPeek: peek }),
    restoreSidebar: () => set((s: any) => ({ sidebarCollapsed: false, sidebarPeek: false, sidebarWidth: s.sidebarLastWidth })),

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
