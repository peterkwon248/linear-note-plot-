import { cn } from "@/lib/utils"
import { STATUS_CONFIG } from "@/components/note-fields"
import type { NoteStatus } from "@/lib/types"
import { Hexagon } from "@phosphor-icons/react/dist/ssr/Hexagon"
import { Cube } from "@phosphor-icons/react/dist/ssr/Cube"
import { Cuboid } from "@/components/icons/Cuboid"
import { NOTE_STATUS_COLORS } from "@/lib/colors"

/**
 * Shared status icon component — colored dot per status.
 * stone = gray, brick = orange, keystone = teal.
 * Used across sidebar, editor backlinks footer, and notes table.
 */
export function StatusIcon({ status, className }: { status: NoteStatus; className?: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.brick

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
 * - stone    = dashed circle (gray)
 * - brick    = half-filled circle (orange)
 * - keystone = check circle (teal)
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
  const color = NOTE_STATUS_COLORS[status]?.css ?? "currentColor"
  const shared = cn("shrink-0", className)
  if (status === "stone") {
    return <Hexagon size={size} weight="regular" style={{ color }} className={shared} />
  }
  if (status === "brick") {
    return <Cube size={size} weight="regular" style={{ color }} className={shared} />
  }
  return <Cuboid size={size} weight="regular" style={{ color }} className={shared} />
}
