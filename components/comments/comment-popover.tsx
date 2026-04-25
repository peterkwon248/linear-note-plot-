"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import type { CommentAnchor, Comment, CommentStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChatCircle } from "@phosphor-icons/react/dist/ssr/ChatCircle"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { PaperPlaneRight } from "@phosphor-icons/react/dist/ssr/PaperPlaneRight"
import { ArrowBendUpLeft } from "@phosphor-icons/react/dist/ssr/ArrowBendUpLeft"
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { Circle } from "@phosphor-icons/react/dist/ssr/Circle"
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle"
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning"
import { Note as PhNote } from "@phosphor-icons/react/dist/ssr/Note"
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
  note: { label: "Note", icon: PhNote, color: "text-muted-foreground/70", bg: "bg-muted-foreground/10" },
  todo: { label: "Todo", icon: Circle, color: "text-blue-400", bg: "bg-blue-500/15" },
  done: { label: "Done", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/15" },
  blocker: { label: "Blocker", icon: Warning, color: "text-red-400", bg: "bg-red-500/15" },
}
const STATUS_ORDER: CommentStatus[] = ["note", "todo", "done", "blocker"]

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
        align="end"
        className="w-96 p-0"
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
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const filtered = useMemo(() => {
    if (tab === "open") return comments.filter((c) => c.status !== "done")
    return comments.filter((c) => c.status === "done")
  }, [comments, tab])

  const openCount = comments.filter((c) => c.status !== "done").length
  const resolvedCount = comments.filter((c) => c.status === "done").length

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
      {/* Tabs */}
      {comments.length > 0 && (
        <div className="flex items-center gap-1 px-2 pt-2 border-b border-border-subtle">
          <TabButton active={tab === "open"} onClick={() => setTab("open")} count={openCount}>
            Open
          </TabButton>
          <TabButton active={tab === "resolved"} onClick={() => setTab("resolved")} count={resolvedCount}>
            Resolved
          </TabButton>
        </div>
      )}

      {filtered.length > 0 && (
        <ul className="max-h-80 overflow-y-auto divide-y divide-border-subtle">
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
        "px-2.5 py-1 text-[11px] font-medium rounded-t border-b-2 transition-colors",
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
  const [statusOpen, setStatusOpen] = useState(false)
  const [replying, setReplying] = useState(false)
  const [replyDraft, setReplyDraft] = useState("")

  const meta = STATUS_META[comment.status] || STATUS_META.note
  const StatusIcon = meta.icon
  const isResolved = comment.status === "done"

  const saveEdit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== comment.body) updateComment(comment.id, trimmed)
    setEditing(false)
  }

  const submitReply = () => {
    const t = replyDraft.trim()
    if (!t) return
    addComment(anchor, t, { parentId: comment.id })
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
    <li className={cn("p-2.5 text-[13px]", isResolved && "opacity-60")}>
      <div className="flex items-start gap-2">
        {/* Status chip */}
        <div className="relative shrink-0">
          <button
            onClick={() => setStatusOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors",
              meta.bg,
              meta.color,
            )}
            title="Change status"
          >
            <StatusIcon size={10} weight={comment.status === "done" ? "fill" : "regular"} />
            <span>{meta.label}</span>
            <CaretDown size={8} weight="bold" />
          </button>
          {statusOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setStatusOpen(false)} />
              <div className="absolute left-0 top-full mt-1 w-32 bg-surface-overlay border border-border rounded-md shadow-lg p-1 z-50">
                {STATUS_ORDER.map((s) => {
                  const m = STATUS_META[s]
                  const Icon = m.icon
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        setStatus(comment.id, s)
                        setStatusOpen(false)
                      }}
                      className={cn(
                        "flex items-center gap-2 w-full px-2 py-1.5 rounded text-[11px] hover:bg-hover-bg transition-colors",
                        s === comment.status ? "text-foreground" : "text-muted-foreground/80",
                      )}
                    >
                      <Icon size={11} weight={s === "done" ? "fill" : "regular"} className={m.color} />
                      {m.label}
                      {s === comment.status && <span className="ml-auto text-accent">•</span>}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setDraft(comment.body)
                  setEditing(false)
                } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  saveEdit()
                }
              }}
              rows={Math.max(2, draft.split("\n").length)}
              className="w-full resize-none bg-transparent text-[13px] text-foreground/90 outline-none border-b border-accent/40 pb-0.5"
            />
          ) : (
            <div
              onClick={() => !isResolved && setEditing(true)}
              className={cn(
                "whitespace-pre-wrap break-words text-foreground/90 cursor-text",
                isResolved && "line-through cursor-default",
              )}
              title={isResolved ? undefined : "Click to edit"}
            >
              {comment.body}
            </div>
          )}
          <div
            className="mt-1 text-[10px] text-muted-foreground/60"
            title={new Date(comment.createdAt).toLocaleString("en-US")}
          >
            {formatRelativeTime(comment.updatedAt || comment.createdAt)}
            {comment.updatedAt && comment.updatedAt !== comment.createdAt && " (edited)"}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <IconBtn title="Reply" onClick={() => setReplying((v) => !v)}>
            <ArrowBendUpLeft size={12} />
          </IconBtn>
          <IconBtn title="Convert to Note" onClick={convertToNote}>
            <ArrowSquareOut size={12} />
          </IconBtn>
          <IconBtn title="Delete" danger onClick={() => deleteComment(comment.id)}>
            <Trash size={12} />
          </IconBtn>
        </div>
      </div>

      {/* Reply composer */}
      {replying && (
        <div className="mt-2 ml-6 flex items-end gap-1.5">
          <textarea
            autoFocus
            value={replyDraft}
            onChange={(e) => setReplyDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setReplying(false)
                setReplyDraft("")
              } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                submitReply()
              }
            }}
            placeholder="Reply… (Ctrl+Enter)"
            rows={2}
            className="flex-1 resize-none bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/40 outline-none border border-border-subtle rounded p-1.5"
          />
          <button
            onClick={submitReply}
            disabled={!replyDraft.trim()}
            className="p-1 rounded text-accent hover:bg-accent/10 disabled:opacity-30 transition-colors"
          >
            <PaperPlaneRight size={12} weight="fill" />
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
  const [draft, setDraft] = useState(reply.body)

  const save = () => {
    const t = draft.trim()
    if (t && t !== reply.body) updateComment(reply.id, t)
    setEditing(false)
  }

  return (
    <li className="text-[12px] text-foreground/85 group">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {editing ? (
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setDraft(reply.body)
                  setEditing(false)
                } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  save()
                }
              }}
              rows={Math.max(1, draft.split("\n").length)}
              className="w-full resize-none bg-transparent outline-none border-b border-accent/40 pb-0.5"
            />
          ) : (
            <div
              onClick={() => setEditing(true)}
              className="whitespace-pre-wrap break-words cursor-text"
            >
              {reply.body}
            </div>
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
        "p-1 rounded hover:bg-hover-bg transition-colors text-muted-foreground/70",
        danger ? "hover:text-destructive" : "hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}
