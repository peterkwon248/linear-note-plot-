import { cn } from "@/lib/utils"
import { STATUS_CONFIG } from "@/components/note-fields"
import type { NoteStatus } from "@/lib/types"
import { Hexagon } from "@phosphor-icons/react/dist/ssr/Hexagon"
import { Cube } from "@phosphor-icons/react/dist/ssr/Cube"
import { Cuboid2x2 } from "@/components/icons/Cuboid2x2"
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
 * - stone    = Hexagon  (raw granite)
 * - brick    = Cube     (fired brick)
 * - keystone = Cuboid2x2 (finished crystal)
 *
 * 2026-05-13: SVG weight "bold"로 두꺼운 outline 렌더. bg badge 없이 icon
 * 자체 선명도 ↑로 chip과 visual weight 매치. (이전 outline regular + bg
 * badge 시도는 사용자가 "선명한 호버가 항시 있어 눈 피로"로 보고 → revert.
 * fill weight은 Cuboid2x2가 line-only SVG라 작동 X → bold로 통일.)
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
  if (status === "stone") {
    return <Hexagon size={size} weight="bold" style={{ color }} className={shared} />
  }
  if (status === "brick") {
    return <Cube size={size} weight="bold" style={{ color }} className={shared} />
  }
  return <Cuboid2x2 size={size} weight="bold" style={{ color }} className={shared} />
}
