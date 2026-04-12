"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { usePlotStore } from "@/lib/store"

/* ── Event-based API ── */

interface FootnoteModalState {
  open: boolean
  footnoteId: string | null
  content: string
  referenceId: string | null
  onSave: ((attrs: { content: string; contentJson: null; referenceId: string | null }) => void) | null
  onCancel: (() => void) | null
}

let _state: FootnoteModalState = { open: false, footnoteId: null, content: "", referenceId: null, onSave: null, onCancel: null }
const _listeners = new Set<() => void>()
function notify() { _listeners.forEach((fn) => fn()) }

/** Open the footnote edit modal */
export function openFootnoteModal(opts: {
  footnoteId: string
  content: string
  contentJson?: Record<string, unknown> | null
  referenceId?: string | null
  onSave: (attrs: { content: string; contentJson: null; referenceId: string | null }) => void
  onCancel?: () => void
}) {
  _state = {
    open: true,
    footnoteId: opts.footnoteId,
    content: opts.content,
    referenceId: opts.referenceId ?? null,
    onSave: opts.onSave,
    onCancel: opts.onCancel ?? null,
  }
  notify()
}

export function cancelFootnoteModal() {
  const cancel = _state.onCancel
  _state = { open: false, footnoteId: null, content: "", referenceId: null, onSave: null, onCancel: null }
  notify()
  cancel?.()
}

function closeFootnoteModal() {
  _state = { open: false, footnoteId: null, content: "", referenceId: null, onSave: null, onCancel: null }
  notify()
}

/* ── Modal Component ── */

export function FootnoteEditModal() {
  const [state, setState] = useState<FootnoteModalState>(_state)
  const references = usePlotStore((s) => s.references)
  const createReference = usePlotStore((s) => s.createReference)
  const updateReference = usePlotStore((s) => s.updateReference)

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [url, setUrl] = useState("")
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const listener = () => setState({ ..._state })
    _listeners.add(listener)
    return () => { _listeners.delete(listener) }
  }, [])

  // Populate form when modal opens
  useEffect(() => {
    if (!state.open) return
    const ref = state.referenceId ? references[state.referenceId] : null
    setTitle(ref?.title ?? "")
    setContent(ref?.content ?? state.content ?? "")
    setUrl(ref?.fields.find((f) => f.key.toLowerCase() === "url")?.value ?? "")
    setTimeout(() => titleRef.current?.focus(), 50)
  }, [state.open, state.footnoteId])

  const handleSave = useCallback(() => {
    if (!state.onSave) return
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    const trimmedUrl = url.trim()
    const displayText = trimmedContent || trimmedTitle

    if (!displayText) {
      cancelFootnoteModal()
      return
    }

    let refId = state.referenceId
    const fields = trimmedUrl ? [{ key: "URL", value: trimmedUrl }] : []
    const refTitle = trimmedTitle || (displayText.length > 60 ? displayText.slice(0, 60) + "…" : displayText)

    if (!refId) {
      refId = createReference({ title: refTitle, content: trimmedContent, fields } as any)
    } else {
      const ref = references[refId]
      if (ref) {
        const updatedFields = trimmedUrl
          ? ref.fields.some((f) => f.key.toLowerCase() === "url")
            ? ref.fields.map((f) => f.key.toLowerCase() === "url" ? { ...f, value: trimmedUrl } : f)
            : [...ref.fields, { key: "URL", value: trimmedUrl }]
          : ref.fields.filter((f) => f.key.toLowerCase() !== "url")
        updateReference(refId, { title: refTitle, content: trimmedContent, fields: updatedFields })
      }
    }

    state.onSave({ content: displayText, contentJson: null, referenceId: refId })
    closeFootnoteModal()
  }, [state, title, content, url, references, createReference, updateReference])

  if (!state.open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]" onClick={cancelFootnoteModal}>
      <div
        className="w-[420px] rounded-xl border border-border bg-surface-overlay shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") cancelFootnoteModal()
        }}
      >
        <div className="px-5 pt-4 pb-2">
          <h3 className="text-note font-semibold text-foreground">
            {state.referenceId ? "Edit Footnote" : "New Footnote"}
          </h3>
        </div>

        <div className="px-5 space-y-3 pb-4">
          <div>
            <label className="text-2xs text-muted-foreground/60 mb-1 block">Title <span className="text-muted-foreground/30">— saved as reference name in Library</span></label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave() }}
              placeholder="Reference title..."
              className="w-full h-8 rounded-md border border-border bg-secondary/50 px-3 text-note text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-2xs text-muted-foreground/60 mb-1 block">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Footnote content..."
              rows={3}
              className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-note text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-accent resize-none"
            />
          </div>
          <div className="mt-3">
            <label className="text-2xs text-muted-foreground/60 mb-1 block">URL (optional)</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full h-8 rounded-md border border-border bg-secondary/50 px-3 text-note text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="border-t border-border/30 px-5 py-3 flex justify-end gap-2">
          <button
            onClick={cancelFootnoteModal}
            className="rounded-md px-3 py-1.5 text-2xs font-medium text-muted-foreground hover:bg-hover-bg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim() && !title.trim()}
            className="rounded-md bg-accent px-3 py-1.5 text-2xs font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
