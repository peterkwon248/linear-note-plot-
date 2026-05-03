"use client"

/**
 * TemplateDetailPanel — Notion-style properties for a NoteTemplate.
 *
 * Plot Template PR b (2026-05-03): templates dropped their standalone
 * "Editing template" page in favor of NoteEditor reuse. All metadata
 * (status / priority / label / folder / tags / pinned + actions) lives
 * here in the side panel, mirroring how note metadata works.
 *
 * The panel is simple by design — no Activity / Connections / Bookmarks
 * tabs yet (templates don't have noteEvents or backlinks). Future PR c
 * may add a "Used by N notes" surface.
 */

import { useMemo } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { usePlotStore } from "@/lib/store"
import { expandPlaceholders } from "@/lib/store/slices/templates"
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank"
import { Layout } from "@phosphor-icons/react/dist/ssr/Layout"
import { TextAlignLeft } from "@phosphor-icons/react/dist/ssr/TextAlignLeft"
import { Tag as PhTag } from "@phosphor-icons/react/dist/ssr/Tag"
import { Folder as PhFolder } from "@phosphor-icons/react/dist/ssr/Folder"
import { CircleHalf } from "@phosphor-icons/react/dist/ssr/CircleHalf"
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Bookmark } from "@phosphor-icons/react/dist/ssr/Bookmark"
import type { NoteTemplate, NoteStatus, NotePriority } from "@/lib/types"

function InspectorSection({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="px-4 py-3">
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

function PropertyRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-20 shrink-0 text-2xs text-muted-foreground">
        {label}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

export function TemplateDetailPanel({ template }: { template: NoteTemplate }) {
  const updateTemplate = usePlotStore((s) => s.updateTemplate)
  const deleteTemplate = usePlotStore((s) => s.deleteTemplate)
  const toggleTemplatePin = usePlotStore((s) => s.toggleTemplatePin)
  const createNoteFromTemplate = usePlotStore((s) => s.createNoteFromTemplate)
  const labels = usePlotStore((s) => s.labels)
  const folders = usePlotStore((s) => s.folders)
  const tags = usePlotStore((s) => s.tags)
  const openNote = usePlotStore((s) => s.openNote)

  const label = useMemo(
    () => (template.labelId ? labels.find((l) => l.id === template.labelId) ?? null : null),
    [template.labelId, labels],
  )
  const folder = useMemo(
    () => (template.folderId ? folders.find((f) => f.id === template.folderId) ?? null : null),
    [template.folderId, folders],
  )
  const templateTags = useMemo(
    () => tags.filter((t) => template.tags.includes(t.id) && !t.trashed),
    [template.tags, tags],
  )

  // Title pattern preview — show what the generated note title looks like today
  const titlePreview = useMemo(
    () => (template.title ? expandPlaceholders(template.title) : ""),
    [template.title],
  )

  // Body stats from markdown content (best-effort)
  const stats = useMemo(() => {
    const text = template.content ?? ""
    const words = text.trim().split(/\s+/).filter(Boolean).length
    const characters = text.length
    return { words, characters }
  }, [template.content])

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

      {/* ── Properties ────────────────────────────────────── */}
      <InspectorSection title="Properties" icon={<Layout size={11} weight="regular" />}>
        <PropertyRow label="Status">
          <select
            value={template.status}
            onChange={(e) => updateTemplate(template.id, { status: e.target.value as NoteStatus })}
            className="h-7 w-full rounded-md border border-border bg-background px-2 text-note text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="inbox">Inbox</option>
            <option value="capture">Capture</option>
            <option value="permanent">Permanent</option>
          </select>
        </PropertyRow>
        <PropertyRow label="Priority">
          <select
            value={template.priority}
            onChange={(e) => updateTemplate(template.id, { priority: e.target.value as NotePriority })}
            className="h-7 w-full rounded-md border border-border bg-background px-2 text-note text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="none">None</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </PropertyRow>
        <PropertyRow label="Label">
          <select
            value={template.labelId ?? ""}
            onChange={(e) =>
              updateTemplate(template.id, { labelId: e.target.value || null })
            }
            className="h-7 w-full rounded-md border border-border bg-background px-2 text-note text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">No label</option>
            {labels
              .filter((l) => !l.trashed)
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
          </select>
          {label && (
            <span className="mt-1 inline-flex items-center gap-1 text-2xs text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: label.color }}
              />
              {label.name}
            </span>
          )}
        </PropertyRow>
        <PropertyRow label="Folder">
          <select
            value={template.folderId ?? ""}
            onChange={(e) =>
              updateTemplate(template.id, { folderId: e.target.value || null })
            }
            className="h-7 w-full rounded-md border border-border bg-background px-2 text-note text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">No folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          {folder && (
            <span className="mt-1 inline-flex items-center gap-1 text-2xs text-muted-foreground">
              <PhFolder size={10} weight="regular" />
              {folder.name}
            </span>
          )}
        </PropertyRow>
      </InspectorSection>

      {/* ── Tags ──────────────────────────────────────────── */}
      <InspectorSection title="Default tags" icon={<PhTag size={11} weight="regular" />}>
        {templateTags.length === 0 ? (
          <p className="text-2xs text-muted-foreground">No tags</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {templateTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-md bg-secondary/40 px-1.5 py-0.5 text-2xs text-muted-foreground"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
        <p className="mt-2 text-2xs text-muted-foreground/70">
          Tag editing inline coming in PR c — for now, edit via the legacy
          create dialog.
        </p>
      </InspectorSection>

      {/* ── Title pattern preview ─────────────────────────── */}
      <InspectorSection title="Title pattern" icon={<TextAlignLeft size={11} weight="regular" />}>
        <div className="rounded-md bg-secondary/30 px-2.5 py-2 font-mono text-2xs text-muted-foreground">
          {template.title || <span className="italic">empty pattern</span>}
        </div>
        {titlePreview && (
          <div className="mt-1.5 text-2xs text-muted-foreground/70">
            <span className="opacity-60">Preview today:</span>{" "}
            <span className="font-medium text-foreground/80">{titlePreview}</span>
          </div>
        )}
      </InspectorSection>

      {/* ── Stats ─────────────────────────────────────────── */}
      <InspectorSection title="Body stats" icon={<FileText size={11} weight="regular" />}>
        <div className="grid grid-cols-2 gap-1 text-2xs">
          <div>
            <span className="text-muted-foreground">Words</span>
            <div className="text-foreground tabular-nums">{stats.words}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Characters</span>
            <div className="text-foreground tabular-nums">{stats.characters}</div>
          </div>
        </div>
      </InspectorSection>

      {/* ── Dates ─────────────────────────────────────────── */}
      <InspectorSection title="Dates" icon={<CalendarBlank size={11} weight="regular" />}>
        <PropertyRow label="Created">
          <span className="text-2xs text-muted-foreground" title={template.createdAt}>
            {format(new Date(template.createdAt), "MMM d, yyyy")}
          </span>
        </PropertyRow>
        <PropertyRow label="Updated">
          <span className="text-2xs text-muted-foreground" title={template.updatedAt}>
            {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
          </span>
        </PropertyRow>
      </InspectorSection>

      {/* ── Actions ───────────────────────────────────────── */}
      <InspectorSection title="Actions" icon={<Lightning size={11} weight="regular" />}>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleUseTemplate}
            className="flex items-center justify-center gap-2 rounded-md bg-accent px-3 py-2 text-note font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            <FileText size={14} weight="regular" />
            Use template
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
