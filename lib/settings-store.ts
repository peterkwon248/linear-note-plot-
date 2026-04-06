import { create } from "zustand"
import { persist } from "zustand/middleware"
import { DEFAULT_TOOLBAR_LAYOUT, type ToolbarLayout } from "./editor/toolbar-config"

/* ── Transient UI state (not persisted) ── */

interface UIState {
  displayPopoverOpen: boolean
  setDisplayPopoverOpen: (v: boolean) => void
}

export const useUIStore = create<UIState>()((set) => ({
  displayPopoverOpen: false,
  setDisplayPopoverOpen: (v) => set({ displayPopoverOpen: v }),
}))

/* ── Persisted settings ── */

export interface SettingsState {
  // Editor
  lineNumbers: boolean
  wordWrap: boolean
  tabSize: "2" | "4"
  codeFontFamily: "mono" | "sans"

  // Appearance
  theme: "light" | "dark" | "system"
  fontSize: string
  density: "compact" | "default" | "comfortable"

  // Preferences
  language: string
  startView: "home" | "all" | "inbox" | "pinned"
  confirmDelete: boolean
  viewMode: "list" | "board"

  // Toolbar
  toolbarLayout: ToolbarLayout
  setToolbarLayout: (layout: ToolbarLayout) => void
  resetToolbarLayout: () => void

  // Actions
  setLineNumbers: (v: boolean) => void
  setWordWrap: (v: boolean) => void
  setTabSize: (v: "2" | "4") => void
  setCodeFontFamily: (v: "mono" | "sans") => void
  setTheme: (v: "light" | "dark" | "system") => void
  setFontSize: (v: string) => void
  setDensity: (v: "compact" | "default" | "comfortable") => void
  setLanguage: (v: string) => void
  setStartView: (v: "all" | "inbox" | "pinned") => void
  setConfirmDelete: (v: boolean) => void
  setViewMode: (v: "list" | "board") => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Editor defaults
      lineNumbers: false,
      wordWrap: true,
      tabSize: "2",
      codeFontFamily: "mono",

      // Appearance defaults
      theme: "dark",
      fontSize: "14",
      density: "default",

      // Preferences defaults
      language: "en",
      startView: "home",
      confirmDelete: true,
      viewMode: "list",

      // Toolbar
      toolbarLayout: DEFAULT_TOOLBAR_LAYOUT,
      setToolbarLayout: (layout) => set({ toolbarLayout: layout }),
      resetToolbarLayout: () => set({ toolbarLayout: DEFAULT_TOOLBAR_LAYOUT }),

      // Actions
      setLineNumbers: (v) => set({ lineNumbers: v }),
      setWordWrap: (v) => set({ wordWrap: v }),
      setTabSize: (v) => set({ tabSize: v }),
      setCodeFontFamily: (v) => set({ codeFontFamily: v }),
      setTheme: (v) => set({ theme: v }),
      setFontSize: (v) => set({ fontSize: v }),
      setDensity: (v) => set({ density: v }),
      setLanguage: (v) => set({ language: v }),
      setStartView: (v) => set({ startView: v }),
      setConfirmDelete: (v) => set({ confirmDelete: v }),
      setViewMode: (v) => set({ viewMode: v }),
    }),
    { name: "plot-settings" }
  )
)
