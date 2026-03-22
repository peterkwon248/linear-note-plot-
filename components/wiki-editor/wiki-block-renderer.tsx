"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import { ChevronDown, ChevronRight, FileText, ImageIcon, GripVertical, Plus, Trash2, Search, Upload, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import type { WikiBlock } from "@/lib/types"
import { useAttachmentUrl } from "@/lib/use-attachment-url"
import { persistAttachmentBlob } from "@/lib/store/helpers"

/* ── Block Renderer ── */

interface WikiBlockRendererProps {
  block: WikiBlock
  editable?: boolean
  /** Auto-computed section number (e.g., "1", "2.1") for section blocks */
  sectionNumber?: string
  onUpdate?: (patch: Partial<Omit<WikiBlock, "id">>) => void
  onDelete?: () => void
}

export function WikiBlockRenderer({ block, editable, sectionNumber, onUpdate, onDelete }: WikiBlockRendererProps) {
  switch (block.type) {
    case "section":
      return <SectionBlock block={block} editable={editable} sectionNumber={sectionNumber} onUpdate={onUpdate} onDelete={onDelete} />
    case "text":
      return <TextBlock block={block} editable={editable} onUpdate={onUpdate} onDelete={onDelete} />
    case "note-ref":
      return <NoteRefBlock block={block} editable={editable} onUpdate={onUpdate} onDelete={onDelete} />
    case "image":
      return <ImageBlock block={block} editable={editable} onUpdate={onUpdate} onDelete={onDelete} />
    default:
      return null
  }
}

/* ── Section Block ── */

function SectionBlock({ block, editable, sectionNumber, onUpdate, onDelete }: WikiBlockRendererProps) {
  const collapsed = block.collapsed ?? false
  const toggleCollapsed = () => onUpdate?.({ collapsed: !collapsed })
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(block.title || "")
  const inputRef = useRef<HTMLInputElement>(null)
  const level = block.level ?? 2

  const handleStartEdit = () => {
    if (!editable) return
    setEditTitle(block.title || "")
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleFinishEdit = () => {
    setEditing(false)
    if (editTitle.trim() !== (block.title || "")) {
      onUpdate?.({ title: editTitle.trim() || "Untitled Section" })
    }
  }

  return (
    <div className="group/section">
      <div className="flex items-center gap-1">
        {editable && (
          <button className="opacity-0 group-hover/section:opacity-30 hover:!opacity-100 p-0.5 text-muted-foreground cursor-grab transition-opacity duration-100">
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={toggleCollapsed}
          className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors duration-100"
        >
          {collapsed
            ? <ChevronRight className="h-3.5 w-3.5" />
            : <ChevronDown className="h-3.5 w-3.5" />
          }
        </button>

        {sectionNumber && (
          <span className={cn(
            "shrink-0 font-semibold text-accent/50 tabular-nums",
            level === 2 && "text-lg",
            level === 3 && "text-base",
            level >= 4 && "text-sm",
          )}>
            {sectionNumber}.
          </span>
        )}

        {editing ? (
          <input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleFinishEdit}
            onKeyDown={(e) => { if (e.key === "Enter") handleFinishEdit(); if (e.key === "Escape") { setEditing(false) } }}
            className={cn(
              "flex-1 bg-transparent outline-none border-b border-accent/40 font-semibold text-foreground",
              level === 2 && "text-lg",
              level === 3 && "text-base",
              level >= 4 && "text-sm",
            )}
          />
        ) : (
          <div
            onClick={handleStartEdit}
            className={cn(
              "font-semibold text-foreground flex-1",
              level === 2 && "text-lg",
              level === 3 && "text-base",
              level >= 4 && "text-sm",
              editable && "cursor-text hover:text-accent/80 transition-colors duration-100",
            )}
          >
            {block.title || "Untitled Section"}
          </div>
        )}

        {editable && onDelete && (
          <button
            onClick={onDelete}
            className="opacity-0 group-hover/section:opacity-30 hover:!opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all duration-100"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
      {collapsed && (
        <p className="ml-7 mt-0.5 text-2xs text-muted-foreground/30 italic">Section collapsed</p>
      )}
    </div>
  )
}

/* ── Text Block ── */

function TextBlock({ block, editable, onUpdate, onDelete }: WikiBlockRendererProps) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(block.content || "")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleStartEdit = () => {
    if (!editable) return
    setEditContent(block.content || "")
    setEditing(true)
    setTimeout(() => {
      const ta = textareaRef.current
      if (ta) {
        ta.focus()
        ta.style.height = "auto"
        ta.style.height = ta.scrollHeight + "px"
      }
    }, 0)
  }

  const handleFinishEdit = () => {
    setEditing(false)
    if (editContent !== (block.content || "")) {
      onUpdate?.({ content: editContent })
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(e.target.value)
    e.target.style.height = "auto"
    e.target.style.height = e.target.scrollHeight + "px"
  }

  return (
    <div className="group/text relative">
      {editable && (
        <div className="absolute -left-6 top-1 opacity-0 group-hover/text:opacity-30 hover:!opacity-100 flex flex-col gap-0.5 transition-opacity duration-100">
          <button className="p-0.5 text-muted-foreground cursor-grab">
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          {onDelete && (
            <button onClick={onDelete} className="p-0.5 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {editing ? (
        <textarea
          ref={textareaRef}
          value={editContent}
          onChange={handleInput}
          onBlur={handleFinishEdit}
          className="w-full bg-transparent outline-none border border-accent/20 rounded-md px-3 py-2 text-[14px] leading-relaxed text-foreground/85 resize-none focus:border-accent/40"
          placeholder="Write something..."
        />
      ) : (
        <div
          onClick={handleStartEdit}
          className={cn(
            "text-[14px] leading-relaxed text-foreground/85 whitespace-pre-wrap rounded-md px-3 py-2",
            editable && "cursor-text hover:bg-white/[0.02] transition-colors duration-100",
          )}
        >
          {block.content || (
            <span className="text-muted-foreground/30 italic">Write something...</span>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Note Reference Block ── */

function NoteRefBlock({ block, editable, onUpdate, onDelete }: WikiBlockRendererProps) {
  const notes = usePlotStore((s) => s.notes)
  const note = useMemo(() => notes.find((n) => n.id === block.noteId), [notes, block.noteId])
  const [picking, setPicking] = useState(!block.noteId) // auto-open picker if no note selected
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredNotes = useMemo(() => {
    if (!query.trim()) return notes.filter(n => !n.trashed).slice(0, 8)
    const q = query.toLowerCase()
    return notes
      .filter(n => !n.trashed && (n.title || "").toLowerCase().includes(q))
      .slice(0, 8)
  }, [notes, query])

  const handlePickNote = (noteId: string) => {
    onUpdate?.({ noteId })
    setPicking(false)
    setQuery("")
  }

  // Note picker mode
  if (picking && editable) {
    return (
      <div className="rounded-lg border border-accent/30 bg-card/50 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border/30 px-3 py-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setPicking(false) }}
            placeholder="Search notes to embed..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/30"
          />
          <button
            onClick={() => setPicking(false)}
            className="text-2xs text-muted-foreground/40 hover:text-muted-foreground"
          >
            Cancel
          </button>
        </div>
        <div className="max-h-48 overflow-y-auto py-1">
          {filteredNotes.length === 0 ? (
            <p className="px-3 py-3 text-center text-xs text-muted-foreground/40">No notes found</p>
          ) : (
            filteredNotes.map((n) => (
              <button
                key={n.id}
                onClick={() => handlePickNote(n.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/[0.04] transition-colors duration-75"
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                <span className="truncate text-foreground/80">{n.title || "Untitled"}</span>
                <span className="ml-auto shrink-0 text-2xs text-muted-foreground/30 capitalize">{n.status}</span>
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  // No note selected
  if (!note) {
    return (
      <div className="group/noteref rounded-lg border border-dashed border-border/50 bg-secondary/10 px-4 py-3">
        {editable ? (
          <button
            onClick={() => setPicking(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Select a note to embed
          </button>
        ) : (
          <p className="text-sm text-muted-foreground/40 italic">Note not found</p>
        )}
      </div>
    )
  }

  // Note content display
  return (
    <div className="group/noteref relative rounded-lg border border-border/40 bg-card/30 transition-colors duration-100 hover:border-accent/20">
      {editable && (
        <div className="absolute -left-6 top-3 opacity-0 group-hover/noteref:opacity-30 hover:!opacity-100 flex flex-col gap-0.5 transition-opacity duration-100">
          <button className="p-0.5 text-muted-foreground cursor-grab">
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          {onDelete && (
            <button onClick={onDelete} className="p-0.5 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-2">
        <FileText className="h-3.5 w-3.5 text-accent/60" strokeWidth={1.5} />
        <span className="text-[11px] font-medium uppercase tracking-wide text-accent/50">From Note</span>
        <span className="text-[13px] font-medium text-foreground/80 flex-1 truncate">{note.title || "Untitled"}</span>
        <button
          onClick={() => usePlotStore.getState().setSidePeekNoteId(block.noteId!)}
          className="flex items-center gap-1 text-2xs text-muted-foreground/30 hover:text-accent transition-colors"
          title="Open in side panel"
        >
          <ExternalLink className="h-3 w-3" />
          Open
        </button>
        {editable && (
          <button
            onClick={() => setPicking(true)}
            className="text-2xs text-muted-foreground/30 hover:text-muted-foreground transition-colors"
          >
            Change
          </button>
        )}
      </div>
      <div className="px-4 py-3 text-[14px] leading-relaxed text-foreground/75 whitespace-pre-wrap">
        {note.content ? (
          note.content.length > 500 ? note.content.slice(0, 500) + "..." : note.content
        ) : (
          <span className="text-muted-foreground/30 italic">Empty note</span>
        )}
      </div>
    </div>
  )
}

/* ── Image Block ── */

function ImageBlock({ block, editable, onUpdate, onDelete }: WikiBlockRendererProps) {
  const src = block.attachmentId ? `attachment://${block.attachmentId}` : ""
  const { url, loading } = useAttachmentUrl(src)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addAttachment = usePlotStore((s) => s.addAttachment)

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const buffer = await file.arrayBuffer()
    const attachmentId = addAttachment({
      noteId: "",
      name: file.name,
      type: "image",
      url: "",
      mimeType: file.type,
      size: file.size,
    })
    persistAttachmentBlob({ id: attachmentId, data: buffer })
    onUpdate?.({ attachmentId, caption: block.caption || file.name })
    e.target.value = ""
  }

  // No image yet — show upload
  if (!block.attachmentId) {
    return (
      <div className="group/image relative">
        {editable && onDelete && (
          <div className="absolute -left-6 top-2 opacity-0 group-hover/image:opacity-30 hover:!opacity-100 transition-opacity duration-100">
            <button onClick={onDelete} className="p-0.5 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} style={{ display: "none" }} />
        {editable ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-28 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border/50 bg-secondary/10 text-sm text-muted-foreground/40 hover:border-accent/30 hover:text-muted-foreground transition-colors duration-100"
          >
            <Upload className="h-4 w-4" />
            Upload image
          </button>
        ) : (
          <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-border/50 bg-secondary/10 text-xs text-muted-foreground/40">
            <ImageIcon className="h-5 w-5 mr-2" />
            No image
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="group/image relative">
      {editable && (
        <div className="absolute -left-6 top-2 opacity-0 group-hover/image:opacity-30 hover:!opacity-100 flex flex-col gap-0.5 transition-opacity duration-100">
          <button className="p-0.5 text-muted-foreground cursor-grab">
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          {onDelete && (
            <button onClick={onDelete} className="p-0.5 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
      {loading ? (
        <div className="flex h-32 items-center justify-center rounded-lg bg-secondary/30 text-xs text-muted-foreground/40">
          Loading image...
        </div>
      ) : url ? (
        <figure>
          <img src={url} alt={block.caption || ""} className="max-w-full rounded-lg" />
          {block.caption && (
            <figcaption className="mt-1.5 text-center text-xs text-muted-foreground/50">
              {block.caption}
            </figcaption>
          )}
        </figure>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border/50 bg-secondary/10 text-xs text-muted-foreground/40">
          <ImageIcon className="h-5 w-5 mr-2" />
          Image not found
        </div>
      )}
    </div>
  )
}

/* ── Add Block Button ── */

export function AddBlockButton({ onAdd }: {
  onAdd: (type: WikiBlock["type"]) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative flex items-center justify-center py-1 group/add">
      <div className="absolute inset-x-0 top-1/2 h-px bg-border/0 group-hover/add:bg-border/30 transition-colors duration-150" />
      <button
        onClick={() => setOpen(!open)}
        className="relative z-10 flex items-center gap-1 rounded-md bg-background px-2 py-0.5 text-2xs text-muted-foreground/0 group-hover/add:text-muted-foreground/40 hover:!text-muted-foreground transition-all duration-150"
      >
        <Plus className="h-3 w-3" />
        Add block
      </button>

      {open && (
        <div className="absolute top-full z-20 mt-1 rounded-lg border border-border/60 bg-popover shadow-[0_4px_12px_rgba(0,0,0,0.2)] py-1 min-w-[160px]">
          {[
            { type: "section" as const, label: "Section", desc: "Heading divider" },
            { type: "text" as const, label: "Text", desc: "Write directly" },
            { type: "note-ref" as const, label: "Note", desc: "Embed a note" },
            { type: "image" as const, label: "Image", desc: "Upload image" },
          ].map(({ type, label, desc }) => (
            <button
              key={type}
              onClick={() => { onAdd(type); setOpen(false) }}
              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/[0.04] transition-colors duration-75"
            >
              <span className="text-sm font-medium text-foreground/80">{label}</span>
              <span className="text-2xs text-muted-foreground/30">{desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
