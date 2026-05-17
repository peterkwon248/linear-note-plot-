"use client"

/**
 * WikiTemplatesView — Wiki article templates list (NoteTemplate UI 정합).
 *
 * Wiki Template = recipe with pre-seeded blocks/infobox/categoryIds. 두 가지
 * apply path:
 *   1) **생성 picker** (`createWikiArticleFromTemplate`) — 빈 Wiki article에
 *      template 전체 적용. WikiArticle.templateId에 origin 기록.
 *   2) **slash insert** — 기존 article에 `/` → "Insert wiki template…" →
 *      template blocks만 inline insert (Phase D, slash command 확장).
 *
 * MVP: grid cards + search + ContextMenu (Pin / Delete). Detail panel은
 * 별도 (Phase C: SmartSidePanel "wikiTemplate" 분기). NoteTemplate UI
 * 패턴과 동일하지만 view-engine 통합 (sort/filter pipeline)은 추후 P1.
 */

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { PushPinSlash } from "@phosphor-icons/react/dist/ssr/PushPinSlash"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import { cn } from "@/lib/utils"
import type { WikiTemplate } from "@/lib/types"
import { ViewHeader } from "@/components/view-header"
import { IconTemplate } from "@/components/plot-icons"
import { toast } from "sonner"

/* ── Section helpers ─────────────────────────────────── */

function summarize(t: WikiTemplate): string {
  const sectionCount = t.blocks.filter((b) => b.type === "section").length
  const textCount = t.blocks.filter((b) => b.type === "text").length
  const infoboxCount = t.infobox.length
  const parts: string[] = []
  if (sectionCount > 0) parts.push(`${sectionCount} section${sectionCount === 1 ? "" : "s"}`)
  if (textCount > 0) parts.push(`${textCount} text`)
  if (infoboxCount > 0) parts.push(`${infoboxCount} infobox`)
  return parts.length > 0 ? parts.join(" · ") : "Empty"
}

/* ── Template Card ───────────────────────────────────── */

function TemplateCard({
  template,
  onApply,
  onPin,
  onDelete,
  onClick,
}: {
  template: WikiTemplate
  onApply: () => void
  onPin: () => void
  onDelete: () => void
  onClick: () => void
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          onClick={onClick}
          onDoubleClick={onApply}
          className={cn(
            "group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left",
            "hover:border-accent/40 hover:bg-hover-bg transition-colors"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <IconTemplate size={16} />
              <span className="truncate text-ui font-medium text-foreground">{template.name}</span>
            </div>
            {template.pinned && <PushPin size={12} weight="fill" className="shrink-0 text-accent" />}
          </div>
          {template.description && (
            <p className="text-2xs text-muted-foreground line-clamp-2">{template.description}</p>
          )}
          <div className="flex items-center justify-between gap-2 text-2xs text-muted-foreground">
            <span className="truncate">{summarize(template)}</span>
            {template.infoboxPreset && template.infoboxPreset !== "custom" && (
              <span className="shrink-0 rounded bg-active-bg px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                {template.infoboxPreset}
              </span>
            )}
          </div>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onApply}>
          <PhPlus size={14} weight="regular" className="mr-2" />
          Create wiki from this
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onPin}>
          {template.pinned ? (
            <>
              <PushPinSlash size={14} weight="regular" className="mr-2" />
              Unpin
            </>
          ) : (
            <>
              <PushPin size={14} weight="regular" className="mr-2" />
              Pin
            </>
          )}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="text-destructive">
          <Trash size={14} weight="regular" className="mr-2" />
          Move to trash
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

/* ── Main View ───────────────────────────────────────── */

export function WikiTemplatesView() {
  const wikiTemplates = usePlotStore((s) => Array.isArray(s.wikiTemplates) ? s.wikiTemplates : [])
  const createWikiArticleFromTemplate = usePlotStore((s) => s.createWikiArticleFromTemplate)
  const toggleWikiTemplatePin = usePlotStore((s) => s.toggleWikiTemplatePin)
  const deleteWikiTemplate = usePlotStore((s) => s.deleteWikiTemplate)
  const setSidePanelContext = usePlotStore((s) => s.setSidePanelContext)
  const setSidePanelOpen = usePlotStore((s) => s.setSidePanelOpen)
  const router = useRouter()
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const live = wikiTemplates.filter((t) => !t.trashed)
    if (!search.trim()) return live
    const q = search.trim().toLowerCase()
    return live.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false)
    )
  }, [wikiTemplates, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }, [filtered])

  const handleApply = useCallback(
    (id: string) => {
      const articleId = createWikiArticleFromTemplate(id)
      if (!articleId) {
        toast.error("Template not found")
        return
      }
      toast.success("Wiki article created from template")
      router.push(`/wiki?article=${articleId}`)
    },
    [createWikiArticleFromTemplate, router]
  )

  const handleSelect = useCallback(
    (t: WikiTemplate) => {
      setSidePanelContext({ type: "wikiTemplate", id: t.id })
      setSidePanelOpen(true)
    },
    [setSidePanelContext, setSidePanelOpen]
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ViewHeader
        icon={<IconTemplate size={20} />}
        title="Wiki Templates"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <MagnifyingGlass
                size={14}
                weight="regular"
                className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates…"
                className="h-8 w-56 rounded-md border border-border bg-card pl-7 pr-2 text-2xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <IconTemplate size={32} />
            <p className="text-ui">No wiki templates yet</p>
            <p className="text-2xs">
              {search.trim()
                ? "No templates match your search."
                : "Seed templates initialized on first load — try reloading."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onApply={() => handleApply(t.id)}
                onPin={() => toggleWikiTemplatePin(t.id)}
                onDelete={() => {
                  deleteWikiTemplate(t.id)
                  toast.success("Moved to trash")
                }}
                onClick={() => handleSelect(t)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
