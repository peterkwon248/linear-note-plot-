"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank"
import { Clock as PhClock } from "@phosphor-icons/react/dist/ssr/Clock"
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
import { GitBranch } from "@phosphor-icons/react/dist/ssr/GitBranch"
import { GitMerge } from "@phosphor-icons/react/dist/ssr/GitMerge"
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise"
import { Chat } from "@phosphor-icons/react/dist/ssr/Chat"
import { WifiHigh } from "@phosphor-icons/react/dist/ssr/WifiHigh"
import { CircleDashed } from "@phosphor-icons/react/dist/ssr/CircleDashed"
import { Graph } from "@phosphor-icons/react/dist/ssr/Graph"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"
import { usePlotStore } from "@/lib/store"
import { useState, useMemo, useCallback } from "react"
import { StatusDropdown, PriorityDropdown, LabelDropdown } from "@/components/note-fields"
import { computeReadyScore, isReadyToPromote, needsReview, isStaleSuggest, getSnoozeTime, getInboxNotes } from "@/lib/queries/notes"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { useBacklinksFor } from "@/lib/search/use-backlinks-for"
import { suggestBacklinks } from "@/lib/backlinks"
import { toast } from "sonner"
import { ActivityTimeline } from "@/components/activity/activity-timeline"
import { ThreadPanel } from "@/components/editor/thread-panel"
import { ReflectionPanel } from "@/components/editor/reflection-panel"
import { RelationPicker } from "@/components/inspector/relation-picker"
import type { Relation, RelationType, RelationSuggestion } from "@/lib/types"
import { RELATION_TYPE_CONFIG, RELATION_TYPES, getRelationLabel } from "@/lib/relation-helpers"
import { detectUnlinkedMentions } from "@/lib/unlinked-mentions"

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
        <span className="text-xs font-medium text-muted-foreground">
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

function RelationRow({
  relation,
  noteTitle,
  isSource,
  onNavigate,
  onRemove,
  onChangeType,
}: {
  relation: Relation
  noteTitle: string
  isSource: boolean
  onNavigate: () => void
  onRemove: () => void
  onChangeType: (type: RelationType) => void
}) {
  const label = getRelationLabel(relation.type, isSource)
  const config = RELATION_TYPE_CONFIG[relation.type]

  return (
    <div className="flex items-center gap-2 w-full px-1 py-0.5 rounded group hover:bg-secondary/50 transition-colors">
      {isSource ? (
        <ArrowUpRight className="shrink-0 text-muted-foreground/60" size={14} weight="regular" />
      ) : (
        <ArrowDownLeft className="shrink-0 text-muted-foreground/60" size={14} weight="regular" />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="text-2xs px-1.5 py-0.5 rounded-sm font-medium shrink-0"
            style={{ color: config.color, backgroundColor: `${config.color}15` }}
          >
            {label}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[160px]">
          {RELATION_TYPES.map((t) => (
            <DropdownMenuItem
              key={t}
              onClick={() => onChangeType(t)}
              className="text-note"
            >
              <span
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: RELATION_TYPE_CONFIG[t].color }}
              />
              {getRelationLabel(t, isSource)}
              {t === relation.type && <PhCheck className="ml-auto" size={14} weight="bold" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        onClick={onNavigate}
        className="text-note text-muted-foreground hover:text-foreground truncate flex-1 text-left"
      >
        {noteTitle || "Untitled"}
      </button>

      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 transition-opacity"
      >
        <PhX className="text-muted-foreground hover:text-destructive" size={12} weight="regular" />
      </button>
    </div>
  )
}

function SuggestionRow({
  suggestion,
  noteTitle,
  onAccept,
  onDismiss,
}: {
  suggestion: RelationSuggestion
  noteTitle: string
  onAccept: (type: RelationType) => void
  onDismiss: () => void
}) {
  const [selectedType, setSelectedType] = useState<RelationType>(suggestion.suggestedType)
  const config = RELATION_TYPE_CONFIG[selectedType]

  return (
    <div className="flex items-center gap-2 px-1 py-0.5 rounded group hover:bg-secondary/50 transition-colors">
      <Sparkle className="shrink-0 text-amber-500/60" size={14} weight="regular" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="text-2xs px-1.5 py-0.5 rounded-sm font-medium shrink-0"
            style={{ color: config.color, backgroundColor: `${config.color}15` }}
          >
            {RELATION_TYPE_CONFIG[selectedType].label}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[160px]">
          {RELATION_TYPES.map((t) => (
            <DropdownMenuItem
              key={t}
              onClick={() => setSelectedType(t)}
              className="text-note"
            >
              <span
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: RELATION_TYPE_CONFIG[t].color }}
              />
              {RELATION_TYPE_CONFIG[t].label}
              {t === selectedType && <PhCheck className="ml-auto" size={14} weight="bold" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <span className="truncate flex-1 text-note text-muted-foreground">
        {noteTitle || "Untitled"}
      </span>
      <span className="text-2xs text-muted-foreground/40 shrink-0">
        {suggestion.reason}
      </span>
      <button
        onClick={() => onAccept(selectedType)}
        className="shrink-0 text-2xs text-green-500 opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
      >
        Accept
      </button>
      <button
        onClick={() => onDismiss()}
        className="shrink-0 text-2xs text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
      >
        Skip
      </button>
    </div>
  )
}

export function SidePanelContext() {
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
  const openSidePeek = usePlotStore((s) => s.openSidePeek)
  const triageKeep = usePlotStore((s) => s.triageKeep)
  const triageSnooze = usePlotStore((s) => s.triageSnooze)
  const triageTrash = usePlotStore((s) => s.triageTrash)
  const promoteToPermanent = usePlotStore((s) => s.promoteToPermanent)
  const undoPromote = usePlotStore((s) => s.undoPromote)
  const moveBackToInbox = usePlotStore((s) => s.moveBackToInbox)
  const setMergePickerOpen = usePlotStore((s) => s.setMergePickerOpen)
  const setLinkPickerOpen = usePlotStore((s) => s.setLinkPickerOpen)
  const relations = usePlotStore((s) => s.relations)
  const addRelation = usePlotStore((s) => s.addRelation)
  const removeRelation = usePlotStore((s) => s.removeRelation)
  const updateRelationType = usePlotStore((s) => s.updateRelationType)
  const addWikiLink = usePlotStore((s) => s.addWikiLink)
  const relationSuggestions = usePlotStore((s) => s.relationSuggestions)
  const acceptRelationSuggestion = usePlotStore((s) => s.acceptRelationSuggestion)
  const dismissRelationSuggestion = usePlotStore((s) => s.dismissRelationSuggestion)
  const nestedReplies = usePlotStore((s) => s.viewStateByContext["all"]?.toggles?.nestedReplies === true)

  const backlinks = useBacklinksIndex()
  const backlinkNotes = useBacklinksFor(selectedNoteId)

  const [folderOpen, setFolderOpen] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)
  const [relationPickerOpen, setRelationPickerOpen] = useState(false)

  const note = notes.find((n) => n.id === selectedNoteId) ?? null

  const headings = useMemo(
    () => (note ? extractHeadings(note.content) : []),
    [note?.content] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const noteRelations = useMemo(() => {
    if (!selectedNoteId) return { outgoing: [], incoming: [] }
    return {
      outgoing: (relations ?? []).filter((r: Relation) => r.sourceNoteId === selectedNoteId),
      incoming: (relations ?? []).filter((r: Relation) => r.targetNoteId === selectedNoteId),
    }
  }, [relations, selectedNoteId])

  const related = useMemo(() => {
    if (!selectedNoteId) return []
    const backlinkIds = new Set(backlinkNotes.map((n) => n.id))
    return suggestBacklinks(selectedNoteId, notes, { limit: 5 }).filter(
      (r) => !backlinkIds.has(r.noteId)
    )
  }, [selectedNoteId, notes, backlinkNotes])

  const unlinkedMentions = useMemo(() => {
    if (!selectedNoteId) return []
    return detectUnlinkedMentions(selectedNoteId, notes)
  }, [selectedNoteId, notes])

  const pendingSuggestions = useMemo(() => {
    if (!selectedNoteId) return []
    return (relationSuggestions ?? []).filter(
      (s) => s.status === "pending" &&
      (s.sourceNoteId === selectedNoteId || s.targetNoteId === selectedNoteId)
    )
  }, [relationSuggestions, selectedNoteId])

  const advanceToNextInbox = useCallback(() => {
    if (!note || note.status !== "inbox") return
    const inbox = getInboxNotes(notes, backlinks)
    const next = inbox.find((n) => n.id !== note.id)
    setSelectedNoteId(next?.id ?? null)
  }, [note, notes, backlinks, setSelectedNoteId])

  if (!note) return null

  const stale = needsReview(note)
  const staleSuggest = isStaleSuggest(note)
  const linkCount = backlinks.get(note.id) ?? 0

  const currentFolder = folders.find((f) => f.id === note.folderId)
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
          <span className="flex items-center gap-1 rounded-md bg-chart-3/10 px-2 py-0.5 text-xs font-medium text-chart-3">
            <PushPin size={14} weight="regular" />
            Pinned
          </span>
        )}
        {/* Stage badge */}
        <span className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
          note.status === "inbox"
            ? "bg-accent/10 text-accent"
            : note.status === "capture"
            ? "bg-chart-2/10 text-chart-2"
            : note.status === "permanent"
            ? "bg-chart-5/10 text-chart-5"
            : "bg-accent/10 text-accent"
        }`}>
          {note.status === "permanent" && <PhShield size={14} weight="regular" />}
          {note.status ? note.status.charAt(0).toUpperCase() + note.status.slice(1) : "Tray"}
        </span>
        {note.status === "capture" && isReadyToPromote(note, backlinks) && (
          <span className="flex items-center gap-1 rounded-md bg-chart-5/10 px-2 py-0.5 text-xs font-medium text-chart-5">
            <Sparkle size={14} weight="regular" />
            Ready to promote
          </span>
        )}
        {note.parentNoteId && (
          <span className="flex items-center gap-1 rounded-md bg-chart-1/10 px-2 py-0.5 text-xs font-medium text-chart-1">
            <GitBranch size={14} weight="regular" />
            Chain
          </span>
        )}
      </div>

      {/* Workflow Actions */}
      {note.status === "inbox" && note.triageStatus !== "trashed" && (
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-secondary/10">
          <button
            onClick={() => { triageKeep(note.id); toast("Done — moved to Capture"); advanceToNextInbox() }}
            className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/80"
          >
            <PhCheck size={14} weight="bold" />
            Done
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-secondary">
                <Alarm size={14} weight="regular" />
                Snooze
                <CaretDown className="text-muted-foreground" size={10} weight="regular" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem onClick={() => { triageSnooze(note.id, getSnoozeTime("3h")); toast("Snoozed"); advanceToNextInbox() }} className="text-sm">
                3 hours
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { triageSnooze(note.id, getSnoozeTime("tomorrow")); toast("Snoozed"); advanceToNextInbox() }} className="text-sm">
                Tomorrow 10:00 AM
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { triageSnooze(note.id, getSnoozeTime("next-week")); toast("Snoozed"); advanceToNextInbox() }} className="text-sm">
                Next week 10:00 AM
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => { triageTrash(note.id); toast("Trashed"); advanceToNextInbox() }}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
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
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                isReadyToPromote(note, backlinks)
                  ? "bg-chart-5 text-primary-foreground hover:bg-chart-5/80"
                  : "border border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              <ArrowUpRight size={14} weight="regular" />
              Promote
            </button>
            <button
              onClick={() => { moveBackToInbox(note.id); toast("Moved back to Tray") }}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Tray size={14} weight="regular" />
              Back to Tray
            </button>
          </div>
          {staleSuggest && (
            <div className="flex items-center gap-2 bg-destructive/5 px-4 py-2">
              <Warning className="shrink-0 text-destructive" size={14} weight="regular" />
              <span className="text-xs text-destructive">14+ days untouched.</span>
              <button
                onClick={() => { moveBackToInbox(note.id); toast("Moved back to Tray") }}
                className="ml-auto text-2xs font-medium text-destructive underline underline-offset-2 hover:no-underline"
              >
                Move to Tray?
              </button>
            </div>
          )}
          {!staleSuggest && stale && (
            <div className="flex items-center gap-2 bg-chart-3/5 px-4 py-2">
              <Warning className="shrink-0 text-chart-3" size={14} weight="regular" />
              <span className="text-xs text-chart-3">Review needed - 7+ days untouched.</span>
            </div>
          )}
        </div>
      )}

      {note.status === "permanent" && (
        <div className="border-b border-border">
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-secondary/10">
            <button
              onClick={() => { undoPromote(note.id); toast("Demoted to Capture") }}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ArrowDownLeft size={14} weight="regular" />
              Demote to Capture
            </button>
          </div>
          {linkCount === 0 && (
            <div className="flex items-center gap-2 bg-chart-3/5 px-4 py-2">
              <PhLink className="shrink-0 text-chart-3" size={14} weight="regular" />
              <span className="text-xs text-chart-3">Unlinked - add connections to strengthen graph.</span>
            </div>
          )}
        </div>
      )}

      {/* Dates */}
      <InspectorSection title="Dates" icon={<CalendarBlank size={16} weight="regular" />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Created</span>
            <span className="text-sm text-foreground">
              {format(new Date(note.createdAt), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Updated</span>
            <span className="text-sm text-foreground">
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

      {/* Priority */}
      <InspectorSection title="Priority" icon={<WifiHigh size={16} weight="regular" />}>
        <PriorityDropdown
          value={note.priority}
          onChange={(p) => updateNote(note.id, { priority: p })}
          variant="button"
        />
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Folder */}
      <InspectorSection title="Folder" icon={<FolderOpen size={16} weight="regular" />}>
        <Popover open={folderOpen} onOpenChange={setFolderOpen}>
          <PopoverTrigger asChild>
            <button className="flex w-full items-center justify-between rounded-md border border-border bg-secondary/30 px-2.5 py-1.5 text-sm text-foreground transition-colors hover:bg-secondary/60">
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
            <button
              onClick={() => {
                updateNote(note.id, { folderId: null })
                setFolderOpen(false)
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-secondary",
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
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-secondary",
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
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
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
                <PhX size={10} weight="regular" />
              </button>
            </span>
          ))}
          {availableTags.length > 0 && (
            <Popover open={tagOpen} onOpenChange={setTagOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground">
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
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary"
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
            <span className="text-sm text-muted-foreground">No tags available</span>
          )}
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Outline (headings) */}
      <InspectorSection title="Outline" icon={<TextAlignLeft size={16} weight="regular" />}>
        {headings.length > 0 ? (
          <div className="space-y-1">
            {headings.map((h, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground cursor-default"
                style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
              >
                <span className="shrink-0 text-2xs font-mono text-muted-foreground/50">
                  {"H" + h.level}
                </span>
                <span className="truncate">{h.text}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No headings found</span>
        )}
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Properties */}
      <InspectorSection title="Properties" icon={<FileText size={16} weight="regular" />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Words</span>
            <span className="text-sm tabular-nums text-foreground">{wordCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Characters</span>
            <span className="text-sm tabular-nums text-foreground">{charCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Headings</span>
            <span className="text-sm tabular-nums text-foreground">{headings.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Source</span>
            <span className="text-sm text-foreground capitalize">{note.source ?? "manual"}</span>
          </div>
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Linked References */}
      <InspectorSection title="References" icon={<PhLink size={16} weight="regular" />}>
        {backlinkNotes.length === 0 && related.length === 0 ? (
          <span className="text-sm text-muted-foreground">No linked references</span>
        ) : (
          <div className="space-y-2">
            {backlinkNotes.length > 0 && (
              <div className="space-y-0.5">
                <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/60 px-1">Backlinks</span>
                {backlinkNotes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openSidePeek(n.id)}
                    className="flex items-center gap-2 w-full text-left px-1 py-0.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    <FileText className="shrink-0 text-muted-foreground/60" size={14} weight="regular" />
                    <span className="truncate">{n.title || "Untitled"}</span>
                  </button>
                ))}
              </div>
            )}
            {related.length > 0 && (
              <div className="space-y-0.5">
                <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/60 px-1">Related</span>
                {related.map((r) => {
                  const rNote = notes.find((n) => n.id === r.noteId)
                  if (!rNote) return null
                  return (
                    <button
                      key={r.noteId}
                      onClick={() => openSidePeek(r.noteId)}
                      className="flex items-center gap-2 w-full text-left px-1 py-0.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors group"
                    >
                      <Sparkle className="shrink-0 text-muted-foreground/40" size={14} weight="regular" />
                      <span className="truncate flex-1">{rNote.title || "Untitled"}</span>
                      <span className="text-2xs text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground/60">
                        {r.reasons[r.reasons.length - 1]}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </InspectorSection>

      {/* Unlinked Mentions */}
      {unlinkedMentions.length > 0 && (
        <>
          <div className="mx-4 border-b border-border" />
          <InspectorSection title="Unlinked Mentions" icon={<Warning size={16} weight="regular" />}>
            <div className="space-y-0.5">
              {unlinkedMentions.map((m) => {
                const mNote = notes.find((n) => n.id === m.noteId)
                if (!mNote) return null
                return (
                  <div
                    key={m.noteId + m.title}
                    className="flex items-center gap-2 group px-1 py-0.5 rounded hover:bg-secondary/50 transition-colors"
                  >
                    <FileText className="shrink-0 text-muted-foreground/60" size={14} weight="regular" />
                    <span className="truncate flex-1 text-sm text-muted-foreground">
                      {m.title}
                    </span>
                    <span className="text-2xs text-muted-foreground/40">
                      {m.count}×
                    </span>
                    <button
                      onClick={() => addWikiLink(note!.id, m.title)}
                      className="shrink-0 text-2xs text-accent opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                    >
                      Link
                    </button>
                  </div>
                )
              })}
            </div>
          </InspectorSection>
        </>
      )}

      <div className="mx-4 border-b border-border" />

      {/* Relations */}
      <InspectorSection title="Relations" icon={<Graph size={16} weight="regular" />}>
        {noteRelations.outgoing.length === 0 && noteRelations.incoming.length === 0 && !relationPickerOpen ? (
          <div className="space-y-2">
            <span className="text-note text-muted-foreground">No relations</span>
            <button
              onClick={() => setRelationPickerOpen(true)}
              className="flex items-center gap-1.5 text-note text-muted-foreground hover:text-foreground transition-colors"
            >
              <PhPlus size={14} weight="regular" />
              Add relation
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {noteRelations.outgoing.length > 0 && (
              <div className="space-y-0.5">
                <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/60 px-1">
                  Outgoing
                </span>
                {noteRelations.outgoing.map((rel: Relation) => {
                  const target = notes.find(n => n.id === rel.targetNoteId)
                  if (!target) return null
                  return (
                    <RelationRow
                      key={rel.id}
                      relation={rel}
                      noteTitle={target.title}
                      isSource={true}
                      onNavigate={() => openSidePeek(rel.targetNoteId)}
                      onRemove={() => removeRelation(rel.id)}
                      onChangeType={(newType) => updateRelationType(rel.id, newType)}
                    />
                  )
                })}
              </div>
            )}

            {noteRelations.incoming.length > 0 && (
              <div className="space-y-0.5">
                <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/60 px-1">
                  Incoming
                </span>
                {noteRelations.incoming.map((rel: Relation) => {
                  const source = notes.find(n => n.id === rel.sourceNoteId)
                  if (!source) return null
                  return (
                    <RelationRow
                      key={rel.id}
                      relation={rel}
                      noteTitle={source.title}
                      isSource={false}
                      onNavigate={() => openSidePeek(rel.sourceNoteId)}
                      onRemove={() => removeRelation(rel.id)}
                      onChangeType={(newType) => updateRelationType(rel.id, newType)}
                    />
                  )
                })}
              </div>
            )}

            {/* Relation Suggestions */}
            {pendingSuggestions.length > 0 && (
              <div className="space-y-0.5 mt-2">
                <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/60 px-1">
                  Suggestions
                </span>
                {pendingSuggestions.map((s) => {
                  const otherId = s.sourceNoteId === selectedNoteId ? s.targetNoteId : s.sourceNoteId
                  const otherNote = notes.find((n) => n.id === otherId)
                  if (!otherNote) return null
                  return (
                    <SuggestionRow
                      key={s.id}
                      suggestion={s}
                      noteTitle={otherNote.title}
                      onAccept={(type) => acceptRelationSuggestion(s.id, type)}
                      onDismiss={() => dismissRelationSuggestion(s.id)}
                    />
                  )
                })}
              </div>
            )}

            {!relationPickerOpen && (
              <button
                onClick={() => setRelationPickerOpen(true)}
                className="flex items-center gap-1.5 text-note text-muted-foreground hover:text-foreground transition-colors mt-1"
              >
                <PhPlus size={14} weight="regular" />
                Add relation
              </button>
            )}
          </div>
        )}

        {relationPickerOpen && (
          <RelationPicker
            sourceNoteId={note.id}
            onAdd={(targetId, type) => {
              addRelation(note.id, targetId, type)
              setRelationPickerOpen(false)
            }}
            onClose={() => setRelationPickerOpen(false)}
          />
        )}
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Thread */}
      <ThreadPanel noteId={note.id} nestedReplies={nestedReplies} />

      <div className="mx-4 border-b border-border" />

      {/* Reflections */}
      <ReflectionPanel noteId={note.id} />

      <div className="mx-4 border-b border-border" />

      {/* Actions */}
      <InspectorSection title="Actions" icon={<GitMerge size={16} weight="regular" />}>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => setMergePickerOpen(true, note.id)}
            className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-note font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <GitMerge size={14} weight="regular" />
            GitMerge with...
          </button>
          <button
            onClick={() => setLinkPickerOpen(true, note.id)}
            className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-note font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <PhLink size={14} weight="regular" />
            Link to...
          </button>
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Attachments (placeholder) */}
      <InspectorSection title="Attachments" icon={<Paperclip size={16} weight="regular" />}>
        <span className="text-sm text-muted-foreground">No attachments</span>
      </InspectorSection>

    </div>
  )
}
