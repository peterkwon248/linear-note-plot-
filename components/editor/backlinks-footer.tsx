"use client"

import { useMemo, useState } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { useBacklinksFor } from "@/lib/search/use-backlinks-for"
import { suggestBacklinks } from "@/lib/backlinks"
import { StatusIcon } from "@/components/status-icon"
import type { NoteStatus } from "@/lib/types"

// Collapsible section header
function FooterSection({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string
  count: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        <ChevronRight className={cn("h-3 w-3 transition-transform", open && "rotate-90")} />
        <span>{title}</span>
        <span className="text-muted-foreground/60">({count})</span>
      </button>
      {open && <div className="ml-4 space-y-0.5">{children}</div>}
    </div>
  )
}

// Single note link row
function NoteLink({
  noteId,
  title,
  status,
  reason,
  onClick,
}: {
  noteId: string
  title: string
  status: NoteStatus
  reason?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full text-left px-1 py-0.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors group"
    >
      <StatusIcon status={status} className="text-muted-foreground/50 flex-shrink-0" />
      <span className="truncate flex-1">{title || "Untitled"}</span>
      {reason && (
        <span className="text-2xs text-muted-foreground/40 flex-shrink-0 group-hover:text-muted-foreground/60">
          {reason}
        </span>
      )}
    </button>
  )
}

export function BacklinksFooter({ noteId }: { noteId: string }) {
  const notes = usePlotStore((s) => s.notes)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)

  const backlinks = useBacklinksFor(noteId)

  const related = useMemo(() => {
    const backlinkIds = new Set(backlinks.map((n) => n.id))
    return suggestBacklinks(noteId, notes, { limit: 5 }).filter(
      (r) => !backlinkIds.has(r.noteId)
    )
  }, [noteId, notes, backlinks])

  // Hide entirely if nothing to show
  if (backlinks.length === 0 && related.length === 0) return null

  return (
    <div className="border-t border-border/50 mt-8 pt-4 pb-8 space-y-3">
      {backlinks.length > 0 && (
        <FooterSection title="Backlinks" count={backlinks.length}>
          {backlinks.map((note) => (
            <NoteLink
              key={note.id}
              noteId={note.id}
              title={note.title}
              status={note.status}
              onClick={() => setSelectedNoteId(note.id)}
            />
          ))}
        </FooterSection>
      )}

      {related.length > 0 && (
        <FooterSection title="Related" count={related.length}>
          {related.map((r) => {
            const note = notes.find((n) => n.id === r.noteId)
            if (!note) return null
            // Pick the most descriptive reason
            const reason = r.reasons[r.reasons.length - 1]
            return (
              <NoteLink
                key={r.noteId}
                noteId={r.noteId}
                title={note.title}
                status={note.status}
                reason={reason}
                onClick={() => setSelectedNoteId(note.id)}
              />
            )
          })}
        </FooterSection>
      )}
    </div>
  )
}
