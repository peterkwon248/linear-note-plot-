"use client"

import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { usePlotStore } from "@/lib/store"
import { resolveNoteByTitle, resolveNoteById } from "@/lib/note-reference-actions"
import { generateHTML } from "@tiptap/html"
import { createRenderExtensions } from "@/components/editor/core/shared-editor-config"
import { FolderSimple } from "@phosphor-icons/react/dist/ssr/FolderSimple"
import { ArrowBendUpLeft } from "@phosphor-icons/react/dist/ssr/ArrowBendUpLeft"
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut"
import { Eye } from "@phosphor-icons/react/dist/ssr/Eye"
import { Quotes } from "@phosphor-icons/react/dist/ssr/Quotes"
import { DotsThree } from "@phosphor-icons/react/dist/ssr/DotsThree"
import { Columns } from "@phosphor-icons/react/dist/ssr/Columns"
import { Copy } from "@phosphor-icons/react/dist/ssr/Copy"

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

/** Show preview after 300ms delay */
export function showNotePreview(target: HTMLElement, noteId: string, noteType: "note" | "wiki") {
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

/** Hide preview after 200ms delay (cancellable by re-enter) */
export function hideNotePreview() {
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

// ── Cached render extensions (module-level singleton) ─────────────
let _renderExts: ReturnType<typeof createRenderExtensions> | null = null
function getRenderExtensions() {
  if (!_renderExts) _renderExts = createRenderExtensions()
  return _renderExts
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
  const [bodyPreview, setBodyPreview] = useState("")
  const [bodyJson, setBodyJson] = useState<Record<string, unknown> | null>(null)
  const [pos, setPos] = useState({ x, y })
  const [quoteMode, setQuoteMode] = useState(false)
  const [showMore, setShowMore] = useState(false)
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
      document.removeEventListener("mouseup", onMouseUp)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [bodyPreview, bodyJson])

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
    import("@/lib/table-route").then(({ setActiveRoute }) => {
      setActiveRoute("/notes")
    })
    store.getState().openNote(noteId)
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

  // Fetch body from IDB
  useEffect(() => {
    if (!noteId) return
    import("@/lib/note-body-store").then(({ getBody }) => {
      getBody(noteId).then((body) => {
        if (body?.content) {
          setBodyPreview(body.content.replace(/^#{1,6}\s+/gm, "").trim())
        }
        if (body?.contentJson) {
          setBodyJson(body.contentJson as Record<string, unknown>)
        }
      })
    })
  }, [noteId])

  // Adjust position to stay within viewport
  const adjustPosition = useCallback(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let newX = x
    let newY = y

    if (newX + rect.width > vw - 16) {
      newX = vw - rect.width - 16
    }
    if (newY + rect.height > vh - 16) {
      newY = y - rect.height - 8 - (ref.current.parentElement ? 0 : 20)
    }
    if (newX !== pos.x || newY !== pos.y) {
      setPos({ x: newX, y: newY })
    }
  }, [x, y, pos.x, pos.y])

  useEffect(() => {
    adjustPosition()
  }, [adjustPosition, bodyPreview, bodyJson])

  return (
    <div
      ref={ref}
      onMouseEnter={cancelHidePreview}
      onMouseLeave={hideNotePreview}
      className="fixed z-[9999] w-[520px] rounded-lg border border-border-subtle bg-surface shadow-lg overflow-hidden animate-in fade-in duration-150"
      style={{ left: pos.x, top: pos.y }}
    >
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
      {/* Quote mode hint */}
      {quoteMode && !quoteSelection && (
        <div className="mx-4 mb-2 rounded bg-accent/10 px-2 py-1.5 text-2xs text-accent">
          Select text to quote into your note
        </div>
      )}
      {/* Body */}
      <div ref={bodyRef} className="px-4 pb-3 max-h-[80vh] overflow-y-auto select-text">
        {bodyJson && (bodyJson as any).type === "doc" ? (
          <div
            className="ProseMirror prose-preview text-note leading-relaxed [&_h1]:text-base [&_h1]:font-semibold [&_h1]:mt-3 [&_h1]:mb-1 [&_h2]:text-note [&_h2]:font-semibold [&_h2]:mt-2 [&_h2]:mb-1 [&_h3]:text-2xs [&_h3]:font-medium [&_h3]:mt-2 [&_h3]:mb-0.5 [&_p]:my-0.5 [&_ul]:my-0.5 [&_ol]:my-0.5 [&_li]:my-0 [&_blockquote]:my-1 [&_blockquote]:pl-2 [&_blockquote]:border-l-2 [&_pre]:my-1 [&_pre]:text-2xs [&_code]:text-2xs text-foreground/80"
            dangerouslySetInnerHTML={{ __html: generateHTML(bodyJson, getRenderExtensions()) }}
          />
        ) : bodyPreview ? (
          <p className="text-2xs text-muted-foreground leading-relaxed whitespace-pre-line">
            {bodyPreview}
          </p>
        ) : (
          <p className="text-2xs text-muted-foreground/50 italic">Empty note</p>
        )}
      </div>
      {/* Floating Quote button — positioned to the right of the preview card */}
      {quoteSelection && ref.current && createPortal(
        <button
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleInsertQuote() }}
          style={{
            position: "fixed",
            top: quoteSelection.rect.top + quoteSelection.rect.height / 2 - 18,
            left: ref.current.getBoundingClientRect().right + 8,
            zIndex: 10001,
          }}
          className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2.5 text-note font-semibold text-accent shadow-xl backdrop-blur-sm transition-colors hover:bg-accent/20"
        >
          <Quotes size={16} weight="bold" />
          <span>Quote</span>
        </button>,
        document.body
      )}
      {/* Action bar */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 border-t border-border-subtle">
        <button
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleOpen() }}
          className="flex items-center gap-1 rounded px-2 py-1 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
          title="Open note"
        >
          <ArrowSquareOut size={12} />
          <span>Open</span>
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handlePeek() }}
          className="flex items-center gap-1 rounded px-2 py-1 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
          title="Open in peek panel"
        >
          <Eye size={12} />
          <span>Peek</span>
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setQuoteMode(!quoteMode) }}
          className={`flex items-center gap-1 rounded px-2 py-1 text-2xs transition-colors hover:bg-hover-bg ${
            quoteMode ? "text-accent" : "text-muted-foreground hover:text-foreground"
          }`}
          title="Select text to quote"
        >
          <Quotes size={12} />
          <span>Quote</span>
        </button>
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
                onMouseDown={(e) => { e.preventDefault(); handleCopyLink() }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
              >
                <Copy size={12} />
                <span>Copy [[link]]</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────

function extractPlainText(nodes: any[]): string {
  return nodes
    .map((n: any) => {
      if (n.type === "text") return n.text || ""
      if (n.type === "heading") return "" // skip title heading
      if (n.content) return extractPlainText(n.content)
      return ""
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
}
