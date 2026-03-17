"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import { getPermanentNotes } from "@/lib/queries/notes"
import { NoteEditor } from "@/components/note-editor"
import { NoteInspector } from "@/components/note-inspector"
import { NoteDetailPanel } from "@/components/note-detail-panel"
import { StatusBadge, PriorityBadge } from "@/components/note-fields"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  FileText,
  Shield,
  Link2,
} from "lucide-react"
import { format } from "date-fns"
import type { Note } from "@/lib/types"
import { shortRelative } from "@/lib/format-utils"

/* ── PermanentPage ─────────────────────────────────────── */

export default function PermanentPage() {
  const notes = usePlotStore((s) => s.notes)
  const openNote = usePlotStore((s) => s.openNote)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const undoPromote = usePlotStore((s) => s.undoPromote)

  const [previewId, setPreviewId] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!previewId) return
      const target = e.target as HTMLElement
      if (target.closest("input") || target.closest("textarea") || target.closest("[role='dialog']") || target.closest("[data-radix-popper-content-wrapper]")) return

      const note = notes.find((n) => n.id === previewId)
      if (!note || note.status !== "permanent") return

      switch (e.key.toLowerCase()) {
        case "d":
          e.preventDefault()
          undoPromote(previewId)
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
  }, [previewId, notes, undoPromote])

  const permanentNotes = useMemo(() => getPermanentNotes(notes), [notes])
  const backlinksMap = useBacklinksIndex()

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
            <h1 className="text-base font-semibold text-foreground">Permanent</h1>
            <span className="rounded-full bg-chart-5/10 px-2 py-0.5 text-xs font-medium tabular-nums text-chart-5">
              {permanentNotes.length}
            </span>
          </div>
        </header>

        <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-2">
          <Shield className="h-3.5 w-3.5 text-chart-5" />
          <span className="text-xs text-muted-foreground">
            Fully-enriched, permanent knowledge base notes.
          </span>
        </div>

        {/* Content */}
        {permanentNotes.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Shield className="mb-4 h-12 w-12 text-muted-foreground/20" />
            <p className="text-ui text-muted-foreground">No permanent notes yet</p>
            <p className="mt-1 text-sm text-muted-foreground/60">
              Promote capture notes when their ready score reaches 5+.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Column headers */}
            <div className="sticky top-0 z-10 flex items-center border-b border-border bg-background px-5 py-2">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-muted-foreground">Name</span>
              </div>
              <div className="w-[56px] shrink-0 text-center">
                <span className="text-xs font-medium text-muted-foreground">Links</span>
              </div>
              <div className="w-[56px] shrink-0 text-center">
                <span className="text-xs font-medium text-muted-foreground">Reads</span>
              </div>
              <div className="w-[72px] shrink-0 text-center">
                <span className="text-xs font-medium text-muted-foreground">Priority</span>
              </div>
              <div className="w-[80px] shrink-0 text-right">
                <span className="text-xs font-medium text-muted-foreground">Promoted</span>
              </div>
              <div className="w-[80px] shrink-0 text-right">
                <span className="text-xs font-medium text-muted-foreground">Updated</span>
              </div>
            </div>

            {permanentNotes.map((note) => {
              const links = backlinksMap.get(note.id) ?? 0

              return (
                <div
                  key={note.id}
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
                    <FileText className="h-4 w-4 shrink-0 text-chart-5/60" />
                    <span className="truncate text-ui text-foreground">
                      {note.title || "Untitled"}
                    </span>
                    {links === 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-1.5 py-0.5 text-2xs font-medium text-destructive">
                            <Link2 className="h-2.5 w-2.5" />
                            Orphan
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Add at least 1 link to reduce orphan notes.</TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {/* Links */}
                  <div className="w-[56px] shrink-0 text-center">
                    <span className={`text-sm tabular-nums ${links === 0 ? "text-muted-foreground/30" : "text-muted-foreground"}`}>
                      {links}
                    </span>
                  </div>

                  {/* Reads */}
                  <div className="w-[56px] shrink-0 text-center">
                    <span className={`text-sm tabular-nums ${note.reads === 0 ? "text-muted-foreground/30" : "text-muted-foreground"}`}>
                      {note.reads}
                    </span>
                  </div>

                  {/* Priority */}
                  <div className="w-[72px] shrink-0 flex justify-center">
                    <PriorityBadge priority={note.priority} />
                  </div>

                  {/* Promoted date */}
                  <div className="w-[80px] shrink-0 text-right">
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {note.promotedAt ? format(new Date(note.promotedAt), "MMM d") : "--"}
                    </span>
                  </div>

                  {/* Updated */}
                  <div className="w-[80px] shrink-0 text-right">
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {shortRelative(note.updatedAt)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Detail panel */}
      {previewId && (
        <NoteDetailPanel
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
