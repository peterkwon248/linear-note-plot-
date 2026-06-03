"use client"

import { useEffect } from "react"
import { useUpdaterStore } from "@/lib/updater-store"

/**
 * AutoUpdater — Tauri desktop update check.
 *
 * On launch (Tauri shell only) checks the configured updater endpoint
 * (GitHub Releases `latest.json`). If a newer signed version exists it's
 * stashed in the updater store, which the sidebar renders as a persistent
 * "Update available" indicator (Linear-style). No-op in browser/dev/SSR.
 *
 * Signature is verified by the plugin against `plugins.updater.pubkey`;
 * forged/unsigned updates are rejected.
 */
export function AutoUpdater() {
  useEffect(() => {
    // Only inside the Tauri shell — `__TAURI_INTERNALS__` is injected there.
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return

    let cancelled = false
    void (async () => {
      try {
        const { check } = await import("@tauri-apps/plugin-updater")
        const update = await check()
        if (cancelled || !update) return
        useUpdaterStore.getState().setUpdate(update)
      } catch (err) {
        // Offline, no manifest yet, or check error — stay silent (non-critical).
        console.warn("[updater] check failed:", err)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return null
}
