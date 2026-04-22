"use client"

import { useMemo, useState } from "react"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute, setPendingFilters } from "@/lib/table-route"
import { useHomeSection, setHomeSection } from "@/lib/home-section"
import type { HomeSection } from "@/lib/home-section"
import { detectUnlinkedMentions } from "@/lib/unlinked-mentions"
import { Tray } from "@phosphor-icons/react/dist/ssr/Tray"
import { Clock } from "@phosphor-icons/react/dist/ssr/Clock"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Graph } from "@phosphor-icons/react/dist/ssr/Graph"
import { LinkBreak } from "@phosphor-icons/react/dist/ssr/LinkBreak"
import { LinkSimple } from "@phosphor-icons/react/dist/ssr/LinkSimple"
import { GitFork } from "@phosphor-icons/react/dist/ssr/GitFork"
import { Island } from "@phosphor-icons/react/dist/ssr/Island"
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft"
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise"
import { Circle } from "@phosphor-icons/react/dist/ssr/Circle"
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle"
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning"
import { FolderOpen } from "@phosphor-icons/react/dist/ssr/FolderOpen"
import { Tag as PhTag } from "@phosphor-icons/react/dist/ssr/Tag"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { getOrphanActions, type OrphanAction } from "@/lib/orphan-actions"
import { toast } from "sonner"

/* ── Helpers ──────────────────────────────────────────── */

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/* ── Back button ─────────────────────────────────────── */

function BackToOverview() {
  return (
    <button
      onClick={() => setHomeSection("overview")}
      className="mb-6 flex items-center gap-1.5 text-note text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft size={14} />
      <span>Back to Overview</span>
    </button>
  )
}

/* ── Section header ──────────────────────────────────── */

function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode
  title: string
  count: number
}) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="text-muted-foreground">{icon}</span>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <span className="text-note text-muted-foreground tabular-nums">({count})</span>
    </div>
  )
}

/* ── Detail: Unlinked Mentions ───────────────────────── */

function UnlinkedMentionsDetail() {
  const notes = usePlotStore((s) => s.notes)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)

  const nonTrashedNotes = useMemo(() => notes.filter((n) => !n.trashed), [notes])

  const allUnlinked = useMemo(() => {
    const mentionMap = new Map<
      string,
      { noteId: string; title: string; count: number; foundIn: { id: string; title: string }[] }
    >()

    for (const note of nonTrashedNotes) {
      const mentions = detectUnlinkedMentions(note.id, nonTrashedNotes)
      for (const m of mentions) {
        const existing = mentionMap.get(m.noteId)
        if (existing) {
          existing.count += m.count
          if (!existing.foundIn.find((f) => f.id === note.id)) {
            existing.foundIn.push({ id: note.id, title: note.title || "Untitled" })
          }
        } else {
          mentionMap.set(m.noteId, {
            noteId: m.noteId,
            title: m.title,
            count: m.count,
            foundIn: [{ id: note.id, title: note.title || "Untitled" }],
          })
        }
      }
    }

    return Array.from(mentionMap.values()).sort((a, b) => b.count - a.count)
  }, [nonTrashedNotes])

  function navigateToNote(noteId: string) {
    setSelectedNoteId(noteId)
    setActiveRoute("/notes")
  }

  return (
    <div>
      <BackToOverview />
      <SectionHeader
        icon={<LinkSimple size={20} />}
        title="Unlinked Mentions"
        count={allUnlinked.length}
      />
      {allUnlinked.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-surface-overlay p-4 text-note text-muted-foreground">
          No unlinked mentions found.
        </div>
      ) : (
        <div className="rounded-lg border border-border-subtle bg-surface-overlay">
          {allUnlinked.map((m, i) => (
            <div
              key={m.noteId}
              className={`px-4 py-3 ${i !== allUnlinked.length - 1 ? "border-b border-border-subtle" : ""}`}
            >
              <div className="flex items-center gap-2">
                <FileText size={14} className="shrink-0 text-muted-foreground" />
                <span className="font-medium text-note text-foreground">&ldquo;{m.title}&rdquo;</span>
                <span className="text-2xs text-muted-foreground">
                  found in {m.foundIn.length} note{m.foundIn.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="mt-1.5 ml-5 space-y-0.5">
                {m.foundIn.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => navigateToNote(f.id)}
                    className="flex items-center gap-1.5 text-2xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span className="text-border-subtle">&bull;</span>
                    <span>{f.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Detail: Connection Suggestions ──────────────────── */

function SuggestionsDetail() {
  const notes = usePlotStore((s) => s.notes)
  const relationSuggestions = usePlotStore((s) => s.relationSuggestions)
  const acceptRelationSuggestion = usePlotStore((s) => s.acceptRelationSuggestion)
  const dismissRelationSuggestion = usePlotStore((s) => s.dismissRelationSuggestion)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)

  const allPending = useMemo(() => {
    return relationSuggestions
      .filter((s) => s.status === "pending")
      .map((s) => {
        const source = notes.find((n) => n.id === s.sourceNoteId)
        const target = notes.find((n) => n.id === s.targetNoteId)
        return {
          id: s.id,
          sourceId: s.sourceNoteId,
          targetId: s.targetNoteId,
          sourceTitle: source?.title || "Untitled",
          targetTitle: target?.title || "Untitled",
          reason: s.reason || "co-occurrence",
        }
      })
  }, [relationSuggestions, notes])

  function navigateToNote(noteId: string) {
    setSelectedNoteId(noteId)
    setActiveRoute("/notes")
  }

  return (
    <div>
      <BackToOverview />
      <SectionHeader
        icon={<GitFork size={20} />}
        title="Connection Suggestions"
        count={allPending.length}
      />
      {allPending.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-surface-overlay p-4 text-note text-muted-foreground">
          No pending suggestions.
        </div>
      ) : (
        <div className="rounded-lg border border-border-subtle bg-surface-overlay">
          {allPending.map((s, i) => (
            <div
              key={s.id}
              className={`px-4 py-3 ${i !== allPending.length - 1 ? "border-b border-border-subtle" : ""}`}
            >
              <div className="flex items-center gap-2">
                <GitFork size={14} className="shrink-0 text-muted-foreground" />
                <button
                  onClick={() => navigateToNote(s.sourceId)}
                  className="text-note font-medium text-foreground transition-colors hover:underline"
                >
                  {s.sourceTitle}
                </button>
                <span className="text-2xs text-muted-foreground">&harr;</span>
                <button
                  onClick={() => navigateToNote(s.targetId)}
                  className="text-note font-medium text-foreground transition-colors hover:underline"
                >
                  {s.targetTitle}
                </button>
              </div>
              <div className="mt-1.5 ml-5 flex items-center gap-3">
                <span className="text-2xs text-muted-foreground">
                  Reason: {s.reason}
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => acceptRelationSuggestion(s.id)}
                    className="rounded border border-border-subtle bg-surface-overlay px-2 py-0.5 text-2xs text-foreground transition-colors hover:bg-hover-bg"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => dismissRelationSuggestion(s.id)}
                    className="rounded border border-border-subtle bg-surface-overlay px-2 py-0.5 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Detail: Unresolved Links ───────────────────────── */

function UnresolvedLinksDetail() {
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)

  const nonTrashedNotes = useMemo(() => notes.filter((n) => !n.trashed), [notes])

  const allRedLinks = useMemo(() => {
    const existingTitles = new Set<string>()
    for (const n of nonTrashedNotes) {
      existingTitles.add(n.title.toLowerCase())
      if (n.aliases) n.aliases.forEach((a) => existingTitles.add(a.toLowerCase()))
    }
    for (const w of wikiArticles) {
      existingTitles.add(w.title.toLowerCase())
      w.aliases.forEach((a) => existingTitles.add(a.toLowerCase()))
    }

    const redMap = new Map<string, { title: string; refs: number; referencedBy: { id: string; title: string }[] }>()
    for (const n of nonTrashedNotes) {
      for (const link of n.linksOut) {
        if (!existingTitles.has(link.toLowerCase())) {
          const existing = redMap.get(link.toLowerCase())
          if (existing) {
            existing.refs++
            if (!existing.referencedBy.find((r) => r.id === n.id)) {
              existing.referencedBy.push({ id: n.id, title: n.title || "Untitled" })
            }
          } else {
            redMap.set(link.toLowerCase(), {
              title: link,
              refs: 1,
              referencedBy: [{ id: n.id, title: n.title || "Untitled" }],
            })
          }
        }
      }
    }

    return Array.from(redMap.values()).sort((a, b) => b.refs - a.refs)
  }, [nonTrashedNotes, wikiArticles])

  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)

  function navigateToNote(noteId: string) {
    setSelectedNoteId(noteId)
    setActiveRoute("/notes")
  }

  return (
    <div>
      <BackToOverview />
      <SectionHeader
        icon={<LinkBreak size={20} />}
        title="Unresolved Links"
        count={allRedLinks.length}
      />
      {allRedLinks.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-surface-overlay p-4 text-note text-muted-foreground">
          No unresolved links found.
        </div>
      ) : (
        <div className="rounded-lg border border-border-subtle bg-surface-overlay">
          {allRedLinks.map((r, i) => (
            <div
              key={r.title}
              className={`px-4 py-3 ${i !== allRedLinks.length - 1 ? "border-b border-border-subtle" : ""}`}
            >
              <div className="flex items-center gap-2">
                <LinkBreak size={14} weight="regular" className="shrink-0 text-muted-foreground" />
                <span className="font-medium text-note text-foreground">{r.title}</span>
                <span className="text-2xs text-muted-foreground">
                  referenced by {r.referencedBy.length} note{r.referencedBy.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="mt-1.5 ml-5 space-y-0.5">
                {r.referencedBy.map((ref) => (
                  <button
                    key={ref.id}
                    onClick={() => navigateToNote(ref.id)}
                    className="flex items-center gap-1.5 text-2xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span className="text-border-subtle">&bull;</span>
                    <span>{ref.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Detail: Orphans ─────────────────────────────────── */

function OrphansDetail() {
  const notes = usePlotStore((s) => s.notes)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const tags = usePlotStore((s) => s.tags)
  const folders = usePlotStore((s) => s.folders)
  const updateNote = usePlotStore((s) => s.updateNote)

  const nonTrashedNotes = useMemo(() => notes.filter((n) => !n.trashed), [notes])

  const allOrphans = useMemo(() => {
    const incomingSet = new Set<string>()
    for (const n of nonTrashedNotes) {
      for (const link of n.linksOut) {
        const target = nonTrashedNotes.find(
          (t) => t.title.toLowerCase() === link.toLowerCase(),
        )
        if (target) incomingSet.add(target.id)
      }
    }
    return nonTrashedNotes
      .filter((n) => n.linksOut.length === 0 && !incomingSet.has(n.id))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [nonTrashedNotes])

  const backlinksMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const n of nonTrashedNotes) {
      for (const link of n.linksOut) {
        const target = nonTrashedNotes.find(
          (t) => t.title.toLowerCase() === link.toLowerCase(),
        )
        if (target) {
          if (!map[target.id]) map[target.id] = []
          map[target.id].push(n.id)
        }
      }
    }
    return map
  }, [nonTrashedNotes])

  const orphanActionsMap = useMemo(() => {
    const map = new Map<string, OrphanAction[]>()
    const activeTags = tags.filter((t) => !t.trashed)
    for (const orphan of allOrphans.slice(0, 20)) {
      const actions = getOrphanActions(orphan, nonTrashedNotes, backlinksMap, activeTags, folders)
      if (actions.length > 0) map.set(orphan.id, actions)
    }
    return map
  }, [allOrphans, nonTrashedNotes, backlinksMap, tags, folders])

  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  function navigateToNote(noteId: string) {
    setSelectedNoteId(noteId)
    setActiveRoute("/notes")
  }

  function handleAction(noteId: string, action: OrphanAction) {
    switch (action.type) {
      case "link":
        if (action.targetTitle) {
          const note = nonTrashedNotes.find((n) => n.id === noteId)
          if (note) {
            const newContent = (note.content || "") + `\n[[${action.targetTitle}]]`
            updateNote(noteId, { content: newContent, linksOut: [...note.linksOut, action.targetTitle] })
            toast.success(`Linked to "${action.targetTitle}"`)
          }
        }
        break
      case "move":
        if (action.targetId) {
          updateNote(noteId, { folderId: action.targetId })
          toast.success(`Moved to "${action.targetTitle}"`)
        }
        break
      case "tag":
        if (action.targetId) {
          const note = nonTrashedNotes.find((n) => n.id === noteId)
          if (note) {
            updateNote(noteId, { tags: [...(note.tags || []), action.targetId] })
            toast.success(`Added #${action.targetTitle}`)
          }
        }
        break
      case "delete":
        updateNote(noteId, { trashed: true, trashedAt: new Date().toISOString() } as any)
        toast.success("Moved to trash")
        break
    }
  }

  return (
    <div>
      <BackToOverview />
      <SectionHeader
        icon={<Island size={20} />}
        title="Orphan Notes"
        count={allOrphans.length}
      />
      {allOrphans.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-surface-overlay p-4 text-note text-muted-foreground">
          No orphan notes found.
        </div>
      ) : (
        <div className="rounded-lg border border-border-subtle bg-surface-overlay">
          {allOrphans.map((note, i) => (
            <div
              key={note.id}
              className={`${i !== allOrphans.length - 1 ? "border-b border-border-subtle" : ""}`}
            >
              <button
                onClick={() => navigateToNote(note.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-hover-bg"
              >
                <span className="flex items-center gap-2 truncate">
                  <FileText size={14} className="shrink-0 text-muted-foreground" />
                  <span className="truncate text-note text-foreground">
                    {note.title || "Untitled"}
                  </span>
                </span>
                <span className="ml-3 shrink-0 text-2xs text-muted-foreground">
                  {relativeTime(note.createdAt)}
                </span>
              </button>
              {orphanActionsMap.get(note.id)?.filter((a) => !dismissed.has(`${note.id}:${a.type}:${a.targetId ?? ""}`)).map((action, ai) => (
                <div key={ai} className="flex items-center gap-2 px-4 pb-2 ml-5">
                  <button
                    onClick={() => handleAction(note.id, action)}
                    className="flex items-center gap-1.5 rounded-md border border-border-subtle px-2 py-1 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
                  >
                    {action.type === "link" && <Lightning size={12} />}
                    {action.type === "move" && <FolderOpen size={12} />}
                    {action.type === "tag" && <PhTag size={12} />}
                    {action.type === "delete" && <Trash size={12} />}
                    <span>{action.label}</span>
                  </button>
                  <button
                    onClick={() => setDismissed((prev) => new Set(prev).add(`${note.id}:${action.type}:${action.targetId ?? ""}`))}
                    className="text-2xs text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                  >
                    Dismiss
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Main Component ──────────────────────────────────── */

export function HomeView() {
  const homeSection = useHomeSection()
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)

  const today = todayString()

  const inboxCount = useMemo(
    () => notes.filter((n) => n.status === "inbox" && !n.trashed).length,
    [notes],
  )

  const reviewDueCount = useMemo(
    () =>
      notes.filter(
        (n) => n.reviewAt && new Date(n.reviewAt) <= new Date(),
      ).length,
    [notes],
  )

  const editedTodayCount = useMemo(
    () => notes.filter((n) => n.updatedAt.startsWith(today)).length,
    [notes, today],
  )

  const totalNotes = useMemo(
    () => notes.filter((n) => !n.trashed).length,
    [notes],
  )

  const nonTrashedNotes = useMemo(() => notes.filter((n) => !n.trashed), [notes])

  const orphanCount = useMemo(() => {
    const incomingSet = new Set<string>()
    for (const n of nonTrashedNotes) {
      for (const link of n.linksOut) {
        const target = nonTrashedNotes.find(
          (t) => t.title.toLowerCase() === link.toLowerCase(),
        )
        if (target) incomingSet.add(target.id)
      }
    }
    return nonTrashedNotes.filter(
      (n) => n.linksOut.length === 0 && !incomingSet.has(n.id),
    ).length
  }, [nonTrashedNotes])

  const redLinkCount = useMemo(() => {
    const existingTitles = new Set<string>()
    for (const n of nonTrashedNotes) {
      existingTitles.add(n.title.toLowerCase())
      if (n.aliases) n.aliases.forEach((a) => existingTitles.add(a.toLowerCase()))
    }
    for (const w of wikiArticles) {
      existingTitles.add(w.title.toLowerCase())
      w.aliases.forEach((a) => existingTitles.add(a.toLowerCase()))
    }
    const seen = new Set<string>()
    for (const n of nonTrashedNotes) {
      for (const link of n.linksOut) {
        if (!existingTitles.has(link.toLowerCase())) {
          seen.add(link.toLowerCase())
        }
      }
    }
    return seen.size
  }, [nonTrashedNotes, wikiArticles])

  const recentNotes = useMemo(
    () =>
      [...notes]
        .filter((n) => !n.trashed)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
    [notes],
  )

  function navigateToNote(noteId: string) {
    setSelectedNoteId(noteId)
    setActiveRoute("/notes")
  }

  /* ── Detail view routing ── */
  if (homeSection !== "overview") {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-8">
          {homeSection === "unlinked" && <UnlinkedMentionsDetail />}
          {homeSection === "suggestions" && <SuggestionsDetail />}
          {homeSection === "redlinks" && <UnresolvedLinksDetail />}
          {homeSection === "orphans" && <OrphansDetail />}
        </div>
      </div>
    )
  }

  /* ── Overview dashboard (default) ── */
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-8 py-8">
        {/* ── Section 1: Today ── */}
        <section className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            {getGreeting()}
          </h1>
          <p className="mt-1 text-note text-muted-foreground">
            {formatDate()}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {/* Inbox */}
            <button
              onClick={() => setActiveRoute("/inbox")}
              className="flex flex-col items-start gap-2 rounded-lg border border-border-subtle bg-surface-overlay p-4 text-left transition-colors hover:bg-hover-bg"
            >
              <Tray size={20} className="text-muted-foreground" />
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {inboxCount}
                </p>
                <p className="text-2xs text-muted-foreground">Inbox</p>
              </div>
            </button>

            {/* Review Due */}
            <button
              onClick={() => {
                setPendingFilters([{ field: "reviewAt", operator: "lt", value: today }])
                setActiveRoute("/notes")
              }}
              className="flex flex-col items-start gap-2 rounded-lg border border-border-subtle bg-surface-overlay p-4 text-left transition-colors hover:bg-hover-bg"
            >
              <Clock size={20} className="text-muted-foreground" />
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {reviewDueCount}
                </p>
                <p className="text-2xs text-muted-foreground">Review Due</p>
              </div>
            </button>

            {/* Edited Today */}
            <button
              onClick={() => {
                setPendingFilters([{ field: "updatedAt", operator: "eq", value: today }])
                setActiveRoute("/notes")
              }}
              className="flex flex-col items-start gap-2 rounded-lg border border-border-subtle bg-surface-overlay p-4 text-left transition-colors hover:bg-hover-bg"
            >
              <PencilSimple size={20} className="text-muted-foreground" />
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {editedTodayCount}
                </p>
                <p className="text-2xs text-muted-foreground">Edited Today</p>
              </div>
            </button>
          </div>
        </section>

        {/* ── Section 2: Insights ── */}
        <section className="mb-8">
          <h2 className="text-note font-medium text-foreground">Insights</h2>
          <div className="mt-3 grid grid-cols-4 gap-3">
            <button
              onClick={() => setActiveRoute("/notes")}
              className="rounded-lg border border-border-subtle bg-surface-overlay p-4 text-left transition-colors hover:bg-hover-bg"
            >
              <FileText
                size={16}
                className="mb-2 text-muted-foreground"
              />
              <p className="text-2xl font-semibold text-foreground">
                {totalNotes}
              </p>
              <p className="text-2xs text-muted-foreground">Total Notes</p>
            </button>

            <button
              onClick={() => setActiveRoute("/wiki")}
              className="rounded-lg border border-border-subtle bg-surface-overlay p-4 text-left transition-colors hover:bg-hover-bg"
            >
              <Graph
                size={16}
                className="mb-2 text-muted-foreground"
              />
              <p className="text-2xl font-semibold text-foreground">
                {wikiArticles.length}
              </p>
              <p className="text-2xs text-muted-foreground">Wiki Articles</p>
            </button>

            <button
              onClick={() => setHomeSection("orphans")}
              className="rounded-lg border border-border-subtle bg-surface-overlay p-4 text-left transition-colors hover:bg-hover-bg"
            >
              <LinkBreak
                size={16}
                className="mb-2 text-muted-foreground"
              />
              <p className="text-2xl font-semibold text-foreground">
                {orphanCount}
              </p>
              <p className="text-2xs text-muted-foreground">Orphans</p>
            </button>

            <button
              onClick={() => setHomeSection("redlinks")}
              className="rounded-lg border border-border-subtle bg-surface-overlay p-4 text-left transition-colors hover:bg-hover-bg"
            >
              <FileText
                size={16}
                className="mb-2 text-muted-foreground"
              />
              <p className="text-2xl font-semibold text-foreground">
                {redLinkCount}
              </p>
              <p className="text-2xs text-muted-foreground">Unresolved Links</p>
            </button>
          </div>
        </section>

        {/* ── Section 3: Discover ── */}
        <section className="mb-8">
          <h2 className="text-note font-medium text-foreground">Discover</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              onClick={() => setHomeSection("unlinked")}
              className="flex items-start gap-3 rounded-lg border border-border-subtle bg-surface-overlay p-4 text-left transition-colors hover:border-border hover:bg-hover-bg"
            >
              <LinkBreak size={16} className="shrink-0 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-note font-medium text-foreground">Unlinked Mentions</p>
                <p className="text-2xs text-muted-foreground mt-0.5">Find notes that reference each other but aren't linked yet</p>
              </div>
            </button>
            <button
              onClick={() => setHomeSection("suggestions")}
              className="flex items-start gap-3 rounded-lg border border-border-subtle bg-surface-overlay p-4 text-left transition-colors hover:border-border hover:bg-hover-bg"
            >
              <Sparkle size={16} className="shrink-0 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-note font-medium text-foreground">Connection Suggestions</p>
                <p className="text-2xs text-muted-foreground mt-0.5">Discover potential relationships between your notes</p>
              </div>
            </button>
            <button
              onClick={() => setHomeSection("redlinks")}
              className="flex items-start gap-3 rounded-lg border border-border-subtle bg-surface-overlay p-4 text-left transition-colors hover:border-border hover:bg-hover-bg"
            >
              <FileText size={16} className="shrink-0 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-note font-medium text-foreground">Unresolved Links</p>
                <p className="text-2xs text-muted-foreground mt-0.5">Topics referenced but not yet created as notes</p>
              </div>
            </button>
            <button
              onClick={() => setHomeSection("orphans")}
              className="flex items-start gap-3 rounded-lg border border-border-subtle bg-surface-overlay p-4 text-left transition-colors hover:border-border hover:bg-hover-bg"
            >
              <Island size={16} className="shrink-0 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-note font-medium text-foreground">Orphan Notes</p>
                <p className="text-2xs text-muted-foreground mt-0.5">Notes with no incoming or outgoing links</p>
              </div>
            </button>
          </div>
        </section>

        {/* ── Section 4: Recent ── */}
        <section>
          <h2 className="text-note font-medium text-foreground">Recent</h2>
          <div className="mt-3 rounded-lg border border-border-subtle bg-surface-overlay">
            {recentNotes.length === 0 ? (
              <div className="p-4 text-note text-muted-foreground">
                No notes yet.
              </div>
            ) : (
              recentNotes.map((note, i) => (
                <button
                  key={note.id}
                  onClick={() => navigateToNote(note.id)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-hover-bg ${
                    i !== recentNotes.length - 1
                      ? "border-b border-border-subtle"
                      : ""
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <ClockCounterClockwise
                      size={14}
                      className="shrink-0 text-muted-foreground"
                    />
                    <span className="truncate text-note text-foreground">
                      {note.title || "Untitled"}
                    </span>
                  </span>
                  <span className="ml-3 shrink-0 text-2xs text-muted-foreground">
                    {relativeTime(note.updatedAt)}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
