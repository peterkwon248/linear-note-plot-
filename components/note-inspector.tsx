"use client"

import {
  Calendar,
  Clock,
  FolderOpen,
  Tag,
  X,
  Plus,
  ChevronDown,
  Hash,
  FileText,
  Pin,
  Archive,
  Layers,
  AlignLeft,
  Paperclip,
  Link2,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"
import { usePlotStore } from "@/lib/store"
import { useState, useMemo } from "react"
import { StatusDropdown, PriorityDropdown } from "@/components/note-fields"
import { Signal, CircleDot } from "lucide-react"

function InspectorSection({
  title,
  icon,
  children,
  className,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("px-4 py-3", className)}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function extractHeadings(content: string): { level: number; text: string }[] {
  const lines = content.split("\n")
  const headings: { level: number; text: string }[] = []
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)/)
    if (match) {
      headings.push({ level: match[1].length, text: match[2].trim() })
    }
  }
  return headings
}

export function NoteInspector() {
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const notes = usePlotStore((s) => s.notes)
  const folders = usePlotStore((s) => s.folders)
  const tags = usePlotStore((s) => s.tags)
  const categories = usePlotStore((s) => s.categories)
  const updateNote = usePlotStore((s) => s.updateNote)
  const addTagToNote = usePlotStore((s) => s.addTagToNote)
  const removeTagFromNote = usePlotStore((s) => s.removeTagFromNote)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)

  const [folderOpen, setFolderOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)

  const note = notes.find((n) => n.id === selectedNoteId) ?? null

  const headings = useMemo(
    () => (note ? extractHeadings(note.content) : []),
    [note?.content] // eslint-disable-line react-hooks/exhaustive-deps
  )

  if (!note) return null

  const currentFolder = folders.find((f) => f.id === note.folderId)
  const currentCategory = categories.find((c) => c.id === note.category)
  const noteTags = tags.filter((t) => note.tags.includes(t.id))
  const availableTags = tags.filter((t) => !note.tags.includes(t.id))

  const wordCount = note.content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length
  const charCount = note.content.length

  return (
    <aside className="flex h-full w-[320px] shrink-0 flex-col overflow-hidden border-l border-border bg-card">
      {/* Inspector Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="text-[13px] font-medium text-foreground">Details</span>
        <button
          onClick={() => setSelectedNoteId(null)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Close inspector"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Status Badges */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          {note.pinned && (
            <span className="flex items-center gap-1 rounded-md bg-[#f2994a]/10 px-2 py-0.5 text-[11px] font-medium text-[#f2994a]">
              <Pin className="h-3 w-3" />
              Pinned
            </span>
          )}
          {note.archived && (
            <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <Archive className="h-3 w-3" />
              Archived
            </span>
          )}
          {note.isInbox && (
            <span className="flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
              Inbox
            </span>
          )}
          {!note.pinned && !note.archived && !note.isInbox && (
            <span className="text-[12px] text-muted-foreground">Active note</span>
          )}
        </div>

        {/* Dates */}
        <InspectorSection title="Dates" icon={<Calendar className="h-3.5 w-3.5" />}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">Created</span>
              <span className="text-[12px] text-foreground">
                {format(new Date(note.createdAt), "MMM d, yyyy")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">Updated</span>
              <span className="text-[12px] text-foreground">
                {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </InspectorSection>

        <div className="mx-4 border-b border-border" />

        {/* Status */}
        <InspectorSection title="Status" icon={<CircleDot className="h-3.5 w-3.5" />}>
          <StatusDropdown
            value={note.status}
            onChange={(s) => updateNote(note.id, { status: s })}
            variant="button"
          />
        </InspectorSection>

        <div className="mx-4 border-b border-border" />

        {/* Priority */}
        <InspectorSection title="Priority" icon={<Signal className="h-3.5 w-3.5" />}>
          <PriorityDropdown
            value={note.priority}
            onChange={(p) => updateNote(note.id, { priority: p })}
            variant="button"
          />
        </InspectorSection>

        <div className="mx-4 border-b border-border" />

        {/* Folder */}
        <InspectorSection title="Folder" icon={<FolderOpen className="h-3.5 w-3.5" />}>
          <Popover open={folderOpen} onOpenChange={setFolderOpen}>
            <PopoverTrigger asChild>
              <button className="flex w-full items-center justify-between rounded-md border border-border bg-secondary/30 px-2.5 py-1.5 text-[12px] text-foreground transition-colors hover:bg-secondary/60">
                <span className="flex items-center gap-2">
                  {currentFolder && (
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: currentFolder.color }}
                    />
                  )}
                  {currentFolder?.name ?? "No folder"}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-52 p-1">
              <button
                onClick={() => {
                  updateNote(note.id, { folderId: null })
                  setFolderOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors hover:bg-secondary",
                  !note.folderId ? "text-foreground" : "text-muted-foreground"
                )}
              >
                No folder
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => {
                    updateNote(note.id, { folderId: folder.id })
                    setFolderOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors hover:bg-secondary",
                    note.folderId === folder.id ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: folder.color }}
                  />
                  {folder.name}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </InspectorSection>

        <div className="mx-4 border-b border-border" />

        {/* Category */}
        <InspectorSection title="Category" icon={<Layers className="h-3.5 w-3.5" />}>
          <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
            <PopoverTrigger asChild>
              <button className="flex w-full items-center justify-between rounded-md border border-border bg-secondary/30 px-2.5 py-1.5 text-[12px] text-foreground transition-colors hover:bg-secondary/60">
                <span className="flex items-center gap-2">
                  {currentCategory && (
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: currentCategory.color }}
                    />
                  )}
                  {currentCategory?.name ?? "No category"}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-52 p-1">
              <button
                onClick={() => {
                  updateNote(note.id, { category: "" })
                  setCategoryOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors hover:bg-secondary",
                  note.category === "" ? "text-foreground" : "text-muted-foreground"
                )}
              >
                No category
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    updateNote(note.id, { category: cat.id })
                    setCategoryOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors hover:bg-secondary",
                    note.category === cat.id ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.name}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </InspectorSection>

        <div className="mx-4 border-b border-border" />

        {/* Tags */}
        <InspectorSection title="Tags" icon={<Hash className="h-3.5 w-3.5" />}>
          <div className="flex flex-wrap items-center gap-1.5">
            {noteTags.map((tag) => (
              <span
                key={tag.id}
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{
                  backgroundColor: `${tag.color}18`,
                  color: tag.color,
                }}
              >
                {tag.name}
                <button
                  onClick={() => removeTagFromNote(note.id, tag.id)}
                  className="rounded-full p-0.5 transition-colors hover:bg-foreground/10"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            {availableTags.length > 0 && (
              <Popover open={tagOpen} onOpenChange={setTagOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground">
                    <Plus className="h-2.5 w-2.5" />
                    Add
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-48 p-1">
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        addTagToNote(note.id, tag.id)
                        setTagOpen(false)
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-secondary"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            )}
            {noteTags.length === 0 && availableTags.length === 0 && (
              <span className="text-[12px] text-muted-foreground">No tags available</span>
            )}
          </div>
        </InspectorSection>

        <div className="mx-4 border-b border-border" />

        {/* Outline (headings) */}
        <InspectorSection title="Outline" icon={<AlignLeft className="h-3.5 w-3.5" />}>
          {headings.length > 0 ? (
            <div className="space-y-1">
              {headings.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground cursor-default"
                  style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
                >
                  <span className="shrink-0 text-[10px] font-mono text-muted-foreground/50">
                    {"H" + h.level}
                  </span>
                  <span className="truncate">{h.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-[12px] text-muted-foreground">No headings found</span>
          )}
        </InspectorSection>

        <div className="mx-4 border-b border-border" />

        {/* Properties */}
        <InspectorSection title="Properties" icon={<FileText className="h-3.5 w-3.5" />}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">Words</span>
              <span className="text-[12px] tabular-nums text-foreground">{wordCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">Characters</span>
              <span className="text-[12px] tabular-nums text-foreground">{charCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">Headings</span>
              <span className="text-[12px] tabular-nums text-foreground">{headings.length}</span>
            </div>
          </div>
        </InspectorSection>

        <div className="mx-4 border-b border-border" />

        {/* Linked References (placeholder) */}
        <InspectorSection title="References" icon={<Link2 className="h-3.5 w-3.5" />}>
          <span className="text-[12px] text-muted-foreground">No linked references</span>
        </InspectorSection>

        <div className="mx-4 border-b border-border" />

        {/* Attachments (placeholder) */}
        <InspectorSection title="Attachments" icon={<Paperclip className="h-3.5 w-3.5" />}>
          <span className="text-[12px] text-muted-foreground">No attachments</span>
        </InspectorSection>
      </div>
    </aside>
  )
}
