"use client"

import { Download, Loader2 } from "lucide-react"
import { useUpdaterStore } from "@/lib/updater-store"

/**
 * SidebarUpdateIndicator — persistent "Update available" pill at the sidebar
 * bottom (Linear-style). Renders only when the launch update-check found a
 * newer signed version. Click downloads + installs + relaunches.
 */
export function SidebarUpdateIndicator() {
  const update = useUpdaterStore((s) => s.update)
  const downloading = useUpdaterStore((s) => s.downloading)
  const install = useUpdaterStore((s) => s.install)

  if (!update) return null

  return (
    <button
      type="button"
      onClick={() => void install()}
      disabled={downloading}
      title={`Update to v${update.version}`}
      className="mx-2 mb-1.5 flex items-center gap-2 rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-left text-note text-accent transition-colors hover:bg-accent/15 disabled:cursor-default disabled:opacity-70"
    >
      {downloading ? (
        <Loader2 size={15} strokeWidth={2} className="shrink-0 animate-spin" />
      ) : (
        <Download size={15} strokeWidth={1.75} className="shrink-0" />
      )}
      <span className="min-w-0 flex-1 truncate font-medium">
        {downloading ? "Updating…" : "Update available"}
      </span>
      {!downloading && (
        <span className="shrink-0 text-2xs text-accent/70">v{update.version}</span>
      )}
    </button>
  )
}
