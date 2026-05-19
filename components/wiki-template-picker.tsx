"use client"

/**
 * WikiTemplatePicker — modal dialog for choosing a WikiTemplate when creating
 * a new Wiki article.
 *
 * Flow: Wiki "+ Article" 버튼 → picker 다이얼로그 → template 선택 →
 * `createWikiArticleFromTemplate(id)` → new article opened in edit mode.
 *
 * "Empty" template (wtmpl-empty) is always present as first option (default
 * — blank article 생성). 나머지 7개는 사용자 mutable.
 *
 * NoteTemplates UpNote 패턴 정합 — 다이얼로그 형태 + grid cards + 한 번에
 * 적용. /wiki/templates page와 같은 카드 UI를 공유하지만 dialog 안에서.
 */

import { useEffect, useMemo, useState, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import { IconTemplate } from "@/components/plot-icons"
import { cn } from "@/lib/utils"
import type { WikiTemplate } from "@/lib/types"

function summarize(t: WikiTemplate): string {
  const sectionCount = t.blocks.filter((b) => b.type === "section").length
  const infoboxCount = t.infobox.length
  const parts: string[] = []
  if (sectionCount > 0) parts.push(`${sectionCount} section${sectionCount === 1 ? "" : "s"}`)
  if (infoboxCount > 0) parts.push(`${infoboxCount} infobox`)
  return parts.length > 0 ? parts.join(" · ") : "Empty"
}

interface WikiTemplatePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * "create" (default) — creates a new article via createWikiArticleFromTemplate,
   * then calls onApplied with the new article id.
   * "insert" — calls onTemplateChosen with the picked templateId so the caller
   * can splice blocks into an existing article (e.g. wiki-article-view's
   * "From template…" AddBlockButton entry).
   */
  mode?: "create" | "insert"
  /** Called with new article id after template is applied (create mode). */
  onApplied?: (articleId: string) => void
  /** Called with picked templateId (insert mode). */
  onTemplateChosen?: (templateId: string) => void
}

export function WikiTemplatePicker({
  open,
  onOpenChange,
  mode = "create",
  onApplied,
  onTemplateChosen,
}: WikiTemplatePickerProps) {
  const wikiTemplates = usePlotStore((s) => Array.isArray(s.wikiTemplates) ? s.wikiTemplates : [])
  const createWikiArticleFromTemplate = usePlotStore((s) => s.createWikiArticleFromTemplate)
  const [search, setSearch] = useState("")

  // Live templates only, Empty first then alphabetical.
  const sorted = useMemo(() => {
    const live = wikiTemplates.filter((t) => !t.trashed)
    return [...live].sort((a, b) => {
      if (a.id === "wtmpl-empty") return -1
      if (b.id === "wtmpl-empty") return 1
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }, [wikiTemplates])

  const filtered = useMemo(() => {
    if (!search.trim()) return sorted
    const q = search.trim().toLowerCase()
    return sorted.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false)
    )
  }, [sorted, search])

  // ESC to close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onOpenChange])

  const handleApply = useCallback(
    (id: string) => {
      if (mode === "insert") {
        onTemplateChosen?.(id)
        onOpenChange(false)
        setSearch("")
        return
      }
      const articleId = createWikiArticleFromTemplate(id)
      if (articleId) {
        onApplied?.(articleId)
        onOpenChange(false)
        setSearch("")
      }
    },
    [mode, createWikiArticleFromTemplate, onApplied, onTemplateChosen, onOpenChange]
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl max-h-[80vh] flex flex-col rounded-lg border border-border bg-card shadow-xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <IconTemplate size={18} />
            <h2 className="text-ui font-semibold text-foreground">
              {mode === "insert" ? "Insert from template" : "Choose a Wiki template"}
            </h2>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-hover-bg text-muted-foreground hover:text-foreground transition-colors"
          >
            <PhX size={14} weight="regular" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-border">
          <div className="relative">
            <MagnifyingGlass
              size={14}
              weight="regular"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-3 text-ui text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
              <IconTemplate size={32} />
              <p className="text-ui">No templates match</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleApply(t.id)}
                  className={cn(
                    "group flex flex-col gap-2 rounded-lg border border-border bg-background p-4 text-left",
                    "hover:border-accent hover:bg-accent/5 transition-colors"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <IconTemplate size={14} />
                      <span className="truncate text-ui font-medium text-foreground">{t.name}</span>
                    </div>
                    {t.infoboxPreset && t.infoboxPreset !== "custom" && (
                      <span className="shrink-0 rounded bg-active-bg px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {t.infoboxPreset}
                      </span>
                    )}
                  </div>
                  {t.description && (
                    <p className="text-2xs text-muted-foreground line-clamp-2">{t.description}</p>
                  )}
                  <div className="text-2xs text-muted-foreground">{summarize(t)}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border px-6 py-3 text-2xs text-muted-foreground">
          Tip: <kbd className="rounded bg-active-bg px-1 py-0.5 font-mono text-[10px]">ESC</kbd> to cancel
          {" · "}
          Manage templates in <span className="font-medium text-foreground">Wiki → Templates</span>
        </div>
      </div>
    </div>
  )
}
