"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Hash, Plus } from "lucide-react"
import { usePlotStore } from "@/lib/store"
import { NoteEditor } from "@/components/note-editor"
import { NoteInspector } from "@/components/note-inspector"

const PRESET_COLORS = [
  "#e5484d",
  "#5e6ad2",
  "#26b5ce",
  "#f2994a",
  "#45d483",
  "#8e4ec6",
]

export default function TagsPage() {
  const notes = usePlotStore((s) => s.notes)
  const tags = usePlotStore((s) => s.tags)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const createTag = usePlotStore((s) => s.createTag)

  const [showForm, setShowForm] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0])

  const tagStats = useMemo(() => {
    return tags.map((tag) => {
      const count = notes.filter(
        (n) => n.tags.includes(tag.id) && !n.archived && !n.trashed
      ).length
      return { ...tag, noteCount: count }
    })
  }, [tags, notes])

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
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-base font-semibold text-foreground">Tags</h1>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {tags.length} {tags.length === 1 ? "tag" : "tags"}
          </p>
        </div>
        <button
          className="flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-[12px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="h-3 w-3" />
          <span>New Tag</span>
        </button>
      </header>

      {/* New tag form */}
      {showForm && (
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-secondary/20 px-6 py-3">
          <input
            autoFocus
            type="text"
            placeholder="Tag name"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newTagName.trim()) {
                createTag(newTagName.trim(), newTagColor)
                setNewTagName("")
                setNewTagColor(PRESET_COLORS[0])
                setShowForm(false)
              } else if (e.key === "Escape") {
                setShowForm(false)
              }
            }}
            className="rounded-md border border-border bg-background px-2 py-1 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-accent"
          />
          <div className="flex items-center gap-1.5">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setNewTagColor(color)}
                className="h-4 w-4 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: color,
                  outline: newTagColor === color ? `2px solid ${color}` : "none",
                  outlineOffset: "2px",
                }}
              />
            ))}
          </div>
          <button
            disabled={!newTagName.trim()}
            onClick={() => {
              if (!newTagName.trim()) return
              createTag(newTagName.trim(), newTagColor)
              setNewTagName("")
              setNewTagColor(PRESET_COLORS[0])
              setShowForm(false)
            }}
            className="rounded-md bg-accent px-2 py-1 text-[12px] font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Create
          </button>
          <button
            onClick={() => setShowForm(false)}
            className="text-[12px] text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Tag list */}
      <div className="flex-1 overflow-y-auto">
        {tagStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Hash className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-[13px] text-muted-foreground">No tags yet</p>
            <p className="mt-1 text-[12px] text-muted-foreground/60">
              Add tags to notes from the editor
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tagStats.map((tag) => (
              <Link
                key={tag.id}
                href={`/tag/${tag.id}`}
                className="flex items-center gap-3 px-6 py-3 hover:bg-secondary/30 transition-colors"
              >
                <Hash
                  className="h-4 w-4 shrink-0"
                  style={{ color: tag.color }}
                />
                <span className="flex-1 text-[13px] text-foreground font-medium">
                  {tag.name}
                </span>
                <span className="text-[12px] text-muted-foreground tabular-nums">
                  {tag.noteCount} {tag.noteCount === 1 ? "note" : "notes"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
