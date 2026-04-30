"use client"

import { useRef, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import { useBacklinksFor } from "@/lib/search/use-backlinks-for"
import { NoteEditorAdapter } from "@/components/editor/NoteEditorAdapter"
import { WikiTOC } from "@/components/editor/wiki-toc"
import { WikiInfobox } from "@/components/editor/wiki-infobox"
import { WikiCategories } from "@/components/editor/wiki-categories"
import { WikiDisambig } from "@/components/editor/wiki-disambig"
import { WikiRelatedDocs } from "@/components/editor/wiki-related-docs"
import { WikiCollectionSidebar } from "@/components/editor/wiki-collection-sidebar"
import { StatRow } from "./wiki-shared"
import { shortRelative } from "@/lib/format-utils"
import { toast } from "sonner"

export function WikiArticleReader({
  noteId,
  onNavigate,
  isEditing = false,
}: {
  noteId: string
  onNavigate: (id: string) => void
  isEditing?: boolean
}) {
  const notes = usePlotStore((s) => s.notes)
  const allTags = usePlotStore((s) => s.tags)
  const relations = usePlotStore((s) => s.relations)
  const updateNote = usePlotStore((s) => s.updateNote)
  const backlinks = useBacklinksFor(noteId)
  const editorRef = useRef<any>(null)

  const note = notes.find((n) => n.id === noteId)

  // Add section handler (must be before any early return)
  const handleAddSection = useCallback((title: string, level: number) => {
    if (!note) return
    const hashes = "#".repeat(level)
    const newContent = (note.content || "").trimEnd() + `\n\n${hashes} ${title}\n\n`
    updateNote(note.id, { content: newContent })
  }, [note, updateNote])

  if (!note) return null

  const backlinkCount = backlinks.length
  const relationCount = relations.filter(
    (r) => r.sourceNoteId === noteId || r.targetNoteId === noteId
  ).length

  // Edit mode: editor + collection sidebar
  if (isEditing) {
    return (
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-6 max-w-[780px]">
            <NoteEditorAdapter
              note={note}
              editable={true}
              onEditorReady={(ed) => { editorRef.current = ed }}
            />
          </div>
        </div>
        <WikiCollectionSidebar
          noteId={noteId}
          onNavigate={onNavigate}
          onInsertLink={(title: string) => {
            const editor = editorRef.current
            if (editor) {
              editor.chain().focus().insertContent(`[[${title}]]`).run()
              toast.success(`Inserted [[${title}]]`, { duration: 1500 })
            }
          }}
        />
      </div>
    )
  }

  // Read mode: always show TOC sidebar (with + Add section)
  return (
    <div className="flex-1 min-h-0 min-w-0 overflow-hidden flex">
      {/* Left: TOC sidebar */}
      <aside className="w-[200px] shrink-0 overflow-y-auto border-r border-border-subtle px-3 py-4">
        <div className="sticky top-0">
          <WikiTOC content={note.content} className="w-full" onAddSection={handleAddSection} />
        </div>
      </aside>

      {/* Center: Article content */}
      <div className="flex-1 overflow-y-auto">
        <div className="wiki-read-content px-8 py-6 max-w-[780px]">
          {/* Disambig banner */}
          <WikiDisambig noteId={note.id} noteTitle={note.title} onNavigate={onNavigate} />

          {/* Title */}
          <h1 className="text-[26px] font-bold text-foreground mb-1">
            {note.title || "Untitled"}
          </h1>

          {/* Aliases as subtitle */}
          {note.aliases && note.aliases.length > 0 && (
            <p className="text-note text-muted-foreground/70 mb-6">
              {note.aliases.join(" \u00b7 ")}
            </p>
          )}

          {/* Article body */}
          <NoteEditorAdapter note={note} editable={false} />

          {/* Related wiki docs */}
          <WikiRelatedDocs noteId={note.id} onNavigate={onNavigate} />

        </div>
      </div>

      {/* Right: Infobox sidebar */}
      <aside className="w-[240px] shrink-0 overflow-y-auto border-l border-border-subtle px-4 py-5 space-y-4">
        {/* Infobox — always editable, shows "Add infobox" when empty */}
        <WikiInfobox
          noteId={note.id}
          entries={note.wikiInfobox ?? []}
          editable={true}
          className="w-full"
        />

        {/* Categories as badges */}
        {note.tags.length > 0 && (
          <WikiCategories noteTagIds={note.tags} allTags={allTags.filter((t) => !t.trashed)} />
        )}

        {/* Activity stats */}
        <div className="space-y-2">
          <h4 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            Activity
          </h4>
          <div className="space-y-1.5">
            <StatRow label="Connected notes" value={`${backlinkCount}`} />
            <StatRow label="Ontology links" value={`${relationCount}`} />
            <StatRow label="Last modified" value={shortRelative(note.updatedAt)} />
          </div>
        </div>
      </aside>
    </div>
  )
}
