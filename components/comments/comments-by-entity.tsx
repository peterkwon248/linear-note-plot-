"use client"

import { useMemo, useState } from "react"
import { usePlotStore } from "@/lib/store"
import type { Comment, CommentAnchor, CommentStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
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
import { MapPin } from "@phosphor-icons/react/dist/ssr/MapPin"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { toast } from "sonner"

const STATUS_META: Record<CommentStatus, { label: string; icon: any; color: string; bg: string }> = {
  note: { label: "Note", icon: PhNote, color: "text-muted-foreground/70", bg: "bg-muted-foreground/10" },
  todo: { label: "Todo", icon: Circle, color: "text-blue-400", bg: "bg-blue-500/15" },
  done: { label: "Done", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/15" },
  blocker: { label: "Blocker", icon: Warning, color: "text-red-400", bg: "bg-red-500/15" },
}
const STATUS_ORDER: CommentStatus[] = ["note", "todo", "done", "blocker"]

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

function isCommentOnEntity(c: Comment, entity: { kind: "note"; noteId: string } | { kind: "wiki"; articleId: string }): boolean {
  const a = c.anchor
  if (entity.kind === "note") {
    if (a.kind === "note" && a.noteId === entity.noteId) return true
    if (a.kind === "note-block" && a.noteId === entity.noteId) return true
    return false
  }
  if (entity.kind === "wiki") {
    if (a.kind === "wiki" && a.articleId === entity.articleId) return true
    if (a.kind === "wiki-block" && a.articleId === entity.articleId) return true
    return false
  }
  return false
}

function anchorIsBlock(a: CommentAnchor): boolean {
  return a.kind === "note-block" || a.kind === "wiki-block"
}

function getBlockId(a: CommentAnchor): string | null {
  if (a.kind === "wiki-block") return a.blockId
  if (a.kind === "note-block") return a.nodeId
  return null
}

/**
 * Comments section in side panel Activity tab.
 * Aggregates ALL comments anchored to the current entity (block-level + entity-level).
 */
export function CommentsByEntity({
  entity,
}: {
  entity: { kind: "note"; noteId: string } | { kind: "wiki"; articleId: string }
}) {
  const comments = usePlotStore((s) => s.comments)
  const addComment = usePlotStore((s) => s.addComment)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)

  const [tab, setTab] = useState<"open" | "resolved">("open")
  const [draft, setDraft] = useState("")

  const matched = useMemo(() => {
    return Object.values(comments)
      .filter((c) => isCommentOnEntity(c, entity))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }, [comments, entity])

  const tops = useMemo(() => matched.filter((c) => !c.parentId), [matched])
  const repliesByParent = useMemo(() => {
    const map = new Map<string, Comment[]>()
    for (const c of matched) {
      if (c.parentId) {
        if (!map.has(c.parentId)) map.set(c.parentId, [])
        map.get(c.parentId)!.push(c)
      }
    }
    return map
  }, [matched])

  const filtered = useMemo(() => {
    return tops.filter((c) => (tab === "open" ? c.status !== "done" : c.status === "done"))
  }, [tops, tab])

  const openCount = tops.filter((c) => c.status !== "done").length
  const resolvedCount = tops.filter((c) => c.status === "done").length

  // Resolve block label from wiki article (for wiki kind)
  const article = useMemo(() => {
    if (entity.kind !== "wiki") return null
    return wikiArticles.find((a) => a.id === entity.articleId) ?? null
  }, [entity, wikiArticles])

  const blockLabel = (anchor: CommentAnchor): string | null => {
    if (anchor.kind === "wiki-block" && article) {
      const block = article.blocks?.find((b: any) => b.id === anchor.blockId)
      if (!block) return "(deleted block)"
      if (block.type === "section") return block.title || "Untitled section"
      return block.type
    }
    if (anchor.kind === "note-block") return "Block"
    return null
  }

  const submit = () => {
    const t = draft.trim()
    if (!t) return
    const anchor: CommentAnchor =
      entity.kind === "note"
        ? { kind: "note", noteId: entity.noteId }
        : { kind: "wiki", articleId: entity.articleId }
    addComment(anchor, t)
    setDraft("")
  }

  const scrollToBlock = (blockId: string) => {
    const safe = (window as any).CSS?.escape ? CSS.escape(blockId) : blockId
    const el =
      document.querySelector(`[data-id="${safe}"]`) ||
      document.querySelector(`[id="wiki-block-${safe}"]`) ||
      document.querySelector(`[id="${safe}"]`)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      // Brief highlight
      ;(el as HTMLElement).classList.add("ring-2", "ring-accent/50", "rounded")
      setTimeout(() => (el as HTMLElement).classList.remove("ring-2", "ring-accent/50", "rounded"), 1200)
    }
  }

  return (
    <div className="px-2 py-2">
      <div className="flex items-center gap-2 mb-2 px-2">
        <ChatCircle size={14} weight="regular" className="text-muted-foreground" />
        <span className="text-2xs font-medium text-muted-foreground uppercase tracking-wider">Comments</span>
        <span className="text-2xs text-muted-foreground/50">{tops.length}</span>
      </div>

      {/* Tabs */}
      {tops.length > 0 && (
        <div className="flex items-center gap-1 px-2 border-b border-border-subtle mb-1">
          <TabButton active={tab === "open"} onClick={() => setTab("open")} count={openCount}>
            Open
          </TabButton>
          <TabButton active={tab === "resolved"} onClick={() => setTab("resolved")} count={resolvedCount}>
            Resolved
          </TabButton>
        </div>
      )}

      {filtered.length === 0 && tops.length > 0 && (
        <p className="px-2 py-3 text-[12px] text-muted-foreground/50 italic">
          No {tab === "open" ? "open" : "resolved"} comments.
        </p>
      )}

      {tops.length === 0 && (
        <p className="px-2 py-2 text-[12px] text-muted-foreground/50 italic">
          No comments yet.
        </p>
      )}

      <ul className="space-y-1">
        {filtered.map((c) => (
          <CommentRow
            key={c.id}
            comment={c}
            replies={repliesByParent.get(c.id) || []}
            blockLabel={blockLabel(c.anchor)}
            isBlock={anchorIsBlock(c.anchor)}
            onJump={() => {
              const bid = getBlockId(c.anchor)
              if (bid) scrollToBlock(bid)
            }}
          />
        ))}
      </ul>

      {/* Composer */}
      <div className="mt-3 mx-2 border-t border-border-subtle pt-2">
        <div className="flex items-end gap-1.5">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder={`Add a comment to this ${entity.kind}…  (Ctrl+Enter)`}
            rows={2}
            className="flex-1 resize-none bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/40 outline-none border border-border-subtle rounded p-1.5"
          />
          <button
            onClick={submit}
            disabled={!draft.trim()}
            className="p-1.5 rounded text-accent hover:bg-accent/10 disabled:opacity-30 transition-colors"
          >
            <PaperPlaneRight size={14} weight="fill" />
          </button>
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, count, children }: { active: boolean; onClick: () => void; count: number; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2 py-1 text-[11px] font-medium rounded-t border-b-2 transition-colors",
        active ? "text-foreground border-accent" : "text-muted-foreground/60 border-transparent hover:text-foreground/80",
      )}
    >
      {children}
      <span className="ml-1.5 text-muted-foreground/50">{count}</span>
    </button>
  )
}

function CommentRow({
  comment,
  replies,
  blockLabel,
  isBlock,
  onJump,
}: {
  comment: Comment
  replies: Comment[]
  blockLabel: string | null
  isBlock: boolean
  onJump: () => void
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
    const t = draft.trim()
    if (t && t !== comment.body) updateComment(comment.id, t)
    setEditing(false)
  }

  const submitReply = () => {
    const t = replyDraft.trim()
    if (!t) return
    addComment(comment.anchor, t, { parentId: comment.id })
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
      setStatus(comment.id, "done")
      const openNote = (usePlotStore.getState() as any).openNote
      toast.success("Comment moved to Inbox", {
        action: openNote ? { label: "Open", onClick: () => openNote(id) } : undefined,
      })
    } catch {
      toast.error("Failed to convert to note")
    }
  }

  return (
    <li className={cn("rounded-md px-2 py-2 hover:bg-hover-bg/40 transition-colors text-[12px]", isResolved && "opacity-60")}>
      {/* Anchor label */}
      <div className="flex items-center gap-1.5 mb-1">
        {isBlock ? (
          <button
            onClick={onJump}
            className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-accent transition-colors"
            title="Jump to block"
          >
            <MapPin size={9} weight="fill" />
            <span className="truncate max-w-[180px]">{blockLabel || "Block"}</span>
          </button>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
            <FileText size={9} weight="regular" />
            <span>Document-level</span>
          </span>
        )}
      </div>

      <div className="flex items-start gap-1.5">
        {/* Status */}
        <div className="relative shrink-0">
          <button
            onClick={() => setStatusOpen((v) => !v)}
            className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium", meta.bg, meta.color)}
          >
            <StatusIcon size={9} weight={comment.status === "done" ? "fill" : "regular"} />
            <span>{meta.label}</span>
            <CaretDown size={7} weight="bold" />
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
                      className={cn("flex items-center gap-2 w-full px-2 py-1.5 rounded text-[11px] hover:bg-hover-bg", s === comment.status ? "text-foreground" : "text-muted-foreground/80")}
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
              className="w-full resize-none bg-transparent outline-none border-b border-accent/40 pb-0.5"
            />
          ) : (
            <div
              onClick={() => !isResolved && setEditing(true)}
              className={cn("whitespace-pre-wrap break-words text-foreground/85 cursor-text", isResolved && "line-through cursor-default")}
            >
              {comment.body}
            </div>
          )}
          <div className="mt-0.5 text-[10px] text-muted-foreground/50">{formatRelativeTime(comment.updatedAt || comment.createdAt)}</div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <IconBtn title="Reply" onClick={() => setReplying((v) => !v)}>
            <ArrowBendUpLeft size={11} />
          </IconBtn>
          <IconBtn title="Convert to Note" onClick={convertToNote}>
            <ArrowSquareOut size={11} />
          </IconBtn>
          <IconBtn title="Delete" danger onClick={() => deleteComment(comment.id)}>
            <Trash size={11} />
          </IconBtn>
        </div>
      </div>

      {replying && (
        <div className="mt-2 ml-5 flex items-end gap-1.5">
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
            className="flex-1 resize-none bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground/40 outline-none border border-border-subtle rounded p-1.5"
          />
          <button onClick={submitReply} disabled={!replyDraft.trim()} className="p-1 rounded text-accent hover:bg-accent/10 disabled:opacity-30">
            <PaperPlaneRight size={11} weight="fill" />
          </button>
        </div>
      )}

      {replies.length > 0 && (
        <ul className="mt-2 ml-5 space-y-1.5 border-l border-border-subtle pl-2.5">
          {replies.map((r) => (
            <li key={r.id} className="text-[11px] text-foreground/80 group">
              <div className="flex items-start gap-1.5">
                <div className="flex-1 min-w-0">
                  <div className="whitespace-pre-wrap break-words">{r.body}</div>
                  <div className="mt-0.5 text-[9px] text-muted-foreground/50">{formatRelativeTime(r.updatedAt || r.createdAt)}</div>
                </div>
                <button
                  onClick={() => deleteComment(r.id)}
                  className="opacity-0 group-hover:opacity-60 hover:!opacity-100 p-0.5 rounded text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash size={9} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function IconBtn({ children, title, onClick, danger }: { children: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn("p-1 rounded hover:bg-hover-bg transition-colors text-muted-foreground/60", danger ? "hover:text-destructive" : "hover:text-foreground")}
    >
      {children}
    </button>
  )
}
