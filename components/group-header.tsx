"use client"

/**
 * Shared group-header primitives for grouped views.
 *
 * `GroupHeaderIcon` + `resolveGroupLabel` express a group's identity (icon +
 * display name) from its groupBy axis. Shared by list (notes-table) and grid
 * (notes-grid-view) so the same group renders an identical glyph/label across
 * view modes — single source of truth for group identity.
 */

import { FolderOpen } from "lucide-react"
import { StatusShapeIcon } from "@/components/status-icon"
import type { GroupBy } from "@/lib/view-engine/types"
import type { Folder, Label, NoteStatus } from "@/lib/types"

export function resolveGroupLabel(
  groupBy: GroupBy,
  groupKey: string,
  fallback: string,
  folders: Folder[],
  labels: Label[],
): string {
  if (groupBy === "folder" && groupKey !== "_no_folder") {
    return folders.find((f) => f.id === groupKey)?.name ?? fallback
  }
  if (groupBy === "label" && groupKey !== "_no_label") {
    return labels.find((l) => l.id === groupKey)?.name ?? fallback
  }
  return fallback
}

/** Dynamic group header icon based on groupBy type. */
export function GroupHeaderIcon({
  groupBy,
  groupKey,
  labels,
}: {
  groupBy: GroupBy
  groupKey: string
  label?: string
  folders?: Folder[]
  labels: Label[]
}) {
  switch (groupBy) {
    case "status":
      // Use groupKey (raw status value: "backlog"/"todo"/"in_progress"/"done")
      // — labels are display aliases and would miss NOTE_STATUS_COLORS.
      return <StatusShapeIcon status={groupKey as NoteStatus} size={16} />
    case "folder":
      return <FolderOpen className="text-muted-foreground" size={16} strokeWidth={2} />
    case "label": {
      const labelColor = labels.find((l) => l.id === groupKey)?.color
      return labelColor ? (
        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: labelColor }} />
      ) : (
        <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-muted-foreground" />
      )
    }
    default:
      // priority, date, triage, linkCount — text-only, no special icon
      return null
  }
}
