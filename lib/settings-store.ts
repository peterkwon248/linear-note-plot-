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
  // Profile
  userName: string

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
  startView: "home" | "all" | "stone" | "pinned"
  confirmDelete: boolean
  viewMode: "list" | "board"

  // Sync & Backup — Plot ships with no cloud sync backend yet. The "Auto-sync"
  // surface is therefore wired as an honest *local backup reminder*: when on,
  // the app nudges once per session if no full backup has been taken recently.
  backupReminder: boolean
  /** Threshold in days for the backup-reminder nudge (default 7). */
  backupReminderDays: number
  /** ISO timestamp of the last successful `downloadFullBackup()` call. */
  lastBackupAt: string | null
  setBackupReminder: (v: boolean) => void
  setBackupReminderDays: (v: number) => void
  markBackupTaken: (atIso?: string) => void

  // Toolbar
  toolbarLayout: ToolbarLayout
  setToolbarLayout: (layout: ToolbarLayout) => void
  resetToolbarLayout: () => void

  // Overflow menu favorites
  overflowFavorites: string[]
  toggleOverflowFavorite: (id: string) => void

  // Actions
  setLineNumbers: (v: boolean) => void
  setWordWrap: (v: boolean) => void
  setTabSize: (v: "2" | "4") => void
  setCodeFontFamily: (v: "mono" | "sans") => void
  setTheme: (v: "light" | "dark" | "system") => void
  setFontSize: (v: string) => void
  setDensity: (v: "compact" | "default" | "comfortable") => void
  setLanguage: (v: string) => void
  setStartView: (v: "home" | "all" | "stone" | "pinned") => void
  setConfirmDelete: (v: boolean) => void
  setViewMode: (v: "list" | "board") => void
  setUserName: (v: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Profile defaults
      userName: "",

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

      // Sync & Backup defaults
      backupReminder: false,
      backupReminderDays: 7,
      lastBackupAt: null,

      // Toolbar
      toolbarLayout: DEFAULT_TOOLBAR_LAYOUT,
      setToolbarLayout: (layout) => set({ toolbarLayout: layout }),
      resetToolbarLayout: () => set({ toolbarLayout: DEFAULT_TOOLBAR_LAYOUT }),

      // Overflow menu favorites
      overflowFavorites: [],
      toggleOverflowFavorite: (id) => set((s) => {
        const has = s.overflowFavorites.includes(id)
        return { overflowFavorites: has ? s.overflowFavorites.filter((f) => f !== id) : [...s.overflowFavorites, id] }
      }),

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
      setUserName: (v) => set({ userName: v }),
      setBackupReminder: (v) => set({ backupReminder: v }),
      setBackupReminderDays: (v) => set({ backupReminderDays: Math.max(1, Math.min(90, Math.round(v))) }),
      markBackupTaken: (atIso) => set({ lastBackupAt: atIso ?? new Date().toISOString() }),
    }),
    { name: "plot-settings" }
  )
)
