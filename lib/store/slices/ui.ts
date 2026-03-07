import type { Note, ActiveView } from "../../types"
import type { ViewState, ViewContextKey } from "../../view-engine/types"
import { now, type AppendEventFn } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void

export function createUISlice(set: Set, appendEvent: AppendEventFn) {
  return {
    setActiveView: (view: ActiveView) => set({ activeView: view, selectedNoteId: null }),
    setSelectedNoteId: (id: string | null) => set({ selectedNoteId: id }),

    openNote: (id: string) => {
      set((state: any) => ({
        selectedNoteId: id,
        notes: state.notes.map((n: Note) =>
          n.id === id ? { ...n, reads: (n.reads ?? 0) + 1, lastTouchedAt: now() } : n
        ),
      }))
      appendEvent(id, "opened")
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
