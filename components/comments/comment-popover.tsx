"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import type { CommentAnchor, Comment } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChatCircle } from "@phosphor-icons/react/dist/ssr/ChatCircle"
import { Check } from "@phosphor-icons/react/dist/ssr/Check"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { PaperPlaneRight } from "@phosphor-icons/react/dist/ssr/PaperPlaneRight"

interface CommentPopoverProps {
  anchor: CommentAnchor
  /** If true, only show if there are comments (no empty trigger). For read-only mode. */
  hideWhenEmpty?: boolean
  /** Extra classes for the trigger button. */
  triggerClassName?: string
  /** Optional controlled open state (for external triggers like menu items). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Render-prop: if provided, caller supplies their own trigger. */
  children?: React.ReactNode
}

function anchorEquals(a: CommentAnchor, b: CommentAnchor): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === "wiki-block" && b.kind === "wiki-block") {
    return a.articleId === b.articleId && a.blockId === b.blockId
  }
  if (a.kind === "note-block" && b.kind === "note-block") {
    return a.noteId === b.noteId && a.nodeId === b.nodeId
  }
  return false
}

export function CommentPopover({
  anchor,
  hideWhenEmpty,
  triggerClassName,
  open: openProp,
  onOpenChange,
  children,
}: CommentPopoverProps) {
  const comments = usePlotStore((s) => s.comments)
  const addComment = usePlotStore((s) => s.addComment)

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = openProp ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  const matching = useMemo(() => {
    return Object.values(comments)
      .filter((c) => anchorEquals(c.anchor, anchor))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }, [comments, anchor])

  const openCount = matching.filter((c) => !c.resolved).length
  const totalCount = matching.length

  if (hideWhenEmpty && totalCount === 0) return null

  const trigger = children ?? (
    <button
      className={cn(
        "relative inline-flex items-center justify-center p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg transition-colors",
        triggerClassName
      )}
      title={totalCount > 0 ? `${openCount} open, ${totalCount - openCount} resolved` : "Add comment"}
    >
      <ChatCircle size={14} weight={totalCount > 0 ? "fill" : "regular"} />
      {openCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-accent text-[9px] font-bold text-accent-foreground flex items-center justify-center">
          {openCount}
        </span>
      )}
    </button>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <CommentList comments={matching} anchor={anchor} onAdd={(body) => addComment(anchor, body)} />
      </PopoverContent>
    </Popover>
  )
}

function CommentList({
  comments,
  anchor: _anchor,
  onAdd,
}: {
  comments: Comment[]
  anchor: CommentAnchor
  onAdd: (body: string) => void
}) {
  const [draft, setDraft] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const toggleResolved = usePlotStore((s) => s.toggleCommentResolved)
  const deleteComment = usePlotStore((s) => s.deleteComment)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const submit = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setDraft("")
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex flex-col">
      {comments.length > 0 && (
        <ul className="max-h-60 overflow-y-auto divide-y divide-border-subtle">
          {comments.map((c) => (
            <li key={c.id} className={cn("p-2.5 text-[13px]", c.resolved && "opacity-50")}>
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className={cn("whitespace-pre-wrap break-words text-foreground/90", c.resolved && "line-through")}>
                    {c.body}
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground/60">
                    {new Date(c.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => toggleResolved(c.id)}
                    title={c.resolved ? "Reopen" : "Resolve"}
                    className={cn(
                      "p-1 rounded hover:bg-hover-bg transition-colors",
                      c.resolved ? "text-muted-foreground/50" : "text-muted-foreground/70 hover:text-foreground"
                    )}
                  >
                    <Check size={12} weight="bold" />
                  </button>
                  <button
                    onClick={() => deleteComment(c.id)}
                    title="Delete comment"
                    className="p-1 rounded text-muted-foreground/50 hover:bg-hover-bg hover:text-destructive transition-colors"
                  >
                    <Trash size={12} weight="regular" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-1.5 p-2 border-t border-border-subtle">
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Add comment…  (Ctrl+Enter to send)"
          rows={2}
          className="flex-1 resize-none bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/40 outline-none"
        />
        <button
          onClick={submit}
          disabled={!draft.trim()}
          className="p-1.5 rounded-md text-accent hover:bg-accent/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Send (Ctrl+Enter)"
        >
          <PaperPlaneRight size={14} weight="fill" />
        </button>
      </div>
    </div>
  )
}
