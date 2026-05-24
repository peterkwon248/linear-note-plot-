"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { useT } from "@/lib/i18n"
import { useInboxBySection, type InboxItem, type InboxSection } from "@/lib/hooks/use-inbox"
import type { InboxItemKind } from "@/lib/store/slices/inbox"
import { ViewHeader } from "@/components/view-header"
import { IconInbox, IconChevronRight } from "@/components/plot-icons"
import { FilterPanel } from "@/components/filter-panel"
import { INBOX_VIEW_CONFIG } from "@/lib/view-engine/view-configs"
import type { FilterRule } from "@/lib/view-engine/types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import { InboxSourceIcon } from "@/components/inbox/inbox-source-icon"
import { X as PhX, Clock } from "lucide-react"

/* ── Snooze option helpers ────────────────────────────── */

function getSnoozeUntil(option: "1h" | "tomorrow" | "next-week"): Date {
  const d = new Date()
  if (option === "1h") {
    d.setHours(d.getHours() + 1)
  } else if (option === "tomorrow") {
    d.setDate(d.getDate() + 1)
    d.setHours(9, 0, 0, 0)
  } else {
    d.setDate(d.getDate() + 7)
    d.setHours(9, 0, 0, 0)
  }
  return d
}

function snoozeLabel(option: "1h" | "tomorrow" | "next-week"): string {
  if (option === "1h") return "In 1 hour"
  if (option === "tomorrow") return "Tomorrow 9 AM"
  return "Next week"
}

/* ── Row component ────────────────────────────────────── */

function InboxRowFull({
  item,
  onOpenNote,
  onDismiss,
  onSnooze,
}: {
  item: InboxItem
  onOpenNote: (id: string) => void
  onDismiss: (kind: InboxItemKind, sourceId: string) => void
  onSnooze: (kind: InboxItemKind, sourceId: string, until: Date) => void
}) {
  const [snoozeOpen, setSnoozeOpen] = useState(false)
  const isOverdue =
    item.action?.toLowerCase().includes("overdue") ?? false

  function handleRowClick(e: React.MouseEvent) {
    // Don't open note when clicking action buttons
    const target = e.target as HTMLElement
    if (target.closest("[data-inbox-action]")) return
    if (item.kind === "wiki-redlink" || item.kind === "auto-enroll") {
      setActiveRoute("/wiki")
    } else if (item.kind === "plan-due") {
      setActiveRoute("/wiki")
    } else if (item.kind === "task") {
      // sourceId is task.id (composite noteId:position) — resolve noteId via store.
      const task = usePlotStore.getState().todoTasks.find((t) => t.id === item.sourceId)
      if (task) onOpenNote(task.noteId)
    } else {
      onOpenNote(item.sourceId)
    }
  }

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation()
    onDismiss(item.kind, item.sourceId)
    toast("Dismissed", {
      action: {
        label: "Undo",
        onClick: () => {
          usePlotStore.getState().undoDismissInbox(item.kind, item.sourceId)
        },
      },
    })
  }

  function handleSnooze(option: "1h" | "tomorrow" | "next-week") {
    const until = getSnoozeUntil(option)
    onSnooze(item.kind, item.sourceId, until)
    setSnoozeOpen(false)
    toast(`Snoozed until ${snoozeLabel(option)}`)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          if (item.kind === "wiki-redlink" || item.kind === "auto-enroll" || item.kind === "plan-due") {
            setActiveRoute("/wiki")
          } else if (item.kind === "task") {
            const task = usePlotStore.getState().todoTasks.find((t) => t.id === item.sourceId)
            if (task) onOpenNote(task.noteId)
          } else {
            onOpenNote(item.sourceId)
          }
        }
      }}
      className="group flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left transition-colors duration-100 hover:bg-hover-bg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {/* Source icon */}
      <InboxSourceIcon
        kind={item.kind}
        className="shrink-0 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground/70"
      />

      {/* Title */}
      <span className="min-w-0 flex-1 truncate text-note text-foreground">
        {item.title}
      </span>

      {/* Meta (snooze-expired secondary info) */}
      {item.meta && (
        <span className="shrink-0 text-2xs text-muted-foreground/50">
          {item.meta}
        </span>
      )}

      {/* Action hint — shown when no hover buttons visible */}
      {item.action && (
        <span
          className={`shrink-0 text-2xs tabular-nums transition-opacity group-hover:opacity-0 ${
            isOverdue
              ? "text-amber-500 dark:text-amber-400"
              : "text-muted-foreground"
          }`}
        >
          {item.action}
        </span>
      )}

      {/* Hover action buttons */}
      <div
        data-inbox-action="true"
        className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Snooze */}
        <Popover open={snoozeOpen} onOpenChange={setSnoozeOpen}>
          <PopoverTrigger asChild>
            <button
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-secondary hover:text-foreground"
              title="Snooze"
              aria-label="Snooze"
            >
              <Clock size={13} strokeWidth={2} />
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="end" className="w-44 p-1">
            {(["1h", "tomorrow", "next-week"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => handleSnooze(opt)}
                className="flex w-full items-center rounded px-2.5 py-1.5 text-note text-foreground transition-colors hover:bg-hover-bg"
              >
                {snoozeLabel(opt)}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-secondary hover:text-foreground"
          title="Dismiss"
          aria-label="Dismiss"
        >
          <PhX size={13} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

/* ── Section card ─────────────────────────────────────── */

// SECTION_META keys — resolved via t() inside SectionCard (module-level
// labelKey pattern, #122). Component-level useT() avoids React Hook rules
// violation in module-level static config.
const SECTION_META: Record<InboxSection, { titleKey: string; subtitleKey: string; emptyKey: string }> = {
  do: {
    titleKey: "inbox.section.do.title",
    subtitleKey: "inbox.section.do.subtitle",
    emptyKey: "inbox.section.do.empty",
  },
  review: {
    titleKey: "inbox.section.review.title",
    subtitleKey: "inbox.section.review.subtitle",
    emptyKey: "inbox.section.review.empty",
  },
  detected: {
    titleKey: "inbox.section.detected.title",
    subtitleKey: "inbox.section.detected.subtitle",
    emptyKey: "inbox.section.detected.empty",
  },
}

function SectionCard({
  section,
  items,
  onOpenNote,
  onDismiss,
  onSnooze,
}: {
  section: InboxSection
  items: InboxItem[]
  onOpenNote: (id: string) => void
  onDismiss: (kind: InboxItemKind, sourceId: string) => void
  onSnooze: (kind: InboxItemKind, sourceId: string, until: Date) => void
}) {
  const t = useT()
  const meta = SECTION_META[section]
  return (
    <section className="space-y-2">
      <header className="flex items-baseline gap-2 px-1">
        <h2 className="text-note font-medium text-foreground">{t(meta.titleKey)}</h2>
        <span className="text-2xs text-muted-foreground tabular-nums">
          {items.length}
        </span>
        <span className="ml-1 truncate text-2xs text-muted-foreground/60">
          {t(meta.subtitleKey)}
        </span>
      </header>
      {items.length === 0 ? (
        <div className="px-1 py-1 text-2xs text-muted-foreground/50">
          {t(meta.emptyKey)}
        </div>
      ) : (
        <div className="-mx-1">
          {items.map((item) => (
            <InboxRowFull
              key={`${item.kind}:${item.sourceId}`}
              item={item}
              onOpenNote={onOpenNote}
              onDismiss={onDismiss}
              onSnooze={onSnooze}
            />
          ))}
        </div>
      )}
    </section>
  )
}

/* ── "Next up" footer (kept from prior design) ────────── */

function useNextUp(): { ts: string; label: string; kind: "reminder" | "srs" | "snooze" } | null {
  const notes = usePlotStore((s) => s.notes)
  const hooks = usePlotStore((s) => s.hooks)
  const snoozedInboxItems = usePlotStore((s) => s.snoozedInboxItems)

  return (() => {
    const now = Date.now()
    const candidates: Array<{ ts: string; label: string; kind: "reminder" | "srs" | "snooze" }> = []
    const noteById = new Map(notes.map((n) => [n.id, n]))

    for (const h of hooks) {
      if (h.target.kind !== "note") continue
      const note = noteById.get(h.target.id)
      if (!note || note.trashed) continue
      if (h.policy === "snooze" && h.trigger.kind === "scheduled") {
        const dueMs = new Date(h.trigger.at).getTime()
        if (dueMs <= now) continue
        candidates.push({ ts: h.trigger.at, label: note.title || "Untitled", kind: "reminder" })
      } else if (h.policy === "srs") {
        const srs =
          h.trigger.kind === "srs"
            ? h.trigger.srsState
            : (h.state as { srsState?: { dueAt?: string } } | undefined)?.srsState
        if (!srs?.dueAt) continue
        const dueMs = new Date(srs.dueAt).getTime()
        if (dueMs <= now) continue
        candidates.push({ ts: srs.dueAt, label: note.title || "Untitled", kind: "srs" })
      }
    }

    for (const item of snoozedInboxItems) {
      if (new Date(item.snoozedUntil).getTime() <= now) continue
      candidates.push({ ts: item.snoozedUntil, label: "Snoozed item", kind: "snooze" })
    }

    if (candidates.length === 0) return null
    candidates.sort((a, b) => a.ts.localeCompare(b.ts))
    return candidates[0]
  })()
}

function relativeFuture(isoTs: string): string {
  const diffMs = new Date(isoTs).getTime() - Date.now()
  if (diffMs < 0) return "now"
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) return `in ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `in ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `in ${days}d`
  if (days < 30) return `in ${Math.floor(days / 7)}w`
  return new Date(isoTs).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function NextUpStrip() {
  const nextUp = useNextUp()
  if (!nextUp) return null
  return (
    <div className="mx-auto mt-6 flex max-w-xs items-center gap-2 rounded-md border border-border-subtle/40 bg-card/40 px-3 py-2 text-2xs text-muted-foreground">
      <Clock size={12} strokeWidth={2} className="shrink-0 opacity-70" />
      <span className="truncate">
        <span className="text-muted-foreground/70">Next up · </span>
        <span className="text-foreground/80 font-medium">{nextUp.label}</span>
        <span className="text-muted-foreground/70"> · {relativeFuture(nextUp.ts)}</span>
      </span>
    </div>
  )
}

/* ── Main InboxView ───────────────────────────────────── */

export function InboxView() {
  const router = useRouter()
  const t = useT()
  // Path-A-Step-5: local filter state (no IDB persistence — resets on reload, Linear pattern for inbox).
  const [filterRules, setFilterRules] = useState<FilterRule[]>([])

  const sections = useInboxBySection()
  const dismissInbox = usePlotStore((s) => s.dismissInbox)
  const snoozeInbox = usePlotStore((s) => s.snoozeInbox)
  const openNote = usePlotStore((s) => s.openNote)

  const totalCount = sections.do.length + sections.review.length + sections.detected.length

  const navigateToHome = () => {
    setActiveRoute("/home")
    router.push("/home")
  }

  const inboxBreadcrumb = (
    <nav className="flex items-center gap-1 min-w-0">
      <button
        onClick={navigateToHome}
        className="shrink-0 text-note font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
      >
        {t("home.title")}
      </button>
      <IconChevronRight size={16} className="shrink-0 text-muted-foreground/70" />
      <span className="text-note font-medium text-foreground">
        {t("sidebar.inbox")}
        {totalCount > 0 && (
          <span className="ml-0.5 text-note font-normal text-muted-foreground tabular-nums">
            {totalCount}
          </span>
        )}
      </span>
    </nav>
  )

  // Filter toggle handler — mirrors Files/References handleFilesFilterToggle pattern.
  const handleInboxFilterToggle = useCallback((rule: FilterRule) => {
    setFilterRules((prev) => {
      const exists = prev.some(
        f => f.field === rule.field && f.operator === rule.operator && f.value === rule.value
      )
      return exists
        ? prev.filter(f => !(f.field === rule.field && f.operator === rule.operator && f.value === rule.value))
        : [...prev, rule]
    })
  }, [])

  /* Apply source filter (only "source" field is currently meaningful for Inbox) */
  function applySourceFilter(items: InboxItem[]): InboxItem[] {
    if (filterRules.length === 0) return items
    const sourceRules = filterRules.filter(f => f.field === "source")
    if (sourceRules.length === 0) return items
    return items.filter((item) => sourceRules.some(r => r.value === item.kind))
  }

  const doItems = applySourceFilter(sections.do)
  const reviewItems = applySourceFilter(sections.review)
  const detectedItems = applySourceFilter(sections.detected)

  function handleOpenNote(noteId: string) {
    openNote(noteId)
    setActiveRoute("/notes")
  }

  // Q6 RESOLVED — "Do 비우기 = Inbox-zero". Review/Detected are 영원;
  // their cards always render, even when empty.
  const doEmpty = doItems.length === 0

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ViewHeader
        icon={<IconInbox size={20} strokeWidth={1.5} />}
        title={t("sidebar.inbox")}
        count={totalCount}
        titleNode={inboxBreadcrumb}
        showFilter={INBOX_VIEW_CONFIG.showFilter}
        hasActiveFilters={filterRules.length > 0}
        filterContent={
          <FilterPanel
            categories={INBOX_VIEW_CONFIG.filterCategories}
            activeFilters={filterRules}
            onToggle={handleInboxFilterToggle}
            quickFilters={INBOX_VIEW_CONFIG.quickFilters as any}
            onQuickFilter={(rules) => setFilterRules(rules)}
          />
        }
      />

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl space-y-4 px-6 py-6">
          {doEmpty && reviewItems.length === 0 && detectedItems.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 pt-24 pb-12 text-center">
              <IconInbox size={32} className="text-muted-foreground/25" strokeWidth={1} />
              <div>
                <p className="text-sm font-medium text-foreground">Inbox zero</p>
                <p className="mt-0.5 text-2xs text-muted-foreground">
                  All caught up — Review and Detected are always running.
                </p>
              </div>
              <NextUpStrip />
            </div>
          ) : (
            <>
              <SectionCard
                section="do"
                items={doItems}
                onOpenNote={handleOpenNote}
                onDismiss={dismissInbox}
                onSnooze={snoozeInbox}
              />
              <SectionCard
                section="review"
                items={reviewItems}
                onOpenNote={handleOpenNote}
                onDismiss={dismissInbox}
                onSnooze={snoozeInbox}
              />
              <SectionCard
                section="detected"
                items={detectedItems}
                onOpenNote={handleOpenNote}
                onDismiss={dismissInbox}
                onSnooze={snoozeInbox}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
