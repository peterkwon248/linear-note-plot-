"use client"

import React, { useMemo, useState, useCallback } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { StatusShapeIcon } from "@/components/status-icon"
import { shortRelative } from "@/lib/format-utils"
import type {
  Note,
  WikiArticle,
  Book,
  Tag,
  Label,
  NoteTemplate,
  Reference,
  Attachment,
  NoteStatus,
} from "@/lib/types"
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { Hash } from "@phosphor-icons/react/dist/ssr/Hash"
import { Tag as TagIcon } from "@phosphor-icons/react/dist/ssr/Tag"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { BookmarkSimple } from "@phosphor-icons/react/dist/ssr/BookmarkSimple"
import { Paperclip } from "@phosphor-icons/react/dist/ssr/Paperclip"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Minus as PhMinus } from "@phosphor-icons/react/dist/ssr/Minus"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"

type EntityKind = "note" | "wiki" | "book" | "tag" | "label" | "template" | "reference" | "attachment"

const ENTITY_SINGULAR: Record<EntityKind, string> = {
  note: "Note",
  wiki: "Wiki",
  book: "Book",
  tag: "Tag",
  label: "Label",
  template: "Template",
  reference: "Reference",
  attachment: "File",
}

const SECTION_TITLES: Record<EntityKind, string> = {
  note: "Notes",
  wiki: "Wiki Articles",
  book: "Books",
  tag: "Tags",
  label: "Labels",
  template: "Templates",
  reference: "References",
  attachment: "Files",
}

function EntityKindIcon({ kind, noteStatus }: { kind: EntityKind; noteStatus?: NoteStatus }) {
  if (kind === "note" && noteStatus) {
    return <StatusShapeIcon status={noteStatus} size={14} />
  }
  const cls = "shrink-0 text-muted-foreground"
  switch (kind) {
    case "wiki": return <BookOpen size={14} weight="regular" className={cls} />
    case "book": return <BookOpen size={14} weight="regular" className={cls} />
    case "tag": return <Hash size={14} weight="regular" className={cls} />
    case "label": return <TagIcon size={14} weight="regular" className={cls} />
    case "template": return <FileText size={14} weight="regular" className={cls} />
    case "reference": return <BookmarkSimple size={14} weight="regular" className={cls} />
    case "attachment": return <Paperclip size={14} weight="regular" className={cls} />
    default: return <FileText size={14} weight="regular" className={cls} />
  }
}

interface TrashRowItem {
  id: string
  label: string
  color?: string | null
  trashedAt?: string | null
  noteStatus?: NoteStatus
}

function TrashRow({
  kind,
  item,
  isSelected,
  selectionActive,
  onToggleSelect,
  onRestore,
  onDelete,
}: {
  kind: EntityKind
  item: TrashRowItem
  isSelected: boolean
  selectionActive: boolean
  onToggleSelect: () => void
  onRestore: () => void
  onDelete: () => void
}) {
  return (
    <div className={cn(
      "group flex items-center border-b border-border px-5 py-2.5 transition-colors",
      isSelected ? "bg-accent/10 hover:bg-accent/15" : "hover:bg-hover-bg",
    )}>
      {/* Checkbox — notes/wiki parity (hover-only unless selected) */}
      <div
        className={cn(
          "w-8 shrink-0 flex items-center justify-center cursor-pointer",
          selectionActive || isSelected ? "visible" : "invisible group-hover:visible",
        )}
        onClick={(e) => {
          e.stopPropagation()
          onToggleSelect()
        }}
      >
        <div className={cn(
          "h-4 w-4 rounded-[4px] border flex items-center justify-center transition-colors shadow-sm",
          isSelected
            ? "bg-accent border-accent"
            : "bg-card border-zinc-400 dark:border-zinc-600 hover:border-zinc-500",
        )}>
          {isSelected && <PhCheck size={10} weight="bold" className="text-accent-foreground" />}
        </div>
      </div>
      <div className="w-6 shrink-0 flex items-center justify-center">
        <EntityKindIcon kind={kind} noteStatus={item.noteStatus} />
      </div>
      <div className="w-24 shrink-0 text-2xs uppercase tracking-wide text-muted-foreground">
        {ENTITY_SINGULAR[kind]}
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-note font-medium text-foreground truncate">{item.label}</span>
        {item.color ? (
          <span
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: item.color }}
            title={item.color}
          />
        ) : null}
      </div>
      <div className="w-32 shrink-0 text-right text-note text-muted-foreground">
        {item.trashedAt ? shortRelative(item.trashedAt) : "—"}
      </div>
      <div className="w-32 shrink-0 flex items-center justify-end gap-1.5">
        <button
          onClick={onRestore}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-note text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
          title="Restore"
        >
          <ArrowCounterClockwise size={14} weight="regular" />
          Restore
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-note text-destructive transition-colors hover:bg-destructive/10"
          title="Delete permanently"
        >
          <Trash size={14} weight="regular" />
        </button>
      </div>
    </div>
  )
}

/**
 * Unified trash view that lists trashed items across **all** entity kinds in
 * one place. Mounted in NotesTable when `isTrashView && trashFilter === "all"`.
 *
 * Pattern mirrors the per-entity TrashEntityList inside notes-table.tsx but
 * adds Notes/Wiki coverage (which the older partial branch didn't display).
 */
export function TrashAllView() {
  // Multi-select state — keyed by `${kind}-${id}` since IDs are scoped per
  // entity kind (e.g. note "tag-1" and tag "tag-1" both can exist).
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const selectionActive = selectedKeys.size > 0
  const toggleSelect = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])
  const clearSelection = useCallback(() => setSelectedKeys(new Set()), [])

  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const storeBooks = usePlotStore((s) => s.books)
  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)
  const storeTemplates = usePlotStore((s) => s.templates)
  const storeReferences = usePlotStore((s) => s.references)
  const storeAttachments = usePlotStore((s) => s.attachments)

  // entity-specific store actions (stable refs via Zustand)
  const toggleTrash = usePlotStore((s) => s.toggleTrash)
  const deleteNote = usePlotStore((s) => s.deleteNote)
  const updateWikiArticle = usePlotStore((s) => s.updateWikiArticle)
  const deleteWikiArticle = usePlotStore((s) => s.deleteWikiArticle)
  const restoreBook = usePlotStore((s) => s.restoreBook)
  const permanentlyDeleteBook = usePlotStore((s) => s.permanentlyDeleteBook)
  const restoreTag = usePlotStore((s) => s.restoreTag)
  const permanentlyDeleteTag = usePlotStore((s) => s.permanentlyDeleteTag)
  const restoreLabel = usePlotStore((s) => s.restoreLabel)
  const permanentlyDeleteLabel = usePlotStore((s) => s.permanentlyDeleteLabel)
  const restoreTemplate = usePlotStore((s) => s.restoreTemplate)
  const permanentlyDeleteTemplate = usePlotStore((s) => s.permanentlyDeleteTemplate)
  const restoreReference = usePlotStore((s) => s.restoreReference)
  const permanentlyDeleteReference = usePlotStore((s) => s.permanentlyDeleteReference)
  const restoreAttachment = usePlotStore((s) => s.restoreAttachment)
  const permanentlyDeleteAttachment = usePlotStore((s) => s.permanentlyDeleteAttachment)

  const sections = useMemo(() => {
    // Note slice and WikiArticle slice are separate entities. Notes section
    // shows the full Note slice (any noteType); Wiki Articles section shows
    // WikiArticle entities (the wiki-articles slice).
    const trashedNotes = notes.filter((n: Note) => n.trashed)
    const trashedWikis = wikiArticles.filter((w: WikiArticle) => (w as any).trashed)
    const trashedBooks = (storeBooks || []).filter((b: Book) => b.trashed)
    const trashedTags = tags.filter((t: Tag) => t.trashed)
    const trashedLabels = labels.filter((l: Label) => l.trashed)
    const trashedTemplates = storeTemplates.filter((t: NoteTemplate) => t.trashed)
    const trashedRefs = Object.values(storeReferences || {}).filter((r: Reference) => r.trashed)
    const trashedFiles = (storeAttachments || []).filter((a: Attachment) => a.trashed)

    const list: Array<{ kind: EntityKind; items: TrashRowItem[] }> = [
      {
        kind: "note",
        items: trashedNotes.map((n) => ({
          id: n.id,
          label: n.title || "Untitled",
          trashedAt: n.trashedAt ?? null,
          noteStatus: n.status,
        })),
      },
      {
        kind: "wiki",
        items: trashedWikis.map((w) => ({
          id: w.id,
          label: w.title || "Untitled",
          trashedAt: (w as any).trashedAt ?? null,
        })),
      },
      {
        kind: "book",
        items: trashedBooks.map((b) => ({
          id: b.id,
          label: b.title || "Untitled",
          trashedAt: b.trashedAt ?? null,
        })),
      },
      {
        kind: "tag",
        items: trashedTags.map((t) => ({
          id: t.id,
          label: t.name,
          color: t.color,
          trashedAt: t.trashedAt ?? null,
        })),
      },
      {
        kind: "label",
        items: trashedLabels.map((l) => ({
          id: l.id,
          label: l.name,
          color: l.color,
          trashedAt: l.trashedAt ?? null,
        })),
      },
      {
        kind: "template",
        items: trashedTemplates.map((t) => ({
          id: t.id,
          label: t.name || "Untitled",
          trashedAt: t.trashedAt ?? null,
        })),
      },
      {
        kind: "reference",
        items: trashedRefs.map((r) => ({
          id: r.id,
          label: r.title || "Untitled",
          trashedAt: r.trashedAt ?? null,
        })),
      },
      {
        kind: "attachment",
        items: trashedFiles.map((a) => ({
          id: a.id,
          label: a.name || "Untitled",
          trashedAt: a.trashedAt ?? null,
        })),
      },
    ]
    return list
  }, [notes, wikiArticles, storeBooks, tags, labels, storeTemplates, storeReferences, storeAttachments])

  const totalCount = sections.reduce((sum, s) => sum + s.items.length, 0)

  // Silent variants — used by bulk handlers that emit a single aggregated toast.
  const handleRestoreSilent = (kind: EntityKind, id: string) => {
    switch (kind) {
      case "note": toggleTrash(id); break
      case "wiki": updateWikiArticle(id, { trashed: false, trashedAt: null } as any); break
      case "book": restoreBook(id); break
      case "tag": restoreTag(id); break
      case "label": restoreLabel(id); break
      case "template": restoreTemplate(id); break
      case "reference": restoreReference(id); break
      case "attachment": restoreAttachment(id); break
    }
  }

  const handleDeleteSilent = (kind: EntityKind, id: string) => {
    switch (kind) {
      case "note": deleteNote(id); break
      case "wiki": deleteWikiArticle(id); break
      case "book": permanentlyDeleteBook(id); break
      case "tag": permanentlyDeleteTag(id); break
      case "label": permanentlyDeleteLabel(id); break
      case "template": permanentlyDeleteTemplate(id); break
      case "reference": permanentlyDeleteReference(id); break
      case "attachment": permanentlyDeleteAttachment(id); break
    }
  }

  const handleRestore = (kind: EntityKind, id: string, label: string) => {
    handleRestoreSilent(kind, id)
    toast(`Restored ${ENTITY_SINGULAR[kind].toLowerCase()}: ${label}`)
  }

  const handleDelete = (kind: EntityKind, id: string, label: string) => {
    if (!window.confirm(`Permanently delete "${label}"? This cannot be undone.`)) return
    handleDeleteSilent(kind, id)
    toast(`Deleted ${ENTITY_SINGULAR[kind].toLowerCase()}: ${label}`)
  }

  if (totalCount === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-center">
        <div>
          <Trash className="mx-auto mb-3 text-muted-foreground/70" size={40} weight="regular" />
          <p className="text-ui text-muted-foreground">Trash is empty</p>
        </div>
      </div>
    )
  }

  // Build a quick lookup so the bulk-action bar can resolve a selection
  // back to (kind, id, label) without re-iterating every entity slice.
  const keyLookup = useMemo(() => {
    const map = new Map<string, { kind: EntityKind; id: string; label: string }>()
    for (const { kind, items } of sections) {
      for (const it of items) {
        map.set(`${kind}-${it.id}`, { kind, id: it.id, label: it.label })
      }
    }
    return map
  }, [sections])

  // Select-all state — drives header checkbox tri-state (none/some/all).
  const allKeys = useMemo(() => Array.from(keyLookup.keys()), [keyLookup])
  const isAllSelected = allKeys.length > 0 && selectedKeys.size === allKeys.length
  const isSomeSelected = selectedKeys.size > 0 && !isAllSelected
  const toggleAll = useCallback(() => {
    setSelectedKeys((prev) => (prev.size === allKeys.length ? new Set() : new Set(allKeys)))
  }, [allKeys])

  const handleBulkRestore = () => {
    const targets = Array.from(selectedKeys)
      .map((k) => keyLookup.get(k))
      .filter((t): t is { kind: EntityKind; id: string; label: string } => !!t)
    if (targets.length === 0) return
    for (const t of targets) handleRestoreSilent(t.kind, t.id)
    toast.success(`Restored ${targets.length} item${targets.length === 1 ? "" : "s"}`)
    clearSelection()
  }

  const handleBulkDelete = () => {
    if (!window.confirm(`Permanently delete ${selectedKeys.size} item(s)? This cannot be undone.`)) return
    const targets = Array.from(selectedKeys)
      .map((k) => keyLookup.get(k))
      .filter((t): t is { kind: EntityKind; id: string; label: string } => !!t)
    for (const t of targets) handleDeleteSilent(t.kind, t.id)
    toast.success(`Deleted ${targets.length} item${targets.length === 1 ? "" : "s"} permanently`)
    clearSelection()
  }

  return (
    <div className="flex-1 overflow-y-auto relative">
      {/* Column header */}
      <div className="sticky top-0 z-10 flex items-center border-b border-border bg-background px-5 py-2">
        {/* Select-all checkbox — tri-state (none / some / all). Lets the
            user pick everything in trash for bulk Restore / Delete forever. */}
        <div
          className="w-8 shrink-0 flex items-center justify-center cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            toggleAll()
          }}
          title={isAllSelected ? "Deselect all" : "Select all"}
        >
          <div
            className={cn(
              "h-4 w-4 rounded-[4px] border flex items-center justify-center transition-colors shadow-sm",
              isAllSelected || isSomeSelected
                ? "bg-accent border-accent"
                : "bg-card border-zinc-400 dark:border-zinc-600 hover:border-zinc-500",
            )}
            role="checkbox"
            aria-checked={isAllSelected ? true : isSomeSelected ? "mixed" : false}
            aria-label={isAllSelected ? "Deselect all trashed items" : "Select all trashed items"}
          >
            {isAllSelected ? (
              <PhCheck size={10} weight="bold" className="text-accent-foreground" />
            ) : isSomeSelected ? (
              <PhMinus size={10} weight="bold" className="text-accent-foreground" />
            ) : null}
          </div>
        </div>
        <div className="w-6 shrink-0" />
        <div className="w-24 shrink-0 text-2xs uppercase tracking-wide font-medium text-foreground/80">
          Kind
        </div>
        <div className="flex-1 text-note font-medium text-foreground/80">Name</div>
        <div className="w-32 shrink-0 text-right text-note font-medium text-foreground/80">Trashed</div>
        <div className="w-32 shrink-0 text-right text-note font-medium text-foreground/80">Actions</div>
      </div>
      {sections.map(({ kind, items }) => {
        if (items.length === 0) return null
        return (
          <React.Fragment key={kind}>
            <div className="sticky top-[33px] z-[9] flex items-center border-b border-border bg-secondary/30 px-5 py-1.5">
              <span className="text-2xs uppercase tracking-wide font-medium text-muted-foreground">
                {SECTION_TITLES[kind]}
              </span>
              <span className="ml-2 tabular-nums text-2xs text-foreground/50">{items.length}</span>
            </div>
            {items.map((item) => {
              const key = `${kind}-${item.id}`
              return (
                <TrashRow
                  key={key}
                  kind={kind}
                  item={item}
                  isSelected={selectedKeys.has(key)}
                  selectionActive={selectionActive}
                  onToggleSelect={() => toggleSelect(key)}
                  onRestore={() => handleRestore(kind, item.id, item.label)}
                  onDelete={() => handleDelete(kind, item.id, item.label)}
                />
              )
            })}
          </React.Fragment>
        )
      })}
      {/* Floating bulk action bar — mirrors Notes/Wiki list selection UX. */}
      {selectionActive && (
        <div className="sticky bottom-4 z-20 mx-auto mt-4 flex w-fit items-center gap-2 rounded-lg border border-border bg-popover/95 px-3 py-2 shadow-lg backdrop-blur">
          <span className="text-note text-muted-foreground tabular-nums">
            {selectedKeys.size} selected
          </span>
          <button
            onClick={handleBulkRestore}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-note text-foreground transition-colors hover:bg-hover-bg"
          >
            <ArrowCounterClockwise size={14} weight="regular" />
            Restore
          </button>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-note text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash size={14} weight="regular" />
            Delete forever
          </button>
          <button
            onClick={clearSelection}
            className="flex items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
            title="Clear selection"
          >
            <PhX size={14} weight="regular" />
          </button>
        </div>
      )}
    </div>
  )
}
