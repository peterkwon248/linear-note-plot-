import { create } from "zustand"
import { persist } from "zustand/middleware"

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
  spellcheck: boolean
  lineNumbers: boolean
  wordWrap: boolean
  tabSize: "2" | "4"
  codeFontFamily: "mono" | "sans"
  currentLineHighlight: boolean

  // Appearance
  theme: "light" | "dark" | "system"
  fontSize: string
  density: "compact" | "default" | "comfortable"

  // Preferences
  language: string
  startView: "all" | "inbox" | "pinned"
  confirmDelete: boolean
  viewMode: "list" | "table" | "board" | "insights" | "calendar"

  // Actions
  setSpellcheck: (v: boolean) => void
  setLineNumbers: (v: boolean) => void
  setWordWrap: (v: boolean) => void
  setTabSize: (v: "2" | "4") => void
  setCodeFontFamily: (v: "mono" | "sans") => void
  setCurrentLineHighlight: (v: boolean) => void
  setTheme: (v: "light" | "dark" | "system") => void
  setFontSize: (v: string) => void
  setDensity: (v: "compact" | "default" | "comfortable") => void
  setLanguage: (v: string) => void
  setStartView: (v: "all" | "inbox" | "pinned") => void
  setConfirmDelete: (v: boolean) => void
  setViewMode: (v: "list" | "table" | "board" | "insights" | "calendar") => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Editor defaults
      spellcheck: true,
      lineNumbers: false,
      wordWrap: true,
      tabSize: "2",
      codeFontFamily: "mono",
      currentLineHighlight: true,

      // Appearance defaults
      theme: "dark",
      fontSize: "14",
      density: "default",

      // Preferences defaults
      language: "en",
      startView: "inbox",
      confirmDelete: true,
      viewMode: "table",

      // Actions
      setSpellcheck: (v) => set({ spellcheck: v }),
      setLineNumbers: (v) => set({ lineNumbers: v }),
      setWordWrap: (v) => set({ wordWrap: v }),
      setTabSize: (v) => set({ tabSize: v }),
      setCodeFontFamily: (v) => set({ codeFontFamily: v }),
      setCurrentLineHighlight: (v) => set({ currentLineHighlight: v }),
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
