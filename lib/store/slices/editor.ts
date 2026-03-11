import { nanoid } from "nanoid"
import type { EditorTab, EditorPanel, EditorState } from "../types"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

export const DEFAULT_EDITOR_STATE: EditorState = {
  panels: [{ id: "panel-left", tabs: [], activeTabId: null }],
  activePanelId: "panel-left",
  splitMode: false,
  splitRatio: 0.5,
}

export function createEditorSlice(set: Set, get: Get) {
  return {
    editorState: DEFAULT_EDITOR_STATE,

    openNoteInTab: (noteId: string, panelId?: string) => {
      set((state: any) => {
        const es: EditorState = { ...state.editorState }
        es.panels = es.panels.map((p: EditorPanel) => ({ ...p, tabs: [...p.tabs] }))
        const targetPanelId = panelId ?? es.activePanelId
        const panel = es.panels.find((p: EditorPanel) => p.id === targetPanelId)
        if (!panel) return state

        // Check if note is already open in this panel
        const existingTab = panel.tabs.find((t: EditorTab) => t.noteId === noteId)
        if (existingTab) {
          panel.activeTabId = existingTab.id
        } else {
          const newTab: EditorTab = { id: nanoid(), noteId, isPinned: false }
          // Insert after active tab, or at end
          const activeIdx = panel.tabs.findIndex((t: EditorTab) => t.id === panel.activeTabId)
          if (activeIdx >= 0) {
            panel.tabs.splice(activeIdx + 1, 0, newTab)
          } else {
            panel.tabs.push(newTab)
          }
          panel.activeTabId = newTab.id
        }

        return {
          editorState: es,
          selectedNoteId: noteId, // sync backward compat
        }
      })
    },

    closeTab: (tabId: string, panelId: string) => {
      set((state: any) => {
        const es: EditorState = { ...state.editorState }
        es.panels = es.panels.map((p: EditorPanel) => ({ ...p, tabs: [...p.tabs] }))
        const panel = es.panels.find((p: EditorPanel) => p.id === panelId)
        if (!panel) return state

        const tab = panel.tabs.find((t: EditorTab) => t.id === tabId)
        if (!tab || tab.isPinned) return state // can't close pinned

        const idx = panel.tabs.indexOf(tab)
        panel.tabs = panel.tabs.filter((t: EditorTab) => t.id !== tabId)

        // If closed tab was active, switch to adjacent
        let newSelectedNoteId = state.selectedNoteId
        if (panel.activeTabId === tabId) {
          if (panel.tabs.length === 0) {
            panel.activeTabId = null
            // If this is the active panel, clear selectedNoteId
            if (es.activePanelId === panelId) {
              newSelectedNoteId = null
            }
          } else {
            const newIdx = Math.min(idx, panel.tabs.length - 1)
            panel.activeTabId = panel.tabs[newIdx].id
            if (es.activePanelId === panelId) {
              newSelectedNoteId = panel.tabs[newIdx].noteId
            }
          }
        }

        // Auto-merge: if split and this panel is now empty, collapse
        if (es.splitMode && panel.tabs.length === 0) {
          const otherPanel = es.panels.find((p: EditorPanel) => p.id !== panelId)
          if (otherPanel && otherPanel.tabs.length > 0) {
            es.splitMode = false
            es.activePanelId = otherPanel.id
            // Keep only the non-empty panel
            es.panels = es.panels.filter((p: EditorPanel) => p.tabs.length > 0 || p.id === "panel-left")
            if (es.panels.length === 0) {
              es.panels = [{ id: "panel-left", tabs: [], activeTabId: null }]
            }
            newSelectedNoteId = otherPanel.activeTabId
              ? otherPanel.tabs.find((t: EditorTab) => t.id === otherPanel.activeTabId)?.noteId ?? null
              : null
          }
        }

        return { editorState: es, selectedNoteId: newSelectedNoteId }
      })
    },

    closeOtherTabs: (tabId: string, panelId: string) => {
      set((state: any) => {
        const es: EditorState = { ...state.editorState }
        es.panels = es.panels.map((p: EditorPanel) => ({ ...p, tabs: [...p.tabs] }))
        const panel = es.panels.find((p: EditorPanel) => p.id === panelId)
        if (!panel) return state

        // Keep the target tab and any pinned tabs
        panel.tabs = panel.tabs.filter((t: EditorTab) => t.id === tabId || t.isPinned)
        panel.activeTabId = tabId

        const activeTab = panel.tabs.find((t: EditorTab) => t.id === tabId)
        const newSelectedNoteId = es.activePanelId === panelId && activeTab
          ? activeTab.noteId
          : state.selectedNoteId

        return { editorState: es, selectedNoteId: newSelectedNoteId }
      })
    },

    setActiveTab: (tabId: string, panelId: string) => {
      set((state: any) => {
        const es: EditorState = { ...state.editorState }
        es.panels = es.panels.map((p: EditorPanel) =>
          p.id === panelId ? { ...p, activeTabId: tabId } : { ...p }
        )
        const panel = es.panels.find((p: EditorPanel) => p.id === panelId)
        const tab = panel?.tabs.find((t: EditorTab) => t.id === tabId)
        const newSelectedNoteId = tab ? tab.noteId : state.selectedNoteId

        return {
          editorState: es,
          selectedNoteId: newSelectedNoteId,
        }
      })
    },

    setActivePanel: (panelId: string) => {
      set((state: any) => {
        const es: EditorState = { ...state.editorState }
        es.activePanelId = panelId
        const panel = es.panels.find((p: EditorPanel) => p.id === panelId)
        const activeTab = panel?.tabs.find((t: EditorTab) => t.id === panel?.activeTabId)
        return {
          editorState: es,
          selectedNoteId: activeTab?.noteId ?? state.selectedNoteId,
        }
      })
    },

    toggleSplit: () => {
      set((state: any) => {
        const es: EditorState = { ...state.editorState }
        es.panels = es.panels.map((p: EditorPanel) => ({ ...p, tabs: [...p.tabs] }))

        if (es.splitMode) {
          // Collapse: merge right panel tabs into left
          const left = es.panels.find((p: EditorPanel) => p.id === "panel-left")
          const right = es.panels.find((p: EditorPanel) => p.id === "panel-right")
          if (left && right) {
            // Move right tabs to left, avoiding duplicates by noteId
            for (const tab of right.tabs) {
              if (!left.tabs.some((t: EditorTab) => t.noteId === tab.noteId)) {
                left.tabs.push(tab)
              }
            }
            right.tabs = []
            right.activeTabId = null
          }
          es.splitMode = false
          es.activePanelId = "panel-left"
          es.panels = es.panels.filter((p: EditorPanel) => p.id === "panel-left")
        } else {
          // Split: create right panel if doesn't exist
          if (!es.panels.find((p: EditorPanel) => p.id === "panel-right")) {
            es.panels.push({ id: "panel-right", tabs: [], activeTabId: null })
          }
          es.splitMode = true
        }

        return { editorState: es }
      })
    },

    moveTabToPanel: (tabId: string, fromPanelId: string, toPanelId: string) => {
      set((state: any) => {
        const es: EditorState = { ...state.editorState }
        es.panels = es.panels.map((p: EditorPanel) => ({ ...p, tabs: [...p.tabs] }))
        const fromPanel = es.panels.find((p: EditorPanel) => p.id === fromPanelId)
        const toPanel = es.panels.find((p: EditorPanel) => p.id === toPanelId)
        if (!fromPanel || !toPanel) return state

        const tab = fromPanel.tabs.find((t: EditorTab) => t.id === tabId)
        if (!tab) return state

        // Remove from source
        fromPanel.tabs = fromPanel.tabs.filter((t: EditorTab) => t.id !== tabId)
        if (fromPanel.activeTabId === tabId) {
          fromPanel.activeTabId = fromPanel.tabs[0]?.id ?? null
        }

        // Check if same note already open in target
        const existingInTarget = toPanel.tabs.find((t: EditorTab) => t.noteId === tab.noteId)
        if (existingInTarget) {
          toPanel.activeTabId = existingInTarget.id
        } else {
          toPanel.tabs.push(tab)
          toPanel.activeTabId = tab.id
        }

        return { editorState: es }
      })
    },

    togglePinTab: (tabId: string, panelId: string) => {
      set((state: any) => {
        const es: EditorState = { ...state.editorState }
        es.panels = es.panels.map((p: EditorPanel) => {
          if (p.id !== panelId) return { ...p }
          return {
            ...p,
            tabs: p.tabs.map((t: EditorTab) =>
              t.id === tabId ? { ...t, isPinned: !t.isPinned } : t
            ),
          }
        })
        return { editorState: es }
      })
    },

    setSplitRatio: (ratio: number) => {
      set((state: any) => ({
        editorState: {
          ...state.editorState,
          splitRatio: Math.max(0.2, Math.min(0.8, ratio)),
        },
      }))
    },
  }
}
