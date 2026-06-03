"use client"

import { useEffect } from "react"
import { toast } from "sonner"

/**
 * AutoUpdater — Tauri desktop auto-update.
 *
 * On launch (Tauri shell only) checks the configured updater endpoint
 * (GitHub Releases `latest.json`). If a newer signed version exists it
 * surfaces a non-blocking toast; on confirm it downloads, installs, and
 * relaunches. No-op in the browser / dev / SSR (web build ships these
 * imports but they never execute outside Tauri).
 *
 * Signed via the updater keypair (tauri.conf.json `plugins.updater.pubkey`);
 * unsigned/forged updates are rejected by the plugin.
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

        toast(`Update available — v${update.version}`, {
          description: update.body?.trim() || "A new version of Plot is ready to install.",
          duration: Infinity,
          action: {
            label: "Install & restart",
            onClick: () => {
              const tid = toast.loading("Downloading update…")
              void (async () => {
                try {
                  await update.downloadAndInstall()
                  const { relaunch } = await import("@tauri-apps/plugin-process")
                  toast.dismiss(tid)
                  await relaunch()
                } catch (err) {
                  toast.dismiss(tid)
                  toast.error("Update failed", { description: String(err) })
                }
              })()
            },
          },
        })
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
