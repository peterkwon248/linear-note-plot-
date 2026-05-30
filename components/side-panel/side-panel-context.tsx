"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Calendar as CalendarBlank,
  FolderOpen,
  X as PhX,
  Plus as PhPlus,
  ChevronDown as CaretDown,
  FileText,
  Pin as PushPin,
  AlignLeft as TextAlignLeft,
  Paperclip,
  Link as PhLink,
  Shield as PhShield,
  Sparkles as Sparkle,
  Check as PhCheck,
  AlarmClock as Alarm,
  Trash2 as Trash,
  ArrowUpRight,
  ArrowDownLeft,
  Inbox as Tray,
  AlertTriangle as Warning,
  GitMerge,
  CircleDashed,
  Info as PhInfo,
} from "lucide-react"
import { ENTITY_ICONS } from "@/lib/entity-icons"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"
import { usePlotStore } from "@/lib/store"
import { useState, useMemo, useCallback } from "react"
import { StatusDropdown, LabelDropdown } from "@/components/note-fields"
import { isReadyToPromote, needsReview, isStaleSuggest, getSnoozeTime, getInboxNotes, buildDueSnoozeSet } from "@/lib/queries/notes"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { toast } from "sonner"
import { FolderPicker } from "@/components/folder-picker"
import { CategoryPicker } from "@/components/category-picker"
import { getEntityColor } from "@/lib/colors" // v109: opt-in color fallback

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
import { InBooksSection } from "@/components/books/in-books-section"
import { useT } from "@/lib/i18n"
import { useDateFormat } from "@/lib/i18n-date"

export function SidePanelContext({ noteId: propNoteId }: { noteId?: string | null }) {
  const t = useT()
  const df = useDateFormat()
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const previewNoteId = usePlotStore((s) => s.previewNoteId)
  const noteId = propNoteId ?? selectedNoteId ?? previewNoteId
  const notes = usePlotStore((s) => s.notes)
  const folders = usePlotStore((s) => s.folders)
  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)
  const setNoteLabel = usePlotStore((s) => s.setNoteLabel)
  const updateNote = usePlotStore((s) => s.updateNote)
  const createWikiCategory = usePlotStore((s) => s.createWikiCategory)
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
  // PR (c) — N:M membership actions for the multi-folder chip strip.
  // removeNoteFromFolder is the per-chip "x" handler; setNoteFolders is
  // the multi-picker Apply handler (full set replacement, kind-validated
  // at the action layer).
  const removeNoteFromFolder = usePlotStore((s) => s.removeNoteFromFolder)
  const setNoteFolders = usePlotStore((s) => s.setNoteFolders)

  const backlinks = useBacklinksIndex()

  const [folderOpen, setFolderOpen] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)

  const note = notes.find((n) => n.id === noteId) ?? null

  const outline: OutlineResult = useMemo(
    () => (note?.contentJson ? extractOutlineFromContentJson(note.contentJson) : { source: "empty", items: [] }),
    [note?.contentJson] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Phase 1b2: snoozed-due notes are resolved from the unified hooks slice.
  const hooks = usePlotStore((s) => s.hooks)
  const advanceToNextInbox = useCallback(() => {
    if (!note || note.status !== "backlog") return
    const inbox = getInboxNotes(notes, backlinks, buildDueSnoozeSet(hooks))
    const next = inbox.find((n) => n.id !== note.id)
    setSelectedNoteId(next?.id ?? null)
  }, [note, notes, backlinks, hooks, setSelectedNoteId])

  const wikiCategories = usePlotStore((s) => s.wikiCategories)

  if (!note) return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground px-4">
      <PhInfo size={24} strokeWidth={1.5} className="text-muted-foreground/70" />
      <p className="text-note text-center">{t("sidepanel.empty.select_note")}</p>
    </div>
  )

  const stale = needsReview(note)
  const staleSuggest = isStaleSuggest(note)
  const linkCount = backlinks.get(note.id) ?? 0

  // PR (c): N:M chip strip — every folder this note belongs to renders as
  // a removable chip. `+ Add to folders…` opens the multi-select picker.
  const noteFolders = folders.filter(
    (f) => f.kind === "note" && note.folderIds.includes(f.id),
  )
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
            <PushPin size={14} strokeWidth={2} />
            {t("sidepanel.workflow.pinned")}
          </span>
        )}
        {/* Stage badge */}
        <span className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-medium ${
          note.status === "backlog"
            ? "bg-accent/10 text-accent"
            : note.status === "todo"
            ? "bg-chart-1/10 text-chart-1"
            : note.status === "in_progress"
            ? "bg-chart-2/10 text-chart-2"
            : note.status === "done"
            ? "bg-chart-5/10 text-chart-5"
            : "bg-accent/10 text-accent"
        }`}>
          {note.status === "done" && <PhShield size={14} strokeWidth={2} />}
          {note.status === "backlog"
            ? t("status.backlog")
            : note.status === "todo"
            ? t("status.todo")
            : note.status === "in_progress"
            ? t("status.in_progress")
            : note.status === "done"
            ? t("status.done")
            : t("status.backlog")}
        </span>
        {note.status === "in_progress" && isReadyToPromote(note, backlinks) && (
          <span className="flex items-center gap-1 rounded-md bg-chart-5/10 px-2 py-0.5 text-2xs font-medium text-chart-5">
            <Sparkle size={14} strokeWidth={2} />
            {t("sidepanel.workflow.ready_to_promote")}
          </span>
        )}
      </div>

      {/* Workflow Actions */}
      {note.status === "backlog" && note.triageStatus !== "trashed" && (
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-secondary/10">
          <button
            onClick={() => { triageKeep(note.id); toast(t("sidepanel.workflow.done_toast")); advanceToNextInbox() }}
            className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-2xs font-medium text-accent-foreground transition-colors hover:bg-accent/80"
          >
            <PhCheck size={14} strokeWidth={2.5} />
            {t("sidepanel.workflow.done")}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-2xs font-medium text-foreground transition-colors hover:bg-hover-bg">
                <Alarm size={14} strokeWidth={2} />
                {t("sidepanel.workflow.snooze")}
                <CaretDown className="text-muted-foreground" size={10} strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem onClick={() => { triageSnooze(note.id, getSnoozeTime("3h")); toast(t("sidepanel.workflow.snooze_toast")); advanceToNextInbox() }} className="text-note">
                {t("sidepanel.workflow.snooze.3h")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { triageSnooze(note.id, getSnoozeTime("tomorrow")); toast(t("sidepanel.workflow.snooze_toast")); advanceToNextInbox() }} className="text-note">
                {t("sidepanel.workflow.snooze.tomorrow")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { triageSnooze(note.id, getSnoozeTime("next-week")); toast(t("sidepanel.workflow.snooze_toast")); advanceToNextInbox() }} className="text-note">
                {t("sidepanel.workflow.snooze.next_week")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => { triageTrash(note.id); toast(t("sidepanel.workflow.trash_toast")); advanceToNextInbox() }}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-2xs font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash size={14} strokeWidth={2} />
            {t("sidepanel.workflow.trash")}
          </button>
        </div>
      )}

      {note.status === "in_progress" && (
        <div className="border-b border-border">
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-secondary/10">
            <button
              onClick={() => { promoteToPermanent(note.id); toast(t("sidepanel.workflow.promote_toast")) }}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium transition-colors ${
                isReadyToPromote(note, backlinks)
                  ? "bg-chart-5 text-primary-foreground hover:bg-chart-5/80"
                  : "border border-border bg-card text-foreground hover:bg-hover-bg"
              }`}
            >
              <ArrowUpRight size={14} strokeWidth={2} />
              {t("sidepanel.workflow.promote")}
            </button>
            <button
              onClick={() => { moveBackToInbox(note.id); toast(t("sidepanel.workflow.back_to_stone_toast")) }}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-2xs font-medium text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
            >
              <Tray size={14} strokeWidth={2} />
              {t("sidepanel.workflow.back_to_stone")}
            </button>
          </div>
          {staleSuggest && (
            <div className="flex items-center gap-2 bg-destructive/5 px-4 py-2">
              <Warning className="shrink-0 text-destructive" size={14} strokeWidth={2} />
              <span className="text-2xs text-destructive">{t("sidepanel.warning.stale_14d")}</span>
              <button
                onClick={() => { moveBackToInbox(note.id); toast(t("sidepanel.workflow.back_to_stone_toast")) }}
                className="ml-auto text-2xs font-medium text-destructive underline underline-offset-2 hover:no-underline"
              >
                {t("sidepanel.workflow.move_to_stone")}
              </button>
            </div>
          )}
          {!staleSuggest && stale && (
            <div className="flex items-center gap-2 bg-chart-3/5 px-4 py-2">
              <Warning className="shrink-0 text-chart-3" size={14} strokeWidth={2} />
              <span className="text-2xs text-chart-3">{t("sidepanel.warning.review_7d")}</span>
            </div>
          )}
        </div>
      )}

      {note.status === "done" && (
        <div className="border-b border-border">
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-secondary/10">
            <button
              onClick={() => { undoPromote(note.id); toast(t("sidepanel.workflow.demote_toast")) }}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-2xs font-medium text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
            >
              <ArrowDownLeft size={14} strokeWidth={2} />
              {t("sidepanel.workflow.demote")}
            </button>
          </div>
          {linkCount === 0 && (
            <div className="flex items-center gap-2 bg-chart-3/5 px-4 py-2">
              <PhLink className="shrink-0 text-chart-3" size={14} strokeWidth={2} />
              <span className="text-2xs text-chart-3">{t("sidepanel.warning.unlinked")}</span>
            </div>
          )}
        </div>
      )}

      {/* Dates */}
      <InspectorSection title={t("sidepanel.inspector.dates")} icon={<CalendarBlank size={16} strokeWidth={2} />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">{t("sidepanel.inspector.dates.created")}</span>
            <span className="text-note text-foreground">
              {df.longDate(new Date(note.createdAt))}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">{t("sidepanel.inspector.dates.updated")}</span>
            <span className="text-note text-foreground">
              {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true, locale: df.locale })}
            </span>
          </div>
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Status */}
      <InspectorSection title={t("sidepanel.inspector.status")} icon={<CircleDashed size={16} strokeWidth={2} />}>
        <StatusDropdown
          value={note.status}
          onChange={(s) => updateNote(note.id, { status: s })}
          variant="button"
        />
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Folders — PR (c) N:M chip strip
          Each folder this note belongs to renders as a removable chip.
          The "+ Add to folders…" button opens a multi-select picker that
          commits the entire new set on Apply. Single-folder UX is gone —
          this is the surface that exposes the N:M model to users.
          Section title is plural to reinforce the cardinality change. */}
      <InspectorSection title={t("sidepanel.inspector.folders")} icon={<FolderOpen size={16} strokeWidth={2} />}>
        <div className="flex flex-wrap items-center gap-1.5">
          {noteFolders.map((f) => (
            <span
              key={f.id}
              className="group/chip flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-medium"
              style={{
                backgroundColor: `${getEntityColor(f.color)}1a`,
                color: getEntityColor(f.color),
              }}
              title={f.name}
            >
              <FolderOpen size={10} strokeWidth={2} />
              <span className="truncate max-w-[120px]">{f.name}</span>
              <button
                type="button"
                onClick={() => removeNoteFromFolder(note.id, f.id)}
                className="rounded-sm p-0.5 transition-colors hover:bg-hover-bg/40"
                title={`${t("sidepanel.inspector.folders.remove_prefix")} ${f.name}`}
              >
                <PhX size={10} strokeWidth={2.5} />
              </button>
            </span>
          ))}
          <Popover open={folderOpen} onOpenChange={setFolderOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-0.5 text-2xs text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground">
                <PhPlus size={10} strokeWidth={2} />
                {noteFolders.length === 0 ? t("sidepanel.inspector.folders.add") : t("sidepanel.inspector.folders.add_short")}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-1">
              {/* PR (c): multi-select. Apply commits the new set wholesale
                  through setNoteFolders; the action layer kind-filters
                  defensively (we already pass kind="note"). */}
              <FolderPicker
                kind="note"
                currentFolderIds={note.folderIds}
                selectMode="multi"
                onApply={(ids) => {
                  setNoteFolders(note.id, ids)
                  setFolderOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Label */}
      <InspectorSection title={t("sidepanel.inspector.label")} icon={<ENTITY_ICONS.labels size={16} strokeWidth={2} />}>
        <LabelDropdown
          value={note.labelId}
          labels={labels.filter((l) => !l.trashed)}
          onChange={(labelId) => setNoteLabel(note.id, labelId)}
          variant="button"
        />
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Tags */}
      <InspectorSection title={t("sidepanel.inspector.tags")} icon={<ENTITY_ICONS.tags size={16} strokeWidth={2} />}>
        <div className="flex flex-wrap items-center gap-1.5">
          {noteTags.map((tag) => (
            <span
              key={tag.id}
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium"
              style={{
                backgroundColor: `${getEntityColor(tag.color)}18`,
                color: getEntityColor(tag.color),
              }}
            >
              {tag.name}
              <button
                onClick={() => removeTagFromNote(note.id, tag.id)}
                className="rounded-full p-0.5 transition-colors hover:bg-hover-bg"
              >
                <PhX size={10} strokeWidth={2} />
              </button>
            </span>
          ))}
          {availableTags.length > 0 && (
            <Popover open={tagOpen} onOpenChange={setTagOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-2xs text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground">
                  <PhPlus size={10} strokeWidth={2} />
                  {t("sidepanel.inspector.tags.add")}
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
                      style={{ backgroundColor: getEntityColor(tag.color) }}
                    />
                    {tag.name}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}
          {noteTags.length === 0 && availableTags.length === 0 && (
            <span className="text-note text-muted-foreground">{t("sidepanel.inspector.tags.empty")}</span>
          )}
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Categories — 2026-05-17 cross-entity 확장. WikiCategory 풀 공유.
          inline Create 자동 포함. labelId null + categoryIds 빈 array도 자유. */}
      <InspectorSection title={t("sidepanel.inspector.categories")} icon={<ENTITY_ICONS.categories size={16} strokeWidth={2} />}>
        <CategoryPicker
          entityId={note.id}
          selectedCategoryIds={note.categoryIds ?? []}
          allCategories={wikiCategories}
          onAddCategory={(_id, catId) => {
            const current = note.categoryIds ?? []
            if (current.includes(catId)) return
            updateNote(note.id, { categoryIds: [...current, catId] })
          }}
          onRemoveCategory={(_id, catId) => {
            const current = note.categoryIds ?? []
            updateNote(note.id, { categoryIds: current.filter((x) => x !== catId) })
          }}
          onCreateCategory={(name) => {
            const newId = createWikiCategory(name)
            if (newId) {
              const current = note.categoryIds ?? []
              if (!current.includes(newId)) {
                updateNote(note.id, { categoryIds: [...current, newId] })
              }
            }
            return newId
          }}
        />
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* In Books — shows every non-trashed book containing this note (hidden when 0) */}
      <InBooksSection kind="note" refId={note.id} />

      <div className="mx-4 border-b border-border" />

      {/* Outline (TOC block > headings fallback) */}
      <InspectorSection title={t("sidepanel.inspector.outline")} icon={<TextAlignLeft size={16} strokeWidth={2} />}>
        {outline.items.length > 0 ? (
          <div className="space-y-0.5">
            {outline.source === "toc" && (
              <div className="mb-1.5 text-2xs uppercase tracking-wider text-muted-foreground/70">
                {t("sidepanel.inspector.outline.from_toc")}
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
          <span className="text-note text-muted-foreground">{t("sidepanel.inspector.outline.empty")}</span>
        )}
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Properties */}
      <InspectorSection title={t("sidepanel.inspector.properties")} icon={<FileText size={16} strokeWidth={2} />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">{t("sidepanel.inspector.properties.words")}</span>
            <span className="text-note tabular-nums text-foreground">{wordCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">{t("sidepanel.inspector.properties.characters")}</span>
            <span className="text-note tabular-nums text-foreground">{charCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">{t("sidepanel.inspector.properties.headings")}</span>
            <span className="text-note tabular-nums text-foreground">{outline.items.filter(i => i.source === "heading").length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">{t("sidepanel.inspector.properties.source")}</span>
            <span className="text-note text-foreground capitalize">{note.source ?? "manual"}</span>
          </div>
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Actions */}
      <InspectorSection title={t("sidepanel.inspector.actions")} icon={<GitMerge size={16} strokeWidth={2} />}>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => setMergePickerOpen(true, note.id)}
            className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-note font-medium text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
          >
            <GitMerge size={14} strokeWidth={2} />
            {t("sidepanel.action.merge")}
          </button>
          <button
            onClick={() => setLinkPickerOpen(true, note.id)}
            className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-note font-medium text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
          >
            <PhLink size={14} strokeWidth={2} />
            {t("sidepanel.action.link")}
          </button>
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Attachments (placeholder) */}
      <InspectorSection title={t("sidepanel.inspector.attachments")} icon={<Paperclip size={16} strokeWidth={2} />}>
        <span className="text-note text-muted-foreground">{t("sidepanel.inspector.attachments.empty")}</span>
      </InspectorSection>

    </div>
  )
}
