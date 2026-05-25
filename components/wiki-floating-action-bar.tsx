"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { usePlotStore } from "@/lib/store"
import { useT } from "@/lib/i18n"
import type { WikiArticle } from "@/lib/types"
import { pushUndo } from "@/lib/undo-manager"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FolderPicker } from "@/components/folder-picker"
import {
  X as PhX,
  Trash2 as Trash,
  GitMerge,
  Scissors,
  Zap as Lightning,
  Pin as PushPin,
  PinOff as PushPinSlash,
  FolderOpen,
  Tag as PhTag,
  Check as PhCheck,
} from "lucide-react"

interface WikiFloatingActionBarProps {
  selectedIds: Set<string>
  articles: WikiArticle[]
  onClearSelection: () => void
  onMerge?: (sourceId: string) => void
  onMultiMerge?: (ids: string[]) => void
  onSplit?: (id: string) => void
}

function Divider() {
  return <div className="h-7 w-px bg-border mx-1.5" />
}

export function WikiFloatingActionBar({
  selectedIds,
  articles,
  onClearSelection,
  onMerge,
  onMultiMerge,
  onSplit,
}: WikiFloatingActionBarProps) {
  const t = useT()
  const trashWikiArticle = usePlotStore((s) => s.trashWikiArticle)
  const updateWikiArticle = usePlotStore((s) => s.updateWikiArticle)
  const setWikiFolders = usePlotStore((s) => s.setWikiFolders)
  const folders = usePlotStore((s) => s.folders)
  const wikiCategories = usePlotStore((s) => s.wikiCategories)

  const ids = useMemo(() => Array.from(selectedIds), [selectedIds])
  const count = ids.length

  const selectedArticles = useMemo(
    () => articles.filter((a) => selectedIds.has(a.id)),
    [articles, selectedIds],
  )

  const allPinned = selectedArticles.length > 0 && selectedArticles.every((a) => (a as { pinned?: boolean }).pinned)

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

  const handleDelete = () => {
    // 2026-05-18: soft trash (Note 패턴 정합). trashWikiArticle은 toggle —
    // undo callback도 같은 id에 다시 호출 = untrash 복원.
    const trashedIds = [...ids]
    trashedIds.forEach((id) => trashWikiArticle(id))
    onClearSelection()
    toast.success(t("wikibar.toast.trashed").replace("{count}", String(count)))

    pushUndo(
      `Trash ${count} article${count > 1 ? "s" : ""}`,
      () => {
        trashedIds.forEach((id) => trashWikiArticle(id))
        toast.success(t("wikibar.toast.restored").replace("{count}", String(trashedIds.length)))
      }
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

  if (count === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-overlay px-3 py-2 shadow-2xl">
        {/* Selection info */}
        <button
          onClick={onClearSelection}
          className="mr-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-2xs font-medium text-muted-foreground hover:bg-active-bg transition-colors"
        >
          <Lightning size={14} fill="currentColor" className="text-accent" />
          {t("wikibar.selected").replace("{count}", String(count))}
          <PhX size={12} className="ml-0.5 text-muted-foreground/70" />
        </button>

        <Divider />

        {/* Pin/Unpin — 2026-05-12: Books/Notes 정합. allPinned면 모두 unpin,
            아니면 모두 pin (mixed→pin 표준 UX). */}
        <button
          onClick={handleTogglePin}
          className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-3 py-2 text-2xs font-medium text-foreground/80 transition-colors hover:bg-hover-bg hover:text-foreground"
          title={allPinned ? t("wikibar.tooltip.unpin") : t("wikibar.tooltip.pin")}
        >
          {allPinned ? (
            <><PushPinSlash size={16} /> {t("wikibar.action.unpin")}</>
          ) : (
            <><PushPin size={16} className="text-amber-500" /> {t("wikibar.action.pin")}</>
          )}
        </button>

        <Divider />

        {/* Move to folder — bulk single-folder replace. Each selected article's
            folderIds is overwritten with [chosen] (or [] for No folder). */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-3 py-2 text-2xs font-medium text-foreground/80 transition-colors hover:bg-hover-bg hover:text-foreground"
              title={t("wikibar.tooltip.move_to_folder")}
            >
              <FolderOpen size={16} /> {t("wikibar.action.move")}
            </button>
          </PopoverTrigger>
          <PopoverContent align="center" className="w-56 p-1">
            <FolderPicker
              kind="wiki"
              currentFolderIds={[]}
              onSelect={(folderId) => {
                ids.forEach((id) => setWikiFolders(id, folderId ? [folderId] : []))
                const target = folders.find((f) => f.id === folderId)
                toast.success(
                  folderId
                    ? t("wikibar.toast.moved_to_folder")
                        .replace("{count}", String(count))
                        .replace("{folder}", target?.name ?? t("floatingbar.add_to_folder"))
                    : t("wikibar.toast.moved_out_of_folder").replace("{count}", String(count)),
                )
              }}
            />
          </PopoverContent>
        </Popover>

        {/* Add to category — multi-pick popover that union-adds the selected
            categories into each article's categoryIds (idempotent). */}
        <CategoryAddPopover
          wikiCategories={wikiCategories}
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
              t("wikibar.toast.added_to_categories")
                .replace("{count}", String(count))
                .replace("{names}", names),
            )
          }}
        />

        <Divider />

        {/* Merge (works for 1+ selected) */}
        {(onMerge || onMultiMerge) && (
          <>
            <button
              onClick={handleMerge}
              className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-3 py-2 text-2xs font-medium text-foreground/80 transition-colors hover:bg-hover-bg hover:text-foreground"
              title={count >= 2 ? "Open merge page with selected articles" : "Merge into another article"}
            >
              <GitMerge size={16} />
              Merge
            </button>
            <Divider />
          </>
        )}

        {/* Split (single selection only) */}
        {count === 1 && onSplit && (
          <>
            <button
              onClick={() => { onSplit(ids[0]); onClearSelection() }}
              className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-3 py-2 text-2xs font-medium text-foreground/80 transition-colors hover:bg-hover-bg hover:text-foreground"
            >
              <Scissors size={16} />
              Split
            </button>
            <Divider />
          </>
        )}

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-3 py-2 text-2xs font-medium text-destructive transition-colors hover:bg-destructive/20"
        >
          <Trash size={16} />
          Delete
        </button>
      </div>
    </div>
  )
}

/* ── Category Add Popover ──────────────────────────────────
 * Simple multi-pick popover for wiki categories. No "no category" reset
 * here — this is an additive operation (union into each article's set).
 * Mirrors the FolderPicker multi-mode visual language. */
function CategoryAddPopover({
  wikiCategories,
  onApply,
}: {
  wikiCategories: { id: string; name: string; color: string }[]
  onApply: (categoryIds: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setPending((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleApply = () => {
    onApply(Array.from(pending))
    setPending(new Set())
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setPending(new Set()) }}>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-3 py-2 text-2xs font-medium text-foreground/80 transition-colors hover:bg-hover-bg hover:text-foreground"
          title="Add selected articles to one or more categories"
        >
          <PhTag size={16} /> Add to category
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-56 p-1">
        {wikiCategories.length === 0 ? (
          <div className="px-2.5 py-2 text-2xs italic text-muted-foreground/70">
            No categories yet
          </div>
        ) : (
          <>
            <div className="max-h-[240px] overflow-y-auto flex flex-col gap-px">
              {wikiCategories.map((cat) => {
                const checked = pending.has(cat.id)
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggle(cat.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-note transition-colors hover:bg-hover-bg",
                      checked ? "text-foreground font-medium" : "text-foreground/80",
                    )}
                  >
                    <span
                      className={cn(
                        "h-4 w-4 rounded-[4px] border flex items-center justify-center shrink-0 shadow-sm",
                        checked
                          ? "bg-accent border-accent"
                          : "bg-card border-zinc-400 dark:border-zinc-600",
                      )}
                    >
                      {checked && <PhCheck size={10} strokeWidth={2.5} className="text-accent-foreground" />}
                    </span>
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="flex-1 text-left truncate">{cat.name}</span>
                  </button>
                )
              })}
            </div>
            <div className="my-1 border-t border-border-subtle" />
            <button
              type="button"
              onClick={handleApply}
              disabled={pending.size === 0}
              className={cn(
                "flex w-full items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-2xs font-medium transition-colors",
                pending.size === 0
                  ? "text-muted-foreground/50 cursor-not-allowed"
                  : "bg-accent text-accent-foreground hover:bg-accent/90",
              )}
            >
              Apply{pending.size > 0 ? ` (${pending.size})` : ""}
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
