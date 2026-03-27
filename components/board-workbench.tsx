"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { usePlotStore } from "@/lib/store"
import { StatusDropdown, STATUS_CONFIG } from "@/components/note-fields"
import { RemindPicker } from "@/components/remind-picker"
import type { ViewContextKey, GroupBy } from "@/lib/view-engine/types"
import type { Note, NoteStatus, Folder } from "@/lib/types"
import { Tray } from "@phosphor-icons/react/dist/ssr/Tray"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { GraduationCap } from "@phosphor-icons/react/dist/ssr/GraduationCap"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight"
import { ArrowDownLeft } from "@phosphor-icons/react/dist/ssr/ArrowDownLeft"
import { WarningCircle } from "@phosphor-icons/react/dist/ssr/WarningCircle"
import { CursorClick } from "@phosphor-icons/react/dist/ssr/CursorClick"
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle"
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise"
import { Bell } from "@phosphor-icons/react/dist/ssr/Bell"
import { GitMerge } from "@phosphor-icons/react/dist/ssr/GitMerge"
import { MergeDialog } from "@/components/merge-dialog"
import { NotePickerDialog } from "@/components/note-picker-dialog"
import { WikiAssemblyDialog } from "@/components/wiki-assembly-dialog"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

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
  const addWikiLink = usePlotStore((s) => s.addWikiLink)
  const setMergePickerOpen = usePlotStore((s) => s.setMergePickerOpen)

  const [mergeOpen, setMergeOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [wikiAssemblyOpen, setWikiAssemblyOpen] = useState(false)
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

  const statusGroups = useMemo(() => {
    const map = new Map<NoteStatus, Note[]>()
    for (const note of selectedNotes) {
      const arr = map.get(note.status) ?? []
      arr.push(note)
      map.set(note.status, arr)
    }
    return map
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
      <>
      <div
        data-board-workbench
        className="flex min-w-[280px] flex-1 shrink-0 flex-col rounded-lg bg-secondary/20 p-4 overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-ui font-semibold text-foreground flex items-center gap-2">
              <Lightning className="text-accent" size={16} weight="regular" />
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

          {/* Status Badges */}
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Status</span>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(statusGroups.entries()).map(([status, groupNotes]) => {
                const cfg = STATUS_CONFIG[status]
                return (
                  <Popover key={status}>
                    <PopoverTrigger asChild>
                      <button
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:opacity-80"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.icon}
                        {cfg.label}
                        <span className="ml-0.5 opacity-70">{groupNotes.length}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-56 p-1" sideOffset={4}>
                      <div className="max-h-48 overflow-y-auto">
                        {groupNotes.map((note) => (
                          <button
                            key={note.id}
                            onClick={() => onCardClick?.(note.id)}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-secondary"
                          >
                            <span className="truncate text-foreground">{note.title || "Untitled"}</span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )
              })}
            </div>
            {statusGroups.size > 1 && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-muted-foreground/60">Change all →</span>
                <StatusDropdown
                  value={commonStatus ?? "inbox"}
                  onChange={(s) => batchUpdateNotes(Array.from(selectedIds), { status: s })}
                  variant="inline"
                />
              </div>
            )}
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

        {/* Mixed-status workflow for All/Unlinked tabs */}
        {effectiveTab !== "inbox" && effectiveTab !== "capture" && effectiveTab !== "permanent" && effectiveTab !== "trash" && (() => {
          const inboxNotes = selectedNotes.filter(n => n.status === 'inbox')
          const captureNotes = selectedNotes.filter(n => n.status === 'capture')
          const permanentNotes = selectedNotes.filter(n => n.status === 'permanent')
          if (inboxNotes.length === 0 && captureNotes.length === 0 && permanentNotes.length === 0) return null
          return (
            <div className="mt-4 space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground">Workflow</h4>
              <div className="space-y-1">
                {inboxNotes.length > 0 && (
                  <button
                    onClick={() => {
                      inboxNotes.forEach(n => triageKeep(n.id))
                      onClearSelection()
                      toast(`Moved ${inboxNotes.length} note${inboxNotes.length > 1 ? "s" : ""} to Capture`)
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    <PhCheck className="text-accent" size={16} weight="bold" /> Done {inboxNotes.length}
                  </button>
                )}
                {captureNotes.length > 0 && (
                  <button
                    onClick={() => {
                      captureNotes.forEach(n => promoteToPermanent(n.id))
                      onClearSelection()
                      toast(`Promoted ${captureNotes.length} note${captureNotes.length > 1 ? "s" : ""} to Permanent`)
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    <ArrowUpRight className="text-accent" size={16} weight="regular" /> Promote {captureNotes.length}
                  </button>
                )}
                {permanentNotes.length > 0 && (
                  <button
                    onClick={() => {
                      permanentNotes.forEach(n => undoPromote(n.id))
                      onClearSelection()
                      toast(`Demoted ${permanentNotes.length} note${permanentNotes.length > 1 ? "s" : ""} to Capture`)
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    <ArrowDownLeft className="text-accent" size={16} weight="regular" /> Demote {permanentNotes.length}
                  </button>
                )}
              </div>
            </div>
          )
        })()}

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
                  <Bell className="text-accent" size={16} weight="regular" />
                  Remind
                </button>
              }
            />
          </div>
        </div>

        {/* Tools */}
        <div className="mt-4 space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground">
            Tools
          </h4>
          <div className="space-y-1">
            <button
              onClick={handleTrashAll}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash className="text-destructive" size={16} weight="regular" /> Trash
            </button>
            <button
              onClick={() => {
                const ids = Array.from(selectedIds)
                if (ids.length === 1) {
                  setMergePickerOpen(true, ids[0])
                } else {
                  setMergeOpen(true)
                }
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <GitMerge className="text-muted-foreground" size={16} weight="regular" /> Merge
            </button>
            <button
              onClick={() => setWikiAssemblyOpen(true)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <BookOpen className="text-muted-foreground" size={16} weight="regular" /> Wiki
            </button>
            <button
              onClick={() => setLinkOpen(true)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <PhLink className="text-muted-foreground" size={16} weight="regular" /> Link
            </button>
          </div>
        </div>
      </div>

      {/* Merge Dialog */}
      {mergeOpen && (
        <MergeDialog
          open={mergeOpen}
          onOpenChange={setMergeOpen}
          noteIds={Array.from(selectedIds)}
          onComplete={() => {
            setMergeOpen(false)
            onClearSelection()
          }}
        />
      )}

      {/* Link Dialog */}
      <NotePickerDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        title="Link to..."
        onSelect={(targetId: string) => {
          const target = notes.find((n) => n.id === targetId)
          const targetTitle = target?.title ?? "Untitled"
          const ids = Array.from(selectedIds)
          ids.forEach((id) => addWikiLink(id, targetTitle))
          setLinkOpen(false)
          onClearSelection()
          toast(
            ids.length === 1
              ? `Linked to "${targetTitle}"`
              : `Linked ${ids.length} notes to "${targetTitle}"`,
          )
        }}
      />

      {/* Wiki Assembly Dialog */}
      {wikiAssemblyOpen && (
        <WikiAssemblyDialog
          open={wikiAssemblyOpen}
          onOpenChange={setWikiAssemblyOpen}
          noteIds={Array.from(selectedIds)}
          onComplete={() => {
            setWikiAssemblyOpen(false)
            onClearSelection()
          }}
        />
      )}
      </>
    )
  }

  /* ── Overview panel (no selection) ──────────────── */

  return (
    <div
      data-board-workbench
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
  onTrashAll: _onTrashAll,
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
      { icon: <PhCheck className="text-accent" size={16} weight="bold" />, label: "Done All", onClick: onKeepAll },
    )
  }

  if (effectiveTab === "capture") {
    actions.push(
      { icon: <ArrowUpRight className="text-accent" size={16} weight="regular" />, label: "Promote All", onClick: onPromoteAll },
      { icon: <ArrowDownLeft className="text-accent" size={16} weight="regular" />, label: "Back to Inbox", onClick: onMoveBackAll },
    )
  }

  if (effectiveTab === "permanent") {
    actions.push(
      { icon: <ArrowDownLeft className="text-accent" size={16} weight="regular" />, label: "Demote All", onClick: onDemoteAll },
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
        <Tray className="text-chart-2" size={16} weight="regular" />
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
              <CursorClick size={16} weight="regular" />
              Select All
            </button>
            {untriagedNotes.length > 0 && (
              <button
                onClick={selectUntriaged}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <CheckCircle size={16} weight="regular" />
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
        <PencilSimple className="text-chart-3" size={16} weight="regular" />
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
                  <PhLink className="text-accent shrink-0" size={14} weight="regular" />
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
              <CursorClick size={16} weight="regular" />
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
        <GraduationCap className="text-chart-5" size={16} weight="regular" />
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
                  <WarningCircle className="text-muted-foreground shrink-0" size={14} weight="regular" />
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
              <CursorClick size={16} weight="regular" />
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
              <CursorClick size={16} weight="regular" />
              Select All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
