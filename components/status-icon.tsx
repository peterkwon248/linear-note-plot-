import { cn } from "@/lib/utils"
import { STATUS_CONFIG } from "@/components/note-fields"
import type { NoteStatus } from "@/lib/types"
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

/* ── Status metaphor icons (custom SVG) ───────────────────
 * stone    = irregular pentagon-like polygon (raw, ungroomed)
 * brick    = rounded rectangle + mortar seam (regular, processed)
 * keystone = trapezoid wider at top (architectural anchor stone)
 * All: 1.5px stroke, currentColor, designed at 14px viewBox.
 */

type MetaphorIconProps = {
  size?: number
  style?: React.CSSProperties
  className?: string
}

function StoneIcon({ size = 14, style, className }: MetaphorIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <path d="M 4.5 1.6 L 9.6 2.2 L 12.4 5.2 L 11.6 9.6 L 8.2 12.4 L 3.4 11.6 L 1.6 7.4 L 2.6 3.4 Z" />
    </svg>
  )
}

function BrickIcon({ size = 14, style, className }: MetaphorIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <rect x="1.6" y="3.4" width="10.8" height="7.2" rx="1" />
      <path d="M 1.6 7 L 12.4 7" />
    </svg>
  )
}

function KeystoneIcon({ size = 14, style, className }: MetaphorIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <path d="M 1.6 3 L 12.4 3 L 9.6 11 L 4.4 11 Z" />
    </svg>
  )
}

/**
 * Shape-differentiated status icon: workflow stage expressed through icon shape
 * (stone/brick/keystone architecture metaphor) in addition to color.
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
    return <StoneIcon size={size} style={{ color }} className={shared} />
  }
  if (status === "brick") {
    return <BrickIcon size={size} style={{ color }} className={shared} />
  }
  return <KeystoneIcon size={size} style={{ color }} className={shared} />
}
