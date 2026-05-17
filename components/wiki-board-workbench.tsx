"use client"

/**
 * WikiBoardWorkbench — right-side overview/selection panel for the Wiki
 * board view. Mirrors the NotesBoard `BoardWorkbench` pattern so wiki gets
 * the same "no floating bar — sticky workbench replaces it" UX (영구 룰 21
 * — entity-uniformity).
 *
 * Phase 1 (2026-05-15): overview + minimal batch trash.
 * Phase 2 (2026-05-15): full batch actions — Pin / Move folder / Add to
 * category / Merge / Split / Trash. Mirrors `wiki-floating-action-bar.tsx`
 * so board mode users get the same action set as list mode (영구 룰 21
 * — board floating bar는 hidden, workbench가 대체).
 */

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { usePlotStore } from "@/lib/store"
import { pushUndo } from "@/lib/undo-manager"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FolderPicker } from "@/components/folder-picker"
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { CursorClick } from "@phosphor-icons/react/dist/ssr/CursorClick"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { PushPinSlash } from "@phosphor-icons/react/dist/ssr/PushPinSlash"
import { FolderOpen } from "@phosphor-icons/react/dist/ssr/FolderOpen"
import { Tag as PhTag } from "@phosphor-icons/react/dist/ssr/Tag"
import { GitMerge } from "@phosphor-icons/react/dist/ssr/GitMerge"
import { Scissors } from "@phosphor-icons/react/dist/ssr/Scissors"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { cn } from "@/lib/utils"
import type { WikiArticle, WikiCategory, Tag } from "@/lib/types"

interface WikiBoardWorkbenchProps {
  selectedIds: Set<string>
  articles: WikiArticle[]
  onClearSelection: () => void
  onSelectAll: () => void
  onMerge?: (sourceId: string) => void
  onMultiMerge?: (ids: string[]) => void
  onSplit?: (id: string) => void
}

export function WikiBoardWorkbench({
  selectedIds,
  articles,
  onClearSelection,
  onSelectAll,
  onMerge,
  onMultiMerge,
  onSplit,
}: WikiBoardWorkbenchProps) {
  const trashWikiArticle = usePlotStore((s) => s.trashWikiArticle)
  const updateWikiArticle = usePlotStore((s) => s.updateWikiArticle)
  const setWikiFolders = usePlotStore((s) => s.setWikiFolders)
  const folders = usePlotStore((s) => s.folders)
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const tags = usePlotStore((s) => s.tags ?? [])
  const createWikiCategory = usePlotStore((s) => s.createWikiCategory)
  const createTag = usePlotStore((s) => s.createTag)

  const ids = useMemo(() => Array.from(selectedIds), [selectedIds])
  const count = ids.length
  const totalCount = articles.length

  const selectedArticles = useMemo(
    () => articles.filter((a) => selectedIds.has(a.id)),
    [articles, selectedIds],
  )

  const allPinned = useMemo(
    () => selectedArticles.length > 0 && selectedArticles.every((a) => (a as { pinned?: boolean }).pinned),
    [selectedArticles],
  )

  /* ── Batch handlers (mirror wiki-floating-action-bar.tsx) ── */

  const handleTogglePin = () => {
    const nextPinned = !allPinned
    for (const id of ids) {
      updateWikiArticle(id, { pinned: nextPinned } as Partial<WikiArticle>)
    }
    toast.success(
      nextPinned
        ? `Pinned ${count} article${count === 1 ? "" : "s"}`
        : `Unpinned ${count} article${count === 1 ? "" : "s"}`,
    )
  }

  const handleTrash = () => {
    // 2026-05-18: soft trash (Note 패턴 정합). trashWikiArticle은 toggle —
    // undo callback도 같은 id에 다시 호출 = untrash 복원. recreate 불필요.
    const trashedIds = [...ids]
    trashedIds.forEach((id) => trashWikiArticle(id))
    onClearSelection()
    toast.success(`Moved ${count} article${count > 1 ? "s" : ""} to trash`)
    pushUndo(
      `Trash ${count} article${count > 1 ? "s" : ""}`,
      () => {
        trashedIds.forEach((id) => trashWikiArticle(id))
        toast.success(`Restored ${trashedIds.length}`)
      },
    )
  }

  const handleMerge = () => {
    if (count === 1 && onMerge) {
      onMerge(ids[0])
      onClearSelection()
    } else if (count >= 2 && onMultiMerge) {
      onMultiMerge(ids)
    }
  }

  const handleSplit = () => {
    if (count === 1 && onSplit) {
      onSplit(ids[0])
      onClearSelection()
    }
  }

  /* ── No selection: overview ─────────────────────────────── */

  if (count === 0) {
    return (
      <div
        data-wiki-board-workbench
        className="flex min-w-[280px] flex-1 shrink-0 flex-col rounded-lg bg-secondary/20 p-4 overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        <h3 className="text-ui font-semibold text-foreground flex items-center gap-2 mb-4">
          Wiki Overview
        </h3>

        <div className="space-y-4">
          <div className="rounded-md bg-background border border-border p-3">
            <div className="text-xl font-bold text-foreground">{totalCount}</div>
            <div className="text-2xs text-muted-foreground">total articles</div>
          </div>

          <div>
            <h4 className="text-2xs font-medium text-muted-foreground mb-2">
              Quick Actions
            </h4>
            <div className="space-y-1">
              <button
                onClick={onSelectAll}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-note font-medium text-foreground transition-colors hover:bg-hover-bg"
              >
                <CursorClick size={16} weight="regular" />
                Select All
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Selection: batch actions ───────────────────────────── */

  return (
    <div
      data-wiki-board-workbench
      className="flex min-w-[280px] flex-1 shrink-0 flex-col rounded-lg bg-secondary/20 p-4 overflow-y-auto"
      style={{ maxHeight: "calc(100vh - 200px)" }}
    >
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-ui font-semibold text-foreground flex items-center gap-2">
            <Lightning className="text-accent" size={16} weight="regular" />
            {count} article{count > 1 ? "s" : ""} selected
          </h3>
          <button
            onClick={onClearSelection}
            className="text-2xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Deselect
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* ── Organize ── */}
        <div>
          <h4 className="text-2xs font-medium text-muted-foreground mb-2">Organize</h4>
          <div className="space-y-1">
            <button
              onClick={handleTogglePin}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-note text-foreground hover:bg-hover-bg transition-colors"
              title={allPinned ? "Unpin selected articles" : "Pin selected articles"}
            >
              {allPinned ? (
                <>
                  <PushPinSlash size={14} weight="regular" className="text-muted-foreground" />
                  <span>Unpin</span>
                </>
              ) : (
                <>
                  <PushPin size={14} weight="regular" className="text-amber-500" />
                  <span>Pin</span>
                </>
              )}
            </button>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-note text-foreground hover:bg-hover-bg transition-colors"
                  title="Move selected articles to a folder"
                >
                  <FolderOpen size={14} weight="regular" className="text-muted-foreground" />
                  <span>Move to folder</span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-1">
                <FolderPicker
                  kind="wiki"
                  currentFolderIds={[]}
                  onSelect={(folderId) => {
                    ids.forEach((id) => setWikiFolders(id, folderId ? [folderId] : []))
                    const target = folders.find((f) => f.id === folderId)
                    toast.success(
                      folderId
                        ? `${count} article${count !== 1 ? "s" : ""} moved to ${target?.name ?? "folder"}`
                        : `${count} article${count !== 1 ? "s" : ""} moved out of folder`,
                    )
                  }}
                />
              </PopoverContent>
            </Popover>

            <CategoryAddPopover
              wikiCategories={wikiCategories}
              onCreate={(name) => {
                const id = createWikiCategory(name)
                if (id) toast.success(`Created category "${name}"`)
                return id
              }}
              onApply={(categoryIds) => {
                if (categoryIds.length === 0) return
                for (const id of ids) {
                  const article = articles.find((a) => a.id === id)
                  if (!article) continue
                  const existing = article.categoryIds ?? []
                  const merged = Array.from(new Set([...existing, ...categoryIds]))
                  updateWikiArticle(id, { categoryIds: merged } as Partial<WikiArticle>)
                }
                const names = categoryIds
                  .map((cid) => wikiCategories.find((c) => c.id === cid)?.name)
                  .filter(Boolean)
                  .join(", ")
                toast.success(
                  `Added ${count} article${count !== 1 ? "s" : ""} to ${names}`,
                )
              }}
            />

            <TagsAddPopover
              tags={tags}
              onCreate={(name) => {
                const id = createTag(name)
                toast.success(`Created tag #${name}`)
                return id
              }}
              onApply={(tagIds) => {
                if (tagIds.length === 0) return
                for (const id of ids) {
                  const article = articles.find((a) => a.id === id)
                  if (!article) continue
                  const existing = article.tags ?? []
                  const merged = Array.from(new Set([...existing, ...tagIds]))
                  updateWikiArticle(id, { tags: merged } as Partial<WikiArticle>)
                }
                const names = tagIds
                  .map((tid) => tags.find((t) => t.id === tid)?.name)
                  .filter(Boolean)
                  .join(", ")
                toast.success(
                  `Tagged ${count} article${count !== 1 ? "s" : ""} with ${names}`,
                )
              }}
            />

            {count === 1 && onSplit && (
              <button
                onClick={handleSplit}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-note text-foreground hover:bg-hover-bg transition-colors"
              >
                <Scissors size={14} weight="regular" className="text-muted-foreground" />
                <span>Split this article…</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Tools ── */}
        <div>
          <h4 className="text-2xs font-medium text-muted-foreground mb-2">Tools</h4>
          <div className="space-y-1">
            {((count === 1 && onMerge) || (count >= 2 && onMultiMerge)) && (
              <button
                onClick={handleMerge}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-note text-foreground hover:bg-hover-bg transition-colors"
                title={count === 1 ? "Merge with another article" : `Merge ${count} articles`}
              >
                <GitMerge size={14} weight="regular" className="text-muted-foreground" />
                <span>{count === 1 ? "Merge…" : `Merge ${count}`}</span>
              </button>
            )}

            <button
              onClick={handleTrash}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-note text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash size={14} weight="regular" />
              <span>Trash {count}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── CategoryAddPopover (mirrors wiki-floating-action-bar) ── */

function CategoryAddPopover({
  wikiCategories,
  onApply,
  onCreate,
}: {
  wikiCategories: WikiCategory[]
  onApply: (ids: string[]) => void
  /** Returns the new category id (or null if creation failed — e.g., empty name). */
  onCreate: (name: string) => string | null
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const trimmed = query.trim()
  const filtered = useMemo(() => {
    if (!trimmed) return wikiCategories
    const q = trimmed.toLowerCase()
    return wikiCategories.filter((c) => c.name.toLowerCase().includes(q))
  }, [wikiCategories, trimmed])

  const exactMatch = useMemo(
    () => filtered.some((c) => c.name.toLowerCase() === trimmed.toLowerCase()),
    [filtered, trimmed],
  )
  const showCreate = !!trimmed && !exactMatch

  const handleCreate = () => {
    const id = onCreate(trimmed)
    if (id) {
      setPicked((prev) => new Set(prev).add(id))
    }
    setQuery("")
  }

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) {
          setPicked(new Set())
          setQuery("")
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-note text-foreground hover:bg-hover-bg transition-colors"
          title="Add selected articles to categories"
        >
          <PhTag size={14} weight="regular" className="text-muted-foreground" />
          <span>Add to category</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1">
        <div className="px-1.5 pt-1 pb-1.5">
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && showCreate) {
                e.preventDefault()
                handleCreate()
              }
            }}
            placeholder="Find or create category…"
            className="w-full rounded-md border border-border bg-background px-2 py-1 text-2xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div className="max-h-[280px] overflow-y-auto py-1">
          {filtered.length === 0 && !showCreate ? (
            <p className="px-2 py-3 text-2xs text-muted-foreground/70 italic">
              {wikiCategories.length === 0 ? "No categories yet" : "No matches"}
            </p>
          ) : (
            filtered.map((c) => {
              const isPicked = picked.has(c.id)
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setPicked((prev) => {
                      const next = new Set(prev)
                      if (next.has(c.id)) next.delete(c.id)
                      else next.add(c.id)
                      return next
                    })
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-note hover:bg-hover-bg transition-colors",
                    isPicked && "bg-accent/10 text-accent",
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full border border-border-subtle"
                    style={{ backgroundColor: c.color ?? "#6b7280" }}
                  />
                  <span className="truncate flex-1">{c.name}</span>
                  {isPicked && <PhCheck size={12} weight="bold" className="text-accent shrink-0" />}
                </button>
              )
            })
          )}
        </div>
        {showCreate && (
          <div className="border-t border-border-subtle p-1">
            <button
              onClick={handleCreate}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-2xs text-foreground hover:bg-hover-bg transition-colors"
            >
              <PhPlus size={12} weight="bold" className="text-muted-foreground" />
              <span className="truncate">
                Create <span className="font-medium">&ldquo;{trimmed}&rdquo;</span>
              </span>
            </button>
          </div>
        )}
        {picked.size > 0 && (
          <div className="border-t border-border-subtle p-1">
            <button
              onClick={() => {
                onApply(Array.from(picked))
                setPicked(new Set())
                setQuery("")
                setOpen(false)
              }}
              className="flex w-full items-center justify-center rounded-md bg-accent px-3 py-1.5 text-2xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              Add to {picked.size} categor{picked.size === 1 ? "y" : "ies"}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

/* ── TagsAddPopover (multi-pick — mirrors CategoryAddPopover) ── */

function TagsAddPopover({
  tags,
  onApply,
  onCreate,
}: {
  tags: Tag[]
  onApply: (ids: string[]) => void
  /** Returns the new tag id (or null if creation failed). */
  onCreate: (name: string) => string | null
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  // tags slice keeps trashed tags in the array (soft-delete). Hide them so
  // the picker only shows usable tags.
  const activeTags = useMemo(
    () => tags.filter((t) => !(t as { trashed?: boolean }).trashed),
    [tags],
  )

  const trimmed = query.trim().replace(/^#/, "") // strip optional leading #
  const filtered = useMemo(() => {
    if (!trimmed) return activeTags
    const q = trimmed.toLowerCase()
    return activeTags.filter((t) => t.name.toLowerCase().includes(q))
  }, [activeTags, trimmed])

  const exactMatch = useMemo(
    () => filtered.some((t) => t.name.toLowerCase() === trimmed.toLowerCase()),
    [filtered, trimmed],
  )
  const showCreate = !!trimmed && !exactMatch

  const handleCreate = () => {
    const id = onCreate(trimmed)
    if (id) {
      setPicked((prev) => new Set(prev).add(id))
    }
    setQuery("")
  }

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) {
          setPicked(new Set())
          setQuery("")
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-note text-foreground hover:bg-hover-bg transition-colors"
          title="Add selected articles to tags"
        >
          <PhTag size={14} weight="regular" className="text-muted-foreground" />
          <span>Add tags</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1">
        <div className="px-1.5 pt-1 pb-1.5">
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && showCreate) {
                e.preventDefault()
                handleCreate()
              }
            }}
            placeholder="Find or create tag…"
            className="w-full rounded-md border border-border bg-background px-2 py-1 text-2xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div className="max-h-[280px] overflow-y-auto py-1">
          {filtered.length === 0 && !showCreate ? (
            <p className="px-2 py-3 text-2xs text-muted-foreground/70 italic">
              {activeTags.length === 0 ? "No tags yet" : "No matches"}
            </p>
          ) : (
            filtered.map((t) => {
              const isPicked = picked.has(t.id)
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setPicked((prev) => {
                      const next = new Set(prev)
                      if (next.has(t.id)) next.delete(t.id)
                      else next.add(t.id)
                      return next
                    })
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-note hover:bg-hover-bg transition-colors",
                    isPicked && "bg-accent/10 text-accent",
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full border border-border-subtle"
                    style={{ backgroundColor: t.color ?? "#6b7280" }}
                  />
                  <span className="truncate flex-1">#{t.name}</span>
                  {isPicked && <PhCheck size={12} weight="bold" className="text-accent shrink-0" />}
                </button>
              )
            })
          )}
        </div>
        {showCreate && (
          <div className="border-t border-border-subtle p-1">
            <button
              onClick={handleCreate}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-2xs text-foreground hover:bg-hover-bg transition-colors"
            >
              <PhPlus size={12} weight="bold" className="text-muted-foreground" />
              <span className="truncate">
                Create <span className="font-medium">#{trimmed}</span>
              </span>
            </button>
          </div>
        )}
        {picked.size > 0 && (
          <div className="border-t border-border-subtle p-1">
            <button
              onClick={() => {
                onApply(Array.from(picked))
                setPicked(new Set())
                setQuery("")
                setOpen(false)
              }}
              className="flex w-full items-center justify-center rounded-md bg-accent px-3 py-1.5 text-2xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              Add {picked.size} tag{picked.size === 1 ? "" : "s"}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
