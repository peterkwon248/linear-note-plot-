import { cn } from "@/lib/utils"
import { STATUS_CONFIG } from "@/components/note-fields"
import type { NoteStatus } from "@/lib/types"
import { CircleDashed } from "@phosphor-icons/react/dist/ssr/CircleDashed"
import { CircleHalf } from "@phosphor-icons/react/dist/ssr/CircleHalf"
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle"
import { NOTE_STATUS_COLORS } from "@/lib/colors"

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

/**
 * Shape-differentiated status icon (Linear-style): workflow stage expressed through
 * icon shape in addition to color.
 * - inbox     = dashed circle (cyan)
 * - capture   = half-filled circle (orange)
 * - permanent = check circle (green)
 *
 * Used in notes-table, peek picker, and anywhere a richer affordance is wanted
 * over a plain colored dot.
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
  const color = NOTE_STATUS_COLORS[status].css
  const shared = cn("shrink-0", className)
  if (status === "inbox") {
    return <CircleDashed size={size} weight="regular" style={{ color }} className={shared} />
  }
  if (status === "capture") {
    return <CircleHalf size={size} weight="fill" style={{ color }} className={shared} />
  }
  return <CheckCircle size={size} weight="fill" style={{ color }} className={shared} />
}
