"use client"

/**
 * TemplateDetailPanel — properties for a NoteTemplate.
 *
 * Plot Template PR b (2026-05-03): templates dropped their standalone
 * "Editing template" page in favor of NoteEditor reuse. Properties moved
 * to the side panel, mirroring notes / wiki.
 *
 * 2026-05-14 redesign (after PR #321 verify): the panel was inheriting
 * the *general note* Properties shape (label / folder / default tags /
 * title pattern) — but those are classification metadata, not template
 * essence. A template is a "note factory", so its panel now mirrors the
 * wiki article pattern: Dates → Outline → Properties(stats) → Actions.
 *
 *   - Label / Folder / Default tags rows removed (auto-application is
 *     low-value: users override on first edit anyway, and Plot's general
 *     pattern is to keep classification on the note itself). The data
 *     model still carries labelId / folderId / tags for backward
 *     compatibility — `createNoteFromTemplate` reads them — but no UI
 *     surface mutates them here. A follow-up PR will retire the fields.
 *   - Title pattern section removed (영구 LOCKED 2026-05-13: UpNote-style
 *     title lives in the body's first block, not in a separate field).
 *   - Outline section added (`extractOutlineFromContentJson` reused from
 *     notes — the function is contentJson-only, works identically on
 *     templates).
 *   - Properties section is now stats-only (Plot convention: Properties
 *     = read-only stats, not classification): Words / Characters /
 *     Headings / Placeholders. Placeholders count surfaces template
 *     essence — "{{YYYY}}" tokens that `expandPlaceholders` will
 *     substitute when the template is used.
 */

import { useMemo } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { usePlotStore } from "@/lib/store"
import { countPlaceholders } from "@/lib/store/slices/templates"
import { extractOutlineFromContentJson, type OutlineResult } from "@/lib/anchor-utils"
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank"
import { TextAlignLeft } from "@phosphor-icons/react/dist/ssr/TextAlignLeft"
import { Layout } from "@phosphor-icons/react/dist/ssr/Layout"
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Bookmark } from "@phosphor-icons/react/dist/ssr/Bookmark"
import { cn } from "@/lib/utils"
import type { NoteTemplate } from "@/lib/types"

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
        <span className="text-2xs font-medium text-muted-foreground">
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

export function TemplateDetailPanel({ template }: { template: NoteTemplate }) {
  const deleteTemplate = usePlotStore((s) => s.deleteTemplate)
  const toggleTemplatePin = usePlotStore((s) => s.toggleTemplatePin)
  const createNoteFromTemplate = usePlotStore((s) => s.createNoteFromTemplate)
  const openNote = usePlotStore((s) => s.openNote)

  const outline: OutlineResult = useMemo(
    () =>
      template.contentJson
        ? extractOutlineFromContentJson(template.contentJson)
        : { source: "empty", items: [] },
    [template.contentJson],
  )

  // Stats — words / characters / headings / placeholders. Mirror the
  // notes Detail panel's Properties layout (stats only, never classification).
  const stats = useMemo(() => {
    const text = template.content ?? ""
    const words = text.trim().split(/\s+/).filter(Boolean).length
    const characters = text.length
    const headings = outline.items.filter((i) => i.source === "heading").length
    const placeholders = countPlaceholders(template.content ?? "", template.contentJson)
    return { words, characters, headings, placeholders }
  }, [template.content, template.contentJson, outline.items])

  const handleUseTemplate = () => {
    const newId = createNoteFromTemplate(template.id)
    if (newId) openNote(newId)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Header badges ────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary/40 px-1.5 py-0.5 text-2xs font-medium text-muted-foreground">
            <Layout size={11} weight="regular" />
            Template
          </span>
          {template.pinned && (
            <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-2xs font-medium text-accent">
              <PushPin size={11} weight="fill" />
              Pinned
            </span>
          )}
        </div>
        <button
          onClick={() => toggleTemplatePin(template.id)}
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
        {outline.items.length > 0 ? (
          <div className="space-y-0.5">
            {outline.source === "toc" && (
              <div className="mb-1.5 text-2xs uppercase tracking-wider text-muted-foreground/70">
                From TOC block
              </div>
            )}
            {outline.items.map((item, i) => (
              <div
                key={i}
                className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-note text-muted-foreground"
                style={{ paddingLeft: `${6 + (item.level - 1) * 12}px` }}
              >
                {item.source === "heading" ? (
                  <span className="shrink-0 text-2xs font-mono text-muted-foreground/70 w-5">
                    H{item.level}
                  </span>
                ) : (
                  <span className="shrink-0 text-muted-foreground/70">→</span>
                )}
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-note text-muted-foreground">No structure yet</span>
        )}
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* ── Properties (stats) ────────────────────────────── */}
      <InspectorSection title="Properties" icon={<FileText size={16} weight="regular" />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Words</span>
            <span className="text-note tabular-nums text-foreground">{stats.words}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Characters</span>
            <span className="text-note tabular-nums text-foreground">{stats.characters}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Headings</span>
            <span className="text-note tabular-nums text-foreground">{stats.headings}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Placeholders</span>
            <span className="text-note tabular-nums text-foreground">{stats.placeholders}</span>
          </div>
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* ── Actions ───────────────────────────────────────── */}
      <InspectorSection title="Actions" icon={<Lightning size={16} weight="regular" />}>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleUseTemplate}
            title="Create a new note from this template — placeholders will be expanded"
            className="flex items-center justify-center gap-2 rounded-md bg-accent px-3 py-2 text-note font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            <FileText size={14} weight="regular" />
            Template &rarr; Note
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete "${template.name}"? This cannot be undone.`)) {
                deleteTemplate(template.id)
              }
            }}
            className="flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-note text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors"
          >
            <Trash size={14} weight="regular" />
            Delete template
          </button>
        </div>
      </InspectorSection>
    </div>
  )
}
