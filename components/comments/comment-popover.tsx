"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { usePlotStore } from "@/lib/store"
import type { CommentAnchor, Comment, CommentStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CommentEditor, CommentBodyDisplay } from "./comment-editor"
import { ChatCircle } from "@phosphor-icons/react/dist/ssr/ChatCircle"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { PaperPlaneRight } from "@phosphor-icons/react/dist/ssr/PaperPlaneRight"
import { ArrowBendUpLeft } from "@phosphor-icons/react/dist/ssr/ArrowBendUpLeft"
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { Circle } from "@phosphor-icons/react/dist/ssr/Circle"
import { CircleDashed } from "@phosphor-icons/react/dist/ssr/CircleDashed"
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle"
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning"
import { toast } from "sonner"

interface CommentPopoverProps {
  anchor: CommentAnchor
  hideWhenEmpty?: boolean
  triggerClassName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

/* ── Status meta ─────────────────────────────────────── */

const STATUS_META: Record<CommentStatus, { label: string; icon: any; color: string; bg: string }> = {
  backlog: { label: "Backlog", icon: CircleDashed, color: "text-muted-foreground/70", bg: "bg-muted-foreground/10" },
  todo: { label: "Todo", icon: Circle, color: "text-blue-400", bg: "bg-blue-500/15" },
  done: { label: "Done", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/15" },
  blocker: { label: "Blocker", icon: Warning, color: "text-red-400", bg: "bg-red-500/15" },
}
const STATUS_ORDER: CommentStatus[] = ["backlog", "todo", "done", "blocker"]

/* ── Time util ───────────────────────────────────────── */

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - then)
  const sec = Math.floor(diff / 1000)
  if (sec < 10) return "just now"
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d ago`
  if (day < 30) return `${Math.floor(day / 7)}w ago`
  if (day < 365) return `${Math.floor(day / 30)}mo ago`
  return `${Math.floor(day / 365)}y ago`
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

/* ── Main popover ────────────────────────────────────── */

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

  // Top-level only (not replies); replies render nested
  const tops = useMemo(() => matching.filter((c) => !c.parentId), [matching])
  const repliesByParent = useMemo(() => {
    const map = new Map<string, Comment[]>()
    for (const c of matching) {
      if (c.parentId) {
        if (!map.has(c.parentId)) map.set(c.parentId, [])
        map.get(c.parentId)!.push(c)
      }
    }
    return map
  }, [matching])

  const openCount = tops.filter((c) => c.status !== "done").length
  const totalCount = tops.length

  if (hideWhenEmpty && totalCount === 0) return null

  const trigger = children ?? (
    <button
      className={cn(
        "relative inline-flex items-center justify-center p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg transition-colors",
        triggerClassName,
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
        align="start"
        side="bottom"
        className="w-[560px] p-0"
        collisionPadding={16}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <CommentList
          comments={tops}
          repliesByParent={repliesByParent}
          anchor={anchor}
          onAdd={(body) => addComment(anchor, body)}
        />
      </PopoverContent>
    </Popover>
  )
}

/* ── List with tabs + composer ──────────────────────── */

function CommentList({
  comments,
  repliesByParent,
  anchor,
  onAdd,
}: {
  comments: Comment[]
  repliesByParent: Map<string, Comment[]>
  anchor: CommentAnchor
  onAdd: (body: string) => void
}) {
  const [tab, setTab] = useState<"open" | "resolved">("open")
  const [draft, setDraft] = useState("")
  const [composerKey, setComposerKey] = useState(0)

  const filtered = useMemo(() => {
    if (tab === "open") return comments.filter((c) => c.status !== "done")
    return comments.filter((c) => c.status === "done")
  }, [comments, tab])

  const openCount = comments.filter((c) => c.status !== "done").length
  const resolvedCount = comments.filter((c) => c.status === "done").length

  const submit = (body: string) => {
    if (!isBodyEmpty(body)) {
      onAdd(body)
      setDraft("")
      setComposerKey((k) => k + 1)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Tabs */}
      {comments.length > 0 && (
        <div className="flex items-center gap-1 px-3 pt-2.5 border-b border-border-subtle">
          <TabButton active={tab === "open"} onClick={() => setTab("open")} count={openCount}>
            Open
          </TabButton>
          <TabButton active={tab === "resolved"} onClick={() => setTab("resolved")} count={resolvedCount}>
            Resolved
          </TabButton>
        </div>
      )}

      {filtered.length > 0 && (
        <ul className="max-h-[480px] overflow-y-auto divide-y divide-border-subtle">
          {filtered.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              replies={repliesByParent.get(c.id) || []}
              anchor={anchor}
            />
          ))}
        </ul>
      )}

      {comments.length > 0 && filtered.length === 0 && (
        <div className="px-3 py-6 text-center text-[12px] text-muted-foreground/50">
          No {tab === "open" ? "open" : "resolved"} comments.
        </div>
      )}

      {/* Composer */}
      <div className="flex items-stretch gap-2 p-3 border-t border-border-subtle">
        <div className="flex-1">
          <CommentEditor
            key={composerKey}
            initialBody=""
            placeholder="Add comment…  (Ctrl+Enter to send)"
            autoFocus
            onChange={(body) => setDraft(body)}
            onSubmit={(body) => submit(body)}
          />
        </div>
        <button
          onClick={() => submit(draft)}
          disabled={isBodyEmpty(draft)}
          className="p-2 self-end rounded-md text-accent hover:bg-accent/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Send (Ctrl+Enter)"
        >
          <PaperPlaneRight size={16} weight="fill" />
        </button>
      </div>
    </div>
  )
}

/** Check if a comment body (JSON string or plain text) is effectively empty. */
function isBodyEmpty(body: string): boolean {
  if (!body || !body.trim()) return true
  try {
    const json = JSON.parse(body)
    if (json?.type === "doc" && Array.isArray(json.content)) {
      const text = extractText(json).trim()
      return text === ""
    }
  } catch {
    /* not JSON */
  }
  return body.trim() === ""
}

function extractText(node: any): string {
  if (node.type === "text") return node.text || ""
  if (!node.content) return ""
  return node.content.map(extractText).join("")
}

/* ── Status picker (portal-based to escape parent popover overflow) ───── */

function StatusPicker({
  current,
  onChange,
}: {
  current: CommentStatus
  onChange: (s: CommentStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!open || !triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    setCoords({ top: r.bottom + 4, left: r.left })
  }, [open])

  const meta = STATUS_META[current] || STATUS_META.backlog
  const StatusIcon = meta.icon

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors",
          meta.bg,
          meta.color,
        )}
        title="Change status"
      >
        <StatusIcon size={12} weight={current === "done" ? "fill" : "regular"} />
        <span>{meta.label}</span>
        <CaretDown size={9} weight="bold" />
      </button>
      {open && coords && typeof window !== "undefined" &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[10010]" onClick={() => setOpen(false)} />
            <div
              className="fixed z-[10011] w-32 bg-surface-overlay border border-border rounded-md shadow-lg p-1"
              style={{ top: coords.top, left: coords.left }}
            >
              {STATUS_ORDER.map((s) => {
                const m = STATUS_META[s]
                const Icon = m.icon
                return (
                  <button
                    key={s}
                    onClick={() => {
                      onChange(s)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex items-center gap-2 w-full px-2 py-1.5 rounded text-[11px] hover:bg-hover-bg transition-colors",
                      s === current ? "text-foreground" : "text-muted-foreground/80",
                    )}
                  >
                    <Icon size={11} weight={s === "done" ? "fill" : "regular"} className={m.color} />
                    {m.label}
                    {s === current && <span className="ml-auto text-accent">•</span>}
                  </button>
                )
              })}
            </div>
          </>,
          document.body,
        )}
    </>
  )
}

function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean
  onClick: () => void
  count: number
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-[12px] font-medium rounded-t border-b-2 transition-colors",
        active
          ? "text-foreground border-accent"
          : "text-muted-foreground/60 border-transparent hover:text-foreground/80",
      )}
    >
      {children}
      <span className="ml-1.5 text-muted-foreground/50">{count}</span>
    </button>
  )
}

/* ── Single comment item ────────────────────────────── */

function CommentItem({
  comment,
  replies,
  anchor,
}: {
  comment: Comment
  replies: Comment[]
  anchor: CommentAnchor
}) {
  const setStatus = usePlotStore((s) => s.setCommentStatus)
  const updateComment = usePlotStore((s) => s.updateComment)
  const deleteComment = usePlotStore((s) => s.deleteComment)
  const addComment = usePlotStore((s) => s.addComment)
  const createNote = usePlotStore((s) => s.createNote)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.body)
  const [replying, setReplying] = useState(false)
  const [replyDraft, setReplyDraft] = useState("")

  const isResolved = comment.status === "done"

  const saveEdit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== comment.body) updateComment(comment.id, trimmed)
    setEditing(false)
  }

  const submitReply = (body?: string) => {
    const value = body ?? replyDraft
    if (isBodyEmpty(value)) return
    addComment(anchor, value, { parentId: comment.id })
    setReplyDraft("")
    setReplying(false)
  }

  const convertToNote = () => {
    try {
      const id = createNote({
        title: comment.body.split("\n")[0].slice(0, 80) || "Comment",
        content: comment.body,
        status: "inbox",
      })
      // Resolve the comment to show it's been "moved on"
      setStatus(comment.id, "done")
      const openNote = (usePlotStore.getState() as any).openNote
      toast.success("Comment moved to Inbox", {
        action: openNote
          ? {
              label: "Open",
              onClick: () => openNote(id),
            }
          : undefined,
      })
    } catch (e) {
      toast.error("Failed to convert to note")
    }
  }

  return (
    <li className={cn("p-3.5 text-[14px]", isResolved && "opacity-60")}>
      <div className="flex items-start gap-2.5">
        {/* Status chip — portal-based dropdown */}
        <div className="shrink-0 mt-0.5">
          <StatusPicker current={comment.status} onChange={(s) => setStatus(comment.id, s)} />
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <CommentEditor
              initialBody={comment.body}
              autoFocus
              placeholder="Edit comment…"
              onChange={(b) => setDraft(b)}
              onSubmit={(b) => {
                if (b && b !== comment.body) updateComment(comment.id, b)
                setEditing(false)
              }}
              onCancel={() => {
                setDraft(comment.body)
                setEditing(false)
              }}
            />
          ) : (
            <CommentBodyDisplay
              body={comment.body}
              onClick={() => !isResolved && setEditing(true)}
              className={cn(
                "text-foreground/90 cursor-text leading-relaxed",
                isResolved && "line-through cursor-default",
              )}
            />
          )}
          <div
            className="mt-1.5 text-[11px] text-muted-foreground/60"
            title={new Date(comment.createdAt).toLocaleString("en-US")}
          >
            {formatRelativeTime(comment.updatedAt || comment.createdAt)}
            {comment.updatedAt && comment.updatedAt !== comment.createdAt && " (edited)"}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <IconBtn title="Reply" onClick={() => setReplying((v) => !v)}>
            <ArrowBendUpLeft size={14} />
          </IconBtn>
          <IconBtn title="Convert to Note" onClick={convertToNote}>
            <ArrowSquareOut size={14} />
          </IconBtn>
          <IconBtn title="Delete" danger onClick={() => deleteComment(comment.id)}>
            <Trash size={14} />
          </IconBtn>
        </div>
      </div>

      {/* Reply composer */}
      {replying && (
        <div className="mt-2.5 ml-7 flex items-stretch gap-2">
          <div className="flex-1">
            <CommentEditor
              initialBody=""
              autoFocus
              placeholder="Reply… (Ctrl+Enter)"
              onChange={(b) => setReplyDraft(b)}
              onSubmit={(b) => submitReply(b)}
              onCancel={() => {
                setReplying(false)
                setReplyDraft("")
              }}
              showToolbar={false}
              className="text-[13px]"
            />
          </div>
          <button
            onClick={() => submitReply()}
            disabled={isBodyEmpty(replyDraft)}
            className="p-2 self-end rounded text-accent hover:bg-accent/10 disabled:opacity-30 transition-colors"
          >
            <PaperPlaneRight size={14} weight="fill" />
          </button>
        </div>
      )}

      {/* Replies (1-level) */}
      {replies.length > 0 && (
        <ul className="mt-2 ml-6 space-y-1.5 border-l border-border-subtle pl-2.5">
          {replies.map((r) => (
            <ReplyItem key={r.id} reply={r} />
          ))}
        </ul>
      )}
    </li>
  )
}

function ReplyItem({ reply }: { reply: Comment }) {
  const updateComment = usePlotStore((s) => s.updateComment)
  const deleteComment = usePlotStore((s) => s.deleteComment)
  const [editing, setEditing] = useState(false)

  return (
    <li className="text-[12px] text-foreground/85 group">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {editing ? (
            <CommentEditor
              initialBody={reply.body}
              autoFocus
              placeholder="Edit reply…"
              onSubmit={(b) => {
                if (b && b !== reply.body) updateComment(reply.id, b)
                setEditing(false)
              }}
              onCancel={() => setEditing(false)}
              showToolbar={false}
              className="text-[12px]"
            />
          ) : (
            <CommentBodyDisplay
              body={reply.body}
              onClick={() => setEditing(true)}
              className="cursor-text text-[12px]"
            />
          )}
          <div
            className="mt-0.5 text-[10px] text-muted-foreground/60"
            title={new Date(reply.createdAt).toLocaleString("en-US")}
          >
            {formatRelativeTime(reply.updatedAt || reply.createdAt)}
            {reply.updatedAt && reply.updatedAt !== reply.createdAt && " (edited)"}
          </div>
        </div>
        <button
          onClick={() => deleteComment(reply.id)}
          className="opacity-0 group-hover:opacity-60 hover:!opacity-100 p-0.5 rounded text-muted-foreground hover:text-destructive transition-all"
          title="Delete reply"
        >
          <Trash size={10} weight="regular" />
        </button>
      </div>
    </li>
  )
}

function IconBtn({
  children,
  title,
  onClick,
  danger,
}: {
  children: React.ReactNode
  title: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded hover:bg-hover-bg transition-colors text-muted-foreground/70",
        danger ? "hover:text-destructive" : "hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}
