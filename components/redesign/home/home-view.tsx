"use client"

/**
 * Home — pure presentational (preview-first redesign scaffolding).
 *
 * Faithful port of the live home surface:
 *   - composition + layout: components/views/home-view.tsx
 *   - stats grid:           components/home/stats-row.tsx
 *   - quick capture:        components/home/quick-capture.tsx
 *   - quicklinks:           components/home/mixed-quicklinks.tsx
 *
 * Every className is copied verbatim from those files. Store reads / i18n /
 * routing are replaced by the `HomeViewModel` props (see ./home.types.ts).
 * No usePlotStore / useRouter / useT here — this is the unit handed to Open
 * Design. The chrome ViewHeader is intentionally omitted (shared shell surface,
 * redesigned separately).
 */

import { useState } from "react"
import { TrendingUp as TrendUp, FileText, type LucideIcon } from "lucide-react"
import type {
  HomeViewModel,
  HomeViewCallbacks,
  HomeStatGroup,
  HomeQuicklink,
} from "./home.types"

export function HomeView({
  vm,
  callbacks = {},
}: {
  vm: HomeViewModel
  callbacks?: HomeViewCallbacks
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-6 py-10">
          {/* Quick Capture (centered, narrow) */}
          <div className="mx-auto mb-10 max-w-2xl">
            <QuickCaptureView
              placeholder={vm.capturePlaceholder}
              onCapture={callbacks.onCapture}
            />
          </div>

          {/* Knowledge base (stats) */}
          <section className="mb-8">
            <header className="mb-3 px-1">
              <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                {vm.knowledgeBaseLabel}
              </h3>
            </header>
            <StatsRowView groups={vm.statGroups} onItemClick={callbacks.onOpenStat} />
          </section>

          {/* Two-column content */}
          <div className="mb-8 grid grid-cols-1 gap-5 min-[700px]:grid-cols-2">
            {/* Most Connected */}
            {vm.mostConnected.items.length > 0 && (
              <ContentCard title={vm.mostConnected.label} icon={TrendUp}>
                {vm.mostConnected.items.map((item) => (
                  <NoteItem
                    key={item.id}
                    title={item.title}
                    meta={item.meta}
                    onClick={() => callbacks.onOpenConnected?.(item.id)}
                  />
                ))}
              </ContentCard>
            )}

            {/* Most Visited — cross-entity (Notes + Books) by reads. */}
            {vm.mostVisited.items.length > 0 && (
              <ContentCard title={vm.mostVisited.label} icon={TrendUp}>
                {vm.mostVisited.items.map((item) => (
                  <RankedItem
                    key={item.id}
                    rank={item.rank}
                    icon={item.icon}
                    title={item.title}
                    count={item.count}
                    onClick={() => callbacks.onOpenVisited?.(item.id)}
                  />
                ))}
              </ContentCard>
            )}
          </div>

          {/* Quicklinks (unified pinned hub) */}
          <section className="mb-6">
            <header className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                {vm.quicklinksLabel}
              </h3>
            </header>
            <MixedQuicklinksView
              items={vm.quicklinks}
              onOpen={callbacks.onOpenQuicklink}
            />
          </section>

          {/* Subtle CTA into the maintenance hub */}
          <div className="flex items-center justify-center pt-2 pb-2">
            <button
              type="button"
              onClick={() => callbacks.onJumpToInbox?.()}
              className="text-2xs text-muted-foreground/60 transition-colors duration-100 hover:text-foreground"
            >
              {vm.ctaLabel} <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Quick Capture (components/home/quick-capture.tsx) ─────────────────── */

function QuickCaptureView({
  placeholder,
  onCapture,
}: {
  placeholder: string
  onCapture?: (text: string) => void
}) {
  const [value, setValue] = useState("")
  const [flashing, setFlashing] = useState(false)

  function submit() {
    const trimmed = value.trim()
    if (!trimmed) return
    onCapture?.(trimmed)
    setValue("")
    setFlashing(true)
    window.setTimeout(() => setFlashing(false), 220)
  }

  return (
    <div
      className={
        "mb-6 transition-shadow duration-200 " +
        (flashing ? "ring-1 ring-foreground/10 rounded-md" : "")
      }
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            submit()
          } else if (e.key === "Escape") {
            setValue("")
            ;(e.target as HTMLInputElement).blur()
          }
        }}
        placeholder={placeholder}
        className={
          "h-10 w-full rounded-lg bg-secondary/50 px-4 text-note text-foreground " +
          "border border-border outline-none transition-all " +
          "placeholder:text-muted-foreground " +
          "focus:border-accent/50 focus:ring-2 focus:ring-accent/20 focus:bg-background"
        }
      />
    </div>
  )
}

/* ── Stats grid (components/home/stats-row.tsx) ───────────────────────── */

function StatsRowView({
  groups,
  onItemClick,
}: {
  groups: HomeStatGroup[]
  onItemClick?: (id: string) => void
}) {
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.key}>
          <h4 className="mb-2 text-2xs font-medium uppercase tracking-wide text-muted-foreground/60">
            {group.label}
          </h4>
          <div className="grid grid-cols-2 gap-3 min-[640px]:grid-cols-3">
            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onItemClick?.(item.id)}
                className="group flex flex-col items-start gap-2 rounded-lg border border-border bg-card px-3 py-4 text-left transition-all duration-150 hover:border-accent/30 hover:bg-accent/[0.03] hover:shadow-sm"
              >
                <div className="flex items-center gap-1.5 w-full">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded ${item.bgClass} ${item.colorClass}`}
                  >
                    {item.icon}
                  </span>
                  <span className="text-2xs font-medium uppercase text-muted-foreground truncate">
                    {item.label}
                  </span>
                </div>
                <span
                  className={`text-2xl font-semibold tabular-nums leading-none ${item.colorClass}`}
                >
                  {item.value}
                </span>
                <span className="text-2xs text-muted-foreground tabular-nums">
                  {item.sub || " "}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Quicklinks (components/home/mixed-quicklinks.tsx) ─────────────────── */

function MixedQuicklinksView({
  items,
  onOpen,
}: {
  items: HomeQuicklink[]
  onOpen?: (key: string) => void
}) {
  if (items.length === 0) return null
  return (
    <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 min-[800px]:grid-cols-3 min-[1100px]:grid-cols-4">
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          onClick={() => onOpen?.(it.key)}
          className="group flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3.5 text-left transition-all duration-150 hover:border-accent/30 hover:bg-accent/[0.03] hover:shadow-sm"
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${it.colorClass}`}
          >
            {it.icon}
          </span>
          <h3 className="line-clamp-1 text-note font-medium text-foreground group-hover:text-accent transition-colors">
            {it.title}
          </h3>
          <p className="line-clamp-1 text-2xs text-muted-foreground">{it.meta}</p>
        </button>
      ))}
    </div>
  )
}

/* ── Content card primitives (components/views/home-view.tsx) ─────────── */

function ContentCard({
  title,
  icon: Icon,
  iconColor = "text-muted-foreground",
  trailing,
  children,
}: {
  title: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { strokeWidth?: number }>
  iconColor?: string
  trailing?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon className={`h-3.5 w-3.5 ${iconColor}`} strokeWidth={1.5} />
          <h3 className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </h3>
        </div>
        {trailing}
      </div>
      <div className="px-1.5 py-1">{children}</div>
    </div>
  )
}

function NoteItem({
  title,
  meta,
  onClick,
}: {
  title: string
  meta: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors duration-100 hover:bg-hover-bg"
    >
      <FileText className="shrink-0 text-muted-foreground" size={14} strokeWidth={2.5} />
      <span className="min-w-0 flex-1 truncate text-note text-foreground group-hover:text-foreground">
        {title}
      </span>
      <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">{meta}</span>
    </button>
  )
}

function RankedItem({
  rank,
  icon,
  title,
  count,
  onClick,
}: {
  rank: number
  icon: React.ReactNode
  title: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors duration-100 hover:bg-hover-bg"
    >
      <span className="w-3.5 shrink-0 text-2xs tabular-nums text-muted-foreground/50">{rank}</span>
      {icon}
      <span className="min-w-0 flex-1 truncate text-note text-foreground group-hover:text-foreground">
        {title}
      </span>
      <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">{count}</span>
    </button>
  )
}

// `LucideIcon` re-export kept for parity with the live module's typing surface.
export type { LucideIcon }
