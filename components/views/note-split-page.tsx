"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import { setSplitTargetNoteId } from "@/lib/note-split-mode"
import { getBody } from "@/lib/note-body-store"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Scissors,
  X,
  GripVertical,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Check,
  Layers,
} from "lucide-react"

/* ──────────────────────────────────────────────────────────
 * Types — top-level TipTap node we handle.
 * ────────────────────────────────────────────────────────── */

type TipTapBlock = {
  type: string
  attrs?: { id?: string; level?: number; src?: string; alt?: string; noteId?: string; articleId?: string; [k: string]: any }
  content?: TipTapBlock[]
  text?: string
  marks?: any[]
}

interface TopLevelBlock {
  /** Index within doc.content (used as fallback identity if no UniqueID). */
  index: number
  /** UniqueID-assigned id; falls back to `idx-${index}`. */
  id: string
  /** Raw node ref. */
  node: TipTapBlock
}

/* ──────────────────────────────────────────────────────────
 * Plain-text helper — recurse into a node and concat all text.
 * Used for headings, paragraphs, etc. Keeps preview readable.
 * ────────────────────────────────────────────────────────── */

function nodeText(node: TipTapBlock): string {
  if (typeof node.text === "string") return node.text
  if (!node.content) return ""
  return node.content.map(nodeText).join("")
}

function truncate(s: string, n: number): string {
  const trimmed = s.trim()
  if (trimmed.length <= n) return trimmed
  return trimmed.slice(0, n) + "…"
}

/* ──────────────────────────────────────────────────────────
 * BlockLabel — visual label for one top-level node.
 * Mirrors wiki-split-page's BlockLabel but for TipTap node types.
 * ────────────────────────────────────────────────────────── */

function BlockLabel({
  node,
  noteTitleMap,
  wikiTitleMap,
}: {
  node: TipTapBlock
  noteTitleMap: Map<string, string>
  wikiTitleMap: Map<string, string>
}) {
  switch (node.type) {
    case "heading": {
      const level = node.attrs?.level ?? 1
      const text = nodeText(node) || "Untitled heading"
      return (
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-2xs font-medium uppercase text-white/30">
            H{level}
          </span>
          <span className="font-semibold text-white/90">{truncate(text, 80)}</span>
        </div>
      )
    }
    case "paragraph": {
      const text = nodeText(node)
      return (
        <span className="text-white/60">
          {text ? truncate(text, 100) : <span className="italic text-white/25">Empty paragraph</span>}
        </span>
      )
    }
    case "image": {
      const alt = node.attrs?.alt
      return <span className="text-white/60">🖼 {alt || "Image"}</span>
    }
    case "audio":
      return <span className="text-white/60">🎵 Audio</span>
    case "noteEmbed": {
      const id = node.attrs?.noteId as string | undefined
      const title = id ? noteTitleMap.get(id) : undefined
      return <span className="text-white/60">📝 Note: {title ?? "(unknown)"}</span>
    }
    case "wikiEmbed": {
      const id = node.attrs?.articleId as string | undefined
      const title = id ? wikiTitleMap.get(id) : undefined
      return <span className="text-white/60">📖 Wiki: {title ?? "(unknown)"}</span>
    }
    case "linkCard": {
      const url = (node.attrs?.url as string | undefined) ?? ""
      return <span className="text-white/60">🔗 {url ? truncate(url, 80) : "Link card"}</span>
    }
    case "bulletList":
    case "orderedList":
    case "taskList": {
      const count = node.content?.length ?? 0
      const kind =
        node.type === "taskList" ? "Task list" : node.type === "orderedList" ? "Numbered list" : "Bullet list"
      return (
        <span className="text-white/60">
          {kind} · {count} item{count === 1 ? "" : "s"}
        </span>
      )
    }
    case "blockquote": {
      const text = nodeText(node)
      return <span className="text-white/60">❝ {text ? truncate(text, 80) : "Blockquote"}</span>
    }
    case "codeBlock": {
      const text = nodeText(node)
      return (
        <span className="text-white/60 font-mono">
          {"</>"} {text ? truncate(text, 80) : "Code block"}
        </span>
      )
    }
    case "details": {
      const text = nodeText(node)
      return <span className="text-white/60">▸ Toggle: {text ? truncate(text, 80) : "(empty)"}</span>
    }
    case "calloutBlock": {
      const text = nodeText(node)
      return <span className="text-white/60">💡 Callout: {truncate(text, 80) || "(empty)"}</span>
    }
    case "summaryBlock": {
      const text = nodeText(node)
      return <span className="text-white/60">📋 Summary: {truncate(text, 80) || "(empty)"}</span>
    }
    case "columnsBlock":
      return <span className="text-white/60">▦ Columns</span>
    case "infoboxBlock":
      return <span className="text-white/60">ℹ Infobox</span>
    case "tocBlock":
      return <span className="text-white/60">📑 Table of contents</span>
    case "table": {
      const rows = node.content?.length ?? 0
      return <span className="text-white/60">▦ Table · {rows} row{rows === 1 ? "" : "s"}</span>
    }
    case "horizontalRule":
      return <span className="text-white/30">— Divider —</span>
    case "queryBlock":
      return <span className="text-white/60">⚙ Query block</span>
    case "anchorDivider":
      return <span className="text-white/30">⚓ Anchor</span>
    case "footnotesFooter":
      return <span className="text-white/30">📎 Footnotes footer</span>
    default:
      return <span className="text-white/60 capitalize">{node.type}</span>
  }
}

/* ──────────────────────────────────────────────────────────
 * Heading-group helper — given an index into the top-level
 * blocks list, return the indices of all blocks that belong
 * to that heading's section (i.e. up to the next heading of
 * equal-or-higher level, exclusive).
 *
 * Used for "click heading → auto-select section" behavior.
 * If the clicked block is not a heading, returns just [idx].
 * ────────────────────────────────────────────────────────── */

function headingGroupIndices(blocks: TopLevelBlock[], idx: number): number[] {
  const node = blocks[idx]?.node
  if (!node || node.type !== "heading") return [idx]
  const startLevel = node.attrs?.level ?? 1
  const result = [idx]
  for (let i = idx + 1; i < blocks.length; i++) {
    const cur = blocks[i].node
    if (cur.type === "heading") {
      const lvl = cur.attrs?.level ?? 1
      if (lvl <= startLevel) break
    }
    result.push(i)
  }
  return result
}

/* ──────────────────────────────────────────────────────────
 * Main component.
 * ────────────────────────────────────────────────────────── */

interface NoteSplitPageProps {
  noteId: string
  onClose?: () => void
}

export function NoteSplitPage({ noteId, onClose }: NoteSplitPageProps) {
  const note = usePlotStore((s) => s.notes.find((n) => n.id === noteId)) ?? null
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const splitNote = usePlotStore((s) => s.splitNote)

  // Snapshot the source contentJson on mount. This is intentional — under
  // Y.Doc mode (`?yjs=1`) the persisted contentJson can lag behind the live
  // editor state. A future PR may pass `editor.getJSON()` from the active
  // editor instance instead.
  // TODO(yjs): integrate with active editor instance to read live JSON.
  //
  // Note: store strips contentJson on persist (lib/store/index.ts partialize),
  // so for notes opened from the list (not currently in editor) the in-memory
  // store has contentJson=null. We hydrate from IDB on mount.
  const [sourceJson, setSourceJson] = useState<TipTapBlock>(() => {
    const cj = (note?.contentJson as TipTapBlock | null) ?? null
    if (cj && Array.isArray(cj.content) && cj.content.length > 0) return cj
    return { type: "doc", content: [] }
  })
  const [hydrating, setHydrating] = useState(() => {
    const cj = (note?.contentJson as TipTapBlock | null) ?? null
    return !cj || !Array.isArray(cj.content) || cj.content.length === 0
  })

  useEffect(() => {
    if (!hydrating) return
    let cancelled = false
    getBody(noteId)
      .then((body) => {
        if (cancelled) return
        const cj = body?.contentJson as TipTapBlock | null | undefined
        if (cj && Array.isArray(cj.content) && cj.content.length > 0) {
          setSourceJson(cj)
        }
      })
      .catch(() => { /* ignore — show empty state */ })
      .finally(() => { if (!cancelled) setHydrating(false) })
    return () => { cancelled = true }
  }, [noteId, hydrating])

  // If the source note disappears (e.g. deleted while in split mode), bail.
  useEffect(() => {
    if (!note) {
      setSplitTargetNoteId(null)
      onClose?.()
    }
  }, [note, onClose])

  // Derive top-level blocks with stable ids (UniqueID or fallback).
  const topLevel: TopLevelBlock[] = useMemo(() => {
    const items = (sourceJson.content ?? []) as TipTapBlock[]
    return items.map((node, index) => ({
      index,
      id: (node.attrs?.id as string | undefined) ?? `idx-${index}`,
      node,
    }))
  }, [sourceJson])

  // Right-column: ids of blocks moved to the new note (preserves order).
  const [rightIds, setRightIds] = useState<string[]>([])

  // Selection in left column for batch-move.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lastClickedIdx, setLastClickedIdx] = useState<number | null>(null)

  // New note title.
  const [newTitle, setNewTitle] = useState("")

  // Lookup maps for embed labels.
  const noteTitleMap = useMemo(() => {
    const m = new Map<string, string>()
    notes.forEach((n) => m.set(n.id, n.title || "Untitled"))
    return m
  }, [notes])
  const wikiTitleMap = useMemo(() => {
    const m = new Map<string, string>()
    wikiArticles.forEach((a) => m.set(a.id, a.title))
    return m
  }, [wikiArticles])

  // Left blocks = topLevel minus those moved to right (preserves order).
  const leftBlocks = useMemo(() => {
    const rightSet = new Set(rightIds)
    return topLevel.filter((b) => !rightSet.has(b.id))
  }, [topLevel, rightIds])

  // Right blocks (full data, in user-defined order).
  const rightBlocks = useMemo(() => {
    const map = new Map(topLevel.map((b) => [b.id, b]))
    return rightIds.map((id) => map.get(id)).filter(Boolean) as TopLevelBlock[]
  }, [topLevel, rightIds])

  /* ── Block click — handles checkbox toggle, Shift-range, and
   *    click-on-heading auto-section-select. ── */
  const handleBlockClick = useCallback(
    (blockId: string, leftIdx: number, e: React.MouseEvent) => {
      const shift = e.shiftKey
      const isHeading = leftBlocks[leftIdx]?.node.type === "heading"

      if (shift && lastClickedIdx !== null) {
        // Range select within the LEFT list.
        const start = Math.min(lastClickedIdx, leftIdx)
        const end = Math.max(lastClickedIdx, leftIdx)
        setSelectedIds((prev) => {
          const next = new Set(prev)
          for (let i = start; i <= end; i++) {
            if (leftBlocks[i]) next.add(leftBlocks[i].id)
          }
          return next
        })
      } else if (isHeading) {
        // Click on heading → auto-toggle the entire section.
        // Compute group indices in topLevel space, then map to leftBlocks ids.
        const sourceIdx = topLevel.findIndex((b) => b.id === blockId)
        const groupTopIdx = sourceIdx >= 0 ? headingGroupIndices(topLevel, sourceIdx) : [sourceIdx]
        const groupIds = groupTopIdx.map((i) => topLevel[i]?.id).filter(Boolean) as string[]
        // Filter to ids still on the left (not already moved right).
        const leftIdSet = new Set(leftBlocks.map((b) => b.id))
        const visible = groupIds.filter((id) => leftIdSet.has(id))
        setSelectedIds((prev) => {
          const next = new Set(prev)
          // Toggle-as-group: if every visible group id is already selected, deselect; else select all.
          const allSelected = visible.length > 0 && visible.every((id) => next.has(id))
          if (allSelected) {
            visible.forEach((id) => next.delete(id))
          } else {
            visible.forEach((id) => next.add(id))
          }
          return next
        })
      } else {
        setSelectedIds((prev) => {
          const next = new Set(prev)
          if (next.has(blockId)) next.delete(blockId)
          else next.add(blockId)
          return next
        })
      }
      setLastClickedIdx(leftIdx)
    },
    [lastClickedIdx, leftBlocks, topLevel],
  )

  /* ── Move selected → right column ── */
  const moveToRight = useCallback(() => {
    const toMove = leftBlocks.filter((b) => selectedIds.has(b.id)).map((b) => b.id)
    if (toMove.length === 0) return
    setRightIds((prev) => [...prev, ...toMove])
    setSelectedIds(new Set())
    setLastClickedIdx(null)
  }, [leftBlocks, selectedIds])

  /* ── Move single block back to left ── */
  const moveToLeft = useCallback((blockId: string) => {
    setRightIds((prev) => prev.filter((id) => id !== blockId))
  }, [])

  const moveAllToLeft = useCallback(() => {
    setRightIds([])
  }, [])

  /* ── Reorder within right column ── */
  const reorderRight = useCallback((fromIdx: number, toIdx: number) => {
    setRightIds((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      return next
    })
  }, [])

  /* ── Commit split ── */
  const handleSplit = useCallback(() => {
    if (rightIds.length === 0 || !newTitle.trim() || !note) return
    if (leftBlocks.length === 0) {
      toast.error("Cannot split: at least one block must remain in the original note.")
      return
    }

    // Build extracted doc (right column, in user order).
    const rightSet = new Set(rightIds)
    const extractedNodes = rightIds
      .map((id) => topLevel.find((b) => b.id === id)?.node)
      .filter(Boolean) as TipTapBlock[]
    const remainingNodes = topLevel.filter((b) => !rightSet.has(b.id)).map((b) => b.node)

    if (extractedNodes.length === 0 || remainingNodes.length === 0) return

    const extractedJson = { type: "doc", content: extractedNodes }
    const remainingJson = { type: "doc", content: remainingNodes }

    const newId = splitNote(note.id, {
      extractedJson,
      remainingJson,
      newTitle: newTitle.trim(),
    })

    if (newId) {
      toast.success(`Split "${newTitle.trim()}" from "${note.title || "Untitled"}"`)
      // Close split mode — store.selectedNoteId is already updated to newId by the slice.
      setSplitTargetNoteId(null)
      onClose?.()
    } else {
      toast.error("Split failed — both sides need at least one block.")
    }
  }, [rightIds, newTitle, note, leftBlocks.length, topLevel, splitNote, onClose])

  const handleCancel = useCallback(() => {
    setSplitTargetNoteId(null)
    onClose?.()
  }, [onClose])

  if (!note) return null

  // Hydrating from IDB — show spinner.
  if (hydrating) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background">
        <div className="text-2xs text-white/50">Loading note content…</div>
      </div>
    )
  }

  // Note has no content or fewer than 2 blocks — cannot split.
  if (topLevel.length < 2) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background">
        <Scissors size={28} className="text-white/30" />
        <div className="text-note text-white/70">
          {topLevel.length === 0
            ? "This note has no content to split."
            : "This note needs at least 2 blocks to split."}
        </div>
        <button
          onClick={handleCancel}
          className="mt-2 rounded-md bg-white/5 px-4 py-2 text-2xs text-white/70 transition-colors hover:bg-white/10"
        >
          ← Back
        </button>
      </div>
    )
  }

  /* ── Render ── */
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCancel}
            className="rounded-md px-2 py-1 text-2xs text-white/50 transition-colors hover:bg-white/5 hover:text-white/70"
          >
            ← Back
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
            <Scissors size={16} className="text-white/70" />
          </div>
          <div>
            <h2 className="text-note font-semibold text-white/90">
              Split: {note.title || "Untitled"}
            </h2>
            <p className="text-2xs text-white/40">
              {leftBlocks.length} block{leftBlocks.length === 1 ? "" : "s"} remaining ·{" "}
              {rightIds.length} block{rightIds.length === 1 ? "" : "s"} to split
            </p>
          </div>
          <div className="ml-auto">
            <button
              onClick={handleCancel}
              className="rounded-md px-3 py-2 text-note text-white/50 transition-colors hover:bg-white/5 hover:text-white/70"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex min-h-0 flex-1">
        {/* Left Column: Original Note */}
        <div className="flex w-1/2 flex-col border-r border-white/[0.06]">
          <div className="shrink-0 px-4 pt-3 pb-2 flex items-center justify-between">
            <h3 className="text-note font-medium text-white/50 uppercase tracking-wider">
              Original Note
            </h3>
            {selectedIds.size > 0 && (
              <button
                onClick={moveToRight}
                className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-2xs font-medium text-accent transition-colors hover:bg-accent/20"
              >
                Move {selectedIds.size} →
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {leftBlocks.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-2xs text-white/20">All blocks moved to new note</p>
              </div>
            ) : (
              leftBlocks.map((b, idx) => {
                const isSelected = selectedIds.has(b.id)
                return (
                  <div
                    key={b.id}
                    onClick={(e) => handleBlockClick(b.id, idx, e)}
                    className={cn(
                      "group flex cursor-pointer items-start gap-2.5 rounded-md px-3 py-2.5 transition-all duration-100",
                      isSelected
                        ? "bg-blue-500/10 ring-1 ring-blue-500/30"
                        : "hover:bg-white/[0.03]",
                    )}
                  >
                    {/* Checkbox */}
                    <div
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                        isSelected ? "border-blue-500 bg-blue-500" : "border-white/15",
                      )}
                    >
                      {isSelected && <Check size={10} className="text-white" />}
                    </div>

                    <div className="min-w-0 flex-1 text-note">
                      <BlockLabel node={b.node} noteTitleMap={noteTitleMap} wikiTitleMap={wikiTitleMap} />
                    </div>

                    <span className="mt-0.5 shrink-0 rounded bg-white/[0.04] px-1 py-0.5 text-2xs uppercase text-white/20">
                      {b.node.type}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: New Note Preview */}
        <div className="flex w-1/2 flex-col">
          <div className="shrink-0 px-4 pt-3 pb-2 flex items-center justify-between">
            <h3 className="text-note font-medium text-white/50 uppercase tracking-wider">
              New Note
            </h3>
            {rightIds.length > 0 && (
              <button
                onClick={moveAllToLeft}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-2xs text-white/40 transition-colors hover:bg-white/5 hover:text-white/60"
              >
                <ArrowLeft size={12} />
                Return all
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {rightBlocks.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-white/[0.08] bg-white/[0.02]">
                <div className="text-center px-4">
                  <Layers size={32} className="mx-auto mb-3 text-white/10" />
                  <p className="text-note text-white/25">
                    Select blocks and click <span className="text-accent">Move →</span>
                  </p>
                  <p className="mt-1 text-note text-white/15">
                    Click a heading to auto-select its section · Shift+Click for range
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-0.5">
                {rightBlocks.map((b, idx) => (
                  <div
                    key={b.id}
                    className="group flex items-start gap-2.5 rounded-md bg-white/[0.04] px-3 py-2.5"
                  >
                    <GripVertical
                      size={12}
                      className="mt-0.5 shrink-0 cursor-grab text-white/15"
                    />

                    <div className="min-w-0 flex-1 text-note">
                      <BlockLabel
                        node={b.node}
                        noteTitleMap={noteTitleMap}
                        wikiTitleMap={wikiTitleMap}
                      />
                    </div>

                    <span className="mt-0.5 shrink-0 rounded bg-white/[0.04] px-1 py-0.5 text-2xs uppercase text-white/20">
                      {b.node.type}
                    </span>

                    {idx > 0 && (
                      <button
                        onClick={() => reorderRight(idx, idx - 1)}
                        className="rounded p-0.5 text-white/15 opacity-0 transition-opacity hover:bg-white/5 hover:text-white/40 group-hover:opacity-100"
                        title="Move up"
                      >
                        <ChevronRight size={10} className="-rotate-90" />
                      </button>
                    )}
                    {idx < rightBlocks.length - 1 && (
                      <button
                        onClick={() => reorderRight(idx, idx + 1)}
                        className="rounded p-0.5 text-white/15 opacity-0 transition-opacity hover:bg-white/5 hover:text-white/40 group-hover:opacity-100"
                        title="Move down"
                      >
                        <ChevronRight size={10} className="rotate-90" />
                      </button>
                    )}

                    <button
                      onClick={() => moveToLeft(b.id)}
                      className="rounded p-0.5 text-white/15 opacity-0 transition-opacity hover:bg-white/5 hover:text-destructive group-hover:opacity-100"
                      title="Remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/[0.06] bg-white/[0.02] px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-note text-white/40">New Note Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title for the split note…"
              className="h-9 w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-3 text-note text-white/90 placeholder:text-white/30 focus:border-white/20 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && rightIds.length > 0 && newTitle.trim() && leftBlocks.length > 0) {
                  e.preventDefault()
                  handleSplit()
                }
              }}
            />
          </div>

          <div className="flex items-end gap-3 pt-4">
            <button
              onClick={handleSplit}
              disabled={
                rightIds.length === 0 || !newTitle.trim() || leftBlocks.length === 0
              }
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-note font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Scissors size={14} />
              Split {rightIds.length} Block{rightIds.length === 1 ? "" : "s"}
            </button>
            <button
              onClick={handleCancel}
              className="rounded-md px-3 py-2 text-note text-white/50 transition-colors hover:bg-white/5 hover:text-white/70"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
