"use client"

import { useState, useMemo, useRef, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import type { WikiBlock } from "@/lib/types"
import { useAttachmentUrl } from "@/lib/use-attachment-url"
import { persistAttachmentBlob } from "@/lib/store/helpers"
import { useWikiBlockContent, useWikiBlockContentJson } from "@/hooks/use-wiki-block-content"
import { useEditor, EditorContent } from "@tiptap/react"
import { createEditorExtensions, createRenderExtensions } from "@/components/editor/core/shared-editor-config"
import { generateHTML } from "@tiptap/html"
import { FixedToolbar } from "@/components/editor/FixedToolbar"
import { BlockDragOverlay } from "@/components/editor/dnd/block-drag-overlay"
import { saveBlockBody } from "@/lib/wiki-block-body-store"
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
import { CopySimple } from "@phosphor-icons/react/dist/ssr/CopySimple"
import { ArrowsIn } from "@/lib/editor/editor-icons"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { toast } from "sonner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { WikiInfoboxBlock } from "./wiki-infobox-block"
import { WikiTocBlock } from "./wiki-toc-block"

/* ── Cached render-only extensions for generateHTML ── */

let _renderExts: ReturnType<typeof createRenderExtensions> | null = null
function getRenderExtensions() {
  if (!_renderExts) _renderExts = createRenderExtensions()
  return _renderExts
}

/* ── Block Renderer ── */

export type WikiBlockVariant = "default" | "encyclopedia"

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
  /** Layout variant — encyclopedia renders namu-wiki style section headings */
  variant?: WikiBlockVariant
  /** Callback to toggle section collapse (encyclopedia only) */
  onToggleCollapse?: () => void
  /** Whether this section is collapsed (encyclopedia only) */
  collapsed?: boolean
  /** Footnote number offset for wiki-level sequential numbering */
  footnoteStartOffset?: number
  /** Report how many footnoteRef nodes this block contains (for offset calculation) */
  onFootnoteCount?: (blockId: string, count: number) => void
}

export function WikiBlockRenderer({ block, editable, sectionNumber, onUpdate, onDelete, dragHandleProps, articleId, onSplitSection, onMoveToArticle, variant = "default", onToggleCollapse, collapsed, footnoteStartOffset, onFootnoteCount }: WikiBlockRendererProps) {
  switch (block.type) {
    case "section":
      return <SectionBlock block={block} editable={editable} sectionNumber={sectionNumber} onUpdate={onUpdate} onDelete={onDelete} dragHandleProps={dragHandleProps} articleId={articleId} onSplitSection={onSplitSection} onMoveToArticle={onMoveToArticle} variant={variant} onToggleCollapse={onToggleCollapse} collapsed={collapsed} />
    case "text":
      return <TextBlock block={block} editable={editable} onUpdate={onUpdate} onDelete={onDelete} dragHandleProps={dragHandleProps} footnoteStartOffset={footnoteStartOffset} onFootnoteCount={onFootnoteCount} />
    case "note-ref":
      return <NoteRefBlock block={block} editable={editable} onUpdate={onUpdate} onDelete={onDelete} dragHandleProps={dragHandleProps} />
    case "image":
      return <ImageBlock block={block} editable={editable} onUpdate={onUpdate} onDelete={onDelete} dragHandleProps={dragHandleProps} />
    case "url":
      return <UrlBlock block={block} editable={editable} onUpdate={onUpdate} onDelete={onDelete} dragHandleProps={dragHandleProps} />
    case "table":
      return <TableBlock block={block} editable={editable} onUpdate={onUpdate} onDelete={onDelete} dragHandleProps={dragHandleProps} />
    case "infobox":
      return articleId ? <WikiInfoboxBlock block={block} articleId={articleId} editable={editable} onUpdate={onUpdate} onDelete={onDelete} dragHandleProps={dragHandleProps} /> : null
    case "toc":
      return articleId ? <WikiTocBlock block={block} articleId={articleId} editable={editable} onUpdate={onUpdate} onDelete={onDelete} dragHandleProps={dragHandleProps} /> : null
    default:
      return null
  }
}

/* ── Section Block ── */

function SectionBlock({ block, editable, sectionNumber, onUpdate, onDelete, dragHandleProps, articleId, onSplitSection, onMoveToArticle, variant = "default", onToggleCollapse, collapsed: externalCollapsed }: WikiBlockRendererProps) {
  const internalCollapsed = block.collapsed ?? false
  const collapsed = variant === "encyclopedia" ? (externalCollapsed ?? false) : internalCollapsed
  const toggleCollapsed = variant === "encyclopedia"
    ? () => onToggleCollapse?.()
    : () => onUpdate?.({ collapsed: !internalCollapsed })
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(block.title || "")
  const [menuOpen, setMenuOpen] = useState(false)
  const [moveSubmenuOpen, setMoveSubmenuOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const level = block.level ?? 2
  const fontScale = block.fontSize ?? 1

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
    setEditTitle(block.title || "Untitled Section")
    setEditing(true)
    setTimeout(() => {
      const el = inputRef.current
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length) }
    }, 0)
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

  const isEnc = variant === "encyclopedia"

  return (
    <div className="group/section" style={fontScale !== 1 ? { fontSize: `${fontScale}em` } : undefined}>
      <div className={cn(
        "flex items-center gap-1",
        isEnc ? "mt-10 mb-4 border-b border-white/[0.08] pb-1.5 gap-2" : "mt-8 mb-2",
      )}>
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
          <span
            className={cn(
              "shrink-0 font-semibold text-accent/80 tabular-nums",
              level === 2 && "text-[1.5em]",
              level === 3 && "text-[1.25em]",
              level >= 4 && "text-[1.125em]",
            )}
          >
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
              "flex-1 min-w-[120px] bg-transparent outline-none border-b border-accent/40 font-semibold text-foreground",
              level === 2 && "text-[1.5em]",
              level === 3 && "text-[1.25em]",
              level >= 4 && "text-[1.125em]",
            )}
          />
        ) : (
          <div
            onClick={handleStartEdit}
            className={cn(
              "font-semibold text-foreground",
              level === 2 && "text-[1.5em]",
              level === 3 && "text-[1.25em]",
              level >= 4 && "text-[1.125em]",
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
                <>
                  <button
                    onClick={() => { setMenuOpen(false); onSplitSection(block.id) }}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-foreground/80 hover:bg-active-bg transition-colors"
                  >
                    <ArrowSquareUpRight size={14} weight="regular" />
                    Move to new article
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      // Collect this section + its child blocks until next same-or-higher level section
                      if (!articleId) return
                      const store = usePlotStore.getState()
                      const article = store.wikiArticles.find((a) => a.id === articleId)
                      if (!article) return
                      const idx = article.blocks.findIndex((b) => b.id === block.id)
                      if (idx === -1) return
                      const ids = [block.id]
                      for (let i = idx + 1; i < article.blocks.length; i++) {
                        const b = article.blocks[i]
                        if (b.type === "section" && (b.level ?? 2) <= level) break
                        ids.push(b.id)
                      }
                      const newId = store.copyToNewArticle(articleId, ids, block.title || "Untitled")
                      if (newId) toast.success(`Copied "${block.title}" to new article`)
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-foreground/80 hover:bg-active-bg transition-colors"
                  >
                    <CopySimple size={14} weight="regular" />
                    Copy to new article
                  </button>
                </>
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

              {/* Font size options */}
              <div className="my-1 h-px bg-border/40" />
              <div className="px-2.5 py-1.5">
                <span className="text-2xs text-muted-foreground/50">Size</span>
                <div className="flex items-center gap-1 mt-1">
                  {[
                    { label: "S", value: 0.85 },
                    { label: "M", value: 1 },
                    { label: "L", value: 1.15 },
                    { label: "XL", value: 1.3 },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => { onUpdate?.({ fontSize: opt.value === 1 ? undefined : opt.value }); setMenuOpen(false) }}
                      className={cn(
                        "flex-1 rounded px-1.5 py-1 text-2xs font-medium transition-colors",
                        (fontScale === opt.value || (opt.value === 1 && !block.fontSize))
                          ? "bg-accent/20 text-accent"
                          : "text-foreground/60 hover:bg-active-bg"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {onDelete && (
                <>
                  <div className="my-1 h-px bg-border/40" />
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

/** Count footnoteRef nodes in a TipTap JSON document */
function countFootnoteRefsInJson(json: Record<string, unknown> | null | undefined): number {
  if (!json) return 0
  let count = 0
  function walk(node: any) {
    if (!node) return
    if (node.type === "footnoteRef") count++
    if (Array.isArray(node.content)) {
      for (const child of node.content) walk(child)
    }
  }
  walk(json)
  return count
}

function TextBlock({ block, editable, onUpdate, onDelete, dragHandleProps, footnoteStartOffset, onFootnoteCount }: WikiBlockRendererProps) {
  const { content, contentJson, loading } = useWikiBlockContentJson(block.id, block.content, block.contentJson)
  const [editing, setEditing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const editorWidth = block.editorWidth ?? null
  const editorHeight = block.editorHeight ?? null
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blockRef = useRef<HTMLDivElement>(null)
  const textFontScale = block.fontSize ?? 1

  const handleStartEdit = () => {
    if (!editable) return
    setEditing(true)
  }

  // Debounced save
  const handleChange = useCallback(
    (json: Record<string, unknown>, plainText: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        // Save to IDB
        saveBlockBody({ id: block.id, content: plainText, contentJson: json })
        // Update store
        onUpdate?.({ content: plainText, contentJson: json })
      }, 300)
    },
    [block.id, onUpdate]
  )

  // Click-outside to close editor (replaces blur — blur conflicts with drag-and-drop)
  useEffect(() => {
    if (!editing) return
    const handleMouseDown = (e: MouseEvent) => {
      if (blockRef.current?.contains(e.target as Node)) return
      // Don't close if clicking inside a tippy dropdown (suggestion menus, slash commands)
      const target = e.target as HTMLElement
      if (target.closest?.('.tippy-content, .tippy-box, [data-tippy-root], [data-radix-popper-content-wrapper], [role="menu"], [role="dialog"]')) return
      setEditing(false)
    }
    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [editing])

  // Report footnote count to parent for offset calculation
  useEffect(() => {
    if (!onFootnoteCount) return
    const count = countFootnoteRefsInJson(contentJson)
    onFootnoteCount(block.id, count)
  }, [contentJson, block.id, onFootnoteCount])

  // Build initial content for TipTap
  const initialContent = useMemo(() => {
    if (contentJson && Object.keys(contentJson).length > 0) {
      return contentJson
    }
    if (content) {
      return {
        type: "doc",
        content: content.split("\n").map((line) =>
          line.trim()
            ? { type: "paragraph", content: [{ type: "text", text: line }] }
            : { type: "paragraph" }
        ),
      }
    }
    return { type: "doc", content: [{ type: "paragraph" }] }
  }, [content, contentJson])

  const hasRichContent = !!(contentJson && Object.keys(contentJson).length > 0)

  const textSizeStyle = textFontScale !== 1 ? { fontSize: `${textFontScale}em` } : undefined

  return (
    <div ref={blockRef} className="group/text relative mb-4">
      {editable && (
        <div className="absolute -left-6 top-1 opacity-0 group-hover/text:opacity-30 hover:!opacity-100 transition-opacity duration-100">
          <button className="p-0.5 text-muted-foreground cursor-grab" {...(dragHandleProps ?? {})}>
            <DotsSixVertical size={14} weight="regular" />
          </button>
        </div>
      )}

      {/* Block actions menu */}
      {editable && (
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(true) }}
              className="absolute right-1 top-1 opacity-0 group-hover/text:opacity-30 hover:!opacity-100 p-1 text-muted-foreground hover:text-foreground transition-all duration-100 z-10"
            >
              <DotsThree size={14} weight="bold" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-44 p-1" onOpenAutoFocus={(e) => e.preventDefault()} style={{ fontSize: '13px' }}>
            <div className="px-2.5 py-1.5">
              <span className="text-2xs text-muted-foreground/50">Size</span>
              <div className="flex items-center gap-1 mt-1">
                {[
                  { label: "S", value: 0.85 },
                  { label: "M", value: 1 },
                  { label: "L", value: 1.15 },
                  { label: "XL", value: 1.3 },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => { onUpdate?.({ fontSize: opt.value === 1 ? undefined : opt.value }); setMenuOpen(false) }}
                    className={cn(
                      "flex-1 rounded px-1.5 py-1 text-2xs font-medium transition-colors",
                      (textFontScale === opt.value || (opt.value === 1 && !block.fontSize))
                        ? "bg-accent/20 text-accent"
                        : "text-foreground/60 hover:bg-active-bg"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {(block.editorWidth || block.editorHeight) && (
              <button
                onClick={() => { onUpdate?.({ editorWidth: undefined, editorHeight: undefined }); setMenuOpen(false) }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-muted-foreground hover:bg-active-bg transition-colors"
              >
                <ArrowsIn size={14} />
                Reset editor size
              </button>
            )}
            {onDelete && (
              <>
                <div className="my-1 h-px bg-border/40" />
                <button
                  onClick={() => { setMenuOpen(false); onDelete() }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-destructive hover:bg-active-bg transition-colors"
                >
                  <Trash size={14} weight="regular" />
                  Delete block
                </button>
              </>
            )}
          </PopoverContent>
        </Popover>
      )}

      {editing && !loading ? (
        <WikiTextEditor
          key={block.id}
          content={initialContent}
          onChange={handleChange}
          style={textSizeStyle}
          footnoteStartOffset={footnoteStartOffset}
          editorWidth={editorWidth}
          editorHeight={editorHeight}
          onEditorResize={(w, h) => onUpdate?.({ editorWidth: w, editorHeight: h })}
        />
      ) : (
        <div
          onClick={handleStartEdit}
          className={cn(
            "rounded-md px-3 py-2 wiki-text-display",
            editable && "cursor-text hover:bg-hover-bg transition-colors duration-100",
          )}
          style={textSizeStyle}
        >
          {hasRichContent ? (
            <ReadOnlyBlock content={initialContent} footnoteStartOffset={footnoteStartOffset} />
          ) : (
            <div className="prose dark:prose-invert max-w-none text-base leading-relaxed text-foreground/85 whitespace-pre-wrap">
              {content || <span className="text-muted-foreground/30 italic">Write something...</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Read-only TipTap renderer — renders all custom nodes (Table, Callout, Toggle, etc.) correctly */
function ReadOnlyBlock({ content, footnoteStartOffset = 0 }: { content: Record<string, unknown>; footnoteStartOffset?: number }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: createEditorExtensions("wiki", { placeholder: "" }),
    content: content && Object.keys(content).length > 0 ? content : undefined,
    editable: false,
  })

  useEffect(() => {
    if (editor && footnoteStartOffset > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const storage = editor.storage as any
      storage.footnoteRef = { ...storage.footnoteRef, footnoteStartOffset }
    }
  }, [editor, footnoteStartOffset])

  if (!editor) return null

  return (
    <EditorContent
      editor={editor}
      className="w-full prose dark:prose-invert max-w-none focus:outline-none text-base leading-relaxed text-foreground/85 [&_.ProseMirror]:p-0"
    />
  )
}

/** Lazy-mounted TipTap editor for wiki TextBlock (wiki tier = base extensions only) */
function WikiTextEditor({
  content,
  onChange,
  style,
  footnoteStartOffset = 0,
  editorWidth,
  editorHeight,
  onEditorResize,
}: {
  content: Record<string, unknown>
  onChange: (json: Record<string, unknown>, plainText: string) => void
  style?: React.CSSProperties
  footnoteStartOffset?: number
  editorWidth?: number | null
  editorHeight?: number | null
  onEditorResize?: (width: number | null, height: number | null) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: createEditorExtensions("wiki", {
      placeholder: "Write something...",
    }),
    content: content && Object.keys(content).length > 0 ? content : undefined,
    editable: true,
    autofocus: "end",
    onUpdate: ({ editor: e }) => {
      onChange(
        e.getJSON() as Record<string, unknown>,
        e.getText()
      )
    },
  })

  useEffect(() => {
    if (editor && footnoteStartOffset > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const storage = editor.storage as any
      storage.footnoteRef = { ...storage.footnoteRef, footnoteStartOffset }
    }
  }, [editor, footnoteStartOffset])

  // Click on empty area → focus editor (must be before early return to keep hook order stable)
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button, input, [role="menu"]')) return
    editor?.commands.focus("end")
  }, [editor])

  if (!editor) return null

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className={`relative border border-accent/20 rounded-md focus-within:border-accent/40 transition-colors cursor-text overflow-visible block-resize-wrapper ${isResizing ? 'is-resizing' : ''}`}
      style={{
        ...style,
        ...(editorWidth ? { width: `${editorWidth}px` } : {}),
        ...(editorHeight ? { height: `${editorHeight}px`, overflow: 'hidden' } : {}),
      }}
    >
      {/* Content area */}
      <div className="pl-8 pr-3 py-2" style={{ height: editorHeight ? `calc(100% - 48px)` : undefined, overflowY: editorHeight ? 'auto' : undefined }}>
        <BlockDragOverlay editor={editor}>
          <EditorContent
            editor={editor}
            className="w-full prose dark:prose-invert max-w-none focus:outline-none text-base leading-relaxed text-foreground/85 min-h-[100px]"
          />
        </BlockDragOverlay>
      </div>
      {/* Full toolbar shared with note editor */}
      <FixedToolbar editor={editor} tier="wiki" position="bottom" />
      {/* 4-corner resize handles */}
      {onEditorResize && (
        <>
          {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((corner) => {
            const signX = corner.includes("left") ? -1 : 1
            const signY = corner.includes("top") ? -1 : 1
            const cls = `block-resize-corner block-resize-corner--${corner === "top-left" ? "tl" : corner === "top-right" ? "tr" : corner === "bottom-left" ? "bl" : "br"}`
            return (
              <div
                key={corner}
                className={cls}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const startX = e.clientX
                  const startY = e.clientY
                  const startW = containerRef.current?.offsetWidth ?? editorWidth ?? 400
                  const startH = containerRef.current?.offsetHeight ?? editorHeight ?? 200
                  setIsResizing(true)

                  const onMove = (ev: MouseEvent) => {
                    const newW = Math.max(200, startW + (ev.clientX - startX) * signX)
                    const newH = Math.max(120, startH + (ev.clientY - startY) * signY)
                    onEditorResize(newW, newH)
                  }
                  const onUp = () => {
                    setIsResizing(false)
                    document.removeEventListener("mousemove", onMove)
                    document.removeEventListener("mouseup", onUp)
                  }
                  document.addEventListener("mousemove", onMove)
                  document.addEventListener("mouseup", onUp)
                }}
              />
            )
          })}
        </>
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
  const [menuOpen, setMenuOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load note body from IDB for rich rendering — re-fetch when note is updated
  const noteUpdatedAt = note?.updatedAt
  const [noteBodyJson, setNoteBodyJson] = useState<Record<string, unknown> | null>(null)
  const [noteBodyText, setNoteBodyText] = useState<string>("")
  useEffect(() => {
    if (!block.noteId) return
    let cancelled = false
    import("@/lib/note-body-store").then(({ getBody }) => {
      getBody(block.noteId!).then((body) => {
        if (cancelled) return
        if (body) {
          setNoteBodyJson(body.contentJson ?? null)
          setNoteBodyText(body.content ?? "")
        }
      })
    })
    return () => { cancelled = true }
  }, [block.noteId, noteUpdatedAt])

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
        <div className="absolute -left-6 top-3 opacity-0 group-hover/noteref:opacity-30 hover:!opacity-100 transition-opacity duration-100">
          <button className="p-0.5 text-muted-foreground cursor-grab" {...(dragHandleProps ?? {})}>
            <DotsSixVertical size={14} weight="regular" />
          </button>
        </div>
      )}

      {/* Block actions menu */}
      {editable && (
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(true) }}
              className="absolute right-2 top-2 opacity-0 group-hover/noteref:opacity-30 hover:!opacity-100 p-1 text-muted-foreground hover:text-foreground transition-all duration-100 z-10"
            >
              <DotsThree size={14} weight="bold" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-44 p-1" onOpenAutoFocus={(e) => e.preventDefault()} style={{ fontSize: '13px' }}>
            <button
              onClick={() => { setMenuOpen(false); setPicking(true) }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-foreground/80 hover:bg-active-bg transition-colors"
            >
              <FileText size={14} weight="regular" />
              Change note
            </button>
            <button
              onClick={() => { setMenuOpen(false); usePlotStore.getState().openInSecondary(block.noteId!) }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-foreground/80 hover:bg-active-bg transition-colors"
            >
              <ArrowSquareOut size={14} weight="regular" />
              Open in split
            </button>
            {onDelete && (
              <>
                <div className="my-1 h-px bg-border/40" />
                <button
                  onClick={() => { setMenuOpen(false); onDelete() }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-destructive hover:bg-active-bg transition-colors"
                >
                  <Trash size={14} weight="regular" />
                  Delete block
                </button>
              </>
            )}
          </PopoverContent>
        </Popover>
      )}

      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2">
        <FileText className="text-accent/60" size={14} weight="regular" />
        <span className="text-2xs font-medium uppercase tracking-wide text-accent/80">From Note</span>
        <span className="text-note font-medium text-foreground/80 flex-1 truncate">{note.title || "Untitled"}</span>
      </div>
      <div className="px-4 py-3 text-base leading-relaxed text-foreground/75">
        {noteBodyJson && Object.keys(noteBodyJson).length > 0 ? (
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: (() => { try { return generateHTML(noteBodyJson as any, getRenderExtensions()) } catch { return "" } })() }}
          />
        ) : noteBodyText ? (
          <div className="whitespace-pre-wrap">{noteBodyText}</div>
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
  const imgRef = useRef<HTMLImageElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const addAttachment = usePlotStore((s) => s.addAttachment)

  const currentWidth = block.imageWidth ?? 100
  const SIZE_PRESETS = [
    { label: "S", value: 25 },
    { label: "M", value: 50 },
    { label: "L", value: 100 },
  ]

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
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(true) }}
                className="absolute right-1 top-1 opacity-0 group-hover/image:opacity-70 hover:!opacity-100 p-1 rounded bg-background/80 text-muted-foreground hover:text-foreground transition-all duration-100 z-10"
              >
                <DotsThree size={14} weight="bold" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-1" onOpenAutoFocus={(e) => e.preventDefault()} style={{ fontSize: '13px' }}>
              <button
                onClick={() => { setMenuOpen(false); onDelete() }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-destructive hover:bg-active-bg transition-colors"
              >
                <Trash size={14} weight="regular" />
                Delete block
              </button>
            </PopoverContent>
          </Popover>
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
        <div className="absolute -left-6 top-2 opacity-0 group-hover/image:opacity-30 hover:!opacity-100 transition-opacity duration-100">
          <button className="p-0.5 text-muted-foreground cursor-grab" {...(dragHandleProps ?? {})}>
            <DotsSixVertical size={14} weight="regular" />
          </button>
        </div>
      )}

      {/* Block actions for empty image — simple delete only */}
      {editable && !url && !loading && onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="absolute right-1 top-1 opacity-0 group-hover/image:opacity-70 hover:!opacity-100 p-1 rounded bg-background/80 text-muted-foreground hover:text-foreground transition-all duration-100 z-10"
        >
          <Trash size={14} weight="regular" />
        </button>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} style={{ display: "none" }} />
      {loading ? (
        <div className="flex h-32 items-center justify-center rounded-lg bg-secondary/30 text-2xs text-muted-foreground/40">
          Loading image...
        </div>
      ) : url ? (
        <figure className="relative inline-block" style={{ width: `${currentWidth}%` }}>
          {/* ⋯ menu inside figure — follows image size */}
          {editable && (
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
              <PopoverTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(true) }}
                  className="absolute right-1 top-1 opacity-0 group-hover/image:opacity-70 hover:!opacity-100 p-1 rounded bg-background/80 text-muted-foreground hover:text-foreground transition-all duration-100 z-10"
                >
                  <DotsThree size={14} weight="bold" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-44 p-1" onOpenAutoFocus={(e) => e.preventDefault()} style={{ fontSize: '13px' }}>
                <button
                  onClick={() => { setMenuOpen(false); fileInputRef.current?.click() }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-foreground/80 hover:bg-active-bg transition-colors"
                >
                  <UploadSimple size={14} weight="regular" />
                  Replace image
                </button>
                <div className="my-1 h-px bg-border/40" />
                <div className="flex items-center gap-1 px-2.5 py-1.5">
                  {SIZE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => { onUpdate?.({ imageWidth: preset.value }); setMenuOpen(false) }}
                      className={cn(
                        "flex-1 rounded px-2 py-0.5 text-2xs font-medium transition-colors",
                        currentWidth === preset.value
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                {onDelete && (
                  <>
                    <div className="my-1 h-px bg-border/40" />
                    <button
                      onClick={() => { setMenuOpen(false); onDelete() }}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-destructive hover:bg-active-bg transition-colors"
                    >
                      <Trash size={14} weight="regular" />
                      Delete block
                    </button>
                  </>
                )}
              </PopoverContent>
            </Popover>
          )}
          <div className="relative">
            <img
              ref={imgRef}
              src={url}
              alt={block.caption || ""}
              className="w-full rounded-lg"
            />
            {editable && (
              <div
                className="absolute right-0 bottom-0 w-3 h-3 cursor-se-resize bg-accent/50 rounded-tl-sm opacity-0 group-hover/image:opacity-100 transition-opacity"
                onMouseDown={(e) => {
                  e.preventDefault()
                  const startX = e.clientX
                  const startWidth = imgRef.current?.offsetWidth || 0
                  const containerWidth = imgRef.current?.parentElement?.parentElement?.offsetWidth || 1

                  function onMouseMove(ev: MouseEvent) {
                    const delta = ev.clientX - startX
                    const newPx = Math.max(100, startWidth + delta)
                    const newPercent = Math.round(Math.min(100, Math.max(25, (newPx / containerWidth) * 100)))
                    if (imgRef.current?.parentElement?.parentElement) {
                      (imgRef.current.parentElement.parentElement as HTMLElement).style.width = `${newPercent}%`
                    }
                  }

                  function onMouseUp(ev: MouseEvent) {
                    document.removeEventListener("mousemove", onMouseMove)
                    document.removeEventListener("mouseup", onMouseUp)
                    const delta = ev.clientX - startX
                    const newPx = Math.max(100, startWidth + delta)
                    const newPercent = Math.round(Math.min(100, Math.max(25, (newPx / containerWidth) * 100)))
                    onUpdate?.({ imageWidth: newPercent })
                  }

                  document.addEventListener("mousemove", onMouseMove)
                  document.addEventListener("mouseup", onMouseUp)
                }}
              />
            )}
          </div>
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
  const [menuOpen, setMenuOpen] = useState(false)
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
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(true) }}
                className="absolute right-1 top-1 opacity-0 group-hover/url:opacity-30 hover:!opacity-100 p-1 text-muted-foreground hover:text-foreground transition-all duration-100 z-10"
              >
                <DotsThree size={14} weight="bold" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-1" onOpenAutoFocus={(e) => e.preventDefault()} style={{ fontSize: '13px' }}>
              <button
                onClick={() => { setMenuOpen(false); onDelete() }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-destructive hover:bg-active-bg transition-colors"
              >
                <Trash size={14} weight="regular" />
                Delete block
              </button>
            </PopoverContent>
          </Popover>
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
        <div className="absolute -left-6 top-2 opacity-0 group-hover/url:opacity-30 hover:!opacity-100 transition-opacity duration-100">
          <button className="p-0.5 text-muted-foreground cursor-grab" {...(dragHandleProps ?? {})}>
            <DotsSixVertical size={14} weight="regular" />
          </button>
        </div>
      )}

      {/* Block actions menu */}
      {editable && (
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(true) }}
              className="absolute right-1 top-1 opacity-0 group-hover/url:opacity-30 hover:!opacity-100 p-1 text-muted-foreground hover:text-foreground transition-all duration-100 z-10"
            >
              <DotsThree size={14} weight="bold" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-44 p-1" onOpenAutoFocus={(e) => e.preventDefault()} style={{ fontSize: '13px' }}>
            <button
              onClick={() => { setMenuOpen(false); handleStartEdit() }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-foreground/80 hover:bg-active-bg transition-colors"
            >
              <PhLink size={14} weight="regular" />
              Edit URL
            </button>
            {onDelete && (
              <>
                <div className="my-1 h-px bg-border/40" />
                <button
                  onClick={() => { setMenuOpen(false); onDelete() }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-destructive hover:bg-active-bg transition-colors"
                >
                  <Trash size={14} weight="regular" />
                  Delete block
                </button>
              </>
            )}
          </PopoverContent>
        </Popover>
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
    </div>
  )
}

/* ── Table Block ── */

function TableBlock({ block, editable, onUpdate, onDelete, dragHandleProps }: WikiBlockRendererProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const headers = block.tableHeaders ?? []
  const rows = block.tableRows ?? []
  const aligns = block.tableColumnAligns ?? []
  const caption = block.tableCaption ?? ""

  // Editing state for inline cell editing
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null)
  const [cellValue, setCellValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when editingCell changes
  useEffect(() => {
    if (editingCell) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [editingCell])

  return (
    <div className="group/table relative mb-4">
      {/* Drag handle on left */}
      {editable && (
        <div className="absolute -left-6 top-1 opacity-0 group-hover/table:opacity-30 hover:!opacity-100 transition-opacity duration-100">
          <button className="p-0.5 text-muted-foreground cursor-grab" {...(dragHandleProps ?? {})}>
            <DotsSixVertical size={14} weight="regular" />
          </button>
        </div>
      )}

      {/* Menu on right */}
      {editable && (
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(true) }}
              className="absolute right-1 top-1 opacity-0 group-hover/table:opacity-30 hover:!opacity-100 p-1 text-muted-foreground hover:text-foreground transition-all duration-100 z-10"
            >
              <DotsThree size={14} weight="bold" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-44 p-1" onOpenAutoFocus={(e) => e.preventDefault()} style={{ fontSize: '13px' }}>
            {/* Table position */}
            <div className="px-2.5 py-1.5">
              <span className="text-2xs text-muted-foreground/50">Position</span>
              <div className="flex items-center gap-1 mt-1">
                {([
                  { label: "←", value: "left" as const },
                  { label: "↔", value: "center" as const },
                  { label: "→", value: "right" as const },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { onUpdate?.({ tableAlign: opt.value === "center" ? undefined : opt.value }); setMenuOpen(false) }}
                    className={cn(
                      "flex-1 rounded px-1.5 py-1 text-xs font-medium transition-colors",
                      (block.tableAlign ?? "center") === opt.value
                        ? "bg-accent/20 text-accent"
                        : "text-foreground/60 hover:bg-active-bg"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {onDelete && (
              <>
                <div className="my-0.5 h-px bg-border/40" />
                <button
                  onClick={() => { setMenuOpen(false); onDelete() }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-destructive hover:bg-active-bg transition-colors"
                >
                  <Trash size={14} weight="regular" />
                  Delete table
                </button>
              </>
            )}
          </PopoverContent>
        </Popover>
      )}

      <figure className="my-2">
        {/* Caption */}
        {(caption || editable) && (
          <figcaption className="text-center text-sm font-semibold text-foreground/70 mb-2">
            {editable ? (
              <input
                value={caption}
                onChange={(e) => onUpdate?.({ tableCaption: e.target.value })}
                placeholder="Table caption..."
                className="bg-transparent text-center outline-none border-b border-transparent hover:border-accent/30 focus:border-accent/50 w-full transition-colors"
              />
            ) : caption}
          </figcaption>
        )}

        {/* Table */}
        <table className={cn("border-collapse rounded-lg overflow-hidden", block.tableAlign === "left" ? "mr-auto" : block.tableAlign === "right" ? "ml-auto" : "mx-auto")} style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
          <thead>
            <tr>
              {headers.map((h, ci) => (
                <th
                  key={ci}
                  className="font-semibold text-center px-3 py-2.5 relative group/th"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    textAlign: aligns[ci] ?? 'center',
                    minWidth: 100,
                  }}
                >
                  {/* Delete column button */}
                  {editable && headers.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onUpdate?.({
                          tableHeaders: headers.filter((_, i) => i !== ci),
                          tableRows: rows.map(r => r.filter((_, i) => i !== ci)),
                          tableColumnAligns: aligns.filter((_, i) => i !== ci),
                        })
                      }}
                      className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-destructive/80 text-white text-[9px] leading-none items-center justify-center hidden group-hover/th:flex transition-all z-10"
                      title="Delete column"
                    >
                      ×
                    </button>
                  )}
                  {editable && editingCell?.row === -1 && editingCell?.col === ci ? (
                    <input
                      ref={inputRef}
                      value={cellValue}
                      onChange={(e) => setCellValue(e.target.value)}
                      onBlur={() => {
                        const newHeaders = [...headers]
                        newHeaders[ci] = cellValue
                        onUpdate?.({ tableHeaders: newHeaders })
                        setEditingCell(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Tab") {
                          e.preventDefault()
                          const newHeaders = [...headers]
                          newHeaders[ci] = cellValue
                          onUpdate?.({ tableHeaders: newHeaders })
                          if (e.key === "Tab") {
                            const nextCol = e.shiftKey ? ci - 1 : ci + 1
                            if (nextCol >= 0 && nextCol < headers.length) {
                              setCellValue(headers[nextCol])
                              setEditingCell({ row: -1, col: nextCol })
                            } else if (!e.shiftKey && rows.length > 0) {
                              setCellValue(rows[0][0] ?? "")
                              setEditingCell({ row: 0, col: 0 })
                            } else {
                              setEditingCell(null)
                            }
                          } else {
                            setEditingCell(null)
                          }
                        }
                        if (e.key === "Escape") setEditingCell(null)
                      }}
                      className="bg-transparent text-center outline-none w-full font-semibold"
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => {
                        if (!editable) return
                        setCellValue(h)
                        setEditingCell({ row: -1, col: ci })
                      }}
                      className={editable ? "cursor-text" : ""}
                    >
                      {h || (editable ? "..." : "")}
                    </span>
                  )}
                </th>
              ))}
              {/* Add column button */}
              {editable && (
                <th
                  className="w-8 cursor-pointer text-center hover:bg-white/[0.04] transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                  onClick={() => {
                    onUpdate?.({
                      tableHeaders: [...headers, `Header ${headers.length + 1}`],
                      tableRows: rows.map(r => [...r, ""]),
                      tableColumnAligns: [...aligns, "center"],
                    })
                  }}
                >
                  <PhPlus size={12} weight="regular" className="mx-auto text-muted-foreground/30" />
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="group/row relative">
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-3 py-2"
                    style={{
                      border: '1px solid rgba(255,255,255,0.12)',
                      textAlign: aligns[ci] ?? 'center',
                    }}
                  >
                    {editable && editingCell?.row === ri && editingCell?.col === ci ? (
                      <input
                        ref={inputRef}
                        value={cellValue}
                        onChange={(e) => setCellValue(e.target.value)}
                        onBlur={() => {
                          const newRows = rows.map(r => [...r])
                          newRows[ri][ci] = cellValue
                          onUpdate?.({ tableRows: newRows })
                          setEditingCell(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === "Tab") {
                            e.preventDefault()
                            const newRows = rows.map(r => [...r])
                            newRows[ri][ci] = cellValue
                            onUpdate?.({ tableRows: newRows })
                            if (e.key === "Tab") {
                              let nextRow = ri, nextCol = e.shiftKey ? ci - 1 : ci + 1
                              if (nextCol >= headers.length) { nextCol = 0; nextRow = ri + 1 }
                              if (nextCol < 0) { nextCol = headers.length - 1; nextRow = ri - 1 }
                              if (nextRow >= 0 && nextRow < rows.length) {
                                setCellValue(rows[nextRow]?.[nextCol] ?? "")
                                setEditingCell({ row: nextRow, col: nextCol })
                              } else if (nextRow === -1) {
                                setCellValue(headers[nextCol] ?? "")
                                setEditingCell({ row: -1, col: nextCol })
                              } else {
                                setEditingCell(null)
                              }
                            } else {
                              // Enter: move down
                              if (ri + 1 < rows.length) {
                                setCellValue(rows[ri + 1]?.[ci] ?? "")
                                setEditingCell({ row: ri + 1, col: ci })
                              } else {
                                setEditingCell(null)
                              }
                            }
                          }
                          if (e.key === "Escape") setEditingCell(null)
                        }}
                        className="bg-transparent outline-none w-full"
                        style={{ textAlign: aligns[ci] ?? 'center' }}
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => {
                          if (!editable) return
                          setCellValue(cell)
                          setEditingCell({ row: ri, col: ci })
                        }}
                        className={cn("block min-h-[1.2em]", editable && "cursor-text")}
                      >
                        {cell}
                      </span>
                    )}
                  </td>
                ))}
                {editable && (
                  <td
                    className="w-8 text-center cursor-pointer hover:bg-destructive/10 transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                    onClick={() => onUpdate?.({ tableRows: rows.filter((_, i) => i !== ri) })}
                    title="Delete row"
                  >
                    <span className="text-destructive/50 hover:text-destructive text-xs">×</span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add row button */}
        {editable && (
          <button
            onClick={() => {
              onUpdate?.({ tableRows: [...rows, new Array(headers.length).fill("")] })
            }}
            className="mt-1 flex w-full items-center justify-center gap-1 rounded-b-lg py-1.5 text-2xs text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-white/[0.03] transition-colors"
          >
            <PhPlus size={10} weight="regular" />
            Add row
          </button>
        )}
      </figure>
    </div>
  )
}

/* ── Add Block Button ── */

export function AddBlockButton({ onAdd, nearestSectionLevel }: {
  onAdd: (type: string, level?: number) => void
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

  const structureItems: { type: string; level?: number; label: string; desc: string }[] = [
    { type: "section", label: "Section", desc: "H2 heading divider" },
    ...(canAddSubsection
      ? [{ type: "section", level: subsectionLevel, label: "Subsection", desc: `H${subsectionLevel} under current section` }]
      : []),
    { type: "text", label: "Text", desc: "Write directly" },
    { type: "note-ref", label: "Note", desc: "Embed a note" },
    { type: "image", label: "Image", desc: "Upload image" },
    { type: "url", label: "URL", desc: "Embed a link" },
    { type: "table", label: "Table", desc: "Data table" },
    { type: "infobox", label: "Infobox", desc: "Key-value metadata" },
    { type: "toc", label: "TOC", desc: "Auto contents" },
  ]

  const contentItems: { type: string; label: string; desc: string }[] = [
    { type: "text:callout", label: "Callout", desc: "Highlighted note" },
    { type: "text:blockquote", label: "Blockquote", desc: "Quote block" },
    { type: "text:toggle", label: "Toggle", desc: "Collapsible section" },
    { type: "text:spacer", label: "Spacer", desc: "Empty space" },
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
            {structureItems.map(({ type, level, label, desc }, idx) => (
              <button
                key={`${type}-${level ?? "default"}-${idx}`}
                onClick={() => { onAdd(type, level); setOpen(false) }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-hover-bg transition-colors duration-100"
              >
                <span className="text-note font-medium text-foreground/80">{label}</span>
                <span className="text-2xs text-muted-foreground/30">{desc}</span>
              </button>
            ))}
            <div className="my-1 border-t border-white/[0.06]" />
            <div className="px-3 py-1 text-2xs text-muted-foreground/30">Content</div>
            {contentItems.map(({ type, label, desc }) => (
              <button
                key={type}
                onClick={() => { onAdd(type); setOpen(false) }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-hover-bg transition-colors duration-100"
              >
                <span className="text-note font-medium text-foreground/80">{label}</span>
                <span className="text-2xs text-muted-foreground/30">{desc}</span>
              </button>
            ))}
            <div className="my-1 border-t border-white/[0.06]" />
            <div className="px-3 py-1 text-2xs text-muted-foreground/20 italic">Use / in text for more</div>
          </div>
        </>
      )}
    </div>
  )
}
