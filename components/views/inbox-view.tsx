"use client"

import { useState } from "react"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { useInbox, type InboxItem } from "@/lib/hooks/use-inbox"
import type { InboxItemKind } from "@/lib/store/slices/inbox"
import { ViewHeader } from "@/components/view-header"
import { IconInbox } from "@/components/plot-icons"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import { InboxSourceIcon } from "@/components/inbox/inbox-source-icon"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Clock } from "@phosphor-icons/react/dist/ssr/Clock"

/* ── Filter tab types ─────────────────────────────────── */

type FilterTab = "all" | "reminders" | "srs" | "snoozed"

const TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "reminders", label: "Reminders" },
  { id: "srs", label: "SRS" },
  { id: "snoozed", label: "Snoozed" },
]

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
          if (item.kind === "wiki-redlink" || item.kind === "auto-enroll") {
            setActiveRoute("/wiki")
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
              <Clock size={13} weight="regular" />
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
          <PhX size={13} weight="regular" />
        </button>
      </div>
    </div>
  )
}

/* ── Empty states ─────────────────────────────────────── */

function EmptyAll() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <IconInbox size={32} className="text-muted-foreground/25" strokeWidth={1} />
      <div>
        <p className="text-sm font-medium text-foreground">Inbox zero</p>
        <p className="mt-0.5 text-2xs text-muted-foreground">All caught up. Nothing needs attention.</p>
      </div>
    </div>
  )
}

function EmptyFilter({ tab }: { tab: FilterTab }) {
  const labels: Record<Exclude<FilterTab, "all">, string> = {
    reminders: "No reminders due",
    srs:       "No reviews due",
    snoozed:   "No snoozed items",
  }
  const label = tab !== "all" ? labels[tab] : ""
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-2xs text-muted-foreground">{label}</p>
    </div>
  )
}

/* ── Main InboxView ───────────────────────────────────── */

export function InboxView() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all")

  const allItems = useInbox()
  const dismissInbox = usePlotStore((s) => s.dismissInbox)
  const snoozeInbox = usePlotStore((s) => s.snoozeInbox)
  const openNote = usePlotStore((s) => s.openNote)

  /* Tab-filtered items */
  const filtered = allItems.filter((item) => {
    if (activeTab === "all") return true
    if (activeTab === "reminders") return item.kind === "reminder"
    if (activeTab === "srs") return item.kind === "srs"
    if (activeTab === "snoozed") return item.kind === "snooze-expired"
    return true
  })

  /* Per-tab counts for badges */
  const counts: Record<FilterTab, number> = {
    all:       allItems.length,
    reminders: allItems.filter((i) => i.kind === "reminder").length,
    srs:       allItems.filter((i) => i.kind === "srs").length,
    snoozed:   allItems.filter((i) => i.kind === "snooze-expired").length,
  }

  function handleOpenNote(noteId: string) {
    openNote(noteId)
    setActiveRoute("/notes")
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* View Header — matches stickers/labels pattern */}
      <ViewHeader
        icon={<IconInbox size={20} strokeWidth={1.5} />}
        title="Inbox"
        count={allItems.length}
      />

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-6 py-6">

          {/* Filter tabs */}
          <div className="mb-4 flex items-center gap-1">
            {TABS.map((tab) => {
              const active = activeTab === tab.id
              const count = counts[tab.id]
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-2xs font-medium transition-colors duration-100 ${
                    active
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted-foreground hover:bg-hover-bg hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={`tabular-nums ${
                        active ? "text-foreground/70" : "text-muted-foreground/60"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Item list */}
          {allItems.length === 0 ? (
            <EmptyAll />
          ) : filtered.length === 0 ? (
            <EmptyFilter tab={activeTab} />
          ) : (
            <div className="rounded-lg border border-border bg-card">
              <div className="px-1.5 py-1">
                {filtered.map((item) => (
                  <InboxRowFull
                    key={`${item.kind}:${item.sourceId}`}
                    item={item}
                    onOpenNote={handleOpenNote}
                    onDismiss={dismissInbox}
                    onSnooze={snoozeInbox}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
