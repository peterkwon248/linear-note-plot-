"use client"

import {
  Calendar,
  Clock,
  FolderOpen,
  Tag,
  X,
  Plus,
  ChevronDown,
  Hash,
  FileText,
  Pin,
  Archive,
  AlignLeft,
  Paperclip,
  Link2,
  Shield,
  Sparkles,
  Check,
  AlarmClock,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Inbox,
  AlertTriangle,
  GitBranch,
  Merge,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"
import { usePlotStore } from "@/lib/store"
import { useState, useMemo, useCallback } from "react"
import { StatusDropdown, PriorityDropdown, LabelDropdown } from "@/components/note-fields"
import { computeReadyScore, isReadyToPromote, needsReview, isStaleSuggest, getSnoozeTime, getInboxNotes } from "@/lib/queries/notes"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { useBacklinksFor } from "@/lib/search/use-backlinks-for"
import { Signal, CircleDot } from "lucide-react"
import { toast } from "sonner"

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
        <span className="text-[12px] font-medium text-muted-foreground">
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function extractHeadings(content: string): { level: number; text: string }[] {
  const lines = content.split("\n")
  const headings: { level: number; text: string }[] = []
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)/)
    if (match) {
      headings.push({ level: match[1].length, text: match[2].trim() })
    }
  }
  return headings
}

export function NoteInspector() {
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const notes = usePlotStore((s) => s.notes)
  const folders = usePlotStore((s) => s.folders)
  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)
  const setNoteLabel = usePlotStore((s) => s.setNoteLabel)
  const updateNote = usePlotStore((s) => s.updateNote)
  const addTagToNote = usePlotStore((s) => s.addTagToNote)
  const removeTagFromNote = usePlotStore((s) => s.removeTagFromNote)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const detailsOpen = usePlotStore((s) => s.detailsOpen)
  const setDetailsOpen = usePlotStore((s) => s.setDetailsOpen)
  const triageKeep = usePlotStore((s) => s.triageKeep)
  const triageSnooze = usePlotStore((s) => s.triageSnooze)
  const triageTrash = usePlotStore((s) => s.triageTrash)
  const promoteToPermanent = usePlotStore((s) => s.promoteToPermanent)
  const undoPromote = usePlotStore((s) => s.undoPromote)
  const moveBackToInbox = usePlotStore((s) => s.moveBackToInbox)
  const setMergePickerOpen = usePlotStore((s) => s.setMergePickerOpen)
  const setLinkPickerOpen = usePlotStore((s) => s.setLinkPickerOpen)

  const backlinks = useBacklinksIndex()
  const backlinkNotes = useBacklinksFor(selectedNoteId)

  const [folderOpen, setFolderOpen] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)

  const note = notes.find((n) => n.id === selectedNoteId) ?? null

  const headings = useMemo(
    () => (note ? extractHeadings(note.content) : []),
    [note?.content] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const advanceToNextInbox = useCallback(() => {
    if (!note || note.status !== "inbox") return
    const inbox = getInboxNotes(notes, backlinks)
    const next = inbox.find((n) => n.id !== note.id)
    setSelectedNoteId(next?.id ?? null)
  }, [note, notes, backlinks, setSelectedNoteId])

  if (!note || !detailsOpen) return null

  const stale = needsReview(note)
  const staleSuggest = isStaleSuggest(note)
  const linkCount = backlinks.get(note.id) ?? 0

  const currentFolder = folders.find((f) => f.id === note.folderId)
  const noteTags = tags.filter((t) => note.tags.includes(t.id))
  const availableTags = tags.filter((t) => !note.tags.includes(t.id))

  const wordCount = note.content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length
  const charCount = note.content.length

  return (
    <aside className="flex h-full w-[320px] shrink-0 flex-col overflow-hidden border-l border-border bg-card">
      {/* Inspector Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="text-[15px] font-medium text-foreground">Details</span>
        <button
          onClick={() => setDetailsOpen(false)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Close inspector"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Status Badges */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border">
          {note.pinned && (
            <span className="flex items-center gap-1 rounded-md bg-[#f2994a]/10 px-2 py-0.5 text-[12px] font-medium text-[#f2994a]">
              <Pin className="h-3.5 w-3.5" />
              Pinned
            </span>
          )}
          {note.archived && (
            <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[12px] font-medium text-muted-foreground">
              <Archive className="h-3.5 w-3.5" />
              Archived
            </span>
          )}
          {/* Stage badge */}
          <span className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-medium ${
            note.status === "inbox"
              ? "bg-accent/10 text-accent"
              : note.status === "capture"
              ? "bg-[#26b5ce]/10 text-[#26b5ce]"
              : note.status === "permanent"
              ? "bg-[#45d483]/10 text-[#45d483]"
              : "bg-accent/10 text-accent"
          }`}>
            {note.status === "permanent" && <Shield className="h-3.5 w-3.5" />}
            {note.status ? note.status.charAt(0).toUpperCase() + note.status.slice(1) : "Inbox"}
          </span>
          {note.status === "capture" && isReadyToPromote(note, backlinks) && (
            <span className="flex items-center gap-1 rounded-md bg-[#45d483]/10 px-2 py-0.5 text-[12px] font-medium text-[#45d483]">
              <Sparkles className="h-3.5 w-3.5" />
              Ready to promote
            </span>
          )}
          {note.parentNoteId && (
            <span className="flex items-center gap-1 rounded-md bg-chart-1/10 px-2 py-0.5 text-[12px] font-medium text-chart-1">
              <GitBranch className="h-3.5 w-3.5" />
              Chain
            </span>
          )}
        </div>

        {/* Workflow Actions */}
        {note.status === "inbox" && note.triageStatus !== "trashed" && (
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-secondary/10">
            <button
              onClick={() => { triageKeep(note.id); toast("Done — moved to Capture"); advanceToNextInbox() }}
              className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-[12px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
            >
              <Check className="h-3.5 w-3.5" />
              Done
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[12px] font-medium text-foreground transition-colors hover:bg-secondary">
                  <AlarmClock className="h-3.5 w-3.5" />
                  Snooze
                  <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem onClick={() => { triageSnooze(note.id, getSnoozeTime("3h")); toast("Snoozed"); advanceToNextInbox() }} className="text-[14px]">
                  3 hours
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { triageSnooze(note.id, getSnoozeTime("tomorrow")); toast("Snoozed"); advanceToNextInbox() }} className="text-[14px]">
                  Tomorrow 10:00 AM
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { triageSnooze(note.id, getSnoozeTime("next-week")); toast("Snoozed"); advanceToNextInbox() }} className="text-[14px]">
                  Next week 10:00 AM
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={() => { triageTrash(note.id); toast("Trashed"); advanceToNextInbox() }}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[12px] font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Trash
            </button>
          </div>
        )}

        {note.status === "capture" && (
          <div className="border-b border-border">
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-secondary/10">
              <button
                onClick={() => { promoteToPermanent(note.id); toast("Promoted to Permanent") }}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium transition-colors ${
                  isReadyToPromote(note, backlinks)
                    ? "bg-[#45d483] text-[#0a0a0a] hover:bg-[#45d483]/80"
                    : "border border-border bg-card text-foreground hover:bg-secondary"
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Promote
              </button>
              <button
                onClick={() => { moveBackToInbox(note.id); toast("Moved back to Inbox") }}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Inbox className="h-3.5 w-3.5" />
                Back to Inbox
              </button>
            </div>
            {staleSuggest && (
              <div className="flex items-center gap-2 bg-destructive/5 px-4 py-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                <span className="text-[12px] text-destructive">14+ days untouched.</span>
                <button
                  onClick={() => { moveBackToInbox(note.id); toast("Moved back to Inbox") }}
                  className="ml-auto text-[11px] font-medium text-destructive underline underline-offset-2 hover:no-underline"
                >
                  Move to Inbox?
                </button>
              </div>
            )}
            {!staleSuggest && stale && (
              <div className="flex items-center gap-2 bg-chart-3/5 px-4 py-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-chart-3" />
                <span className="text-[12px] text-chart-3">Review needed - 7+ days untouched.</span>
              </div>
            )}
          </div>
        )}

        {note.status === "permanent" && (
          <div className="border-b border-border">
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-secondary/10">
              <button
                onClick={() => { undoPromote(note.id); toast("Demoted to Capture") }}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <ArrowDownLeft className="h-3.5 w-3.5" />
                Demote to Capture
              </button>
            </div>
            {linkCount === 0 && (
              <div className="flex items-center gap-2 bg-chart-3/5 px-4 py-2">
                <Link2 className="h-3.5 w-3.5 shrink-0 text-chart-3" />
                <span className="text-[12px] text-chart-3">Unlinked - add connections to strengthen graph.</span>
              </div>
            )}
          </div>
        )}

        {/* Dates */}
        <InspectorSection title="Dates" icon={<Calendar className="h-4 w-4" />}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-muted-foreground">Created</span>
              <span className="text-[14px] text-foreground">
                {format(new Date(note.createdAt), "MMM d, yyyy")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-muted-foreground">Updated</span>
              <span className="text-[14px] text-foreground">
                {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </InspectorSection>

        <div className="mx-4 border-b border-border" />

        {/* Status */}
        <InspectorSection title="Status" icon={<CircleDot className="h-4 w-4" />}>
          <StatusDropdown
            value={note.status}
            onChange={(s) => updateNote(note.id, { status: s })}
            variant="button"
          />
        </InspectorSection>

        <div className="mx-4 border-b border-border" />

        {/* Priority */}
        <InspectorSection title="Priority" icon={<Signal className="h-4 w-4" />}>
          <PriorityDropdown
            value={note.priority}
            onChange={(p) => updateNote(note.id, { priority: p })}
            variant="button"
          />
        </InspectorSection>

        <div className="mx-4 border-b border-border" />

        {/* Folder */}
        <InspectorSection title="Folder" icon={<FolderOpen className="h-4 w-4" />}>
          <Popover open={folderOpen} onOpenChange={setFolderOpen}>
            <PopoverTrigger asChild>
              <button className="flex w-full items-center justify-between rounded-md border border-border bg-secondary/30 px-2.5 py-1.5 text-[14px] text-foreground transition-colors hover:bg-secondary/60">
                <span className="flex items-center gap-2">
                  {currentFolder && (
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: currentFolder.color }}
                    />
                  )}
                  {currentFolder?.name ?? "No folder"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-52 p-1">
              <button
                onClick={() => {
                  updateNote(note.id, { folderId: null })
                  setFolderOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[14px] transition-colors hover:bg-secondary",
                  !note.folderId ? "text-foreground" : "text-muted-foreground"
                )}
              >
                No folder
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => {
                    updateNote(note.id, { folderId: folder.id })
                    setFolderOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[14px] transition-colors hover:bg-secondary",
                    note.folderId === folder.id ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: folder.color }}
                  />
                  {folder.name}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </InspectorSection>

        <div className="mx-4 border-b border-border" />

        {/* Label */}
        <InspectorSection title="Label" icon={<Tag className="h-4 w-4" />}>
          <LabelDropdown
            value={note.labelId}
            labels={labels}
            onChange={(labelId) => setNoteLabel(note.id, labelId)}
            variant="button"
          />
        </InspectorSection>

        <div className="mx-4 border-b border-border" />

        {/* Tags */}
        <InspectorSection title="Tags" icon={<Hash className="h-4 w-4" />}>
          <div className="flex flex-wrap items-center gap-1.5">
            {noteTags.map((tag) => (
              <span
                key={tag.id}
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium"
                style={{
                  backgroundColor: `${tag.color}18`,
                  color: tag.color,
                }}
              >
                {tag.name}
                <button
                  onClick={() => removeTagFromNote(note.id, tag.id)}
                  className="rounded-full p-0.5 transition-colors hover:bg-foreground/10"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            {availableTags.length > 0 && (
              <Popover open={tagOpen} onOpenChange={setTagOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-[12px] text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground">
                    <Plus className="h-2.5 w-2.5" />
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
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[14px] text-muted-foreground transition-colors hover:bg-secondary"
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
              <span className="text-[14px] text-muted-foreground">No tags available</span>
            )}
          </div>
        </InspectorSection>

        <div className="mx-4 border-b border-border" />

        {/* Outline (headings) */}
        <InspectorSection title="Outline" icon={<AlignLeft className="h-4 w-4" />}>
          {headings.length > 0 ? (
            <div className="space-y-1">
              {headings.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 text-[14px] text-muted-foreground transition-colors hover:text-foreground cursor-default"
                  style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
                >
                  <span className="shrink-0 text-[11px] font-mono text-muted-foreground/50">
                    {"H" + h.level}
                  </span>
                  <span className="truncate">{h.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-[14px] text-muted-foreground">No headings found</span>
          )}
        </InspectorSection>

        <div className="mx-4 border-b border-border" />

        {/* Properties */}
        <InspectorSection title="Properties" icon={<FileText className="h-4 w-4" />}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-muted-foreground">Words</span>
              <span className="text-[14px] tabular-nums text-foreground">{wordCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-muted-foreground">Characters</span>
              <span className="text-[14px] tabular-nums text-foreground">{charCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-muted-foreground">Headings</span>
              <span className="text-[14px] tabular-nums text-foreground">{headings.length}</span>
            </div>
          </div>
        </InspectorSection>

        <div className="mx-4 border-b border-border" />

        {/* Linked References */}
        <InspectorSection title="References" icon={<Link2 className="h-4 w-4" />}>
          {backlinkNotes.length === 0 ? (
            <span className="text-[14px] text-muted-foreground">No linked references</span>
          ) : (
            <div className="space-y-0.5">
              {backlinkNotes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNoteId(n.id)}
                  className="flex items-center gap-2 w-full text-left px-1 py-0.5 rounded text-[14px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  <span className="truncate">{n.title || "Untitled"}</span>
                </button>
              ))}
            </div>
          )}
        </InspectorSection>

        <div className="mx-4 border-b border-border" />

        {/* Actions */}
        <InspectorSection title="Actions" icon={<Merge className="h-4 w-4" />}>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setMergePickerOpen(true, note.id)}
              className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Merge className="h-3.5 w-3.5" />
              Merge with...
            </button>
            <button
              onClick={() => setLinkPickerOpen(true, note.id)}
              className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Link2 className="h-3.5 w-3.5" />
              Link to...
            </button>
          </div>
        </InspectorSection>

        <div className="mx-4 border-b border-border" />

        {/* Attachments (placeholder) */}
        <InspectorSection title="Attachments" icon={<Paperclip className="h-4 w-4" />}>
          <span className="text-[14px] text-muted-foreground">No attachments</span>
        </InspectorSection>
      </div>
    </aside>
  )
}
