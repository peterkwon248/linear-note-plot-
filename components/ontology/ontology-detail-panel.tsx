"use client"

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { useBacklinksFor } from "@/lib/search/use-backlinks-for"
import { RELATION_TYPE_CONFIG } from "@/lib/relation-helpers"
import { detectUnlinkedMentions } from "@/lib/unlinked-mentions"
import type { Relation, RelationType } from "@/lib/types"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut"
import { getEntityColor } from "@/lib/colors" // v109: opt-in color fallback
interface OntologyDetailPanelProps {
  noteId: string
  onClose: () => void
  onOpenNote: (noteId: string) => void
}

export function OntologyDetailPanel({
  noteId,
  onClose,
  onOpenNote,
}: OntologyDetailPanelProps) {
  const note = usePlotStore((s) => s.notes.find((n) => n.id === noteId))
  const notes = usePlotStore((s) => s.notes)
  const relations = usePlotStore((s) => s.relations || [])
  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)
  const addWikiLink = usePlotStore((s) => s.addWikiLink)
  const backlinks = useBacklinksFor(noteId)

  const unlinkedMentions = useMemo(() => {
    return detectUnlinkedMentions(noteId, notes)
  }, [noteId, notes])

  if (!note) return null

  // Filter relations involving this note
  const relationsInvolving = relations.filter(
    (r: Relation) => r.sourceNoteId === noteId || r.targetNoteId === noteId
  )

  // Find label
  const label = note.labelId ? labels.find((l) => l.id === note.labelId) : null

  // Find tags
  const noteTags = note.tags
    .map((tagId) => tags.find((t) => t.id === tagId))
    .filter(Boolean)

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-start justify-between gap-2">
        <div className="flex-1">
          <h2 className="text-note font-bold line-clamp-2">{note.title}</h2>
          <div className="flex items-center gap-2 mt-2">
            {label && (
              <div className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                <span className="text-2xs text-muted-foreground">
                  {label.name}
                </span>
              </div>
            )}
            <span className="text-2xs text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
              {note.status}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground p-1"
        >
          <PhX size={16} weight="regular" />
        </button>
      </div>

      {/* Preview */}
      {note.preview && (
        <div className="px-4 py-2 text-2xs text-muted-foreground italic">
          {note.preview.substring(0, 150)}
          {note.preview.length > 150 ? "..." : ""}
        </div>
      )}

      {/* Relations */}
      {relationsInvolving.length > 0 && (
        <div>
          <div className="text-2xs font-semibold uppercase text-muted-foreground tracking-wider px-4 pt-3 pb-1">
            Relations ({relationsInvolving.length})
          </div>
          <div className="space-y-0.5">
            {relationsInvolving.map((rel: Relation) => {
              const isSource = rel.sourceNoteId === noteId
              const otherNoteId = isSource ? rel.targetNoteId : rel.sourceNoteId
              const otherNote = usePlotStore
                .getState()
                .notes.find((n) => n.id === otherNoteId)

              if (!otherNote) return null

              const config = RELATION_TYPE_CONFIG[rel.type]
              const label = isSource ? config.label : config.inverseLabel

              return (
                <div
                  key={rel.id}
                  className="px-4 py-1 text-2xs hover:bg-hover-bg rounded cursor-pointer flex items-center gap-1"
                  onClick={() => onOpenNote(otherNoteId)}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-muted-foreground flex-shrink-0">
                    {isSource ? "→" : "←"}
                  </span>
                  <span className="text-muted-foreground flex-shrink-0">
                    {label}
                  </span>
                  <span className="truncate text-foreground">
                    {otherNote.title}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <div>
          <div className="text-2xs font-semibold uppercase text-muted-foreground tracking-wider px-4 pt-3 pb-1">
            Backlinks ({backlinks.length})
          </div>
          <div className="space-y-0.5">
            {backlinks.map((backlink) => (
              <div
                key={backlink.id}
                className="px-4 py-1 text-2xs hover:bg-hover-bg rounded cursor-pointer flex items-center gap-1"
                onClick={() => onOpenNote(backlink.id)}
              >
                <span className="text-muted-foreground">←</span>
                <span className="truncate text-foreground">{backlink.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unlinked Mentions */}
      {unlinkedMentions.length > 0 && (
        <div>
          <div className="text-2xs font-semibold uppercase text-muted-foreground tracking-wider px-4 pt-3 pb-1">
            Unlinked Mentions ({unlinkedMentions.length})
          </div>
          <div className="space-y-0.5">
            {unlinkedMentions.map((m) => (
              <div
                key={m.noteId + m.title}
                className="px-4 py-1 text-2xs hover:bg-hover-bg rounded flex items-center gap-1 group"
              >
                <span className="text-muted-foreground/60">⚡</span>
                <span className="truncate flex-1 text-foreground">{m.title}</span>
                <span className="text-2xs text-muted-foreground/70 shrink-0">{m.count}×</span>
                <button
                  onClick={() => addWikiLink(noteId, m.title)}
                  className="shrink-0 text-2xs text-accent opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                >
                  Link
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {noteTags.length > 0 && (
        <div>
          <div className="text-2xs font-semibold uppercase text-muted-foreground tracking-wider px-4 pt-3 pb-1">
            Tags
          </div>
          <div className="px-4 py-2 flex flex-wrap gap-1">
            {noteTags.map((tag) => (
              <div
                key={tag!.id}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-2xs rounded bg-secondary"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getEntityColor(tag!.color) }}
                />
                <span className="text-muted-foreground">{tag!.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Note Button */}
      <button
        onClick={() => onOpenNote(noteId)}
        className="mx-4 mb-4 mt-auto px-3 py-1.5 text-2xs bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center justify-center gap-1 transition-colors"
      >
        <ArrowSquareOut size={12} weight="regular" />
        Open Note
      </button>
    </div>
  )
}
