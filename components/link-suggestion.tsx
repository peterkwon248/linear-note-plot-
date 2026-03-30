"use client"

import type { Note } from "@/lib/types"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"

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
    <div className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-surface-overlay shadow-lg">
      <div className="px-2 py-1.5">
        <span className="text-2xs font-medium text-muted-foreground">
          Link to note
        </span>
      </div>
      {suggestions.map((note) => (
        <button
          key={note.id}
          onClick={() => onSelect(note)}
          className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-note text-foreground transition-colors hover:bg-hover-bg"
        >
          <FileText className="shrink-0 text-muted-foreground/60" size={14} weight="regular" />
          <span className="truncate">{note.title}</span>
          <span className="ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-2xs text-muted-foreground bg-secondary">
            {note.status}
          </span>
        </button>
      ))}
    </div>
  )
}
