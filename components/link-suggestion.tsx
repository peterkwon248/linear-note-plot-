"use client"

import { FileText } from "lucide-react"
import type { Note } from "@/lib/types"

export function LinkSuggestion({
  suggestions,
  onSelect,
  visible,
}: {
  suggestions: Note[]
  onSelect: (note: Note) => void
  visible: boolean
}) {
  if (!visible || suggestions.length === 0) return null

  return (
    <div className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
      <div className="px-2 py-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Link to note
        </span>
      </div>
      {suggestions.map((note) => (
        <button
          key={note.id}
          onClick={() => onSelect(note)}
          className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-[12px] text-foreground transition-colors hover:bg-secondary/50"
        >
          <FileText className="h-3 w-3 shrink-0 text-muted-foreground/60" />
          <span className="truncate">{note.title}</span>
          <span className="ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] text-muted-foreground bg-secondary">
            {note.status}
          </span>
        </button>
      ))}
    </div>
  )
}
