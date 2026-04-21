"use client"

import { useState, useMemo, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { setActiveSpace } from "@/lib/table-route"
import type { Note, WikiBlock } from "@/lib/types"

/* ── Props ──────────────────────────────────────── */

interface WikiAssemblyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  noteIds: string[]
  onComplete?: (articleId: string) => void
}

/* ── Status label helper ────────────────────────── */

const STATUS_LABELS: Record<string, string> = {
  inbox: "Inbox",
  capture: "Capture",
  permanent: "Permanent",
}

/* ── Component ──────────────────────────────────── */

export function WikiAssemblyDialog({
  open,
  onOpenChange,
  noteIds,
  onComplete,
}: WikiAssemblyDialogProps) {
  const notes = usePlotStore((s) => s.notes)
  const createWikiArticle = usePlotStore((s) => s.createWikiArticle)

  // Resolve notes
  const assemblyNotes = useMemo(() => {
    const result: Note[] = []
    for (const id of noteIds) {
      const note = notes.find((n) => n.id === id)
      if (note) result.push(note)
    }
    return result
  }, [noteIds, notes])

  // Title defaults to first note's title
  const defaultTitle = assemblyNotes[0]?.title || "Untitled Wiki"
  const [title, setTitle] = useState(defaultTitle)

  const handleAssemble = useCallback(() => {
    if (assemblyNotes.length === 0) return

    const blocks: WikiBlock[] = [
      // Overview section
      { id: crypto.randomUUID(), type: "section", title: "Overview", level: 2 },
      // NoteRef blocks for each selected note
      ...assemblyNotes.map((note) => ({
        id: crypto.randomUUID(),
        type: "note-ref" as const,
        noteId: note.id,
      })),
      // See Also section
      { id: crypto.randomUUID(), type: "section", title: "See Also", level: 2 },
    ]

    const articleId = createWikiArticle({ title: title.trim() || "Untitled Wiki", blocks })

    onOpenChange(false)
    setActiveSpace("wiki")
    toast.success(
      `Wiki article "${title.trim() || "Untitled Wiki"}" created from ${assemblyNotes.length} note${assemblyNotes.length > 1 ? "s" : ""}`,
    )
    onComplete?.(articleId)
  }, [assemblyNotes, title, createWikiArticle, onOpenChange, onComplete])

  if (assemblyNotes.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2 text-ui">
            <BookOpen size={16} weight="regular" />
            Assemble Wiki Article
          </DialogTitle>
          <DialogDescription className="text-note">
            Create a wiki article from {assemblyNotes.length} note{assemblyNotes.length > 1 ? "s" : ""}.
            Each note will be embedded as a reference block.
          </DialogDescription>
        </DialogHeader>

        {/* Title input */}
        <div className="px-5 py-2">
          <label className="text-2xs font-medium text-muted-foreground/70 mb-1.5 block">
            Article Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter book title..."
            className="w-full rounded-md border border-border bg-secondary/30 px-3 py-2 text-note text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Note list (read-only) */}
        <div className="px-5 py-2">
          <div className="gap-1 flex flex-col">
            {assemblyNotes.map((note) => (
              <div
                key={note.id}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 bg-secondary/20"
              >
                <BookOpen className="shrink-0 text-muted-foreground/50" size={14} weight="regular" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-note text-foreground">
                    {note.title || "Untitled"}
                  </p>
                </div>
                <span className="shrink-0 text-2xs text-muted-foreground/50">
                  {STATUS_LABELS[note.status] ?? note.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Info banner */}
        <div className="mx-5 mb-3 flex items-center gap-2 rounded-md bg-secondary/30 px-3 py-2">
          <BookOpen className="shrink-0 text-muted-foreground/60" size={14} weight="regular" />
          <p className="text-2xs text-muted-foreground/70 leading-relaxed">
            Notes will be referenced, not archived. Original notes remain unchanged.
          </p>
        </div>

        <DialogFooter className="border-t border-border px-5 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-note"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleAssemble}
            className="text-note"
          >
            <BookOpen size={14} weight="regular" />
            Create Article
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
