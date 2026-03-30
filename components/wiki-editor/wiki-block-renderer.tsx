"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import type { WikiBlock } from "@/lib/types"
import { useAttachmentUrl } from "@/lib/use-attachment-url"
import { persistAttachmentBlob } from "@/lib/store/helpers"
import { useWikiBlockContent } from "@/hooks/use-wiki-block-content"
import type { DraggableSyntheticListeners } from "@dnd-kit/core"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Image as PhImage } from "@phosphor-icons/react/dist/ssr/Image"
import { DotsSixVertical } from "@phosphor-icons/react/dist/ssr/DotsSixVertical"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import { UploadSimple } from "@phosphor-icons/react/dist/ssr/UploadSimple"
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut"
import { DotsThree } from "@phosphor-icons/react/dist/ssr/DotsThree"
import { ArrowSquareUpRight } from "@phosphor-icons/react/dist/ssr/ArrowSquareUpRight"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { toast } from "sonner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

/* ── Block Renderer ── */

interface WikiBlockRendererProps {
  block: WikiBlock
  editable?: boolean
  /** Auto-computed section number (e.g., "1", "2.1") for section blocks */
  sectionNumber?: string
  onUpdate?: (patch: Partial<Omit<WikiBlock, "id">>) => void
  onDelete?: () => void
  /** Drag handle listeners from @dnd-kit/sortable — attach to GripVertical button */
  dragHandleProps?: DraggableSyntheticListeners
  /** Parent article ID — needed for unmerge and split operations */
  articleId?: string
  /** Callback to split this section (and its children) into a new article */
  onSplitSection?: (blockId: string) => void
  /** Callback to move this section to an existing article */
  onMoveToArticle?: (blockId: string, targetArticleId: string) => void
}

export function WikiBlockRenderer({ block, editable, sectionNumber, onUpdate, onDelete, dragHandleProps, articleId, onSplitSection, onMoveToArticle }: WikiBlockRendererProps) {
  switch (block.type) {
    case "section":
      return <SectionBlock block={block} editable={editable} sectionNumber={sectionNumber} onUpdate={onUpdate} onDelete={onDelete} dragHandleProps={dragHandleProps} articleId={articleId} onSplitSection={onSplitSection} onMoveToArticle={onMoveToArticle} />
    case "text":
      return <TextBlock block={block} editable={editable} onUpdate={onUpdate} onDelete={onDelete} dragHandleProps={dragHandleProps} />
    case "note-ref":
      return <NoteRefBlock block={block} editable={editable} onUpdate={onUpdate} onDelete={onDelete} dragHandleProps={dragHandleProps} />
    case "image":
      return <ImageBlock block={block} editable={editable} onUpdate={onUpdate} onDelete={onDelete} dragHandleProps={dragHandleProps} />
    case "url":
      return <UrlBlock block={block} editable={editable} onUpdate={onUpdate} onDelete={onDelete} dragHandleProps={dragHandleProps} />
    default:
      return null
  }
}

/* ── Section Block ── */

function SectionBlock({ block, editable, sectionNumber, onUpdate, onDelete, dragHandleProps, articleId, onSplitSection, onMoveToArticle }: WikiBlockRendererProps) {
  const collapsed = block.collapsed ?? false
  const toggleCollapsed = () => onUpdate?.({ collapsed: !collapsed })
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(block.title || "")
  const [menuOpen, setMenuOpen] = useState(false)
  const [moveSubmenuOpen, setMoveSubmenuOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const level = block.level ?? 2

  // Get other articles for "Move to existing article" submenu
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const otherArticles = useMemo(() => {
    return wikiArticles
      .filter((a) => a.id !== articleId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  }, [wikiArticles, articleId])

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

  const handleUnmerge = useCallback(() => {
    if (!articleId || !block.mergedFrom) return
    const store = usePlotStore.getState()
    const restoredId = store.unmergeWikiArticle(articleId, block.id)
    if (restoredId) {
      toast.success(`Unmerged "${block.mergedFrom.title}" back to separate article`)
    }
  }, [articleId, block.id, block.mergedFrom])

  return (
    <div className="group/section">
      <div className="flex items-center gap-1">
        {editable && (
          <button
            className="opacity-0 group-hover/section:opacity-30 hover:!opacity-100 p-0.5 text-muted-foreground cursor-grab transition-opacity duration-100"
            {...(dragHandleProps ?? {})}
          >
            <DotsSixVertical size={14} weight="regular" />
          </button>
        )}
        <button
          onClick={toggleCollapsed}
          className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors duration-100"
        >
          {collapsed
            ? <CaretRight size={14} weight="regular" />
            : <CaretDown size={14} weight="regular" />
          }
        </button>

        {sectionNumber && (
          <span className={cn(
            "shrink-0 font-semibold text-accent/50 tabular-nums",
            level === 2 && "text-lg",
            level === 3 && "text-ui",
            level >= 4 && "text-note",
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
              level === 3 && "text-ui",
              level >= 4 && "text-note",
            )}
          />
        ) : (
          <div
            onClick={handleStartEdit}
            className={cn(
              "font-semibold text-foreground flex-1",
              level === 2 && "text-lg",
              level === 3 && "text-ui",
              level >= 4 && "text-note",
              editable && "cursor-text hover:text-accent/80 transition-colors duration-100",
            )}
          >
            {block.title || "Untitled Section"}
          </div>
        )}

        {/* Unmerge button — shown on merge divider blocks */}
        {block.mergedFrom && articleId && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleUnmerge()
            }}
            className="ml-2 rounded-md bg-chart-3/10 px-2 py-0.5 text-2xs font-medium text-chart-3 hover:bg-chart-3/20 transition-colors"
          >
            Unmerge
          </button>
        )}

        {/* Section actions menu — shown on hover in edit mode */}
        {editable && (
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(true) }}
                className="opacity-0 group-hover/section:opacity-30 hover:!opacity-100 p-1 text-muted-foreground hover:text-foreground transition-all duration-100"
              >
                <DotsThree size={14} weight="bold" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
              {onSplitSection && (
                <button
                  onClick={() => { setMenuOpen(false); onSplitSection(block.id) }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-foreground/80 hover:bg-active-bg transition-colors"
                >
                  <ArrowSquareUpRight size={14} weight="regular" />
                  Move to new article
                </button>
              )}

              {/* Move to existing article submenu */}
              {onMoveToArticle && otherArticles.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setMoveSubmenuOpen(!moveSubmenuOpen)}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-foreground/80 hover:bg-active-bg transition-colors"
                  >
                    <ArrowSquareOut size={14} weight="regular" />
                    <span className="flex-1 text-left">Move to article</span>
                    <CaretRight size={10} weight="regular" className="text-muted-foreground/40" />
                  </button>
                  {moveSubmenuOpen && (
                    <div className="absolute left-full top-0 ml-1 w-48 rounded-lg border border-border-subtle bg-surface-overlay shadow-lg py-1 z-10">
                      {otherArticles.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => {
                            setMenuOpen(false)
                            setMoveSubmenuOpen(false)
                            onMoveToArticle(block.id, a.id)
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-foreground/80 hover:bg-active-bg transition-colors"
                        >
                          <BookOpen size={12} weight="regular" className="shrink-0 text-muted-foreground/50" />
                          <span className="truncate">{a.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Unmerge option (only if block was merged) */}
              {block.mergedFrom && articleId && (
                <>
                  {(onSplitSection || (onMoveToArticle && otherArticles.length > 0)) && <div className="my-1 h-px bg-border/40" />}
                  <button
                    onClick={() => { setMenuOpen(false); handleUnmerge() }}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-chart-3 hover:bg-active-bg transition-colors"
                  >
                    <ArrowSquareUpRight size={14} weight="regular" />
                    Unmerge section
                  </button>
                </>
              )}

              {onDelete && (
                <>
                  {(onSplitSection || block.mergedFrom || (onMoveToArticle && otherArticles.length > 0)) && <div className="my-1 h-px bg-border/40" />}
                  <button
                    onClick={() => { setMenuOpen(false); onDelete() }}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-destructive hover:bg-active-bg transition-colors"
                  >
                    <Trash size={14} weight="regular" />
                    Delete section
                  </button>
                </>
              )}
            </PopoverContent>
          </Popover>
        )}

      </div>
      {collapsed && (
        <p className="ml-7 mt-0.5 text-2xs text-muted-foreground/30 italic">Section collapsed</p>
      )}
    </div>
  )
}

/* ── Text Block ── */

function TextBlock({ block, editable, onUpdate, onDelete, dragHandleProps }: WikiBlockRendererProps) {
  const content = useWikiBlockContent(block.id, block.content)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(content || "")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleStartEdit = () => {
    if (!editable) return
    setEditContent(content || "")
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
    if (editContent !== (content || "")) {
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
          <button className="p-0.5 text-muted-foreground cursor-grab" {...(dragHandleProps ?? {})}>
            <DotsSixVertical size={14} weight="regular" />
          </button>
          {onDelete && (
            <button onClick={onDelete} className="p-0.5 text-muted-foreground hover:text-destructive">
              <Trash size={12} weight="regular" />
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
          className="w-full bg-transparent outline-none border border-accent/20 rounded-md px-3 py-2 text-note leading-relaxed text-foreground/85 resize-none focus:border-accent/40"
          placeholder="Write something..."
        />
      ) : (
        <div
          onClick={handleStartEdit}
          className={cn(
            "text-note leading-relaxed text-foreground/85 whitespace-pre-wrap rounded-md px-3 py-2",
            editable && "cursor-text hover:bg-hover-bg transition-colors duration-100",
          )}
        >
          {content || (
            <span className="text-muted-foreground/30 italic">Write something...</span>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Note Reference Block ── */

function NoteRefBlock({ block, editable, onUpdate, onDelete, dragHandleProps }: WikiBlockRendererProps) {
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
        <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2">
          <MagnifyingGlass className="text-muted-foreground/50 shrink-0" size={14} weight="regular" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setPicking(false) }}
            placeholder="MagnifyingGlass notes to embed..."
            className="flex-1 bg-transparent text-note outline-none placeholder:text-muted-foreground/30"
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
            <p className="px-3 py-3 text-center text-2xs text-muted-foreground/40">No notes found</p>
          ) : (
            filteredNotes.map((n) => (
              <button
                key={n.id}
                onClick={() => handlePickNote(n.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-note hover:bg-hover-bg transition-colors duration-100"
              >
                <FileText className="shrink-0 text-muted-foreground/50" size={14} weight="regular" />
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
      <div className="group/noteref rounded-lg border border-dashed border-border-subtle bg-secondary/10 px-4 py-3">
        {editable ? (
          <button
            onClick={() => setPicking(true)}
            className="flex items-center gap-2 text-note text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <PhPlus size={14} weight="regular" />
            Select a note to embed
          </button>
        ) : (
          <p className="text-note text-muted-foreground/40 italic">Note not found</p>
        )}
      </div>
    )
  }

  // Note content display
  return (
    <div className="group/noteref relative rounded-lg border border-border-subtle bg-card/30 transition-colors duration-100 hover:border-accent/20">
      {editable && (
        <div className="absolute -left-6 top-3 opacity-0 group-hover/noteref:opacity-30 hover:!opacity-100 flex flex-col gap-0.5 transition-opacity duration-100">
          <button className="p-0.5 text-muted-foreground cursor-grab" {...(dragHandleProps ?? {})}>
            <DotsSixVertical size={14} weight="regular" />
          </button>
          {onDelete && (
            <button onClick={onDelete} className="p-0.5 text-muted-foreground hover:text-destructive">
              <Trash size={12} weight="regular" />
            </button>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2">
        <FileText className="text-accent/60" size={14} weight="regular" />
        <span className="text-2xs font-medium uppercase tracking-wide text-accent/50">From Note</span>
        <span className="text-note font-medium text-foreground/80 flex-1 truncate">{note.title || "Untitled"}</span>
        <button
          onClick={() => usePlotStore.getState().openSidePeek(block.noteId!)}
          className="flex items-center gap-1 text-2xs text-muted-foreground/30 hover:text-accent transition-colors"
          title="Open in side panel"
        >
          <ArrowSquareOut size={12} weight="regular" />
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
      <div className="px-4 py-3 text-note leading-relaxed text-foreground/75 whitespace-pre-wrap">
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

function ImageBlock({ block, editable, onUpdate, onDelete, dragHandleProps }: WikiBlockRendererProps) {
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
              <Trash size={12} weight="regular" />
            </button>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} style={{ display: "none" }} />
        {editable ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-28 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-subtle bg-secondary/10 text-note text-muted-foreground/40 hover:border-accent/30 hover:text-muted-foreground transition-colors duration-100"
          >
            <UploadSimple size={16} weight="regular" />
            UploadSimple image
          </button>
        ) : (
          <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-secondary/10 text-2xs text-muted-foreground/40">
            <PhImage className="mr-2" size={20} weight="regular" />
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
          <button className="p-0.5 text-muted-foreground cursor-grab" {...(dragHandleProps ?? {})}>
            <DotsSixVertical size={14} weight="regular" />
          </button>
          {onDelete && (
            <button onClick={onDelete} className="p-0.5 text-muted-foreground hover:text-destructive">
              <Trash size={12} weight="regular" />
            </button>
          )}
        </div>
      )}
      {loading ? (
        <div className="flex h-32 items-center justify-center rounded-lg bg-secondary/30 text-2xs text-muted-foreground/40">
          Loading image...
        </div>
      ) : url ? (
        <figure>
          <img src={url} alt={block.caption || ""} className="max-w-full rounded-lg" />
          {block.caption && (
            <figcaption className="mt-1.5 text-center text-2xs text-muted-foreground/50">
              {block.caption}
            </figcaption>
          )}
        </figure>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-secondary/10 text-2xs text-muted-foreground/40">
          <PhImage className="mr-2" size={20} weight="regular" />
          Image not found
        </div>
      )}
    </div>
  )
}

/* ── URL Block ── */

function getYoutubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

function UrlBlock({ block, editable, onUpdate, onDelete, dragHandleProps }: WikiBlockRendererProps) {
  const [editing, setEditing] = useState(false)
  const [editUrl, setEditUrl] = useState(block.url || "")
  const [editTitle, setEditTitle] = useState(block.urlTitle || "")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleStartEdit = () => {
    if (!editable) return
    setEditUrl(block.url || "")
    setEditTitle(block.urlTitle || "")
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleFinishEdit = () => {
    setEditing(false)
    if (editUrl.trim() !== (block.url || "") || editTitle.trim() !== (block.urlTitle || "")) {
      onUpdate?.({ url: editUrl.trim(), urlTitle: editTitle.trim() })
    }
  }

  // Edit mode
  if (editing) {
    return (
      <div className="group/url relative rounded-lg border border-accent/30 bg-card/50 p-3 space-y-2">
        <input
          ref={inputRef}
          value={editUrl}
          onChange={(e) => setEditUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleFinishEdit(); if (e.key === "Escape") { setEditing(false) } }}
          placeholder="https://..."
          className="w-full bg-transparent outline-none border-b border-accent/20 pb-1 text-note text-foreground/85 placeholder:text-muted-foreground/30"
        />
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleFinishEdit(); if (e.key === "Escape") { setEditing(false) } }}
          onBlur={handleFinishEdit}
          placeholder="Label (optional)"
          className="w-full bg-transparent outline-none border-b border-accent/10 pb-1 text-2xs text-muted-foreground/60 placeholder:text-muted-foreground/30"
        />
      </div>
    )
  }

  // No URL yet
  if (!block.url) {
    return (
      <div className="group/url relative">
        {editable && onDelete && (
          <div className="absolute -left-6 top-2 opacity-0 group-hover/url:opacity-30 hover:!opacity-100 transition-opacity duration-100">
            <button onClick={onDelete} className="p-0.5 text-muted-foreground hover:text-destructive">
              <Trash size={12} weight="regular" />
            </button>
          </div>
        )}
        {editable ? (
          <button
            onClick={handleStartEdit}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-subtle bg-secondary/10 text-note text-muted-foreground/40 hover:border-accent/30 hover:text-muted-foreground transition-colors duration-100"
          >
            <PhLink size={16} weight="regular" />
            Add URL
          </button>
        ) : (
          <div className="flex h-14 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-secondary/10 text-2xs text-muted-foreground/40">
            <PhLink className="mr-2" size={16} weight="regular" />
            No URL
          </div>
        )}
      </div>
    )
  }

  const youtubeId = getYoutubeVideoId(block.url)

  return (
    <div className="group/url relative">
      {editable && (
        <div className="absolute -left-6 top-2 opacity-0 group-hover/url:opacity-30 hover:!opacity-100 flex flex-col gap-0.5 transition-opacity duration-100">
          <button className="p-0.5 text-muted-foreground cursor-grab" {...(dragHandleProps ?? {})}>
            <DotsSixVertical size={14} weight="regular" />
          </button>
          {onDelete && (
            <button onClick={onDelete} className="p-0.5 text-muted-foreground hover:text-destructive">
              <Trash size={12} weight="regular" />
            </button>
          )}
        </div>
      )}

      {youtubeId ? (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-white/[0.08]">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <a
          href={block.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]"
        >
          <PhLink size={16} className="shrink-0 text-white/40" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-2xs font-medium text-white/80">
              {block.urlTitle || block.url}
            </div>
            <div className="truncate text-2xs text-white/40">{block.url}</div>
          </div>
        </a>
      )}

      {editable && (
        <button
          onClick={handleStartEdit}
          className="mt-1 text-2xs text-muted-foreground/30 hover:text-muted-foreground transition-colors"
        >
          Edit URL
        </button>
      )}
    </div>
  )
}

/* ── Add Block Button ── */

export function AddBlockButton({ onAdd, nearestSectionLevel }: {
  onAdd: (type: WikiBlock["type"], level?: number) => void
  /** Level of the nearest section block above this insertion point (2, 3, or 4) */
  nearestSectionLevel?: number
}) {
  const [open, setOpen] = useState(false)

  // Subsection level = nearest section level + 1, capped at 4, minimum 3
  const subsectionLevel = nearestSectionLevel != null
    ? Math.min(nearestSectionLevel + 1, 4)
    : 3

  // Only show Subsection option when a parent section exists and it's below max depth
  const canAddSubsection = nearestSectionLevel != null && nearestSectionLevel < 4

  const items: { type: WikiBlock["type"]; level?: number; label: string; desc: string }[] = [
    { type: "section", label: "Section", desc: "H2 heading divider" },
    ...(canAddSubsection
      ? [{ type: "section" as const, level: subsectionLevel, label: "Subsection", desc: `H${subsectionLevel} under current section` }]
      : []),
    { type: "text", label: "Text", desc: "Write directly" },
    { type: "note-ref", label: "Note", desc: "Embed a note" },
    { type: "image", label: "Image", desc: "Upload image" },
    { type: "url", label: "URL", desc: "Embed a link" },
  ]

  return (
    <div className="relative flex items-center justify-center py-1 group/add">
      <div className="absolute inset-x-0 top-1/2 h-px bg-border/0 group-hover/add:bg-border/30 transition-colors duration-150" />
      <button
        onClick={() => setOpen(!open)}
        className="relative z-10 flex items-center gap-1 rounded-md bg-background px-2 py-0.5 text-2xs text-muted-foreground/0 group-hover/add:text-muted-foreground/40 hover:!text-muted-foreground transition-all duration-150"
      >
        <PhPlus size={12} weight="regular" />
        Add block
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full z-20 mt-1 rounded-lg border border-border-subtle bg-surface-overlay shadow-[0_4px_12px_rgba(0,0,0,0.2)] py-1 min-w-[180px]">
            {items.map(({ type, level, label, desc }, idx) => (
              <button
                key={`${type}-${level ?? "default"}-${idx}`}
                onClick={() => { onAdd(type, level); setOpen(false) }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-hover-bg transition-colors duration-100"
              >
                <span className="text-note font-medium text-foreground/80">{label}</span>
                <span className="text-2xs text-muted-foreground/30">{desc}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
