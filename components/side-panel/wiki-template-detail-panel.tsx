"use client"

/**
 * WikiTemplateDetailPanel — properties for a WikiTemplate.
 *
 * NoteTemplate Detail panel 정합 패턴 (PR #322): Header → Dates → Outline
 * → Properties(stats) → Actions. 차이점은 Wiki 본질 필드들:
 *
 *   - Outline은 blocks의 section heading 추출 (NoteTemplate은 contentJson
 *     의 heading nodes). Wiki는 plain WikiBlock 구조라 별도 walk.
 *   - Properties는 Wiki essence stats — Blocks / Sections / Text blocks /
 *     Infobox entries / Placeholders.
 *   - infoboxPreset badge (person/place/concept 등) — NoteTemplate에 없는
 *     Wiki 본질 marker.
 *
 * Connections / Activity / Bookmarks 탭은 별도 dispatch 없음 (Phase D
 * 후속). SmartSidePanel fallback이 빈 state 표시.
 */

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format, formatDistanceToNow } from "date-fns"
import { usePlotStore } from "@/lib/store"
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank"
import { TextAlignLeft } from "@phosphor-icons/react/dist/ssr/TextAlignLeft"
import { Layout } from "@phosphor-icons/react/dist/ssr/Layout"
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Bookmark } from "@phosphor-icons/react/dist/ssr/Bookmark"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { Image as ImageIcon } from "@phosphor-icons/react/dist/ssr/Image"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { WikiTemplate, WikiBlock } from "@/lib/types"
import { InfoboxHeroPicker } from "@/components/editor/infobox-hero-picker"

function InspectorSection({
  title,
  icon,
  children,
  className,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("px-4 py-3", className)}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-2xs font-medium text-muted-foreground">{title}</span>
      </div>
      {children}
    </div>
  )
}

/**
 * Count placeholder tokens in WikiTemplate content. Mirrors `countPlaceholders`
 * for NoteTemplate but walks Wiki-specific fields (blocks + infobox).
 */
const PLACEHOLDER_PATTERN =
  /\{\{(?:YYYY|MM|DD|HH|mm|date|time)\}\}|\{(?:date|time|datetime|year|month|day)\}/g

function countWikiPlaceholders(template: WikiTemplate): number {
  let count = 0
  const scan = (s?: string) => {
    if (!s) return
    const m = s.match(PLACEHOLDER_PATTERN)
    if (m) count += m.length
  }
  scan(template.title)
  for (const a of template.aliases ?? []) scan(a)
  for (const b of template.blocks) {
    scan(b.title)
    scan(b.content)
    scan(b.caption)
    scan(b.urlTitle)
    scan(b.tableCaption)
    if (b.contentJson) {
      const walk = (node: unknown) => {
        if (node === null || node === undefined) return
        if (Array.isArray(node)) {
          node.forEach(walk)
          return
        }
        if (typeof node !== "object") return
        for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
          if (k === "text" && typeof v === "string") scan(v)
          else walk(v)
        }
      }
      walk(b.contentJson)
    }
  }
  for (const e of template.infobox) {
    scan(e.key)
    scan(e.value)
  }
  return count
}

interface OutlineItem {
  level: number
  label: string
}

function extractOutlineFromBlocks(blocks: WikiBlock[]): OutlineItem[] {
  const result: OutlineItem[] = []
  for (const b of blocks) {
    if (b.type === "section" && b.title) {
      result.push({ level: b.level ?? 2, label: b.title })
    }
  }
  return result
}

export function WikiTemplateDetailPanel({ template }: { template: WikiTemplate }) {
  const deleteWikiTemplate = usePlotStore((s) => s.deleteWikiTemplate)
  const toggleWikiTemplatePin = usePlotStore((s) => s.toggleWikiTemplatePin)
  const createWikiArticleFromTemplate = usePlotStore((s) => s.createWikiArticleFromTemplate)
  const updateWikiTemplate = usePlotStore((s) => s.updateWikiTemplate)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  // (no wikiTemplates lookup needed here — caller passes the template directly)
  const router = useRouter()
  // PR-C follow-up — hero picker dialog state. Single state for both add/edit
  // (picker seeds from `template.infoboxHero` when opened).
  const [showHeroPicker, setShowHeroPicker] = useState(false)

  const outline = useMemo(() => extractOutlineFromBlocks(template.blocks), [template.blocks])

  const stats = useMemo(() => {
    const total = template.blocks.length
    const sections = template.blocks.filter((b) => b.type === "section").length
    const textBlocks = template.blocks.filter((b) => b.type === "text").length
    const infoboxEntries = template.infobox.length
    const placeholders = countWikiPlaceholders(template)
    return { total, sections, textBlocks, infoboxEntries, placeholders }
  }, [template])

  // "Used by N wiki articles" — WikiArticle.templateId reverse-lookup
  // (NoteTemplate "Used by N notes" 정합 — event log 대신 article 본체에
  // templateId 직접 저장하므로 더 명료).
  const usedByCount = useMemo(
    () => (wikiArticles ?? []).filter((a) => a.templateId === template.id && !a.trashed).length,
    [wikiArticles, template.id]
  )

  const handleApply = () => {
    const articleId = createWikiArticleFromTemplate(template.id)
    if (!articleId) {
      toast.error("Template not found")
      return
    }
    toast.success("Wiki article created from template")
    router.push(`/wiki?article=${articleId}`)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Header badges ────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary/40 px-1.5 py-0.5 text-2xs font-medium text-muted-foreground">
            <Layout size={11} weight="regular" />
            Wiki Template
          </span>
          {template.infoboxPreset && template.infoboxPreset !== "custom" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-2xs font-medium text-accent">
              {template.infoboxPreset}
            </span>
          )}
          {template.pinned && (
            <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-2xs font-medium text-accent">
              <PushPin size={11} weight="fill" />
              Pinned
            </span>
          )}
        </div>
        <button
          onClick={() => toggleWikiTemplatePin(template.id)}
          title={template.pinned ? "Unpin template" : "Pin template"}
          className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-hover-bg text-muted-foreground hover:text-foreground transition-colors"
        >
          {template.pinned ? (
            <Bookmark size={14} weight="fill" className="text-accent" />
          ) : (
            <Bookmark size={14} weight="regular" />
          )}
        </button>
      </div>

      {/* ── Description (if any) ─────────────────────────── */}
      {template.description && (
        <>
          <div className="px-4 py-3">
            <p className="text-note text-muted-foreground">{template.description}</p>
          </div>
          <div className="mx-4 border-b border-border" />
        </>
      )}

      {/* ── Hero image (PR-C follow-up) ───────────────────── */}
      <InspectorSection title="Hero image" icon={<ImageIcon size={16} weight="regular" />}>
        {template.infoboxHero ? (
          <div className="space-y-2">
            <figure className="rounded-md overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={template.infoboxHero.url}
                alt={template.infoboxHero.alt || template.infoboxHero.caption || "Hero image"}
                className="w-full max-h-40 object-cover bg-secondary/30"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = "none"
                }}
              />
              {template.infoboxHero.caption && (
                <figcaption className="bg-secondary/30 px-2 py-1 text-2xs text-muted-foreground">
                  {template.infoboxHero.caption}
                </figcaption>
              )}
            </figure>
            <div className="flex gap-1.5">
              <button
                onClick={() => setShowHeroPicker(true)}
                className="flex-1 rounded-md border border-border px-2 py-1 text-2xs text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  updateWikiTemplate(template.id, { infoboxHero: undefined })
                  toast.success("Hero image removed")
                }}
                className="flex-1 rounded-md border border-border px-2 py-1 text-2xs text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowHeroPicker(true)}
            className="w-full rounded-md border border-dashed border-border px-3 py-2 text-note text-muted-foreground hover:bg-hover-bg hover:text-foreground hover:border-border-strong transition-colors"
          >
            + Add hero image
          </button>
        )}
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* ── Dates ─────────────────────────────────────────── */}
      <InspectorSection title="Dates" icon={<CalendarBlank size={16} weight="regular" />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Created</span>
            <span className="text-note text-foreground" title={template.createdAt}>
              {format(new Date(template.createdAt), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Updated</span>
            <span className="text-note text-foreground" title={template.updatedAt}>
              {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* ── Outline ───────────────────────────────────────── */}
      <InspectorSection title="Outline" icon={<TextAlignLeft size={16} weight="regular" />}>
        {outline.length > 0 ? (
          <div className="space-y-0.5">
            {outline.map((item, i) => (
              <div
                key={i}
                className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-note text-muted-foreground"
                style={{ paddingLeft: `${6 + (item.level - 2) * 12}px` }}
              >
                <span className="shrink-0 text-2xs font-mono text-muted-foreground/70 w-5">
                  H{item.level}
                </span>
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-note text-muted-foreground">No sections</span>
        )}
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* ── Properties (stats) ────────────────────────────── */}
      <InspectorSection title="Properties" icon={<FileText size={16} weight="regular" />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Blocks</span>
            <span className="text-note tabular-nums text-foreground">{stats.total}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Sections</span>
            <span className="text-note tabular-nums text-foreground">{stats.sections}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Text blocks</span>
            <span className="text-note tabular-nums text-foreground">{stats.textBlocks}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Infobox entries</span>
            <span className="text-note tabular-nums text-foreground">{stats.infoboxEntries}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Placeholders</span>
            <span className="text-note tabular-nums text-foreground">{stats.placeholders}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Used by</span>
            <span className="text-note tabular-nums text-foreground">
              {usedByCount} {usedByCount === 1 ? "article" : "articles"}
            </span>
          </div>
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* ── Actions ───────────────────────────────────────── */}
      <InspectorSection title="Actions" icon={<Lightning size={16} weight="regular" />}>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleApply}
            title="Create a new wiki article from this template — placeholders will be expanded"
            className="flex items-center justify-center gap-2 rounded-md bg-accent px-3 py-2 text-note font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            <BookOpen size={14} weight="regular" />
            Template &rarr; Wiki article
          </button>
          <button
            onClick={() => {
              deleteWikiTemplate(template.id)
              toast.success("Moved to trash")
            }}
            className="flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-note text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors"
          >
            <Trash size={14} weight="regular" />
            Delete template
          </button>
        </div>
      </InspectorSection>

      {/* PR-C follow-up — Hero image picker dialog (Portal) */}
      <InfoboxHeroPicker
        open={showHeroPicker}
        onOpenChange={setShowHeroPicker}
        initial={template.infoboxHero ?? null}
        onSave={(hero) => {
          updateWikiTemplate(template.id, { infoboxHero: hero })
          toast.success(template.infoboxHero ? "Hero image updated" : "Hero image added")
        }}
      />
    </div>
  )
}
