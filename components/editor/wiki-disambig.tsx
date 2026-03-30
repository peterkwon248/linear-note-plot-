"use client"

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"

interface WikiDisambigProps {
  noteId: string
  noteTitle: string
  /** Optional navigation callback. Falls back to store setSelectedNoteId. */
  onNavigate?: (noteId: string) => void
}

export function WikiDisambig({ noteId, noteTitle, onNavigate }: WikiDisambigProps) {
  const notes = usePlotStore((s) => s.notes)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)

  const handleNavigate = onNavigate ?? setSelectedNoteId

  const matches = useMemo(() => {
    if (!noteTitle) return []
    const titleLower = noteTitle.toLowerCase()
    return notes.filter(
      (n) =>
        n.isWiki &&
        n.id !== noteId &&
        !n.trashed &&
        (n.title.toLowerCase() === titleLower ||
          n.aliases?.some((a) => a.toLowerCase() === titleLower))
    )
  }, [noteId, noteTitle, notes])

  if (matches.length === 0) return null

  return (
    <div className="rounded-lg bg-accent/5 border border-accent/15 p-3 text-note text-muted-foreground mb-6">
      {matches.map((match) => (
        <p key={match.id}>
          <strong className="text-foreground">{noteTitle}</strong> redirects here.
          For {match.title}, see{" "}
          <button
            onClick={() => handleNavigate(match.id)}
            className="text-accent hover:underline transition-colors duration-150"
          >
            {match.title}
          </button>
          .
        </p>
      ))}
    </div>
  )
}
