import { nanoid } from "nanoid"
import type { Note, ActiveView } from "../../types"
import type { SidePanelContext, PeekContext } from "../types"
import type { ViewState, ViewContextKey } from "../../view-engine/types"
import type { WorkspaceTab } from "../../workspace/types"
import { now, type AppendEventFn } from "../helpers"
import { getActiveRoute } from "../../table-route"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

const MAX_HISTORY = 100
const MAX_PEEK_HISTORY = 50
const MAX_PEEK_PINS = 2
const MAX_PEEK_NAV = 50
const PEEK_SIZE_MIN = 42
const PEEK_SIZE_MAX = 55

function peekKey(ctx: PeekContext): string { return `${ctx.type}:${ctx.id}` }

/** Route before opening editor — used by "Back" button to return to previous screen */
let _previousRoute: string | null = null
export function getPreviousRoute(): string | null { return _previousRoute }

export function createUISlice(set: Set, get: Get, appendEvent: AppendEventFn) {
  // Internal flag to prevent openNote from pushing to history during goBack/goForward
  let _navigating = false

  return {
    setActiveView: (view: ActiveView) => set({ activeView: view, selectedNoteId: null }),
    setSelectedNoteId: (id: string | null) => {
      // Auto-delete empty notes when leaving editor
      if (id === null) {
        const state = get()
        const prevId = state.selectedNoteId as string | null
        if (prevId) {
          const note = (state.notes as Note[]).find((n: Note) => n.id === prevId)
          if (note && !note.title && !note.content) {
            state.deleteNote(prevId)
          }
        }
      }
      set({ selectedNoteId: id, sidePanelContext: id ? { type: "note", id } : null })
    },

    openNote: (id: string, opts?: { forceNewTab?: boolean; pane?: 'primary' | 'secondary' }) => {
      const targetPane = opts?.pane ?? 'primary'

      // Secondary pane path — independent from selectedNoteId
      if (targetPane === 'secondary') {
        // Auto-delete empty previous secondary note
        const prevState = get()
        const prevSecId = prevState.secondaryNoteId as string | null
        if (prevSecId && prevSecId !== id) {
          const prevNote = (prevState.notes as Note[]).find((n: Note) => n.id === prevSecId)
          if (prevNote && !prevNote.title && !prevNote.content) {
            prevState.deleteNote(prevSecId)
          }
        }
        set((state: any) => {
          if (!state.notes.some((n: Note) => n.id === id)) return state
          // Update reads + lastTouchedAt
          const notes = state.notes.map((n: Note) =>
            n.id === id ? { ...n, reads: (n.reads ?? 0) + 1, lastTouchedAt: now() } : n
          )
          // Push to secondary history
          const history = state.secondaryHistory as string[]
          const index = state.secondaryHistoryIndex as number
          const newHistory = [...history.slice(0, index + 1), id].slice(-MAX_HISTORY)
          return {
            notes,
            secondaryNoteId: id,
            activePane: 'secondary' as const,
            secondaryHistory: newHistory,
            secondaryHistoryIndex: newHistory.length - 1,
          }
        })
        appendEvent(id, "opened")
        return
      }

      // Primary pane path — existing behavior
      // Auto-delete empty previous note when switching to another note
      const prevState = get()
      const prevId = prevState.selectedNoteId as string | null
      if (prevId && prevId !== id) {
        const prevNote = (prevState.notes as Note[]).find((n: Note) => n.id === prevId)
        if (prevNote && !prevNote.title && !prevNote.content) {
          prevState.deleteNote(prevId)
        }
      }
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
        // Auto-delete empty notes
        const note = (state.notes as Note[]).find((n: Note) => n.id === state.selectedNoteId)
        if (note && !note.title && !note.content) {
          state.deleteNote(state.selectedNoteId)
        }
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

    // Secondary side panel
    secondarySidePanelOpen: false,
    secondarySidePanelMode: 'detail' as const,
    secondarySidePanelContext: null as any,
    setSecondarySidePanelOpen: (open: boolean) => set({ secondarySidePanelOpen: open }),
    toggleSecondarySidePanel: () => set((s: any) => ({ secondarySidePanelOpen: !s.secondarySidePanelOpen })),

    setPreviewNoteId: (id: string | null) => set({
      previewNoteId: id,
      sidePanelContext: id ? { type: "note", id } : null,
    }),

    setSidePanelContext: (ctx: SidePanelContext) => set({ sidePanelContext: ctx }),

    openReferencePanel: (refId: string) => set({
      sidePanelContext: { type: "reference" as const, id: refId },
      sidePanelMode: 'detail' as const,
      sidePanelOpen: true,
    }),

    openSidePeek: (target: string | PeekContext) => {
      const ctx: PeekContext = typeof target === "string"
        ? { type: "note", id: target }
        : target
      set((s: any) => {
        // 1. Update deduped "Recent" history (newest first, bounded)
        const key = peekKey(ctx)
        const prevHistory = (s.peekHistory as PeekContext[]) ?? []
        const deduped = prevHistory.filter((h) => peekKey(h) !== key)
        const nextHistory = [ctx, ...deduped].slice(0, MAX_PEEK_HISTORY)

        // 2. Update linear nav stack (for back/forward)
        // Truncate any forward entries after the current index, then append.
        const prevNavStack = (s.peekNavStack as PeekContext[]) ?? []
        const prevNavIndex = (s.peekNavIndex as number) ?? -1
        const truncated = prevNavStack.slice(0, prevNavIndex + 1)
        // Avoid pushing a duplicate of the current position (e.g. user clicks the same item)
        const last = truncated[truncated.length - 1]
        const nextNavStackRaw = last && peekKey(last) === key ? truncated : [...truncated, ctx]
        // Bound the nav stack (keep most recent MAX entries)
        const nextNavStack = nextNavStackRaw.slice(-MAX_PEEK_NAV)
        const nextNavIndex = nextNavStack.length - 1

        return {
          sidePanelPeekContext: ctx,
          sidePanelMode: 'peek' as const,
          sidePanelOpen: true,
          peekHistory: nextHistory,
          peekNavStack: nextNavStack,
          peekNavIndex: nextNavIndex,
        }
      })
    },
    closeSidePeek: () => set((s: any) => {
      const hasSelectedNote = !!s.selectedNoteId
      return {
        sidePanelPeekContext: null,
        sidePanelMode: 'detail' as const,
        sidePanelOpen: hasSelectedNote ? s.sidePanelOpen : false,
        // Reset nav stack — closing Peek ends the navigation session
        peekNavStack: [],
        peekNavIndex: -1,
      }
    }),
    peekGoBack: () => set((s: any) => {
      const stack = (s.peekNavStack as PeekContext[]) ?? []
      const idx = (s.peekNavIndex as number) ?? -1
      if (idx <= 0) return s
      const nextIdx = idx - 1
      return {
        sidePanelPeekContext: stack[nextIdx],
        peekNavIndex: nextIdx,
      }
    }),
    peekGoForward: () => set((s: any) => {
      const stack = (s.peekNavStack as PeekContext[]) ?? []
      const idx = (s.peekNavIndex as number) ?? -1
      if (idx < 0 || idx >= stack.length - 1) return s
      const nextIdx = idx + 1
      return {
        sidePanelPeekContext: stack[nextIdx],
        peekNavIndex: nextIdx,
      }
    }),
    togglePeekPin: (target: PeekContext) => set((s: any) => {
      const key = peekKey(target)
      const pins = (s.peekPins as PeekContext[]) ?? []
      const existing = pins.findIndex((p) => peekKey(p) === key)
      if (existing >= 0) {
        // Unpin
        return { peekPins: pins.filter((_, i) => i !== existing) }
      }
      // Pin: evict oldest if at capacity
      const nextPins = [...pins, target].slice(-MAX_PEEK_PINS)
      return { peekPins: nextPins }
    }),
    removeFromPeekHistory: (target: PeekContext) => set((s: any) => {
      const key = peekKey(target)
      return {
        peekHistory: ((s.peekHistory as PeekContext[]) ?? []).filter((h) => peekKey(h) !== key),
        peekPins: ((s.peekPins as PeekContext[]) ?? []).filter((p) => peekKey(p) !== key),
      }
    }),
    clearPeekHistory: () => set({ peekHistory: [] }),
    setPeekSize: (size: number) => {
      const clamped = Math.max(PEEK_SIZE_MIN, Math.min(PEEK_SIZE_MAX, Math.round(size)))
      set({ peekSize: clamped })
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
