"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import type { WikiArticle } from "@/lib/types"
import { pushUndo } from "@/lib/undo-manager"
import { toast } from "sonner"

import { GitMerge } from "@phosphor-icons/react/dist/ssr/GitMerge"
import { ArrowsLeftRight } from "@phosphor-icons/react/dist/ssr/ArrowsLeftRight"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"

/* ── Types ── */

interface WikiMergePreviewProps {
  sourceId: string
  articles: WikiArticle[]
  onClose: () => void
  onComplete: (survivorId: string) => void
}

type Step = "select-target" | "preview"
type PrimarySide = "source" | "target"

/* ── Component ── */

export function WikiMergePreview({
  sourceId,
  articles,
  onClose,
  onComplete,
}: WikiMergePreviewProps) {
  const mergeWikiArticles = usePlotStore((s) => s.mergeWikiArticles)

  const [step, setStep] = useState<Step>("select-target")
  const [targetId, setTargetId] = useState<string | null>(null)
  const [primarySide, setPrimarySide] = useState<PrimarySide>("target")
  const [searchQuery, setSearchQuery] = useState("")

  const source = useMemo(
    () => articles.find((a) => a.id === sourceId)!,
    [articles, sourceId],
  )
  const target = useMemo(
    () => (targetId ? articles.find((a) => a.id === targetId) ?? null : null),
    [articles, targetId],
  )

  const primary = primarySide === "source" ? source : target
  const secondary = primarySide === "source" ? target : source

  // Derived defaults — recompute when primary/secondary change
  const defaultTitle = primary?.title ?? source.title

  const [selectedTitle, setSelectedTitle] = useState<string>("")

  // Effective values (fallback to defaults)
  const effectiveTitle = selectedTitle || defaultTitle

  // Filtered list for step 1
  const filteredArticles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return articles
      .filter((a) => a.id !== sourceId)
      .filter(
        (a) =>
          !q ||
          a.title.toLowerCase().includes(q) ||
          a.aliases.some((al) => al.toLowerCase().includes(q)),
      )
  }, [articles, sourceId, searchQuery])

  /* ── Step 1 → Step 2 transition ── */
  function selectTarget(id: string) {
    setTargetId(id)
    const t = articles.find((a) => a.id === id)
    if (t) {
      // Reset selections with correct defaults for new target
      const newPrimary = t // default primarySide is "target"
      setSelectedTitle(newPrimary.title)
    }
    setStep("preview")
  }

  /* ── Swap direction ── */
  function handleSwap() {
    const next: PrimarySide = primarySide === "source" ? "target" : "source"
    setPrimarySide(next)
    const newPrimary = next === "source" ? source : target
    if (newPrimary) {
      setSelectedTitle(newPrimary.title)
    }
  }

  /* ── Confirm merge ── */
  function handleConfirm() {
    if (!primary || !secondary) return

    const primarySnapshot = structuredClone(primary)
    const secondarySnapshot = structuredClone(secondary)

    mergeWikiArticles(primary.id, secondary.id, {
      title: effectiveTitle,
    })

    pushUndo(
      "Wiki merge",
      () => {
        // Undo: restore secondary article, revert primary to snapshot
        usePlotStore.setState((state) => ({
          wikiArticles: [...state.wikiArticles, secondarySnapshot],
        }))
        usePlotStore.getState().updateWikiArticle(primary.id, {
          title: primarySnapshot.title,
          blocks: primarySnapshot.blocks,
          aliases: primarySnapshot.aliases,
          tags: primarySnapshot.tags,
          infobox: primarySnapshot.infobox,
        })
      },
      () => {
        // Redo: re-merge
        usePlotStore.getState().mergeWikiArticles(primary.id, secondary.id, {
          title: effectiveTitle,
        })
      },
    )

    onComplete(primary.id)

    toast.success(`Merged "${secondary.title}" into "${primary.title}"`, {
      action: {
        label: "Undo",
        onClick: () => {
          usePlotStore.setState((state) => ({
            wikiArticles: [...state.wikiArticles, secondarySnapshot],
          }))
          usePlotStore.getState().updateWikiArticle(primary.id, {
            title: primarySnapshot.title,
            blocks: primarySnapshot.blocks,
            aliases: primarySnapshot.aliases,
            tags: primarySnapshot.tags,
            infobox: primarySnapshot.infobox,
          })
        },
      },
      duration: 10000,
    })
  }

  /* ── Merged tag list for preview ── */
  const mergedTags = useMemo(() => {
    if (!primary || !secondary) return []
    return [...new Set([...primary.tags, ...secondary.tags])]
  }, [primary, secondary])

  const mergedInfoboxCount = useMemo(() => {
    if (!primary || !secondary) return 0
    const keys = new Set(primary.infobox.map((e) => e.key))
    const extra = secondary.infobox.filter((e) => !keys.has(e.key))
    return primary.infobox.length + extra.length
  }, [primary, secondary])

  /* ── Render ── */
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-md gap-0 overflow-hidden p-0"
        showCloseButton={false}
      >
        {step === "select-target" ? (
          /* ════ STEP 1: Select Target ════ */
          <>
            <DialogHeader className="px-5 pt-5 pb-3">
              <DialogTitle className="flex items-center gap-2 text-ui">
                <GitMerge size={16} weight="regular" />
                Merge Wiki Article
              </DialogTitle>
              <DialogDescription className="text-note">
                Select the article to merge with
              </DialogDescription>
            </DialogHeader>

            {/* Search */}
            <div className="px-5 pb-2">
              <div className="relative">
                <MagnifyingGlass
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50"
                />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-border bg-secondary/50 py-1.5 pl-8 pr-3 text-note text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-accent/50"
                  autoFocus
                />
              </div>
            </div>

            {/* Article list */}
            <div className="max-h-[300px] overflow-y-auto px-5 py-1">
              {filteredArticles.map((a) => (
                <button
                  key={a.id}
                  onClick={() => selectTarget(a.id)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-hover-bg"
                >
                  <BookOpen
                    className="shrink-0 text-muted-foreground/40"
                    size={16}
                    weight="regular"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-note text-foreground">
                      {a.title || "Untitled"}
                    </p>
                  </div>
                </button>
              ))}
              {filteredArticles.length === 0 && (
                <p className="py-8 text-center text-2xs text-muted-foreground/40">
                  No articles found
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-border px-5 py-3">
              <button
                onClick={onClose}
                className="rounded-md px-3 py-1.5 text-2xs font-medium text-muted-foreground transition-colors hover:bg-hover-bg"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          /* ════ STEP 2: Preview ════ */
          <>
            <DialogHeader className="px-5 pt-5 pb-3">
              <DialogTitle className="flex items-center gap-2 text-ui">
                <GitMerge size={16} weight="regular" />
                Merge Preview
              </DialogTitle>
              <DialogDescription className="text-note">
                Review and confirm the merge
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 px-5 pb-2">
              {/* ── Direction cards ── */}
              <div className="flex items-center gap-2">
                {/* Source card */}
                <ArticleCard
                  article={source}
                  isPrimary={primarySide === "source"}
                  label={
                    primarySide === "source"
                      ? "Will survive"
                      : "Will be absorbed"
                  }
                />

                {/* Swap button */}
                <button
                  onClick={handleSwap}
                  className="shrink-0 rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
                  title="Swap merge direction"
                >
                  <ArrowsLeftRight size={14} />
                </button>

                {/* Target card */}
                {target && (
                  <ArticleCard
                    article={target}
                    isPrimary={primarySide === "target"}
                    label={
                      primarySide === "target"
                        ? "Will survive"
                        : "Will be absorbed"
                    }
                  />
                )}
              </div>

              {/* ── Settings ── */}
              <div className="space-y-3">
                {/* Title selection */}
                <div>
                  <p className="mb-1.5 text-2xs font-medium text-muted-foreground">
                    Title
                  </p>
                  <div className="space-y-1">
                    <RadioOption
                      checked={effectiveTitle === source.title}
                      onSelect={() => setSelectedTitle(source.title)}
                      label={source.title || "Untitled"}
                    />
                    {target && target.title !== source.title && (
                      <RadioOption
                        checked={effectiveTitle === target.title}
                        onSelect={() => setSelectedTitle(target.title)}
                        label={target.title || "Untitled"}
                      />
                    )}
                  </div>
                </div>

              </div>

              {/* ── Result preview ── */}
              {primary && secondary && (
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Result
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-note font-medium text-foreground">
                        {effectiveTitle || "Untitled"}
                      </span>
                    </div>
                    <p className="text-2xs text-muted-foreground">
                      {primary.blocks.length} blocks from {primary.title} +{" "}
                      {secondary.blocks.length} blocks from {secondary.title}
                    </p>
                    {mergedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {mergedTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-accent/10 px-1.5 py-px text-2xs font-medium text-accent"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {mergedInfoboxCount > 0 && (
                      <p className="text-2xs text-muted-foreground">
                        Infobox: {mergedInfoboxCount} entries
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <button
                onClick={() => {
                  setStep("select-target")
                  setTargetId(null)
                  setPrimarySide("target")
                  setSelectedTitle("")
                }}
                className="rounded-md px-3 py-1.5 text-2xs font-medium text-muted-foreground transition-colors hover:bg-hover-bg"
              >
                Back
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="rounded-md px-3 py-1.5 text-2xs font-medium text-muted-foreground transition-colors hover:bg-hover-bg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-2xs font-medium text-accent-foreground transition-colors hover:bg-accent/90"
                >
                  <GitMerge size={12} weight="bold" />
                  Confirm Merge
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ── Sub-components ── */

function ArticleCard({
  article,
  isPrimary,
  label,
}: {
  article: WikiArticle
  isPrimary: boolean
  label: string
}) {
  return (
    <div
      className={cn(
        "flex-1 rounded-lg border p-3 transition-colors",
        isPrimary
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-border bg-secondary/20",
      )}
    >
      <p className="truncate text-note font-medium text-foreground">
        {article.title || "Untitled"}
      </p>
      <div className="mt-1.5 space-y-0.5 text-2xs text-muted-foreground">
        <p>{article.blocks.length} blocks</p>
        <p>{article.tags.length} tags</p>
      </div>
      <p
        className={cn(
          "mt-2 text-2xs font-medium",
          isPrimary ? "text-emerald-500" : "text-muted-foreground/60",
        )}
      >
        {label}
      </p>
    </div>
  )
}

function RadioOption({
  checked,
  onSelect,
  label,
}: {
  checked: boolean
  onSelect: () => void
  label: string
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-2xs transition-colors",
        checked
          ? "bg-accent/10 text-accent"
          : "text-muted-foreground hover:bg-hover-bg",
      )}
    >
      <span
        className={cn(
          "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border",
          checked ? "border-accent bg-accent" : "border-muted-foreground/30",
        )}
      >
        {checked && <PhCheck size={9} weight="bold" className="text-white" />}
      </span>
      <span className="truncate">{label}</span>
    </button>
  )
}
