"use client"

import { useState, useEffect, useCallback } from "react"
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning"
import { ChatText } from "@phosphor-icons/react/dist/ssr/ChatText"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function WikiQuoteNode({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const { sourceTitle, quotedText, quotedAt, sourceNoteId, sourceHash, context, comment } = node.attrs

  const [editingComment, setEditingComment] = useState(false)
  const [commentDraft, setCommentDraft] = useState(comment || "")
  const [sourceChanged, setSourceChanged] = useState(false)

  // Check if source content has changed (lazy, on mount only)
  useEffect(() => {
    if (!sourceNoteId || !sourceHash) return
    let cancelled = false
    ;(async () => {
      try {
        const { getBody } = await import("@/lib/note-body-store")
        const { computeSourceHash } = await import("@/lib/quote-hash")
        const body = await getBody(sourceNoteId)
        if (cancelled) return
        if (body?.content) {
          const currentHash = computeSourceHash(body.content)
          setSourceChanged(currentHash !== sourceHash)
        }
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
  }, [sourceNoteId, sourceHash])

  const saveComment = useCallback(() => {
    updateAttributes({ comment: commentDraft.trim() || null })
    setEditingComment(false)
  }, [commentDraft, updateAttributes])

  return (
    <NodeViewWrapper className="wiki-quote-wrapper my-4" data-type="wikiQuote">
      <blockquote className="group relative border-l-[3px] border-accent/60 bg-accent/5 rounded-r-md pl-4 pr-4 py-3 not-prose">
        {/* Delete button (top-right, hover-only) */}
        <button
          onClick={deleteNode}
          className="absolute top-2 right-2 rounded p-0.5 text-muted-foreground/40 opacity-0 transition-all group-hover:opacity-100 hover:bg-hover-bg hover:text-foreground"
          title="Delete quote"
        >
          <PhX size={14} />
        </button>
        {/* Context tooltip on quoted text */}
        {context ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-note text-foreground/90 leading-relaxed whitespace-pre-wrap cursor-help">
                {quotedText || "Empty quote"}
              </p>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-sm text-2xs">
              <p className="text-muted-foreground">{context}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <p className="text-note text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {quotedText || "Empty quote"}
          </p>
        )}

        {/* Footer: source + date + change badge */}
        <footer className="mt-2 flex items-center gap-1.5 text-2xs text-muted-foreground">
          <FileText className="shrink-0" size={12} weight="regular" />
          <span className="font-medium">{sourceTitle || "Unknown source"}</span>
          {quotedAt && (
            <span className="text-muted-foreground/60">
              · {new Date(quotedAt).toLocaleDateString()}
            </span>
          )}
          {sourceChanged && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/10 px-1 py-0.5 text-amber-500">
                  <Warning size={10} weight="fill" />
                  <span>Changed</span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-2xs">
                Source note has been modified since this quote was taken
              </TooltipContent>
            </Tooltip>
          )}
        </footer>

        {/* Comment area */}
        {editingComment ? (
          <div className="mt-2">
            <input
              type="text"
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              onBlur={saveComment}
              onKeyDown={(e) => { if (e.key === "Enter") saveComment(); if (e.key === "Escape") setEditingComment(false) }}
              placeholder="Add a note about this quote..."
              className="w-full rounded border border-border-subtle bg-transparent px-2 py-1 text-2xs text-foreground/70 outline-none focus:border-accent/50"
              autoFocus
            />
          </div>
        ) : comment ? (
          <button
            onClick={() => { setCommentDraft(comment); setEditingComment(true) }}
            className="mt-2 flex items-center gap-1 text-2xs text-muted-foreground/70 transition-colors hover:text-foreground/70"
          >
            <ChatText size={10} />
            <span className="italic">{comment}</span>
          </button>
        ) : (
          <button
            onClick={() => { setCommentDraft(""); setEditingComment(true) }}
            className="mt-2 flex items-center gap-1 text-2xs text-muted-foreground/40 opacity-0 transition-all group-hover:opacity-100 hover:text-muted-foreground"
          >
            <ChatText size={10} />
            <span>Add comment</span>
          </button>
        )}
      </blockquote>
    </NodeViewWrapper>
  )
}
