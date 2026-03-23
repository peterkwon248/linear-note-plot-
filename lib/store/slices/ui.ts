import { nanoid } from "nanoid"
import type { Note, ActiveView } from "../../types"
import type { ViewState, ViewContextKey } from "../../view-engine/types"
import type { WorkspaceTab } from "../../workspace/types"
import { now, type AppendEventFn } from "../helpers"
import { getActiveRoute } from "../../table-route"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

const MAX_HISTORY = 100

/** Route before opening editor — used by "Back" button to return to previous screen */
let _previousRoute: string | null = null
export function getPreviousRoute(): string | null { return _previousRoute }

export function createUISlice(set: Set, get: Get, appendEvent: AppendEventFn) {
  // Internal flag to prevent openNote from pushing to history during goBack/goForward
  let _navigating = false

  return {
    setActiveView: (view: ActiveView) => set({ activeView: view, selectedNoteId: null }),
    setSelectedNoteId: (id: string | null) => set({ selectedNoteId: id }),

    openNote: (id: string, opts?: { forceNewTab?: boolean }) => {
      // Save current route before opening editor (for "Back" navigation)
      const currentRoute = getActiveRoute()
      if (currentRoute && !_navigating) {
        _previousRoute = currentRoute
      }
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
      // Sync editor tabs
      const state = get()
      const tabs = state.editorTabs as WorkspaceTab[]
      const existingTab = opts?.forceNewTab ? undefined : tabs.find((t: WorkspaceTab) => t.noteId === id)
      if (existingTab) {
        set({ activeTabId: existingTab.id, activePane: 'primary' })
      } else {
        const newTab: WorkspaceTab = { id: nanoid(), noteId: id }
        const activeIdx = tabs.findIndex((t: WorkspaceTab) => t.id === state.activeTabId)
        const newTabs = [...tabs]
        if (activeIdx >= 0) {
          newTabs.splice(activeIdx + 1, 0, newTab)
        } else {
          newTabs.push(newTab)
        }
        set({ editorTabs: newTabs, activeTabId: newTab.id, activePane: 'primary' })
      }
      // Also sync legacy editor state for backward compat
      state.openNoteInTab(id)
    },

    goBack: (): boolean => {
      const state = get()
      const index = state.navigationIndex as number
      // At index 0 with an open note → close editor (return to table/view)
      if (index <= 0 && state.selectedNoteId) {
        set({ selectedNoteId: null, navigationIndex: -1 })
        return true
      }
      // Navigate note history
      if (index > 0) {
        const newIndex = index - 1
        const noteId = state.navigationHistory[newIndex]
        if (state.notes.some((n: Note) => n.id === noteId && !n.trashed)) {
          _navigating = true
          setTimeout(() => { _navigating = false }, 0)
          set({ navigationIndex: newIndex, selectedNoteId: noteId })
          return true
        }
      }
      // No note history to navigate — caller should use router.back()
      return false
    },

    goForward: (): boolean => {
      const state = get()
      const history = state.navigationHistory as string[]
      const index = state.navigationIndex as number
      if (history.length > 0 && index < history.length - 1) {
        const newIndex = index + 1
        const noteId = history[newIndex]
        if (state.notes.some((n: Note) => n.id === noteId && !n.trashed)) {
          _navigating = true
          setTimeout(() => { _navigating = false }, 0)
          set({ navigationIndex: newIndex, selectedNoteId: noteId })
          return true
        }
      }
      // No note history to navigate — caller should use router.forward()
      return false
    },

    setSearchQuery: (query: string) => set({ searchQuery: query }),
    setSearchOpen: (open: boolean) => set({ searchOpen: open }),
    setShortcutOverlayOpen: (open: boolean) => set({ shortcutOverlayOpen: open }),
    setSidePanelOpen: (open: boolean) => set({ sidePanelOpen: open }),
    toggleSidePanel: () => set((s: any) => ({ sidePanelOpen: !s.sidePanelOpen })),

    openSidePeek: (noteId: string) => set({ sidePanelPeekNoteId: noteId, sidePanelMode: 'peek' as const, sidePanelOpen: true }),
    closeSidePeek: () => set((s: any) => {
      const hasSelectedNote = !!s.selectedNoteId
      return {
        sidePanelPeekNoteId: null,
        sidePanelMode: 'context' as const,
        sidePanelOpen: hasSelectedNote ? s.sidePanelOpen : false,
      }
    }),

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

    // Wiki Assembly (Cluster Nudge)
    setPendingWikiAssembly: (noteIds: string[] | null) => {
      set({ pendingWikiAssemblyIds: noteIds })
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
