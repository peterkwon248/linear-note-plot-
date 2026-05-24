/**
 * Plot icon registry — lucide-react alias layer with Plot-friendly names
 * and default sizes preserved from the original mockup (plot-mockup-v3.jsx).
 *
 * User decision (2026-05-24): everything except brand status icons
 * (Stone/Brick/Block) unifies under lucide for visual consistency with the
 * PR-X5/X6 lucide migration. Custom mockup SVGs were removed in favor of
 * lucide equivalents — call sites unchanged because the `Icon*` aliases
 * (and their default `size` props) are preserved by thin wrappers.
 *
 * Categories:
 *   1. Activity bar (Tier 1, 20px default)
 *   2. Sidebar nav (14-16px default)
 *   3. Action icons (14-18px default)
 *   4. Wiki status (16px default)
 *   5. Brand status (Stone / Brick / Block) — **phosphor + custom SVG
 *      intentionally retained, 영구 룰 #95** (crystalline → cube → 2×2
 *      cuboid metaphor is Plot-specific identity).
 *
 * Stroke width = 1.5 across the board (Linear-style) to keep the existing
 * mockup tone — lucide's default of 2 reads heavier than the rest of the
 * UI. Override per-call with `strokeWidth` prop if needed.
 */

import { type SVGProps } from "react"
import {
  // Activity bar
  House,
  Inbox,
  FileText,
  BookOpen,
  Network,
  Calendar,
  Sun,
  Moon,
  Settings,
  // Sidebar nav
  File as LucideFile,
  Folder,
  Tag,
  Bookmark,
  LayoutTemplate,
  Sparkles,
  Pin,
  // Action icons
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
  PanelRight,
  Filter,
  ArrowDownUp,
  MoreHorizontal,
  PanelLeftClose,
  Check,
  BellOff,
  ArrowLeft,
  Columns2,
  // Wiki status (mockup parity: Book = stub, BookMarked = article)
  Book,
  BookMarked,
} from "lucide-react"
import { Hexagon } from "@phosphor-icons/react/dist/ssr/Hexagon"
import { Cube } from "@phosphor-icons/react/dist/ssr/Cube"
import { Cuboid2x2 } from "@/components/icons/Cuboid2x2"

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

/* ── Activity Bar (Tier 1, 20px) ─────────────────────────────────────── */

export function IconHome({ size = 20, ...props }: IconProps) {
  return <House size={size} strokeWidth={1.5} {...props} />
}

export function IconInbox({ size = 20, ...props }: IconProps) {
  return <Inbox size={size} strokeWidth={1.5} {...props} />
}

export function IconNotes({ size = 20, ...props }: IconProps) {
  return <FileText size={size} strokeWidth={1.5} {...props} />
}

/**
 * Wiki ENTITY icon. Used in the activity bar, sidebar Overview, ViewHeader,
 * side-panel connections, mention/wikilink picker, etc. — single source of
 * truth so swapping the underlying icon takes one edit.
 *
 * For wiki STATUS icons (stub vs article maturity) see IconWikiStub /
 * IconWikiArticle below.
 */
export function IconWiki({ size = 20, ...props }: IconProps) {
  return <BookOpen size={size} strokeWidth={1.5} {...props} />
}

export function IconOntology({ size = 20, ...props }: IconProps) {
  return <Network size={size} strokeWidth={1.5} {...props} />
}

export function IconCalendar({ size = 20, ...props }: IconProps) {
  return <Calendar size={size} strokeWidth={1.5} {...props} />
}

export function IconSun({ size = 18, ...props }: IconProps) {
  return <Sun size={size} strokeWidth={1.5} {...props} />
}

export function IconMoon({ size = 18, ...props }: IconProps) {
  return <Moon size={size} strokeWidth={1.5} {...props} />
}

export function IconGear({ size = 18, ...props }: IconProps) {
  return <Settings size={size} strokeWidth={1.5} {...props} />
}

/* ── Sidebar Nav (14~16px) ───────────────────────────────────────────── */

export function IconDoc({ size = 14, ...props }: IconProps) {
  return <LucideFile size={size} strokeWidth={1.5} {...props} />
}

export function IconFolder({ size = 16, ...props }: IconProps) {
  return <Folder size={size} strokeWidth={1.5} {...props} />
}

export function IconTag({ size = 16, ...props }: IconProps) {
  return <Tag size={size} strokeWidth={1.5} {...props} />
}

/** Label = lucide Bookmark — label silhouette in lucide reads closest to
 *  Plot's original label shape (rounded chevron). */
export function IconLabel({ size = 16, ...props }: IconProps) {
  return <Bookmark size={size} strokeWidth={1.5} {...props} />
}

export function IconTemplate({ size = 16, ...props }: IconProps) {
  return <LayoutTemplate size={size} strokeWidth={1.5} {...props} />
}

/** Insight — lucide Sparkles (Linear/Notion-style "AI / insight" affordance). */
export function IconInsight({ size = 16, ...props }: IconProps) {
  return <Sparkles size={size} strokeWidth={1.5} {...props} />
}

export function IconPin({ size = 14, ...props }: IconProps) {
  return <Pin size={size} strokeWidth={1.5} {...props} />
}

/* ── Action Icons ────────────────────────────────────────────────────── */

export function IconSearch({ size = 18, ...props }: IconProps) {
  return <Search size={size} strokeWidth={1.5} {...props} />
}

export function IconPlus({ size = 18, ...props }: IconProps) {
  return <Plus size={size} strokeWidth={1.5} {...props} />
}

export function IconChevronLeft({ size = 18, ...props }: IconProps) {
  return <ChevronLeft size={size} strokeWidth={1.5} {...props} />
}

export function IconChevronRight({ size = 18, ...props }: IconProps) {
  return <ChevronRight size={size} strokeWidth={1.5} {...props} />
}

export function IconTrash({ size = 16, ...props }: IconProps) {
  return <Trash2 size={size} strokeWidth={1.5} {...props} />
}

export function IconClock({ size = 14, ...props }: IconProps) {
  return <Clock size={size} strokeWidth={1.5} {...props} />
}

export function IconPanelRight({ size = 16, ...props }: IconProps) {
  return <PanelRight size={size} strokeWidth={1.5} {...props} />
}

export function IconFilter({ size = 16, ...props }: IconProps) {
  return <Filter size={size} strokeWidth={1.5} {...props} />
}

export function IconSort({ size = 16, ...props }: IconProps) {
  return <ArrowDownUp size={size} strokeWidth={1.5} {...props} />
}

export function IconMore({ size = 16, ...props }: IconProps) {
  return <MoreHorizontal size={size} strokeWidth={1.5} {...props} />
}

/** Sparkle (single starburst) — re-uses Sparkles as a smaller affordance. */
export function IconSparkle({ size = 14, ...props }: IconProps) {
  return <Sparkles size={size} strokeWidth={1.5} {...props} />
}

export function IconPanelLeftClose({ size = 16, ...props }: IconProps) {
  return <PanelLeftClose size={size} strokeWidth={1.5} {...props} />
}

export function IconCheck({ size = 16, ...props }: IconProps) {
  return <Check size={size} strokeWidth={2} {...props} />
}

/** Snooze — lucide BellOff reads as "silenced" (the Plot snooze metaphor). */
export function IconSnooze({ size = 16, ...props }: IconProps) {
  return <BellOff size={size} strokeWidth={1.5} {...props} />
}

export function IconArrowLeft({ size = 16, ...props }: IconProps) {
  return <ArrowLeft size={size} strokeWidth={1.5} {...props} />
}

/** Split View — lucide Columns2 (two-pane split). */
export function IconSplitView({ size = 16, className, ...props }: { size?: number; className?: string } & SVGProps<SVGSVGElement>) {
  return <Columns2 size={size} strokeWidth={1.5} className={className} {...props} />
}

/* ── Wiki Status Icons ───────────────────────────────────────────────── */

/** Stub — lucide Book (closed, simple) = "placeholder, not yet polished". */
export function IconWikiStub({ size = 16, ...props }: IconProps) {
  return <Book size={size} strokeWidth={1.5} {...props} />
}

/** Article — lucide BookMarked (bookmark ribbon) = "polished, published". */
export function IconWikiArticle({ size = 16, ...props }: IconProps) {
  return <BookMarked size={size} strokeWidth={1.5} {...props} />
}

/* ── Brand Status (영구 룰 #95 — phosphor + custom retained) ─────────── */

/**
 * Stone — phosphor `Hexagon` (regular weight). Crystalline / mineral feel
 * matching the raw-input architecture metaphor, in the same Linear-style
 * 1.5px stroke language as the rest of the sidebar nav icons.
 */
export function IconStone({ size = 20, ...rest }: IconProps) {
  return <Hexagon size={size} weight="regular" {...rest} />
}

/**
 * Brick — phosphor `Cube` (regular weight). 3D solid block fits the
 * "regular processed unit" metaphor and reads cleanly at 20px.
 */
export function IconBrick({ size = 20, ...rest }: IconProps) {
  return <Cube size={size} weight="regular" {...rest} />
}

/**
 * Block — same isometric angle as IconBrick (phosphor Cube), but a 2×2×1
 * cuboid (four cubes in a square plane). Composed from a single SVG
 * (`Cuboid2x2`), NOT four `Cube` silhouettes (divider lines would misalign).
 *
 * Hexagon (raw 2D crystal) → Cube (single processed unit) → Block (four
 * assembled units in 2×2 grid).
 */
export function IconBlock({ size = 20, ...rest }: IconProps) {
  return <Cuboid2x2 size={size} weight="regular" {...rest} />
}
