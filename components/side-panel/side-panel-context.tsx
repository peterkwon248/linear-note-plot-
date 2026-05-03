"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank"
import { FolderOpen } from "@phosphor-icons/react/dist/ssr/FolderOpen"
import { Tag as PhTag } from "@phosphor-icons/react/dist/ssr/Tag"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { Hash as PhHash } from "@phosphor-icons/react/dist/ssr/Hash"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { TextAlignLeft } from "@phosphor-icons/react/dist/ssr/TextAlignLeft"
import { Paperclip } from "@phosphor-icons/react/dist/ssr/Paperclip"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { Shield as PhShield } from "@phosphor-icons/react/dist/ssr/Shield"
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Alarm } from "@phosphor-icons/react/dist/ssr/Alarm"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight"
import { ArrowDownLeft } from "@phosphor-icons/react/dist/ssr/ArrowDownLeft"
import { Tray } from "@phosphor-icons/react/dist/ssr/Tray"
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning"
import { GitMerge } from "@phosphor-icons/react/dist/ssr/GitMerge"
import { CircleDashed } from "@phosphor-icons/react/dist/ssr/CircleDashed"
import { Info as PhInfo } from "@phosphor-icons/react/dist/ssr/Info"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"
import { usePlotStore } from "@/lib/store"
import { useState, useMemo, useCallback } from "react"
import { StatusDropdown, LabelDropdown } from "@/components/note-fields"
import { isReadyToPromote, needsReview, isStaleSuggest, getSnoozeTime, getInboxNotes } from "@/lib/queries/notes"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { toast } from "sonner"
import { useActiveRoute } from "@/lib/table-route"
import { useWikiViewMode, useActiveCategoryId, setActiveCategoryView } from "@/lib/wiki-view-mode"
import { CategorySidePanel } from "@/components/views/wiki-category-page"
import { FolderPicker } from "@/components/folder-picker"

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

import { extractOutlineFromContentJson, type OutlineResult } from "@/lib/anchor-utils"

export function SidePanelContext({ noteId: propNoteId }: { noteId?: string | null }) {
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const previewNoteId = usePlotStore((s) => s.previewNoteId)
  const noteId = propNoteId ?? selectedNoteId ?? previewNoteId
  const notes = usePlotStore((s) => s.notes)
  const folders = usePlotStore((s) => s.folders)
  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)
  const setNoteLabel = usePlotStore((s) => s.setNoteLabel)
  const updateNote = usePlotStore((s) => s.updateNote)
  const addTagToNote = usePlotStore((s) => s.addTagToNote)
  const removeTagFromNote = usePlotStore((s) => s.removeTagFromNote)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const triageKeep = usePlotStore((s) => s.triageKeep)
  const triageSnooze = usePlotStore((s) => s.triageSnooze)
  const triageTrash = usePlotStore((s) => s.triageTrash)
  const promoteToPermanent = usePlotStore((s) => s.promoteToPermanent)
  const undoPromote = usePlotStore((s) => s.undoPromote)
  const moveBackToInbox = usePlotStore((s) => s.moveBackToInbox)
  const setMergePickerOpen = usePlotStore((s) => s.setMergePickerOpen)
  const setLinkPickerOpen = usePlotStore((s) => s.setLinkPickerOpen)

  const backlinks = useBacklinksIndex()

  const [folderOpen, setFolderOpen] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)

  const note = notes.find((n) => n.id === noteId) ?? null

  const outline: OutlineResult = useMemo(
    () => (note?.contentJson ? extractOutlineFromContentJson(note.contentJson) : { source: "empty", items: [] }),
    [note?.contentJson] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const advanceToNextInbox = useCallback(() => {
    if (!note || note.status !== "inbox") return
    const inbox = getInboxNotes(notes, backlinks)
    const next = inbox.find((n) => n.id !== note.id)
    setSelectedNoteId(next?.id ?? null)
  }, [note, notes, backlinks, setSelectedNoteId])

  // Category mode — show category panel instead of note details
  const activeRoute = useActiveRoute()
  const wikiViewMode = useWikiViewMode()
  const activeCategoryId = useActiveCategoryId()
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)

  const isCategoryMode = activeRoute === "/wiki" && wikiViewMode === "category"

  if (isCategoryMode) {
    if (!activeCategoryId) {
      return (
        <div className="flex flex-1 items-center justify-center p-8 text-center">
          <div className="space-y-2">
            <p className="text-note text-muted-foreground">Select a category to see details</p>
          </div>
        </div>
      )
    }
    return (
      <CategorySidePanel
        categories={wikiCategories}
        articles={wikiArticles}
        selectedId={activeCategoryId}
        selectedIds={new Set()}
        onSelect={(id) => setActiveCategoryView(id)}
        onDeleteSelected={() => {}}
        onSelectAll={() => {}}
      />
    )
  }

  if (!note) return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground px-4">
      <PhInfo size={24} weight="light" className="text-muted-foreground/70" />
      <p className="text-note text-center">Select a note to see details</p>
    </div>
  )

  const stale = needsReview(note)
  const staleSuggest = isStaleSuggest(note)
  const linkCount = backlinks.get(note.id) ?? 0

  // v107 N:M: side panel currently shows the primary folder; PR (c)
  // upgrades this to a multi-folder chip strip with add/remove.
  const currentFolder = folders.find((f) => f.id === note.folderIds[0])
  const noteTags = tags.filter((t) => note.tags.includes(t.id) && !t.trashed)
  const availableTags = tags.filter((t) => !note.tags.includes(t.id) && !t.trashed)

  const wordCount = note.content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length
  const charCount = note.content.length

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Status Badges */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border">
        {note.pinned && (
          <span className="flex items-center gap-1 rounded-md bg-chart-3/10 px-2 py-0.5 text-2xs font-medium text-chart-3">
            <PushPin size={14} weight="regular" />
            Pinned
          </span>
        )}
        {/* Stage badge */}
        <span className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-medium ${
          note.status === "inbox"
            ? "bg-accent/10 text-accent"
            : note.status === "capture"
            ? "bg-chart-2/10 text-chart-2"
            : note.status === "permanent"
            ? "bg-chart-5/10 text-chart-5"
            : "bg-accent/10 text-accent"
        }`}>
          {note.status === "permanent" && <PhShield size={14} weight="regular" />}
          {note.status ? note.status.charAt(0).toUpperCase() + note.status.slice(1) : "Inbox"}
        </span>
        {note.status === "capture" && isReadyToPromote(note, backlinks) && (
          <span className="flex items-center gap-1 rounded-md bg-chart-5/10 px-2 py-0.5 text-2xs font-medium text-chart-5">
            <Sparkle size={14} weight="regular" />
            Ready to promote
          </span>
        )}
      </div>

      {/* Workflow Actions */}
      {note.status === "inbox" && note.triageStatus !== "trashed" && (
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-secondary/10">
          <button
            onClick={() => { triageKeep(note.id); toast("Done — moved to Capture"); advanceToNextInbox() }}
            className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-2xs font-medium text-accent-foreground transition-colors hover:bg-accent/80"
          >
            <PhCheck size={14} weight="bold" />
            Done
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-2xs font-medium text-foreground transition-colors hover:bg-hover-bg">
                <Alarm size={14} weight="regular" />
                Snooze
                <CaretDown className="text-muted-foreground" size={10} weight="regular" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem onClick={() => { triageSnooze(note.id, getSnoozeTime("3h")); toast("Snoozed"); advanceToNextInbox() }} className="text-note">
                3 hours
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { triageSnooze(note.id, getSnoozeTime("tomorrow")); toast("Snoozed"); advanceToNextInbox() }} className="text-note">
                Tomorrow 10:00 AM
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { triageSnooze(note.id, getSnoozeTime("next-week")); toast("Snoozed"); advanceToNextInbox() }} className="text-note">
                Next week 10:00 AM
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => { triageTrash(note.id); toast("Trashed"); advanceToNextInbox() }}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-2xs font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash size={14} weight="regular" />
            Trash
          </button>
        </div>
      )}

      {note.status === "capture" && (
        <div className="border-b border-border">
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-secondary/10">
            <button
              onClick={() => { promoteToPermanent(note.id); toast("Promoted to Permanent") }}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium transition-colors ${
                isReadyToPromote(note, backlinks)
                  ? "bg-chart-5 text-primary-foreground hover:bg-chart-5/80"
                  : "border border-border bg-card text-foreground hover:bg-hover-bg"
              }`}
            >
              <ArrowUpRight size={14} weight="regular" />
              Promote
            </button>
            <button
              onClick={() => { moveBackToInbox(note.id); toast("Moved back to Inbox") }}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-2xs font-medium text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
            >
              <Tray size={14} weight="regular" />
              Back to Inbox
            </button>
          </div>
          {staleSuggest && (
            <div className="flex items-center gap-2 bg-destructive/5 px-4 py-2">
              <Warning className="shrink-0 text-destructive" size={14} weight="regular" />
              <span className="text-2xs text-destructive">14+ days untouched.</span>
              <button
                onClick={() => { moveBackToInbox(note.id); toast("Moved back to Inbox") }}
                className="ml-auto text-2xs font-medium text-destructive underline underline-offset-2 hover:no-underline"
              >
                Move to Inbox?
              </button>
            </div>
          )}
          {!staleSuggest && stale && (
            <div className="flex items-center gap-2 bg-chart-3/5 px-4 py-2">
              <Warning className="shrink-0 text-chart-3" size={14} weight="regular" />
              <span className="text-2xs text-chart-3">Review needed - 7+ days untouched.</span>
            </div>
          )}
        </div>
      )}

      {note.status === "permanent" && (
        <div className="border-b border-border">
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-secondary/10">
            <button
              onClick={() => { undoPromote(note.id); toast("Demoted to Capture") }}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-2xs font-medium text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
            >
              <ArrowDownLeft size={14} weight="regular" />
              Demote to Capture
            </button>
          </div>
          {linkCount === 0 && (
            <div className="flex items-center gap-2 bg-chart-3/5 px-4 py-2">
              <PhLink className="shrink-0 text-chart-3" size={14} weight="regular" />
              <span className="text-2xs text-chart-3">Unlinked - add connections to strengthen graph.</span>
            </div>
          )}
        </div>
      )}

      {/* Dates */}
      <InspectorSection title="Dates" icon={<CalendarBlank size={16} weight="regular" />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Created</span>
            <span className="text-note text-foreground">
              {format(new Date(note.createdAt), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Updated</span>
            <span className="text-note text-foreground">
              {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Status */}
      <InspectorSection title="Status" icon={<CircleDashed size={16} weight="regular" />}>
        <StatusDropdown
          value={note.status}
          onChange={(s) => updateNote(note.id, { status: s })}
          variant="button"
        />
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Folder */}
      <InspectorSection title="Folder" icon={<FolderOpen size={16} weight="regular" />}>
        <Popover open={folderOpen} onOpenChange={setFolderOpen}>
          <PopoverTrigger asChild>
            <button className="flex w-full items-center justify-between rounded-md border border-border bg-secondary/30 px-2.5 py-1.5 text-note text-foreground transition-colors hover:bg-hover-bg">
              <span className="flex items-center gap-2">
                {currentFolder && (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: currentFolder.color }}
                  />
                )}
                {currentFolder?.name ?? "No folder"}
              </span>
              <CaretDown className="text-muted-foreground" size={14} weight="regular" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-52 p-1">
            {/* PR (b): unified FolderPicker — notes side panel always
                operates on a Note → kind="note" enforced. PR (c) flips this
                to multi-select once detail-panel chip strip lands. */}
            <FolderPicker
              kind="note"
              currentFolderIds={note.folderIds}
              onSelect={(folderId) => {
                updateNote(note.id, {
                  folderIds: folderId ? [folderId] : [],
                })
                setFolderOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Label */}
      <InspectorSection title="Label" icon={<PhTag size={16} weight="regular" />}>
        <LabelDropdown
          value={note.labelId}
          labels={labels.filter((l) => !l.trashed)}
          onChange={(labelId) => setNoteLabel(note.id, labelId)}
          variant="button"
        />
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Tags */}
      <InspectorSection title="Tags" icon={<PhHash size={16} weight="regular" />}>
        <div className="flex flex-wrap items-center gap-1.5">
          {noteTags.map((tag) => (
            <span
              key={tag.id}
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium"
              style={{
                backgroundColor: `${tag.color}18`,
                color: tag.color,
              }}
            >
              {tag.name}
              <button
                onClick={() => removeTagFromNote(note.id, tag.id)}
                className="rounded-full p-0.5 transition-colors hover:bg-hover-bg"
              >
                <PhX size={10} weight="regular" />
              </button>
            </span>
          ))}
          {availableTags.length > 0 && (
            <Popover open={tagOpen} onOpenChange={setTagOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-2xs text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground">
                  <PhPlus size={10} weight="regular" />
                  Add
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-48 p-1">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      addTagToNote(note.id, tag.id)
                      setTagOpen(false)
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-note text-muted-foreground transition-colors hover:bg-hover-bg"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}
          {noteTags.length === 0 && availableTags.length === 0 && (
            <span className="text-note text-muted-foreground">No tags available</span>
          )}
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Outline (TOC block > headings fallback) */}
      <InspectorSection title="Outline" icon={<TextAlignLeft size={16} weight="regular" />}>
        {outline.items.length > 0 ? (
          <div className="space-y-0.5">
            {outline.source === "toc" && (
              <div className="mb-1.5 text-2xs uppercase tracking-wider text-muted-foreground/70">
                From TOC block
              </div>
            )}
            {outline.items.map((item, i) => (
              <button
                key={i}
                className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-note text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground text-left"
                style={{ paddingLeft: `${6 + (item.level - 1) * 12}px` }}
                onClick={() => {
                  if (!item.id) return
                  const el = (document.querySelector(`[data-anchor-id="${item.id}"]`) as HTMLElement | null)
                    || document.getElementById(item.id)
                  el?.scrollIntoView({ behavior: "smooth", block: "center" })
                }}
              >
                {item.source === "heading" ? (
                  <span className="shrink-0 text-2xs font-mono text-muted-foreground/70 w-5">
                    H{item.level}
                  </span>
                ) : (
                  <span className="shrink-0 text-muted-foreground/70">→</span>
                )}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <span className="text-note text-muted-foreground">No structure yet</span>
        )}
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Properties */}
      <InspectorSection title="Properties" icon={<FileText size={16} weight="regular" />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Words</span>
            <span className="text-note tabular-nums text-foreground">{wordCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Characters</span>
            <span className="text-note tabular-nums text-foreground">{charCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Headings</span>
            <span className="text-note tabular-nums text-foreground">{outline.items.filter(i => i.source === "heading").length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Source</span>
            <span className="text-note text-foreground capitalize">{note.source ?? "manual"}</span>
          </div>
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Actions */}
      <InspectorSection title="Actions" icon={<GitMerge size={16} weight="regular" />}>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => setMergePickerOpen(true, note.id)}
            className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-note font-medium text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
          >
            <GitMerge size={14} weight="regular" />
            GitMerge with...
          </button>
          <button
            onClick={() => setLinkPickerOpen(true, note.id)}
            className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-note font-medium text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
          >
            <PhLink size={14} weight="regular" />
            Link to...
          </button>
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Attachments (placeholder) */}
      <InspectorSection title="Attachments" icon={<Paperclip size={16} weight="regular" />}>
        <span className="text-note text-muted-foreground">No attachments</span>
      </InspectorSection>

    </div>
  )
}
