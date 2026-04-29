"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { usePlotStore } from "@/lib/store"
import { TagsView } from "@/components/views/tags-view"
import { formatDistanceToNow } from "date-fns"
import { shortRelative } from "@/lib/format-utils"
import { toast } from "sonner"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { ViewHeader } from "@/components/view-header"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Books } from "@phosphor-icons/react/dist/ssr/Books"
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Tag } from "@phosphor-icons/react/dist/ssr/Tag"
import { Folder } from "@phosphor-icons/react/dist/ssr/Folder"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { Copy } from "@phosphor-icons/react/dist/ssr/Copy"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning"
import { ListBullets } from "@phosphor-icons/react/dist/ssr/ListBullets"
import { Check } from "@phosphor-icons/react/dist/ssr/Check"
import { Minus } from "@phosphor-icons/react/dist/ssr/Minus"
import { CaretUp } from "@phosphor-icons/react/dist/ssr/CaretUp"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { SquaresFour } from "@phosphor-icons/react/dist/ssr/SquaresFour"
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning"
import { Paperclip } from "@phosphor-icons/react/dist/ssr/Paperclip"
import { BookOpenText } from "@phosphor-icons/react/dist/ssr/BookOpenText"
import { Quotes } from "@phosphor-icons/react/dist/ssr/Quotes"
import { UploadSimple } from "@phosphor-icons/react/dist/ssr/UploadSimple"
import { cn } from "@/lib/utils"
import { useActiveRoute, setActiveRoute } from "@/lib/table-route"
import { usePaneActiveRoute } from "@/components/workspace/pane-context"
import { pickColor } from "@/components/note-fields"
import { persistAttachmentBlob } from "@/lib/store/helpers"
import type { Reference } from "@/lib/types"

/* ── Types ────────────────────────────────────────── */

type QuickFilterType = "all" | "linked" | "unlinked" | "links"
type SortField = "updatedAt" | "title" | "createdAt"
type SortDir = "asc" | "desc"

/* ── Quick Filter Button ─────────────────────────── */

function QuickFilterButton({
  label,
  active,
  onClick,
  count,
}: {
  label: string
  active: boolean
  onClick: () => void
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-medium transition-colors",
        active
          ? "bg-accent/10 text-accent"
          : "text-muted-foreground/50 hover:text-foreground hover:bg-hover-bg"
      )}
    >
      {label}
      {count !== undefined && (
        <span className="text-muted-foreground/40">{count}</span>
      )}
    </button>
  )
}

/* ── Quick Filter Bar ────────────────────────────── */

function QuickFilterBar({
  quickFilter,
  setQuickFilter,
  totalCount,
  linkedCount,
  unlinkedCount,
  linksCount,
  fieldKeys,
  activeFieldKeys,
  toggleFieldKey,
}: {
  quickFilter: QuickFilterType
  setQuickFilter: (f: QuickFilterType) => void
  totalCount: number
  linkedCount: number
  unlinkedCount: number
  linksCount: number
  fieldKeys: string[]
  activeFieldKeys: Set<string>
  toggleFieldKey: (key: string) => void
}) {
  return (
    <div className="flex items-center gap-1.5 px-5 py-1.5 border-b border-border/30">
      <QuickFilterButton
        label="All"
        active={quickFilter === "all"}
        onClick={() => setQuickFilter("all")}
        count={totalCount}
      />
      <QuickFilterButton
        label="Linked"
        active={quickFilter === "linked"}
        onClick={() => setQuickFilter("linked")}
        count={linkedCount}
      />
      <QuickFilterButton
        label="Unlinked"
        active={quickFilter === "unlinked"}
        onClick={() => setQuickFilter("unlinked")}
        count={unlinkedCount}
      />
      <QuickFilterButton
        label="Links"
        active={quickFilter === "links"}
        onClick={() => setQuickFilter("links")}
        count={linksCount}
      />

      {fieldKeys.length > 0 && (
        <div className="w-px h-4 bg-border/50 mx-1" />
      )}
      {fieldKeys.map((key) => (
        <QuickFilterButton
          key={key}
          label={key}
          active={activeFieldKeys.has(key)}
          onClick={() => toggleFieldKey(key)}
        />
      ))}
    </div>
  )
}

/* ── Reference Row ────────────────────────────────── */

function ReferenceRow({
  ref_,
  isSelected,
  isMultiSelected,
  isMultiMode,
  onClick,
  onMultiSelect,
  onDelete,
  onCopyTitle,
  onEdit,
}: {
  ref_: Reference
  isSelected: boolean
  isMultiSelected: boolean
  isMultiMode: boolean
  onClick: () => void
  onMultiSelect: (e: React.MouseEvent) => void
  onDelete: () => void
  onCopyTitle: () => void
  onEdit: () => void
}) {
  const fieldCount = ref_.fields.length
  const timeAgo = ref_.updatedAt
    ? formatDistanceToNow(new Date(ref_.updatedAt), { addSuffix: false })
    : ""

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      onMultiSelect(e)
    } else {
      onClick()
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          onClick={handleClick}
          className={cn(
            "group/ref w-full text-left px-5 py-3 border-b border-border/50 transition-colors duration-100",
            "hover:bg-hover-bg focus-visible:outline-none",
            isSelected && !isMultiMode && "bg-hover-bg",
            isMultiSelected && "bg-accent/8"
          )}
        >
          <div className="flex items-start gap-2.5">
            {/* Checkbox — separate from icon, Notes pattern */}
            <div
              data-checkbox
              onClick={(e) => { e.stopPropagation(); onMultiSelect(e); }}
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center cursor-pointer rounded",
                isMultiMode || isMultiSelected ? "visible" : "invisible group-hover/ref:visible"
              )}
            >
              <div
                className={cn(
                  "h-4 w-4 rounded-[4px] border flex items-center justify-center transition-colors pointer-events-none shadow-sm",
                  isMultiSelected
                    ? "bg-accent border-accent"
                    : "bg-card border-zinc-400 dark:border-zinc-600 hover:border-zinc-500"
                )}
              >
                {isMultiSelected && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            {/* Icon */}
            <FileText
              weight="duotone"
              className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-note font-medium text-foreground">
                  {ref_.title || "Untitled Reference"}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {fieldCount > 0 && (
                    <span className="inline-flex items-center rounded-full bg-secondary/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60">
                      {fieldCount}
                    </span>
                  )}
                  {timeAgo && (
                    <span className="text-2xs text-muted-foreground/50 whitespace-nowrap">
                      {timeAgo}
                    </span>
                  )}
                </div>
              </div>
              {ref_.content && (
                <div className="mt-0.5 truncate text-2xs text-muted-foreground/70">
                  {ref_.content}
                </div>
              )}
            </div>
          </div>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onEdit}>
          <PencilSimple weight="bold" className="mr-2 h-3.5 w-3.5" />
          Edit
        </ContextMenuItem>
        <ContextMenuItem onClick={onCopyTitle}>
          <Copy weight="bold" className="mr-2 h-3.5 w-3.5" />
          Copy title
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash weight="bold" className="mr-2 h-3.5 w-3.5" />
          Delete reference
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

/* ── Empty State ─────────────────────────────────── */

function EmptyReferences({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <Books weight="duotone" className="h-12 w-12 text-muted-foreground/30" />
      <div>
        <p className="text-note font-medium text-muted-foreground/60">
          No references yet
        </p>
        <p className="mt-1 text-2xs text-muted-foreground/40 max-w-[280px]">
          References are reusable sources linked to your footnotes.
          Create one to get started.
        </p>
      </div>
      <button
        onClick={onCreate}
        className="mt-2 flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-2xs font-medium text-accent hover:bg-accent/20 transition-colors"
      >
        <Plus weight="bold" className="h-3 w-3" />
        New Reference
      </button>
    </div>
  )
}

/* ── Search Empty State ──────────────────────────── */

function SearchEmpty({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <Books weight="duotone" className="h-8 w-8 text-muted-foreground/25" />
      <p className="text-2xs text-muted-foreground/40">
        No references matching &quot;{query}&quot;
      </p>
    </div>
  )
}

/* ── Floating Action Bar Divider ─────────────────── */

function Divider() {
  return <div className="h-7 w-px bg-border mx-1.5" />
}

/* ── Library Floating Action Bar ─────────────────── */

function LibraryFloatingActionBar({
  selectedIds,
  references,
  onClearSelection,
}: {
  selectedIds: Set<string>
  references: Record<string, Reference>
  onClearSelection: () => void
}) {
  const deleteReference = usePlotStore((s) => s.deleteReference)
  const updateReference = usePlotStore((s) => s.updateReference)
  const [fieldDialog, setFieldDialog] = useState<{ open: boolean; key: string; value: string }>({ open: false, key: "", value: "" })

  const count = selectedIds.size
  if (count === 0) return null

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => deleteReference(id))
    onClearSelection()
    toast.success(`Deleted ${count} reference${count > 1 ? "s" : ""}`)
  }

  const handleBulkExport = () => {
    const text = [...selectedIds]
      .map((id) => references[id])
      .filter(Boolean)
      .map((r) => {
        let s = r.title || "Untitled Reference"
        if (r.content) s += "\n" + r.content
        if (r.fields.length) s += "\n" + r.fields.map((f) => `  ${f.key}: ${f.value}`).join("\n")
        return s
      })
      .join("\n\n---\n\n")
    navigator.clipboard.writeText(text)
    toast.success(`Copied ${count} reference${count > 1 ? "s" : ""} to clipboard`)
  }

  const handleBulkAddField = () => {
    setFieldDialog({ open: true, key: "", value: "" })
  }

  const submitBulkField = () => {
    const key = fieldDialog.key.trim()
    if (!key) return
    const value = fieldDialog.value.trim()
    selectedIds.forEach((id) => {
      const ref = references[id]
      if (ref) {
        updateReference(id, { fields: [...ref.fields, { key, value }] })
      }
    })
    toast.success(`Added "${key}" to ${count} reference${count > 1 ? "s" : ""}`)
    setFieldDialog({ open: false, key: "", value: "" })
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="flex items-center gap-1 rounded-xl border border-border bg-surface-overlay px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {/* Selection info */}
        <button
          onClick={onClearSelection}
          className="mr-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-2xs font-medium text-muted-foreground hover:bg-active-bg transition-colors"
        >
          <Lightning size={14} weight="fill" className="text-accent" />
          {count} selected
          <PhX size={12} weight="regular" className="ml-0.5 text-muted-foreground/50" />
        </button>

        <Divider />

        {/* Delete */}
        <button
          onClick={handleBulkDelete}
          title="Delete selected"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-2xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash size={16} weight="regular" />
          Delete
        </button>

        <Divider />

        {/* Export / Copy */}
        <button
          onClick={handleBulkExport}
          title="Copy to clipboard"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-2xs font-medium text-foreground hover:bg-hover-bg transition-colors"
        >
          <Copy size={16} weight="regular" />
          Export
        </button>

        {/* Add Field */}
        <button
          onClick={handleBulkAddField}
          title="Add field to all"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-2xs font-medium text-foreground hover:bg-hover-bg transition-colors"
        >
          <ListBullets size={16} weight="regular" />
          Add Field
        </button>
      </div>

      {/* Add Field Dialog */}
      {fieldDialog.open && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setFieldDialog({ open: false, key: "", value: "" }) }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-[400px] rounded-xl border border-border bg-surface-overlay shadow-2xl p-6 flex flex-col gap-4">
            <div className="text-base font-semibold text-foreground">Add Field</div>
            <div className="text-sm text-muted-foreground">Add a custom field to {count} selected reference{count > 1 ? "s" : ""}.</div>
            <input
              autoFocus
              type="text"
              value={fieldDialog.key}
              onChange={(e) => setFieldDialog((s) => ({ ...s, key: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Escape") setFieldDialog({ open: false, key: "", value: "" }) }}
              placeholder="Field name"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-accent transition-shadow"
            />
            <input
              type="text"
              value={fieldDialog.value}
              onChange={(e) => setFieldDialog((s) => ({ ...s, value: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && fieldDialog.key.trim()) submitBulkField()
                if (e.key === "Escape") setFieldDialog({ open: false, key: "", value: "" })
              }}
              placeholder="Field value"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-accent transition-shadow"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setFieldDialog({ open: false, key: "", value: "" })}
                className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitBulkField}
                disabled={!fieldDialog.key.trim()}
                className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white disabled:opacity-40 hover:brightness-110 transition-all"
              >
                Add
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

/* ── Dashboard Sub-Components ────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground/40">
      {children}
    </h3>
  )
}

/* ── Library Overview ────────────────────────────── */

/* ── Library Dashboard Sub-Components ─────────────── */

function LibMiniStat({
  label,
  value,
  sub,
  color,
  icon,
  onClick,
}: {
  label: string
  value: number
  sub: string
  color: string
  icon?: React.ReactNode
  onClick?: () => void
}) {
  const Wrapper = onClick ? "button" : "div"
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "rounded-lg border border-border-subtle bg-card/50 px-3 py-2.5 text-left relative",
        onClick && "cursor-pointer transition-all duration-150 hover:border-accent/30 hover:bg-accent/[0.03]"
      )}
    >
      {icon && <span className="absolute right-3 top-2.5 text-muted-foreground/25">{icon}</span>}
      <p className={cn("text-xl font-semibold tabular-nums", color)}>{value}</p>
      <p className="text-2xs font-medium text-foreground/70">{label}</p>
      <p className="text-2xs text-muted-foreground/40">{sub}</p>
    </Wrapper>
  )
}

function LibSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground/40">
      {children}
    </h2>
  )
}


/* ── Library Overview (Wiki Dashboard Style) ──────── */

function LibraryOverview() {
  const references = usePlotStore((s) => s.references)
  const tags = usePlotStore((s) => s.tags)
  const attachments = usePlotStore((s) => s.attachments)
  const notes = usePlotStore((s) => s.notes)

  // Stats
  const refList = useMemo(() => Object.values(references).filter((r) => !r.trashed), [references])
  const activeTags = useMemo(() => tags.filter((t) => !t.trashed), [tags])
  const activeAttachments = useMemo(() => attachments.filter((a) => !a.trashed), [attachments])
  const activeNotes = useMemo(() => notes.filter((n) => !n.trashed), [notes])

  const refTotal = refList.length
  const tagTotal = activeTags.length
  const fileTotal = activeAttachments.length

  // Sub-stats
  const linkedRefCount = refList.filter((r) => r.content.trim()).length
  const imageCount = activeAttachments.filter((a) => a.type === "image").length
  const docCount = fileTotal - imageCount
  const tagUsedCount = activeTags.filter((t) => activeNotes.some((n) => n.tags?.includes(t.id))).length

  // Unified recent feed — merge all types, sort by time
  const recentFeed = useMemo(() => {
    const items: Array<{ id: string; title: string; type: "reference" | "tag" | "file"; time: number }> = []

    for (const ref of refList) {
      items.push({
        id: ref.id,
        title: ref.title || "Untitled Reference",
        type: "reference",
        time: new Date(ref.updatedAt).getTime(),
      })
    }

    for (const tag of activeTags) {
      const taggedNotes = activeNotes.filter((n) => n.tags?.includes(tag.id))
      if (taggedNotes.length === 0) continue
      const latestTime = Math.max(...taggedNotes.map((n) => new Date(n.updatedAt).getTime()))
      items.push({
        id: tag.id,
        title: tag.name,
        type: "tag",
        time: latestTime,
      })
    }

    for (const att of activeAttachments) {
      items.push({
        id: att.id,
        title: att.name || "Untitled file",
        type: "file",
        time: new Date(att.createdAt).getTime(),
      })
    }

    return items.sort((a, b) => b.time - a.time).slice(0, 8)
  }, [refList, activeTags, activeAttachments, activeNotes])

  // Top tags by note count
  const topTags = useMemo(() => {
    return activeTags
      .map((t) => ({
        id: t.id,
        name: t.name,
        count: activeNotes.filter((n) => n.tags?.includes(t.id)).length,
      }))
      .filter((t) => t.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [activeTags, activeNotes])

  // Attention items
  const unlinkedRefCount = refList.filter((r) => !r.content.trim()).length
  const unusedTagCount = activeTags.filter((t) => !activeNotes.some((n) => n.tags?.includes(t.id))).length
  const hasAttention = unlinkedRefCount > 0 || unusedTagCount > 0

  const isEmpty = refTotal === 0 && tagTotal === 0 && fileTotal === 0
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ViewHeader
        icon={<SquaresFour weight="duotone" className="h-4 w-4" />}
        title="Library"
        showDetailPanel
        detailPanelOpen={usePlotStore.getState().sidePanelOpen}
        onDetailPanelToggle={() => usePlotStore.getState().toggleSidePanel()}
        createMenuContent={
          <div className="py-1 w-44">
            <button
              onClick={() => {
                const id = usePlotStore.getState().createReference({ title: "", content: "" })
                usePlotStore.getState().openReferencePanel(id)
                setActiveRoute("/library/references")
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-note text-foreground/80 hover:bg-hover-bg transition-colors"
            >
              <Quotes size={16} weight="regular" className="text-muted-foreground" />
              New Reference
            </button>
            <div className="flex items-center gap-2.5 px-3 py-1.5">
              <Tag size={16} weight="regular" className="shrink-0 text-muted-foreground" />
              <input
                placeholder="New tag name..."
                className="w-full bg-transparent text-note text-foreground outline-none placeholder:text-muted-foreground/40"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                    const name = (e.target as HTMLInputElement).value.trim()
                    const store = usePlotStore.getState()
                    if (!store.tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
                      store.createTag(name, pickColor(name))
                      toast.success(`Tag "${name}" created`)
                    } else {
                      toast.error(`Tag "${name}" already exists`)
                    }
                    ;(e.target as HTMLInputElement).value = ""
                    setActiveRoute("/library/tags")
                  }
                }}
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-note text-foreground/80 hover:bg-hover-bg transition-colors"
            >
              <Paperclip size={16} weight="regular" className="text-muted-foreground" />
              Upload File
            </button>
          </div>
        }
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          usePlotStore.getState().addAttachment({
            name: file.name,
            type: file.type.startsWith("image/") ? "image" : "file",
            mimeType: file.type,
            size: file.size,
            url: "",
            noteId: "",
          })
          setActiveRoute("/library/files")
          toast.success(`Uploaded ${file.name}`)
          e.target.value = ""
        }}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-6">
          {isEmpty ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/60">
                <Books className="text-muted-foreground" size={20} weight="regular" />
              </div>
              <p className="text-note font-medium text-muted-foreground">Library is empty</p>
              <p className="text-2xs text-muted-foreground/60">Create references, add tags, or attach files to your notes</p>
            </div>
          ) : (
            <>
              {/* ── Stat Cards ── */}
              <div className="mb-6 grid grid-cols-2 gap-3 min-[800px]:grid-cols-3">
                <LibMiniStat
                  label="References"
                  value={refTotal}
                  sub={`${linkedRefCount} linked`}
                  color="text-accent"
                  icon={<Quotes size={24} weight="regular" />}
                  onClick={() => setActiveRoute("/library/references")}
                />
                <LibMiniStat
                  label="Tags"
                  value={tagTotal}
                  sub={`used across ${tagUsedCount} tags`}
                  color="text-amber-500"
                  icon={<Tag size={24} weight="regular" />}
                  onClick={() => setActiveRoute("/library/tags")}
                />
                <LibMiniStat
                  label="Files"
                  value={fileTotal}
                  sub={`${imageCount} image${imageCount !== 1 ? "s" : ""}, ${docCount} doc${docCount !== 1 ? "s" : ""}`}
                  color="text-orange-400"
                  icon={<Paperclip size={24} weight="regular" />}
                  onClick={() => setActiveRoute("/library/files")}
                />
              </div>

              {/* ── Attention Banner ── */}
              {hasAttention && (
                <div className="mb-6 flex items-start gap-4 rounded-lg border border-amber-500/20 bg-amber-500/[0.03] p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                    <Warning className="text-amber-500" size={16} weight="regular" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-2xs font-medium uppercase tracking-wide text-muted-foreground/40">Needs Attention</span>
                    <div className="mt-1 space-y-0.5">
                      {unlinkedRefCount > 0 && (
                        <p className="text-note text-amber-400/80">{unlinkedRefCount} unlinked reference{unlinkedRefCount !== 1 ? "s" : ""}</p>
                      )}
                      {unusedTagCount > 0 && (
                        <p className="text-note text-amber-400/80">{unusedTagCount} unused tag{unusedTagCount !== 1 ? "s" : ""}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Recent Activity ── */}
              {recentFeed.length > 0 && (
                <div className="mb-6">
                  <LibSectionLabel>Recent</LibSectionLabel>
                  <div className="rounded-lg border border-border-subtle bg-card/30">
                    <div className="px-1.5 py-1">
                      {recentFeed.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.type === "reference") setActiveRoute("/library/references")
                            else if (item.type === "tag") setActiveRoute("/library/tags")
                            else setActiveRoute("/library/files")
                          }}
                          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors duration-100 hover:bg-hover-bg"
                        >
                          <span className="shrink-0 text-muted-foreground/50">
                            {item.type === "reference" && <BookOpenText size={14} weight="regular" />}
                            {item.type === "tag" && <Tag size={14} weight="regular" />}
                            {item.type === "file" && <Paperclip size={14} weight="regular" />}
                          </span>
                          <span className="flex-1 truncate text-note text-foreground/90">{item.title}</span>
                          <span className="shrink-0 text-2xs tabular-nums text-muted-foreground/40">
                            {shortRelative(new Date(item.time).toISOString())}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Top Tags Grid ── */}
              {topTags.length > 0 && (
                <div className="mb-6">
                  <LibSectionLabel>Top Tags</LibSectionLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {topTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => setActiveRoute("/library/tags")}
                        className="rounded-lg border border-border-subtle bg-card/30 px-4 py-3 text-left transition-all duration-150 hover:border-accent/30 hover:bg-accent/[0.03]"
                      >
                        <p className="text-note font-medium text-foreground">{tag.name}</p>
                        <p className="text-2xs text-muted-foreground/40">{tag.count} note{tag.count !== 1 ? "s" : ""}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Tags View: imported from tags-view.tsx ──────── */

/* ── Files View ──────────────────────────────────── */

function FilesView() {
  const attachments = usePlotStore((s) => s.attachments)
  const addAttachment = usePlotStore((s) => s.addAttachment)
  const [filter, setFilter] = useState<"all" | "image" | "document">("all")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeAttachments = useMemo(() => attachments.filter((a) => !a.trashed), [attachments])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    for (const file of Array.from(files)) {
      const buffer = await file.arrayBuffer()
      const isImage = file.type.startsWith("image/")
      const attachmentId = addAttachment({
        noteId: "__library__",
        name: file.name,
        type: isImage ? "image" : "file",
        url: "",
        mimeType: file.type || "application/octet-stream",
        size: file.size,
      })
      persistAttachmentBlob({ id: attachmentId, data: buffer })
    }
    toast(`Uploaded ${files.length} file${files.length > 1 ? "s" : ""}`)
    e.target.value = ""
  }

  const filtered = useMemo(() => {
    if (filter === "all") return activeAttachments
    if (filter === "image") return activeAttachments.filter((a) => a.type === "image")
    return activeAttachments.filter((a) => a.type !== "image")
  }, [activeAttachments, filter])

  const imageCount = useMemo(() => activeAttachments.filter((a) => a.type === "image").length, [activeAttachments])
  const docCount = useMemo(() => activeAttachments.filter((a) => a.type !== "image").length, [activeAttachments])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ViewHeader
        icon={<Folder weight="duotone" className="h-4 w-4" />}
        title="Files"
        count={activeAttachments.length}
        onCreateNew={() => fileInputRef.current?.click()}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleUpload}
      />
      <div className="flex-1 overflow-y-auto">
        {/* Filter bar */}
        <div className="px-4 py-2 flex items-center gap-1 border-b border-border-subtle">
          {(["all", "image", "document"] as const).map((f) => (
            <QuickFilterButton
              key={f}
              label={f === "all" ? "All" : f === "image" ? "Images" : "Documents"}
              active={filter === f}
              onClick={() => setFilter(f)}
              count={f === "all" ? activeAttachments.length : f === "image" ? imageCount : docCount}
            />
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground/40">
            <Folder weight="duotone" className="h-10 w-10" />
            <span className="text-note font-medium">No files yet</span>
            <span className="text-2xs">
              {activeAttachments.length === 0
                ? "Click + to upload files, or add attachments to notes"
                : "No files match this filter"}
            </span>
          </div>
        ) : (
          <div className="p-4 space-y-0.5">
            {filtered.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-hover-bg"
              >
                <FileText
                  size={16}
                  className={cn(
                    "shrink-0",
                    att.type === "image" ? "text-accent/60" : "text-muted-foreground/50"
                  )}
                />
                <span className="flex-1 truncate text-note text-foreground">
                  {att.name || "Untitled file"}
                </span>
                <span className="text-2xs text-muted-foreground/40 shrink-0">{att.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── References View ─────────────────────────────── */

function ReferencesView() {
  const references = usePlotStore((s) => s.references)
  const createReference = usePlotStore((s) => s.createReference)
  const deleteReference = usePlotStore((s) => s.deleteReference)
  const openReferencePanel = usePlotStore((s) => s.openReferencePanel)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all")
  const [activeFieldKeys, setActiveFieldKeys] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<SortField>("updatedAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [groupBy, setGroupBy] = useState<"none" | "type" | "fieldKey">("none")
  const [groupFieldKey, setGroupFieldKey] = useState<string | null>(null)
  const lastClickedIdRef = useRef<string | null>(null)

  const isMultiMode = selectedIds.size > 0

  /* ── Filter/Sort helpers ── */

  const toggleFieldKey = useCallback((key: string) => {
    setActiveFieldKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const toggleSort = useCallback((field: SortField) => {
    setSortBy((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"))
      } else {
        setSortDir(field === "title" ? "asc" : "desc")
      }
      return field
    })
  }, [])

  const hasActiveFilters = quickFilter !== "all" || activeFieldKeys.size > 0

  /* ── Derived data ── */

  const activeRefs = useMemo(() => Object.values(references).filter((r) => !r.trashed), [references])

  const totalCount = useMemo(() => activeRefs.length, [activeRefs])

  const linkedCount = useMemo(
    () => activeRefs.filter((r) => r.content.trim()).length,
    [activeRefs]
  )
  const unlinkedCount = useMemo(
    () => totalCount - linkedCount,
    [totalCount, linkedCount]
  )
  const linksCount = useMemo(
    () => activeRefs.filter((r) => r.fields.some((f) => f.key.toLowerCase() === "url")).length,
    [activeRefs]
  )

  const fieldKeys = useMemo(() => {
    const keys = new Set<string>()
    activeRefs.forEach((r) =>
      r.fields.forEach((f) => {
        if (f.key.trim()) keys.add(f.key.trim())
      })
    )
    return [...keys].sort()
  }, [activeRefs])

  const referenceList = useMemo(() => {
    let arr = activeRefs

    // Quick filter
    if (quickFilter === "linked") arr = arr.filter((r) => r.content.trim())
    if (quickFilter === "unlinked") arr = arr.filter((r) => !r.content.trim())
    if (quickFilter === "links") arr = arr.filter((r) => r.fields.some((f) => f.key.toLowerCase() === "url"))

    // Field key filter (AND logic)
    if (activeFieldKeys.size > 0) {
      arr = arr.filter((r) => {
        const refKeys = new Set(r.fields.map((f) => f.key.trim()))
        return [...activeFieldKeys].every((k) => refKeys.has(k))
      })
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      arr = arr.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q)
      )
    }

    // Sort
    arr.sort((a, b) => {
      let cmp = 0
      if (sortBy === "title") {
        cmp = (a.title || "").localeCompare(b.title || "")
      } else if (sortBy === "createdAt") {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else {
        cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return arr
  }, [activeRefs, quickFilter, activeFieldKeys, search, sortBy, sortDir])

  const groupedReferences = useMemo(() => {
    if (groupBy === "none") return null

    const groups: { label: string; items: typeof referenceList }[] = []

    if (groupBy === "type") {
      const links = referenceList.filter((r) => r.fields.some((f) => f.key.toLowerCase() === "url"))
      const citations = referenceList.filter((r) => !r.fields.some((f) => f.key.toLowerCase() === "url"))
      if (links.length > 0) groups.push({ label: "Links", items: links })
      if (citations.length > 0) groups.push({ label: "Citations", items: citations })
    } else if (groupBy === "fieldKey" && groupFieldKey) {
      const withKey = referenceList.filter((r) => r.fields.some((f) => f.key.trim() === groupFieldKey))
      const withoutKey = referenceList.filter((r) => !r.fields.some((f) => f.key.trim() === groupFieldKey))
      if (withKey.length > 0) groups.push({ label: `Has "${groupFieldKey}"`, items: withKey })
      if (withoutKey.length > 0) groups.push({ label: `No "${groupFieldKey}"`, items: withoutKey })
    }

    return groups.length > 0 ? groups : null
  }, [referenceList, groupBy, groupFieldKey])

  // Clear selection if reference was deleted
  useEffect(() => {
    if (selectedId && !references[selectedId]) {
      setSelectedId(null)
    }
  }, [selectedId, references])

  // Clean up multi-select for deleted references
  useEffect(() => {
    if (selectedIds.size === 0) return
    const next = new Set<string>()
    selectedIds.forEach((id) => {
      if (references[id]) next.add(id)
    })
    if (next.size !== selectedIds.size) setSelectedIds(next)
  }, [references, selectedIds])

  // Escape to clear multi-select
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedIds.size > 0) {
        setSelectedIds(new Set())
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [selectedIds.size])

  /* ── Actions ── */

  const handleCreate = useCallback(() => {
    const id = createReference({ title: "", content: "" })
    setSelectedId(id)
  }, [createReference])

  const handleDelete = useCallback(
    (id: string) => {
      deleteReference(id)
      if (selectedId === id) setSelectedId(null)
    },
    [deleteReference, selectedId]
  )

  const handleCopyTitle = useCallback((title: string) => {
    navigator.clipboard.writeText(title || "Untitled Reference")
  }, [])

  const handleEdit = useCallback((id: string) => {
    setSelectedId(id)
    openReferencePanel(id)
  }, [openReferencePanel])

  const handleMultiSelect = useCallback((id: string, e: React.MouseEvent) => {
    if (e.shiftKey && lastClickedIdRef.current) {
      // Range select
      const lastIdx = referenceList.findIndex((r) => r.id === lastClickedIdRef.current)
      const curIdx = referenceList.findIndex((r) => r.id === id)
      if (lastIdx !== -1 && curIdx !== -1) {
        const start = Math.min(lastIdx, curIdx)
        const end = Math.max(lastIdx, curIdx)
        const next = new Set(selectedIds)
        for (let i = start; i <= end; i++) {
          next.add(referenceList[i].id)
        }
        setSelectedIds(next)
        return
      }
    }
    // Ctrl/Cmd toggle
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    lastClickedIdRef.current = id
  }, [referenceList, selectedIds])

  const handleRowClick = useCallback((id: string) => {
    setSelectedIds(new Set())
    setSelectedId(id)
    openReferencePanel(id)
    lastClickedIdRef.current = id
  }, [openReferencePanel])

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === referenceList.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(referenceList.map((r) => r.id)))
    }
  }, [selectedIds.size, referenceList])

  const isAllSelected = referenceList.length > 0 && selectedIds.size === referenceList.length
  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < referenceList.length

  /* ── Render ── */

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ViewHeader
        icon={<Books weight="duotone" className="h-4 w-4" />}
        title="References"
        count={totalCount}
        searchPlaceholder="Search references..."
        searchValue={search}
        onSearchChange={setSearch}
        onCreateNew={handleCreate}
        showFilter
        hasActiveFilters={hasActiveFilters}
        filterContent={
          <div className="p-3 w-[260px]">
            <div className="text-2xs font-medium text-muted-foreground/60 mb-2">
              Status
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {(["all", "linked", "unlinked"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setQuickFilter(f)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-2xs font-medium transition-colors capitalize",
                    quickFilter === f
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground/60 hover:bg-hover-bg hover:text-foreground"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            {fieldKeys.length > 0 && (
              <>
                <div className="text-2xs font-medium text-muted-foreground/60 mb-2">
                  Field Keys
                </div>
                <div className="flex flex-wrap gap-1">
                  {fieldKeys.map((key) => (
                    <button
                      key={key}
                      onClick={() => toggleFieldKey(key)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-2xs font-medium transition-colors",
                        activeFieldKeys.has(key)
                          ? "bg-accent/10 text-accent"
                          : "text-muted-foreground/60 hover:bg-hover-bg hover:text-foreground"
                      )}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </>
            )}
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setQuickFilter("all")
                  setActiveFieldKeys(new Set())
                }}
                className="mt-3 w-full text-2xs text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        }
        showDisplay
        displayContent={
          <div className="p-3 w-[240px]">
            {/* Sort */}
            <div className="text-2xs font-medium text-muted-foreground/60 mb-2">Sort by</div>
            <div className="flex flex-wrap gap-1 mb-3">
              {([
                { field: "updatedAt" as SortField, label: "Updated" },
                { field: "title" as SortField, label: "Name" },
                { field: "createdAt" as SortField, label: "Created" },
              ]).map(({ field, label }) => (
                <button
                  key={field}
                  onClick={() => toggleSort(field)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-md text-2xs font-medium transition-colors",
                    sortBy === field
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground/60 hover:bg-hover-bg hover:text-foreground"
                  )}
                >
                  {label}
                  {sortBy === field && (
                    sortDir === "asc" ? <CaretUp size={10} /> : <CaretDown size={10} />
                  )}
                </button>
              ))}
            </div>

            {/* Group by */}
            <div className="text-2xs font-medium text-muted-foreground/60 mb-2">Group by</div>
            <div className="flex flex-wrap gap-1">
              {([
                { value: "none" as const, label: "None" },
                { value: "type" as const, label: "Type" },
                { value: "fieldKey" as const, label: "Field Key" },
              ]).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => { setGroupBy(value); if (value !== "fieldKey") setGroupFieldKey(null) }}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-2xs font-medium transition-colors",
                    groupBy === value
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground/60 hover:bg-hover-bg hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Field key selector when groupBy === "fieldKey" */}
            {groupBy === "fieldKey" && fieldKeys.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {fieldKeys.map((key) => (
                  <button
                    key={key}
                    onClick={() => setGroupFieldKey(key)}
                    className={cn(
                      "px-2 py-0.5 rounded text-2xs transition-colors",
                      groupFieldKey === key
                        ? "bg-accent/10 text-accent"
                        : "text-muted-foreground/40 hover:bg-hover-bg hover:text-foreground"
                    )}
                  >
                    {key}
                  </button>
                ))}
              </div>
            )}
          </div>
        }
      />

      {/* Quick filter bar */}
      {totalCount > 0 && (
        <QuickFilterBar
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          totalCount={totalCount}
          linkedCount={linkedCount}
          unlinkedCount={unlinkedCount}
          linksCount={linksCount}
          fieldKeys={fieldKeys}
          activeFieldKeys={activeFieldKeys}
          toggleFieldKey={toggleFieldKey}
        />
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {referenceList.length === 0 ? (
          search.trim() ? (
            <SearchEmpty query={search} />
          ) : (
            <EmptyReferences onCreate={handleCreate} />
          )
        ) : (
          <>
            {/* Select All Header Row */}
            <div className="flex items-center gap-2.5 px-5 py-2 border-b border-border/50 text-2xs text-muted-foreground/60">
              <button
                onClick={handleSelectAll}
                className="w-4 h-4 rounded border border-border flex items-center justify-center shrink-0 hover:border-foreground/30 transition-colors"
              >
                {isAllSelected ? (
                  <Check size={12} className="text-accent" />
                ) : isPartiallySelected ? (
                  <Minus size={12} className="text-muted-foreground" />
                ) : null}
              </button>
              <button
                onClick={() => toggleSort("title")}
                className="flex-1 flex items-center gap-0.5 font-medium hover:text-foreground transition-colors text-left"
              >
                Name
                {sortBy === "title" && (
                  sortDir === "asc"
                    ? <CaretUp size={10} weight="bold" className="text-accent" />
                    : <CaretDown size={10} weight="bold" className="text-accent" />
                )}
              </button>
              <span className="w-16 text-right">Fields</span>
              <button
                onClick={() => toggleSort("updatedAt")}
                className="w-20 flex items-center justify-end gap-0.5 font-medium hover:text-foreground transition-colors"
              >
                Updated
                {sortBy === "updatedAt" && (
                  sortDir === "asc"
                    ? <CaretUp size={10} weight="bold" className="text-accent" />
                    : <CaretDown size={10} weight="bold" className="text-accent" />
                )}
              </button>
            </div>
            {groupedReferences ? (
              groupedReferences.map((group) => (
                <div key={group.label}>
                  <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border/30 bg-background/95 backdrop-blur-sm px-5 py-1.5">
                    <span className="text-2xs font-medium uppercase tracking-wide text-muted-foreground/50">{group.label}</span>
                    <span className="text-2xs text-muted-foreground/30">{group.items.length}</span>
                  </div>
                  {group.items.map((ref) => (
                    <ReferenceRow
                      key={ref.id}
                      ref_={ref}
                      isSelected={selectedId === ref.id}
                      isMultiSelected={selectedIds.has(ref.id)}
                      isMultiMode={isMultiMode}
                      onClick={() => handleRowClick(ref.id)}
                      onMultiSelect={(e) => handleMultiSelect(ref.id, e)}
                      onDelete={() => handleDelete(ref.id)}
                      onCopyTitle={() => handleCopyTitle(ref.title)}
                      onEdit={() => handleEdit(ref.id)}
                    />
                  ))}
                </div>
              ))
            ) : (
              referenceList.map((ref) => (
                <ReferenceRow
                  key={ref.id}
                  ref_={ref}
                  isSelected={selectedId === ref.id}
                  isMultiSelected={selectedIds.has(ref.id)}
                  isMultiMode={isMultiMode}
                  onClick={() => handleRowClick(ref.id)}
                  onMultiSelect={(e) => handleMultiSelect(ref.id, e)}
                  onDelete={() => handleDelete(ref.id)}
                  onCopyTitle={() => handleCopyTitle(ref.title)}
                  onEdit={() => handleEdit(ref.id)}
                />
              ))
            )}
          </>
        )}
      </div>

      {/* Floating Action Bar */}
      {isMultiMode && (
        <LibraryFloatingActionBar
          selectedIds={selectedIds}
          references={references}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}
    </div>
  )
}

/* ── Main Component ──────────────────────────────── */

export function LibraryView() {
  const activeRoute = usePaneActiveRoute()

  // Determine which sub-view to show
  const isReferences = activeRoute === "/library/references"
  const isTags = activeRoute === "/library/tags"
  const isFiles = activeRoute === "/library/files"
  const isOverview = !isReferences && !isTags && !isFiles

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {isOverview && <LibraryOverview />}
      {isReferences && <ReferencesView />}
      {isTags && <TagsView />}
      {isFiles && <FilesView />}
    </div>
  )
}
