"use client"

import { useState, useCallback, useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { format, formatDistanceToNow } from "date-fns"
import { useRelativeTime } from "@/lib/i18n-date"
import {
  Calendar as CalendarBlank,
  FileText,
  Info as PhInfo,
  Plus,
  X as PhX,
  Trash2 as Trash,
  List as ListBullets,
  AlignLeft as TextAlignLeft,
  Globe,
  ExternalLink as ArrowSquareOut,
  Image as PhImage,
  History as ClockCounterClockwise,
  Pencil as PencilSimple,
  Link,
  Unlink as LinkBreak,
  Sparkles as Sparkle,
} from "lucide-react"
import { ENTITY_ICONS } from "@/lib/entity-icons"
import { shortRelative } from "@/lib/format-utils"
import { IconWiki } from "@/components/plot-icons"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import { setActiveRoute } from "@/lib/table-route"

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

export function ReferenceDetailPanel({ referenceId }: { referenceId: string }) {
  const t = useT()
  const relative = useRelativeTime()
  const reference = usePlotStore((s) => s.references[referenceId])
  const updateReference = usePlotStore((s) => s.updateReference)
  const deleteReference = usePlotStore((s) => s.deleteReference)
  const setSidePanelOpen = usePlotStore((s) => s.setSidePanelOpen)
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const openNote = usePlotStore((s) => s.openNote)

  const [confirmDelete, setConfirmDelete] = useState(false)

  const referencingNotes = useMemo(() =>
    notes.filter(n => !n.trashed && (n.referenceIds ?? []).includes(referenceId)),
    [notes, referenceId]
  )
  const referencingArticles = useMemo(() =>
    wikiArticles.filter(a => (a.referenceIds ?? []).includes(referenceId)),
    [wikiArticles, referenceId]
  )

  const handleTitleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const val = e.target.value.trim()
      if (val !== reference?.title) {
        updateReference(referenceId, { title: val })
      }
    },
    [referenceId, reference?.title, updateReference]
  )

  // Extract URL from fields
  const urlFieldIndex = reference ? reference.fields.findIndex(
    (f) => f.key.toLowerCase() === "url"
  ) : -1
  const urlValue = urlFieldIndex >= 0 ? reference!.fields[urlFieldIndex].value : ""

  const handleUrlBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (!reference) return
      const val = e.target.value.trim()
      const newFields = [...reference.fields]
      const idx = newFields.findIndex((f) => f.key.toLowerCase() === "url")

      if (val) {
        if (idx >= 0) {
          // Update existing url field
          newFields[idx] = { ...newFields[idx], value: val }
        } else {
          // Add new url field
          newFields.unshift({ key: "url", value: val })
        }
      } else {
        // Remove url field if empty
        if (idx >= 0) {
          newFields.splice(idx, 1)
        }
      }
      updateReference(referenceId, { fields: newFields })
    },
    [referenceId, reference, updateReference]
  )

  const handleImageUrlBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (!reference) return
      const val = e.target.value.trim() || null
      if (val !== (reference.imageUrl ?? null)) {
        updateReference(referenceId, { imageUrl: val })
      }
    },
    [referenceId, reference, updateReference]
  )

  const handleContentBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      const val = e.target.value
      if (val !== reference?.content) {
        updateReference(referenceId, { content: val })
      }
    },
    [referenceId, reference?.content, updateReference]
  )

  const handleFieldKeyBlur = useCallback(
    (index: number, value: string) => {
      if (!reference) return
      const newFields = [...reference.fields]
      if (newFields[index].key !== value) {
        newFields[index] = { ...newFields[index], key: value }
        updateReference(referenceId, { fields: newFields })
      }
    },
    [referenceId, reference, updateReference]
  )

  const handleFieldValueBlur = useCallback(
    (index: number, value: string) => {
      if (!reference) return
      const newFields = [...reference.fields]
      if (newFields[index].value !== value) {
        newFields[index] = { ...newFields[index], value: value }
        updateReference(referenceId, { fields: newFields })
      }
    },
    [referenceId, reference, updateReference]
  )

  const handleAddField = useCallback(() => {
    if (!reference) return
    const newFields = [...reference.fields, { key: "", value: "" }]
    updateReference(referenceId, { fields: newFields })
  }, [referenceId, reference, updateReference])

  const handleRemoveField = useCallback(
    (index: number) => {
      if (!reference) return
      const newFields = reference.fields.filter((_, i) => i !== index)
      updateReference(referenceId, { fields: newFields })
    },
    [referenceId, reference, updateReference]
  )

  const handleDelete = useCallback(() => {
    deleteReference(referenceId)
    setSidePanelOpen(false)
  }, [referenceId, deleteReference, setSidePanelOpen])

  if (!reference) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground px-4">
        <PhInfo size={24} strokeWidth={1.5} className="text-muted-foreground/70" />
        <p className="text-note text-center">{t("panel.reference.not_found")}</p>
      </div>
    )
  }


  return (
    <div className="flex-1 overflow-y-auto">
      {/* Type Badge */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border">
        <span className="flex items-center gap-1 rounded-md bg-chart-3/10 px-2 py-0.5 text-2xs font-medium text-chart-3">
          <ENTITY_ICONS.references size={14} strokeWidth={1.5} />
          {t("entity.reference")}
        </span>
      </div>

      {/* Title (editable) */}
      <InspectorSection title={t("panel.reference.title")} icon={<FileText size={16} strokeWidth={2} />}>
        <input
          type="text"
          defaultValue={reference.title}
          onBlur={handleTitleBlur}
          placeholder={t("panel.reference.title_placeholder")}
          className="w-full rounded-md border border-border/50 bg-transparent px-2.5 py-1.5 text-note font-semibold text-foreground placeholder:text-muted-foreground/70 focus:border-accent/50 focus:outline-none transition-colors"
        />
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* URL (dedicated field) */}
      <InspectorSection title={t("panel.reference.url")} icon={<Globe size={16} strokeWidth={2} />}>
        <div className="flex items-center gap-1.5">
          <input
            type="url"
            defaultValue={urlValue}
            key={urlValue}
            onBlur={handleUrlBlur}
            placeholder="https://..."
            className="flex-1 rounded-md border border-border/50 bg-transparent px-2.5 py-1.5 text-note text-foreground placeholder:text-muted-foreground/70 focus:border-accent/50 focus:outline-none transition-colors"
          />
          {urlValue && (
            <a
              href={urlValue}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-md p-1.5 text-muted-foreground/60 transition-colors hover:bg-hover-bg hover:text-accent"
              title={t("panel.reference.open_url")}
            >
              <ArrowSquareOut size={14} strokeWidth={2} />
            </a>
          )}
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Image URL */}
      <InspectorSection title={t("panel.reference.image_url")} icon={<PhImage size={16} strokeWidth={2} />}>
        <div className="space-y-2">
          <input
            type="text"
            defaultValue={reference.imageUrl ?? ""}
            key={reference.imageUrl ?? ""}
            onBlur={handleImageUrlBlur}
            placeholder="https://example.com/image.png"
            className="w-full rounded-md border border-border/50 bg-transparent px-2.5 py-1.5 text-note text-foreground placeholder:text-muted-foreground/70 focus:border-accent/50 focus:outline-none transition-colors"
          />
          {reference.imageUrl && (
            <div className="rounded-md overflow-hidden border border-border/30 bg-secondary/20 inline-block max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={reference.imageUrl}
                alt=""
                className="max-h-32 object-contain"
                onError={(e) => { e.currentTarget.style.display = "none" }}
              />
            </div>
          )}
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Content (editable textarea) */}
      <InspectorSection title={t("panel.reference.content")} icon={<TextAlignLeft size={16} strokeWidth={2} />}>
        <textarea
          defaultValue={reference.content}
          onBlur={handleContentBlur}
          placeholder={t("panel.reference.content_placeholder")}
          rows={3}
          className="w-full resize-none rounded-md border border-border/50 bg-transparent px-2.5 py-1.5 text-note text-foreground placeholder:text-muted-foreground/70 focus:border-accent/50 focus:outline-none transition-colors field-sizing-content"
        />
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Fields (key-value pairs) */}
      <InspectorSection title={t("panel.reference.fields")} icon={<ListBullets size={16} strokeWidth={2} />}>
        {reference.fields.filter((f) => f.key.toLowerCase() !== "url").length > 0 ? (
          <div className="space-y-1.5">
            {reference.fields.map((field, i) => {
              // Skip url field (shown in dedicated section above)
              if (field.key.toLowerCase() === "url") return null
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    defaultValue={field.key}
                    onBlur={(e) => handleFieldKeyBlur(i, e.target.value)}
                    placeholder={t("panel.reference.field_key_placeholder")}
                    className="w-[35%] shrink-0 rounded-md border border-border/50 bg-transparent px-2 py-1 text-2xs text-muted-foreground placeholder:text-muted-foreground/60 focus:border-accent/50 focus:outline-none transition-colors"
                  />
                  <input
                    type="text"
                    defaultValue={field.value}
                    onBlur={(e) => handleFieldValueBlur(i, e.target.value)}
                    placeholder={t("panel.reference.field_value_placeholder")}
                    className="flex-1 rounded-md border border-border/50 bg-transparent px-2 py-1 text-2xs text-foreground placeholder:text-muted-foreground/60 focus:border-accent/50 focus:outline-none transition-colors"
                  />
                  <button
                    onClick={() => handleRemoveField(i)}
                    className="shrink-0 rounded-md p-0.5 text-muted-foreground/70 transition-colors hover:bg-hover-bg hover:text-destructive"
                    title={t("panel.reference.remove_field")}
                  >
                    <PhX size={12} strokeWidth={2.5} />
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-2xs text-muted-foreground/70">{t("panel.reference.no_fields")}</p>
        )}
        <button
          onClick={handleAddField}
          className="mt-2 flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium text-accent/80 transition-colors hover:bg-accent/8 hover:text-accent"
        >
          <Plus size={12} strokeWidth={2.5} />
          {t("panel.reference.add_field")}
        </button>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Usage — notes & wiki that reference this */}
      <InspectorSection title={t("panel.usage")} icon={<ENTITY_ICONS.references size={16} strokeWidth={2} />}>
        {referencingNotes.length === 0 && referencingArticles.length === 0 ? (
          <p className="text-2xs text-muted-foreground/70">{t("panel.reference.no_usage")}</p>
        ) : (
          <div className="space-y-1">
            {referencingNotes.length > 0 && (
              <>
                <p className="text-2xs text-muted-foreground/70 font-medium uppercase tracking-wider">{t("panel.reference.notes_heading")}</p>
                {referencingNotes.map(n => (
                  <button
                    key={n.id}
                    onClick={() => openNote(n.id)}
                    className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-2xs text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
                  >
                    <FileText size={14} strokeWidth={2} className="shrink-0 opacity-50" />
                    <span className="truncate">{n.title || t("common.untitled")}</span>
                  </button>
                ))}
              </>
            )}
            {referencingArticles.length > 0 && (
              <>
                <p className="text-2xs text-muted-foreground/70 font-medium uppercase tracking-wider mt-2">{t("panel.reference.wiki_heading")}</p>
                {referencingArticles.map(a => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setActiveRoute("/wiki")
                      navigateToWikiArticle(a.id)
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-2xs text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
                  >
                    <IconWiki size={14} className="shrink-0 opacity-50" />
                    <span className="truncate">{a.title || t("common.untitled")}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Dates */}
      <InspectorSection title={t("panel.dates")} icon={<CalendarBlank size={16} strokeWidth={2} />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">{t("common.created")}</span>
            <span className="text-note text-foreground">
              {format(new Date(reference.createdAt), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">{t("common.updated")}</span>
            <span className="text-note text-foreground">
              {relative(reference.updatedAt)}
            </span>
          </div>
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* History Timeline */}
      {reference.history && reference.history.length > 0 && (
        <InspectorSection title={t("panel.reference.history")} icon={<ClockCounterClockwise size={16} strokeWidth={2} />}>
          <div className="space-y-1.5">
            {[...reference.history].reverse().slice(0, 10).map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-2xs">
                <span className="shrink-0 text-muted-foreground/70">
                  {entry.action === "created" && <Sparkle size={11} fill="currentColor" />}
                  {entry.action === "edited" && <PencilSimple size={11} strokeWidth={2} />}
                  {entry.action === "linked" && <Link size={11} strokeWidth={2} />}
                  {entry.action === "unlinked" && <LinkBreak size={11} strokeWidth={2} />}
                </span>
                <span className="text-muted-foreground/60 capitalize">{entry.action}</span>
                {entry.detail && <span className="text-muted-foreground/70">— {entry.detail}</span>}
                <span className="ml-auto shrink-0 text-muted-foreground/60 tabular-nums">
                  {shortRelative(entry.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </InspectorSection>
      )}

      <div className="mx-4 border-b border-border" />

      {/* Delete */}
      <div className="px-4 py-4">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-2xs text-destructive">{t("panel.reference.delete_confirm")}</span>
            <button
              onClick={handleDelete}
              className="rounded-md px-2.5 py-1 text-2xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
            >
              {t("common.confirm")}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-md px-2.5 py-1 text-2xs font-medium text-muted-foreground hover:bg-hover-bg transition-colors"
            >
              {t("common.cancel")}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 text-2xs font-medium text-destructive/70 transition-colors hover:text-destructive"
          >
            <Trash size={14} strokeWidth={2} />
            {t("panel.reference.delete")}
          </button>
        )}
      </div>
    </div>
  )
}
