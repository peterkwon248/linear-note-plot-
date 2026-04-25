"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { usePlotStore } from "@/lib/store"
import type { Comment, CommentAnchor, CommentStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ChatCircle } from "@phosphor-icons/react/dist/ssr/ChatCircle"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { PaperPlaneRight } from "@phosphor-icons/react/dist/ssr/PaperPlaneRight"
import { ArrowBendUpLeft } from "@phosphor-icons/react/dist/ssr/ArrowBendUpLeft"
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { DotsThree } from "@phosphor-icons/react/dist/ssr/DotsThree"
import { Circle } from "@phosphor-icons/react/dist/ssr/Circle"
import { CircleDashed } from "@phosphor-icons/react/dist/ssr/CircleDashed"
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle"
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning"
import { MapPin } from "@phosphor-icons/react/dist/ssr/MapPin"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { toast } from "sonner"
import { CommentEditor, CommentBodyDisplay } from "./comment-editor"

function isBodyEmpty(body: string): boolean {
  if (!body || !body.trim()) return true
  try {
    const json = JSON.parse(body)
    if (json?.type === "doc") {
      const extract = (n: any): string => n.type === "text" ? (n.text || "") : (n.content?.map(extract).join("") ?? "")
      return extract(json).trim() === ""
    }
  } catch { /* not JSON */ }
  return body.trim() === ""
}

const STATUS_META: Record<CommentStatus, { label: string; icon: any; color: string; bg: string }> = {
  backlog: { label: "Backlog", icon: CircleDashed, color: "text-muted-foreground/70", bg: "bg-muted-foreground/10" },
  todo: { label: "Todo", icon: Circle, color: "text-blue-400", bg: "bg-blue-500/15" },
  done: { label: "Done", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/15" },
  blocker: { label: "Blocker", icon: Warning, color: "text-red-400", bg: "bg-red-500/15" },
}
const STATUS_ORDER: CommentStatus[] = ["backlog", "todo", "done", "blocker"]

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
  const notes = usePlotStore((s) => s.notes)

  const [tab, setTab] = useState<"open" | "resolved">("open")
  const [draft, setDraft] = useState("")
  /** Selected target — "" = document-level, otherwise blockId */
  const [targetBlockId, setTargetBlockId] = useState<string>("")
  const [pickerOpen, setPickerOpen] = useState(false)

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
    if (anchor.kind === "note-block") {
      const t = blockTargets.find((b) => b.id === anchor.nodeId)
      return t?.label.replace(/^[^a-zA-Z0-9가-힣]+\s*/, "") || "Block"
    }
    return null
  }

  // Resolve current note (for kind:"note") to extract block targets from contentJson
  const note = useMemo(() => {
    if (entity.kind !== "note") return null
    return notes.find((n: any) => n.id === entity.noteId) ?? null
  }, [entity, notes])

  // Build block target list — wiki blocks or note ProseMirror top-level nodes
  const blockTargets = useMemo(() => {
    const items: { id: string; label: string; depth: number }[] = []

    // ── Wiki blocks ──
    if (entity.kind === "wiki" && article?.blocks) {
      let currentSectionLevel = 0
      for (const b of article.blocks as any[]) {
        if (b.type === "section") {
          const lvl = (b.level ?? 2) - 1
          currentSectionLevel = lvl
          items.push({ id: b.id, label: `§ ${b.title || "Untitled"}`, depth: lvl })
        } else {
          const depth = currentSectionLevel + 1
          const label = wikiBlockLabel(b)
          items.push({ id: b.id, label, depth })
        }
      }
      return items
    }

    // ── Note blocks (from contentJson top-level nodes) ──
    if (entity.kind === "note" && note?.contentJson) {
      const content = (note.contentJson as any)?.content
      if (Array.isArray(content)) {
        let currentHeadingLevel = 0
        for (const node of content) {
          const id = node?.attrs?.id
          if (!id) continue
          if (node.type === "heading") {
            const text = extractText(node).trim()
            const lvl = node.attrs?.level || 2
            currentHeadingLevel = lvl
            items.push({ id, label: `§ ${text || "Heading"}`, depth: Math.max(0, lvl - 1) })
          } else {
            const text = extractText(node).trim()
            const preview = text.slice(0, 50) || node.type
            items.push({
              id,
              label: noteBlockLabel(node, preview),
              depth: currentHeadingLevel,
            })
          }
        }
      }
      return items
    }

    return items

    // helpers (closures)
    function wikiBlockLabel(b: any): string {
      switch (b.type) {
        case "text":
          return `📝 Text block`
        case "note-ref":
          return `📎 Note ref`
        case "image":
          return `🖼️ Image`
        case "url":
          return `🔗 Link`
        case "table":
          return `📊 Table`
        case "navbox":
          return `🗺️ Navbox`
        case "nav":
        case "navigation":
          return `🧭 Navigation`
        default:
          return `▢ ${b.type}`
      }
    }
    function noteBlockLabel(node: any, preview: string): string {
      const t = node.type
      if (t === "paragraph") return `📝 ${preview || "(empty)"}`
      if (t === "bulletList") return `• Bullet list`
      if (t === "orderedList") return `1. Ordered list`
      if (t === "taskList") return `☐ Task list`
      if (t === "blockquote") return `❝ ${preview}`
      if (t === "codeBlock") return `</> Code`
      if (t === "table") return `📊 Table`
      if (t === "image") return `🖼️ Image`
      if (t === "horizontalRule") return `― Divider`
      if (t === "calloutBlock") return `💡 Callout`
      if (t === "summaryBlock") return `📋 Summary`
      if (t === "details") return `▾ Details`
      if (t === "tocBlock") return `📑 TOC`
      return `▢ ${preview || t}`
    }
    function extractText(node: any): string {
      if (node.type === "text") return node.text || ""
      if (!node.content) return ""
      return node.content.map(extractText).join("")
    }
  }, [entity, article, note])

  const targetLabel = useMemo(() => {
    if (!targetBlockId) return "📄 Document-level"
    const t = blockTargets.find((b) => b.id === targetBlockId)
    return t?.label || "(unknown block)"
  }, [targetBlockId, blockTargets])

  const submit = () => {
    const t = draft.trim()
    if (!t) return
    let anchor: CommentAnchor
    if (targetBlockId) {
      anchor =
        entity.kind === "note"
          ? { kind: "note-block", noteId: entity.noteId, nodeId: targetBlockId }
          : { kind: "wiki-block", articleId: entity.articleId, blockId: targetBlockId }
    } else {
      anchor =
        entity.kind === "note"
          ? { kind: "note", noteId: entity.noteId }
          : { kind: "wiki", articleId: entity.articleId }
    }
    addComment(anchor, t)
    setDraft("")
    // Keep target selection so user can chain comments to same block
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
        {/* Target picker — note + wiki */}
        {blockTargets.length > 0 && (
          <div className="relative mb-1.5">
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] text-muted-foreground/80 hover:text-foreground hover:bg-hover-bg w-full text-left transition-colors"
            >
              <span className="truncate">{targetLabel}</span>
              <CaretDown size={9} weight="bold" className="ml-auto shrink-0" />
            </button>
            {pickerOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
                <div className="absolute left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto bg-surface-overlay border border-border rounded-md shadow-lg p-1 z-50">
                  <button
                    onClick={() => {
                      setTargetBlockId("")
                      setPickerOpen(false)
                    }}
                    className={cn(
                      "flex items-center gap-2 w-full px-2 py-1.5 rounded text-[11px] hover:bg-hover-bg",
                      !targetBlockId ? "text-foreground" : "text-muted-foreground/80",
                    )}
                  >
                    📄 Document-level
                    {!targetBlockId && <span className="ml-auto text-accent">•</span>}
                  </button>
                  <div className="my-1 h-px bg-border/40" />
                  {blockTargets.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setTargetBlockId(b.id)
                        setPickerOpen(false)
                      }}
                      style={{ paddingLeft: `${8 + b.depth * 10}px` }}
                      className={cn(
                        "flex items-center gap-2 w-full pr-2 py-1.5 rounded text-[11px] hover:bg-hover-bg",
                        targetBlockId === b.id ? "text-foreground" : "text-muted-foreground/80",
                      )}
                    >
                      <span className="truncate">{b.label}</span>
                      {targetBlockId === b.id && <span className="ml-auto text-accent shrink-0">•</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex items-stretch gap-1.5">
          <div className="flex-1">
            <CommentEditor
              key={`composer-${draft === "" ? "empty" : "filled"}`}
              initialBody=""
              placeholder="Add a comment…  (Ctrl+Enter)"
              onChange={(b) => setDraft(b)}
              onSubmit={(b) => {
                if (!isBodyEmpty(b)) {
                  setDraft(b)
                  submit()
                }
              }}
              className="text-[13px]"
            />
          </div>
          <button
            onClick={submit}
            disabled={isBodyEmpty(draft)}
            className="p-1.5 self-end rounded text-accent hover:bg-accent/10 disabled:opacity-30 transition-colors"
          >
            <PaperPlaneRight size={14} weight="fill" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Status picker (portal-based) ───────────────────── */

function StatusPicker({ current, onChange }: { current: CommentStatus; onChange: (s: CommentStatus) => void }) {
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
        className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium", meta.bg, meta.color)}
      >
        <StatusIcon size={9} weight={current === "done" ? "fill" : "regular"} />
        <span>{meta.label}</span>
        <CaretDown size={7} weight="bold" />
      </button>
      {open && coords && typeof window !== "undefined" &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[10010]" onClick={() => setOpen(false)} />
            <div className="fixed z-[10011] w-32 bg-surface-overlay border border-border rounded-md shadow-lg p-1" style={{ top: coords.top, left: coords.left }}>
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
                    className={cn("flex items-center gap-2 w-full px-2 py-1.5 rounded text-[11px] hover:bg-hover-bg", s === current ? "text-foreground" : "text-muted-foreground/80")}
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
  const [replying, setReplying] = useState(false)
  const [replyDraft, setReplyDraft] = useState("")

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
        {/* Status — portal-based picker */}
        <div className="shrink-0">
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
              className="text-[12px]"
            />
          ) : (
            <CommentBodyDisplay
              body={comment.body}
              onClick={() => !isResolved && setEditing(true)}
              className={cn("text-foreground/85 cursor-text text-[12px]", isResolved && "line-through cursor-default")}
            />
          )}
          <div className="mt-0.5 text-[10px] text-muted-foreground/50">{formatRelativeTime(comment.updatedAt || comment.createdAt)}</div>
        </div>

        {/* Actions: Reply primary, others under ⋯ */}
        <div className="flex items-center gap-0.5 shrink-0">
          <IconBtn title="Reply" onClick={() => setReplying((v) => !v)}>
            <ArrowBendUpLeft size={11} />
          </IconBtn>
          <MoreMenu
            onConvert={convertToNote}
            onDelete={() => deleteComment(comment.id)}
          />
        </div>
      </div>

      {replying && (
        <div className="mt-2 ml-5 flex items-stretch gap-1.5">
          <div className="flex-1">
            <CommentEditor
              initialBody=""
              autoFocus
              placeholder="Reply… (Ctrl+Enter)"
              onChange={(b) => setReplyDraft(b)}
              onSubmit={(b) => {
                if (!isBodyEmpty(b)) {
                  setReplyDraft(b)
                  submitReply()
                }
              }}
              onCancel={() => {
                setReplying(false)
                setReplyDraft("")
              }}
              showToolbar={false}
              className="text-[11px]"
            />
          </div>
          <button onClick={submitReply} disabled={isBodyEmpty(replyDraft)} className="p-1 self-end rounded text-accent hover:bg-accent/10 disabled:opacity-30">
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
                  <CommentBodyDisplay body={r.body} className="text-[11px]" />
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

function MoreMenu({
  onConvert,
  onDelete,
}: {
  onConvert: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="More actions"
        className="p-1 rounded hover:bg-hover-bg transition-colors text-muted-foreground/60 hover:text-foreground"
      >
        <DotsThree size={12} weight="bold" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-40 bg-surface-overlay border border-border rounded-md shadow-lg p-1 z-50">
            <button
              onClick={() => {
                onConvert()
                setOpen(false)
              }}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-[11px] text-foreground/85 hover:bg-hover-bg"
            >
              <ArrowSquareOut size={11} />
              Convert to Note
            </button>
            <button
              onClick={() => {
                onDelete()
                setOpen(false)
              }}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-[11px] text-destructive hover:bg-hover-bg"
            >
              <Trash size={11} />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
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
