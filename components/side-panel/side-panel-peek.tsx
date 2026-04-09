"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { NoteEditorAdapter } from "@/components/editor/NoteEditorAdapter"
import { FixedToolbar } from "@/components/editor/FixedToolbar"
import { WikiArticleView } from "@/components/wiki-editor/wiki-article-view"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import type { Editor } from "@tiptap/react"
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { Eye as PhEye } from "@phosphor-icons/react/dist/ssr/Eye"
import { Columns } from "@phosphor-icons/react/dist/ssr/Columns"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { IconWiki } from "@/components/plot-icons"
import { StatusShapeIcon } from "@/components/status-icon"
import { WIKI_STATUS_HEX } from "@/lib/colors"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function SidePanelPeek() {
  const peekContext = usePlotStore((s) => s.sidePanelPeekContext)
  const closeSidePeek = usePlotStore((s) => s.closeSidePeek)
  const openNote = usePlotStore((s) => s.openNote)
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const [editing, setEditing] = useState(false)
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null)

  // Resolve the target entity (note or wiki article)
  const resolved = useMemo(() => {
    if (!peekContext) return null
    if (peekContext.type === "wiki") {
      const article = wikiArticles.find((a) => a.id === peekContext.id)
      if (article) return { kind: "wiki" as const, article }
      // Fallback: maybe the id is actually a note that matches a wiki title
      // (legacy hack — previous behavior). Drop this once all callers pass correct type.
      return null
    }
    // note
    const note = notes.find((n) => n.id === peekContext.id)
    if (note) return { kind: "note" as const, note }
    return null
  }, [peekContext, notes, wikiArticles])

  // Reset edit mode when target changes (wiki cannot be edited inline for now)
  useEffect(() => {
    setEditing(false)
    setEditorInstance(null)
  }, [peekContext?.type, peekContext?.id])

  const peekContentRef = useRef<HTMLDivElement>(null)

  // Esc key to close peek
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && peekContext) {
        closeSidePeek()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [peekContext, closeSidePeek])

  if (!peekContext || !resolved) return null

  const title =
    resolved.kind === "note"
      ? resolved.note.title || "Untitled"
      : resolved.article.title || "Untitled"

  const TitleIcon =
    resolved.kind === "wiki" ? (
      <IconWiki size={14} className="shrink-0" style={{ color: WIKI_STATUS_HEX.article }} />
    ) : (
      <StatusShapeIcon status={resolved.note.status} size={14} />
    )

  const handleOpenInTab = () => {
    if (resolved.kind === "wiki") {
      setActiveRoute("/wiki")
      navigateToWikiArticle(resolved.article.id)
    } else {
      setActiveRoute("/notes")
      openNote(resolved.note.id)
    }
    closeSidePeek()
  }

  const handleOpenInSplit = () => {
    // Split view currently only supports notes in the secondary pane.
    // Wiki secondary-pane support is deferred to a later phase.
    if (resolved.kind !== "note") return
    const { openInSecondary, closeSidePeek: close } = usePlotStore.getState()
    openInSecondary(resolved.note.id)
    close()
  }

  // Both notes and wiki articles are editable in Peek.
  // Wiki articles support add/modify blocks inline via WikiArticleView's own UI,
  // so the Edit toggle is still meaningful for them.
  const canEdit = true
  const canSplit = resolved.kind === "note"

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Mini action bar with title + actions */}
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {TitleIcon}
          <span className="text-note text-foreground truncate">{title}</span>
        </div>
        <div className="flex items-center gap-0.5">
          {/* Open in split view (notes only for now) */}
          {canSplit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleOpenInSplit}
                  className="rounded-md p-1 text-muted-foreground transition-colors duration-100 hover:bg-hover-bg hover:text-foreground"
                  aria-label="Open in Split View"
                >
                  <Columns size={14} weight="regular" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4}>Open in Split View</TooltipContent>
            </Tooltip>
          )}
          {/* Open in full view */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleOpenInTab}
                className="rounded-md p-1 text-muted-foreground transition-colors duration-100 hover:bg-hover-bg hover:text-foreground"
                aria-label="Open in full view"
              >
                <ArrowSquareOut size={14} weight="regular" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>Open in full view</TooltipContent>
          </Tooltip>
          {/* Edit toggle (notes only) */}
          {canEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setEditing((prev) => !prev)}
                  className={`rounded-md p-1 transition-colors duration-100 hover:bg-hover-bg ${
                    editing ? "text-accent" : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label={editing ? "Switch to View" : "Switch to Edit"}
                >
                  {editing ? (
                    <PhEye size={14} weight="regular" />
                  ) : (
                    <PencilSimple size={14} weight="regular" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4}>
                {editing ? "Switch to View" : "Switch to Edit"}
              </TooltipContent>
            </Tooltip>
          )}
          {/* Close peek */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={closeSidePeek}
                className="rounded-md p-1 text-muted-foreground transition-colors duration-100 hover:bg-hover-bg hover:text-foreground"
                aria-label="Close peek"
              >
                <PhX size={14} weight="regular" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4} align="end">Close peek (Esc)</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Content — flex-col so the editor fills full height and its counter/toolbar
          stick to the bottom regardless of content length. */}
      <div ref={peekContentRef} className="flex flex-1 flex-col overflow-hidden min-h-0">
        {resolved.kind === "note" ? (
          <div className="flex flex-1 flex-col min-h-0 px-5 py-4">
            <NoteEditorAdapter
              key={`${resolved.note.id}-${editing}`}
              note={resolved.note}
              editable={editing}
              onEditorReady={(ed) => setEditorInstance(ed as Editor)}
            />
          </div>
        ) : (
          // Wiki: full layout (no preview mode) so infobox + metadata render.
          // Narrow Peek widths may require horizontal scroll inside the wiki view.
          <div className="flex flex-1 min-h-0 overflow-auto">
            <WikiArticleView articleId={resolved.article.id} editable={editing} />
          </div>
        )}
      </div>

      {/* Editor Toolbar at bottom (note edit mode only — wiki has per-block inline UI) */}
      {resolved.kind === "note" && editing && editorInstance && (
        <FixedToolbar
          editor={editorInstance}
          position="bottom"
          noteId={resolved.note.id}
          variant="peek"
        />
      )}
    </div>
  )
}
