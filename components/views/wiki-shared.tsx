"use client"

import { cn } from "@/lib/utils"
import type { WikiStatus } from "@/lib/types"
import type { LucideIcon } from "lucide-react"

/* ── Wiki Status Dot ── */

export function WikiStatusDot({ status }: { status: WikiStatus | null }) {
  if (!status) return <span className="h-2 w-2 rounded-full shrink-0 bg-muted-foreground/30" />
  const colors: Record<string, string> = {
    stub: "bg-chart-3",
    draft: "bg-accent",
    complete: "bg-wiki-complete",
  }
  return <span className={cn("h-2 w-2 rounded-full shrink-0", colors[status] ?? "bg-muted-foreground/30")} />
}

/* ── Wiki Status Badge ── */

export function WikiStatusBadge({ status }: { status: WikiStatus }) {
  const styles: Record<string, string> = {
    stub: "bg-chart-3/10 text-chart-3",
    draft: "bg-accent/10 text-accent",
    complete: "bg-wiki-complete/10 text-wiki-complete",
  }
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", styles[status])}>
      {status}
    </span>
  )
}

/* ── Stat Card ── */

export function StatCard({ icon: Icon, label, value, color, onClick }: {
  icon: LucideIcon
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
        onClick && "transition-colors duration-150 hover:bg-secondary/50 hover:border-accent/30 cursor-pointer"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("h-4 w-4", color)} strokeWidth={1.5} />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
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
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{title}</h3>
      {subtitle && <p className="text-[10px] text-muted-foreground mb-3">{subtitle}</p>}
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

/* ── Sidebar Section ── */

export function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      {children}
    </div>
  )
}

/* ── Article Row ── */

export function ArticleRow({ note, onOpen, backlinkCount }: {
  note: { id: string; title: string; wikiStatus: WikiStatus | null; preview?: string; updatedAt: string }
  onOpen: (id: string) => void
  backlinkCount: number
}) {
  return (
    <button
      onClick={() => onOpen(note.id)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-secondary/50"
    >
      <WikiStatusDot status={note.wikiStatus} />
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-foreground">{note.title || "Untitled"}</span>
        {note.preview && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{note.preview}</p>
        )}
      </div>
      {backlinkCount > 0 && (
        <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
          {backlinkCount} links
        </span>
      )}
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {shortRelative(note.updatedAt)}
      </span>
    </button>
  )
}

/* ── Stubs by Source ── */

export const STUB_SOURCE_LABELS: Record<string, string> = {
  "red-link": "Red Links",
  "tag": "Tags",
  "backlink": "Backlinks",
  "manual": "Manual",
}

export const STUB_SOURCE_COLORS: Record<string, string> = {
  "red-link": "bg-destructive/10 text-destructive",
  "tag": "bg-accent/10 text-accent",
  "backlink": "bg-blue-500/10 text-blue-500",
  "manual": "bg-secondary text-muted-foreground",
}

export function StubsBySourceList({ items }: { items: [string, number][] }) {
  return (
    <div className="space-y-2">
      {items.map(([source, count]) => (
        <div key={source} className="flex items-center justify-between">
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STUB_SOURCE_COLORS[source] ?? "bg-secondary text-muted-foreground")}>
            {STUB_SOURCE_LABELS[source] ?? source}
          </span>
          <span className="text-xs tabular-nums font-medium text-foreground">{count}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Helpers ── */

import { shortRelative } from "@/lib/format-utils"
