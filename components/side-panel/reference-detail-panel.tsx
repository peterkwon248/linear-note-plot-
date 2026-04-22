"use client"

import { useState, useCallback, useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { format, formatDistanceToNow } from "date-fns"
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Info as PhInfo } from "@phosphor-icons/react/dist/ssr/Info"
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { Books } from "@phosphor-icons/react/dist/ssr/Books"
import { ListBullets } from "@phosphor-icons/react/dist/ssr/ListBullets"
import { TextAlignLeft } from "@phosphor-icons/react/dist/ssr/TextAlignLeft"
import { Globe } from "@phosphor-icons/react/dist/ssr/Globe"
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut"
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { Link } from "@phosphor-icons/react/dist/ssr/Link"
import { LinkBreak } from "@phosphor-icons/react/dist/ssr/LinkBreak"
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle"
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
        <PhInfo size={24} weight="light" className="text-muted-foreground/40" />
        <p className="text-note text-center">Reference not found</p>
      </div>
    )
  }


  return (
    <div className="flex-1 overflow-y-auto">
      {/* Type Badge */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border">
        <span className="flex items-center gap-1 rounded-md bg-chart-3/10 px-2 py-0.5 text-2xs font-medium text-chart-3">
          <Books size={14} weight="duotone" />
          Reference
        </span>
      </div>

      {/* Title (editable) */}
      <InspectorSection title="Title" icon={<FileText size={16} weight="regular" />}>
        <input
          type="text"
          defaultValue={reference.title}
          onBlur={handleTitleBlur}
          placeholder="Untitled Reference"
          className="w-full rounded-md border border-border/50 bg-transparent px-2.5 py-1.5 text-note font-semibold text-foreground placeholder:text-muted-foreground/40 focus:border-accent/50 focus:outline-none transition-colors"
        />
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* URL (dedicated field) */}
      <InspectorSection title="URL" icon={<Globe size={16} weight="regular" />}>
        <div className="flex items-center gap-1.5">
          <input
            type="url"
            defaultValue={urlValue}
            key={urlValue}
            onBlur={handleUrlBlur}
            placeholder="https://..."
            className="flex-1 rounded-md border border-border/50 bg-transparent px-2.5 py-1.5 text-note text-foreground placeholder:text-muted-foreground/40 focus:border-accent/50 focus:outline-none transition-colors"
          />
          {urlValue && (
            <a
              href={urlValue}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-md p-1.5 text-muted-foreground/60 transition-colors hover:bg-hover-bg hover:text-accent"
              title="Open URL"
            >
              <ArrowSquareOut size={14} weight="regular" />
            </a>
          )}
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Content (editable textarea) */}
      <InspectorSection title="Content" icon={<TextAlignLeft size={16} weight="regular" />}>
        <textarea
          defaultValue={reference.content}
          onBlur={handleContentBlur}
          placeholder="Add a description..."
          rows={3}
          className="w-full resize-none rounded-md border border-border/50 bg-transparent px-2.5 py-1.5 text-note text-foreground placeholder:text-muted-foreground/40 focus:border-accent/50 focus:outline-none transition-colors field-sizing-content"
        />
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Fields (key-value pairs) */}
      <InspectorSection title="Fields" icon={<ListBullets size={16} weight="regular" />}>
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
                    placeholder="Key"
                    className="w-[35%] shrink-0 rounded-md border border-border/50 bg-transparent px-2 py-1 text-2xs text-muted-foreground placeholder:text-muted-foreground/30 focus:border-accent/50 focus:outline-none transition-colors"
                  />
                  <input
                    type="text"
                    defaultValue={field.value}
                    onBlur={(e) => handleFieldValueBlur(i, e.target.value)}
                    placeholder="Value"
                    className="flex-1 rounded-md border border-border/50 bg-transparent px-2 py-1 text-2xs text-foreground placeholder:text-muted-foreground/30 focus:border-accent/50 focus:outline-none transition-colors"
                  />
                  <button
                    onClick={() => handleRemoveField(i)}
                    className="shrink-0 rounded-md p-0.5 text-muted-foreground/40 transition-colors hover:bg-hover-bg hover:text-destructive"
                    title="Remove field"
                  >
                    <PhX size={12} weight="bold" />
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-2xs text-muted-foreground/50">No fields added</p>
        )}
        <button
          onClick={handleAddField}
          className="mt-2 flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium text-accent/80 transition-colors hover:bg-accent/8 hover:text-accent"
        >
          <Plus size={12} weight="bold" />
          Add field
        </button>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Usage — notes & wiki that reference this */}
      <InspectorSection title="Usage" icon={<Books size={16} weight="regular" />}>
        {referencingNotes.length === 0 && referencingArticles.length === 0 ? (
          <p className="text-2xs text-muted-foreground/50">No notes or wiki articles reference this yet</p>
        ) : (
          <div className="space-y-1">
            {referencingNotes.length > 0 && (
              <>
                <p className="text-2xs text-muted-foreground/40 font-medium uppercase tracking-wider">Notes</p>
                {referencingNotes.map(n => (
                  <button
                    key={n.id}
                    onClick={() => openNote(n.id)}
                    className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-2xs text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
                  >
                    <FileText size={14} weight="regular" className="shrink-0 opacity-50" />
                    <span className="truncate">{n.title || "Untitled"}</span>
                  </button>
                ))}
              </>
            )}
            {referencingArticles.length > 0 && (
              <>
                <p className="text-2xs text-muted-foreground/40 font-medium uppercase tracking-wider mt-2">Wiki</p>
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
                    <span className="truncate">{a.title || "Untitled"}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Dates */}
      <InspectorSection title="Dates" icon={<CalendarBlank size={16} weight="regular" />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Created</span>
            <span className="text-note text-foreground">
              {format(new Date(reference.createdAt), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Updated</span>
            <span className="text-note text-foreground">
              {formatDistanceToNow(new Date(reference.updatedAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* History Timeline */}
      {reference.history && reference.history.length > 0 && (
        <InspectorSection title="History" icon={<ClockCounterClockwise size={16} weight="regular" />}>
          <div className="space-y-1.5">
            {[...reference.history].reverse().slice(0, 10).map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-2xs">
                <span className="shrink-0 text-muted-foreground/40">
                  {entry.action === "created" && <Sparkle size={11} weight="fill" />}
                  {entry.action === "edited" && <PencilSimple size={11} weight="regular" />}
                  {entry.action === "linked" && <Link size={11} weight="regular" />}
                  {entry.action === "unlinked" && <LinkBreak size={11} weight="regular" />}
                </span>
                <span className="text-muted-foreground/60 capitalize">{entry.action}</span>
                {entry.detail && <span className="text-muted-foreground/40">— {entry.detail}</span>}
                <span className="ml-auto shrink-0 text-muted-foreground/30 tabular-nums">
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
            <span className="text-2xs text-destructive">Delete this reference?</span>
            <button
              onClick={handleDelete}
              className="rounded-md px-2.5 py-1 text-2xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-md px-2.5 py-1 text-2xs font-medium text-muted-foreground hover:bg-hover-bg transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 text-2xs font-medium text-destructive/70 transition-colors hover:text-destructive"
          >
            <Trash size={14} weight="regular" />
            Delete reference
          </button>
        )}
      </div>
    </div>
  )
}
