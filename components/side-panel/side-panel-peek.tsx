"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { NoteEditorAdapter } from "@/components/editor/NoteEditorAdapter"
import { FixedToolbar } from "@/components/editor/FixedToolbar"
import type { Editor } from "@tiptap/react"
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { Eye as PhEye } from "@phosphor-icons/react/dist/ssr/Eye"
import { Globe } from "@phosphor-icons/react/dist/ssr/Globe"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Columns } from "@phosphor-icons/react/dist/ssr/Columns"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Quotes } from "@phosphor-icons/react/dist/ssr/Quotes"

export function SidePanelPeek() {
  const sidePanelPeekNoteId = usePlotStore((s) => s.sidePanelPeekNoteId)
  const closeSidePeek = usePlotStore((s) => s.closeSidePeek)
  const openNote = usePlotStore((s) => s.openNote)
  const notes = usePlotStore((s) => s.notes)
  const [editing, setEditing] = useState(false)
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)

  // Resolve note (must be before hooks that use `note`)
  const note = useMemo(() => {
    if (!sidePanelPeekNoteId) return null
    let found = notes.find((n) => n.id === sidePanelPeekNoteId) ?? null
    if (!found) {
      const article = wikiArticles.find((a) => a.id === sidePanelPeekNoteId)
      if (article) {
        found = notes.find((n) => n.title.toLowerCase() === article.title.toLowerCase()) ?? null
      }
    }
    return found
  }, [sidePanelPeekNoteId, notes, wikiArticles])

  // ── Partial Quote: track text selection in Peek ──
  const [quoteSelection, setQuoteSelection] = useState<{ text: string; rect: DOMRect } | null>(null)
  const peekContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleSelectionChange() {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setQuoteSelection(null)
        return
      }
      // Only track selection within the peek content area
      const range = sel.getRangeAt(0)
      if (!peekContentRef.current?.contains(range.startContainer)) {
        setQuoteSelection(null)
        return
      }
      const rect = range.getBoundingClientRect()
      setQuoteSelection({ text: sel.toString().trim(), rect })
    }
    document.addEventListener("selectionchange", handleSelectionChange)
    return () => document.removeEventListener("selectionchange", handleSelectionChange)
  }, [])

  const handleInsertQuote = useCallback(async () => {
    if (!quoteSelection || !note) return

    // Gather context
    const sel = window.getSelection()
    const range = sel?.getRangeAt(0)
    const parentText = range?.startContainer.parentElement?.textContent || ""
    const startIdx = parentText.indexOf(quoteSelection.text)
    const beforeText = startIdx > 0 ? parentText.slice(Math.max(0, startIdx - 100), startIdx).trim() : ""
    const afterText = parentText.slice(startIdx + quoteSelection.text.length, startIdx + quoteSelection.text.length + 100).trim()
    const context = [beforeText, afterText].filter(Boolean).join(" [...] ") || null
    const originalText = range?.startContainer.parentElement?.textContent || quoteSelection.text

    // Compute source hash
    let sourceHash: string | null = null
    try {
      const { getBody } = await import("@/lib/note-body-store")
      const { computeSourceHash } = await import("@/lib/quote-hash")
      const body = await getBody(note.id)
      if (body?.content) sourceHash = computeSourceHash(body.content)
    } catch { /* ignore */ }

    // Dispatch custom event (consumed by note-editor.tsx)
    window.dispatchEvent(new CustomEvent("plot:insert-wiki-quote", {
      detail: {
        sourceNoteId: note.id,
        sourceTitle: note.title || "Untitled",
        quotedText: quoteSelection.text,
        quotedAt: new Date().toISOString(),
        originalText,
        sourceHash,
        context,
        comment: null,
      }
    }))

    // Clear selection
    window.getSelection()?.removeAllRanges()
    setQuoteSelection(null)
  }, [quoteSelection, note])

  // Esc key to close peek
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidePanelPeekNoteId) {
        closeSidePeek()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [sidePanelPeekNoteId, closeSidePeek])

  if (!sidePanelPeekNoteId || !note) return null

  const handleOpenInTab = () => {
    setActiveRoute("/notes")
    openNote(sidePanelPeekNoteId)
    closeSidePeek()
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Mini action bar with note title + actions */}
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <FileText className="shrink-0 text-muted-foreground" size={14} weight="regular" />
          <span className="text-note text-foreground truncate">{note.title || "Untitled"}</span>
        </div>
        <div className="flex items-center gap-0.5">
          {/* Open side by side (Phase 2 placeholder) */}
          <button
            onClick={() => {
              const { openInSecondary, closeSidePeek: close } = usePlotStore.getState()
              if (sidePanelPeekNoteId) {
                openInSecondary(sidePanelPeekNoteId)
                close()
              }
            }}
            className="rounded-md p-1 text-muted-foreground transition-colors duration-100 hover:bg-hover-bg hover:text-foreground"
            title="Open side by side"
          >
            <Columns size={14} weight="regular" />
          </button>
          {/* Open in full view */}
          <button
            onClick={handleOpenInTab}
            className="rounded-md p-1 text-muted-foreground transition-colors duration-100 hover:bg-hover-bg hover:text-foreground"
            title="Open in full view"
          >
            <ArrowSquareOut size={14} weight="regular" />
          </button>
          {/* Edit toggle */}
          <button
            onClick={() => setEditing((prev) => !prev)}
            className={`rounded-md p-1 transition-colors duration-100 hover:bg-hover-bg ${
              editing ? "text-accent" : "text-muted-foreground hover:text-foreground"
            }`}
            title={editing ? "Switch to View" : "Switch to Edit"}
          >
            {editing ? (
              <PhEye size={14} weight="regular" />
            ) : (
              <PencilSimple size={14} weight="regular" />
            )}
          </button>
          {/* Close peek */}
          <button
            onClick={closeSidePeek}
            className="rounded-md p-1 text-muted-foreground transition-colors duration-100 hover:bg-hover-bg hover:text-foreground"
            title="Close peek (Esc)"
          >
            <PhX size={14} weight="regular" />
          </button>
        </div>
      </div>

      {/* Editor Toolbar (edit mode only) */}
      {editing && editorInstance && (
        <FixedToolbar editor={editorInstance} position="top" noteId={sidePanelPeekNoteId} />
      )}

      {/* Content */}
      <div ref={peekContentRef} className="flex-1 overflow-y-auto px-5 py-4">
        <NoteEditorAdapter
          key={`${note.id}-${editing}`}
          note={note}
          editable={editing}
          onEditorReady={(ed) => setEditorInstance(ed as Editor)}
        />
      </div>
      {/* Floating Quote button (appears on text selection) */}
      {quoteSelection && (
        <button
          onClick={handleInsertQuote}
          style={{
            position: "fixed",
            top: quoteSelection.rect.top - 36,
            left: quoteSelection.rect.left + quoteSelection.rect.width / 2 - 40,
          }}
          className="z-50 flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-overlay px-2.5 py-1.5 text-2xs font-medium text-foreground shadow-lg transition-colors hover:bg-hover-bg"
        >
          <Quotes size={14} weight="bold" />
          <span>Quote</span>
        </button>
      )}
    </div>
  )
}
