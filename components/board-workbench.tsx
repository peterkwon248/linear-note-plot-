"use client"

import { useMemo } from "react"
import {
  InboxIcon,
  Pencil,
  BookOpen,
  GraduationCap,
  Link2,
  Zap,
  Check,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  MousePointerClick,
  CheckCircle2,
  Undo2,
  Bell,
} from "lucide-react"
import { toast } from "sonner"
import { usePlotStore } from "@/lib/store"
import { StatusDropdown, PriorityDropdown, STATUS_CONFIG } from "@/components/note-fields"
import { RemindPicker } from "@/components/remind-picker"
import type { ViewContextKey, GroupBy } from "@/lib/view-engine/types"
import type { Note, NoteStatus, NotePriority, Folder } from "@/lib/types"

/* ── Props ────────────────────────────────────────────── */

interface BoardWorkbenchProps {
  selectedIds: Set<string>
  effectiveTab: ViewContextKey
  groupBy: GroupBy
  notes: Note[]
  folders: Folder[]
  backlinksMap: Map<string, number>
  onClearSelection: () => void
  onSelectAll: () => void
  onSelectMany?: (ids: string[]) => void
  onCardClick?: (noteId: string) => void
}

/* ── Workbench ────────────────────────────────────────── */

export function BoardWorkbench({
  selectedIds,
  effectiveTab,
  groupBy,
  notes,
  folders,
  backlinksMap,
  onClearSelection,
  onSelectAll,
  onSelectMany,
  onCardClick,
}: BoardWorkbenchProps) {
  const batchUpdateNotes = usePlotStore((s) => s.batchUpdateNotes)
  const batchSetReminder = usePlotStore((s) => s.batchSetReminder)
  const triageKeep = usePlotStore((s) => s.triageKeep)
  const triageTrash = usePlotStore((s) => s.triageTrash)
  const promoteToPermanent = usePlotStore((s) => s.promoteToPermanent)
  const undoPromote = usePlotStore((s) => s.undoPromote)
  const moveBackToInbox = usePlotStore((s) => s.moveBackToInbox)

  const selectedNotes = useMemo(
    () => notes.filter((n) => selectedIds.has(n.id)),
    [notes, selectedIds],
  )

  const commonStatus = useMemo<NoteStatus | null>(() => {
    if (selectedNotes.length === 0) return null
    const first = selectedNotes[0].status
    return selectedNotes.every((n) => n.status === first) ? first : null
  }, [selectedNotes])

  const commonPriority = useMemo<NotePriority | null>(() => {
    if (selectedNotes.length === 0) return null
    const first = selectedNotes[0].priority
    return selectedNotes.every((n) => n.priority === first) ? first : null
  }, [selectedNotes])

  /* ── Batch handlers ─────────────────────────────── */

  const handleKeepAll = () => {
    const ids = Array.from(selectedIds)
    ids.forEach((id) => triageKeep(id))
    onClearSelection()
    toast(`Moved ${ids.length} note${ids.length > 1 ? "s" : ""} to Capture`, {
      action: {
        label: "Undo",
        onClick: () => {
          ids.forEach((id) => moveBackToInbox(id))
          toast("Moved back to Inbox")
        },
      },
      duration: 5000,
    })
  }

  const handleTrashAll = () => {
    const ids = Array.from(selectedIds)
    ids.forEach((id) => triageTrash(id))
    onClearSelection()
    toast(`Trashed ${ids.length} note${ids.length > 1 ? "s" : ""}`, {
      action: {
        label: "Undo",
        onClick: () => {
          ids.forEach((id) => moveBackToInbox(id))
          toast("Restored to Inbox")
        },
      },
      duration: 5000,
    })
  }

  const handlePromoteAll = () => {
    const ids = Array.from(selectedIds)
    ids.forEach((id) => promoteToPermanent(id))
    onClearSelection()
    toast(`Promoted ${ids.length} note${ids.length > 1 ? "s" : ""} to Permanent`, {
      action: {
        label: "Undo",
        onClick: () => {
          ids.forEach((id) => undoPromote(id))
          toast("Demoted back to Capture")
        },
      },
      duration: 5000,
    })
  }

  const handleDemoteAll = () => {
    const ids = Array.from(selectedIds)
    ids.forEach((id) => undoPromote(id))
    onClearSelection()
    toast(`Demoted ${ids.length} note${ids.length > 1 ? "s" : ""} to Capture`)
  }

  const handleMoveBackAll = () => {
    const ids = Array.from(selectedIds)
    ids.forEach((id) => moveBackToInbox(id))
    onClearSelection()
    toast(`Moved ${ids.length} note${ids.length > 1 ? "s" : ""} back to Inbox`)
  }

  /* ── Selection panel ────────────────────────────── */

  if (selectedIds.size > 0) {
    return (
      <div
        className="flex min-w-[280px] flex-1 shrink-0 flex-col rounded-lg bg-secondary/20 p-4 overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-ui font-semibold text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" />
              {selectedIds.size} note{selectedIds.size > 1 ? "s" : ""} selected
            </h3>
            <button
              onClick={onClearSelection}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Deselect
            </button>
          </div>
        </div>

        {/* Batch Actions */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground">
            Batch Actions
          </h4>

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <StatusDropdown
              value={commonStatus ?? "inbox"}
              onChange={(s) => batchUpdateNotes(Array.from(selectedIds), { status: s })}
              variant="inline"
            />
          </div>

          {/* Priority */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Priority</span>
            <PriorityDropdown
              value={commonPriority ?? "none"}
              onChange={(p) => batchUpdateNotes(Array.from(selectedIds), { priority: p })}
              variant="inline"
            />
          </div>
        </div>

        {/* Workflow Actions */}
        <WorkflowActions
          effectiveTab={effectiveTab}
          onKeepAll={handleKeepAll}
          onTrashAll={handleTrashAll}
          onPromoteAll={handlePromoteAll}
          onDemoteAll={handleDemoteAll}
          onMoveBackAll={handleMoveBackAll}
        />

        {/* Remind */}
        <div className="mt-4 space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground">
            Remind
          </h4>
          <div className="space-y-1">
            <RemindPicker
              onSelect={(date) => {
                batchSetReminder(Array.from(selectedIds), date)
                onClearSelection()
                toast(`Reminder set for ${selectedIds.size} note${selectedIds.size > 1 ? "s" : ""}`)
              }}
              triggerContent={
                <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
                  <Bell className="h-4 w-4 text-accent" />
                  Remind
                </button>
              }
            />
          </div>
        </div>
      </div>
    )
  }

  /* ── Overview panel (no selection) ──────────────── */

  return (
    <div
      className="flex min-w-[280px] flex-1 shrink-0 flex-col rounded-lg bg-secondary/20 p-4 overflow-y-auto"
      style={{ maxHeight: "calc(100vh - 200px)" }}
    >
      <OverviewContent
        effectiveTab={effectiveTab}
        notes={notes}
        folders={folders}
        backlinksMap={backlinksMap}
        onSelectAll={onSelectAll}
        onSelectMany={onSelectMany}
        onCardClick={onCardClick}
      />
    </div>
  )
}

/* ── Workflow Actions (conditional on tab) ────────────── */

function WorkflowActions({
  effectiveTab,
  onKeepAll,
  onTrashAll,
  onPromoteAll,
  onDemoteAll,
  onMoveBackAll,
}: {
  effectiveTab: ViewContextKey
  onKeepAll: () => void
  onTrashAll: () => void
  onPromoteAll: () => void
  onDemoteAll: () => void
  onMoveBackAll: () => void
}) {
  const actions: { icon: React.ReactNode; label: string; onClick: () => void }[] = []

  if (effectiveTab === "inbox") {
    actions.push(
      { icon: <Check className="h-4 w-4 text-accent" />, label: "Done All", onClick: onKeepAll },
      { icon: <Trash2 className="h-4 w-4 text-accent" />, label: "Trash All", onClick: onTrashAll },
    )
  }

  if (effectiveTab === "capture") {
    actions.push(
      { icon: <ArrowUpRight className="h-4 w-4 text-accent" />, label: "Promote All", onClick: onPromoteAll },
      { icon: <ArrowDownLeft className="h-4 w-4 text-accent" />, label: "Back to Inbox", onClick: onMoveBackAll },
    )
  }

  if (effectiveTab === "permanent") {
    actions.push(
      { icon: <ArrowDownLeft className="h-4 w-4 text-accent" />, label: "Demote All", onClick: onDemoteAll },
    )
  }

  if (actions.length === 0) return null

  return (
    <div className="mt-4 space-y-3">
      <h4 className="text-xs font-medium text-muted-foreground">
        Workflow
      </h4>
      <div className="space-y-1">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Overview Content (per-tab) ───────────────────────── */

function OverviewContent({
  effectiveTab,
  notes,
  folders: _folders,
  backlinksMap,
  onSelectAll,
  onSelectMany,
  onCardClick,
}: {
  effectiveTab: ViewContextKey
  notes: Note[]
  folders: Folder[]
  backlinksMap: Map<string, number>
  onSelectAll: () => void
  onSelectMany?: (ids: string[]) => void
  onCardClick?: (noteId: string) => void
}) {
  switch (effectiveTab) {
    case "inbox":
      return (
        <InboxOverview
          notes={notes}
          onSelectAll={onSelectAll}
          onSelectMany={onSelectMany}
        />
      )
    case "capture":
      return (
        <CaptureOverview
          notes={notes}
          backlinksMap={backlinksMap}
          onSelectAll={onSelectAll}
          onCardClick={onCardClick}
        />
      )
    case "permanent":
      return (
        <KnowledgeOverview
          effectiveTab={effectiveTab}
          notes={notes}
          backlinksMap={backlinksMap}
          onSelectAll={onSelectAll}
          onCardClick={onCardClick}
        />
      )
    default:
      return (
        <DefaultOverview
          effectiveTab={effectiveTab}
          notes={notes}
          onSelectAll={onSelectAll}
        />
      )
  }
}

/* ── Inbox Overview ───────────────────────────────────── */

function InboxOverview({
  notes,
  onSelectAll,
  onSelectMany,
}: {
  notes: Note[]
  onSelectAll: () => void
  onSelectMany?: (ids: string[]) => void
}) {
  const untriagedNotes = useMemo(
    () => notes.filter((n) => n.triageStatus === "untriaged" || !n.triageStatus),
    [notes],
  )

  const processedCount = notes.length - untriagedNotes.length
  const processedPercent = notes.length > 0 ? Math.round((processedCount / notes.length) * 100) : 0

  const selectUntriaged = () => {
    onSelectMany?.(untriagedNotes.map((n) => n.id))
  }

  return (
    <div>
      <h3 className="text-ui font-semibold text-foreground flex items-center gap-2 mb-4">
        <InboxIcon className="h-4 w-4 text-chart-2" />
        Inbox Overview
      </h3>

      <div className="space-y-4">
        {/* Stats */}
        <div className="rounded-md bg-background border border-border p-3">
          <div className="text-xl font-bold text-foreground">{notes.length}</div>
          <div className="text-xs text-muted-foreground">notes to process</div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${processedPercent}%` }}
            />
          </div>
          <div className="mt-1 text-2xs text-muted-foreground">
            {processedCount} of {notes.length} processed
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            Quick Actions
          </h4>
          <div className="space-y-1">
            <button
              onClick={onSelectAll}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <MousePointerClick className="h-4 w-4" />
              Select All
            </button>
            {untriagedNotes.length > 0 && (
              <button
                onClick={selectUntriaged}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <CheckCircle2 className="h-4 w-4" />
                Select Untriaged ({untriagedNotes.length})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Capture Overview ─────────────────────────────────── */

function CaptureOverview({
  notes,
  backlinksMap,
  onSelectAll,
  onCardClick,
}: {
  notes: Note[]
  backlinksMap: Map<string, number>
  onSelectAll: () => void
  onCardClick?: (noteId: string) => void
}) {
  const readyNotes = useMemo(
    () =>
      notes
        .filter((n) => (backlinksMap.get(n.id) ?? 0) >= 3)
        .sort((a, b) => (backlinksMap.get(b.id) ?? 0) - (backlinksMap.get(a.id) ?? 0)),
    [notes, backlinksMap],
  )

  return (
    <div>
      <h3 className="text-ui font-semibold text-foreground flex items-center gap-2 mb-4">
        <Pencil className="h-4 w-4 text-chart-3" />
        Capture Overview
      </h3>

      <div className="space-y-4">
        <div className="rounded-md bg-background border border-border p-3">
          <div className="text-xl font-bold text-foreground">{notes.length}</div>
          <div className="text-xs text-muted-foreground">notes in capture</div>
        </div>

        {/* Ready to Promote */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            Ready to Promote
          </h4>
          <div className="space-y-1">
            {readyNotes.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 py-2">No notes with 3+ links yet</p>
            ) : (
              readyNotes.slice(0, 5).map((note) => (
                <button
                  key={note.id}
                  onClick={() => onCardClick?.(note.id)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-secondary"
                >
                  <Link2 className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span className="truncate text-foreground">{note.title || "Untitled"}</span>
                  <span className="ml-auto text-2xs text-muted-foreground shrink-0">
                    {backlinksMap.get(note.id) ?? 0} links
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            Quick Actions
          </h4>
          <div className="space-y-1">
            <button
              onClick={onSelectAll}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <MousePointerClick className="h-4 w-4" />
              Select All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Knowledge Overview (reference / permanent) ──────── */

function KnowledgeOverview({
  effectiveTab,
  notes,
  backlinksMap,
  onSelectAll,
  onCardClick,
}: {
  effectiveTab: "permanent"
  notes: Note[]
  backlinksMap: Map<string, number>
  onSelectAll: () => void
  onCardClick?: (noteId: string) => void
}) {
  const avgLinks = useMemo(() => {
    if (notes.length === 0) return 0
    const total = notes.reduce((sum, n) => sum + (backlinksMap.get(n.id) ?? 0), 0)
    return Math.round((total / notes.length) * 10) / 10
  }, [notes, backlinksMap])

  const leastConnected = useMemo(
    () =>
      [...notes]
        .sort((a, b) => (backlinksMap.get(a.id) ?? 0) - (backlinksMap.get(b.id) ?? 0))
        .slice(0, 5),
    [notes, backlinksMap],
  )

  return (
    <div>
      <h3 className="text-ui font-semibold text-foreground flex items-center gap-2 mb-4">
        <GraduationCap className="h-4 w-4 text-chart-5" />
        Permanent Overview
      </h3>

      <div className="space-y-4">
        <div className="rounded-md bg-background border border-border p-3">
          <div className="text-xl font-bold text-foreground">{notes.length}</div>
          <div className="text-xs text-muted-foreground">
            notes &middot; avg {avgLinks} links
          </div>
        </div>

        {/* Least Connected */}
        {leastConnected.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">
              Least Connected
            </h4>
            <div className="space-y-1">
              {leastConnected.map((note) => (
                <button
                  key={note.id}
                  onClick={() => onCardClick?.(note.id)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-secondary"
                >
                  <AlertCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate text-foreground">{note.title || "Untitled"}</span>
                  <span className="ml-auto text-2xs text-muted-foreground shrink-0">
                    {backlinksMap.get(note.id) ?? 0} links
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            Quick Actions
          </h4>
          <div className="space-y-1">
            <button
              onClick={onSelectAll}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <MousePointerClick className="h-4 w-4" />
              Select All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Default Overview (all / unlinked / etc.) ─────────── */

function DefaultOverview({
  effectiveTab,
  notes,
  onSelectAll,
}: {
  effectiveTab: ViewContextKey
  notes: Note[]
  onSelectAll: () => void
}) {
  const tabLabel = effectiveTab.charAt(0).toUpperCase() + effectiveTab.slice(1)

  return (
    <div>
      <h3 className="text-ui font-semibold text-foreground flex items-center gap-2 mb-4">
        {tabLabel} Overview
      </h3>

      <div className="space-y-4">
        <div className="rounded-md bg-background border border-border p-3">
          <div className="text-xl font-bold text-foreground">{notes.length}</div>
          <div className="text-xs text-muted-foreground">total notes</div>
        </div>

        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            Quick Actions
          </h4>
          <div className="space-y-1">
            <button
              onClick={onSelectAll}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <MousePointerClick className="h-4 w-4" />
              Select All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
