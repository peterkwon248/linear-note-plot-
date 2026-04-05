"use client"

import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { usePlotStore } from "@/lib/store"
import { resolveNoteByTitle, resolveNoteById } from "@/lib/note-reference-actions"
import { FolderSimple } from "@phosphor-icons/react/dist/ssr/FolderSimple"
import { ArrowBendUpLeft } from "@phosphor-icons/react/dist/ssr/ArrowBendUpLeft"
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut"
import { Eye } from "@phosphor-icons/react/dist/ssr/Eye"
import { Quotes } from "@phosphor-icons/react/dist/ssr/Quotes"
import { DotsThree } from "@phosphor-icons/react/dist/ssr/DotsThree"
import { Columns } from "@phosphor-icons/react/dist/ssr/Columns"
import { Copy } from "@phosphor-icons/react/dist/ssr/Copy"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { TextT } from "@phosphor-icons/react/dist/ssr/TextT"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { ArrowsClockwise } from "@phosphor-icons/react/dist/ssr/ArrowsClockwise"
import { NoteEditorAdapter } from "@/components/editor/NoteEditorAdapter"
import { FixedToolbar } from "@/components/editor/FixedToolbar"
import { WikiArticleView } from "@/components/wiki-editor/wiki-article-view"
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

function PreviewCard({ noteId, noteType, x, y }: PreviewState) {
  const ref = useRef<HTMLDivElement>(null)
  const note = usePlotStore((s) => s.notes.find((n) => n.id === noteId))
  const wikiArticle = usePlotStore((s) => s.wikiArticles.find((a) => a.id === noteId))
  const folders = usePlotStore((s) => s.folders)
  const allNotes = usePlotStore((s) => s.notes)
  const [pos, setPos] = useState({ x, y })
  const [showMore, setShowMore] = useState(false)
  const [editing, setEditing] = useState(false)
  const [quoteActive, setQuoteActive] = useState(false)
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null)

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

  const backlinkCount = useMemo(() => {
    if (!title) return 0
    const lower = title.toLowerCase()
    return allNotes.filter((n) => !n.trashed && n.linksOut.some((l) => l.toLowerCase() === lower)).length
  }, [allNotes, title])

  // ── Quote selection tracking ──
  const bodyRef = useRef<HTMLDivElement>(null)
  const [quoteSelection, setQuoteSelection] = useState<{ text: string; rect: DOMRect } | null>(null)

  // Poll-based selection detection (more reliable than events in portal + ProseMirror context)
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return

    let rafId: number | null = null
    let isMouseDown = false

    function checkSelection() {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setQuoteSelection(null)
        return
      }
      try {
        const range = sel.getRangeAt(0)
        if (!el?.contains(range.startContainer)) {
          setQuoteSelection(null)
          return
        }
        const rect = range.getBoundingClientRect()
        if (rect.width > 0) {
          setQuoteSelection({ text: sel.toString().trim(), rect })
        }
      } catch {
        setQuoteSelection(null)
      }
    }

    function onMouseDown() {
      isMouseDown = true
    }
    function onMouseUp() {
      isMouseDown = false
      // Capture selection IMMEDIATELY before ProseMirror can steal it
      checkSelection()
      // Also check after a delay as fallback
      setTimeout(checkSelection, 50)
    }

    el.addEventListener("mousedown", onMouseDown)
    el.addEventListener("mouseup", onMouseUp)

    return () => {
      el.removeEventListener("mousedown", onMouseDown)
      el.removeEventListener("mouseup", onMouseUp)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [editing])

  const handleInsertQuote = useCallback(async () => {
    if (!quoteSelection) return

    const sel = window.getSelection()
    const range = sel?.getRangeAt(0)
    const parentText = range?.startContainer.parentElement?.textContent || ""
    const startIdx = parentText.indexOf(quoteSelection.text)
    const beforeText = startIdx > 0 ? parentText.slice(Math.max(0, startIdx - 100), startIdx).trim() : ""
    const afterText = parentText.slice(startIdx + quoteSelection.text.length, startIdx + quoteSelection.text.length + 100).trim()
    const context = [beforeText, afterText].filter(Boolean).join(" [...] ") || null
    const originalText = range?.startContainer.parentElement?.textContent || quoteSelection.text

    let sourceHash: string | null = null
    try {
      const { getBody } = await import("@/lib/note-body-store")
      const { computeSourceHash } = await import("@/lib/quote-hash")
      const body = await getBody(noteId)
      if (body?.content) sourceHash = computeSourceHash(body.content)
    } catch { /* ignore */ }

    window.dispatchEvent(new CustomEvent("plot:insert-wiki-quote", {
      detail: {
        sourceNoteId: noteId,
        sourceTitle: title,
        quotedText: quoteSelection.text,
        quotedAt: new Date().toISOString(),
        originalText,
        sourceHash,
        context,
        comment: null,
      }
    }))

    window.getSelection()?.removeAllRanges()
    setQuoteSelection(null)
    hideNotePreviewImmediate()
  }, [quoteSelection, noteId, title])

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
    store.getState().openSidePeek(noteId)
  }

  function handleSideBySide() {
    hideNotePreviewImmediate()
    store.getState().openInSecondary(noteId)
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(`[[${title}]]`)
    hideNotePreviewImmediate()
  }

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
      className={`fixed z-[9999] w-[640px] max-h-[calc(100vh-32px)] flex flex-col rounded-lg border bg-background shadow-lg overflow-hidden animate-in fade-in duration-150 transition-colors ${
        pinned ? "border-accent/40 shadow-xl" : "border-border-subtle"
      }`}
      style={{ left: pos.x, top: pos.y }}
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
          <PushPin size={10} weight="fill" />
        </button>
      )}
      {/* Header */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
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
      <div className="px-4 py-1.5 flex items-center gap-1.5 text-2xs text-muted-foreground/60">
        {folderName && (
          <>
            <FolderSimple size={10} weight="regular" />
            <span>{folderName}</span>
            <span>·</span>
          </>
        )}
        <span>{relativeTime(note?.updatedAt || "")}</span>
        {backlinkCount > 0 && (
          <>
            <span>·</span>
            <ArrowBendUpLeft size={10} />
            <span>{backlinkCount}</span>
          </>
        )}
      </div>
      {/* Body */}
      {noteType === "wiki" ? (
        <div ref={bodyRef} className="overflow-y-auto" style={{ height: 400 }}>
          <WikiArticleView
            articleId={noteId}
            editable={false}
            preview={true}
          />
        </div>
      ) : note ? (
        <>
          {editing && editorInstance && <FixedToolbar editor={editorInstance} position="top" noteId={noteId} />}
          <div ref={bodyRef} className="overflow-y-auto px-4 py-3" style={{ height: 400 }}>
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
        <button
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleOpen() }}
          className="flex items-center gap-1 rounded px-2 py-1 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
          title="Open note"
        >
          <ArrowSquareOut size={12} />
          <span>Open</span>
        </button>
        {note && (
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
        {!editing && noteType !== "wiki" && (
          <div className="relative">
            <button
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (quoteActive) {
                // 2nd click: insert quote with current selection (or all if unchanged)
                if (!quoteSelection) {
                  // Re-select all if user cleared selection
                  const bodyEl = bodyRef.current
                  if (bodyEl) {
                    const range = document.createRange()
                    range.selectNodeContents(bodyEl)
                    const sel = window.getSelection()
                    sel?.removeAllRanges()
                    sel?.addRange(range)
                    const rect = range.getBoundingClientRect()
                    if (rect.width > 0) {
                      setQuoteSelection({ text: sel?.toString().trim() || "", rect })
                    }
                  }
                  // Insert after state update
                  setTimeout(() => handleInsertQuote(), 10)
                } else {
                  handleInsertQuote()
                }
                setQuoteActive(false)
              } else {
                // 1st click: select all text in body + activate quote mode
                const bodyEl = bodyRef.current
                if (bodyEl) {
                  const range = document.createRange()
                  range.selectNodeContents(bodyEl)
                  const sel = window.getSelection()
                  sel?.removeAllRanges()
                  sel?.addRange(range)
                  const rect = range.getBoundingClientRect()
                  if (rect.width > 0) {
                    setQuoteSelection({ text: sel?.toString().trim() || "", rect })
                  }
                }
                setQuoteActive(true)
              }
            }}
            className={`flex items-center gap-1 rounded px-2 py-1 text-2xs transition-colors hover:bg-hover-bg ${
              quoteActive ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground"
            }`}
            title={quoteActive ? "Insert quote" : "Select all for quoting"}
          >
            <Quotes size={12} />
            <span>Quote</span>
          </button>
          {quoteActive && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-md bg-foreground/90 px-2.5 py-1 text-[10px] text-background shadow-lg animate-in fade-in slide-in-from-bottom-1 duration-150">
              Drag to adjust, then click Quote again
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground/90" />
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
            <DotsThree size={14} weight="bold" />
          </button>
          {showMore && (
            <div className="absolute bottom-full right-0 mb-1 w-40 rounded-md border border-border-subtle bg-surface-overlay py-1 shadow-lg">
              <button
                onMouseDown={(e) => { e.preventDefault(); handleSideBySide() }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
              >
                <Columns size={12} />
                <span>Side by side</span>
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
    </div>
  )
}


