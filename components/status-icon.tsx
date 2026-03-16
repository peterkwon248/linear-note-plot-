import { cn } from "@/lib/utils"
import { STATUS_CONFIG } from "@/components/note-fields"
import type { NoteStatus } from "@/lib/types"

/**
 * Shared status icon component — colored dot per status.
 * inbox = cyan, capture = orange, permanent = green.
 * Used across sidebar, editor backlinks footer, and notes table.
 */
export function StatusIcon({ status, className }: { status: NoteStatus; className?: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.capture

  return (
    <span
      className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: cfg.color }}
      title={cfg.label}
    />
  )
}
