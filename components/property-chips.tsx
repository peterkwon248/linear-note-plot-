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
import {
  Folder as PhFolder,
  Hash as PhHash,
  Tag as PhTag,
  Link2 as PhLink,
  FileText as PhFileText,
  Eye as PhEye,
  ListTree as PhTree,
  CornerUpLeft as PhParent,
  Pin as PhPushPin,
  StickyNote as PhNoteBlank,
  Layers as PhStack,
  ImageIcon as PhImage,
  Quote as PhQuotes,
  List as PhList,
  Zap as PhLightning,
  Pencil as PhPencilSimple,
  Blend as PhBlend,
  BookOpen as PhBookOpen,
  Sticker as PhSticker,
  Trash2 as PhTrash,
} from "lucide-react"
import { StatusBadge, PriorityBadge } from "@/components/note-fields"
import { shortRelative } from "@/lib/format-utils"
import type { NoteStatus, NotePriority } from "@/lib/types"
import { getEntityColor } from "@/lib/colors" // v109: opt-in color fallback
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"

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

export function FolderChip({ folder }: { folder: { name: string; color: string | null } }) {
  // Folder color tints both icon and text. bg uses the same color at 1a (~10%). v109: opt-in color fallback
  const resolvedColor = getEntityColor(folder.color)
  return (
    <ChipShell
      title={folder.name}
      style={{
        backgroundColor: `${resolvedColor}1a`,
        color: resolvedColor,
      }}
    >
      <PhFolder size={10} strokeWidth={2} />
      <span className="truncate max-w-[80px]">{folder.name}</span>
    </ChipShell>
  )
}

/* ── Multi-folder marker (PR c) ───────────────────────── */

/**
 * Visual marker for "this note is also in N other folders". Used on
 * board / grid cards when groupBy="folder" so a note that appears in
 * multiple folder columns surfaces its multi-membership at a glance —
 * otherwise the user sees the same card in two columns and might think
 * it's a bug. Tooltip lists the other folder names.
 *
 * Style: muted (no folder color tint) since it's a meta-indicator, not
 * an entity chip. Icon = small folders-plural mark drawn inline.
 */
export function MultiFolderMarker({
  count,
  otherFolderNames,
}: {
  count: number
  otherFolderNames: string[]
}) {
  return (
    <span
      title={`Also in: ${otherFolderNames.join(", ")}`}
      className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded-sm text-2xs font-medium leading-none whitespace-nowrap shrink-0 bg-secondary/60 text-muted-foreground"
    >
      <PhFolder size={10} strokeWidth={2} />
      +{count}
    </span>
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
      <PhTag size={10} strokeWidth={2} />
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
export function TagChip({ tag }: { tag: { name: string; color: string | null } }) {
  // v109: opt-in color fallback
  const resolvedColor = getEntityColor(tag.color)
  return (
    <ChipShell
      title={`#${tag.name}`}
      style={{
        backgroundColor: `${resolvedColor}1a`,
        color: resolvedColor,
      }}
    >
      <PhHash size={10} strokeWidth={2.5} className="-mr-0.5" />
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
      <PhLink size={10} strokeWidth={2} />
      {count}
    </span>
  )
}

/* ── Words chip ───────────────────────────────────────── */

export function WordsChip({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 h-5 text-2xs text-muted-foreground leading-none whitespace-nowrap shrink-0">
      <PhFileText size={10} strokeWidth={2} />
      {count}w
    </span>
  )
}

/* ── Reads chip (wiki) ────────────────────────────────── */

export function ReadsChip({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 h-5 text-2xs text-muted-foreground leading-none whitespace-nowrap shrink-0">
      <PhEye size={10} strokeWidth={2} />
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
        <PhFolder size={10} strokeWidth={2} />
        <span className="truncate max-w-[80px]">{name}</span>
      </ChipShell>
    )
  }
  return (
    <ChipShell
      title={name}
      className="bg-secondary text-muted-foreground"
    >
      <PhFolder size={10} strokeWidth={2} />
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
      <PhParent size={10} strokeWidth={2} />
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
      <PhTree size={10} strokeWidth={2} />
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
      <PhPushPin className="text-accent" size={12} strokeWidth={2} />
    </span>
  )
}

/* ── Trashed chip ─────────────────────────────────────── */

/**
 * State flag for soft-deleted (trashed) notes. Surfaced when the "Show
 * trashed" toggle reveals trashed items in an otherwise-active view — the
 * opacity dim alone wasn't a strong enough signal (2026-06-04 user report).
 *
 * Visual weight matches LabelChip/StatusChip (tinted bg + 1px border + icon
 * + label) but uses the destructive/red ramp so a trashed item reads as a
 * warning state, not an entity. Always rendered when `note.trashed` — it's a
 * state flag, NOT a toggleable display property.
 */
export function TrashedChip() {
  return (
    <ChipShell
      title="In trash"
      style={{
        backgroundColor: "color-mix(in srgb, var(--destructive) 14%, transparent)",
        color: "var(--destructive)",
        borderColor: "color-mix(in srgb, var(--destructive) 38%, transparent)",
        borderWidth: "1px",
        borderStyle: "solid",
      }}
    >
      <PhTrash size={10} strokeWidth={2} />
      Trashed
    </ChipShell>
  )
}

/* ── TagNoteCountChip (Group C PR-D) ─────────────────── */

/**
 * Displays the number of notes attached to a tag.
 * Rendered on tag entity cards (tags-list view). Hidden when count === 0
 * to keep empty-tag rows visually clean.
 *
 * Icon: NoteBlank — consistent with other note-count indicators across
 * the app. Neutral muted style (no color tint) — count is metadata,
 * not identity.
 */
export function TagNoteCountChip({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span
      title={`${count} ${count === 1 ? "note" : "notes"}`}
      className="inline-flex items-center gap-0.5 h-5 text-2xs text-muted-foreground leading-none whitespace-nowrap shrink-0"
    >
      <PhNoteBlank size={10} strokeWidth={2} />
      {count}
    </span>
  )
}

/* ── LabelNoteCountChip (Group C PR-D-2) ─────────────── */

/**
 * Displays the number of notes attached to a label.
 * Rendered on label entity cards (labels-list view). Hidden when count === 0
 * to keep empty-label rows visually clean.
 *
 * Visually identical to TagNoteCountChip — same NoteBlank icon, same neutral
 * muted style. Data source differs: Label uses Note.labelId (1:1 single-label)
 * vs. Tag's Note.tags[] (N:M array).
 */
export function LabelNoteCountChip({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span
      title={`${count} ${count === 1 ? "note" : "notes"}`}
      className="inline-flex items-center gap-0.5 h-5 text-2xs text-muted-foreground leading-none whitespace-nowrap shrink-0"
    >
      <PhNoteBlank size={10} strokeWidth={2} />
      {count}
    </span>
  )
}

/* ── StickerMemberCountChip (Group C PR-D-3) ─────────────── */

/**
 * Displays the number of cross-entity members attached to a sticker.
 * Rendered on sticker entity cards (stickers list view). Hidden when
 * count === 0 to keep empty-sticker rows visually clean.
 *
 * Visual style mirrors TagNoteCountChip / LabelNoteCountChip — same h-5 /
 * text-2xs / muted-foreground. Different icon (Stack) to signal
 * cross-entity bundling: stickers can group note + wiki + tag/label/...
 * Data source: Sticker.members[].length with active-entity filtering for
 * note/wiki kinds (matches useStickersView countMap).
 */
export function StickerMemberCountChip({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span
      title={`${count} ${count === 1 ? "item" : "items"}`}
      className="inline-flex items-center gap-0.5 h-5 text-2xs text-muted-foreground leading-none whitespace-nowrap shrink-0"
    >
      <PhStack size={10} strokeWidth={2} />
      {count}
    </span>
  )
}

/* ── RefTypeChip (Group C PR-D-4) ─────────────────────── */

/**
 * Reference type indicator: "link" (has a url field) or "citation" (no url).
 * Domain-specific to References (rich entity with infobox fields).
 *
 * Visual: muted pill with lead icon — Link icon for url-typed refs, Quotes
 * icon for citations. Distinct from TagChip/LabelChip (no entity color tint)
 * since type is metadata, not identity.
 */
export function RefTypeChip({ type }: { type: "link" | "citation" }) {
  const Icon = type === "link" ? PhLink : PhQuotes
  return (
    <ChipShell
      title={type === "link" ? "Link reference" : "Citation"}
      className="bg-secondary/60 text-muted-foreground"
    >
      <Icon size={10} strokeWidth={2} />
      <span className="capitalize">{type}</span>
    </ChipShell>
  )
}

/* ── RefFieldCountChip ─────────────────────────────────── */

/**
 * Field count indicator for Reference cards (infobox metadata count).
 * Hidden when count === 0 — empty-fields refs are visually clean.
 */
export function RefFieldCountChip({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span
      title={`${count} ${count === 1 ? "field" : "fields"}`}
      className="inline-flex items-center gap-0.5 h-5 text-2xs text-muted-foreground leading-none whitespace-nowrap shrink-0"
    >
      <PhFileText size={10} strokeWidth={2} />
      {count}
    </span>
  )
}

/* ── RefImageChip ──────────────────────────────────────── */

/**
 * Image presence indicator for Reference cards. Icon-only (boolean signal).
 * Used when a reference carries an `imageUrl`.
 */
export function RefImageChip() {
  return (
    <span
      title="Has image"
      className="inline-flex items-center h-5 text-2xs text-muted-foreground leading-none whitespace-nowrap shrink-0"
    >
      <PhImage size={10} strokeWidth={2} />
    </span>
  )
}

/* ── FileTypeChip (Group C PR-D-5) ─────────────────────── */

/**
 * Attachment type indicator for File entity cards: image / url / file.
 * Domain-specific to Files (Library /library/files).
 *
 * Visual: muted pill with lead icon — Image icon for image attachments,
 * Link icon for url-typed, FileText for generic files. Distinct from
 * RefTypeChip (icon-text rather than text-only) to differentiate
 * Reference vs File at a glance in shared rows.
 */
export function FileTypeChip({ type }: { type: "image" | "url" | "file" }) {
  const label = type === "image" ? "Image" : type === "url" ? "Link" : "File"
  const Icon = type === "image" ? PhImage : type === "url" ? PhLink : PhFileText
  return (
    <ChipShell title={label} className="bg-secondary/60 text-muted-foreground">
      <Icon size={10} strokeWidth={2} />
      {label}
    </ChipShell>
  )
}

/* ── FileSizeChip ──────────────────────────────────────── */

function formatBytesShort(bytes: number): string {
  if (!bytes || bytes < 0) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

/**
 * File size indicator. Tabular-numeric for column alignment in lists. Uses
 * the same B/KB/MB/GB formatter as FilesView's existing column.
 */
export function FileSizeChip({ size }: { size: number }) {
  return (
    <span
      title={`${size} bytes`}
      className="inline-flex items-center h-5 text-2xs text-muted-foreground tabular-nums leading-none whitespace-nowrap shrink-0"
    >
      {formatBytesShort(size)}
    </span>
  )
}

/* ── BookItemCountChip (books-view-engine-2) ─────────── */

/**
 * Displays Book.items.length (manual + chapter-heading items). Auto-resolved
 * Smart-source items are NOT counted — resolver runs on the detail page only,
 * so list/grid cards stay store-local. Acceptable approximation for sort/
 * filter signals; if accuracy matters, lift resolvedContentItems to view.
 *
 * Hidden when count === 0 (clean blank-book cards).
 */
export function BookItemCountChip({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span
      title={`${count} ${count === 1 ? "item" : "items"}`}
      className="inline-flex items-center gap-0.5 h-5 text-2xs text-muted-foreground leading-none whitespace-nowrap shrink-0"
    >
      <PhList size={10} strokeWidth={2} />
      {count}
    </span>
  )
}

/* ── BookKindChip (books-view-engine-2) ──────────────── */

/**
 * Book kind indicator: Smart (auto-resolved sources), Manual (curated items),
 * or Hybrid (both). Drives the kind filter and surfaces the book's
 * organizational approach at a glance.
 *
 * Notes StatusBadge 패턴 정합 (2026-05-12): color + bg + border + icon + label.
 * BookKindIcon (leading)과 같은 shape이지만 chip 자체 색이 다르므로 시각 분리.
 */
const BOOK_KIND_CONFIG: Record<
  "smart" | "manual" | "hybrid",
  { label: string; color: string; bg: string; border: string; Icon: typeof PhLightning }
> = {
  smart: {
    label: "Smart",
    // 색정합(2026-05-31): kind=분류축 → 무채 통일(형태로 구분). violet은 home
    // space 색(#5E6AD2)과 충돌이라 제거. 종류는 Zap 아이콘 + 라벨로 식별.
    color: "var(--muted-foreground)",
    bg: "color-mix(in srgb, var(--muted-foreground) 14%, transparent)",
    border: "color-mix(in srgb, var(--muted-foreground) 28%, transparent)",
    Icon: PhLightning,
  },
  manual: {
    label: "Manual",
    // neutral — muted-foreground via currentColor inheritance
    color: "var(--muted-foreground)",
    bg: "color-mix(in srgb, var(--muted-foreground) 14%, transparent)",
    border: "color-mix(in srgb, var(--muted-foreground) 28%, transparent)",
    Icon: PhPencilSimple,
  },
  hybrid: {
    label: "Hybrid",
    // 색정합(2026-05-31): 무채 통일. amber(#D97706)는 status.in_progress와
    // 충돌이라 제거. 종류는 Blend 아이콘 + 라벨로 식별.
    color: "var(--muted-foreground)",
    bg: "color-mix(in srgb, var(--muted-foreground) 14%, transparent)",
    border: "color-mix(in srgb, var(--muted-foreground) 28%, transparent)",
    Icon: PhBlend,
  },
}

export function BookKindChip({ kind }: { kind: "smart" | "manual" | "hybrid" }) {
  const cfg = BOOK_KIND_CONFIG[kind]
  const Icon = cfg.Icon
  return (
    <span
      title={cfg.label}
      className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-2xs font-medium leading-none whitespace-nowrap shrink-0"
      style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      <Icon size={10} strokeWidth={2} />
      {cfg.label}
    </span>
  )
}

/* ── BookKindIcon (books-view-engine-6: kind-shape carries meaning) ─ */

/**
 * Cover/leading icon variant of BookKindChip. Plot status pattern
 * (stone/brick/keystone) uses shape + color to express meaning; Books kind
 * gets the same treatment in card/row leading positions. Cover emoji
 * (when present on the book) still wins — this is the icon fallback path.
 *
 * Color mapping mirrors BooksGalleryAdapter accentColor (PR 4): Smart
 * violet / Hybrid amber / Manual neutral. Dark-mode tone shift kept subtle
 * via Tailwind dark variant; values harmonize with v3 priority palette.
 */
export function BookKindIcon({
  kind,
  size = 14,
}: {
  kind: "smart" | "manual" | "hybrid"
  size?: number
}) {
  if (kind === "smart") {
    return <PhLightning size={size} strokeWidth={2} className="text-muted-foreground" />
  }
  if (kind === "hybrid") {
    return <PhBlend size={size} strokeWidth={2} className="text-muted-foreground" />
  }
  return <PhPencilSimple size={size} strokeWidth={2} className="text-muted-foreground" />
}

/* ── BookSourceKindChip mini-bar (books-view-engine-2) ─ */

const SOURCE_KIND_ICON: Record<"folder" | "category" | "tag" | "label" | "sticker", typeof PhFolder> = {
  folder:   PhFolder,
  category: PhBookOpen,
  tag:      PhHash,
  label:    PhTag,
  sticker:  PhSticker,
}

const SOURCE_KIND_LABEL: Record<"folder" | "category" | "tag" | "label" | "sticker", string> = {
  folder:   "Folder",
  category: "Wiki category",
  tag:      "Tag",
  label:    "Label",
  sticker:  "Sticker",
}

/**
 * Mini-bar showing which Smart-source kinds are configured for this book.
 * Icons only (no labels) — fits in a single chip slot even when 5 source
 * types are present. Mirrors StickerKindChip pattern (per Group C PR-D §6).
 *
 * `kinds` should be deduped before passing in (use a Set on Book.smartSources).
 * Hidden when array is empty (manual-only books).
 */
export function BookSourceKindChip({ kinds }: { kinds: Array<"folder" | "category" | "tag" | "label" | "sticker"> }) {
  if (!kinds || kinds.length === 0) return null
  const title = `Smart sources: ${kinds.map((k) => SOURCE_KIND_LABEL[k]).join(", ")}`
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 h-5 text-2xs text-muted-foreground leading-none whitespace-nowrap shrink-0"
    >
      {kinds.map((k) => {
        const Icon = SOURCE_KIND_ICON[k]
        return <Icon key={k} size={10} strokeWidth={2} />
      })}
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
  const hidden = valid.slice(maxVisible)

  return (
    <div className={`flex items-center gap-1 min-w-0 overflow-hidden ${className ?? ""}`}>
      {visible.map((c, i) => (
        // ReactNode keys: rely on the parent to provide stable element keys
        // (chips are typically components with no key — we inject indices).
        // eslint-disable-next-line react/no-array-index-key
        <span key={i} className="flex items-center min-w-0 shrink-0">
          {c}
        </span>
      ))}
      {/* Overflow: the "+N" chip is a hover-card trigger that reveals the
          HIDDEN chips' actual content — not just a count. 2026-06-04 — 사용자
          보고: 보드/그리드에서 "+N more"만 뜨고 가려진 프로퍼티 내용이 안 나옴. */}
      {hidden.length > 0 && (
        <HoverCard openDelay={80} closeDelay={60}>
          <HoverCardTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center shrink-0 rounded-sm focus:outline-none"
              aria-label={`Show ${hidden.length} more propert${hidden.length === 1 ? "y" : "ies"}`}
            >
              <MoreChip count={hidden.length} />
            </button>
          </HoverCardTrigger>
          <HoverCardContent
            align="start"
            side="top"
            className="w-auto max-w-[280px] p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-start gap-1.5">
              {hidden.map((c, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <span key={i} className="flex items-center min-w-0">
                  {c}
                </span>
              ))}
            </div>
          </HoverCardContent>
        </HoverCard>
      )}
    </div>
  )
}

export const PropertyChipRow = memo(PropertyChipRowInner)
