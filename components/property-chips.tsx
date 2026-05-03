"use client"

/**
 * property-chips.tsx — Linear-style compact chips for board / grid cards.
 *
 * Design rules (PR e):
 *   - Density: small (h-5 / 20px), text-2xs, single-line.
 *   - Domain-specific: each entity (folder/tag/label/etc.) has its own chip
 *     component. We DO NOT make a generic <Chip>. The point is that a folder
 *     chip should LOOK like a folder, a tag should LOOK like a tag.
 *   - Color: derived from the underlying entity. For folders / tags / labels
 *     we tint the chip with `${color}1a` background and the color itself for
 *     icon + text. Counts / dates use neutral muted-foreground.
 *   - Hard cap at the row level (not on individual chips). <PropertyChipRow>
 *     enforces maxVisible=3 + "+N more" overflow — keeps cards visually
 *     balanced across columns.
 *
 * These chips are presentation-only — no interactivity, no hover state.
 * Click handling lives on the parent card.
 */

import { memo, type ReactNode } from "react"
import { Folder as PhFolder } from "@phosphor-icons/react/dist/ssr/Folder"
import { Hash as PhHash } from "@phosphor-icons/react/dist/ssr/Hash"
import { Tag as PhTag } from "@phosphor-icons/react/dist/ssr/Tag"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { FileText as PhFileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Eye as PhEye } from "@phosphor-icons/react/dist/ssr/Eye"
import { Tree as PhTree } from "@phosphor-icons/react/dist/ssr/Tree"
import { ArrowBendUpLeft as PhParent } from "@phosphor-icons/react/dist/ssr/ArrowBendUpLeft"
import { PushPin as PhPushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { StatusBadge, PriorityBadge } from "@/components/note-fields"
import { shortRelative } from "@/lib/format-utils"
import type { NoteStatus, NotePriority } from "@/lib/types"

/* ── Common chip skeleton ─────────────────────────────── */

function ChipShell({
  children,
  style,
  title,
  className,
}: {
  children: ReactNode
  style?: React.CSSProperties
  title?: string
  className?: string
}) {
  // h-5 / px-1.5 / gap-1 — Linear chip dimensions. 2xs text + leading-none
  // keeps multi-chip rows aligned even with mixed icon/text content.
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 h-5 rounded-sm px-1.5 text-2xs font-medium leading-none whitespace-nowrap shrink-0 ${className ?? ""}`}
      style={style}
    >
      {children}
    </span>
  )
}

/* ── Status chip (notes) ──────────────────────────────── */

/**
 * StatusChip wraps the existing <StatusBadge> for visual consistency with
 * the rest of the app. We don't reinvent — StatusBadge already matches
 * Linear's compact pattern (border + tinted bg).
 */
export function StatusChip({ status }: { status: NoteStatus }) {
  return <StatusBadge status={status} />
}

/* ── Priority chip (notes) ────────────────────────────── */

/**
 * PriorityChip is intentionally icon-only (matches PriorityBadge's existing
 * inline behaviour). When priority === "none" the parent should not render
 * this chip at all — the icon would be a meaningless dash.
 */
export function PriorityChip({ priority }: { priority: NotePriority }) {
  if (priority === "none") return null
  return <PriorityBadge priority={priority} />
}

/* ── Folder chip ──────────────────────────────────────── */

export function FolderChip({ folder }: { folder: { name: string; color: string } }) {
  // Folder color tints both icon and text. bg uses the same color at 1a (~10%).
  return (
    <ChipShell
      title={folder.name}
      style={{
        backgroundColor: `${folder.color}1a`,
        color: folder.color,
      }}
    >
      <PhFolder size={10} weight="regular" />
      <span className="truncate max-w-[80px]">{folder.name}</span>
    </ChipShell>
  )
}

/* ── Label chip ───────────────────────────────────────── */

/**
 * LabelChip mirrors LabelBadge but smaller + sharper corners (chip vs pill).
 * Uses 1.5px tinted border to match LabelBadge's identity.
 */
export function LabelChip({ label }: { label: { name: string; color: string } }) {
  return (
    <ChipShell
      title={label.name}
      style={{
        backgroundColor: `color-mix(in srgb, ${label.color} 18%, transparent)`,
        color: label.color,
        borderColor: `color-mix(in srgb, ${label.color} 55%, transparent)`,
        borderWidth: "1px",
        borderStyle: "solid",
      }}
    >
      <PhTag size={10} weight="regular" />
      <span className="truncate max-w-[80px]">{label.name}</span>
    </ChipShell>
  )
}

/* ── Tag chip ─────────────────────────────────────────── */

/**
 * TagChip — hash-prefix style ("#tag"). Tag color tints the chip but no
 * icon (the # is the icon). Shorter max-width than label since tags often
 * come in groups.
 */
export function TagChip({ tag }: { tag: { name: string; color: string } }) {
  return (
    <ChipShell
      title={`#${tag.name}`}
      style={{
        backgroundColor: `${tag.color}1a`,
        color: tag.color,
      }}
    >
      <PhHash size={10} weight="bold" className="-mr-0.5" />
      <span className="truncate max-w-[64px]">{tag.name}</span>
    </ChipShell>
  )
}

/* ── Links chip ───────────────────────────────────────── */

/**
 * Inline-style chip — no background, just icon + count. Used for backlinks
 * counts where the visual weight should stay light.
 */
export function LinksChip({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 h-5 text-2xs text-muted-foreground leading-none whitespace-nowrap shrink-0">
      <PhLink size={10} weight="regular" />
      {count}
    </span>
  )
}

/* ── Words chip ───────────────────────────────────────── */

export function WordsChip({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 h-5 text-2xs text-muted-foreground leading-none whitespace-nowrap shrink-0">
      <PhFileText size={10} weight="regular" />
      {count}w
    </span>
  )
}

/* ── Reads chip (wiki) ────────────────────────────────── */

export function ReadsChip({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 h-5 text-2xs text-muted-foreground leading-none whitespace-nowrap shrink-0">
      <PhEye size={10} weight="regular" />
      {count}
    </span>
  )
}

/* ── Categories chip (wiki) ───────────────────────────── */

/**
 * Single-category chip. Wiki articles can have many categories — render
 * one chip per category and let <PropertyChipRow> apply the cap.
 */
export function CategoryChip({ name, color }: { name: string; color?: string }) {
  if (color) {
    return (
      <ChipShell
        title={name}
        style={{ backgroundColor: `${color}1a`, color }}
      >
        <PhFolder size={10} weight="regular" />
        <span className="truncate max-w-[80px]">{name}</span>
      </ChipShell>
    )
  }
  return (
    <ChipShell
      title={name}
      className="bg-secondary text-muted-foreground"
    >
      <PhFolder size={10} weight="regular" />
      <span className="truncate max-w-[80px]">{name}</span>
    </ChipShell>
  )
}

/* ── Time chips (updated/created) ─────────────────────── */

/**
 * Date chips are bare text — no icon, no background. Linear keeps date
 * meta as a faint right-aligned suffix; we follow the same pattern.
 */
export function UpdatedChip({ iso }: { iso: string }) {
  return (
    <span
      title={`Updated ${new Date(iso).toLocaleString()}`}
      className="inline-flex items-center h-5 text-2xs text-muted-foreground/70 leading-none whitespace-nowrap shrink-0"
    >
      {shortRelative(iso)}
    </span>
  )
}

export function CreatedChip({ iso }: { iso: string }) {
  return (
    <span
      title={`Created ${new Date(iso).toLocaleString()}`}
      className="inline-flex items-center h-5 text-2xs text-muted-foreground/70 leading-none whitespace-nowrap shrink-0"
    >
      +{shortRelative(iso)}
    </span>
  )
}

/* ── Parent chip ──────────────────────────────────────── */

export function ParentChip({ title }: { title: string }) {
  return (
    <ChipShell
      title={`Parent: ${title}`}
      className="bg-secondary/60 text-muted-foreground"
    >
      <PhParent size={10} weight="regular" />
      <span className="truncate max-w-[80px]">{title}</span>
    </ChipShell>
  )
}

/* ── Children chip ────────────────────────────────────── */

export function ChildrenChip({ count }: { count: number }) {
  return (
    <span
      title={`${count} ${count === 1 ? "child" : "children"}`}
      className="inline-flex items-center gap-0.5 h-5 text-2xs text-muted-foreground leading-none whitespace-nowrap shrink-0"
    >
      <PhTree size={10} weight="regular" />
      {count}
    </span>
  )
}

/* ── Aliases chip (wiki) ──────────────────────────────── */

export function AliasesChip({ count }: { count: number }) {
  return (
    <span
      title={`${count} ${count === 1 ? "alias" : "aliases"}`}
      className="inline-flex items-center h-5 text-2xs italic text-muted-foreground/80 leading-none whitespace-nowrap shrink-0"
    >
      {count} {count === 1 ? "alias" : "aliases"}
    </span>
  )
}

/* ── Pinned chip ──────────────────────────────────────── */

/**
 * Pinned is rendered in the title row, NOT in the property chip row —
 * Linear treats pinned-state as identity (always visible) rather than meta.
 * Exposed here for parents that want to compose it themselves.
 */
export function PinnedChip() {
  return (
    <span title="Pinned" className="inline-flex items-center shrink-0">
      <PhPushPin className="text-accent" size={12} weight="regular" />
    </span>
  )
}

/* ── More chip (overflow) ─────────────────────────────── */

export function MoreChip({ count }: { count: number }) {
  return (
    <span
      title={`${count} more`}
      className="inline-flex items-center h-5 px-1.5 rounded-sm text-2xs text-muted-foreground/80 bg-secondary/60 leading-none whitespace-nowrap shrink-0"
    >
      +{count}
    </span>
  )
}

/* ── PropertyChipRow ──────────────────────────────────── */

/**
 * Row container — single line, gap-1, hard cap at maxVisible (default 3).
 * Beyond that, render a "+N" MoreChip. We DO NOT flex-wrap — keeping a
 * single row is critical for visual balance across board columns.
 */
function PropertyChipRowInner({
  chips,
  maxVisible = 3,
  className,
}: {
  chips: ReactNode[]
  maxVisible?: number
  className?: string
}) {
  // Filter falsy children (undefined / null / false) so callers can do
  // `condition && <Chip />` safely.
  const valid = chips.filter(Boolean)
  if (valid.length === 0) return null

  const visible = valid.slice(0, maxVisible)
  const overflow = valid.length - visible.length

  return (
    <div className={`flex items-center gap-1 min-w-0 ${className ?? ""}`}>
      {visible.map((c, i) => (
        // ReactNode keys: rely on the parent to provide stable element keys
        // (chips are typically components with no key — we inject indices).
        // eslint-disable-next-line react/no-array-index-key
        <span key={i} className="flex items-center min-w-0 shrink-0">
          {c}
        </span>
      ))}
      {overflow > 0 && <MoreChip count={overflow} />}
    </div>
  )
}

export const PropertyChipRow = memo(PropertyChipRowInner)
