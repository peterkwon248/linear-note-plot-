"use client"

import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { usePlotStore } from "@/lib/store"
import { resolveNoteByTitle, resolveNoteById } from "@/lib/note-reference-actions"
import {
  FolderSimple, ArrowBendUpLeft, ArrowSquareOut, Eye, DotsThree, Columns, Copy,
  PencilSimple, X as PhX, TextT, PushPin, ArrowsClockwise, Cube, BookOpen, Link,
} from "@/lib/editor/editor-icons"
import { NoteEditorAdapter } from "@/components/editor/NoteEditorAdapter"
import { FixedToolbar } from "@/components/editor/FixedToolbar"
import { WikiArticleView } from "@/components/wiki-editor/wiki-article-view"
import { WikiArticleEncyclopedia } from "@/components/wiki-editor/wiki-article-encyclopedia"
import type { Editor } from "@tiptap/react"

// ── Types ─────────────────────────────────────────────────────────

interface PreviewState {
  noteId: string
  noteType: "note" | "wiki"
  x: number
  y: number
}

// ── Singleton controller ──────────────────────────────────────────

let _showTimer: ReturnType<typeof setTimeout> | null = null
let _hideTimer: ReturnType<typeof setTimeout> | null = null
let _listeners = new Set<() => void>()
let _state: PreviewState | null = null

function notify() {
  for (const fn of _listeners) fn()
}

function clearTimers() {
  if (_showTimer) { clearTimeout(_showTimer); _showTimer = null }
  if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null }
}

/** Show preview after 300ms delay. Ignored if currently pinned. */
export function showNotePreview(target: HTMLElement, noteId: string, noteType: "note" | "wiki") {
  if (_pinned) return
  clearTimers()
  _showTimer = setTimeout(() => {
    const rect = target.getBoundingClientRect()
    _state = {
      noteId,
      noteType,
      x: rect.left,
      y: rect.bottom + 4,
    }
    notify()
  }, 300)
}

/** Show preview by resolving a title first */
export function showNotePreviewByTitle(target: HTMLElement, title: string) {
  const resolved = resolveNoteByTitle(title)
  if (resolved) {
    showNotePreview(target, resolved.id, resolved.type)
  }
}

/** Show preview by resolving an id first */
export function showNotePreviewById(target: HTMLElement, id: string) {
  const resolved = resolveNoteById(id)
  if (resolved) {
    showNotePreview(target, resolved.id, resolved.type)
  }
}

/** Hide preview after 200ms delay (cancellable by re-enter). Skipped if pinned. */
export function hideNotePreview() {
  if (_pinned) return
  clearTimers()
  _hideTimer = setTimeout(() => {
    _state = null
    notify()
  }, 200)
}

/** Cancel hide (when mouse enters the preview itself) */
export function cancelHidePreview() {
  if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null }
}

/** Immediately hide (on click etc) */
export function hideNotePreviewImmediate() {
  clearTimers()
  _state = null
  _pinned = false
  notify()
}

// ── Pin state (module-level so WikilinkDecoration can access) ────
let _pinned = false
let _pinListeners = new Set<() => void>()

function notifyPin() {
  for (const fn of _pinListeners) fn()
}

/** Toggle pin state. Returns new pinned value. */
export function togglePreviewPin(): boolean {
  _pinned = !_pinned
  notifyPin()
  return _pinned
}

/** Check if preview is currently showing for a given noteId */
export function isPreviewShowing(noteId?: string): boolean {
  if (!_state) return false
  return noteId ? _state.noteId === noteId : true
}

export function isPreviewPinned(): boolean {
  return _pinned
}

/** Switch the preview to a different note (keeps position and pin state) */
export function switchPreviewNote(noteId: string, noteType: "note" | "wiki") {
  if (!_state) return
  _state = { ..._state, noteId, noteType }
  notify()
}

// ── React component ───────────────────────────────────────────────

export function NoteHoverPreview() {
  const [state, setState] = useState<PreviewState | null>(null)

  useEffect(() => {
    const listener = () => setState(_state)
    _listeners.add(listener)
    return () => { _listeners.delete(listener) }
  }, [])

  if (!state) return null

  return createPortal(
    <PreviewCard
      noteId={state.noteId}
      noteType={state.noteType}
      x={state.x}
      y={state.y}
    />,
    document.body
  )
}

function relativeTime(dateStr: string): string {
  if (!dateStr) return ""
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// Module-level size memory (persists across show/hide within session)
let _cardWidth = 640
let _cardHeight: number | null = null

function PreviewCard({ noteId, noteType, x, y }: PreviewState) {
  const ref = useRef<HTMLDivElement>(null)
  const note = usePlotStore((s) => s.notes.find((n) => n.id === noteId))
  const wikiArticle = usePlotStore((s) => s.wikiArticles.find((a) => a.id === noteId))
  const folders = usePlotStore((s) => s.folders)
  const allNotes = usePlotStore((s) => s.notes)
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const [pos, setPos] = useState({ x, y })
  const [cardSize, setCardSize] = useState({ w: _cardWidth, h: _cardHeight })
  const [showMore, setShowMore] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [showBacklinks, setShowBacklinks] = useState(false)
  const [showBlocks, setShowBlocks] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [showSectionPicker, setShowSectionPicker] = useState(false)
  const [selectedSectionIds, setSelectedSectionIds] = useState<Set<string>>(new Set())

  // Pin state: synced from module-level _pinned via listener
  const [pinned, setPinnedLocal] = useState(_pinned)
  useEffect(() => {
    const listener = () => setPinnedLocal(_pinned)
    _pinListeners.add(listener)
    return () => { _pinListeners.delete(listener) }
  }, [])
  const title = note?.title || wikiArticle?.title || "Untitled"
  const status = note?.status

  const store = usePlotStore

  // ── Derived metadata ──
  const folderName = useMemo(() => {
    if (!note?.folderId) return null
    return folders.find((f) => f.id === note.folderId)?.name || null
  }, [note?.folderId, folders])

  const backlinks = useMemo(() => {
    if (!title) return []
    const lower = title.toLowerCase()
    return allNotes.filter((n) => !n.trashed && n.linksOut.some((l) => l.toLowerCase() === lower))
  }, [allNotes, title])

  const backlinkCount = backlinks.length

  // ── Close backlinks dropdown on outside click ──
  useEffect(() => {
    if (!showBacklinks) return
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowBacklinks(false)
      }
    }
    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [showBacklinks])

  // ── Action handlers ──
  function handleOpen() {
    hideNotePreviewImmediate()
    if (noteType === "wiki") {
      import("@/lib/table-route").then(({ setActiveRoute }) => {
        setActiveRoute("/wiki")
      })
      import("@/lib/wiki-article-nav").then(({ navigateToWikiArticle }) => {
        navigateToWikiArticle(noteId)
      })
    } else {
      import("@/lib/table-route").then(({ setActiveRoute }) => {
        setActiveRoute("/notes")
      })
      store.getState().openNote(noteId)
    }
  }

  function handlePeek() {
    hideNotePreviewImmediate()
    store.getState().openSidePeek({ type: noteType, id: noteId })
  }

  function handleSideBySide() {
    hideNotePreviewImmediate()
    store.getState().openInSecondary(noteId)
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(`[[${title}]]`)
    hideNotePreviewImmediate()
  }

  // ── Resize handlers ──
  const resizing = useRef(false)
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 })

  const onResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizing.current = true
    const rect = ref.current!.getBoundingClientRect()
    resizeStart.current = { x: e.clientX, y: e.clientY, w: rect.width, h: rect.height }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!resizing.current) return
    const dx = e.clientX - resizeStart.current.x
    const dy = e.clientY - resizeStart.current.y
    const newW = Math.max(400, Math.min(960, resizeStart.current.w + dx))
    const newH = Math.max(300, resizeStart.current.h + dy)
    setCardSize({ w: newW, h: newH })
    _cardWidth = newW
    _cardHeight = newH
  }, [])

  const onResizePointerUp = useCallback(() => { resizing.current = false }, [])

  // ── Drag handlers (pinned only) ──
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 })

  const onDragPointerDown = useCallback((e: React.PointerEvent) => {
    if (!pinned) return
    if ((e.target as HTMLElement).closest("button")) return // don't drag from buttons
    e.preventDefault()
    dragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY, posX: pos.x, posY: pos.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [pinned, pos.x, pos.y])

  const onDragPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setPos({ x: dragStart.current.posX + dx, y: dragStart.current.posY + dy })
  }, [])

  const onDragPointerUp = useCallback(() => { dragging.current = false }, [])

  // Adjust position to stay within viewport
  const adjustPosition = useCallback(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let newX = x
    let newY = y

    // Clamp horizontal
    if (newX + rect.width > vw - 16) newX = vw - rect.width - 16
    if (newX < 16) newX = 16

    // Clamp vertical — prefer below, flip above if needed, then clamp to viewport
    if (newY + rect.height > vh - 16) {
      newY = y - rect.height - 8
    }
    if (newY < 16) newY = 16
    // If card is taller than viewport, pin to top
    if (rect.height > vh - 32) newY = 16

    if (newX !== pos.x || newY !== pos.y) {
      setPos({ x: newX, y: newY })
    }
  }, [x, y, pos.x, pos.y])

  useEffect(() => {
    adjustPosition()
    // Re-adjust after content renders (new note content may change card height)
    const timer = setTimeout(adjustPosition, 100)
    return () => clearTimeout(timer)
  }, [adjustPosition, editing, noteId])

  return (
    <div
      ref={ref}
      onMouseEnter={cancelHidePreview}
      onMouseLeave={pinned ? undefined : hideNotePreview}
      data-hover-preview
      className={`fixed z-[9999] flex flex-col rounded-lg border bg-background shadow-lg overflow-hidden animate-in fade-in duration-150 transition-colors ${
        pinned ? "border-accent/40 shadow-xl" : "border-border-subtle"
      }`}
      style={{
        left: pos.x,
        top: pos.y,
        width: cardSize.w,
        ...(cardSize.h ? { height: cardSize.h } : { maxHeight: 'calc(100vh - 32px)' }),
      }}
    >
      {/* Pin indicator */}
      {pinned && (
        <button
          data-pin-button
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
          onClick={(e) => { e.stopPropagation(); _pinned = false; notifyPin() }}
          className="absolute top-2 right-2 z-10 flex items-center justify-center rounded-full bg-accent/10 p-1 text-accent transition-colors hover:bg-accent/20"
          title="Unpin"
        >
          <PushPin size={10} />
        </button>
      )}
      {/* Header (draggable when pinned) */}
      <div
        className={`px-4 pt-3 pb-1 flex items-center gap-2 ${pinned ? "cursor-grab active:cursor-grabbing" : ""}`}
        onPointerDown={onDragPointerDown}
        onPointerMove={onDragPointerMove}
        onPointerUp={onDragPointerUp}
      >
        {noteType === "wiki" && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium shrink-0">
            Wiki
          </span>
        )}
        {status && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium shrink-0 capitalize">
            {status}
          </span>
        )}
        <span className="text-note font-medium text-foreground truncate">
          {title}
        </span>
      </div>
      {/* Metadata */}
      <div className="relative px-4 py-1.5 flex items-center gap-1.5 text-2xs text-muted-foreground/60">
        {folderName && (
          <>
            <FolderSimple size={10} />
            <span>{folderName}</span>
            <span>·</span>
          </>
        )}
        <span>{relativeTime(note?.updatedAt || wikiArticle?.updatedAt || "")}</span>
        {backlinkCount > 0 && (
          <>
            <span>·</span>
            <button
              onClick={(e) => { e.stopPropagation(); setShowBacklinks((prev) => !prev) }}
              className="inline-flex items-center gap-0.5 hover:text-foreground transition-colors cursor-pointer"
              title="Show referencing notes"
            >
              <Link size={10} />
              <span>{backlinkCount}</span>
            </button>
            {showBacklinks && (
              <div className="absolute left-4 top-full mt-1 w-64 rounded-md border border-border-subtle bg-surface-overlay py-1 shadow-lg z-20">
                <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                  Referenced by
                </p>
                {backlinks.slice(0, 10).map((n) => (
                  <button
                    key={n.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowBacklinks(false)
                      import("@/lib/table-route").then(({ setActiveRoute }) => setActiveRoute("/notes"))
                      usePlotStore.getState().openNote(n.id)
                      hideNotePreviewImmediate()
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
                  >
                    <span className="truncate">{n.title || "Untitled"}</span>
                    <span className="ml-auto shrink-0 text-[10px] text-muted-foreground/40 capitalize">{n.status}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {noteType === "wiki" && wikiArticle && (
          <>
            {wikiArticle.blocks.length > 0 && (
              <>
                <span>·</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowBlocks(prev => !prev); setShowCategories(false); setShowBacklinks(false) }}
                  className="inline-flex items-center gap-0.5 hover:text-foreground transition-colors cursor-pointer"
                  title="Show blocks"
                >
                  <Cube size={10} />
                  <span>{wikiArticle.blocks.length}</span>
                </button>
                {showBlocks && (
                  <div className="absolute left-4 top-full mt-1 w-56 rounded-md border border-border-subtle bg-surface-overlay py-1 shadow-lg z-20 max-h-48 overflow-y-auto">
                    <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                      Blocks
                    </p>
                    {wikiArticle.blocks.map((b) => (
                      <div key={b.id} className="flex items-center gap-2 px-3 py-1 text-2xs text-muted-foreground">
                        <span className="shrink-0 text-[10px] text-muted-foreground/40 uppercase w-12">{b.type}</span>
                        <span className="truncate">{b.title || b.content?.slice(0, 40) || "—"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {(wikiArticle.categoryIds?.length ?? 0) > 0 && (
              <>
                <span>·</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowCategories(prev => !prev); setShowBlocks(false); setShowBacklinks(false) }}
                  className="inline-flex items-center gap-0.5 hover:text-foreground transition-colors cursor-pointer"
                  title="Show categories"
                >
                  <FolderSimple size={10} />
                  <span>{wikiArticle.categoryIds!.length}</span>
                </button>
                {showCategories && (
                  <div className="absolute left-4 top-full mt-1 w-auto min-w-48 max-w-72 rounded-md border border-border-subtle bg-surface-overlay py-1 shadow-lg z-20">
                    <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                      Categories
                    </p>
                    {wikiArticle.categoryIds!.map((catId) => {
                      const cat = wikiCategories.find((c: { id: string }) => c.id === catId)
                      return (
                        <div key={catId} className="px-3 py-1.5 text-2xs text-muted-foreground whitespace-nowrap">
                          {cat?.name || catId}
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
      {/* Body */}
      {noteType === "wiki" && wikiArticle ? (
        <div ref={bodyRef} className="flex-1 overflow-y-auto min-h-[200px]">
          <WikiArticleEncyclopedia
            article={wikiArticle}
            isEditing={editing}
            onBack={() => {}}
          />
        </div>
      ) : note ? (
        <>
          {editing && editorInstance && <FixedToolbar editor={editorInstance} position="top" noteId={noteId} />}
          <div ref={bodyRef} className="flex-1 overflow-y-auto px-4 py-3 min-h-[200px]">
            <NoteEditorAdapter
              key={noteId}
              note={note}
              editable={editing}
              onEditorReady={(ed) => setEditorInstance(ed as Editor)}
            />
          </div>
        </>
      ) : (
        <div className="px-4 pb-3">
          <p className="text-2xs text-muted-foreground/50 italic">Empty note</p>
        </div>
      )}
      {/* Floating Quote button removed — Quote is now in action bar with select-all-first UX */}
      {/* Action bar */}
      <div data-action-bar className="flex items-center gap-0.5 px-3 py-1.5 border-t border-border-subtle">
        {/* Pin button */}
        <button
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            togglePreviewPin()
          }}
          className={`flex items-center gap-1 rounded px-2 py-1 text-2xs transition-colors hover:bg-hover-bg ${
            pinned ? "text-accent" : "text-muted-foreground hover:text-foreground"
          }`}
          title={pinned ? "Unpin preview" : "Pin preview"}
        >
          <PushPin size={12} />
          <span>{pinned ? "Unpin" : "Pin"}</span>
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleOpen() }}
          className="flex items-center gap-1 rounded px-2 py-1 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
          title="Open note"
        >
          <ArrowSquareOut size={12} />
          <span>Open</span>
        </button>
        {(note || noteType === "wiki") && (
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (editing) {
                setEditing(false)
                setEditorInstance(null)
              } else {
                setEditing(true)
              }
            }}
            className={`flex items-center gap-1 rounded px-2 py-1 text-2xs transition-colors hover:bg-hover-bg ${
              editing ? "text-accent" : "text-muted-foreground hover:text-foreground"
            }`}
            title={editing ? "Switch to preview" : "Edit inline"}
          >
            {editing ? <Eye size={12} /> : <PencilSimple size={12} />}
            <span>{editing ? "Preview" : "Edit"}</span>
          </button>
        )}
        {/* Wiki: Embed button + section picker */}
        {!editing && noteType === "wiki" && wikiArticle && (
          <div className="relative">
            <button
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (showSectionPicker) {
                  // Insert embed with selected sections
                  const sectionIds = selectedSectionIds.size > 0 ? Array.from(selectedSectionIds) : null
                  window.dispatchEvent(new CustomEvent("plot:insert-wiki-embed", {
                    detail: { articleId: noteId, sectionIds }
                  }))
                  setShowSectionPicker(false)
                  setSelectedSectionIds(new Set())
                  hideNotePreviewImmediate()
                } else {
                  setShowSectionPicker(true)
                }
              }}
              className={`flex items-center gap-1 rounded px-2 py-1 text-2xs transition-colors hover:bg-hover-bg ${
                showSectionPicker ? "bg-teal-500/10 text-teal-500" : "text-muted-foreground hover:text-foreground"
              }`}
              title={showSectionPicker ? "Insert embed" : "Embed wiki article"}
            >
              <BookOpen size={12} />
              <span>{showSectionPicker ? (selectedSectionIds.size > 0 ? `Embed ${selectedSectionIds.size} sections` : "Embed all") : "Embed"}</span>
            </button>
            {showSectionPicker && (
              <div className="absolute bottom-full left-0 mb-1.5 w-56 rounded-md border border-border-subtle bg-surface-overlay py-1.5 shadow-lg animate-in fade-in slide-in-from-bottom-1 duration-150">
                <div className="px-3 pb-1.5 text-[10px] text-muted-foreground/60 uppercase tracking-wider">Select sections (or embed all)</div>
                {wikiArticle.blocks
                  .filter((b) => b.type === "section")
                  .map((block) => (
                    <button
                      key={block.id}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setSelectedSectionIds((prev) => {
                          const next = new Set(prev)
                          if (next.has(block.id)) {
                            next.delete(block.id)
                          } else {
                            next.add(block.id)
                          }
                          return next
                        })
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-1 text-2xs transition-colors hover:bg-hover-bg ${
                        selectedSectionIds.has(block.id) ? "text-teal-500" : "text-muted-foreground"
                      }`}
                      style={{ paddingLeft: `${((block.level || 2) - 2) * 12 + 12}px` }}
                    >
                      <span className={`w-3 h-3 rounded-sm border flex items-center justify-center shrink-0 ${
                        selectedSectionIds.has(block.id) ? "bg-teal-500 border-teal-500" : "border-border"
                      }`}>
                        {selectedSectionIds.has(block.id) && <span className="text-[8px] text-white font-bold">✓</span>}
                      </span>
                      <span className="truncate">{block.title || "Untitled"}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
        <div className="relative ml-auto">
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowMore(!showMore) }}
            className="flex items-center rounded px-1.5 py-1 text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
            title="More actions"
          >
            <DotsThree size={14} />
          </button>
          {showMore && (
            <div className="absolute bottom-full right-0 mb-1 w-40 rounded-md border border-border-subtle bg-surface-overlay py-1 shadow-lg">
              <button
                onMouseDown={(e) => { e.preventDefault(); handleSideBySide() }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
              >
                <Columns size={12} />
                <span>Split View</span>
              </button>
              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  setShowMore(false)
                  // Trigger wikilink context menu in change-link mode at button position
                  const rect = (e.target as HTMLElement).getBoundingClientRect()
                  window.dispatchEvent(new CustomEvent("plot:wikilink-context-menu-change", {
                    detail: { title, x: rect.left, y: rect.top }
                  }))
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
              >
                <ArrowsClockwise size={12} />
                <span>Change link</span>
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); handleCopyLink() }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
              >
                <Copy size={12} />
                <span>Copy [[link]]</span>
              </button>
              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  const text = editorInstance?.getText() || note?.content || note?.preview || ""
                  if (text.trim()) {
                    navigator.clipboard.writeText(text.trim())
                    import("sonner").then(({ toast }) => toast.success("Copied as plain text"))
                  }
                  setShowMore(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
              >
                <TextT size={12} />
                <span>Copy text</span>
              </button>
              {noteType === "wiki" && (
                <button
                  onMouseDown={async (e) => {
                    e.preventDefault()
                    setShowMore(false)
                    const { wikiArticleToTipTap, wikiArticleToPlainText } = await import("@/lib/wiki-to-tiptap")
                    const article = usePlotStore.getState().wikiArticles.find((a) => a.id === noteId)
                    if (!article) return
                    const contentJson = wikiArticleToTipTap(article)
                    const content = wikiArticleToPlainText(article)
                    const newNoteId = usePlotStore.getState().createNote({
                      title: `${article.title} (copy)`,
                      content,
                      contentJson: contentJson as unknown as Record<string, unknown>,
                      status: "capture" as const,
                    })
                    if (newNoteId) {
                      const { saveBody } = await import("@/lib/note-body-store")
                      await saveBody({ id: newNoteId, content, contentJson: contentJson as unknown as Record<string, unknown> })
                      usePlotStore.getState().openNote(newNoteId)
                      import("sonner").then(({ toast }) => toast.success(`Copied "${article.title}" to new note`))
                    }
                    hideNotePreviewImmediate()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
                >
                  <Cube size={12} />
                  <span>Copy to note</span>
                </button>
              )}
            </div>
          )}
        </div>
        {(editing || pinned) && (
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditing(false); setEditorInstance(null); hideNotePreviewImmediate() }}
            className="flex items-center gap-1 rounded px-2 py-1 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
            title="Close"
          >
            <PhX size={12} />
          </button>
        )}
      </div>

      {/* Resize handle (bottom-right corner) */}
      <div
        className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-10 group flex items-end justify-end p-0.5"
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerUp}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" className="text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors">
          <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    </div>
  )
}


