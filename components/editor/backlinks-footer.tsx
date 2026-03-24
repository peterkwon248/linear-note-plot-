"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { useBacklinksFor } from "@/lib/search/use-backlinks-for"
import { shortRelative } from "@/lib/format-utils"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"

const DEFAULT_VISIBLE = 4

export function BacklinksFooter({ noteId, onNavigate }: { noteId: string; onNavigate?: (noteId: string) => void }) {
  const notes = usePlotStore((s) => s.notes)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const handleNavigate = onNavigate ?? setSelectedNoteId
  const [showAll, setShowAll] = useState(false)

  const backlinks = useBacklinksFor(noteId)

  // Sort by updatedAt descending
  const sorted = useMemo(
    () => [...backlinks].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [backlinks],
  )

  if (sorted.length === 0) return null

  const visible = showAll ? sorted : sorted.slice(0, DEFAULT_VISIBLE)
  const remaining = sorted.length - DEFAULT_VISIBLE

  return (
    <div className="border-t border-border mt-8 pt-6 pb-8">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Notes referencing this article ({sorted.length})
      </h3>
      <div className="space-y-1">
        {visible.map((note) => (
          <button
            key={note.id}
            onClick={() => handleNavigate(note.id)}
            className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors duration-150 group"
          >
            <FileText className="shrink-0 text-muted-foreground/50" size={14} weight="regular" />
            <span className="truncate flex-1 text-foreground/80 group-hover:text-foreground">
              {note.title || "Untitled"}
            </span>
            <span className="text-2xs text-muted-foreground/50 shrink-0">
              {shortRelative(note.updatedAt)}
            </span>
          </button>
        ))}
      </div>
      {!showAll && remaining > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-2 px-2 text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-150"
        >
          + {remaining} more
        </button>
      )}
    </div>
  )
}
