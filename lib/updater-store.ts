"use client"

import { create } from "zustand"
import type { Update } from "@tauri-apps/plugin-updater"

/**
 * Transient updater state (Tauri desktop only). Holds the pending `Update`
 * surfaced by the launch check so the sidebar can render a persistent
 * "Update available" indicator (Linear-style) instead of a fleeting toast.
 * Not persisted — the `Update` handle is in-memory and re-fetched each launch.
 */
type UpdaterState = {
  /** Pending signed update, or null when up to date. */
  update: Update | null
  /** True while downloading/installing. */
  downloading: boolean
  setUpdate: (update: Update | null) => void
  /** Download + install the pending update, then relaunch. */
  install: () => Promise<void>
}

export const useUpdaterStore = create<UpdaterState>((set, get) => ({
  update: null,
  downloading: false,
  setUpdate: (update) => set({ update }),
  install: async () => {
    const { update, downloading } = get()
    if (!update || downloading) return
    set({ downloading: true })
    try {
      await update.downloadAndInstall()
      const { relaunch } = await import("@tauri-apps/plugin-process")
      await relaunch()
    } catch (err) {
      console.error("[updater] install failed:", err)
      set({ downloading: false })
    }
  },
}))
