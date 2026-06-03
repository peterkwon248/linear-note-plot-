/**
 * Plot icon registry — lucide-react alias layer with Plot-friendly names
 * and default sizes preserved from the original mockup (plot-mockup-v3.jsx).
 *
 * User decision (2026-05-24): all icons unify under lucide for visual
 * consistency with the PR-X5/X6 lucide migration. Custom mockup SVGs were
 * removed in favor of lucide equivalents — call sites unchanged because the
 * `Icon*` aliases (and their default `size` props) are preserved by thin
 * wrappers.
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
import { SPACE_ICONS } from "@/lib/entity-icons"
import {
  // Activity bar
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
  Zap,
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
} from "lucide-react"
import { CircleDashed } from "@phosphor-icons/react/dist/ssr/CircleDashed"
import { Circle } from "@phosphor-icons/react/dist/ssr/Circle"
import { CircleHalf } from "@phosphor-icons/react/dist/ssr/CircleHalf"
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle"

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

/* ── Activity Bar (Tier 1, 20px) ─────────────────────────────────────── */

export function IconHome({ size = 20, ...props }: IconProps) {
  return <SPACE_ICONS.home size={size} strokeWidth={1.5} {...props} />
}

export function IconInbox({ size = 20, ...props }: IconProps) {
  return <SPACE_ICONS.inbox size={size} strokeWidth={1.5} {...props} />
}

export function IconNotes({ size = 20, ...props }: IconProps) {
  return <SPACE_ICONS.notes size={size} strokeWidth={1.5} {...props} />
}

/**
 * Wiki ENTITY icon. Used in the activity bar, sidebar Overview, ViewHeader,
 * side-panel connections, mention/wikilink picker, book item rows, etc. —
 * single canonical wiki glyph so swapping the underlying icon takes one edit.
 *
 * Wiki STATUS (manual 4-stage) is shown via the shared 4-circle `StatusIcon`
 * (components/status-icon.tsx) on status-bearing surfaces (wiki list/board/grid
 * /detail). In mixed contexts that only need "this is a wiki entity", use this
 * `IconWiki` — the legacy IconWikiStub/IconWikiArticle (which encoded both
 * entity + stub/article) were removed in the v151 wiki-status unification.
 */
export function IconWiki({ size = 20, ...props }: IconProps) {
  return <SPACE_ICONS.wiki size={size} strokeWidth={1.5} {...props} />
}

export function IconOntology({ size = 20, ...props }: IconProps) {
  return <SPACE_ICONS.ontology size={size} strokeWidth={1.5} {...props} />
}

export function IconCalendar({ size = 20, ...props }: IconProps) {
  return <SPACE_ICONS.calendar size={size} strokeWidth={1.5} {...props} />
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

/** Smart Book — lucide Zap (lightning = "auto / smart" affordance). The
 *  Books-space analog of IconTemplate; Books' "More" Smart Book nav + the
 *  preset gallery use this single canonical glyph. */
export function IconSmartBook({ size = 16, ...props }: IconProps) {
  return <Zap size={size} strokeWidth={1.5} {...props} />
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

/* ── Wiki Status ─────────────────────────────────────────────────────── */
// Wiki status (manual 4-stage backlog/todo/in_progress/done) uses the shared
// 4-circle `StatusIcon` / `StatusShapeIcon` (components/status-icon.tsx),
// unified with Notes (v151). The legacy IconWikiStub/IconWikiArticle (stub vs
// article maturity) were removed — mixed-context entity identification uses
// `IconWiki` (BookOpen) above.

/* ── Note Status (4단계 완성도 축 — Linear progress circle) ─────────── */

/** Backlog — phosphor `CircleDashed` (raw, 미분류). */
export function IconBacklog({ size = 20, ...rest }: IconProps) {
  return <CircleDashed size={size} weight="regular" {...rest} />
}

/** Todo — phosphor `Circle` (준비, queued). */
export function IconTodo({ size = 20, ...rest }: IconProps) {
  return <Circle size={size} weight="regular" {...rest} />
}

/** In Progress — phosphor `CircleHalf` (정리 중). */
export function IconInProgress({ size = 20, ...rest }: IconProps) {
  return <CircleHalf size={size} weight="regular" {...rest} />
}

/** Done — phosphor `CheckCircle` (완성). */
export function IconDone({ size = 20, ...rest }: IconProps) {
  return <CheckCircle size={size} weight="regular" {...rest} />
}

