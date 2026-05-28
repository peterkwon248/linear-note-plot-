import { cn } from "@/lib/utils"
import { STATUS_CONFIG } from "@/components/note-fields"
import type { NoteStatus } from "@/lib/types"
import { CircleDashed } from "@phosphor-icons/react/dist/ssr/CircleDashed"
import { Circle } from "@phosphor-icons/react/dist/ssr/Circle"
import { CircleHalf } from "@phosphor-icons/react/dist/ssr/CircleHalf"
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle"
import { NOTE_STATUS_COLORS } from "@/lib/colors"

/**
 * Shared status icon component — colored dot per status.
 * backlog = slate, todo = blue, in_progress = amber, done = emerald.
 * Used across sidebar, editor backlinks footer, and notes table.
 */
export function StatusIcon({ status, className }: { status: NoteStatus; className?: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.in_progress

  return (
    <span
      className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: cfg.color }}
      title={cfg.label}
    />
  )
}

/**
 * Shape-differentiated status icon (Linear progress circle): completeness stage
 * expressed through icon shape in addition to color.
 * - backlog     = CircleDashed (raw, 미분류)
 * - todo        = Circle       (준비)
 * - in_progress = CircleHalf   (정리 중)
 * - done        = CheckCircle  (완성)
 *
 * Used in notes-table, sidebar, breadcrumb, gallery, trash, books, and group headers.
 */
export function StatusShapeIcon({
  status,
  size = 14,
  className,
}: {
  status: NoteStatus
  size?: number
  className?: string
}) {
  const color = NOTE_STATUS_COLORS[status]?.css ?? "currentColor"
  const shared = cn("shrink-0", className)
  if (status === "backlog") {
    return <CircleDashed size={size} weight="bold" style={{ color }} className={shared} />
  }
  if (status === "todo") {
    return <Circle size={size} weight="bold" style={{ color }} className={shared} />
  }
  if (status === "in_progress") {
    return <CircleHalf size={size} weight="bold" style={{ color }} className={shared} />
  }
  return <CheckCircle size={size} weight="bold" style={{ color }} className={shared} />
}
