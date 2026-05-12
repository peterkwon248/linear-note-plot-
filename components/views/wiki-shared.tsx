"use client"

import { cn } from "@/lib/utils"
import type { Icon as PhIcon } from "@phosphor-icons/react"
import { Tree as PhTree } from "@phosphor-icons/react/dist/ssr/Tree"
import { Stack as PhStack } from "@phosphor-icons/react/dist/ssr/Stack"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import type { GroupBy } from "@/lib/view-engine/types"
import type { WikiCategory } from "@/lib/types"

/* ── Stat Card ── */

export function StatCard({ icon: Icon, label, value, color, onClick }: {
  icon: PhIcon
  label: string
  value: number
  color: string
  onClick?: () => void
}) {
  const Wrapper = onClick ? "button" : "div"
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "rounded-lg border border-border bg-card p-4 text-left",
        onClick && "transition-colors duration-150 hover:bg-hover-bg hover:border-accent/30 cursor-pointer"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("h-4 w-4", color)} strokeWidth={1.5} />
        <span className="text-2xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </Wrapper>
  )
}

/* ── Stat Row (key-value) ── */

export function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-2xs text-muted-foreground">{label}</span>
      <span className="text-2xs font-medium text-foreground">{value}</span>
    </div>
  )
}

/* ── Dashboard Card ── */

export function DashboardCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{title}</h3>
      {subtitle && <p className="text-2xs text-muted-foreground mb-3">{subtitle}</p>}
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

/* ── Sidebar Section ── */

export function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h4 className="mb-2.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      {children}
    </div>
  )
}

/* ── Article Row ── */

export function ArticleRow({ note, onOpen, backlinkCount }: {
  note: { id: string; title: string; preview?: string; updatedAt: string }
  onOpen: (id: string) => void
  backlinkCount: number
}) {
  return (
    <button
      onClick={() => onOpen(note.id)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-hover-bg"
    >
      <div className="min-w-0 flex-1">
        <span className="text-note font-medium text-foreground">{note.title || "Untitled"}</span>
        {note.preview && (
          <p className="mt-0.5 truncate text-2xs text-muted-foreground">{note.preview}</p>
        )}
      </div>
      {backlinkCount > 0 && (
        <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-2xs font-medium tabular-nums text-muted-foreground">
          {backlinkCount} links
        </span>
      )}
      <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">
        {shortRelative(note.updatedAt)}
      </span>
    </button>
  )
}

/* ── Group Header Icon (Wiki) ──────────────────────────
 *
 * Mirrors notes-table's GroupHeaderIcon for visual parity across views.
 * Per-groupBy icon mapping (영구 결정 2026-05-11):
 *   - family / parent / role  → Tree icon (계층)
 *   - tier                    → Stack icon (depth)
 *   - linkCount               → Link icon
 *   - label                   → wiki-category color dot
 *   - none / default          → null (text-only header)
 *
 * groupKey carries the bucket identity (e.g. "label-${catId}" or
 * "_no_label"). For label groups we parse the catId out and resolve color
 * from wikiCategories; missing categories fall back to muted dot.
 */
export function WikiGroupHeaderIcon({
  groupBy,
  groupKey,
  wikiCategories,
}: {
  groupBy: GroupBy
  groupKey: string
  wikiCategories?: WikiCategory[]
}) {
  switch (groupBy) {
    case "family":
    case "parent":
    case "role":
      return <PhTree className="text-muted-foreground shrink-0" size={14} weight="regular" />
    case "tier":
      return <PhStack className="text-muted-foreground shrink-0" size={14} weight="regular" />
    case "linkCount":
      return <PhLink className="text-muted-foreground shrink-0" size={14} weight="regular" />
    case "label": {
      const catId = groupKey.startsWith("label-") ? groupKey.slice("label-".length) : null
      const color = catId ? wikiCategories?.find((c) => c.id === catId)?.color : null
      return color ? (
        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      ) : (
        <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-muted-foreground" />
      )
    }
    default:
      return null
  }
}

/* ── Helpers ── */

import { shortRelative } from "@/lib/format-utils"
