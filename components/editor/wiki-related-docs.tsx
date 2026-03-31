"use client"

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"

interface WikiRelatedDocsProps {
  noteId: string
  /** Optional navigation callback. Falls back to store setSelectedNoteId. */
  onNavigate?: (noteId: string) => void
}

export function WikiRelatedDocs({ noteId, onNavigate }: WikiRelatedDocsProps) {
  const notes = usePlotStore((s) => s.notes)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const handleNavigate = onNavigate ?? setSelectedNoteId

  const relatedWikiDocs = useMemo(() => {
    const note = notes.find((n) => n.id === noteId)
    if (!note || !note.linksOut || note.linksOut.length === 0) return []

    // linksOut contains lowercased titles of linked notes
    const linkedTitles = new Set(note.linksOut)

    return notes.filter(
      (n) =>
        n.id !== noteId &&
        n.noteType === "wiki" &&
        !n.trashed &&
        (linkedTitles.has(n.title.toLowerCase()) ||
          n.aliases?.some((a) => linkedTitles.has(a.toLowerCase())))
    )
  }, [noteId, notes])

  if (relatedWikiDocs.length === 0) return null

  return (
    <div className="border-t border-border mt-8 pt-6">
      <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Related Articles
      </h3>
      <div className="flex flex-wrap gap-2">
        {relatedWikiDocs.map((doc) => (
          <button
            key={doc.id}
            onClick={() => handleNavigate(doc.id)}
            className="flex items-center gap-2 rounded-md bg-secondary border border-border px-3 py-1.5 text-note cursor-pointer transition-colors duration-150 hover:bg-hover-bg"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            <span className="text-foreground">{doc.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
