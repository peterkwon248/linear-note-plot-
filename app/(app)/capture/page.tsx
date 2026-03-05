"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import {
  getCaptureNotes,
  computeReadyScore,
  isReadyToPromote,
  needsReview,
  isStaleSuggest,
} from "@/lib/queries/notes"
import { NoteEditor } from "@/components/note-editor"
import { NoteInspector } from "@/components/note-inspector"
import { NoteDetailPanel } from "@/components/note-detail-panel"
import { StatusBadge, PriorityBadge } from "@/components/note-fields"
import { buildBacklinksMap } from "@/lib/backlinks"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  FileText,
  ArrowUp,
  AlertTriangle,
  Inbox as InboxIcon,
  Sparkles,
  Link2,
} from "lucide-react"
import { format, formatDistanceToNowStrict } from "date-fns"
import type { Note } from "@/lib/types"

function shortRelative(dateStr: string): string {
  const dist = formatDistanceToNowStrict(new Date(dateStr), { addSuffix: false })
  return dist
    .replace(/ seconds?/, "s")
    .replace(/ minutes?/, "m")
    .replace(/ hours?/, "h")
    .replace(/ days?/, "d")
    .replace(/ weeks?/, "w")
    .replace(/ months?/, "mo")
    .replace(/ years?/, "y")
}

/* ── CapturePage ───────────────────────────────────────── */

export default function CapturePage() {
  const notes = usePlotStore((s) => s.notes)
  const openNote = usePlotStore((s) => s.openNote)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const promoteToPermament = usePlotStore((s) => s.promoteToPermament)
  const moveBackToInbox = usePlotStore((s) => s.moveBackToInbox)

  const [previewId, setPreviewId] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!previewId) return
      const target = e.target as HTMLElement
      if (target.closest("input") || target.closest("textarea") || target.closest("[role='dialog']") || target.closest("[data-radix-popper-content-wrapper]")) return

      const note = notes.find((n) => n.id === previewId)
      if (!note || note.status !== "capture") return

      switch (e.key.toLowerCase()) {
        case "p":
          e.preventDefault()
          promoteToPermament(previewId)
          break
        case "b":
          e.preventDefault()
          moveBackToInbox(previewId)
          break
        case "escape":
          if (!target.closest("[data-radix-popper-content-wrapper]")) {
            setPreviewId(null)
          }
          break
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [previewId, notes, promoteToPermament, moveBackToInbox])

  const captureNotes = useMemo(() => getCaptureNotes(notes), [notes])
  const backlinksMap = useMemo(() => buildBacklinksMap(notes), [notes])

  // Full editor mode
  if (selectedNoteId) {
    return (
      <div className="flex flex-1 overflow-hidden animate-in fade-in duration-200">
        <NoteEditor />
        <NoteInspector />
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
        {/* Title */}
        <header className="flex shrink-0 items-center justify-between px-5 pt-5 pb-1">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-foreground">Capture</h1>
            <span className="rounded-full bg-chart-2/10 px-2 py-0.5 text-[11px] font-medium tabular-nums text-chart-2">
              {captureNotes.length}
            </span>
          </div>
        </header>

        <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-2">
          <span className="text-[11px] text-muted-foreground">
            Notes kept from Inbox. Enrich them to promote to Permanent.
          </span>
        </div>

        {/* Content */}
        {captureNotes.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground/20" />
            <p className="text-[13px] text-muted-foreground">No capture notes</p>
            <p className="mt-1 text-[12px] text-muted-foreground/60">
              Keep notes from Inbox to move them here.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Column headers */}
            <div className="sticky top-0 z-10 flex items-center border-b border-border bg-background px-5 py-2">
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-medium text-muted-foreground">Name</span>
              </div>
              <div className="w-[56px] shrink-0 text-center">
                <span className="text-[11px] font-medium text-muted-foreground">Links</span>
              </div>
              <div className="w-[56px] shrink-0 text-center">
                <span className="text-[11px] font-medium text-muted-foreground">Score</span>
              </div>
              <div className="w-[80px] shrink-0 text-right">
                <span className="text-[11px] font-medium text-muted-foreground">Updated</span>
              </div>
              <div className="w-[100px] shrink-0 text-right">
                <span className="text-[11px] font-medium text-muted-foreground">Status</span>
              </div>
            </div>

            {captureNotes.map((note) => {
              const readyScore = computeReadyScore(note, notes)
              const ready = isReadyToPromote(note, notes)
              const stale = needsReview(note)
              const staleSuggest = isStaleSuggest(note)
              const links = backlinksMap.get(note.id) ?? 0

              return (
                <div key={note.id}>
                  <div
                    className={`group flex items-center border-b border-border px-5 py-2 transition-colors cursor-pointer ${
                      previewId === note.id
                        ? "bg-accent/8 border-l-2 border-l-accent"
                        : "hover:bg-secondary/30"
                    }`}
                    onClick={() => setPreviewId(note.id)}
                    onDoubleClick={() => openNote(note.id)}
                  >
                    {/* Name */}
                    <div className="flex flex-1 items-center gap-2.5 min-w-0 pr-3">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                      <span className="truncate text-[13px] text-foreground">
                        {note.title || "Untitled"}
                      </span>
                      {ready && (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-chart-5/10 px-1.5 py-0.5 text-[10px] font-medium text-chart-5">
                          <Sparkles className="h-2.5 w-2.5" />
                          Ready
                        </span>
                      )}
                      {stale && !staleSuggest && (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-chart-3/10 px-1.5 py-0.5 text-[10px] font-medium text-chart-3">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Review needed
                        </span>
                      )}
                    </div>

                    {/* Links */}
                    <div className="w-[56px] shrink-0 text-center">
                      <span className={`text-[12px] tabular-nums ${links === 0 ? "text-muted-foreground/30" : "text-muted-foreground"}`}>
                        {links}
                      </span>
                    </div>

                    {/* Ready score */}
                    <div className="w-[56px] shrink-0 text-center">
                      <span className={`text-[12px] tabular-nums font-medium ${
                        readyScore >= 5 ? "text-chart-5" : readyScore >= 3 ? "text-chart-3" : "text-muted-foreground/50"
                      }`}>
                        {readyScore}/9
                      </span>
                    </div>

                    {/* Updated */}
                    <div className="w-[80px] shrink-0 text-right">
                      <span className="text-[12px] tabular-nums text-muted-foreground">
                        {shortRelative(note.updatedAt)}
                      </span>
                    </div>

                    {/* Status badges */}
                    <div className="w-[100px] shrink-0 flex justify-end gap-1">
                      {ready && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            promoteToPermament(note.id)
                          }}
                          className="flex items-center gap-1 rounded-md bg-chart-5/10 px-2 py-0.5 text-[10px] font-medium text-chart-5 transition-colors hover:bg-chart-5/20"
                        >
                          <ArrowUp className="h-2.5 w-2.5" />
                          Promote
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stale suggestion banner */}
                  {staleSuggest && (
                    <div className="flex items-center justify-between border-b border-border bg-chart-3/5 px-5 py-1.5">
                      <span className="flex items-center gap-1.5 text-[11px] text-chart-3">
                        <AlertTriangle className="h-3 w-3" />
                        Untouched for 14+ days. Move back to Inbox?
                      </span>
                      <button
                        onClick={() => moveBackToInbox(note.id)}
                        className="flex items-center gap-1 rounded-md bg-chart-3/10 px-2 py-0.5 text-[11px] font-medium text-chart-3 transition-colors hover:bg-chart-3/20"
                      >
                        <InboxIcon className="h-3 w-3" />
                        Move to Inbox
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Detail panel */}
      {previewId && (
        <CaptureDetailPanel
          noteId={previewId}
          onClose={() => setPreviewId(null)}
          onOpenNote={(id) => setPreviewId(id)}
          onEditNote={() => {
            openNote(previewId)
            setPreviewId(null)
          }}
        />
      )}
    </div>
  )
}

/* ── Capture Detail Panel with Promote ─────────────────── */

function CaptureDetailPanel({
  noteId,
  onClose,
  onOpenNote,
  onEditNote,
}: {
  noteId: string
  onClose: () => void
  onOpenNote: (id: string) => void
  onEditNote: () => void
}) {
  const notes = usePlotStore((s) => s.notes)
  const promoteToPermament = usePlotStore((s) => s.promoteToPermament)
  const note = notes.find((n) => n.id === noteId)

  if (!note) return null

  const ready = isReadyToPromote(note, notes)
  const readyScore = computeReadyScore(note, notes)

  return (
    <aside className="flex h-full w-[420px] shrink-0 flex-col overflow-hidden border-l border-border bg-card animate-in slide-in-from-right-4 fade-in duration-200">
      <NoteDetailPanel
        noteId={noteId}
        onClose={onClose}
        onOpenNote={onOpenNote}
        onEditNote={onEditNote}
        embedded
      />

      {/* Promote bar */}
      {note.status === "capture" && (
        <div className="shrink-0 border-t border-border bg-secondary/30 px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Ready score: <span className={`font-medium ${readyScore >= 5 ? "text-chart-5" : "text-muted-foreground"}`}>{readyScore}/9</span>
            </span>
            {ready && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-chart-5">
                <Sparkles className="h-3 w-3" />
                Ready to promote
              </span>
            )}
          </div>
          <button
            onClick={() => promoteToPermament(noteId)}
            className={`flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-medium transition-colors ${
              ready
                ? "bg-chart-5/10 text-chart-5 hover:bg-chart-5/20"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
            }`}
          >
            <ArrowUp className="h-3.5 w-3.5" />
            Promote to Permanent
          </button>
        </div>
      )}
    </aside>
  )
}
