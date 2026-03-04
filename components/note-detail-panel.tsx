"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import {
  X,
  FileText,
  Calendar,
  Clock,
  Link2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CircleDot,
  Signal,
  Eye,
  ExternalLink,
  Layers,
  Shield,
  Check,
  AlarmClock,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Inbox,
  ChevronDown,
  GitBranch,
  Plus,
  Pencil,
  Brain,
  Archive as ArchiveIcon,
  MapIcon,
  Network,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { usePlotStore } from "@/lib/store"
import { StatusBadge, PriorityBadge } from "@/components/note-fields"
import { ConnectionsGraph } from "@/components/connections-graph"
import { computeReadyScore, isReadyToPromote, needsReview, isStaleSuggest, getInboxNotes, getSnoozeTime } from "@/lib/queries/notes"
import { countBacklinks, suggestBacklinks } from "@/lib/backlinks"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Note, NoteEvent, NoteEventType, ThinkingChainSession } from "@/lib/types"

/* ── Backlinks helper ──────────────────────────────────── */

function getBacklinkNotes(noteId: string, notes: Note[]): Note[] {
  const note = notes.find((n) => n.id === noteId)
  if (!note || !note.title.trim()) return []

  const title = note.title.toLowerCase()
  return notes.filter((other) => {
    if (other.id === noteId) return false
    const content = other.content.toLowerCase()
    return (
      content.includes(`[[${title}]]`) ||
      (title.length > 3 && content.includes(title))
    )
  })
}

/* ── Timeline event icon/label mapping ────────────────── */

const EVENT_CONFIG: Record<NoteEventType, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  created: { icon: Plus, label: "Created" },
  updated: { icon: Pencil, label: "Updated" },
  opened: { icon: Eye, label: "Opened" },
  promoted: { icon: ArrowUpRight, label: "Promoted" },
  archived: { icon: ArchiveIcon, label: "Archived" },
  unarchived: { icon: ArchiveIcon, label: "Unarchived" },
  triage_keep: { icon: Check, label: "Kept" },
  triage_snooze: { icon: AlarmClock, label: "Snoozed" },
  triage_trash: { icon: Trash2, label: "Trashed" },
  link_added: { icon: Link2, label: "Link added" },
  link_removed: { icon: Link2, label: "Link removed" },
  thinking_chain_started: { icon: Brain, label: "Chain started" },
  thinking_chain_step_added: { icon: Brain, label: "Step added" },
  thinking_chain_ended: { icon: Brain, label: "Chain ended" },
  map_added: { icon: MapIcon, label: "Added to map" },
  map_removed: { icon: MapIcon, label: "Removed from map" },
}

/* ── Section ───────────────────────────────────────────── */

function PanelSection({
  title,
  icon,
  count,
  children,
}: {
  title: string
  icon: React.ReactNode
  count?: number
  children: React.ReactNode
}) {
  return (
    <div className="px-5 py-3">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        {count !== undefined && (
          <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] tabular-nums font-medium text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

/* ── Metadata row ──────────────────────────────────────── */

function MetaRow({
  label,
  icon,
  children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="flex items-center gap-2 text-[12px] text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-[12px] text-foreground">{children}</span>
    </div>
  )
}

/* ── Note link item ────────────────────────────────────── */

function NoteLink({
  note,
  onOpen,
}: {
  note: Note
  onOpen: (id: string) => void
}) {
  return (
    <button
      onClick={() => onOpen(note.id)}
      className="group/link flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-secondary/50"
    >
      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[12px] text-foreground group-hover/link:text-accent">
          {note.title || "Untitled"}
        </span>
      </div>
      <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/0 transition-colors group-hover/link:text-muted-foreground" />
    </button>
  )
}

/* ── NoteDetailPanel ───────────────────────────────────── */

export function NoteDetailPanel({
  noteId,
  onClose,
  onOpenNote,
  onEditNote,
  onTriageAction,
  embedded = false,
}: {
  noteId: string
  onClose: () => void
  onOpenNote: (id: string) => void
  onEditNote: () => void
  onTriageAction?: () => void
  embedded?: boolean
}) {
  const notes = usePlotStore((s) => s.notes)
  const triageKeep = usePlotStore((s) => s.triageKeep)
  const triageSnooze = usePlotStore((s) => s.triageSnooze)
  const triageTrash = usePlotStore((s) => s.triageTrash)
  const promoteToPermament = usePlotStore((s) => s.promoteToPermament)
  const undoPromote = usePlotStore((s) => s.undoPromote)
  const moveBackToInbox = usePlotStore((s) => s.moveBackToInbox)
  const noteEvents = usePlotStore((s) => s.noteEvents)
  const thinkingChains = usePlotStore((s) => s.thinkingChains)
  const startThinkingChain = usePlotStore((s) => s.startThinkingChain)
  const addThinkingStep = usePlotStore((s) => s.addThinkingStep)
  const endThinkingChain = usePlotStore((s) => s.endThinkingChain)
  const addWikiLink = usePlotStore((s) => s.addWikiLink)
  const knowledgeMaps = usePlotStore((s) => s.knowledgeMaps)
  const removeNoteFromMap = usePlotStore((s) => s.removeNoteFromMap)

  const note = notes.find((n) => n.id === noteId)

  const backlinks = useMemo(
    () => (note ? getBacklinkNotes(noteId, notes) : []),
    [noteId, notes, note]
  )

  const suggestions = useMemo(
    () => (note ? suggestBacklinks(noteId, notes, { limit: 10 }) : []),
    [noteId, notes, note]
  )

  const noteChains = useMemo(
    () => thinkingChains.filter((c) => c.noteId === noteId),
    [thinkingChains, noteId]
  )

  const activeChain = useMemo(
    () => noteChains.find((c) => c.status === "active") ?? null,
    [noteChains]
  )

  const noteMaps = useMemo(
    () => knowledgeMaps.filter((m) => m.noteIds.includes(noteId)),
    [knowledgeMaps, noteId]
  )

  const timelineEvents = useMemo(() => {
    return noteEvents
      .filter((e) => e.noteId === noteId)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  }, [noteEvents, noteId])

  const [thinkingStepInput, setThinkingStepInput] = useState("")
  const [showAllTimeline, setShowAllTimeline] = useState(false)
  const [collapsedSessions, setCollapsedSessions] = useState<Set<string>>(new Set())

  const toggleSessionCollapse = useCallback((sessionId: string) => {
    setCollapsedSessions((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })
  }, [])

  const handleAddStep = useCallback((chainId: string) => {
    const text = thinkingStepInput.trim()
    if (!text) return
    addThinkingStep(chainId, text)
    setThinkingStepInput("")
    toast("Step added")
  }, [thinkingStepInput, addThinkingStep])

  const handleStartChain = useCallback(() => {
    startThinkingChain(noteId)
    toast("Thinking chain started")
  }, [startThinkingChain, noteId])

  const handleEndChain = useCallback((chainId: string) => {
    endThinkingChain(chainId)
    toast("Thinking chain ended")
  }, [endThinkingChain])

  const handleLinkSuggestion = useCallback((targetTitle: string) => {
    addWikiLink(noteId, targetTitle)
    toast("Link added")
  }, [addWikiLink, noteId])

  const readyScore = useMemo(
    () => (note ? computeReadyScore(note, notes) : 0),
    [note, notes]
  )

  const ready = useMemo(
    () => (note ? isReadyToPromote(note, notes) : false),
    [note, notes]
  )

  const stale = note ? needsReview(note) : false
  const staleSuggest = note ? isStaleSuggest(note) : false
  const linkCount = note ? countBacklinks(note.id, notes) : 0

  // Advance to next inbox note after triage action
  const advanceToNext = useCallback(() => {
    const inbox = getInboxNotes(notes)
    const next = inbox.find((n) => n.id !== noteId)
    if (next) onOpenNote(next.id)
    else onClose()
    onTriageAction?.()
  }, [notes, noteId, onOpenNote, onClose, onTriageAction])

  const handleKeep = useCallback(() => {
    triageKeep(noteId)
    toast("Moved to Capture")
    advanceToNext()
  }, [triageKeep, noteId, advanceToNext])

  const handleSnooze = useCallback(
    (option: "3h" | "tomorrow" | "next-week") => {
      triageSnooze(noteId, getSnoozeTime(option))
      toast("Snoozed")
      advanceToNext()
    },
    [triageSnooze, noteId, advanceToNext]
  )

  const handleTrash = useCallback(() => {
    triageTrash(noteId)
    toast("Trashed")
    advanceToNext()
  }, [triageTrash, noteId, advanceToNext])

  const handlePromote = useCallback(() => {
    promoteToPermament(noteId)
    toast("Promoted to Permanent")
  }, [promoteToPermament, noteId])

  const handleDemote = useCallback(() => {
    undoPromote(noteId)
    toast("Demoted to Capture")
  }, [undoPromote, noteId])

  const handleMoveBack = useCallback(() => {
    moveBackToInbox(noteId)
    toast("Moved back to Inbox")
  }, [moveBackToInbox, noteId])

  // Keyboard shortcuts
  useEffect(() => {
    if (!note) return
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return
      if (target.closest("[role='dialog']") || target.closest("[data-radix-popper-content-wrapper]")) return

      if (note.stage === "inbox" && note.triageStatus !== "trashed") {
        if (e.key === "k" || e.key === "K") { e.preventDefault(); handleKeep() }
        if (e.key === "s" || e.key === "S") { e.preventDefault(); handleSnooze("tomorrow") }
        if (e.key === "t" || e.key === "T") { e.preventDefault(); handleTrash() }
      }
      if (note.stage === "capture") {
        if (e.key === "p" || e.key === "P") { e.preventDefault(); handlePromote() }
        if (e.key === "b" || e.key === "B") { e.preventDefault(); handleMoveBack() }
      }
      if (note.stage === "permanent") {
        if (e.key === "d" || e.key === "D") { e.preventDefault(); handleDemote() }
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [note, handleKeep, handleSnooze, handleTrash, handlePromote, handleDemote, handleMoveBack])

  if (!note) return null

  const preview = note.content
    .replace(/^#.*$/gm, "")
    .replace(/[*_~`[\]]/g, "")
    .trim()
    .slice(0, 200)

  const Wrapper = embedded ? "div" : "aside"
  const wrapperClass = embedded
    ? "flex h-full flex-1 flex-col overflow-hidden bg-card"
    : "flex h-full w-[420px] shrink-0 flex-col overflow-hidden border-l border-border bg-card animate-in slide-in-from-right-4 fade-in duration-200"

  return (
    <Wrapper className={wrapperClass}>
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-[13px] font-medium text-foreground truncate">
            Details
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEditNote}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Open in editor"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close panel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Stage-aware workflow action bar */}
      {note.stage === "inbox" && note.triageStatus !== "trashed" && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-secondary/20 px-4 py-2">
          <button
            onClick={handleKeep}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[12px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
          >
            <Check className="h-3 w-3" />
            Keep
            <kbd className="ml-1 rounded bg-accent-foreground/10 px-1 py-0.5 text-[10px] font-mono leading-none text-accent-foreground/60">K</kbd>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-[12px] font-medium text-foreground transition-colors hover:bg-secondary">
                <AlarmClock className="h-3 w-3" />
                Snooze
                <kbd className="ml-1 rounded bg-muted px-1 py-0.5 text-[10px] font-mono leading-none text-muted-foreground">S</kbd>
                <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem onClick={() => handleSnooze("3h")} className="text-[12px]">
                <AlarmClock className="h-3 w-3 mr-2 text-muted-foreground" /> 3 hours
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSnooze("tomorrow")} className="text-[12px]">
                <AlarmClock className="h-3 w-3 mr-2 text-muted-foreground" /> Tomorrow 10:00 AM
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSnooze("next-week")} className="text-[12px]">
                <AlarmClock className="h-3 w-3 mr-2 text-muted-foreground" /> Next week 10:00 AM
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={handleTrash}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-[12px] font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" />
            Trash
            <kbd className="ml-1 rounded bg-muted px-1 py-0.5 text-[10px] font-mono leading-none text-muted-foreground">T</kbd>
          </button>
        </div>
      )}

      {note.stage === "capture" && (
        <div className="shrink-0 border-b border-border">
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/20">
            <button
              onClick={handlePromote}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                ready
                  ? "bg-[#45d483] text-[#0a0a0a] hover:bg-[#45d483]/80"
                  : "border border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              <ArrowUpRight className="h-3 w-3" />
              Promote
              <kbd className="ml-1 rounded bg-foreground/10 px-1 py-0.5 text-[10px] font-mono leading-none opacity-60">P</kbd>
            </button>
            <button
              onClick={handleMoveBack}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Inbox className="h-3 w-3" />
              Back to Inbox
              <kbd className="ml-1 rounded bg-muted px-1 py-0.5 text-[10px] font-mono leading-none text-muted-foreground">B</kbd>
            </button>
          </div>
          {staleSuggest && (
            <div className="flex items-center gap-2 bg-destructive/5 px-4 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              <span className="text-[12px] text-destructive">Untouched for 14+ days.</span>
              <button
                onClick={handleMoveBack}
                className="ml-auto text-[11px] font-medium text-destructive underline underline-offset-2 hover:no-underline"
              >
                Move back to Inbox?
              </button>
            </div>
          )}
          {!staleSuggest && stale && (
            <div className="flex items-center gap-2 bg-chart-3/5 px-4 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-chart-3" />
              <span className="text-[12px] text-chart-3">Review needed - untouched for 7+ days.</span>
            </div>
          )}
        </div>
      )}

      {note.stage === "permanent" && (
        <div className="shrink-0 border-b border-border">
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/20">
            <button
              onClick={handleDemote}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ArrowDownLeft className="h-3 w-3" />
              Demote to Capture
              <kbd className="ml-1 rounded bg-muted px-1 py-0.5 text-[10px] font-mono leading-none text-muted-foreground">D</kbd>
            </button>
          </div>
          {linkCount === 0 && (
            <div className="flex items-center gap-2 bg-chart-3/5 px-4 py-2">
              <Link2 className="h-3.5 w-3.5 text-chart-3" />
              <span className="text-[12px] text-chart-3">Unlinked permanent note - add connections to strengthen your knowledge graph.</span>
            </div>
          )}
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Note title */}
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-[16px] font-semibold leading-tight text-foreground text-balance">
            {note.title || "Untitled"}
          </h2>
          {preview && (
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground line-clamp-3">
              {preview}
            </p>
          )}
        </div>

        {/* Thinking Chain */}
        {(() => {
          const parentNote = notes.find((n) => n.id === note.parentNoteId)
          const childNote = notes.find((n) => n.parentNoteId === note.id)
          if (!parentNote && !childNote) return null
          return (
            <>
              <PanelSection title="Thinking Chain" icon={<GitBranch className="h-3.5 w-3.5" />}>
                <div className="space-y-1">
                  {parentNote && (
                    <button onClick={() => onOpenNote(parentNote.id)} className="group/link flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-secondary/50">
                      <ArrowLeft className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate text-[12px] text-foreground">← {parentNote.title || "Untitled"}</span>
                    </button>
                  )}
                  {childNote && (
                    <button onClick={() => onOpenNote(childNote.id)} className="group/link flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-secondary/50">
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate text-[12px] text-foreground">{childNote.title || "Untitled"} →</span>
                    </button>
                  )}
                </div>
              </PanelSection>
              <div className="mx-5 border-b border-border" />
            </>
          )
        })()}

        {/* Metadata */}
        <PanelSection title="Metadata" icon={<CircleDot className="h-3.5 w-3.5" />}>
          <div className="space-y-0.5">
            <MetaRow label="Status" icon={<CircleDot className="h-3 w-3" />}>
              <StatusBadge status={note.status} />
            </MetaRow>
            <MetaRow label="Stage" icon={<Layers className="h-3 w-3" />}>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                note.stage === "inbox"
                  ? "bg-accent/10 text-accent"
                  : note.stage === "capture"
                  ? "bg-chart-2/10 text-chart-2"
                  : "bg-chart-5/10 text-chart-5"
              }`}>
                {note.stage === "permanent" && <Shield className="h-2.5 w-2.5" />}
                {note.stage.charAt(0).toUpperCase() + note.stage.slice(1)}
              </span>
            </MetaRow>
            {note.stage === "capture" && (
              <MetaRow label="Ready Score" icon={<Sparkles className="h-3 w-3" />}>
                <span className={`text-[12px] tabular-nums font-medium ${
                  readyScore >= 5 ? "text-chart-5" : readyScore >= 3 ? "text-chart-3" : "text-muted-foreground"
                }`}>
                  {readyScore}/9
                  {ready && " - Ready"}
                </span>
              </MetaRow>
            )}
            <MetaRow label="Priority" icon={<Signal className="h-3 w-3" />}>
              <span className="flex items-center gap-1.5">
                <PriorityBadge priority={note.priority} />
                <span className="text-[12px] capitalize text-muted-foreground">
                  {note.priority === "none" ? "No priority" : note.priority}
                </span>
              </span>
            </MetaRow>
            <MetaRow label="Reads" icon={<Eye className="h-3 w-3" />}>
              <span className="tabular-nums">{note.reads}</span>
            </MetaRow>
            <MetaRow label="Created" icon={<Calendar className="h-3 w-3" />}>
              {format(new Date(note.createdAt), "MMM d, yyyy")}
            </MetaRow>
            <MetaRow label="Updated" icon={<Clock className="h-3 w-3" />}>
              {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
            </MetaRow>
          </div>
        </PanelSection>

        <div className="mx-5 border-b border-border" />

        {/* Knowledge Maps */}
        <PanelSection
          title="Maps"
          icon={<Network className="h-3.5 w-3.5" />}
          count={noteMaps.length}
        >
          {noteMaps.length > 0 ? (
            <div className="space-y-0.5">
              {noteMaps.map((m) => (
                <div key={m.id} className="group/map flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary/50">
                  <div className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: m.color }} />
                  <span className="flex-1 truncate text-[12px] text-foreground">{m.title}</span>
                  <button
                    onClick={() => {
                      removeNoteFromMap(m.id, noteId)
                      toast("Removed from map")
                    }}
                    className="shrink-0 rounded p-0.5 text-muted-foreground/0 group-hover/map:text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground/60">
              Not in any knowledge map.
            </p>
          )}
        </PanelSection>

        <div className="mx-5 border-b border-border" />

        {/* Backlinks */}
        <PanelSection
          title="Backlinks"
          icon={<Link2 className="h-3.5 w-3.5" />}
          count={backlinks.length}
        >
          {backlinks.length > 0 ? (
            <div className="space-y-0.5">
              {backlinks.map((bl) => (
                <NoteLink key={bl.id} note={bl} onOpen={onOpenNote} />
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground/60">
              No other notes reference this note yet.
            </p>
          )}
        </PanelSection>

        <div className="mx-5 border-b border-border" />

        {/* Connections Graph */}
        <PanelSection
          title="Connections"
          icon={<Link2 className="h-3.5 w-3.5" />}
        >
          <ConnectionsGraph
            noteId={noteId}
            notes={notes}
            onOpenNote={onOpenNote}
          />
        </PanelSection>

        <div className="mx-5 border-b border-border" />

        {/* Thinking Chain Sessions */}
        <PanelSection
          title="Thinking Chains"
          icon={<Brain className="h-3.5 w-3.5" />}
          count={noteChains.length}
        >
          {noteChains.length === 0 && !activeChain ? (
            <button
              onClick={handleStartChain}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <Plus className="h-3 w-3" />
              Start Thinking Chain
            </button>
          ) : (
            <div className="space-y-3">
              {noteChains.map((session) => {
                const isActive = session.status === "active"
                const isCollapsed = !isActive && collapsedSessions.has(session.id)
                return (
                  <div key={session.id} className="rounded-md border border-border bg-secondary/20">
                    {/* Session header */}
                    <button
                      onClick={() => !isActive && toggleSessionCollapse(session.id)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Brain className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[11px] font-medium text-foreground">
                          Session {format(new Date(session.startedAt), "MMM d, HH:mm")}
                        </span>
                      </div>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        isActive
                          ? "bg-chart-5/10 text-chart-5"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {session.status}
                      </span>
                    </button>

                    {/* Steps */}
                    {(!isCollapsed || isActive) && (
                      <div className="border-t border-border px-3 py-2">
                        {session.steps.length > 0 ? (
                          <div className="space-y-1.5">
                            {session.steps.map((step) => (
                              <div key={step.id} className="flex gap-2">
                                <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground mt-0.5">
                                  {format(new Date(step.at), "HH:mm")}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[12px] text-foreground">{step.text}</p>
                                  {step.relatedNoteIds && step.relatedNoteIds.length > 0 && (
                                    <div className="mt-0.5 flex flex-wrap gap-1">
                                      {step.relatedNoteIds.map((rid) => {
                                        const rNote = notes.find((n) => n.id === rid)
                                        return rNote ? (
                                          <button
                                            key={rid}
                                            onClick={() => onOpenNote(rid)}
                                            className="text-[10px] text-accent hover:underline"
                                          >
                                            {rNote.title || "Untitled"}
                                          </button>
                                        ) : null
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground/60">No steps yet.</p>
                        )}

                        {/* Active session controls */}
                        {isActive && (
                          <div className="mt-2 space-y-2">
                            <input
                              type="text"
                              value={thinkingStepInput}
                              onChange={(e) => setThinkingStepInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleAddStep(session.id)
                              }}
                              placeholder="Add a thinking step..."
                              className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent"
                            />
                            <button
                              onClick={() => handleEndChain(session.id)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            >
                              <Check className="h-2.5 w-2.5" />
                              End Session
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Start new chain button if no active session */}
              {!activeChain && (
                <button
                  onClick={handleStartChain}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  <Plus className="h-3 w-3" />
                  New Chain
                </button>
              )}
            </div>
          )}
        </PanelSection>

        <div className="mx-5 border-b border-border" />

        {/* Backlink Suggestions */}
        <PanelSection
          title="Backlink Suggestions"
          icon={<Sparkles className="h-3.5 w-3.5" />}
          count={suggestions.length}
        >
          {suggestions.length > 0 ? (
            <div className="space-y-0.5">
              {suggestions.map((s) => {
                const candidateNote = notes.find((n) => n.id === s.noteId)
                if (!candidateNote) return null
                return (
                  <div
                    key={s.noteId}
                    className="group/link flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-secondary/50"
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <button
                        onClick={() => onOpenNote(candidateNote.id)}
                        className="truncate text-left text-[12px] text-foreground hover:text-accent"
                      >
                        {candidateNote.title || "Untitled"}
                      </button>
                      <span className="truncate text-[10px] text-muted-foreground/60">
                        {s.reasons.join(" · ")}
                      </span>
                    </div>
                    <span className="shrink-0 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] tabular-nums font-medium text-accent">
                      {s.score}
                    </span>
                    <button
                      onClick={() => handleLinkSuggestion(candidateNote.title)}
                      className="shrink-0 rounded-md border border-border bg-card px-2 py-0.5 text-[10px] font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                      Link
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground/60">
              No suggestions found. Try adding tags or organizing notes into folders.
            </p>
          )}
        </PanelSection>

        <div className="mx-5 border-b border-border" />

        {/* Timeline */}
        <PanelSection
          title="Timeline"
          icon={<Clock className="h-3.5 w-3.5" />}
          count={timelineEvents.length}
        >
          {timelineEvents.length > 0 ? (
            <div className="space-y-1">
              {(showAllTimeline ? timelineEvents : timelineEvents.slice(0, 30)).map((evt) => {
                const config = EVENT_CONFIG[evt.type]
                if (!config) return null
                const Icon = config.icon
                return (
                  <div key={evt.id} className="flex items-center gap-2.5 py-1">
                    <Icon className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                    <span className="text-[12px] text-foreground">{config.label}</span>
                    <span className="ml-auto shrink-0 text-[10px] tabular-nums text-muted-foreground">
                      {formatDistanceToNow(new Date(evt.at), { addSuffix: true })}
                    </span>
                  </div>
                )
              })}
              {!showAllTimeline && timelineEvents.length > 30 && (
                <button
                  onClick={() => setShowAllTimeline(true)}
                  className="mt-1 text-[11px] font-medium text-accent hover:underline"
                >
                  Show all ({timelineEvents.length} events)
                </button>
              )}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground/60">
              No events recorded yet.
            </p>
          )}
        </PanelSection>
      </div>
    </Wrapper>
  )
}
