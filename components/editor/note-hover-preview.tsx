"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { usePlotStore } from "@/lib/store"
import { resolveNoteByTitle, resolveNoteById } from "@/lib/note-reference-actions"

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

function PreviewCard({ noteId, noteType, x, y }: PreviewState) {
  const ref = useRef<HTMLDivElement>(null)
  const note = usePlotStore((s) => s.notes.find((n) => n.id === noteId))
  const wikiArticle = usePlotStore((s) => s.wikiArticles.find((a) => a.id === noteId))
  const [bodyPreview, setBodyPreview] = useState("")
  const [pos, setPos] = useState({ x, y })

  // Fetch body from IDB
  useEffect(() => {
    if (!noteId) return
    import("@/lib/note-body-store").then(({ getBody }) => {
      getBody(noteId).then((body) => {
        if (body?.content) {
          // body.content is plaintext string — show full content
          const preview = body.content
            .replace(/^#{1,6}\s+/gm, "")
            .trim()
          setBodyPreview(preview)
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

    // If overflows right
    if (newX + rect.width > vw - 16) {
      newX = vw - rect.width - 16
    }
    // If overflows bottom, show above
    if (newY + rect.height > vh - 16) {
      newY = y - rect.height - 8 - (ref.current.parentElement ? 0 : 20)
    }
    if (newX !== pos.x || newY !== pos.y) {
      setPos({ x: newX, y: newY })
    }
  }, [x, y, pos.x, pos.y])

  useEffect(() => {
    adjustPosition()
  }, [adjustPosition, bodyPreview])

  const title = note?.title || wikiArticle?.title || "Untitled"
  const status = note?.status

  return (
    <div
      ref={ref}
      onMouseEnter={cancelHidePreview}
      onMouseLeave={hideNotePreview}
      className="fixed z-[9999] w-[280px] rounded-lg border border-border-subtle bg-surface shadow-lg overflow-hidden animate-in fade-in duration-150"
      style={{ left: pos.x, top: pos.y }}
    >
      {/* Header */}
      <div className="px-3 pt-2.5 pb-1 flex items-center gap-2">
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
      {/* Body */}
      <div className="px-3 pb-2.5 max-h-[200px] overflow-y-auto">
        {bodyPreview ? (
          <p className="text-2xs text-muted-foreground leading-relaxed whitespace-pre-line">
            {bodyPreview}
          </p>
        ) : (
          <p className="text-2xs text-muted-foreground/50 italic">Empty note</p>
        )}
      </div>
      {/* Footer hint */}
      <div className="px-3 py-1.5 border-t border-border-subtle bg-muted/30">
        <span className="text-[10px] text-muted-foreground/60">
          Click to peek · Ctrl+Click to open
        </span>
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
